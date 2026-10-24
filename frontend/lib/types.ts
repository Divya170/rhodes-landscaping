export interface PublicSettings {
  businessName: string;
  contactName: string;
  phone: string | null;
  telHref: string | null;
  email: string | null;
  mailHref: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  address: string;
  mapHref: string | null;
  locationLabel: string;
  tagline: string;
  aboutLead: string;
  aboutBody: string;
  privacyPolicy: string;
  heroStyle: 'fullbleed' | 'split';
  showReviewNotes: boolean;
  estimatesOpen: boolean;
  photoUploadsOpen: boolean;
}

export interface Service {
  id: number;
  slug: string;
  n: string;
  name: string;
  summary: string;
  description: string;
  benefits: string[];
  includes: string[];
  ctaLabel: string;
  image: string | null;
  homeImage: string | null;
  detailImage: string | null;
  detailImage2: string | null;
  imageAlt: string;
  imageBrief: string;
}

export interface Project {
  id: number;
  category: string;
  categoryLabel: string;
  title: string;
  description: string;
  image: string | null;
  imageAlt: string;
  imageBrief: string;
  ratio: string;
  location: string;
  beforeImage: string | null;
  afterImage: string | null;
  featured: boolean;
  illustrative: boolean;
}

export interface TextItem {
  id: number;
  title: string;
  text: string;
}

export type SiteImages = Record<string, { url: string; alt: string } | undefined>;

export interface SiteData {
  settings: PublicSettings;
  services: Service[];
  projects: Project[];
  steps: TextItem[];
  principles: TextItem[];
  options: { area: string[]; timeline: string[] };
  images: SiteImages;
}

export interface EstimateOptions {
  open: boolean;
  photosOpen: boolean;
  maxImages: number;
  maxImageMb: number;
}

export type Opt = { value: string; label: string };

// ---------- admin ----------

export interface HistoryEvent {
  status: string;
  label: string;
  by: string;
  at: string;
}

export interface LeadImage {
  id: string;
  name: string;
  mime: string;
  size: number;
  url: string;
}

export interface Lead {
  id: number;
  publicRef: string | null;
  name: string;
  phone: string;
  email: string;
  projectType: string;
  projectTypeLabel: string;
  area: string;
  location: string;
  timeline: string;
  details: string;
  status: string;
  statusLabel: string;
  notes: string;
  notificationState: string;
  acknowledgementState: string;
  createdAt: string;
  imageCount?: number;
  images?: LeadImage[];
  history?: HistoryEvent[];
}

export interface ListResult<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
  limit: number;
  counts: Record<string, number>;
  types?: Opt[];
  notificationsConfigured: boolean;
}

export interface AdminService {
  id: number;
  slug: string;
  name: string;
  summary: string;
  description: string;
  benefits: string[];
  includes: string[];
  ctaLabel: string;
  image: string | null;
  homeImage: string | null;
  detailImage: string | null;
  detailImage2: string | null;
  imageAlt: string;
  imageBrief: string;
  published: boolean;
  sortOrder: number;
  updatedAt: string;
}

export interface AdminProject {
  id: number;
  category: string;
  categoryLabel: string;
  title: string;
  description: string;
  image: string | null;
  imageAlt: string;
  imageBrief: string;
  ratio: string;
  location: string;
  beforeImage: string | null;
  afterImage: string | null;
  featured: boolean;
  illustrative: boolean;
  published: boolean;
  sortOrder: number;
  updatedAt: string;
}

export type FieldKind = 'text' | 'textarea' | 'list' | 'select' | 'image';
export interface FieldDef {
  key: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  max?: number;
  options?: Opt[];
  help?: string;
}
export interface ContentTypeDef {
  type: string;
  label: string;
  page: string;
  description: string;
  titleField: string;
  fields: FieldDef[];
  uniqueBy?: string;
}
export interface AdminContentItem {
  id: number;
  type: string;
  sortOrder: number;
  fields: Record<string, unknown>;
  published: boolean;
  updatedAt: string;
}

export interface AdminSettings {
  businessName: string;
  contactName: string;
  phone: string | null;
  email: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  locationLabel: string;
  tagline: string;
  aboutLead: string;
  aboutBody: string;
  privacyPolicy: string;
  heroStyle: 'fullbleed' | 'split';
  showReviewNotes: boolean;
  estimatesOpen: boolean;
  photoUploadsOpen: boolean;
  updatedAt: string;
}
