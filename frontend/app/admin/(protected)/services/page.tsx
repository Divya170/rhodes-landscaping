'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, ClientApiError } from '@/lib/client-api';
import type { AdminService } from '@/lib/types';
import { AdminHeader, ConfirmDialog, EmptyBox, ErrorBox, Field, ImageField, LoadingRows, Modal, StatusTag } from '@/components/admin/ui';
import { useAdmin } from '@/components/admin/AdminContext';

type Form = {
  name: string; slug: string; summary: string; description: string; benefits: string; includes: string; ctaLabel: string;
  image: string; homeImage: string; detailImage: string; detailImage2: string; imageAlt: string; imageBrief: string; published: boolean;
};
const EMPTY: Form = { name: '', slug: '', summary: '', description: '', benefits: '', includes: '', ctaLabel: '', image: '', homeImage: '', detailImage: '', detailImage2: '', imageAlt: '', imageBrief: '', published: true };

const toForm = (s: AdminService): Form => ({
  name: s.name, slug: s.slug, summary: s.summary, description: s.description, benefits: (s.benefits || []).join('\n'), includes: (s.includes || []).join('\n'),
  ctaLabel: s.ctaLabel, image: s.image || '', homeImage: s.homeImage || '', detailImage: s.detailImage || '', detailImage2: s.detailImage2 || '',
  imageAlt: s.imageAlt, imageBrief: s.imageBrief, published: s.published,
});
const lines = (v: string) => v.split('\n').map((x) => x.trim()).filter(Boolean);

/** Mirrors backend validateService for instant feedback (the API re-validates). */
function check(f: Form, isNew: boolean) {
  const e: Record<string, string> = {};
  const len = (k: keyof Form, max: number) => {
    if (String(f[k]).trim().length > max) e[k] = `Use ${max.toLocaleString('en-US')} characters or fewer.`;
  };
  if (f.name.trim().length < 2) e.name = 'Enter a service name.';
  len('name', 80);
  if (isNew && f.slug) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(f.slug)) e.slug = 'Use lowercase letters, numbers and hyphens only.';
    else if (f.slug === 'other') e.slug = '“other” is reserved for the estimate form’s “Other” option.';
  }
  len('summary', 300);
  len('description', 1500);
  len('ctaLabel', 60);
  if (lines(f.benefits).length > 6) e.benefits = 'Use 6 benefits or fewer.';
  if (lines(f.includes).length > 10) e.includes = 'Use 10 items or fewer.';
  if ((f.image || f.homeImage) && !f.imageAlt.trim()) e.imageAlt = 'Describe the photo for screen-reader users.';
  if (f.published && f.summary.trim().length < 10) e.summary = 'Add a short summary (at least 10 characters) before publishing.';
  if (f.published && f.description.trim().length < 20) e.description = 'Add a description (at least 20 characters) before publishing.';
  return e;
}

