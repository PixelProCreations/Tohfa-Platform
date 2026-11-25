# 08a - Farm Records: fields the design collects (backend spec input)

## 1. Purpose and status

The admin mobile app is porting the "Farm Records" screens (the "Farmer Records" tab of the farmer detail screen) from the design branch of record, `origin/Superadmin-main`. The backend for saving farm records does not exist yet and will be built to match the design. This document lists, for every add/edit form and every action modal in the design, exactly which fields the design collects and what the action does in the design's local state. It is factual. It does not define business rules. Anything ambiguous is in section 9.

Current state in this app:

- Every submit button on these screens is disabled, pending these endpoints.
- The app has no admin write endpoint for diary entries, crop growth stage, harvest, livestock (animal, production, end of record) or farm assets (create, edit, service, retire).
- Existing admin READ endpoints (used to render the cards): `GET /admin/produce/records?farmerId=`, `GET /admin/farmers/{id}/livestock/animals`, `GET /admin/farmers/{id}/farm-assets` (see `apps/mobile/src/roles/admin/api/w5ProduceRecords.ts` and `w5FarmRecords.ts`).

Design source files (copies of `origin/Superadmin-main`):

- `AdminAddFarmRecordScreen.tsx` (add form with 5 tabs; also `mode="edit"`)
- `AdminEditFarmRecordScreen.tsx` (edit screen)
- `FarmRecordsSection.tsx` (cards and 6 modals)
- `AdminFarmerDetailScreen.tsx` (routing) and `SuperAdminFarmRecordsScreen.tsx` (second routing)

Conventions used below:

- "Required" is shown only when the design marks the label with `*` or the text "(required)", or when the code validates it. Otherwise it says "not marked".
- "Per-farmer" in the Options column means the list must come from the backend for the selected farmer; the app shows it empty until an API supplies it. "Fixed" means a closed option set defined by the design.
- Dates: the Add screen and modals use `DD-MM-YYYY`. The Edit screen and the cards use `DD MMM YYYY` (for example `28 Oct 2026`). The calendar picker supports both. The API uses `YYYY-MM-DD`.
- Money: any money field must be the Money type (integer paise) per CLAUDE.md section 2.2.
- "Design behaviour" means what the design's local React state does on submit. It is not a rule the backend must copy.
- "+ Add" in a dropdown means a custom-option prompt (section 2.3).

## 2. Navigation summary

### 2.1 Farm Records tab (`FarmRecordsSection`)

Sub-tabs: Diary, Plant & Crops, Livestock, Assets. Each has a Search box and a filter button (the filter button has no handler in the design).

| Where | Button | Opens |
|---|---|---|
| Diary tab | "+ Add Diary Entry" | Add screen, Diary tab (`onAddRecord('Diary')`) |
| Diary card | "Edit" | `AdminEditFarmRecordScreen` with `type: 'diary'`, header "Edit Diary Entry" |
| Plant & Crops tab | "+ Plant a crop" | Add screen, Plant tab (`onAddRecord('Plant')`) |
| Crop card (expanded) | "Edit" | Add screen in `mode="edit"`, Plant tab (`type: 'crop'`, header title passed is "Edit Crop Type" but the Add screen header shows "Edit Records") |
| Crop card (expanded) | "Update stage" | Modal "Update growth stage" (blocked with alert if already at Harvest stage) |
| Crop card (expanded) | "Record harvest" | Modal "Record harvest" (blocked with alert if status is Harvested) |
| Livestock tab | "+ Register animal" | Add screen, Livestock tab (`onAddRecord('Livestock')`) |
| Livestock card | "Log production" | Modal "Log production" (blocked with alert if the animal record has ended) |
| Livestock card | "Edit" | Add screen in `mode="edit"`, Livestock tab (`type: 'livestock'`, header "Edit Livestock" passed but not shown) |
| Livestock card | "End record" | Modal "End this animal's record?" (blocked with alert if already ended) |
| Assets tab | "+ Register asset" | Add screen, Assets tab (`onAddRecord('Assets')`), header "Register assets" |
| Asset card | "Record service" | Modal "Record service" (blocked with alert if Retired) |
| Asset card | "Edit" | Add screen in `mode="edit"`, Assets tab (`type: 'asset'`) (blocked with alert if Retired) |
| Asset card | "Retire" | Modal "Retire <asset name>?" (blocked with alert if already Retired) |

### 2.2 Routing in `AdminFarmerDetailScreen`

- Diary edit goes to `AdminEditFarmRecordScreen`.
- Crop, livestock and asset edit go to `AdminAddFarmRecordScreen` with `mode="edit"`, `initialRecord`, and the initial tab Plant (crop), Livestock, or Assets.
- Add goes to `AdminAddFarmRecordScreen` with the initial tab from the button.
- Both add and edit are rendered with `allowAddOptions={false}` here, so the "+ Add" buttons and removable tag chips are hidden in this routing.
- In `SuperAdminFarmRecordsScreen` (a second entry point to the same `FarmRecordsSection`), every edit (diary, crop, livestock, asset) goes to `AdminEditFarmRecordScreen`, and add goes to `AdminAddFarmRecordScreen` with `allowAddOptions` at its default `true`. An optional `onAddDiaryEntry` prop can divert the Diary add to another screen (not in scope here).

### 2.3 "+ Add" new-option prompt (when `allowAddOptions` is true)

Beside most dropdowns there is an outlined "+ Add" button. It opens a prompt titled "Add <field label>" with one text input ("Enter <field label>"), Cancel, and Add. Design behaviour: the trimmed text is appended to that dropdown's local option list (if not already present), selected as the value, and added to the field's tag chips where the field has chips. Empty text is ignored. Nothing is persisted. Dropdowns with `showAddControl: false` never show "+ Add": Linked crop, Unit (production unit).

Chip fields (tags that can be removed by tapping): Diary Plot, Activity Category, Activity; Plant Type; Crop category; Suitable zone, Suitable soil, Grades supported. Chips only render when `allowAddOptions` is true. Their initial contents are hard-coded demo values.

