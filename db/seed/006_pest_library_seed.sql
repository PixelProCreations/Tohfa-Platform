-- =============================================================================
-- 006_pest_library_seed.sql — TOHFA pest/disease reference catalog (FR-F07)
--
-- Idempotent (matches db/seed/001_reference.sql's pattern: `ON CONFLICT
-- (natural key) DO UPDATE SET ..., updated_at = now()`). Safe to re-run on
-- every deploy; it is the definition of the reference rows, not a one-time
-- bootstrap. Run AFTER db/migrations/0023_pest_management.sql:
--
--     psql -v ON_ERROR_STOP=1 -d "$DATABASE_URL" -f db/seed/006_pest_library_seed.sql
--
-- Content is merged from the mobile app's two pest reference mockups —
-- PestLibraryScreen's PEST_LIBRARY_DATA (6 entries: symptoms/organic
-- treatments/prevention) and LogPestTreatmentScreen's PEST_LIST (5 entries:
-- recommendedTreatment/intervalDays/phiDays) — deduplicated into one
-- catalog. See the migration task report for the exact merge decisions;
-- summary of the two conflicts found:
--   * Powdery Mildew: PestLibraryScreen and PestManagementScreen's live
--     detection mock both give `Erysiphales`; only LogPestTreatmentScreen
--     gives `Leveillula taurica`. `Erysiphales` wins (2 of 3 screens).
--   * Aphid(s): both source screens agree on `Aphis gossypii` — no conflict.
--     (PestManagementScreen's unrelated *detection* mock data separately
--     uses `Aphidoidea` for a logged instance, but that is farmer-entered
--     instance data, not reference-catalog data, so it is out of scope here.)
-- Entries present in only one source screen (Diamondback Moth, Carrot Rust
-- Fly, Damping-off from PestLibraryScreen; Fruit Borer, Leaf Curl Virus from
-- LogPestTreatmentScreen) keep that screen's fields and are filled out with
-- reasonable admin-curated values for the fields the other screen's shape
-- required but the source data did not supply (recommended_treatment/
-- interval_days/phi_days for the three library-only entries; symptoms/
-- organic_treatments/prevention for the two list-only entries). This is
-- static seed content, not the automated per-farmer advisory text BR-38
-- blocks (docs/rules.md).
-- =============================================================================

BEGIN;

INSERT INTO pest_library
    (name, scientific_name, category, risk_level, crops, season, symptoms,
     organic_treatments, prevention, recommended_treatment, interval_days, phi_days)
VALUES
    (
        'Early Blight', 'Alternaria solani', 'Disease', 'High',
        ARRAY['Tomato', 'Potato'], 'Jul–Sep',
        ARRAY[
            'Concentric dark rings ("target board" pattern) on older leaves',
            'Yellow chlorotic halos surrounding lesions',
            'Premature leaf yellowing, drying, and defoliation',
            'Dark sunken leathery lesions at stem base and fruit calyx'
        ],
        ARRAY[
            'Trichoderma viride bio-fungicide foliar spray (5g/L)',
            'Copper hydroxide or Bordeaux mixture (1%) preventive application',
            'Baking soda solution (5g/L) with horticultural oil sticker'
        ],
        ARRAY[
            'Maintain minimum 60cm spacing between rows for ventilation',
            'Apply organic straw mulch to prevent soil-splash onto lower leaves',
            'Strict drip irrigation to avoid wet foliage overnight',
            'Minimum 2-year Solanaceae crop rotation schedule'
        ],
        'Bordeaux mixture', 7, 7
    ),
    (
        'Diamondback Moth', 'Plutella xylostella', 'Pest', 'High',
        ARRAY['Cabbage'], 'Jul–Sep',
        ARRAY[
            'Clear "windowpane" holes where caterpillars consume lower leaf surface',
            'Extensive skeletonization of young wrapper leaves',
            'Caterpillar frass and silken webs inside developing cabbage heads',
            'Stunted head formation and unmarketable heads'
        ],
        ARRAY[
            'Bacillus thuringiensis kurstaki (Bt) foliar spray (1.5–2g/L)',
            '5% Neem Seed Kernel Extract (NSKE) applied at 7-day intervals',
            'Pheromone trap installation (12 traps/acre for mating disruption)'
        ],
        ARRAY[
            'Mustard trap cropping: plant 2 border rows to attract moths away',
            'Fine 50-mesh nylon netting over seedling nursery beds',
            'Conservation of natural parasitoid wasps (Diadegma insulare)'
        ],
        'Bacillus thuringiensis kurstaki (Bt) foliar spray (1.5–2g/L)', 7, 3
    ),
    (
        'Aphids', 'Aphis gossypii', 'Pest', 'Medium',
        ARRAY['Carrot', 'Tomato', 'Cabbage'], 'Jun–Aug',
        ARRAY[
            'Distorted, crumpled, and curled tender new growth',
            'Sticky honeydew secretions coating foliage and fruit',
            'Black sooty mold fungi colonizing honeydew-coated leaves',
            'Vectoring of viral diseases (e.g. cucumber mosaic virus)'
        ],
        ARRAY[
            'Cold-pressed Neem Oil spray (3–5ml/L) with natural emulsifier soap',
            'Potassium salt insecticidal soap solution',
            'Release of beneficial predators: Ladybird beetles & Green lacewings'
        ],
        ARRAY[
            'Companion planting with marigolds, dill, fennel, and coriander',
            'Avoid high-dose synthetic or uncomposted nitrogen applications',
            'Reflective silver mulch to deter incoming winged aphids'
        ],
        'Dashparni kashayam', 7, 0
    ),
    (
        'Carrot Rust Fly', 'Psila rosae', 'Pest', 'Medium',
        ARRAY['Carrot'], 'May–Jul',
        ARRAY[
            'Rusty-red or dark brown larval mine tunnels inside root flesh',
            'Stunted, purplish-bronze foliage that wilts in warm daylight',
            'Forked, unmarketable root tubers prone to secondary soft rot'
        ],
        ARRAY[
            'Entomopathogenic beneficial nematodes (Steinernema feltiae)',
            'Garlic and chili repellent foliar spray during flight periods',
            'Diatomaceous earth dusting along seed furrows'
        ],
        ARRAY[
            'Floating horticultural fleece row covers installed immediately after seeding',
            'Interplanting with onions, leeks, or rosemary to mask root scents',
            'Delay seeding until after first spring flight period'
        ],
        'Entomopathogenic beneficial nematodes (Steinernema feltiae)', NULL, NULL
    ),
    (
        'Damping-off', 'Pythium spp.', 'Disease', 'Medium',
        ARRAY['Cabbage', 'Tomato'], 'Monsoon',
        ARRAY[
            'Water-soaked stem lesions right at soil level line',
            'Sudden seedling collapse and toppling over in seedbeds',
            'Pre-emergence seed decay and poor nursery germination'
        ],
        ARRAY[
            'Trichoderma harzianum seed treatment (4g/kg seed)',
            'Pseudomonas fluorescens soil drench (10g/L water)',
            'Wood ash sprinkling around base of seedling trays'
        ],
        ARRAY[
            'Utilize raised nursery beds with well-aerated sterile compost substrate',
            'Avoid excessive watering and shade in nursery tunnels',
            'Solarize nursery soil beds 4 weeks prior to monsoon sowing'
        ],
        'Trichoderma harzianum seed treatment (4g/kg seed)', NULL, NULL
    ),
    (
        -- Scientific name resolved to `Erysiphales` — see file header note.
        'Powdery Mildew', 'Erysiphales', 'Disease', 'Low',
        ARRAY['Beetroot', 'Carrot'], 'Aug–Oct',
        ARRAY[
            'White circular talcum-like fungal powder spots on upper leaf surfaces',
            'Chlorosis and curling of older outer foliage',
            'Premature leaf senescence reducing photosynthesis and root bulking'
        ],
        ARRAY[
            'Raw cow milk spray diluted 1:9 with clean water',
            'Wettable sulfur (80% WP) at 2g/L (do not apply in extreme heat)',
            'Potassium bicarbonate spray (3g/L) for immediate pH shock to spores'
        ],
        ARRAY[
            'Prune dense canopy to ensure air circulation through bed centers',
            'Plant disease-tolerant varieties adapted to humid hill climates',
            'Maintain balanced potassium fertilization for cell wall strength'
        ],
        'Wettable Sulphur / Trichoderma', 12, 5
    ),
    (
        'Fruit Borer', 'Helicoverpa armigera', 'Pest', 'High',
        ARRAY['Tomato'], 'Aug-Oct',
        ARRAY[
            'Circular entry holes bored into green and ripening fruit',
            'Frass (larval excreta) visible at fruit entry points',
            'Premature fruit drop from internal larval feeding damage',
            'Larvae boring into flower buds and shoot tips of young plants'
        ],
        ARRAY[
            'Neem oil spray (1500 ppm) at 7–10 day intervals',
            'Bacillus thuringiensis (Bt) foliar application',
            'Pheromone traps (Helilure) at 5 traps/acre for monitoring and mass trapping'
        ],
        ARRAY[
            'Install yellow/blue sticky traps to monitor adult moth activity',
            'Handpick and destroy visibly infested fruit',
            'Intercrop with marigold as a trap crop',
            'Avoid continuous tomato cropping in the same plot season after season'
        ],
        'Neem oil spray (1500 ppm)', 10, 3
    ),
    (
        'Leaf Curl Virus', 'Begomovirus / Whitefly vector', 'Disease', 'High',
        ARRAY['Tomato'], 'Year-round',
        ARRAY[
            'Upward curling and crinkling of young leaves',
            'Stunted plant growth and shortened internodes',
            'Yellowing along leaf veins and leaf margins',
            'Reduced flowering and fruit set'
        ],
        ARRAY[
            'Agniastra botanical decoction foliar spray',
            'Yellow sticky traps to reduce whitefly vector population',
            'Neem oil spray (3–5ml/L) targeting whitefly nymphs'
        ],
        ARRAY[
            'Use whitefly-proof nursery netting for seedlings',
            'Rogue and remove infected plants promptly to reduce virus reservoir',
            'Maintain field margins free of weeds that host whiteflies',
            'Avoid planting near recently infected fields'
        ],
        'Agniastra + Yellow Sticky Traps', 7, 0
    )
ON CONFLICT (name) DO UPDATE SET
    scientific_name      = EXCLUDED.scientific_name,
    category              = EXCLUDED.category,
    risk_level            = EXCLUDED.risk_level,
    crops                 = EXCLUDED.crops,
    season                = EXCLUDED.season,
    symptoms              = EXCLUDED.symptoms,
    organic_treatments    = EXCLUDED.organic_treatments,
    prevention            = EXCLUDED.prevention,
    recommended_treatment = EXCLUDED.recommended_treatment,
    interval_days         = EXCLUDED.interval_days,
    phi_days              = EXCLUDED.phi_days,
    updated_at            = now();

COMMIT;
