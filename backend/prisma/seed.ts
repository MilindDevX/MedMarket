/**
 * MedMarket India — Database Seed
 * ─────────────────────────────────
 * Run with:  npx tsx prisma/seed.ts
 *
 * What this creates:
 *  1 Admin          — Milind Rao  (milind@medmarket.in / Admin@1234)
 *  3 Consumers      — Priya, Arjun, Sneha
 *  4 Pharmacies     — 2 approved, 1 pending, 1 rejected
 *  30 Medicines     — Real OTC drugs used in India (Crocin, Dolo, Pan-D, etc.)
 *  Inventory        — Each approved pharmacy stocked with ~18 medicines
 *  12 Orders        — Mix of all statuses (delivered, dispatched, accepted, confirmed, rejected)
 *  Addresses        — Home/office addresses for each consumer
 *  Notifications    — Order & store events
 *  Complaints       — 2 sample complaints
 *  PlatformSettings — Default config singleton
 */

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from "../src/config/prisma.ts";

// ─── helpers ────────────────────────────────────────────────────────────────
const hash = (pw: string) => bcrypt.hash(pw, 10);

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

// ─── main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Starting MedMarket seed…\n');

  // ── 0. Clear existing data (order matters for FK constraints) ──────────────
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
  console.log('✅ Cleared existing data');

  // ── 1. Platform Settings ────────────────────────────────────────────────────
  await prisma.platformSettings.create({
    data: {
      id: 'singleton',
      gst_rate: 12,
      delivery_fee: 30,
      free_delivery_threshold: 200,
      cod_limit: 2000,
      order_timeout_minutes: 30,
      expiry_warn_60: true,
      expiry_warn_30: true,
      dead_stock_alert: true,
      email_invoice: true,
      sms_on_order: true,
      updated_at: new Date(),
    },
  });
  console.log('✅ Platform settings created');

  // ── 2. Users ─────────────────────────────────────────────────────────────────
  const [milind, priya, arjun, sneha, rahul, fatima] = await Promise.all([
    // Admin
    prisma.user.create({ data: { name: 'Milind Rao', email: 'milind@medmarket.in', mobile: '+919876543210', password_hash: await hash('Admin@1234'), role: 'admin' } }),
    // Consumers
    prisma.user.create({ data: { name: 'Priya Sharma', email: 'priya.sharma@gmail.com', mobile: '+919812345678', password_hash: await hash('Consumer@1234'), role: 'consumer' } }),
    prisma.user.create({ data: { name: 'Arjun Mehta', email: 'arjun.mehta@gmail.com', mobile: '+919823456789', password_hash: await hash('Consumer@1234'), role: 'consumer' } }),
    prisma.user.create({ data: { name: 'Sneha Kulkarni', email: 'sneha.kulkarni@gmail.com', mobile: '+919834567890', password_hash: await hash('Consumer@1234'), role: 'consumer' } }),
    // Pharmacy owners
    prisma.user.create({ data: { name: 'Rahul Gupta', email: 'rahul.gupta@medplus.in', mobile: '+919845678901', password_hash: await hash('Pharma@1234'), role: 'pharmacy_owner' } }),
    prisma.user.create({ data: { name: 'Fatima Sheikh', email: 'fatima.sheikh@healthcure.in', mobile: '+919856789012', password_hash: await hash('Pharma@1234'), role: 'pharmacy_owner' } }),
  ]);

  const [vikram, deepa] = await Promise.all([
    prisma.user.create({ data: { name: 'Vikram Nair', email: 'vikram.nair@apollo.in', mobile: '+919867890123', password_hash: await hash('Pharma@1234'), role: 'pharmacy_owner' } }),
    prisma.user.create({ data: { name: 'Deepa Joshi', email: 'deepa.joshi@jantapharma.in', mobile: '+919878901234', password_hash: await hash('Pharma@1234'), role: 'pharmacy_owner' } }),
  ]);

  console.log('✅ Users created (1 admin, 3 consumers, 4 pharmacy owners)');

  // ── 3. Consumer Addresses ──────────────────────────────────────────────────
  await prisma.consumerAddress.createMany({
    data: [
      { consumer_id: priya.id,  label: 'Home',   address_line: '14, Vasant Vihar, Sector 9', city: 'Gurgaon',   pincode: '122001', latitude: 28.4595, longitude: 77.0266, is_default: true },
      { consumer_id: priya.id,  label: 'Office', address_line: 'DLF Cyber City, Tower 8',    city: 'Gurgaon',   pincode: '122002', latitude: 28.4949, longitude: 77.0876, is_default: false },
      { consumer_id: arjun.id,  label: 'Home',   address_line: 'B-47, Saket, South Delhi',   city: 'New Delhi', pincode: '110017', latitude: 28.5245, longitude: 77.2066, is_default: true },
      { consumer_id: sneha.id,  label: 'Home',   address_line: '22, Koregaon Park, Lane 5',  city: 'Pune',      pincode: '411001', latitude: 18.5362, longitude: 73.8937, is_default: true },
    ],
  });
  console.log('✅ Consumer addresses created');

  // ── 4. Medicine Master Catalogue ──────────────────────────────────────────
  const meds = await prisma.medicineMaster.createManyAndReturn({
    data: [
      // Pain & Fever
      { name: 'Crocin 500mg',       generic_name: 'Paracetamol',           salt_composition: 'Paracetamol 500mg',                manufacturer: 'GSK Pharmaceuticals',     category: 'Pain Relief',       form: 'tablet',  pack_size: 'Strip of 15', mrp: 22.00,  schedule: 'otc', created_by: milind.id },
      { name: 'Dolo 650mg',         generic_name: 'Paracetamol',           salt_composition: 'Paracetamol 650mg',                manufacturer: 'Micro Labs',              category: 'Pain Relief',       form: 'tablet',  pack_size: 'Strip of 15', mrp: 30.00,  schedule: 'otc', created_by: milind.id },
      { name: 'Combiflam',          generic_name: 'Ibuprofen + Paracetamol', salt_composition: 'Ibuprofen 400mg + Paracetamol 325mg', manufacturer: 'Sanofi India',       category: 'Pain Relief',       form: 'tablet',  pack_size: 'Strip of 20', mrp: 35.00,  schedule: 'otc', created_by: milind.id },
      { name: 'Ibugesic 400mg',     generic_name: 'Ibuprofen',             salt_composition: 'Ibuprofen 400mg',                  manufacturer: 'Cipla',                   category: 'Pain Relief',       form: 'tablet',  pack_size: 'Strip of 10', mrp: 27.00,  schedule: 'otc', created_by: milind.id },
      { name: 'Volini Gel 30g',     generic_name: 'Diclofenac Sodium',     salt_composition: 'Diclofenac Diethylamine 1.16% w/w', manufacturer: 'Pfizer',                category: 'Pain Relief',       form: 'gel',     pack_size: 'Tube of 30g', mrp: 168.00, schedule: 'otc', created_by: milind.id },
      // Antacids & GI
      { name: 'Pan-D Capsule',      generic_name: 'Pantoprazole + Domperidone', salt_composition: 'Pantoprazole 40mg + Domperidone 10mg', manufacturer: 'Alkem Laboratories', category: 'Antacid',        form: 'capsule', pack_size: 'Strip of 10', mrp: 82.00,  schedule: 'otc', created_by: milind.id },
      { name: 'Gelusil MPS Tablet', generic_name: 'Antacid Combination',   salt_composition: 'Magnesium Hydroxide + Aluminium Hydroxide + Simethicone', manufacturer: 'Pfizer', category: 'Antacid',   form: 'tablet',  pack_size: 'Strip of 18', mrp: 55.00,  schedule: 'otc', created_by: milind.id },
      { name: 'Digene Syrup 200ml', generic_name: 'Antacid Syrup',         salt_composition: 'Aluminium Hydroxide + Magnesium Hydroxide + Simethicone', manufacturer: 'Abbott India', category: 'Antacid', form: 'syrup', pack_size: 'Bottle of 200ml', mrp: 140.00, schedule: 'otc', created_by: milind.id },
      { name: 'Pudin Hara Pearls',  generic_name: 'Mint Oil Capsule',      salt_composition: 'Pudina Satva (Peppermint Oil) 25mg',  manufacturer: 'Dabur India',            category: 'Antacid',          form: 'capsule', pack_size: 'Pack of 40', mrp: 85.00,  schedule: 'otc', created_by: milind.id },
      // Cold & Cough
      { name: 'Benadryl Cough Syrup 100ml', generic_name: 'Diphenhydramine + Ammonium Chloride', salt_composition: 'Diphenhydramine HCl 14.08mg + Ammonium Chloride 138mg + Sodium Citrate', manufacturer: 'Johnson & Johnson', category: 'Cold & Cough', form: 'syrup', pack_size: 'Bottle of 100ml', mrp: 85.00, schedule: 'otc', created_by: milind.id },
      { name: 'Vicks Vaporub 25g',  generic_name: 'Camphor + Menthol',     salt_composition: 'Camphor 4.7% + Menthol 2.6% + Eucalyptus Oil 1.2%', manufacturer: 'Procter & Gamble', category: 'Cold & Cough', form: 'gel', pack_size: 'Jar of 25g', mrp: 64.00, schedule: 'otc', created_by: milind.id },
      { name: 'Strepsils Lozenges', generic_name: 'Amylmetacresol + Dichlorobenzyl', salt_composition: '2,4-Dichlorobenzyl Alcohol 1.2mg + Amylmetacresol 0.6mg', manufacturer: 'Reckitt Benckiser', category: 'Cold & Cough', form: 'tablet', pack_size: 'Pack of 16', mrp: 62.00, schedule: 'otc', created_by: milind.id },
      // Vitamins & Supplements
      { name: 'Limcee 500mg',       generic_name: 'Vitamin C',             salt_composition: 'Ascorbic Acid 500mg',              manufacturer: 'Abbott India',            category: 'Vitamins',          form: 'tablet',  pack_size: 'Strip of 15', mrp: 18.00,  schedule: 'otc', created_by: milind.id },
      { name: 'Shelcal 500mg',      generic_name: 'Calcium + Vitamin D3',  salt_composition: 'Calcium Carbonate 1250mg + Vitamin D3 250IU', manufacturer: 'Torrent Pharmaceuticals', category: 'Vitamins', form: 'tablet', pack_size: 'Strip of 15', mrp: 130.00, schedule: 'otc', created_by: milind.id },
      { name: 'Zincovit Tablet',    generic_name: 'Multivitamin + Zinc',   salt_composition: 'Vitamins A, B, C, D, E + Zinc + Selenium', manufacturer: 'Apex Laboratories', category: 'Vitamins', form: 'tablet', pack_size: 'Strip of 15', mrp: 155.00, schedule: 'otc', created_by: milind.id },
      { name: 'Becosules Capsule',  generic_name: 'B-Complex + Vitamin C', salt_composition: 'Vitamin B1, B2, B3, B5, B6, B12 + Folic Acid + Biotin + Vitamin C', manufacturer: 'Pfizer', category: 'Vitamins', form: 'capsule', pack_size: 'Strip of 20', mrp: 95.00, schedule: 'otc', created_by: milind.id },
      // Skin & Allergy
      { name: 'Cetaphil Cream 80g', generic_name: 'Moisturising Cream',    salt_composition: 'Cetyl Alcohol + Propylene Glycol + Sodium Lauryl Sulphate', manufacturer: 'Galderma', category: 'Skin Care', form: 'gel', pack_size: 'Tube of 80g', mrp: 320.00, schedule: 'otc', created_by: milind.id },
      { name: 'Avomine Tablet',     generic_name: 'Promethazine',          salt_composition: 'Promethazine Theoclate 25mg',       manufacturer: 'Pfizer',                  category: 'Allergy',           form: 'tablet',  pack_size: 'Strip of 10', mrp: 15.00,  schedule: 'otc', created_by: milind.id },
      { name: 'Allegra 120mg',      generic_name: 'Fexofenadine',          salt_composition: 'Fexofenadine HCl 120mg',            manufacturer: 'Sanofi India',            category: 'Allergy',           form: 'tablet',  pack_size: 'Strip of 10', mrp: 192.00, schedule: 'otc', created_by: milind.id },
      { name: 'Calamine Lotion 100ml', generic_name: 'Calamine',          salt_composition: 'Calamine 8% w/v + Zinc Oxide 4% w/v', manufacturer: 'Torrent Pharmaceuticals', category: 'Skin Care', form: 'syrup', pack_size: 'Bottle of 100ml', mrp: 48.00, schedule: 'otc', created_by: milind.id },
      // Eye & Ear
      { name: 'Tears Naturale Eye Drops 15ml', generic_name: 'Lubricant Eye Drops', salt_composition: 'Hydroxypropyl Methylcellulose 0.3% + Dextran 70 0.1%', manufacturer: 'Alcon', category: 'Eye Care', form: 'drops', pack_size: 'Bottle of 15ml', mrp: 175.00, schedule: 'otc', created_by: milind.id },
      { name: 'Otrivin Nasal Drops 10ml', generic_name: 'Xylometazoline', salt_composition: 'Xylometazoline HCl 0.1% w/v', manufacturer: 'Novartis', category: 'Cold & Cough', form: 'drops', pack_size: 'Bottle of 10ml', mrp: 55.00, schedule: 'otc', created_by: milind.id },
      // Hydration & First Aid
      { name: 'Electral Powder ORS', generic_name: 'Oral Rehydration Salts', salt_composition: 'Sodium Chloride + Potassium Chloride + Sodium Citrate + Dextrose', manufacturer: 'Franco Indian Pharma', category: 'Hydration', form: 'powder', pack_size: 'Pack of 21.8g', mrp: 22.00, schedule: 'otc', created_by: milind.id },
      { name: 'Betadine Ointment 20g', generic_name: 'Povidone Iodine',   salt_composition: 'Povidone Iodine 5% w/w',             manufacturer: 'Win Medicare',           category: 'First Aid',         form: 'gel',     pack_size: 'Tube of 20g',  mrp: 68.00,  schedule: 'otc', created_by: milind.id },
      { name: 'Band-Aid Classic 10 strips', generic_name: 'Adhesive Bandage', salt_composition: 'Sterile adhesive bandage with absorbent pad', manufacturer: 'Johnson & Johnson', category: 'First Aid', form: 'tablet', pack_size: 'Pack of 10', mrp: 55.00, schedule: 'otc', created_by: milind.id },
      // Diabetes & BP (OTC monitoring)
      { name: 'Glucon-D 200g Orange', generic_name: 'Glucose Powder',     salt_composition: 'Glucose (Dextrose Monohydrate) with Vitamins', manufacturer: 'Heinz India', category: 'Hydration', form: 'powder', pack_size: 'Jar of 200g', mrp: 80.00, schedule: 'otc', created_by: milind.id },
      // Digestive
      { name: 'Isabgol Husk 100g',  generic_name: 'Psyllium Husk',        salt_composition: 'Isabgol Bhusi (Psyllium Husk) 100%', manufacturer: 'Dabur India',            category: 'Digestive',         form: 'powder',  pack_size: 'Jar of 100g',  mrp: 75.00,  schedule: 'otc', created_by: milind.id },
      { name: 'Dulcolax Tablet',    generic_name: 'Bisacodyl',             salt_composition: 'Bisacodyl BP 5mg',                  manufacturer: 'Sanofi India',            category: 'Digestive',         form: 'tablet',  pack_size: 'Strip of 10',  mrp: 35.00,  schedule: 'otc', created_by: milind.id },
      // Inhaler
      { name: 'Asthalin Inhaler',   generic_name: 'Salbutamol',            salt_composition: 'Salbutamol Sulphate 100mcg/actuation', manufacturer: 'Cipla',                category: 'Respiratory',       form: 'inhaler', pack_size: '200 metered doses', mrp: 140.00, schedule: 'otc', created_by: milind.id },
      // Sanitiser
      { name: 'Dettol Antiseptic Liquid 100ml', generic_name: 'Chloroxylenol', salt_composition: 'Chloroxylenol 4.8% w/v', manufacturer: 'Reckitt Benckiser', category: 'First Aid', form: 'syrup', pack_size: 'Bottle of 100ml', mrp: 85.00, schedule: 'otc', created_by: milind.id },
    ],
  });

  // Create a lookup by name for convenience
  const med: Record<string, typeof meds[0]> = {};
  for (const m of meds) med[m.name] = m;

  console.log(`✅ ${meds.length} medicines added to master catalogue`);

  // ── 5. Pharmacy Stores ────────────────────────────────────────────────────
  // Store 1 — APPROVED (Rahul's MedPlus, Delhi)
  const store1 = await prisma.pharmacyStore.create({
    data: {
      owner_id: rahul.id,
      name: 'MedPlus Pharmacy — Saket',
      address_line: 'Shop 12, Select Citywalk Mall, Saket',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110017',
      latitude: 28.5245,
      longitude: 77.2066,
      phone: '+911140001234',
      email: 'saket@medplus.in',
      operating_hours: { open: '08:00', close: '22:00', days: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] },
      status: 'approved',
      drug_license_no: 'DL/DELHI/2024/MED/001234',
      gst_number: '07AABCM1234C1Z5',
      fssai_no: '13424999000123',
      verified_at: daysAgo(30),
      verified_by: milind.id,
      avg_rating: 4.5,
      total_reviews: 128,
    },
  });

  // Store 2 — APPROVED (Fatima's HealthCure, Pune)
  const store2 = await prisma.pharmacyStore.create({
    data: {
      owner_id: fatima.id,
      name: 'HealthCure Medical Store',
      address_line: '7, FC Road, Opposite Ferguson College',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411004',
      latitude: 18.5195,
      longitude: 73.8408,
      phone: '+912025001234',
      email: 'info@healthcure.in',
      operating_hours: { open: '09:00', close: '21:00', days: ['Mon','Tue','Wed','Thu','Fri','Sat'] },
      status: 'approved',
      drug_license_no: 'MH/PUNE/2023/PHM/005678',
      gst_number: '27AADCH5678F1Z2',
      fssai_no: '11524999000456',
      verified_at: daysAgo(60),
      verified_by: milind.id,
      avg_rating: 4.2,
      total_reviews: 94,
    },
  });

  // Store 3 — PENDING (Vikram's Apollo)
  const store3 = await prisma.pharmacyStore.create({
    data: {
      owner_id: vikram.id,
      name: 'Apollo Pharmacy — Koramangala',
      address_line: '45, 80 Feet Road, Koramangala 4th Block',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560034',
      phone: '+918025001234',
      email: 'koramangala@apollopharmacy.in',
      operating_hours: { open: '07:00', close: '23:00', days: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] },
      status: 'pending',
      drug_license_no: 'KA/BLR/2025/DRG/009012',
      gst_number: '29AAACA9012G1Z8',
    },
  });

  // Store 4 — REJECTED (Deepa's Janta Pharma)
  await prisma.pharmacyStore.create({
    data: {
      owner_id: deepa.id,
      name: 'Janta Pharma',
      address_line: 'Near Bus Stand, Station Road',
      city: 'Nagpur',
      state: 'Maharashtra',
      pincode: '440001',
      phone: '+917125001234',
      status: 'rejected',
      rejection_reason: 'Drug License document was expired. Please upload a valid license and resubmit.',
      drug_license_no: 'MH/NGP/2022/PHM/001111',
      gst_number: '27AADCJ1111K1Z9',
    },
  });

  console.log('✅ 4 pharmacy stores created (2 approved, 1 pending, 1 rejected)');

  // ── 6. Store Documents (for approved stores) ──────────────────────────────
  await prisma.storeDocument.createMany({
    data: [
      { store_id: store1.id, doc_type: 'drug_license',     s3_key: 'stores/store1/drug_license.pdf',     original_filename: 'DL_MedPlus_Saket.pdf',      mime_type: 'application/pdf' },
      { store_id: store1.id, doc_type: 'gst_certificate',  s3_key: 'stores/store1/gst_certificate.pdf',  original_filename: 'GST_MedPlus.pdf',           mime_type: 'application/pdf' },
      { store_id: store1.id, doc_type: 'store_photo',      s3_key: 'stores/store1/store_front.jpg',      original_filename: 'storefront.jpg',            mime_type: 'image/jpeg' },
      { store_id: store2.id, doc_type: 'drug_license',     s3_key: 'stores/store2/drug_license.pdf',     original_filename: 'DL_HealthCure.pdf',         mime_type: 'application/pdf' },
      { store_id: store2.id, doc_type: 'gst_certificate',  s3_key: 'stores/store2/gst_certificate.pdf',  original_filename: 'GST_HealthCure.pdf',        mime_type: 'application/pdf' },
      { store_id: store2.id, doc_type: 'store_photo',      s3_key: 'stores/store2/store_front.jpg',      original_filename: 'store_exterior.jpg',        mime_type: 'image/jpeg' },
      { store_id: store3.id, doc_type: 'drug_license',     s3_key: 'stores/store3/drug_license.pdf',     original_filename: 'Apollo_DL_Koramangala.pdf', mime_type: 'application/pdf' },
    ],
  });

  // ── 7. Bank Accounts ──────────────────────────────────────────────────────
  await prisma.bankAccount.createMany({
    data: [
      { store_id: store1.id, bank_name: 'HDFC Bank', account_holder: 'Rahul Gupta', account_number_encrypted: 'enc_00112233445566', ifsc_code: 'HDFC0001234', is_verified: true },
      { store_id: store2.id, bank_name: 'ICICI Bank', account_holder: 'Fatima Sheikh', account_number_encrypted: 'enc_99887766554433', ifsc_code: 'ICIC0005678', is_verified: true },
    ],
  });
  console.log('✅ Store documents and bank accounts created');

  // ── 8. Inventory — Store 1 (MedPlus, Delhi) ──────────────────────────────
  const s1Inv = await prisma.storeInventory.createManyAndReturn({
    data: [
      { store_id: store1.id, medicine_id: med['Crocin 500mg'].id,             batch_number: 'CR2025A001', mfg_date: daysAgo(180), exp_date: daysFromNow(540), quantity: 250, selling_price: 20.00, low_stock_threshold: 30 },
      { store_id: store1.id, medicine_id: med['Dolo 650mg'].id,               batch_number: 'DL2025B001', mfg_date: daysAgo(120), exp_date: daysFromNow(420), quantity: 180, selling_price: 28.00, low_stock_threshold: 30 },
      { store_id: store1.id, medicine_id: med['Combiflam'].id,                batch_number: 'CB2025C001', mfg_date: daysAgo(90),  exp_date: daysFromNow(365), quantity: 120, selling_price: 33.00, low_stock_threshold: 20 },
      { store_id: store1.id, medicine_id: med['Ibugesic 400mg'].id,           batch_number: 'IB2025D001', mfg_date: daysAgo(60),  exp_date: daysFromNow(480), quantity: 100, selling_price: 25.00, low_stock_threshold: 20 },
      { store_id: store1.id, medicine_id: med['Volini Gel 30g'].id,           batch_number: 'VG2025E001', mfg_date: daysAgo(45),  exp_date: daysFromNow(600), quantity: 60,  selling_price: 155.00, low_stock_threshold: 10 },
      { store_id: store1.id, medicine_id: med['Pan-D Capsule'].id,            batch_number: 'PD2025F001', mfg_date: daysAgo(30),  exp_date: daysFromNow(540), quantity: 200, selling_price: 78.00, low_stock_threshold: 30 },
      { store_id: store1.id, medicine_id: med['Gelusil MPS Tablet'].id,       batch_number: 'GM2025G001', mfg_date: daysAgo(15),  exp_date: daysFromNow(720), quantity: 90,  selling_price: 50.00, low_stock_threshold: 15 },
      { store_id: store1.id, medicine_id: med['Benadryl Cough Syrup 100ml'].id, batch_number: 'BC2025H001', mfg_date: daysAgo(20), exp_date: daysFromNow(400), quantity: 75, selling_price: 80.00, low_stock_threshold: 15 },
      { store_id: store1.id, medicine_id: med['Limcee 500mg'].id,             batch_number: 'LC2025I001', mfg_date: daysAgo(10),  exp_date: daysFromNow(540), quantity: 300, selling_price: 16.00, low_stock_threshold: 50 },
      { store_id: store1.id, medicine_id: med['Shelcal 500mg'].id,            batch_number: 'SC2025J001', mfg_date: daysAgo(5),   exp_date: daysFromNow(540), quantity: 80,  selling_price: 120.00, low_stock_threshold: 15 },
      { store_id: store1.id, medicine_id: med['Becosules Capsule'].id,        batch_number: 'BV2025K001', mfg_date: daysAgo(25),  exp_date: daysFromNow(600), quantity: 110, selling_price: 90.00, low_stock_threshold: 20 },
      { store_id: store1.id, medicine_id: med['Allegra 120mg'].id,            batch_number: 'AL2025L001', mfg_date: daysAgo(40),  exp_date: daysFromNow(480), quantity: 50,  selling_price: 185.00, low_stock_threshold: 10 },
      { store_id: store1.id, medicine_id: med['Electral Powder ORS'].id,      batch_number: 'EP2025M001', mfg_date: daysAgo(12),  exp_date: daysFromNow(720), quantity: 400, selling_price: 20.00, low_stock_threshold: 50 },
      { store_id: store1.id, medicine_id: med['Betadine Ointment 20g'].id,    batch_number: 'BD2025N001', mfg_date: daysAgo(8),   exp_date: daysFromNow(900), quantity: 45,  selling_price: 62.00, low_stock_threshold: 10 },
      { store_id: store1.id, medicine_id: med['Tears Naturale Eye Drops 15ml'].id, batch_number: 'TN2025O001', mfg_date: daysAgo(20), exp_date: daysFromNow(360), quantity: 35, selling_price: 165.00, low_stock_threshold: 8 },
      { store_id: store1.id, medicine_id: med['Asthalin Inhaler'].id,         batch_number: 'AI2025P001', mfg_date: daysAgo(30),  exp_date: daysFromNow(540), quantity: 25,  selling_price: 130.00, low_stock_threshold: 5 },
      // Near-expiry item (for expiry alert demo)
      { store_id: store1.id, medicine_id: med['Avomine Tablet'].id,           batch_number: 'AV2025Q001', mfg_date: daysAgo(700), exp_date: daysFromNow(22),  quantity: 18,  selling_price: 14.00, low_stock_threshold: 10, status: 'active' },
      // Low stock item
      { store_id: store1.id, medicine_id: med['Vicks Vaporub 25g'].id,        batch_number: 'VV2025R001', mfg_date: daysAgo(60),  exp_date: daysFromNow(480), quantity: 6,   selling_price: 60.00, low_stock_threshold: 10 },
    ],
  });

  // ── 9. Inventory — Store 2 (HealthCure, Pune) ────────────────────────────
  const s2Inv = await prisma.storeInventory.createManyAndReturn({
    data: [
      { store_id: store2.id, medicine_id: med['Crocin 500mg'].id,              batch_number: 'CR2025A002', mfg_date: daysAgo(200), exp_date: daysFromNow(500), quantity: 200, selling_price: 21.00, low_stock_threshold: 25 },
      { store_id: store2.id, medicine_id: med['Dolo 650mg'].id,                batch_number: 'DL2025B002', mfg_date: daysAgo(100), exp_date: daysFromNow(450), quantity: 150, selling_price: 29.00, low_stock_threshold: 25 },
      { store_id: store2.id, medicine_id: med['Pan-D Capsule'].id,             batch_number: 'PD2025F002', mfg_date: daysAgo(50),  exp_date: daysFromNow(520), quantity: 160, selling_price: 80.00, low_stock_threshold: 25 },
      { store_id: store2.id, medicine_id: med['Digene Syrup 200ml'].id,        batch_number: 'DS2025G002', mfg_date: daysAgo(30),  exp_date: daysFromNow(600), quantity: 55,  selling_price: 132.00, low_stock_threshold: 10 },
      { store_id: store2.id, medicine_id: med['Benadryl Cough Syrup 100ml'].id, batch_number: 'BC2025H002', mfg_date: daysAgo(40), exp_date: daysFromNow(380), quantity: 65, selling_price: 82.00, low_stock_threshold: 12 },
      { store_id: store2.id, medicine_id: med['Strepsils Lozenges'].id,        batch_number: 'ST2025I002', mfg_date: daysAgo(25),  exp_date: daysFromNow(480), quantity: 80,  selling_price: 58.00, low_stock_threshold: 15 },
      { store_id: store2.id, medicine_id: med['Limcee 500mg'].id,              batch_number: 'LC2025I002', mfg_date: daysAgo(20),  exp_date: daysFromNow(600), quantity: 250, selling_price: 17.00, low_stock_threshold: 40 },
      { store_id: store2.id, medicine_id: med['Zincovit Tablet'].id,           batch_number: 'ZV2025J002', mfg_date: daysAgo(15),  exp_date: daysFromNow(540), quantity: 70,  selling_price: 148.00, low_stock_threshold: 12 },
      { store_id: store2.id, medicine_id: med['Cetaphil Cream 80g'].id,        batch_number: 'CC2025K002', mfg_date: daysAgo(10),  exp_date: daysFromNow(720), quantity: 30,  selling_price: 305.00, low_stock_threshold: 8 },
      { store_id: store2.id, medicine_id: med['Calamine Lotion 100ml'].id,     batch_number: 'CL2025L002', mfg_date: daysAgo(8),   exp_date: daysFromNow(540), quantity: 40,  selling_price: 45.00, low_stock_threshold: 8 },
      { store_id: store2.id, medicine_id: med['Otrivin Nasal Drops 10ml'].id,  batch_number: 'OT2025M002', mfg_date: daysAgo(30),  exp_date: daysFromNow(360), quantity: 45,  selling_price: 50.00, low_stock_threshold: 10 },
      { store_id: store2.id, medicine_id: med['Electral Powder ORS'].id,       batch_number: 'EP2025M002', mfg_date: daysAgo(5),   exp_date: daysFromNow(720), quantity: 350, selling_price: 20.00, low_stock_threshold: 50 },
      { store_id: store2.id, medicine_id: med['Isabgol Husk 100g'].id,         batch_number: 'IH2025N002', mfg_date: daysAgo(60),  exp_date: daysFromNow(480), quantity: 60,  selling_price: 70.00, low_stock_threshold: 10 },
      { store_id: store2.id, medicine_id: med['Dulcolax Tablet'].id,           batch_number: 'DC2025O002', mfg_date: daysAgo(45),  exp_date: daysFromNow(540), quantity: 50,  selling_price: 32.00, low_stock_threshold: 10 },
      { store_id: store2.id, medicine_id: med['Glucon-D 200g Orange'].id,      batch_number: 'GD2025P002', mfg_date: daysAgo(20),  exp_date: daysFromNow(360), quantity: 90,  selling_price: 75.00, low_stock_threshold: 15 },
      { store_id: store2.id, medicine_id: med['Dettol Antiseptic Liquid 100ml'].id, batch_number: 'DA2025Q002', mfg_date: daysAgo(15), exp_date: daysFromNow(900), quantity: 65, selling_price: 80.00, low_stock_threshold: 10 },
      // Near-expiry (55 days — 60-day warning)
      { store_id: store2.id, medicine_id: med['Pudin Hara Pearls'].id,         batch_number: 'PH2025R002', mfg_date: daysAgo(300), exp_date: daysFromNow(55),  quantity: 30,  selling_price: 80.00, low_stock_threshold: 10, status: 'active' },
    ],
  });

  console.log('✅ Inventory created for both approved stores');

  // ── 10. Blacklisted Batch ─────────────────────────────────────────────────
  await prisma.blacklistedBatch.create({
    data: {
      medicine_id: med['Crocin 500mg'].id,
      batch_number: 'CR2024Z999',
      reason: 'CDSCO Recall Notice RC/2026/0048 — sub-potent batch detected in quality audit',
      blacklisted_by: milind.id,
      blacklisted_at: daysAgo(7),
    },
  });
  console.log('✅ Blacklisted batch created');

  // ── 11. Orders ────────────────────────────────────────────────────────────
  // Helper to calculate totals
  function calcTotals(items: { price: number; qty: number }[], delivery: 'delivery' | 'pickup') {
    const subtotal    = items.reduce((s, i) => s + i.price * i.qty, 0);
    const delivery_fee = delivery === 'delivery' && subtotal < 200 ? 30 : 0;
    const gst_amount  = parseFloat((subtotal * 0.12).toFixed(2));
    const total_amount = parseFloat((subtotal + delivery_fee + gst_amount).toFixed(2));
    return { subtotal, delivery_fee, gst_amount, total_amount };
  }

  // Order 1 — Priya from Store 1 — DELIVERED (7 days ago)
  const o1Items = [
    { inv: s1Inv.find(i => i.medicine_id === med['Crocin 500mg'].id)!, qty: 2 },
    { inv: s1Inv.find(i => i.medicine_id === med['Limcee 500mg'].id)!, qty: 3 },
  ];
  const o1Totals = calcTotals(o1Items.map(i => ({ price: Number(i.inv.selling_price), qty: i.qty })), 'delivery');
  const order1 = await prisma.order.create({
    data: {
      consumer_id: priya.id, store_id: store1.id,
      delivery_type: 'delivery',
      delivery_address: { line: '14, Vasant Vihar, Sector 9', city: 'Gurgaon', pincode: '122001' },
      status: 'delivered', payment_method: 'upi', payment_status: 'paid', payment_ref: 'UPI2026001234',
      ...o1Totals,
      accepted_at: daysAgo(7), dispatched_at: daysAgo(7), delivered_at: daysAgo(7),
      created_at: daysAgo(7),
      items: {
        create: o1Items.map(i => ({
          inventory_id: i.inv.id, medicine_name: med[Object.keys(med).find(k => med[k].id === i.inv.medicine_id)!].name,
          salt_composition: med[Object.keys(med).find(k => med[k].id === i.inv.medicine_id)!].salt_composition,
          batch_number: i.inv.batch_number, quantity: i.qty,
          unit_price: i.inv.selling_price, line_total: Number(i.inv.selling_price) * i.qty,
          mrp_at_order: med[Object.keys(med).find(k => med[k].id === i.inv.medicine_id)!].mrp,
        })),
      },
    },
  });

  // Order 2 — Priya from Store 1 — DELIVERED (14 days ago)
  const o2Items = [
    { inv: s1Inv.find(i => i.medicine_id === med['Pan-D Capsule'].id)!, qty: 1 },
    { inv: s1Inv.find(i => i.medicine_id === med['Gelusil MPS Tablet'].id)!, qty: 2 },
  ];
  const o2Totals = calcTotals(o2Items.map(i => ({ price: Number(i.inv.selling_price), qty: i.qty })), 'delivery');
  await prisma.order.create({
    data: {
      consumer_id: priya.id, store_id: store1.id,
      delivery_type: 'delivery',
      delivery_address: { line: '14, Vasant Vihar, Sector 9', city: 'Gurgaon', pincode: '122001' },
      status: 'delivered', payment_method: 'card', payment_status: 'paid', payment_ref: 'CRD2026005678',
      ...o2Totals,
      accepted_at: daysAgo(14), dispatched_at: daysAgo(14), delivered_at: daysAgo(14),
      created_at: daysAgo(14),
      items: {
        create: o2Items.map(i => ({
          inventory_id: i.inv.id,
          medicine_name: med[Object.keys(med).find(k => med[k].id === i.inv.medicine_id)!].name,
          salt_composition: med[Object.keys(med).find(k => med[k].id === i.inv.medicine_id)!].salt_composition,
          batch_number: i.inv.batch_number, quantity: i.qty,
          unit_price: i.inv.selling_price, line_total: Number(i.inv.selling_price) * i.qty,
          mrp_at_order: med[Object.keys(med).find(k => med[k].id === i.inv.medicine_id)!].mrp,
        })),
      },
    },
  });

  // Order 3 — Arjun from Store 1 — DISPATCHED (today)
  const o3Items = [
    { inv: s1Inv.find(i => i.medicine_id === med['Dolo 650mg'].id)!, qty: 2 },
    { inv: s1Inv.find(i => i.medicine_id === med['Benadryl Cough Syrup 100ml'].id)!, qty: 1 },
    { inv: s1Inv.find(i => i.medicine_id === med['Strepsils Lozenges'] ? med['Strepsils Lozenges'].id === i.medicine_id : false ? i : null)?.id === undefined
      ? s1Inv.find(i => i.medicine_id === med['Becosules Capsule'].id)!
      : s1Inv.find(i => i.medicine_id === med['Becosules Capsule'].id)!, qty: 1 },
  ];
  const o3Totals = calcTotals(o3Items.map(i => ({ price: Number(i.inv.selling_price), qty: i.qty })), 'pickup');
  await prisma.order.create({
    data: {
      consumer_id: arjun.id, store_id: store1.id,
      delivery_type: 'pickup', status: 'dispatched',
      payment_method: 'upi', payment_status: 'paid', payment_ref: 'UPI2026009876',
      ...o3Totals,
      accepted_at: daysAgo(1), dispatched_at: new Date(),
      created_at: daysAgo(1),
      items: {
        create: o3Items.map(i => ({
          inventory_id: i.inv.id,
          medicine_name: med[Object.keys(med).find(k => med[k].id === i.inv.medicine_id)!].name,
          salt_composition: med[Object.keys(med).find(k => med[k].id === i.inv.medicine_id)!].salt_composition,
          batch_number: i.inv.batch_number, quantity: i.qty,
          unit_price: i.inv.selling_price, line_total: Number(i.inv.selling_price) * i.qty,
          mrp_at_order: med[Object.keys(med).find(k => med[k].id === i.inv.medicine_id)!].mrp,
        })),
      },
    },
  });

  // Order 4 — Sneha from Store 2 — DELIVERED (5 days ago)
  const o4Items = [
    { inv: s2Inv.find(i => i.medicine_id === med['Electral Powder ORS'].id)!, qty: 5 },
    { inv: s2Inv.find(i => i.medicine_id === med['Crocin 500mg'].id)!, qty: 2 },
    { inv: s2Inv.find(i => i.medicine_id === med['Otrivin Nasal Drops 10ml'].id)!, qty: 1 },
  ];
  const o4Totals = calcTotals(o4Items.map(i => ({ price: Number(i.inv.selling_price), qty: i.qty })), 'delivery');
  await prisma.order.create({
    data: {
      consumer_id: sneha.id, store_id: store2.id,
      delivery_type: 'delivery',
      delivery_address: { line: '22, Koregaon Park, Lane 5', city: 'Pune', pincode: '411001' },
      status: 'delivered', payment_method: 'cod', payment_status: 'paid',
      ...o4Totals,
      accepted_at: daysAgo(5), dispatched_at: daysAgo(5), delivered_at: daysAgo(5),
      created_at: daysAgo(5),
      items: {
        create: o4Items.map(i => ({
          inventory_id: i.inv.id,
          medicine_name: med[Object.keys(med).find(k => med[k].id === i.inv.medicine_id)!].name,
          salt_composition: med[Object.keys(med).find(k => med[k].id === i.inv.medicine_id)!].salt_composition,
          batch_number: i.inv.batch_number, quantity: i.qty,
          unit_price: i.inv.selling_price, line_total: Number(i.inv.selling_price) * i.qty,
          mrp_at_order: med[Object.keys(med).find(k => med[k].id === i.inv.medicine_id)!].mrp,
        })),
      },
    },
  });

  // Order 5 — Sneha from Store 2 — ACCEPTED (today)
  const o5Items = [
    { inv: s2Inv.find(i => i.medicine_id === med['Zincovit Tablet'].id)!, qty: 1 },
    { inv: s2Inv.find(i => i.medicine_id === med['Cetaphil Cream 80g'].id)!, qty: 1 },
  ];
  const o5Totals = calcTotals(o5Items.map(i => ({ price: Number(i.inv.selling_price), qty: i.qty })), 'delivery');
  await prisma.order.create({
    data: {
      consumer_id: sneha.id, store_id: store2.id,
      delivery_type: 'delivery',
      delivery_address: { line: '22, Koregaon Park, Lane 5', city: 'Pune', pincode: '411001' },
      status: 'accepted', payment_method: 'upi', payment_status: 'paid', payment_ref: 'UPI2026011111',
      ...o5Totals,
      accepted_at: new Date(), created_at: new Date(),
      items: {
        create: o5Items.map(i => ({
          inventory_id: i.inv.id,
          medicine_name: med[Object.keys(med).find(k => med[k].id === i.inv.medicine_id)!].name,
          salt_composition: med[Object.keys(med).find(k => med[k].id === i.inv.medicine_id)!].salt_composition,
          batch_number: i.inv.batch_number, quantity: i.qty,
          unit_price: i.inv.selling_price, line_total: Number(i.inv.selling_price) * i.qty,
          mrp_at_order: med[Object.keys(med).find(k => med[k].id === i.inv.medicine_id)!].mrp,
        })),
      },
    },
  });

  // Order 6 — Arjun from Store 2 — CONFIRMED (just placed)
  const o6Items = [
    { inv: s2Inv.find(i => i.medicine_id === med['Dolo 650mg'].id)!, qty: 3 },
    { inv: s2Inv.find(i => i.medicine_id === med['Isabgol Husk 100g'].id)!, qty: 1 },
  ];
  const o6Totals = calcTotals(o6Items.map(i => ({ price: Number(i.inv.selling_price), qty: i.qty })), 'delivery');
  await prisma.order.create({
    data: {
      consumer_id: arjun.id, store_id: store2.id,
      delivery_type: 'delivery',
      delivery_address: { line: 'B-47, Saket, South Delhi', city: 'New Delhi', pincode: '110017' },
      status: 'confirmed', payment_method: 'upi', payment_status: 'paid', payment_ref: 'UPI2026022222',
      ...o6Totals,
      created_at: new Date(),
      items: {
        create: o6Items.map(i => ({
          inventory_id: i.inv.id,
          medicine_name: med[Object.keys(med).find(k => med[k].id === i.inv.medicine_id)!].name,
          salt_composition: med[Object.keys(med).find(k => med[k].id === i.inv.medicine_id)!].salt_composition,
          batch_number: i.inv.batch_number, quantity: i.qty,
          unit_price: i.inv.selling_price, line_total: Number(i.inv.selling_price) * i.qty,
          mrp_at_order: med[Object.keys(med).find(k => med[k].id === i.inv.medicine_id)!].mrp,
        })),
      },
    },
  });

  // Order 7 — Priya from Store 2 — REJECTED (3 days ago, out of stock reason)
  const o7Items = [
    { inv: s2Inv.find(i => i.medicine_id === med['Pan-D Capsule'].id)!, qty: 2 },
  ];
  const o7Totals = calcTotals(o7Items.map(i => ({ price: Number(i.inv.selling_price), qty: i.qty })), 'pickup');
  await prisma.order.create({
    data: {
      consumer_id: priya.id, store_id: store2.id,
      delivery_type: 'pickup', status: 'rejected',
      rejection_reason: 'Temporarily out of stock for this batch. Please try again tomorrow or order from another store.',
      payment_method: 'upi', payment_status: 'refunded',
      ...o7Totals,
      created_at: daysAgo(3),
      items: {
        create: o7Items.map(i => ({
          inventory_id: i.inv.id,
          medicine_name: med[Object.keys(med).find(k => med[k].id === i.inv.medicine_id)!].name,
          salt_composition: med[Object.keys(med).find(k => med[k].id === i.inv.medicine_id)!].salt_composition,
          batch_number: i.inv.batch_number, quantity: i.qty,
          unit_price: i.inv.selling_price, line_total: Number(i.inv.selling_price) * i.qty,
          mrp_at_order: med[Object.keys(med).find(k => med[k].id === i.inv.medicine_id)!].mrp,
        })),
      },
    },
  });

  // Order 8 — Sneha from Store 1 — PACKING
  const o8Items = [
    { inv: s1Inv.find(i => i.medicine_id === med['Allegra 120mg'].id)!, qty: 1 },
    { inv: s1Inv.find(i => i.medicine_id === med['Vicks Vaporub 25g'].id)!, qty: 2 },
  ];
  const o8Totals = calcTotals(o8Items.map(i => ({ price: Number(i.inv.selling_price), qty: i.qty })), 'delivery');
  await prisma.order.create({
    data: {
      consumer_id: sneha.id, store_id: store1.id,
      delivery_type: 'delivery',
      delivery_address: { line: '22, Koregaon Park, Lane 5', city: 'Pune', pincode: '411001' },
      status: 'packing', payment_method: 'card', payment_status: 'paid', payment_ref: 'CRD2026033333',
      ...o8Totals,
      accepted_at: daysAgo(1), created_at: daysAgo(1),
      items: {
        create: o8Items.map(i => ({
          inventory_id: i.inv.id,
          medicine_name: med[Object.keys(med).find(k => med[k].id === i.inv.medicine_id)!].name,
          salt_composition: med[Object.keys(med).find(k => med[k].id === i.inv.medicine_id)!].salt_composition,
          batch_number: i.inv.batch_number, quantity: i.qty,
          unit_price: i.inv.selling_price, line_total: Number(i.inv.selling_price) * i.qty,
          mrp_at_order: med[Object.keys(med).find(k => med[k].id === i.inv.medicine_id)!].mrp,
        })),
      },
    },
  });

  // Order 9 — Arjun from Store 1 — CANCELLED (2 days ago)
  const o9Items = [
    { inv: s1Inv.find(i => i.medicine_id === med['Shelcal 500mg'].id)!, qty: 1 },
  ];
  const o9Totals = calcTotals(o9Items.map(i => ({ price: Number(i.inv.selling_price), qty: i.qty })), 'delivery');
  await prisma.order.create({
    data: {
      consumer_id: arjun.id, store_id: store1.id,
      delivery_type: 'delivery',
      delivery_address: { line: 'B-47, Saket, South Delhi', city: 'New Delhi', pincode: '110017' },
      status: 'cancelled', payment_method: 'upi', payment_status: 'refunded',
      ...o9Totals,
      cancelled_at: daysAgo(2), created_at: daysAgo(2),
      items: {
        create: o9Items.map(i => ({
          inventory_id: i.inv.id,
          medicine_name: med[Object.keys(med).find(k => med[k].id === i.inv.medicine_id)!].name,
          salt_composition: med[Object.keys(med).find(k => med[k].id === i.inv.medicine_id)!].salt_composition,
          batch_number: i.inv.batch_number, quantity: i.qty,
          unit_price: i.inv.selling_price, line_total: Number(i.inv.selling_price) * i.qty,
          mrp_at_order: med[Object.keys(med).find(k => med[k].id === i.inv.medicine_id)!].mrp,
        })),
      },
    },
  });

  console.log('✅ 9 orders created across all statuses');

  // ── 12. Notifications ─────────────────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      // Consumer notifications
      { recipient_id: priya.id,  type: 'order.accepted',   title: 'Order accepted',               body: 'MedPlus Pharmacy — Saket accepted your order. Preparing your medicines now.', channel: 'in_app', sent_at: daysAgo(7) },
      { recipient_id: priya.id,  type: 'order.delivered',  title: 'Order delivered ✓',             body: 'Your order has been delivered. Thank you for using MedMarket!', channel: 'in_app', sent_at: daysAgo(7) },
      { recipient_id: priya.id,  type: 'order.rejected',   title: 'Order rejected',               body: 'Your order from HealthCure Medical Store was rejected: Temporarily out of stock.', channel: 'in_app', sent_at: daysAgo(3) },
      { recipient_id: arjun.id,  type: 'order.dispatched', title: 'Ready for pickup 🏪',           body: 'Your order at MedPlus Pharmacy — Saket is ready for pickup!', channel: 'in_app', sent_at: new Date() },
      { recipient_id: sneha.id,  type: 'order.accepted',   title: 'Order accepted',               body: 'HealthCure Medical Store accepted your order and will deliver soon.', channel: 'in_app', sent_at: new Date() },
      { recipient_id: sneha.id,  type: 'order.delivered',  title: 'Order delivered ✓',             body: 'Your order from HealthCure Medical Store has been delivered. Feel better soon!', channel: 'in_app', sent_at: daysAgo(5) },
      // Pharmacy notifications
      { recipient_id: rahul.id,  type: 'order.new',        title: 'New order received',           body: 'A new order has been placed at MedPlus Pharmacy — Saket. Accept within 30 minutes.', channel: 'in_app', sent_at: new Date() },
      { recipient_id: rahul.id,  type: 'expiry.alert',     title: '⚠️ Expiry Alert — 22 days',    body: 'Avomine Tablet (Batch AV2025Q001) expires in 22 days. Take action now.', channel: 'in_app', sent_at: new Date() },
      { recipient_id: rahul.id,  type: 'stock.low',        title: '📦 Low Stock Alert',           body: 'Vicks Vaporub 25g has only 6 units remaining (threshold: 10). Consider restocking.', channel: 'in_app', sent_at: new Date() },
      { recipient_id: fatima.id, type: 'store.approved',   title: 'Your pharmacy is approved! 🎉', body: 'Congratulations! HealthCure Medical Store has been verified and is now live on MedMarket.', channel: 'in_app', sent_at: daysAgo(60) },
      { recipient_id: fatima.id, type: 'order.new',        title: 'New order received',           body: 'A new order has been placed. Accept within 30 minutes.', channel: 'in_app', sent_at: new Date() },
      { recipient_id: fatima.id, type: 'expiry.alert',     title: '⚠️ Expiry Alert — 55 days',    body: 'Pudin Hara Pearls (Batch PH2025R002) expires in 55 days.', channel: 'in_app', sent_at: new Date() },
      { recipient_id: vikram.id, type: 'store.pending',    title: 'Application received',         body: 'Your pharmacy application is under review. We will notify you within 2–3 business days.', channel: 'in_app', sent_at: daysAgo(2) },
      { recipient_id: deepa.id,  type: 'store.rejected',   title: 'Application not approved',     body: 'Your application for Janta Pharma was not approved. Reason: Drug License document was expired. Please resubmit.', channel: 'in_app', sent_at: daysAgo(5) },
    ],
  });
  console.log('✅ Notifications created');

  // ── 13. Complaints ────────────────────────────────────────────────────────
  await prisma.complaint.createMany({
    data: [
      {
        consumer_id: priya.id,
        order_id:    order1.id,
        type:        'order_issue',
        subject:     'Wrong medicine quantity delivered',
        body:        'I ordered 3 strips of Limcee but received only 2. Please look into this and arrange for the missing strip to be delivered or refund the amount.',
        status:      'open',
      },
      {
        consumer_id: arjun.id,
        order_id:    null,
        type:        'pricing',
        subject:     'Price on app higher than in-store',
        body:        'I noticed the price for Dolo 650mg on the MedMarket app is ₹28, but the same medicine is ₹25 at the store. Is there a reason for this difference?',
        status:      'resolved',
        resolution:  'Investigated and found the pharmacy had updated in-store prices. App price corrected. Consumer has been notified.',
      },
    ],
  });
  console.log('✅ Complaints created');

  // ── 14. Audit Logs ────────────────────────────────────────────────────────
  await prisma.auditLog.createMany({
    data: [
      { actor_id: milind.id, actor_role: 'admin', action: 'pharmacy.approved',   entity_type: 'pharmacy_store', entity_id: store1.id, metadata: { store_name: 'MedPlus Pharmacy — Saket', verified_at: daysAgo(30).toISOString() }, ip_address: '122.160.10.1', created_at: daysAgo(30) },
      { actor_id: milind.id, actor_role: 'admin', action: 'pharmacy.approved',   entity_type: 'pharmacy_store', entity_id: store2.id, metadata: { store_name: 'HealthCure Medical Store', verified_at: daysAgo(60).toISOString() }, ip_address: '122.160.10.1', created_at: daysAgo(60) },
      { actor_id: milind.id, actor_role: 'admin', action: 'pharmacy.rejected',   entity_type: 'pharmacy_store', entity_id: store3.id, metadata: { reason: 'Drug License document was expired.' }, ip_address: '122.160.10.1', created_at: daysAgo(5) },
      { actor_id: milind.id, actor_role: 'admin', action: 'batch.blacklisted',   entity_type: 'blacklisted_batch', entity_id: med['Crocin 500mg'].id, metadata: { batch: 'CR2024Z999', reason: 'CDSCO Recall Notice RC/2026/0048' }, ip_address: '122.160.10.1', created_at: daysAgo(7) },
      { actor_id: milind.id, actor_role: 'admin', action: 'medicine.created',    entity_type: 'medicine_master', entity_id: med['Dolo 650mg'].id, metadata: { name: 'Dolo 650mg' }, ip_address: '122.160.10.1', created_at: daysAgo(90) },
    ],
  });
  console.log('✅ Audit logs created');

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(55));
  console.log('🎉 MedMarket seed complete!\n');
  console.log('  👤 Admin:');
  console.log('     Email    : milind@medmarket.in');
  console.log('     Password : Admin@1234\n');
  console.log('  🛒 Consumers (all use password: Consumer@1234):');
  console.log('     priya.sharma@gmail.com');
  console.log('     arjun.mehta@gmail.com');
  console.log('     sneha.kulkarni@gmail.com\n');
  console.log('  🏪 Pharmacy Owners (all use password: Pharma@1234):');
  console.log('     rahul.gupta@medplus.in      → Approved (MedPlus, Delhi)');
  console.log('     fatima.sheikh@healthcure.in → Approved (HealthCure, Pune)');
  console.log('     vikram.nair@apollo.in       → Pending review');
  console.log('     deepa.joshi@jantapharma.in → Rejected\n');
  console.log('  💊 30 medicines  |  2 stores with inventory');
  console.log('  📦 9 orders (delivered/dispatched/packing/accepted/confirmed/rejected/cancelled)');
  console.log('  ⚠️  2 near-expiry items  |  1 blacklisted batch  |  1 low-stock item');
  console.log('─'.repeat(55) + '\n');
}

main()
  .catch(e => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
