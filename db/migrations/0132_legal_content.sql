-- =============================================================================
-- 0132_legal_content.sql
-- BR-172: versioned static legal content. Current = highest version per (slug, language).
-- Privacy text is seeded from docs/launch/privacy-policy.md. The TERMS row is a PLACEHOLDER:
-- the real terms text must be supplied by the client and published via PUT /admin/legal/terms.
-- =============================================================================

-- +migrate Up
CREATE TABLE legal_content_versions (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug       text        NOT NULL CHECK (slug IN ('privacy-policy', 'terms')),
    language   text        NOT NULL DEFAULT 'en',
    version    integer     NOT NULL CHECK (version >= 1),
    title      text        NOT NULL,
    body       text        NOT NULL,
    created_by uuid REFERENCES users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT legal_content_versions_uq UNIQUE (slug, language, version)
);

INSERT INTO legal_content_versions (slug, language, version, title, body) VALUES
('privacy-policy', 'en', 1, 'Privacy Policy', $legal$# TOHFA Platform Privacy Policy & Store Data Safety Declarations

**Effective Date:** September 9, 2026  
**Last Revised:** September 9, 2026  
**Platform Applications:** TOHFA Farmer (`in.tohfa.farmer`) & TOHFA Customer (`in.tohfa.customer`)

---

## 1. Introduction & Overview

TOHFA ("Platform", "we", "our") operates a direct-trade agricultural marketplace platform designed to connect verified farmers with retail consumers and regional warehouse hubs. We are committed to absolute data privacy, transparency, and strict adherence to data protection standards.

This policy details the exact data collected, processed, and declared across our mobile applications on Google Play and the Apple App Store.

---

## 2. Information Collected by Application

### A. TOHFA Farmer App (`in.tohfa.farmer`)
The Farmer application collects only the necessary data to facilitate agricultural onboarding, land ownership validation, produce listing, and direct-to-bank payout settlements:

1. **Personal & Identity Data:**
   - Full Name, Mobile Number (for OTP authentication).
   - Government Identification (Aadhaar number / KYC document): Collected exclusively for farmer identity verification (Rule **BR-33**). All identity numbers are encrypted using AES-256 in storage and masked in logs.
2. **Precise Geolocation Data:**
   - GPS Coordinates of land parcels / farms: Collected during registration and listing creation to verify physical harvest locations and compute warehouse transit logistics.
3. **Photos & Documents:**
   - Camera and image gallery access: Used exclusively when the user photographs produce batches, land pattas, or agricultural organic certifications.
4. **Financial & Payout Data:**
   - Bank Account Number, IFSC Code: Required for direct wallet-to-bank settlement payouts.

### B. TOHFA Customer App (`in.tohfa.customer`)
The Customer application follows a strict privacy-first and data-minimization architecture (**Rule BR-16**):

1. **Contact Information:** Mobile Number (for OTP authentication and delivery SMS notifications), Delivery Street Address.
2. **Payment Information:** Payment transaction references generated via Razorpay payment gateway. (The platform does not store raw credit/debit card numbers or UPI PINs).
3. **Strict Farm-Anonymity (BR-16):** The Customer application NEVER collects, receives, or renders any farmer identity, farm name, farm GPS coordinates, or supplier photos.

---

## 3. Google Play Data Safety Declarations

### A. TOHFA Farmer (`in.tohfa.farmer`)

| Data Type | Specific Field | Collected? | Shared with Third Parties? | Encrypted in Transit? | Ephemeral / Optional? | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Location** | Precise Location (GPS) | **Yes** | No | Yes (TLS 1.3) | Collected on-demand during listing creation | App functionality, Farm boundary verification |
| **Personal Info** | Name, Phone number | **Yes** | No | Yes (TLS 1.3) | Mandatory for account | Account management, authentication |
| **Personal Info** | Government ID (Aadhaar) | **Yes** | No (Stored AES-256) | Yes (TLS 1.3) | Mandatory for KYC | Identity verification, Fraud prevention (BR-33) |
| **Financial Info** | Bank Account / IFSC | **Yes** | Bank payment gateways | Yes (TLS 1.3) | Mandatory for payouts | Payout processing & settlement |
| **Photos & Videos** | Photos / Certifications | **Yes** | No | Yes (TLS 1.3) | Optional upload | Produce quality & certification review |
| **Device / IDs** | FCM Device Token | **Yes** | Firebase (Google) | Yes (TLS 1.3) | Optional | Order & counter-offer notifications |

### B. TOHFA Customer (`in.tohfa.customer`)

| Data Type | Specific Field | Collected? | Shared with Third Parties? | Encrypted in Transit? | Ephemeral / Optional? | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Location** | Precise / Coarse Location | **NO** | No | N/A | N/A | Not collected |
| **Personal Info** | Phone number, Name | **Yes** | No | Yes (TLS 1.3) | Mandatory for account | Account management, authentication |
| **Personal Info** | Physical Address | **Yes** | Logistics courier | Yes (TLS 1.3) | Mandatory for delivery | Order fulfillment & delivery |
| **Financial Info** | Payment Transaction ID | **Yes** | Razorpay Gateway | Yes (TLS 1.3) | Mandatory for orders | Wallet top-up & order payment |
| **Photos & Videos** | Any Media | **NO** | No | N/A | N/A | Not collected |
| **Device / IDs** | FCM Device Token | **Yes** | Firebase (Google) | Yes (TLS 1.3) | Optional | Order status & handover OTP push |

---

## 4. Apple App Store Privacy Nutrition Labels

### A. TOHFA Farmer
- **Data Used to Track You:** None.
- **Data Linked to You:**
  - *Contact Info:* Phone Number, Name
  - *Location:* Precise Location
  - *User Content:* Photos / Documents
  - *Identifiers:* User ID, Device ID (FCM token)
  - *Financial Info:* Bank Details (for payouts)
- **Data Not Linked to You:** Diagnostic / Crash logs (Sentry).

### B. TOHFA Customer
- **Data Used to Track You:** None.
- **Data Linked to You:**
  - *Contact Info:* Phone Number, Physical Address
  - *Financial Info:* Payment History
  - *Identifiers:* User ID, Device ID (FCM token)
- **Data Not Linked to You:** Diagnostic / Crash logs (Sentry).

---

## 5. Security & Prominent Disclosure Standards

1. **Aadhaar Protection (Rule BR-33):**
   - Aadhaar numbers are never stored in plaintext and never logged in debugging output.
   - An explicit prominent disclosure dialog is presented before the user enters identity credentials.
2. **Cleartext PII Protection (Rule BR-32):**
   - Mobile numbers and OTP verification codes are permanently masked in server and application logs (`+9198****3210`).
3. **Data Retention & Account Deletion:**
   - Users may request complete account deletion and data scrubbing directly through the app or by emailing `privacy@tohfa.in`.$legal$),
('terms', 'en', 1, 'Terms of Service',
 $legal$PLACEHOLDER: These Terms of Service are pending final text from TOHFA. By using the app you agree to use it lawfully and to pay for the orders you place. Final terms will be published here.$legal$);

-- +migrate Down
DROP TABLE IF EXISTS legal_content_versions;
