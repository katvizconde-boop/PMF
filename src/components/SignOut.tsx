"use client";
import { signOut } from "next-auth/react";
export function SignOut() {
  return <button className="btn-secondary text-xs" onClick={() => signOut({ callbackUrl: "/login" })}>Sign out</button>;
}
