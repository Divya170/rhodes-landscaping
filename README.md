# Rhodes Landscaping — website

This is the full-stack build of the `Rhodes Landscaping.dc.html` design comp, which is kept in `design-source/`. It also implements the "Future backend" contract from `design-source/Handoff.md`.

- **frontend/**: Next.js 14 (App Router). The public site plus an admin area at `/admin`.
- **backend/**: NestJS 10 API. It holds all business rules, validation, uploads, auth and email.
- **database/**: SQLite 3 file (`app.sqlite`, created on first run) and a reference `schema.sql`.

No content is hard-coded in the frontend. Every page renders from the API: services, projects, steps, principles, form options, page photos, business details and flags.

## Run it

Requirements: Node 18.18+ (20 LTS recommended) and npm.

```bash
cp backend/.env.example backend/.env        # set SESSION_SECRET and ADMIN_PASSWORD
cp frontend/.env.example frontend/.env.local
npm install            # installs "concurrently" at the root
npm run install:all    # backend + frontend dependencies
npm run dev            # API on :4000, site on :3000
```

- Site: http://localhost:3000
- Admin: http://localhost:3000/admin
  - Email: `admin@rhodeslandscaping.local`
  - Password: `RhodesAdmin#2026`
  - Both come from `backend/.env` and are seeded only when no admin exists. Change the password under **Account** after the first login.
- Validation tests: `npm test` (runs `backend/src/rules.spec.ts` — 8 checks).
- Production: `npm run build && npm start`.

The browser only talks to the Next.js origin. `/api/*` and `/uploads/*` are rewritten to the API, so no CORS setup is needed and the session cookies stay first-party.

## Public site

| Route | What it shows |
|---|---|
| `/` | Hero (full-bleed or split, set in Settings) · Our approach · 4 service features · featured projects band with lightbox · How it works (4 steps) · CTA band |
| `/services` | Intro · sticky service chips · one numbered section per service (description, benefits, "What this may include" accordion, estimate CTA, related projects) · "Not sure which service fits?" |
| `/services/[slug]` | Redirects to `/services#slug` |
| `/projects`, `/projects/[slug]` | Gallery filtered by service, live count, masonry layout, lightbox (Esc, ←/→, focus trap, focus return), before/after slider when a project has both photos, empty states |
| `/about` | Intro · Meet Easton Rhodes · 3 principles · "How a project could unfold" timeline · CTA |
| `/contact`, `/contact/[slug]` | Contact panel and the estimate form; the slug preselects the project type |
| `/privacy` | Privacy text from Settings, or a "being finalised" notice while it is empty |
| 404, error, loading | Designed states for each |

### Estimate form (`/contact`)

- Uses the exact field rules and messages from the comp: inline errors after blur, an error summary ("Please check N fields before sending:") with links to each field, and a failure banner where the button becomes "Try again".
- **Photos:** up to 5 JPG/PNG/WebP files, 10 MB each. They upload immediately with real progress, can be retried or removed, and their checks are repeated on the server.
- **Success card:** "Thank you for reaching out to Rhodes Landscaping." with the reference (RL-1001…), a recap and three next actions — **Edit my details**, **Back to Home**, **Start a new request**.
- When **Accept estimate requests** is off in Settings, the form is replaced by a call/email panel and the API rejects new requests.

## API (all under `/api`)

| Endpoint | Purpose |
|---|---|
| `GET /site` | Everything a page needs in one call (settings, services, projects, steps, principles, form options, page photos) |
| `GET /services`, `GET /projects?category=`, `GET /settings` | Public data (Handoff contract) |
| `GET /estimate-requests/options` | Whether the form and uploads are open, plus limits |
| `POST /uploads` | Multipart `file` → `{ imageId, url: null, name, size }` |
| `POST /estimate-requests` | → `201 { id, receivedAt }`; `422 { errors }`; `429` / `5xx { message }` |
| `/admin-auth/*` | Login, logout, me, change password |
| `/admin/estimate-requests` | List (search, project type, status, sort, paging), counts, CSV export, detail, private photo download, PATCH status/notes, resend notification, DELETE |
| `/admin/services`, `/admin/projects`, `/admin/content`, `/admin/settings` | CMS CRUD and reorder |

### How submissions are protected

- **Validation:** every rule lives in pure modules (`estimate-validation.ts`, `services.validation.ts`, `content.validation.ts`). The frontend mirrors them for instant feedback, but the API is the authority.
- **Idempotency:** a repeated `idempotencyKey` (body or `Idempotency-Key` header) returns the original reference and never creates a second row.
- **Spam:** a honeypot field (`website`) and per-IP rate limits — 5 estimates per 10 min (configurable) and 30 uploads per 10 min.
- **Uploads:** the file type is checked from its bytes, not its name or MIME header. EXIF/XMP metadata (location!) is stripped. Files are stored outside the public folder and served only to signed-in admins. Uploads never attached to a request are deleted after 24 h. Deleting a request deletes its photos.
- **Admin:** an HttpOnly session cookie with a CSRF token on every write, bcrypt passwords and a throttled login.
- **Email (optional):** with `SMTP_HOST` set, the owner is notified and the customer gets an acknowledgement after the request is saved. A failed send is recorded and can be resent from the admin; it never loses the request.

## Admin (`/admin`)

- **Estimate requests:**
  - List with search, project-type and status filters (new / contacted / quoted / closed), newest/oldest sort, paging, a photo count and CSV export.
  - Detail page with contact details, all answers, the attached photos (open full size), status with history, internal notes and resend email.
  - The nav badge counts new requests. Loading, empty and error states are included.
- **Services:** add, edit, reorder, publish/hide and delete. Fields: name, summary, description, benefits, "What this may include" items, CTA label, four photos and alt text. Changes flow to the home page, Services page, gallery filters and the form's project types.
- **Projects:** add, edit, reorder, feature on home, publish/hide and delete. Fields: service, title, description, photo and alt text, tile shape, verified location, before/after pair and the illustrative flag.
- **Content & photos:** How-it-works steps, About principles, estimate-form options (area and timeline) and the 7 page photo slots.
- **Business & settings:** business and contact details, location label, footer tagline, About copy and privacy text. Also the toggles for estimates open, photo uploads, review notes and the hero layout.
- **Account:** change password.

Every admin form validates on the server, shows field errors, and confirms with a toast or a saved state.

## Missing / not implemented — needs action before launch

**Needs client confirmation** (from the Handoff; the design copy is seeded as-is and can be edited in the admin):

1. All service descriptions and "What this may include" lists.
2. The four process steps.
3. About copy and Easton Rhodes's background.
4. Whether seasonal maintenance is offered — it is currently left out.
5. An owner photo for the About page (the slot shows a placeholder).
6. Privacy policy and consent wording. None was invented, so `/privacy` shows a "being finalised" notice until text is added in Settings.
7. The logo — a typographic wordmark is used for now.
8. Whether to add a map. No map is built; the address links to Google Maps.

**Content gaps:**

- **No photography.** Every image is a labelled placeholder showing its brief. Upload real photos under Admin → Content & photos, Services and Projects.
- **The gallery is illustrative.** The 9 seeded projects are concepts flagged "Illustrative concept". Replace them with real, approved Rhodes projects and untick the flag (or delete them).
- **No before/after pairs.** The slider is built but stays hidden until a project has both a verified before and after photo.
- **One photo per project.** The Handoff model has `images[]`; this build stores a single image plus the optional before/after pair. A multi-photo gallery per project would need an extra table.
- **Turn off review notes before launch.** The "Draft / confirm with Easton" tags are on by default (Settings → Show review notes).

**Technical limits:**

- **No CAPTCHA.** Spam protection is the honeypot plus rate limiting. Add Turnstile or hCaptcha if spam appears.
- **In-memory rate limits.** They reset on restart and are per process. Use a shared store (e.g. Redis) when running more than one instance.
- **Upload URLs.** The Handoff suggests signed URLs. Here, customer photos are streamed through an authenticated admin route instead, and `url` in the upload response is `null`.
- **Email needs an SMTP account.** Status changes do not email the customer; follow-up is by phone or email.
- **One admin role.** No roles or multi-user management; extra admins must be added directly in the database.
- **Schema sync.** `synchronize: true` creates tables automatically. Switch to migrations before changing the schema on a live database.
- **No automatic deletion** of old estimate requests (data-retention policy still to be decided).
- **Not run end to end here.** The build environment had no access to the npm registry, so dependencies could not be installed. The code was type-checked against stub types, and the backend validation suite (`npm test`) passes. Run `npm run install:all && npm run dev` and click through the site and admin before deploying.
- **Accessibility not tested on real devices.** The Handoff notes that screen-reader and real-device touch testing were not done; this build has not done them either.
