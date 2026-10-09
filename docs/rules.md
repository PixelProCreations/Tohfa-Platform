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
| **Status** | LOCKED |
| **Layer** | Server-side, order service; `orders.channel` enum |
| **Scope** | Deferred |

**Rule.** The platform sells through exactly four channels: Online, Market (live market day), Horeca, B2B. Every order carries its channel. Track 1 implements Online only; the other three are rejected rather than silently treated as Online.

**Failure mode if unenforced.** Channel revenue reporting and allocation both become unattributable, and GST treatment (inclusive for retail, exclusive for B2B) is applied to the wrong orders.

**Test contract.**
- `BR-15a` `orders.channel` is non-nullable and constrained to the four values.
- `BR-15b` An order created with channel `b2b` in Track 1 → 501, not an Online order.

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
| **Scope** | Deferred (ledger type exists; no endpoint in Track 1) |

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

### BR-61 — Farmer listing writes are idempotent (Idempotency-Key)
| | |
|---|---|
| **Source** | `docs/openapi.yaml` `IdempotencyKeyHeader` (required on these POSTs); root `CLAUDE.md` §2.4. Specification gap closed 2026-10-09: the header was declared but ignored. |
| **Status** | DERIVED |
| **Layer** | Server-side, `apps/api/src/http/idempotency.ts` over `idempotency_keys` (`0045_listing_idempotency.sql`), used by `listings.service.ts` and `counter-offers.service.ts` |
| **Scope** | Track 1 |

