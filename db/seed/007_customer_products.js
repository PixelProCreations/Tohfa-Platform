#!/usr/bin/env node
// =============================================================================
// 007_customer_products.js - Customer-app catalogue: products, prices, stock
//
// DEV ONLY (SEED_KINDS = 'dev': needs SEED_DEV_USERS=true; needs the 001 crops
// and warehouses plus the 003 super admin and farmers). Refuses NODE_ENV=production.
// IDEMPOTENT: crops/prices upsert on natural keys; batches upsert on batch_code
// and are NOT reset on re-run (so stock consumed by test orders is preserved).
//
// What the customer catalogue is built from (apps/api catalog.repo.ts):
//   crop_master (the product; display metadata from 0141)  -> name, pack, MRP, ...
//   fair_prices + retail_prices (per grade)                -> price per kg
//   inventory_batches + allocations(ONLINE)                -> availableQty
// A product is listed only if it has an ACTIVE batch with ONLINE allocation > 0.
//
// icon_key: the catalog serializer emits https://cdn.tohfa.in/products/<icon_key>.jpg.
// Keys match the bundled mobile registry names (ProductImages in
// apps/mobile/src/roles/customer/assets/images/products/index.ts) where one exists.
//
// Categories are NOT added here: 001 asserts exactly 6 categories.
// =============================================================================
import pg from 'pg';

if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to seed customer products when NODE_ENV=production.');
  process.exit(1);
}
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required.');
  process.exit(1);
}

const SUPER_ADMIN_ID = '00000000-0000-0000-0000-000000000001';

