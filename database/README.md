# Database

SQLite 3. The file `database/app.sqlite` is created by the API the first time it starts (TypeORM `synchronize: true`), then seeded once:

- `settings`: Rhodes Landscaping's details, About copy, privacy text and the flags (hero style, review notes, estimates open, photo uploads open).
- `services`: Garden Design, Lawn Care, Planting, Outdoor Improvements (copied verbatim from the design).
- `projects`: the 9 illustrative gallery concepts (marked `illustrative = 1`); 3 are featured on the home page.
- `content_blocks`: 4 "How it works" steps, 3 About principles, 8 estimate-form options (area × 4, timeline × 4).
- `admin_users`: one admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `backend/.env`.

`schema.sql` documents every table; you don't need to run it.

**Reset:** stop the API, delete `database/app.sqlite`, start the API again.

**Backups:** copy `app.sqlite` together with `backend/uploads/` (site photos) and `backend/private-uploads/` (customer photos). Customer photos are personal data — keep backups private.

**Production:** turn off `synchronize` and use migrations before the schema is changed on a live database.
