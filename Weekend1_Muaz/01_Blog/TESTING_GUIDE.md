# Complete Testing Guide: DevScribe Blog Platform
## FalconXoft Weekend 1 Assessment — Project 1

This comprehensive testing manual provides step-by-step procedures to test every component of the **DevScribe Blog Platform**, including:
1. **Automated Backend Pytest Execution** (All 34 test cases, 100% pass)
2. **Backend API Testing Guide** (cURL / Postman commands for all endpoints)
3. **Frontend Main End-to-End User Journey** (Live walkthrough of the 8-step journey)
4. **Role-Based Access Control (RBAC) & Failure Tests** (Verifying 401, 403, 404, 400 error codes)
5. **Loom Demo Video Recording Script** (3 to 5 minutes ready-to-record walkthrough)

---

## 1. Quick Environment Verification

Ensure both backend and frontend servers are running:

### Terminal 1: Backend (Django REST Framework)
```bash
cd "d:/Muaz/Programming/FX internship/Weekend Assessments/Blog Platform/backend"
.\venv\Scripts\python manage.py runserver 127.0.0.1:8000
```
- **API Base URL:** `http://127.0.0.1:8000/api/v1`
- **Django Admin:** `http://127.0.0.1:8000/admin/`

### Terminal 2: Frontend (Next.js)
```bash
cd "d:/Muaz/Programming/FX internship/Weekend Assessments/Blog Platform/frontend"
npm run dev
```
- **Web App URL:** `http://localhost:3000`

---

## 2. Automated Backend Testing (Pytest Suite)

The automated test suite contains **34 comprehensive unit and integration tests** covering the 9 Acceptance Criteria (AC1 to AC9) defined in the project plan.

### Run All 34 Tests
```bash
cd "d:/Muaz/Programming/FX internship/Weekend Assessments/Blog Platform/backend"
.\venv\Scripts\python -m pytest -v
```

