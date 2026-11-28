# Hosting on AWS (Mumbai)

Everything runs in AWS account QuickHotels247, region ap-south-1:

| Part | Where |
|---|---|
| Website (Next.js) + API (NestJS) + HTTPS (Caddy) | EC2 `quickhotels-server` (t4g.small, Arm), Elastic IP 13.127.171.94 |
| Database | RDS PostgreSQL `quickhotels-db` (private; only the server reaches it) |
| Images | Built by GitHub Actions, stored in ghcr.io |

TripJack accepts calls only from whitelisted IPs, so the API must run on the
Elastic IP (13.127.171.94).

## How a deploy works

Push to `main` → `.github/workflows/deploy-aws.yml` builds both images on an
Arm runner, then SSHes to the server, pulls them and restarts. The backend runs
`prisma migrate deploy` before it starts. Run it by hand from GitHub → Actions →
"Deploy to AWS" → Run workflow.

## First-time setup

1. **Server:** copy `setup-server.sh` to the server and run it once.
2. **Settings:** fill `/opt/quickhotels/.env.backend` from `.env.backend.example`.
3. **GitHub:** secret `EC2_SSH_KEY` (the .pem file); variables `EC2_HOST`
   and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`.
4. **DNS (Cloudflare):** A records `quickhotels247.com`, `www`, `api` →
   13.127.171.94, "DNS only" (grey cloud), so Caddy can get certificates.

## Everyday commands (on the server, in /opt/quickhotels)

```bash
docker compose ps                 # what's running
docker compose logs -f backend    # live API logs (also: frontend, caddy)
docker compose restart backend    # after editing .env.backend
```

## Reaching the database from a laptop

It has no public address; go through the server:

```bash
ssh -i quickhotels-key.pem -N -L 15432:quickhotels-db.c5g2emc2osnb.ap-south-1.rds.amazonaws.com:5432 ubuntu@13.127.171.94
# then connect to localhost:15432 (DBeaver can do this itself with its SSH tab)
```
