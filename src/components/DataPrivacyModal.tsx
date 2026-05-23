"use client";
import { useState } from "react";

export function DataPrivacyContent() {
  return (
    <div className="prose-sm space-y-3 text-sm text-gray-700 leading-relaxed">
      <p>
        At <strong>SevenGen</strong>, your privacy is non-negotiable. This Performance Management Form
        (PMF) system handles personal and performance data with the same care you'd expect for your own
        confidential records. By using this app, you acknowledge the following.
      </p>

      <div>
        <h4 className="font-bold text-gray-900 mt-3 mb-1">📦 What we collect</h4>
        <ul className="list-disc ml-5 space-y-0.5">
          <li>Profile data (name, email, position, hire date, photo)</li>
          <li>Performance ratings, justifications, and comments you submit</li>
          <li>Goals, signatures, 1:1 notes, kudos, and uploaded documents</li>
          <li>Login activity and audit events (for security and compliance)</li>
        </ul>
      </div>

      <div>
        <h4 className="font-bold text-gray-900 mt-3 mb-1">👁️ Who can see your data</h4>
        <ul className="list-disc ml-5 space-y-0.5">
          <li><strong>You:</strong> Full access to all your own records.</li>
          <li><strong>Your direct manager:</strong> Only your evaluations — never another colleague's.</li>
          <li><strong>HR Admin:</strong> Company-wide access for evaluation review and labor compliance.</li>
          <li><strong>Other employees:</strong> Cannot see your evaluations under any circumstance.</li>
        </ul>
      </div>

      <div>
        <h4 className="font-bold text-gray-900 mt-3 mb-1">🔒 How we protect your data</h4>
        <ul className="list-disc ml-5 space-y-0.5">
          <li>Encrypted in transit (HTTPS / TLS 1.3) and at rest in the cloud database</li>
          <li>Database hosted in <strong>Singapore</strong> (Asia region — within ASEAN data residency)</li>
          <li>Role-based access control on every API request, server-side enforced</li>
          <li>Every view, edit, and download is logged in an append-only audit trail</li>
          <li>Passwords stored using bcrypt hashing — never plaintext</li>
        </ul>
      </div>

      <div>
        <h4 className="font-bold text-gray-900 mt-3 mb-1">📜 Your rights (DPA / Republic Act 10173)</h4>
        <ul className="list-disc ml-5 space-y-0.5">
          <li><strong>Right to access</strong> — Request a copy of all your data anytime via HR.</li>
          <li><strong>Right to correct</strong> — Update inaccurate info in My Profile or via HR.</li>
          <li><strong>Right to erasure</strong> — Request deletion when you leave the company.</li>
          <li><strong>Right to object</strong> — Withdraw consent for any optional processing.</li>
        </ul>
      </div>

      <div>
        <h4 className="font-bold text-gray-900 mt-3 mb-1">⚠️ Important notes</h4>
        <ul className="list-disc ml-5 space-y-0.5">
          <li>Your <strong>self-rating is yours alone</strong> — your manager cannot edit it.</li>
          <li>Submissions are <strong>locked once submitted</strong>. Changes require HR re-open.</li>
          <li>Digital signatures are legally binding — equivalent to ink on paper.</li>
          <li>AI assistance (when used) processes your data via Anthropic's Claude API. No data is used to train models.</li>
        </ul>
      </div>

      <div>
        <h4 className="font-bold text-gray-900 mt-3 mb-1">📞 Contact our Data Protection Officer</h4>
        <p>Questions, concerns, or requests? Email <strong>dpo@sevengen.com</strong> or your HR contact.</p>
      </div>

      <p className="text-xs text-gray-500 italic mt-4">
        Last updated: May 2026 · Compliant with the Philippine Data Privacy Act of 2012 (RA 10173)
      </p>
    </div>
  );
}

/** Standalone modal trigger (e.g. footer link). */
export function DataPrivacyButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="text-xs text-gray-500 hover:text-primary-600 underline">
        🔒 Data Privacy Policy
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-primary-600 to-blue-500 text-white p-5 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold">🔒 Data Privacy Policy</h2>
                <p className="text-sm text-blue-100 mt-1">How we protect your information.</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white text-xl">✕</button>
            </div>
            <div className="overflow-y-auto p-6"><DataPrivacyContent /></div>
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button onClick={() => setOpen(false)} className="btn btn-primary text-sm">Got it</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
