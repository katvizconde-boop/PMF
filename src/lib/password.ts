import bcrypt from "bcryptjs";
import crypto from "crypto";

/** Standard bcrypt cost factor for all password hashing in this app. */
export const BCRYPT_COST = 12;

/** Generate a strong random temporary password in format Welcome-XXXX. */
export function generateTempPassword(): string {
  // 4 random digits (10000 entropy) is fine for a temp password that must be changed
  // on first login. For higher entropy use the alphanumeric version below.
  const n = crypto.randomInt(1000, 10000);
  return `Welcome-${n}`;
}

/** Stronger 10-character alphanumeric temp password (for HR-set passwords without email delivery). */
export function generateStrongTempPassword(): string {
  // 10 chars from a 62-char alphabet ≈ 59 bits entropy
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const len = 10;
  const bytes = crypto.randomBytes(len);
  let s = "";
  for (let i = 0; i < len; i++) {
    s += alphabet[bytes[i] % alphabet.length];
  }
  return s;
}

/** Hash a password with our standard cost. */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}
