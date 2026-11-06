import type { User } from "@quickhotels/types/users";

interface Contact {
  email: string;
  phoneCode: string;
  phone: string;
}

// Fills a checkout contact from the signed-in account, only where still empty.
// The account phone is stored as "+91 9876543210".
export function fillContact<T extends Contact>(contact: T, user: Pick<User, "email" | "phone">): T {
  const [code, ...rest] = (user.phone ?? "").split(" ");
  const fillPhone = !contact.phone && Boolean(user.phone);
  return {
    ...contact,
    email: contact.email || user.email,
    phoneCode: fillPhone ? code! : contact.phoneCode,
    phone: fillPhone ? rest.join("") : contact.phone,
  };
}
