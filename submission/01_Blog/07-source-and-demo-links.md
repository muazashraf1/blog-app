# DevScribe — Source Code & Demonstration Links
### Deliverable 07 | FalconXoft Weekend 1 Assessment

This document provides access links to the source repository, demonstration video, submission cloud storage, and reviewer instructions.

---

## 1. Submission Links

| Resource | Link | Description |
|---|---|---|
| **GitHub Repository** | `https://github.com/YourUsername/blog-platform` *(Update with your repository URL)* | Complete source code containing `backend/`, `frontend/`, `docker-compose.yml`, and tests. |
| **Loom Demo Video** | `https://www.loom.com/share/your-demo-video-id` *(Update with your recorded Loom link)* | 3 to 5-minute video walkthrough covering architecture, live user journey, failure tests, and pytest execution. |
| **Google Drive Folder** | `https://drive.google.com/drive/folders/your-folder-id` *(Update with your Drive link)* | Complete deliverable archive including PDFs, `.xlsx` spreadsheets, and code exports. |

---

## 2. Reviewer / Evaluator Quick Start Guide

To run and evaluate the application locally within 2 minutes:

```bash
# 1. Clone repository
git clone https://github.com/YourUsername/blog-platform.git
cd blog-platform

# 2. Start all services using Docker
docker compose up --build -d

# 3. Access web application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000/api/v1/
# Swagger UI / OpenAPI: http://localhost:8000/api/schema/swagger-ui/

# 4. Run automated test suite
docker compose exec backend pytest -v
```

### Pre-Configured Test Credentials
- **Administrator:** `admin@example.com` / `AdminPassword123!`
- **Author:** `author@example.com` / `AuthorPassword123!`
- **Reader:** `reader@example.com` / `ReaderPassword123!`
