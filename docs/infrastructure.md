# Infrastructure

## Resource Naming

All resources use `inksight-<component>` format.

## Cloudflare Resources

| Type | Name | ID |
|------|------|-----|
| D1 Database | `inksight-d1` | `9fa9fc89-8336-48d8-b633-b0ed90ee8a4e` |
| R2 Bucket | `inksight-r2` | Standard storage class |
| KV Namespace | `inksight-kv` | `8c3c6a22dd1248278a1289d36acd6cdd` |
| Vectorize Index | `inksight-vectorize` | 768 dim, cosine |
| Worker (App) | `inksight` | Frontend + API |
| Worker (Email) | `inksight-email` | Email ingestion |
| Worker (Processor) | `inksight-processor` | AI pipeline |

## Architecture Notes

- Frontend static assets are served by the `inksight` Worker (from R2/KV), no separate Pages project.
- API routes live under `/api/*` in the same Worker.
- URL: `inksight.53.workers.dev`

## Database Schema

D1 database initialized with 8 tables:

| Table | Purpose |
|-------|---------|
| `users` | User accounts |
| `emails` | Email metadata |
| `finance` | Financial transactions |
| `trips` | Travel bookings |
| `news` | Newsletter summaries |
| `embeddings` | Vector search metadata |
| `user_credentials` | Encrypted credentials |
| `audit_log` | Audit trail |

Schema source: `schema.sql` in project root.

## IaC

- Terraform manages Cloudflare resources (`infra/` directory)
- Vectorize managed via wrangler CLI (Terraform not yet supported)

## Common Commands

```bash
# Init terraform
cd infra && terraform init

# Plan changes
terraform plan

# Apply changes
terraform apply

# Create vectorize index
wrangler vectorize create inksight-vectorize --dimensions=768 --metric=cosine
```
