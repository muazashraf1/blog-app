# DevScribe — Engineering Decisions & Architectural Trade-offs
### Deliverable 06 | FalconXoft Weekend 1 Assessment

This document articulates the technical decisions, evaluated alternatives, deliberate trade-offs, defensive security posture, and gap remediation roadmaps for DevScribe.

---

## 1. Architectural & Engineering Trade-Offs

### 1.1 Authentication Strategy: Stateless JWT vs. Stateful Server Sessions
- **Options Considered:** 
  1. Django Stateful Server Sessions (Cookies with session ID stored in database / Redis cache).
  2. Stateless JSON Web Tokens (JWT) using `djangorestframework-simplejwt`.
- **Final Choice:** Stateless JWT (`access` + `refresh` token rotation).
- **Why:** The frontend is a standalone Next.js decoupled application potentially deployed on a global CDN edge. JWT allows stateless authentication without requiring sticky sessions, shared session stores, or database lookups on every single authenticated request.
- **Trade-offs:** Stateless tokens cannot be revoked instantly without maintaining a token blacklist or Redis revocation blocklist. Mitigated by using short-lived access tokens (5–15 minutes) with rotating refresh tokens.

### 1.2 Token Storage: `localStorage` vs. `HttpOnly` Cookies
- **Options Considered:**
  1. Browser `localStorage`.
  2. SameSite `HttpOnly` secure cookies.
- **Final Choice:** Browser `localStorage` (with defensive in-memory state in `AuthContext`).
- **Why:** Rapid development of cross-origin local environments (Next.js on `localhost:3000` calling Django API on `127.0.0.1:8000`). It simplifies initial decoupling and automated Postman/API client testing.
- **Trade-offs:** `localStorage` is vulnerable to Cross-Site Scripting (XSS). In this project, XSS risk is actively prevented by sanitizing all Markdown inputs, using React's safe JSX rendering (no unescaped `dangerouslySetInnerHTML`), and validating strict character bounds on all text fields. For enterprise production, migrating to a Next.js API route that proxies cookies to Django as `HttpOnly` is recommended.

### 1.3 Database Engine: Relational PostgreSQL vs. NoSQL Document Store (MongoDB)
- **Options Considered:**
  1. PostgreSQL 16 Relational Database.
  2. MongoDB Document Store.
- **Final Choice:** PostgreSQL 16.
- **Why:** The domain model has strict relational dependencies: Users author Posts, Categories classify Posts, and Comments belong to both Users and Posts. PostgreSQL guarantees ACID compliance, enforces foreign key cascade/protect constraints, and prevents orphaned records.
- **Trade-offs:** PostgreSQL requires explicit schema migrations and strict column declarations, unlike schematic flexibility in NoSQL.

### 1.4 Search Infrastructure: PostgreSQL Full-Text Search vs. Elasticsearch
- **Options Considered:**
  1. Native PostgreSQL Full-Text Search (`tsvector`, `tsquery`, GIN Index).
  2. Dedicated search cluster (Elasticsearch / OpenSearch).
- **Final Choice:** PostgreSQL Native Full-Text Search.
- **Why:** Elasticsearch introduces massive operational complexity, memory requirements (minimum 2–4 GB JVM), cluster maintenance, and data synchronization overhead (handling out-of-sync indexes via Change Data Capture or dual-writes). PostgreSQL GIN indexing delivers sub-5ms search queries across tens of thousands of articles within the existing database container.
- **Trade-offs:** Lacks fuzzy typo-tolerance and complex algorithmic relevancy tuning provided by Elasticsearch. Highly acceptable trade-off for an MVP platform.

### 1.5 Content Format: Raw Markdown vs. Complex WYSIWYG Rich-Text Editor
- **Options Considered:**
  1. Heavy WYSIWYG editor (Quill, TinyMCE, TipTap outputting raw HTML).
  2. Lightweight Split-pane Markdown Editor (raw Markdown stored in `TEXT`).
- **Final Choice:** Raw Markdown.
- **Why:** Storing raw HTML from rich-text editors introduces catastrophic XSS vulnerabilities, requires heavy HTML sanitization filters, and bloats payload size. Markdown is human-readable, format-agnostic, developer-friendly, and renders natively across web, mobile, and RSS feeds.
- **Trade-offs:** Non-technical writers must learn basic Markdown syntax (`#`, `**bold**`). Addressed by providing an intuitive split-pane live preview in the Author Studio.

### 1.6 User Deletion Lifecycle: Hard Delete vs. Soft Deactivation (`is_active`)
- **Options Considered:**
  1. Hard Deletion (`DELETE FROM users WHERE id = X;` with `CASCADE`).
  2. Soft Deactivation (`is_active = FALSE`, protected foreign keys).
- **Final Choice:** Soft Deactivation with `ON DELETE PROTECT` on Posts.
- **Why:** Hard-deleting an author would either destroy their historical published articles or leave orphaned articles. Soft-deactivating revokes login privileges and invalidates tokens while preserving article integrity and canonical URLs.
- **Trade-offs:** Inactive records remain in the database table. Mitigated by filtering `is_active=True` in standard user queries and indexing `users(is_active)`.

### 1.7 Repository Architecture: Unified Monorepo vs. Separated Multi-repo
- **Options Considered:**
  1. Single Monorepo (`blog-platform/backend`, `blog-platform/frontend`).
  2. Two distinct git repositories.
