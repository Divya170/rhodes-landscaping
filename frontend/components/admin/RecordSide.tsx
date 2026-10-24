'use client';

import { useState } from 'react';

/** Status + internal notes side panel used by the enquiry and application detail pages. */
export function RecordSide({
  status,
  statuses,
  notes,
  onSave,
}: {
  status: string;
  statuses: readonly (readonly [string, string])[];
  notes: string;
  onSave: (body: { status?: string; notes?: string }) => Promise<string | void>;
}) {
  const [draft, setDraft] = useState(status);
  const [n, setN] = useState(notes);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState<'' | 'status' | 'notes'>('');
  const save = async (kind: 'status' | 'notes') => {
    setBusy(kind);
    try {
      const m = await onSave(kind === 'status' ? { status: draft } : { notes: n });
      if (kind === 'status') setMsg(m || 'Status updated.');
    } finally {
      setBusy('');
    }
  };
  return (
    <>
      <form
        className="sidebox"
        onSubmit={(e) => {
          e.preventDefault();
          if (draft !== status) save('status');
        }}
      >
        <label htmlFor="st" className="h-card">
          Update status
        </label>
        <select
          id="st"
          className="control"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setMsg('');
          }}
        >
          {statuses.map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </select>
        <button type="submit" className="abtn" disabled={draft === status || busy === 'status'}>
          {busy === 'status' ? 'Saving…' : 'Save status'}
        </button>
        <div role="status" aria-live="polite">
          {msg && <p className="okmsg">{msg}</p>}
        </div>
        <p className="fine">Internal workflow status. Not shown to the sender.</p>
      </form>
      <form
        className="sidebox"
        onSubmit={(e) => {
          e.preventDefault();
          save('notes');
        }}
      >
        <label htmlFor="notes" className="h-card">
          Internal notes
        </label>
        <textarea id="notes" className="control" maxLength={5000} value={n} onChange={(e) => setN(e.target.value)} />
        <button type="submit" className="abtn abtn--line" disabled={n === notes || busy === 'notes'}>
          {busy === 'notes' ? 'Saving…' : 'Save notes'}
        </button>
      </form>
    </>
  );
}
