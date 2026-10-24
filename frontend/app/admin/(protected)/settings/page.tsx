'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, ClientApiError } from '@/lib/client-api';
import type { AdminSettings } from '@/lib/types';
import { EMAIL_RE } from '@/lib/validation';
import { fmtStamp } from '@/lib/format';
import { AdminHeader, ErrorBox, Field, LoadingRows } from '@/components/admin/ui';
import { useAdmin } from '@/components/admin/AdminContext';

type Form = Omit<AdminSettings, 'updatedAt' | 'email' | 'phone' | 'addressLine1' | 'addressLine2'> & { email: string; phone: string; addressLine1: string; addressLine2: string };

const toForm = (s: AdminSettings): Form => ({
  businessName: s.businessName,
  contactName: s.contactName,
  phone: s.phone || '',
  email: s.email || '',
  addressLine1: s.addressLine1 || '',
  addressLine2: s.addressLine2 || '',
  locationLabel: s.locationLabel,
  tagline: s.tagline,
  aboutLead: s.aboutLead,
  aboutBody: s.aboutBody,
  privacyPolicy: s.privacyPolicy,
  heroStyle: s.heroStyle,
  showReviewNotes: s.showReviewNotes,
  estimatesOpen: s.estimatesOpen,
  photoUploadsOpen: s.photoUploadsOpen,
});

function check(f: Form) {
  const e: Record<string, string> = {};
  if (f.businessName.trim().length < 2) e.businessName = 'Enter the business name.';
  if (f.email.trim() && !EMAIL_RE.test(f.email.trim())) e.email = 'Enter a valid email address, like name@example.com.';
  const d = f.phone.replace(/\D/g, '');
  if (f.phone.trim() && (d.length < 10 || d.length > 15 || /[^\d\s+().-]/.test(f.phone))) e.phone = 'Enter a valid phone number with 10–15 digits, e.g. (714) 555-0123.';
  if (f.aboutLead.length > 600) e.aboutLead = 'Keep the lead paragraph under 600 characters.';
  if (f.aboutBody.length > 3000) e.aboutBody = 'Keep this under 3,000 characters.';
  return e;
}

