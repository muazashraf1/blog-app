# Blog Platform — Complete Backend Technical Guide
## FalconXoft Weekend Assessment | Stack: Django 5 + DRF + PostgreSQL + SimpleJWT

Yeh document aapke banaye gaye poore Backend ke internal architecture, har file ke maqsad, code ke flow, aur Monday ke interview questions ko aasan alfaz mein explain karta hai.

---

## 1. High-Level Flow (Request Aane Se Response Jane Tak)

```
[Client / Next.js / Postman]
             │
             │ HTTP Request (Headers: Authorization: Bearer <token>)
             ▼
      [config/urls.py]  (Main Traffic Router)
             │
   ┌─────────┼─────────────────────────┐
   ▼         ▼                         ▼
/api/v1/   /api/v1/                  /api/v1/
(users)    (blog)                    (comments)
   │         │                         │
   ▼         ▼                         ▼
[permissions.py] ──> Role check (Reader, Author, Admin)
   │                  Agar allow na ho to -> 403 Forbidden
   ▼
[views.py]       ──> Business Logic & Database query
   │
   ▼
[serializers.py] ──> Data validation (Input) & JSON serialization (Output)
   │
   ▼
[models.py]      ──> PostgreSQL / SQLite (Constraints, Indexes, Integrity)
```

---

## 2. Directory Structure & App Breakdown

```
backend/
├── config/
│   ├── settings.py          # Central config (JWT, CORS, DB, Apps, drf-spectacular)
│   ├── urls.py              # Root router: /admin/, /api/v1/, /api/schema/, /api/docs/
│   └── wsgi.py              # WSGI server entry point
├── apps/
│   ├── users/               # Custom User, Authentication, RBAC, Admin user management
│   ├── blog/                # Categories, Posts, Slug generator, Publish/Unpublish, Search
│   └── comments/            # Comments engine, Ownership checks, Admin moderation delete
├── docs/
│   ├── api-spec/openapi.yaml# OpenAPI 3 specification (Generated automatically)
│   └── schema.sql           # Production PostgreSQL DDL Schema
└── tests/ (or apps/*/tests.py) # 34 Automated test cases
```

---

## 3. Deep Dive: `apps/users` (Auth & RBAC)

### 3.1 `models.py` (Custom User Model)
* **Kyun banaya?** Django default mein `username` par login karwata hai. Assignment PDF ki requirement hai ke user **Email** se login kare aur uske 3 defined roles hon: `reader`, `author`, `admin`.
* **Fields:**
  * `email`: `VARCHAR(254)`, Unique, `USERNAME_FIELD` (Login identifier).
  * `username`: `VARCHAR(50)`, Unique (Public author handle).
  * `role`: `VARCHAR(10)`, Choices: `('reader', 'author', 'admin')`. **Default: `reader`**.
  * `is_active`: `BOOLEAN`, Default `True`. Soft-deactivate karne ke liye (delete karne se posts orphan nahi honge).
  * `password`: PBKDF2 algorithm se hashed form mein save hota hai.
* **Helper Properties:**
  * `user.is_reader` $\rightarrow$ Checks `role == 'reader'`
  * `user.is_author` $\rightarrow$ Checks `role == 'author'`
  * `user.is_admin` $\rightarrow$ Checks `role == 'admin'`

### 3.2 `permissions.py` (Role-Based Access Control)
DRF ki built-in `BasePermission` ko inherit kar ke 4 custom classes banayi hain:
1. **`IsAdminUserRole`**:
   - Check karta hai ke `request.user.role == 'admin'`.
   - Used in: User role promotion (`PATCH /admin/users/{id}/`) aur Category CRUD.
2. **`IsAuthorOrAdmin`**:
   - Check karta hai ke role `author` ya `admin` ho.
   - Reader agar post banane ki koshish kare to yeh check usay **`403 Forbidden`** throw karta hai.
3. **`IsPostOwnerOrAdmin`**:
   - Object-level permission (`has_object_permission`):
   - Agar post **Published** hai to koi bhi dekh sakta hai (`SAFE_METHODS`).
   - Agar post **Draft** hai to sirf uska owner ya admin dekh sakta hai (Doosre logon ko `404 Not Found` milta hai taake draft ka existence leak na ho).
   - Edit/Delete/Publish/Unpublish sirf post ka author ya admin kar sakta hai.
