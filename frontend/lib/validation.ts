/**
 * Client mirror of the design's check() and the backend's estimate-validation.ts.
 * The API re-validates everything (and checks options against the published lists).
 */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export type Errors = Record<string, string>;

export const EMPTY = { name: '', phone: '', email: '', projectType: '', area: '', location: '', timeline: '', details: '', website: '' };
export type EstimateForm = typeof EMPTY;

/** Design D.LABELS — field order of the error summary. */
export const LABELS: Record<string, string> = {
  name: 'Full name',
  phone: 'Phone number',
  email: 'Email address',
  projectType: 'Project type',
  location: 'Property location',
  timeline: 'Desired timeline',
  details: 'Project details',
};

export function check(k: string, raw: string): string {
  const v = (raw || '').trim();
  switch (k) {
    case 'name':
      return v.length < 2 ? 'Enter your full name.' : '';
    case 'phone': {
      if (!v) return 'Enter a phone number so we can reach you.';
      const d = v.replace(/\D/g, '');
      return !/^[+\d\s().-]+$/.test(v) || d.length < 10 || d.length > 15 ? 'Enter a valid phone number with 10–15 digits, e.g. (714) 555-0123.' : '';
    }
    case 'email':
      if (!v) return 'Enter your email address.';
      return EMAIL_RE.test(v) ? '' : 'Enter an email address in the format name@example.com.';
    case 'projectType':
      return v ? '' : 'Choose the type of project.';
    case 'location':
      return v.length < 3 ? 'Enter the property address or area, e.g. street and city.' : '';
    case 'timeline':
      return v ? '' : 'Choose when you would like to start.';
    case 'details':
      return v.length < 20 ? 'Describe your project in a little more detail (at least 20 characters).' : '';
  }
  return '';
}

export function validateAll(f: EstimateForm): Errors {
  const e: Errors = {};
  for (const k of Object.keys(LABELS)) {
    const m = check(k, f[k as keyof EstimateForm]);
    if (m) e[k] = m;
  }
  return e;
}

/** Design addFiles() limits — the server checks the bytes again. */
export const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_BYTES = 10 * 1048576;
export const MAX_FILES = 5;

export const newIdemKey = () => {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  }
};
