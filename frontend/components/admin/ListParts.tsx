'use client';

/** Shared pieces of the enquiry and application lists (status tabs, pager, skeleton, empty state). */

export function StatusTabs({ tabs, counts, value, onChange }: { tabs: readonly (readonly [string, string])[]; counts: Record<string, number>; value: string; onChange: (v: string) => void }) {
  return (
    <div className="tabs" role="group" aria-label="Filter by status">
      <button type="button" className="tabbtn" aria-pressed={value === ''} onClick={() => onChange('')}>
        All<span>{counts.all ?? 0}</span>
      </button>
      {tabs.map(([k, label]) =>
        k === 'spam' && !counts.spam ? null : (
          <button key={k} type="button" className="tabbtn" aria-pressed={value === k} onClick={() => onChange(k)}>
            {label}
            <span>{counts[k] ?? 0}</span>
          </button>
        ),
      )}
    </div>
  );
}

export function Pager({ page, pages, total, per, onPage }: { page: number; pages: number; total: number; per: number; onPage: (p: number) => void }) {
  const first = total ? (page - 1) * per + 1 : 0;
  return (
    <nav aria-label="Pagination" className="pager">
      <span>
        Showing {first}–{Math.min(total, page * per)} of {total}
      </span>
      <div>
        <button type="button" onClick={() => onPage(Math.max(1, page - 1))} disabled={page <= 1}>
          ← Previous
        </button>
        <button type="button" onClick={() => onPage(page + 1)} disabled={page >= pages}>
          Next →
        </button>
      </div>
    </nav>
  );
}

export function Skeleton({ label }: { label: string }) {
  return (
    <div role="status" className="adm-panel adm-pad" style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <span className="sr-only">{label}</span>
      {['92%', '78%', '86%', '64%', '81%'].map((w) => (
        <div key={w} className="skel" style={{ height: 18, width: w }} />
      ))}
    </div>
  );
}

export function Empty({ filtered, none, onClear }: { filtered: boolean; none: string; onClear: () => void }) {
  return (
    <div className="empty">
      <p>{filtered ? 'Nothing matches these filters.' : none}</p>
      {filtered && (
        <button type="button" className="abtn abtn--line" style={{ marginTop: 14 }} onClick={onClear}>
          Clear filters
        </button>
      )}
    </div>
  );
}
