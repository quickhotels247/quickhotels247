// Where staff hear about things: SUPPORT_EMAIL, else the sending address.
export function supportInbox(): string | null {
  const configured = process.env.SUPPORT_EMAIL?.trim();
  if (configured) return configured;
  const from = process.env.MAIL_FROM ?? "";
  return /<([^>]+)>/.exec(from)?.[1] ?? (from.includes("@") ? from.trim() : null);
}