**Rule.** `POST /listings`, `POST /listings/{id}/withdraw` and the farmer counter-offer responses (`accept`, `reject`, `counter`) require an `Idempotency-Key`. A missing or blank key is 422 `VALIDATION_FAILED`. Replaying a key with the same request by the same user returns the original response and writes no second row, audit row or notification. The same key with a different request (different body, target or operation) is 409 `IDEMPOTENCY_KEY_REUSED`. Keys are scoped to the acting user, so two users may use the same key string. The claim is made in the same transaction as the operation, so a refused or failed attempt leaves no claim and parallel requests with one key run the operation once. Keys are retained 24 hours (the spec's figure). The admin listing operations (`approve`, `reject`, `counter-offers`) are not covered yet: their only client, admin-web, sends no key.

**Failure mode if unenforced.** A mobile retry after a dropped response creates a duplicate listing or counter round, or turns a successful withdraw/accept into a spurious 409 the farmer reads as failure.

**Test contract.** (`apps/api/src/modules/listings/listing-idempotency.test.ts`, `counter-offers.test.ts`)
- `BR-61a` Missing, empty or blank key on each of the five operations → 422 `VALIDATION_FAILED` naming `header.Idempotency-Key`; nothing is written.
- `BR-61b` A replay returns the original body with no second row, audit row or round; a replayed withdraw is not `LISTING_NOT_PENDING`.
- `BR-61c` The same key with a different body or on a different operation → 409 `IDEMPOTENCY_KEY_REUSED`; nothing more is written.
- `BR-61d` Five parallel requests with one key run the operation exactly once and all return its result.
- `BR-61e` Different users using the same key string do not collide.
- `BR-61f` A refused attempt is not remembered; the key works once the cause is fixed.
- `BR-61g` A key older than 24 hours is released for a new request.

---

## Open contradictions — DO NOT GUESS

| # | Topic | Requirements v1.0 says | Role & Feature Matrix v1.0 says | Codebase default | Status |
|---|---|---|---|---|---|
| 1 | Audit scoring scale (BR-04) | §2.1: "max 100 points" and tiers `<650 / 650-700 / 700-749 / 750+` in the same bullet | §9 repeats both verbatim | `rating_tier_config` now carries a second, later-`effective_from` generation with the client-confirmed 0-100 bands (`POOR`<50, `MODERATE` 50-69, `GOOD` 70-84, `EXCELLENT`>=85); the 2025-01-01 placeholder rows are kept as history, not read by `resolveTierForScore` any more | resolved for Farm Rating (BR-06), recorded for completeness |
| 2 | Automation (BR-38) | FR-F06/FR-F07: auto-reminders, system-suggested treatments, weather risk indicators; §2.2 automatic B2B/Horeca allocation | Principle 5: "All data is entered manually... No automated processes" | No advisory automation; only the three rule-enforcement jobs | requires client confirmation |
| 3 | Fulfilment model (BR-21) | §2.3 doorstep OTP at delivery hub, FR-C04 delivery slots + out-for-delivery, FR-A04 driver performance, module 14 drivers | Principle 9: "All orders fulfilled via warehouse pickup"; no driver or fleet feature anywhere | Pickup + 4-digit OTP only; delivery slot fields modelled but unused; no driver entity | requires client confirmation |
| 4 | Audit log scope for Main Warehouse Admin | §6.4: `View audit logs` MW = `Own` | §15: `View system audit logs` MW = `View` (all) | MAIN_WH_ADMIN = `own` (Ch.6 precedence) | requires client confirmation |
| 5 | Set warehouse capacity | §6.2: SA = Y, TA = Y, MW = Y | §7: SUPER_ADMIN only; TA = N, MW = N | SA/TA/MW may set (Ch.6 precedence); matrix is stricter | requires client confirmation |
| 6 | Wallet write authority for MW/SW | §6.3 `Wallet management (customers)`: MW = Y, SW = Own | §8: manual credit/debit is SA/TA only; MW/SW get view | MW = all, SW = own (Ch.6 precedence) — the loosest reading of a money-moving grant | requires client confirmation, priority |
| 7 | Bank refunds for MW/SW | §6.3 `Process returns (RMA)`: MW = Y, SW = Y (blanket) | §6: bank refund SA/TA only; MW/SW limited to wallet refunds | Bank refund restricted to SA/TA (matrix adds detail Ch.6 omits) | requires client confirmation |
| 8 | Integration keys and raw DB export | §6.4 + FR-A01: SUPER_ADMIN manages integration keys and has emergency raw DB export, audit-logged | §15 + Principle 11: both are infra-level (EXT); no role manages them in-app | Permissions retained SA-only; no admin UI built | requires client confirmation |
| 9 | COD vs wallet-first (BR-17) | §2.3 wallet-first; FR-C04 payment methods include COD; Ch.11 open decision 17 asks whether COD is supported at all | Principle: wallet-first checkout enforcement; no COD row | Wallet-first only; COD not implemented | requires client confirmation |
| 10 | B2B/Horeca allocation source (BR-13) | §2.2: automatic from consolidated inventory | §7: `Manage B2B/Horeca Manual allocation`, SA/TA full | Neither; B2B/Horeca order paths return 501 | requires client confirmation |
| 11 | Pickup OTP disclosure (BR-20) | FR-C05: "4-digit OTP shared with warehouse staff" | §6: `OTP shared with warehouse staff` = F for MW/SW and CU | OTP is customer-held; the verifying admin never receives it | requires client confirmation |
| 12 | Farmer application approval by Farmer Admin | §6.1 `Approve farmer applications`: FA = View | §2: `Approve farmer application` FA = N, with a separate view-only queue row | FA has read-only access, no approval path (behaviourally identical) | resolved, recorded for completeness |
| 13 | Object storage vendor | Ch.7/Ch.9: Azure Blob or Cloudinary | §15: AWS S3 or Cloudinary | Storage access is behind one adapter interface; no vendor SDK in domain code | requires client confirmation |
| 14 | Certificate eligibility for listing (BR-01 vs BR-02) | §2.1, as transcribed into this file, gave two different tests: BR-01 blocked a farmer "whose certifications are **all** expired", BR-02 refused listing "while a farmer has no verified, unexpired PGS or NPOP certificate". The listing gate implemented neither: it refused if ANY single certificate was expired or unverified, so an old expired certificate or a pending renewal blocked a farmer who held a valid one | Not the source of the conflict (BR-02 cites §9 / P7 only for manual verification) | Eligibility is per farmer: listing is allowed iff at least one certificate is VERIFIED, unexpired (`expires_on` >= Asia/Kolkata today) and PGS/NPOP; other expired, pending or rejected certificates never block. BR-01 and BR-02 are reworded so BR-02 is the governing test and BR-01 a subset of it. When nothing qualifies: `CERT_UNVERIFIED` if an unexpired certificate awaits verification, otherwise `CERT_EXPIRED` if one has expired, otherwise `CERT_MISSING`. **Gap closed 2026-10-05:** with no certificate at all, or only unexpired `REJECTED` ones, the live gate used not to refuse; only `farmers.is_market_blocked` did (`CERT_EXPIRED`, "Farmer market access is currently blocked."), so a farmer whose flag was false with no qualifying certificate (seeded or stale data) could still list. The gate now refuses these itself with 422 `CERT_MISSING` (BR-02f, BR-02g), whatever the flag says; the flag is still checked after it. `PATCH /listings/{id}` and admin approval have never checked certificates; still unchanged | **Resolved 2026-10-05** (user-confirmed: a valid certificate permits listing; a pending renewal must not block; a farmer with no certificate, or only rejected ones, must be refused with its own error). Still open: whether the edit path (`PATCH /listings/{id}`) and admin approval should check certificates |

---

## Rules NOT enforced in Track 1

Chapter 2 contains roughly 33 discrete client-locked rules. Track 1 enforces 14 of them server-side with tests (BR-01, BR-02, BR-04, BR-06, BR-07, BR-08, BR-10, BR-11, BR-12, BR-16, BR-17, BR-18/BR-19, BR-20, BR-28/BR-29/BR-30/BR-31). The rest are listed here so the gap is a decision, not a surprise.

| # | Rule | Source | Rule ID | Why not enforced in Track 1 |
|---|---|---|---|---|
| 1 | 4 audits per year, one per quarter | §2.1 | BR-03 | Moved into Track 1 on 2026-10-01 (Audit module; see BR-03) — row kept for history |
| 2 | Major violation red-flag threshold | §2.1 | BR-05 | Count and manual flag are stored (Track 1, 2026-10-01); the automatic red-flag rule stays deferred because the rule as written is inverted |
| 3 | Farmer-side certification entry, renewal tracking, expiry countdown | §2.1 | BR-01/BR-02 | Enforcement is server-side in Track 1, but the farmer-facing entry screens ship with the Farmer app (Track 2) |
| 4 | B2B/Horeca allocation from consolidated inventory | §2.2 | BR-13 | Only the Online channel is in scope; source contradiction unresolved |
| 5 | Four sales channels | §2.2 | BR-15 | Online only; Market, Horeca and B2B each need their own order, pricing and invoicing path |
| 6 | Farmer subscription Rs 500/year and free-tier limits | §2.2 | BR-14 | Billing module is Phase 2; free-tier limits are undefined in both documents |
| 7 | Dual fulfilment / home delivery with slots | §2.3 | BR-21 | Pickup path only; delivery model is contested (contradiction 3) |
| 8 | Live order tracking beyond packed/picked-up | FR-C04 | — | Dispatch and out-for-delivery states belong to the delivery model that is not in scope |
| 9 | Rate & review, tags, one-tap reorder | FR-C05 | — | Customer app Phase 5 screens; no backend dependency in the golden thread |
| 10 | RMA issue categories, ticket lifecycle, bank refunds | FR-C05, matrix §6 | — | Returns module is Phase 2-3; wallet refund path exists in the ledger, no RMA workflow |
| 11 | Each warehouse has its own Sub Warehouse Admin (5 incl. standby) | §2.4 | BR-25 | Modelled in `user_roles`; no staffing management UI |
| 12 | Main Warehouse Admin oversees all 4 warehouses | §2.4 | — | RBAC grants exist; the consolidated MW dashboard is Phase 3 |
| 13 | Inter-warehouse transfers restricted to MW + SA | §2.4 | BR-26 | The ledger has a transfer type; there is no transfer endpoint or UI in this scope |
| 14 | Warehouse capacity limits and quotas/targets | §6.2, FR-A04 | — | Contested authority (contradiction 5); no capacity model until resolved |
| 15 | Stock verification (physical count vs system) | §6.2 | — | Ledger supports it; the counting workflow and variance report are Phase 2 |
| 16 | Quality counter-offer at goods receipt | matrix §7 | — | Second counter-offer surface; the listing counter-offer (BR-10/BR-11) is the one in scope |
| 17 | Market day scheduling per warehouse | matrix §5 | — | Belongs to the Market sales channel, which is Phase 3 |
| 18 | GDPR data export and account deletion requests | matrix §15 | — | Absent from the Requirements document entirely; needs a retention policy first, which no document states |
| 19 | Advisory automation (reminders, treatments, weather risk) | FR-F06/F07 | BR-38 | Blocked on contradiction 2 — do not build either way until the client answers |

Farm rating, 10 categories x 10 points (BR-06), its Farmer-Admin-own-zone edit predicate, and the Farm Rating tier scale (BR-04) moved OUT of this table and into Track 1 on 2026-09-17 — see BR-04 and BR-06 above and `apps/api/src/modules/farm-ratings/`. The Farmer-Admin edit predicate went away on 2026-10-01 with the manual rating edit itself (ratings now come from completed INTERNAL audits only).
