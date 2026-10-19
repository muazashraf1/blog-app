# FalconXoft Weekend Assessment — Project 1: Blog Platform
## Comprehensive Master Blueprint & Execution Plan

---

## 1. Executive Summary & Assessment Criteria

This document outlines the end-to-end plan, architectural breakdown, technical specifications, database schema, API contracts, folder structure, testing matrices, and delivery checklists for the **Blog Platform** project.

### Evaluation Weights (Scoring Criteria)
* **Problem Understanding (20%):** Strict adherence to requirements, clear boundaries between in-scope and out-of-scope, clean assumptions.
* **Architecture & System Design (25%):** Correct relational model, indexing strategy, transaction handling, layered clean architecture, separation of public vs private zones.
* **Implementation (25%):** Clean Django REST Framework backend, Next.js frontend, secure JWT handling, role-based access control (RBAC), Docker containerization.
* **Testing (20%):** 30–40 test cases covering positive, negative, boundary, permissions, duplicate/retry, and data integrity scenarios with verifiable evidence.
* **Explanation & Ownership (10%):** Mastery during the Monday technical interview; ability to defend architectural trade-offs, explain failure modes, and perform live code tweaks.

---

## 2. Scope & Boundary Definitions

### In-Scope (MVP Deliverables)
1. **Authentication & RBAC:**
   - Registration with unique email, username, and strong password validation.
   - Login issuing short-lived JWT Access Token & long-lived Refresh Token (`djangorestframework-simplejwt`).
   - Token refresh mechanism.
   - Roles: `reader` (default on registration), `author`, `admin`.
   - Admin ability to promote/demote user roles and toggle `is_active` (soft deactivate).
2. **Post Management:**
   - Create post (defaults to `draft`), edit post, delete post.
   - Publish post (`draft` $\rightarrow$ `published`, sets `published_at = NOW()`) & Unpublish post (`published` $\rightarrow$ `draft`).
   - Auto-slug generation from title with conflict-resolution logic (`slug-1`, `slug-2`).
   - Markdown storage in PostgreSQL `TEXT`.
3. **Category Management:**
   - Admin-only CRUD for categories (name and slug unique).
   - Authors assign exactly one category per post.
4. **Commenting Engine:**
   - Authenticated readers/authors/admins can add comments (1–1000 characters).
   - Comment owner can edit/delete their own comment.
   - Admin can delete any inappropriate comment.
5. **Search & Filtering:**
   - PostgreSQL Full-Text Search using `to_tsvector` and `tsquery` over `title` and `body` with a **GIN Index**.
   - Category filtering (`?category=<slug>`).
   - Page-based pagination (`?page=1&page_size=10`).
6. **Containerization & CI/CD:**
   - `docker-compose.yml` orchestrating `db` (PostgreSQL), `backend` (Django), and `frontend` (Next.js).
   - GitHub Actions CI workflow running backend linting and pytest test suite.

### Out-of-Scope (Documented in README under "Known Gaps")
* Email verification and password reset via SMTP (requires dedicated mail service).
* Cloud object storage for images (AWS S3) — simple image URLs used instead.
* Complex rich-text WYSIWYG editor — clean Markdown parser utilized.
* Social features: Likes, follows, notifications, OAuth / social login.

---

## 3. End-to-End Golden User Journey

This exact flow will be verified during testing and presented in the 3–5 minute Loom demo video:
1. **User Registration:** Visitor visits `/register`, enters credentials, and registers. Default role assigned is `reader`.
2. **Admin Role Promotion:** Admin logs in, accesses `/admin` or sends `PATCH /api/v1/admin/users/{id}/` to promote user to `author`.
3. **Draft Post Creation:** The promoted author logs in, visits `/dashboard/posts/new`, creates a post in `draft` state linked to a category.
4. **Draft Editing & Publishing:** Author previews Markdown, edits content, and clicks **Publish**. Status changes to `published`, and `published_at` is set.
5. **Public Discovery:** Unauthenticated visitor opens the home page `/` and sees the published post in the feed.
6. **Full-Text Search:** Visitor searches for a distinct word present in the post body. PostgreSQL full-text search returns the post accurately.
7. **Reader Engagement:** A reader logs in, navigates to `/posts/{slug}`, and writes a comment. Comment appears immediately under the post.
8. **Admin Moderation:** Admin detects an offending comment and executes a delete operation (`DELETE /api/v1/comments/{id}/`). The comment is safely expunged.
9. **Permission Rejection (Failure Case):** A standard `reader` attempts to call `POST /api/v1/posts/`; the backend denies the request with HTTP `403 Forbidden`.

