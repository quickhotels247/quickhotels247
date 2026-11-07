import { buildMime, type MimeMessage } from "../mime.js";

export class MailSendError extends Error {
  constructor(
    message: string,
    // Worth trying again (network, 429, 5xx); false for bad input or revoked access.
    readonly retryable: boolean,
  ) {
    super(message);
  }
}

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";
const TIMEOUT_MS = 15_000;

// Sends through the Gmail API over HTTPS with an OAuth refresh token (the
// account's gmail.send permission). Access tokens are cached until shortly
// before they expire.
export class GmailApiTransport {
  private accessToken: { value: string; expiresAt: number } | null = null;

  constructor(private readonly credentials: { clientId: string; clientSecret: string; refreshToken: string }) {}

  async send(message: MimeMessage): Promise<string> {
    const raw = Buffer.from(buildMime(message), "utf8").toString("base64url");
    let response = await this.post(await this.token(), raw);
    // A token revoked or expired early: get a new one once.
    if (response.status === 401) {
      this.accessToken = null;
      response = await this.post(await this.token(), raw);
    }
    const data = (await response.json().catch(() => ({}))) as { id?: string; error?: { message?: string } };
    if (!response.ok || !data.id) {
      throw new MailSendError(`Gmail API ${response.status}: ${data.error?.message ?? "no message id"}`, response.status === 429 || response.status >= 500);
    }
    return data.id;
  }

  private async post(token: string, raw: string) {
    try {
      return await fetch(SEND_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ raw }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (error) {
      throw new MailSendError(`Gmail API unreachable: ${(error as Error).message}`, true);
    }
  }

  private async token(): Promise<string> {
    if (this.accessToken && this.accessToken.expiresAt > Date.now() + 60_000) return this.accessToken.value;
    let response: Response;
    try {
      response = await fetch(TOKEN_URL, {
        method: "POST",
        body: new URLSearchParams({
          client_id: this.credentials.clientId,
          client_secret: this.credentials.clientSecret,
          refresh_token: this.credentials.refreshToken,
          grant_type: "refresh_token",
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (error) {
      throw new MailSendError(`Google sign-in unreachable: ${(error as Error).message}`, true);
    }
    const data = (await response.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error?: string; error_description?: string };
    if (!response.ok || !data.access_token) {
      // invalid_grant: the refresh token was revoked or expired; needs a new one.
      throw new MailSendError(`Gmail sign-in failed: ${data.error ?? response.status} ${data.error_description ?? ""}`.trim(), response.status >= 500);
    }
    this.accessToken = { value: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 };
    return data.access_token;
  }
}