export default function ServicesAdminPage() {
  const { toast } = useAdmin();
  const [items, setItems] = useState<AdminService[] | null>(null);
  const [error, setError] = useState('');
  const [edit, setEdit] = useState<{ id?: number; slug?: string; form: Form } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState<AdminService | null>(null);

  const load = useCallback(() => {
    setError('');
    api<AdminService[]>('/admin/services', { admin: true })
      .then(setItems)
      .catch((e: ClientApiError) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const setF = <K extends keyof Form>(k: K, v: Form[K]) => setEdit((e) => (e ? { ...e, form: { ...e.form, [k]: v } } : e));

  const save = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!edit) return;
    const fe = check(edit.form, !edit.id);
    setErrors(fe);
    if (Object.keys(fe).length) {
      document.getElementById(`s-${Object.keys(fe)[0]}`)?.focus();
      return;
    }
    setSaving(true);
    const f = edit.form;
    const body = { ...f, benefits: lines(f.benefits), includes: lines(f.includes), image: f.image || null, homeImage: f.homeImage || null, detailImage: f.detailImage || null, detailImage2: f.detailImage2 || null };
    try {
      if (edit.id) await api(`/admin/services/${edit.id}`, { method: 'PATCH', admin: true, body });
      else await api('/admin/services', { method: 'POST', admin: true, body });
      toast(edit.id ? 'Service saved.' : 'Service added.');
      setEdit(null);
      load();
    } catch (e) {
      const ce = e as ClientApiError;
      setErrors(ce.errors);
      if (!Object.keys(ce.errors).length) toast(ce.message, true);
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (s: AdminService) => {
    try {
      await api(`/admin/services/${s.id}`, { method: 'PATCH', admin: true, body: { published: !s.published } });
      toast(s.published ? `${s.name} moved to drafts.` : `${s.name} published.`);
      load();
    } catch (e) {
      const ce = e as ClientApiError;
      toast(Object.values(ce.errors)[0] || ce.message, true);
    }
  };

  const move = async (i: number, dir: -1 | 1) => {
    if (!items) return;
    const next = [...items];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    setItems(next);
    try {
      setItems(await api<AdminService[]>('/admin/services/reorder', { method: 'POST', admin: true, body: { ids: next.map((x) => x.id) } }));
    } catch (e) {
      toast((e as ClientApiError).message, true);
      load();
    }
  };

  const f = edit?.form;
  const text = (k: keyof Form, label: string, max: number, help?: string) => (
    <Field id={`s-${k}`} label={label} error={errors[k]} help={help}>
      <input id={`s-${k}`} className="control" maxLength={max} value={String(f?.[k] ?? '')} onChange={(e) => setF(k, e.target.value as never)} aria-invalid={errors[k] ? true : undefined} />
    </Field>
  );
  const area = (k: keyof Form, label: string, max: number, rows = 3, help?: string) => (
    <Field id={`s-${k}`} label={label} error={errors[k]} help={help ?? `${String(f?.[k] ?? '').length} / ${max}`}>
      <textarea id={`s-${k}`} className="control" rows={rows} maxLength={max} value={String(f?.[k] ?? '')} onChange={(e) => setF(k, e.target.value as never)} aria-invalid={errors[k] ? true : undefined} />
    </Field>
  );

  return (
    <>
      <AdminHeader eyebrow="CONTENT" title="Services">
        <button
          type="button"
          className="abtn"
          onClick={() => {
            setErrors({});
            setEdit({ form: { ...EMPTY } });
          }}
        >
          + Add service
        </button>
      </AdminHeader>
      <p className="alert-info">Published services appear on the home page (four staggered features), as numbered sections on the Services page (layouts cycle through the design’s four arrangements), in the sticky service chips, the footer, the gallery filters and the estimate form’s “Project type” (followed by “Other”). Projects are filed under a service.</p>
      <div className="adm-panel">
        {error ? (
          <ErrorBox message={error} onRetry={load} />
        ) : !items ? (
          <LoadingRows />
        ) : items.length === 0 ? (
          <EmptyBox>No services yet. The Services page shows “Service details are being updated” and the estimate form offers only “Other”.</EmptyBox>
        ) : (
          items.map((s, i) => (
            <div key={s.id} className={`item-row${s.published ? '' : ' is-draft'}`}>
              <span className="mono" style={{ fontSize: 12, width: 24, color: 'var(--a-muted)' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              {s.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.image} alt="" className="thumb" />
              ) : (
                <span className="thumb" style={{ display: 'inline-block' }} />
              )}
              <div className="col min0" style={{ flex: '1 1 240px', gap: 2 }}>
                <strong>
                  <span className="mono" style={{ color: 'var(--a-muted)', fontSize: 12, marginRight: 8 }}>{String(i + 1).padStart(2, '0')}</span>
                  {s.name}
                </strong>
                <span className="small" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.summary || 'No summary yet.'}
                </span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--a-muted)' }}>
                  anchor & form value: {s.slug} · {s.benefits.length} benefits · {s.includes.length} “may include” items
                </span>
              </div>
              <StatusTag kind={s.published ? 'ok' : 'draft'}>{s.published ? 'Published' : 'Draft'}</StatusTag>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                <button type="button" className="iconbtn" aria-label={`Move ${s.name} up`} disabled={i === 0} onClick={() => move(i, -1)}>
                  ↑
                </button>
                <button type="button" className="iconbtn" aria-label={`Move ${s.name} down`} disabled={i === items.length - 1} onClick={() => move(i, 1)}>
                  ↓
                </button>
                <button type="button" className="iconbtn" onClick={() => togglePublished(s)}>
                  {s.published ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  type="button"
                  className="iconbtn"
                  onClick={() => {
                    setErrors({});
                    setEdit({ id: s.id, slug: s.slug, form: toForm(s) });
                  }}
                >
                  Edit
                </button>
                <button type="button" className="iconbtn iconbtn--danger" onClick={() => setDel(s)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {edit && f && (
        <Modal title={edit.id ? `Edit — ${f.name || 'service'}` : 'Add service'} onClose={() => setEdit(null)}>
          <form onSubmit={save} noValidate className="adm-form">
            {text('name', 'Name *', 80)}
            {!edit.id && (
              <Field id="s-slug" label="Link value (optional)" error={errors.slug} help="Used in links like /services#planting, /projects/planting and /contact/planting, and stored on each request. Made from the name when empty. Can’t be changed later.">
                <input id="s-slug" className="control" maxLength={40} value={f.slug} autoCapitalize="none" spellCheck={false} onChange={(e) => setF('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))} />
              </Field>
            )}
            {area('summary', 'Home summary (one sentence) *', 300, 2)}
            {area('description', 'Description (Services page) *', 1500, 5)}
            {area('benefits', 'Benefits — one per line (diamond list)', 800, 3, 'Up to 6 short lines.')}
            {area('includes', '“What this may include” — one per line', 1600, 4, 'Up to 10 lines. Empty = accordion hidden.')}
            {text('ctaLabel', 'Estimate button label', 60, 'e.g. “Request a Planting Estimate”. Empty = “Request an Estimate”.')}
            <ImageField id="s-image" label="Main photo (Services page)" value={f.image} onChange={(v) => setF('image', v)} error={errors.image} />
            <ImageField id="s-home" label="Home page photo (empty = main photo)" value={f.homeImage} onChange={(v) => setF('homeImage', v)} error={errors.homeImage} />
            <div className="grid-fit" style={{ ['--min' as string]: '260px', ['--gap' as string]: '16px' }}>
              <ImageField id="s-d1" label="Detail photo 1 (layouts 2 and 4)" value={f.detailImage} onChange={(v) => setF('detailImage', v)} error={errors.detailImage} />
              <ImageField id="s-d2" label="Detail photo 2 (layout 4)" value={f.detailImage2} onChange={(v) => setF('detailImage2', v)} error={errors.detailImage2} />
            </div>
            <div className="grid-fit" style={{ ['--min' as string]: '220px', ['--gap' as string]: '16px' }}>
              {text('imageAlt', 'Photo alt text', 200)}
              {text('imageBrief', 'Photo brief (placeholder label)', 160, 'Shown until a photo is added.')}
            </div>
            <label className="adm-check">
              <input type="checkbox" checked={f.published} onChange={(e) => setF('published', e.target.checked)} />
              Published (visible on the site, in the gallery filters and in the estimate form).
            </label>
            <div className="adm-actions">
              <button type="submit" className="abtn" disabled={saving}>
                {saving ? 'Saving…' : 'Save service'}
              </button>
              <button type="button" className="abtn abtn--line" onClick={() => setEdit(null)}>
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {del && (
        <ConfirmDialog
          title="Delete service?"
          message={`“${del.name}” will be removed from the site and the estimate form. Existing requests and projects keep their value, but projects filed under it disappear from the gallery filters. To hide it for now, use Unpublish instead.`}
          onCancel={() => setDel(null)}
          onConfirm={async () => {
            try {
              await api(`/admin/services/${del.id}`, { method: 'DELETE', admin: true });
              toast('Service deleted.');
              setDel(null);
              load();
            } catch (e) {
              toast((e as ClientApiError).message, true);
            }
          }}
        />
      )}
    </>
  );
}