---

## 4. System Architecture & Topology

```
                      +---------------------------------------+
                      |               Browser                 |
                      +---------------------------------------+
                                          |
                              Port 80/443 | (HTTP / HTTPS)
                                          v
+ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
  PUBLIC ZONE                     Nginx (Reverse Proxy)                    
+ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
                                   /      \
               Route /api/ to Django        Route /* to Next.js
                                 /          \
+ - - - - - - - - - - - - - - - v - - - - - - v - - - - - - - - - - - - - +
  PRIVATE ZONE (Container Network - No direct public port binding)         
                                                                           
   +---------------------------+             +--------------------------+  
   |      Next.js Frontend     |             |      Django REST API     |  
   |   (SSR & Client Pages)    |---(REST)--->|  (Business Logic & Auth) |  
   +---------------------------+             +--------------------------+  
                                                           |               
                                                           | SQL (Port 5432)
                                                           v               
                                             +--------------------------+  
                                             |   PostgreSQL Database    |  
                                             | (GIN Index, Full-Text,   |  
                                             |  Relational Constraints) |  
                                             +--------------------------+  
+ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
```

### Component Status (Implemented vs. Proposed)
| Component | Status | Justification / Role |
| :--- | :--- | :--- |
| **Django REST API** | **Implemented** | Core business logic, RBAC enforcement, ORM, data validation |
| **PostgreSQL Database** | **Implemented** | Relational integrity, foreign keys, full-text search with GIN index |
| **Next.js Frontend** | **Implemented** | Responsive UI, SSR for SEO, client-side JWT management |
| **Docker Compose** | **Implemented** | Single-command local orchestration (`docker compose up`) |
| **GitHub Actions CI** | **Implemented** | Automated testing (`pytest`) on code push |
| **Nginx Reverse Proxy** | *Proposed / Staging* | SSL termination, single domain routing, static file caching |
| **Redis Cache** | *Proposed* | Caching homepage post feeds and API rate limiting |
| **Celery + Redis Worker** | *Proposed* | Asynchronous queue for transactional emails & webhook dispatch |
| **Sentry & Prometheus** | *Proposed* | Application observability, distributed tracing, error tracking |

---

## 5. Database Design & Relational Schema

### 5.1 Entities and Schema Definitions

#### Table: `users`
| Column | Type | Constraints / Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | `PRIMARY KEY` | Unique User ID |
| `email` | `VARCHAR(254)` | `UNIQUE, NOT NULL` | Login identifier |
| `username` | `VARCHAR(50)` | `UNIQUE, NOT NULL` | Public author handle |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | PBKDF2/Argon2 password hash |
| `role` | `VARCHAR(10)` | `NOT NULL, DEFAULT 'reader'` | `CHECK (role IN ('reader', 'author', 'admin'))` |
| `is_active` | `BOOLEAN` | `NOT NULL, DEFAULT TRUE` | Soft-deactivation toggle |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Account creation timestamp |

#### Table: `categories`
| Column | Type | Constraints / Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | `PRIMARY KEY` | Unique Category ID |
| `name` | `VARCHAR(80)` | `UNIQUE, NOT NULL` | Display name (e.g. "Software Architecture") |
| `slug` | `VARCHAR(100)`| `UNIQUE, NOT NULL` | URL-safe identifier (e.g. `software-architecture`) |

