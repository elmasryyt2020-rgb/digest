# Server Documentation — Digest Health VPS

> **Last updated:** 2026-08-17  
> **Server:** `41.33.93.209` (SSH port `2222`)  
> **User:** `seif`  
> **Application:** Digest Health (React Native + Expo Mobile App)

---

## Architecture

```
Internet
    │
    ▼  port 80 & 8000
┌─────────────────────────────────────────────────────────────┐
│  VPS  41.33.93.209              SSH port 2222               │
│                                                             │
│  Caddy :80  ───────────────►   Kong :8000                   │
│  (reverse proxy & headers)     (API Gateway)                │
│                                      │                      │
│  ┌───────────────────────────────────┼───────────────────┐  │
│  │ Supabase Stack (Docker Compose):  │                   │  │
│  │   ├── Kong Gateway       :8000 ◄──┘                   │  │
│  │   ├── Auth Server        :9999 (GoTrue auto-confirm)  │  │
│  │   ├── PostgreSQL 17      :5432 (supabase-db)          │  │
│  │   ├── PostgREST v14      :3000 (supabase-rest)        │  │
│  │   ├── Realtime WS        :4000 (supabase-realtime)    │  │
│  │   ├── Storage Engine     :5000 (supabase-storage)     │  │
│  │   ├── Image Processing   :5001 (supabase-imgproxy)    │  │
│  │   ├── Supavisor Pooler   :6543 (supabase-pooler)      │  │
│  │   ├── Edge Functions     :9000 (supabase-edge-runtime)│  │
│  │   ├── Studio Dashboard   :3000 (supabase-studio)      │  │
│  │   └── Postgres Meta      :8080 (supabase-meta)        │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  Cron Automated Backups:                                    │
│    Daily 03:00 AM ─────────►  /home/seif/backups/           │
└─────────────────────────────────────────────────────────────┘
```

---

## Server Credentials & Access

### SSH Connection
```bash
ssh -p 2222 seif@41.33.93.209
```
*Note: Password will be updated/rotated by the user.*

### Studio Dashboard Access (via SSH Tunnel)
Supabase Studio runs locally inside the Docker network. To open Studio in your browser securely:
```bash
ssh -p 2222 -L 3000:localhost:3000 seif@41.33.93.209
```
Then open: `http://localhost:3000`

---

## Supabase Service Ports & Endpoints

| Service | Port | Endpoint URL | Visibility |
| :--- | :--- | :--- | :--- |
| **Caddy Reverse Proxy** | `80` | `http://41.33.93.209/` | Public |
| **Kong API Gateway** | `8000` | `http://41.33.93.209:8000/` | Public |
| **Auth (GoTrue)** | `9999` | `http://41.33.93.209:8000/auth/v1/` | Public (via Kong / Caddy) |
| **REST API (PostgREST)** | `3000` | `http://41.33.93.209:8000/rest/v1/` | Public (via Kong / Caddy) |
| **Storage API** | `5000` | `http://41.33.93.209:8000/storage/v1/` | Public (via Kong / Caddy) |
| **Realtime WebSockets** | `4000` | `ws://41.33.93.209:8000/realtime/v1/` | Public (via Kong / Caddy) |
| **Edge Functions** | `9000` | `http://41.33.93.209:8000/functions/v1/` | Public (via Kong / Caddy) |
| **PostgreSQL 17** | `5432` | `41.33.93.209:5432` | Internal / Docker network |
| **Supavisor Transaction Pooler** | `6543` | `41.33.93.209:6543` | Internal / Docker network |
| **Studio Web Dashboard** | `3000` | `http://localhost:3000` | SSH Tunnel (`-L 3000:localhost:3000`) |

---

## JWT & Authentication Secrets

These symmetric keys are HS256-signed and valid for 10 years (until 2036):

### JWT Secret
```text
super-secret-jwt-token-digest-production-2026-auth-key-32chars!
```

### Anon API Key (`EXPO_PUBLIC_SUPABASE_ANON_KEY`)
```text
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzg2OTY2MTIwLCJleHAiOjIxMDIzMjYxMjB9.j7RDOdlc1CatH5ZttQhHaj7BeeBI75ggnS4d6XCvh1c
```

### Service Role Key (`SUPABASE_SERVICE_ROLE_KEY`)
```text
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3ODY5NjYxMjAsImV4cCI6MjEwMjMyNjEyMH0.E2C1Qb-Eg3xNVGHwZREicCQjRi-FnsGx3tfo6ZKnPsk
```

### Database Password (`POSTGRES_PASSWORD`)
```text
GothiSupabase2027SecureDB!
```

---

## Auto-Confirmation & Authentication Behavior

The GoTrue auth container is configured with:
- `ENABLE_EMAIL_SIGNUP=true`
- `ENABLE_EMAIL_AUTOCONFIRM=true`
- `GOTRUE_MAILER_AUTOCONFIRM=true`
- `ENABLE_PHONE_SIGNUP=true`
- `ENABLE_PHONE_AUTOCONFIRM=true`