export default function SettingsPage() {
  const { toast } = useAdmin();
  const [saved, setSaved] = useState<AdminSettings | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const load = useCallback(() => {
    setError('');
    api<AdminSettings>('/admin/settings', { admin: true })
      .then((s) => {
        setSaved(s);
        setForm(toForm(s));
      })
      .catch((e: ClientApiError) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => (f ? { ...f, [k]: v } : f));
    setDone(false);
    if (errors[k as string])
      setErrors((p) => {
        const n = { ...p };
        delete n[k as string];
        return n;
      });
  };

  const dirty = !!(form && saved && JSON.stringify(form) !== JSON.stringify(toForm(saved)));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    const fe = check(form);
    setErrors(fe);
    if (Object.keys(fe).length) return document.getElementById(`st-${Object.keys(fe)[0]}`)?.focus();
    setSaving(true);
    try {
      const s = await api<AdminSettings>('/admin/settings', {
        method: 'PATCH',
        admin: true,
        body: { ...form, email: form.email.trim() || null, phone: form.phone.trim() || null, addressLine1: form.addressLine1.trim() || null, addressLine2: form.addressLine2.trim() || null },
      });
      setSaved(s);
      setForm(toForm(s));
      setDone(true);
      toast('Settings saved.');
    } catch (err) {
      const ce = err as ClientApiError;
      setErrors(ce.errors);
      if (!Object.keys(ce.errors).length) toast(ce.message, true);
    } finally {
      setSaving(false);
    }
  };

  if (error) return <ErrorBox message={error} onRetry={load} />;
  if (!form) return <LoadingRows rows={8} />;

  const text = (k: keyof Form, label: string, opts: { max?: number; help?: string; type?: string } = {}) => (
    <Field id={`st-${k}`} label={label} error={errors[k]} help={opts.help}>
      <input id={`st-${k}`} className="control" type={opts.type || 'text'} maxLength={opts.max || 160} value={String(form[k] ?? '')} onChange={(e) => set(k, e.target.value as never)} aria-invalid={errors[k] ? true : undefined} />
    </Field>
  );
  const area = (k: keyof Form, label: string, max: number, help?: string, rows = 4) => (
    <Field id={`st-${k}`} label={label} error={errors[k]} help={help ?? `${String(form[k]).length.toLocaleString('en-US')} / ${max.toLocaleString('en-US')}`}>
      <textarea id={`st-${k}`} className="control" rows={rows} maxLength={max} value={String(form[k] ?? '')} onChange={(e) => set(k, e.target.value as never)} aria-invalid={errors[k] ? true : undefined} />
    </Field>
  );
  const toggle = (k: 'showReviewNotes' | 'estimatesOpen' | 'photoUploadsOpen', label: string, help: string) => (
    <div>
      <label className="adm-check">
        <input type="checkbox" checked={form[k]} onChange={(e) => set(k, e.target.checked)} />
        {label}
      </label>
      <p className="help" style={{ marginLeft: 30 }}>
        {help}
      </p>
    </div>
  );

  return (
    <>
      <AdminHeader eyebrow="SETTINGS" title="Business & settings">
        {saved && <span className="small">Last saved {fmtStamp(saved.updatedAt)}</span>}
      </AdminHeader>
      <form onSubmit={save} noValidate className="col" style={{ gap: 20, maxWidth: 900 }}>
        <section className="adm-panel adm-pad adm-form" aria-labelledby="st-pub-h">
          <h2 id="st-pub-h" className="adm-section-h">
            Forms &amp; display
          </h2>
          {toggle('estimatesOpen', 'Accept estimate requests online', 'When off, the Contact page asks visitors to call or email and the API rejects new requests.')}
          {toggle('photoUploadsOpen', 'Allow photo uploads on the estimate form', 'Up to 5 JPG, PNG or WebP photos, 10 MB each. Files are stored privately and EXIF data is removed.')}
          {toggle('showReviewNotes', 'Show “Draft / confirm with Easton” notes', 'Dashed review tags next to copy the owner still has to approve. Turn off before launch.')}
          <Field id="st-heroStyle" label="Home hero layout">
            <select id="st-heroStyle" className="control" value={form.heroStyle} onChange={(e) => set('heroStyle', e.target.value as Form['heroStyle'])}>
              <option value="fullbleed">Full-bleed photograph</option>
              <option value="split">Split — text beside photo</option>
            </select>
          </Field>
        </section>

        <section className="adm-panel adm-pad adm-form" aria-labelledby="st-co-h">
          <h2 id="st-co-h" className="adm-section-h">
            Business &amp; contact
          </h2>
          <p className="small" style={{ margin: 0 }}>
            Used in the header, footer, contact page, estimate form and notification emails. Leave a field empty to hide it on the site.
          </p>
          <div className="grid-fit" style={{ ['--min' as string]: '260px', ['--gap' as string]: '18px' }}>
            {text('businessName', 'Business name *', { max: 120 })}
            {text('contactName', 'Owner / contact person', { max: 120 })}
            {text('phone', 'Phone', { type: 'tel', max: 24 })}
            {text('email', 'Email', { type: 'email', max: 160, help: 'Also receives new request emails unless NOTIFY_TO is set.' })}
            {text('addressLine1', 'Address line 1', { max: 160 })}
            {text('addressLine2', 'Address line 2 (city, state, ZIP)', { max: 160 })}
          </div>
          <div className="grid-fit" style={{ ['--min' as string]: '260px', ['--gap' as string]: '18px' }}>
            {text('locationLabel', 'Location label', { max: 60, help: 'e.g. “Anaheim, California” — shown in the hero and footer.' })}
            {text('tagline', 'Footer tagline', { max: 200 })}
          </div>
        </section>

        <section className="adm-panel adm-pad adm-form" aria-labelledby="st-copy-h">
          <h2 id="st-copy-h" className="adm-section-h">
            Page copy &amp; legal
          </h2>
          {area('aboutLead', 'About — lead paragraph', 600, undefined, 3)}
          {area('aboutBody', 'About — “Meet Easton Rhodes” (blank line = new paragraph)', 3000, undefined, 6)}
          {area('privacyPolicy', 'Privacy policy (blank line = new paragraph)', 20000, 'Empty = “The privacy policy is being finalized…”', 8)}
        </section>

        <div className="adm-actions" style={{ position: 'sticky', bottom: 0, padding: '14px 0', background: 'var(--a-bg)' }}>
          <button type="submit" className="abtn" disabled={saving || !dirty}>
            {saving ? 'Saving…' : 'Save settings'}
          </button>
          {dirty && (
            <button type="button" className="abtn abtn--line" onClick={() => saved && setForm(toForm(saved))}>
              Discard changes
            </button>
          )}
          {done && !dirty && (
            <span className="small" role="status">
              ✓ Saved —{' '}
              <a href="/" target="_blank" rel="noreferrer">
                view the site ↗
              </a>
            </span>
          )}
        </div>
      </form>
    </>
  );
}
