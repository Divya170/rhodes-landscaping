/**
 * First-boot content, copied verbatim from the design comp (Rhodes Landscaping.dc.html).
 * Pure data — no framework imports — so the rules tests can load it.
 */

export const SETTINGS_SEED = {
  businessName: 'Rhodes Landscaping',
  contactName: 'Easton Rhodes',
  phone: '+1 (919) 238-7861',
  email: 'easton.rhodes@rhodeslandscaping.com',
  addressLine1: '201 S Anaheim Blvd',
  addressLine2: 'Anaheim, CA 92805',
  locationLabel: 'Anaheim, California',
  tagline: 'Thoughtfully designed landscapes, based in Anaheim, California.',
  aboutLead:
    'Landscaping should feel connected to the way you want to use your outdoor space. Rhodes Landscaping approaches each enquiry by understanding the property, your priorities, and the improvements you have in mind.',
  aboutBody:
    'Rhodes Landscaping is owned by Easton Rhodes and based in Anaheim, California.\n\nEvery enquiry starts with a conversation about your property and what you would like to achieve, so the work that follows is shaped by your priorities rather than a template.',
  privacyPolicy: '',
  heroStyle: 'fullbleed',
  showReviewNotes: true,
  estimatesOpen: true,
  photoUploadsOpen: true,
};

export interface ServiceSeed {
  slug: string;
  name: string;
  summary: string;
  description: string;
  benefits: string[];
  includes: string[];
  ctaLabel: string;
  imageBrief: string;
}

export const SERVICES_SEED: ServiceSeed[] = [
  {
    slug: 'garden-design',
    name: 'Garden Design',
    summary: 'Planning the structure, flow, and planting of a garden so every part of it feels connected.',
    description:
      'Planning and shaping outdoor spaces as a whole — the structure of the garden, how planting is arranged, and how each area relates to the next — so the finished space feels cohesive rather than pieced together.',
    benefits: ['A cohesive plan for the whole space', 'Planting and structure that work together', 'A clearer picture before work begins'],
    includes: ['Reviewing layout, light, and existing features', 'Planning garden structure such as beds, borders, and paths', 'Developing planting arrangements', 'Outlining how the design could be carried out'],
    ctaLabel: 'Request a Garden Design Estimate',
    imageBrief: 'Garden design — planned garden with clear structure and layered beds',
  },
  {
    slug: 'lawn-care',
    name: 'Lawn Care',
    summary: 'Attention to the lawn’s appearance and upkeep, so the whole property feels tidy and cared for.',
    description: 'Attention to the lawn’s appearance and upkeep, helping it look even, tidy, and in keeping with the rest of the property.',
    benefits: ['A neater, more cared-for appearance', 'Edges and surrounding areas kept tidy', 'A lawn that complements planting and paths'],
    includes: ['Mowing and edging', 'Tidying lawn borders and surrounding areas', 'Discussing the lawn’s condition and upkeep needs'],
    ctaLabel: 'Request a Lawn Care Estimate',
    imageBrief: 'Lawn care — wide, even lawn framed by planting',
  },
  {
    slug: 'planting',
    name: 'Planting',
    summary: 'Choosing and arranging plants for texture, colour, and character that suit the setting.',
    description:
      'Selecting and arranging plants for texture, colour, and seasonal character — bringing greenery into the property in a way that suits its setting and style.',
    benefits: ['Layered texture and visual interest', 'Plants chosen with the setting in mind', 'Greenery that softens and frames the home'],
    includes: ['Guidance on plant selection', 'New planting beds and borders', 'Refreshing existing planting areas'],
    ctaLabel: 'Request a Planting Estimate',
    imageBrief: 'Planting — full-width view of layered, textural planting',
  },
  {
    slug: 'outdoor-improvements',
    name: 'Outdoor Improvements',
    summary: 'Enhancements that make outdoor areas more usable, welcoming, and easy to enjoy.',
    description: 'Practical enhancements that improve how outdoor spaces look and function, making them more comfortable to use and easier to enjoy.',
    benefits: ['More usable outdoor areas', 'A more welcoming first impression', 'Improvements planned around how you live'],
    includes: ['Pathway and edging details', 'Defined areas for seating or gathering', 'Other enhancements, confirmed per project'],
    ctaLabel: 'Request an Improvements Estimate',
    imageBrief: 'Outdoor improvements — defined patio area edged with planting',
  },
];

