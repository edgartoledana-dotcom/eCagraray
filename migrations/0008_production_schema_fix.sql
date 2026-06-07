-- =============================================================================
-- e-Cagraray — Production Schema Completion
-- Safely creates all still-missing tables and indexes.
-- All CREATE TABLE / CREATE INDEX use IF NOT EXISTS so this is idempotent.
-- =============================================================================

-- =============================================================================
-- Users & Authentication
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY NOT NULL,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  contact       TEXT DEFAULT '',
  address       TEXT DEFAULT '',
  birthdate     TEXT DEFAULT '',
  gender        TEXT DEFAULT '',
  role          TEXT NOT NULL DEFAULT 'resident'
                CHECK (role IN ('super_admin','captain','secretary','sk_officer','disaster','resident')),
  approved      INTEGER NOT NULL DEFAULT 0,
  occupation    TEXT DEFAULT '',
  is_pwd        TEXT DEFAULT 'No',
  civil_status  TEXT DEFAULT 'Single',
  blood_type    TEXT DEFAULT 'O+',
  emergency_contact TEXT DEFAULT '',
  emergency_phone   TEXT DEFAULT '',
  purok         TEXT DEFAULT '',
  religion      TEXT DEFAULT '',
  nationality   TEXT DEFAULT '',
  education_level TEXT DEFAULT '',
  philhealth_no TEXT DEFAULT '',
  tin_no        TEXT DEFAULT '',
  voter_id_no   TEXT DEFAULT '',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_approved ON users(approved);