### 2.4 Shared widgets

- Dropdown: tapping opens a modal list titled with the field label (the label with the trailing `*` removed). Single-select.
- Date input: a text input with a calendar icon opening the calendar picker. The text is free-typed, so the format is not enforced by the design.
- Photo upload controls have no handler in the Add screen (pure placeholders). The Edit screen toggles a `hasPhoto` boolean.

## 3. Add screen: Diary tab

Heading "Diary Records". Header title: "Add Records" (add) or "Edit Records" (edit). Button: "Save".

| Field | Type | Required? | Options as designed | Unit | Notes |
|---|---|---|---|---|---|
| Date * | date `DD-MM-YYYY` (text + calendar) | Yes (`*`) | n/a | n/a | Default `28-10-2026` (hard-coded in the design). |
| Plot * | single-select dropdown + "+ Add" + chips | Yes (`*`) | `Plot A`, `Plot B`, `Plot 1 (1.8 acre)`, `Plot 2 (1.2 acre)`. Per-farmer (plots). "+ Add" allowed. | n/a | Add mode starts empty. Chips seeded `Plot A`, `Plot B`. |
| Activity Category * | single-select + "+ Add" + chips | Yes (`*`) | `Land prep`, `Sowing`, `Nutrient`, `Water`, `Weed`. Fixed (admin diary taxonomy exists in the API). "+ Add" allowed. | n/a | Default `Land prep`. |
| Activity * | single-select + "+ Add" + chips | Yes (`*`) | `Ploughing`, `Bed Marking`, `Compost application`, `Hand weeding`, `Drip irrigation`. Fixed. "+ Add" allowed. | n/a | Default `Ploughing`. The list is flat, not filtered by the chosen category. |
| Time spent (minutes) (required) * | number with up/down stepper | Yes (`*`) | n/a | minutes | Default `0`. The stepper moves in steps of 15 and never goes below 0. The Edit screen's label says "minutes, 1-1,440". |
| Linked crop (optional) | single-select, no "+ Add" | Optional | `Tomato (Plot 1)`, `Beans (Plot 2)`, `Carrot (Plot 1)`, `Cabbage (Plot 2)`. Per-farmer (the farmer's active crops). | n/a | Add mode starts empty. |
| Notes (up to 500 characters) | multiline text | Not marked | n/a | n/a | The 500 limit is only in the label. The default text is the placeholder text "Applied compost before the next rain." (pre-filled in add mode). |
| Workforce lines (optional) | repeatable rows; "Add +" appends a row | Optional | n/a | n/a | One row by default. Row fields below. |
| - Worker name | text | Not marked | n/a | n/a | New rows are named `Worker N`. Default row: `Worker 1`. |
| - Hours | number | Not marked | n/a | hours | Defaults `4`. |
| - Wage (₹) | number | Not marked | n/a | ₹ (money) | Default `350`. Money: must be the Money type (integer paise) per CLAUDE.md section 2.2. The design does not say whether this is per hour or per day (see section 9). |
| Photos (up to 5) | photo upload (one dashed tile) | Not marked | n/a | n/a | No handler in the design. |

Action: "Save" calls `onSave('Diary', { diaryDate, diaryNotes })`. Design behaviour: the screen closes. Only date and notes are passed on; the design does not pass the other fields at all, so the payload shape is not defined by the design. No validation is performed in code.

Context shown: the Add screen receives `farmerName` and `farmerId` props but does not render them.

## 4. Add screen: Plant tab

Heading "Plant Records". Button "Save Plant". This is the "+ Plant a crop" form. Edit of a crop card also lands here.

| Field | Type | Required? | Options as designed | Unit | Notes |
|---|---|---|---|---|---|
| Plant Type * | single-select + "+ Add" + chips | Yes (`*`) | `Banana Tree`, `Coconut tree`, `Tomato`, `Beans`, `Carrot`, `Pepper`. Looks like crop-type master data (see Crops tab). "+ Add" allowed. | n/a | Chips seeded `Banana Tree`, `Coconut tree`. |
| Plant Variant * | single-select + "+ Add" | Yes (`*`) | `Nendran`, `Grand Naine`, `Dwarf Green`, `Hybrid F1`, `Country`. Fixed list, not filtered by plant type. "+ Add" allowed. | n/a | |
| Area (Acres, one decimal) * | single-select + "+ Add" | Yes (`*`) | `0.5`, `1.0`, `1.5`, `2.0`, `2.5`. "+ Add" allowed. | acres | A dropdown of strings, not a number input. |
| Grade * | single-select + "+ Add" | Yes (`*`) | `Grade (G1)`, `Grade (G2)`, `Grade (G3)`, `Not Mentions`. "+ Add" allowed. | n/a | |
| Expected harvest days * | number (text input, numeric keyboard) | Yes (`*`) | n/a | days | Placeholder `e.g. 90`. |
| Notes | multiline text | Not marked | n/a | n/a | Placeholder "Additional notes about planting". |

Not collected on this form but shown on the crop card and in the Edit-crop data: plot, planted date, seed source, growth stage (see section 9).

Action: "Save Plant" calls `onSave('Plant', { plantTypeTags, plantNotes })`. Design behaviour: the screen closes; no validation in code.

Edit mode (crop card "Edit"): the form is the same, prefilled by string parsing of the card data: Plant Type is the part of the card title before ` · `, Variant the part after it, Area from the "N acre" in the plot string, Grade from the card grade (`Grade 1` is mapped to `Grade (G1)`), Expected harvest days is a hard-coded `90`. The tab row stays visible in edit mode.

## 5. Add screen: Crops tab

Heading "Crops Records". Buttons "Save Crop" and "Cancel". This looks like a crop-type master record (crop code, botanical data, typical stage durations), not a farmer's planting. It has no plot or farmer field.

### 5.1 Section 1 - Basic crop information

| Field | Type | Required? | Options as designed | Unit | Notes |
|---|---|---|---|---|---|
| Crop Name * | text | Yes (`*`) | n/a | n/a | Placeholder `e.g. Carrot`. |
| Crop Code * | text + "Generate" button | Yes (`*`) | n/a | n/a | Default `CAR003`. "Generate" sets `CAR` + a random 3-digit number. Helper text: "The code is a permanent identifier and cannot be changed." The field is still editable in the design. |
| Crop category * | single-select + "+ Add" + chips | Yes (`*`) | `Vegetable`, `Fruit`, `Spice`, `Others`. "+ Add" allowed. | n/a | Chips seeded with all four. |
| Local / Alternative Name | text | Not marked | n/a | n/a | |
| Crop Description | multiline text | Not marked | n/a | n/a | |
| Upload Crop Image | file upload | Not marked | n/a | n/a | Helper: "JPG, PNG or PDF, up to 5 MB. Replacing a verified document creates a new version; the previous version stays in history." No handler. |

### 5.2 Section 2 - Botanical and classification

| Field | Type | Required? | Options as designed | Unit | Notes |
|---|---|---|---|---|---|
| Scientific Name * | single-select + "+ Add" | Yes (`*`) | `Daucus carota`, `Solanum lycopersicum`, `Phaseolus vulgaris`, `Brassica oleracea` | n/a | |
| Crop Family * | single-select + "+ Add" | Yes (`*`) | `Apiaceae`, `Solanaceae`, `Fabaceae`, `Brassicaceae` | n/a | |
| Crop type / Classification * | single-select + "+ Add" | Yes (`*`) | `Root Crop`, `Fruiting Vegetable`, `Legume`, `Leafy Vegetable` | n/a | |
| Species / Variety * | single-select + "+ Add" | Yes (`*`) | `Ooty Carrot`, `Nantes`, `Pusa Kesar`, `Roma` | n/a | |

### 5.3 Section 3 - Growing information

| Field | Type | Required? | Options as designed | Unit | Notes |
|---|---|---|---|---|---|
| Suitable Season * | single-select + "+ Add" | Yes (`*`) | `Kharif`, `Rabi`, `Zaid`, `All Seasons` | n/a | |
| Suitable zone | single-select + "+ Add" + chips | Not marked | `Coonoor`, `Ooty`, `Kotagiri`, `Nilgiris`. These look like zones, so backend-supplied reference data. | n/a | Default `Nilgiris`. Chips seeded `Coonoor`, `Ooty`. |
| Suitable soil | single-select + "+ Add" + chips | Not marked | `Coonoor`, `Ooty`, `Red Loam`, `Black Clay`, `Forest Loam` | n/a | Default `Nilgiris`, which is not in this list. Chips seeded `Coonoor`, `Ooty`. |
| Examination harvest days | number | Not marked | n/a | days | Placeholder `e.g. 90`. Label says "Examination", likely meant "Expected" (see section 9). |
| Grades supported | single-select + "+ Add" + chips | Not marked | `Grade (G1)`, `Grade (G2)`, `Grade (G3)`, `Not Mentions` | n/a | Default `Grade (G3)`. Chips seeded `Grade (G2)`, `Grade (G1)`, `Not Mentions`. |

### 5.4 Section 4 - Growth stages

Helper: "Typical days spent in each of the 7 stages. All optional." The form shows a live banner "Total: N days" (the sum of the seven values, with blanks counted as 0).

| Field | Type | Required? | Options | Unit | Notes |
|---|---|---|---|---|---|
| 1. Seeding (days) | number | Optional | n/a | days | Default `0`. |
| 2. Germination (days) | number | Optional | n/a | days | Default `0`. |
| 3. Vegetative (days) | number | Optional | n/a | days | Default `0`. |
| 4. Flowering (days) | number | Optional | n/a | days | Default `0`. |
| 5. Fruit-setting (days) | number | Optional | n/a | days | Default `0`. |
| 6. Ripening (days) | number | Optional | n/a | days | Default `0`. |
| 7. Harvest (days) | number | Optional | n/a | days | Default `0`. |

These seven stage names are the same list as `CROP_GROWTH_STAGES` used by the "Update growth stage" modal (section 7.1).

### 5.5 Trailing card

| Field | Type | Required? | Options | Unit | Notes |
|---|---|---|---|---|---|
| Notes | multiline text | Not marked | n/a | n/a | Placeholder "Up to 300 characters." |
| Upload Crop image | file upload | Not marked | n/a | n/a | Second image upload (the first is in Section 1). No handler. |
| Upload Crop Document | file upload | Not marked | n/a | n/a | No handler. |

Action: "Save Crop" calls `onSave('Crops', { cropName, cropCode, growthStages })`. "Cancel" calls `onBack`. Design behaviour: the screen closes; no validation in code. The crop-type selection is not reachable from the crop-card Edit (which goes to the Plant tab).

## 6. Add screen: Livestock tab (5 steps)

Heading "Livestock Records", a "N/5" counter and a 5-segment progress bar. Steps 1-4 have "Next" (steps 2-5 also have "Back"). Step 5 has "Save Livestock". Moving between steps keeps the entered values (all state is held in the screen). The tab press resets to step 1. "Next" does no validation.

### 6.1 Step 1: Basic Information

| Field | Type | Required? | Options as designed | Unit | Notes |
|---|---|---|---|---|---|
| Photo ("Add photo (optional)") | photo | Optional | n/a | n/a | Avatar tile, no handler. |
| Livestock Type * | single-select + "+ Add" | Yes (`*`) | `Cattle`, `Poultry`, `Goat`, `Sheep` | n/a | Edit prefill: `Poultry` if category is `Hen`, otherwise `Cattle`. |
| Livestock ID * | single-select + "+ Add" | Yes (`*`) | `COW-01`, `COW-02`, `GOAT-01`, `CHK-01`. Per-farmer (animal IDs/tags). | n/a | The values look like tags; see the separate Tag field and section 9. |
| Species * | single-select + "+ Add" | Yes (`*`) | `Cow`, `Buffalo`, `Goat`, `Hen` | n/a | |
| Gender * | single-select + "+ Add" | Yes (`*`) | `Female`, `Male` | n/a | Fixed. Edit prefill is a hard-coded `Female`. |
| Source Farm * | single-select + "+ Add" | Yes (`*`) | `Coonoor Dairy Farm`, `Ooty Livestock Co-op`, `Own Farm Born`. Per-farmer / source data. | n/a | Edit prefill is a hard-coded `Own Farm Born`. |
| Organic status * | single-select + "+ Add" | Yes (`*`) | `Certified Organic`, `In Conversion`, `Conventional` | n/a | Edit prefill is a hard-coded `Certified Organic`. |
| Tag (required) | text | Yes ("(required)") | n/a | n/a | Placeholder "Unique per farmer in any case". |
| Name | text | Optional (placeholder "Optional") | n/a | n/a | Edit prefill: the second part of the card sub-title (`COW-01 · Lakshmi`). |
| Acquired on (required) | date `DD-MM-YYYY` | Yes ("(required)") | n/a | n/a | Default `28-10-2026`. |
| Notes | multiline text | Not marked | n/a | n/a | |

### 6.2 Step 2: Feed Record

| Field | Type | Required? | Options as designed | Unit | Notes |
|---|---|---|---|---|---|
| Feed Plan * | single-select + "+ Add" | Yes (`*`) | `Morning fodder + mineral mix`, `Twice daily silage`, `Free range + grain` | n/a | |
| Feed Type * | single-select + "+ Add" | Yes (`*`) | `Green Napier Grass`, `Dry Hay`, `Silage`, `Concentrate Feed` | n/a | |
| Source * | single-select + "+ Add" | Yes (`*`) | `On-farm grown`, `Local Co-op`, `Organic Supplier` | n/a | |
| Notes | multiline text | Not marked | n/a | n/a | |

### 6.3 Step 3: Production Record

| Field | Type | Required? | Options as designed | Unit | Notes |
|---|---|---|---|---|---|
| Production Type * | single-select + "+ Add" | Yes (`*`) | `Milk`, `Eggs`, `Manure`, `Wool` | n/a | |
| Production section * | single-select + "+ Add" | Yes (`*`) | `Morning Yield`, `Evening Yield`, `Daily Collection` | n/a | |
| Production Quantity * | number | Yes (`*`) | n/a | per Unit field | Placeholder `12`. |
| Unit | single-select, no "+ Add" | Not marked | `lt`, `kg`, `pcs` (fixed) | lt / kg / pcs | Default `lt`. The state variable is named `prodGenderUnit`. The unit is independent of the Production Type chosen. |
| Fat % * | single-select + "+ Add" | Yes (`*`) | `3.8`, `4.2`, `4.5`, `5.0` | percent | Marked required whatever the Production Type is (also for Eggs/Manure/Wool). |
| Quality grade * | single-select + "+ Add" | Yes (`*`) | `A+`, `A`, `B` | n/a | |
| Appearance type * | single-select + "+ Add" | Yes (`*`) | `Normal`, `Rich Cream`, `Standard` | n/a | |
| Notes | multiline text | Not marked | n/a | n/a | |

### 6.4 Step 4: Breeding Record

All dropdowns here have "+ Add".

| Field | Type | Required? | Options as designed | Unit | Notes |
|---|---|---|---|---|---|
| Breed Type * | single-select | Yes (`*`) | `Jersey`, `HF Cross`, `Sahiwal`, `Gir`, `Malabari` | n/a | In edit mode this is the animal's breed (prefilled from the card's "Breed", default `Jersey`). It is the only Step 4 field prefilled in edit mode. |
| Sire / Bull * | single-select | Yes (`*`) | `Sire-IND-01`, `Sire-JRS-04`, `AI Center Coonoor`. Per-farmer / source data (sire bulls). | n/a | |
| Breeding Method * | single-select | Yes (`*`) | `Artificial Insemination`, `Natural Service` | n/a | |
| Breed color * | single-select | Yes (`*`) | `Brown & White`, `Black & White`, `Dark Red` | n/a | |
| Insemination type * | single-select | Yes (`*`) | `Fresh Semen`, `Frozen Straws`, `Sorted Semen` | n/a | |
| Pregnancy check Type * | single-select | Yes (`*`) | `Palpation`, `Ultrasound`, `Milk Progesterone` | n/a | |
| Pregnancy Result * | single-select | Yes (`*`) | `Positive`, `Negative`, `Pending Re-check` | n/a | |
| Examination method * | single-select | Yes (`*`) | `Rectal Examination`, `Ultrasound Scan` | n/a | |
| Calving * | single-select | Yes (`*`) | `Normal`, `Assisted` | n/a | |
| Calving Outcome * | single-select | Yes (`*`) | `Live Calf`, `Twins`, `Stillborn` | n/a | |
| Delivery type * | single-select | Yes (`*`) | `Normal`, `C-Section`, `Assisted` | n/a | |
| Expected Delivery Day * | date, free text | Yes (`*`) | n/a | n/a | Placeholder `e.g. 15-11-2026`. A plain text input with no calendar icon. |
| Notes | multiline text | Not marked | n/a | n/a | |