### Expected Output
```text
apps/blog/tests.py::TestBlogPostsAndCategories::test_tc12_admin_can_create_category PASSED      [  2%]
apps/blog/tests.py::TestBlogPostsAndCategories::test_tc13_non_admin_cannot_create_category PASSED  [  5%]
apps/blog/tests.py::TestBlogPostsAndCategories::test_tc14_author_creates_draft_post PASSED       [  8%]
apps/blog/tests.py::TestBlogPostsAndCategories::test_tc15_reader_cannot_create_post PASSED       [ 11%]
apps/blog/tests.py::TestBlogPostsAndCategories::test_tc16_post_slug_collision_resolution PASSED [ 14%]
apps/blog/tests.py::TestBlogPostsAndCategories::test_tc17_author_publishes_draft_post PASSED     [ 17%]
apps/blog/tests.py::TestBlogPostsAndCategories::test_tc18_author_unpublishes_post PASSED         [ 20%]
apps/blog/tests.py::TestBlogPostsAndCategories::test_tc19_visitor_sees_published_posts_only PASSED [ 23%]
apps/blog/tests.py::TestBlogPostsAndCategories::test_tc20_visitor_draft_access_returns_404 PASSED [ 26%]
apps/blog/tests.py::TestBlogPostsAndCategories::test_tc21_author_can_view_own_draft PASSED       [ 29%]
apps/blog/tests.py::TestBlogPostsAndCategories::test_tc22_search_posts_by_keyword PASSED         [ 32%]
apps/blog/tests.py::TestBlogPostsAndCategories::test_tc23_filter_posts_by_category PASSED       [ 35%]
apps/blog/tests.py::TestBlogPostsAndCategories::test_tc24_author_cannot_edit_other_authors_post PASSED [ 38%]
apps/blog/tests.py::TestBlogPostsAndCategories::test_tc25_admin_can_edit_any_post PASSED        [ 41%]
apps/blog/tests.py::TestBlogPostsAndCategories::test_tc26_my_posts_returns_all_statuses PASSED  [ 44%]
apps/comments/tests.py::TestCommentsEngine::test_tc27_reader_can_add_comment PASSED             [ 47%]
apps/comments/tests.py::TestCommentsEngine::test_tc28_visitor_cannot_comment PASSED              [ 50%]
apps/comments/tests.py::TestCommentsEngine::test_tc29_comment_empty_body_fails PASSED            [ 52%]
apps/comments/tests.py::TestCommentsEngine::test_tc30_owner_can_edit_comment PASSED             [ 55%]
apps/comments/tests.py::TestCommentsEngine::test_tc31_non_owner_cannot_edit_comment PASSED      [ 58%]
apps/comments/tests.py::TestCommentsEngine::test_tc32_owner_can_delete_own_comment PASSED       [ 61%]
apps/comments/tests.py::TestCommentsEngine::test_tc33_admin_can_delete_inappropriate_comment PASSED [ 64%]
apps/comments/tests.py::TestCommentsEngine::test_tc34_delete_post_cascades_comments PASSED     [ 67%]
apps/users/tests.py::TestAuthenticationAndRoles::test_tc01_user_registration_success PASSED     [ 70%]
apps/users/tests.py::TestAuthenticationAndRoles::test_tc02_user_login_success PASSED            [ 73%]
apps/users/tests.py::TestAuthenticationAndRoles::test_tc03_get_current_user_profile PASSED     [ 76%]
apps/users/tests.py::TestAuthenticationAndRoles::test_tc04_register_duplicate_email_fails PASSED [ 79%]
apps/users/tests.py::TestAuthenticationAndRoles::test_tc05_register_password_mismatch_fails PASSED [ 82%]
apps/users/tests.py::TestAuthenticationAndRoles::test_tc06_login_wrong_password_fails PASSED     [ 85%]
apps/users/tests.py::TestAuthenticationAndRoles::test_tc07_unauthenticated_cannot_access_profile PASSED [ 88%]
apps/users/tests.py::TestAuthenticationAndRoles::test_tc08_reader_cannot_access_admin_users_list PASSED [ 91%]
apps/users/tests.py::TestAuthenticationAndRoles::test_tc09_admin_can_access_users_list PASSED   [ 94%]
apps/users/tests.py::TestAuthenticationAndRoles::test_tc10_admin_promotes_reader_to_author PASSED [ 97%]
apps/users/tests.py::TestAuthenticationAndRoles::test_tc11_non_admin_cannot_promote_role PASSED [100%]

============================= 34 passed in 51.26s =============================
```

### Run Tests Per App
- **Users & Auth:** `.\venv\Scripts\python -m pytest apps/users/tests.py -v`
- **Posts & Categories:** `.\venv\Scripts\python -m pytest apps/blog/tests.py -v`
- **Comments Engine:** `.\venv\Scripts\python -m pytest apps/comments/tests.py -v`

---

## 3. Backend API Test Guide (cURL / Postman)

You can execute these cURL commands directly in PowerShell or import the OpenAPI spec at `docs/api-spec/openapi.yaml` into Postman / Insomnia.

### Step 1: Register New User (Default Role: Reader)
```bash
curl -X POST http://127.0.0.1:8000/api/v1/auth/register/ `
  -H "Content-Type: application/json" `
  -d '{"email": "hamza@example.com", "username": "hamza", "password": "Password123!", "password_confirm": "Password123!"}'
```
*Expected:* `201 Created` with `"role": "reader"`.

### Step 2: Login and Obtain JWT Tokens
```bash
curl -X POST http://127.0.0.1:8000/api/v1/auth/login/ `
  -H "Content-Type: application/json" `
  -d '{"email": "admin@example.com", "password": "AdminPassword123!"}'
```
*Expected:* `200 OK` containing `"access"` and `"refresh"` tokens.

> Store token in environment variable:
> `$TOKEN = "<paste-access-token-here>"`

### Step 3: Admin Promotes User to Author
```bash
curl -X PATCH http://127.0.0.1:8000/api/v1/admin/users/2/ `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"role": "author"}'
```
*Expected:* `200 OK`, user's role updated to `"author"`.

### Step 4: Admin Creates a Category
```bash
curl -X POST http://127.0.0.1:8000/api/v1/categories/ `
  -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"name": "Artificial Intelligence"}'
