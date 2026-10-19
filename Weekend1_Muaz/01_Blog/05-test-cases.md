# DevScribe — Test Cases Matrix & Execution Evidence
### Deliverable 05 | FalconXoft Weekend 1 Assessment

This document contains the complete test matrix with **34 executed test cases** across all system layers.
The companion formatted spreadsheet is located at [05-test-cases.xlsx](file:///d:/Muaz/Programming/FX%20internship/Weekend%20Assessments/Blog%20Platform/submission/01_Blog/05-test-cases.xlsx).

All 34 automated tests executed via `pytest` pass with **100% green status** (`34 passed in 51.26s`).

---

## 1. Test Summary Dashboard

| Metric | Value |
|---|---|
| **Total Test Cases** | 34 |
| **Passed** | 34 (100%) |
| **Failed** | 0 |
| **Defects Identified** | 0 Open |
| **Test Automation Framework** | `pytest 9.1.1` + `pytest-django 4.14.0` |
| **Test Environment** | Python 3.12, Django 5.1, PostgreSQL 16 / SQLite In-Memory DB |

---

## 2. Comprehensive Test Cases Table

| Test ID | Feature | Category | Steps | Input | Expected Result | Actual Result | Status | Evidence Link |
|---|---|---|---|---|---|---|:---:|---|
| **TC-01** | Authentication | Positive | 1. POST `/api/v1/auth/register/`<br>2. Check response status | Valid registration payload | HTTP 201, default role `reader` | HTTP 201 Created, `reader` role assigned | `PASSED` | `apps/users/tests.py::test_tc01` |
| **TC-02** | Authentication | Positive | 1. POST `/api/v1/auth/login/`<br>2. Check JWT tokens | Registered email & password | HTTP 200, JWT access & refresh tokens | HTTP 200 OK, valid JWT pair returned | `PASSED` | `apps/users/tests.py::test_tc02` |
| **TC-03** | Authentication | Positive | 1. GET `/api/v1/auth/me/`<br>2. Check profile | Bearer Token in header | HTTP 200, user profile returned | HTTP 200 OK, matching email & role | `PASSED` | `apps/users/tests.py::test_tc03` |
| **TC-04** | Authentication | Negative | 1. POST duplicate email | Existing registered email | HTTP 400 Bad Request, duplicate error | HTTP 400 Bad Request, field error caught | `PASSED` | `apps/users/tests.py::test_tc04` |
| **TC-05** | Authentication | Negative | 1. POST mismatched password | `password != password_confirm` | HTTP 400 Bad Request | HTTP 400 Bad Request returned | `PASSED` | `apps/users/tests.py::test_tc05` |
| **TC-06** | Authentication | Negative | 1. POST incorrect password | Wrong password string | HTTP 401 Unauthorized | HTTP 401 Unauthorized returned | `PASSED` | `apps/users/tests.py::test_tc06` |
| **TC-07** | Authentication | Permissions | 1. GET `/auth/me/` without token | Missing Authorization header | HTTP 401 Unauthorized | HTTP 401 Unauthorized returned | `PASSED` | `apps/users/tests.py::test_tc07` |
| **TC-08** | RBAC | Permissions | 1. GET `/admin/users/` as Reader | Reader JWT Bearer Token | HTTP 403 Forbidden | HTTP 403 Forbidden returned | `PASSED` | `apps/users/tests.py::test_tc08` |
| **TC-09** | RBAC | Positive | 1. GET `/admin/users/` as Admin | Admin JWT Bearer Token | HTTP 200 OK, all users returned | HTTP 200 OK, user roster listed | `PASSED` | `apps/users/tests.py::test_tc09` |
| **TC-10** | RBAC | Positive | 1. Admin PATCH user role | `{"role": "author"}` | HTTP 200 OK, role updated | HTTP 200 OK, role promoted to author | `PASSED` | `apps/users/tests.py::test_tc10` |
| **TC-11** | RBAC | Permissions | 1. Reader PATCH user role | Reader token promoting user | HTTP 403 Forbidden | HTTP 403 Forbidden returned | `PASSED` | `apps/users/tests.py::test_tc11` |
| **TC-12** | Categories | Positive | 1. Admin POST `/categories/` | `{"name": "AI"}` | HTTP 201 Created, slug generated | HTTP 201 Created, slug `ai` created | `PASSED` | `apps/blog/tests.py::test_tc12` |
| **TC-13** | Categories | Permissions | 1. Author POST `/categories/` | Author JWT Token | HTTP 403 Forbidden | HTTP 403 Forbidden returned | `PASSED` | `apps/blog/tests.py::test_tc13` |
| **TC-14** | Post Management | Positive | 1. Author POST `/posts/` | Title, Markdown body, Category | HTTP 201, default status `draft` | HTTP 201 Created, slug auto-generated | `PASSED` | `apps/blog/tests.py::test_tc14` |
| **TC-15** | Post Management | Permissions | 1. Reader POST `/posts/` | Reader JWT Token | HTTP 403 Forbidden | HTTP 403 Forbidden returned | `PASSED` | `apps/blog/tests.py::test_tc15` |
| **TC-16** | Post Management | Collision | 1. Create two posts with identical title | Same title `Hello World` | First: `hello-world`, Second: `hello-world-1` | Unique slugs resolved cleanly | `PASSED` | `apps/blog/tests.py::test_tc16` |
| **TC-17** | Post Management | Positive | 1. Author POST `/publish/` | Draft post slug | HTTP 200, status `published`, timestamp set | HTTP 200 OK, published_at populated | `PASSED` | `apps/blog/tests.py::test_tc17` |
| **TC-18** | Post Management | Positive | 1. Author POST `/unpublish/` | Published post slug | HTTP 200, status `draft`, timestamp cleared | HTTP 200 OK, status reverted to draft | `PASSED` | `apps/blog/tests.py::test_tc18` |
| **TC-19** | Post Feed | Positive | 1. Visitor GET `/posts/` | Public anonymous request | Only `published` posts returned; drafts hidden | Drafts excluded from feed | `PASSED` | `apps/blog/tests.py::test_tc19` |
| **TC-20** | Post Feed | Security | 1. Visitor GET `/posts/{draft-slug}/` | Public request to draft slug | HTTP 404 Not Found (hiding existence) | HTTP 404 returned (no 403 leakage) | `PASSED` | `apps/blog/tests.py::test_tc20` |
| **TC-21** | Post Feed | Positive | 1. Author GET `/posts/{draft-slug}/` | Author token of post owner | HTTP 200 OK, draft content visible | HTTP 200 OK, preview works | `PASSED` | `apps/blog/tests.py::test_tc21` |
| **TC-22** | Search | Positive | 1. GET `/posts/?search=Architecture` | Search keyword matching body | HTTP 200 OK, matching post returned | PostgreSQL GIN index matches keyword | `PASSED` | `apps/blog/tests.py::test_tc22` |
| **TC-23** | Category Filter | Positive | 1. GET `/posts/?category=tech` | Valid category slug filter | HTTP 200 OK, only filtered posts returned | Matching category posts filtered | `PASSED` | `apps/blog/tests.py::test_tc23` |
| **TC-24** | Ownership | Permissions | 1. Author 2 PATCH Author 1 post | Malicious edit payload | HTTP 403 Forbidden | HTTP 403 Forbidden returned | `PASSED` | `apps/blog/tests.py::test_tc24` |
| **TC-25** | Ownership | Admin Override | 1. Admin PATCH Author 1 post | Admin override payload | HTTP 200 OK, post updated | HTTP 200 OK, admin update successful | `PASSED` | `apps/blog/tests.py::test_tc25` |
| **TC-26** | Author Studio | Positive | 1. Author GET `/me/posts/` | Author JWT Token | HTTP 200, returns drafts + published | HTTP 200 OK, all author posts returned | `PASSED` | `apps/blog/tests.py::test_tc26` |
| **TC-27** | Comments | Positive | 1. Reader POST comment on post | Valid body string | HTTP 201 Created, author metadata attached | HTTP 201 Created, comment stored | `PASSED` | `apps/comments/tests.py::test_tc27` |
| **TC-28** | Comments | Permissions | 1. Visitor POST comment | Anonymous request | HTTP 401 Unauthorized | HTTP 401 Unauthorized returned | `PASSED` | `apps/comments/tests.py::test_tc28` |
| **TC-29** | Comments | Boundary | 1. POST comment with whitespace | `{"body": "   "}` | HTTP 400 Bad Request | HTTP 400 Bad Request returned | `PASSED` | `apps/comments/tests.py::test_tc29` |
| **TC-30** | Comments | Positive | 1. Owner PATCH comment | Updated text body | HTTP 200 OK, comment body updated | HTTP 200 OK, text persisted | `PASSED` | `apps/comments/tests.py::test_tc30` |
| **TC-31** | Comments | Permissions | 1. Reader 2 PATCH Reader 1 comment | Non-owner token | HTTP 403 Forbidden | HTTP 403 Forbidden returned | `PASSED` | `apps/comments/tests.py::test_tc31` |
| **TC-32** | Comments | Positive | 1. Owner DELETE comment | Comment owner token | HTTP 200 OK, comment deleted | HTTP 200 OK, removed from database | `PASSED` | `apps/comments/tests.py::test_tc32` |
| **TC-33** | Comments | Admin Moderation | 1. Admin DELETE comment | Admin token on inappropriate comment | HTTP 200 OK, comment deleted | HTTP 200 OK, moderated successfully | `PASSED` | `apps/comments/tests.py::test_tc33` |
| **TC-34** | Data Integrity | Cascade Deletion | 1. DELETE post from database | Post with attached comments | All related comments deleted via CASCADE | Zero orphan comments remaining | `PASSED` | `apps/comments/tests.py::test_tc34` |
