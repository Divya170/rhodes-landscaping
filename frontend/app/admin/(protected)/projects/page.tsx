'use client';
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useState } from 'react';
import { api, ClientApiError } from '@/lib/client-api';
import { useDebounced } from '@/lib/hooks';
import type { AdminProject, Opt } from '@/lib/types';
import { AdminHeader, ConfirmDialog, EmptyBox, ErrorBox, Field, ImageField, LoadingRows, Modal, StatusTag } from '@/components/admin/ui';
import { useAdmin } from '@/components/admin/AdminContext';

type Form = {
  category: string; title: string; description: string; image: string; imageAlt: string; imageBrief: string; ratio: string; location: string;
  beforeImage: string; afterImage: string; featured: boolean; illustrative: boolean; published: boolean;
};
const EMPTY: Form = { category: '', title: '', description: '', image: '', imageAlt: '', imageBrief: '', ratio: '4/5', location: '', beforeImage: '', afterImage: '', featured: false, illustrative: false, published: true };
const RATIOS = [
  ['4/5', 'Portrait 4:5'],
  ['3/2', 'Landscape 3:2'],
  ['1/1', 'Square 1:1'],
  ['5/4', 'Landscape 5:4'],
];

const toForm = (p: AdminProject): Form => ({
  category: p.category, title: p.title, description: p.description, image: p.image || '', imageAlt: p.imageAlt, imageBrief: p.imageBrief, ratio: p.ratio,
  location: p.location, beforeImage: p.beforeImage || '', afterImage: p.afterImage || '', featured: p.featured, illustrative: p.illustrative, published: p.published,
});

/** Mirrors backend validateProject for instant feedback (the API re-validates). */
function check(f: Form) {
  const e: Record<string, string> = {};
  if (!f.category) e.category = 'Choose the service this project belongs to.';
  if (f.title.trim().length < 2) e.title = 'Enter a project title.';
  if (f.description.length > 1000) e.description = 'Use 1,000 characters or fewer.';
  if (f.image && !f.imageAlt.trim()) e.imageAlt = 'Describe the photo for screen-reader users.';
  if (!!f.beforeImage !== !!f.afterImage) e[f.beforeImage ? 'afterImage' : 'beforeImage'] = 'Add both a before and an after photo, or neither.';
  if (f.published && f.description.trim().length < 20) e.description = 'Add a description (at least 20 characters) before publishing.';
  return e;
}

