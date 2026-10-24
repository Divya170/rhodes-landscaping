-- Rhodes Landscaping — SQLite schema (reference).
-- The NestJS API creates and updates these tables itself on boot (TypeORM, synchronize: true)
-- in database/app.sqlite. On first run it seeds settings, the 4 services, 9 illustrative projects
-- and the page content (steps, principles, form options) from the design comp.
-- This file only documents the structure; you do not need to run it.

CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email VARCHAR NOT NULL UNIQUE,
  name VARCHAR NOT NULL,
  passwordHash VARCHAR NOT NULL,              -- bcrypt
  lastLoginAt DATETIME,
  createdAt DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- Singleton row (id = 1): business details, page copy and the design's flags
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY,
  businessName VARCHAR NOT NULL DEFAULT 'Rhodes Landscaping',
  contactName VARCHAR NOT NULL DEFAULT '',
  phone VARCHAR,
  email VARCHAR,
  addressLine1 VARCHAR,
  addressLine2 VARCHAR,
  locationLabel VARCHAR NOT NULL DEFAULT '',  -- "Anaheim, California"
  tagline VARCHAR NOT NULL DEFAULT '',
  aboutLead TEXT NOT NULL DEFAULT '',
  aboutBody TEXT NOT NULL DEFAULT '',
  privacyPolicy TEXT NOT NULL DEFAULT '',
  heroStyle VARCHAR NOT NULL DEFAULT 'fullbleed',   -- fullbleed | split
  showReviewNotes BOOLEAN NOT NULL DEFAULT 1,       -- "Draft / confirm with Easton" tags
  estimatesOpen BOOLEAN NOT NULL DEFAULT 1,
  photoUploadsOpen BOOLEAN NOT NULL DEFAULT 1,
  updatedAt DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- Services: drive the Services page, home features, gallery filters, project categories
-- and the estimate form's "Project type" options (+ "Other").
CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug VARCHAR NOT NULL UNIQUE,               -- fixed after creation; "other" is reserved
  name VARCHAR NOT NULL,
  summary TEXT NOT NULL DEFAULT '',           -- home page feature text
  description TEXT NOT NULL DEFAULT '',
  benefits TEXT NOT NULL,                     -- JSON string[]
  includes TEXT NOT NULL,                     -- JSON string[] ("What this may include")
  ctaLabel VARCHAR NOT NULL DEFAULT '',
  image VARCHAR, homeImage VARCHAR, detailImage VARCHAR, detailImage2 VARCHAR,
  imageAlt VARCHAR NOT NULL DEFAULT '',
  imageBrief VARCHAR NOT NULL DEFAULT '',
  published BOOLEAN NOT NULL DEFAULT 1,
  sortOrder INTEGER NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL DEFAULT (datetime('now')),
  updatedAt DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- Gallery projects
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category VARCHAR NOT NULL,                  -- services.slug
  title VARCHAR NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image VARCHAR,
  imageAlt VARCHAR NOT NULL DEFAULT '',
  imageBrief VARCHAR NOT NULL DEFAULT '',
  ratio VARCHAR NOT NULL DEFAULT '4/5',       -- 4/5 | 3/2 | 1/1 | 5/4
  location VARCHAR NOT NULL DEFAULT '',
  beforeImage VARCHAR,                        -- slider shows only when both are set
  afterImage VARCHAR,
  featured BOOLEAN NOT NULL DEFAULT 0,        -- first three appear on the home page
  illustrative BOOLEAN NOT NULL DEFAULT 0,    -- shows "Illustrative concept" publicly
  published BOOLEAN NOT NULL DEFAULT 1,
  sortOrder INTEGER NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL DEFAULT (datetime('now')),
  updatedAt DATETIME NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_projects_pub ON projects (published, sortOrder);

-- Generic page content. type: step | principle | form-option | site-image
-- fields (JSON): step/principle {title, text}; form-option {list: area|timeline, label};
--                site-image {slot, image, alt}
CREATE TABLE IF NOT EXISTS content_blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type VARCHAR NOT NULL,
  sortOrder INTEGER NOT NULL DEFAULT 0,
  fields TEXT NOT NULL,
  published BOOLEAN NOT NULL DEFAULT 1,
  createdAt DATETIME NOT NULL DEFAULT (datetime('now')),
  updatedAt DATETIME NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_content_type ON content_blocks (type, sortOrder);

-- Estimate requests from /contact (Handoff: "Estimate request API")
CREATE TABLE IF NOT EXISTS estimate_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_ref VARCHAR UNIQUE,                  -- RL-1001
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  email VARCHAR(160) NOT NULL,
  project_type VARCHAR NOT NULL,              -- services.slug or "other"
  area VARCHAR NOT NULL DEFAULT '',
  location VARCHAR(200) NOT NULL,
  timeline VARCHAR NOT NULL,
  details TEXT NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'new',      -- new | contacted | quoted | closed
  notes TEXT NOT NULL DEFAULT '',             -- internal, admin only
  idempotency_key VARCHAR UNIQUE,
  notification_state VARCHAR NOT NULL DEFAULT 'disabled',    -- disabled | sent | failed
  acknowledgement_state VARCHAR NOT NULL DEFAULT 'disabled',
  ip_hash VARCHAR NOT NULL DEFAULT '',        -- salted hash, never the raw IP
  createdAt DATETIME NOT NULL DEFAULT (datetime('now')),
  updatedAt DATETIME NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_est_status ON estimate_requests (status);
CREATE INDEX IF NOT EXISTS idx_est_created ON estimate_requests (createdAt);
CREATE INDEX IF NOT EXISTS idx_est_email ON estimate_requests (email);

-- Inspiration photos (POST /api/uploads). Stored privately in backend/private-uploads,
-- EXIF removed. request_id is NULL until attached; unattached rows are deleted after 24 h.
CREATE TABLE IF NOT EXISTS estimate_images (
  id VARCHAR PRIMARY KEY,                     -- random id returned as imageId
  request_id INTEGER,
  original_name VARCHAR NOT NULL,
  stored_name VARCHAR NOT NULL,
  mime VARCHAR NOT NULL,                      -- image/jpeg | image/png | image/webp
  size INTEGER NOT NULL,
  ip_hash VARCHAR NOT NULL DEFAULT '',
  createdAt DATETIME NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_est_images_req ON estimate_images (request_id);

-- Status history for estimate requests
CREATE TABLE IF NOT EXISTS status_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  record_type VARCHAR NOT NULL,               -- estimate
  record_id INTEGER NOT NULL,
  status VARCHAR NOT NULL,
  changed_by VARCHAR NOT NULL,                -- "website" or the admin's email
  created_at DATETIME NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_events_record ON status_events (record_type, record_id);