#### Table: `posts`
| Column | Type | Constraints / Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | `PRIMARY KEY` | Unique Post ID |
| `author_id` | `BIGINT` | `NOT NULL, REFERENCES users(id) ON DELETE PROTECT` | Author link (prevents accidental orphan data) |
| `category_id` | `BIGINT` | `NULL, REFERENCES categories(id) ON DELETE SET NULL` | Category link |
| `title` | `VARCHAR(200)`| `NOT NULL` | Post title |
| `slug` | `VARCHAR(220)`| `UNIQUE, NOT NULL` | URL slug |
| `body` | `TEXT` | `NOT NULL` | Markdown body content |
| `status` | `VARCHAR(10)` | `NOT NULL, DEFAULT 'draft'` | `CHECK (status IN ('draft', 'published'))` |
| `published_at` | `TIMESTAMPTZ` | `NULL` | Timestamp set when published |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Auto-updated on modification |
| `search_vector`| `TSVECTOR` | `GENERATED ALWAYS AS (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body, ''))) STORED` | PostgreSQL full-text search index vector |

#### Table: `comments`
| Column | Type | Constraints / Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | `PRIMARY KEY` | Unique Comment ID |
| `post_id` | `BIGINT` | `NOT NULL, REFERENCES posts(id) ON DELETE CASCADE` | Post reference (deleting post deletes comments) |
| `user_id` | `BIGINT` | `NOT NULL, REFERENCES users(id) ON DELETE CASCADE` | Author of the comment |
| `body` | `TEXT` | `NOT NULL, CHECK (length(body) BETWEEN 1 AND 1000)`| Comment text |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Timestamp |

### 5.2 Performance Indexes
1. `CREATE UNIQUE INDEX idx_posts_slug ON posts(slug);` $\rightarrow$ $O(1)$ post resolution.
2. `CREATE INDEX idx_posts_status_published_at ON posts(status, published_at DESC);` $\rightarrow$ High-speed home feed pagination.
3. `CREATE INDEX idx_posts_author_id ON posts(author_id);` $\rightarrow$ Fast author dashboard lookups.
4. `CREATE INDEX idx_posts_category_id ON posts(category_id);` $\rightarrow$ Fast category filtering.
5. `CREATE INDEX idx_posts_search_vector ON posts USING GIN(search_vector);` $\rightarrow$ Sub-millisecond full-text keyword searches without an external Elasticsearch engine.
6. `CREATE INDEX idx_comments_post_created ON comments(post_id, created_at ASC);` $\rightarrow$ Chronological comment streaming per post.

---

## 6. REST API Design & Contracts

Base URL: `/api/v1`  
Data Interchange: `application/json`  
Authentication: `Authorization: Bearer <access_token>`

### 6.1 Route Inventory