### 6.5 Step 5: Health Record

All dropdowns here have "+ Add". Button "Save Livestock".

| Field | Type | Required? | Options as designed | Unit | Notes |
|---|---|---|---|---|---|
| Checkup Type * | single-select | Yes (`*`) | `Routine Checkup`, `Vaccination`, `Deworming`, `Emergency` | n/a | |
| Health status * | single-select | Yes (`*`) | `Healthy`, `Under Treatment`, `Recovering`, `Quarantine` | n/a | |
| Treatment type * | single-select | Yes (`*`) | `Preventive`, `Antibiotic`, `Deworming`, `Topical` | n/a | |
| Medicine type * | single-select | Yes (`*`) | `Vaccine`, `Oral Suspension`, `Injectable`, `Herbal Supplement` | n/a | |
| Frequency * | single-select | Yes (`*`) | `Once`, `Daily`, `Twice Daily`, `Weekly`, `Monthly` | n/a | |
| Symptoms / Observations * | single-select | Yes (`*`) | `None / Normal`, `Mild Fever`, `Reduced Appetite`, `Skin Rash` | n/a | |
| Examination findings * | single-select | Yes (`*`) | `Normal Vitals`, `Elevated Temp`, `Dehydration` | n/a | |
| Diagnosis * | single-select | Yes (`*`) | `Healthy`, `Seasonal Fever`, `Parasite Infection`, `Nutritional Deficiency` | n/a | |
| Treatment required * | single-select | Yes (`*`) | `No`, `Yes - Medication`, `Yes - Observation` | n/a | |
| Target parasite * | single-select | Yes (`*`) | `None`, `Ticks & Mites`, `Internal Worms`, `Liver Fluke` | n/a | |
| Administration route * | single-select | Yes (`*`) | `Oral`, `Intramuscular`, `Subcutaneous`, `Topical` | n/a | |
| Notes | multiline text | Not marked | n/a | n/a | |