```
*Expected:* `201 Created`, slug `"artificial-intelligence"`.

### Step 5: Author Creates a Draft Post
*(Using author token)*
```bash
curl -X POST http://127.0.0.1:8000/api/v1/posts/ `
  -H "Authorization: Bearer $AUTHOR_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"title": "Deep Dive into Next.js 14", "body": "Markdown text goes here.", "category_id": 1}'
```
*Expected:* `201 Created`, `"status": "draft"`, `"slug": "deep-dive-into-nextjs-14"`.

### Step 6: Author Publishes the Draft Post
```bash
curl -X POST http://127.0.0.1:8000/api/v1/posts/deep-dive-into-nextjs-14/publish/ `
  -H "Authorization: Bearer $AUTHOR_TOKEN"
```
*Expected:* `200 OK`, `"status": "published"`, `"published_at"` timestamp set.

### Step 7: Public Visitor Searches Posts
```bash
curl -X GET "http://127.0.0.1:8000/api/v1/posts/?search=Next.js"
```
*Expected:* `200 OK`, returns published post in `"results"`.

### Step 8: Logged-in Reader Adds a Comment
```bash
curl -X POST http://127.0.0.1:8000/api/v1/posts/deep-dive-into-nextjs-14/comments/ `
  -H "Authorization: Bearer $READER_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"body": "Brilliant explanation of Server Components!"}'
```
*Expected:* `201 Created` with comment id and user metadata.

### Step 9: Admin Moderates / Deletes Inappropriate Comment
```bash
curl -X DELETE http://127.0.0.1:8000/api/v1/comments/1/ `
  -H "Authorization: Bearer $ADMIN_TOKEN"
```
*Expected:* `200 OK`, `{"message": "Comment deleted successfully."}`.

---

## 4. Frontend Main End-to-End User Journey (UI Walkthrough)

Open your browser at `http://localhost:3000` and follow the exact 8-step journey required by Section 2.5 of the assignment plan:

### Step 1: Visitor Registration
1. Navigate to `http://localhost:3000/register`.
2. Fill in:
   - **Username:** `ali_author`
   - **Email:** `ali@example.com`
   - **Password:** `StrongPass123!`
   - **Confirm Password:** `StrongPass123!`
3. Click **"Create Account"**.
4. You are automatically logged in and redirected to Home. The navbar displays `ali_author` with a `reader` badge.

### Step 2: Admin Promotes User to Author
1. Log out, then log in as Admin (`admin@example.com` / `AdminPassword123!`).
2. Click **"Admin"** in the top navigation bar (`/admin`).
3. In the **User Management** table, locate `ali_author`.
4. Click the **"Promote to Author"** button.
5. The badge immediately updates to `author` with a success toast notification.

### Step 3: Author Creates Draft Post
1. Log out, then log back in as `ali@example.com`.
2. Notice the **"Dashboard"** button is now visible in the navbar.
3. Click **"Dashboard"** $\rightarrow$ Click **"New Story"** (`/dashboard/posts/new`).
4. Enter:
   - **Title:** `Mastering Modern Web Architecture with Django & Next.js`
   - **Category:** Select `Engineering` or `Technology`
   - **Content:** Write markdown text:
     ```markdown
     # Welcome to Fullstack Mastery
     In this article, we explore clean architectural boundaries.
     - Django REST API
     - Next.js SSR
     - PostgreSQL with Full-Text Search
     ```
5. Click **"Save Draft"**.
6. The editor saves and redirects to `/dashboard`, where the post appears with a `draft` badge.

### Step 4: Author Publishes Post
1. On the dashboard card, click **"Edit"** or click the **"Publish"** quick action.
2. The post status transitions to `published`, and the card badge changes to green `published`.

### Step 5: Public Visitor Reads Post
1. Log out or open an Incognito window at `http://localhost:3000/`.
2. The new post appears prominently in the **Latest Dispatches** feed with category badge and read time.
3. Click on the post card to open the Post Detail Page (`/posts/mastering-modern-web-architecture-with-django-nextjs`).
4. Verify markdown renders clean headings, lists, and code styling.

### Step 6: Search & Category Filter
1. Return to `http://localhost:3000/`.
2. Type `Mastering` into the live search bar.
3. The feed filters in real-time to show only matching posts.
4. Click category pills (e.g., `Engineering` or `All`) to test category filtering.