// stock: kg at WH-OOTY (primary). Items under 20 kg are low-stock and Ooty-only.
// g2: optional Grade 2 variant price. mrp: display-only compare-at price (discounted items).
// Columns: slug, name, name_ta, cat, price, mrp, g2, stock, packSize, packUnit, farming, icon, season, shelf, taste
const P = [
  // ---- Vegetables ----
  ['carrot', 'Carrot', 'கேரட்', 'vegetables', 60, 75, 52, 420, 1, 'KG', 'NATURAL', 'vegCarrot', 'Oct-Mar', 21, 'Sweet and crunchy Ooty carrots'],
  ['potato', 'Potato', 'உருளைக்கிழங்கு', 'vegetables', 45, null, 38, 800, 1, 'KG', 'CONVENTIONAL', 'vegPotato', 'Jun-Aug, Dec-Feb', 60, 'Firm, earthy hill potatoes'],
  ['beetroot', 'Beetroot', 'பீட்ரூட்', 'vegetables', 55, 65, null, 260, 1, 'KG', 'NATURAL', 'vegBeetroot', 'Sep-Mar', 30, 'Deep red and naturally sweet'],
  ['cabbage', 'Cabbage', 'முட்டைகோஸ்', 'vegetables', 35, null, null, 300, 1, 'KG', 'CONVENTIONAL', 'vegCabbage', 'Oct-Mar', 21, 'Crisp, compact heads'],
  ['cauliflower', 'Cauliflower', 'காலிஃபிளவர்', 'vegetables', 50, null, null, 14, 1, 'KG', 'NATURAL', 'vegCauliflower', 'Oct-Feb', 14, 'Tender white curds'],
  ['broccoli', 'Broccoli', 'ப்ரோக்கோலி', 'vegetables', 120, 150, null, 90, 500, 'G', 'ORGANIC', 'vegBroccoli', 'Nov-Feb', 10, 'Fresh green florets'],
  ['beans', 'French Beans', 'பீன்ஸ்', 'vegetables', 70, null, null, 180, 1, 'KG', 'NATURAL', 'vegBeans', 'Mar-Oct', 8, 'Tender and stringless'],
  ['peas', 'Green Peas', 'பச்சை பட்டாணி', 'vegetables', 110, null, null, 9, 500, 'G', 'NATURAL', 'vegPeas', 'Nov-Mar', 10, 'Sweet shelled peas'],
  ['garlic', 'Ooty Garlic', 'ஊட்டி பூண்டு', 'vegetables', 180, 220, null, 150, 500, 'G', 'NATURAL', 'kitchenGarlic', 'Mar-May, Nov-Dec', 120, 'Pungent, small-clove hill garlic'],
  ['radish', 'Radish', 'முள்ளங்கி', 'vegetables', 40, null, null, 120, 1, 'KG', 'CONVENTIONAL', 'vegRadish', 'Oct-Mar', 10, 'Mild, juicy white radish'],
  ['tomato', 'Tomato', 'தக்காளி', 'vegetables', 40, 50, 32, 500, 1, 'KG', 'CONVENTIONAL', 'foryouTomatoes', 'All year', 7, 'Ripe, tangy country tomatoes'],
  ['onion', 'Onion', 'வெங்காயம்', 'vegetables', 38, null, null, 700, 1, 'KG', 'CONVENTIONAL', 'vegOnion', 'All year', 45, 'Everyday red onions'],
  ['brinjal', 'Brinjal', 'கத்தரிக்காய்', 'vegetables', 55, null, null, 160, 1, 'KG', 'NATURAL', 'foryouBrinjal', 'All year', 7, 'Glossy purple brinjal'],
  ['okra', 'Ladies Finger', 'வெண்டைக்காய்', 'vegetables', 60, null, null, 12, 500, 'G', 'NATURAL', 'vegOkra', 'Mar-Oct', 4, 'Tender green okra'],
  ['pumpkin', 'Pumpkin', 'பூசணிக்காய்', 'vegetables', 30, null, null, 240, 1, 'KG', 'NATURAL', 'vegPumpkin', 'All year', 30, 'Sweet orange-fleshed pumpkin'],
  // ---- Fruits ----
  ['banana', 'Banana (Robusta)', 'வாழைப்பழம்', 'fruits', 60, null, null, 320, 1, 'DOZEN', 'NATURAL', 'fruitBanana', 'All year', 7, 'Soft and sweet'],
  ['orange', 'Nilgiri Orange', 'ஆரஞ்சு', 'fruits', 90, 110, null, 200, 1, 'KG', 'NATURAL', 'fruitOrange', 'Nov-Feb', 21, 'Juicy with a sweet-tangy balance'],
  ['strawberry', 'Strawberry', 'ஸ்ட்ராபெரி', 'fruits', 320, 380, null, 11, 250, 'G', 'NATURAL', 'foryouStrawberries', 'Nov-Mar', 5, 'Fragrant Ooty strawberries'],
  ['avocado', 'Avocado', 'அவகாடோ', 'fruits', 280, null, null, 60, 500, 'G', 'NATURAL', 'fruitAvocado', 'Aug-Nov', 14, 'Buttery Nilgiri avocado'],
  ['pear', 'Pear', 'பேரிக்காய்', 'fruits', 160, null, null, 85, 1, 'KG', 'NATURAL', 'fruitPear', 'Jun-Aug', 14, 'Crisp and mildly sweet'],
  ['plum', 'Plum', 'பிளம்ஸ்', 'fruits', 200, 240, null, 7, 500, 'G', 'NATURAL', 'fruitPlum', 'Apr-Jun', 7, 'Tart-sweet hill plums'],
  ['apple', 'Apple', 'ஆப்பிள்', 'fruits', 180, 210, 150, 220, 1, 'KG', 'CONVENTIONAL', 'fruitApple', 'Jul-Nov', 30, 'Crunchy red apples'],
  ['mango', 'Mango (Banganapalli)', 'மாம்பழம்', 'fruits', 140, 170, null, 130, 1, 'KG', 'NATURAL', 'fruitMango', 'Apr-Jul', 7, 'Rich and fibreless'],
  ['pomegranate', 'Pomegranate', 'மாதுளை', 'fruits', 170, null, null, 110, 1, 'KG', 'NATURAL', 'fruitPomegranate', 'Sep-Feb', 14, 'Ruby seeds, sweet juice'],
  ['grapes', 'Seedless Grapes', 'திராட்சை', 'fruits', 110, null, null, 95, 500, 'G', 'CONVENTIONAL', 'fruitGrapes', 'Jan-Apr', 7, 'Green seedless grapes'],
  ['watermelon', 'Watermelon', 'தர்பூசணி', 'fruits', 30, 40, null, 400, 1, 'KG', 'CONVENTIONAL', 'foryouWatermelon', 'Mar-Jun', 10, 'Cool and refreshing'],
  // ---- Spices ----
  ['pepper', 'Black Pepper', 'கருமிளகு', 'spices', 750, 850, null, 80, 100, 'G', 'ORGANIC', 'spiceBlackPepper', 'Nov-Feb', 365, 'Bold and aromatic Nilgiri pepper'],
  ['cardamom', 'Cardamom', 'ஏலக்காய்', 'spices', 2400, 2700, null, 25, 50, 'G', 'ORGANIC', 'spiceCardamom', 'Aug-Nov', 365, 'Plump green pods, intense aroma'],
  ['turmeric', 'Turmeric (Erode)', 'மஞ்சள்', 'spices', 220, null, null, 70, 250, 'G', 'NATURAL', 'spiceTurmeric', 'Jan-Mar', 365, 'Deep colour, high curcumin'],
  ['cloves', 'Cloves', 'கிராம்பு', 'spices', 1100, null, null, 15, 50, 'G', 'NATURAL', 'spiceCloves', 'Nov-Jan', 365, 'Strong, warm and sweet'],
  ['cinnamon', 'Cinnamon', 'இலவங்கப்பட்டை', 'spices', 600, null, null, 40, 100, 'G', 'NATURAL', 'spiceCinnamon', 'All year', 365, 'Thin, fragrant quills'],
  ['cumin', 'Cumin Seeds', 'சீரகம்', 'spices', 480, 540, null, 55, 100, 'G', 'CONVENTIONAL', 'spiceCumin', 'All year', 365, 'Earthy whole jeera'],
  ['coriander-seeds', 'Coriander Seeds', 'மல்லி விதை', 'spices', 160, null, null, 90, 250, 'G', 'CONVENTIONAL', 'spiceCorianderSeeds', 'Feb-Apr', 365, 'Citrusy whole dhaniya'],
  ['mustard-seeds', 'Mustard Seeds', 'கடுகு', 'spices', 120, null, null, 8, 250, 'G', 'CONVENTIONAL', 'spiceMustardSeeds', 'Feb-Apr', 365, 'Small black tempering seeds'],
  ['dry-red-chilli', 'Dry Red Chilli', 'வத்தல் மிளகாய்', 'spices', 320, 360, null, 100, 250, 'G', 'NATURAL', 'spiceDryRedChilli', 'Jan-Apr', 365, 'Sun-dried, medium-hot'],
  // ---- Grains ----
  ['millet', 'Finger Millet (Ragi)', 'கேழ்வரகு', 'grains', 85, null, null, 350, 1, 'KG', 'ORGANIC', 'grainRagi', 'Sep-Nov', 365, 'Whole ragi, rich in calcium'],
  ['rajma', 'Rajma (Red Kidney Beans)', 'ராஜ்மா', 'grains', 150, null, null, 120, 500, 'G', 'NATURAL', 'grainRajma', 'Sep-Nov', 365, 'Chitra rajma from the hills'],
  ['ponni-rice', 'Ponni Raw Rice', 'பொன்னி அரிசி', 'grains', 62, null, null, 900, 1, 'KG', 'CONVENTIONAL', 'grainRawRice', 'All year', 365, 'Soft everyday rice'],
  ['brown-rice', 'Brown Rice', 'பழுப்பு அரிசி', 'grains', 90, 105, null, 180, 1, 'KG', 'NATURAL', 'grainBrownRice', 'All year', 270, 'Unpolished and fibre-rich'],
  ['foxtail-millet', 'Foxtail Millet (Thinai)', 'தினை', 'grains', 95, null, null, 160, 1, 'KG', 'ORGANIC', 'grainFoxtailMillet', 'Sep-Nov', 365, 'Light and nutty'],
  ['pearl-millet', 'Pearl Millet (Kambu)', 'கம்பு', 'grains', 70, null, null, 10, 1, 'KG', 'NATURAL', 'grainPearlMillet', 'Sep-Nov', 365, 'Hearty traditional millet'],
  // ---- Herbs & Greens ----
  ['coriander', 'Coriander Leaves', 'கொத்தமல்லி', 'herbs-greens', 80, null, null, 60, 1, 'BUNCH', 'NATURAL', 'herbCoriander', 'Oct-Apr', 5, 'Fresh aromatic bunches'],
  ['mint', 'Mint Leaves', 'புதினா', 'herbs-greens', 70, null, null, 45, 1, 'BUNCH', 'NATURAL', 'herbMint', 'Mar-Sep', 5, 'Cooling, fragrant leaves'],
  ['spinach', 'Spinach (Keerai)', 'பசலைக்கீரை', 'herbs-greens', 50, null, null, 6, 1, 'BUNCH', 'ORGANIC', 'herbSpinach', 'Oct-Mar', 5, 'Tender leafy greens'],
  ['lettuce', 'Green Curly Lettuce', 'லெட்டூஸ்', 'herbs-greens', 90, 120, null, 50, 1, 'PIECE', 'ORGANIC', 'foryouLettuce', 'Oct-Mar', 7, 'Crisp curly leaves'],
  ['amaranth', 'Amaranth (Thandu Keerai)', 'தண்டுக்கீரை', 'herbs-greens', 45, null, null, 40, 1, 'BUNCH', 'NATURAL', 'herbAmaranth', 'All year', 4, 'Soft stems and leaves'],
  ['spring-onion', 'Spring Onion', 'வெங்காயத்தாள்', 'herbs-greens', 70, null, null, 55, 1, 'BUNCH', 'NATURAL', 'herbSpringOnion', 'Oct-Mar', 6, 'Mild green onions'],
  // ---- Dry goods ----
  ['tea', 'Nilgiri Black Tea', 'நீலகிரி தேயிலை', 'dry-goods', 650, 720, null, 85, 250, 'G', 'NATURAL', 'teaNilgiriBlack', 'All year', 730, 'Brisk, fragrant CTC leaf'],
  ['coffee', 'Arabica Coffee Beans', 'அரபிகா காபி', 'dry-goods', 900, null, null, 40, 250, 'G', 'NATURAL', 'coffeeArabicaBeans', 'Nov-Feb', 365, 'Shade-grown, medium roast'],
  ['palm-jaggery', 'Palm Jaggery', 'பனை வெல்லம்', 'dry-goods', 380, 420, null, 60, 500, 'G', 'NATURAL', 'sweetPalmJaggery', 'Feb-Jun', 365, 'Dark, caramel-rich karuppatti'],
  ['forest-honey', 'Forest Honey', 'காட்டுத் தேன்', 'dry-goods', 520, 600, null, 18, 500, 'G', 'NATURAL', 'sweetForestHoney', 'Mar-Jun', 730, 'Raw honey from Nilgiri forests'],
  ['raisins', 'Raisins', 'உலர் திராட்சை', 'dry-goods', 420, null, null, 75, 250, 'G', 'CONVENTIONAL', 'dryfruitRaisinBold', 'All year', 270, 'Plump seedless raisins'],
];