Action: "Save Livestock" calls `onSave('Livestock', { livestockType, livestockId, livestockName, livestockTag, breedType, healthStatus })`. Design behaviour: the screen closes; no validation in code, although most fields are starred. The design does not pass the feed, production, other breeding or other health fields at all, so the payload shape is not defined by the design. None of the five steps' data is validated at "Next".

Edit mode (livestock card "Edit"): the same five steps open. Prefilled: Livestock Type, Livestock ID and Tag (both from the first part of the card sub-title), Species (card species), Gender (hard-coded `Female`), Source Farm (hard-coded `Own Farm Born`), Organic status (hard-coded `Certified Organic`), Name, Acquired on, Notes, Breed Type. Everything on steps 2, 3, 5 and most of 4 starts blank.

## 7. Action modals (`FarmRecordsSection`)

All modals have a title row with a close (X) button, a context banner, a summary card, form fields, optional hint text, and Cancel plus a primary button. The context banner reads "Editing for <farmerName> (<farmerCode>)" for Update growth stage, Record harvest, End record and Retire, and "Adding for <farmerName> (<farmerCode>)" for Log production and Record service. All "Today" defaults are a hard-coded `28-10-2026` in the design.

### 7.1 Update growth stage

| Field | Type | Required? | Options as designed | Unit | Notes |
|---|---|---|---|---|---|
| Crop (read-only) | summary | n/a | n/a | n/a | `<shortName> on <plotName>` |
| Now (read-only) | summary | n/a | n/a | n/a | The current stage name. |
| New stage | single-select (inline list) | Not marked (defaults to the next stage) | Only the stages AFTER the current one, from the fixed list `Seeding`, `Germination`, `Vegetative`, `Flowering`, `Fruit-setting`, `Ripening`, `Harvest`. | n/a | Default selection is the next stage. |

