/** Anaheim, CA */
export const TZ = 'America/Los_Angeles';

/** Admin timestamps, shown in Anaheim time. */
export function fmtStamp(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-US', { timeZone: TZ, month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch {
    return iso;
  }
}

/** Design fmt(): bytes → "820 KB" / "3.4 MB". */
export const fmtSize = (b: number) => (b < 1048576 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1048576).toFixed(1)} MB`);

export const paragraphs = (s: string) =>
  (s || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

/** Lead statuses (Handoff: new / contacted / quoted / closed). */
export const STATUSES = [
  ['new', 'New'],
  ['contacted', 'Contacted'],
  ['quoted', 'Quoted'],
  ['closed', 'Closed'],
] as const;

export const DELIVERY: Record<string, string> = { disabled: 'Not configured', pending: 'Queued', sent: 'Sent', failed: 'Failed' };