async function run() {
  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const wh = new Map((await client.query(`SELECT code, id FROM warehouses`)).rows.map((r) => [r.code, r.id]));
    const ooty = wh.get('WH-OOTY');
    const coon = wh.get('WH-COON');
    if (!ooty) throw new Error('WH-OOTY missing: run 001_reference.sql first.');
    const cats = new Map((await client.query(`SELECT slug, id FROM categories`)).rows.map((r) => [r.slug, r.id]));
    const admin = (await client.query(`SELECT id FROM users WHERE id = $1`, [SUPER_ADMIN_ID])).rows[0];
    if (!admin) throw new Error('Super admin (003_dev_users.sql) missing: run it first (SEED_DEV_USERS=true).');
    const farmerId = (await client.query(`SELECT id FROM farmers ORDER BY id LIMIT 1`)).rows[0]?.id;
    if (!farmerId) throw new Error('No farmers found: the 003 dev users seed must run before 007.');

    let batches = 0;
    for (const [slug, name, nameTa, cat, price, mrp, g2, stock, packSize, packUnit, farming, icon, season, shelf, taste] of P) {
      const catId = cats.get(cat);
      if (!catId) throw new Error(`category ${cat} missing`);

      const crop = await client.query(
        `INSERT INTO crop_master
           (slug, name, name_ta, category_id, icon_key, shelf_life_days, taste_notes, harvest_season,
            origin_region, farming_type, pack_size, pack_unit, compare_at_price)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Nilgiris',$9,$10,$11,$12)
         ON CONFLICT (slug) DO UPDATE SET
           name_ta = EXCLUDED.name_ta, icon_key = EXCLUDED.icon_key, taste_notes = EXCLUDED.taste_notes,
           harvest_season = EXCLUDED.harvest_season, origin_region = EXCLUDED.origin_region,
           farming_type = EXCLUDED.farming_type, pack_size = EXCLUDED.pack_size,
           pack_unit = EXCLUDED.pack_unit, compare_at_price = EXCLUDED.compare_at_price,
           shelf_life_days = COALESCE(crop_master.shelf_life_days, EXCLUDED.shelf_life_days),
           is_active = true, deleted_at = NULL
         RETURNING id`,
        [slug, name, nameTa, catId, icon, shelf, taste, season, farming, packSize, packUnit, mrp],
      );
      const cropId = crop.rows[0].id;

      const grades = [['GRADE_1', price, stock]];
      if (g2 !== null) grades.push(['GRADE_2', g2, Math.max(6, Math.round(stock * 0.4))]);

      for (const [grade, gPrice, gStock] of grades) {
        // Fair-price ceiling (BR-09): keep any open ceiling already set; else 25% above price.
        let fp = (
          await client.query(
            `SELECT id, ceiling_price FROM fair_prices WHERE crop_id=$1 AND grade=$2 AND effective_to IS NULL
              ORDER BY effective_from DESC LIMIT 1`,
            [cropId, grade],
          )
        ).rows[0];
        if (!fp) {
          fp = (
            await client.query(
              `INSERT INTO fair_prices (crop_id, grade, ceiling_price, effective_from, set_by)
               VALUES ($1,$2,$3, CURRENT_DATE - 30, $4) RETURNING id, ceiling_price`,
              [cropId, grade, (gPrice * 1.25).toFixed(2), SUPER_ADMIN_ID],
            )
          ).rows[0];
        }
        const finalPrice = Math.min(gPrice, Number(fp.ceiling_price));
        const rp = await client.query(
          `SELECT id FROM retail_prices WHERE crop_id=$1 AND grade=$2 AND effective_to IS NULL
            ORDER BY effective_from DESC LIMIT 1`,
          [cropId, grade],
        );
        if (rp.rows[0]) {
          await client.query(`UPDATE retail_prices SET price=$1, fair_price_id=$2 WHERE id=$3`, [
            finalPrice.toFixed(2),
            fp.id,
            rp.rows[0].id,
          ]);
        } else {
          await client.query(
            `INSERT INTO retail_prices (crop_id, grade, price, gst_inclusive, fair_price_id, effective_from, set_by)
             VALUES ($1,$2,$3,true,$4, CURRENT_DATE - 30, $5)`,
            [cropId, grade, finalPrice.toFixed(2), fp.id, SUPER_ADMIN_ID],
          );
        }

        // Stock: Ooty always; Coonoor too for well-stocked (>=20 kg) items.
        const sites = [[ooty, 'OOTY', gStock]];
        if (coon && gStock >= 20) sites.push([coon, 'COON', Math.round(gStock * 0.6)]);
        for (const [whId, whTag, qty] of sites) {
          const code = `BAT-CP-${slug.toUpperCase()}-${grade.slice(-1)}-${whTag}`;
          const b = await client.query(
            `INSERT INTO inventory_batches
               (batch_code, warehouse_id, crop_id, grade, source_farmer_id, qty_received, qty_available,
                cost_per_kg, received_on, status)
             VALUES ($1,$2,$3,$4,$5,$6,$6,$7, CURRENT_DATE - 1,'ACTIVE')
             ON CONFLICT (batch_code) DO UPDATE SET updated_at = now()
             RETURNING id, (xmax = 0) AS inserted`,
            [code, whId, cropId, grade, farmerId, qty.toFixed(3), (gPrice * 0.6).toFixed(2)],
          );
          const batchId = b.rows[0].id;
          if (b.rows[0].inserted) {
            await client.query(
              `INSERT INTO stock_ledger (batch_id, warehouse_id, movement_type, qty_delta, balance_after, remarks)
               VALUES ($1,$2,'RECEIPT',$3,$3,'Customer-product seed receipt')`,
              [batchId, whId, qty.toFixed(3)],
            );
            batches++;
          }
          // 70/10/10/10 (matches 004): ONLINE gets the customer-visible share.
          const online = Math.round(qty * 0.7 * 1000) / 1000;
          const rest = Math.round(qty * 0.1 * 1000) / 1000;
          for (const [ch, aq] of [
            ['ONLINE', online],
            ['LIVE_MARKET', rest],
            ['RESERVE', rest],
            ['BUFFER', rest],
          ]) {
            await client.query(
              `INSERT INTO allocations (batch_id, warehouse_id, channel, allocated_qty, computed_by)
               VALUES ($1,$2,$3,$4,'AUTO') ON CONFLICT (batch_id, channel) DO NOTHING`,
              [batchId, whId, ch, aq.toFixed(3)],
            );
          }
        }
      }
    }
    await client.query('COMMIT');
    console.log(`007_customer_products: ${P.length} products upserted, ${batches} new batches.`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('007_customer_products failed:', e.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}
run();