Hint shown: "A stage can only move forward."

Action: button "Update". Design behaviour: rejects with the alert "A stage can only move forward." if the chosen stage index is not greater than the current. Otherwise sets the crop's stage to the chosen stage and sets status `Harvested` if the new stage is the last one (`Harvest`), otherwise `Growing`. Alert on success: "<crop> moved forward to <stage>." Does not collect a date, and does not collect a harvest quantity when moving to `Harvest`.

### 7.2 Record harvest

| Field | Type | Required? | Options as designed | Unit | Notes |
|---|---|---|---|---|---|
| Crop (read-only) | summary | n/a | n/a | n/a | `<shortName> on <plotName>` |
| Planted (read-only) | summary | n/a | n/a | n/a | The planted date. |
| Harvest date (required) | date `DD-MM-YYYY` (text + calendar) | Yes ("(required)") | n/a | n/a | Placeholder `dd-mm-yyyy`, default `28-10-2026`. |
| Quantity (whole kg) (required) | number | Yes ("(required)") | n/a | kg | Placeholder `e.g. 250`. |

Hint shown: "The crop becomes a closed Harvested record and cannot be edited afterwards."

Action: button "Record harvest". Design behaviour: validation is `harvestDate` not blank and `parseInt(quantity)` is a finite number greater than 0, otherwise the alert "Please enter harvest date and whole kg quantity." On success sets the crop status `Harvested`, stage to the last stage, and the card's harvest text to `<qty> kg (<date>)`. Alert: "Recorded <qty> kg on <date>." The design does not compare the harvest date with the planted date.

### 7.3 Log production (livestock)

| Field | Type | Required? | Options as designed | Unit | Notes |
|---|---|---|---|---|---|
| Animal (read-only) | summary | n/a | n/a | n/a | `<species> <tag>` e.g. `Cow COW-01` |
| Product | single-select (inline list) | Not marked (defaults to the first option) | Per animal: the card's `productOptions`. Sample data: Cow `milk (litres)`, `curd (kg)`, `paneer (kg)`; Hen `eggs (pcs)`, `manure (kg)`. The unit is part of the label. Per-animal (species-dependent) data the backend must supply. | litres / kg / pcs (part of the option label) | |
| Date (required) | date `DD-MM-YYYY` | Yes ("(required)") | n/a | n/a | Placeholder `dd-mm-yyyy`, default `28-10-2026`. |
| Quantity (whole number) (required) | number | Yes ("(required)") | n/a | unit of the chosen product | Placeholder `e.g. 12`. |

Action: button "Log". Design behaviour: validation is date not blank and `parseInt(quantity)` finite and greater than 0, otherwise the alert "Please enter a valid date and whole number quantity." On success: production log count +1 and the card's "Latest" becomes `<qty> <product label>, <date>`. Alert: "Logged <qty> <product> for <tag>." Blocked before opening when the animal record has ended ("This animal record has ended and no more production can be logged.").

### 7.4 End this animal's record

