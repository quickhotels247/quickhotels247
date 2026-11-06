# QuickHotels registration with Clerk

New registrations use Clerk for passwords, email verification codes, email delivery,
and account recovery. The frontend does not call the SMTP OTP endpoints.

The signup steps are details → password → email verification. QuickHotels first checks
that the email and username are available. Clerk creates the signup attempt and
sends the verification code. After verification, the browser activates the Clerk
session and goes to `/sso-callback/complete`. The backend verifies the Clerk token
and exchanges it for a QuickHotels session at `POST /api/auth/oauth/clerk`.

The backend stores the stable Clerk user ID in `users.clerk_user_id`. Migration
`007_restore_clerk_user_id.sql` restores this column after migration 005 removed
it, and backfills unambiguous existing social links. Run all database migrations
before deploying the backend. Email-only accounts do not
need a Google identity. Their QuickHotels username is collected as signup metadata,
validated on the server, and made unique if another signup claims it first.
Metadata is never used as proof of email ownership.

## Configuration

- Frontend: `VITE_CLERK_PUBLISHABLE_KEY` at build time.
- Backend: matching `CLERK_SECRET_KEY` from the same Clerk instance.
- Backend: `CORS_ORIGINS` must contain the exact frontend origins, including
  `https://quickhotels247.com` and `https://www.quickhotels247.com` when both are served.
- Clerk: enable email signup, email verification codes, password signup and sign-in,
  and optional first/last names. Google is the only social sign-in.
- Clerk password rules are authoritative; errors from Clerk appear in the form.
- SMTP variables are unnecessary for the new registration UI. The old backend OTP
  routes remain for compatibility but are not used by this UI.

Production and development Clerk users are separate. Local development should use
matching test keys; production should use matching live keys. Deploy the backend
before the frontend, since the new frontend calls `/api/auth/signup/check`.

## Sign-in

The login form is our own UI built on Clerk's sign-in API (no Clerk widget, so no
Clerk branding). It offers Google, or email and password. If Clerk asks for an
emailed code (a new device), the form shows the code step. "Forgot password?"
resets the Clerk password with an emailed code. On success the browser goes to
`/sso-callback/complete`, where the backend exchanges the Clerk token for a
QuickHotels session.

The backend's own password login (`POST /api/auth/login`) and the Settings
password card still exist but aren't reachable from the login form. They'll be
removed or rebuilt in the Next.js app (roadmap step 4).

## Verification before release

1. Register a fresh email: enter details and password, receive the Clerk code,
   verify it, and reach the dashboard.
2. Sign out and sign in with the same email through the standard form.
3. Check wrong codes, resend, expired codes, password-policy errors, and recovery.
4. Confirm Google login and signup still reach the dashboard.
5. Log in on a new browser and complete the emailed-code step if Clerk asks for it.
6. Use "Forgot password?", reset with the emailed code, and reach the dashboard.

Live inbox delivery and complete browser authentication require real test accounts;
unit tests do not prove those production behaviors.

Clerk reference: https://clerk.com/docs/guides/development/custom-flows/authentication/email-password
