// Creates an admin account, or sets a new password for an existing one.
// Usage: yarn workspace @quickhotels/backend db:create-admin <email> "<name>"
// The password is asked for (hidden), or read from ADMIN_PASSWORD.
import { randomBytes, scrypt } from "node:crypto";
import { createInterface } from "node:readline";
import { promisify } from "node:util";
import pg from "pg";

const [email, ...nameParts] = process.argv.slice(2);
const name = nameParts.join(" ").trim();
if (!email || !email.includes("@") || !name) {
  console.error('Usage: yarn workspace @quickhotels/backend db:create-admin <email> "<name>"');
  process.exit(1);
}

const password = process.env.ADMIN_PASSWORD ?? (await askHidden("Password: "));
if (password.length < 12) {
  console.error("Use a password of at least 12 characters.");
  process.exit(1);
}

// Same format as src/app/features/auth/password-hash.ts.
const salt = randomBytes(16);
const hash = await promisify(scrypt)(password, salt, 64);
const passwordHash = `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;

// The direct (non-pooled) connection, like migrations; DATABASE_URL works too.
const client = new pg.Client({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
await client.connect();
try {
  const { rows } = await client.query(
    `INSERT INTO admin_users (email, name, password_hash) VALUES ($1, $2, $3)
     ON CONFLICT (lower(email)) DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash
     RETURNING (xmax = 0) AS created`,
    [email.trim(), name, passwordHash],
  );
  // A new password signs the admin out everywhere.
  if (!rows[0].created) {
    await client.query(
      `UPDATE admin_tokens SET revoked_at = now()
       WHERE revoked_at IS NULL
         AND admin_id = (SELECT id FROM admin_users WHERE lower(email) = lower($1))`,
      [email.trim()],
    );
  }
  console.log(rows[0].created ? `Created admin ${email}` : `Updated admin ${email}`);
} finally {
  await client.end();
}

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (text) => {
      if (text.includes(question)) process.stdout.write(text);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}
