'use client';
/* eslint-disable @next/next/no-img-element */

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { api, ClientApiError } from '@/lib/client-api';
import { fmtSize } from '@/lib/format';
import { check, EMPTY, type EstimateForm as Form, type Errors, LABELS, MAX_BYTES, MAX_FILES, newIdemKey, OK_TYPES, validateAll } from '@/lib/validation';
import type { Opt } from '@/lib/types';

type Status = 'idle' | 'loading' | 'error' | 'success';
type Up = { id: string; file: File; name: string; size: string; url: string; pct: number; state: 'uploading' | 'ready' | 'failed'; imageId?: string; error?: string };
type Field = keyof Form;

/**
 * Design estimate form: inline errors after blur, error summary with links, values kept after errors,
 * real photo uploads with progress (POST /api/uploads), loading / failure / success states and the
 * "Edit my details" return path. The API re-validates everything.
 */
export function EstimateForm({
  types,
  areas,
  timelines,
  initialType,
  photosOpen,
  businessName,
  phone,
  telHref,
  email,
  mailHref,
}: {
  types: Opt[];
  areas: string[];
  timelines: string[];
  initialType: string;
  photosOpen: boolean;
  businessName: string;
  phone: string | null;
  telHref: string | null;
  email: string | null;
  mailHref: string | null;
}) {
  const [f, setF] = useState<Form>({ ...EMPTY, projectType: types.some((t) => t.value === initialType) ? initialType : '' });
  const [err, setErr] = useState<Errors>({});
  const [summary, setSummary] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [failMsg, setFailMsg] = useState('');
  const [files, setFiles] = useState<Up[]>([]);
  const [fileErr, setFileErr] = useState<string[]>([]);
  const [fileLive, setFileLive] = useState('');
  const [drag, setDrag] = useState(false);
  const [waitUploads, setWaitUploads] = useState(false);
  const [res, setRes] = useState<{ ref: string; at: string } | null>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const xhrs = useRef<Map<string, XMLHttpRequest>>(new Map());
  const idem = useRef<{ key: string; sig: string } | null>(null);
  const filesRef = useRef<Up[]>([]);
  filesRef.current = files;

  useEffect(
    () => () => {
      xhrs.current.forEach((x) => x.abort());
      filesRef.current.forEach((u) => URL.revokeObjectURL(u.url));
    },
    [],
  );

  const reduce = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scrollTo = (el: HTMLElement | null, offset: number) => {
    if (!el) return;
    el.focus({ preventScroll: true });
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: reduce() ? 'auto' : 'smooth' });
  };

  const setField = (k: Field, v: string) => {
    setF((prev) => ({ ...prev, [k]: v }));
    setErr((e) => {
      if (!e[k]) return e;
      const m = check(k, v);
      const n = { ...e };
      if (m) n[k] = m;
      else delete n[k];
      return n;
    });
  };
  const blur = (k: Field) => {
    const v = f[k];
    if (!(v || '').trim()) return;
    const m = check(k, v);
    setErr((e) => {
      const n = { ...e };
      if (m) n[k] = m;
      else delete n[k];
      return n;
    });
  };
  const focusField = (k: string) => {
    const el = k === 'projectType' ? document.querySelector<HTMLElement>('#fld-type button') : k === 'imageIds' ? document.getElementById('btn-files') : document.getElementById(`fld-${k}`);
    scrollTo(el, 160);
  };

  // ---------- photo uploads ----------
  const upload = (u: Up) => {
    const xhr = new XMLHttpRequest();
    xhrs.current.set(u.id, xhr);
    const patch = (p: Partial<Up>) => setFiles((list) => list.map((x) => (x.id === u.id ? { ...x, ...p } : x)));
    xhr.open('POST', '/api/uploads');
    xhr.responseType = 'json';
    xhr.upload.onprogress = (e) => e.lengthComputable && patch({ pct: Math.min(99, (e.loaded / e.total) * 100) });
    xhr.onload = () => {
      xhrs.current.delete(u.id);
      const body = (xhr.response || {}) as { imageId?: string; errors?: Record<string, string>; message?: string };
      if (xhr.status >= 200 && xhr.status < 300 && body.imageId) {
        patch({ pct: 100, state: 'ready', imageId: body.imageId, error: '' });
        setFileLive(`${u.name} uploaded.`);
      } else {
        const msg = body.errors?.imageIds || body.message || (xhr.status === 429 ? 'Too many uploads — please wait a few minutes.' : 'Could not upload this image.');
        patch({ state: 'failed', error: msg });
        setFileLive(`${u.name} failed to upload.`);
      }
    };
    xhr.onerror = () => {
      xhrs.current.delete(u.id);
      patch({ state: 'failed', error: 'Connection interrupted — retry when you are back online.' });
    };
    const fd = new FormData();
    fd.append('file', u.file, u.name);
    xhr.send(fd);
  };

  const addFiles = (list: FileList | null | undefined) => {
    const errs: string[] = [];
    const add: Up[] = [];
    let count = files.filter((x) => x.state !== 'failed').length;
    Array.from(list || []).forEach((file) => {
      if (!OK_TYPES.includes(file.type)) errs.push(`“${file.name}” isn’t a supported format. Use JPG, PNG, or WebP.`);
      else if (file.size > MAX_BYTES) errs.push(`“${file.name}” is ${(file.size / 1048576).toFixed(1)} MB. The maximum is 10 MB per image.`);
      else if (count >= MAX_FILES) errs.push(`“${file.name}” wasn’t added — you can include up to ${MAX_FILES} images.`);
      else {
        count++;
        add.push({ id: Math.random().toString(36).slice(2), file, name: file.name, size: fmtSize(file.size), url: URL.createObjectURL(file), pct: 0, state: 'uploading' });
      }
    });
    setFiles((s) => [...s, ...add]);
    setFileErr(errs);
    if (add.length) setFileLive(`${add.length} ${add.length === 1 ? 'image' : 'images'} added.`);
    add.forEach(upload);
    setErr((e) => {
      if (!e.imageIds) return e;
      const n = { ...e };
      delete n.imageIds;
      return n;
    });
    if (fileRef.current) fileRef.current.value = '';
  };
  const removeFile = (id: string) => {
    const u = files.find((x) => x.id === id);
    xhrs.current.get(id)?.abort();
    xhrs.current.delete(id);
    if (u) URL.revokeObjectURL(u.url);
    setFiles((s) => s.filter((x) => x.id !== id));
    setFileLive(u ? `${u.name} removed.` : '');
  };
  const retryFile = (id: string) => {
    const u = files.find((x) => x.id === id);
    if (!u) return;
    const next = { ...u, state: 'uploading' as const, pct: 0, error: '' };
    setFiles((s) => s.map((x) => (x.id === id ? next : x)));
    upload(next);
  };

  // ---------- submit ----------
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'loading') return;
    const errs = validateAll(f);
    if (Object.keys(errs).length) {
      setErr(errs);
      setSummary(true);
      setStatus((s) => (s === 'error' ? 'error' : 'idle'));
      setTimeout(() => scrollTo(summaryRef.current, 120), 30);
      return;
    }
    if (files.some((x) => x.state === 'uploading')) {
      setWaitUploads(true);
      return;
    }
    setWaitUploads(false);
    setErr({});
    setSummary(false);
    setStatus('loading');
    const imageIds = files.filter((x) => x.state === 'ready' && x.imageId).map((x) => x.imageId as string);
    const payload = {
      name: f.name.trim(),
      phone: f.phone.trim(),
      email: f.email.trim().toLowerCase(),
      projectType: f.projectType,
      area: f.area,
      location: f.location.trim(),
      timeline: f.timeline,
      details: f.details.trim(),
      imageIds,
      website: f.website,
    };
    // Same details → same key, so a retry after a dropped response cannot create a duplicate lead.
    const sig = JSON.stringify(payload);
    if (!idem.current || idem.current.sig !== sig) idem.current = { key: newIdemKey(), sig };
    try {
      const r = await api<{ id: string | null; receivedAt: string }>('/estimate-requests', {
        method: 'POST',
        body: { ...payload, idempotencyKey: idem.current.key },
        headers: { 'Idempotency-Key': idem.current.key },
        timeoutMs: 20000,
      });
      setRes({ ref: r.id || '', at: r.receivedAt });
      setStatus('success');
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: reduce() ? 'auto' : 'smooth' });
        successRef.current?.focus({ preventScroll: true });
      }, 30);
    } catch (x) {
      const er = x as ClientApiError;
      if (er.status === 422 && Object.keys(er.errors || {}).length) {
        setErr(er.errors);
        setSummary(true);
        setStatus('idle');
        setTimeout(() => scrollTo(summaryRef.current, 120), 30);
        return;
      }
      setFailMsg(er.status === 429 ? 'Too many requests were sent from this connection — please wait a few minutes.' : er.status === 503 ? 'Online requests are paused right now.' : '');
      setStatus('error');
      window.scrollTo({ top: 0, behavior: reduce() ? 'auto' : 'smooth' });
    }
  };

  const editDetails = () => {
    setStatus('idle');
    setTimeout(() => focusField('name'), 40);
  };
  const reset = () => {
    xhrs.current.forEach((x) => x.abort());
    xhrs.current.clear();
    files.forEach((u) => URL.revokeObjectURL(u.url));
    setF({ ...EMPTY });
    setErr({});
    setSummary(false);
    setStatus('idle');
    setFiles([]);
    setFileErr([]);
    setFileLive('');
    setRes(null);
    idem.current = null;
    window.scrollTo(0, 0);
  };

  const loading = status === 'loading';
  const errKeys = [...Object.keys(LABELS), 'imageIds'].filter((k) => err[k]);
  const desc = (k: string, hint?: string) => [hint, err[k] ? `err-${k}` : ''].filter(Boolean).join(' ') || undefined;
  const ErrorLine = ({ k }: { k: string }) =>
    err[k] ? (
      <p id={`err-${k}`} className="ferr">
        {err[k]}
      </p>
    ) : null;
  const typeLabel = types.find((t) => t.value === f.projectType)?.label || '—';
  const ready = files.filter((x) => x.state === 'ready').length;

  if (status === 'success' && res) {
    return (
      <div ref={successRef} tabIndex={-1} role="status" className="done">
        <span aria-hidden="true" className="done__ic">
          ✓
        </span>
        <h2>Thank you for reaching out to {businessName}.</h2>
        <p>Your project details have been received. We will be in touch using the phone number or email you provided to discuss next steps.</p>
        {res.ref && (
          <p className="done__ref">
            Your reference is <strong>{res.ref}</strong> — keep it handy if you call or email about this request.
          </p>
        )}
        <dl className="recap">
          {[
            ['Name', f.name],
            ['Project type', typeLabel],
            ['Timeline', f.timeline],
            ['Property location', f.location],
            ['Photos', ready ? `${ready} attached` : 'None'],
          ].map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v || '—'}</dd>
            </div>
          ))}
        </dl>
        <div className="btns">
          <button type="button" className="btn btn--line btn--md" onClick={editDetails}>
            Edit my details
          </button>
          <Link href="/" className="btn btn--primary btn--md">
            Back to Home
          </Link>
          <button type="button" className="btn btn--text" onClick={reset}>
            Start a new request
          </button>
        </div>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={submit} aria-labelledby="form-title" className="eform">
      <div>
        <h2 id="form-title" className="eform__h">
          Estimate request
        </h2>
        <p style={{ fontSize: 15, color: 'var(--muted-2)' }}>All fields are required unless marked optional.</p>
      </div>

      {status === 'error' && (
        <div role="alert" className="banner">
          <span aria-hidden="true" className="banner__ic">
            !
          </span>
          <div>
            <strong>Your request couldn’t be sent.</strong>
            <p>
              {failMsg ? `${failMsg} ` : ''}Your details are still here — please try again
              {mailHref || telHref ? ', or contact us directly at ' : ''}
              {mailHref && <a href={mailHref}>{email}</a>}
              {mailHref && telHref ? ' or ' : ''}
              {telHref && <a href={telHref}>{phone}</a>}.
            </p>
          </div>
        </div>
      )}

      {summary && errKeys.length > 0 && (
        <div ref={summaryRef} tabIndex={-1} role="alert" aria-labelledby="sum-title" className="banner" style={{ display: 'block' }}>
          <p id="sum-title" style={{ fontWeight: 700, fontSize: 15.5, marginBottom: 10 }}>
            {errKeys.length === 1 ? 'Please check 1 field before sending:' : `Please check ${errKeys.length} fields before sending:`}
          </p>
          <ul>
            {errKeys.map((k) => (
              <li key={k}>
                <button type="button" onClick={() => focusField(k)}>
                  {LABELS[k] || 'Inspiration photographs'}: {err[k]}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <fieldset disabled={loading}>
        <legend>1 · About you</legend>
        <div className="fstack">
          <div className="fld">
            <label htmlFor="fld-name" className="flabel">
              Full name
            </label>
            <input id="fld-name" type="text" autoComplete="name" className="inp" value={f.name} onChange={(e) => setField('name', e.target.value)} onBlur={() => blur('name')} aria-required="true" aria-invalid={!!err.name} aria-describedby={desc('name')} />
            <ErrorLine k="name" />
          </div>
          <div className="frow">
            <div className="fld">
              <label htmlFor="fld-phone" className="flabel">
                Phone number
              </label>
              <input id="fld-phone" type="tel" autoComplete="tel" inputMode="tel" className="inp" value={f.phone} onChange={(e) => setField('phone', e.target.value)} onBlur={() => blur('phone')} aria-required="true" aria-invalid={!!err.phone} aria-describedby={desc('phone')} />
              <ErrorLine k="phone" />
            </div>
            <div className="fld">
              <label htmlFor="fld-email" className="flabel">
                Email address
              </label>
              <input id="fld-email" type="email" autoComplete="email" inputMode="email" className="inp" value={f.email} onChange={(e) => setField('email', e.target.value)} onBlur={() => blur('email')} aria-required="true" aria-invalid={!!err.email} aria-describedby={desc('email')} />
              <ErrorLine k="email" />
            </div>
          </div>
        </div>
      </fieldset>

      <fieldset disabled={loading}>
        <legend>2 · Your project</legend>
        <div className="fstack fstack--lg">
          <div>
            <p id="lbl-type" className="flabel" style={{ marginBottom: 10 }}>
              Project type
            </p>
            <div id="fld-type" role="radiogroup" aria-labelledby="lbl-type" aria-required="true" aria-invalid={!!err.projectType} aria-describedby={desc('projectType')} className="chips">
              {types.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  role="radio"
                  aria-checked={f.projectType === o.value}
                  className={`chip${err.projectType ? ' is-bad' : ''}`}
                  onClick={() => {
                    setF((p) => ({ ...p, projectType: o.value }));
                    setErr((e) => {
                      const n = { ...e };
                      delete n.projectType;
                      return n;
                    });
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <ErrorLine k="projectType" />
          </div>
          {areas.length > 0 && (
            <div>
              <p id="lbl-area" className="flabel" style={{ marginBottom: 10 }}>
                Approximate outdoor area<span className="opt">Optional</span>
              </p>
              <div role="radiogroup" aria-labelledby="lbl-area" className="chips">
                {areas.map((a) => (
                  <button key={a} type="button" role="radio" aria-checked={f.area === a} className="chip" onClick={() => setF((p) => ({ ...p, area: p.area === a ? '' : a }))}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="frow">
            <div className="fld fld--wide">
              <label htmlFor="fld-location" className="flabel flabel--tight">
                Property location
              </label>
              <p id="hint-location" className="hint">
                The address or area of the property you’d like work on.
              </p>
              <input id="fld-location" type="text" autoComplete="street-address" className="inp" value={f.location} onChange={(e) => setField('location', e.target.value)} onBlur={() => blur('location')} aria-required="true" aria-invalid={!!err.location} aria-describedby={desc('location', 'hint-location')} />
              <ErrorLine k="location" />
            </div>
            <div className="fld">
              <label htmlFor="fld-timeline" className="flabel flabel--tight">
                Desired timeline
              </label>
              <p id="hint-timeline" className="hint">
                When would you like to start?
              </p>
              <div className="selwrap">
                <select id="fld-timeline" className="inp" value={f.timeline} onChange={(e) => setField('timeline', e.target.value)} onBlur={() => blur('timeline')} aria-required="true" aria-invalid={!!err.timeline} aria-describedby={desc('timeline', 'hint-timeline')}>
                  <option value="">Select a timeline</option>
                  {timelines.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <ErrorLine k="timeline" />
            </div>
          </div>
        </div>
      </fieldset>

      <fieldset disabled={loading}>
        <legend>3 · Project details</legend>
        <div className="fstack fstack--lg">
          <div className="fld">
            <label htmlFor="fld-details" className="flabel flabel--tight">
              Project details
            </label>
            <p id="hint-details" className="hint">
              What would you like to change or improve? Mention any must-haves or ideas.
            </p>
            <textarea id="fld-details" rows={6} maxLength={3000} className="inp" value={f.details} onChange={(e) => setField('details', e.target.value)} onBlur={() => blur('details')} aria-required="true" aria-invalid={!!err.details} aria-describedby={desc('details', 'hint-details')} />
            <ErrorLine k="details" />
          </div>

          {photosOpen && (
            <div style={{ position: 'relative' }}>
              <p id="lbl-photos" className="flabel flabel--tight">
                Inspiration photographs<span className="opt">Optional</span>
              </p>
              <p id="hint-photos" className="hint" style={{ marginBottom: 10 }}>
                Photos of your space or ideas you like. JPG, PNG, or WebP · up to 10 MB each · maximum {MAX_FILES} images.
              </p>
              <div
                className={`dz${drag ? ' is-drag' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!drag) setDrag(true);
                }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDrag(false);
                  if (!loading) addFiles(e.dataTransfer?.files);
                }}
              >
                <p>Drag and drop images here</p>
                <p>or</p>
                <button id="btn-files" type="button" className="btn btn--line btn--sm" style={{ minHeight: 46, padding: '0 20px', fontSize: 14.5, background: '#fff' }} onClick={() => fileRef.current?.click()} aria-describedby="hint-photos">
                  Choose images
                </button>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple tabIndex={-1} aria-hidden="true" onChange={(e) => addFiles(e.target.files)} />
              </div>
              <ErrorLine k="imageIds" />
              {fileErr.length > 0 && (
                <ul role="alert" className="ferrs">
                  {fileErr.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              )}
              {files.length > 0 && (
                <ul aria-label="Selected images" className="frows">
                  {files.map((u) => (
                    <li key={u.id} className={u.state === 'failed' ? 'is-bad' : ''}>
                      <img src={u.url} alt={`Preview of ${u.name}`} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="frows__name">{u.name}</p>
                        <p className="frows__meta">
                          {u.size} · {u.state === 'uploading' ? `Uploading… ${Math.round(u.pct)}%` : u.state === 'ready' ? 'Uploaded' : u.error}
                        </p>
                        {u.state !== 'failed' && (
                          <div className="frows__bar" role="progressbar" aria-label={`Uploading ${u.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(u.pct)}>
                            <div style={{ width: `${u.pct}%` }} />
                          </div>
                        )}
                      </div>
                      {u.state === 'failed' && (
                        <button type="button" className="frows__btn frows__retry" onClick={() => retryFile(u.id)}>
                          Retry
                        </button>
                      )}
                      <button type="button" className="frows__btn frows__x" aria-label={`Remove ${u.name}`} onClick={() => removeFile(u.id)}>
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p aria-live="polite" className="sr-only">
                {fileLive}
              </p>
            </div>
          )}
        </div>
      </fieldset>

      <div aria-hidden="true" className="hp">
        <label htmlFor="fld-website">Website</label>
        <input id="fld-website" tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => setF((p) => ({ ...p, website: e.target.value }))} />
      </div>

      <div className="submit">
        {waitUploads && files.some((x) => x.state === 'uploading') && (
          <p role="status" style={{ fontSize: 15, color: 'var(--body)' }}>
            Images are still uploading — the request can be sent once they finish.
          </p>
        )}
        <button type="submit" className="btn btn--primary" disabled={loading} aria-busy={loading}>
          {loading && <span aria-hidden="true" className="spinner" />}
          {loading ? 'Sending request…' : status === 'error' ? 'Try again' : 'Send estimate request'}
        </button>
        <p>
          Your details are used only to respond to this request.{' '}
          <Link href="/privacy" style={{ color: 'var(--forest)' }}>
            Privacy
          </Link>
          {mailHref || telHref ? <> · Prefer to talk? </> : null}
          {mailHref && <a href={mailHref}>{email}</a>}
          {mailHref && telHref ? ' or ' : ''}
          {telHref && <a href={telHref}>{phone}</a>}
        </p>
      </div>
    </form>
  );
}
