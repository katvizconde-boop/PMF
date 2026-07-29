"use client";
import { useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[AppError]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6 space-y-4">
        <h1 className="text-xl font-bold text-red-800">Something went wrong</h1>
        <p className="text-sm text-gray-700">
          The page couldn&apos;t load. Try the steps below in order.
        </p>
        <ol className="text-sm text-gray-700 list-decimal list-inside space-y-1">
          <li><button onClick={reset} className="text-primary-700 underline">Retry this page</button></li>
          <li><Link href="/dashboard" className="text-primary-700 underline">Go back to Dashboard</Link></li>
          <li>Hard refresh: press <kbd className="px-1 border rounded">Ctrl</kbd>+<kbd className="px-1 border rounded">Shift</kbd>+<kbd className="px-1 border rounded">R</kbd></li>
          <li>
            <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-primary-700 underline">
              Log out and log back in
            </button>
          </li>
          <li>Still stuck? Email <a href="mailto:kat.vizconde@seven-gen.com" className="text-primary-700 underline">kat.vizconde@seven-gen.com</a></li>
        </ol>
        {error?.digest && (
          <p className="text-[10px] text-gray-400 pt-2 border-t border-gray-100">
            Error reference: <code>{error.digest}</code>
          </p>
        )}
      </div>
    </div>
  );
}
