# Rhodes Landscaping — data model extracted from the design comp

Sources: `design-source/Rhodes Landscaping.dc.html` and `design-source/Handoff.md`. The backend contract in the handoff is implemented as written.

## Identity

- **Business:** Rhodes Landscaping, owned by Easton Rhodes.
  - Address: 201 S Anaheim Blvd, Anaheim, CA 92805.
  - Phone: +1 (919) 238-7861.
  - Email: easton.rhodes@rhodeslandscaping.com.
  - Logo: a typographic wordmark — "Rhodes" set in Newsreader, with "LANDSCAPING" in small caps.
- **Fonts:**
  - Newsreader 400 for display text, with italic accents (`<em>`).
  - Manrope 400–700 for body and interface text, at 16–17.5px with a 1.65–1.7 line height.
- **Colours:**

  | Role | Value |
  |---|---|
  | Forest (primary buttons) | `#244A35` |
  | Deep green (dark sections, hover) | `#173426` |
  | Hero image background | `#2B4636` |
  | Sage (decorative only, never text) | `#82947B` |
  | Sand | `#E8DDC8` |
  | Ivory canvas | `#FAF9F5` |
  | White (form surface) | `#FFFFFF` |
  | Stone (borders, image backgrounds) | `#E7E5DD` |
  | Lines | `#CFCBC0` / `#DAD6CB` |
  | Text — charcoal / body / secondary | `#252923` / `#3F433C` / `#66655E` |
  | Error | `#A33A22` on `#FBEDE7`, border `#E2B5A3` |
  | Focus ring | `#B5542B` |

- **Shapes:** 4px radius on buttons and inputs, 999px on chips, square images.
- **Motion:**
  - Easing `cubic-bezier(.2,.7,.2,1)`. Text reveals take 650ms and rise 22px; image masks reveal top-down over 900ms; items stagger by 110ms.
  - The header bar shows scroll progress in sage.
  - All motion is off under `prefers-reduced-motion`.
  - Content that is already in view is never hidden.
- **Layout:**
  - Max width 1360px; gutter `clamp(20px,4vw,56px)`.
  - The mobile menu dialog takes over below 900px (Esc closes it, focus is trapped).
  - The header is transparent over the full-bleed home hero and turns solid ivory after 40px of scroll.

## Routes

| Comp | App | Sections |
|---|---|---|
| `#/home` | `/` | Hero (full-bleed or split, per Settings) · Our approach (2 images) · Services (4 staggered features) · Project gallery teaser (3 featured, dark band) · How it works (4 steps) · CTA band (sand, image) |
| `#/services[/slug]` | `/services`, `/services/[slug]` → `#slug` | Intro · wide image · sticky service chips · 4 service sections, each with a number, description, benefit list, "What this may include" accordion, estimate CTA and related projects · "Not sure which service fits?" |
| `#/projects[/slug]` | `/projects`, `/projects/[slug]` (filter) | Intro · illustrative-content note · sticky filters (All Projects + 4 services) with a live count · masonry columns · lightbox (Esc, ←/→, focus trap, focus return) · empty states · CTA |
| `#/about` | `/about` | Intro + image · Meet Easton Rhodes + owner photo slot · 3 principles (sand) · "How a project could unfold" (vertical timeline, sticky heading) · CTA |
| `#/contact[/slug]` | `/contact`, `/contact/[slug]` (preselects the project type) | Contact panel (sticky) · estimate form · success panel |
| — | `/privacy`, 404 | — |

## Content (seeded verbatim)

- **Services** (dedicated table; filters, the form and projects all reference the slug):
  - garden-design, lawn-care, planting, outdoor-improvements.
  - Each has: name, home summary, description, 3 benefits, "What this may include" items, CTA label ("Request a Garden Design Estimate"…) and image briefs.
- **Projects** (dedicated table): 9 illustrative concepts.
  - Fields: title, category (service slug), description, image brief, aspect ratio.
  - Marked `illustrative = true`.
  - Featured on the home page: Layered Courtyard Garden, Stone Path & Entry, Textural Perennial Border.
- **Content blocks:**
  - `step` (4) — How it works.
  - `principle` (3).
  - `form-option`: area (4), timeline (4).
  - `site-image` slots: home-hero, home-intro-main, home-intro-detail, home-cta, services-hero, about-hero, about-owner.
- **Settings:**
  - Business details, owner, location label ("Anaheim, California") and footer tagline.
  - About copy: lead paragraph plus two business paragraphs.
  - Privacy text.
  - Flags (below).

## Estimate request (`POST /api/estimate-requests`) — exact rules

| Field | Rule → message |
|---|---|
| name | ≥ 2 → "Enter your full name." |
| phone | required → "Enter a phone number so we can reach you."; only `+ digits space ( ) . -`, with 10–15 digits → "Enter a valid phone number with 10–15 digits, e.g. (714) 555-0123." |
| email | required → "Enter your email address."; format → "Enter an email address in the format name@example.com." |
| projectType | a published service name or "Other" → "Choose the type of project." |
| area | optional; Small / Medium / Large outdoor space / Not sure yet |
| location | ≥ 3 → "Enter the property address or area, e.g. street and city." |
| timeline | from the list → "Choose when you would like to start." |
| details | ≥ 20 → "Describe your project in a little more detail (at least 20 characters)." |
| imageIds | optional; up to 5 ids from `POST /api/uploads` |
| idempotencyKey | in the body or the `Idempotency-Key` header; a repeat returns the same reference |
| website | honeypot |

### Responses

- `201 { id, receivedAt }` on success.
- `422 { errors }` for field errors.
- `429` / `5xx { message }` otherwise.

### Uploads (`POST /api/uploads` → `{ imageId, url }`)

- JPG, PNG or WebP only, checked by magic bytes; 10 MB each; 5 per request.
- EXIF is stripped (JPEG APP1, PNG eXIf, WebP EXIF chunk).
- Files are stored privately and served only to signed-in admins.

### Form behaviour

- **Error summary:** "Please check N fields before sending:", with links to each field.
- **Inline errors:** shown after blur.
- **Failure banner:** "Your request couldn't be sent." The button becomes "Try again".
- **Success panel:** "Thank you for reaching out to Rhodes Landscaping.", plus a recap and three actions — **Edit my details**, **Back to Home**, **Start a new request**.

## Admin leads (Handoff)

- List with search, project-type filter, sort by timestamp, and status filter (new / contacted / quoted / closed).
- Detail view showing contact details and the attached images.
- Loading, empty and error states.

## Flags (comp `data-props` → Settings)

| Prop | Default | Implementation |
|---|---|---|
| `heroStyle` | fullbleed | Setting `heroStyle` (fullbleed \| split). |
| `reviewNotes` | true | Setting `showReviewNotes` — the dashed "Draft / confirm with Easton" tags. |
| `galleryContent` | illustrative | Not reproduced. Real published projects drive the gallery, and the "Illustrative" labels appear only on projects flagged as illustrative. |
| `submitOutcome` | success | Not reproduced. Real API errors drive the failure state. |

## Simulated in the comp → real here

- **Form submission:** a 1.6 s browser timer → a real API, stored with status and history.
- **Photo uploads:** local previews with fake progress → real uploads with real progress, EXIF stripped, stored privately.
- **Gallery:** the hardcoded `static D.PROJECTS` → the projects table, managed in the admin.
- **Before/after:** not built in the comp → the slider shows only when a project has both a before image and an after image.