export default function ProjectsAdminPage() {
  const { toast } = useAdmin();
  const [items, setItems] = useState<AdminProject[] | null>(null);
  const [cats, setCats] = useState<Opt[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const dq = useDebounced(q, 300);
  const [edit, setEdit] = useState<{ id?: number; form: Form } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState<AdminProject | null>(null);

  const load = useCallback(() => {
    setError('');
    const p = new URLSearchParams({ q: dq, category, status });
    for (const [k, v] of Array.from(p.entries())) if (!v) p.delete(k);
    api<{ items: AdminProject[]; total: number; categories: Opt[] }>(`/admin/projects?${p}`, { admin: true })
      .then((r) => {
        setItems(r.items);
        setCats(r.categories);
        setTotal(r.total);
      })
      .catch((e: ClientApiError) => setError(e.message));
  }, [dq, category, status]);
  useEffect(load, [load]);

  const filtered = !!(dq || category || status);
  const setF = <K extends keyof Form>(k: K, v: Form[K]) => setEdit((e) => (e ? { ...e, form: { ...e.form, [k]: v } } : e));

  const save = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!edit) return;
    const fe = check(edit.form);
    setErrors(fe);
    if (Object.keys(fe).length) {
      document.getElementById(`p-${Object.keys(fe)[0]}`)?.focus();
      return;
    }
    setSaving(true);
    const f = edit.form;
    const body = { ...f, image: f.image || null, beforeImage: f.beforeImage || null, afterImage: f.afterImage || null };
    try {
      if (edit.id) await api(`/admin/projects/${edit.id}`, { method: 'PATCH', admin: true, body });
      else await api('/admin/projects', { method: 'POST', admin: true, body });
      toast(edit.id ? 'Project saved.' : 'Project added.');
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

  const patch = async (p: AdminProject, body: Partial<Form>, msg: string) => {
    try {
      await api(`/admin/projects/${p.id}`, { method: 'PATCH', admin: true, body });
      toast(msg);
      load();
    } catch (e) {
      const ce = e as ClientApiError;
      toast(Object.values(ce.errors)[0] || ce.message, true);
    }
  };

  const move = async (i: number, dir: -1 | 1) => {
    if (!items || filtered) return;
    const next = [...items];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    setItems(next);
    try {
      setItems(await api<AdminProject[]>('/admin/projects/reorder', { method: 'POST', admin: true, body: { ids: next.map((x) => x.id) } }));
    } catch (e) {
      toast((e as ClientApiError).message, true);
      load();
    }
  };

  const f = edit?.form;
  const text = (k: keyof Form, label: string, max: number, help?: string) => (
    <Field id={`p-${k}`} label={label} error={errors[k]} help={help}>
      <input id={`p-${k}`} className="control" maxLength={max} value={String(f?.[k] ?? '')} onChange={(e) => setF(k, e.target.value as never)} aria-invalid={errors[k] ? true : undefined} />
    </Field>
  );

  return (
    <>
      <AdminHeader eyebrow="CONTENT" title="Projects">
        <button
          type="button"
          className="abtn"
          disabled={!cats.length}
          onClick={() => {
            setErrors({});
            setEdit({ form: { ...EMPTY, category: cats[0]?.value || '' } });
          }}
        >
          + Add project
        </button>
      </AdminHeader>
      <p className="alert-info">
        Published projects appear in the gallery (filterable by service), under “Related projects” on the Services page, and — when marked featured — in the home page band (first three). Use only real, approved project photography; projects marked
        “Illustrative concept” show that label publicly. The before/after slider appears only when both a before and an after photo are set.
      </p>
      <div className="adm-filters" style={{ marginTop: 0, marginBottom: 16 }}>
        <div className="field wide">
          <label htmlFor="pq">Search title or description</label>
          <input id="pq" type="search" className="control" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="pc">Service</label>
          <select id="pc" className="control" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All services</option>
            {cats.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="ps">Status</label>
          <select id="ps" className="control" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            <option value="published">Published</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>
      </div>
      <div className="adm-panel">
        {error ? (
          <ErrorBox message={error} onRetry={load} />
        ) : !items ? (
          <LoadingRows />
        ) : items.length === 0 ? (
          <EmptyBox>
            {filtered ? (
              <>
                Nothing matches these filters.{' '}
                <button
                  type="button"
                  className="textbtn"
                  onClick={() => {
                    setQ('');
                    setCategory('');
                    setStatus('');
                  }}
                >
                  Clear filters
                </button>
              </>
            ) : total === 0 ? (
              'No projects yet. The gallery shows “Approved projects will appear here.” until you add one.'
            ) : (
              'No projects.'
            )}
          </EmptyBox>
        ) : (
          items.map((p, i) => (
            <div key={p.id} className={`item-row${p.published ? '' : ' is-draft'}`}>
              {p.image ? <img src={p.image} alt="" className="thumb" /> : <span className="thumb" style={{ display: 'inline-block' }} />}
              <div className="col min0" style={{ flex: '1 1 240px', gap: 2 }}>
                <strong>{p.title}</strong>
                <span className="small" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.categoryLabel} · {p.ratio}
                  {p.location ? ` · ${p.location}` : ''}
                  {p.beforeImage && p.afterImage ? ' · before/after' : ''}
                </span>
              </div>
              <div className="flex-wrap" style={{ gap: 6 }}>
                {p.featured && <StatusTag kind="new">Featured</StatusTag>}
                {p.illustrative && <span className="st st--sample">Illustrative</span>}
                <StatusTag kind={p.published ? 'ok' : 'draft'}>{p.published ? 'Published' : 'Hidden'}</StatusTag>
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                <button type="button" className="iconbtn" aria-label={`Move ${p.title} up`} disabled={filtered || i === 0} title={filtered ? 'Clear filters to reorder' : undefined} onClick={() => move(i, -1)}>
                  ↑
                </button>
                <button type="button" className="iconbtn" aria-label={`Move ${p.title} down`} disabled={filtered || i === items.length - 1} title={filtered ? 'Clear filters to reorder' : undefined} onClick={() => move(i, 1)}>
                  ↓
                </button>
                <button type="button" className="iconbtn" onClick={() => patch(p, { featured: !p.featured }, p.featured ? 'Removed from the home page.' : 'Featured on the home page.')}>
                  {p.featured ? 'Unfeature' : 'Feature'}
                </button>
                <button type="button" className="iconbtn" onClick={() => patch(p, { published: !p.published }, p.published ? `${p.title} hidden.` : `${p.title} published.`)}>
                  {p.published ? 'Hide' : 'Publish'}
                </button>
                <button
                  type="button"
                  className="iconbtn"
                  onClick={() => {
                    setErrors({});
                    setEdit({ id: p.id, form: toForm(p) });
                  }}
                >
                  Edit
                </button>
                <button type="button" className="iconbtn iconbtn--danger" onClick={() => setDel(p)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {edit && f && (
        <Modal title={edit.id ? `Edit — ${f.title || 'project'}` : 'Add project'} onClose={() => setEdit(null)}>
          <form onSubmit={save} noValidate className="adm-form">
            <div className="grid-fit" style={{ ['--min' as string]: '220px', ['--gap' as string]: '16px' }}>
              {text('title', 'Title *', 120)}
              <Field id="p-category" label="Service *" error={errors.category}>
                <select id="p-category" className="control" value={f.category} onChange={(e) => setF('category', e.target.value)}>
                  {cats.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field id="p-description" label="Short verified description *" error={errors.description} help={`${f.description.length} / 1000`}>
              <textarea id="p-description" className="control" rows={4} maxLength={1000} value={f.description} onChange={(e) => setF('description', e.target.value)} />
            </Field>
            <ImageField id="p-image" label="Photograph" value={f.image} onChange={(v) => setF('image', v)} error={errors.image} />
            <div className="grid-fit" style={{ ['--min' as string]: '220px', ['--gap' as string]: '16px' }}>
              {text('imageAlt', 'Photo alt text', 200)}
              {text('imageBrief', 'Photo brief (placeholder label)', 200, 'Shown until a photograph is added.')}
            </div>
            <div className="grid-fit" style={{ ['--min' as string]: '220px', ['--gap' as string]: '16px' }}>
              <Field id="p-ratio" label="Gallery tile shape">
                <select id="p-ratio" className="control" value={f.ratio} onChange={(e) => setF('ratio', e.target.value)}>
                  {RATIOS.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </Field>
              {text('location', 'Location (verified only)', 120, 'e.g. “Anaheim Hills”. Leave empty if not confirmed.')}
            </div>
            <div className="grid-fit" style={{ ['--min' as string]: '260px', ['--gap' as string]: '16px' }}>
              <ImageField id="p-beforeImage" label="Before photo (optional pair)" value={f.beforeImage} onChange={(v) => setF('beforeImage', v)} error={errors.beforeImage} />
              <ImageField id="p-afterImage" label="After photo (optional pair)" value={f.afterImage} onChange={(v) => setF('afterImage', v)} error={errors.afterImage} />
            </div>
            <label className="adm-check">
              <input type="checkbox" checked={f.featured} onChange={(e) => setF('featured', e.target.checked)} />
              Featured on the home page (first three featured projects are shown)
            </label>
            <label className="adm-check">
              <input type="checkbox" checked={f.illustrative} onChange={(e) => setF('illustrative', e.target.checked)} />
              Illustrative concept (not completed work — the label is shown publicly)
            </label>
            <label className="adm-check">
              <input type="checkbox" checked={f.published} onChange={(e) => setF('published', e.target.checked)} />
              Published (visible in the gallery)
            </label>
            <div className="adm-actions">
              <button type="submit" className="abtn" disabled={saving}>
                {saving ? 'Saving…' : 'Save project'}
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
          title="Delete project?"
          message={`“${del.title}” will be removed from the gallery. To keep it but take it off the site, use Hide instead.`}
          onCancel={() => setDel(null)}
          onConfirm={async () => {
            try {
              await api(`/admin/projects/${del.id}`, { method: 'DELETE', admin: true });
              toast('Project deleted.');
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
