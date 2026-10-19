# DevScribe — Modern Engineering Blog Platform
### FalconXoft Weekend 1 Assessment | Project 1 of 3 | Stack: Django + Next.js + PostgreSQL

DevScribe is a high-performance, production-ready publishing platform built for modern software engineering teams. It features a complete 3-tier Role-Based Access Control (RBAC) architecture (Visitors, Readers, Authors, and Admins), full-text search with PostgreSQL GIN indexing, split-pane Markdown editor with real-time preview, instant commenting engine, and administrative controls.

---

## 1. Technical Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Backend** | Python 3.12+ / Django 5.1 / Django REST Framework (DRF) | Robust ORM, built-in security, role validation, automatic migrations. |
| **Frontend** | Next.js 14 (App Router) / React 18 / Vanilla CSS | Fast SSR for SEO, responsive layout, fluid Editorial Latte theme. |
| **Database** | PostgreSQL 16 | Relational integrity, foreign key cascades, GIN index full-text search. |
| **Authentication**| JWT (SimpleJWT) with short-lived access and refresh tokens | Stateless authentication across independent frontend and API services. |
| **Containers** | Docker & Docker Compose | Multi-container reproducible runtime (`web`, `api`, `db`). |
| **Testing** | Pytest + pytest-django (34/34 tests, 100% pass) | High-speed automated coverage for RBAC and business logic. |
| **API Contract** | OpenAPI 3.0 via `drf-spectacular` (`openapi.yaml`) | Strict schema definition for API consumers. |

---

## 2. Features & Scope Breakdown

### In Scope (Implemented & Fully Functional)
- [x] **Authentication & Token Lifecycle:** User registration, login with JWT issuance, auto-refresh token interceptor, and logout.
- [x] **Three-Tier RBAC:** Default `reader` on signup, `author` creation privileges, and `admin` moderation powers.
- [x] **Post Management:** Create, update, soft-unpublish, and hard delete with slug collision handling (`title`, `title-1`).
- [x] **Editorial Workflow:** Draft vs. Published states with timestamp tracking (`published_at`).
- [x] **Category Management:** Admin-managed categories with author category assignment.
- [x] **Interactive Comments Engine:** Real-time commenting, owner edit/delete capabilities, and admin moderation removal.
- [x] **Discovery & Search:** PostgreSQL full-text search (`tsvector` & `tsquery`) and category pill filters.
- [x] **Author Studio Dashboard:** Private post management with live Markdown preview editor.
- [x] **Admin Control Panel:** User role promotion/demotion, account activation toggle, and category manager.

### Out of Scope (Known Gaps — Documented Honestly)
- **SMTP Email Verification & Password Reset:** Requires a third-party transactional mail service (e.g., SendGrid/AWS SES).
- **Cloud Object Storage (AWS S3):** Images currently utilize external image URLs or local avatars.
- **WYSIWYG Rich Text Editor:** A pure, fast Markdown parser is used to prevent XSS and keep database storage compact.
- **Social Features:** User likes, follower graphs, and notification streams are planned for Phase 2.

---

## 3. Architecture Overview

```
                      [ Client Browser ]
                              │
                    HTTPS (Port 80/443)
                              ▼
                   [ Nginx Reverse Proxy ]
                   ├── /api/*   ───────┐
                   └── /*              ▼
                         │     [ Django REST API ]
                         ▼     (Gunicorn :8000)
                 [ Next.js SSR ]       │
                 (Node.js :3000)       ▼
                               [ PostgreSQL 16 ]
                               (Port 5432 - Private)
```

The system strictly decouples the public access boundary from private internal networks. Only Nginx or Next.js public routes are exposed to the internet. Database and application runtimes communicate within a private Docker bridge network.

---

## 4. Setup & Running Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- PostgreSQL 16 or SQLite (for quick local development)

### Option A: Local Development Setup

#### 1. Backend Setup
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate  # On Windows (or source venv/bin/activate on macOS/Linux)
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser --email admin@example.com --username admin
python manage.py runserver 127.0.0.1:8000
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Option B: Docker Compose Setup
```bash
docker compose up --build
```
This orchestrates the PostgreSQL database, Django backend, and Next.js frontend in isolated containers.