4. **`IsCommentOwnerOrAdmin`**:
   - Edit (PATCH) sirf wahi user kar sakta hai jis ne comment likha (`obj.user == request.user`).
   - Delete dono kar sakte hain: Comment ka creator OR Site Admin (Moderation ke liye).

### 3.3 `serializers.py` & Custom JWT Claims
* **`UserRegisterSerializer`**:
  * Email aur username ki uniqueness check karta hai.
  * `validate_password` Django ke built-in validators se check karta hai (min 8 chars, common password rejection).
  * Passwords match hone par naya user `role='reader'` ke sath create karta hai.
* **`CustomTokenObtainPairSerializer`**:
  * Normal JWT sirf `user_id` deta hai.
  * Hum ne JWT ke payload aur login response dono mein `email`, `username`, aur `role` embed kar diya hai.
  * **Faida:** Frontend (Next.js) ko user ka role janne ke liye bar bar `/auth/me/` request nahi bhejni parti.

### 3.4 `views.py` & `urls.py`
* `POST /api/v1/auth/register/` $\rightarrow$ Naya reader create hota hai (`201 Created`).
* `POST /api/v1/auth/login/` $\rightarrow$ Access Token (30 mins) + Refresh Token (7 days).
* `POST /api/v1/auth/refresh/` $\rightarrow$ Expired access token ko naye token se exchange karta hai.
* `GET /api/v1/auth/me/` $\rightarrow$ Current logged-in user ki profile.
* `GET /api/v1/admin/users/` $\rightarrow$ Admin sabhi registered users ki list dekhta hai.
* `PATCH /api/v1/admin/users/{id}/` $\rightarrow$ Admin kisi bhi reader ko `author` bana sakta hai ya block/deactivate kar sakta hai.

---

## 4. Deep Dive: `apps/blog` (Categories & Posts Engine)

### 4.1 `models.py` (Category & Post)
* **Category Model**:
  * `name`: Unique name (e.g. "Software Architecture").
  * `slug`: Auto-generated from name via `slugify` (e.g. `software-architecture`).
* **Post Model**:
  * `author`: Foreign Key to `users`, `on_delete=models.PROTECT`. (Author ko direct delete nahi kiya ja sakta jab tak uski posts exist karti hon — data safety).
  * `category`: Foreign Key to `categories`, `on_delete=models.SET_NULL`. (Category delete hone par post delete nahi hoti, sirf category null ho jati hai).
  * `status`: `draft` (default) ya `published`.
  * `published_at`: Jab author Publish dabata hai tab `timezone.now()` set hota hai. Unpublish karne par `None` ho jata hai.
  * **Unique Slug Collision Logic (`save()` method)**:
    ```python
    base_slug = slugify(self.title)
    unique_slug = base_slug
    counter = 1
    while Post.objects.filter(slug=unique_slug).exclude(pk=self.pk).exists():
        unique_slug = f"{base_slug}-{counter}"
        counter += 1
    ```
    *Agar title "Hello World" hai aur do authors yeh title dein to pehle ko `hello-world` aur doosre ko automatically `hello-world-1` milta hai.*
  * **Database Indexes**:
    * `idx_posts_status_published` on `(status, published_at DESC)`: Home page par lakhon posts mein se latest published posts sub-millisecond mein load hoti hain.
    * `idx_posts_slug` on `slug`: URL routing instant hoti hai.

### 4.2 Views & Workflow
1. **Public Home Feed (`GET /api/v1/posts/`)**:
   * Sirf `status='published'` wali posts return karta hai (Draft posts kabhi public feed mein nahi aateen).
   * **Category Filter**: `?category=technology`
   * **Full-Text Search**: `?search=django` $\rightarrow$ Title aur Markdown Body dono mein search karta hai.
   * **Pagination**: 10 posts per page.
2. **Draft vs Published Protection (`GET /api/v1/posts/{slug}/`)**:
   * Agar post `draft` hai aur request karne wala author ya admin nahi hai, to backend `403` ki bajaye **`404 Not Found`** return karta hai taake bahar wale ko pata hi na chale ke aisi draft post exist karti hai.
3. **Explicit State Transitions**:
   * `POST /api/v1/posts/{slug}/publish/`: Post ko live karta hai aur `published_at` timestamp lock karta hai.
   * `POST /api/v1/posts/{slug}/unpublish/`: Post ko wapis private draft bana deta hai.
