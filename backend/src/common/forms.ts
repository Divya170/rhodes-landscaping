/**
 * Shared, framework-free helpers for the public estimate form.
 * Patterns and messages are the design's own; unit-tested in rules.spec.ts.
 */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Anaheim, CA — used for admin timestamps. */
export const TZ = 'America/Los_Angeles';

const str = (v: unknown) => (v === null || v === undefined ? '' : String(v));

/** Strip control characters (keep newlines when multiline), normalise line endings, trim. */
export const tidy = (v: unknown, multiline = false) =>
  str(v)
    .replace(multiline ? /[\u0000-\u0009\u000B\u000C\u000E-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\r\n?/g, '\n')
    .trim();

/** Single-line value with internal whitespace collapsed. */
export const line = (v: unknown) => tidy(v).replace(/\s+/g, ' ');

export const digits = (v: unknown) => str(v).replace(/\D/g, '');

/** Design check(): only + digits spaces ( ) . - with 10–15 digits. */
export const phoneOk = (v: string) => {
  const d = digits(v);
  return /^[+\d\s().-]+$/.test(v) && d.length >= 10 && d.length <= 15;
};

/** Honeypot field `website` (hidden from people). */
export const isHoneypot = (v: unknown) => str(v).trim() !== '';

/** CSV cell, quoted, with spreadsheet-formula injection neutralised. */
export function csvSafe(v: unknown): string {
  let x = v === null || v === undefined ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(x)) x = `'${x}`;
  return `"${x.replace(/"/g, '""')}"`;
}

/** Public reference shown on the success panel: RL-1001, RL-1002, … */
export const publicRef = (id: number) => `RL-${1000 + id}`;

/** Lead statuses (Handoff: new / contacted / quoted / closed). */
export const REQUEST_STATUSES = ['new', 'contacted', 'quoted', 'closed'] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];
export const STATUS_LABELS: Record<RequestStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  quoted: 'Quoted',
  closed: 'Closed',
};

/** Idempotency-Key header: printable, 8–200 chars, else ignored. */
export const cleanIdemKey = (v: unknown) => {
  const s = str(Array.isArray(v) ? v[0] : v).trim();
  return /^[\x21-\x7e]{8,200}$/.test(s) ? s : null;
};