---

## 5. Automated Testing

DevScribe comes with 34 automated unit and integration test cases covering positive, negative, boundary, and RBAC permission scenarios.

```bash
cd backend
.\venv\Scripts\python -m pytest -v
```
**Result:** `34 passed in ~50s (100% success rate)`

For complete step-by-step instructions on testing APIs, frontend journeys, and running the full manual walkthrough, see the [Complete Testing Guide](file:///d:/Muaz/Programming/FX%20internship/Weekend%20Assessments/Blog%20Platform/TESTING_GUIDE.md).

---

## 6. Seed / Demo Accounts

To test the role permissions easily, the following credentials can be used or recreated:

| Role | Username | Email | Password | Permissions |
|---|---|---|---|---|
| **Admin** | `siteadmin` | `admin@example.com` | `AdminPassword123!` | Full control: user roles, category CRUD, comment deletion. |
| **Author** | `author_jane` | `author@example.com` | `AuthorPassword123!` | Create, edit, draft, and publish own posts. |
| **Reader** | `reader_bob` | `reader@example.com` | `ReaderPassword123!` | Read posts, search, write, edit, and delete own comments. |

---

## 7. Submission Deliverables Index

All assessment deliverables required by the project plan are organized inside the `submission/01_Blog/` directory:

- [01-README.md](file:///d:/Muaz/Programming/FX%20internship/Weekend%20Assessments/Blog%20Platform/submission/01_Blog/01-README.md)
- [02-architecture.md](file:///d:/Muaz/Programming/FX%20internship/Weekend%20Assessments/Blog%20Platform/submission/01_Blog/02-architecture.md)
- [03-database-design.md](file:///d:/Muaz/Programming/FX%20internship/Weekend%20Assessments/Blog%20Platform/submission/01_Blog/03-database-design.md) & [schema.sql](file:///d:/Muaz/Programming/FX%20internship/Weekend%20Assessments/Blog%20Platform/submission/01_Blog/schema.sql)
- [04-api-workflows.md](file:///d:/Muaz/Programming/FX%20internship/Weekend%20Assessments/Blog%20Platform/submission/01_Blog/04-api-workflows.md) & [openapi.yaml](file:///d:/Muaz/Programming/FX%20internship/Weekend%20Assessments/Blog%20Platform/submission/01_Blog/openapi.yaml)
- [05-test-cases.xlsx](file:///d:/Muaz/Programming/FX%20internship/Weekend%20Assessments/Blog%20Platform/submission/01_Blog/05-test-cases.xlsx) & [05-test-cases.md](file:///d:/Muaz/Programming/FX%20internship/Weekend%20Assessments/Blog%20Platform/submission/01_Blog/05-test-cases.md)
- [06-engineering-decisions.md](file:///d:/Muaz/Programming/FX%20internship/Weekend%20Assessments/Blog%20Platform/submission/01_Blog/06-engineering-decisions.md)
- [07-source-and-demo-links.md](file:///d:/Muaz/Programming/FX%20internship/Weekend%20Assessments/Blog%20Platform/submission/01_Blog/07-source-and-demo-links.md)
- [08-cost-and-scaling.xlsx](file:///d:/Muaz/Programming/FX%20internship/Weekend%20Assessments/Blog%20Platform/submission/01_Blog/08-cost-and-scaling.xlsx) & [08-cost-and-scaling.md](file:///d:/Muaz/Programming/FX%20internship/Weekend%20Assessments/Blog%20Platform/submission/01_Blog/08-cost-and-scaling.md)
- [09-sources-and-disclosure.md](file:///d:/Muaz/Programming/FX%20internship/Weekend%20Assessments/Blog%20Platform/submission/01_Blog/09-sources-and-disclosure.md)
- [TESTING_GUIDE.md](file:///d:/Muaz/Programming/FX%20internship/Weekend%20Assessments/Blog%20Platform/TESTING_GUIDE.md)
