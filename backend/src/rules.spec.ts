/**
 * Business-rule checks that run without a database or Nest:
 *   npm test   (or: npx tsx src/rules.spec.ts)
 * Covers the estimate-request rules (the design's exact messages), image checks + EXIF stripping,
 * references, idempotency keys, CSV safety, cookie/CSRF helpers, service/project/content validation and seed data.
 */
import { strict as assert } from 'assert';
import { cleanIdemKey, csvSafe, isHoneypot, phoneOk, publicRef } from './common/forms';
import { FormLists, safeName, sniffImage, stripMetadata, validateEstimate } from './inquiries/estimate-validation';
import { validateService } from './services/service-validation';
import { validateProject } from './projects/project-validation';
import { validateContentFields } from './content/content.validation';
import { CONTENT_TYPE_MAP } from './content/content.schemas';
import { CONTENT_SEED, PROJECTS_SEED, SERVICES_SEED } from './database/seed-data';
import { parseCookies, sameToken } from './common/cookies';

let passed = 0;
const test = (name: string, fn: () => void) => {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
};

const list = (name: string) => CONTENT_SEED['form-option'].filter((r) => r.fields.list === name).map((r) => String(r.fields.label));
const SLUGS = SERVICES_SEED.map((s) => s.slug);
const LISTS: FormLists = { projectTypes: [...SLUGS, 'other'], area: list('area'), timeline: list('timeline') };
const good = {
  name: 'Maria Lopez', phone: '(714) 555-0123', email: 'Maria@Example.com', projectType: 'planting', area: 'Medium outdoor space',
  location: '400 W Center St, Anaheim', timeline: 'Within three months', details: 'Refresh the front borders with drought-tolerant planting.', imageIds: [], website: '',
};
const es = (p: object) => validateEstimate({ ...good, ...p }, LISTS).errors;

test('a complete estimate request passes and is normalised', () => {
  const { errors, value } = validateEstimate(good, LISTS);
  assert.deepEqual(errors, {});
  assert.equal(value.email, 'maria@example.com');
  assert.equal(value.area, 'Medium outdoor space');
});

test('empty request returns the design’s messages', () => {
  const { errors } = validateEstimate({}, LISTS);
  assert.equal(errors.name, 'Enter your full name.');
  assert.equal(errors.phone, 'Enter a phone number so we can reach you.');
  assert.equal(errors.email, 'Enter your email address.');
  assert.equal(errors.projectType, 'Choose the type of project.');
  assert.equal(errors.location, 'Enter the property address or area, e.g. street and city.');
  assert.equal(errors.timeline, 'Choose when you would like to start.');
  assert.equal(errors.details, 'Describe your project in a little more detail (at least 20 characters).');
  assert.equal(errors.area, undefined, 'area is optional');
});

test('phone, email, option and length rules', () => {
  assert.equal(es({ phone: '555-0123' }).phone, 'Enter a valid phone number with 10–15 digits, e.g. (714) 555-0123.');
  assert.equal(es({ phone: '714 555 0123 x2' }).phone, 'Enter a valid phone number with 10–15 digits, e.g. (714) 555-0123.');
  assert.equal(es({ phone: '+44 20 7946 0958' }).phone, undefined, 'international 12 digits ok');
  assert.equal(es({ email: 'a@b' }).email, 'Enter an email address in the format name@example.com.');
  assert.equal(es({ projectType: 'pool-building' }).projectType, 'Choose the type of project.');
  assert.equal(es({ projectType: 'other' }).projectType, undefined);
  assert.equal(es({ timeline: 'Next year' }).timeline, 'Choose when you would like to start.');
  assert.equal(es({ location: 'LA' }).location, 'Enter the property address or area, e.g. street and city.');
  assert.equal(es({ details: 'x'.repeat(3001) }).details, 'Keep the project details under 3,000 characters.');
  assert.equal(validateEstimate({ ...good, area: 'Huge' }, LISTS).value.area, '', 'unknown area dropped');
  assert.equal(es({ imageIds: ['a', 'b', 'c', 'd', 'e', 'f'].map((c) => c.repeat(32)) }).imageIds, 'You can include up to 5 images.');
});

