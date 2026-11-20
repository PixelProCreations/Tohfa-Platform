-- =============================================================================
-- 0131_serviceability_and_area_requests.sql
-- BR-171: served pincodes/areas, the pickup radius config, and customer "please serve my area" requests.
-- =============================================================================

-- +migrate Up
CREATE TABLE served_pincodes (
    pincode            text PRIMARY KEY CHECK (pincode ~ '^[1-9][0-9]{5}$'),
    area_name          text,
    warehouse_id       uuid REFERENCES warehouses(id),
    delivery_available boolean     NOT NULL DEFAULT false,
    is_active          boolean     NOT NULL DEFAULT true,
    created_at         timestamptz NOT NULL DEFAULT now()
);

-- Seed: the pincode of each public pickup point is served, with delivery (BR-161).
INSERT INTO served_pincodes (pincode, area_name, warehouse_id, delivery_available)
SELECT w.pincode, w.city, w.id, true
  FROM warehouses w
 WHERE w.code IN ('WH-OOTY', 'WH-COON', 'WH-KOTA', 'WH-GUDA') AND w.pincode IS NOT NULL
ON CONFLICT (pincode) DO NOTHING;

CREATE TABLE service_area_requests (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_key text        NOT NULL,
    area_key      text        NOT NULL,
    customer_id   uuid REFERENCES customers(id),
    area          text        NOT NULL,
    locality      text        NOT NULL,
    city          text        NOT NULL,
    pincode       text CHECK (pincode IS NULL OR pincode ~ '^[1-9][0-9]{5}$'),
    contact       text,
    status        text        NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'REVIEWED', 'SERVED', 'DECLINED')),
    created_at    timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT service_area_requests_requester_area_uq UNIQUE (requester_key, area_key)
);
CREATE INDEX idx_service_area_requests_created ON service_area_requests (created_at DESC, id DESC);

INSERT INTO system_config (key, value, data_type, description) VALUES
    ('serviceability.pickup_radius_km', '60'::jsonb, 'number',
     'BR-171: a lat/lng within this many km of a public pickup point is serviceable (pickup). Implementer default 60 (product decision pending).'),
    ('serviceability.area_request_rate_per_hour', '5'::jsonb, 'number',
     'BR-171: max service-area requests per client (IP) per hour. Implementer default 5.')
ON CONFLICT (key) DO NOTHING;

-- +migrate Down
DELETE FROM system_config WHERE key IN ('serviceability.pickup_radius_km', 'serviceability.area_request_rate_per_hour');
DROP TABLE IF EXISTS service_area_requests;
DROP TABLE IF EXISTS served_pincodes;
