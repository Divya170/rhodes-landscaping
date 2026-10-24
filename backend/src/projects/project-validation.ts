/** Pure validation for projects (unit-tested, no framework imports). */
import { clean, IMAGE_RE, tooLong } from '../common/text';

export const RATIOS = ['4/5', '3/2', '1/1', '5/4'] as const;

export type ProjectInput = Partial<
  Record<'category' | 'title' | 'description' | 'image' | 'imageAlt' | 'imageBrief' | 'ratio' | 'location' | 'beforeImage' | 'afterImage' | 'featured' | 'illustrative' | 'published', unknown>
>;

/** `categories` = valid service slugs. */
export function validateProject(input: ProjectInput, categories: string[]) {
  const e: Record<string, string> = {};
  const category = clean(input.category, 40).toLowerCase();
  const title = clean(input.title, 120);
  const description = clean(input.description, 1000, true);
  const image = clean(input.image, 500);
  const imageAlt = clean(input.imageAlt, 200);
  const imageBrief = clean(input.imageBrief, 200);
  const ratioRaw = clean(input.ratio, 5);
  const ratio = (RATIOS as readonly string[]).includes(ratioRaw) ? ratioRaw : '4/5';
  const location = clean(input.location, 120);
  const beforeImage = clean(input.beforeImage, 500);
  const afterImage = clean(input.afterImage, 500);
  const published = input.published !== false;

  if (!categories.includes(category)) e.category = 'Choose the service this project belongs to.';
  if (title.length < 2) e.title = 'Enter a project title.';
  tooLong(e, 'title', title, 120);
  tooLong(e, 'description', description, 1000);
  tooLong(e, 'imageAlt', imageAlt, 200);
  tooLong(e, 'location', location, 120);
  for (const [k, v] of [['image', image], ['beforeImage', beforeImage], ['afterImage', afterImage]] as const) {
    if (v && !IMAGE_RE.test(v)) e[k] = 'Upload an image or use an https:// URL.';
  }
  if (image && !imageAlt) e.imageAlt = 'Describe the photo for screen-reader users.';
  if (!!beforeImage !== !!afterImage) e[beforeImage ? 'afterImage' : 'beforeImage'] = 'Add both a before and an after photo, or neither.';
  if (published && description.length < 20) e.description = 'Add a description (at least 20 characters) before publishing.';

  return {
    value: {
      category,
      title,
      description,
      image: image || null,
      imageAlt,
      imageBrief,
      ratio,
      location,
      beforeImage: beforeImage || null,
      afterImage: afterImage || null,
      featured: input.featured === true,
      illustrative: input.illustrative === true,
      published,
    },
    errors: e,
  };
}
