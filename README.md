# QuickHotels24/7

QuickHotels24/7 is a hotel booking website with an admin console. TripJack supplies the hotels, availability and rates. The product spec is [docs/QuickHotel247_UI_and_Product_Documentation.docx](docs/QuickHotel247_UI_and_Product_Documentation.docx), and the build plan is [docs/ROADMAP.md](docs/ROADMAP.md).

The codebase began as a different product. This repository now keeps only customer accounts (email/password and Google through Clerk), account settings, and the admin console's sign-in, admin team, customer list and audit log. Hotel search and booking are not built yet.

## Current stack (being migrated, see the roadmap)

Nx on Yarn 4 workspaces and TypeScript, with two apps:

- `apps/frontend`: the customer website, built with Next.js (App Router) and MUI, at http://localhost:3000. It's being built screen by screen (roadmap step 4).
- `apps/backend`: the NestJS API on PostgreSQL (Neon), using Prisma 7 for the schema, migrations and queries.

The previous Vite + Tailwind website (login, account settings, admin console) is saved in `docs/archive/frontend-vite-old.zip` for reference while those screens are rebuilt.

```sh
corepack enable    # once per machine; picks up Yarn 4 from package.json
yarn install
yarn dev           # frontend at http://localhost:3000, backend at http://localhost:8080
```

| Command                | What it does                                   |
| ---------------------- | ---------------------------------------------- |
| `yarn dev`             | Run the frontend and backend together          |
| `yarn ui:dev`          | Website only                                   |
| `yarn backend:dev`     | Backend only (auto-reloads)                    |
| `yarn build`           | Typecheck and build everything                 |
| `yarn typecheck`       | Run `tsc` across all workspaces                |
| `yarn test`            | Run every project's tests                      |
| `yarn backend:test`    | Run the backend unit tests                     |
| `yarn graph`           | Open Nx's project graph in the browser         |
| `yarn backend:migrate` | Apply pending database migrations (`prisma migrate deploy`) |

Copy `apps/frontend/.env.example` to `apps/frontend/.env.local`. `NEXT_PUBLIC_*` values are built into the browser code, so never put secrets in them.

Nx runs each workspace's `package.json` scripts as targets (`yarn nx run @quickhotels/backend:build`) and caches `build`, `typecheck` and `test` in `.nx/`. Task order and caching are set in `nx.json`. Nx Cloud isn't connected: set `NX_NO_CLOUD=true` if Nx asks about it.

## Layout

```
apps/
  frontend/          @quickhotels/frontend — customer website (Next.js + MUI)
  backend/           @quickhotels/backend — API server under /api
packages/
  tsconfig/          shared tsconfigs
  types/             API types shared by the frontend and backend
docs/                product spec, design, roadmap, Clerk notes, archive/
```

## Backend notes

- Copy `apps/backend/.env.example` to `.env`. `DATABASE_URL` (pooled) is what the app uses; `DIRECT_URL` (non-pooled) is used for migrations.
- **Local database for development:** Neon (AWS Singapore) is very slow from some home networks, so local development uses Homebrew PostgreSQL. Run `createdb quickhotels`, then set both URLs to `postgresql://<your-mac-user>@localhost:5432/quickhotels`, then run `yarn backend:migrate` and `yarn workspace @quickhotels/backend tripjack:sync-regions` (about 40 s).
- **TripJack:** put the key in `TRIPJACK_API_KEY` and set `HOTEL_SUPPLIER=tripjack`. The key only works from IPs whitelisted in TripJack's dashboard (API Configuration → API KEY → Whitelisted IPs); `yarn workspace @quickhotels/backend tripjack:check` tests it. Notes and the API reference are in `docs/tripjack/`.
- The schema is `apps/backend/prisma/schema.prisma`, and migrations are in `apps/backend/prisma/migrations/`. After changing the schema, run `yarn workspace @quickhotels/backend db:migration <name>` to write a migration, review its SQL, then `yarn backend:migrate` to apply it. `db:status` shows what's applied, and `db:studio` opens a table browser. The generated client in `src/generated/` isn't committed; `dev`, `build`, `typecheck` and `test` regenerate it.
- Customers' session tokens live in `auth_tokens` as SHA-256 hashes.
- Admins are separate accounts in `admin_users` with their own sessions in `admin_tokens`. While no admin exists, `/admin/signup` creates the first one. In production that needs `ADMIN_SETUP_TOKEN`, or you can create one from the server with `yarn workspace @quickhotels/backend db:create-admin <email> "<name>"`. Admin actions are recorded in `admin_audit_log`.
- Set `TRUST_PROXY` to the number of trusted reverse proxies so rate limits see the real client address.

## Docker

Build from the repo root so the image can see the shared packages:

```sh
docker build -f apps/frontend/Dockerfile -t quickhotels-frontend .
docker build -f apps/backend/Dockerfile -t quickhotels-backend .
```