test('image checks use the file bytes; EXIF is stripped', () => {
  assert.equal(sniffImage(Buffer.from([0xff, 0xd8, 0xff, 0xe0, ...new Array(12).fill(0)]))?.mime, 'image/jpeg');
  assert.equal(sniffImage(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>')), null, 'SVG rejected');
  // JPEG: SOI, APP0, APP1(Exif), SOS + data → APP1 removed
  const seg = (m: number, body: Buffer) => Buffer.concat([Buffer.from([0xff, m]), Buffer.from([(body.length + 2) >> 8, (body.length + 2) & 255]), body]);
  const jpg = Buffer.concat([Buffer.from([0xff, 0xd8]), seg(0xe0, Buffer.from('JFIF\0')), seg(0xe1, Buffer.from('Exif\0\0GPS-DATA')), Buffer.from([0xff, 0xda, 0, 2, 1, 2, 3, 0xff, 0xd9])]);
  const outJ = stripMetadata(jpg, 'image/jpeg');
  assert.ok(!outJ.includes('GPS-DATA'), 'EXIF removed');
  assert.ok(outJ.includes('JFIF'), 'other segments kept');
  // PNG: eXIf chunk removed
  const chunk = (t: string, d: Buffer) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); return Buffer.concat([l, Buffer.from(t), d, Buffer.alloc(4)]); };
  const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', Buffer.alloc(13)), chunk('eXIf', Buffer.from('GPS-DATA')), chunk('IEND', Buffer.alloc(0))]);
  const outP = stripMetadata(png, 'image/png');
  assert.ok(!outP.includes('GPS-DATA') && outP.includes('IHDR') && outP.includes('IEND'));
  // WebP: EXIF chunk removed and RIFF size rewritten
  const wchunk = (t: string, d: Buffer) => { const l = Buffer.alloc(4); l.writeUInt32LE(d.length); return Buffer.concat([Buffer.from(t), l, d, d.length % 2 ? Buffer.alloc(1) : Buffer.alloc(0)]); };
  const wbody = Buffer.concat([wchunk('VP8X', Buffer.from([0x08, 0, 0, 0, 0, 0, 0, 0, 0, 0])), wchunk('VP8 ', Buffer.alloc(10)), wchunk('EXIF', Buffer.from('GPS-DATA'))]);
  const wh = Buffer.alloc(12); wh.write('RIFF'); wh.writeUInt32LE(wbody.length + 4, 4); wh.write('WEBP', 8);
  const outW = stripMetadata(Buffer.concat([wh, wbody]), 'image/webp');
  assert.ok(!outW.includes('GPS-DATA'));
  assert.equal(outW.readUInt32LE(4), outW.length - 8);
  assert.equal(outW[20] & 0x08, 0, 'VP8X EXIF flag cleared');
  assert.equal(safeName('../../etc/pass<wd>.jpg'), 'passwd.jpg');
});

test('references, honeypot, idempotency keys and CSV safety', () => {
  assert.equal(isHoneypot('http://spam'), true);
  assert.equal(phoneOk('(714) 555-0123'), true);
  assert.equal(publicRef(1), 'RL-1001');
  assert.equal(cleanIdemKey('3f2a9c1e-7b8d-4e5f-9a0b-1c2d3e4f5a6b'), '3f2a9c1e-7b8d-4e5f-9a0b-1c2d3e4f5a6b');
  assert.equal(cleanIdemKey('short'), null);
  assert.equal(csvSafe('=HYPERLINK()'), `"'=HYPERLINK()"`);
});

test('session helpers: cookie parsing and constant-time CSRF compare', () => {
  assert.deepEqual(parseCookies('rl_session=abc.def; rl_csrf=xyz%3D'), { rl_session: 'abc.def', rl_csrf: 'xyz=' });
  assert.equal(sameToken('abc', 'abc'), true);
  assert.equal(sameToken('abc', 'abd'), false);
});

test('service, project and content validation', () => {
  assert.equal(validateService({ name: '' }).errors.name, 'Enter a service name.');
  assert.equal(validateService({ name: 'Irrigation', slug: 'other' }).errors.slug, '“other” is reserved for the estimate form’s “Other” option.');
  assert.equal(validateService({ name: 'Irrigation', summary: 'Short summary here', published: true }).errors.description, 'Add a description (at least 20 characters) before publishing.');
  assert.equal(validateProject({ title: 'Patio', category: 'pools' }, SLUGS).errors.category, 'Choose the service this project belongs to.');
  assert.equal(validateProject({ title: 'Patio', category: 'planting', published: false, beforeImage: '/uploads/a.jpg' }, SLUGS).errors.afterImage, 'Add both a before and an after photo, or neither.');
  assert.equal(validateProject({ title: 'Patio', category: 'planting', published: false, ratio: '9/9' }, SLUGS).value.ratio, '4/5');
  const o = CONTENT_TYPE_MAP.get('form-option')!;
  assert.equal(validateContentFields(o, { list: 'colours', label: 'Red' }).errors.list, 'Choose a valid list.');
});

test('every seeded row passes its own validation and matches the design counts', () => {
  for (const s of SERVICES_SEED) assert.deepEqual(validateService({ ...s, published: true }).errors, {}, s.name);
  for (const p of PROJECTS_SEED) assert.deepEqual(validateProject(p, SLUGS).errors, {}, p.title);
  for (const [type, rows] of Object.entries(CONTENT_SEED)) {
    const def = CONTENT_TYPE_MAP.get(type)!;
    assert.ok(def, type);
    for (const r of rows) assert.deepEqual(validateContentFields(def, r.fields).errors, {}, `${type}: ${JSON.stringify(r.fields).slice(0, 40)}`);
  }
  assert.deepEqual(Object.fromEntries(Object.entries(CONTENT_SEED).map(([k, v]) => [k, v.length])), { step: 4, principle: 3, 'form-option': 8 });
  assert.deepEqual(SLUGS, ['garden-design', 'lawn-care', 'planting', 'outdoor-improvements']);
  assert.equal(PROJECTS_SEED.length, 9);
  assert.deepEqual(PROJECTS_SEED.filter((p) => p.featured).map((p) => p.title), ['Layered Courtyard Garden', 'Textural Perennial Border', 'Stone Path & Entry']);
});

console.log(`\n${passed} checks passed`);