### Step 7: Reader Adds & Edits a Comment
1. Log in as a reader (`reader@example.com` or register another account).
2. Open the published post.
3. Scroll down to the **Discussion** section.
4. Type in the box: `Exceptional guide! Really helped me understand RBAC.` and click **"Post Comment"**.
5. The comment appears instantly with your username and timestamp.
6. Click **"Edit"** on your own comment, change the text to `Exceptional guide! Really helped me understand RBAC and Next.js.`, and click **"Save"**.
7. The comment updates in-place.

### Step 8: Admin Deletes Inappropriate Comment
1. Log in as Admin (`admin@example.com`).
2. Open the same post.
3. In the Discussion section, notice the red **"Delete (Admin)"** badge appears on all users' comments.
4. Click the delete button and confirm the modal prompt.
5. The comment disappears immediately from the page.

---

## 5. Security & Permission Edge Cases Checklist

Verify the backend and frontend properly reject illegal actions:

| Test Scenario | Action | Expected Result | HTTP Code |
|---------------|--------|-----------------|-----------|
| **Reader creates post** | Reader visits `/dashboard/posts/new` or calls `POST /api/v1/posts/` | Route Guard redirects / DRF returns permission denied | `403 Forbidden` |
| **Author edits another's post** | Author 2 sends `PATCH /api/v1/posts/{author1-slug}/` | Backend rejects modification | `403 Forbidden` |
| **Visitor accesses draft post** | Visitor enters direct URL `/posts/{draft-slug}` | Page displays 404 Not Found (Hiding draft existence) | `404 Not Found` |
| **Reader accesses admin panel** | Reader navigates to `/admin` | ProtectedRoute redirects to `/dashboard` with warning | `403 Forbidden` |
| **Unauthenticated comment** | Visitor attempts to submit comment | Disabled with "Please login to comment" banner | `401 Unauthorized` |
| **Duplicate email registration** | Registering with existing email | Form displays "A user with this email already exists" | `400 Bad Request` |
| **Non-owner edits comment** | User 2 calls `PATCH /api/v1/comments/{user1-id}/` | Action blocked | `403 Forbidden` |

---

## 6. Loom Demo Video Script (3 to 5 Minutes)

Use this exact timing breakdown when recording your Monday presentation:

* **00:00 – 00:20 (20 sec): Project Intro & Tech Stack**
  - "Hello! DevScribe is a high-performance publishing platform built with Django REST Framework, Next.js 14, and PostgreSQL 16. It implements a complete 3-tier Role-Based Access Control system: Readers, Authors, and Admins."
* **00:20 – 01:00 (40 sec): Architecture & Database Schema**
  - Show the architecture diagram (`02-architecture.md`) and database ERD (`03-database-design.md`).
  - Explain: "We separate public traffic (Next.js & Nginx) from private services (Django API & PostgreSQL). The database uses GIN indexes on tsvector for full-text search, and cascades comments on post deletion."
* **01:00 – 03:00 (2 min): Main User Journey (Live Demo)**
  - Register a new reader.
  - Switch to Admin window, promote user to Author.
  - Log in as Author, create draft in Author Studio, preview split Markdown editor, and click Publish.
  - Open incognito window as visitor: demonstrate homepage search bar finding the article by keyword.
  - Log in as reader: leave a comment.
  - Switch to Admin: demonstrate administrative comment moderation delete.
* **03:00 – 03:40 (40 sec): Security & Failure Path**
  - Show a Reader attempting to POST to `/api/v1/posts/` or access `/admin`, receiving a clean `403 Forbidden`.
  - Explain token handling: short-lived access token with automatic refresh interceptor.
* **03:40 – 04:10 (30 sec): Automated Testing & Pytest Output**
  - Open terminal and run `.\venv\Scripts\python -m pytest -v`.
  - Show all 34 tests passing cleanly across Auth, Blog, and Comments.
* **04:10 – 04:30 (20 sec): Known Gaps & Next Steps**
  - State honestly: "Out-of-scope items like SMTP email verification and S3 image uploads are documented in the README under Known Gaps and slated for Phase 2."