| Method | Endpoint | Auth Required | Permissions | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/register/` | Public | Anyone | Register new user (assigns `reader` role) |
| `POST` | `/auth/login/` | Public | Anyone | Authenticate with email/password, returns tokens |
| `POST` | `/auth/refresh/` | Public | Anyone | Exchange refresh token for new access token |
| `GET` | `/auth/me/` | Bearer Token | `IsAuthenticated` | Returns authenticated user's profile |
| `GET` | `/posts/` | Public | Anyone | List published posts (`?search=`, `?category=`, `?page=`) |
| `GET` | `/posts/{slug}/` | Public / Bearer | Anyone (published); Owner/Admin (draft) | Retrieve single post details |
| `POST` | `/posts/` | Bearer Token | `IsAuthorOrAdmin` | Create new post (starts as `draft`) |
| `PATCH` | `/posts/{slug}/` | Bearer Token | `IsPostOwnerOrAdmin` | Update post fields (title, body, category) |
| `DELETE`| `/posts/{slug}/` | Bearer Token | `IsPostOwnerOrAdmin` | Delete post |
| `POST` | `/posts/{slug}/publish/` | Bearer Token | `IsPostOwnerOrAdmin` | Transition post from `draft` to `published` |
| `POST` | `/posts/{slug}/unpublish/` | Bearer Token | `IsPostOwnerOrAdmin` | Transition post from `published` to `draft` |
| `GET` | `/me/posts/` | Bearer Token | `IsAuthorOrAdmin` | Get current author's posts (drafts + published) |
| `GET` | `/categories/` | Public | Anyone | List all categories |
| `POST` | `/categories/` | Bearer Token | `IsAdmin` | Create category |
| `PATCH` | `/categories/{id}/` | Bearer Token | `IsAdmin` | Update category name/slug |
| `DELETE`| `/categories/{id}/` | Bearer Token | `IsAdmin` | Remove category |
| `GET` | `/posts/{slug}/comments/` | Public | Anyone | List comments for a published post |
| `POST` | `/posts/{slug}/comments/` | Bearer Token | `IsAuthenticated` | Add a comment to a published post |
| `PATCH` | `/comments/{id}/` | Bearer Token | `IsCommentOwner` | Edit comment body |
| `DELETE`| `/comments/{id}/` | Bearer Token | `IsCommentOwnerOrAdmin` | Remove comment |
| `GET` | `/admin/users/` | Bearer Token | `IsAdmin` | List all users and their roles |
| `PATCH` | `/admin/users/{id}/` | Bearer Token | `IsAdmin` | Update user role (`reader`/`author`/`admin`) or `is_active` |

---

## 7. Frontend Information Architecture (Next.js)

### Screen & Page Flow
1. **`/` (Home Feed):**
   - Hero banner with quick topic filters.
   - Live search bar with instant debounce.
   - Grid of published articles featuring title, author avatar/handle, read time, category badge, publication date, and markdown excerpt.
   - Pagination controls.
2. **`/posts/[slug]` (Article View):**
   - Full rendered Markdown article with clean typography.
   - Author info card and category metadata.
   - Comments section:
     - Real-time comment submission box (for logged-in users).
     - Edit/Delete controls visible only on the user's own comments (and admin delete option).
3. **`/login` & `/register`:**
   - Responsive forms with client-side and server-side field validation.
   - Error toast notifications and redirect to intended route after authentication.
4. **`/dashboard` (Author & Admin Workspace):**
   - Tabbed overview: Published posts, Draft posts.
   - Quick action bar: "Create New Post", "View Live", "Edit", "Publish/Unpublish", "Delete".
5. **`/dashboard/posts/new` & `/dashboard/posts/[slug]/edit` (Post Studio):**
   - Title input with automatic slug preview.
   - Category dropdown selector.
   - Split-screen Markdown editor with instant live preview.
   - "Save as Draft" and "Publish Immediately" actions.
6. **`/admin` (Admin Control Center):**
   - User table: Change user roles (`reader` $\leftrightarrow$ `author`), activate/deactivate accounts.
   - Category management modal: Add, edit, or remove categories.
   - Global comment moderation log.

---

## 8. Step-by-Step Implementation Roadmap

```
[Phase 1: Environment & Orchestration]
  ├── Git repository initialization (.gitignore, .env.example)
  ├── Dockerfile (Backend Python 3.12, Frontend Node 20)
  └── docker-compose.yml (PostgreSQL + Django + Next.js)
         │
         v
[Phase 2: Django Backend Foundation]
  ├── Custom User Model (Role: reader, author, admin)
  ├── SimpleJWT setup with custom claims (username, role)
  ├── RBAC Permission Classes (IsAdmin, IsAuthorOrAdmin, IsOwnerOrAdmin)
  └── Auth Endpoints: /register/, /login/, /refresh/, /me/
         │
         v
[Phase 3: Core Domain Models & APIs]
  ├── Category Model & Admin Endpoints
  ├── Post Model, Slug auto-generation, Publish/Unpublish transactional views
  ├── PostgreSQL Full-Text Search with GIN Index
  └── Comment Model with cascaded post deletion & role-safe deletion
         │
         v
[Phase 4: drf-spectacular & OpenAPI Documentation]
  ├── Generate docs/api-spec/openapi.yaml
  ├── Swagger UI / Redoc endpoints setup
  └── Export schema.sql
         │
         v
[Phase 5: Next.js Frontend Development]
  ├── Design system with modern theme, responsive layout & typography
  ├── AuthContext / Token management (Secure storage, auto-refresh on 401)
  ├── Public Pages: Home feed, Search, Category filter, Post detail
  ├── Authenticated Pages: Post Studio (Markdown Editor + Preview), Dashboard
  └── Admin Panel: Role management & Category operations
         │
         v