| Field | Type | Required? | Options as designed | Unit | Notes |
|---|---|---|---|---|---|
| Animal (read-only) | summary | n/a | n/a | n/a | `<species> <tag>` |
| What happened | single-select (inline list) | Not marked (defaults to `Sold`) | `Sold`, `Transferred`, `Culled`, `Deceased` (fixed) | n/a | |
| Date (required) | date `DD-MM-YYYY` | Yes ("(required)") | n/a | n/a | Default `28-10-2026`. |
| Reason (required) | multiline text | Yes ("(required)") | n/a | n/a | Placeholder "Enter reason...". |

Hint shown: "This ends the animal's active life. It cannot be undone, and no more production can be logged."

Action: button "End record" (danger outline). Design behaviour: validation is date and reason both non-blank, otherwise the alert "Please enter a valid date and reason." On success sets the animal's ended outcome to the chosen value; the card badge changes from `Active` to that outcome. Alert: "<tag> has been marked <outcome>." The design does not collect a buyer/destination or a sale price.

### 7.5 Record service (asset)

| Field | Type | Required? | Options as designed | Unit | Notes |
|---|---|---|---|---|---|
| Asset (read-only) | summary | n/a | n/a | n/a | The asset name. |
| Service date (required) | date `DD-MM-YYYY` | Yes ("(required)") | n/a | n/a | Default `28-10-2026`. |
| Note | multiline text | Optional (placeholder "Optional service notes...") | n/a | n/a | |

Action: button "Record". Design behaviour: validation is service date not blank, otherwise the alert "Please enter a valid service date." On success sets the asset's `lastService` to the entered date, clears the "Service overdue" flag, and replaces the asset's notes with the entered note if one was typed (otherwise keeps the old notes). The design does not recompute "Next service due". Alert: "Recorded service for <asset> on <date>." Blocked before opening when the asset is Retired.

### 7.6 Retire asset

Title "Retire <asset name>?".

| Field | Type | Required? | Options as designed | Unit | Notes |
|---|---|---|---|---|---|
| Reason (required) | multiline text | Yes ("(required)") | n/a | n/a | Placeholder "Enter reason for retiring this asset...". |

Hint shown: "The asset is kept in the history but can no longer be edited or serviced."

Action: button "Retire" (danger outline). Design behaviour: validation is reason non-blank, otherwise the alert "Please enter a reason to retire this asset." On success sets status `Retired`, clears the overdue flag, and replaces the asset's notes with the reason. Alert: "<asset> has been retired." After this the card's "Record service" and "Edit" are blocked with the alert "The asset is kept in the history and can no longer be serviced/edited."; "Retire" shows "<asset> is already retired."

## 8. Add screen: Assets tab, and the Edit screen

### 8.1 Add screen: Assets tab ("Register assets")

The 5-tab row is hidden on this tab (only when opened for Assets). Header: "Register assets" (add) or "Edit Records" (edit). Button: "Save Assets" (add) or "Save Changes" (edit).

| Field | Type | Required? | Options as designed | Unit | Notes |
|---|---|---|---|---|---|
| Assets Type * | single-select + "+ Add" | Yes (`*`) | `Power Tiller`, `Sprayer`, `Tractor`, `Water Pump`, `Chaff Cutter` | n/a | Edit prefill: `Power Tiller` if the name contains "tiller", else the part of the card sub-title before `(`. |
| Category * | single-select + "+ Add" | Yes (`*`) | `Machinery`, `Equipment`, `Irrigation`, `Storage` | n/a | |
| Sources * | single-select + "+ Add" | Yes (`*`) | `Added by Farmer`, `Purchased New`, `Co-op Grant`, `Leased` | n/a | Edit prefill is a hard-coded `Added by Farmer`. |

