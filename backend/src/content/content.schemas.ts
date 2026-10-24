/**
 * Registry of the generic content types on the Rhodes Landscaping site. The backend
 * validates against these and serves them to the admin UI, which builds its
 * forms from them.
 */

export type FieldKind = 'text' | 'textarea' | 'list' | 'select' | 'image';

export interface FieldDef {
  key: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  /** characters (text) or items (list) */
  max?: number;
  options?: { value: string; label: string }[];
  help?: string;
}

export interface ContentTypeDef {
  type: string;
  label: string;
  page: string;
  description: string;
  titleField: string;
  fields: FieldDef[];
  /** only one published row per value of this field (page photos: one per slot) */
  uniqueBy?: string;
}

export const IMAGE_SLOTS = [
  { value: 'home-hero', label: 'Home hero — layered residential garden meeting a contemporary home, soft daylight' },
  { value: 'home-intro-main', label: 'Home “Our approach” (large) — layered planting beds beside a garden path' },
  { value: 'home-intro-detail', label: 'Home “Our approach” (detail) — natural stone meeting soft foliage' },
  { value: 'home-cta', label: 'Home estimate band — inviting garden seating area in late-afternoon light' },
  { value: 'services-hero', label: 'Services page — wide designed garden in context with the home' },
  { value: 'about-hero', label: 'About intro — quiet garden corner, mature planting, natural light' },
  { value: 'about-owner', label: 'About “Meet Easton Rhodes” — owner photograph (only if supplied)' },
];

export const OPTION_LISTS = [
  { value: 'area', label: 'Approximate outdoor area (optional chips)' },
  { value: 'timeline', label: 'Desired timeline (select)' },
];

export const CONTENT_TYPES: ContentTypeDef[] = [
  {
    type: 'step', label: 'How it works', page: 'Home, About', titleField: 'title',
    description: 'The steps from first conversation to finished space (home timeline and About “How a project could unfold”).',
    fields: [
      { key: 'title', label: 'Title', kind: 'text', required: true, max: 80 },
      { key: 'text', label: 'Text', kind: 'textarea', required: true, max: 300 },
    ],
  },
  {
    type: 'principle', label: 'Working philosophy', page: 'About', titleField: 'title',
    description: 'The principles behind every project.',
    fields: [
      { key: 'title', label: 'Principle', kind: 'text', required: true, max: 80 },
      { key: 'text', label: 'Text', kind: 'textarea', required: true, max: 400 },
    ],
  },
  {
    type: 'form-option', label: 'Estimate form options', page: 'Contact', titleField: 'label',
    description: 'Choices offered on the estimate form. Unpublishing an option removes it from the form; existing leads keep their answer.',
    fields: [
      { key: 'list', label: 'List', kind: 'select', required: true, options: OPTION_LISTS },
      { key: 'label', label: 'Label', kind: 'text', required: true, max: 60 },
    ],
  },
  {
    type: 'site-image', label: 'Page photos', page: 'Home, Services, About', titleField: 'slot', uniqueBy: 'slot',
    description: 'Approved photographs that replace the labelled placeholders. One published photo per slot.',
    fields: [
      { key: 'slot', label: 'Slot', kind: 'select', required: true, options: IMAGE_SLOTS },
      { key: 'image', label: 'Photo', kind: 'image', required: true },
      { key: 'alt', label: 'Alt text (describe the photo)', kind: 'text', required: true, max: 200 },
    ],
  },
];

export const CONTENT_TYPE_MAP = new Map(CONTENT_TYPES.map((t) => [t.type, t]));