/** Design static D.PROJECTS — illustrative concepts, flagged illustrative = true. */
export const PROJECTS_SEED = [
  { title: 'Layered Courtyard Garden', category: 'garden-design', ratio: '4/5', description: 'Concept for a compact courtyard with layered beds framing a central seating area.', imageBrief: 'Illustrative concept — courtyard garden with layered beds around seating', featured: true },
  { title: 'Front Lawn Refresh', category: 'lawn-care', ratio: '3/2', description: 'Concept showing an even, neatly edged lawn bordered by low planting.', imageBrief: 'Illustrative concept — even front lawn with low planting' },
  { title: 'Textural Perennial Border', category: 'planting', ratio: '1/1', description: 'Concept for a mixed border of ornamental grasses and flowering perennials.', imageBrief: 'Illustrative concept — textural border of grasses and perennials', featured: true },
  { title: 'Stone Path & Entry', category: 'outdoor-improvements', ratio: '4/5', description: 'Concept for a natural stone pathway leading to a welcoming front entry.', imageBrief: 'Illustrative concept — natural stone path to a front entry', featured: true },
  { title: 'Backyard Garden Plan', category: 'garden-design', ratio: '3/2', description: 'Concept for a backyard organised into lawn, planting, and gathering areas.', imageBrief: 'Illustrative concept — backyard with lawn, planting and seating zones' },
  { title: 'Shade Garden Planting', category: 'planting', ratio: '4/5', description: 'Concept for a shaded side garden with lush, layered foliage.', imageBrief: 'Illustrative concept — shaded side garden with layered foliage' },
  { title: 'Patio Seating Area', category: 'outdoor-improvements', ratio: '3/2', description: 'Concept for a defined patio space edged with soft planting.', imageBrief: 'Illustrative concept — patio seating area edged with planting' },
  { title: 'Lawn & Border Edging', category: 'lawn-care', ratio: '1/1', description: 'Concept detail of crisp lawn edges meeting planted borders.', imageBrief: 'Illustrative concept — crisp lawn edge meeting a planted border' },
  { title: 'Entry Garden', category: 'garden-design', ratio: '5/4', description: 'Concept for a front garden that frames the approach to the home.', imageBrief: 'Illustrative concept — front garden framing the approach to a home' },
].map((p) => ({ featured: false, ...p, illustrative: true, published: true }));

type Seed = { fields: Record<string, unknown>; published?: boolean }[];
const f = (fields: Record<string, unknown>) => ({ fields });

export const CONTENT_SEED: Record<string, Seed> = {
  step: [
    f({ title: 'Tell us about your outdoor space', text: 'Share a few details and photos of the area through the estimate form, by phone, or by email.' }),
    f({ title: 'Discuss your landscaping goals', text: 'Talk through how you would like to use the space, what matters most, and any ideas you have.' }),
    f({ title: 'Review the proposed next steps', text: 'Receive an outline of the recommended approach so you can consider it clearly.' }),
    f({ title: 'Move forward with confidence', text: 'Work begins once the scope and estimate have been agreed.' }),
  ],
  principle: [
    f({ title: 'Start with the property', text: 'Light, layout, existing planting, and how the space is reached all shape what will work well — so the property itself is the starting point.' }),
    f({ title: 'Design around your priorities', text: 'Whether it is a place to gather, a calmer garden, or a tidier first impression, the plan follows how you want to use the space.' }),
    f({ title: 'Keep next steps clear', text: 'You should always know what is proposed and what happens next before any work goes ahead.' }),
  ],
  'form-option': [
    ...['Small outdoor space', 'Medium outdoor space', 'Large outdoor space', 'Not sure yet'].map((label) => f({ list: 'area', label })),
    ...['As soon as possible', 'Within one month', 'Within three months', 'Flexible / still planning'].map((label) => f({ list: 'timeline', label })),
  ],
};
