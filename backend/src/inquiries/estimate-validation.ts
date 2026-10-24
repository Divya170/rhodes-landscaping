/** Estimate-request rules — the design's check() verbatim, plus server-side option checks. Pure, unit-tested. */
import { EMAIL_RE, line, phoneOk, tidy } from '../common/forms';

export const MAX_IMAGES = 5;

export interface FormLists {
  /** Valid project-type values: published service slugs + "other" */
  projectTypes: string[];
  area: string[];
  timeline: string[];
}

export type EstimateInput = Partial<
  Record<'name' | 'phone' | 'email' | 'projectType' | 'area' | 'location' | 'timeline' | 'details' | 'imageIds' | 'idempotencyKey' | 'website', unknown>
>;

/** Labels used in the error summary ("Full name: Enter your full name.") */
export const LABELS: Record<string, string> = {
  name: 'Full name',
  phone: 'Phone number',
  email: 'Email address',
  projectType: 'Project type',
  location: 'Property location',
  timeline: 'Desired timeline',
  details: 'Project details',
  imageIds: 'Inspiration photographs',
};

export function validateEstimate(input: EstimateInput, lists: FormLists) {
  const e: Record<string, string> = {};
  const name = line(input.name);
  const phone = tidy(input.phone);
  const email = tidy(input.email).toLowerCase();
  const projectType = tidy(input.projectType).toLowerCase();
  const areaRaw = line(input.area);
  const location = line(input.location);
  const timeline = line(input.timeline);
  const details = tidy(input.details, true);

  if (name.length < 2) e.name = 'Enter your full name.';
  else if (name.length > 120) e.name = 'Use 120 characters or fewer.';
  if (!phone) e.phone = 'Enter a phone number so we can reach you.';
  else if (!phoneOk(phone) || phone.length > 30) e.phone = 'Enter a valid phone number with 10–15 digits, e.g. (714) 555-0123.';
  if (!email) e.email = 'Enter your email address.';
  else if (email.length > 160 || !EMAIL_RE.test(email)) e.email = 'Enter an email address in the format name@example.com.';
  if (!projectType || !lists.projectTypes.includes(projectType)) e.projectType = 'Choose the type of project.';
  if (location.length < 3) e.location = 'Enter the property address or area, e.g. street and city.';
  else if (location.length > 200) e.location = 'Keep the location under 200 characters.';
  if (!timeline || !lists.timeline.includes(timeline)) e.timeline = 'Choose when you would like to start.';
  if (details.length < 20) e.details = 'Describe your project in a little more detail (at least 20 characters).';
  else if (details.length > 3000) e.details = 'Keep the project details under 3,000 characters.';

  const imageIds = Array.isArray(input.imageIds) ? Array.from(new Set(input.imageIds.map((x) => tidy(x)).filter((x) => /^[a-f0-9]{32}$/.test(x)))) : [];
  if (imageIds.length > MAX_IMAGES) e.imageIds = 'You can include up to 5 images.';

  return {
    value: { name, phone, email, projectType, area: lists.area.includes(areaRaw) ? areaRaw : '', location, timeline, details, imageIds },
    errors: e,
  };
}

/** Magic-byte check for inspiration photos: JPG, PNG or WebP (design accept list). */
export function sniffImage(buf: Buffer): { mime: string; ext: string } | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: 'image/jpeg', ext: '.jpg' };
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return { mime: 'image/png', ext: '.png' };
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return { mime: 'image/webp', ext: '.webp' };
  return null;
}

/**
 * Remove EXIF/XMP metadata (GPS position, camera serials) without re-encoding the image
 * (Handoff: "Strip EXIF data"). JPEG: APP1/APP13 segments · PNG: eXIf chunk · WebP: EXIF/XMP chunks.
 */
export function stripMetadata(buf: Buffer, mime: string): Buffer {
  try {
    if (mime === 'image/jpeg') return stripJpeg(buf);
    if (mime === 'image/png') return stripPng(buf);
    if (mime === 'image/webp') return stripWebp(buf);
  } catch {
    /* malformed structure: fall through and keep the original bytes */
  }
  return buf;
}

function stripJpeg(buf: Buffer): Buffer {
  const out: Buffer[] = [buf.subarray(0, 2)];
  let i = 2;
  while (i + 4 <= buf.length) {
    if (buf[i] !== 0xff) throw new Error('bad marker');
    const marker = buf[i + 1];
    if (marker === 0xda) {
      out.push(buf.subarray(i)); // start of scan: image data follows
      return Buffer.concat(out);
    }
    const len = buf.readUInt16BE(i + 2);
    const end = i + 2 + len;
    if (end > buf.length) throw new Error('truncated');
    if (marker !== 0xe1 && marker !== 0xed) out.push(buf.subarray(i, end)); // drop APP1 (EXIF/XMP) and APP13 (IPTC)
    i = end;
  }
  throw new Error('no scan');
}

function stripPng(buf: Buffer): Buffer {
  const out: Buffer[] = [buf.subarray(0, 8)];
  let i = 8;
  while (i + 12 <= buf.length) {
    const len = buf.readUInt32BE(i);
    const type = buf.toString('ascii', i + 4, i + 8);
    const end = i + 12 + len;
    if (end > buf.length) throw new Error('truncated');
    if (type !== 'eXIf') out.push(buf.subarray(i, end));
    i = end;
    if (type === 'IEND') break;
  }
  return Buffer.concat(out);
}

function stripWebp(buf: Buffer): Buffer {
  const chunks: Buffer[] = [];
  let i = 12;
  while (i + 8 <= buf.length) {
    const type = buf.toString('ascii', i, i + 4);
    const len = buf.readUInt32LE(i + 4);
    const end = i + 8 + len + (len % 2);
    if (i + 8 + len > buf.length) throw new Error('truncated');
    const chunk = Buffer.from(buf.subarray(i, Math.min(end, buf.length)));
    if (type === 'VP8X') chunk[8] &= ~0x0c; // clear the EXIF (0x08) and XMP (0x04) flags
    if (type !== 'EXIF' && type !== 'XMP ') chunks.push(chunk);
    i = end;
  }
  const body = Buffer.concat(chunks);
  const head = Buffer.alloc(12);
  head.write('RIFF', 0, 'ascii');
  head.writeUInt32LE(body.length + 4, 4);
  head.write('WEBP', 8, 'ascii');
  return Buffer.concat([head, body]);
}

/** Display-only file name: no path parts or control characters, max 120 chars. */
export const safeName = (n: string) =>
  String(n || 'photo')
    .replace(/^.*[\\/]/, '')
    .replace(/[\u0000-\u001F\u007F<>:"|?*]/g, '')
    .trim()
    .slice(0, 120) || 'photo';
