// A person's PAN: 5 letters, 4 digits, 1 letter; the 4th letter is P (an
// individual) and the 5th is the first letter of their surname (we also
// accept the first name's, in case the names were entered the other way
// round). TripJack rejects a booking with any other PAN, after payment.
export function panProblem(pan: string, firstName: string, lastName: string): string | null {
  const value = pan.trim().toUpperCase();
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(value)) return "PAN must be 10 characters, like ABCPK1234D.";
  if (value[3] !== "P") return "This isn't a personal PAN: its 4th letter must be P. Check the guest's PAN card.";
  const initials = [lastName, firstName].map((name) => name.trim().charAt(0).toUpperCase()).filter(Boolean);
  if (initials.length && !initials.includes(value[4]!)) {
    return `The 5th letter of a PAN is the first letter of the surname (${initials[0]}). Check the PAN and the name as on the PAN card.`;
  }
  return null;
}