-- =============================================================================
-- Barangay Info (singleton)
-- =============================================================================
CREATE TABLE IF NOT EXISTS barangay_info (
  id            INTEGER PRIMARY KEY CHECK (id = 1),
  name          TEXT NOT NULL DEFAULT 'Barangay Cagraray',
  municipality  TEXT NOT NULL DEFAULT 'Bato',
  province      TEXT NOT NULL DEFAULT 'Catanduanes',
  address       TEXT NOT NULL DEFAULT '',
  contact       TEXT NOT NULL DEFAULT '',
  email         TEXT NOT NULL DEFAULT '',
  captain       TEXT NOT NULL DEFAULT '',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO barangay_info (id, name, municipality, province, address, contact, email, captain)
VALUES (1, 'Barangay Cagraray', 'Bato', 'Catanduanes', 'Cagraray, Bato, Catanduanes', '+63 977 008 6455', 'ecagraraymanagementsystem@gmail.com', '');

-- =============================================================================
-- Residents
-- =============================================================================
CREATE TABLE IF NOT EXISTS residents (
  id            TEXT PRIMARY KEY NOT NULL,
  full_name     TEXT NOT NULL,
  birthdate     TEXT DEFAULT '',
  gender        TEXT DEFAULT '',
  civil_status  TEXT DEFAULT 'Single',
  blood_type    TEXT DEFAULT 'O+',
  contact       TEXT DEFAULT '',
  email         TEXT DEFAULT '',
  address       TEXT DEFAULT '',
  purok         TEXT DEFAULT '',
  household_id  TEXT DEFAULT '',
  occupation    TEXT DEFAULT '',
  is_pwd        TEXT DEFAULT 'No',
  religion      TEXT DEFAULT '',
  nationality   TEXT DEFAULT '',
  education_level TEXT DEFAULT '',
  emergency_contact  TEXT DEFAULT '',
  emergency_phone    TEXT DEFAULT '',
  philhealth_no TEXT DEFAULT '',
  tin_no        TEXT DEFAULT '',
  voter_id_no   TEXT DEFAULT '',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_residents_full_name ON residents(full_name);
CREATE INDEX IF NOT EXISTS idx_residents_purok ON residents(purok);
CREATE INDEX IF NOT EXISTS idx_residents_household ON residents(household_id);

-- =============================================================================
-- Households
-- =============================================================================
CREATE TABLE IF NOT EXISTS households (
  id            TEXT PRIMARY KEY NOT NULL,
  code          TEXT NOT NULL,
  head          TEXT NOT NULL DEFAULT '',
  address       TEXT DEFAULT '',
  members       INTEGER NOT NULL DEFAULT 0,
  purok         TEXT DEFAULT '',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_households_code ON households(code);
CREATE INDEX IF NOT EXISTS idx_households_purok ON households(purok);

-- =============================================================================
-- Officials
-- =============================================================================
CREATE TABLE IF NOT EXISTS officials (
  id            TEXT PRIMARY KEY NOT NULL,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL,
  committee     TEXT DEFAULT '',
  contact       TEXT DEFAULT '',
  term_start    TEXT DEFAULT '',
  term_end      TEXT DEFAULT '',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_officials_role ON officials(role);

-- =============================================================================
-- Announcements
-- =============================================================================
CREATE TABLE IF NOT EXISTS announcements (
  id            TEXT PRIMARY KEY NOT NULL,
  title         TEXT NOT NULL,
  body          TEXT NOT NULL DEFAULT '',
  category      TEXT NOT NULL DEFAULT 'General',
  pinned        INTEGER NOT NULL DEFAULT 0,
  archived      INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'Published',
  submitted_by  TEXT DEFAULT '',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_announcements_category ON announcements(category);
CREATE INDEX IF NOT EXISTS idx_announcements_pinned ON announcements(pinned);
CREATE INDEX IF NOT EXISTS idx_announcements_created ON announcements(created_at);

-- =============================================================================
-- Alerts
-- =============================================================================
CREATE TABLE IF NOT EXISTS alerts (
  id            TEXT PRIMARY KEY NOT NULL,
  type          TEXT NOT NULL DEFAULT 'Emergency',
  level         TEXT NOT NULL DEFAULT 'Moderate'
                CHECK (level IN ('Low','Moderate','High','Critical')),
  title         TEXT NOT NULL,
  description   TEXT DEFAULT '',
  location      TEXT DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('active','resolved')),
  auto_generated INTEGER NOT NULL DEFAULT 0,
  evac_suggested  INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at   TEXT DEFAULT '',
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_level ON alerts(level);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at);

-- =============================================================================
-- Incidents
-- =============================================================================
CREATE TABLE IF NOT EXISTS incidents (
  id            TEXT PRIMARY KEY NOT NULL,
  type          TEXT NOT NULL DEFAULT 'Other',
  description   TEXT NOT NULL DEFAULT '',
  location      TEXT DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'Submitted'
                CHECK (status IN ('Submitted','Under Review','Verified','Resolved')),
  reporter      TEXT NOT NULL DEFAULT 'Anonymous',
  timeline      TEXT NOT NULL DEFAULT '[]',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_type ON incidents(type);
CREATE INDEX IF NOT EXISTS idx_incidents_created ON incidents(created_at);

-- =============================================================================
-- Complaints
-- =============================================================================
CREATE TABLE IF NOT EXISTS complaints (
  id            TEXT PRIMARY KEY NOT NULL,
  subject       TEXT NOT NULL,
  complainant   TEXT NOT NULL DEFAULT '',
  respondent    TEXT DEFAULT '',
  description   TEXT DEFAULT '',
  assigned_to   TEXT DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'Open'
                CHECK (status IN ('Open','Assigned','In Mediation','Resolved','Archived')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_created ON complaints(created_at);

-- =============================================================================
-- Document Requests
-- =============================================================================
CREATE TABLE IF NOT EXISTS document_requests (
  id            TEXT PRIMARY KEY NOT NULL,
  service       TEXT NOT NULL DEFAULT '',
  requester     TEXT NOT NULL DEFAULT '',
  requester_id  TEXT DEFAULT '',
  purpose       TEXT DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'Pending'
                CHECK (status IN ('Pending','Reviewing','Approved','Rejected','Released')),
  archived      INTEGER NOT NULL DEFAULT 0,
  or_number     TEXT DEFAULT '',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_doc_req_status ON document_requests(status);
CREATE INDEX IF NOT EXISTS idx_doc_req_service ON document_requests(service);
CREATE INDEX IF NOT EXISTS idx_doc_req_created ON document_requests(created_at);

-- =============================================================================
-- Emergency Requests
-- =============================================================================
CREATE TABLE IF NOT EXISTS emergency_requests (
  id            TEXT PRIMARY KEY NOT NULL,
  type          TEXT NOT NULL DEFAULT 'Rescue'
                CHECK (type IN ('Rescue','Medical','Relief')),
  priority      TEXT NOT NULL DEFAULT 'Medium'
                CHECK (priority IN ('Low','Medium','High','Emergency')),
  requester     TEXT NOT NULL DEFAULT '',
  requester_id  TEXT DEFAULT '',
  location      TEXT NOT NULL DEFAULT '',
  contact       TEXT DEFAULT '',
  description   TEXT DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'Pending'
                CHECK (status IN ('Pending','Dispatched','En Route','Completed')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_emergency_status ON emergency_requests(status);
CREATE INDEX IF NOT EXISTS idx_emergency_priority ON emergency_requests(priority);
CREATE INDEX IF NOT EXISTS idx_emergency_created ON emergency_requests(created_at);

-- =============================================================================
-- Evacuation Centers
-- =============================================================================
CREATE TABLE IF NOT EXISTS evac_centers (
  id            TEXT PRIMARY KEY NOT NULL,
  name          TEXT NOT NULL,
  location      TEXT DEFAULT '',
  capacity      INTEGER NOT NULL DEFAULT 0,
  occupants     INTEGER NOT NULL DEFAULT 0,
  manager       TEXT DEFAULT '',
  history       TEXT NOT NULL DEFAULT '[]',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_evac_centers_name ON evac_centers(name);

-- =============================================================================
-- Volunteers
-- =============================================================================
CREATE TABLE IF NOT EXISTS volunteers (
  id            TEXT PRIMARY KEY NOT NULL,
  full_name     TEXT NOT NULL,
  contact       TEXT DEFAULT '',
  skills        TEXT DEFAULT '',
  team          TEXT NOT NULL DEFAULT 'General'
                CHECK (team IN ('Rescue','Medical','Logistics','Communications','General')),
  status        TEXT NOT NULL DEFAULT 'Available'
                CHECK (status IN ('Available','Deployed','Inactive')),
  deployment    TEXT DEFAULT '',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_volunteers_team ON volunteers(team);
CREATE INDEX IF NOT EXISTS idx_volunteers_status ON volunteers(status);

-- =============================================================================
-- Youth
-- =============================================================================
CREATE TABLE IF NOT EXISTS youth (
  id            TEXT PRIMARY KEY NOT NULL,
  full_name     TEXT NOT NULL,
  birthdate     TEXT DEFAULT '',
  school        TEXT DEFAULT '',
  contact       TEXT DEFAULT '',
  program       TEXT DEFAULT '',
  attendance    INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_youth_program ON youth(program);

-- =============================================================================
-- Events
-- =============================================================================
CREATE TABLE IF NOT EXISTS events (
  id            TEXT PRIMARY KEY NOT NULL,
  title         TEXT NOT NULL,
  date          TEXT DEFAULT '',
  location      TEXT DEFAULT '',
  organizer     TEXT DEFAULT '',
  category      TEXT NOT NULL DEFAULT 'Assembly'
                CHECK (category IN ('Assembly','Sports','Health','Education','SK','Livelihood','Other')),
  description   TEXT DEFAULT '',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);

-- =============================================================================
-- Polls
-- =============================================================================
CREATE TABLE IF NOT EXISTS polls (
  id            TEXT PRIMARY KEY NOT NULL,
  question      TEXT NOT NULL,
  options       TEXT NOT NULL DEFAULT '[]',
  votes         TEXT NOT NULL DEFAULT '{}',
  voters        TEXT NOT NULL DEFAULT '[]',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =============================================================================
-- Inquiries
-- =============================================================================
CREATE TABLE IF NOT EXISTS inquiries (
  id            TEXT PRIMARY KEY NOT NULL,
  type          TEXT NOT NULL DEFAULT 'general'
                CHECK (type IN ('general','bug','feature','feedback')),
  status        TEXT NOT NULL DEFAULT 'new'
                CHECK (status IN ('new','in_review','resolved','closed')),
  name          TEXT NOT NULL DEFAULT '',
  email         TEXT NOT NULL DEFAULT '',
  subject       TEXT DEFAULT '',
  message       TEXT NOT NULL DEFAULT '',
  meta          TEXT DEFAULT '{}',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_type ON inquiries(type);

-- =============================================================================
-- Notifications
-- =============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id            TEXT PRIMARY KEY NOT NULL,
  title         TEXT NOT NULL DEFAULT '',
  message       TEXT NOT NULL DEFAULT '',
  type          TEXT NOT NULL DEFAULT 'info'
                CHECK (type IN ('info','alert','incident','request','announcement')),
  target_user   TEXT DEFAULT '',
  read          INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_notifications_target ON notifications(target_user);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);

-- =============================================================================
-- Password Resets
-- =============================================================================
CREATE TABLE IF NOT EXISTS password_resets (
  id            TEXT PRIMARY KEY NOT NULL,
  email         TEXT NOT NULL,
  code          TEXT NOT NULL,
  expires_at    TEXT NOT NULL,
  used          INTEGER NOT NULL DEFAULT 0,
  attempts      INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets(email);
CREATE INDEX IF NOT EXISTS idx_password_resets_code ON password_resets(code);

-- =============================================================================
-- =============================================================================
-- Sessions (from 0006_sessions.sql)
-- =============================================================================
CREATE TABLE IF NOT EXISTS sessions (
  id            TEXT PRIMARY KEY NOT NULL,
  user_id       TEXT NOT NULL,
  token_hash    TEXT NOT NULL,
  expires_at    TEXT NOT NULL,
  last_activity TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
  remember      INTEGER NOT NULL DEFAULT 0,
  ip_address    TEXT DEFAULT '',
  user_agent    TEXT DEFAULT '',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_activity ON sessions(last_activity);

-- =============================================================================
-- Note about audit_log hash columns:
-- SQLite D1 doesn't support ALTER TABLE ADD COLUMN IF NOT EXISTS.
-- The audit_log table in production already has previous_hash and
-- current_hash columns from prior manual setup, so this is handled.

-- =============================================================================
-- Performance indexes (from 0007_db_indexes.sql, with IF NOT EXISTS for safety)
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_updated_at ON users(updated_at);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_residents_created_at ON residents(created_at);
CREATE INDEX IF NOT EXISTS idx_households_created_at ON households(created_at);
CREATE INDEX IF NOT EXISTS idx_officials_created_at ON officials(created_at);
CREATE INDEX IF NOT EXISTS idx_announcements_updated ON announcements(updated_at);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(type);
CREATE INDEX IF NOT EXISTS idx_alerts_location ON alerts(location);
CREATE INDEX IF NOT EXISTS idx_incidents_location ON incidents(location);
CREATE INDEX IF NOT EXISTS idx_complaints_complainant ON complaints(complainant);
CREATE INDEX IF NOT EXISTS idx_complaints_assigned ON complaints(assigned_to);
CREATE INDEX IF NOT EXISTS idx_doc_req_requester ON document_requests(requester);
CREATE INDEX IF NOT EXISTS idx_doc_req_requester_id ON document_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_emergency_location ON emergency_requests(location);
CREATE INDEX IF NOT EXISTS idx_evac_centers_location ON evac_centers(location);
CREATE INDEX IF NOT EXISTS idx_volunteers_name ON volunteers(full_name);
CREATE INDEX IF NOT EXISTS idx_youth_name ON youth(full_name);
CREATE INDEX IF NOT EXISTS idx_events_title ON events(title);
CREATE INDEX IF NOT EXISTS idx_inquiries_email ON inquiries(email);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires ON password_resets(expires_at);
