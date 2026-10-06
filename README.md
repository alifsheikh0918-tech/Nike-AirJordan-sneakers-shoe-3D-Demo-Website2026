# KICKS 25/26 (Nike + Jordan release tracker)

Run everything: `docker compose up --build` (API :4000), then `cd frontend && npm i && npm run dev` (site :5173).
Local API without Docker: copy `backend/.env.example` to `backend/.env`, start Postgres/Mongo/Redis, `cd backend && npm i && npm run dev`.

| Roadmap topic | Where it lives |
|---|---|
| HTTP/HTTPS, ports, client-server, TCP/IP | Vite :5173 -> proxy -> API :4000 -> Postgres 5432 / Mongo 27017 / Redis 6379 |
| SQL (PostgreSQL) | `backend/sql/init.sql`, parameterized queries in `server.js` |
| NoSQL (MongoDB) | wishlist documents |
| Cache (Redis) | `GET /api/sneakers` cached 60 s (`X-Cache` header) |
| REST + JWT | `/api/auth/*`, `/api/sneakers`, `/api/wishlist` (Bearer token) |
| OWASP | helmet, CORS allow-list, rate limits, bcrypt, input validation, body size limit |
| Docker | `backend/Dockerfile`, `docker-compose.yml` |

Seed data is SAMPLE ONLY. Replace it with verified releases before launch.
Deploy: HTTPS (Caddy/nginx or a cloud load balancer), set a real JWT_SECRET, never commit .env.

## Real data + photos
- `backend/sql/init.sql` holds 34 releases (2025 highlights, 2026, upcoming). Sources and check date are in the file header. Dates and prices change, so re-check before launch.
- Status (released/upcoming) is computed from the date, so it never goes stale.
- Photos: see `frontend/public/shoes/LIST.txt` for which file name goes with which sneaker.
- Changed init.sql after the first run? `docker compose down -v` then `docker compose up --build` (this wipes the DB volumes).

## Git / GitHub
```
git init && git add . && git commit -m "KICKS 25/26 first version"
git branch -M main
git remote add origin https://github.com/<you>/kicks.git
git push -u origin main
```
Check `git status` first: `.env` and `node_modules` must NOT be listed.

## Deploy (simplest path)
1. Rent a small Linux VM (AWS EC2 / Google Compute Engine / Azure VM, Ubuntu).
2. `ssh` in, install Docker, `git clone` the repo, create `backend/.env` with a long random JWT_SECRET and `CORS_ORIGIN=https://yourdomain.com`.
3. `cd frontend && npm ci && npm run build`, then serve `frontend/dist` with Caddy (it gets free HTTPS automatically) and reverse-proxy `/api` to port 4000.
4. Point your domain's DNS A record to the VM's IP. Open only ports 80/443 in the firewall.