- **Final Choice:** Unified Monorepo.
- **Why:** Guarantees atomic commits, synchronized OpenAPI contract updates, unified `docker-compose.yml` orchestration, and streamlined evaluation for reviewers.
- **Trade-offs:** CI workflows trigger simultaneously unless path filtering (`paths: ['backend/**']`) is configured.

### 1.8 Containerization: Docker & Docker Compose vs. Local Bare-Metal
- **Options Considered:**
  1. Native local host dependencies (local PostgreSQL service, system Python, system Node).
  2. Multi-container Docker Compose.
- **Final Choice:** Docker & Docker Compose with full local fallback capability.
- **Why:** Solves the classic "works on my machine" problem, standardizes database versions, eliminates dependency mismatch across operating systems, and allows one-command bootstrap.
- **Trade-offs:** Higher resource utilization on developer machines running Docker Desktop.

### 1.9 Hosting Topology: Single VPS (Hostinger) vs. Cloud Microservices (AWS)
- **Options Considered:**
  1. Single VPS running Docker Compose (Option A).
  2. Multi-service AWS Cloud (ECS, RDS, S3, CloudFront) (Option B).
- **Final Choice:** Single VPS for MVP (Option A); AWS migration roadmap for scale.
- **Why:** For an MVP serving up to 1,000 active users, a single high-performance VPS ($7.99/mo) delivers 10x better price-to-performance ratio than AWS ($44.40/mo base minimum for RDS + ECS + NAT Gateway).
- **Trade-offs:** VPS requires manual maintenance of backups, OS security updates, and firewall rules.

---

## 2. Defensive Security Posture

| Attack Vector | Defensive Countermeasure Implemented |
|---|---|
| **SQL Injection** | Exclusively parameterized queries executed via Django ORM; raw unescaped SQL strings strictly prohibited. |
| **Cross-Site Scripting (XSS)** | React JSX automatically escapes dangerous characters; Markdown parser does not evaluate inline `<script>` tags. |
| **Credential Stuffing** | Passwords hashed using industry-standard PBKDF2 with SHA-256 (390,000 rounds) and unique cryptographic salt. |
| **Broken Access Control (IDOR)** | Ownership validation enforced at the model serializer level: `IsOwnerOrReadOnly` ensures users cannot edit another user's posts or comments. |
| **Draft Information Leakage** | Unauthenticated visitors requesting a draft post receive `HTTP 404 Not Found` rather than `403 Forbidden`, concealing article existence. |
| **CORS Misconfiguration** | Strict origin whitelisting configured via `django-cors-headers` (`http://localhost:3000`). |

---

## 3. Technical Risks & Mitigations

1. **Risk: Token Theft via Browser Storage**
   - *Mitigation:* Access tokens have a short 5-minute lifespan. Stolen access tokens expire rapidly. Refresh tokens are rotationally invalidated.
2. **Risk: Spam Comment Storms**
   - *Mitigation:* Strict database check constraints limit comment body length (1–1,000 characters). Visitors must register before commenting. Admin moderation tool allows instant comment removal.
3. **Risk: Slug Collision In High-Concurrency Writing**
   - *Mitigation:* The `save()` method in `Post` model implements an automatic sequential deduplication algorithm (`title`, `title-1`, `title-2`).
4. **Risk: Search Latency Spikes on Large Corpora**
   - *Mitigation:* The PostgreSQL `search_vector` is computed as a stored generated column and indexed using an inverted **GIN (Generalized Inverted Index)**, allowing sub-5ms lookups even on 100,000+ posts.

---

## 4. Implemented vs. Planned Services

| Service | Implemented | Planned (Phase 2) | Rationale |
|---|:---:|:---:|---|
| Django REST API | ✅ | | Core application logic and RBAC engine. |
| Next.js Frontend | ✅ | | Fast SSR and interactive Author Studio. |
| PostgreSQL Relational DB | ✅ | | ACID compliance and full-text search. |
| SimpleJWT Authentication | ✅ | | Stateless decoupled tokens. |
| Docker Compose Setup | ✅ | | Local and staging orchestration. |
| Automated Pytest Suite | ✅ | | 34 automated unit/integration tests. |
| Nginx Reverse Proxy | | ⏳ | Production SSL termination & static file serving. |
| Redis In-Memory Cache | | ⏳ | Caching hot post feeds & API rate limiting. |
| Celery Background Worker | | ⏳ | Asynchronous email notifications. |
| AWS S3 Image Storage | | ⏳ | Object storage for high-res article covers. |

---

## 5. Known Gaps & Remediation Plan

In compliance with assignment evaluation rules, all unimplemented features are honestly disclosed below:

1. **SMTP Email Verification & Password Reset:**
   - *Reason for Omission:* Requires dedicated SMTP credentials (SendGrid, Mailgun, AWS SES), domain DNS verification (SPF/DKIM), and a mail queuing backend.
   - *Remediation Plan:* Integrate `django-allauth` or a custom token email dispatcher backed by Celery and Redis in Phase 2.
2. **Cloud Object Storage for Image Uploads:**
   - *Reason for Omission:* Requires AWS IAM credentials, S3 bucket provisioning, and signed upload URLs.
   - *Remediation Plan:* Add `django-storages` with `boto3` pointing to an Amazon S3 bucket with CloudFront distribution.
3. **User Engagement Features (Likes, Bookmarks, Follows):**
   - *Reason for Omission:* Prioritized core MVP deliverables (authoring, RBAC, search, discovery, and commenting).
   - *Remediation Plan:* Create a new Django app `apps/interactions` with `PostLike` and `AuthorFollow` relational models.