Held in state and sent on save, but NOT rendered as inputs on this form: `purchaseDate` (default `28-10-2026`, or the card date in edit), `serviceEveryDays` (default `180`, or the card's service interval in edit), `assetNotes` (empty, or the card notes in edit). The asset card and the Edit screen do show these concepts (Purchased, Service every, Last service, Next service due, Location/Plot). See section 9.

Action: `onSave('Assets', { assetsType, assetCategory, assetSources, purchaseDate, serviceEveryDays, assetNotes })`. Design behaviour: in edit mode shows the alert "Asset record updated successfully."; the screen closes; no validation in code.

### 8.2 `AdminEditFarmRecordScreen` (diary edit; also coded for crop, livestock and asset)

The header is `record.headerTitle`. A single form card has these fields; labels change with `record.type`. Button "Save". From `AdminFarmerDetailScreen` only the `diary` type reaches this screen; from `SuperAdminFarmRecordsScreen` all four types do.

Common to all types:

| Field | Type | Required? | Options as designed | Unit | Notes |
|---|---|---|---|---|---|
| Date * (label "Planted date" for crop, "Acquired date" for livestock, "Purchased date" for asset, "Date" for diary) | date `DD MMM YYYY` (text + calendar) | Yes (`*`) | n/a | n/a | Validated: must be non-blank. Default `28 Oct 2026`. |
| Plot * (label "Location / Plot" for livestock and asset) | text input with a dropdown chevron (no actual list) | Yes (`*`) | No list in the design. Per-farmer (plots). | n/a | Validated: must be non-blank. Default `Plot 1 (1.8 acre)`. |
| Activity category * (label "Crop category & variety" for crop, "Animal type & name" for livestock, "Asset category & name" for asset) | text input with a chevron | Yes (`*`) | No list in the design. | n/a | Holds the card's category. Default `Nutrient`. |
| Activity * (diary) / second unlabeled "Details" input (other types) | text input with a chevron | Yes for diary (`*`); unlabeled otherwise | No list in the design. | n/a | Diary default `Compost application`. |
| Notes (up to 500 characters) | multiline text | Not marked | n/a | n/a | |
| Photos (up to 5) | photo | Not marked | n/a | n/a | One thumbnail with a delete badge and a camera tile. The design stores only a `hasPhoto` boolean. |

Diary only:

| Field | Type | Required? | Options | Unit | Notes |
|---|---|---|---|---|---|
| Time spent (minutes, 1-1,440) * | number | Yes (`*`) | n/a | minutes | Default `90`. The range appears only in the label. |
| Linked crop (optional) | text input with a chevron | Optional | No list in the design. Per-farmer. | n/a | Default `Tomato (same plot)`. A card without a link uses the text `No linked crop`. |
| Workforce lines (optional) | repeatable rows ("Add +") | Optional | n/a | n/a | Row fields: Name, Hours, Wage (₹). New rows are blank (`''`). Wage is money, so Money type (integer paise). |

Crop only (coded, reachable only from `SuperAdminFarmRecordsScreen`):

| Field | Type | Required? | Options | Unit | Notes |
|---|---|---|---|---|---|
| Growth stage * | text input with a chevron | Yes (`*`) | No list in this screen. | n/a | Default `Vegetative`. |
| Expected harvest | date `DD MMM YYYY` | Not marked | n/a | n/a | Default `27 Nov 2026`. |
| Seed source | text | Not marked | n/a | n/a | Default `Own saved seed`. |
| Grade | text input with a chevron | Not marked | No list in this screen. | n/a | Default `Grade 1`. |
| Workforce lines (optional) | repeatable rows | Optional | n/a | n/a | Also shown for crop, like diary. |

Livestock only:

| Field | Type | Required? | Options | Unit | Notes |
|---|---|---|---|---|---|
| Breed * | text | Yes (`*`) | n/a | n/a | Default `Jersey`. |
| Latest production log | text | Not marked | n/a | n/a | Free text such as `12 litres of milk, 27 Oct 2026`. A derived value on the card. |

Asset only:

| Field | Type | Required? | Options | Unit | Notes |
|---|---|---|---|---|---|
| Service interval * | text | Yes (`*`) | n/a | days | Placeholder `e.g. 180 days` (text with the unit). |
| Last service date | date `DD MMM YYYY` | Not marked | n/a | n/a | |
| Next service due | date `DD MMM YYYY` | Not marked | n/a | n/a | Editable here; on the asset card it is shown as derived. |

Action: "Save" validates only date and plot are non-blank (alert "Please fill in all mandatory fields (*)."). Design behaviour: builds an updated record containing all the fields above (including workforce, hasPhoto and every type-specific field, regardless of type), calls `onSave`, shows "<headerTitle> updated successfully." and goes back. The other `*` fields are not validated in code.

## 9. Open questions for the owner

1. Plant tab vs Crops tab: the Plant tab (Plant Type, Variant, Area, Grade, Expected harvest days, Notes) looks like a farmer's planting, but it has no plot, planted date or seed source, while the crop card shows plot, planted date, seed source and stage and the crop-card Edit passes them. The Crops tab (Crop Code, Botanical name, Family, Classification, Suitable season/zone/soil, 7 stage durations, Crop image/Document) looks like a crop-type master record, not a farmer record. Which tab creates which record, and which one does an admin on a farmer's profile use? Is the Crops tab reachable from this farmer screen at all (the only entry is the tab row on the Add screen)?
2. Crop Code: the helper says the code is permanent and cannot be changed, yet the field is editable and "Generate" makes `CAR` + 3 random digits regardless of the crop name. The existing API (`CropMaster.code`) is server-generated (example `CRP-001`, BR-150). Should the backend generate the code and the design field become read-only?
3. Crop-card codes in the design are `CRP-0000` style, and the Add screen uses `CAR003` style. Which is correct?
4. Livestock ID vs Tag: Step 1 has a "Livestock ID" dropdown (`COW-01` ...) and a "Tag (required)" text input ("Unique per farmer in any case"). Edit prefills both from the same value. The card also shows a system code (`ANM-0001`) and a tag (`COW-01`). What is the difference between Livestock ID, Tag and the system code, and which are stored? In the existing `Animal` schema there is only `tag`.
5. Livestock Type vs Species: the design has both ("Cattle/Poultry/Goat/Sheep" and "Cow/Buffalo/Goat/Hen"). The existing `Animal.species` enum is `CATTLE, BUFFALO, GOAT, POULTRY, SHEEP`. Should the backend store both, or is Type derived from Species (and is `Sheep` missing from Species, `Buffalo` missing from Type)?
6. Livestock Source Farm list includes `Own Farm Born`, which mixes two concepts in the API (`source` = `BORN_ON_FARM`/`PURCHASED` and free-text `sourceFarm`). Organic status labels (`Certified Organic`, `In Conversion`, `Conventional`) differ from the API enum (`ORGANIC`, `TRANSITIONING`, `CONVENTIONAL`). Which wording is authoritative?
7. Per-farmer option lists (Plots, Linked crop, Livestock ID, Source Farm, Sire/Bull) are hard-coded demo arrays in the design. Which API supplies each, and are Source Farm and Sire/Bull per-farmer free lists or global reference data?
8. The livestock form is one 5-step wizard that creates an animal plus a feed record, a production record, a breeding record and a health record in one Save, but the Save call only passes six fields. The existing farmer-side API has separate resources (animal, feed plan/feed log, production log, breeding record with 4 types, health record with 4 types). Should "Save Livestock" create the animal only, or all five records in one request? Which step fields are mandatory given Steps 2-5 are all starred?
9. Breeding Record step is shown for every animal and marks calving fields required, even for a male, a hen, or an animal not yet bred. The existing API says breeding records exist only for FEMALE animals (BR-140). What should happen for males and for poultry?
10. "Breed Type" sits in the Breeding step but is the animal's breed (it is what the edit screen and card call "Breed"). Confirm it maps to the animal's own breed field.
11. Production step: the Unit dropdown (`lt`, `kg`, `pcs`; state name `prodGenderUnit`) is independent of Production Type, and "Fat %" is required for all production types and is a fixed dropdown (`3.8`, `4.2`, `4.5`, `5.0`). Should unit be fixed by product type (the existing API fixes one unit per product), and is Fat % only for milk? Are `Morning Yield`/`Evening Yield`/`Daily Collection` the same as the API's session values?
12. Log production modal: quantity must be a whole number (parseInt), while the existing API quantity is a decimal greater than 0. Is a whole number required, or should decimals (for example 2.5 litres) be allowed? The modal's Product options carry the unit inside the label (`milk (litres)`): are the options derived from the species, and what is the full product list?
13. Workforce wage: the Add form says "Wage (₹)" with default `350` and the card says "2 workers, 4 hrs each". Is the wage per hour or per day or total? It must be the Money type (integer paise) per CLAUDE.md section 2.2. The existing API field is `wageRatePaise` (per hour). Hours default to 4 in the Add form and blank in the Edit form.
14. Diary: `Activity` options are one flat list not filtered by the category (the farmer-side API has category and sub-activity). Notes limit is 500 characters in the label, while the farmer-side API allows 2000. Time spent range is 1-1,440 in the Edit label only. Photos: "up to 5", but the Add screen has one tile with no handler and the Edit screen holds a single thumbnail. Is five the real limit, and are photos uploaded in the same request?
15. Diary "Added on behalf" vs "Farmer's own" badge and "Added by Demo Super Admin on behalf": it implies the backend records who created the entry. Confirm that an admin entry is stored against the farmer with an "added by admin" marker.
16. Update stage modal: choosing `Harvest` as the new stage marks the crop Harvested without a date or quantity, bypassing Record harvest. Should the backend allow that, or should moving to `Harvest` require the harvest details? Status `Planned` is displayed while the design's sample has stage 5 of 7, and any stage update sets `Growing`. How do the design statuses (`Planned`, `Growing`, `Harvested`) map to the API's `PLANNED`, `GROWING`, `HARVESTED`, `FAILED`?
17. Record harvest: "Harvested" is a closed record that cannot be edited afterwards, and Edit on a Harvested crop is not blocked in the design (only Update stage and Record harvest are). Should the crop Edit be blocked too?
18. Record harvest does not compare the harvest date with the planted date or with today, and "whole kg" is checked by `parseInt` (so `12.5` passes as 12). Is that intended?
19. End record: the design collects outcome, date and reason (reason required). The existing API lifecycle event has `eventType`, `eventDate`, `counterparty`, `salePricePaise` (money), `reason` and `notes`, with reason optional. Should sale price/buyer be collected for `Sold`/`Transferred`? If so the price is money (integer paise).
20. Record service: the design only updates `lastService` and replaces the asset's notes with the new note (losing the previous notes). Should the service note be a history entry rather than overwriting asset notes? "Next service due" is not recomputed in the design but is a computed value in the existing API.
21. Retire: reason is required in the design and overwrites the asset's notes. The existing API has no retired state (status is `OK`, `DUE_SOON`, `OVERDUE`). Should retire be a soft state with its own reason/date columns, and do Retired assets still appear in the list?
22. Asset fields: the Add form shows only Type, Category and Sources, but the card shows Purchased, Service every, Last service, Next service due and a Location/Plot, and the Add screen's state (and Save) includes purchase date, service interval and notes, which are not rendered. Should the Add form include them? Cost (money) is not collected anywhere in the design. Asset Category options (`Machinery`, `Equipment`, `Irrigation`, `Storage`) differ from the API enum (`TOOL`, `EQUIPMENT`, `MACHINERY`). Asset Type is a fixed 5-item list while the API `name` is free text. What does "Sources" map to (no API field)?
23. Service interval is a number (`180`) in the Add state, and a text with the unit (`180 days`) on the card and Edit screen. Which is stored (the API has `serviceIntervalDays` as an integer)?
24. Edit uses different forms depending on the entry point: from `AdminFarmerDetailScreen`, crop/livestock/asset edits open the Add screen in edit mode (which loses fields such as Growth stage, Seed source, Last service, Next service due, Latest production log that the Edit screen shows), but from `SuperAdminFarmRecordsScreen` all edits open `AdminEditFarmRecordScreen`. Is the edit payload the same as the add payload, and which screen is the intended edit form for crop, livestock and asset?
25. In edit mode on the Add screen, several fields are prefilled with hard-coded values instead of record data (Expected harvest days `90`, Gender `Female`, Source Farm `Own Farm Born`, Organic status `Certified Organic`, Sources `Added by Farmer`, Grade mapping `Grade 1` to `Grade (G1)`). The Plant/Livestock prefill also parses display strings (`·`, `acre`, `(`). The backend should return structured fields so the app does not have to parse them. Which fields must the edit-detail response contain?
26. "+ Add" custom options: should a typed option create a global option (visible to every admin and farmer), a per-farmer option, or only apply to this record? The design hides it in the farmer detail routing (`allowAddOptions={false}`) but shows it in `SuperAdminFarmRecordsScreen`. Should it exist at all in this app?
27. Option sets that are inconsistent with another part of the design: Suitable soil default `Nilgiris` is not in its option list (which contains place names `Coonoor`, `Ooty` alongside soil types). Suitable zone options are zone names. "Examination harvest days" (Crops tab) is probably "Expected harvest days". Grades are `Grade (G1/G2/G3)`/`Not Mentions` in the design but `GRADE_A/B/C` in the API (`ExpectedGrade`); the cards show `Grade 1`. Which labels and mapping are intended?
28. Dates: the Add screen and modals use `DD-MM-YYYY`, the Edit screen and cards use `DD MMM YYYY`. All "today" defaults are the fixed date 28-10-2026 in the design. Confirm the backend takes ISO dates and that the app defaults to the real current date.
29. Photos and documents (Crop image, Crop Document, diary photos, animal photo): are they uploaded through the existing upload-signing flow, and is EXIF stripping (BR-16) expected for admin uploads too? The Crops tab helper mentions "Replacing a verified document creates a new version" but no verify flow exists on this form.
