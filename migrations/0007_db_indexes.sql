-- =============================================================================
-- Migration 0007: Database Indexes for Performance
-- Adds indexes on frequently queried columns to speed up list queries,
-- badge count computations, login lookups, and audit log searches.
-- =============================================================================

-- Users: login lookups and role-based filtering
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_approved ON users(approved);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Sessions: cleanup and validation
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON sessions(last_activity);

-- Audit log: searches by severity, actor, action, target, and time range
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_severity ON audit_log(severity);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_target ON audit_log(target);

-- Residents: badge count and demographic queries
CREATE INDEX IF NOT EXISTS idx_residents_created_at ON residents(created_at);
CREATE INDEX IF NOT EXISTS idx_residents_purok ON residents(purok);

-- Households: lookups
CREATE INDEX IF NOT EXISTS idx_households_purok ON households(purok);

-- Announcements: listing by date and status
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at);
CREATE INDEX IF NOT EXISTS idx_announcements_category ON announcements(category);
CREATE INDEX IF NOT EXISTS idx_announcements_pinned ON announcements(pinned);

-- Alerts: active alerts
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_level ON alerts(level);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);

-- Incidents: status-based badge counts
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at);

-- Complaints: status-based badge counts
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at);

-- Emergency requests
CREATE INDEX IF NOT EXISTS idx_emergency_requests_status ON emergency_requests(status);
CREATE INDEX IF NOT EXISTS idx_emergency_requests_created_at ON emergency_requests(created_at);

-- Document requests
CREATE INDEX IF NOT EXISTS idx_document_requests_status ON document_requests(status);
CREATE INDEX IF NOT EXISTS idx_document_requests_created_at ON document_requests(created_at);

-- Evacuation centers: capacity vs occupants
-- (no separate status column on evac_centers table)

-- Volunteers: availability
CREATE INDEX IF NOT EXISTS idx_volunteers_status ON volunteers(status);

-- Youth: attendance and program filters
CREATE INDEX IF NOT EXISTS idx_youth_attendance ON youth(attendance);

-- Events: future-date lookups
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);

-- Polls/Surveys: active status
-- (no separate status column on polls table)

-- Notifications: unread filter
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Inquiries: status filtering
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at);

-- Password resets: expiry cleanup
CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets(email);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires_at ON password_resets(expires_at);

-- Officials: role ordering
CREATE INDEX IF NOT EXISTS idx_officials_role ON officials(role);

-- Badge performance: composite indexes for common badge queries
CREATE INDEX IF NOT EXISTS idx_alerts_status_level ON alerts(status, level);
CREATE INDEX IF NOT EXISTS idx_complaints_status_created ON complaints(status, created_at);
CREATE INDEX IF NOT EXISTS idx_document_requests_status_created ON document_requests(status, created_at);