[Phase 6: Testing & Quality Assurance]
  ├── pytest test suite (30-40 cases covering AC1 through AC9)
  ├── Execution of test cases and recording in 05-test-cases.xlsx
  └── Edge-case verification (400, 401, 403, 404, 409, 429)
         │
         v
[Phase 7: Assessment Documentation & Packaging]
  ├── 01-README.md
  ├── 02-architecture.pdf / Mermaid architectural representation
  ├── 03-database-design.pdf + schema.sql
  ├── 04-api-workflows.pdf + sequence diagrams
  ├── 06-engineering-decisions.md (Trade-offs & Rationale)
  ├── 07-source-and-demo-links.md
  ├── 08-cost-and-scaling.xlsx (100 -> 1M users VPS vs AWS)
  ├── 09-sources-and-disclosure.md (Open-source & AI disclosure)
  └── 3-5 Minute Video Recording Script Preparation
```

---

## 9. Required Submission Deliverables (Drive Folder Hierarchy)

```
Weekend1_Muaz/
├── submission-index.md                    # Root overview linking all 3 projects
└── 01_Blog/
    ├── 01-README.md                       # Comprehensive setup, run steps, demo accounts, known gaps
    ├── 02-architecture.pdf                # Component architecture, public/private zones, Lucidchart link
    ├── 03-database-design.pdf             # ERD diagram + schema.sql
    ├── 04-api-workflows.pdf              # Sequence diagrams + openapi.yaml
    ├── 05-test-cases.xlsx                 # 30-40 test cases with actual execution results & evidence
    ├── 06-engineering-decisions.md        # Options considered, Final choice, Why, Trade-offs
    ├── 07-source-and-demo-links.md        # Public GitHub repo URL + 3-5 min Loom video link
    ├── 08-cost-and-scaling.xlsx           # Cost model (VPS vs AWS) for 100, 1k, 10k, 1M users
    └── 09-sources-and-disclosure.md       # AI usage disclosure, libraries, starter templates
```

---

## 10. Monday Interview Preparation Cheat Sheet

Be prepared to answer these exact questions spontaneously without notes:

1. **Why Django + Next.js?**
   * *Answer:* Django delivers battle-tested ORM security, robust migration management, built-in RBAC capabilities, and SQL injection protections out of the box. Next.js delivers server-side rendering (SSR) for optimal SEO on public blog articles, static site generation capabilities, and modern reactive client-side rendering.
2. **Why JWT instead of Session Auth?**
   * *Answer:* Because the frontend (Next.js) and backend (Django) run as decoupled distributed services. JWT allows stateless authentication without requiring Django to query a central session cache on every single HTTP request. Refresh tokens are stored safely to mitigate token expiration.
3. **Where is the permission check for editing a post written?**
   * *Answer:* In `apps/blog/permissions.py` via a custom DRF permission class `IsAuthorAndOwnerOrAdmin`. In `has_object_permission`, it verifies `request.user.role == 'admin' or obj.author == request.user`.
4. **What happens if two users publish or comment at the same time?**
   * *Answer:* In PostgreSQL, comments are independent insert transactions managed by row-level locking. For post updates and publishing, we wrap the operation in `transaction.atomic()` with `select_for_update()` to prevent race conditions.
5. **Why this GIN index? What happens to search speed without it?**
   * *Answer:* A standard B-Tree index cannot effectively index words inside arbitrary body text, causing PostgreSQL to execute a full table scan ($O(N)$) using sequential reads and regex matching. A GIN (Generalized Inverted Index) on `to_tsvector` builds an inverted index of unique lexemes pointing to row IDs, reducing search queries to $O(\log N)$ sub-millisecond lookups.
6. **How does the slug stay unique?**
   * *Answer:* On post save, `django.utils.text.slugify` generates the base slug from the title. A collision check inspects the database; if `Post.objects.filter(slug=candidate).exists()`, an incremental counter (`candidate-1`, `candidate-2`) is appended until a unique slug is guaranteed before insertion.
7. **What would break first at 10,000 users?**
   * *Answer:* PostgreSQL database connection limits and CPU load from frequent un-cached reads of the home page feed. The immediate fix is placing Redis caching in front of `/api/v1/posts/` and using PgBouncer for database connection pooling.
