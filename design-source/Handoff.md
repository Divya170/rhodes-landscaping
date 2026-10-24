# Rhodes Landscaping — Prototype Handoff

Prototype: `Rhodes Landscaping.dc.html`. Pages use hash routing: `#/home`, `#/services[/slug]`, `#/projects[/slug]`, `#/about`, `#/contact[/slug]`. Service slugs: `garden-design`, `lawn-care`, `planting`, `outdoor-improvements`. A slug on `/contact` preselects the project type, and on `/projects` it sets the gallery filter.

## Design tokens
- Colours: forest `#244A35` (primary actions), deep green `#173426` (dark sections, hover), sage `#82947B` (decorative only — not for text), sand `#E8DDC8`, ivory `#FAF9F5` (canvas), white `#FFFFFF` (form surface), stone `#E7E5DD` (borders and image backgrounds), charcoal `#252923` (text), body text `#3F433C`, secondary text `#66655E` (darkened from `#77766F` to meet AA contrast), error `#A33A22`, focus ring `#B5542B`
- Type: Newsreader for display and headings (400, italic accents); Manrope for body and UI (400–700). Body text is 16–17.5px with a 1.65–1.7 line height
- Radius: 4px for buttons and inputs, 999px for chips, 0 for images
- Motion: micro-interactions 150–200ms; standard transitions 250–300ms; text reveals 650ms; image mask reveals 900ms. Easing is `cubic-bezier(.2,.7,.2,1)` and steps are staggered by 110ms. All motion is turned off when `prefers-reduced-motion` is set
- Layout: 1360px max width, gutter `clamp(20px,4vw,56px)`, and the desktop navigation switches to the mobile menu below 900px

## Components
Header (transparent over the hero, then solid), mobile menu dialog, wordmark, primary/secondary/text buttons, eyebrow label, service feature, numbered service section with accordion, sticky service chips, gallery filters, gallery tile, lightbox dialog, process timeline (horizontal and vertical), principles list, CTA bands, form field, chip radio group, select, upload dropzone with file rows, error summary, failure banner, success panel, contact panel, footer, and review-note tag.

## Assets needed
Every image is an `<image-slot>` placeholder. You can drag a photo onto any slot to replace it; the gallery slot and its lightbox share the same image. Needed images:
- 1 hero
- 2 intro images
- 4 home service images and 8 services-page images
- 3 about-page images
- 9 gallery images (currently illustrative)
- 1 CTA image

Search terms: "contemporary residential garden California daylight", "layered drought-tolerant planting border", "natural stone garden path", "neatly edged lawn front yard", "patio seating with planting". Only use real Rhodes project photos in the gallery, and remove the "Illustrative concept" labels once they are approved. The before/after slider is **not built** because no verified matching photo pairs exist.

## Prototype-only behaviour
- Form submission is simulated in the browser (1.6s delay). Nothing is sent or stored. The `submitOutcome` tweak lets you preview the failure state
- Photo "upload" only creates local previews with a simulated progress bar. No files leave the browser
- Gallery data is hardcoded (`static D.PROJECTS`). The `galleryContent` tweak shows the empty state

## Future backend
**POST /api/estimate-requests**
- Request: `{ name, phone, email, projectType: enum, area?: enum, location, timeline: enum, details, imageIds?: string[], idempotencyKey }`
- Success: `201 { id, receivedAt }`
- Errors: `422 { errors: { field: message } }` and `429` / `5xx { message }`

The client already disables the form while a request is in progress. The server must still deduplicate requests using `idempotencyKey`.

**POST /api/uploads**
- Multipart upload or a presigned URL, returning `{ imageId, url }`
- Server-side checks: MIME type, magic bytes, and the 10MB / 5-file limits. Strip EXIF data, store files in private storage, and serve them through signed URLs

**Services and projects:** `GET /api/services` and `GET /api/projects?category=`

Project model: `{ id, title, category, description, images[], beforeImage?, afterImage?, location? (verified only), published }`. Admin CMS endpoints need authentication.

**Admin leads**
- List view with search, project-type filter, sort by timestamp, and status (new / contacted / quoted / closed)
- Detail view showing contact info and image references
- Empty, loading, and error states. Not included in the public site

## Needs client confirmation
- All service descriptions and accordion contents
- The process steps
- About copy and Easton's background
- Whether seasonal maintenance is offered (currently excluded)
- An owner photo
- Privacy policy and consent wording (none has been invented)
- Logo (a typographic wordmark is used for now)
- Whether to add a map

## QA summary
**Built to work:** navigation, active states, deep links, mobile menu (Esc to close, focus trap), service anchors, accordions, gallery filters, lightbox (arrow keys / Esc / focus return), form validation (inline errors and an error summary), entered values kept after errors, loading / failure / success states, the "Edit my details" return path, and file type, size and count checks with previews and removal.

**Not verified:** screen-reader testing on real devices, and real-device touch testing.
