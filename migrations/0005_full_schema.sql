-- =============================================================================
-- e-Cagraray Smart Barangay Management System — Full D1 Schema
-- Migration 0005: Complete schema with relationships and constraints
-- =============================================================================

-- Enable foreign key enforcement
PRAGMA foreign_keys = ON;

-- =============================================================================
-- 1. USERS — Authentication & role-based accounts
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
-- 2. BARANGAY INFO — Singleton configuration (single row)
-- =============================================================================
CREATE TABLE IF NOT EXISTS barangay_info (
  id            INTEGER PRIMARY KEY CHECK (id = 1),  -- enforce singleton
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

-- Insert default barangay info row
INSERT OR IGNORE INTO barangay_info (id, name, municipality, province, address, contact, email, captain)
VALUES (1, 'Barangay Cagraray', 'Bato', 'Catanduanes', 'Cagraray, Bato, Catanduanes', '+63 977 008 6455', 'ecagraraymanagementsystem@gmail.com', '');

-- =============================================================================
-- 3. RESIDENTS — Resident database records (mirrors user accounts but independent)
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
-- 4. HOUSEHOLDS — Group residents into family units
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

-- =============================================================================
-- 5. OFFICIALS — Barangay Council & Officials roster
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
-- 6. ANNOUNCEMENTS — Community announcements and notices
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
-- 7. ALERTS — Disaster and emergency alerts
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
-- 8. INCIDENTS — Community incident reports with timeline tracking
-- =============================================================================
CREATE TABLE IF NOT EXISTS incidents (
  id            TEXT PRIMARY KEY NOT NULL,
  type          TEXT NOT NULL DEFAULT 'Other',
  description   TEXT NOT NULL DEFAULT '',
  location      TEXT DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'Submitted'
                CHECK (status IN ('Submitted','Under Review','Verified','Resolved')),
  reporter      TEXT NOT NULL DEFAULT 'Anonymous',
  timeline      TEXT NOT NULL DEFAULT '[]',  -- JSON array of {at,status,note}
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_type ON incidents(type);
CREATE INDEX IF NOT EXISTS idx_incidents_created ON incidents(created_at);

-- =============================================================================
-- 9. COMPLAINTS — Mediation workflow complaints
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
-- 10. DOCUMENTS_REQ — Online document requests
-- =============================================================================
CREATE TABLE IF NOT EXISTS document_requests (
  id            TEXT PRIMARY KEY NOT NULL,
  service       TEXT NOT NULL DEFAULT '',
  requester     TEXT NOT NULL DEFAULT '',
  requester_id  TEXT DEFAULT '',   -- references users.id
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
-- 11. EMERGENCY — Assistance requests (rescue, medical, relief)
-- =============================================================================
CREATE TABLE IF NOT EXISTS emergency_requests (
  id            TEXT PRIMARY KEY NOT NULL,
  type          TEXT NOT NULL DEFAULT 'Rescue'
                CHECK (type IN ('Rescue','Medical','Relief')),
  priority      TEXT NOT NULL DEFAULT 'Medium'
                CHECK (priority IN ('Low','Medium','High','Emergency')),
  requester     TEXT NOT NULL DEFAULT '',
  requester_id  TEXT DEFAULT '',   -- references users.id
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
-- 12. EVAC_CENTERS — Evacuation center capacity monitoring
-- =============================================================================
CREATE TABLE IF NOT EXISTS evac_centers (
  id            TEXT PRIMARY KEY NOT NULL,
  name          TEXT NOT NULL,
  location      TEXT DEFAULT '',
  capacity      INTEGER NOT NULL DEFAULT 0,
  occupants     INTEGER NOT NULL DEFAULT 0,
  manager       TEXT DEFAULT '',
  history       TEXT NOT NULL DEFAULT '[]',  -- JSON array of {ts,occupants}
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_evac_centers_name ON evac_centers(name);

-- =============================================================================
-- 13. VOLUNTEERS — Volunteer registry with team assignments
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
-- 14. YOUTH — SK Youth Registry
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
-- 15. EVENTS — Community events and programs
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
-- 16. POLLS — Community surveys and opinion polls
-- =============================================================================
CREATE TABLE IF NOT EXISTS polls (
  id            TEXT PRIMARY KEY NOT NULL,
  question      TEXT NOT NULL,
  options       TEXT NOT NULL DEFAULT '[]',   -- JSON array of strings
  votes         TEXT NOT NULL DEFAULT '{}',    -- JSON object {option: count}
  voters        TEXT NOT NULL DEFAULT '[]',    -- JSON array of user IDs
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =============================================================================
-- 17. INQUIRIES — Contact form submissions
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
  meta          TEXT DEFAULT '{}',    -- JSON object
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_type ON inquiries(type);

-- =============================================================================
-- 18. NOTIFICATIONS — System push notifications
-- =============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id            TEXT PRIMARY KEY NOT NULL,
  title         TEXT NOT NULL DEFAULT '',
  message       TEXT NOT NULL DEFAULT '',
  type          TEXT NOT NULL DEFAULT 'info'
                CHECK (type IN ('info','alert','incident','request','announcement')),
  target_user   TEXT DEFAULT '',     -- NULL means broadcast to all
  read          INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_notifications_target ON notifications(target_user);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);

-- =============================================================================
-- 19. PASSWORD_RESETS — Forgot password flow
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
-- 20. APP_DATA — Generic key-value store (for system settings like maintenance mode)
-- =============================================================================
CREATE TABLE IF NOT EXISTS app_data (
  key           TEXT PRIMARY KEY NOT NULL,
  value         TEXT NOT NULL DEFAULT '',
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Insert default maintenance mode off
INSERT OR IGNORE INTO app_data (key, value) VALUES ('system_maintenance', 'false');

-- =============================================================================
-- 21. AUDIT_LOG — Immutable chain-of-custody audit log
-- =============================================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id            TEXT PRIMARY KEY NOT NULL,
  actor         TEXT NOT NULL,
  actor_id      TEXT NOT NULL DEFAULT '',
  action        TEXT NOT NULL,
  target        TEXT NOT NULL DEFAULT '',
  details       TEXT NOT NULL DEFAULT '',
  ip            TEXT NOT NULL DEFAULT '',
  user_agent    TEXT NOT NULL DEFAULT '',
  severity      TEXT NOT NULL DEFAULT 'info'
                CHECK (severity IN ('info','warning','critical')),
  previous_hash TEXT NOT NULL DEFAULT '',
  current_hash  TEXT NOT NULL DEFAULT '',
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_log_severity ON audit_log(severity);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);
