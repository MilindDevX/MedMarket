/**
 * MedMarket India — Massive Analytics Seed
 *
 * Designed to populate the analytics panels with meaningful, patterned data
 * covering multiple cities, hundreds of users, and thousands of orders.
 * Dates are completely relative to the current execution time, so this seed
 * will look correct even if run months later.
 *
 * Patterns included:
 * - Surat pharmacies have an unusually high rejection rate (40%).
 * - Delivery vs Pickup split is roughly 80/20.
 * - Metro cities (Tier 1) have much higher GMV than Tier 2 cities.
 * - Dead stock (Asthalin Inhaler in Surat has 0 orders).
 * - Near-expiry alerts (Pan-D in Delhi).
 * - Complaints tightly correlated with rejected orders.
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from "../src/config/prisma.ts";

const hash = (pw: string) => bcrypt.hash(pw, 10);

function daysAgo(n: number, hour = 12, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(12, 0, 0, 0);
  return d;
}

const HOUR_WEIGHTS = [0,0,0,0,0,1,2,5,8,9,8,6,5,4,4,5,6,8,9,8,5,3,1,0];
const HOUR_TOTAL   = HOUR_WEIGHTS.reduce((a,b) => a+b, 0);
function pickHour(): number {
  let r = Math.random() * HOUR_TOTAL;
  for (let h = 0; h < 24; h++) { r -= HOUR_WEIGHTS[h]; if (r <= 0) return h; }
  return 10;
}

function randomDateWithinLast(daysBack: number): Date {
  const d = new Date();
  // Random time within the last N days
  const randomMs = Math.random() * (daysBack * 24 * 60 * 60 * 1000);
  d.setTime(d.getTime() - randomMs);
  // Re-adjust hour to follow the distribution
  d.setHours(pickHour(), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60), 0);
  return d;
}

function uid() { return Math.random().toString(36).slice(2, 10).toUpperCase(); }

function pickRandom<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function pickRandomWeighted<T>(arr: {item: T, weight: number}[]): T {
  const total = arr.reduce((sum, i) => sum + i.weight, 0);
  let r = Math.random() * total;
  for (const {item, weight} of arr) {
    r -= weight;
    if (r <= 0) return item;
  }
  return arr[0].item;
}

const CITIES = [
  { name: 'Mumbai', state: 'Maharashtra', tier: 1 },
  { name: 'New Delhi', state: 'Delhi', tier: 1 },
  { name: 'Bengaluru', state: 'Karnataka', tier: 1 },
  { name: 'Hyderabad', state: 'Telangana', tier: 1 },
  { name: 'Chennai', state: 'Tamil Nadu', tier: 1 },
  { name: 'Kolkata', state: 'West Bengal', tier: 1 },
  { name: 'Pune', state: 'Maharashtra', tier: 1 },
  { name: 'Ahmedabad', state: 'Gujarat', tier: 1 },
  { name: 'Surat', state: 'Gujarat', tier: 2 },
  { name: 'Jaipur', state: 'Rajasthan', tier: 2 },
  { name: 'Lucknow', state: 'Uttar Pradesh', tier: 2 },
  { name: 'Kanpur', state: 'Uttar Pradesh', tier: 2 },
  { name: 'Nagpur', state: 'Maharashtra', tier: 2 },
  { name: 'Indore', state: 'Madhya Pradesh', tier: 2 },
  { name: 'Thane', state: 'Maharashtra', tier: 2 },
  { name: 'Bhopal', state: 'Madhya Pradesh', tier: 2 },
  { name: 'Visakhapatnam', state: 'Andhra Pradesh', tier: 2 },
  { name: 'Patna', state: 'Bihar', tier: 2 },
  { name: 'Vadodara', state: 'Gujarat', tier: 2 },
  { name: 'Ghaziabad', state: 'Uttar Pradesh', tier: 2 }
];

async function main() {
  console.log('🌱 MedMarket Massive Analytics Seed starting…\n');

  console.log('🧹 Clearing existing data...');
  await prisma.notification.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.blacklistedBatch.deleteMany();
  await prisma.storeInventory.deleteMany();
  await prisma.storeDocument.deleteMany();
  await prisma.bankAccount.deleteMany();
  await prisma.pharmacyStore.deleteMany();
  await prisma.consumerAddress.deleteMany();
  await prisma.medicineMaster.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.otpTokens.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.platformSettings.deleteMany();
  await prisma.user.deleteMany();

  console.log('⚙️ Creating settings and basic users...');
  await prisma.platformSettings.create({
    data: { id: 'singleton', gst_rate: 12, delivery_fee: 30, free_delivery_threshold: 200, cod_limit: 2000, order_timeout_minutes: 30, expiry_warn_60: true, expiry_warn_30: true, dead_stock_alert: true, email_invoice: true, sms_on_order: true, updated_at: new Date() }
  });

  const admin = await prisma.user.create({ data: { name:'Admin', email:'admin@medmarket.in', mobile:'+919000000000', password_hash: await hash('Admin@1234'), role:'admin', created_at: daysAgo(365) } });

  console.log('👤 Generating 150 consumers...');
  const consumerDatas = Array.from({length: 150}).map((_, i) => ({
    name: `Consumer ${i}`, email: `consumer${i}@gmail.com`, mobile: `+919900${i.toString().padStart(6, '0')}`,
    password_hash: '$2a$10$X...', role: 'consumer' as const, created_at: randomDateWithinLast(180)
  }));
  await prisma.user.createMany({ data: consumerDatas });
  const allConsumers = await prisma.user.findMany({ where: { role: 'consumer' } });

  console.log('🏪 Generating pharmacies across 20 cities...');
  const storeOwners = await Promise.all(CITIES.map(async (city, i) => {
    const owner = await prisma.user.create({ data: { name:`Owner ${city.name}`, email:`owner_${city.name.toLowerCase().replace(/ /g,'')}@pharma.in`, password_hash: await hash('Pharma@1234'), role:'pharmacy_owner', created_at: randomDateWithinLast(180) }});
    return { owner, city };
  }));

  const createdStores = [];
  for (const {owner, city} of storeOwners) {
    // Generate 1 store per city, 2 for Tier 1
    const count = city.tier === 1 ? 2 : 1;
    for (let c=1; c<=count; c++) {
      const store = await prisma.pharmacyStore.create({
        data: {
          owner_id: owner.id, name: `${city.name} City Pharma ${c}`,
          address_line: `Main Road, ${city.name}`, city: city.name, state: city.state, pincode: `1000${c}`,
          phone: `+918000${Math.floor(Math.random()*100000)}`, email: `store${c}@${city.name.replace(/ /g,'').toLowerCase()}pharma.in`,
          status: 'approved', drug_license_no: `DL/${city.name.toUpperCase()}/${c}${Math.floor(Math.random()*1000)}`, gst_number: `27AABC${Math.floor(Math.random()*1000)}C1Z5`,
          verified_at: randomDateWithinLast(150), verified_by: admin.id, avg_rating: (3.5 + Math.random()*1.5).toFixed(1), total_reviews: Math.floor(Math.random()*500), created_at: randomDateWithinLast(180)
        }
      });
      createdStores.push(store);
      await prisma.bankAccount.create({ data: { store_id: store.id, bank_name: 'HDFC Bank', account_holder: owner.name, account_number_encrypted: 'enc_acc_123', ifsc_code: 'HDFC0001234', is_verified: true }});
    }
  }

  console.log('💊 Generating medicine catalog...');
  const medsData = [
    { name:'Crocin 500mg', generic_name:'Paracetamol', salt_composition:'Paracetamol 500mg', manufacturer:'GSK', category:'Pain Relief', form:'tablet', pack_size:'Strip of 15', mrp:22 },
    { name:'Dolo 650mg', generic_name:'Paracetamol', salt_composition:'Paracetamol 650mg', manufacturer:'Micro Labs', category:'Pain Relief', form:'tablet', pack_size:'Strip of 15', mrp:30 },
    { name:'Combiflam', generic_name:'Ibuprofen+Paracetamol', salt_composition:'Ibuprofen 400mg + Paracetamol 325mg', manufacturer:'Sanofi', category:'Pain Relief', form:'tablet', pack_size:'Strip of 20', mrp:35 },
    { name:'Pan-D Capsule', generic_name:'Pantoprazole+Domperidone', salt_composition:'Pantoprazole 40mg + Domperidone 10mg', manufacturer:'Alkem', category:'Antacid', form:'capsule', pack_size:'Strip of 10', mrp:82 },
    { name:'Digene Syrup 200ml', generic_name:'Antacid Syrup', salt_composition:'Aluminium Hydroxide + Simethicone', manufacturer:'Abbott', category:'Antacid', form:'syrup', pack_size:'Bottle 200ml', mrp:140 },
    { name:'Benadryl Cough 100ml', generic_name:'Diphenhydramine', salt_composition:'Diphenhydramine HCl 14.08mg', manufacturer:'J&J', category:'Cold & Cough', form:'syrup', pack_size:'Bottle 100ml', mrp:85 },
    { name:'Strepsils Lozenges', generic_name:'Amylmetacresol', salt_composition:'2,4-Dichlorobenzyl Alcohol 1.2mg', manufacturer:'Reckitt', category:'Cold & Cough', form:'tablet', pack_size:'Pack of 16', mrp:62 },
    { name:'Otrivin Nasal 10ml', generic_name:'Xylometazoline', salt_composition:'Xylometazoline HCl 0.1% w/v', manufacturer:'Novartis', category:'Cold & Cough', form:'drops', pack_size:'Bottle 10ml', mrp:55 },
    { name:'Limcee 500mg', generic_name:'Vitamin C', salt_composition:'Ascorbic Acid 500mg', manufacturer:'Abbott', category:'Vitamins', form:'tablet', pack_size:'Strip of 15', mrp:18 },
    { name:'Shelcal 500mg', generic_name:'Calcium + Vitamin D3', salt_composition:'Calcium Carbonate 1250mg + Vitamin D3', manufacturer:'Torrent', category:'Vitamins', form:'tablet', pack_size:'Strip of 15', mrp:130 },
    { name:'Electral ORS Sachet', generic_name:'Oral Rehydration Salts', salt_composition:'Sodium Chloride + Glucose + Potassium', manufacturer:'Franco Indian', category:'Hydration', form:'powder', pack_size:'Pack of 21.8g', mrp:22 },
    { name:'Allegra 120mg', generic_name:'Fexofenadine', salt_composition:'Fexofenadine HCl 120mg', manufacturer:'Sanofi', category:'Allergy', form:'tablet', pack_size:'Strip of 10', mrp:192 },
    { name:'Betadine Ointment 20g', generic_name:'Povidone Iodine', salt_composition:'Povidone Iodine 5% w/w', manufacturer:'Win Medicare', category:'First Aid', form:'gel', pack_size:'Tube of 20g', mrp:68 },
    { name:'Asthalin Inhaler', generic_name:'Salbutamol', salt_composition:'Salbutamol Sulphate 100mcg', manufacturer:'Cipla', category:'Respiratory', form:'inhaler', pack_size:'200 doses', mrp:140 },
    { name:'Azithral 500mg', generic_name:'Azithromycin', salt_composition:'Azithromycin 500mg', manufacturer:'Alembic', category:'Antibiotics', form:'tablet', pack_size:'Strip of 5', mrp:120 }
  ];
  const meds = await prisma.medicineMaster.createManyAndReturn({ data: medsData.map(m => ({ ...m, created_by: admin.id, form: m.form as any })) });

  console.log('📦 Generating store inventory...');
  const inventoryToCreate = [];
  for (const store of createdStores) {
    for (const med of meds) {
      if (Math.random() < 0.1) continue; // Skip some meds so not every store has everything

      // Deliberate patterns:
      // - Delhi stores have near expiry for Pan-D
      
      let exp_date = daysFromNow(Math.floor(Math.random() * 700 + 100)); // Default expiry far in future
      let quantity = Math.floor(Math.random() * 500 + 50);

      if (store.city === 'New Delhi' && med.name === 'Pan-D Capsule') {
        exp_date = daysFromNow(15); // Expiring soon! (Triggers expiry alert)
      }

      inventoryToCreate.push({
        store_id: store.id,
        medicine_id: med.id,
        batch_number: `B${uid()}`,
        mfg_date: daysAgo(Math.floor(Math.random() * 300 + 100)),
        exp_date,
        quantity,
        selling_price: parseFloat((Number(med.mrp) * (0.8 + Math.random()*0.2)).toFixed(2)),
        low_stock_threshold: 20
      });
    }
  }
  await prisma.storeInventory.createMany({ data: inventoryToCreate });
  const allInventory = await prisma.storeInventory.findMany({ include: { medicine: true } });
  
  // Create lookup dictionary: store_id -> array of inventory items
  const invMap: Record<string, typeof allInventory> = {};
  for (const inv of allInventory) {
    if (!invMap[inv.store_id]) invMap[inv.store_id] = [];
    invMap[inv.store_id].push(inv);
  }

  console.log('🚚 Generating thousands of orders (this might take a moment)...');
  const totalOrdersToGenerate = 3000;
  
  // Prepare chunked insertions
  const orderChunks = [];
  let currentChunk = [];

  for (let i = 0; i < totalOrdersToGenerate; i++) {
    const consumer = pickRandom(allConsumers);
    // Weighted store selection (Tier 1 gets much more orders to show geographical disparity)
    const store = pickRandomWeighted(createdStores.map(s => {
      const cityTier = CITIES.find(c => c.name === s.city)?.tier || 2;
      return { item: s, weight: cityTier === 1 ? 8 : 2 };
    }));

    const storeInv = invMap[store.id];
    if (!storeInv || storeInv.length === 0) continue;

    const itemsCount = Math.floor(Math.random() * 4) + 1;
    let subtotal = 0;
    const orderItemsData = [];
    
    // Pick unique items
    const shuffledInv = [...storeInv].sort(() => 0.5 - Math.random());
    for (let j = 0; j < Math.min(itemsCount, shuffledInv.length); j++) {
      const inv = shuffledInv[j];
      const qty = Math.floor(Math.random() * 3) + 1;
      
      // Inject dead stock pattern: Asthalin Inhaler in Surat NEVER gets ordered
      if (store.city === 'Surat' && inv.medicine.name === 'Asthalin Inhaler') continue;
      
      const line_total = parseFloat((Number(inv.selling_price) * qty).toFixed(2));
      subtotal += line_total;
      
      orderItemsData.push({
        inventory_id: inv.id, medicine_name: inv.medicine.name, salt_composition: inv.medicine.salt_composition,
        batch_number: inv.batch_number, quantity: qty, unit_price: inv.selling_price, line_total, mrp_at_order: inv.medicine.mrp
      });
    }

    if (orderItemsData.length === 0) continue;

    const deliveryType = Math.random() < 0.8 ? 'delivery' : 'pickup';
    const delivery_fee = (deliveryType === 'delivery' && subtotal < 200) ? 30 : 0;
    const gst_amount = parseFloat((subtotal * 0.12).toFixed(2));
    const total_amount = parseFloat((subtotal + delivery_fee + gst_amount).toFixed(2));
    
    const paymentMethod = pickRandomWeighted([{item:'upi', weight:60}, {item:'card', weight:30}, {item:'cod', weight:10}]);
    
    // Order date distribution over the last 180 days 
    // We weight it to have more orders recently using Math.pow
    const daysBack = Math.floor(Math.pow(Math.random(), 2) * 180);
    const created_at = randomDateWithinLast(daysBack);
    
    // Determine status
    let status = 'delivered';
    const ageInHours = (new Date().getTime() - created_at.getTime()) / (1000 * 60 * 60);
    
    if (ageInHours < 48) {
      status = pickRandomWeighted([
        {item: 'confirmed', weight: 15}, {item: 'accepted', weight: 15},
        {item: 'packing', weight: 15}, {item: 'dispatched', weight: 15},
        {item: 'delivered', weight: 30}, {item: 'rejected', weight: 5}, {item: 'cancelled', weight: 5}
      ]);
    } else {
      // Historical orders are mostly delivered, but with patterns
      // Observation: Surat has massive rejection rate 40% (helps admin find bad vendors)
      if (store.city === 'Surat') {
        status = pickRandomWeighted([{item:'delivered', weight:50}, {item:'rejected', weight:40}, {item:'cancelled', weight:10}]);
      } else {
        // COD orders have higher cancellation rate
        if (paymentMethod === 'cod') {
          status = pickRandomWeighted([{item:'delivered', weight:70}, {item:'rejected', weight:10}, {item:'cancelled', weight:20}]);
        } else {
          status = pickRandomWeighted([{item:'delivered', weight:90}, {item:'rejected', weight:5}, {item:'cancelled', weight:5}]);
        }
      }
    }

    const accepted_at = ['delivered','dispatched','packing','accepted'].includes(status) ? new Date(created_at.getTime() + 10 * 60000) : null;
    const dispatched_at = ['delivered','dispatched'].includes(status) ? new Date(created_at.getTime() + 30 * 60000) : null;
    const delivered_at = status === 'delivered' ? new Date(created_at.getTime() + 90 * 60000) : null;
    const cancelled_at = status === 'cancelled' ? new Date(created_at.getTime() + 15 * 60000) : null;

    currentChunk.push({
      consumer_id: consumer.id, store_id: store.id, delivery_type: deliveryType,
      delivery_address: deliveryType === 'delivery' ? { line: consumer.name + ' address', city: store.city, pincode: store.pincode } : null,
      status, payment_method: paymentMethod, payment_status: (status === 'rejected' || status === 'cancelled') ? 'refunded' : 'paid',
      payment_ref: `REF${uid()}`, rejection_reason: status === 'rejected' ? 'Item out of stock' : null,
      subtotal, delivery_fee, gst_amount, total_amount,
      accepted_at, dispatched_at, delivered_at, cancelled_at, created_at, updated_at: created_at,
      items: { create: orderItemsData }
    });

    if (currentChunk.length >= 100) {
      orderChunks.push(currentChunk);
      currentChunk = [];
    }
  }
  if (currentChunk.length > 0) orderChunks.push(currentChunk);

  let processed = 0;
  for (const chunk of orderChunks) {
    await Promise.all(chunk.map(o => prisma.order.create({ data: o as any })));
    processed += chunk.length;
    process.stdout.write(`\r   Inserted ${processed}/${totalOrdersToGenerate} orders...`);
  }
  console.log('\n✅ Orders created successfully!');

  console.log('📣 Generating complaints...');
  const allOrders = await prisma.order.findMany({ select: { id: true, consumer_id: true, store_id: true, status: true }, take: 1000, orderBy: { created_at: 'desc' } });
  const complaintsToCreate = [];
  
  for (const order of allOrders) {
    if (Math.random() < 0.8) continue; 
    
    // Pattern: Rejected orders heavily complained about
    if (order.status === 'rejected' && Math.random() < 0.6) {
      complaintsToCreate.push({ consumer_id: order.consumer_id, order_id: order.id, store_id: order.store_id, type: 'Order Cancelled by Store', subject: 'Store rejected my order without reason', body: 'This is very frustrating, please fix this!', status: 'open' });
    } else if (order.status === 'delivered' && Math.random() < 0.1) {
      complaintsToCreate.push({ consumer_id: order.consumer_id, order_id: order.id, store_id: order.store_id, type: 'Late Delivery', subject: 'Order arrived late', body: 'The order took 3 hours to arrive instead of 45 mins.', status: 'resolved', resolution: 'Provided 10% discount coupon.' });
    }
  }
  await prisma.complaint.createMany({ data: complaintsToCreate });
  console.log(`✅ ${complaintsToCreate.length} Complaints generated!`);

  console.log('\n🎉 Massive analytics seed completed successfully!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
