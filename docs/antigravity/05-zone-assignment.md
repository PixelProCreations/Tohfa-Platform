# Antigravity brief 05 — Zone assignment: real zones, farmer picks, auto-detect works

Touches `apps/api`, `db/`, and the **farmer** app (`apps/mobile/src/roles/farmer/`).
Do **not** touch `apps/admin-web/`. Do not wire the admin Zone Management screen — that
is brief 06.

## The situation

Zone assignment is **already implemented and has never worked**, because the table it
reads is empty.

`apps/api/src/modules/farmer-applications/farmer-applications.service.ts` (~line 491) on
submit:

```ts
// BR-143 / BR-19: Normalize taluk and derive zone if possible
const rawTaluk = personal['taluk'];
const matchedZone = await repo.findZoneByTaluk(pool, rawTaluk.trim(), districtStr);
if (matchedZone !== null) derivedZoneId = matchedZone.id;
```

`findZoneByTaluk` (`farmer-applications.repo.ts` ~244) reads **`geographic_zones`**, which
has **0 rows**. So every application submits with `zoneId: null`, silently.

Verify all of this yourself before changing anything.

## Owner decisions — already made, do not re-litigate

There are **four warehouses**, so there are **four zones**, one per warehouse. Two taluks
have no warehouse and group with their nearest neighbour **by location**:

| Zone | Warehouse | Taluks |
|---|---|---|
| Ooty | `WH-OOTY` (MAIN) | Udhagamandalam, **Kundah** |
| Coonoor | `WH-COON` | Coonoor |
| Kotagiri | `WH-KOTA` | Kotagiri |
| Gudalur | `WH-GUDA` | Gudalur, **Pandalur** |

Rationale, so you do not "improve" it: a zone's job is to route a farmer's produce to a
warehouse. A zone with no warehouse cannot do that job. Pandalur was split out of Gudalur
taluk and shares its terrain; Kundah adjoins Udhagamandalam.

**The farmer chooses their zone in step 1**, with the nearest pre-selected from their
taluk. The taluk lookup becomes a *suggestion*, not the decision. Show **all four** —
no distance filtering. **An admin may override** a farmer's choice afterwards.

District is `The Nilgiris` throughout.

## What to build

### 1. The zone data
Create the four zones (if they do not already exist — there is currently one
`ZONE-DEMO-01 "Ooty Demo Zone"`; decide whether to rename it or replace it, and say
which) and populate the taluk mapping for all six taluks.

**This is reference data.** Look at how `db/seed/001_reference.sql` handles the existing
reference rows and follow that, rather than inventing a new mechanism. If a migration is
genuinely the right home, argue it. Never modify a migration that has already run.

### 2. There is ONE mapping table — populate it, and do not refactor this
**Correction to an earlier draft of this brief.** `geographic_zones` is **not** a second
table. It is a **VIEW** over `zone_taluks`, created by `db/migrations/0088_geographic_zones.sql`:

```sql
CREATE OR REPLACE VIEW geographic_zones AS
SELECT zt.id, zt.district, zt.taluk, zt.zone_id,
       z.code AS zone_code, z.name AS zone_name, z.is_active
FROM zone_taluks zt JOIN zones z ON z.id = zt.zone_id;
```

So the two cannot disagree: auto-detect reads the view, the admin zones API reads the
base table, and both are the same data. **Insert into `zone_taluks` only.** Do not write
to the view, do not create a parallel mapping, and do not "unify" anything — it is
already unified and the design is correct as it stands.

`zone_taluks` is `(id, zone_id, taluk, district default 'The Nilgiris', created_at)` with
a UNIQUE index on `(district, lower(taluk))`. That case-insensitive uniqueness matches
`findZoneByTaluk`'s `lower()` comparison, so rely on it rather than adding your own
normalisation.

### 3. Delete the Kundah special case
`findZoneByTaluk` opens with a hardcoded branch:

```ts
if (trimmedTaluk.toLowerCase() === 'kundah') { /* reads system_config kundah_zone_name */ }
```

`kundah_zone_name` is **not set**, so this branch does nothing today. With Kundah as an
ordinary row in the mapping it is dead code. **Remove it** and the now-unused config key.
Do not fill the config in — a hardcoded taluk name in a repo function will outlive
everyone who remembers why it is there. Cover Kundah → Ooty with a test instead.

### 4. A public endpoint listing zones for the picker
The applicant has **no account** when step 1 renders, so this must be `security: []`,
like `POST /farmers/applications`. Return the **minimum**: zone id, display name, and the
warehouse town. No counts, no internal codes beyond what the picker shows, nothing about
farmers. It is a public endpoint — treat it as such.

### 5. The farmer app: taluk text box → zone picker
`apps/mobile/src/roles/farmer/screens/registration/step1Personal/AddressSection.tsx`
(~line 83) currently captures taluk as a free-text `TextInput`. Free text means a typo
(`Kothagiri`, `Kotagiri Taluk`, Tamil script) silently yields no zone.

