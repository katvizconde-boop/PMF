"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewTemplateButton() {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function create() {
    const name = prompt("Template name?");
    if (!name) return;
    const type = (prompt("Type? (REGULAR or PROBATIONARY)", "REGULAR") || "REGULAR").toUpperCase();
    setBusy(true);
    const res = await fetch("/api/templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, type }) });
    setBusy(false);
    if (res.ok) {
      const { id } = await res.json();
      router.push(`/templates/${id}`);
    } else alert("Failed: " + (await res.text()));
  }
  return <button className="btn btn-primary" onClick={create} disabled={busy}>+ New Template</button>;
}
