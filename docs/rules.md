# TOHFA Business Rules

> Ground truth. Every rule below is enforced SERVER-SIDE. A hidden button is not a permission.
> Each rule has an ID. Every test that covers a rule must name it, e.g. `it('BR-07: rejects listing priced above fair price ceiling')`.

Sources: Requirements v1.0 (Chapters 2, 5, 6, and the FR-* lists) and Role & Feature Matrix v1.0 (sections §1-§15 and the 11 numbered principles). Authorization values live in `./rbac.json`; this file states behaviour, not grants. Where the two documents disagree, the conflict is recorded at the bottom of this file and the default the codebase implements is named there — do not resolve it in code.

## Legend

| Field | Meaning |
|---|---|
| **Source** | The clause this rule comes from. `§2.x` = Requirements v1.0 Chapter 2 (client-locked). `FR-*` = functional requirement. `Matrix P*` = numbered principle in the Role & Feature Matrix. |
| **Status** | `LOCKED` — client-signed, implement exactly as written. `DERIVED` — follows from a matrix principle or an FR, not separately signed off. `CONTESTED` — the two documents disagree; the rule states the implemented default and appears in *Open contradictions*. |
| **Layer** | Where enforcement lives. Always server-side; the entry names the code path (endpoint, service, job, DB constraint). Client-side checks are UX only and are never the test target. |
| **Scope** | `Track 1` — enforced and tested in the first delivery (backend + admin console). `Deferred` — out of scope for Track 1; the reason is in *Rules NOT enforced in Track 1*. |
| **Test contract** | The minimum assertions. Each sub-test has its own ID (`BR-01a`). A rule is "covered" only when every sub-test exists and passes. |

---

### BR-01 — Expired certificate blocks market listings
| | |
|---|---|
| **Source** | Requirements v1.0 §2.1 |
| **Status** | LOCKED |
| **Layer** | Server-side, enforced in the listing-create path and a nightly job |
| **Scope** | Track 1 |

**Rule.** A farmer who holds no unexpired certificate MUST NOT be able to create a produce listing. Eligibility is decided for the farmer, not per certificate: holding ANY one qualifying certificate (verified, unexpired, PGS or NPOP — see BR-02) permits listing, and other certificates of the same farmer that have expired never block. A certificate is unexpired up to and including its `expires_on` date, judged against today's Asia/Kolkata calendar date. When no certificate qualifies, none is unexpired and awaiting verification (that case is `CERT_UNVERIFIED`, BR-02), and at least one has expired, `POST /listings` returns 422 `CERT_EXPIRED`.

**Implementation notes (2026-10-05).** One query, `listingsRepo.getListingCertEligibility`, answers BR-01 and BR-02 together in the listing-create path. The per-certificate `blocksListings` field on a `Certification` response means only "this certificate does not qualify on its own"; it is not the farmer's eligibility. The rule text used to say "whose certifications are all expired", which disagreed with BR-02; see *Open contradictions* #14.

**Failure mode if unenforced.** Uncertified produce reaches customers under an organic badge — the single largest reputational and legal risk in the platform.

**Test contract.** (`apps/api/src/modules/listings/listings.test.ts`, unit and PostgreSQL-backed, unless noted)
- `BR-01a` A farmer whose only certificate expired yesterday → `POST /listings` returns 422, `code: CERT_EXPIRED`. Tests: `BR-01a: a farmer whose only certificate expired yesterday → 422 CERT_EXPIRED, naming that certificate`; `BR-01a: a farmer whose only certificate (verified) expired yesterday → 422 CERT_EXPIRED`.
- `BR-01b` Re-verifying the certificate clears `farmers.is_market_blocked` within one job cycle (`certifications.test.ts`).
- `BR-01c` A farmer holding a verified, unexpired certificate AND an expired one → the listing is created, and only the qualifying certificate is frozen onto it as a badge. Tests: `BR-01c: a farmer holding a verified, unexpired certificate can list even though another of their certificates has expired`; `BR-01c: a verified, unexpired PGS certificate permits listing although the farmer's NPOP certificate expired yesterday`.
- `BR-01d` A verified certificate expiring today (Asia/Kolkata) still qualifies; one that expired yesterday does not. Tests: `BR-01d: a verified certificate expiring TODAY (Asia/Kolkata) still qualifies; one that expired yesterday does not`; `BR-01d: "expired" is judged against today's Asia/Kolkata calendar date, passed to the eligibility query`; `BR-01d: passes the caller's Asia/Kolkata date as the "today" bound and maps the aggregate row`.

---

### BR-02 — Unverified certificate blocks market listings; verification is manual
| | |
|---|---|
| **Source** | Requirements v1.0 §2.1; Matrix §9, Matrix P7 |
| **Status** | LOCKED |
| **Layer** | Server-side, listing-create path; verification state changed only by an admin action (`certification.mark_verified`) |
| **Scope** | Track 1 |

**Rule.** A certification record is `unverified` until a SUPER_ADMIN or TOHFA_ADMIN marks it verified after checking the issuing body's portal by hand. While a farmer has no *qualifying* certificate (one that is verified, unexpired as defined in BR-01, and of type PGS or NPOP), listing creation MUST be refused. A certificate of type `OTHER` (any other organic scheme, named in `issuingBody`) may be recorded, viewed and verified by an admin, but it NEVER qualifies: it does not clear `farmers.is_market_blocked` (`certificationsRepo.recomputeFarmerMarketBlock` counts only verified, unexpired PGS/NPOP certificates), and its per-certificate `blocksListings` is always true. Holding ANY one qualifying certificate permits listing: other certificates of the same farmer that are expired, `UNVERIFIED` (for example a pending renewal) or `REJECTED` never block. When no certificate qualifies and at least one unexpired PGS or NPOP certificate is awaiting verification, `POST /listings` returns 422 `CERT_UNVERIFIED`, because verification is the way back; otherwise an expired PGS or NPOP certificate gives `CERT_EXPIRED` (BR-01); otherwise (no PGS or NPOP certificate at all — none, or only `OTHER` ones — or only unexpired `REJECTED` ones) it returns 422 `CERT_MISSING`, because adding a certificate is the way back. An `OTHER` certificate is never named as the way back, whatever its status or expiry: verifying or renewing it would not let the farmer list. The listing-create gate refuses every one of these cases itself, from the certificates; it does not depend on the materialised `farmers.is_market_blocked` flag, which is still checked after it. There is no automatic or API-based verification path.

**Implementation notes (2026-10-05).** `CERT_MISSING` closes the gap recorded in *Open contradictions* #14. Only `POST /listings` applies this gate; `PATCH /listings/{id}` and admin approval do not check certificates (not decided, see #14).

**Failure mode if unenforced.** Self-declared organic status. A farmer uploads any PDF and sells under the TOHFA organic badge with no human check.

**Test contract.** (`apps/api/src/modules/listings/listings.test.ts`, unit and PostgreSQL-backed, unless noted)
- `BR-02a` A farmer whose only certificate is unexpired but `unverified` → `POST /listings` returns 422, `code: CERT_UNVERIFIED`. Tests: `BR-02a: a farmer whose only certificate is unexpired but unverified → 422 CERT_UNVERIFIED`; `BR-02a: a farmer whose only certificate is unexpired but UNVERIFIED → 422 CERT_UNVERIFIED`.
- `BR-02b` No endpoint or job can transition `certifications.verification_status` to `verified` without an acting admin user id recorded in `verified_by`.
- `BR-02c` A farmer holding a verified, unexpired certificate plus a pending (`UNVERIFIED`) renewal → the listing is created. Tests: `BR-02c: a pending renewal does not block a farmer who already holds a verified, unexpired certificate`; `BR-02c: an UNVERIFIED renewal does not block a farmer who holds a verified, unexpired NPOP certificate`.
- `BR-02d` An expired certificate plus an unverified, unexpired one, none qualifying → 422 `CERT_UNVERIFIED`. Tests: `BR-02d: an expired certificate plus an unverified unexpired one, none qualifying → 422 CERT_UNVERIFIED (verification is the way back)`; `BR-02d: an expired verified certificate plus an unverified unexpired one, none qualifying → 422 CERT_UNVERIFIED`.
- `BR-02e` A verified, unexpired PGS certificate and a verified, unexpired NPOP certificate each qualify on their own. Test: `BR-02e: a verified, unexpired PGS certificate and a verified, unexpired NPOP certificate each qualify on their own`.
- `BR-02f` A farmer with no certificate at all → `POST /listings` returns 422, `code: CERT_MISSING`, with a detail naming PGS or NPOP, whether `farmers.is_market_blocked` is true or (stale) false. Tests: `BR-02f: a farmer with no qualifying, pending or expired certificate → 422 CERT_MISSING even when is_market_blocked is a stale false`; `BR-02f: with no qualifying certificate the certificate gate answers before the market block (flag set → still 422 CERT_MISSING)`; `BR-02f: a farmer with no certificate at all → 422 CERT_MISSING, naming PGS or NPOP`; `BR-02f: a farmer with no certificate and a stale is_market_blocked = false → still 422 CERT_MISSING (the gate does not depend on the flag)`.
- `BR-02g` Only `REJECTED` certificates: unexpired → 422 `CERT_MISSING` (also with a stale `is_market_blocked = false`); an expired one, or a rejected one next to an expired one → 422 `CERT_EXPIRED`; a rejected one next to an unverified, unexpired one → 422 `CERT_UNVERIFIED`. Tests: `BR-02g: only REJECTED certificates → 422 CERT_MISSING if unexpired (also with a stale is_market_blocked = false), CERT_EXPIRED naming the certificate if expired`; `BR-02g: a REJECTED unexpired certificate next to an UNVERIFIED unexpired one → 422 CERT_UNVERIFIED (verification is still the way back)`.
- `BR-02h` A certificate of type `OTHER` is accepted on create and persisted (`certification_type` gained `OTHER` in `db/migrations/0029_certification_type_other.sql`), may be verified, and never qualifies: `blocksListings` stays true when it is verified and unexpired, and the market block stays set until a verified, unexpired PGS or NPOP certificate exists (`certifications.test.ts`, unit and PostgreSQL-backed). Tests: `BR-02h: the request schema accepts certType OTHER (as well as PGS and NPOP)`; `BR-02h: an OTHER certificate is created and returned with certType OTHER and blocksListings true`; `BR-02h: blocksListings is true for a VERIFIED, unexpired OTHER certificate — OTHER does not qualify on its own`; `BR-02h: blocksListings is false for a VERIFIED, unexpired PGS certificate and for an NPOP one (control)`; `BR-02h: an OTHER certificate is persisted (certification_type accepts OTHER), can be verified, and never lifts the market block; a verified PGS one does`.
- `BR-02i` `OTHER` certificates never name the way back on `POST /listings`: the eligibility query considers only the qualifying types, passed from `LISTING_QUALIFYING_CERT_TYPES` (`certifications.schema.ts`) as a bound parameter, never a second literal list. A farmer whose only certificates are `OTHER` — unexpired and `UNVERIFIED`, expired (verified or not), or verified and unexpired — gets 422 `CERT_MISSING`, never `CERT_UNVERIFIED` or `CERT_EXPIRED`; an `OTHER` certificate of any state next to a verified, unexpired PGS one changes nothing (the listing is created with the PGS badge only); a newer `UNVERIFIED` `OTHER` next to an older `UNVERIFIED` PGS gives `CERT_UNVERIFIED` naming the PGS certificate; an `UNVERIFIED` `OTHER` next to an expired PGS, or a more recently expired `OTHER` next to an older expired NPOP, gives `CERT_EXPIRED` naming the PGS / NPOP certificate. Tests: `BR-02i: the service passes only the qualifying certificate types (LISTING_QUALIFYING_CERT_TYPES: PGS, NPOP — never OTHER) to the eligibility query`; `BR-02i: the qualifying certificate types are a bound parameter, not a second hard-coded list in the SQL`; `BR-02i: a farmer whose only certificate is OTHER, unexpired and UNVERIFIED → 422 CERT_MISSING, never CERT_UNVERIFIED`; `BR-02i: a farmer whose only certificates are OTHER and expired (verified or not) → 422 CERT_MISSING, never CERT_EXPIRED`; `BR-02i: a VERIFIED, unexpired OTHER certificate alone → 422 CERT_MISSING (also with a stale is_market_blocked = false)`; `BR-02i: an OTHER certificate (any state) next to a verified, unexpired PGS one → the listing is created with the PGS badge only`; `BR-02i: a newer UNVERIFIED OTHER next to an older UNVERIFIED PGS → 422 CERT_UNVERIFIED naming the PGS certificate`; `BR-02i: an UNVERIFIED OTHER next to an expired PGS → 422 CERT_EXPIRED naming the PGS certificate (the OTHER is not "the way back")`; `BR-02i: a more recently expired OTHER next to an older expired NPOP → 422 CERT_EXPIRED naming the NPOP certificate`. Farmer mobile mirror (`dashboard.test.ts`): the certification card / banner summary ignores `OTHER` certificates, so an `OTHER`-only farmer sees "No certificate added" (`CERT_MISSING`). Tests: names starting `BR-02i:` in `apps/mobile/src/roles/farmer/tests/dashboard.test.ts`.
- The materialised market block is still checked after the certificate gate: an eligible farmer whose `is_market_blocked` is set → 422 `CERT_EXPIRED`. Test: `keeps the materialised is_market_blocked check after the certificate gate: an eligible farmer whose flag is set → 422 CERT_EXPIRED`.
- `BR-02j` The materialised `farmers.market_block_reason` names the cause the listing gate gives, in the gate's order (`certificationsRepo.recomputeFarmerMarketBlock`, texts in `MARKET_BLOCK_REASON`, `certifications.repo.ts`): an unexpired PGS/NPOP certificate awaiting verification → "pending manual admin verification" (`CERT_UNVERIFIED`), even next to an expired verified one; otherwise an expired PGS/NPOP certificate of any status → "has expired" (`CERT_EXPIRED`), even next to a rejected or `OTHER` one; otherwise no certificate → "No organic certifications uploaded", only `OTHER` → "Only OTHER certifications on record", only unexpired `REJECTED` PGS/NPOP → "were rejected in admin verification" (all `CERT_MISSING`). It used to say "pending" for a rejected-only farmer and for one whose only PGS/NPOP certificate was unverified and expired, and "All organic certifications have expired" for an expired verified certificate next to a pending one. The text is free text for admins; the farmer app does not show or branch on it. Test (`certifications.test.ts`, PostgreSQL-backed): `BR-02j (PostgreSQL): farmers.market_block_reason names the cause the listing gate gives — pending verification, expired, rejected, OTHER-only or none — whatever else the farmer holds`.
- Farmer mobile mirror, display only (`apps/mobile/src/roles/farmer/tests/dashboard.test.ts`, `listings.test.ts`): no certificate → "No certificate added" banner, only rejected ones → "Certificate rejected" banner, a server `CERT_MISSING` → its own localized message.

---

### BR-03 — Four audits per year, one per quarter
| | |
|---|---|
| **Source** | Requirements v1.0 §2.1 |
| **Status** | LOCKED |
| **Layer** | Server-side, audits service + partial unique index `uq_audits_farmer_fy_quarter (farmer_id, fiscal_year, quarter) WHERE status <> 'CANCELLED'` (`db/migrations/0027_audits.sql`) |
| **Scope** | Track 1 (Audit module, contract added 2026-10-01) |

**Rule.** Each farmer has exactly four audits per fiscal year, one per quarter, mixing internal and external types. Scheduling a fifth audit in a quarter MUST be refused.

**Implementation notes (product decision 2026-10-01).** The fiscal year is April-March, labelled `2026-27` (same format as the invoices module); Q1 = Apr-Jun ... Q4 = Jan-Mar. `fiscal_year` and `quarter` are derived server-side from `scheduled_for` in Asia/Kolkata, never sent by the client. A CANCELLED audit does not hold its quarter (the unique index is partial), so a replacement can be scheduled. Compliance (BR-03b) counts COMPLETED audits only: `COMPLIANT` at 4, `PENDING` below 4 while the fiscal year is open, `NON_COMPLIANT` below 4 once it has closed. The "4" is the number of fiscal quarters, not a tunable threshold.

**Failure mode if unenforced.** Compliance cadence collapses; certification tier scores are computed from an inconsistent number of inspections and are not comparable between farmers.

**Test contract.**
- `BR-03a` Second audit scheduled for the same `(farmer, fiscal_year, quarter)` → 409, `code: AUDIT_QUARTER_TAKEN`.
- `BR-03b` A farmer with fewer than 4 completed audits at year end is reported as non-compliant, not silently passed.

---

### BR-04 — Audit rating scale and compliance tiers
| | |
|---|---|
| **Source** | Requirements v1.0 §2.1; Matrix §9 |
| **Status** | LOCKED (resolved for Farm Rating — see below; originally CONTESTED) |
| **Layer** | Server-side, farm-ratings service (`recordAuditRating`) and audits service; thresholds read from `rating_tier_config`, never hard-coded |
| **Scope** | Track 1 |

**Rule (original contradiction, kept as history).** Audit rating is stated as max 100 points, while the tier bands are stated as `<650 Poor`, `650-700 Moderate`, `700-749 Good`, `750+ Excellent`. These cannot both be true. Track 1 originally seeded the tier thresholds as configuration (editable by SUPER_ADMIN only) and implemented no scoring logic, pending client confirmation.

