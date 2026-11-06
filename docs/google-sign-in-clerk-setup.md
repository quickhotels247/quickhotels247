# Google sign-in with Clerk: setup playbook

> This playbook describes the Open Book 24/7 implementation. For this repository's
> current email registration, OTP, sign-in, and deployment configuration, see
> [QuickHotels registration with Clerk](./quickhotels-clerk-registration.md).

How "Continue with Google" was added to Open Book 24/7, written as a repeatable checklist so the same setup can be done on another website. It covers the code, the database change, Clerk (development and production), DNS, Google Cloud, legal pages, environment variables, deployment and testing.

Placeholders used throughout:

| Placeholder | Meaning | Open Book 24/7 value |
| --- | --- | --- |
| `<domain>` | Root domain the site is served on | `openbook247.in` |
| `<frontend-host>` | Frontend hosting | Cloudflare Pages project `exam-master` |
| `<backend-host>` | Backend hosting | Render |
| `<db>` | Postgres database | Neon |
| `<support-email>` | Public contact address on legal pages | set in `apps/frontend/src/utils/legal.ts` |

---

## Contents

- [1. How it works](#1-how-it-works)
- [2. Code changes](#2-code-changes)
- [3. Database migration](#3-database-migration)
- [4. Local development (Clerk development instance)](#4-local-development-clerk-development-instance)
- [5. Production: Clerk production instance](#5-production-clerk-production-instance)
- [6. Production: DNS records](#6-production-dns-records)
- [7. Production: Google OAuth client](#7-production-google-oauth-client)
- [8. Privacy Policy and Terms pages](#8-privacy-policy-and-terms-pages)
- [9. Environment variables and deployment](#9-environment-variables-and-deployment)
- [10. Testing](#10-testing)
- [11. Troubleshooting](#11-troubleshooting)
- [12. File index](#12-file-index)

---

## 1. How it works

Clerk is used **only for the Google OAuth hop**. After Google sign-in, the backend issues the app's own JWT access token and refresh cookie, so the rest of the app (route guards, refresh, logout, admin checks) does not know Clerk exists.

```
Browser                         Clerk / Google                 Backend
───────                         ──────────────                 ───────
Click "Continue with Google"
  └─ signIn.sso(oauth_google) ─▶ Google consent ─▶ Clerk session
/login/sso-callback
  ├─ HandleSSOCallback finishes Clerk sign-in / sign-up
  ├─ getToken() ── Clerk session JWT ─────────────────────────▶ POST /auth/clerk-login
  │                                                              ├─ verifyToken (CLERK_SECRET_KEY, azp = CORS origins)
  │                                                              ├─ load Clerk user, require verified primary email
  │                                                              ├─ find / link / create student
  │                                  ◀── access_token + refresh_token cookie ┘
  └─ clerk.signOut() and navigate to the original page or /dashboard
```

How the backend matches a Google sign-in to an account (one student is one `users` row, whichever way they sign in):

1. **Google identity already linked** (`user_auth_identities.provider_user_id` = Clerk user ID): sign in that user.
2. **Student with the same verified email** (signed up with a password): link Google to that account, then sign in.
3. **Neither:** create a student with `signup_method = 'google'`, `has_password = false` and an unusable random password, link Google, then sign in.

Suspended or deleted accounts are refused **before** any linking. New Google accounts respect the `ALLOWED_EMAIL_DOMAINS` allowlist if it is set.

Google-only users who want a password use **Forgot password**, which sets `has_password = true`.

---

## 2. Code changes

### Backend (NestJS)

| What | Where |
| --- | --- |
| Verify the Clerk token and load the verified email | `apps/backend/src/app/features/auth/clerk-identity.service.ts` |
| `loginWithClerk` (find, link or create, then issue session) | `apps/backend/src/app/features/auth/auth.service.ts` |
| `POST /auth/clerk-login` (sets the refresh cookie) | `apps/backend/src/app/features/auth/auth.controller.ts` |
| `ClerkLoginDto { token }` | `apps/backend/src/app/features/auth/dto/auth.dto.ts` |
| `resolveClerkSecretKey`, `getClerkAuthorizedParties` | `apps/backend/src/app/features/auth/auth.config.ts` |
| Unit tests for the matching rules | `apps/backend/src/app/features/auth/auth.service.clerk-login.spec.ts` |

Package: `@clerk/backend`. Import `verifyToken` from the package root, which throws on an invalid token.

### Frontend (React + Vite)

| What | Where |
| --- | --- |
| Reads `VITE_CLERK_PUBLISHABLE_KEY`; Google UI hidden if empty | `apps/frontend/src/utils/clerk.ts` |
| `ClerkProvider` wired to react-router (navigations are replaces) | `apps/frontend/src/providers/ClerkRouterProvider.tsx` |
| "Continue with Google" button (`signIn.sso`) | `apps/frontend/src/components/login/GoogleSignInButton.tsx` |
| `/login/sso-callback`: token exchange, then Clerk sign-out | `apps/frontend/src/components/login/GoogleSsoCallback.tsx` |
| `useClerkLogin` mutation | `apps/frontend/src/api-hooks/auth/useAuth.ts` |
| Login and sign-up modal on the home page (`?auth=login\|signup\|forgot`) | `apps/frontend/src/components/login/AuthModal.tsx` |

Package: `@clerk/react` (v6 API: `useSignIn().signIn.sso(...)`, `<HandleSSOCallback>`).

Points that are easy to get wrong when repeating this:

- **Vite only exposes variables prefixed `VITE_`.** Clerk's dashboard shows Next.js names (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`); rename to `VITE_CLERK_PUBLISHABLE_KEY`.
- **`clerk.signOut()` always navigates** (to `afterSignOutUrl`, default `/`). Pass `redirectUrl` and give `ClerkProvider` `routerPush`/`routerReplace`, or it overrides your redirect.
- **Add `/auth/clerk-login` to the refresh-exempt paths** in `api-client.ts`, so a 401 from it isn't retried as an expired session.
- **The secret key never goes in the frontend.** Only the publishable key does.

---

## 3. Database migration

File: `apps/backend/database/migrations/20261003_user_auth_identities.sql`. It only adds things and is safe to run more than once.

- `users.signup_method` (`'password' | 'google'`, default `'password'`)
- `users.has_password` (boolean, default `true`)
- New table `user_auth_identities` (`user_id`, `provider`, `provider_user_id`, `provider_email`, timestamps) with unique `(provider, provider_user_id)` and `(user_id, provider)`

**Run it on every database the new backend will talk to, before deploying the backend.** `GET /auth/profile` reads the new columns, so without the migration it fails for every user.

`GET /auth/profile` returns `signup_method`, `has_password` and `auth_methods` (for example `["google", "password"]`) for students.

---

## 4. Local development (Clerk development instance)

1. Create an application at **dashboard.clerk.com** and enable **Google** under **Configure → User & authentication → SSO connections**. The development instance uses Clerk's shared Google credentials, so no Google Cloud setup is needed locally.
2. Under **User & authentication**, keep **Sign-up with email** and **Require email address** on.
3. Put the **test** keys in local env files:

   ```bash
   # apps/frontend/.env
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

   # apps/backend/.env
   CLERK_SECRET_KEY=sk_test_...
   CORS_ALLOWED_ORIGINS=http://localhost:3000
   ```

4. Restart the backend (env is read only at startup) and the Vite dev server.

Keep `pk_test`/`sk_test` locally even after production is live. Live keys only work on the production domain.

---

## 5. Production: Clerk production instance

1. In the Clerk dashboard, open the instance switcher (**Development**) → **Create production instance** → **Clone development instance**.
2. Enter `<domain>`.
3. The **Setup checklist** shows three items: **Domains**, **Google**, and **Create your first user**. The last one ticks itself after the first live sign-in.

Requirement: the frontend must be served from `<domain>` (or a subdomain). A `*.pages.dev` or `*.onrender.com` address will not work with a production instance.

---

## 6. Production: DNS records

Clerk → **Configure → Developers → Domains** lists five CNAME records. Add them in your DNS provider (Cloudflare: **DNS → Records → Add record**):

| Type | Name | Target (copy exactly from Clerk) |
| --- | --- | --- |
| CNAME | `clerk` | `frontend-api.clerk.services` |
| CNAME | `accounts` | `accounts.clerk.services` |
| CNAME | `clkmail` | `mail.<id>.clerk.services` |
| CNAME | `clk._domainkey` | `dkim1.<id>.clerk.services` |
| CNAME | `clk2._domainkey` | `dkim2.<id>.clerk.services` |

- **Name:** type only the prefix; Cloudflare appends the domain.
- **Proxy status must be "DNS only" (grey cloud) on all five.** If it's proxied (orange), Clerk's verification and SSL fail. Cloudflare sometimes turns the proxy on by default, so check each row after saving.
- Leave the website's own records (`<domain>`, `www`) as they are.
- In Clerk click **Verify configuration** and wait until DNS and SSL are green. This takes minutes to about an hour.

Check from a terminal: each record should return the Clerk target, not a Cloudflare IP.

```bash
for h in clerk accounts clkmail clk._domainkey clk2._domainkey; do
  printf "%-18s " "$h"; dig +short CNAME "$h.<domain>" @1.1.1.1
done
curl -s -o /dev/null -w "%{http_code}\n" https://clerk.<domain>/v1/environment   # expect 200
```

`accounts.<domain>` may return 403 if you don't use Clerk's hosted pages. That's fine.

---

## 7. Production: Google OAuth client

Production instances need your own Google credentials.

### 7.1 Get the redirect URI from Clerk

Clerk (Production) → **Configure → User & authentication → SSO connections → Google**. If the menu item is hard to find, use the sidebar **Find…** box and search "SSO".

- Turn on **Enable for sign-up and sign-in** and **Use custom credentials**.
- Copy the **Authorized Redirect URI**: `https://clerk.<domain>/v1/oauth_callback`.

### 7.2 Google Cloud project and consent screen

At **console.cloud.google.com**:

1. **New project** (for example the site name), then select it.
2. **Google Auth Platform** (formerly "APIs & Services → OAuth consent screen") → **Get started**:
   - App name, user support email.
   - **Audience: External.**
   - Contact email. Then **Create**.
3. **Branding:**
   - **Application home page:** `https://<domain>`
   - **Application privacy policy link:** `https://<domain>/privacy` (required to publish; see [section 8](#8-privacy-policy-and-terms-pages))
   - **Application Terms of Service link:** `https://<domain>/terms`
   - **Authorized domains:** `<domain>` (domain only, no `https://`, no `www`)
   - **Save.**
   - **Do not upload a logo** at first. It triggers brand verification, which can take days.
4. **Data access (scopes):** only `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`. These are non-sensitive, so Google doesn't review them.
5. **Audience → Publish app → Confirm**, so the status is **In production**. While it says **Testing**, only listed test users can sign in (100-user cap).

If **Publish app** is greyed out with "complete your configuration on the Branding page", the home page or privacy policy link is missing, or Branding wasn't saved.

### 7.3 OAuth client

**Clients → Create client:**

- **Application type:** Web application
- **Name:** for example `Clerk production`
- **Authorized JavaScript origins:** `https://<domain>`, `https://www.<domain>`
- **Authorized redirect URIs:** the URI from 7.1, exactly
- **Create.** Copy the **Client ID** and **Client secret** (or **Download JSON**); the secret may not be shown again.

### 7.4 Back in Clerk

Paste the Client ID and Client secret into the Google connection and click **Save**. The page shows an "Unsaved changes" bar until you do. Optionally turn on **Always show account selector prompt** so users with several Google accounts can choose one.

---

## 8. Privacy Policy and Terms pages

Google requires a privacy policy on the authorized domain before the consent screen can be published, and any app collecting emails and phone numbers should have one anyway.

- Pages: `/privacy` and `/terms` (`apps/frontend/src/app/legal/`), linked from the footer and from the sign-up "I agree to the Terms of Service and Privacy Policy" row.
- Contact email and effective date: `apps/frontend/src/utils/legal.ts` (`LEGAL_CONTACT_EMAIL`, `LEGAL_EFFECTIVE_DATE`).
- Both pages are listed in `apps/frontend/public/sitemap.xml`.

When reusing them for another site:

- Update the site name, contact email and effective date.
- Update the list of data collected and the service providers.
- Have the wording reviewed; it was written from the code, not by a lawyer.

The contact address must actually receive mail. To use `support@<domain>` without a mail server, set up Cloudflare **Email → Email Routing** to forward it to an existing inbox.

---

## 9. Environment variables and deployment

Copy the values from Clerk (Production) → **Configure → Developers → API keys**. Ignore the framework names shown there and use these names:

| Clerk shows | Where | Variable | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_…` | `<frontend-host>` build variables (Production) | `VITE_CLERK_PUBLISHABLE_KEY` | Public value. On Cloudflare Pages use type **Text**. Baked in at build time, so **redeploy** after setting it. |
| `CLERK_SECRET_KEY=sk_live_…` | `<backend-host>` environment | `CLERK_SECRET_KEY` | Secret. Never put it in frontend env files or chat. |
| (not shown) | `<backend-host>` environment | `CORS_ALLOWED_ORIGINS` | Must include `https://<domain>,https://www.<domain>`. The backend only accepts Clerk tokens issued for these origins. |

A `pk_live_` key is base64 for `clerk.<domain>$`, which is a quick way to confirm it belongs to the right domain.

> **Never put an `sk_` key in a frontend variable.** On this project, `VITE_CLERK_PUBLISHABLE_KEY` was once set to the `sk_live_…` secret by mistake. Vite baked it into the public JavaScript, and Clerk refused to load, so the Google button stayed disabled. If it happens: create a new secret key in Clerk, delete the old one, put the new one only in the backend, set the frontend variable to the `pk_live_…` key, and redeploy. Then confirm with the check below that the bundle contains only `pk_`.

Deployment order:

1. Run the [database migration](#3-database-migration) on the production database.
2. Deploy the code (push to `main`; Cloudflare Pages and Render build automatically).
3. **Render:** set `CLERK_SECRET_KEY` and check `CORS_ALLOWED_ORIGINS` → **Save changes** (it redeploys).
4. **Cloudflare Pages:** **Workers & Pages → `<project>` → Settings → Variables and Secrets** (Production) → add `VITE_CLERK_PUBLISHABLE_KEY` (Text) → **Save** → **Deployments → latest production → ⋯ → Retry deployment**.

Missing keys fail safely: without the frontend key the Google button is hidden, and without the backend key only Google sign-in returns an error. Email and password login keep working either way.

For the AWS/Helm path (`deploy/helm`): add `CLERK_SECRET_KEY` to the backend secret store, and pass `--build-arg VITE_CLERK_PUBLISHABLE_KEY=...` when building `Dockerfile-Frontend`.

Check which key the live frontend was built with:

```bash
B=$(curl -s https://<domain>/ | grep -o '/assets/index-[^"]*\.js' | head -1)
curl -s "https://<domain>$B" | grep -oE 'pk_(live|test)_[A-Za-z0-9]{6}' | sort -u
```

---

## 10. Testing

Use a private window:

1. `https://<domain>/home?auth=login` → email and password login → lands on `/dashboard`.
2. Log out → **Continue with Google** → choose an account → lands on `/dashboard`.
3. **Sign up with Google** with a new Google account → a new student exists with `signup_method = 'google'`.
4. Sign in with Google using the email of an existing password account → same account; a row appears in `user_auth_identities`.
5. Clerk **Overview** checklist shows the first production user.

Automated checks (all run in the PR workflow):

```bash
yarn install --immutable
yarn ui:build && yarn backend:build
npx vitest run --config apps/backend/vitest.config.ts
npx nx run @compitative-exams/frontend:test
```

---

## 11. Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| No Google button | `VITE_CLERK_PUBLISHABLE_KEY` missing at build time | Set it on the frontend host and **redeploy** |
| Google button shown but greyed out | Clerk failed to load: the frontend variable holds an invalid key (for example an `sk_` secret) | Use the `pk_` key, redeploy, and replace the secret key if it was exposed |
| "Google sign-in is not configured" (503 from `/auth/clerk-login`) | Backend has no `CLERK_SECRET_KEY` | Set it in the **backend** env (not the frontend) and restart |
| "Invalid Google sign-in session" (401) | Site origin not in `CORS_ALLOWED_ORIGINS`, or a test/live key mismatch between frontend and backend | Add the exact origin; use matching `pk_*`/`sk_*` from the same Clerk instance |
| Google shows `redirect_uri_mismatch` | Redirect URI in Google Cloud differs from Clerk's | Copy it again from Clerk exactly |
| Google shows "app not verified" or blocks non-test users | Consent screen still in **Testing** | Branding: home page + privacy policy → **Publish app** |
| **Publish app** greyed out | Branding incomplete | Add the home page and privacy policy links on `<domain>`, then Save |
| Clerk domain won't verify | A CNAME is proxied or mistyped | Set **DNS only** and copy targets exactly; check with `dig` |
| "Google account email is not verified" | Clerk user's primary email unverified | Expected; the backend only trusts verified emails |
| "Account is not active" | User is suspended or deleted in `users` | Reactivate in admin if appropriate |
| `/auth/refresh` 401 in logs | Normal when nobody is signed in | No action |

---

## 12. File index

| Area | Files |
| --- | --- |
| Backend auth | `apps/backend/src/app/features/auth/{auth.service.ts, auth.controller.ts, auth.config.ts, auth.module.ts, clerk-identity.service.ts, dto/auth.dto.ts}` |
| Backend tests | `apps/backend/src/app/features/auth/auth.service.clerk-login.spec.ts` |
| Migration | `apps/backend/database/migrations/20261003_user_auth_identities.sql` |
| Shared types | `packages/shared-utility/src/lib/types/auth.ts` (`signup_method`, `has_password`, `auth_methods`) |
| Frontend Clerk | `apps/frontend/src/utils/clerk.ts`, `apps/frontend/src/providers/ClerkRouterProvider.tsx` |
| Frontend login | `apps/frontend/src/components/login/{AuthModal, Login, LoginFields, GoogleSignInButton, GoogleSsoCallback}.tsx` |
| Legal pages | `apps/frontend/src/app/legal/*`, `apps/frontend/src/utils/legal.ts` |
| Deploy | `Dockerfile-Frontend` (build arg), `deploy/helm/compitative-exams/README.md` |
| Related doc | [user-authentication-security.md](./user-authentication-security.md) (email/password auth, OTP, rate limits) |
