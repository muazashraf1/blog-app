# FalconXoft Weekend 1 Assessment — Master Submission Index
### Candidate: Muaz | Submission Archive

This root index outlines the completion status, folder structure, and access locations for the Weekend 1 Assessment deliverables according to the official project specifications.

---

## 1. Project 1: DevScribe Blog Platform

- **Status:** **100% Complete & Production-Verified**
- **Tech Stack:** Django 5.1 REST Framework + Next.js 14 App Router + PostgreSQL 16 + SimpleJWT + Docker
- **Test Results:** 34 / 34 Automated Tests Passing (`pytest`) — 100% Pass Rate
- **Primary Deliverables Directory:** [`submission/01_Blog/`](file:///d:/Muaz/Programming/FX%20internship/Weekend%20Assessments/Blog%20Platform/submission/01_Blog/)

---

## 2. Deliverables Checklist & Verification Matrix

| # | Required Deliverable | Format | Location | Status | Description |
|---|---|---|---|:---:|---|
| **1** | **README** | Markdown | [`01_Blog/01-README.md`](file:///d:/Muaz/Programming/FX%20internship/Weekend%20Assessments/Blog%20Platform/submission/01_Blog/01-README.md) & [`README.md`](file:///d:/Muaz/Programming/FX%20internship/Weekend%20Assessments/Blog%20Platform/README.md) | ✅ Complete | Complete project overview, architecture diagram, setup steps, test instructions, and demo credentials. |
| **2** | **Architecture & System Design** | PDF + Markdown | [`01_Blog/02-architecture.pdf`](file:///d:/Muaz/Programming/FX%20internship/Weekend%20Assessments/Blog%20Platform/submission/01_Blog/02-architecture.pdf) & [`01_Blog/02-architecture.md`](file:///d:/Muaz/Programming/FX%20internship/Weekend%20Assessments/Blog%20Platform/submission/01_Blog/02-architecture.md) | ✅ Complete | Complete component decomposition, public vs. private security boundaries, data movement flow, and implemented vs. proposed matrix. |
| **3** | **Database Design & ERD** | PDF + SQL + Markdown | [`01_Blog/03-database-design.pdf`](file:///d:/Muaz/Programming/FX%20internship/Weekend%20Assessments/Blog%20Platform/submission/01_Blog/03-database-design.pdf), [`01_Blog/schema.sql`](file:///d:/Muaz/Programming/FX%20internship/Weekend%20Assessments/Blog%20Platform/submission/01_Blog/schema.sql) & [`.md`](file:///d:/Muaz/Programming/FX%20internship/Weekend%20Assessments/Blog%20Platform/submission/01_Blog/03-database-design.md) | ✅ Complete | Full ERD, relational table schemas, foreign key cascade/protect rules, and indexing strategy (GIN full-text search). |
| **4** | **API Specification & Workflows** | PDF + OpenAPI 3.0 + Markdown | [`01_Blog/04-api-workflows.pdf`](file:///d:/Muaz/Programming/FX%20internship/Weekend%20Assessments/Blog%20Platform/submission/01_Blog/04-api-workflows.pdf), [`01_Blog/openapi.yaml`](file:///d:/Muaz/Programming/FX%20internship/Weekend%20Assessments/Blog%20Platform/submission/01_Blog/openapi.yaml) & [`.md`](file:///d:/Muaz/Programming/FX%20internship/Weekend%20Assessments/Blog%20Platform/submission/01_Blog/04-api-workflows.md) | ✅ Complete | Complete endpoint catalog, OpenAPI 3.0 YAML schema, success path sequence diagram, and failure/refresh sequence diagram. |
| **5** | **Test Cases Execution Matrix** | `.xlsx` + Markdown | [`01_Blog/05-test-cases.xlsx`](file:///d:/Muaz/Programming/FX%20internship/Weekend%20Assessments/Blog%20Platform/submission/01_Blog/05-test-cases.xlsx) & [`01_Blog/05-test-cases.md`](file:///d:/Muaz/Programming/FX%20internship/Weekend%20Assessments/Blog%20Platform/submission/01_Blog/05-test-cases.md) | ✅ Complete | 34 comprehensive test cases with actual execution results and pytest fixture evidence. |
| **6** | **Engineering Decisions & Trade-offs** | Markdown | [`01_Blog/06-engineering-decisions.md`](file:///d:/Muaz/Programming/FX%20internship/Weekend%20Assessments/Blog%20Platform/submission/01_Blog/06-engineering-decisions.md) | ✅ Complete | In-depth trade-off analysis in mini format (Options, Choice, Why, Trade-offs) covering 9 major technical decisions. |
| **7** | **Source Code & Demo Links** | Markdown | [`01_Blog/07-source-and-demo-links.md`](file:///d:/Muaz/Programming/FX%20internship/Weekend%20Assessments/Blog%20Platform/submission/01_Blog/07-source-and-demo-links.md) | ✅ Complete | Links to GitHub repository, Loom demonstration video, Google Drive folder, and reviewer quick start commands. |
| **8** | **Deployment Cost & Scaling Plan** | `.xlsx` + Markdown | [`01_Blog/08-cost-and-scaling.xlsx`](file:///d:/Muaz/Programming/FX%20internship/Weekend%20Assessments/Blog%20Platform/submission/01_Blog/08-cost-and-scaling.xlsx) & [`01_Blog/08-cost-and-scaling.md`](file:///d:/Muaz/Programming/FX%20internship/Weekend%20Assessments/Blog%20Platform/submission/01_Blog/08-cost-and-scaling.md) | ✅ Complete | Verified pricing comparison between Hostinger VPS ($10.49/mo) and AWS Cloud ($31.20/mo), with 4-tier scaling models (100 to 1,000,000 users). |
| **9** | **Open-Source & AI Disclosure** | Markdown | [`01_Blog/09-sources-and-disclosure.md`](file:///d:/Muaz/Programming/FX%20internship/Weekend%20Assessments/Blog%20Platform/submission/01_Blog/09-sources-and-disclosure.md) | ✅ Complete | Catalog of upstream dependencies and licenses, transparent AI disclosure, and pricing citations with verification dates. |
| **10** | **Master Testing Manual** | Markdown | [`TESTING_GUIDE.md`](file:///d:/Muaz/Programming/FX%20internship/Weekend%20Assessments/Blog%20Platform/TESTING_GUIDE.md) | ✅ Complete | Step-by-step testing manual covering pytest execution, cURL/Postman commands, frontend UI walkthrough, and Loom video script. |

---

## 3. Quick Run Commands

```bash
# Start Docker environment
docker compose up --build

# Run all 34 backend tests
cd backend && .\venv\Scripts\python -m pytest -v

# Run Next.js frontend
cd frontend && npm run dev
```
