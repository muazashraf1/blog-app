# DevScribe — Deployment Cost & Scalability Analysis
### Deliverable 08 | FalconXoft Weekend 1 Assessment

This document provides a comparative financial cost analysis between **Option A (Single Hostinger VPS)** and **Option B (Multi-Service AWS Cloud)**, along with a 4-tier horizontal scaling strategy from 100 to 1,000,000 users.

The companion formatted workbook with live spreadsheet formulas is located at [08-cost-and-scaling.xlsx](file:///d:/Muaz/Programming/FX%20internship/Weekend%20Assessments/Blog%20Platform/submission/01_Blog/08-cost-and-scaling.xlsx).

---

## 1. Cost Comparison: Option A (VPS) vs. Option B (AWS)

*Exchange Rate Used: 1 USD = 278 PKR (Checked: October 2026)*  
*Target Geography: South Asia / India Edge (Closest geographic latency to Pakistan users)*

### Option A: VPS Hosting (Hostinger KVM 2)
Best suited for MVP and growth stage up to 10,000 users. Runs all services in Docker containers on a single host.

| Service Category | Specification | Region | Usage Assumption | Unit Price | Monthly (USD) | Monthly (PKR) | Type | Source URL & Access Date |
|---|---|---|---|---|:---:|:---:|:---:|---|
| **Compute & App** | Hostinger KVM 2 (2 vCPU, 8GB RAM, 100GB NVMe) | Mumbai / India | Runs Next.js, Django API, Postgres, Nginx | $7.99 / mo | $7.99 | ₨ 2,221 | Verified | [hostinger.com/vps-hosting](https://www.hostinger.com/vps-hosting) (2026-10-18) |
| **Database** | Embedded PostgreSQL 16 on NVMe | Mumbai / India | Included in VPS resources | $0.00 | $0.00 | ₨ 0 | Verified | Included in host (2026-10-18) |
| **Storage & Backups**| Automated weekly snapshots + Nightly offsite dump | Mumbai / India | 100GB NVMe storage + automated daily backup snapshot | $1.50 / mo | $1.50 | ₨ 417 | Verified | [hostinger.com/vps-hosting](https://www.hostinger.com/vps-hosting) (2026-10-18) |
| **Bandwidth & CDN** | Cloudflare Free Tier (CDN, Edge Caching, SSL) | Global Edge | Global caching of static JS/CSS and images | $0.00 / mo | $0.00 | ₨ 0 | Verified | [cloudflare.com/plans](https://www.cloudflare.com/plans/) (2026-10-18) |
| **Domain Registration**| `.com` Domain Name | Global | Standard top-level domain ($11.99/year $\div$ 12) | $1.00 / mo | $1.00 | ₨ 278 | Verified | [namecheap.com](https://www.namecheap.com/domains/) (2026-10-18) |
| **Monitoring & Telemetry**| Sentry Developer Tier + Uptime Kuma | Global | 5,000 error events/month + self-hosted ping | $0.00 / mo | $0.00 | ₨ 0 | Verified | [sentry.io/pricing](https://sentry.io/pricing/) (2026-10-18) |
| **TOTAL (VPS)** | **Complete Docker Monolith Architecture** | **India** | **Production Ready MVP** | — | **$10.49** | **₨ 2,916** | **Calculated** | **Total Monthly Outlay** |

---

### Option B: Cloud Architecture (Amazon Web Services — AWS)
Best suited for enterprise scale, compliance requirements, and automatic multi-zone high availability.

| Service Category | Specification | Region | Usage Assumption | Unit Price | Monthly (USD) | Monthly (PKR) | Type | Source URL & Access Date |
|---|---|---|---|---|:---:|:---:|:---:|---|
| **Compute (ECS/EC2)** | 1x `t4g.small` (2 vCPU, 2GB RAM, ARM Graviton2) | `ap-south-1` (Mumbai) | Runs Next.js SSR and Django API | $0.0168 / hr | $12.26 | ₨ 3,408 | Verified | [aws.amazon.com/ec2/pricing](https://aws.amazon.com/ec2/pricing/on-demand/) (2026-10-18) |
| **Database (RDS)** | `db.t4g.micro` PostgreSQL (1 vCPU, 1GB RAM, 20GB GP3) | `ap-south-1` (Mumbai) | Managed PostgreSQL with point-in-time recovery | $0.018/hr + $2.30 storage | $15.44 | ₨ 4,292 | Verified | [aws.amazon.com/rds/postgresql/pricing](https://aws.amazon.com/rds/postgresql/pricing/) (2026-10-18) |
| **Storage (S3)** | Amazon S3 Standard (10GB Media & Backups) | `ap-south-1` (Mumbai) | 10GB storage + 5,000 PUT/GET requests | $0.025 / GB | $0.50 | ₨ 139 | Verified | [aws.amazon.com/s3/pricing](https://aws.amazon.com/s3/pricing/) (2026-10-18) |
| **CDN & Data Transfer**| CloudFront Always Free Tier | Global Edge | Free 1TB data transfer out + 10M requests | $0.00 / mo | $0.00 | ₨ 0 | Verified | [aws.amazon.com/cloudfront/pricing](https://aws.amazon.com/cloudfront/pricing/) (2026-10-18) |
| **DNS Management** | Amazon Route 53 (1 Hosted Zone) | Global | Apex domain DNS resolution | $0.50 / zone / mo | $0.50 | ₨ 139 | Verified | [aws.amazon.com/route53/pricing](https://aws.amazon.com/route53/pricing/) (2026-10-18) |
| **Observability** | CloudWatch Metrics & Log Group (5GB) | `ap-south-1` (Mumbai) | Free tier 10 alarms, 5GB ingested log storage | $0.50 / GB ingested | $2.50 | ₨ 695 | Verified | [aws.amazon.com/cloudwatch/pricing](https://aws.amazon.com/cloudwatch/pricing/) (2026-10-18) |
| **TOTAL (AWS)** | **Distributed High-Availability Cloud** | **Mumbai** | **Baseline Managed Cloud** | — | **$31.20** | **₨ 8,674** | **Calculated** | **Total Monthly Outlay** |

---

## 2. Scaling Architecture Across User Tiers

### Traffic Modeling Assumptions:
- **Daily Active Users (DAU):** Approximately 10% of total registered user base.
- **Request Frequency:** Each active user makes ~20 requests per day (reading articles, searching, commenting).
- **Traffic Profile:** **90% Read traffic** (browsing feed, reading Markdown posts) and **10% Write traffic** (creating posts, drafting, commenting).

```
   100 Users         1,000 Users           10,000 Users              1,000,000 Users
┌──────────────┐   ┌───────────────┐   ┌──────────────────┐   ┌───────────────────────────┐
│ Single VPS   │──▶│ VPS + Redis   │──▶│ App Servers x2   │──▶│ AWS Auto-scaling ECS      │
│ Docker Monolith│ │ Query Caching │   │ Managed RDS + CDN│   │ Read Replicas + Celery    │
│ ($10.49/mo)  │   │ ($14.99/mo)   │   │ ($115.00/mo)     │   │ ElasticSearch ($980.00/mo)│
└──────────────┘   └───────────────┘   └──────────────────┘   └───────────────────────────┘
```

| User Scale Tier | Daily Active Users | Daily Traffic | Bottleneck Identified | Architectural Changes | VPS Option ($/mo) | AWS Option ($/mo) |
|---|---|---|---|---|:---:|:---:|
| **100 Users (MVP)** | 10 DAU | 200 req/day | None (Zero contention) | Single VPS host running Docker Compose (Next.js + Django + Postgres). | $10.49 | $31.20 |
| **1,000 Users (Growth)** | 100 DAU | 2,000 req/day | Database connection spikes & un-indexed list queries | Enable DB GIN indexes (already implemented), add Redis memory cache for popular post lists. | $14.99 | $45.50 |
| **10,000 Users (High Load)** | 1,000 DAU | 20,000 req/day | Database CPU & memory bandwidth, static asset delivery | Separate DB to managed RDS/VPS, add Cloudflare CDN edge caching, 2x app containers behind Nginx load balancer. | $32.00 | $115.00 |
| **1,000,000 Users (Enterprise)** | 100,000 DAU | 2,000,000 req/day | Database write lock contention, PostgreSQL text search saturation | Auto-scaling ECS containers, Aurora PostgreSQL with Read Replicas & PgBouncer pooling, Celery + Redis write buffer queues, Migrate search to Elasticsearch/OpenSearch. | $250.00 | $980.00 |
