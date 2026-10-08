-- 0039_support_tickets.sql
-- Support ticket categories, tickets, append-only message threads, and status history.

CREATE TABLE support_ticket_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO support_ticket_categories (code, name, description) VALUES
  ('ACCOUNT', 'Account', 'Profile, credentials, and verification inquiries'),
  ('PAYMENTS', 'Payments', 'Payout dues, bank accounts, and wallet transactions'),
  ('LISTINGS', 'Listings', 'Crop listings, quality grades, and counter-offers'),
  ('APP_PROBLEM', 'App problem', 'Mobile app glitches, errors, and performance issues'),
  ('OTHER', 'Other', 'General feedback and non-categorized inquiries');

CREATE SEQUENCE IF NOT EXISTS support_ticket_seq START WITH 1001;

CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL DEFAULT ('TKT-' || nextval('support_ticket_seq')::text),
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE RESTRICT,
  category_code TEXT NOT NULL REFERENCES support_ticket_categories(code),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  attachment_url TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
  priority TEXT NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
  assigned_to_user_id UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_support_tickets_farmer ON support_tickets (farmer_id, created_at DESC);
CREATE INDEX idx_support_tickets_status ON support_tickets (status, priority, created_at DESC);
CREATE INDEX idx_support_tickets_category ON support_tickets (category_code);

CREATE TABLE support_ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL REFERENCES users(id),
  sender_role TEXT NOT NULL,
  message TEXT NOT NULL,
  attachment_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_support_messages_ticket ON support_ticket_messages (ticket_id, created_at ASC);
SELECT app_make_append_only('support_ticket_messages');

CREATE TABLE support_ticket_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  changed_by_user_id UUID NOT NULL REFERENCES users(id),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_support_history_ticket ON support_ticket_status_history (ticket_id, created_at ASC);
SELECT app_make_append_only('support_ticket_status_history');