**Effect:** When a user signs up from the mobile app, their email is immediately auto-confirmed (`email_confirmed_at` is stamped), and an active user session with JWT `access_token` is returned immediately without waiting for email delivery.

---

## Database Schema & Migrations

The database running on PostgreSQL 17 contains all tables, indexes, triggers, and foreign keys:

| Table | Records Migrated | Description |
| :--- | :--- | :--- |
| `public.profiles` | Schema active | User biometrics, targets, unit settings, and `budget` |
| `public.foods_cache` | **126 records** | Full USDA and Open Food Facts ingredient nutrition cache |
| `public.generated_recipes` | **1 record** | AI-generated recipes with ingredients JSONB and steps |
| `public.food_logs` | Schema active | Daily meal logs (breakfast, lunch, dinner, snacks) |
| `public.water_logs` | Schema active | Timestamped water intake logs |
| `public.workout_logs` | Schema active | MET-based workout and calories burned logs |
| `public.meal_plans` | Schema active | Weekly 7-day budget meal plans & grocery lists |
| `storage.buckets` | **2 buckets** | `reports` (public) and `scans` (public) |

---

## Edge Functions Deployed

All 6 Edge Functions from the project are mounted inside the Deno Edge Runtime:

1. `delete-account` — Deletes user auth and cascades profile and diary records.
2. `generate-meal-plan` — Generates 7-day budget meal plans matching Egyptian baskets with USDA nutritional grounding.
3. `generate-pdf-report` — Server-side Deno PDFKit report rendering with embedded Amiri and Inter fonts.
4. `generate-recipe` — Dynamic recipe generation from refrigerator pantry ingredients.
5. `scan-image` — AI Vision meal ingredient identification and bounding box coordinate extractor.
6. `translate-food` — English/Arabic food term translation and nutrient resolution.

---

## Caddy Reverse Proxy Configuration

File path on VPS: `/etc/caddy/Caddyfile`

```caddyfile
:80 {
    # Reverse proxy Supabase API routes to Kong on port 8000
    handle /auth/* {
        reverse_proxy 127.0.0.1:8000
    }
    handle /rest/* {
        reverse_proxy 127.0.0.1:8000
    }
    handle /storage/* {
        reverse_proxy 127.0.0.1:8000
    }
    handle /functions/* {
        reverse_proxy 127.0.0.1:8000
    }
    handle /realtime/* {
        reverse_proxy 127.0.0.1:8000
    }

    # Default fallback to API gateway
    handle {
        reverse_proxy 127.0.0.1:8000
    }

    header {
        -Server
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        Referrer-Policy "strict-origin-when-cross-origin"
    }

    encode gzip zstd
}
```

### Reloading Caddy
```bash
sudo systemctl restart caddy
sudo systemctl status caddy
```

---

## Automated Backups

- **Script Path:** `/home/seif/backups/backup.sh`
- **Log File:** `/home/seif/backups/backup.log`
- **Retention:** Backups older than 7 days are automatically pruned.
- **Schedule:** `0 3 * * *` (Daily at 03:00 AM server time).

### Manual Backup Run
```bash
/home/seif/backups/backup.sh
```

### Restoring a Backup
```bash
gunzip < /home/seif/backups/supabase_backup_YYYYMMDD_HHMMSS.sql.gz | docker exec -i supabase-db psql -U postgres -d postgres
```

---

## Mobile App Environment Configuration

File: `d:\digest\.env`

```env
EXPO_PUBLIC_SUPABASE_URL=http://41.33.93.209:8000
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzg2OTY2MTIwLCJleHAiOjIxMDIzMjYxMjB9.j7RDOdlc1CatH5ZttQhHaj7BeeBI75ggnS4d6XCvh1c
EXPO_PUBLIC_USDA_API_KEY=vegiOZ9Gs6Ie3Z4dKIANDIR3LRdU37LR3LfsUquM
```

---

## Maintenance & Monitoring Commands

### Check Container Status
```bash
cd /home/seif/supabase-docker && docker compose ps
```

### View Service Logs
```bash
docker logs -f --tail 50 supabase-db
docker logs -f --tail 50 supabase-auth
docker logs -f --tail 50 supabase-rest
docker logs -f --tail 50 supabase-kong
docker logs -f --tail 50 supabase-edge-functions
docker logs -f --tail 50 supabase-storage
```

### Restart Supabase Stack
```bash
cd /home/seif/supabase-docker && docker compose restart
```

### Test API Gateway Health
```bash
curl -s http://41.33.93.209:8000/rest/v1/foods_cache?limit=1 \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzg2OTY2MTIwLCJleHAiOjIxMDIzMjYxMjB9.j7RDOdlc1CatH5ZttQhHaj7BeeBI75ggnS4d6XCvh1c"
```
