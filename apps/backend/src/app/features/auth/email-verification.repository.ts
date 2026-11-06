import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/database/prisma.service.js";

export interface EmailVerification {
  email: string;
  codeHash: string;
  attempts: number;
  expiresAt: Date;
  lastSentAt: Date;
  verifiedAt: Date | null;
  verificationTokenHash: string | null;
  tokenExpiresAt: Date | null;
}

@Injectable()
export class EmailVerificationRepository {
  constructor(private readonly db: PrismaService) {}

  find(email: string): Promise<EmailVerification | null> {
    return this.db.emailVerification.findUnique({ where: { email } });
  }

  // Starts (or restarts) verification with a fresh code. Returns false when a
  // code was sent less than `cooldownMs` ago (checked atomically, so parallel
  // requests can't all send). Failed attempts carry over to the new code until
  // the old one has expired, so resending doesn't buy more guesses.
  // Raw SQL: Prisma can't express a conditional ON CONFLICT update.
  async upsertCode(email: string, codeHash: string, expiresAt: Date, cooldownMs: number): Promise<boolean> {
    const count = await this.db.$executeRaw`
      INSERT INTO email_verifications AS v (email, code_hash, expires_at)
      VALUES (${email}, ${codeHash}, ${expiresAt})
      ON CONFLICT (email) DO UPDATE SET
        code_hash = EXCLUDED.code_hash,
        expires_at = EXCLUDED.expires_at,
        attempts = CASE WHEN v.expires_at <= now() THEN 0 ELSE v.attempts END,
        last_sent_at = now(),
        verified_at = NULL,
        verification_token_hash = NULL,
        token_expires_at = NULL
      WHERE v.last_sent_at <= now() - (${cooldownMs}::int * interval '1 millisecond')`;
    return count > 0;
  }

  // Uses up one attempt, atomically, so parallel guesses can't exceed the cap.
  // Returns the code to check against, or null when no attempts are left.
  async claimAttempt(
    email: string,
    maxAttempts: number,
  ): Promise<{ codeHash: string; attempts: number; expiresAt: Date } | null> {
    const rows = await this.db.$queryRaw<{ code_hash: string; attempts: number; expires_at: Date }[]>`
      UPDATE email_verifications SET attempts = attempts + 1
      WHERE email = ${email} AND attempts < ${maxAttempts}
      RETURNING code_hash, attempts, expires_at`;
    const row = rows[0];
    return row ? { codeHash: row.code_hash, attempts: row.attempts, expiresAt: row.expires_at } : null;
  }

  async markVerified(email: string, tokenHash: string, tokenExpiresAt: Date) {
    await this.db.emailVerification.updateMany({
      where: { email },
      data: { verifiedAt: new Date(), verificationTokenHash: tokenHash, tokenExpiresAt },
    });
  }

  async delete(email: string) {
    await this.db.emailVerification.deleteMany({ where: { email } });
  }
}