**Resolution (Farm Rating, 2026-09-17).** The client has confirmed the tier scale for Farm Rating (BR-06's 0-100 direct-sum total_score) specifically: `POOR` < 50, `MODERATE` 50-69, `GOOD` 70-84, `EXCELLENT` >= 85. `rating_tier_config` is Track 1's one live consumer of this rule (see its table comment in `db/migrations/0003_farmers_and_farms.sql`), so this resolves BR-04 for the codebase's only implemented rating/tier concept. The original 2025-01-01 placeholder rows (`<650/650-700/700-749/750+`) are kept in `rating_tier_config` as history per root CLAUDE.md §2.3's append-only philosophy; the new rows carry a later `effective_from` and are the generation `resolveTierForScore` actually picks. If a separate, non-Farm-Rating "audit" scoring feature is ever built, its scale still needs its own client confirmation — this resolution only covers Farm Rating.

**Extension to audits (product decision, 2026-10-01).** The product owner confirmed that audits use the same scale: 10 categories x 0-10 = 0-100 on the same seeded `rating_categories`, with the tier read from the same `rating_tier_config` generation at read time (never stored on `audits`). BR-04a/BR-04b therefore apply unchanged to `GET /admin/audits*` and `GET /farmers/me/audits*`. Screens showing `/1000` or `/60` are wrong and are being rewritten.

**Audits feed the farm rating (product decision, 2026-10-01).** The audit and the farm rating are no longer independent: completing an INTERNAL audit creates the farm rating (BR-06), with its tier resolved through the same `resolveTierForScore` lookup at the moment the rating is created and stored on `farm_ratings.tier_code`, as every rating's tier always has been. BR-04a/BR-04b therefore hold for audit-derived ratings too. The audit row itself still stores no tier.

**Failure mode if unenforced.** Every farmer scores under 100 and therefore lands in `Poor` forever, or the scale is silently changed to 1000 and the client's signed thresholds no longer mean what they signed.

**Test contract.**
- `BR-04a` Tier thresholds are read from `rating_tier_config`, not literals — changing config changes the tier a given score maps to.
- `BR-04b` A specific tier IS now asserted for a specific score: 0-49 -> `POOR`, 50-69 -> `MODERATE`, 70-84 -> `GOOD`, 85-100 -> `EXCELLENT` — for audits and for audit-derived farm ratings. (The manual scoring endpoint `PUT /admin/farmers/{id}/rating` that this bullet used to reference was removed on 2026-10-01; see BR-06.)

---

### BR-05 — Major violation count red-flag threshold
| | |
|---|---|
| **Source** | Requirements v1.0 §2.1 |
| **Status** | CONTESTED |
| **Layer** | Server-side, audit-completion path (`major_violations_count`) and the explicit `POST /admin/audits/{id}/red-flag` / `clear-red-flag` actions (`audit.red_flag.manage`) |
| **Scope** | Track 1 for storage and the manual flag; any derivation rule stays deferred |

**Rule.** The document states "major violation count = 0 is a red-flag threshold", which reads backwards — zero major violations is the good state. The intended rule is almost certainly "any major violation (count > 0) red-flags the farm". Track 1 stores `major_violations_count` and `red_flagged` but sets neither automatically. The one automatic effect of completing an audit is the farm rating (BR-06, INTERNAL audits only); neither the MAJOR count nor the red flag changes the rating, and red-flagging or clearing never touches it.

**Failure mode if unenforced.** Implemented literally, every compliant farm is red-flagged and every violating farm passes — an exactly inverted compliance signal.

**Test contract.**
- `BR-05a` `audits.major_violations_count` is persisted and non-nullable on completion.
- `BR-05b` `red_flagged` is only ever set by an explicit admin action in Track 1; no derivation rule is implemented.

---

### BR-06 — Farm rating is 10 categories x 10 points
| | |
|---|---|
| **Source** | Requirements v1.0 §2.1 |
| **Status** | LOCKED |
| **Layer** | Server-side, `farm-ratings` module (`recordAuditRating` + `CHECK (score BETWEEN 0 AND 10)` per category row), called from the `audits` completion transaction; `farm_ratings.source_audit_id` UNIQUE (`db/migrations/0028_farm_rating_source_audit.sql`) |
| **Scope** | Track 1 (accelerated ahead of the original phase plan; see `apps/api/src/modules/farm-ratings/`) |

**Rule.** Farm rating totals 100 points across exactly 10 named categories (Certification, Soil & Land, Farming Practices, Environmental, Produce Quality, Traceability, Social & Labor, Financial, Market Relations, Innovation), each capped at 10. A rating with a missing category is incomplete, not zero.

**Source of the rating (product decision, 2026-10-01 — supersedes the manual scoring endpoint).** The farm rating is derived from completed INTERNAL audits ONLY. There is no manual rating entry: `PUT /admin/farmers/{id}/rating` and the `farmer.rating.edit` permission were removed (this departs from reqs 6.1's Farmer-Admin own-zone edit; recorded in `docs/rbac.json` `conflicts`). When an INTERNAL audit is completed, the same transaction creates a new `COMPLETE` farm rating: the audit's 10 category scores (and remarks) copied to `farm_rating_scores`, `total_score` = direct sum, tier from `rating_tier_config` (BR-04), `rated_by`/`scored_by` = the completing admin, `period_label` = `<fiscalYear> Q<quarter>`, linked by `source_audit_id` (unique: one audit, at most one rating). If the rating cannot be written the audit is not completed. EXTERNAL audits create no rating; red-flag, cancel and reschedule never touch ratings. The newest rating is the current one (and the `farmers.overall_rating` cache); every earlier rating — including legacy manual `CYCLE-n` rows, which read back as `source: MANUAL` — is kept unchanged as history.

**Failure mode if unenforced.** Ratings become incomparable between farms and the tier assignment derived from them is meaningless.

**Test contract.**
- `BR-06a` Submitting a category score of 11 → 422, `code: SCORE_OUT_OF_RANGE` (on the audit score sheet, and again when a rating is recorded from an audit).
- `BR-06b` The 10 categories are seeded reference data; a rating referencing an 11th category id (or missing or repeating one) is rejected.
- `BR-06c` Completing an INTERNAL audit creates a `COMPLETE` rating with the audit's 10 scores, the direct-sum total and the config tier, linked by `source_audit_id`, with an `audit_log` row in the same transaction.
- `BR-06d` Completing an EXTERNAL audit creates no rating; red-flag, clear, cancel and reschedule never touch ratings.
- `BR-06e` No manual path exists: `PUT /admin/farmers/{id}/rating` is 404 and `docs/rbac.json` has no farm-rating write permission; the read endpoints still work for admins (zone-scoped) and farmers (own only).
- `BR-06f` A second INTERNAL completion adds a new current rating and leaves earlier rating rows and scores unchanged (history).
- `BR-06g` Atomicity: if creating the rating fails, the audit stays `IN_PROGRESS` and nothing partial is written.

---

### BR-07 — Listing price must not exceed the fair price ceiling
| | |
|---|---|
| **Source** | Requirements v1.0 §2.2; FR-F08 ("validated server-side") |
| **Status** | LOCKED |
| **Layer** | Server-side, listing-create and listing-update paths, validated against the ceiling effective on the submission date |
| **Scope** | Track 1 |

**Rule.** A produce listing's asking price per kg MUST be less than or equal to the fair price ceiling in effect for that crop and grade. The ceiling row used for validation is stored on the listing.

**Failure mode if unenforced.** The platform's core price-fairness promise is void; customers are charged above the association's own ceiling and the ceiling becomes advisory.

**Test contract.**
- `BR-07a` Ceiling Rs 100/kg, listing at Rs 100.01 → `POST /listings` returns 422, `code: PRICE_ABOVE_CEILING`.
- `BR-07b` Listing at exactly the ceiling is accepted; the accepted listing stores the `fair_price_id` it was validated against.
- `BR-07c` A ceiling lowered after acceptance does not retroactively invalidate an accepted listing.

---

### BR-08 — Fair price ceiling is set by Super Admin only
| | |
|---|---|
| **Source** | Requirements v1.0 §2.2, §6.1 |
| **Status** | LOCKED |
| **Layer** | Server-side, `pricing.fair_price.set` permission check on the write endpoint |
| **Scope** | Track 1 |

**Rule.** Only SUPER_ADMIN may create or change a fair price ceiling. TOHFA_ADMIN explicitly may not, despite being the operational head. Update frequency (daily or weekly) is an open client decision; the model stores an effective-date range either way.

**Failure mode if unenforced.** The one price control reserved to the association's top authority leaks to operations staff, and the price history — the audit trail of that control — becomes untrustworthy.

**Test contract.**
- `BR-08a` TOHFA_ADMIN calls the ceiling-write endpoint → 403, `code: FORBIDDEN`.
- `BR-08b` Ceiling rows are append-only with non-overlapping effective ranges per `(crop, grade)`; an overlapping insert is rejected by the DB constraint, not only by the service.

---

### BR-09 — Retail price must be at or below the ceiling
| | |
|---|---|
| **Source** | Requirements v1.0 §6.1, FR-A02 ("based on fair price ceiling set by SA") |
| **Status** | DERIVED |
| **Layer** | Server-side, retail-price write path |
| **Scope** | Track 1 |

**Rule.** SUPER_ADMIN and TOHFA_ADMIN set the customer-facing retail price. It MUST NOT exceed the fair price ceiling for that crop and grade in effect on the price's start date.

**Failure mode if unenforced.** TOHFA resells above the ceiling it imposes on farmers — an indefensible position for a farmers' association.

**Test contract.**
- `BR-09a` Ceiling Rs 100, retail price Rs 120 → 422, `code: RETAIL_ABOVE_CEILING`.
- `BR-09b` Lowering a ceiling below an active retail price surfaces the affected retail rows in the response; it does not silently leave them live.

---

### BR-10 — Counter-offer response window is 24 hours
| | |
|---|---|
| **Source** | Requirements v1.0 §2.2; FR-F08 |
| **Status** | LOCKED |
| **Layer** | Server-side, `counter_offers.expires_at = created_at + 24h` plus an expiry job |
| **Scope** | Track 1 |

**Rule.** A farmer has 24 hours from the admin's counter-offer to respond. After expiry the offer is `expired` and neither party may act on it; the listing returns to its prior state.

**Failure mode if unenforced.** Listings sit in limbo, warehouse allocation planning has no committed supply, and farmers can accept a stale price days later.

**Test contract.**
- `BR-10a` Responding at `expires_at + 1s` → 409, `code: COUNTER_OFFER_EXPIRED`.
- `BR-10b` The expiry job transitions untouched offers to `expired` and is idempotent when re-run.
- `BR-10` (quality counter-offer at goods receipt, `POST /admin/goods-receipts/{id}/counter-offer`, `apps/api/src/modules/goods-receipts/goods-receipts.counter-offer.test.ts`, real PostgreSQL) The offer is written on the listing behind the receipt's purchase order (`listing_id`, `actor = ADMIN`, `actor_user_id`, `goods_receipt_id`) and returns the documented `CounterOffer` body; `expires_at` follows `system_config.counter_offer_window_hours` (changed to 6 inside the test transaction → 6 hours) and an invalid value is a 500 with nothing written; the round continues the listing's rounds and is 409 `COUNTER_LIMIT_REACHED` when all 4 are used (BR-11); a second offer while one is PENDING is 409 `CONFLICT`; a listing that is not ACCEPTED is 409 `INVALID_STATE_TRANSITION`; the receipt keeps its quantities and rejection reason; the farmer can accept, reject or counter it through the listing endpoints; a farmer reject or an expiry returns a listing that has a purchase order to ACCEPTED, while a listing without one still returns to PENDING_APPROVAL.

**Note (2026-10-11, UNCONFIRMED default, owner decision pending).** "Quality counter-offer at goods receipt" is listed under Rules NOT enforced in Track 1 as a second counter-offer surface. Its endpoint existed but could never run: its INSERT named columns `counter_offers` does not have. It was repaired with the smallest behaviour that fits this rule and BR-11 instead of a new rule: the quality counter-offer is one more round of the listing negotiation (same `system_config` window, same round ceiling, one PENDING offer per listing), linked to its receipt by the nullable `counter_offers.goods_receipt_id` (db/migrations/0058). "Prior state" is read as ACCEPTED for a listing that already has a purchase order. Not decided and not built: whether the quality round should have its own budget instead of sharing the listing's 4 rounds; what an accepted, rejected or lapsed quality offer does to the goods receipt (it stays COUNTER_OFFERED, which keeps it out of payout dues), the purchase order price and the payout; and any limit on the offered price or quantity.

---

### BR-11 — Counter-offers may be countered back at most 3 times
| | |
|---|---|
| **Source** | Requirements v1.0 FR-F08 |
| **Status** | LOCKED |
| **Layer** | Server-side, counter-offer service; `round` column with `UNIQUE(listing_id, round)` |
| **Scope** | Track 1 |

**Rule.** After the admin's counter, the farmer may counter back up to 3 times. On the 4th attempt the farmer must accept or reject.

**Failure mode if unenforced.** Unbounded haggling loops hold produce off the market past its shelf life.

**Test contract.**
- `BR-11a` A 4th farmer counter on the same listing → 409, `code: COUNTER_LIMIT_REACHED`.
- `BR-11b` Round numbers are contiguous from 1; a concurrent double-submit cannot create two rows with the same round.

---

### BR-12 — Reserve allocation is 70 / 10 / 10 / 10
| | |
|---|---|
| **Source** | Requirements v1.0 §2.2 |
| **Status** | LOCKED |
| **Layer** | Server-side, allocation service on batch intake; percentages read from config |
| **Scope** | Track 1 |

**Rule.** Received stock is allocated Online 70%, Live B2C Market 10%, Reserve (marriages/functions) 10%, Buffer 10%. Percentages are configuration, settable by SUPER_ADMIN only, and MUST sum to 100.

**Failure mode if unenforced.** The online channel oversells stock physically committed to market day or reserve, producing cancellations at pickup.

**Test contract.**
- `BR-12a` A 1000 kg batch produces bucket quantities 700/100/100/100; rounding remainder lands in Buffer, never lost.
- `BR-12b` Saving percentages that sum to 99 or 101 → 422, `code: ALLOCATION_SUM_INVALID`.
- `BR-12c` An online order for more than the Online bucket's available quantity → 409, `code: INSUFFICIENT_ALLOCATION`; it does not draw from Reserve.

**Interaction with DIRECT counter sales (owner decision 2026-10-11).** The buckets limit the ONLINE and LIVE_MARKET channels only; BR-12c stands. A DIRECT counter sale (BR-95) is **not** bucket-limited: it may draw any ACTIVE sellable stock of the batch, including stock the Online and Live Market buckets were allocated, and it does not decrement any allocation row. When it does, a later Online or Live Market consumption of that stock is refused 409 at the stock ledger (BR-95k), never by letting stock go negative; availability reads of those buckets are capped by the batch's unclaimed shelf (BR-100).

---

### BR-13 — B2B and Horeca draw from consolidated inventory
| | |
|---|---|
| **Source** | Requirements v1.0 §2.2; Matrix §7 (`Manage B2B/Horeca Manual allocation`) |
| **Status** | CONTESTED |
| **Layer** | Server-side, allocation service |
| **Scope** | Deferred |

**Rule.** Requirements say B2B/Horeca allocation is automatic from consolidated inventory; the matrix says it is a manual admin action. The 70/10/10/10 split has no B2B/Horeca bucket, so the source of those units is undefined. No B2B/Horeca allocation path is implemented until the client resolves this.

**Failure mode if unenforced.** B2B orders silently consume the Buffer or Reserve buckets, breaking BR-12 without any audit trail of the decision.

**Test contract.**
- `BR-13a` No code path decrements the Reserve or Buffer bucket for a B2B/Horeca order in Track 1.
- `BR-13b` B2B/Horeca order endpoints return 501 in Track 1.

---

### BR-14 — Farmer subscription is Rs 500/year with a free tier
| | |
|---|---|
| **Source** | Requirements v1.0 §2.2 |
| **Status** | LOCKED |
| **Layer** | Server-side, subscription service; free-tier limits checked in the listing-create path |
| **Scope** | Deferred |

**Rule.** A farmer subscription costs Rs 500 per year. A free tier exists with limits. The limits themselves are undefined in both source documents and MUST NOT be invented in code.

**Failure mode if unenforced.** Either every farmer is gated by a limit nobody agreed to, or the paid tier has no value and the revenue line is fictional.

**Test contract.**
- `BR-14a` Subscription amount and period come from config, not literals.
- `BR-14b` Free-tier gating is a single named check with no thresholds set; enabling it requires a config value that ships unset.

---

### BR-15 — Four sales channels
| | |
|---|---|
| **Source** | Requirements v1.0 §2.2 |
| **Status** | LOCKED, AMENDED 2026-10-11 (D1) |
| **Layer** | Server-side, order service; `orders.channel` enum |
| **Scope** | Deferred (Online); Direct and Market enabled for Sub Warehouse Admin by BR-85 |

**Amended 2026-10-11 by owner decision D1 (see BR-85).** `orders.channel` gains a fifth value, `DIRECT` (at-counter sale). Direct and Market sales are now allowed for a Sub Warehouse Admin; Horeca and B2B creation is still rejected with 501. The original text is kept below; struck-through intent is marked "(superseded)".

**Rule.** The platform sells through exactly four channels: Online, Market (live market day), Horeca, B2B. Every order carries its channel. Track 1 implements Online only; the other three are rejected rather than silently treated as Online. (superseded in part: Track 1 now implements Online, Market and Direct; Horeca and B2B are still rejected rather than silently treated as Online. `DIRECT` is a fifth `orders.channel` value alongside the four named channels.)

**Failure mode if unenforced.** Channel revenue reporting and allocation both become unattributable, and GST treatment (inclusive for retail, exclusive for B2B) is applied to the wrong orders.

**Test contract.**
- `BR-15a` `orders.channel` is non-nullable and constrained to the five values (the original four plus `DIRECT`, amended 2026-10-11).
- `BR-15b` An order created with channel `b2b` in Track 1 → 501, not an Online order. (Unchanged by the amendment; `horeca` is likewise 501.)
- `BR-15c` (added 2026-10-11) A `DIRECT` or `MARKET` order is accepted from a Sub Warehouse Admin through `POST /sales` (BR-85), and never from the customer order path.

---

### BR-16 — Customer view is farm-anonymous
| | |
|---|---|
| **Source** | Requirements v1.0 §2.3, FR-F08; Matrix P2 |
| **Status** | LOCKED |
| **Layer** | Server-side, catalog/order serializers for CUSTOMER-authenticated requests |
| **Scope** | Track 1 |

**Rule.** A customer sees only produce grade, certification badges and TOHFA branding. No farmer name, farmer id, farm name, village, GPS coordinate, FMB polygon or photo containing farm identity may appear in any customer-facing response, including order history, invoices and support threads.

**Failure mode if unenforced.** TOHFA's aggregator position collapses — customers transact with farmers directly — and farmer PII is published to the public app.

**Test contract.**
- `BR-16a` `GET /catalog/:id` as CUSTOMER returns a payload containing no key from the farmer-identity denylist (asserted field-by-field, not by eyeballing).
- `BR-16b` A customer invoice PDF contains TOHFA as the seller, never the farmer.
- `BR-16c` Guessing an internal listing id via a customer-scoped endpoint does not expose `farmer_id`.

---

### BR-17 — Wallet-first checkout
| | |
|---|---|
| **Source** | Requirements v1.0 §2.3, FR-C04 |
| **Status** | LOCKED |
| **Layer** | Server-side, checkout service |
| **Scope** | Track 1 |

**Rule.** The wallet is the primary payment method. Checkout debits the wallet first; if the balance is insufficient the response instructs a top-up for the shortfall. An order is never confirmed with an unpaid balance.

**Failure mode if unenforced.** Orders confirm against money that does not exist; the wallet ledger and order ledger diverge and reconciliation becomes manual forever.

**Test contract.**
- `BR-17a` Wallet Rs 200, cart Rs 500 → checkout returns 402, `code: WALLET_INSUFFICIENT`, `shortfall: 300`; no order row is created.
- `BR-17b` A successful checkout writes exactly one debit row to `wallet_transactions`; a retried request with the same idempotency key does not write a second.

---

### BR-18 — Cash top-up credits the wallet server-side after the fiscal cash tag
| | |
|---|---|
| **Source** | Requirements v1.0 §2.3, §2.4, FR-A05 |
| **Status** | LOCKED |
| **Layer** | Server-side, cash-top-up endpoint; wallet ledger insert + SMS dispatch in one transaction boundary |
| **Scope** | Track 1 |

**Rule.** Customer hands cash to a warehouse admin, the admin marks the fiscal cash tag, and only then does the server credit the wallet and send the SMS confirmation. The client app never asserts the credit.

**Failure mode if unenforced.** Wallet balance can be created without cash having been received — a direct route to fraud with no paper trail.

**Test contract.**
- `BR-18a` A top-up request without a fiscal cash tag → 422, `code: FISCAL_TAG_REQUIRED`; no ledger row.
- `BR-18b` The credit row records the acting admin id and the warehouse id; both are non-nullable.
- `BR-18c` SMS dispatch failure does not roll back a completed credit, and the credit is not double-written on retry.

---

### BR-19 — Cash top-up is capped at Rs 10,000 per transaction
| | |
|---|---|
| **Source** | Requirements v1.0 §2.4; Matrix §8 |
| **Status** | LOCKED |
| **Layer** | Server-side, cash-top-up endpoint |
| **Scope** | Track 1 |

**Rule.** A single cash top-up MUST NOT exceed Rs 10,000. Per-day and per-customer caps are undefined in both documents and MUST NOT be invented.

**Failure mode if unenforced.** Large unbanked cash amounts enter the platform in one step at a warehouse counter, with obvious AML and cash-handling exposure.

**Test contract.**
- `BR-19a` Cash top-up of Rs 10,000.01 → 422, `code: CASH_LIMIT_EXCEEDED`.
- `BR-19b` Rs 10,000 exactly is accepted; two consecutive Rs 10,000 top-ups are both accepted (no undefined daily cap is enforced).

---

### BR-20 — Handover requires a 4-digit OTP
| | |
|---|---|
| **Source** | Requirements v1.0 §2.3, FR-C05 |
| **Status** | LOCKED |
| **Layer** | Server-side, fulfilment endpoint; OTP hashed at rest, verified server-side |
| **Scope** | Track 1 |

**Rule.** An order is marked delivered or picked up only after a warehouse admin submits the customer's 4-digit OTP and the server verifies it. The OTP is generated server-side per order and never returned to the verifying admin.

**Failure mode if unenforced.** Goods are marked delivered without the customer receiving them; refunds and RMA volume are driven by a status nobody verified.

**Test contract.**
- `BR-20a` Wrong OTP → 422, `code: OTP_INVALID`; order status unchanged.
- `BR-20b` The fulfilment response payload never contains the OTP value; only its verification outcome.
- `BR-20c` Note for review: FR-C05 says the OTP is "shared with warehouse staff", which defeats the check. Implemented as customer-held; flagged in *Open contradictions*.

---

### BR-21 — Every order supports warehouse pickup
| | |
|---|---|
| **Source** | Requirements v1.0 §2.3 ("dual fulfilment"); Matrix P9 (pickup only) |
| **Status** | CONTESTED |
| **Layer** | Server-side, order-create path |
| **Scope** | Track 1 (pickup path only) |

**Rule.** Every order MUST offer warehouse pickup as a fulfilment option. Requirements additionally describe home delivery with slots and out-for-delivery tracking; the matrix says all orders are pickup-only and contains no driver or fleet feature. Track 1 implements pickup only; delivery slots exist in the data model but no delivery routing is built.

**Failure mode if unenforced.** Either the whole delivery fleet capability is built against a client who wanted pickup only, or customers are promised a delivery slot no one can serve.

**Test contract.**
- `BR-21a` Every order created in Track 1 has `fulfilment_type = pickup` and a `warehouse_id`.
- `BR-21b` No endpoint assigns a driver or transitions an order to `out_for_delivery` in Track 1.

---

### BR-22 — Cart items are locked for 24 hours
| | |
|---|---|
| **Source** | Requirements v1.0 FR-C04 |
| **Status** | DERIVED |
| **Layer** | Server-side, cart service; reservation released by an expiry job |
| **Scope** | Track 1 |

**Rule.** Adding an item to a cart reserves that quantity against the Online allocation bucket for 24 hours. On expiry the reservation is released back to the bucket.

**Failure mode if unenforced.** Either stock is oversold to two customers at once, or abandoned carts permanently hold inventory hostage.

**Test contract.**
- `BR-22a` Adding 5 kg reduces the Online bucket's available quantity by 5 kg immediately.
- `BR-22b` After 24 hours with no checkout, the expiry job returns the 5 kg and the cart line is marked expired; the job is idempotent.

---

### BR-23 — Four fixed warehouses
| | |
|---|---|
| **Source** | Requirements v1.0 §2.4 |
| **Status** | LOCKED |
| **Layer** | Server-side, seeded reference data; warehouse creation is not an API in Track 1 |
| **Scope** | Track 1 (seeded), management UI deferred |

**Rule.** There are exactly four warehouses: Ooty, Coonoor, Kotagiri, Gudalur Market. Warehouse ids are stable and referenced by stock, orders, assignments and cash top-ups.

**Failure mode if unenforced.** Ad-hoc warehouse rows fragment the stock ledger and break Sub Warehouse Admin scoping, which keys on `warehouse_id`.

**Test contract.**
- `BR-23a` The seed produces exactly 4 warehouse rows with stable codes.
- `BR-23b` No public endpoint creates a warehouse in Track 1.

See also BR-66.

---

### BR-24 — Warehouses hold consolidated inventory across all farmers
| | |
|---|---|
| **Source** | Requirements v1.0 §2.4 |
| **Status** | LOCKED |
| **Layer** | Server-side, stock ledger — batch rows keep farmer provenance, stock availability is computed per warehouse/crop/grade |
| **Scope** | Track 1 |

**Rule.** Once received, produce is pooled by warehouse, crop and grade for selling purposes. Farmer provenance stays on the batch for payout and traceability but never scopes availability.

**Failure mode if unenforced.** Either availability is fragmented per farmer (customers see 40 tiny lots), or provenance is dropped and farmer payout cannot be computed from what was sold.

**Test contract.**
- `BR-24a` Two batches of the same crop/grade from different farmers in one warehouse present as a single availability figure.
- `BR-24b` Every stock ledger row still resolves to its originating `batch_id` and `farmer_id`.

---

### BR-25 — Each warehouse has its own Sub Warehouse Admin
| | |
|---|---|
| **Source** | Requirements v1.0 §2.4; Assumption 1 (5 admins including standby) |
| **Status** | DERIVED |
| **Layer** | Server-side, `user_roles.warehouse_id` NOT NULL when role = SUB_WH_ADMIN |
| **Scope** | Deferred (modelled, no staffing UI) |

**Rule.** A SUB_WH_ADMIN assignment MUST name exactly one warehouse. An assignment without a warehouse is invalid.

**Failure mode if unenforced.** A Sub Warehouse Admin with a null warehouse either sees nothing or, worse, everything — BR-30 depends entirely on this field being present.

**Test contract.**
- `BR-25a` Creating a SUB_WH_ADMIN without `warehouse_id` → 422, `code: WAREHOUSE_REQUIRED`.
- `BR-25b` The DB constraint rejects the same row inserted directly.

---

### BR-26 — Inter-warehouse transfers only by Main Warehouse Admin and Super Admin
| | |
|---|---|
| **Source** | Requirements v1.0 §2.4, §6.2, FR-A04 |
| **Status** | LOCKED |
| **Layer** | Server-side, `transfer.inter_warehouse.initiate` permission check |
| **Scope** | Track 1 since 2026-10-12: the transfer endpoints are BR-102 (`apps/api/src/modules/warehouse-transfers/`) |

**Rule.** Only SUPER_ADMIN and MAIN_WH_ADMIN may initiate an inter-warehouse transfer. TOHFA_ADMIN may not, despite outranking MAIN_WH_ADMIN, and SUB_WH_ADMIN may not move stock out of its own warehouse. Receiving a transfer is a separate, wider permission.

**Failure mode if unenforced.** Stock moves between warehouses with no accountable initiator; a Sub Warehouse Admin can empty their own site to hide a shortfall.

**Test contract.**
- `BR-26a` TOHFA_ADMIN calls transfer-initiate → 403.
- `BR-26b` SUB_WH_ADMIN calls transfer-initiate for its own warehouse → 403.

---

### BR-27 — Customers may pick up from any warehouse
| | |
|---|---|
| **Source** | Requirements v1.0 §2.4, FR-C04 |
| **Status** | LOCKED |
| **Layer** | Server-side, order-create path validates the chosen warehouse against the 4 seeded rows |
| **Scope** | Track 1 |

**Rule.** A customer selects any one of the four warehouses for pickup; there is no geographic restriction on which warehouse a customer may choose. Stock availability is then evaluated against that warehouse.

**Failure mode if unenforced.** Customers are silently bound to a "home" warehouse the requirements never specified, or orders are placed against a warehouse that does not hold the stock.

**Test contract.**
- `BR-27a` A customer whose profile prefers Ooty can place a pickup order at Gudalur.
- `BR-27b` Ordering against a warehouse with insufficient allocated stock → 409, `code: INSUFFICIENT_ALLOCATION`, evaluated per warehouse.

---

### BR-28 — Admin creation is strictly hierarchical
| | |
|---|---|
| **Source** | Requirements v1.0 §2.5, §6.4 |
| **Status** | LOCKED |
| **Layer** | Server-side check on the admin-create endpoint (`creationRules` in `rbac.json`) |
| **Scope** | Track 1 |

**Rule.** SUPER_ADMIN is created only by SUPER_ADMIN. TOHFA_ADMIN only by SUPER_ADMIN. FARMER_ADMIN by SUPER_ADMIN or TOHFA_ADMIN. MAIN_WH_ADMIN only by SUPER_ADMIN. SUB_WH_ADMIN by SUPER_ADMIN, TOHFA_ADMIN or MAIN_WH_ADMIN. Every other combination is denied.

**Failure mode if unenforced.** Privilege escalation in one request — a Main Warehouse Admin mints a Super Admin and owns the platform, including the fair price ceiling and payout approval.

**Test contract.**
- `BR-28a` Table-driven test over all 5 target roles x all 5 actor roles (25 cases) asserting exactly the 8 allowed pairs and 17 denials with 403.
- `BR-28b` MAIN_WH_ADMIN creating a SUPER_ADMIN → 403 and an audit log row recording the attempt.

---

### BR-29 — Farmer Admin cannot act on their own listings
| | |
|---|---|
| **Source** | Requirements v1.0 §2.5, FR-A03; Matrix §5, Matrix P3 |
| **Status** | LOCKED |
| **Layer** | Server-side `NOT_OWN_LISTING` predicate on approve, reject and counter-offer; violation auto-routes to another admin |
| **Scope** | Track 1 |

**Rule.** A FARMER_ADMIN is an elected farmer. They MUST NOT approve, reject or counter-offer a listing belonging to themselves or to their own linked farmer account. Such a listing is auto-routed to another eligible admin rather than merely hidden.

**Failure mode if unenforced.** An elected farmer self-approves their own produce at their own price — the exact conflict of interest the elected role was designed to avoid.

**Test contract.**
- `BR-29a` FARMER_ADMIN approves own listing → 403, `code: SELF_APPROVAL_FORBIDDEN`; listing state unchanged.
- `BR-29b` The same listing appears in another eligible admin's queue with `routed_reason: self_approval` set.
- `BR-29c` Counter-offer and reject paths return the same denial, not just approve.

---

### BR-30 — Sub Warehouse Admin is scoped to one warehouse
| | |
|---|---|
| **Source** | Requirements v1.0 §2.5 ("server-side query filter"); Matrix P4 |
| **Status** | LOCKED |
| **Layer** | Server-side, warehouse predicate injected into every query in the data layer — not a controller check |
| **Scope** | Track 1 |

**Rule.** Every read and write performed by a SUB_WH_ADMIN MUST be filtered by their assigned `warehouse_id`. Cross-warehouse rows return empty results, not 403 — the existence of other warehouses' data is not disclosed.

**Failure mode if unenforced.** One warehouse's staff read and adjust another warehouse's stock, orders and cash logs; a 403 instead of an empty result also leaks which record ids exist.

**Test contract.**
- `BR-30a` SUB_WH_ADMIN of Ooty lists stock → only Ooty rows; count matches a direct query filtered by Ooty.
- `BR-30b` SUB_WH_ADMIN of Ooty fetches a Coonoor batch by id → 404 with an empty body, never 403.
- `BR-30c` A write against a Coonoor row is rejected even when the id is valid and guessed correctly.

**Note (2026-10-11).** The filter applies whatever level `docs/rbac.json` grants. SUB_WH_ADMIN holds `inventory.goods_receipt.record`, `inventory.quality_check.perform` and `inventory.quality.counter_offer` at `all`, and `scopedWhere` adds no warehouse clause at `all`, so the goods-receipt service first narrows a scope that carries assigned warehouses to them. A Main admin confined to one warehouse is narrowed the same way; a Main, Super or Tohfa admin with no assigned warehouse sees all four. Another warehouse's receipt or purchase order, or a warehouse named on create, is the same 404 as an id that does not exist, on reads and writes alike, and nothing is written; a `warehouseId` list filter naming a warehouse the caller cannot reach is an empty 200 page (cross-scope list = empty result set, root CLAUDE.md section 2.1). Tests: `BR-30: ...` in `apps/api/src/modules/goods-receipts/goods-receipts.test.ts`.

**Note (2026-10-11, returns).** The same leak existed in Returns & Issues (BR-61): `rma.request.process` and `inventory.quality_check.perform` are `all` for SUB_WH_ADMIN, so a Sub Warehouse Admin could list, read, inspect, approve, reject and refund any warehouse's returns. The returns service now narrows a scope that carries assigned warehouses to them before every read and write; another warehouse's return is the same 404 as an unknown id, and the list holds only the caller's warehouses. Tests: `BR-30: ...` in `apps/api/src/modules/returnRequests/returnRequests.scope.test.ts` (real repo and SQL inside a rolled-back transaction).

**Note (2026-10-11, invoices).** A Sub Warehouse Admin's invoices (`invoice.view_own` at `own`) are those of orders placed at its assigned warehouse (`invoices.order_id` → `orders.warehouse_id`), on the list, the detail and the PDF download alike; another warehouse's invoice is the same 404 as an unknown id. An invoice with no order (purchase or payout invoice) has no warehouse and is not shown to a Sub Warehouse Admin (unconfirmed default). Before this date the invoice list returned nothing to a Sub Warehouse Admin. Tests: `BR-30: ...` in `apps/api/src/modules/invoices/invoice-access.test.ts`.

**Note (2026-10-13, inventory list paging).** `GET /admin/batches`, `GET /admin/stock-ledger` and `GET /admin/allocations` page with an opaque keyset cursor on `(created_at, id)` that matches their `ORDER BY created_at DESC, id DESC`, the same scheme as the wallet and admin-order lists. Their cursor used to be the last row's id alone, which skipped or repeated rows (uuids are not time-ordered) and turned a non-uuid cursor into a 500. Contract: paging with any page size returns every row exactly once in order, including rows whose `created_at` ties to the microsecond; a cursor the list did not produce (a bare uuid, garbage, another list's cursor) is 422 `VALIDATION_FAILED`. Tests: `BR-30` (batches), `BR-37` (stock ledger) and `BR-12` (allocations) in `apps/api/src/modules/inventory/inventory.paging.test.ts`.

See also BR-66.

---

### BR-31 — Payouts over Rs 10,000 require dual approval
| | |
|---|---|
| **Source** | Requirements v1.0 §2.5, §6.3, FR-A02; Matrix P6 |
| **Status** | LOCKED |
| **Layer** | Server-side approval workflow; `payout.approve_above_10k` is SUPER_ADMIN only |
| **Scope** | Track 1 |

**Rule.** A farmer payout of Rs 10,000 or less may be initiated and released by SUPER_ADMIN or TOHFA_ADMIN. Above Rs 10,000 the payout requires a second, distinct approval by a SUPER_ADMIN; the initiator and the approver MUST be different user ids. TOHFA_ADMIN's path above the threshold is escalation, not release.

**Failure mode if unenforced.** A single operational account moves unlimited money out of the association's bank; the dual control the client signed off exists only in the UI.

**Test contract.**
- `BR-31a` TOHFA_ADMIN releases a Rs 10,001 payout → 403, `code: DUAL_APPROVAL_REQUIRED`; payout stays `pending_approval`.
- `BR-31b` The same SUPER_ADMIN who initiated a Rs 10,001 payout cannot approve it → 403, `code: SAME_ACTOR_APPROVAL`.
- `BR-31c` Rs 10,000 exactly follows the single-approval path; the boundary is `> 10000`.

---

### BR-32 — OTP hardening: 6-digit, 60s resend, 3-attempt lockout
| | |
|---|---|
| **Source** | Requirements v1.0 FR-F01 |
| **Status** | LOCKED |
| **Layer** | Server-side, OTP service; attempt counter and resend timestamp stored server-side |
| **Scope** | Track 1 |

**Rule.** Authentication OTPs are 6 digits. A resend may not be requested within 60 seconds of the previous send. After 3 failed verification attempts the challenge is locked and a new challenge is required.

**Failure mode if unenforced.** A 6-digit code with unlimited attempts is brute-forceable in minutes; unlimited resends are an SMS-cost denial-of-wallet vector.

**Test contract.**
- `BR-32a` 4th wrong attempt → 429, `code: OTP_LOCKED`; the challenge cannot be verified afterwards even with the correct code.
- `BR-32b` Resend at 59s → 429, `code: OTP_RESEND_TOO_SOON`; at 61s → accepted.

---

### BR-33 — Aadhaar and mobile are locked fields
| | |
|---|---|
| **Source** | Requirements v1.0 FR-F02; Matrix §2 |
| **Status** | LOCKED |
| **Layer** | Server-side, farmer-profile update path; `farmer.profile.edit_locked_field` is SUPER_ADMIN only |
| **Scope** | Track 1 |

**Rule.** A farmer's Aadhaar number and registered mobile number cannot be changed by the farmer, by TOHFA_ADMIN, or by any warehouse role. Only SUPER_ADMIN may change them, and the change is audit-logged. Aadhaar masking (last 4 vs hidden entirely) is an unresolved client decision; the full number is never returned in any API response.

**Failure mode if unenforced.** Account takeover by mobile-number swap, and uncontrolled mutation of the identity field the whole KYC record hangs on.

**Test contract.**
- `BR-33a` TOHFA_ADMIN patches `aadhaar` or `mobile` on a farmer → 403, `code: FIELD_LOCKED`; other fields in the same request are not applied either.
- `BR-33b` No API response body contains an unmasked Aadhaar number for any role.

> [!NOTE]
> **DRAFT - needs owner approval (Module 9 Proposal)**:
> An exception to the strict mobile field lock is proposed in `docs/change-mobile-design.md` to permit self-service mobile number updates subject to:
> 1. Successful two-step OTP challenge (verification of existing registered number followed by verification of target new number under BR-32 rate limits).
> 2. Immediate revocation of all active sessions and user tokens.
> 3. Security alert dispatch to the prior mobile number.
> 4. Full audit logging under `audit_log` (BR-35).
> Until explicitly approved by the platform owner, the strict lock under BR-33 remains active and enforced.

---

### BR-34 — Reactivating a disabled farmer is Super Admin only
| | |
|---|---|
| **Source** | Matrix §2 |
| **Status** | DERIVED |
| **Layer** | Server-side, `farmer.account.reactivate` permission check |
| **Scope** | Track 1 |

**Rule.** SUPER_ADMIN and TOHFA_ADMIN may disable a farmer account; only SUPER_ADMIN may reactivate one. The asymmetry is deliberate.

**Failure mode if unenforced.** A farmer disabled for a compliance failure is quietly restored by the same operational role that disabled them, with no senior review.

**Test contract.**
- `BR-34a` TOHFA_ADMIN reactivates a disabled farmer → 403.
- `BR-34b` TOHFA_ADMIN disabling the same farmer succeeds — the asymmetry is asserted, not assumed.

---

### BR-35 — The audit trail is append-only
| | |
|---|---|
| **Source** | Matrix P10; Requirements v1.0 §6.4, FR-A01 |
| **Status** | DERIVED |
| **Layer** | Server-side audit middleware on every mutating route; DB revokes UPDATE and DELETE on the audit table |
| **Scope** | Track 1 |

**Rule.** Every mutating action writes an audit row containing actor id, actor role, action code, target, before/after summary and timestamp. Audit rows are immutable: no role, including SUPER_ADMIN, may edit or delete them. SUPER_ADMIN may read and export.

**Failure mode if unenforced.** Every other rule in this document becomes unprovable after the fact — dual approval, self-approval blocking and warehouse scoping all rely on a trustworthy log.

**Test contract.**
- `BR-35a` A direct `UPDATE`/`DELETE` against the audit table as the application DB role fails on permissions.
- `BR-35b` A denied request (403) still produces an audit row recording the attempt.
- `BR-35c` Certificates (`apps/api/src/modules/certifications/certifications.test.ts`): every certificate write writes exactly one `audit_log` row with the same client, inside the write's transaction — `certification.create` (farmer `POST`, after image only), `certification.verify` / `certification.unverify` (admin, before and after images including note, portal reference or reason), `certification.update` / `certification.delete` (farmer, BR-49/BR-50), `certification.admin_update` / `certification.admin_delete` (TOHFA staff, BR-51). Images carry the certificate fields and verification state only (no farmer id, no credentials). A refused write (validation, duplicate number, unknown or deleted id) and a no-op `PATCH` write none, and a unit of work that rolls back takes its audit row with it. Tests: `BR-35c: a farmer recording a certificate writes one certification.create audit row — the farmer as actor, the new certificate as entity, an after image and no before image`; `BR-35c: an admin verify writes one certification.verify audit row — the admin as actor, UNVERIFIED before, VERIFIED after with the note and portal reference`; `BR-35c: an admin unverify writes one certification.unverify audit row — the admin as actor, VERIFIED before, REJECTED after with the reason`; `BR-35c: a write that is refused leaves no audit row — a create refused by BR-48 or by a number on record, a verify or unverify of an unknown or deleted certificate`; `BR-35c (PostgreSQL): create, verify and unverify each write exactly one audit row naming their actor, in the caller's transaction; a unit of work that rolls back leaves no audit row`.

---

### BR-36 — Own-data ownership for farmers and customers
| | |
|---|---|
| **Source** | Matrix P8 |
| **Status** | DERIVED |
| **Layer** | Server-side, owner predicate injected in the data layer for FARMER and CUSTOMER principals |
| **Scope** | Track 1 |

**Rule.** A farmer sees only their own farms, listings, wallet, payouts, invoices and audit history. A customer sees only their own orders, wallet, invoices and tickets. There is no cross-user visibility in either app, in any direction.

**Failure mode if unenforced.** Trivial horizontal privilege escalation — incrementing an id in a mobile app exposes another farmer's finances.

**Test contract.**
- `BR-36a` Farmer A requests Farmer B's listing by id → 404 with empty body.
- `BR-36b` Customer A requests Customer B's order/invoice by id → 404; the invoice PDF endpoint is covered too, not just the JSON one.

**Note (2026-10-11, invoices).** QA found `GET /invoices/{id}` and `GET /invoices/{id}/download` returning any invoice (JSON and PDF) to any logged-in user while `GET /invoices` was scoped. For every role, the detail, the download and `redirect=true` now answer for exactly the invoices the list returns that caller, and 404 with the same body as an unknown id (no PDF bytes, no invoice fields) for every other id; `redirect=true` mints a signed link only after that check. A signed link (`token` + `expires`) needs no bearer token and is 403 when tampered, expired or minted for another invoice; no bearer token and no `token` is 401. Tests: `BR-36: ...` in `apps/api/src/modules/invoices/invoice-access.test.ts`.

---

### BR-37 — Stock movements are ledger-first; adjustments need separate approval
| | |
|---|---|
| **Source** | Requirements v1.0 §6.2; Matrix §7 (`Approve stock adjustment`) |
| **Status** | DERIVED |
| **Layer** | Server-side, append-only `stock_ledger`; adjustment approval permission excludes SUB_WH_ADMIN |
| **Scope** | Track 1 |

**Rule.** Stock quantity is derived from an append-only ledger; no code updates a quantity in place. A SUB_WH_ADMIN may create a manual adjustment for its own warehouse but MUST NOT approve one — approval requires SUPER_ADMIN, TOHFA_ADMIN or MAIN_WH_ADMIN.

**Failure mode if unenforced.** Warehouse shrinkage is self-certified: the same person who loses stock writes it off, and the ledger stops being evidence.

**Test contract.**
- `BR-37a` SUB_WH_ADMIN approves its own adjustment → 403, `code: SELF_APPROVAL_FORBIDDEN`; the adjustment stays `pending`.
- `BR-37b` The adjustment changes available quantity only after approval, and does so by inserting a ledger row, not by mutating one.

---

### BR-38 — No automated processes (manual data entry)
| | |
|---|---|
| **Source** | Matrix P5 |
| **Status** | CONTESTED |
| **Layer** | Product-level constraint; affects reminder jobs, treatment suggestions, weather risk indicators and B2B allocation |
| **Scope** | Deferred / blocked |

**Rule.** The matrix states all data is entered manually by admins, farmers and customers, with no automated processes and dashboards built from database entries. Requirements FR-F06/FR-F07 and §2.2 specify the opposite in four places (auto-reminders, system-suggested treatments, weather-based risk indicators, automatic B2B/Horeca allocation). Nothing in that overlap is built until the client resolves it. Rule-enforcement jobs mandated elsewhere in this document (BR-01 expiry sweep, BR-10 counter-offer expiry, BR-22 cart release) are enforcement, not automation, and remain in scope.

**Failure mode if unenforced.** Weeks are spent building an advisory engine the client believes they did not ask for — or the reminders they expect never exist.

**Test contract.**
- `BR-38a` No scheduled job in Track 1 writes farmer-facing advisory content.
- `BR-38b` The three enforcement jobs above are the only scheduled jobs, asserted against the job registry.

---

### BR-39 — OAuth (Google/Facebook) is login/linking only, never a bypass of mobile+OTP
| | |
|---|---|
| **Source** | Product decision, 2026-09-17 (OAuth social-login Phase 1 spec — no Requirements v1.0 or Matrix section covers this; the whole platform is phone-first by design: OTP (BR-32), SMS, and farmer Aadhaar-linked KYC all hang off the mobile number) |
| **Status** | LOCKED |
| **Layer** | Server-side, `apps/api/src/modules/auth/`; `oauth_identities` has a database-level `UNIQUE (provider, provider_subject_id)` constraint, not just a service-side check |
| **Scope** | Track 1 (backend only; no farmer/customer app UI in this phase) |

**Rule.** Google/Facebook OAuth is an alternate login method for an already mobile-verified account, or a data-prefill convenience during first-time registration. It is NEVER a way to create or activate a TOHFA account without proving a real phone number via mobile+OTP. `POST /auth/oauth/{provider}` only ever does one of two things: (1) an OAuth identity already linked to a user logs that user in exactly like `/auth/login`, including the multi-role-selection behaviour; or (2) an unlinked identity gets back a `NOT_LINKED` profile and a short-lived, single-use, server-signed `linkToken` — never a token pair, never a created account. The client then completes the normal mobile+OTP challenge and passes `linkToken` to `POST /auth/otp/verify` to complete the link, atomically, in the same transaction as the OTP-driven user lookup/creation: an existing mobile number gets the identity linked to that account; a brand-new mobile number gets the account created (status goes straight to `ACTIVE`, since the OTP that proves the phone number just succeeded in the same call) and then linked. One provider identity (`provider`, `provider_subject_id`) maps to exactly one TOHFA account, enforced by a unique constraint, not only application logic; linking an identity already linked elsewhere is rejected rather than silently reassigned.

**Failure mode if unenforced.** Anyone with a Google or Facebook account could mint a TOHFA account and start transacting without ever proving a real Indian mobile number — breaking OTP-based order pickup, SMS notifications, and the KYC chain the farmer side depends on for Aadhaar-linked identity.

**Test contract.**
- `BR-39a` A verified Google/Facebook token whose identity is already linked → same response shape as `/auth/login` (token pair, or `requiresRoleSelection`); `last_login_at` updates.
- `BR-39b` A verified token whose identity is NOT linked → 200 `{ status: 'NOT_LINKED', profile: {...}, linkToken }`; no user row is created, no token pair is issued.
- `BR-39c` `POST /auth/otp/verify` with a valid `linkToken` for a mobile number with no existing account → creates the account AND links the identity, both inside one transaction.
- `BR-39d` `POST /auth/otp/verify` with a valid `linkToken` for a mobile number that already has an account → links the identity to that existing account; no duplicate account is created.
- `BR-39e` `POST /auth/me/oauth/link` against an identity already linked to a different account → 409, `code: OAUTH_IDENTITY_ALREADY_LINKED`.
- `BR-39f` An invalid, expired, or tampered provider token or `linkToken` → rejected with `code: OAUTH_TOKEN_INVALID` / `code: OAUTH_LINK_TOKEN_INVALID` respectively, never with a generic 401.

---

### BR-40 — Farm diary is own-data only
| | |
|---|---|
| **Source** | Matrix P8 (extends BR-36) |
| **Status** | DERIVED |
| **Layer** | Server-side, owner predicate injected in the data layer for FARMER principals on the farm diary endpoints |
| **Scope** | Track 1 |

**Rule.** A farmer's diary entries, and the fields (plot) and activity-category reference endpoints scoped to them, are filtered by `farmer_id`. There is no cross-farmer visibility in either direction: a farmer requesting another farmer's diary entry, field or diary-list/day/month view — whether by guessing an entry id, a farmer id, or a plot id that is not theirs — gets back an empty result set, not a 403. This is the same pattern as BR-36; a 403 would confirm that the row exists for a farmer other than the caller.

**Failure mode if unenforced.** Incrementing an id in the mobile app exposes another farmer's daily activity log — including what and how much they grow, and when — which is exactly the kind of horizontal privilege escalation BR-36 already exists to prevent.

**Test contract.**
- `BR-40a` FARMER A's diary-list/day/month endpoints never return an entry belonging to FARMER B, even when B's entry id, plot id, or farmer id is guessed or passed explicitly; the response is an empty list, not a 403 or 404 leaking existence.

---

### BR-41 — Farm diary is never customer-visible
| | |
|---|---|
| **Source** | Requirements v1.0 §2.3, FR-F08; Matrix P2 (extends BR-16) |
| **Status** | LOCKED |
| **Layer** | Server-side, rbac.json grants + catalog/order serializers for CUSTOMER-authenticated requests |
| **Scope** | Track 1 |

**Rule.** This extends BR-16 (farm-anonymity). No `farmer.diary.*` permission may ever grant the CUSTOMER role any scope — `docs/rbac.json` must show `"none"` for CUSTOMER on every diary permission, with no exception. No diary field (notes, photos, voice notes, activity type, category, sub-activity, or plot/field data, which is GPS-adjacent) may appear in any catalog, order or other customer-facing response. A produce photo carrying farm GPS in its EXIF data is the same breach as a diary photo — both are farm identity leaking into the customer surface.

**Failure mode if unenforced.** The farm diary is the single richest source of farm-identifying detail in the platform (what is planted where, and when); if it reaches a customer response even once, TOHFA's farm-anonymous aggregator position collapses exactly as BR-16 already warns.

**Test contract.**
- `BR-41a` A table-driven rbac test asserts every permission whose code starts with `farmer.diary.` has the `CUSTOMER` grant absent or `"none"` in `docs/rbac.json`.

---

### BR-42 — A diary entry requires a valid category/sub-activity pair, an active crop on the plot, and minutes > 0
| | |
|---|---|
| **Source** | Product decision, 2026-09-24 (Farm Diary Phase 1 spec — no Requirements v1.0 or Matrix section covers this; the farm diary is a from-scratch feature) |
| **Status** | LOCKED |
| **Layer** | Server-side, `apps/api/src/modules/farm-diary/` diary-entry-create path, validated against `diary_sub_activities` and `farm_crops` |
| **Scope** | Track 1 |

**Rule.** `POST` of a new diary entry MUST reject: (i) a `subActivityKey` that does not belong to the given `categoryKey`, per the `diary_sub_activities` reference table — a sub-activity is never valid under a category it was not seeded against; (ii) a `plotId` with no `farm_crops` row in status `GROWING` — a diary entry records activity against a crop that is actually growing, not a bare plot or a finished/planned one; (iii) a missing or non-positive `minutes` value — time spent is the one field every activity type shares, and it must be a real, positive duration.

**Failure mode if unenforced.** A mismatched category/sub-activity pair silently corrupts the activity taxonomy admins later report against; an entry logged against a plot with no active crop cannot be attributed to a harvest or a batch, breaking traceability; and a zero or missing `minutes` value makes labour-time reporting meaningless.

**Test contract.**
- `BR-42a` A `subActivityKey` that does not belong to the given `categoryKey` → 422, `code: DIARY_INVALID_SUB_ACTIVITY`.
- `BR-42b` A `plotId` with no `farm_crops` row in status `GROWING` → 422, `code: DIARY_NO_ACTIVE_CROP`.
- `BR-42c` A missing or non-positive `minutes` value → 422, `code: DIARY_MINUTES_REQUIRED`.

> **Note — BR-40/BR-41/BR-42 status (2026-09-24).** These three rules were drafted during initial Farm Diary API planning and are **provisional, not final-locked** — they're expected to be joined by further rules (edit/delete ownership, workforce/wage validation) as the feature's scope is confirmed with product, and may themselves be amended before ship. Treat their `Status` fields as current-best-draft, not sign-off.
>
> Separately: BR-42a's "seeded against" language assumes `diary_activity_categories`/`diary_sub_activities` are fixed reference data. They are not — this taxonomy is intended to be **admin-manageable** (CRUD via Admin Web, backed by its own permission and audit trail), not a one-time migration seed. BR-42a's validation must check the *current* contents of those tables at request time; the 12/37 rows already seeded are an initial default set, not the final or complete list, and admins may add, rename, or retire entries after launch.
---

### BR-43 — Farm diary entries are editable and soft-deletable by their owning farmer only
| | |
|---|---|
| **Source** | Product decision, 2026-09-24 (Farm Diary Phase 1 spec — edit/delete ownership; extends BR-40) |
| **Status** | DRAFT |
| **Layer** | Server-side, `apps/api/src/modules/farm-diary/` PATCH/DELETE entry paths; owner filter (`diary_entries.farmer_id = scope.farmerId`) applied in the data layer |
| **Scope** | Track 1 |

**Rule.** A diary entry may be edited (`PATCH`) or deleted (`DELETE`) only by the farmer who owns it (`diary_entries.farmer_id = scope.farmerId`), with no time-window restriction. Delete is a soft delete — it sets `deleted_at` and never issues a SQL `DELETE`. A soft-deleted entry is excluded from every list, calendar and get response. An edit or delete attempt against an entry owned by a different farmer returns `NOT_FOUND`, never 403 — the same doctrine as BR-40, since a 403 would confirm that the entry exists for someone else.

**Failure mode if unenforced.** A farmer can rewrite or erase another farmer's activity log by guessing an entry id, and a hard delete destroys the traceability record a harvest or batch may later be attributed to.

**Test contract.**
- `BR-43a` A cross-farmer `PATCH` or `DELETE` of a diary entry → 404, `code: NOT_FOUND`, never 403.
- `BR-43b` `DELETE` sets `deleted_at`; the row is not physically removed, and it disappears from list, calendar and get responses.
- `BR-43c` `PATCH` succeeds regardless of how old the entry's `activity_on` is.

---

### BR-44 — Workforce entries require valid hours and a Money wage rate
| | |
|---|---|
| **Source** | Product decision, 2026-09-24 (Farm Diary Phase 1 spec — workforce/wage lines; root CLAUDE.md §2.2) |
| **Status** | DRAFT |
| **Layer** | Server-side, `apps/api/src/modules/farm-diary/` create/update entry paths; `diary_entry_workers` CHECK constraints as the database backstop |
| **Scope** | Track 1 |

**Rule.** Each worker on a diary entry needs `hoursWorked` greater than 0 and at most 24, and a `wageRatePaise` that is a positive integer number of paise (per root CLAUDE.md §2.2 — never a float). Total labour cost is always computed at read time (`SUM(hours_worked * wage_rate_paise)`), never stored. Updating an entry's workforce list fully replaces the set for that entry in one transaction (delete-then-insert), not a partial diff.

**Failure mode if unenforced.** A float wage rate drifts by fractions of a paisa across every labour-cost report; impossible hours (0, negative, or more than a day) make labour-time reporting meaningless; and a partial-diff update leaves orphaned worker rows for people the farmer removed, silently inflating labour cost.

**Test contract.**
- `BR-44a` A worker with `hoursWorked` ≤ 0 or > 24 → 422, `code: DIARY_WORKER_HOURS_INVALID`.
- `BR-44b` A worker with `wageRatePaise` ≤ 0 or non-integer → 422, `code: DIARY_WAGE_RATE_INVALID`.
- `BR-44c` Updating an entry's workers fully replaces the prior set; no orphaned rows remain for removed workers.

---

### BR-45 — Diary taxonomy is admin-managed, not fixed reference data
| | |
|---|---|
| **Source** | Product decision, 2026-09-24 (Farm Diary Phase 1 spec — see the note under BR-42) |
| **Status** | DRAFT |
| **Layer** | Server-side, `apps/api/src/modules/farm-diary/` admin taxonomy routes under `admin.diary_taxonomy.manage`; `audit_log` written in the same transaction |
| **Scope** | Track 1 |

**Rule.** `diary_activity_categories` and `diary_sub_activities` are managed at runtime by TOHFA_ADMIN/SUPER_ADMIN via dedicated admin endpoints, not fixed by seed alone. Deactivating sets `is_active = false` and never deletes the row: existing `diary_entries` referencing it stay valid, while `GET /farmers/me/diary/taxonomy` and BR-42a's create-time validation both exclude inactive rows. Every create, update or deactivate call is a mutating admin action and writes an `audit_log` row in the same transaction (root CLAUDE.md §6). FARMER and CUSTOMER get no access.

**Failure mode if unenforced.** A hard delete of a retired sub-activity either fails on the foreign key or orphans historical entries; a taxonomy change with no audit row leaves admins unable to explain why reports changed shape; and a farmer who can edit the taxonomy can corrupt the categories every other farmer's entries are filed under.

**Test contract.**
- `BR-45a` FARMER or CUSTOMER on any admin taxonomy endpoint → 403.
- `BR-45b` Deactivating a sub-activity that is in use does not fail or alter existing entries; it disappears from the farmer taxonomy fetch and is rejected by BR-42a for new entries.
- `BR-45c` Every admin taxonomy mutation writes exactly one `audit_log` row in the same transaction.

---

### BR-46 — A plot cannot have two crops simultaneously in status GROWING
| | |
|---|---|
| **Source** | Physical-reality constraint, product decision 2026-09-29 (Crops API spec) |
| **Status** | LOCKED |
| **Layer** | Database, `db/migrations/0023_crops_extra_fields.sql` (`uq_farm_crops_one_growing_per_plot`, a partial unique index on `farm_crops (plot_id) WHERE status = 'GROWING' AND deleted_at IS NULL`); translated to a domain error in `apps/api/src/modules/crops/crops.service.ts` |
| **Scope** | Track 1 |

**Rule.** A plot is one physical patch of ground: it cannot be growing two different crop plantings at the same time. New `farm_crops` rows are created in status `PLANNED`; any `PATCH /farmers/me/crops/{farmCropId}` that would move a row into status `GROWING` MUST fail when the plot already has another live (`deleted_at IS NULL`) row in status `GROWING`. This is not a business threshold requiring separate client confirmation — it is enforced directly, at the database level, so a race between two concurrent requests on the same plot cannot both win.

**Failure mode if unenforced.** Two "currently growing" plantings on the same plot make the produce calendar, expected-yield rollups and the farm diary's BR-42b active-crop lookup all ambiguous about which planting a given day's activity or harvest belongs to.

**Test contract.**
- `BR-46a` Transitioning a crop to `status: GROWING` via `PATCH` on a plot that already has a live `GROWING` crop → 409, `code: CROP_PLOT_ALREADY_GROWING`.
- `BR-46b` The same plot may have any number of `PLANNED`, `HARVESTED` or `FAILED` crops at once — only two simultaneous `GROWING` rows are rejected.
- `BR-46c` Ending the existing `GROWING` crop (moving it to `HARVESTED` or `FAILED`) before transitioning the new one into `GROWING` succeeds.

---

### BR-47 — An animal can exit the herd at most once
| | |
|---|---|
| **Source** | Physical-reality constraint, product decision 2026-09-29 (Livestock API spec) |
| **Status** | LOCKED |
| **Layer** | Database, `db/migrations/0024_livestock.sql` (`uq_livestock_lifecycle_events_one_per_animal`, a unique index on `livestock_lifecycle_events (animal_id)`); translated to a domain error in `apps/api/src/modules/livestock/livestock.service.ts` |
| **Scope** | Track 1 |

**Rule.** `livestock_lifecycle_events` (SOLD, TRANSFERRED, CULLED, DECEASED) records an animal permanently leaving the farmer's herd. An animal cannot leave twice: `POST /farmers/me/livestock/animals/{animalId}/lifecycle-events` MUST fail when the animal already has a lifecycle event recorded. Recording the (only) event and flipping `livestock_animals.lifecycle_status` to match happen in the same transaction, so a partially-applied exit is impossible (root CLAUDE.md's transaction doctrine).

**Failure mode if unenforced.** A second lifecycle event on an animal that already left (e.g. "sold" twice, once to two different buyers) corrupts the herd count, the organic-certification audit trail this data exists for, and `LivestockScreen`'s active list, which would show the animal both gone and still needing another exit recorded.

**Test contract.**
- `BR-47a` Recording a lifecycle event for an animal that already has one → 409, `code: LIVESTOCK_ALREADY_EXITED`.
- `BR-47b` Recording the (first) lifecycle event flips `livestock_animals.lifecycle_status` to match `eventType`, in the same transaction as the event insert.
- `BR-47c` An animal with a recorded lifecycle event is excluded from the default (active-only) `GET /farmers/me/livestock/animals` list.

---

### BR-40 — Soil parameter classification bands are server-configured, not client-literal
| | |
|---|---|
| **Source** | Requirements FR-F06 (soil diary); `db/migrations/0021_soil_management.sql` |
| **Status** | DERIVED |
| **Layer** | Server-side, one shared classification function reading band thresholds from `system_config`; every soil endpoint that returns a classified label (list, detail, tracker) calls that one function rather than computing its own |
| **Scope** | Track 1 |

**Rule.** A soil test reading (pH, organic carbon %, EC, TDS, nitrogen, phosphorus, potassium) is stored on `soil_test_records` as a plain number. Whenever an API response labels that number for a farmer — "Medium", "Acidic", "Good", and so on — the thresholds that produce the label MUST come from `system_config`, evaluated by exactly one shared server-side classification function. No mobile screen and no individual endpoint may hardcode or duplicate its own copy of the band boundaries. This is the same "no hard-coded thresholds" discipline `CLAUDE.md` §2.7 already requires of the Rs 10,000 cap and the 24-hour window, applied to the soil diary's numeric-to-label step. It governs classification only: turning a raw reading into a label. It does NOT reopen BR-38 — generating free-text advisory or recommendation content (e.g. "apply lime because pH is low") is exactly the automated-advice territory BR-38 blocks pending client resolution, and stays out of scope for this feature; BR-40 covers labelling a number, not advising on it.

**Failure mode if unenforced.** Two endpoints (say, the list view and the detail view) duplicate the pH band logic, drift apart after one is edited, and a farmer sees "Neutral" in one screen and "Acidic" in another for the same test record — and the band values become a code change requiring a deploy instead of a config edit when the agronomy team revises them.

**Test contract.**
- `BR-40a` Changing a `system_config` band value changes the label the API returns for an existing soil test record, with no deploy — asserted by reading a record before and after an in-place `system_config` update.
- `BR-40b` The same numeric reading produces the same label across every soil endpoint that returns one (list, detail, tracker), asserted by calling each with an identical reading and comparing labels.

---

### BR-41 — Workforce pay is computed, never stored; hours and rates are always valid Money
| | |
|---|---|
| **Source** | Product decision, 2026-09-29 (Farm Workforce backend, stage 1 of 3 — no Requirements v1.0 or Role & Feature Matrix section covers worker roster/attendance/payroll; the feature exists today only as six farmer-app mobile mockups). Follows from root `CLAUDE.md` §2.2 (money is never a float), BR-36 (own-data ownership) and BR-38 (no automated processes); see `db/migrations/0025_workforce.sql`. |
| **Status** | DERIVED |
| **Layer** | Server-side, one shared payroll-computation function reading raw `worker_attendance`/`worker_advances`/`worker_payouts` rows; database CHECK constraints on `workers.pay_rate_paise` and `worker_attendance.hours_worked` |
| **Scope** | Track 1 |

**Rule.** A worker's `pay_rate_paise` is a positive integer number of paise, never a float, per root `CLAUDE.md` §2.2 — the same "money is never a float" discipline every other TOHFA money field follows, applied to workforce pay. An attendance row's `hoursWorked`, when the worker was marked present, must fall in `(0, 24]`; zero, negative and unrealistic (>24h in a day) values are rejected by a database CHECK, not only a service-layer validation. Gross pay, advances deducted and net payable are never stored as columns on `workers`, `worker_attendance`, `worker_advances` or `worker_payouts` — every API response that surfaces a payroll figure (the workforce summary, the payroll summary, the crop-hours summary) computes it at read time from the raw attendance/advance/payout rows, through exactly one shared server-side function, the same "compute at read time, never store" pattern BR-40 already establishes for soil classification labels. Attendance and payout rows are exclusively farmer-initiated writes: no scheduled job marks a worker present, runs payroll, or otherwise creates a `worker_attendance` or `worker_payouts` row on a farmer's behalf, extending BR-38's no-automation boundary to this feature. A worker, attendance, advance or payout row that belongs to a farm the caller does not own 404s, never 403s, per BR-36.

**Failure mode if unenforced.** A float pay rate or a naive sum silently drifts a worker's net pay by paise that compound over a season (the same class of bug root `CLAUDE.md` §2.2 calls out for `0.1 + 0.2 !== 0.3`); a stored gross/net column drifts from the raw rows the moment one of them is edited or backfilled, so two screens showing "this worker's pay" disagree with each other and with the ledger a farmer would reconstruct by hand; and if a job were ever allowed to write attendance or run payroll, a farmer would see hours or payouts they never entered, with no human action to point to when they dispute it.

**Test contract.**
- `BR-41a` Creating a worker with a non-integer or non-positive `payRatePaise` is rejected; the database CHECK on `workers.pay_rate_paise` rejects a value that somehow bypasses service-layer validation.
- `BR-41b` An attendance upsert with `hoursWorked` equal to `0`, negative, or greater than `24` is rejected; `hoursWorked` of exactly `24` and any value just above `0` are accepted. The database CHECK on `worker_attendance.hours_worked` enforces this independent of the service layer.
- `BR-41c` The gross/net pay figures returned by the workforce summary, payroll summary and crop-hours summary endpoints for the same worker and period are identical, asserted by calling more than one of those endpoints and comparing; no `SELECT` in the codebase reads a stored gross/net column, because none exists.
- `BR-41d` No scheduled job in the job registry writes to `worker_attendance` or `worker_payouts` — both are reachable only through a farmer-initiated request, asserted the same way `BR-38b` asserts the job registry is limited to the three enforcement jobs.
- `BR-41e` Farmer A requests Farmer B's worker, attendance row, advance or payout by id (or lists them under Farmer B's farm id) → 404 with empty body, never 403, matching `BR-36a`.

---

### BR-52 — A disabled notification category suppresses push alerts for its mapped events
| | |
|---|---|
| **Source** | Farmer app design spec, Settings Landing (screen 73, `TOHFA_Screens_73-75_Settings_Spec.pdf`) — five independent notification category toggles; "Turning a notification category off stops push alerts for that category only — the underlying reminders, badges, and due-dates elsewhere in the app are untouched." Product decision 2026-10-05 for the event-to-category mapping |
| **Status** | DERIVED |
| **Layer** | Database, `db/migrations/0032_notification_preferences.sql` (sparse `notification_preferences`, no row = enabled); server-side gate on the PUSH branch of `handleDomainEvent` in `apps/api/src/modules/notifications/notifications.service.ts` (`EVENT_CATEGORY_MAP`); API `GET /notification-preferences`, `PATCH /notification-preferences/{category}` under `notification.own.view` |
| **Scope** | Track 1 |

**Rule.** Each user holds one preference per category — `WEATHER`, `FARM`, `MARKETING`, `PAYROLL`, `COMMUNITY` — defaulting to enabled; a category with no stored row is enabled. When a domain event is mapped to a category and that category is disabled for the event's recipient, `handleDomainEvent` MUST NOT create the PUSH `notifications` row for that event and MUST NOT enqueue its PUSH `notification-dispatch` job. The IN_APP row (which feeds the Notifications Center, its badges and unread count) and the SMS row are created exactly as they would be with the category enabled — the toggle stops push alerts only, as the spec's own copy promises. Mapped today: `counter_offer.received` and `counter_offer.expiring` → `MARKETING`; `payout.released` and `wallet.credited` → `PAYROLL`. Every event that is not mapped (farmer application status, `goods.received`, customer `order.*`) is always pushed and never consults preferences. `WEATHER`, `FARM` and `COMMUNITY` are stored and toggleable but have no producing events yet. A user reads and writes only their own preferences (the user id comes from the resolved scope, never the request). Turning a category off never alters the underlying listing, payout, reminder or due-date it would have announced.

**Failure mode if unenforced.** A farmer who switched Marketing updates off keeps getting counter-offer push alerts, so the toggle is a lie. Over-enforcing is a failure too: suppressing the IN_APP row would silently empty the Notifications Center and its badges for that category, contradicting the sheet's own copy.

**Test contract.**
- `BR-52a` `notification-preferences.test.ts` — `BR-52: disabling a category is persisted for the caller and reported by the dispatcher lookup`: after `updateMine` the lookup reports the category off for that user only, and `listMine` returns all five with that one disabled.
- `BR-52b` `notifications.test.ts` — `BR-52: a disabled MARKETING category skips only the PUSH row and dispatch for counter_offer.received; IN_APP and SMS are still created` and the `PAYROLL` / `payout.released` equivalent: the created rows are exactly IN_APP + SMS, and the only dispatch job enqueued is SMS.
- `BR-52c` `notifications.test.ts` — with the category enabled the same event creates IN_APP + PUSH + SMS and enqueues PUSH + SMS; a disabled category affects only its own user; an unmapped event is delivered even with all five categories disabled.

---

### BR-48 — Certificate entry is strictly validated; `expiresOn` must lie within `cert_expiry_max_past_days` before and `cert_expiry_max_future_days` after today
| | |
|---|---|
| **Source** | User decision 2026-10-05 (farmer certificate form: expiry is required; an already-expired certificate may be recorded but "not very old, one year maximum"; an expiry at most 1.5 years ahead, raised to 2 years (730 days) by decision 2026-10-06; an OTHER certificate names its scheme). Decision 2026-10-06 (BR-48j: a certificate number already on record is a 422 on `body.certNumber` with one generic message, not a 409/500, and does not say who holds it). Follows from BR-01/BR-02, whose eligibility test reads these dates. |
| **Status** | DERIVED |
| **Layer** | Server-side, `POST /farmers/me/certifications` and the merged result of `PATCH /farmers/me/certifications/{id}` (BR-49c). Static checks in `certificationCreateSchema` (`apps/api/src/modules/certifications/certifications.schema.ts`); the checks that depend on today in `certificationDateErrors`; both combined by `validateCertificationInput`, called by `certificationsService.createCertification` / `updateMyCertification` before anything is written; the windows from `system_config.cert_expiry_max_past_days` / `cert_expiry_max_future_days` through `certificationsRepo.getCertExpiryMaxPastDays` / `getCertExpiryMaxFutureDays`. The database CHECKs `certifications_dates_chk` (`expires_on > issued_on`) and `certifications_custom_type_name_chk` (migration 0030, made strict by 0031) back the ordering and customTypeName checks. Rule 8 (BR-48j) is decided by the partial unique index `uq_certifications_number` itself: `certificationsService` translates its unique violation (23505 on that index only) into the field error, for the create and the PATCH write alike. |
| **Scope** | Track 1 |

**Rule.** `POST /farmers/me/certifications` (and `PATCH`, on the stored certificate with the patch applied) MUST refuse with 422 `VALIDATION_FAILED`, with a field-level entry in the Problem's `errors` map keyed `body.<field>` (`body.expiresOn`, `body.issuedOn`, `body.customTypeName`, ...), a certificate where:
1. `issuedOn` or `expiresOn` is missing, not a string, or not a real calendar date written exactly as `YYYY-MM-DD` — no time or offset; `2026-02-30`, `2027-02-29`, `2026-13-01` and year `0000` are rejected, a real leap day such as `2028-02-29` is accepted;
2. `expiresOn` is not strictly after `issuedOn` (equal is rejected, matching the database CHECK);
3. `issuedOn` is after today;
4. `expiresOn` is more than `cert_expiry_max_past_days` days before today. With the seeded value 365, an `expiresOn` of exactly 365 days before today is accepted and 366 days before today is rejected. An already-expired certificate inside the window is accepted — a farmer may record a lapsed certificate; it simply does not qualify (BR-01);
5. `certType` is not one of `PGS`, `NPOP`, `OTHER`, or `certNumber` / `issuingBody` is blank after trimming or longer than 80 / 160 characters (both are stored trimmed);
6. `expiresOn` is more than `cert_expiry_max_future_days` days after today. With the seeded value 730 (2 years), an `expiresOn` of exactly 730 days after today is accepted and 731 days after today is rejected, naming the latest allowed date;
7. `certType` is `OTHER` and `customTypeName` is missing or null, or `certType` is `PGS`/`NPOP` and `customTypeName` is any non-null value; or `customTypeName` is blank after trimming or longer than 80 characters (stored trimmed). Reported on `body.customTypeName`;
8. its `certType` + `certNumber` (after trimming) already belong to another live certificate — the same farmer's or any other farmer's (`uq_certifications_number`, `(cert_type, cert_number) WHERE deleted_at IS NULL`). Reported on `body.certNumber` with exactly one message, "This certificate number can't be used. Check the number and try again.", and `detail` "One or more fields are invalid." — identical whoever holds the number, and naming neither the number nor the holder, so the answer cannot be used to learn which farmer has which certificate. Nothing is written (the certificate's document row included). A PATCH that keeps the certificate's own number is not a duplicate; a number freed by a soft delete (BR-50) may be used again; the same number under another `certType` is not a duplicate. The index decides, not a read beforehand, so of two concurrent requests for one number one succeeds and the other gets this 422 — never a 409 or 500.

"Today" is the Asia/Kolkata calendar date. Both windows are business thresholds: they are read from `system_config` (`cert_expiry_max_past_days`, seeded 365, and `cert_expiry_max_future_days`, seeded 730, in `db/seed/001_reference.sql`) on every request and are never literals in the service; when a row is missing, or is not a non-negative integer, the repo falls back to 365 / 730. `GET /config/farmer` exposes them as `certExpiryMaxPastDays` and `certExpiryMaxFutureDays` so the farmer app can pre-check its form; the server check is the enforcement. Every failing field is reported at once, one message per field.

**customTypeName in the database.** Migration 0030 adds `certifications.custom_type_name` and the CHECK `certifications_custom_type_name_chk`: NULL for PGS/NPOP, and 1-80 characters after trimming when present. Migration 0031 tightens it to the whole rule, `(cert_type = 'OTHER') = (custom_type_name IS NOT NULL)` plus the 1-80 length, so an OTHER row without a name is refused by the database too, on INSERT and UPDATE (the listings BR-02i fixtures that inserted unnamed OTHER rows now name their scheme). Any OTHER row still without a name is backfilled with `'Other'` first; a PGS/NPOP row with a name, or a blank/over-long name, stops the migration with a count instead of being guessed at. Its Down restores 0030's weaker CHECK.

**Failure mode if unenforced.** An impossible date such as `2026-02-30` reached Postgres and came back as a 500 instead of a message the farmer could act on, and a certificate that lapsed years ago, or one "issued" next month, filled the admin verification queue and the farmer's expiry countdown with records nobody can or should verify. A certificate number already on record came back as a 500 (the unique violation unhandled), and a message saying "another farmer holds this number" would have let anyone probe which certificate numbers are registered.

**Test contract.** (`apps/api/src/modules/certifications/certifications.test.ts`; the clock is fixed at 2026-10-05 12:00 Asia/Kolkata unless noted)
- `BR-48a` An `expiresOn` of today, of exactly 365 days ago and of tomorrow is accepted; 366 days ago → 422 on `body.expiresOn`, naming the earliest allowed date, and nothing is written. Tests: `BR-48a: accepts an expiresOn of today`; `BR-48a: accepts an already-expired expiresOn exactly 365 days before today (2025-10-05)`; `BR-48a: rejects an expiresOn 366 days before today (2025-10-04) with 422 VALIDATION_FAILED on body.expiresOn, writing nothing`; `BR-48a: accepts an expiresOn of tomorrow`.
- `BR-48b` The window comes from `system_config`: with the value 30 the boundary moves to 30 days, and the same date is accepted under 365; against PostgreSQL the seeded row is 365, an edited value is followed, a missing row falls back to 365, and `GET /config/farmer` returns it. Tests: `BR-48b: the window is read from system_config (cert_expiry_max_past_days) — set to 30, the boundary moves to 30 days`; `BR-48b: getCertExpiryMaxPastDays reads the seeded system_config row (cert_expiry_max_past_days = 365)`; `BR-48b: getCertExpiryMaxPastDays follows an edited system_config value, and falls back to 365 when the key is absent`.
- `BR-48c` "Today" is Asia/Kolkata: at 00:30 IST, when the UTC date is still the day before, the window and the future-`issuedOn` check use the IST date. Test: `BR-48c: "today" is the Asia/Kolkata calendar date, not the UTC date`.
- `BR-48d` An `issuedOn` of tomorrow → 422 on `body.issuedOn` and nothing is written; today is accepted; both date errors are reported together. Tests: `BR-48d: rejects an issuedOn in the future (tomorrow) with 422 VALIDATION_FAILED on body.issuedOn, writing nothing`; `BR-48d: accepts an issuedOn of today`; `BR-48d: reports both fields when issuedOn is in the future and expiresOn is too old`.
- `BR-48e` Impossible calendar dates, date-times, other formats, empty or blank strings, non-strings and missing fields are rejected for both dates; real leap days are accepted; over HTTP the answer is 422 with `errors['body.expiresOn']`. Tests: `BR-48e: rejects impossible calendar dates`; `BR-48e: accepts real leap days (2028-02-29, 2000-02-29)`; `BR-48e: rejects date-times, other formats, empty strings and non-strings`; `BR-48e: issuedOn and expiresOn are both required`; `BR-48e: POST /v1/farmers/me/certifications answers an impossible date with 422 VALIDATION_FAILED and a field-level error on body.expiresOn`.
- `BR-48f` An `issuedOn` after, or equal to, `expiresOn` is rejected. Tests: `BR-48f: rejects an issuedOn after expiresOn, and one equal to it (the database requires expires_on > issued_on)`; `POST /v1/farmers/me/certifications rejects invalid date ordering (expiresOn <= issuedOn)`.
- `BR-48g` Blank or over-long `certNumber` / `issuingBody` and unknown `certType` values are rejected field by field; accepted values are trimmed. Tests: `BR-48g: certNumber and issuingBody are trimmed, must be non-empty, and are capped at 80 and 160 characters`; `BR-48g: rejects an unknown certType`; `BR-48g: POST /v1/farmers/me/certifications rejects an unknown certType and a blank certNumber field by field`.
- `BR-48h` An `expiresOn` exactly 730 days ahead (2028-10-04 on the fixed clock) is accepted; 731 days ahead and far in the future → 422 on `body.expiresOn` naming the latest allowed date, nothing written; with the config value 30 the boundary moves to 30 days; the boundary uses the Asia/Kolkata date; against PostgreSQL the seeded row is 730, an edited value is followed, an invalid or missing row falls back to 730; `GET /config/farmer` returns `certExpiryMaxFutureDays`. Tests: `BR-48h: accepts an expiresOn exactly 730 days after today (2028-10-04)`; `BR-48h: rejects an expiresOn 731 days after today (2028-10-05), and one far in the future, with 422 VALIDATION_FAILED on body.expiresOn, writing nothing`; `BR-48h: the future window is read from system_config (cert_expiry_max_future_days) — set to 30, the boundary moves to 30 days`; `BR-48h: "today" for the future window is the Asia/Kolkata date, not the UTC date`; `BR-48h: getCertExpiryMaxFutureDays reads the seeded system_config row (cert_expiry_max_future_days = 730)`; `BR-48h: getCertExpiryMaxFutureDays follows an edited system_config value, and falls back to 730 when the value is invalid or the key is absent`; `BR-48h: returns certExpiryWarningDays, certExpiryMaxPastDays and certExpiryMaxFutureDays from the repo (mocked, no database)`; `BR-48h: passes through whatever the repo returns, without hard-coding a value in the service`.
- `BR-48i` `OTHER` without `customTypeName` (omitted or null) and `PGS`/`NPOP` with one are rejected on `customTypeName` by the schema, the service and over HTTP; blank, whitespace-only and 81-character names are rejected, exactly 80 is accepted, names are trimmed; other field errors are still reported alongside; the response carries `customTypeName` (null for PGS); the database CHECK rejects a name on a PGS row and a blank or over-long name. Tests: `BR-48i: certType OTHER requires customTypeName — omitted or null is rejected on customTypeName`; `BR-48i: PGS or NPOP with a non-null customTypeName is rejected on customTypeName; null or omitted is accepted`; `BR-48i: customTypeName is trimmed and must be 1-80 characters after trimming`; `BR-48i: other fields are still reported alongside a customTypeName error`; `BR-48i: an OTHER certificate is created with its trimmed customTypeName; a PGS one returns customTypeName null`; `BR-48i: the service refuses an OTHER certificate without customTypeName, and a PGS one with it, on body.customTypeName, writing nothing`; `BR-48i: POST /v1/farmers/me/certifications answers OTHER without customTypeName, and PGS with one, with 422 on body.customTypeName`; `BR-48i (PostgreSQL): the custom_type_name CHECK rejects a name on a PGS row and a blank or over-long name on an OTHER row`; `BR-48i (PostgreSQL): since migration 0031 the CHECK also refuses an OTHER row without a name, on INSERT and on UPDATE — the database no longer relies on the API for that half`.
- `BR-48j` A `certType` + `certNumber` already on record → 422 on `body.certNumber` alone with the generic message, on POST and PATCH; for the farmer's own number (also padded with spaces) and another farmer's the visible error is identical and contains neither the number, the holder, the index name nor the database's text; nothing is written and no recompute or audit row follows; another index's violation or another error code is not disguised; PATCH keeping its own number, a number freed by a soft delete and the same number under another `certType` are accepted; two concurrent POSTs on separate connections give one 201 and one 422; over HTTP the 422 is `application/problem+json`, the same body for the holder and another farmer. Tests: `BR-48j: POST — a unique violation on uq_certifications_number is 422 VALIDATION_FAILED on body.certNumber alone, with the generic message, and no recompute follows`; `BR-48j: PATCH — the same violation while writing the edit is the same 422, and no recompute or audit row follows`; `BR-48j: nothing the client or a log sees names the number, a farmer, the index or what the database said`; `BR-48j: any other database error — another index's unique violation, or another error code — passes through untouched, not disguised as a certNumber error`; `BR-48j (PostgreSQL): recording a certType + certNumber the farmer already holds (also padded with spaces) is 422 on body.certNumber and writes nothing; the same number under another certType is not a duplicate`; `BR-48j (PostgreSQL): a number another farmer holds gets exactly the same 422 as the farmer's own duplicate — nothing in it says who holds it`; `BR-48j (PostgreSQL): a PATCH onto a number already on record — by certNumber, or by certType — is 422 on body.certNumber and leaves the certificate unchanged and VERIFIED; keeping its own number is never a conflict`; `BR-48j (PostgreSQL): a number freed by a soft delete is not a duplicate — another farmer may record it, and a PATCH may move onto it`; `BR-48j (PostgreSQL): two concurrent POSTs of one number on separate connections — the first commits, the second gets the 422 from the unique index, never a 500`; `BR-48j (PostgreSQL): over HTTP a duplicate number is 422 problem+json on body.certNumber, not 500 — the same body for the holder and for another farmer`.
- Farmer mobile mirror, pre-check only (`apps/mobile/src/roles/farmer/screens/certifications/certificationForm.ts`, tested in `apps/mobile/src/roles/farmer/tests/certification_form.test.ts`): the Add Certification form applies rules 1–5 before sending, with "today" in Asia/Kolkata and the window from `GET /config/farmer` `certExpiryMaxPastDays` (365 only when the endpoint cannot be read), reports every failing field at once, and shows a 422's `errors['body.<field>']` under the matching field — localized when re-checking with freshly fetched config reproduces the rule, otherwise the server's message. Tests: the names starting `BR-48` in that file.

---

### BR-49 — Editing a certificate sends it back for verification; the edited result is validated like a new one
| | |
|---|---|
| **Source** | User-agreed default, 2026-10-05 (farmer may edit a recorded certificate; what an admin verified must not silently change underneath the verification). Extends BR-02 (verification is manual) and BR-48. |
| **Status** | DERIVED |
| **Layer** | Server-side, `PATCH /farmers/me/certifications/{id}` (`certification.manage_own`, own scope). `certificationUpdateSchema` (field checks, at least one field); `certificationsService.updateMyCertification` (ownership, merged validation, no-op detection, reset, recompute, audit) in one transaction; `certificationsRepo.updateCertificationResetVerification`. |
| **Scope** | Track 1 |

**Rule.** A farmer may edit `certType`, `customTypeName`, `certNumber`, `issuingBody`, `issuedOn`, `expiresOn` and `documentUrl` of their own, not-deleted certificate.
1. The stored certificate with the patch applied MUST pass all of BR-48 (both expiry windows, issuedOn not in the future, ordering, customTypeName coupling), reported 422 `VALIDATION_FAILED` keyed `body.<field>` even for a field the patch did not send. Moving away from `OTHER` therefore needs `customTypeName: null`; moving to `OTHER` needs a name. An empty patch is 422 keyed `body`. `farmerId`, `verificationStatus` and other unknown keys are ignored.
2. Any change to one of those fields resets verification: a `VERIFIED` or `REJECTED` certificate becomes `UNVERIFIED` and `verified_by`, `verified_at`, `verification_notes` and `portal_checked_url` are cleared; an `UNVERIFIED` one stays `UNVERIFIED`. A new `documentUrl` records a new `farmer_documents` row and repoints the certificate (the old document is kept).
3. A patch whose values all equal the stored ones (after trimming) is a no-op: 200 with the certificate unchanged, verification kept, nothing written, no recompute, no audit row.
4. After a change the farmer's market block is recomputed in the same transaction (BR-01/BR-02), and one `certification.update` `audit_log` row records the before and after images, including the discarded verification (BR-35).
5. Another farmer's certificate, a soft-deleted one and an unknown id are 404 `NOT_FOUND`, never 403 (BR-36).

**Failure mode if unenforced.** A farmer gets a certificate verified, then edits its number, dates or document to something nobody checked, and keeps listing on the old verification — or edits a rejected certificate into an apparently clean one.

**Test contract.** (`apps/api/src/modules/certifications/certifications.test.ts`)
- `BR-49a` An edit of a VERIFIED, REJECTED or UNVERIFIED certificate leaves it UNVERIFIED with every verifier field cleared, for a change to each editable field; the market block is recomputed; against PostgreSQL the farmer's only verified PGS certificate, once edited, re-blocks the farmer. Tests: `BR-49a: editing the certNumber of a VERIFIED certificate makes it UNVERIFIED, clears verifiedBy/verifiedAt/verificationNotes/portalCheckedUrl, and recomputes the market block in the same transaction`; `BR-49a: editing a REJECTED certificate makes it UNVERIFIED and clears the rejection reason and verifier`; `BR-49a: editing an UNVERIFIED certificate applies the change and leaves it UNVERIFIED`; `BR-49a: a change to any one editable field (certType+customTypeName, customTypeName, certNumber, issuingBody, issuedOn, expiresOn, documentUrl) resets verification`; `BR-49a (PostgreSQL): editing the farmer's only verified PGS certificate resets it to UNVERIFIED, clears every verifier column, re-blocks the farmer and writes the audit rows, all in the caller's transaction`.
- `BR-49b` Re-sending the stored values keeps VERIFIED, writes nothing and does not recompute. Tests: `BR-49b: a PATCH whose values all equal the stored ones is a no-op — 200 with the certificate still VERIFIED, nothing written, no recompute, no audit row`; `BR-49b (PostgreSQL): a PATCH that changes nothing keeps the certificate VERIFIED and the farmer unblocked`.
- `BR-49c` The merged result is validated like POST. Tests: `BR-49c: the merged result is validated like POST — a new expiresOn on or before the stored issuedOn is 422 on body.expiresOn, nothing written`; `BR-49c: the merged result must respect both BR-48 windows and the issuedOn-not-in-future rule`; `BR-49c: changing certType from OTHER to PGS without clearing customTypeName is 422 on body.customTypeName; with customTypeName null it succeeds`; `BR-49c: changing certType to OTHER without a customTypeName is 422 on body.customTypeName; clearing the name of an OTHER certificate is too`.
- `BR-49d` Not-own, unknown and deleted ids are 404 and unchanged. Tests: `BR-49d: another farmer's certificate is 404 NOT_FOUND (never 403), and nothing is written`; `BR-49d: an unknown id and a soft-deleted certificate are 404 NOT_FOUND`; `BR-49d (PostgreSQL): another farmer's certificate and a soft-deleted one are 404 NOT_FOUND and stay unchanged`.
- `BR-49e` An edit writes one `certification.update` audit row with before/after verification state. Test: `BR-49e: an edit writes one certification.update audit row recording the verification state before and after`.
- `BR-49f` Request shape and wiring: empty body, stripped unknown keys, per-field checks, nullable customTypeName; 401 unauthenticated, 403 for roles without `certification.manage_own`, 422 for a malformed id. Tests: `BR-49f: an empty body is rejected (at least one field is required)`; `BR-49f: farmerId, verificationStatus and other unknown keys are stripped, never applied — a body of only those is empty`; `BR-49f: each field is validated like POST when present; customTypeName alone may be null (to clear it)`; `BR-49f/BR-50: an unauthenticated PATCH or DELETE is 401`; `BR-49f/BR-50: roles without certification.manage_own (SUPER_ADMIN, TOHFA_ADMIN, CUSTOMER) get 403 on PATCH and DELETE`; `BR-49f/BR-50: a malformed id is 422 on params.id for PATCH and DELETE`; `BR-49f: an empty PATCH body is 422 VALIDATION_FAILED keyed 'body'; a bad field is keyed body.<field>`; `BR-49 (PostgreSQL): PATCH documentUrl records a new farmer_documents CERTIFICATE row, points the certificate at it and returns it as documentUrl`.

---

### BR-50 — Deleting a certificate is a soft delete that removes it from every list and from eligibility
| | |
|---|---|
| **Source** | User-agreed default, 2026-10-05 (farmer may remove a certificate recorded by mistake). Same soft-delete doctrine as BR-43. |
| **Status** | DERIVED |
| **Layer** | Server-side, `DELETE /farmers/me/certifications/{id}` (`certification.manage_own`, own scope). `certificationsService.deleteMyCertification`, `certificationsRepo.softDeleteOwn`; every certification read, admin verify/unverify, `recomputeFarmerMarketBlock`, `listingsRepo.getListingCertEligibility` and the partial unique index `uq_certifications_number` filter `deleted_at IS NULL`. |
| **Scope** | Track 1 |

**Rule.** `DELETE` sets `deleted_at` on the caller's own live certificate and returns 204; the row and its `farmer_documents` document are kept, and no SQL `DELETE` is issued. A deleted certificate disappears from the farmer list, the admin list and detail, admin verify/unverify (404), the listing gate and the market-block recompute — which runs in the same transaction, so deleting the farmer's only qualifying certificate blocks them. The same `certType` + `certNumber` may then be recorded again. Another farmer's certificate, an already-deleted one and an unknown id are 404 `NOT_FOUND`, never 403 (BR-36). One `certification.delete` `audit_log` row records the deleted certificate (BR-35).

**Failure mode if unenforced.** A hard delete loses the record an admin verified against; a delete that leaves the certificate in eligibility lets a farmer keep listing on a certificate they withdrew; a unique index that counts deleted rows stops them re-entering it correctly.

**Test contract.** (`apps/api/src/modules/certifications/certifications.test.ts`)
- `BR-50a` Soft delete, recompute, audit; gone from lists, admin reads, eligibility; row and document kept. Tests: `BR-50a: DELETE soft-deletes the farmer's own certificate, recomputes the market block in the same transaction and writes a certification.delete audit row`; `BR-50a (PostgreSQL): DELETE keeps the row and its document (deleted_at set) but removes the certificate from the farmer list, admin list and detail, listing eligibility and the market block; verify then 404s`.
- `BR-50b` Not-own, unknown and already-deleted → 404. Tests: `BR-50b: another farmer's certificate, an unknown id and an already-deleted certificate are 404 NOT_FOUND, with no recompute`; `BR-50b (PostgreSQL): deleting the same certificate twice is 404 NOT_FOUND the second time`; `BR-49d (PostgreSQL): another farmer's certificate and a soft-deleted one are 404 NOT_FOUND and stay unchanged`.
- `BR-50c` Re-add after delete. Test: `BR-50c (PostgreSQL): after deleting a certificate the farmer can record the same certType and certNumber again`.
- `BR-50d` No admin action on a deleted certificate. Test: `BR-50d: an admin cannot verify or unverify a deleted certificate (404 NOT_FOUND)`.

---

### BR-51 — TOHFA staff may correct or remove any farmer's certificate, with the farmer's own edit and delete rules
| | |
|---|---|
| **Source** | Specification gap, decided 2026-10-06 (TOHFA staff need to correct or remove a farmer's certificate record entered by mistake). Neither Requirements Ch.6 nor the Role & Feature Matrix has a row for it; the grants are a conservative default recorded in `docs/rbac.json` `conflicts` ("Admin edit/delete of farmer certification records") and need client confirmation. Extends BR-49 and BR-50. |
| **Status** | DERIVED |
| **Layer** | Server-side, `PATCH /admin/certifications/{id}` and `DELETE /admin/certifications/{id}` (`certification.manage_any`: SUPER_ADMIN and TOHFA_ADMIN `all`, every other role `none`). `certificationsService.adminUpdateCertification` / `adminDeleteCertification`, which share BR-49's edit and BR-50's soft delete with the farmer paths (`editCertification`, `softDeleteCertification`), each in one transaction; the certificate is row-locked by `certificationsRepo.findByIdForUpdate`. |
| **Scope** | Track 1 |

**Rule.** An admin holding `certification.manage_any` may edit or soft-delete any farmer's live certificate.
1. The edit takes the farmer `PATCH`'s body (`CertificationUpdate`) and has every BR-49 effect: the merged result must pass all of BR-48 (422 keyed `body.<field>`, a number already on record is 422 on `body.certNumber` with the generic message), any real change resets verification to `UNVERIFIED` and clears `verified_by`, `verified_at`, `verification_notes` and `portal_checked_url` — an admin edit is never a verification — and a patch equal to the stored values is a no-op (nothing written, no recompute, no audit row).
2. The delete has every BR-50 effect: `deleted_at` is set, the row and its document are kept, and the certificate leaves the farmer list, admin list and detail, verify/unverify, listing eligibility and the market block; the number may be recorded again. 204.
3. The market block is recomputed in the same transaction for the farmer who OWNS the certificate, read from the stored row; a `farmerId` in the body is ignored (and stripped by the schema).
4. One `audit_log` row per change, in the same transaction, names the admin as actor and the acting role: `certification.admin_update` (before and after images, changed fields) or `certification.admin_delete` (before image) — separate action codes from the farmer's `certification.update` / `certification.delete`, so an admin correction is distinguishable in the trail (BR-35).
5. An unknown or deleted id is 404 `NOT_FOUND`. Without `certification.manage_any` (FARMER_ADMIN, MAIN_WH_ADMIN, SUB_WH_ADMIN, FARMER, CUSTOMER) the paths answer 403; a farmer still reaches only their own certificates through `/farmers/me/certifications` (BR-36, BR-49d, BR-50b).

**Failure mode if unenforced.** Staff fix a typo in a farmer's verified certificate and it stays VERIFIED although nobody checked the new value, or the fix leaves the farmer's market block computed from the old data; an admin edit that recomputes the wrong farmer (the admin, or a farmer named in the body) unblocks someone without a valid certificate; a correction that leaves no audit row cannot be told apart from the farmer's own edit.

**Test contract.** (`apps/api/src/modules/certifications/certifications.test.ts`; the clock is fixed at 2026-10-05 12:00 Asia/Kolkata for the unit tests)
- `BR-51a` Edit: reset to UNVERIFIED with every verifier field cleared; the owner's block recomputed (with the admin as actor), never the admin's or one named in the body; merged validation and duplicate number as on the farmer path. Tests: `BR-51a: an admin edit of any farmer's VERIFIED certificate makes it UNVERIFIED, clears every verifier field and recomputes the OWNER's market block, in the same transaction`; `BR-51a: the owner comes from the stored certificate, never the request — a farmerId in the patch is ignored`; `BR-51a: the merged result is validated exactly like a farmer's edit (BR-48, BR-49c) — both expiry windows, issuedOn in the future, date order and the customTypeName coupling are 422 keyed body.<field>, nothing written`; `BR-51a: moving the certificate onto a number already on record is 422 on body.certNumber with the generic message — no recompute, no audit row`; `BR-51a (PostgreSQL): an admin edit of a farmer's only verified PGS certificate resets it to UNVERIFIED, re-blocks that farmer — the owner — and writes one certification.admin_update row naming the admin, all in the caller's transaction`; `BR-51a (PostgreSQL): an admin edit onto a certificate number already on record is 422 on body.certNumber and leaves the certificate unchanged and VERIFIED, with no audit row`.
- `BR-51b` No-op edit. Test: `BR-51b: an admin PATCH whose values all equal the stored ones is a no-op — still VERIFIED, nothing written, no recompute, no audit row`.
- `BR-51c` Soft delete. Tests: `BR-51c: an admin delete soft-deletes any farmer's certificate, recomputes the OWNER's market block in the same transaction, and the certificate leaves every list`; `BR-51c (PostgreSQL): an admin delete keeps the row but takes the certificate out of the farmer list, the admin list and detail, listing eligibility and the owner's market block, with one certification.admin_delete row naming the admin`.
- `BR-51d` 404s, and the farmer paths still stop at their own certificates. Tests: `BR-51d: an unknown id and a soft-deleted certificate are 404 NOT_FOUND for admin PATCH and DELETE, and nothing is written`; `BR-51d: a farmer's own PATCH and DELETE still cannot reach another farmer's certificate — only the admin paths can`; `BR-51d (PostgreSQL): an unknown id and a soft-deleted certificate are 404 NOT_FOUND for admin PATCH and DELETE and stay unchanged`.
- `BR-51e` Audit. Test: `BR-51e: an admin edit writes one certification.admin_update row and an admin delete one certification.admin_delete row — the admin as actor, the certificate as entity, before/after images in the certification.update shape`.
- `BR-51f` Wiring: 401 unauthenticated; 403 for every role without `certification.manage_any`; 422 for a malformed id, an empty body and a bad field; end to end over HTTP. Tests: `BR-51f: an unauthenticated admin PATCH or DELETE is 401`; `BR-51f: roles without certification.manage_any (FARMER_ADMIN, MAIN_WH_ADMIN, SUB_WH_ADMIN, FARMER, CUSTOMER) get 403 on admin PATCH and DELETE — a farmer cannot reach the admin paths`; `BR-51f: for SUPER_ADMIN and TOHFA_ADMIN a malformed id is 422 on params.id, an empty PATCH body is 422 keyed 'body' and a bad field is keyed body.<field> — the farmer PATCH's request schema`; `BR-51 (PostgreSQL): over HTTP a TOHFA_ADMIN token edits a farmer's verified certificate (200, UNVERIFIED, owner re-blocked) and a SUPER_ADMIN token deletes it (204); afterwards both are 404 and the farmer's own list is empty`. Grants: `certification.manage_any` rows in `apps/api/src/rbac/rbac.test.ts` (SUPER_ADMIN/TOHFA_ADMIN `all`, the other five roles `none`).

---

### BR-53 — Farmer bank accounts and UPI payout destinations are own-data, masked, and server-validated; verification cannot be self-asserted
| | |
|---|---|
| **Source** | Owner brief 2026-10-08; mobile payment screens `BankAccountScreen.tsx`, `UpiIdScreen.tsx`; table `farmer_bank_accounts` (`db/migrations/0007_money.sql`, `0033_farmer_bank_accounts_branch.sql`); module `apps/api/src/modules/farmer-bank-accounts/` |
| **Status** | DERIVED |
| **Layer** | Server-side, `GET/POST/PATCH/DELETE /farmers/me/bank-accounts`, `POST /farmers/me/bank-accounts/{id}/default`, `GET/PUT/DELETE /farmers/me/upi`; `farmer.bank_account.manage_own` (FARMER = own); `farmer_bank_accounts` table + partial index `uq_farmer_bank_accounts_default` |
| **Scope** | Track 1 |

**Rule.** A farmer manages payout destinations under `/farmers/me/bank-accounts` and `/farmers/me/upi`.
1. **Masked responses:** The full account number is NEVER returned in any API response body (only `accountNumberLast4`, 4 digits, exactly as Aadhaar under BR-33b). Only the last 4 digits are kept at all, and NO account-number token is stored: `account_number_token` is written NULL. The `0007_money.sql` table comment about an opaque provider token describes a future integration. Until then these accounts are display-only and cannot be used as a payout destination. Payout tokenisation or encrypted storage of the full number is an OPEN OWNER DECISION.
2. **Server-side IFSC & Account format:** IFSC code must match `^[A-Z]{4}0[A-Z0-9]{6}$`; it is case-insensitive on input and stored uppercase. Account number must be 9–18 digits. UPI ID must be a valid VPA (`^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$`).
3. **No self-asserted verification:** When created or edited by the farmer, `isVerified` is always false; verification status can be modified only by an admin action.
4. **Single primary destination:** Exactly one default destination per farmer (`is_default = true`, enforced by partial unique index `uq_farmer_bank_accounts_default`). Setting a destination as default clears default from any existing active destination of that farmer. The first destination of either kind becomes the default; an omitted `isDefault` on a UPI update keeps the existing flag; deleting the default promotes the newest remaining active destination; and a delete is refused with 409 `INVALID_STATE_TRANSITION` while a payout in `REQUESTED`, `PENDING_APPROVAL`, `APPROVED` or `PROCESSING` references the destination. A UPI id is a destination separate from bank accounts: a UPI id on a bank endpoint is 404 and a bank account on a UPI endpoint is 404.
5. **Soft delete only:** Deleting a bank account or UPI destination sets `deleted_at = now()`; rows are never hard-deleted, so settled payouts keep their destination. Deletion is refused with 409 while an unsettled payout references it (item 4).
6. **Audit logging:** Creating, updating, setting default, or soft-deleting writes an `audit_log` row in the same transaction.

**Failure mode if unenforced.** Account number exposure leaks sensitive financial data; farmers self-verifying invalid IFSC or accounts creates payout failures during bank transfers; multiple default accounts cause ambiguous automated payout dispatching.

**Test contract.** (`apps/api/src/modules/farmer-bank-accounts/farmer-bank-accounts.test.ts`)
- `BR-53a` API returns only `accountNumberLast4`, never the raw account number.
- `BR-53b` Invalid IFSC format or account number length is rejected with 422 `VALIDATION_FAILED`.
- `BR-53c` Farmer cannot self-assert `isVerified: true` on create or update; it is always false.
- `BR-53d` Setting an account as default unsets default on the farmer's previous account.
- `BR-53e` A destination is soft-deleted, never hard-deleted; refused with 409 `INVALID_STATE_TRANSITION` while an unsettled payout references it (bank and UPI).
- `BR-53f` Cross-farmer access returns 404 (BR-36).
- `BR-53g` Mutations write `audit_log` rows with actor and masked before/after images (BR-35).
- `BR-53h` UPI is separate from bank accounts: a UPI id on a bank route (and the reverse) is 404; the UPI holder name is the farmer's real name (422 when the farmer has none) and no bank name is fabricated.
- `BR-53i` Default semantics: first destination becomes default, omitted `isDefault` on UPI keeps the flag, deleting the default promotes the newest remaining destination, every mutation takes the per-farmer lock first, and concurrent creates with `isDefault: true` never fail (never 500) and leave exactly one default.

---

### BR-54 — Profile Documents are own-data only with masked Aadhaar and short-lived signed read URLs
| | |
|---|---|
| **Source** | Owner brief 2026-10-08; mobile `ProfileScreen.tsx` documents modal; module `apps/api/src/modules/farmer-documents/` (reads `farmer_documents` and the farmer application) |
| **Status** | DERIVED |
| **Layer** | Server-side, `apps/api/src/modules/farmer-documents/` |
| **Scope** | Track 1 (farmer-facing read-only) |

**Rule.** A farmer may inspect their uploaded registration and profile documents (Aadhaar Card, Land Patta / FMB Map, PGS Scope Certificate, Soil & Water Health Card) via `GET /farmers/me/documents`.
1. **Own data only:** Authenticated FARMER can only see documents from their own farmer profile and application (BR-36).
2. **Aadhaar privacy:** The full Aadhaar number is NEVER exposed in the API response. Only the last 4 digits (`documentNumberLast4`) may be returned.
3. **Signed read URLs:** Any document file URL is returned as a short-lived (15-minute) signed read URL, generated server-side. Only files recorded against the farmer's own application or their own `farmer_documents` rows are signed; any other URL (another farmer's key, an external URL, a `/storage/` path on another host) yields `readUrl` null (`BR-54g`).
4. **EXIF/GPS stripping:** Any image uploads follow BR-16 privacy sanitization.
5. **Read-only endpoint:** `GET /farmers/me/documents` has no mutating verb, so a "mutations are rejected" clause is not applicable and has no test; uploading or replacing documents is outside this endpoint (BR-33).
6. **Status is evidence-based:** A document is `VERIFIED` only when a verified record exists for that file; an application or KYC status alone never makes a document verified. File names are real stored values or null, never invented (`BR-54f`).

**Known limitations (not defects of this rule).** The soil-card slot is not yet uploadable, so it is always `ACTION_NEEDED`. Aadhaar and patta stay `UPLOADED` because approval does not copy the step-4 uploads into `farmer_documents` (open item in farmer-applications).

**Failure mode if unenforced.** Leaking full Aadhaar numbers violates Indian privacy regulations; long-lived public file URLs allow unauthorized access to sensitive KYC land and identity documents.

**Test contract.** (`apps/api/src/modules/farmer-documents/farmer-documents.test.ts`)
- `BR-54a` `GET /farmers/me/documents` returns documents with docType, displayName, uploadStatus, and signed readUrl.
- `BR-54b` Aadhaar number is never returned in full; only `documentNumberLast4` (4 digits) is visible.
- `BR-54c` Signed read URL expires in short duration and includes signed/expiry token; the stored URL is never returned.
- `BR-54d` A user without a farmer profile gets 404 `NOT_FOUND`; each farmer only ever sees their own documents (BR-36).
- `BR-54e` Non-farmer roles cannot access `GET /farmers/me/documents` (403 FORBIDDEN; no token 401).
- `BR-54f` A document is `VERIFIED` only when a verified record exists for the file; file names are never invented.
- `BR-54g` Only files recorded against the farmer's own application or `farmer_documents` rows are signed; unrecognised URLs give `readUrl` null.

---

### BR-55 — Tree and perennial plantings are own-data, positive-count validated, and audit-logged
| | |
|---|---|
| **Source** | Owner brief 2026-10-08; mobile `AddPlantingScreen.tsx`, `EditPlantingScreen.tsx`, `TreesListScreen.tsx`; table `tree_plantings` (`db/migrations/0034_tree_plantings.sql`); module `apps/api/src/modules/tree-plantings/` |
| **Status** | DERIVED |
| **Layer** | Server-side, `apps/api/src/modules/tree-plantings/`; `tree_plantings` table (`0034_tree_plantings.sql`) |
| **Scope** | Track 1 (farmer-facing CRUD) |

**Rule.** A farmer manages tree and perennial plantings under `/farmers/me/tree-plantings`.
1. **Positive count:** `treeCount` must be an integer greater than 0 (`BR-55a`).
2. **Planting date validation:** `plantedOn` must be a real calendar date (2026-02-30 is 422) and not after today in Asia/Kolkata (`BR-55b`).
3. **Own data only:** Authenticated farmer can only list, view, create, update, or delete plantings belonging to their own farmer profile. Attempting to access another farmer's planting returns 404 (BR-36, `BR-55c`).
4. **Soft delete:** Deleting a tree planting sets `deleted_at = now()`. Soft-deleted plantings are excluded from lists and queries (`BR-55d`).
5. **Audit logging & Row locking:** Creating, updating, or deleting a tree planting locks the farmer row and writes an append-only `audit_log` row (BR-35, `BR-55e`).
6. **Farm and plot ownership:** The `farmId` and `plotId` given on create or update must belong to the caller, and the plot must belong to the given farm; otherwise 404 `NOT_FOUND`, never 403 (`BR-55f`).
7. **Stable pagination:** The list uses cursor pagination that never skips or repeats rows: the cursor carries the microsecond timestamp with an id tie-break, and a cursor this endpoint did not issue is 422 (`BR-55g`).

**Failure mode if unenforced.** Zero or negative tree counts corrupt agroforestry metrics and tree cover reporting; future dates create inconsistent plantation timelines; cross-farmer access leaks confidential land usage.

**Test contract.** (`apps/api/src/modules/tree-plantings/tree-plantings.test.ts`)
- `BR-55a` Rejects `treeCount <= 0` or non-integer with 422 `VALIDATION_FAILED`.
- `BR-55b` Rejects a non-calendar `plantedOn` or one after today (Asia/Kolkata) with 422 `VALIDATION_FAILED`; today and the past are accepted.
- `BR-55c` Cross-farmer access returns 404 `NOT_FOUND` (BR-36).
- `BR-55d` Soft-delete sets `deleted_at` and removes record from list and get queries.
- `BR-55e` Mutations lock the farmer row and write audit log records (BR-35).
- `BR-55f` A farm or plot that is not the caller's, or a plot that is not on the given farm, is 404 on create and update.
- `BR-55g` Cursor pagination never skips or repeats rows, including rows created within the same millisecond.

---

### BR-56 — Crop input applications are own-data, positive-quantity validated, and track nutrient contribution
| | |
|---|---|
| **Source** | Owner brief 2026-10-08; mobile `AddInputAppliedScreen.tsx`, `CropInputsAppliedScreen.tsx`, `CropNPKContributionScreen.tsx`; table `crop_inputs` (`db/migrations/0035_crop_inputs.sql`); module `apps/api/src/modules/crop-inputs/` |
| **Status** | DERIVED |
| **Layer** | Server-side, `apps/api/src/modules/crop-inputs/`; `crop_inputs` table |
| **Scope** | Track 1 (farmer-facing CRUD) |

**Rule.** A farmer records and tracks agricultural inputs (fertilizer, manure, bio-inputs, pesticides) applied to specific crops under `/farmers/me/crops/:farmCropId/inputs`.
1. **Positive quantity:** `quantity` must be greater than 0 (`BR-56a`), and `quantity` and `costInr` above 99,999,999.99 are 422 at the schema, never a 500 from the database.
2. **Application date validation:** `appliedOn` must be a real calendar date and cannot be in the future relative to today in Asia/Kolkata (`BR-56b`).
3. **Nutrient range validation:** `nitrogenPct`, `phosphorusPct`, and `potassiumPct` (NPK), if provided, must each be between 0 and 100 inclusive, and N+P+K must not exceed 100 (`BR-56c`).
4. **Own data only:** Authenticated farmer can only list, view, create, update, or delete inputs for crops they own. Attempting to access inputs of another farmer's crop returns 404 (BR-36, `BR-56d`).
5. **Soft delete:** Deleting a crop input sets `deleted_at = now()`. Soft-deleted inputs are excluded from lists, gets, and NPK calculations (`BR-56e`).
6. **Nutrient contribution calculation:** `GET /farmers/me/crops/:farmCropId/npk-contribution` computes cumulative N, P, and K nutrient mass (in kg) applied to that crop across all active inputs (`BR-56f`). The cost is a decimal string with at most 2 decimals (never a JSON number) and `totalCostInr` is an exact 2dp sum computed in integer paise. The unit-to-kg conversions (BAG = 50, ML and GRAM = 0.001, LITRE = 1, OTHER = 1, TONNE = 1000) are UNAPPROVED DEFAULTS pending an owner decision.
7. **Audit logging & Row locking:** Creating, updating, or deleting a crop input locks the farmer row and writes an append-only `audit_log` row (BR-35, `BR-56g`).

**Failure mode if unenforced.** Negative or zero quantities corrupt farm input expense accounting; future application dates misrepresent cultivation timelines; invalid NPK percentages corrupt nutrient balance analytics; cross-farmer access leaks agronomic practices.

**Test contract.** (`apps/api/src/modules/crop-inputs/crop-inputs.test.ts`)
- `BR-56a` Rejects `quantity <= 0`, and a quantity above the column limit, with 422 `VALIDATION_FAILED`.
- `BR-56b` Rejects `appliedOn` in the future relative to Asia/Kolkata, or a non-calendar date, with 422 `VALIDATION_FAILED`.
- `BR-56c` Rejects NPK percentages out of 0-100 range, or N+P+K above 100 (on create and update), with 422 `VALIDATION_FAILED`.
- `BR-56d` Cross-farmer access returns 404 `NOT_FOUND` on every operation (BR-36).
- `BR-56e` Soft-delete sets `deleted_at` and removes record from lists and GET endpoints.
- `BR-56f` Accurately computes cumulative NPK nutrient contribution; `totalCostInr` is summed in integer paise with no drift; a cost is a 2dp decimal string, never a JSON number.
- `BR-56g` Mutations lock farmer row and write audit logs (BR-35).

---

### BR-57 — Crop growth milestones are template-driven, strictly sequenced, and progression-tracked
| | |
|---|---|
| **Source** | Owner brief 2026-10-08; mobile `CropMilestonesScreen.tsx`; tables `farm_crop_milestones`, `crop_milestone_templates` (`db/migrations/0036_crop_milestones.sql`, `0041_crop_milestone_template_unique.sql`); module `apps/api/src/modules/crop-milestones/` |
| **Status** | DERIVED |
| **Layer** | Server-side, `apps/api/src/modules/crop-milestones/`; `farm_crop_milestones` table |
| **Scope** | Track 1 (farmer-facing CRUD) |

**Rule.** A farmer tracks phenological growth stages and milestone progress on an active crop under `/farmers/me/crops/:farmCropId/milestones`.
1. **Completion date validation (57a):** `completedOn` is rejected when it is in the future relative to today in Asia/Kolkata, regardless of status; `completedOn` and `targetDate` must be real calendar dates (2026-02-30 is 422).
2. **Template-driven auto-initialization (57b):** If a crop has no initialized milestones, accessing the endpoint auto-populates standard stages from `crop_milestone_templates`, initializing progress to 0%. Crop-specific templates win over universal ones: a crop with its own templates gets only those, and universal templates are the fallback. The database allows one universal template per `stage_code`.
3. **Valid lifecycle transitions (57c):** Milestone status moves between `PENDING`, `COMPLETED`, and `SKIPPED`. Marking `COMPLETED` records the completion date and updates overall crop progress; only `COMPLETED` counts toward progress.
4. **Own data only (57d):** Authenticated farmer can only view, initialize, or update milestones on crops they own. Attempting to access another farmer's crop returns 404 on list, initialize and update (BR-36).
5. **Audit logging & row locking (57e):** Initializing or updating a milestone locks the farmer row and writes an append-only `audit_log` row (BR-35). The auto-initialising GET takes the owner lock and writes one audit row only when rows were inserted (a repeat GET writes none). Explicit initialize answers 201 when it inserted rows and 200 otherwise (no audit row then). The audit image is masked: crop and stage codes only.

**Open items awaiting an owner decision (not stated by this rule).** (i) Whether `completedOn` should be accepted only with status `COMPLETED`, whether it must not precede the planting date, and whether it should be cleared on `COMPLETED` -> `PENDING` (the code currently does none of these; this rule is silent). (ii) The seeded template content (six universal stages at 7/30/50/75/90/105 days) is not the client's per-crop map.

**Failure mode if unenforced.** Future completion dates invalidate agronomic reporting; missing milestones leave crop progress unquantified; cross-farmer access leaks confidential crop monitoring data.

**Test contract.** (`apps/api/src/modules/crop-milestones/crop-milestones.test.ts`)
- `BR-57a` Rejects `completedOn` in the future relative to Asia/Kolkata, and non-calendar `completedOn` / `targetDate`, with 422 `VALIDATION_FAILED`.
- `BR-57b` Auto-initializes milestones from templates with 0% progress on first list; crop-specific templates win over universal ones; one universal template per `stage_code` (database).
- `BR-57c` Marking milestone as `COMPLETED` updates progress percentage and completion date; moves between `PENDING`, `COMPLETED` and `SKIPPED`, only `COMPLETED` counts toward progress.
- `BR-57d` Cross-farmer access returns 404 `NOT_FOUND` on list, initialize and update (BR-36).
- `BR-57e` Mutations lock farmer row and write audit log records (BR-35); the auto-initialising GET writes one masked audit row when it inserts and none on a repeat; explicit initialize reports created (201) only when rows were inserted.

---

### BR-58 — Tohfa Calendar aggregates multi-domain schedules and platform notices within bounded date ranges
| | |
|---|---|
| **Source** | Owner brief 2026-10-08; mobile `TohfaCalendarScreen.tsx`; table `platform_events` (`db/migrations/0037_platform_events.sql`), range cap config (`db/migrations/0040_calendar_range_config.sql`); module `apps/api/src/modules/calendar/` |
| **Status** | DERIVED |
| **Layer** | Server-side, `apps/api/src/modules/calendar/`; `platform_events` table |
| **Scope** | Track 1 (farmer-facing read aggregator + admin platform events) |

**Rule.** A farmer accesses a consolidated calendar of scheduled events, compliance expiries, and agricultural activities via `GET /farmers/me/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD`.
1. **Bounded date range:** `from` and `to` query parameters are required, real calendar dates (`YYYY-MM-DD`), with `from <= to`, and the span cannot exceed `system_config.calendar_max_range_days` (seeded 366, read at request time). The 422 names `query.to` (`BR-58a`). Platform-event `eventDate` is a real calendar date too (`BR-58h`).
2. **Multi-domain aggregation:** Consolidates scheduled audits (from `audits`), certificate expiries (from `certifications`), expected crop harvests (from `farm_crops`), and published platform notices (from `platform_events`) into a unified chronological timeline (`BR-58b`). A certificate of type `OTHER` is titled with its custom type name. Audit days are Asia/Kolkata calendar days (`BR-58f`).
3. **Own data & Target audience scoping:** Farmer receives operational records belonging exclusively to their own farmer profile (BR-36), and platform events targeted to `ALL` or `FARMER`. Other farmers' rows, `CUSTOMER`-audience events, unpublished events and deleted events never appear (`BR-58c`).
4. **Platform event lifecycle:** Admins manage platform events (workshops, trainings, community meets) with audit logging on all mutations (BR-35) and soft deletion (`deleted_at = now()`) (`BR-58d`, `BR-58e`). Event times are `HH:MM` (24h) and the end must be later than the start, including when an update moves only one of them (`BR-58h`). `GET /admin/platform-events` is paged (default page 1, 20 per page, max 100) and reports the total of live rows (`BR-58i`).

**Open owner items.** Events carry no `source` field (the client cannot tell an audit from a certificate expiry except by type), and the English titles ("Farm Audit (Q.. FY ..)", "Certificate Expiry: ..", "Expected Harvest: ..") are built in the service rather than the i18n catalogue.

**Failure mode if unenforced.** Unbounded queries cause heavy multi-table scans; cross-farmer leak reveals scheduled compliance audit dates and crop harvest timelines.

**Test contract.** (`apps/api/src/modules/calendar/calendar.test.ts`)
- `BR-58a` Rejects `from > to`, impossible or non-ISO dates, and a span over `calendar_max_range_days` (default 366; boundary follows `system_config`) with 422 `VALIDATION_FAILED` on `query.to`.
- `BR-58b` Aggregates multi-domain events chronologically; a type `OTHER` certificate carries its custom type name.
- `BR-58c` Strictly scopes farmer calendar events to caller farmer profile (BR-36); `CUSTOMER`-audience, unpublished and deleted platform events never reach the farmer calendar.
- `BR-58d` Non-farmer roles cannot access farmer calendar (403 FORBIDDEN).
- `BR-58e` Admin platform event mutations write audit logs and soft delete (BR-35).
- `BR-58f` Audit days are Asia/Kolkata calendar days (20:00 UTC on the 9th is the 10th).
- `BR-58h` Platform event dates are real calendar dates; times are `HH:MM` 24h with end later than start, also when an update moves only `endTime`.
- `BR-58i` `GET /admin/platform-events` is paged (default 1/20, max 100), in a stable order, and reports the total of live rows.

---

### BR-59 — Learning Hub delivers curated agricultural knowledge and lightweight community participation
| | |
|---|---|
| **Source** | Owner brief 2026-10-08; mobile `LearningHubScreen.tsx`, `ContentDetailScreen.tsx`, `GroupsScreen.tsx`, `GroupDetailScreen.tsx`; tables `learning_*` (`db/migrations/0038_learning_hub.sql`); module `apps/api/src/modules/learning-hub/` |
| **Status** | DERIVED |
| **Layer** | Server-side, `apps/api/src/modules/learning-hub/`; `learning_*` tables |
| **Scope** | Track 1 (farmer-facing read + enroll/membership, admin content CRUD) |

**Rule.** A farmer browses published articles, videos, training workshops, and community groups. Farmers can enroll/unenroll in trainings and join/leave community groups.
1. **Public/Farmer Content Browsing:** Published articles, videos, and trainings are accessible to all authenticated farmers with optional language filter (`en` / `ta`) and pagination (`BR-59a`). The article list returns the snippet, never the full content (`BR-59f`). Unpublished articles and trainings are invisible to farmers: 404 on a direct read or enrolment, absent from lists (`BR-59k`, `BR-59b`).
2. **Training Capacity & Enrollment:** Farmers can enroll in published training sessions. If training has a capacity limit, enrollments cannot exceed capacity (409 `TRAINING_FULL`), including under concurrent enrolments for the last seat: exactly one succeeds, the other is 409, never 500 (`BR-59g`). Farmers can cancel their enrollment (`BR-59b`). An admin cannot lower the capacity below the enrolled count: 409 `CONFLICT` (equal is allowed) (`BR-59h`).
3. **Community Group Membership:** Farmers can join and leave community groups. Duplicate membership requests are idempotent (`BR-59c`). Replayed enrol, join, unenrol and leave are idempotent: they return the existing state and are not audited again (`BR-59i`). No in-app chat or messaging in v1.
4. **Admin Content Management:** Only authorized administrators (`SUPER_ADMIN`, `TOHFA_ADMIN`, via `learning.admin.manage`) can create, update, or remove articles, videos, trainings, and community groups, with full audit logging (BR-35) (`BR-59d`). Authorization of the admin routes is covered by `apps/api/src/rbac/rbac.test.ts`.
5. **Participation is farmer-only:** A non-farmer actor cannot enrol in a training or join a group (403) (`BR-59e`).
6. **Request validation:** `videoUrl` must be `https`, `trainingDate` a real calendar date, and free-text fields are length-bounded; violations are 422 (`BR-59j`).

**Open owner items.** Admin deletes are hard deletes; enrolment in a training whose date has passed is not refused; there are no admin read endpoints for learning content.

**Failure mode if unenforced.** Overbooking beyond field workshop capacity; unauthenticated or cross-tenant modification of educational materials.

**Test contract.** (`apps/api/src/modules/learning-hub/learning-hub.test.ts`)
- `BR-59a` Allows farmers to view published articles, videos, trainings, and groups with language filtering.
- `BR-59b` Enforces training capacity limits and handles enrollment/unenrollment; enrolling in an unpublished or unknown training is 404.
- `BR-59c` Allows joining and leaving community groups.
- `BR-59d` Admin content mutations write audit logs (admin-route RBAC is covered by `rbac.test.ts`).
- `BR-59e` A non-farmer actor cannot enrol in trainings or join groups (403).
- `BR-59f` The article list returns the snippet and never the full content.
- `BR-59g` Two farmers racing for the last seat: exactly one 200, the other 409 `TRAINING_FULL`, never a 500.
- `BR-59h` Lowering capacity below the enrolled count is 409 `CONFLICT`; equal is allowed.
- `BR-59i` Replayed enrol, join, unenrol and leave return the existing state and write no extra audit row (also on a FULL training).
- `BR-59j` Non-https `videoUrl`, non-calendar `trainingDate` and over-long free text are 422 on create and update.
- `BR-59k` Unpublished articles and trainings are invisible to farmers (404 / absent) through the real SQL.

---

### BR-60 — Support tickets enforce strictly scoped lifecycles, immutable message threads, and state transition integrity
| | |
|---|---|
| **Source** | Owner brief 2026-10-08; mobile `AboutSupportScreen.tsx`; tables `farmer_support_tickets`, `support_ticket_messages`, `support_ticket_status_history` (`db/migrations/0039_support_tickets.sql`; the original `support_tickets` table from `0008_platform.sql` remains for customer order issues and is untouched); module `apps/api/src/modules/support-tickets/` |
| **Status** | DERIVED |
| **Layer** | Server-side, `apps/api/src/modules/support-tickets/`; `farmer_support_tickets`, `support_ticket_messages`, `support_ticket_status_history` (`0039_support_tickets.sql`); `farmer.support_ticket.manage_own` (FARMER = own), `support.ticket.manage_any` (SUPER_ADMIN, TOHFA_ADMIN = all) |
| **Scope** | Track 1 (farmer-facing tickets + admin triage & lifecycle) |

**Rule.** Farmers raise support inquiries categorized under generic account, payment, listing, or app topics.
1. **Creation & Scoping:** A farmer creates support tickets scoped exclusively to their own farmer profile (BR-36). Cross-farmer access returns 404 `NOT_FOUND` (`BR-60a`).
2. **Lifecycle & State Machine:** The transition matrix AS SHIPPED (`LEGAL_TRANSITIONS` in `support-tickets.service.ts`) is `OPEN` -> `IN_PROGRESS`, `CLOSED`; `IN_PROGRESS` -> `RESOLVED`, `CLOSED`, `OPEN`; `RESOLVED` -> `CLOSED`, `IN_PROGRESS`; `CLOSED` -> nothing. Any other transition, including one to the ticket's current status, rejects with 409 `INVALID_STATE_TRANSITION` (`BR-60b`). This matrix allows `OPEN` -> `CLOSED`, `IN_PROGRESS` -> `OPEN` and `RESOLVED` -> `IN_PROGRESS`, which differs from the original brief (`OPEN` -> `IN_PROGRESS` -> `RESOLVED` -> `CLOSED`) and awaits an owner decision. Creation is recorded in `support_ticket_status_history` as NULL -> `OPEN`; `resolved_at` is stamped on entering `RESOLVED`, cleared on leaving it, and kept when a `RESOLVED` ticket is closed.
3. **Closing Tickets:** A farmer may close their own ticket from any non-closed state. Once `CLOSED`, a ticket is in a terminal state and cannot transition further; two parallel closes are serialised (one 200, one 409, never 500) (`BR-60c`).
4. **Append-Only Messages:** Messages posted to tickets are append-only (`app_make_append_only`), as is the status history. No messages may be posted to a `CLOSED` ticket (409 `INVALID_STATE_TRANSITION`), including a message that was waiting on the row lock while the ticket closed. A new message bumps the ticket's `updated_at` (`BR-60d`).
5. **Admin Management & Audit:** Administrators (`SUPER_ADMIN`, `TOHFA_ADMIN`) list, assign, reply to, and change status on any ticket with full audit logging (BR-35) (`BR-60e`). An assignee must be an active admin holding `support.ticket.manage_any` (else 422); assignment on a `CLOSED` ticket is 409 and on a missing ticket 404 (`BR-60h`).
6. **Triage fields (60f):** A farmer cannot set `priority`; the farmer create body is strict, so extra fields are 422, and a created ticket is `NORMAL`.
7. **Staff anonymity (60g):** The farmer view hides staff identity: message senders appear only as `SUPPORT` or `FARMER`, and no assignee id or sender user id is returned. Admin responses keep the full fields.
8. **Audit content (60i):** Audit images hold ids, statuses and lengths, never ticket or message text.
9. **Free-text limits (60j):** Description, message, reason and category code have maximum lengths; over-length input is 422.

**Open owner items.** `attachmentUrl` is a free string (it should reference an upload from the upload service); whether a farmer may reply on a `RESOLVED` ticket; the older permissions `support.ticket.create_own`, `support.ticket.view_all` and `support.ticket.respond` are unused by this module.

**Failure mode if unenforced.** Leaked support tickets expose farmer financial/compliance disputes; illegal status mutations allow ghost replies on closed cases; message modifications falsify support dispute audit trails.

**Test contract.** (`apps/api/src/modules/support-tickets/support-tickets.test.ts`)
- `BR-60` (database-gated) Migration 0039 created the farmer ticket tables, sequence and triggers and left the 0008 `support_tickets` table alone.
- `BR-60a` Scopes farmer tickets to own profile; returns 404 for cross-farmer ticket access.
- `BR-60b` Enforces the ticket lifecycle state machine as shipped and rejects illegal transitions, including a transition to the current status (and `CLOSED` -> `CLOSED`), with 409 INVALID_STATE_TRANSITION and no history row; creation is history NULL -> `OPEN`; `resolved_at` is cleared on leaving `RESOLVED` and kept on closing.
- `BR-60c` Permits farmers to close their own tickets; prevents mutations once closed; parallel closes are serialised.
- `BR-60d` Enforces append-only message thread and status history, blocks replies on closed tickets (also when racing a close), and a message bumps `updated_at` for farmer and admin replies, with a stable thread order.
- `BR-60e` Admin mutations record audit log entries and track status history.
- `BR-60f` A farmer cannot set triage priority at creation (strict body, 422); a created ticket is `NORMAL`.
- `BR-60g` Farmer responses hide staff identity (`SUPPORT` / `FARMER` sender labels, no assignee or sender ids); admin responses keep the full fields.
- `BR-60h` Assignee must be an active admin holding `support.ticket.manage_any` (farmer, disabled admin, unknown id: 422); a closed ticket is 409 and a missing ticket 404, without touching the ticket.
- `BR-60i` Audit rows carry ids, statuses and lengths, never ticket or message text.
- `BR-60j` Maximum lengths on description, message, reason and category code (422).

---

### BR-61 — A return can only be approved after inspection, and refunded at most once
| | |
|---|---|
| **Source** | Requirements v1.0 §6.3 `Process returns (RMA)`; Role & Feature Matrix §6 (approve refund, wallet refund, bank refund split); Module 10 "Returns & Issues" prototype (Return Requests, RMA Detail, Inspect Returned Product, Approve/Reject, Refund Status, Return History) |
| **Status** | DERIVED |
| **Layer** | Server-side state machine on `return_requests.status`; `rma.refund.approve` / `rma.refund.wallet_process` / `rma.refund.bank_process` in `docs/rbac.json` gate the transitions; the refund endpoints additionally require an `Idempotency-Key` header (root CLAUDE.md §2.4) |
| **Scope** | Track 1 |

**Rule.** A return request moves through a fixed lifecycle: `PENDING` (filed against one or more `order_items`) → `INSPECTED` (condition, accepted and damaged quantity recorded per item) → `APPROVED` (which also marks the returned `order_items` as `RETURNED`) → exactly one of `REFUNDED` (instant wallet credit via `wallet.move`, `type: 'ORDER_REFUND'`) or `REFUND_PENDING_BANK` (a manual 2-4 day hand-off to SA/TA — `rma.refund.bank_process` grants `none` to MAIN_WH_ADMIN/SUB_WH_ADMIN, per the codebase default recorded for open contradiction #7 "Bank refunds for MW/SW" below; status there is still `requires client confirmation`, so this is the implemented default, not a closed question). A return may be `REJECTED` from `PENDING` or `INSPECTED` instead. `POST .../approve` requires the current status to be exactly `INSPECTED`; both refund endpoints require it to be exactly `APPROVED`. Once a return leaves `APPROVED` there is no path back into it, so "refunded at most once" holds by construction rather than by a flag. Replaying a refund call with the same `Idempotency-Key` (or a different one, after a client retry) must return the same result, never a second wallet credit.

**Failure mode if unenforced.** A return approved without inspection pays out on a claim nobody verified; a refund endpoint callable twice (or callable on a `PENDING`/`REJECTED` return) double-credits the customer's wallet or creates two conflicting manual bank-refund records for one return.

**Test contract.**
- `BR-61a` `POST .../approve` on a return that is not `INSPECTED` → 409, `code: INVALID_STATE_TRANSITION`.
- `BR-61b` `POST .../refund/wallet` on a return that is not `APPROVED` → 409, `code: INVALID_STATE_TRANSITION`; no `wallet_transactions` row is written.
- `BR-61c` `POST .../refund/bank` on a return that is not `APPROVED` → 409, `code: INVALID_STATE_TRANSITION`.
- `BR-61d` An `APPROVED` return refunded via wallet moves to `REFUNDED` and credits the wallet exactly once; replaying the call — with the same or a different `Idempotency-Key` — returns the same wallet transaction id and does not credit a second time.
- `BR-61e` A return already `REFUNDED` (or routed to `REFUND_PENDING_BANK`) cannot also be refunded through the other channel.

---

### BR-62 — A warehouse expense is recorded once, for the caller's own warehouse, and audited
| | |
|---|---|
| **Source** | Derived rule (not client-signed): Module 11 Warehouse Finance backend slice, design prototype; tables and seed `db/migrations/0047_expense_finance.sql`; module `apps/api/src/modules/finance/`; `docs/openapi.yaml` expense endpoints |
| **Status** | DERIVED |
| **Layer** | Server-side, `apps/api/src/modules/finance/` (service + repo, one transaction); `finance.expense.log` in `docs/rbac.json`; warehouse predicate from `apps/api/src/rbac/warehouseScope.ts`; `POST` requires an `Idempotency-Key` header (root CLAUDE.md §2.4) |
| **Scope** | Track 1 |

**Rule.** A warehouse expense is recorded with status `RECORDED`, by the caller, for the caller's own warehouse.
1. **Warehouse:** A Sub Warehouse Admin may not record for another warehouse (404, BR-30). An actor not assigned to a warehouse must name an existing active one (422).
2. **Idempotency:** `POST` requires an `Idempotency-Key`. A replay of the same request returns the original row (200) with no second row and no second audit row. The same key with a different request or a different actor is 409 `IDEMPOTENCY_KEY_REUSED`.
3. **Fields:** The category must be an active `expense_categories` row. The amount is a `Money` string greater than 0 and at most `numeric(12,2)`. The date is a real calendar date.
4. **Audit:** Each recording writes one `finance.expense.log` audit row in the same transaction, with a masked image (no vendor or description text; BR-35).
5. **No workflow:** There is no approval, rejection, edit, cancel or delete workflow for expenses, and no category management (the categories are seeded and read-only), because no permission code exists for one. This is an owner decision (2026-10-11: "expenses and approval: follow the rules exactly as they are"): the only expense permission is `finance.expense.log`. An expense recorded through the API is always `RECORDED`; `APPROVED` and `REJECTED` remain only as legacy values of the original status CHECK, which no endpoint can produce. Adding a workflow is a specification gap, not an inline decision.

**Failure mode if unenforced.** A Sub Warehouse Admin books spend against another warehouse's books; a client retry double-records an expense; an unaudited or free-text-laden audit row leaks vendor detail and breaks the money trail.

**Test contract.** (`apps/api/src/modules/finance/finance.test.ts`; one id, `BR-62a`, is used for every recording case, both mocked-repo and database/HTTP-gated)
- `BR-62a` Own-warehouse recording, 404 for a foreign warehouse (Sub), 422 for an unassigned actor naming no or an unknown warehouse, missing `Idempotency-Key` 422, replay returns the original (200) with no second row or audit row, key reuse with a different body or actor 409, unknown or inactive category 422, `Money` and calendar-date validation (including the `numeric(12,2)` bound), one masked `finance.expense.log` audit row written on the same transaction executor, and 401/403 on the route.
- `BR-62` (no letter; `apps/api/src/modules/finance/expense-voucher.test.ts`) No workflow: through the real router, `POST /admin/expenses/{id}/approve`, `/reject`, `/cancel`, `POST /admin/expense-categories`, `PATCH /admin/expense-categories/{id}` and `GET /admin/expense-categories/manage` answer the router's 404 "No route matches" for Main Warehouse Admin and Super Admin and change nothing; the list status filter refuses `CANCELLED`; the database has no decision columns and its status CHECK refuses `CANCELLED`.

---

### BR-63 — Finance reads are warehouse-scoped, and revenue is derived from completed paid orders
| | |
|---|---|
| **Source** | Derived rule (not client-signed): Module 11 Warehouse Finance backend slice, design prototype; `db/migrations/0047_expense_finance.sql` (`finance_report_max_range_days`); module `apps/api/src/modules/finance/`; BR-30 |
| **Status** | DERIVED (the revenue definition is an UNCONFIRMED owner default, listed in Open contradictions; the Main Warehouse Admin scope was confirmed by the owner 2026-10-11) |
| **Layer** | Server-side, `apps/api/src/modules/finance/` (every read filtered in SQL by the caller's warehouse scope from `apps/api/src/rbac/warehouseScope.ts`); `system_config.finance_report_max_range_days` |
| **Scope** | Track 1 |

**Rule.** Expense, revenue and report reads are limited to the caller's warehouse; an out-of-scope row is absent (by-id 404, list/filter empty), never 403.
1. **Main Warehouse Admin:** an `own` grant with no assigned warehouse sees all four warehouses (see `warehouseScope.ts`). Confirmed by the owner 2026-10-11: a Main Warehouse Admin sees all four warehouses.
2. **Revenue** is derived from `orders`, never stored: `payment_status = 'PAID'`, `status IN ('DELIVERED', 'PICKED_UP')` and `completed_at` not null. UNCONFIRMED owner default (the `order_status` enum in the database has no `COMPLETED` value).
3. **Dates:** Revenue dates use the Asia/Kolkata day of `completed_at`.
4. **Span cap:** Report spans are capped by `system_config.finance_report_max_range_days` (default 366); a wider span is 422.
5. **Raw aggregates only:** reports return sums and counts; no profit/loss, thresholds or scores.

**Failure mode if unenforced.** One warehouse's admin reads another's spend and takings (and a 403 would confirm which ids exist); unpaid or cancelled orders inflate revenue; a UTC day boundary shifts late-evening sales into the wrong day.

**Test contract.** (`apps/api/src/modules/finance/finance.test.ts`; one id, `BR-63a`, is used for every read case)
- `BR-63a` Out-of-scope expense or revenue row and unknown id are 404 for a Sub admin, lists and filters are empty; revenue is the PAID + completed-status definition; exact money sums (0.10 + 0.20 = 0.30); `from`/`to` bound `completed_at` by the Asia/Kolkata day; the report span cap is read from `system_config` (366 accepted, 367 is 422); cursor pagination; a foreign cursor is 422.

---

### BR-64 — Reports are read-only, warehouse-scoped aggregates
| | |
|---|---|
| **Source** | Derived rule (not client-signed): Reports backend slice; module `apps/api/src/modules/reports/`; BR-30 |
| **Status** | DERIVED (the Main Warehouse Admin scope, all four warehouses, was confirmed by the owner 2026-10-11, as in BR-63) |
| **Layer** | Server-side, `apps/api/src/modules/reports/` (aggregation in SQL); warehouse predicate from `apps/api/src/rbac/warehouseScope.ts`; interim gates `inventory.goods_receipt.record` (receiving report) and `wallet.cash_topup.process` (cash top-up report); `system_config.report_max_range_days` |
| **Scope** | Track 1 |

**Rule.** Reports are read-only, warehouse-scoped aggregates.
1. **Scope:** A Sub Warehouse Admin sees only its own warehouse whatever level the permission grants it, and another warehouse's `warehouseId` is 404 `NOT_FOUND`, never 403. A Main Warehouse Admin sees all four and may filter to one.
2. **Absent, not zero:** A channel, status or day with no rows is absent from the response, never a zero row.
3. **Customers:** The customers report is counts only (no name, phone, email or address).
4. **Dates:** Day buckets are Asia/Kolkata days; `from` and `to` are inclusive days. Both must be real calendar dates with `from <= to`, and the span may not exceed `system_config.report_max_range_days` (default 366 when no row), else 422.
5. **Money:** Money is an exact decimal string computed in the database; average order value is derived from the exact sum and count.
6. **Read-only:** no report writes anything.

**Failure mode if unenforced.** A Sub Warehouse Admin reads another warehouse's sales or stock; zero-filled rows hide that a channel has no data; float sums misstate takings; a customers report with contact fields leaks personal data.

**Test contract.** (`apps/api/src/modules/reports/reports.test.ts`)
- `BR-64a` A Sub admin is confined to its own warehouse (even where the permission grants `all`); another warehouse's id is 404, for every report.
- `BR-64b` A Main admin sees all warehouses and may filter to one.
- `BR-64c` A channel, status or day with no rows is absent, not a zero row; an empty range is empty lists and 0 / 0.00.
- `BR-64d` The customers report is counts only.
- `BR-64e` `from`/`to` must be real calendar dates with `from <= to`; the span cap comes from `system_config.report_max_range_days`, falling back to 366.
- `BR-64f` Day buckets are Asia/Kolkata days and the range is inclusive of the whole IST day at both ends.
- `BR-64g` Money is exact (decimal sum computed in the database, average from exact sum and count).
- `BR-64h` Reports are GET only, 401 without a token and 403 for a farmer, and running every report leaves every source table unchanged.

---

### BR-65 — A user reads and marks read only their own notifications and the system messages visible to them
| | |
|---|---|
| **Source** | Derived rule (not client-signed): notifications and system-message read backend slice; `db/migrations/0048_announcement_reads.sql`; modules `apps/api/src/modules/notifications/` and `apps/api/src/modules/system-messages/` |
| **Status** | DERIVED (the Main Warehouse Admin visibility, every warehouse, was confirmed by the owner 2026-10-11) |
| **Layer** | Server-side, `apps/api/src/modules/notifications/` and `apps/api/src/modules/system-messages/`; the owner id and role codes come from the access token, never the request; interim permission codes `notification.own.view` / `notification.own.mark_read` (no dedicated system-message codes exist); `announcement_reads` (`0048_announcement_reads.sql`) |
| **Scope** | Track 1 |

**Rule.** A user reads and marks read only their own notifications and only the system messages visible to them.
1. **Notifications:** A notification is readable and markable only by its owner; another user's id, a non-in-app row or an unknown id is 404 `NOT_FOUND`. `POST /notifications/read-all` marks only the caller's unread in-app notifications read in one statement and is idempotent (a replay returns `updated: 0` and moves no read time).
2. **System-message visibility:** A system message (announcement) is visible when it is not deleted, `starts_at <= now()` and `ends_at` is null or in the future, and its scope matches the caller: `SYSTEM_WIDE` always; `WAREHOUSE` when `warehouse_id` is one of the caller's assigned warehouses, or any warehouse when the caller has none (Main Warehouse Admin; confirmed by the owner 2026-10-11: a Main Warehouse Admin sees all four warehouses), never for farmers or customers; `ROLE` when `role_id` is a role the caller holds; `ZONE` is never shown.
3. **Invisible means 404:** Anything not visible is 404 on get and on mark-read, and mark-read writes nothing.
4. **Read state:** Read state is per user (`announcement_reads`); marking read is idempotent and keeps the first `readAt`. Neither action writes an audit row.
5. **List:** Ordered `starts_at DESC, id DESC` with a microsecond-exact cursor; limit default 20, max 100.

**Failure mode if unenforced.** One user reads or clears another's notifications; a warehouse announcement reaches farmers, customers or another warehouse's staff; an expired or deleted notice stays visible; one admin's read hides the message from everyone else.

**Test contract.** (`apps/api/src/modules/notifications/notifications.read.test.ts` and `notifications.test.ts` for the notification half; `apps/api/src/modules/system-messages/system-messages.test.ts` for the system-message half)
- `BR-65a` A notification read is the caller's own in-app row only; another user's id, a PUSH row and an unknown id are 404; 401 without a token (notifications).
- `BR-65b` `read-all` marks only the caller's unread in-app rows read, is idempotent (replay reports 0 and moves no read time), and is not captured by the `/:id` routes (notifications).
- `BR-65c` System-message visibility by scope: Main admin, Sub admin, farmer; list item has exactly the documented fields, with no farm or warehouse leakage.
- `BR-65d` Expired, not-yet-started, soft-deleted and out-of-scope messages are invisible: 404 on get; the id param must be a uuid.
- `BR-65e` Mark-read on an invisible message is 404 and writes nothing; read state is per user; replay keeps the first `readAt`; the status filter splits unread from read.
- `BR-65f` List ordering and cursor: default limit 20, cap 100, microsecond-apart and tied `starts_at` paginate exactly once; a forged cursor or unknown filter is 422.
- `BR-65g` List, get and mark-read without a token are 401 (system messages).

---

### BR-66 — A warehouse is readable only within the caller's warehouse scope; capacity is derived; capacity changes are permissioned and audited
| | |
|---|---|
| **Source** | Requirements v1.0 §6.2; BR-23, BR-30; module `apps/api/src/modules/warehouses/` (the warehouses module); `docs/openapi.yaml` `/warehouses` endpoints |
| **Status** | DERIVED (`warehouse.own.view` was added to `docs/rbac.json` on 2026-10-09 as a specification gap pending owner approval; who may set capacity is open contradiction 5) |
| **Layer** | Server-side, `apps/api/src/modules/warehouses/` (warehouse predicate from `apps/api/src/rbac/warehouseScope.ts`); `warehouse.own.view` (SUB_WH_ADMIN = own), `warehouse.capacity.set` in `docs/rbac.json` |
| **Scope** | Track 1 |

**Rule.** A warehouse is readable only within the caller's warehouse scope; capacity is a derived read; capacity changes are permissioned and audited.
1. **Scope:** A Sub Warehouse Admin reads only its own warehouse; any other id and any unknown id returns the same 404 `NOT_FOUND`, never 403 (`warehouse.own.view`, BR-30).
2. **Capacity is derived, read-only:** `used` = sum of `qty_available` of the warehouse's `ACTIVE` batches; `available` = capacity minus used (negative when over capacity, never clamped); `utilization` = used / capacity x 100 rounded to 2 decimals; a null capacity yields null capacity-derived fields. `used` is a derivation, not a business rule.
3. **Changing capacity** needs `warehouse.capacity.set`, writes one `warehouse.capacity.set` audit row in the same transaction with before/after images of `capacityKg` only (BR-35), and never touches inventory.

**Failure mode if unenforced.** A Sub Warehouse Admin enumerates other warehouses (a 403 would confirm which ids exist); a capacity figure stored instead of derived drifts from stock; an unaudited or unpermissioned capacity change alters quotas silently; a capacity edit that rewrites batches corrupts the ledger-derived balances.

**Test contract.** (`apps/api/src/modules/warehouses/warehouses.test.ts`)
- `BR-66a` A Sub admin reads its own warehouse and gets 404 for every other and for an unknown id, with no existence signal; Main/Super/Tohfa read all four.
- `BR-66b` Capacity is derived from `ACTIVE` batches of that warehouse only; utilization is rounded to 2 decimals; over capacity is not clamped; no batches means used 0.
- `BR-66c` Capacity changes need `warehouse.capacity.set` (Sub is 403); a bad body (missing `capacityKg`, unknown field) is 422.
- `BR-66d` One audit row on the same transaction with masked before/after images; an unknown warehouse writes no audit row.
- `BR-66e` A capacity change leaves batches and the stock ledger untouched.

---

### BR-67 — A user sees only their own live sessions, and no secrets
| | |
|---|---|
| **Source** | Derived rule (not client-signed): active-sessions backend slice; module `apps/api/src/modules/auth/`; `docs/openapi.yaml` `GET /auth/me/sessions` and `GET /auth/me` |
| **Status** | DERIVED |
| **Layer** | Server-side, `apps/api/src/modules/auth/`; the owner comes only from the access token, never the request |
| **Scope** | Track 1 |

**Rule.** A user sees only their own live sessions and no secrets.
1. **Live only:** `GET /auth/me/sessions` returns only the caller's sessions that are neither revoked nor expired, newest first, capped at 50.
2. **Allow-list:** the response holds exactly `id`, `platform`, `userAgent`, `issuedAt`, `lastSeenAt`, `lastSeenIp`, `expiresAt`, and never refresh-token hashes, token ids, device ids or push tokens. `isCurrent` is not returned because the access token carries no session id.
3. **`/auth/me`:** additionally returns `status`, `createdAt` and `lastLoginAt` (nullable); additive, existing fields unchanged.

**Failure mode if unenforced.** One user sees another's devices and IPs; a leaked refresh-token hash or device id lets an attacker replay or fingerprint a session.

**Test contract.** (`apps/api/src/modules/auth/auth.sessions.test.ts`)
- `BR-67a` Only live sessions are listed (revoked and expired are excluded); 401 without a token or with a malformed one.
- `BR-67b` Another user's sessions are never listed.
- `BR-67c` Exactly the allow-listed keys, no secrets, and no `isCurrent`.
- `BR-67d` Newest first, capped at 50.
- `BR-67e` A user with no live sessions gets an empty array, not 404.
- `BR-67f` Every role can list its own sessions.
- `BR-67g` `/auth/me` returns `status`, `createdAt` and `lastLoginAt`, with `lastLoginAt` null (not omitted) for a user who has never logged in.

### BR-68 — Farmer listing writes are idempotent (Idempotency-Key)
| | |
|---|---|
| **Source** | `docs/openapi.yaml` `IdempotencyKeyHeader` (required on these POSTs); root `CLAUDE.md` §2.4. Specification gap closed 2026-10-09: the header was declared but ignored. |
| **Status** | DERIVED |
| **Layer** | Server-side, `apps/api/src/http/idempotency.ts` over `idempotency_keys` (`0045_listing_idempotency.sql`), used by `listings.service.ts` and `counter-offers.service.ts` |
| **Scope** | Track 1 |

**Rule.** `POST /listings`, `POST /listings/{id}/withdraw` and the farmer counter-offer responses (`accept`, `reject`, `counter`) require an `Idempotency-Key`. A missing or blank key is 422 `VALIDATION_FAILED`. Replaying a key with the same request by the same user returns the original response and writes no second row, audit row or notification. The same key with a different request (different body, target or operation) is 409 `IDEMPOTENCY_KEY_REUSED`. Keys are scoped to the acting user, so two users may use the same key string. The claim is made in the same transaction as the operation, so a refused or failed attempt leaves no claim and parallel requests with one key run the operation once. Keys are retained 24 hours (the spec's figure). The admin listing operations (`approve`, `reject`, `counter-offers`) are not covered yet: their only client, admin-web, sends no key.

**Failure mode if unenforced.** A mobile retry after a dropped response creates a duplicate listing or counter round, or turns a successful withdraw/accept into a spurious 409 the farmer reads as failure.

**Test contract.** (`apps/api/src/modules/listings/listing-idempotency.test.ts`, `counter-offers.test.ts`)
- `BR-68a` Missing, empty or blank key on each of the five operations → 422 `VALIDATION_FAILED` naming `header.Idempotency-Key`; nothing is written.
- `BR-68b` A replay returns the original body with no second row, audit row or round; a replayed withdraw is not `LISTING_NOT_PENDING`.
- `BR-68c` The same key with a different body or on a different operation → 409 `IDEMPOTENCY_KEY_REUSED`; nothing more is written.
- `BR-68d` Five parallel requests with one key run the operation exactly once and all return its result.
- `BR-68e` Different users using the same key string do not collide.
- `BR-68f` A refused attempt is not remembered; the key works once the cause is fixed.
- `BR-68g` A key older than 24 hours is released for a new request.

---

### BR-69 — Registration step bodies are validated; no farmer is created without a farm
| | |
|---|---|
| **Source** | Derived rule (not client-signed): QA review fixes, October 2026 |
| **Status** | DERIVED |
| **Layer** | Server-side, `apps/api/src/modules/farmer-applications/` (`farmer-applications.schema.ts`, `farmer-applications.routes.ts`, `farmer-applications.service.ts`) |
| **Scope** | Track 1 |

**Rule.** `PATCH /farmers/applications/{id}/steps/{step}` validates the body against that step's strict schema before anything is saved. Unknown keys, a malformed `dob` or `aadhaarLast4` (exactly 4 digits; the value is never echoed), a location without `id`, `label` or `areaAcres`, out-of-range coordinates, an unclosed polygon ring, and an empty `locations` list are all 422 `VALIDATION_FAILED`. Partial drafts are allowed: fields present are checked, absent fields are left alone. A full Aadhaar number is accepted but dropped before storage (BR-33b). `POST .../submit` re-validates the stored step-3 data and refuses with 422, naming the step, unless at least one farm location carries a boundary or a GPS position (and the mandatory `ID_PROOF` and `FARM_DOC` documents exist). `POST /admin/farmer-applications/{id}/approve` refuses with 422 and writes nothing if the application has zero farm locations.

**Open note.** The "boundary or GPS position at submit" reading is the implementer's interpretation of the spec's "GPS/FMB boundary — GPS capture with manual lat/lng fallback" (contradiction 17). Whether `aadhaarLast4` and `dob` are required at submit is a product decision not yet made.

**Failure mode if unenforced.** A step save wipes a good boundary, an incomplete application reaches review, or an admin approves a VERIFIED farmer with no land.

**Test contract.** (`apps/api/src/modules/farmer-applications/registration-validation.test.ts`)
- `BR-69a` Step 3 `{"locations":[]}` is 422 and the earlier boundary survives.
- `BR-69b` Submit with no located farm location is 422 naming step 3 and the application stays a draft.
- `BR-69c` Approving with zero locations is 422 and writes no user, farmer, farm, status change or audit row.
- `BR-69d` The mobile app's real payloads (`DD / MM / YYYY` dob, Title-case gender, `{documents: []}`) are accepted.
- `BR-69e` A bad `aadhaarLast4` or `dob` is 422 and the value is not echoed.
- `BR-69f` Unknown keys are 422 on every step.
- `BR-69g` Bad coordinates, an unclosed ring, or a missing `id` / `label` / `areaAcres` are 422.

---

### BR-70 — A payout's bank account must be an active destination of the farmer being paid
| | |
|---|---|
| **Source** | Derived rule (not client-signed): QA review fixes, October 2026 |
| **Status** | DERIVED |
| **Layer** | Server-side, `apps/api/src/modules/payouts/` (`payouts.service.ts`, `payouts.repo.ts`); `farmer_bank_accounts`; `apps/api/src/http/idempotency.ts` for the key claim (`idempotency_keys`, `0045_listing_idempotency.sql`) |
| **Scope** | Track 1 |

**Rule.** When `bankAccountId` is supplied to `POST /admin/payouts` it must reference a row of `farmer_bank_accounts` (bank account or UPI destination) whose `farmer_id` is the payout's farmer and whose `deleted_at` is null. Otherwise the response is 404 `NOT_FOUND`; the body is identical whether the id does not exist, belongs to another farmer, or is soft-deleted (BR-36). Nothing is written: no payout, no audit row, no idempotency claim. The check runs inside the payout transaction after the farmer row lock, the same lock the destination delete path takes, so a destination cannot be deleted between the check and the insert.

**Open note.** BR-53 item 1 says an account with a null `account_number_token` is display-only and cannot be a payout destination. Taken literally no account could be attached to a payout, which contradicts BR-53 item 4. Tokenisation is an open owner decision, so this check is not enforced (contradiction 16).

**Failure mode if unenforced.** One farmer's money is sent to another farmer's account.

**Test contract.** (`apps/api/src/modules/payouts/payout-bank-account.test.ts`)
- `BR-70a` Another farmer's account is 404 and writes nothing.
- `BR-70b` The farmer's own account is accepted.
- `BR-70c` The farmer's own deleted account is 404.
- `BR-70d` The 404 bodies are identical (nonexistent, another farmer's, deleted).
- `BR-70e` A refusal does not consume the idempotency key.
- `BR-70f` A payout waits for a concurrent destination delete and then refuses.

---

### BR-71 — Listing numbers are unique under concurrency and never reused
| | |
|---|---|
| **Source** | Derived rule (not client-signed): QA review fixes, October 2026 |
| **Status** | DERIVED |
| **Layer** | Server-side, `apps/api/src/modules/listings/listings.repo.ts` (`generateListingNumber`), inside the creating transaction |
| **Scope** | Track 1 |

**Rule.** A listing number is `LST-<calendar year>-<zero-padded sequence>` (year as the generator already computes it). The next number is one more than the highest existing numeric suffix for that year, chosen inside the creating transaction under a transaction-scoped advisory lock, so concurrent creates by any farmers get distinct numbers and never fail on the `listing_number` unique constraint. A gap is never refilled.

**Failure mode if unenforced.** Two simultaneous creates pick the same number and one farmer gets a 500 on a valid request.

**Test contract.** (`apps/api/src/modules/listings/listing-number.test.ts`)
- `BR-71a` 20 parallel creates by 20 farmers all succeed with distinct numbers in the existing format.
- `BR-71b` The number follows the highest suffix of the year, and other years do not move it.

---

### BR-72 — Payout creation and approval are replay-safe, and payout numbers are unique under concurrency
| | |
|---|---|
| **Source** | Derived rule (not client-signed): QA review fixes, October 2026 |
| **Status** | DERIVED |
| **Layer** | Server-side, `apps/api/src/modules/payouts/` (`payouts.routes.ts`, `payouts.service.ts`, `payouts.repo.ts`); `apps/api/src/http/idempotency.ts` over `idempotency_keys` (`0045_listing_idempotency.sql`) |
| **Scope** | Track 1 |

**Rule.** `POST /admin/payouts` and `POST /admin/payouts/{id}/approve` require an `Idempotency-Key`; missing or blank is 422 `VALIDATION_FAILED`; any non-blank value up to 255 characters is accepted. The key is claimed in `idempotency_keys` in the same transaction as the payout or approval, scoped to the acting admin and retained 24 hours. A replay with the same request by the same admin returns the original response and writes no second payout, approval, audit row or notification. The same key with a different request is 409 `IDEMPOTENCY_KEY_REUSED`. Concurrent requests with one key execute once. A refused attempt leaves no claim. Approval takes a row lock on the payout, so two approvers cannot both release it; the loser is 409 `INVALID_STATE_TRANSITION`. A payout number is `PO-<year>-<six-digit sequence>`, chosen inside the creating transaction under a transaction-scoped advisory lock as the highest existing suffix of that year plus one.

**Failure mode if unenforced.** A retry or double click pays the farmer twice; two approvers both release the same dual-approval payout; two simultaneous payouts pick the same number and one gets a 500.

**Test contract.** (`apps/api/src/modules/payouts/payout-idempotency.test.ts`)
- `BR-72a` A missing, blank or over-long key is 422 and creates nothing.
- `BR-72b` A replay returns the original body with one payout, one audit row and one event.
- `BR-72c` A changed request under the same key is 409.
- `BR-72d` Parallel same-key requests create one payout.
- `BR-72e` Keys are per admin.
- `BR-72f` A refused attempt leaves no claim.
- `BR-72g` A key older than 24 hours is released.
- `BR-72h` Approve requires the key and replays to the original 200 with one approval.
- `BR-72i` Racing approvers: one succeeds, one gets 409, and a held payout row lock makes approve wait.
- `BR-72j` 20 parallel payouts all succeed with distinct numbers in the existing format.
- `BR-72k` The number follows the highest suffix of the year and other years do not move it.

---

BR-73 — withdrawn 2026-10-11: expense approval, cancellation and category management are not defined by the rules; the owner decided to follow the rules as written (BR-62).

---

### BR-74 — A daily cash close is computed from the ledger, stored once, and never changed
| | |
|---|---|
| **Source** | Derived rule (not client-signed): Sub Warehouse backend, modules 11-16 completion, October 2026 |
| **Status** | DERIVED |
| **Layer** | Server-side, `apps/api/src/modules/finance/` (cash-close routes, service, repo); `cash_closes` (`0050_cash_closes.sql`, append-only through `app_make_append_only`); `apps/api/src/http/idempotency.ts` |
| **Scope** | Track 1 |

**Rule.** For one warehouse and one Asia/Kolkata day the system computes: cash sales (paid completed `CASH` orders, the BR-63 revenue definition), cash top-ups (successful `CASH` top-ups of the warehouse) and cash expenses (every `CASH` expense of that day that is not soft-deleted: expenses are only recorded, BR-62, so no status is excluded). Opening cash is the counted cash of the latest earlier close, 0 if none; expected cash is opening + sales + top-ups - expenses, in exact arithmetic. A close stores those figures with the counted cash, the difference, a note and the closer. `cash_closes` is append-only; there is one close per warehouse and day (a second is 409 `CONFLICT`, with no correction row: the stricter reading); a future day is 422; `Idempotency-Key` is required; one masked audit row is written in the same transaction (no note text). `GET` daily-summary is computed, not stored. Permission `finance.cash_close.manage` (Super Admin, TOHFA Admin and Main all, Sub own). No tolerance is judged on the difference.

**Failure mode if unenforced.** A day is closed twice, figures drift from the ledger, or notes leak through the audit log.

**Test contract.** (`apps/api/src/modules/finance/cash-close.test.ts`)
- `BR-74a` Request and response schemas (counted cash is a `Money` string, real date, bounded note, strict bodies, negative difference allowed) and the computed cash sales, top-ups and expenses for one warehouse and Kolkata day.
- `BR-74b` Opening cash is the counted cash of the latest earlier close, 0 with none; later closes and other warehouses are ignored.
- `BR-74c` A close records the system figures, counted cash, difference, note, closer and one masked audit row in the same transaction; no difference is ever refused.
- `BR-74d` A second close of the same warehouse and day with a new key is 409 `CONFLICT` and writes nothing; another day or warehouse is fine.
- `BR-74e` Replay returns the original close with no second row or audit row; a different body is 409 `IDEMPOTENCY_KEY_REUSED`; a missing key is 422.
- `BR-74f` A future day, an unknown or inactive warehouse is 422; a Main admin must name the warehouse.
- `BR-74g` A Sub admin closes only its own warehouse and gets 404 for another, for the summary and the close.
- `BR-74h` Closing an earlier day after a later one is recorded with its own opening; no ordering rule is invented.
- `BR-74i` A close can never be updated or deleted, the arithmetic is enforced by CHECKs and the day is unique at the database level.
- `BR-74j` The close list is scoped, newest first, filterable and cursor-paginated; by-id is 404 out of scope.
- `BR-74k` Every cash-close route is 401 without a token and 403 for farmer, customer and Farmer Admin.
- `BR-74l` Sub admin over HTTP: summary, close 201, replay 200, second close 409, summary then shows closed.
- `BR-74m` Main and TOHFA Admin close a named warehouse; they must name it; another Sub warehouse id in the body is 404.
- `BR-74n` Validation errors are 422 and write nothing (no key, float or negative cash, bad or future date, unknown field or warehouse).

---

### BR-75 — An expense voucher is a derived, read-only document
| | |
|---|---|
| **Source** | Derived rule (not client-signed): Sub Warehouse backend, modules 11-16 completion, October 2026 |
| **Status** | DERIVED |
| **Layer** | Server-side, `apps/api/src/modules/finance/` (voucher route, service) |
| **Scope** | Track 1 |

**Rule.** `GET /admin/expenses/{id}/voucher` returns a derived read-only payment voucher numbered `VCH-<YYYYMMDD>-<first 8 hex of the expense id>` (a stored sequential number would need a sequence, which is not invented). It carries the expense fields and the recorder's name, and no authorizer (there is no approval workflow, BR-62). It is gated by `finance.expense.log` (an interim gate named in SPEC_GAPS). An out-of-scope expense is 404. Revenue vouchers and a vouchers list are NOT built (the design does not define them).

**Failure mode if unenforced.** A voucher names an authorizer although nobody approves expenses, its number changes between two prints, or it exposes another warehouse's expense.

**Test contract.** (`apps/api/src/modules/finance/expense-voucher.test.ts`)
- `BR-75a` The number shape is `VCH-<yyyymmdd>-<8 upper-case hex>`; the voucher is derived from the expense (expense fields, recorder name), is the same on every read, and carries no authorizer or decision field, even for a row with a legacy `APPROVED` status.
- `BR-75b` Warehouse scope: another warehouse, an unknown or a deleted expense is 404; Main reads every warehouse.
- `BR-75c` Over HTTP the voucher is 401 without a token and 403 for farmer, customer and Farmer Admin; it answers 200 for the own warehouse and Main, 404 for another warehouse, and carries the derived number.

---

### BR-76 — CSV exports are the same scoped, capped read as the source report, with injection-safe cells
| | |
|---|---|
| **Source** | Derived rule (not client-signed): Sub Warehouse backend, modules 11-16 completion, October 2026 |
| **Status** | DERIVED |
| **Layer** | Server-side, `apps/api/src/modules/report-exports/`; `system_config.export_max_rows` (`0051_export_max_rows_config.sql`) |
| **Scope** | Track 1 |

**Rule.** `GET /admin/exports/<report>` (one literal path per report: `sales`, `receiving`, `inventory`, `returns`, `customers`, `cash-topups`, `expenses`, `finance-revenue`, `finance-expenses`) returns the same warehouse-scoped, range-capped read as the source report or finance endpoint, as a CSV attachment.
1. **Permission:** `report.export.file` AND the source data permission; a farmer or customer scope is 403. Main Warehouse Admin holds `view` on `report.export.file` and is allowed (UNCONFIRMED default, contradiction 26).
2. **Scope:** Sub is confined to its own warehouse; another warehouse's id is 404, and a non-existent id from Main is 404 too.
3. **Caps:** the span cap is the source report's own (`report_max_range_days` or `finance_report_max_range_days`). More data rows than `system_config.export_max_rows` (default 50000, UNCONFIRMED) is 422 and is never truncated.
4. **Cells:** a cell starting with `=`, `+`, `-`, `@`, tab or CR is quote-prefixed (injection guard); RFC 4180 quoting; money as 2-decimal strings; no customer PII (the customers export is counts only; the expenses export omits vendor, description and recorder).
5. **Audit:** one masked `report.export` audit row (report, warehouse, from, to, row count) in the request transaction; none on a refusal.
6. **Layout:** the column layout (long format with sections for aggregates) is the implementer's choice (UNCONFIRMED).

**Failure mode if unenforced.** A spreadsheet formula runs on the recipient's machine, a Sub admin downloads another warehouse's data, an export silently truncates, or customer PII leaves in a file.

**Test contract.** (`apps/api/src/modules/report-exports/report-exports.test.ts`)
- `BR-76a` Each of the nine reports returns the exact scoped figures as CSV (2-decimal money strings, Kolkata-day buckets, filters honoured); a header-only file is the header and a CRLF.
- `BR-76b` A Sub admin gets only its own warehouse in every export, and another warehouse is 404.
- `BR-76c` A Main admin may export any warehouse id or all, and a non-existent warehouse id is 404.
- `BR-76d` A cell starting with a trigger character is quote-prefixed and stays prefixed in the file; a number column is never prefixed.
- `BR-76e` RFC 4180 quoting of commas, double quotes, CR and LF, with CRLF row endings; a null cell is empty.
- `BR-76f` More rows than `export_max_rows` is 422 on `query.to` and never truncated, exactly the cap is allowed; the migration seeds 50000 and a missing row falls back to it.
- `BR-76g` The customers export carries counts only (no name, phone, e-mail, customer code or address).
- `BR-76h` One masked `report.export` audit row on the request transaction; none on a refused request.
- `BR-76i` Over HTTP: 401 without a token, 403 for farmer, customer and Farmer Admin; Main and Super Admin may export; an unknown report or a write verb is 404.
- `BR-76j` The nine report names are exactly the documented ones; per-report parameter and range validation (422, no audit row); the inventory snapshot has no range.
- `BR-76k` The file name is built only from safe characters, whatever the warehouse code holds.
- `BR-76l` A scope carrying a customer or farmer id is 403 and reads nothing.

---

### BR-77 — Tasks and alerts are derived live from existing records, inside the caller's scope
| | |
|---|---|
| **Source** | Derived rule (not client-signed): Sub Warehouse backend, modules 11-16 completion, October 2026 |
| **Status** | DERIVED |
| **Layer** | Server-side, `apps/api/src/modules/tasks-alerts/`; thresholds in `system_config` (`0052_task_alert_states.sql`) |
| **Scope** | Track 1 |

**Rule.** Tasks and alerts are never stored. `GET /admin/tasks` and `GET /admin/alerts` compute them from: returns (`PENDING` inspection, `INSPECTED` approval), goods receipts `AWAITING_QC`, orders `CONFIRMED` / `PACKED` / `READY_FOR_PICKUP`; and, for alerts, `ACTIVE` batches near expiry, low stock per warehouse + crop + grade, and capacity near full.
1. **Scope:** Sub sees its own warehouse only; an item whose condition cleared is not returned; a key out of scope, never derived or cleared is 404; a non-visible `warehouseId` filter is 404.
2. **Allow-list:** titles and messages are machine keys with params (no English in the API; no customer or farmer ids).
3. **Thresholds** come from `system_config`: `low_stock_threshold_kg`, `alert_batch_expiry_days` (7) and `alert_capacity_utilization_percent` (90). The last two are PLACEHOLDER values (UNCONFIRMED, contradiction 25). A missing or unusable threshold means that alert type is not raised.
4. **Permissions** `task.own.view` and `alert.own.view` (Super Admin, TOHFA Admin, Main all; Sub own) are spec gaps and are not checked per source.
5. **Not built:** listing and counter-offer tasks (no warehouse before a purchase order), priority, assignee and in-progress, an expense-approval alert, a goods-receipt mismatch alert, a cash top-up alert, and alert severity.

**Failure mode if unenforced.** A Sub admin sees another warehouse's work, a stale task lingers after its cause is gone, or ids and free text of customers and farmers leak into a notification-style payload.

**Test contract.** (`apps/api/src/modules/tasks-alerts/tasks-alerts.test.ts`)
- `BR-77a` A `PENDING` return is a `RETURN_INSPECTION` task and an `INSPECTED` one a `RETURN_APPROVAL` task; later states are not tasks.
- `BR-77b` A goods receipt `AWAITING_QC` is a `GOODS_RECEIPT_QC` task; once checked it is not.
- `BR-77c` An order is a pack, dispatch or pickup-OTP task by its status, with the delivery date as `dueOn`; other statuses are not tasks.
- `BR-77d` An `ACTIVE` batch with stock expiring within `alert_batch_expiry_days` (past expiry included) is a `BATCH_NEAR_EXPIRY` alert.
- `BR-77e` A warehouse + crop + grade whose active stock is below `low_stock_threshold_kg` is a `LOW_STOCK` alert.
- `BR-77f` A warehouse at or above `alert_capacity_utilization_percent` of its capacity is a `CAPACITY_NEAR_FULL` alert; no capacity, no alert.
- `BR-77g` A Sub admin sees only its own warehouse, Main sees every warehouse, and a `warehouseId` filter on another warehouse is 404.
- `BR-77h` Pagination is stable (newest first, ties by key, no skip or repeat, bad cursors 422).
- `BR-77i` The summary counts open tasks per type, leaves out tasks the caller marked done, and honours the warehouse filter.
- `BR-77j` Acting on an item that is out of scope, never derived or whose condition has cleared is 404 and writes nothing.
- `BR-77k` Responses are allow-listed machine data: no customer or farmer id, no user-facing English, keys that match the type.
- `BR-77l` Every route is 401 without a token and 403 `problem+json` for farmer, customer and Farmer Admin.

---

### BR-78 — What a user does to a task or alert is that user's own state
| | |
|---|---|
| **Source** | Derived rule (not client-signed): Sub Warehouse backend, modules 11-16 completion, October 2026 |
| **Status** | DERIVED |
| **Layer** | Server-side, `apps/api/src/modules/tasks-alerts/`; `task_alert_states` and `system_config.alert_snooze_max_hours` (`0052_task_alert_states.sql`) |
| **Scope** | Track 1 |

**Rule.** Done (task), dismiss and snooze (alert) are stored per user in `task_alert_states`: not audited, not append-only; the last action wins; state is isolated between users. A snooze `until` must be in the future and at most `system_config.alert_snooze_max_hours` (168, a PLACEHOLDER: UNCONFIRMED) ahead (422 on `body.until`). A finished snooze no longer hides the alert. When an item's condition clears, the user's state for it is deleted at their next list (a write inside a GET, limited to that user's own preference rows).

**Failure mode if unenforced.** One admin's dismissal hides an alert from a colleague, a cleared alert that returns stays dismissed forever, or a snooze hides an alert indefinitely.

**Test contract.** (`apps/api/src/modules/tasks-alerts/tasks-alerts.test.ts`)
- `BR-78a` Done hides a task from the open list and shows it in the done list; dismiss hides an alert from both lists; snooze moves it to the snoozed list with its end time; the last action wins and replays are idempotent.
- `BR-78b` A snooze that has ended no longer hides the alert.
- `BR-78c` When the condition clears the state is forgotten, per user and only for that user's own cleared items; a condition that returns starts un-dismissed.
- `BR-78d` One user's done, dismiss and snooze never touch another user's list; a task key and an alert key never share state; the user id comes from the scope.
- `BR-78e` Only the canonical item key of the right kind is accepted.
- `BR-78f` The snooze body is one ISO instant ending in the future and no later than `alert_snooze_max_hours` (168 when missing or unusable).
- `BR-78g` Dismiss, snooze and done write no `audit_log` row.

---

### BR-79 — A warehouse's storage locations are warehouse-scoped, audited, never deleted, and never touch stock
| | |
|---|---|
| **Source** | Derived rule (not client-signed): Sub Warehouse backend, modules 11-16 completion, October 2026 |
| **Status** | DERIVED |
| **Layer** | Server-side, `apps/api/src/modules/warehouse-ops/` (storage locations); `storage_locations` (`0053_storage_locations.sql`) |
| **Scope** | Track 1 |

**Rule.** A warehouse has named storage locations: a code (unique per warehouse, case-insensitively, and immutable), a name, a free-text type, an optional display-only capacity in kg, and an active flag. Reads need `inventory.batch.view` and are warehouse-scoped (another or an unknown warehouse is the same 404). Writes need `warehouse.storage_location.manage` (Super Admin, TOHFA Admin and Main all; Sub none: UNCONFIRMED). One masked audit row is written per change in the same transaction; a no-op writes nothing; there is no delete (deactivate instead). Locations never touch `inventory_batches` (the free-text `storage_location` is not linked) or the stock ledger.

**Failure mode if unenforced.** A Sub admin reads or edits another warehouse's locations, a code is reused so labels become ambiguous, or a location edit silently moves stock.

**Test contract.** (`apps/api/src/modules/warehouse-ops/storage-locations.test.ts`)
- `BR-79a` A Sub admin lists and reads its own warehouse and gets the same 404 for another and for an unknown warehouse; the list query is strict, paged and searchable.
- `BR-79b` The code is unique per warehouse, case-insensitively, and reusable in another warehouse; create body validation; a duplicate is 409; roles other than the managers are 403.
- `BR-79c` Update changes only the named fields, can clear type and capacity, never the code; deactivate and reactivate filter the list; there is no `DELETE` route.
- `BR-79d` One masked audit row per change in the same transaction, with the real changed field names and no name; it rolls back with the change.
- `BR-79e` Managing locations never touches `inventory_batches`, the stock ledger or another warehouse.
- `BR-79f` The service refuses a scope that does not cover the warehouse, even for a write.

---

### BR-80 — Warehouse profile edits are narrow and audited; performance is exact counts only
| | |
|---|---|
| **Source** | Derived rule (not client-signed): Sub Warehouse backend, modules 11-16 completion, October 2026 |
| **Status** | DERIVED |
| **Layer** | Server-side, `apps/api/src/modules/warehouse-ops/` (profile and performance); `system_config.report_max_range_days` |
| **Scope** | Track 1 |

**Rule.**
1. **Profile:** `PATCH /warehouses/{id}` edits the contact phone (E.164 or null) and operating hours only (strict body). Permission `warehouse.profile.edit` (Super Admin, TOHFA Admin and Main all; Sub none: UNCONFIRMED). `operatingHours` has one strict shape: 7 weekdays, each closed or `HH:MM` open before close, no overnight (UNCONFIRMED default). A no-op writes nothing; otherwise one masked audit row (changed field names, never the phone or hours). No warehouse create or delete exists (BR-23).
2. **Performance:** `GET /warehouses/{id}/performance?from&to` returns only exact counts and sums for the inclusive Asia/Kolkata range: orders placed, fulfilled (`PICKED_UP` or `DELIVERED`) and cancelled, goods receipts, return requests and stock-ledger movements. The span is capped by `report_max_range_days` (fallback 366). It is gated by the existing `warehouse.all.view`, as in the design (so Sub gets 403), and carries no score, rate, target or ranking.
3. **Not built:** capacity targets. Warehouse documents were built on 2026-10-12 as BR-105.

**Failure mode if unenforced.** A profile edit overwrites an immutable column or leaks a phone number through the audit log; the performance read invents a score nobody defined.

**Test contract.** (`apps/api/src/modules/warehouse-ops/warehouse-profile.test.ts`, `warehouse-performance.test.ts`)
- `BR-80a` The body takes `contactPhone` and `operatingHours`, at least one and nothing else; only those two columns change.
- `BR-80b` `operatingHours` accepts a full week of closed or open/close days and rejects a missing weekday, unknown key, malformed time, open not before close and contradictory flags.
- `BR-80c` Roles: 401 without a token, 403 for farmer, customer, Farmer Admin and Sub; Super Admin, TOHFA Admin and Main edit any warehouse; the service refuses a scope that does not cover the warehouse.
- `BR-80d` One audit row per change, masked (field names only, never the phone or hours), rolled back with the change.
- `BR-80e` A change that alters nothing writes and audits nothing; an unknown warehouse is 404 with no audit row.
- `BR-80f` Exact counts and sums for the warehouse and the inclusive IST range, single day works, an empty range is zeros and empty lists.
- `BR-80g` The response carries only counts, sums and breakdowns: no score, rate, target, ranking or SLA.
- `BR-80h` The range needs real dates with `from <= to`; the span cap is `report_max_range_days` (the limit itself allowed; 366 if missing).
- `BR-80i` Another or an unknown warehouse is the same 404; 401 without a token; 403 for farmer, customer, Farmer Admin and Sub.
- `BR-80j` Reading performance writes nothing (no audit row, no changed table) and has no write route.
- `BR-23b` There is no endpoint that creates or deletes a warehouse, for any role (asserted in `warehouse-profile.test.ts`).

---

### BR-81 — A Sub Warehouse Admin is created bound to exactly one active warehouse, within a per-warehouse cap
| | |
|---|---|
| **Source** | Derived rule (not client-signed): Sub Warehouse backend, modules 11-16 completion, October 2026 |
| **Status** | DERIVED |
| **Layer** | Server-side, `apps/api/src/modules/warehouse-ops/` (sub-admin routes, service, repo); `system_config.sub_wh_admin_max_per_warehouse`, `admin_profiles`, `user_roles` (`0054_sub_wh_admin_staffing.sql`) |
| **Scope** | Track 1 |

**Rule.** `POST /admin/sub-warehouse-admins` and `GET` (`admin.sub_wh_admin.create`: Super Admin, TOHFA Admin and Main, matching `creationRules`) create only a `SUB_WH_ADMIN` bound to exactly one existing active warehouse: a missing warehouse is 422 `WAREHOUSE_REQUIRED` (BR-25a); a warehouse outside the caller's scope is 404; a taken mobile is 409 and never echoed. The cap is `system_config.sub_wh_admin_max_per_warehouse` live admins (default 5; UNCONFIRMED reading of BR-25 "5 incl. standby", contradiction 24; disabled admins do not count; the warehouse row is locked against concurrent creates; over the cap is 409). The account is created `ACTIVE` with NO password (the admin sets one through forgot-password), with an `admin_profiles` code `SWA-001...` and a `user_roles` row. Account, profile, assignment and one masked audit row (role, warehouse, code; no name or mobile) are one transaction. The list shows live assignments only and never a mobile number. Deactivation of a Sub Warehouse Admin is NOT built (no permission defines who may).

**Failure mode if unenforced.** A Sub admin exists with no warehouse and therefore wide scope, a warehouse accumulates unlimited admins under concurrent creates, or a mobile number leaks.

**Test contract.** (`apps/api/src/modules/warehouse-ops/sub-admins.test.ts`)
- `BR-81a` The created account is `ACTIVE` with no password and signs in only after the existing forgot-password flow sets one, as `SUB_WH_ADMIN` of that warehouse only.
- `BR-81b` One account, one admin profile and one warehouse-scoped assignment with `assigned_by` = the creator; the body needs a name and an E.164 mobile and is strict.
- `BR-81c` An unknown or inactive warehouse is 422, a taken mobile is 409, a scope that does not cover the warehouse is 404.
- `BR-81d` At most `sub_wh_admin_max_per_warehouse` live admins per warehouse (the 6th under the default is 409), a disabled admin frees its slot, a missing or unusable config falls back to 5; no update or delete route.
- `BR-81e` One masked audit row in the same transaction (no name, no mobile); it rolls back with the account.
- `BR-81f` The list shows live assignments only, scoped, never a mobile; Super Admin, TOHFA Admin and Main list, other roles are 403.
- `BR-23b` No warehouse create or delete exists (see BR-80; `warehouse-profile.test.ts`).
- `BR-25a` Creating a `SUB_WH_ADMIN` without a warehouse is 422 `WAREHOUSE_REQUIRED` and creates nothing (`sub-admins.test.ts`).
- `BR-25b` The database rejects a `SUB_WH_ADMIN` assignment without a warehouse inserted directly (`sub-admins.test.ts`).
- `BR-28a` Exactly the 8 allowed (creator, target) pairs of `creationRules` hold a grant, and `SUB_WH_ADMIN` is creatable by exactly Super Admin, TOHFA Admin and Main (`sub-admins.test.ts`).
- `BR-28b` A request cannot name a role: this endpoint can only ever create a `SUB_WH_ADMIN` (`sub-admins.test.ts`).

---

### BR-82 — Own-profile edit, admin notification categories, and admin help are narrow, masked and audited
| | |
|---|---|
| **Source** | Derived rule (not client-signed): Sub Warehouse backend, modules 11-16 completion, October 2026 |
| **Status** | DERIVED |
| **Layer** | Server-side, `apps/api/src/modules/auth/` (profile), `apps/api/src/modules/notification-preferences/` (admin categories), `apps/api/src/modules/help-support/` (help); `0055_help_support_admin_notification_categories.sql` |
| **Scope** | Track 1 |

**Rule.**
1. **Own profile:** `PATCH /auth/me` (`auth.profile.edit_own`: Super Admin, TOHFA Admin, Farmer Admin, Main and Sub all; farmer and customer none) edits only `fullName` (2-120) and `preferredLocale` (`en` or `ta`). `mobile` or `email` in the request is 403 `FIELD_LOCKED` (BR-33) and nothing is applied; any other key or an empty body is 422. The response is the `GET /auth/me` shape. A real change writes one masked `auth.profile.update_own` audit row (field names only); a no-op writes nothing.
2. **Admin notification preferences:** `GET /notification-preferences/admin` and `PATCH .../admin/{category}` (`notification.own.admin_preferences`, admin roles only) over 14 categories in screen order: `IN_APP_MASTER`, `GOODS_RECEIVING`, `INVENTORY_ALERTS`, `WAREHOUSE_OPERATIONS`, `TASK_ALERTS`, `EXCEPTION_ALERTS`, `ORDER_CONFIRMED`, `ORDER_DISPATCHED`, `ORDER_DELIVERED`, `WALLET_CREDITED`, `PAYOUT_RELEASED`, `SYSTEM_MESSAGES`, `MAINTENANCE_MESSAGES`, `SECURITY_ALERTS`. Default enabled; sparse ("no row = enabled"); farmers and customers cannot read or set them; the five original categories and their defaults are unchanged. The admin categories are stored preferences only: no admin event maps to them yet (contradiction 28).
3. **Help and support:** `GET /admin/help` serves published plain-text articles by locale and category plus a contact card (`help.article.view`: admin roles). Article and contact writes are Super Admin and TOHFA Admin only (`help.article.manage`) and are audited masked (no title, body, phone or e-mail). Nothing is seeded and no phone or e-mail is invented (`system_config` `help.contact.phone` / `help.contact.email` are null until set). Admin support tickets are NOT built.

**Failure mode if unenforced.** A user changes their locked mobile or e-mail through a profile screen, a farmer reads or sets admin preferences, or help text and contact details leak into the audit log.

**Test contract.** (`apps/api/src/modules/auth/auth.profile.test.ts`, `apps/api/src/modules/notification-preferences/notification-preferences.admin.test.ts`, `apps/api/src/modules/help-support/help-support.test.ts`)
- `BR-82a` `PATCH /auth/me` without a token is 401.
- `BR-82b` The edit changes the trimmed name and/or locale only, leaves every other column alone and returns the `GET /auth/me` shape; invalid values are 422.
- `BR-82c` `mobile` or `email` is 403 `FIELD_LOCKED` and a valid name in the same request is not applied; any unknown key is 422 and nothing is applied.
- `BR-82d` One masked audit row with changed field names only, in the same transaction; a no-op writes nothing.
- `BR-82e` A locale outside `en` / `ta` is 422 and changes nothing; both valid locales are accepted.
- `BR-82f` The admin preferences routes are 401 without a token.
- `BR-82g` A farmer cannot set an admin category through the farmer endpoint either (422, nothing stored).
- `BR-82h` Toggling an admin category persists for the caller only and re-enabling restores it; the original five categories are unchanged and admin rows never leak into that list; the database accepts every admin category and rejects an unknown one.
- `BR-82i` Help routes are 401 without a token; the migration seeds no article; the contact channels are `null` until set; with nothing configured the reader gets empty articles and a null contact.
- `BR-82j` Role matrix through the real router: admin roles read published help; farmer, customer and others are 403; only Super Admin and TOHFA Admin write.
- `BR-82k` A new article is a draft invisible to readers until published; reads filter by locale (default `en`) and category, ordered by `sortOrder` then id; an unsupported locale is 422; managers list drafts too.
- `BR-82l` Article text is plain text (HTML-looking markup rejected); PATCH changes only the fields sent; publishing an already published article is a 200 no-op with no second audit row.
- `BR-82m` Create, update, publish, unpublish and contact changes each write one masked audit row (no title, body, phone or e-mail) in the same transaction; a no-op writes none; a null clears a channel.

---

### BR-83 — The warehouse staff roster is warehouse-scoped, soft-deactivated, and masked in audit
| | |
|---|---|
| **Source** | Derived rule (not client-signed): Sub Warehouse backend, modules 11-16 completion, October 2026 |
| **Status** | DERIVED |
| **Layer** | Server-side, `apps/api/src/modules/warehouse-staff/`; `warehouse_staff` (`0056_warehouse_staff.sql`) |
| **Scope** | Track 1 |

**Rule.** A staff member belongs to exactly one warehouse and is NOT a user (no login). A row outside the caller's scope is 404, by id and when a warehouse or staff id is used as a read filter for a confined caller. Deactivation is soft (status `INACTIVE`); attendance stays; no hard delete. The phone is personal data: never logged, never in an audit image. Create, update and deactivate each write one masked audit row (ids, staff code `STF-nnnn`, warehouse, status; changed field names) in the same transaction; a no-op `PATCH` or a repeat deactivate writes none. Permissions: reads `admin.staff.list_view` (existing; Sub none); writes `admin.staff.manage` (new: Super Admin and TOHFA Admin all, Main own, Sub none; a spec gap, contradiction 27). **A Sub Warehouse Admin cannot list staff** (owner decision 2026-10-11: the rules are followed as written): it holds none of `admin.staff.list_view`, `admin.staff.manage`, `admin.staff.attendance.view` and `admin.staff.attendance.mark`, so EVERY staff and attendance route answers it 403 (for its own warehouse's staff too) and no response can carry a staff name, designation, phone or id to it. Main `own` means all four warehouses (confirmed by the owner 2026-10-11: a Main Warehouse Admin sees all four warehouses); a Main Warehouse Admin with an assigned warehouse is confined to it.

**Failure mode if unenforced.** A Sub Warehouse Admin obtains the staff list through a roster or attendance route, an admin confined to one warehouse sees or edits another warehouse's staff, a staff phone number leaks through logs or audit, or deactivating a person erases their attendance.

**Test contract.** (`apps/api/src/modules/warehouse-staff/warehouse-staff.test.ts`)
- `BR-83a` Create body validation (name, optional phone, status defaults to `ACTIVE`, impossible date, unknown fields).
- `BR-83b` Update body needs at least one field, allows `phone: null`, and is strict.
- `BR-83c` Creating returns an `STF-` code and `ACTIVE` status, makes no user row, and writes one masked `staff.create` audit row.
- `BR-83d` An actor with no warehouse must name one (422), an unknown warehouse is 422, a confined actor naming another warehouse gets 404, a confined actor defaults to its own.
- `BR-83e` An admin confined to one warehouse (a Main admin with an assigned warehouse) lists and reads only that warehouse (another is 404), an unconfined Main and Super Admin see both, and search escapes `LIKE` wildcards.
- `BR-83f` The list pages in name order with a cursor without repeats or skips; a forged cursor is 422.
- `BR-83g` Update changes only the given fields, audits field names only, and replaying the same `PATCH` writes nothing.
- `BR-83h` Deactivation is soft and idempotent (one audit row), the row stays readable as `INACTIVE`, other warehouses see 404, a `PATCH` can reactivate.
- `BR-83i` The database rejects a malformed phone, blank name, unknown status, unknown warehouse and duplicate staff code.
- `BR-83j` Every route is 401 without a token and 403 for farmer, customer and Farmer Admin, as `problem+json`.
- `BR-83k` The role matrix holds through the real router for the roles that keep staff access: Tohfa Admin reads but cannot mark; Main (confined or not) and Super Admin may do everything.
- `BR-83` (one test per route) A Sub Warehouse Admin gets 403 on every staff and attendance route (all 11 route/verb pairs, both Sub tokens, own warehouse's staff included), `problem+json` `FORBIDDEN` with no staff data, nothing written; a companion test proves the list covers every route the two routers expose.
- `BR-83l` Staff lifecycle over HTTP: create, get, list with filters, patch, deactivate (idempotent), bad input 422 with nothing written.
- `BR-83m` Audit rows of the HTTP writes carry ids and statuses only: no name, phone, designation or note.

---

### BR-84 — Staff attendance is one row per staff per day, with an append-only history
| | |
|---|---|
| **Source** | Derived rule (not client-signed): Sub Warehouse backend, modules 11-16 completion, October 2026 |
| **Status** | DERIVED |
| **Layer** | Server-side, `apps/api/src/modules/warehouse-staff/`; `staff_attendance`, `staff_attendance_history` and its trigger (`0056_warehouse_staff.sql`, `0057_staff_attendance_history.sql`); `system_config.staff_attendance_max_range_days` |
| **Scope** | Track 1 |

**Rule.** There is one `staff_attendance` row per staff member per Asia/Kolkata day. A re-mark updates it in place, and every creation and real change is copied by a database trigger into the append-only `staff_attendance_history`. Statuses are exactly `PRESENT`, `ABSENT`, `LEAVE` (no half-day in the design). Times are allowed only for `PRESENT`; check-out needs a check-in and cannot precede it. A future day is 422; a deactivated staff member is 409; another warehouse's staff is 404 for an admin confined to one warehouse. A bulk mark (max 200) is all-or-nothing. An identical replay writes no update, history or audit row. Summaries are exact integer counts; a span is capped by `system_config.staff_attendance_max_range_days` (366, an UNCONFIRMED default). Permissions `admin.staff.attendance.view` (Super Admin and TOHFA Admin all, Main own, Sub none) and `admin.staff.attendance.mark` (Super Admin all, TOHFA Admin none, Main own, Sub none) are both new spec gaps (contradiction 27). Sub is none on both by owner decision 2026-10-11: a Sub Warehouse Admin cannot list staff, so no attendance access (the roll call, list, summary and history all name staff). Main `own` means all four warehouses (confirmed by the owner 2026-10-11: a Main Warehouse Admin sees all four warehouses). No payroll or salary.

**Failure mode if unenforced.** A correction erases what was first recorded, a future or half-written day is accepted, a partial bulk leaves attendance half applied, a Sub Warehouse Admin reads or marks attendance (and so learns the staff list), or an admin confined to one warehouse marks another warehouse's staff.

**Test contract.** (`apps/api/src/modules/warehouse-staff/warehouse-staff.test.ts`)
- `BR-84a` The mark body takes exactly `PRESENT`, `ABSENT`, `LEAVE`; times only for a `PRESENT` day; check-out needs a check-in and cannot precede it; bulk needs 1-200 entries with no duplicate staff.
- `BR-84b` The summary query takes a month or a from/to pair (real dates, `from <= to`); the list query is strict.
- `BR-84c` Marking creates one row, one history `CREATED` row and one masked audit row; a re-mark updates in place (still one row), keeps both values in history and updates `marked_by`.
- `BR-84d` Replaying the same mark writes no update, history or audit row.
- `BR-84e` The history table is append-only (`UPDATE`, `DELETE` and `TRUNCATE` refused); a direct `UPDATE` of an attendance row still leaves a history row.
- `BR-84f` A future day is 422 and writes nothing; "today" is the Asia/Kolkata date.
- `BR-84g` A deactivated staff member cannot be marked (409); another warehouse's staff is 404 for an admin confined to one warehouse and markable by an unconfined Main.
- `BR-84h` The summary arithmetic is exact (per-status counts, marked = sum, unmarked days not counted, totals add up across staff).
- `BR-84i` Summary and list ranges are capped by `staff_attendance_max_range_days`, read from the database.
- `BR-84j` A bulk mark is all-or-nothing (rows, history and audit roll back together) and reports created, updated and unchanged.
- `BR-84k` The roll call lists active staff with their mark or null, counts every bucket, and is confined to the warehouse of an admin assigned to one.
- `BR-84l` The attendance list filters by staff, status and date, counts every matching row, pages newest day first without repeats, and 404s on another warehouse's staff.
- `BR-84m` The database enforces one row per staff per day, times only for `PRESENT`, check-out after check-in, and an attendance warehouse matching the staff member's.
- `BR-84n` A Main admin confined to one warehouse marks its own warehouse (201, then 200 on replay and correction); another warehouse's staff is 404 on mark, bulk, history and filters; an unconfined Main reaches both.
- `BR-84o` Bad attendance input is 422 and writes nothing (`HALF_DAY`, times on an absent day, future or impossible date, duplicate in bulk, invalid cursor or range).
- `BR-84p` Bulk, roll call, summary and list answer with their documented shapes for a Main admin confined to one warehouse, and a bulk request is applied entirely or not at all.

---

### BR-85 — Direct and Market sales are allowed for the Sub Warehouse Admin (amends BR-15)
| | |
|---|---|
| **Source** | Derived rule (not client-signed): owner decisions 2026-10-11, D1, D2, D5; Sub Warehouse modules 6-7 |
| **Status** | DERIVED |
| **Layer** | Server-side, `apps/api/src/modules/sales/`; `orders.channel` (`DIRECT` added), `sales.*` permissions |
| **Scope** | Track 1 |

**Rule.** A Sub Warehouse Admin (scope `own`) may create `DIRECT` (at-counter) and `MARKET` (live market day) sales through `POST /v1/admin/sales` (Owner decision 2026-10-11, D1, D2). Super Admin and TOHFA Admin hold `sales.sale.create` at `all`; Main Warehouse Admin holds `none` on `sales.sale.create` and `payment.record` and `own` on the `*.view` sales codes; Farmer Admin, Farmer and Customer hold `none`. A sale is inserted already complete: `status = PICKED_UP`, `payment_status = PAID`, `completed_at` set, with no new status enum value (Owner decision 2026-10-11, D5); the one exception is UPI (BR-94). Horeca and B2B sale creation stays 501 (BR-13, BR-15b) with `SALE_CHANNEL_NOT_SUPPORTED` if no existing not-implemented code applies; read-only `GET /sales/horeca` and `GET /sales/b2b` are allowed (`sales.horeca.view`, `sales.b2b.view`). A sale is always made at the warehouse of the acting scope; a Sub Warehouse Admin cannot sell for another warehouse.

**Failure mode if unenforced.** Counter and market revenue is recorded as Online or not at all, a Sub admin sells from another warehouse, or Horeca/B2B orders are silently created as retail sales.

**Test contract.**
- `BR-85a` `orders.channel` accepts `DIRECT` and `MARKET` (plus the existing values) and refuses any other string at the database level.
- `BR-85b` Permission matrix on `POST /sales`: no token 401; FARMER, FARMER_ADMIN, CUSTOMER 403; MAIN_WH_ADMIN 403 (`none`); SUB_WH_ADMIN, TOHFA_ADMIN, SUPER_ADMIN reach the handler. The same matrix holds for `POST /sales/quote`, `GET /sales/products` and `GET /sales/customers/lookup`.
- `BR-85c` Permission matrix on the read routes: `GET /sales`, `/sales/{id}`, `/sales/summary`, `/sales/market-day`, `/sales/horeca`, `/sales/b2b` return 401 without a token, 403 for FARMER, FARMER_ADMIN, CUSTOMER, and 200 for SUB_WH_ADMIN and MAIN_WH_ADMIN (`own`), TOHFA_ADMIN and SUPER_ADMIN (`all`).
- `BR-85d` A sale created with channel `DIRECT` or `MARKET` is inserted `PICKED_UP` / `PAID` with `completed_at` set, in the same statement, and the `order_status_history` row exists (append-only, BR-17 family).
- `BR-85e` Creating a sale with channel `horeca` or `b2b` is refused 501 (`SALE_CHANNEL_NOT_SUPPORTED`, or the existing not-implemented code), and nothing is written to `orders`, `stock_ledger` or `sale_payments`.
- `BR-85f` A Sub Warehouse Admin's sale is stamped with their own warehouse; a `warehouse_id` in the body that is not theirs is ignored or refused 404, never accepted (cross-scope is not 403).
- `BR-85g` `payment.record` is checked in the service: a caller with `sales.sale.create` but not `payment.record` is refused 403 before any write.
- `BR-85h` `GET /sales/horeca` and `GET /sales/b2b` are read-only: no mutating verb exists for them (405/404), and their responses obey BR-90.
- `BR-85i` (derived, review of 2026-10-12) A DIRECT or MARKET counter sale stays at the warehouse that made it: `POST /admin/orders/{id}/assign-warehouse` on one (in particular a UPI sale still `PENDING_PAYMENT`, whose items already name that warehouse's batches) is 409 `COUNTER_SALE_NOT_REASSIGNABLE` and writes nothing.
- `BR-85j` (derived, review of 2026-10-13) `POST /admin/orders/{id}/assign-warehouse` decides on the order row locked with `SELECT ... FOR UPDATE` inside its transaction (existence, scope, channel and status are all checked on that locked row). A pack or cancel that commits while the reassign waits makes it 409 `INVALID_STATE_TRANSITION`, and the order keeps its status and warehouse. An order-status update (`updateOrderStatus`, used by assign-warehouse, pack, dispatch and verify-otp) that matches no row appends no `order_status_history` row and is 409 `CONFLICT`, rolling back the audit row.

---

### BR-86 — A sale has exactly one customer identity; walk-ins cannot pay by wallet
| | |
|---|---|
| **Source** | Derived rule (not client-signed): owner decision 2026-10-11, D4 |
| **Status** | DERIVED |
| **Layer** | Server-side, `sales` service; database CHECK on `orders` (`customer_id`, `walk_in_name`, `walk_in_mobile`) |
| **Scope** | Track 1 |

**Rule.** `orders.customer_id` becomes nullable and `orders` gains `walk_in_name` and `walk_in_mobile`. A CHECK constraint requires exactly one identity: `customer_id IS NOT NULL XOR walk_in_name IS NOT NULL` (Owner decision 2026-10-11, D4). A walk-in sale cannot be paid by `WALLET`: 422 `WALKIN_WALLET_NOT_ALLOWED`, nothing written. Online orders keep a non-null `customer_id`. A walk-in is not a customer record and is not listed in BR-91.

**Failure mode if unenforced.** An order with no buyer or two buyers, a wallet debit with no wallet to debit, or a walk-in silently attached to a real customer.

**Test contract.**
- `BR-86a` (DB level) Inserting an order with both `customer_id` and `walk_in_name` fails the CHECK; inserting one with neither fails the CHECK; inserting exactly one succeeds. `walk_in_mobile` without `walk_in_name` fails.
- `BR-86b` An existing Online order (customer set, walk-in columns null) still satisfies the CHECK after migration (no data loss on backfill).
- `BR-86c` `POST /sales` with a walk-in and `payment_method = WALLET` is 422 `WALKIN_WALLET_NOT_ALLOWED` as `problem+json`; no `orders`, `order_items`, `stock_ledger`, `wallet_transactions` or `sale_payments` row is written, and one `sale_attempts` row records the failure (BR-87).
- `BR-86d` A walk-in may pay by CASH, UPI and CARD (201, `PAID`; UPI pending per BR-94).
- `BR-86e` A body with both a customer reference and a walk-in name, or neither, is 422 and writes nothing.
- `BR-86f` A walk-in sale never touches any `wallets` row (balance and ledger unchanged).

---

### BR-87 — A sale is one atomic transaction; confirmation only after commit
| | |
|---|---|
| **Source** | Derived rule (not client-signed): owner decisions 2026-10-11, D5, D6 |
| **Status** | DERIVED |
| **Layer** | Server-side, `sales` service (one transaction through `Executor`); `sale_attempts` table |
| **Scope** | Track 1 |

**Rule.** Payment, order, order items, the `SALE` rows in `stock_ledger`, the invoice (number from the gap-free counter, BR-98) and the `audit_log` row are written in one database transaction (Owner decision 2026-10-11, D5, D6). If any step fails, all roll back. The success response (and any notification or event) is emitted only after the commit. Every failed attempt is recorded in `sale_attempts` through a separate write that does not join the rolled-back transaction. `sale_attempts` is append-only at the database level (UPDATE and DELETE rejected, as for the other ledgers).

**Failure mode if unenforced.** Stock decremented with no order, an order with no payment, a customer told "paid" for a sale that rolled back, or failed attempts that leave no trace for reconciliation.

**Test contract.**
- `BR-87a` A forced failure after the stock ledger write (for example in the invoice step) leaves no `orders`, `order_items`, `stock_ledger`, `sale_payments`, `wallet_transactions`, invoice or `audit_log` sale row, and the invoice counter is not advanced (no gap).
- `BR-87b` On that failure exactly one `sale_attempts` row is written, with the reason code, actor, warehouse and request correlation id, and no secret or full mobile number.
- `BR-87c` (DB level) `UPDATE`, `DELETE` and `TRUNCATE` on `sale_attempts` are refused.
- `BR-87d` A successful sale writes exactly one audit row inside the same transaction, carrying ids and amounts only (no customer name, no mobile).
- `BR-87e` The 201 response and any event or notification are produced after commit: a test that fails the commit sees no event emitted and a 5xx `problem+json`, never a success body.
- `BR-87f` Rollback restores the stock: `inventory_batches.qty_available` is unchanged after a failed sale.
- `BR-87g` Two concurrent sales for the last unit of a batch: one succeeds and one gets 409 `SALE_STOCK_CHANGED`; available quantity never goes negative.
- `BR-87h` Concurrent sales draw invoice numbers with no collision and no gap: N parallel sales produce N distinct consecutive numbers, and a rolled-back sale does not consume one.

---

### BR-88 — A wallet debit for a sale is backend-only and idempotent
| | |
|---|---|
| **Source** | Derived rule (not client-signed): owner decision 2026-10-11, D6; extends BR-17 and CLAUDE.md §2.4 |
| **Status** | DERIVED |
| **Layer** | Server-side, `sales` service and wallet ledger; `Idempotency-Key` header |
| **Scope** | Track 1 |

**Rule.** When a sale is paid by `WALLET`, the debit is created by the backend inside the sale transaction (BR-87) as an append-only `wallet_transactions` row; no client, and no endpoint other than `POST /sales`, can debit a wallet for a sale (Owner decision 2026-10-11, D6). `POST /sales` and `POST /sales/{id}/payments/upi/confirm` require an `Idempotency-Key`; replaying a key returns the original response and moves money once. The same key with a different body is refused 422/409 per the existing idempotency contract. A wallet with insufficient balance is refused with the existing insufficient-balance error and writes nothing but a `sale_attempts` row.

**Failure mode if unenforced.** A retry on a flaky counter connection debits the customer twice.

**Test contract.**
- `BR-88a` `POST /sales` without `Idempotency-Key` is 400/422 `problem+json` and writes nothing.
- `BR-88b` Replaying the same key and body returns the same order id and amounts, and `wallet_transactions` holds exactly one debit for that sale; the wallet balance moved once, in integer paise.
- `BR-88c` Replaying the same key with a different body is refused and moves no money.
- `BR-88d` Concurrent requests with the same key move money once (one 201, the other the replayed response).
- `BR-88e` Insufficient wallet balance is refused; balance and ledger unchanged; one `sale_attempts` row.
- `BR-88f` No route other than `POST /sales` writes a sale debit; `wallet_transactions` accepts no UPDATE or DELETE (CLAUDE.md §2.3) and `wallets.balance` equals the sum of its ledger after the sale.
- `BR-88g` The UPI confirm endpoint is idempotent: confirming twice (same or new key) on a sale already confirmed does not create a second `sale_payments` row or a second stock or invoice effect.
- `BR-88h` (derived, review of 2026-10-12) A sale key replayed after the 24-hour idempotency retention, when its sale already exists (`sale_payments.idempotency_key` is kept for ever), is 409 `IDEMPOTENCY_KEY_REUSED`, never a 500, and writes nothing.

---

### BR-89 — Stock and price are re-validated at quote and again at create
| | |
|---|---|
| **Source** | Derived rule (not client-signed): owner decision 2026-10-11, D2; reuses the BR-07 price ceiling |
| **Status** | DERIVED |
| **Layer** | Server-side, `sales` service; `POST /sales/quote`, `POST /sales` |
| **Scope** | Track 1 |

**Rule.** `POST /sales/quote` checks stock and price and returns the priced lines and total. `POST /sales` re-checks both inside the sale transaction using the same code path; nothing the client sends (price, total) is trusted. If stock has dropped below the requested quantity since the quote: 409 `SALE_STOCK_CHANGED`. If the price differs from the quote the client echoed: 409 `SALE_PRICE_CHANGED`. Both are `problem+json`, write nothing except a `sale_attempts` row, and return the fresh values so the screen can re-confirm (Owner decision 2026-10-11, D2).

**Failure mode if unenforced.** A counter sale at a stale price, or a sale of stock another counter just sold.

**Test contract.**
- `BR-89a` A quote for a quantity above available stock is refused with the stock error; a valid quote returns integer-paise lines and total.
- `BR-89b` Reducing stock between quote and create returns 409 `SALE_STOCK_CHANGED`; no ledger, order or payment row is written; a `sale_attempts` row is.
- `BR-89c` Changing the price between quote and create returns 409 `SALE_PRICE_CHANGED` with the same rollback and logging.
- `BR-89d` A client-supplied total or unit price in the `POST /sales` body that disagrees with the server computation is ignored or refused, never stored.
- `BR-89e` A sale never uses a batch that is not `ACTIVE`, or an expired one, or a quarantined/rejected GRN batch (stock lifecycle rules).
- `BR-89f` Quote writes nothing (no order, no ledger, no `sale_attempts` row for a successful quote).

---

### BR-90 — No farm identity in any sale response or quote
| | |
|---|---|
| **Source** | Derived rule (not client-signed): extends BR-16 and CLAUDE.md §2.5 to the Sub Warehouse sales surface; owner decision 2026-10-11, D11 |
| **Status** | DERIVED |
| **Layer** | Server-side, `sales` serializers (allow-list, not deny-list) |
| **Scope** | Track 1 |

**Rule.** Quote, product list, sale, sale history, sale detail, market-day, Horeca and B2B read responses are built by an allow-list serializer. No `farmerId`, farmer name, farm name, village, GPS, FMB or photo-with-farm-identity key may appear at any depth, including nested `items[]`, batch and invoice objects. Products are shown by grade, certification badges and TOHFA branding only. The invoice seller is TOHFA (BR-16b).

**Failure mode if unenforced.** A Sub Warehouse staff member, or a printed counter receipt, exposes the farmer to the customer and defeats the aggregator model.

**Test contract.**
- `BR-90a` Responses of `GET /sales/products`, `POST /sales/quote`, `POST /sales`, `GET /sales`, `GET /sales/{id}` and the market-day, Horeca and B2B reads contain no key from the farmer-identity list, asserted recursively over the whole JSON including nested `items`.
- `BR-90b` Adding a field to the internal order-item or batch model does not appear in any sale response (allow-list check: the serialized key set equals the documented key set).
- `BR-90c` The receipt/invoice for a sale names TOHFA as seller and carries no farmer data.
- `BR-90d` A sale-line `lot` or batch label shown to the counter is TOHFA's own code, not one that encodes a farmer id.

---

### BR-91 — Customer scope for the Sub Warehouse Admin
| | |
|---|---|
| **Source** | Derived rule (not client-signed): owner decision 2026-10-11, D8; extends BR-30 |
| **Status** | DERIVED |
| **Layer** | Server-side, `customers` service and repo (scope predicate in SQL); `customer.*` permissions |
| **Scope** | Track 1 |

**Rule.** For an actor whose resolved scope is `own`, a customer is visible if and only if the customer has an order or a top-up at that actor's warehouse, or `preferred_warehouse_id` equals it (Owner decision 2026-10-11, D8). Anything else is an empty list on list routes and 404 on `/customers/{customerId}` and every sub-resource, never 403 (BR-30, `requirePermission.ts`). Scope `all` sees every customer. The same predicate applies to the customer sub-routes (purchases, orders, wallet, issues, support tickets) so a guessed id does not leak existence. Customer list summary counts (`total`, `active`, `new`) are computed over the visible set only. "Active" uses the window of BR-98.

**Exception, the cash top-up lookup (BR-91i, spec gap 2026-10-14).** `GET /admin/wallets/cash-topup/customers/lookup` (`wallet.cash_topup.process`) does NOT apply this predicate. A customer's first top-up at a warehouse would otherwise be impossible to start: the successful top-up is what makes them visible, and the lookup that precedes it required them to be visible already. The exception is kept narrow: exact mobile (last 10 digits) or exact customer code only, no name or partial search; the response is the sales counter allow-list (`SaleCustomerMatch`: id, code, name, masked mobile, wallet balance). The customer list, detail, sub-routes and the sales counter lookup (`/admin/sales/customers/lookup`) keep the predicate.

**Failure mode if unenforced.** A Sub admin reads another warehouse's customers, or learns by a 403 which customer ids exist.

**Test contract.**
- `BR-91a` Permission matrix on `GET /customers` and `/customers/{id}`: 401 without a token; 403 for FARMER, FARMER_ADMIN, CUSTOMER; 200 for SUB_WH_ADMIN and MAIN_WH_ADMIN (`own`), TOHFA_ADMIN and SUPER_ADMIN (`all`). The sub-routes use their own codes (`customer.purchase_history.view`, `customer.wallet.view`, `customer.issues.view`, `customer.support_history.view`) with the same matrix.
- `BR-91b` A customer with an order at the admin's warehouse is visible; one with only a top-up there is visible; one whose `preferred_warehouse_id` is the warehouse is visible; one with none of these is absent from the list.
- `BR-91c` For a customer outside the scope, `GET /customers/{id}` and each of the nine sub-routes return 404 `problem+json`, never 403, with the same body as for a nonexistent id.
- `BR-91d` The list filters (`q`, `status`) and pagination cannot widen the scope: a `q` that matches an out-of-scope customer returns an empty page.
- `BR-91e` `summary.total`, `summary.active` and `summary.new` count only in-scope customers and equal the sum of the visible rows over all pages.
- `BR-91f` A customer later placing an order at the warehouse becomes visible; the scope is evaluated per request, not cached on the token.
- `BR-91g` The sub-resources never return rows from another warehouse's orders for an in-scope customer unless the actor's scope covers them (purchases and orders are confined to the warehouse for `own`).
- `BR-91h` Issues (`GET /customers/{customerId}/issues`, from `return_requests`, which has no number column) carry derived values, pinned by test: `reference` = `RET-` + the first 8 hex characters of the request id, upper-cased (a display label, not unique, never a key); `refundAmount` = sum of `unit_price * accepted_qty` over the request's items, rounded to 2 decimals, and ABSENT until an inspection recorded an accepted quantity; `resolvedAt` = the earliest status-history row to `REJECTED` or `REFUNDED`, null while open.
- `BR-91i` A customer with no order, no top-up and no `preferred_warehouse_id` at warehouse X is returned by `GET /admin/wallets/cash-topup/customers/lookup` to a SUB_WH_ADMIN of X by exact mobile and by exact code, with the mobile masked; the same customer is still an empty result on `GET /admin/sales/customers/lookup` for that admin. A `q` (or no parameter, or both) is 422. The route is 200/422 for MAIN_WH_ADMIN and SUB_WH_ADMIN (no 403 for Main), 403 for FARMER_ADMIN, FARMER and CUSTOMER, 401 anonymous.

---

### BR-92 — Own-scope actors see masked customer PII
| | |
|---|---|
| **Source** | Derived rule (not client-signed): owner decision 2026-10-11, D9; narrows BR-64d for list/detail only |
| **Status** | DERIVED |
| **Layer** | Server-side, `customers` serializer driven by the resolved scope, not by a role check |
| **Scope** | Track 1 |

**Rule.** An actor holding a customer permission at scope `own` (the Sub Warehouse Admin; Main Warehouse Admin when `own`) receives only the customer name, the mobile masked to its last four digits (for example `******1234`) and the customer code. Full mobile, e-mail and address are never returned to them in any customers route or any nested object (Owner decision 2026-10-11, D9). Scope `all` actors receive the unmasked values. Masking is selected by the scope the permission resolved to, so a future role inherits it with no code change (CLAUDE.md §2.1). D9 overrules BR-64d only for the customer list and detail; the customers report keeps its own rule (BR-64d). Walk-in mobiles shown in sale history are masked the same way for `own`.

**Failure mode if unenforced.** A Sub admin exports a warehouse's customers with full phone numbers and addresses.

**Test contract.**
- `BR-92a` For an `own`-scope actor the list, detail, and every sub-resource response contain no full mobile (no run of more than four consecutive digits from the stored number), no `email`, no address key, asserted recursively.
- `BR-92b` The masked mobile equals `*` repeated to the original length followed by the last four digits (or the documented fixed mask), and the code and name are present.
- `BR-92c` For an `all`-scope actor (SUPER_ADMIN, TOHFA_ADMIN) the same routes return the full fields.
- `BR-92d` Masking follows the scope: the test grants `own` to a role through the permission fixture and sees masking with no change to the handler (no `user.role ===` branch exists in the serializer).
- `BR-92e` A mobile shorter than four digits is masked fully without error.
- `BR-92f` D9 does not alter the customers report: the BR-64d test still passes unchanged.
- `BR-92g` `GET /sales/customers/lookup` by mobile for an `own` actor returns the masked mobile only, and a lookup that matches no in-scope customer is an empty result, not 403.
- `BR-92h` The customer list `q` is trimmed and must then be 1 to 100 characters (else 422). It matches name or customer code for every actor; it matches the mobile only for an `all` (unmasked) actor and only when `q` holds at least 3 digits (non-digits stripped, substring of the stored mobile's digits). An `own` actor searching by mobile digits gets an empty page, so a masked number cannot be recovered through the filter.

---

### BR-93 — The Sub Warehouse Admin's customer wallet view is read-only
| | |
|---|---|
| **Source** | Derived rule (not client-signed): owner decision 2026-10-11, D10; related to open contradiction 6 |
| **Status** | DERIVED |
| **Layer** | Server-side, `customers` routes; `customer.wallet.view` |
| **Scope** | Track 1 |

**Rule.** `GET /customers/{customerId}/wallet` (summary), `/wallet/transactions` and `/wallet/transactions/{txnId}` are the only wallet routes under `/customers`, and they are GET-only (Owner decision 2026-10-11, D10). No credit, debit, adjustment or top-up route exists for the Sub Warehouse Admin through this surface. The same scope and masking rules as BR-91 and BR-92 apply. Amounts are integer-paise `Money` strings. A transaction id belonging to a different customer is 404.

**Failure mode if unenforced.** A Sub admin moves a customer's money through a "view" screen.

**Test contract.**
- `BR-93a` POST, PUT, PATCH and DELETE on each of the three wallet paths return 404 or 405 for SUB_WH_ADMIN and write nothing.
- `BR-93b` Permission matrix on the three GET routes: 401 without a token; 403 for FARMER, FARMER_ADMIN, CUSTOMER; 200 for SUB_WH_ADMIN, MAIN_WH_ADMIN, TOHFA_ADMIN, SUPER_ADMIN.
- `BR-93c` An out-of-scope customer's wallet, transactions and a transaction detail are 404, never 403 (BR-91c).
- `BR-93d` `GET /wallet/transactions/{txnId}` with a transaction that belongs to another customer is 404.
- `BR-93e` The wallet summary balance equals the sum of that customer's ledger rows exactly, in integer paise; no float anywhere in the response.
- `BR-93f` The three GETs write no row and no audit entry beyond access logging; the route list for `/customers` contains no wallet write (route-table assertion).

---

### BR-94 — Payment methods: UPI is pending then confirmed, CARD needs a reference, CASH computes change
| | |
|---|---|
| **Source** | Derived rule (not client-signed): owner decision 2026-10-11, D6 |
| **Status** | DERIVED |
| **Layer** | Server-side, `sales` service; `sale_payments`; `POST /sales/{id}/payments/upi/confirm` (`payment.record`) |
| **Scope** | Track 1 |

**Rule.** `CASH` and `WALLET` are confirmed by the server in the sale transaction. `CASH` requires `amount_received >= total` (else 422 `PAYMENT_AMOUNT_INSUFFICIENT`) and the response carries `change = amount_received - total` in paise. `CARD` is a manual entry and requires a non-empty reference (422 on a missing or blank reference); no card number is stored. `UPI` goes through the existing gateway: the sale is inserted with `payment_status` pending and `status` not yet `PICKED_UP`, no stock effect is visible as a completed sale, and it is completed only by `POST /sales/{saleId}/payments/upi/confirm`, which verifies the gateway result and then performs the BR-87 completion in one transaction (Owner decision 2026-10-11, D6). Acting on a sale whose UPI is unconfirmed (for example confirming a different method, or any follow-on action that needs a paid sale) is 409 `PAYMENT_PENDING`.

**Failure mode if unenforced.** A UPI sale counted as revenue before the money arrives, a short cash payment accepted, or a card sale with no trace to reconcile against.

**Test contract.**
- `BR-94a` CASH with `amount_received` below the total is 422 `PAYMENT_AMOUNT_INSUFFICIENT`, nothing written but a `sale_attempts` row; equal to the total gives `change = 0`.
- `BR-94b` CASH change is exact integer paise: total 12 345 paise, received 20 000 gives change 7 655 (no float, no rounding).
- `BR-94c` CARD without a reference, or with a blank one, is 422 and writes nothing; with a reference the reference is stored in `sale_payments` and the sale is `PAID`.
- `BR-94d` UPI creates the sale pending: `payment_status` is not `PAID`, `status` is not `PICKED_UP`, `completed_at` is null, and the dashboard (BR-96) does not count it.
- `BR-94e` UPI confirm after a successful gateway result completes the sale (`PAID`, `PICKED_UP`, `completed_at` set), writes the `SALE` stock ledger rows, the invoice and the audit row in one transaction; replaying the confirm moves nothing again (BR-88g).
- `BR-94f` UPI confirm with a failed or unverified gateway result leaves the sale pending (no stock, no invoice, no revenue) and returns the gateway error; the attempt is logged.
- `BR-94g` Acting on an unconfirmed UPI sale (for example cancelling as paid, issuing its invoice) is 409 `PAYMENT_PENDING`.
- `BR-94h` `POST /sales/{id}/payments/upi/confirm` permission matrix: 401 without a token; 403 for MAIN_WH_ADMIN (`none` on `payment.record`), FARMER, FARMER_ADMIN, CUSTOMER; SUB_WH_ADMIN, TOHFA_ADMIN and SUPER_ADMIN reach the handler; a sale at another warehouse is 404 for SUB_WH_ADMIN, never 403.
- `BR-94i` The reserved stock of a pending UPI sale is released or expires per the existing hold rule when the gateway times out; no negative balance results.
- `BR-94j` Every `sale_payments` row is written once and never updated except through its documented state change; the payment amounts sum exactly to the order total.
- `BR-94k` (derived, review of 2026-10-12) One UPI payment confirms one sale: confirming a second sale with a `upiTxnRef` that already confirmed another is 409 `CONFLICT` with `meta.reason = UPI_TXN_REF_ALREADY_USED`, and that sale stays pending (no stock, invoice or revenue). Enforced by the partial unique index `uq_sale_payments_upi_txn_ref` (migration 0067); the gateway payment carries no reference to our sale, so the reference itself is the binding.
- `BR-94l` (derived, review of 2026-10-13) Every UPI cancel (the stock-conflict cancel inside the confirm, `POST /sales/{id}/cancel`, and the expiry job) decides on the sale row locked with `SELECT ... FOR UPDATE` inside the transaction that writes the cancel, never on an earlier unlocked read. If the locked sale is no longer `PENDING_PAYMENT` with a `PENDING` UPI payment (another request confirmed, cancelled or refunded it), or the conditional order or payment UPDATE changes no row, the action is 409 `CONFLICT` with `meta.reason = SALE_STATE_CHANGED` and writes nothing: no `order_status_history` row, no audit row, and no gateway refund. The automatic refund (`sales.upi_refund_mode = auto`) is only attempted after this request's cancel committed; if the payment is then no longer `REFUND_DUE` when the refund is recorded, it is not reported `REFUNDED` and no refund audit row is written.
- `BR-94m` (derived, review of 2026-10-13) `POST /sales/{id}/cancel` is gated by its own code `sales.sale.cancel` (same grants as `sales.sale.create`): 401 without a token; 403 for MAIN_WH_ADMIN, FARMER, FARMER_ADMIN and CUSTOMER; SUB_WH_ADMIN (own warehouse), TOHFA_ADMIN and SUPER_ADMIN reach the handler; a sale at another warehouse is 404 for SUB_WH_ADMIN, never 403. Cancelling a UPI sale that is already paid or picked up is 409 `CONFLICT` and changes nothing.
- `BR-94n` (derived, review of 2026-10-13) A UPI confirm that hits a stock conflict with a `upiTxnRef` already bound to another sale's payment (BR-94k) is 409 `CONFLICT` with `meta.reason = UPI_TXN_REF_ALREADY_USED`, never a 500 from the unique index of migration 0067 raised inside the cancel transaction. The cancel rolls back: the sale stays `PENDING_PAYMENT` with a `PENDING` payment, no `order_status_history` or audit row is written, and no gateway refund is attempted (the payment is not proven to be this sale's money).
- `BR-94o` (derived, review of 2026-10-13; default UNCONFIRMED, pending business decision) `system_config.sales.upi_pending_expiry_minutes` is the window after which an unconfirmed UPI DIRECT/MARKET sale is expired by `expirePendingUpi`. It is read on every sweep, never a literal in the service. Migration 0068 seeds it JSON `null`, which disables expiry; `null`, a missing row, zero, a negative or non-whole number, or a non-numeric string also disable it (the sweep cancels nothing). A positive whole number of minutes (a JSON number, or a numeric string) is passed as the window to the sweep. Test: `BR-94o: sales.upi_pending_expiry_minutes disables expiry unless it is a positive whole number, and the window passed to the sweep is the configured one`.
- `BR-94p` (derived, review of 2026-10-13; default UNCONFIRMED, pending business decision) `system_config.sales.upi_refund_mode` decides what happens to a captured UPI payment whose sale the stock-conflict cancel (BR-94i) cancelled. Migration 0068 seeds `"manual"`: the payment stays `REFUND_DUE` for a person and no money moves automatically. Only the exact value `"auto"` asks the gateway to refund once (BR-94l); any other value, a missing row, or a different case (`"AUTO"`) is manual. Test: `BR-94p: sales.upi_refund_mode refunds through the gateway only when it is exactly "auto"; any other value is manual (REFUND_DUE kept, no gateway call)`.
- `BR-94q` (derived, review of 2026-10-13, owner choice "option (b)") A pending UPI payment is never marked `FAILED` by `POST /sales/{id}/cancel` while the gateway reports its reference captured. The counter collects UPI outside a gateway order, so sale create makes no gateway call and has no reference; the earliest point a reference exists is the confirm request. (1) When the confirm's gateway check verifies the reference (captured, for the sale amount), the reference is written to the still-`PENDING` `sale_payments` row at once, in its own statement before the confirm transaction, so a confirm transaction that then rolls back (lost connection, crash, failed invoice step) cannot lose it. An unverified reference is never written (it could be another sale's in-flight payment and would hold the 0067 unique index against that sale). A reference already bound to another sale's payment is 409 `CONFLICT` with `meta.reason = UPI_TXN_REF_ALREADY_USED`, no transaction opens, and the attempt is logged without the reference. No audit row is written for this step (the payment's state does not change; the confirm's `payment.record` audit row records the outcome). (2) The manual cancel, when the sale is still `PENDING_PAYMENT` with a `PENDING` UPI payment that carries a reference, asks the gateway through the same verifier as the confirm, before opening its transaction. Captured is 409 `CONFLICT` with `meta.reason = UPI_PAYMENT_CAPTURED`: nothing is written, and the way forward is the confirm (which completes the sale, or on a stock conflict cancels it with the payment `REFUND_DUE`, BR-94i). Not captured cancels as before (`CANCELLED`, payment `FAILED`). No reference at all asks no gateway and cancels as before: nothing was ever verified as paid. A reference that appears on the locked row after the gateway check (not the one checked) is 409 `CONFLICT` with `meta.reason = SALE_STATE_CHANGED` and writes nothing (BR-94l). Known limit: the shared verifier answers "not captured" when the gateway call itself fails, so an unreachable gateway does not block the cancel. The expiry job (`expirePendingUpi`, BR-94o) does not yet ask the gateway. Note: migration 0067's header says a `PENDING` UPI row always has `upi_txn_ref` NULL; that stopped being true with this rule (the index is unchanged and still applies). Tests: `BR-94q: a verified UPI reference is recorded on the pending payment, outside and before the confirm transaction, so it survives a confirm that rolls back`; `BR-94q: cancelling a pending UPI sale whose recorded reference the gateway reports captured is 409 CONFLICT (UPI_PAYMENT_CAPTURED); nothing is cancelled or marked FAILED`; and the BR-94q tests beside them in `sales.test.ts` and `sales.db.test.ts`.

---

### BR-95 — Market sales draw from the LIVE_MARKET allocation; Direct sales draw from pooled stock
| | |
|---|---|
| **Source** | Derived rule (not client-signed): owner decision 2026-10-11, D2; relates to BR-13 and the `allocation_channel` enum |
| **Status** | DERIVED |
| **Layer** | Server-side, `sales` service stock selection; `allocation_channel`, `inventory_batches`, `stock_ledger` |
| **Scope** | Track 1 |

**Rule.** A `MARKET` sale draws only from stock allocated to the `LIVE_MARKET` channel for the warehouse; a `DIRECT` sale draws from the warehouse's pooled `ACTIVE` batch stock (Owner decision 2026-10-11, D2). A MARKET quantity above the LIVE_MARKET allocation is refused 409 `SALE_STOCK_CHANGED` even when pooled stock exists, and never exceeds the batch's unheld `qty_available` either. **DIRECT availability (owner decision 2026-10-11, superseding the earlier "net of other allocations" reading):** the sum of `qty_available` over the warehouse's sellable batches (status `ACTIVE`, grade not `REJECT`, not expired on the Asia/Kolkata day, GRN not `REJECTED`/`AWAITING_QC`/`QC_PENDING`), minus the stock held by pending UPI sales (order items of `PENDING_PAYMENT` DIRECT and MARKET sales, BR-94). It is **not** limited to the Reserve/Buffer share and **not** net of the ONLINE or LIVE_MARKET allocations (see the BR-12 interaction note); a DIRECT sale does not decrement any allocation row. Known consequence: after a DIRECT sale draws stock an ONLINE or LIVE_MARKET allocation was counting on, that allocation's stored `available_qty` (allocated − consumed − reserved) still counts it; every availability read (customer catalog, cart reservation, allocation dashboard, market-day remaining) is therefore capped by the batch's unclaimed shelf (BR-100), so none of them overstates what is on the shelf. A cart reservation made before the DIRECT sale can still exceed the shelf afterwards; for that, and as the general backstop, the stock ledger trigger refuses the later consumption with 409 (`STOCK_UNAVAILABLE` at online checkout, `SALE_STOCK_CHANGED` for MARKET), never negative stock. Batch choice is FEFO (earliest expiry first) in both cases, and each draw writes a `SALE` row to `stock_ledger` with `order_id`, never to a balance column directly (CLAUDE.md §2.3). `GET /sales/products?channel=DIRECT|MARKET` lists only what that channel can sell.

**Failure mode if unenforced.** Market stock is double-sold to Online customers, or a counter sale sells more than is on the shelf (negative stock), or an online order that lost its stock to the counter fails as a server error instead of a stock conflict.

**Test contract.**
- `BR-95a` `GET /sales/products?channel=MARKET` returns only products with LIVE_MARKET allocation and quantities equal to that allocation; `channel=DIRECT` returns ALL pooled ACTIVE sellable stock (a 10 kg batch allocated 6/2/1/1 shows 10 kg), not net of other allocations.
- `BR-95b` A MARKET sale decrements the LIVE_MARKET allocation and the batch through a `SALE` ledger row; a DIRECT sale decrements pooled batch stock and leaves the LIVE_MARKET allocation untouched.
- `BR-95c` A MARKET sale above the LIVE_MARKET allocation is 409 `SALE_STOCK_CHANGED` although pooled stock would cover it; nothing is written.
- `BR-95d` A DIRECT sale cannot draw batches that are not `ACTIVE`, are expired, are `REJECT` grade, or whose GRN is rejected or still in QC; it may draw stock allocated to any channel (owner decision 2026-10-11).
- `BR-95e` FEFO: with two batches the one expiring first is drawn first; a sale spanning both writes two ledger rows whose quantities sum to the line quantity.
- `BR-95f` `inventory_batches.qty_available` after the sale equals the sum of its ledger rows (trigger-maintained cache, never written directly).
- `BR-95g` An invalid `channel` value on `GET /sales/products` is 422; HORECA or B2B on this route is 501 or 422, never an empty list that looks like "no stock".
- `BR-95h` Cross-warehouse: a Sub admin cannot sell stock of another warehouse; a product id from another warehouse is 404, not 403.
- `BR-95i` A DIRECT sale sells beyond the 20% non-online share up to the total pooled stock minus pending UPI holds (DIRECT and MARKET); one gram more is 409 `SALE_STOCK_CHANGED`; no allocation row changes.
- `BR-95j` Two concurrent DIRECT sales for the last kilogram (after the allocation share is exceeded): one 201, one 409 `SALE_STOCK_CHANGED`; `qty_available` ends at 0, never negative.
- `BR-95k` After DIRECT sales drew stock an ONLINE allocation still counts on, the online checkout's SALE ledger movement over the remainder is 409 `STOCK_UNAVAILABLE` (nothing written, allocation not consumed, stock not negative); a MARKET quote is capped at the shelf quantity, not the allocation; the stored ONLINE `available_qty` is unchanged (no allocation write) while the effective ONLINE availability reads the shelf (BR-100).

---

### BR-96 — The sales dashboard counts only paid-and-completed sales
| | |
|---|---|
| **Source** | Derived rule (not client-signed): owner decisions 2026-10-11, D5, D6; consistent with the revenue definition (BR-63, contradiction 19) |
| **Status** | DERIVED |
| **Layer** | Server-side, `sales` summary query; `GET /sales/summary` (`sales.dashboard.view`) |
| **Scope** | Track 1 |

**Rule.** `GET /sales/summary` counts and sums only orders with `payment_status = PAID` and `status = PICKED_UP` and `completed_at` set, for the DIRECT and MARKET channels, dated by the Asia/Kolkata day of `completed_at`. A pending UPI sale, a failed attempt (`sale_attempts`) and a cancelled sale are excluded. Totals are exact integer paise. The summary is confined to the actor's scope (`own` = their warehouse). Broken down by channel and payment method.

**Failure mode if unenforced.** The dashboard shows revenue for UPI payments that never arrived, or for attempts that rolled back.

**Test contract.**
- `BR-96a` A pending UPI sale is not counted; after `POST /sales/{id}/payments/upi/confirm` it is counted exactly once.
- `BR-96b` A failed sale (stock changed, insufficient wallet, walk-in wallet) appears in `sale_attempts` and never in the dashboard.
- `BR-96c` The summary count and total equal the sum of the `PAID` + `PICKED_UP` rows in `GET /sales` for the same filter, in integer paise.
- `BR-96d` Dates use the Asia/Kolkata day of `completed_at`: a sale completed at 23:59 IST and one at 00:01 IST land on different days.
- `BR-96e` Scope: a Sub admin's summary excludes other warehouses' sales; TOHFA_ADMIN and SUPER_ADMIN see all; MAIN_WH_ADMIN sees `own`.
- `BR-96f` Permission matrix: 401 without a token; 403 for FARMER, FARMER_ADMIN, CUSTOMER; 200 for the four admin roles.
- `BR-96g` Online orders are excluded from this summary (channel filter), and the revenue report (BR-63) is unchanged.

---

### BR-97 — Support replies and reads for the Sub Warehouse Admin strip farmer-identifying internal notes
| | |
|---|---|
| **Source** | Derived rule (not client-signed): owner decision 2026-10-11, D11; extends BR-16 |
| **Status** | DERIVED |
| **Layer** | Server-side, `customers` support-ticket routes; reuses `support.ticket.respond`; `customer.support_history.view`; `support_messages` append-only at the database level (migration 0066) |
| **Scope** | Track 1 |

**Rule.** A Sub Warehouse Admin reads a customer's support tickets (`GET /customers/{customerId}/support-tickets`, `.../{ticketId}`) and replies (`POST .../replies`) (Owner decision 2026-10-11, D11). The reply route is **double-gated** (owner decision 2026-10-11, keep both): `customer.support_history.view` is checked first and its resolved scope decides which customers are visible (BR-91), then `support.ticket.respond` (granted `all` to the warehouse admins, so it never confines anything) authorises the write; the caller needs both. Internal notes, attachments and message bodies that name a farmer (farmer name, farm name, farmer id or code, village, batch code, GPS) are stripped or redacted from every response shape returned to an `own` actor, in the same allow-list manner as BR-16: an internal note that names a farmer is removed; other text has the identity replaced by `[redacted]` and the message flagged `redacted: true`. The reply text and attachment key typed by ANY actor are checked: a reply naming a known farmer identity is **refused** with 422 `VALIDATION_FAILED` (never silently rewritten), so a stored reply cannot carry a farmer identity into a customer-facing thread. Replying to a `CLOSED` ticket is 409 `CONFLICT`. Ticket visibility follows BR-91; out-of-scope is 404, never 403. The reply is a ledger-style append, never an edit of earlier messages, and `support_messages` refuses UPDATE, DELETE and TRUNCATE at the database level. The API reports ticket statuses as `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`; the database stores `INVESTIGATING` for the second and the service maps it to `IN_PROGRESS` (the vocabulary of every admin support API). Message `senderRole` is derived (the table has no role column) and `attachmentUrl` is the stored attachment key; openapi `AdminCustomerSupportMessage` documents both.

**Failure mode if unenforced.** A farmer's identity travels from an internal note to the customer through a support reply.

**Test contract.**
- `BR-97a` A ticket whose internal note contains a farmer name, farm name or farmer id is returned to SUB_WH_ADMIN with that note removed or redacted; asserted recursively for the list, detail and reply responses.
- `BR-97b` A reply posted by SUB_WH_ADMIN is stored and visible on the thread, 201, with the ticket id and author id only; an attempt to reply to a ticket of an out-of-scope customer is 404.
- `BR-97c` A reply body containing a known farmer identity (from the redaction list for that customer and ticket) is refused 422 `VALIDATION_FAILED` with `errors["body.message"]`, for every actor scope; nothing is stored or audited, and the customer-facing thread contains no farmer data (BR-16a).
- `BR-97d` Permission matrix: `GET` tickets requires `customer.support_history.view`; `POST` reply requires BOTH `customer.support_history.view` (checked first, decides visibility) and `support.ticket.respond`; 401 without a token, 403 for FARMER, FARMER_ADMIN and CUSTOMER on these admin routes. The order of the two checks is asserted.
- `BR-97e` TOHFA_ADMIN and SUPER_ADMIN (scope `all`) still see the unredacted internal note (the strip is for the `own` scope; driven by scope, not role).
- `BR-97f` The reply writes one audit row inside the same transaction, containing ids only.
- `BR-97g` Support ticket customer PII follows BR-92: the customer mobile and e-mail in the ticket payload are masked for `own` (the ticket shapes carry no customer contact field at all).
- `BR-97h` (DB level) `UPDATE`, `DELETE` and `TRUNCATE` on `support_messages` are refused (migration 0066, `app_make_append_only`).
- `BR-97i` Replying to a `CLOSED` ticket is 409 `CONFLICT` and stores nothing.

---

### BR-98 — Sale totals use integer paise; GST and the active-customer window come from system_config
| | |
|---|---|
| **Source** | Derived rule (not client-signed): owner decision 2026-10-11, D7; extends CLAUDE.md §2.2 and §2.7 |
| **Status** | DERIVED |
| **Layer** | Server-side, `sales` and `customers` services; `system_config.retail_gst_rate_percent` (default 0), `system_config.active_customer_window_days` (default 90); invoice number counter |
| **Scope** | Track 1 |

**Rule.** All sale arithmetic is in integer paise through `Money`; no float is used at any step (Owner decision 2026-10-11, D7). The GST rate is read from `system_config.retail_gst_rate_percent` (default 0) and never from a constant. GST is computed once per invoice, not per line: `gst = round_half_up(sum_of_line_paise * rate_percent / 100)` in integer arithmetic (add 50 before the integer division by 100 on rate-in-percent times paise), the total is `subtotal + gst`, and the per-line display amounts are informational only and sum to the subtotal exactly. The "active customer" definition used by BR-91 is a customer with a completed order or top-up within `system_config.active_customer_window_days` (default 90) days of now (Asia/Kolkata); "new" is a customer created within the same window. Invoice numbers come from a counter that is gap-free for committed sales, with no collision under concurrency (BR-87h); a rolled-back sale does not consume a number.

**Failure mode if unenforced.** Rs 0.01 rounding drift on every GST sale, a hard-coded 5% or 90-day literal, or invoice numbers with gaps or duplicates that fail an audit.

**Test contract.**
- `BR-98a` With `retail_gst_rate_percent = 0` the total equals the subtotal exactly and `gst` is 0.
- `BR-98b` With a rate of 5 and a subtotal of 1 999 paise, GST is 100 paise (99.95 rounds half up), total 2 099; with 1 990 paise GST is 100 paise (99.5 rounds half up) and with 1 989 paise GST is 99 paise; all values are integers.
- `BR-98c` GST is computed per invoice: two lines of 1 010 paise at rate 5 give GST 101 (from 2 020), not 102 (per-line half-up); the test fails if rounding is per line.
- `BR-98d` Changing `system_config.retail_gst_rate_percent` in the database changes the next quote and sale with no redeploy; a source grep finds no literal rate in the service (CLAUDE.md §2.7).
- `BR-98e` A property test over random lines and rates confirms `total = subtotal + gst` in integers, and `Money` values are strings of integer paise (never a float, never a decimal).
- `BR-98f` `active_customer_window_days` is read from `system_config`: a customer whose last activity is 89 days ago is active at 90 and not at 60; "new" uses the same window on `created_at`.
- `BR-98g` (DB level) Invoice numbers are unique and gap-free across N concurrent sales; a rolled-back sale does not advance the counter (BR-87a, BR-87h).
- `BR-98h` The quote total equals the later `POST /sales` total for unchanged price and stock, to the paise.
- `BR-98i` A missing `system_config` row falls back to the documented default (0 and 90) and logs it, rather than 500 or float arithmetic.

---

### BR-99 — The admin order detail serves every channel, inside the caller's warehouse scope, farm-anonymous and without the handover OTP
| | |
|---|---|
| **Source** | Derived rule (not client-signed): owner decision 2026-10-11 (a general admin order-detail read; `GET /admin/sales/{saleId}` serves only DIRECT and MARKET); extends BR-16, BR-20, BR-30, BR-90 and BR-92 |
| **Status** | DERIVED |
| **Layer** | Server-side, `orders/fulfilment` module: `GET /admin/orders/{orderId}`, permission `order.list.view_all` (existing code); scope predicate in SQL (`warehouseScopeFilter`); allow-list serializer plus a strict response schema |
| **Scope** | Track 1 |

**Rule.** `GET /admin/orders/{orderId}` returns one order of any channel (`ONLINE`, `DIRECT`, `MARKET`, `HORECA`, `B2B`). The warehouse scope is an explicit SQL predicate: scope `all` (SUPER_ADMIN, TOHFA_ADMIN, MAIN_WH_ADMIN) sees every warehouse; `own` for a Sub Warehouse Admin sees only its warehouse; an order at another warehouse returns the same 404 `problem+json` as an unknown id, never 403 (BR-30). A scope that carries a customer or farmer id fails closed (404) on this admin route, so a CUSTOMER, whose `order.list.view_all` grant is `own`, gets 404 here and keeps using `/orders/{id}`. The response is built by an allow-list (`AdminOrderDetail`): order identity, channel, status, fulfilment type, payment method and status, warehouse `{id, name}`, buyer (customer id, code, name, or the walk-in name) with the mobile masked to its last four digits for every scope (BR-92; like `Sale`, this response never carries a full mobile), lines (crop name, grade, kg to 3 decimals, unit price, GST rate and amount, line total), totals as `Money` strings read from the stored order (never recomputed), the latest invoice reference `{id, invoiceNumber, status}` or null, delivery date and slot, `otpRequired` and `otpVerifiedAt`, a timeline of status changes and times, and `placedAt`, `packedAt`, `completedAt`, `cancelledAt`. Never returned, at any depth: `farmerId`, `sourceFarmerId`, farm, village, GPS, FMB, batch or allocation ids or codes (implementer's choice, consistent with `GET /admin/sales/{saleId}`: no batch identifiers at all), the delivery OTP, its hash or the attempt count (BR-20), the delivery address (customer PII, BR-92), and the history note or actor (free text can name a farmer). The read writes no audit row (BR-35 covers mutations).

**Failure mode if unenforced.** A Sub admin reads another warehouse's orders, or learns by a 403 which order ids exist; a counter screen or support agent sees the farmer behind a lot, or the handover OTP that proves delivery.

**Test contract.**
- `BR-99a` An order at another warehouse is 404 for SUB_WH_ADMIN with the same `problem+json` body (ignoring the id and trace id) as an unknown id, never 403; scope `all` and MAIN_WH_ADMIN at `own` with no warehouse see it.
- `BR-99b` The response key set equals the documented set even when the internal record carries farm, batch and OTP fields; the strict schema rejects an unknown key at any depth.
- `BR-99c` The customer mobile and a walk-in mobile are masked to the last four digits for `own` and `all`; no run of five consecutive digits of a stored mobile appears anywhere in the JSON; a missing mobile is null.
- `BR-99d` Totals and line amounts are the stored values as exact `Money` strings (`950.50`, `0.10`, `47.53`), and quantities keep three decimals (`0.125`).
- `BR-99e` Reading a detail writes no `audit_log` row and performs no write.
- `BR-99f` Permission matrix: 401 without a token; 403 for FARMER and FARMER_ADMIN; 200 for SUB_WH_ADMIN (own warehouse), MAIN_WH_ADMIN, TOHFA_ADMIN and SUPER_ADMIN; CUSTOMER gets 403 on this admin route (it holds `none` on `order.list.view_all`, BR-101a), the same for its own order and for an unknown id, so the 403 reveals no row; a malformed id is 422. `GET /:orderId` does not shadow the POST action routes.
- `BR-99g` Each of ONLINE, DIRECT, MARKET, HORECA and B2B is returned, schema-valid, with no farm-identity, batch or OTP key at any depth (recursive scan), and neither the farmer's name nor the batch code from the history notes or batch appears in the JSON.
- `BR-99h` `otpRequired` is true for an unverified OTP order and the plaintext OTP never appears; the invoice reference is present when an invoice exists and null otherwise.
- `BR-99i` (derived, review of 2026-10-13) A DIRECT/MARKET sale cancelled after its UPI payment was captured carries `payment_status = REFUND_DUE` (migration 0068, BR-94i); its detail is 200 with `paymentStatus = REFUND_DUE`, never a 500 from the response schema.

---

### BR-100 — Availability shown to customers and admins never exceeds the shelf
| | |
|---|---|
| **Source** | Derived rule (not client-signed): consequence of the owner decision 2026-10-11 that DIRECT counter sales draw all pooled ACTIVE stock (BR-95, BR-12 interaction note); extends BR-12c, BR-22 and BR-24 |
| **Status** | DERIVED |
| **Layer** | Server-side SQL, one shared fragment (`apps/api/src/db/shelfAvailability.ts`) used by the catalog, cart, allocations and sales-read repos |
| **Scope** | Track 1 |

**Rule.** A DIRECT sale decrements the batch (`qty_available`, through the ledger) but no allocation row, so an allocation's stored `available_qty` (allocated − consumed − reserved) can count stock that is no longer on the shelf. Every read that presents ONLINE or LIVE_MARKET allocation availability therefore uses the **effective** figure: `effective = max(0, min(allocation.available_qty, shelf_free(batch)))`, where `shelf_free(batch) = max(0, qty_available − Σ reserved_qty of all the batch's allocation rows (cart holds, BR-22) − stock held by pending UPI DIRECT and MARKET sales on the batch (BR-94))`. Because one batch carries one row per channel (`UNIQUE (batch_id, channel)`), the per-row cap is the per-batch cap for one channel; a figure summed over channels of one batch (the cart's total-availability breakdown) is capped per batch by `shelf_free`, so the sum never exceeds the shelf. Sites: the customer catalog (`availableQty` in list, detail, search, featured), the cart reservation (it row-locks the batch as well as the ONLINE allocation, and reserves only when the requested quantity is within the effective figure), the cart's 409 breakdown, the admin allocation dashboard (`availableQtyKg`; the stored allocated/consumed/reserved figures are returned unchanged) and the market-day `remainingQtyKg`. BR-12c stands: online availability is ONLINE-bucket stock only, never Reserve; a request above the ONLINE bucket itself is still 409 `INSUFFICIENT_ALLOCATION`, and a request within the bucket but above the effective figure is 409 `STOCK_UNAVAILABLE`. Write semantics are unchanged: no allocation row is written by a read, and a DIRECT sale still writes no allocation row. With no DIRECT sale (and no other ledger movement outside the allocations) the effective figure equals the stored `available_qty`.

**Failure mode if unenforced.** The catalog and cart offer stock a counter sale already took; customers reserve it and build a cart that fails 409 `STOCK_UNAVAILABLE` at checkout; the dashboard and market-day screens tell staff there is stock that is not on the shelf.

**Test contract.**
- `BR-100a` After a DIRECT sale takes 9.5 kg of a 10 kg batch allocated ONLINE 7 / LIVE_MARKET 1 / RESERVE 1 / BUFFER 1, the catalog list, detail, search and featured reads show `availableQty` `0.500`, not `7.000`; after the shelf is fully taken the product is not listed and the detail is 404.
- `BR-100b` In that state a cart add of 1 kg is 409 `STOCK_UNAVAILABLE` with no reservation written; 0.5 kg succeeds; one more gram is then 409 (the shelf is held by the first cart); a request above the ONLINE bucket itself is still 409 `INSUFFICIENT_ALLOCATION` (BR-12c).
- `BR-100c` The allocation dashboard returns `availableQtyKg` `0.500` for the ONLINE row and the stored `allocatedQtyKg`, `consumedQtyKg` and `reservedQtyKg` unchanged; no allocation row is written by the reads.
- `BR-100d` The market-day `remainingQtyKg` is capped by the shelf in the same way (`0.500`, not the LIVE_MARKET allocation's `1.000`).
- `BR-100e` Multi-channel: with cart reservations and pending UPI holds on the batch, the effective ONLINE figure is the shelf minus those claims, and the cart breakdown's total across channels never exceeds the shelf.
- `BR-100f` With no DIRECT sale, catalog, cart, dashboard and market-day figures equal the stored allocation `available_qty` exactly as before.

---

### BR-101 — The admin order queue and order actions are confined by the resolved scope; a customer-owned scope sees nothing
| | |
|---|---|
| **Source** | Derived rule (not client-signed): security fix 2026-10-11; extends BR-30, BR-36 and BR-99 |
| **Status** | DERIVED |
| **Layer** | Server-side, `orders/fulfilment` module: `GET /admin/orders` (`order.list.view_all`) filters in SQL with `warehouseScopeFilter` on the resolved scope; the action routes (`assign-warehouse`, `pack`, `dispatch`, `verify-otp`) also apply `warehouseVisible` after loading the order |
| **Scope** | Track 1 |

**Rule.** `docs/rbac.json` grants CUSTOMER `none` on `order.list.view_all` (customers view their own orders via `/orders` through `order.view_own`), so a CUSTOMER token gets `403 FORBIDDEN` from `requirePermission` on `GET /admin/orders` and detail. In addition, the list is confined by the resolved scope: even if granted or scoped, a scope whose winning role is not warehouse admin or higher fails closed (`FALSE` filter, 404 on detail). Scope `all` (SUPER_ADMIN, TOHFA_ADMIN, MAIN_WH_ADMIN) sees every warehouse; `own` for a Sub Warehouse Admin sees only its warehouse. A `warehouseId` filter only narrows the scope: naming another warehouse (or an unknown id) returns `200` with an empty page, never 403 (BR-30; this replaces the earlier 403 `WAREHOUSE_SCOPE_VIOLATION`). CUSTOMER, FARMER and FARMER_ADMIN hold `none` on the action permissions and get 403 from `requirePermission`; the action services additionally treat a customer- or farmer-owned scope as 404 with nothing written, so a future grant cannot open them. A list item carries only `id`, `orderNumber`, `status`, `channel`, `fulfillmentType`, `warehouseId`, `itemCount`, `totalAmount`, `paymentStatus`, `deliveryDate`, `placedAt`: no farm identity and no buyer PII. The customer-facing `/orders` routes (`order.view_own` and the rest) are unchanged.

**Failure mode if unenforced.** Any customer with the app lists every order of every customer and warehouse (order numbers, totals, channels, warehouses), and a Sub admin learns from a 403 that another warehouse has orders on a given day.

**Test contract.**
- `BR-101a` A CUSTOMER token on `GET /admin/orders` is 403 `FORBIDDEN` (held `none` on `order.list.view_all`); `GET /admin/orders/{orderId}` is 403; `assign-warehouse`, `pack`, `dispatch` and `verify-otp` are 403 and the order row (status, warehouse, OTP attempts) is unchanged; the action services return 404 and write nothing for a customer-owned scope. The same holds for a CUSTOMER token with no customer record (`customerId` null, as every self-registered customer has): the fail-closed follows the resolved role's `scopeDimension` in `docs/rbac.json`, not the presence of a customer id.
- `BR-101b` 401 without a token; FARMER and FARMER_ADMIN get 403 on the list.
- `BR-101c` A Sub admin lists only its warehouse; `warehouseId` of another warehouse is `200` with an empty page, the same body as an unknown warehouse id, never 403.
- `BR-101d` MAIN_WH_ADMIN, TOHFA_ADMIN and SUPER_ADMIN list both warehouses; `warehouseId` narrows to one.
- `BR-101e` A list item's key set equals the documented set; no farm-identity, buyer, mobile, address or OTP key at any depth.

---

### BR-102 — Inter-warehouse transfers move stock only through the ledger, need a high-value approval, and are received by the destination
| | |
|---|---|
| **Source** | Derived rule (not client-signed): warehouse operations backend, October 2026; implements BR-26 and the `stock_transfers` model of `0005_warehouse_inventory.sql`; no requirement document or screen exists |
| **Status** | DERIVED |
| **Layer** | Server-side, `apps/api/src/modules/warehouse-transfers/`; `stock_transfers`, `stock_transfer_items` (`0069_warehouse_operations.sql`); `system_config.transfer_high_value_threshold_paise` |
| **Scope** | Track 1 |

**Rule.**
1. **Create** `POST /warehouse-transfers` needs `transfer.inter_warehouse.initiate` (BR-26: Super Admin and Main only) and an `Idempotency-Key` (a replay returns the original transfer and moves nothing twice; the same key with another body is 409 `IDEMPOTENCY_KEY_REUSED`). The body names a source and a destination warehouse (different, both existing and active, else 422) and 1-50 lines of `{ batchId, qtyKg }` with distinct batches. Every batch must be `ACTIVE` and in the source warehouse (else 422), and `qtyKg` (a positive decimal string, at most 3 decimals) may not exceed the batch's free shelf quantity (`shelfFreeSql`, BR-100: `qty_available` minus cart holds and pending UPI counter sales), else 409 `STOCK_UNAVAILABLE`. A caller whose scope does not reach the source warehouse gets 404.
2. **Value.** Each line snapshots the batch's `cost_per_kg`; its value is `round(qtyKg x cost_per_kg x 100)` integer paise, computed in SQL `numeric`, never a float. The transfer total is the sum, returned as `Money`. A line whose batch has no cost has no value and marks the transfer `hasUnvaluedLines` (UNCONFIRMED: such a transfer always needs approval, so a missing cost can never slip a valuable transfer past the threshold).
3. **Approval.** When the total is at or above `system_config.transfer_high_value_threshold_paise` (seeded 5,000,000 = Rs 50,000, UNCONFIRMED; a missing or unusable row falls back to that figure) or any line is unvalued, the transfer is created `PENDING_APPROVAL` and no stock moves. `POST /warehouse-transfers/{id}/approve` (`transfer.high_value.approve`, Super Admin only; `Idempotency-Key` required) dispatches it. The approver may not be the initiator: 403 `SELF_APPROVAL_FORBIDDEN` (also a DB CHECK). Below the threshold the transfer is dispatched at creation.
4. **Dispatch** (at creation, or at approval) runs in ONE transaction: the batches are row-locked, the free-shelf check is repeated (409 `STOCK_UNAVAILABLE` on any shortfall, nothing written), one `TRANSFER_OUT` ledger row per line (`qty_delta = -qtyKg`, `ref_type = 'STOCK_TRANSFER'`, `ref_id` = transfer) is inserted and referenced as `out_ledger_id`, and the status becomes `IN_TRANSIT` with `dispatched_at`. Stock in transit belongs to no warehouse. No balance column is written by the service (CLAUDE.md 2.3).
5. **Receive** `POST /warehouse-transfers/{id}/receive` (`transfer.inter_warehouse.receive`; `Idempotency-Key` required) only from `IN_TRANSIT`, by a scope that reaches the DESTINATION warehouse: a Sub admin of the source warehouse gets 403 `WAREHOUSE_SCOPE_VIOLATION` (it can already read the transfer, so a 404 would hide nothing), any other Sub admin 404. The body gives `qtyReceivedKg` for EVERY line (0 to `qtySentKg`; more than sent is 422). For each line with a positive quantity a new destination batch is created (same crop, grade, source farmer, cost and expiry as the source batch; `qty_received` = received; code `<source batch code>/<transfer number>`) and one `TRANSFER_IN` ledger row adds the quantity (`in_ledger_id`). A line received short records the variance (`variance_qty`, generated) and sets `hasDiscrepancy`; a `receiptNote` is then required (422 without it). The shortfall is NOT written off automatically (UNCONFIRMED: it is evidence for a later stock adjustment or a BR-103 issue). Status becomes `RECEIVED` with `received_by`/`received_at`. Destination batches get no allocation rows (UNCONFIRMED: they sell as pooled DIRECT stock until allocated through the allocation tools).
6. **Cancel** `POST /warehouse-transfers/{id}/cancel` (`transfer.inter_warehouse.initiate`) with a required `reason`, only from `PENDING_APPROVAL` (no stock has moved). An `IN_TRANSIT` or later transfer is 409 `INVALID_STATE_TRANSITION`: once dispatched it can only be received.
7. **Reads** `GET /warehouse-transfers` and `GET /warehouse-transfers/{id}` need `transfer.inter_warehouse.view`. A Sub admin sees only transfers whose source OR destination is its warehouse; any other transfer and an unknown id are the same 404. Filters: `status`, `warehouseId` (either side; another warehouse for a Sub admin is an empty page), `direction` (`INBOUND` / `OUTBOUND`, relative to `warehouseId`, which it then requires). Lines carry batch id and code, crop id, grade, quantities, value and destination batch, never a farmer id.
8. Every state change (create, approve, cancel, receive) writes one audit row in the same transaction, masked: ids, status, warehouse ids, line count and total paise; never the notes, reason or receipt note. Illegal transitions are 409 `INVALID_STATE_TRANSITION` and write nothing.

**Failure mode if unenforced.** Stock is double-counted in transit or lost between two ledgers, a Sub admin empties its own warehouse (BR-26), a valuable transfer is self-approved, or a shortfall at the destination disappears without a trace.

**Test contract.** (`apps/api/src/modules/warehouse-transfers/warehouse-transfers.test.ts`)
- `BR-102a` Create body validation: distinct warehouses, 1-50 distinct lines, positive decimal-string quantities, strict body; `Idempotency-Key` is required.
- `BR-102b` Below the threshold a transfer is created `IN_TRANSIT` and one `TRANSFER_OUT` row per line is written in the same transaction; a quantity above the free shelf is 409 `STOCK_UNAVAILABLE` and writes nothing.
- `BR-102c` At or above the threshold (read from `system_config`, fallback when missing) or with an unvalued line it is `PENDING_APPROVAL` and no ledger row is written; the value is exact integer paise.
- `BR-102d` Approve: only from `PENDING_APPROVAL`; the initiator is 403 `SELF_APPROVAL_FORBIDDEN`; a successful approval dispatches (ledger rows, `IN_TRANSIT`).
- `BR-102e` Receive: only `IN_TRANSIT`; every line required; over-receipt 422; short receipt needs a note, flags the discrepancy and records the variance; one `TRANSFER_IN` row per positive line into a new destination batch.
- `BR-102f` Receive scope: a Sub admin of the destination receives; of the source gets 403 `WAREHOUSE_SCOPE_VIOLATION`; of an unrelated warehouse gets 404.
- `BR-102g` Cancel: only `PENDING_APPROVAL`, reason required; `IN_TRANSIT` is 409 `INVALID_STATE_TRANSITION`.
- `BR-102h` Reads: a Sub admin sees only transfers touching its warehouse; another and an unknown id are the same 404; no farmer id in any response.
- `BR-102i` One masked audit row per state change, in the same transaction; replaying an `Idempotency-Key` writes no second ledger or audit row.
- `BR-26a` / `BR-26b` TOHFA Admin and a Sub admin get 403 on create (asserted again in this file through the real router).

---

### BR-103 — Warehouse operational issues are warehouse-scoped, move along fixed transitions, and are audited without their free text
| | |
|---|---|
| **Source** | Derived rule (not client-signed): warehouse operations backend, October 2026; no requirement document or screen exists |
| **Status** | DERIVED |
| **Layer** | Server-side, `apps/api/src/modules/warehouse-ops/` (issues); `warehouse_issues`, `warehouse_issue_comments` (`0069_warehouse_operations.sql`) |
| **Scope** | Track 1 |

**Rule.**
1. An issue belongs to one warehouse and has an `issue_number` (`WI-000001`, from a sequence), a `category` (`EQUIPMENT`, `STORAGE`, `QUALITY`, `SAFETY`, `STAFFING`, `OTHER`), a `severity` (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), a title (1-160), an optional description (up to 4000), a status, the reporter, an optional assignee and, once resolved, a resolution note. Categories and severities are fixed lists (UNCONFIRMED).
2. Reads (`warehouse.issue.view`) and writes (`warehouse.issue.manage`) are warehouse-scoped: Super Admin, TOHFA Admin and Main reach every warehouse; a Sub admin only its own (`own`, UNCONFIRMED: it runs the warehouse day to day, so it reports and works its own issues). Another or an unknown warehouse, and an issue id that is not in the named warehouse, are the same 404.
3. Status transitions: `OPEN -> IN_PROGRESS | RESOLVED`; `IN_PROGRESS -> OPEN | RESOLVED`; `RESOLVED -> CLOSED | IN_PROGRESS` (reopen, which clears `resolved_by`/`resolved_at`); `CLOSED` is terminal. Anything else is 409 `INVALID_STATE_TRANSITION`. Moving to `RESOLVED` needs a `resolutionNote` (422 without it). Closing needs no extra role (UNCONFIRMED).
4. The assignee must be an active user with a live role assignment whose role holds `warehouse.issue.manage` at `all` or `own` (read from `role_permissions`, the projection of `docs/rbac.json`, never from a list of role names; `view` and `conditional` do not qualify) and that reaches the warehouse by the role's `scopeDimension`: none (today Super Admin, TOHFA Admin, Main) reaches every warehouse, `warehouse_id` (Sub admin) only its assigned warehouse, any other dimension none. With today's grants that is a live Super Admin, TOHFA Admin or Main assignment, or a live Sub admin assignment to THIS warehouse; anyone else is 422. `null` unassigns.
5. Comments are an append-only thread (`warehouse_issue_comments`, UPDATE/DELETE refused by the database); a `CLOSED` issue takes no new comment (409 `INVALID_STATE_TRANSITION`).
6. Every create, change and comment writes one audit row in the same transaction. The image carries the issue number, category, severity, status and assignee id only, never the title, description, resolution note or comment body; `changedFields` names what changed. A change that alters nothing writes and audits nothing. Nothing is ever deleted.

**Failure mode if unenforced.** A Sub admin reads or closes another warehouse's issues, an issue is "resolved" with no record of how, a closed issue silently reopens, or a name typed into a description leaks through the audit log.

**Test contract.** (`apps/api/src/modules/warehouse-ops/warehouse-issues.test.ts`)
- `BR-103a` Create/update/comment/list body and query validation (fixed enums, lengths, strict bodies, paging).
- `BR-103b` Scope: a Sub admin lists, reads and writes its own warehouse; another and an unknown warehouse are the same 404; an issue under the wrong warehouse is 404.
- `BR-103c` Every legal transition succeeds and every illegal one is 409 `INVALID_STATE_TRANSITION` with nothing written; `RESOLVED` needs a note; reopen clears the resolver.
- `BR-103d` The assignee rule: a Sub admin of another warehouse, a non-admin and an unknown user are 422; `null` unassigns; eligibility follows the `warehouse.issue.manage` grant (withdrawing a role's grant, or making it `view`, makes that role unassignable; a Sub widened to `all` still reaches only its own warehouse).
- `BR-103e` Comments are append-only and refused on a `CLOSED` issue.
- `BR-103f` One masked audit row per change in the same transaction (no free text); a no-op writes nothing.
- `BR-103g` 401 without a token; 403 for farmer, customer and Farmer Admin on every route.

---

### BR-104 — The warehouse activity feed is a read-only, scoped merge of existing records
| | |
|---|---|
| **Source** | Derived rule (not client-signed): warehouse operations backend, October 2026; no requirement document or screen exists |
| **Status** | DERIVED |
| **Layer** | Server-side, `apps/api/src/modules/warehouse-ops/` (activity): one `UNION ALL` query in the repo; no table of its own |
| **Scope** | Track 1 |

**Rule.**
1. `GET /warehouses/{id}/activity` (`warehouse.activity.view`; Sub admin `own`) returns the warehouse's events newest first: `STOCK_MOVEMENT` (each `stock_ledger` row, with its movement type and signed kg), `GOODS_RECEIPT` (each goods receipt, at `received_at`), `TRANSFER` (each transfer sent or received by the warehouse, at its creation, with the current status and the direction), `ISSUE` (each BR-103 issue, at creation, with its current status and severity), `RETURN` (each return request against the warehouse's orders, at creation) and `DOCUMENT` (each BR-105 document, at creation).
2. **Why a UNION, not an activity table (UNCONFIRMED design choice).** Every event already exists as an immutable row with an immutable timestamp in a table that is the source of truth. A separate `warehouse_activity` table would be a second copy that every writer (goods receipts, sales, returns, transfers ...) must remember to fill in the same transaction, and one forgotten writer makes the feed silently incomplete. The UNION cannot drift from the records, needs no change to any other module, and each branch is served by an existing `(warehouse_id, created_at)`-style index with a per-branch `LIMIT`.
3. Each event is anchored to a timestamp that never changes (creation or receipt time), so keyset paging is stable: the cursor is an opaque encoding of `(occurredAt, type, sourceId)` of the last row, the order is `occurredAt DESC, type DESC, sourceId DESC`, and a page never repeats or skips a row. A malformed cursor is 422. `limit` is 1-100 (default 20).
4. Filters: `type` (one or more of the six types), `from`/`to` (inclusive Asia/Kolkata dates, `from <= to`, span capped by `system_config.report_max_range_days`, fallback 366).
5. An event carries `type`, `sourceId`, `occurredAt`, a `reference` (ledger movement type, GRN number, transfer number, issue number, return id or document type), `status` and `qtyKg` where they apply, `direction` for a transfer, and `actorId` where the source row records one. It never carries a farmer id, customer data or any free text (titles, notes, reasons).
6. Another or an unknown warehouse is the same 404. There is no write route; reading writes nothing.

**Failure mode if unenforced.** A Sub admin reads another warehouse's movements, the feed shows a different history from the ledger, or free text and farmer identity leak into a feed screen.

**Test contract.** (`apps/api/src/modules/warehouse-ops/warehouse-activity.test.ts`)
- `BR-104a` Query validation: types, real dates with `from <= to`, span cap, `limit` 1-100, malformed cursor 422, strict query.
- `BR-104b` Each of the six sources appears with its documented fields, newest first, and only for the requested warehouse.
- `BR-104c` Cursor paging over a fixed fixture returns every event exactly once across pages.
- `BR-104d` The type and date filters narrow the result.
- `BR-104e` Scope: another and an unknown warehouse are the same 404 for a Sub admin; 401 without a token; 403 for farmer, customer and Farmer Admin.
- `BR-104f` No event carries a farmer id, customer data or free text; reading writes nothing and there is no write route.

---

### BR-105 — Warehouse documents are scoped metadata over an uploaded file, with a derived expiry status, archived never deleted
| | |
|---|---|
| **Source** | Derived rule (not client-signed): warehouse operations backend, October 2026; closes BR-80 item 3 ("warehouse documents not built"); no requirement document or screen exists |
| **Status** | DERIVED |
| **Layer** | Server-side, `apps/api/src/modules/warehouse-ops/` (documents); `warehouse_documents` (`0069_warehouse_operations.sql`); `system_config.warehouse_document_expiry_warning_days`; the file is an `uploads` row signed through `POST /uploads/sign` with purpose `WAREHOUSE_DOCUMENT` |
| **Scope** | Track 1 |

**Rule.**
1. A document belongs to one warehouse and has a `docType` (`LICENSE`, `FSSAI`, `FIRE_SAFETY`, `LEASE`, `INSURANCE`, `OTHER`; fixed list, UNCONFIRMED), a title (1-160), an optional document number (up to 80), optional issue and expiry dates (`expiryDate >= issueDate`), the file (`uploadId`), and who uploaded it.
2. The file is an existing, non-deleted `uploads` row that the caller itself uploaded; another user's upload, a deleted one or an unknown id is 422 on `body.uploadId`. One upload backs at most one live document (409 `CONFLICT`). The file is never public; `GET` one document returns a short-lived signed `fileUrl`, the list does not.
3. **Status is derived at read time, never stored:** `ARCHIVED` when archived; otherwise `EXPIRED` when `expiryDate` is before today (Asia/Kolkata); `EXPIRING_SOON` when it is within `system_config.warehouse_document_expiry_warning_days` days (seeded 30, UNCONFIRMED; fallback 30 when the row is missing or unusable), the boundary day included; otherwise `ACTIVE` (including a document with no expiry date).
4. Reads need `warehouse.document.view` (Sub admin `own`); writes need `warehouse.document.manage` (Super Admin, TOHFA Admin and Main; Sub admin none, UNCONFIRMED: licences, leases and insurance are warehouse master data, as BR-79/BR-80). Another or an unknown warehouse, and a document id under the wrong warehouse, are the same 404.
5. `PATCH` edits `docType`, `title`, `documentNumber`, `issueDate`, `expiryDate` and may replace the file (`uploadId`, a renewal); at least one field; strict body. An archived document cannot be edited (409 `INVALID_STATE_TRANSITION`). `POST .../archive` archives once (a repeat is a 200 no-op that writes nothing). There is no delete and no un-archive (UNCONFIRMED).
6. The list filters by `docType` and derived `status` (`ACTIVE`, `EXPIRING_SOON`, `EXPIRED`, `ARCHIVED`), excludes archived documents unless `status=ARCHIVED` is asked for, and orders by expiry date (soonest first, no expiry last), then title.
7. Every create, edit and archive writes one audit row in the same transaction, masked: doc type, dates, archived flag and upload id, never the title or document number; `changedFields` names what changed. A no-op writes nothing.

**Failure mode if unenforced.** A lapsed fire-safety certificate shows as valid because a stored status was never refreshed, a Sub admin reads another warehouse's lease, a document points at someone else's file, or deleting a record destroys compliance evidence.

**Test contract.** (`apps/api/src/modules/warehouse-ops/warehouse-documents.test.ts`)
- `BR-105a` Body and query validation: fixed doc types, lengths, real dates with expiry not before issue, strict bodies, at least one field on `PATCH`.
- `BR-105b` The derived status for no expiry, far expiry, the warning boundary day, yesterday, and archived; the window comes from `system_config` with the documented fallback.
- `BR-105c` The upload rule: another user's, a deleted and an unknown upload are 422; a reused upload is 409.
- `BR-105d` Scope: a Sub admin reads its own warehouse and gets the same 404 for another and an unknown warehouse; a Sub admin is 403 on every write.
- `BR-105e` Edit changes only the given fields; an archived document is 409 on edit; archive is once and a repeat writes nothing.
- `BR-105f` The list filters by type and derived status and excludes archived rows by default.
- `BR-105g` One masked audit row per change in the same transaction (no title, no document number); a no-op writes nothing.

---

## Open contradictions — DO NOT GUESS

| # | Topic | Requirements v1.0 says | Role & Feature Matrix v1.0 says | Codebase default | Status |
|---|---|---|---|---|---|
| 1 | Audit scoring scale (BR-04) | §2.1: "max 100 points" and tiers `<650 / 650-700 / 700-749 / 750+` in the same bullet | §9 repeats both verbatim | `rating_tier_config` now carries a second, later-`effective_from` generation with the client-confirmed 0-100 bands (`POOR`<50, `MODERATE` 50-69, `GOOD` 70-84, `EXCELLENT`>=85); the 2025-01-01 placeholder rows are kept as history, not read by `resolveTierForScore` any more | resolved for Farm Rating (BR-06), recorded for completeness |
| 2 | Automation (BR-38) | FR-F06/FR-F07: auto-reminders, system-suggested treatments, weather risk indicators; §2.2 automatic B2B/Horeca allocation | Principle 5: "All data is entered manually... No automated processes" | No advisory automation; only the three rule-enforcement jobs | requires client confirmation |
| 3 | Fulfilment model (BR-21) | §2.3 doorstep OTP at delivery hub, FR-C04 delivery slots + out-for-delivery, FR-A04 driver performance, module 14 drivers | Principle 9: "All orders fulfilled via warehouse pickup"; no driver or fleet feature anywhere | Pickup + 4-digit OTP only; delivery slot fields modelled but unused; no driver entity | requires client confirmation |
| 4 | Audit log scope for Main Warehouse Admin | §6.4: `View audit logs` MW = `Own` | §15: `View system audit logs` MW = `View` (all) | MAIN_WH_ADMIN = `own` (Ch.6 precedence) | requires client confirmation |
| 5 | Set warehouse capacity | §6.2: SA = Y, TA = Y, MW = Y | §7: SUPER_ADMIN only; TA = N, MW = N | SA/TA/MW may set (Ch.6 precedence); matrix is stricter. MW = all; the new capacity is not checked against current stock (BR-66) | requires client confirmation |
| 6 | Wallet write authority for MW/SW | §6.3 `Wallet management (customers)`: MW = Y, SW = Own | §8: manual credit/debit is SA/TA only; MW/SW get view | MW = all, SW = own (Ch.6 precedence) — the loosest reading of a money-moving grant | requires client confirmation, priority |
| 7 | Bank refunds for MW/SW | §6.3 `Process returns (RMA)`: MW = Y, SW = Y (blanket) | §6: bank refund SA/TA only; MW/SW limited to wallet refunds | Bank refund restricted to SA/TA (matrix adds detail Ch.6 omits) | requires client confirmation |
| 8 | Integration keys and raw DB export | §6.4 + FR-A01: SUPER_ADMIN manages integration keys and has emergency raw DB export, audit-logged | §15 + Principle 11: both are infra-level (EXT); no role manages them in-app | Permissions retained SA-only; no admin UI built | requires client confirmation |
| 9 | COD vs wallet-first (BR-17) | §2.3 wallet-first; FR-C04 payment methods include COD; Ch.11 open decision 17 asks whether COD is supported at all | Principle: wallet-first checkout enforcement; no COD row | Wallet-first only; COD not implemented (unchanged by the Sub Warehouse sales work of 2026-10-11, BR-85 to BR-98: a counter CASH sale is not COD) | requires client confirmation |
| 10 | B2B/Horeca allocation source (BR-13) | §2.2: automatic from consolidated inventory | §7: `Manage B2B/Horeca Manual allocation`, SA/TA full | Neither; B2B/Horeca order paths return 501 | requires client confirmation |
| 11 | Pickup OTP disclosure (BR-20) | FR-C05: "4-digit OTP shared with warehouse staff" | §6: `OTP shared with warehouse staff` = F for MW/SW and CU | OTP is customer-held; the verifying admin never receives it | requires client confirmation |
| 12 | Farmer application approval by Farmer Admin | §6.1 `Approve farmer applications`: FA = View | §2: `Approve farmer application` FA = N, with a separate view-only queue row | FA has read-only access, no approval path (behaviourally identical) | resolved, recorded for completeness |
| 13 | Object storage vendor | Ch.7/Ch.9: Azure Blob or Cloudinary | §15: AWS S3 or Cloudinary | Storage access is behind one adapter interface; no vendor SDK in domain code | requires client confirmation |
| 14 | Certificate eligibility for listing (BR-01 vs BR-02) | §2.1, as transcribed into this file, gave two different tests: BR-01 blocked a farmer "whose certifications are **all** expired", BR-02 refused listing "while a farmer has no verified, unexpired PGS or NPOP certificate". The listing gate implemented neither: it refused if ANY single certificate was expired or unverified, so an old expired certificate or a pending renewal blocked a farmer who held a valid one | Not the source of the conflict (BR-02 cites §9 / P7 only for manual verification) | Eligibility is per farmer: listing is allowed iff at least one certificate is VERIFIED, unexpired (`expires_on` >= Asia/Kolkata today) and PGS/NPOP; other expired, pending or rejected certificates never block. BR-01 and BR-02 are reworded so BR-02 is the governing test and BR-01 a subset of it. When nothing qualifies: `CERT_UNVERIFIED` if an unexpired certificate awaits verification, otherwise `CERT_EXPIRED` if one has expired, otherwise `CERT_MISSING`. **Gap closed 2026-10-05:** with no certificate at all, or only unexpired `REJECTED` ones, the live gate used not to refuse; only `farmers.is_market_blocked` did (`CERT_EXPIRED`, "Farmer market access is currently blocked."), so a farmer whose flag was false with no qualifying certificate (seeded or stale data) could still list. The gate now refuses these itself with 422 `CERT_MISSING` (BR-02f, BR-02g), whatever the flag says; the flag is still checked after it. `PATCH /listings/{id}` and admin approval have never checked certificates; still unchanged | **Resolved 2026-10-05** (user-confirmed: a valid certificate permits listing; a pending renewal must not block; a farmer with no certificate, or only rejected ones, must be refused with its own error). Still open: whether the edit path (`PATCH /listings/{id}`) and admin approval should check certificates |
| 15 | Soil classification bands (BR-40) | Not specified | Not specified | BR-40 says the bands live in `system_config`, but no authoritative values exist. Seven keys are read: `soil.classification.organic_carbon`, `.ph`, `.ec`, `.tds`, `.nitrogen`, `.phosphorus`, `.potassium`, each `{low, high, belowLabel, insideLabel, aboveLabel}`. The soil repo answers 503 naming the missing keys. The unit-test mock `BANDS` values are only proposals | requires owner to supply the values |
| 16 | BR-53 display-only vs payout destination (BR-70) | Not specified | Not specified | BR-53 item 1: an account with a null `account_number_token` is display-only and cannot be a payout destination. Taken literally no account could be attached to a payout, which contradicts BR-53 item 4. Tokenisation is an open owner decision, so BR-70 checks ownership and soft-delete only and does not enforce this | requires owner decision (tokenisation) |
| 17 | Registration submit threshold (BR-69) | Spec: "GPS/FMB boundary — GPS capture with manual lat/lng fallback" | Not specified | Submit requires at least one farm location with a boundary or a GPS position (plus `ID_PROOF` and `FARM_DOC`). This is the implementer's reading of the spec. Whether `aadhaarLast4` and `dob` are required at submit is not decided | requires product confirmation |
| 19 | Revenue definition (BR-63) | No definition of "revenue" for finance reports | No definition | Orders with `payment_status = PAID`, `status IN (DELIVERED, PICKED_UP)` and `completed_at` not null, dated by the Asia/Kolkata day of `completed_at`; the database `order_status` enum has no `COMPLETED` value | requires client confirmation |
| 20 | Interim permission codes (BR-64, BR-65) | Not stated | No dedicated codes for these reads | Receiving report gated by `inventory.goods_receipt.record`; cash top-up report by `wallet.cash_topup.process`; system messages by `notification.own.view` / `notification.own.mark_read` | requires client confirmation |
| 21 | Sales report order statuses (BR-64) | Not stated | Not stated | The sales report counts every order status; it does not filter to completed or paid orders (unlike revenue, BR-63) | requires client confirmation |
| 24 | Sub Warehouse Admin cap and deactivation (BR-25, BR-81) | BR-25: "5 incl. standby" | Not stated | Read as 5 live admins per warehouse (`sub_wh_admin_max_per_warehouse`), not 5 platform-wide. No permission defines who may deactivate a Sub Warehouse Admin, so deactivation is not built | requires owner confirmation |
| 25 | Task/alert thresholds and gating (BR-77, BR-78) | Not stated | Not stated | `alert_batch_expiry_days` 7, `alert_capacity_utilization_percent` 90 (and `alert_snooze_max_hours` 168) seeded by `0052` are placeholders. `task.own.view` / `alert.own.view` are not gated per source: a user sees a task even if their role cannot act on it | requires owner values and decision |
| 26 | Export permission for Main and CSV layout (BR-76) | Not stated | `report.export.file` MW = `view` | `view` is allowed to export, while SPEC_GAPS #11 says the screens hide Export for `view`. The CSV column layout (long format, sections for aggregates) is the implementer's choice | requires owner confirmation |
| 27 | New permission codes (BR-74, BR-77, BR-79, BR-80, BR-82, BR-83, BR-84) | Not stated | No such rows | Added to `docs/rbac.json` as spec gaps pending owner approval (12 codes; `finance.expense.approve` and `finance.expense_category.manage` were removed on 2026-10-11 with BR-73): `finance.cash_close.manage`, `task.own.view`, `alert.own.view`, `warehouse.storage_location.manage`, `warehouse.profile.edit`, `auth.profile.edit_own`, `notification.own.admin_preferences`, `help.article.view`, `help.article.manage`, `admin.staff.manage`, `admin.staff.attendance.view`, `admin.staff.attendance.mark` | requires owner approval |
| 28 | Admin notification categories (BR-82) | Not stated | Not stated | The 14 admin categories are stored preferences only: no admin domain event maps to them yet, so toggling one suppresses nothing | requires owner decision (event mapping) |
| 29 | Sub Warehouse sales and customers surface (BR-85 to BR-98) | Not stated | No such rows | Decisions D1-D11 were approved by the owner on 2026-10-11; the codes, error codes and schema below are the implementer's names for them and were **approved by the owner on 2026-10-11**, on condition that implementation, database and documentation agree (reconciled the same day: openapi enums now list `DISPATCHED` and wallet `CLOSED`; derived issue/ticket fields documented in BR-91h and BR-97; `support_messages` made append-only by migration 0066; `order_number_seq` owned by migration 0065; the reply route's double gate `customer.support_history.view` + `support.ticket.respond` kept by owner decision). New permission codes added to `docs/rbac.json` as spec gaps (12): `customer.detail.view`, `customer.purchase_history.view`, `customer.wallet.view`, `customer.issues.view`, `customer.support_history.view`, `sales.sale.create`, `sales.history.view`, `sales.dashboard.view`, `sales.market_day.view`, `sales.horeca.view`, `sales.b2b.view`, `payment.record` (Sub = `own`, Super Admin and TOHFA Admin = `all`, Main = `own` on the `*.view` codes and `none` on `sales.sale.create` and `payment.record`; Farmer Admin, Farmer, Customer = `none`). New error codes: `SALE_PRICE_CHANGED` (409), `SALE_STOCK_CHANGED` (409), `WALKIN_WALLET_NOT_ALLOWED` (422), `PAYMENT_PENDING` (409), `PAYMENT_AMOUNT_INSUFFICIENT` (422), and `SALE_CHANNEL_NOT_SUPPORTED` (501) only if no existing not-implemented code applies. New schema (migrations 0059+): `orders.channel` value `DIRECT`; `orders.customer_id` nullable with `walk_in_name`, `walk_in_mobile` and the one-identity CHECK; `sale_payments`; append-only `sale_attempts`; the gap-free invoice number counter; `system_config` keys `retail_gst_rate_percent` (0) and `active_customer_window_days` (90). Existing codes reused: `customer.list.view`, `support.ticket.respond`. D9 (masked mobile for `own` scope) overrules BR-64d for the customer list and detail only; the customers report keeps BR-64d. GST rounding (per invoice, half-up) is the implementer's choice. COD behaviour (contradiction 9) is unchanged by this work: no COD payment method exists in a sale | **Resolved 2026-10-11** (decisions and codes approved by the owner) |

---

## Rules NOT enforced in Track 1

Chapter 2 contains roughly 33 discrete client-locked rules. Track 1 enforces 14 of them server-side with tests (BR-01, BR-02, BR-04, BR-06, BR-07, BR-08, BR-10, BR-11, BR-12, BR-16, BR-17, BR-18/BR-19, BR-20, BR-28/BR-29/BR-30/BR-31). The rest are listed here so the gap is a decision, not a surprise.

| # | Rule | Source | Rule ID | Why not enforced in Track 1 |
|---|---|---|---|---|
| 1 | 4 audits per year, one per quarter | §2.1 | BR-03 | Moved into Track 1 on 2026-10-01 (Audit module; see BR-03) — row kept for history |
| 2 | Major violation red-flag threshold | §2.1 | BR-05 | Count and manual flag are stored (Track 1, 2026-10-01); the automatic red-flag rule stays deferred because the rule as written is inverted |
| 3 | Farmer-side certification entry, renewal tracking, expiry countdown | §2.1 | BR-01/BR-02 | Enforcement is server-side in Track 1, but the farmer-facing entry screens ship with the Farmer app (Track 2) |
| 4 | B2B/Horeca allocation from consolidated inventory | §2.2 | BR-13 | Only the Online channel is in scope; source contradiction unresolved |
| 5 | Four sales channels | §2.2 | BR-15 | Amended 2026-10-11 (owner decision D1): Market, and the new Direct channel, are now enforced for the Sub Warehouse Admin through BR-85 and BR-95 (row kept for history). Horeca and B2B creation are still not enforced (501); each needs its own order, pricing and invoicing path |
| 6 | Farmer subscription Rs 500/year and free-tier limits | §2.2 | BR-14 | Billing module is Phase 2; free-tier limits are undefined in both documents |
| 7 | Dual fulfilment / home delivery with slots | §2.3 | BR-21 | Pickup path only; delivery model is contested (contradiction 3) |
| 8 | Live order tracking beyond packed/picked-up | FR-C04 | — | Dispatch and out-for-delivery states belong to the delivery model that is not in scope |
| 9 | Rate & review, tags, one-tap reorder | FR-C05 | — | Customer app Phase 5 screens; no backend dependency in the golden thread |
| 10 | RMA issue category taxonomy, customer support-ticket lifecycle | FR-C05, matrix §6 | — | The return/inspect/approve/refund workflow itself is now enforced (BR-61, `apps/api/src/modules/returnRequests/`); a free-text `reason` stands in for a structured issue-category list, and the bank refund is a status + manual hand-off, not a tracked ticket. Issue categories and a support-ticket lifecycle around that are still Phase 2-3 |
| 11 | Each warehouse has its own Sub Warehouse Admin (5 incl. standby) | §2.4 | BR-25 | Modelled in `user_roles`; no staffing management UI |
| 12 | Main Warehouse Admin oversees all 4 warehouses | §2.4 | — | RBAC grants exist; the consolidated MW dashboard is Phase 3 |
| 13 | Inter-warehouse transfers restricted to MW + SA | §2.4 | BR-26, BR-102 | Backend built 2026-10-12 as DERIVED rule BR-102 (create, high-value approval, dispatch, receive with shortfall, cancel, scoped reads); the high-value threshold and the shortfall handling are UNCONFIRMED defaults. No UI in this scope |
| 14 | Warehouse capacity limits and quotas/targets | §6.2, FR-A04 | — | Contested authority (contradiction 5); no capacity model until resolved |
| 15 | Stock verification (physical count vs system) | §6.2 | — | Ledger supports it; the counting workflow and variance report are Phase 2 |
| 16 | Quality counter-offer at goods receipt | matrix §7 | BR-10 | Repaired 2026-10-11 as an UNCONFIRMED default: it is a round of the listing negotiation (shares the 4-round limit and the one-PENDING-offer rule); what happens to the receipt, purchase order and payout after the farmer answers is not specified (see the BR-10 note) |
| 17 | Market day scheduling per warehouse | matrix §5 | — | Belongs to the Market sales channel, which is Phase 3 |
| 18 | GDPR data export and account deletion requests | matrix §15 | — | Absent from the Requirements document entirely; needs a retention policy first, which no document states |
| 19 | Advisory automation (reminders, treatments, weather risk) | FR-F06/F07 | BR-38 | Blocked on contradiction 2 — do not build either way until the client answers |

Farm rating, 10 categories x 10 points (BR-06), its Farmer-Admin-own-zone edit predicate, and the Farm Rating tier scale (BR-04) moved OUT of this table and into Track 1 on 2026-09-17 — see BR-04 and BR-06 above and `apps/api/src/modules/farm-ratings/`. The Farmer-Admin edit predicate went away on 2026-10-01 with the manual rating edit itself (ratings now come from completed INTERNAL audits only).

The RMA return/inspect/approve/refund workflow (BR-61) moved OUT of this table and into Track 1 on 2026-10-07 — see BR-61 above and `apps/api/src/modules/returnRequests/`. Row 10 above is narrowed accordingly: issue-category taxonomy and the support-ticket lifecycle remain deferred, the refund workflow does not.
