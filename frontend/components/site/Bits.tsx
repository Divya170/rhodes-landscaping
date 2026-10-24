/** Small shared pieces of the Rhodes design. */

export function Eyebrow({ children, light }: { children: React.ReactNode; light?: boolean }) {
  return <p className={`eyebrow${light ? ' eyebrow--light' : ''}`}>{children}</p>;
}

/** Dashed review tag ("Suggested workflow — confirm with Easton"), shown while Settings → review notes is on. */
export function Note({ show, children, style }: { show: boolean; children: React.ReactNode; style?: React.CSSProperties }) {
  if (!show) return null;
  return (
    <p className="note" style={style}>
      {children}
    </p>
  );
}

/** "Rhodes Landscaping" → ["Rhodes", "Landscaping"] for the typographic wordmark. */
export function wordmark(name: string) {
  const [first, ...rest] = (name || 'Rhodes Landscaping').split(' ');
  return [first, rest.join(' ')] as const;
}

export function Wordmark({ name }: { name: string }) {
  const [a, b] = wordmark(name);
  return (
    <>
      <b>{a}</b>
      {b && <small>{b}</small>}
    </>
  );
}

/** "Easton Rhodes" → "Easton" (used in review notes). */
export const firstName = (n: string) => (n || '').trim().split(/\s+/)[0] || 'the owner';