4. **Author Workspace (`GET /api/v1/me/posts/`)**:
   * Author ko uske apne sare posts (drafts aur published dono) show karta hai.

---

## 5. Deep Dive: `apps/comments` (Commenting Engine)

### 5.1 `models.py`
* `post`: Foreign Key to `Post`, `on_delete=models.CASCADE`. (Agar post delete ho to uske sare comments automatically delete ho jate hain).
* `user`: Foreign Key to `User`, `on_delete=models.CASCADE`.
* `body`: `TEXT`, `MinLengthValidator(1)` aur `MaxLengthValidator(1000)`.
* `Index`: `idx_comments_post_created` on `(post, created_at)`. Post kholte hi comments chronological order mein ultra-fast fetch hote hain.

### 5.2 Comments Workflow & Permissions
* `GET /api/v1/posts/{slug}/comments/` $\rightarrow$ Public (kisi bhi post ke comments dekhna).
* `POST /api/v1/posts/{slug}/comments/` $\rightarrow$ Logged-in reader, author, ya admin comment post kar sakta hai. Visitor karega to `401 Unauthorized` aayega.
* `PATCH /api/v1/comments/{id}/` $\rightarrow$ Sirf comment ka creator edit kar sakta hai. Doosra koi karega to `403 Forbidden`.
* `DELETE /api/v1/comments/{id}/` $\rightarrow$ Comment owner delete kar sakta hai, AUR **Admin** kisi bhi inappropriate comment ko delete kar sakta hai (PDF Journey Step 8).

---

## 6. Testing Strategy & Audit (34 Test Cases)

Hamaare test suite mein **34 tests** hain jo `pytest` ke zariye chalte hain:

| Category | Test Count | Key Scenarios Tested |
| :--- | :--- | :--- |
| **Users & Auth** | 11 Tests | Registration, duplicate email rejection (400), weak password rejection, login JWT tokens, `/auth/me/`, Admin user listing, Reader access rejection (403), Admin role promotion (Reader $\rightarrow$ Author). |
| **Blog & Categories** | 15 Tests | Admin creates category, Author blocked from category creation (403), Author creates draft, Reader blocked from creating post (403), Slug uniqueness collision resolution, Publish/Unpublish workflow, Public feed hides drafts, 404 on unauth draft access, Full-text keyword search, Category filter, Author blocked from editing another's post (403), Admin can edit any post, `/me/posts/` list. |
| **Comments** | 8 Tests | Reader adds comment (201), Visitor blocked from commenting (401), Empty comment rejected (400), Owner edits comment, Non-owner blocked from editing (403), Owner deletes comment, Admin deletes any comment (Moderation), Post deletion cascades to comments. |

---

## 7. Monday Interview Top Questions & Answers (Cheat Sheet)

Examiner ke potential questions ke direct answers:

* **Q1: Architecture mein Django aur Next.js ko kyu chuna?**
  * *Jawab:* Django enterprise-grade ORM, built-in security (SQL injection protection, password hashing), aur automated migrations deta hai. Next.js server-side rendering (SSR) provide karta hai jo blog posts ki SEO aur public discovery ke liye zaroori hai.
* **Q2: Session authentication ki bajaye JWT kyu use kiya?**
  * *Jawab:* Django aur Next.js decoupled services hain jo alag ports/containers par chalti hain. JWT stateless authentication provide karta hai, jis se backend ko har request par database session lookup nahi karna padta.
* **Q3: Post edit karne ki permission kahan check hoti hai?**
  * *Jawab:* `apps/users/permissions.py` ke andar `IsPostOwnerOrAdmin` class ke `has_object_permission()` method mein. Check hota hai: `obj.author == request.user or request.user.role == 'admin'`.
* **Q4: Slug collision kaise prevent hoti hai agar do posts ka title same ho?**
  * *Jawab:* `apps/blog/models.py` ke `save()` method mein hum database check karte hain: agar `slug` pehle se exist karta ho to while loop counter lagata hai (`title-1`, `title-2`).
* **Q5: Draft post ko unauthorized user se kaise hide karte hain?**
  * *Jawab:* `PostDetailView` ke `get_object()` method mein agar post `status == 'draft'` ho aur user uska author ya admin na ho, to hum `403` ki bajaye `404 Not Found` throw karte hain taake draft ka existence leak na ho.
