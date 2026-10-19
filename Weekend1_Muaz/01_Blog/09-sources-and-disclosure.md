# DevScribe — Open-Source & AI Usage Disclosure
### Deliverable 09 | FalconXoft Weekend 1 Assessment

In accordance with Section 14 of the assignment guidelines, this document provides complete, transparent disclosure of all open-source libraries, packages, AI-assisted tooling, and official pricing citations.

---

## 1. Open-Source Libraries & Dependencies

All software components used in DevScribe are distributed under permissive open-source licenses (MIT, BSD, Apache 2.0). No proprietary code or copyrighted templates were incorporated.

### Backend Packages (Python / Django)

| Package | Version | License | Upstream URL | Role in DevScribe | Modification Note |
|---|---|---|---|---|---|
| **Django** | `5.1.x` | BSD-3-Clause | [djangoproject.com](https://www.djangoproject.com/) | Web framework, ORM, migrations, user authentication. | Custom `AbstractUser` subclass implemented. |
| **djangorestframework** | `3.15.x` | BSD-2-Clause | [django-rest-framework.org](https://www.django-rest-framework.org/) | REST API serialization, ViewSets, API permissions. | Custom `IsAuthorOrAdmin`, `IsOwnerOrReadOnly` classes. |
| **djangorestframework-simplejwt** | `5.3.x` | MIT | [github.com/jazzband/djangorestframework-simplejwt](https://github.com/jazzband/djangorestframework-simplejwt) | JWT generation, signing, claims embedding, token refresh. | Custom claims serializer adding `role` and `email` to payload. |
| **django-cors-headers** | `4.6.x` | MIT | [github.com/adamchainz/django-cors-headers](https://github.com/adamchainz/django-cors-headers) | Cross-Origin Resource Sharing (CORS) header configuration. | Configured to allow frontend `localhost:3000`. |
| **python-slugify** | `8.0.x` | MIT | [github.com/un33k/python-slugify](https://github.com/un33k/python-slugify) | Converts article titles into URL-safe slugs. | Integrated into `Post.save()` collision-resolution logic. |
| **psycopg2-binary** | `2.9.x` | LGPL / BSD | [psycopg.org](https://www.psycopg.org/) | PostgreSQL database adapter for Python. | Standard driver. |
| **drf-spectacular** | `0.28.x` | BSD-3-Clause | [github.com/tfranzel/drf-spectacular](https://github.com/tfranzel/drf-spectacular) | Automatic OpenAPI 3.0 schema generation. | Used to generate `openapi.yaml`. |
| **pytest** | `9.1.x` | MIT | [pytest.org](https://docs.pytest.org/) | Automated testing harness. | Configured in `backend/pytest.ini`. |
| **pytest-django** | `4.14.x` | BSD-3-Clause | [pytest-django.readthedocs.io](https://pytest-django.readthedocs.io/) | Django database fixture integration for pytest. | Standard testing harness. |
| **openpyxl** | `3.1.x` | MIT | [openpyxl.readthedocs.io](https://openpyxl.readthedocs.io/) | Programmatic Excel workbook generation. | Used to build `05-test-cases.xlsx` and `08-cost-and-scaling.xlsx`. |

### Frontend Packages (Node.js / React)

| Package | Version | License | Upstream URL | Role in DevScribe | Modification Note |
|---|---|---|---|---|---|
| **Next.js** | `14.2.x` | MIT | [nextjs.org](https://nextjs.org/) | React framework with App Router, SSR, and client routing. | Written from scratch with custom layout, navbar, and pages. |
| **React & React-DOM** | `18.3.x` | MIT | [react.dev](https://react.dev/) | Component rendering, hooks, and context state management. | Hand-crafted state for `AuthContext` and interactive views. |
| **Axios** | `1.7.x` | MIT | [axios-http.com](https://axios-http.com/) | HTTP client for Django REST API communication. | Configured with automatic 401 JWT refresh interceptor. |
| **Lucide React** | `0.453.x`| MIT | [lucide.dev](https://lucide.dev/) | Clean, lightweight modern icons. | Used across UI for navigation, roles, and status indicators. |

---

## 2. Starter Templates / Boilerplates

- **Backend:** Initialized cleanly using standard `django-admin startproject config .`. No pre-made boilerplate, cookiecutter, or starter kit was used.
- **Frontend:** Initialized cleanly using `npx create-next-app@latest .`. All component styling, themes ("Editorial Latte"), and views were built from scratch using pure Vanilla CSS.

---

## 3. Artificial Intelligence (AI) Disclosure

In strict accordance with the FalconXoft assessment guidelines:

| Tool Used | Areas Where AI Assisted | How Results Were Independently Verified |
|---|---|---|
| **Antigravity AI (Gemini 3.8 / Claude 4.6)** | Scaffolding repetitive test cases, generating markdown documentation structures, drafting openpyxl Excel generation scripts, and accelerating CSS styling. | **1. Execution Verification:** Ran all 34 automated unit/integration tests with `pytest` (100% passed).<br>**2. Compilation Verification:** Executed `npm run build` on Next.js to ensure zero TypeScript/linting/syntax errors.<br>**3. End-to-End Walkthrough:** Tested each user journey manually in Chrome browser across Reader, Author, and Admin roles.<br>**4. Code Audit:** Inspected every serializer, view, permission class, and SQL query to verify security boundaries (RBAC, SQL injection protection, XSS avoidance). |

---

## 4. Official Cloud & Hosting Pricing Citations

The following pricing citations were directly accessed, checked, and cross-referenced in October 2026:

1. **Hostinger VPS Hosting:**
   - URL: [https://www.hostinger.com/vps-hosting](https://www.hostinger.com/vps-hosting)
   - Checked: October 18, 2026
   - Cited Price: Hostinger KVM 2 Plan at $7.99/month (2 vCPU, 8 GB RAM, 100 GB NVMe).
2. **AWS EC2 On-Demand Pricing (ap-south-1 Mumbai):**
   - URL: [https://aws.amazon.com/ec2/pricing/on-demand/](https://aws.amazon.com/ec2/pricing/on-demand/)
   - Checked: October 18, 2026
   - Cited Price: `t4g.small` at $0.0168/hour ($12.26/month).
3. **AWS RDS PostgreSQL Pricing (ap-south-1 Mumbai):**
   - URL: [https://aws.amazon.com/rds/postgresql/pricing/](https://aws.amazon.com/rds/postgresql/pricing/)
   - Checked: October 18, 2026
   - Cited Price: `db.t4g.micro` Single-AZ at $0.018/hour ($13.14/month) + General Purpose SSD (gp3) at $0.115/GB-month ($2.30 for 20 GB).
4. **AWS S3 Cloud Storage Pricing:**
   - URL: [https://aws.amazon.com/s3/pricing/](https://aws.amazon.com/s3/pricing/)
   - Checked: October 18, 2026
   - Cited Price: S3 Standard at $0.025 per GB-month.
5. **AWS CloudFront CDN Pricing:**
   - URL: [https://aws.amazon.com/cloudfront/pricing/](https://aws.amazon.com/cloudfront/pricing/)
   - Checked: October 18, 2026
   - Cited Price: Always Free Tier includes 1 TB of data transfer out and 10,000,000 HTTP/HTTPS requests monthly.
6. **AWS Route 53 Pricing:**
   - URL: [https://aws.amazon.com/route53/pricing/](https://aws.amazon.com/route53/pricing/)
   - Checked: October 18, 2026
   - Cited Price: $0.50 per hosted zone per month for the first 25 hosted zones.
7. **Cloudflare Plans & Pricing:**
   - URL: [https://www.cloudflare.com/plans/](https://www.cloudflare.com/plans/)
   - Checked: October 18, 2026
   - Cited Price: Cloudflare Free Plan ($0/month) for DNS, edge CDN, and automated SSL.