- Keep capturing taluk — it is part of the address.
- Add a **zone picker** fed by the public endpoint, with the zone matching the entered
  taluk pre-selected. The farmer confirms or changes it.
- **Label it by its collection point** ("Ooty Warehouse — Udhagamandalam"), not an
  abstract zone code. Internally it is still `zone_id`.
- Send the farmer's choice through to the application so it wins over the derived value.
- Handle the picker failing to load: the farmer must still be able to continue. Do not
  block submission on a list that did not fetch.

Follow the farmer app's existing conventions — read neighbouring fields in that file.
Tokens only, no raw hex or spacing; no inline English, use the farmer i18n catalogue.
**Do not restyle the step.**

### 6. An undetected zone must be visible
Today, no match means `zoneId` stays null with no signal at all. An application with no
zone must be **visible as such** to an admin, so it gets assigned rather than sitting
unnoticed. The admin can already change a farmer's zone (the update schema accepts
`zoneId`, and `AdminEditFarmerScreen` renders a `ZoneFarmSection`) — **do not rebuild
that**, just make the gap findable.

## Out of scope — do not do these
- The admin Zone Management screen (`screens/zones/`). That is brief 06.
- Any change to how zones relate to warehouses beyond the mapping above.
- Distance/GPS filtering of the picker. The owner chose all four, deliberately.

## House rules

Read `/CLAUDE.md`, `/apps/api/CLAUDE.md` and `/apps/mobile/CLAUDE.md` first.

- **Module shape**: `routes` (wiring only) → `schema` (Zod matching openapi exactly) →
  `service` (takes a `ResolvedScope`, never a `Request`) → `repo` (SQL only, takes an
  `Executor`).
- **Authorization is server-side and data-driven.** No role-name checks in handlers.
  Cross-scope reads return an **empty result set, not 403**.
- **Mutating admin actions write an `audit_log` row in the same transaction.** A zone
  override especially — someone will need to prove who moved a farmer and when.
- **Errors**: `AppError` with a code from `packages/shared-types/src/errors.ts`.
- **`docs/openapi.yaml` is ground truth** — `pnpm spec:lint` must pass with 0 errors.
- A new or amended business rule goes in `docs/rules.md` with a test contract and must be
  **called out loudly** — BR-143 and BR-19 already cover zone derivation, so check
  whether you are amending rather than adding.
- No hardcoded business thresholds; tunables come from `system_config`.

## Database safety — absolute
- **NEVER touch the database named `tohfa`.** It is the owner's working database and
  currently holds exactly three farmers and three live demo applications that are being
  used for testing. Do not add, delete or modify a row in it.
- No DB needed: `DATABASE_URL=postgres://nobody:nobody@127.0.0.1:1/no_such_db`
- Integration tests: `DATABASE_URL=postgres://tohfa:tohfa@localhost:5432/tohfa_test`
- Never leave `DATABASE_URL` unset. No `env $E` tricks. Never read or print a `.env`.
- Never start or stop Metro, the API, an emulator, or docker.

## Git
**Never commit, push, merge, branch, stage, or open a PR.** The owner commits.

## Tests — write first, watch fail
- Each of the six taluks resolves to its zone, case-insensitively.
- **Kundah → Ooty** and **Pandalur → Gudalur** specifically.
- An unknown taluk yields no zone and is surfaced, not silently null.
- The farmer's explicit choice beats the derived suggestion.
- The public endpoint exposes only the minimum fields and needs no auth.
- The two mapping sources cannot disagree (whatever shape your fix takes).
Name rule tests with their `BR-xx` id. **Never delete, skip or weaken a test to go green.**

## Verify — paste REAL terminal output, never a summary
Run each **before** you edit and save it, then compare after:
```
DATABASE_URL=postgres://nobody:nobody@127.0.0.1:1/no_such_db pnpm --filter @tohfa/api typecheck
DATABASE_URL=postgres://nobody:nobody@127.0.0.1:1/no_such_db pnpm --filter @tohfa/mobile typecheck
DATABASE_URL=postgres://tohfa:tohfa@localhost:5432/tohfa_test pnpm --filter @tohfa/api test
DATABASE_URL=postgres://nobody:nobody@127.0.0.1:1/no_such_db pnpm --filter @tohfa/mobile test
DATABASE_URL=postgres://nobody:nobody@127.0.0.1:1/no_such_db pnpm spec:lint
```
Mobile baseline is **exactly 25 failing test files** (known, unrelated). The API suite has
a known isolation defect failing about one random file per run — judge by the failing
FILE list, not the count.

**Note:** the API typecheck is currently FAILING with 4 errors in
`src/modules/learning-hub/learning-hub.test.ts`, left by the content-review change. That
is **not yours**. Record it in your baseline and do not let it hide a regression of your
own; fix it only if you caused more.

Report "no NEW failures vs baseline" with both lists, or name exactly what you broke.

## Report
The zone rows you created and where they live (seed vs migration, and why), how you
resolved the two-mapping-table problem, confirmation the Kundah branch is gone, the
public endpoint's exact response shape, how the picker behaves when its fetch fails, how
an undetected zone surfaces, and every verification output verbatim.
