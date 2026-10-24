/** Pure validation for services (unit-tested, no framework imports). */
import { clean, IMAGE_RE, SLUG_RE, tooLong } from '../common/text';

export type ServiceInput = Partial<
  Record<'slug' | 'name' | 'summary' | 'description' | 'benefits' | 'includes' | 'ctaLabel' | 'image' | 'homeImage' | 'detailImage' | 'detailImage2' | 'imageAlt' | 'imageBrief' | 'published', unknown>
>;

/** "other" is reserved for the estimate form's "Other" project type. */
export const RESERVED_SLUGS = ['other'];

const list = (v: unknown, max: number) =>
  (Array.isArray(v) ? v : typeof v === 'string' ? v.split('\n') : [])
    .map((x) => String(x ?? '').replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .slice(0, max + 1);

export function validateService(input: ServiceInput) {
  const e: Record<string, string> = {};
  const name = clean(input.name, 80);
  const slug = clean(input.slug, 40).toLowerCase();
  const summary = clean(input.summary, 300, true);
  const description = clean(input.description, 1500, true);
  const benefits = list(input.benefits, 6);
  const includes = list(input.includes, 10);
  const ctaLabel = clean(input.ctaLabel, 60);
  const imageAlt = clean(input.imageAlt, 200);
  const imageBrief = clean(input.imageBrief, 160);
  const published = input.published !== false;
  const imgs: Record<string, string> = {};
  for (const k of ['image', 'homeImage', 'detailImage', 'detailImage2'] as const) {
    imgs[k] = clean(input[k], 500);
    if (imgs[k] && !IMAGE_RE.test(imgs[k])) e[k] = 'Upload an image or use an https:// URL.';
  }

  if (name.length < 2) e.name = 'Enter a service name.';
  tooLong(e, 'name', name, 80);
  if (slug && !SLUG_RE.test(slug)) e.slug = 'Use lowercase letters, numbers and hyphens only.';
  if (RESERVED_SLUGS.includes(slug)) e.slug = '“other” is reserved for the estimate form’s “Other” option.';
  tooLong(e, 'summary', summary, 300);
  tooLong(e, 'description', description, 1500);
  if (benefits.length > 6) e.benefits = 'Use 6 benefits or fewer.';
  else if (benefits.some((b) => b.length > 120)) e.benefits = 'Keep each benefit under 120 characters.';
  if (includes.length > 10) e.includes = 'Use 10 items or fewer.';
  else if (includes.some((b) => b.length > 160)) e.includes = 'Keep each item under 160 characters.';
  tooLong(e, 'ctaLabel', ctaLabel, 60);
  if ((imgs.image || imgs.homeImage) && !imageAlt) e.imageAlt = 'Describe the photo for screen-reader users.';
  if (published && summary.length < 10) e.summary = 'Add a short summary (at least 10 characters) before publishing.';
  if (published && description.length < 20) e.description = 'Add a description (at least 20 characters) before publishing.';

  return {
    value: {
      name,
      slug,
      summary,
      description,
      benefits: benefits.slice(0, 6),
      includes: includes.slice(0, 10),
      ctaLabel,
      image: imgs.image || null,
      homeImage: imgs.homeImage || null,
      detailImage: imgs.detailImage || null,
      detailImage2: imgs.detailImage2 || null,
      imageAlt,
      imageBrief,
      published,
    },
    errors: e,
  };
}
