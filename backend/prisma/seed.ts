/**
 * MedMarket India — Analytics Showcase Seed
 *
 * Run:  npx tsx prisma/seed.ts  OR  npm run db:seed
 *
 * Designed to populate every analytics panel with meaningful data:
 *   - Pharmacy: 14-day revenue trend, hourly heatmap, top medicines,
 *               fulfillment/rejection/repeat-customer rates, dead stock alert
 *   - Admin: multi-city GMV, city ranking, platform top medicines,
 *            consumer activation, approval turnaround, new registrations
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

// Realistic hourly order distribution: peaks at 9-11am and 7-9pm
const HOUR_WEIGHTS = [0,0,0,0,0,0,1,2,5,8,8,6,4,3,4,4,5,7,9,8,5,3,1,0];
const HOUR_TOTAL   = HOUR_WEIGHTS.reduce((a,b) => a+b, 0);

function pickHour(): number {
  let r = Math.random() * HOUR_TOTAL;
  for (let h = 0; h < 24; h++) {
    r -= HOUR_WEIGHTS[h];
    if (r <= 0) return h;
  }
  return 10;
}

function orderDate(daysBack: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  const h = pickHour();
  d.setHours(h, Math.floor(Math.random() * 60), 0, 0);
  return d;
}

function calcTotals(subtotal: number, deliveryType: 'delivery' | 'pickup') {
  const delivery_fee = deliveryType === 'delivery' && subtotal < 200 ? 30 : 0;
  const gst_amount   = parseFloat((subtotal * 0.12).toFixed(2));
  const total_amount = parseFloat((subtotal + delivery_fee + gst_amount).toFixed(2));
  return { subtotal, delivery_fee, gst_amount, total_amount };
}

function uid() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱  MedMarket analytics seed starting…\n');

  // ── Clear all tables in dependency order ─────────────────────────────────
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
  console.log('✅  Cleared existing data');

  // ── Platform settings ─────────────────────────────────────────────────────
  await prisma.platformSettings.create({
    data: {
      id: 'singleton', gst_rate: 12, delivery_fee: 30, free_delivery_threshold: 200,
      cod_limit: 2000, order_timeout_minutes: 30,
      expiry_warn_60: true, expiry_warn_30: true, dead_stock_alert: true,
      email_invoice: true, sms_on_order: true, updated_at: new Date(),
    },
  });

  // ── Users ─────────────────────────────────────────────────────────────────
  const milind   = await prisma.user.create({ data: { name:'Milind Rao', email:'milind@medmarket.in', mobile:'+919800000001', password_hash: await hash('Admin@1234'), role:'admin', created_at: daysAgo(90) } });

  // Pharmacy owners
  const rahul    = await prisma.user.create({ data: { name:'Rahul Gupta', email:'rahul@medplus.in', mobile:'+919800000002', password_hash: await hash('Pharma@1234'), role:'pharmacy_owner', created_at: daysAgo(65) } });
  const fatima   = await prisma.user.create({ data: { name:'Fatima Sheikh', email:'fatima@healthcure.in', mobile:'+919800000003', password_hash: await hash('Pharma@1234'), role:'pharmacy_owner', created_at: daysAgo(80) } });
  const vikram   = await prisma.user.create({ data: { name:'Vikram Nair', email:'vikram@apollo.in', mobile:'+919800000004', password_hash: await hash('Pharma@1234'), role:'pharmacy_owner', created_at: daysAgo(5) } });
  const deepa    = await prisma.user.create({ data: { name:'Deepa Joshi', email:'deepa@janta.in', mobile:'+919800000005', password_hash: await hash('Pharma@1234'), role:'pharmacy_owner', created_at: daysAgo(10) } });

  // Consumers – registered at different points to show registration trend
  const priya    = await prisma.user.create({ data: { name:'Priya Sharma', email:'priya@gmail.com', mobile:'+919800000010', password_hash: await hash('Consumer@1234'), role:'consumer', created_at: daysAgo(60) } });
  const arjun    = await prisma.user.create({ data: { name:'Arjun Mehta', email:'arjun@gmail.com', mobile:'+919800000011', password_hash: await hash('Consumer@1234'), role:'consumer', created_at: daysAgo(45) } });
  const sneha    = await prisma.user.create({ data: { name:'Sneha Kulkarni', email:'sneha@gmail.com', mobile:'+919800000012', password_hash: await hash('Consumer@1234'), role:'consumer', created_at: daysAgo(30) } });
  const rohit    = await prisma.user.create({ data: { name:'Rohit Verma', email:'rohit@gmail.com', mobile:'+919800000013', password_hash: await hash('Consumer@1234'), role:'consumer', created_at: daysAgo(4) } });
  const ananya   = await prisma.user.create({ data: { name:'Ananya Iyer', email:'ananya@gmail.com', mobile:'+919800000014', password_hash: await hash('Consumer@1234'), role:'consumer', created_at: daysAgo(2) } });

  console.log('✅  Users created');

  // ── Pharmacy Stores ───────────────────────────────────────────────────────
  const store1 = await prisma.pharmacyStore.create({
    data: {
      owner_id: rahul.id, name:'MedPlus Pharmacy — Saket',
      address_line:'Shop 12, Select Citywalk, Saket', city:'New Delhi', state:'Delhi', pincode:'110017',
      latitude:28.5245, longitude:77.2066, phone:'+911140001234', email:'saket@medplus.in',
      operating_hours:{ open:'08:00', close:'22:00', days:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] },
      status:'approved', drug_license_no:'DL/DELHI/2024/MED/001234', gst_number:'07AABCM1234C1Z5',
      fssai_no:'13424999000123', verified_at: daysAgo(58), verified_by: milind.id,
      avg_rating:4.5, total_reviews:211, created_at: daysAgo(63),
    },
  });

  const store2 = await prisma.pharmacyStore.create({
    data: {
      owner_id: fatima.id, name:'HealthCure Medical Store',
      address_line:'7, FC Road, Opp Ferguson College', city:'Pune', state:'Maharashtra', pincode:'411004',
      latitude:18.5195, longitude:73.8408, phone:'+912025001234', email:'info@healthcure.in',
      operating_hours:{ open:'09:00', close:'21:00', days:['Mon','Tue','Wed','Thu','Fri','Sat'] },
      status:'approved', drug_license_no:'MH/PUNE/2023/PHM/005678', gst_number:'27AADCH5678F1Z2',
      fssai_no:'11524999000456', verified_at: daysAgo(72), verified_by: milind.id,
      avg_rating:4.3, total_reviews:178, created_at: daysAgo(78),
    },
  });

  await prisma.pharmacyStore.create({
    data: {
      owner_id: vikram.id, name:'Apollo Pharmacy — Koramangala',
      address_line:'45, 80 Feet Road, Koramangala 4th Block', city:'Bengaluru', state:'Karnataka', pincode:'560034',
      phone:'+918025001234', status:'pending',
      drug_license_no:'KA/BLR/2025/DRG/009012', gst_number:'29AAACA9012G1Z8',
      created_at: daysAgo(5),
    },
  });

  await prisma.pharmacyStore.create({
    data: {
      owner_id: deepa.id, name:'Janta Medical',
      address_line:'Near Bus Stand, Station Road', city:'Nagpur', state:'Maharashtra', pincode:'440001',
      phone:'+917125001234', status:'rejected',
      rejection_reason:'Drug License document was expired. Please upload a valid license and resubmit.',
      drug_license_no:'MH/NGP/2022/PHM/001111', gst_number:'27AADCJ1111K1Z9',
      created_at: daysAgo(10),
    },
  });

  await prisma.storeDocument.createMany({
    data:[
      { store_id:store1.id, doc_type:'drug_license',    s3_key:'stores/s1/dl.pdf',    original_filename:'DL_MedPlus.pdf',    mime_type:'application/pdf' },
      { store_id:store1.id, doc_type:'gst_certificate', s3_key:'stores/s1/gst.pdf',   original_filename:'GST_MedPlus.pdf',   mime_type:'application/pdf' },
      { store_id:store1.id, doc_type:'store_photo',     s3_key:'stores/s1/front.jpg', original_filename:'storefront.jpg',    mime_type:'image/jpeg' },
      { store_id:store2.id, doc_type:'drug_license',    s3_key:'stores/s2/dl.pdf',    original_filename:'DL_HealthCure.pdf', mime_type:'application/pdf' },
      { store_id:store2.id, doc_type:'gst_certificate', s3_key:'stores/s2/gst.pdf',   original_filename:'GST_HC.pdf',        mime_type:'application/pdf' },
      { store_id:store2.id, doc_type:'store_photo',     s3_key:'stores/s2/front.jpg', original_filename:'front.jpg',         mime_type:'image/jpeg' },
    ],
  });
  await prisma.bankAccount.createMany({
    data:[
      { store_id:store1.id, bank_name:'HDFC Bank', account_holder:'Rahul Gupta', account_number_encrypted:'enc_hdfc_rahul', ifsc_code:'HDFC0001234', is_verified:true },
      { store_id:store2.id, bank_name:'ICICI Bank', account_holder:'Fatima Sheikh', account_number_encrypted:'enc_icici_fatima', ifsc_code:'ICIC0005678', is_verified:true },
    ],
  });

  console.log('✅  Stores created');

  // ── Consumer addresses ────────────────────────────────────────────────────
  await prisma.consumerAddress.createMany({
    data:[
      { consumer_id:priya.id,  label:'Home',   address_line:'14, Vasant Vihar, Sector 9', city:'New Delhi', pincode:'122001', is_default:true },
      { consumer_id:arjun.id,  label:'Home',   address_line:'B-47, Saket South Delhi',    city:'New Delhi', pincode:'110017', is_default:true },
      { consumer_id:sneha.id,  label:'Home',   address_line:'22, Koregaon Park, Lane 5',  city:'Pune',      pincode:'411001', is_default:true },
      { consumer_id:rohit.id,  label:'Home',   address_line:'Sector 62, Noida',           city:'New Delhi', pincode:'201301', is_default:true },
      { consumer_id:ananya.id, label:'Home',   address_line:'Indiranagar, 100 Feet Road', city:'Bengaluru', pincode:'560038', is_default:true },
    ],
  });

  // ── Medicine Catalogue ────────────────────────────────────────────────────
  const meds = await prisma.medicineMaster.createManyAndReturn({
    data:[
      // Pain Relief
      { name:'Crocin 500mg',         generic_name:'Paracetamol',             salt_composition:'Paracetamol 500mg',                          manufacturer:'GSK',              category:'Pain Relief',   form:'tablet',  pack_size:'Strip of 15', mrp:22,   schedule:'otc', created_by:milind.id },
      { name:'Dolo 650mg',           generic_name:'Paracetamol',             salt_composition:'Paracetamol 650mg',                          manufacturer:'Micro Labs',       category:'Pain Relief',   form:'tablet',  pack_size:'Strip of 15', mrp:30,   schedule:'otc', created_by:milind.id },
      { name:'Combiflam',            generic_name:'Ibuprofen+Paracetamol',   salt_composition:'Ibuprofen 400mg + Paracetamol 325mg',        manufacturer:'Sanofi',           category:'Pain Relief',   form:'tablet',  pack_size:'Strip of 20', mrp:35,   schedule:'otc', created_by:milind.id },
      { name:'Volini Gel 30g',       generic_name:'Diclofenac Sodium',       salt_composition:'Diclofenac Diethylamine 1.16% w/w',          manufacturer:'Pfizer',           category:'Pain Relief',   form:'gel',     pack_size:'Tube of 30g', mrp:168,  schedule:'otc', created_by:milind.id },
      // Antacids & GI
      { name:'Pan-D Capsule',        generic_name:'Pantoprazole+Domperidone',salt_composition:'Pantoprazole 40mg + Domperidone 10mg',       manufacturer:'Alkem',            category:'Antacid',       form:'capsule', pack_size:'Strip of 10', mrp:82,   schedule:'otc', created_by:milind.id },
      { name:'Gelusil MPS Tablet',   generic_name:'Antacid Combination',     salt_composition:'Magnesium Hydroxide + Aluminium Hydroxide',  manufacturer:'Pfizer',           category:'Antacid',       form:'tablet',  pack_size:'Strip of 18', mrp:55,   schedule:'otc', created_by:milind.id },
      { name:'Digene Syrup 200ml',   generic_name:'Antacid Syrup',           salt_composition:'Aluminium Hydroxide + Simethicone',          manufacturer:'Abbott',           category:'Antacid',       form:'syrup',   pack_size:'Bottle 200ml', mrp:140,  schedule:'otc', created_by:milind.id },
      // Cold & Cough
      { name:'Benadryl Cough 100ml', generic_name:'Diphenhydramine',         salt_composition:'Diphenhydramine HCl 14.08mg',                manufacturer:'J&J',              category:'Cold & Cough',  form:'syrup',   pack_size:'Bottle 100ml', mrp:85,   schedule:'otc', created_by:milind.id },
      { name:'Strepsils Lozenges',   generic_name:'Amylmetacresol',          salt_composition:'2,4-Dichlorobenzyl Alcohol 1.2mg',           manufacturer:'Reckitt',          category:'Cold & Cough',  form:'tablet',  pack_size:'Pack of 16',  mrp:62,   schedule:'otc', created_by:milind.id },
      { name:'Otrivin Nasal 10ml',   generic_name:'Xylometazoline',          salt_composition:'Xylometazoline HCl 0.1% w/v',               manufacturer:'Novartis',         category:'Cold & Cough',  form:'drops',   pack_size:'Bottle 10ml', mrp:55,   schedule:'otc', created_by:milind.id },
      // Vitamins & Supplements
      { name:'Limcee 500mg',         generic_name:'Vitamin C',               salt_composition:'Ascorbic Acid 500mg',                        manufacturer:'Abbott',           category:'Vitamins',      form:'tablet',  pack_size:'Strip of 15', mrp:18,   schedule:'otc', created_by:milind.id },
      { name:'Shelcal 500mg',        generic_name:'Calcium + Vitamin D3',    salt_composition:'Calcium Carbonate 1250mg + Vitamin D3',      manufacturer:'Torrent',          category:'Vitamins',      form:'tablet',  pack_size:'Strip of 15', mrp:130,  schedule:'otc', created_by:milind.id },
      { name:'Becosules Capsule',    generic_name:'B-Complex + Vitamin C',   salt_composition:'Vitamin B Complex + Folic Acid + Vitamin C', manufacturer:'Pfizer',           category:'Vitamins',      form:'capsule', pack_size:'Strip of 20', mrp:95,   schedule:'otc', created_by:milind.id },
      // Hydration
      { name:'Electral ORS Sachet',  generic_name:'Oral Rehydration Salts',  salt_composition:'Sodium Chloride + Glucose + Potassium',      manufacturer:'Franco Indian',    category:'Hydration',     form:'powder',  pack_size:'Pack of 21.8g',mrp:22,   schedule:'otc', created_by:milind.id },
      { name:'Glucon-D 200g',        generic_name:'Glucose Powder',          salt_composition:'Dextrose Monohydrate with Vitamins',         manufacturer:'Heinz',            category:'Hydration',     form:'powder',  pack_size:'Jar of 200g',  mrp:80,   schedule:'otc', created_by:milind.id },
      // Allergy & Skin
      { name:'Allegra 120mg',        generic_name:'Fexofenadine',            salt_composition:'Fexofenadine HCl 120mg',                     manufacturer:'Sanofi',           category:'Allergy',       form:'tablet',  pack_size:'Strip of 10', mrp:192,  schedule:'otc', created_by:milind.id },
      { name:'Calamine Lotion 100ml',generic_name:'Calamine',                salt_composition:'Calamine 8% w/v + Zinc Oxide 4% w/v',        manufacturer:'Torrent',          category:'Skin Care',     form:'syrup',   pack_size:'Bottle 100ml', mrp:48,   schedule:'otc', created_by:milind.id },
      // Digestive
      { name:'Isabgol Husk 100g',    generic_name:'Psyllium Husk',           salt_composition:'Psyllium Husk 100%',                         manufacturer:'Dabur',            category:'Digestive',     form:'powder',  pack_size:'Jar of 100g',  mrp:75,   schedule:'otc', created_by:milind.id },
      // First Aid
      { name:'Betadine Ointment 20g',generic_name:'Povidone Iodine',         salt_composition:'Povidone Iodine 5% w/w',                     manufacturer:'Win Medicare',     category:'First Aid',     form:'gel',     pack_size:'Tube of 20g',  mrp:68,   schedule:'otc', created_by:milind.id },
      // Respiratory
      { name:'Asthalin Inhaler',     generic_name:'Salbutamol',              salt_composition:'Salbutamol Sulphate 100mcg/actuation',        manufacturer:'Cipla',            category:'Respiratory',   form:'inhaler', pack_size:'200 doses',    mrp:140,  schedule:'otc', created_by:milind.id },
    ],
  });

  const M: Record<string, typeof meds[0]> = {};
  for (const m of meds) M[m.name] = m;

  console.log(`✅  ${meds.length} medicines in catalogue`);

  // ── Inventory — Store 1 (Delhi) ───────────────────────────────────────────
  const s1inv = await prisma.storeInventory.createManyAndReturn({
    data:[
      { store_id:store1.id, medicine_id:M['Crocin 500mg'].id,          batch_number:'CR25A01', mfg_date:daysAgo(180), exp_date:daysFromNow(540), quantity:350, selling_price:20,  low_stock_threshold:40 },
      { store_id:store1.id, medicine_id:M['Dolo 650mg'].id,            batch_number:'DL25B01', mfg_date:daysAgo(120), exp_date:daysFromNow(420), quantity:280, selling_price:28,  low_stock_threshold:40 },
      { store_id:store1.id, medicine_id:M['Combiflam'].id,             batch_number:'CB25C01', mfg_date:daysAgo(90),  exp_date:daysFromNow(365), quantity:180, selling_price:33,  low_stock_threshold:25 },
      { store_id:store1.id, medicine_id:M['Volini Gel 30g'].id,        batch_number:'VG25D01', mfg_date:daysAgo(60),  exp_date:daysFromNow(600), quantity:75,  selling_price:155, low_stock_threshold:10 },
      { store_id:store1.id, medicine_id:M['Pan-D Capsule'].id,         batch_number:'PD25E01', mfg_date:daysAgo(45),  exp_date:daysFromNow(540), quantity:240, selling_price:78,  low_stock_threshold:30 },
      { store_id:store1.id, medicine_id:M['Gelusil MPS Tablet'].id,    batch_number:'GM25F01', mfg_date:daysAgo(30),  exp_date:daysFromNow(720), quantity:120, selling_price:50,  low_stock_threshold:20 },
      { store_id:store1.id, medicine_id:M['Benadryl Cough 100ml'].id,  batch_number:'BC25G01', mfg_date:daysAgo(25),  exp_date:daysFromNow(400), quantity:90,  selling_price:80,  low_stock_threshold:15 },
      { store_id:store1.id, medicine_id:M['Limcee 500mg'].id,          batch_number:'LC25H01', mfg_date:daysAgo(15),  exp_date:daysFromNow(540), quantity:400, selling_price:16,  low_stock_threshold:50 },
      { store_id:store1.id, medicine_id:M['Shelcal 500mg'].id,         batch_number:'SC25I01', mfg_date:daysAgo(10),  exp_date:daysFromNow(540), quantity:100, selling_price:120, low_stock_threshold:15 },
      { store_id:store1.id, medicine_id:M['Becosules Capsule'].id,     batch_number:'BV25J01', mfg_date:daysAgo(20),  exp_date:daysFromNow(600), quantity:130, selling_price:88,  low_stock_threshold:20 },
      { store_id:store1.id, medicine_id:M['Electral ORS Sachet'].id,   batch_number:'EP25K01', mfg_date:daysAgo(8),   exp_date:daysFromNow(720), quantity:500, selling_price:20,  low_stock_threshold:60 },
      { store_id:store1.id, medicine_id:M['Allegra 120mg'].id,         batch_number:'AL25L01', mfg_date:daysAgo(35),  exp_date:daysFromNow(480), quantity:60,  selling_price:180, low_stock_threshold:10 },
      { store_id:store1.id, medicine_id:M['Betadine Ointment 20g'].id, batch_number:'BD25M01', mfg_date:daysAgo(12),  exp_date:daysFromNow(900), quantity:55,  selling_price:62,  low_stock_threshold:10 },
      { store_id:store1.id, medicine_id:M['Asthalin Inhaler'].id,      batch_number:'AI25N01', mfg_date:daysAgo(20),  exp_date:daysFromNow(540), quantity:30,  selling_price:128, low_stock_threshold:5  },
      // Near-expiry for expiry alert demo
      { store_id:store1.id, medicine_id:M['Strepsils Lozenges'].id,    batch_number:'ST25P01', mfg_date:daysAgo(700), exp_date:daysFromNow(24),  quantity:22,  selling_price:58,  low_stock_threshold:10, status:'active' },
      // Dead stock: Isabgol — has inventory but will receive NO orders
      { store_id:store1.id, medicine_id:M['Isabgol Husk 100g'].id,     batch_number:'IH25Q01', mfg_date:daysAgo(60),  exp_date:daysFromNow(480), quantity:45,  selling_price:70,  low_stock_threshold:10 },
    ],
  });

  // ── Inventory — Store 2 (Pune) ────────────────────────────────────────────
  const s2inv = await prisma.storeInventory.createManyAndReturn({
    data:[
      { store_id:store2.id, medicine_id:M['Crocin 500mg'].id,          batch_number:'CR25A02', mfg_date:daysAgo(200), exp_date:daysFromNow(500), quantity:300, selling_price:21,  low_stock_threshold:40 },
      { store_id:store2.id, medicine_id:M['Dolo 650mg'].id,            batch_number:'DL25B02', mfg_date:daysAgo(110), exp_date:daysFromNow(450), quantity:220, selling_price:29,  low_stock_threshold:35 },
      { store_id:store2.id, medicine_id:M['Pan-D Capsule'].id,         batch_number:'PD25E02', mfg_date:daysAgo(55),  exp_date:daysFromNow(520), quantity:200, selling_price:80,  low_stock_threshold:25 },
      { store_id:store2.id, medicine_id:M['Digene Syrup 200ml'].id,    batch_number:'DG25F02', mfg_date:daysAgo(40),  exp_date:daysFromNow(600), quantity:70,  selling_price:132, low_stock_threshold:10 },
      { store_id:store2.id, medicine_id:M['Benadryl Cough 100ml'].id,  batch_number:'BC25G02', mfg_date:daysAgo(35),  exp_date:daysFromNow(380), quantity:80,  selling_price:82,  low_stock_threshold:12 },
      { store_id:store2.id, medicine_id:M['Strepsils Lozenges'].id,    batch_number:'ST25H02', mfg_date:daysAgo(20),  exp_date:daysFromNow(480), quantity:95,  selling_price:58,  low_stock_threshold:15 },
      { store_id:store2.id, medicine_id:M['Limcee 500mg'].id,          batch_number:'LC25I02', mfg_date:daysAgo(18),  exp_date:daysFromNow(600), quantity:320, selling_price:17,  low_stock_threshold:40 },
      { store_id:store2.id, medicine_id:M['Shelcal 500mg'].id,         batch_number:'SC25J02', mfg_date:daysAgo(12),  exp_date:daysFromNow(540), quantity:85,  selling_price:125, low_stock_threshold:12 },
      { store_id:store2.id, medicine_id:M['Electral ORS Sachet'].id,   batch_number:'EP25K02', mfg_date:daysAgo(6),   exp_date:daysFromNow(720), quantity:450, selling_price:20,  low_stock_threshold:60 },
      { store_id:store2.id, medicine_id:M['Glucon-D 200g'].id,         batch_number:'GD25L02', mfg_date:daysAgo(22),  exp_date:daysFromNow(360), quantity:110, selling_price:75,  low_stock_threshold:15 },
      { store_id:store2.id, medicine_id:M['Allegra 120mg'].id,         batch_number:'AL25M02', mfg_date:daysAgo(30),  exp_date:daysFromNow(480), quantity:55,  selling_price:185, low_stock_threshold:10 },
      { store_id:store2.id, medicine_id:M['Calamine Lotion 100ml'].id, batch_number:'CL25N02', mfg_date:daysAgo(10),  exp_date:daysFromNow(540), quantity:50,  selling_price:45,  low_stock_threshold:8  },
      { store_id:store2.id, medicine_id:M['Otrivin Nasal 10ml'].id,    batch_number:'OT25O02', mfg_date:daysAgo(28),  exp_date:daysFromNow(360), quantity:60,  selling_price:50,  low_stock_threshold:10 },
      // Near-expiry item (58 days — hits 60-day warning)
      { store_id:store2.id, medicine_id:M['Combiflam'].id,             batch_number:'CB25P02', mfg_date:daysAgo(310), exp_date:daysFromNow(58),  quantity:30,  selling_price:33,  low_stock_threshold:10, status:'active' },
    ],
  });

  console.log('✅  Inventory created');

  // ── Build lookup: medicine_id → inventory row for each store ─────────────
  const s1ByMed: Record<string, typeof s1inv[0]> = {};
  for (const row of s1inv) s1ByMed[row.medicine_id] = row;
  const s2ByMed: Record<string, typeof s2inv[0]> = {};
  for (const row of s2inv) s2ByMed[row.medicine_id] = row;

  // ── Order generator ───────────────────────────────────────────────────────
  let orderSeq = 0;

  async function placeOrder(opts: {
    consumer: typeof priya;
    store: typeof store1;
    invByMed: typeof s1ByMed;
    daysBack: number;
    items: { name: string; qty: number }[];
    deliveryType: 'delivery' | 'pickup';
    paymentMethod: 'upi' | 'card' | 'cod';
    status: 'delivered' | 'dispatched' | 'packing' | 'accepted' | 'confirmed' | 'rejected' | 'cancelled';
    rejectionReason?: string;
  }) {
    const { consumer, store, invByMed, daysBack, items, deliveryType, paymentMethod, status, rejectionReason } = opts;
    orderSeq++;

    const lineItems = items.map(({ name, qty }) => {
      const med = M[name];
      const inv = invByMed[med.id];
      if (!inv) throw new Error(`No inventory for ${name} in store ${store.name}`);
      const line_total = Number(inv.selling_price) * qty;
      return { inv, med, qty, line_total };
    });

    const subtotal = lineItems.reduce((s, l) => s + l.line_total, 0);
    const totals   = calcTotals(subtotal, deliveryType);
    const created  = orderDate(daysBack);

    const isTerminal = ['delivered','rejected','cancelled'].includes(status);
    const accepted_at   = ['delivered','dispatched','packing','accepted'].includes(status) ? new Date(created.getTime() + 8 * 60000) : null;
    const dispatched_at = ['delivered','dispatched'].includes(status)                       ? new Date(created.getTime() + 25 * 60000) : null;
    const delivered_at  = status === 'delivered'                                            ? new Date(created.getTime() + 90 * 60000) : null;
    const cancelled_at  = status === 'cancelled'                                            ? new Date(created.getTime() + 5  * 60000) : null;

    await prisma.order.create({
      data: {
        consumer_id: consumer.id, store_id: store.id,
        delivery_type: deliveryType,
        delivery_address: deliveryType === 'delivery'
          ? { line: consumer.name + ' address', city: store.city, pincode: store.pincode }
          : null,
        status, payment_method: paymentMethod,
        payment_status: status === 'rejected' || status === 'cancelled' ? 'refunded' : 'paid',
        payment_ref: `REF${uid()}`,
        rejection_reason: rejectionReason || null,
        ...totals,
        accepted_at, dispatched_at, delivered_at, cancelled_at,
        created_at: created,
        items: {
          create: lineItems.map(({ inv, med, qty, line_total }) => ({
            inventory_id:    inv.id,
            medicine_name:   med.name,
            salt_composition:med.salt_composition,
            batch_number:    inv.batch_number,
            quantity:        qty,
            unit_price:      inv.selling_price,
            line_total,
            mrp_at_order:    med.mrp,
          })),
        },
      },
    });
  }

  // ── STORE 1 orders (Delhi, last 14 days) ─────────────────────────────────
  // Day 13 ago
  await placeOrder({ consumer:priya,  store:store1, invByMed:s1ByMed, daysBack:13, status:'delivered', deliveryType:'delivery', paymentMethod:'upi', items:[{name:'Crocin 500mg',qty:3},{name:'Limcee 500mg',qty:2}] });
  await placeOrder({ consumer:arjun,  store:store1, invByMed:s1ByMed, daysBack:13, status:'delivered', deliveryType:'pickup',   paymentMethod:'card', items:[{name:'Pan-D Capsule',qty:2},{name:'Gelusil MPS Tablet',qty:1}] });

  // Day 12
  await placeOrder({ consumer:priya,  store:store1, invByMed:s1ByMed, daysBack:12, status:'delivered', deliveryType:'delivery', paymentMethod:'upi',  items:[{name:'Dolo 650mg',qty:2},{name:'Benadryl Cough 100ml',qty:1}] });
  await placeOrder({ consumer:rohit,  store:store1, invByMed:s1ByMed, daysBack:12, status:'delivered', deliveryType:'delivery', paymentMethod:'cod',  items:[{name:'Electral ORS Sachet',qty:6},{name:'Limcee 500mg',qty:3}] });
  await placeOrder({ consumer:arjun,  store:store1, invByMed:s1ByMed, daysBack:12, status:'rejected',  deliveryType:'delivery', paymentMethod:'upi',  items:[{name:'Crocin 500mg',qty:2}], rejectionReason:'Item temporarily unavailable at this batch.' });

  // Day 11
  await placeOrder({ consumer:priya,  store:store1, invByMed:s1ByMed, daysBack:11, status:'delivered', deliveryType:'pickup',   paymentMethod:'card', items:[{name:'Allegra 120mg',qty:1},{name:'Becosules Capsule',qty:1}] });
  await placeOrder({ consumer:rohit,  store:store1, invByMed:s1ByMed, daysBack:11, status:'delivered', deliveryType:'delivery', paymentMethod:'upi',  items:[{name:'Pan-D Capsule',qty:2},{name:'Dolo 650mg',qty:1}] });

  // Day 10
  await placeOrder({ consumer:arjun,  store:store1, invByMed:s1ByMed, daysBack:10, status:'delivered', deliveryType:'delivery', paymentMethod:'upi',  items:[{name:'Crocin 500mg',qty:2},{name:'Limcee 500mg',qty:3},{name:'Shelcal 500mg',qty:1}] });
  await placeOrder({ consumer:priya,  store:store1, invByMed:s1ByMed, daysBack:10, status:'cancelled', deliveryType:'delivery', paymentMethod:'upi',  items:[{name:'Volini Gel 30g',qty:1}] });
  await placeOrder({ consumer:ananya, store:store1, invByMed:s1ByMed, daysBack:10, status:'delivered', deliveryType:'pickup',   paymentMethod:'card', items:[{name:'Asthalin Inhaler',qty:1},{name:'Becosules Capsule',qty:2}] });

  // Day 9
  await placeOrder({ consumer:priya,  store:store1, invByMed:s1ByMed, daysBack:9,  status:'delivered', deliveryType:'delivery', paymentMethod:'card', items:[{name:'Electral ORS Sachet',qty:5},{name:'Dolo 650mg',qty:2}] });
  await placeOrder({ consumer:rohit,  store:store1, invByMed:s1ByMed, daysBack:9,  status:'delivered', deliveryType:'delivery', paymentMethod:'upi',  items:[{name:'Pan-D Capsule',qty:1},{name:'Gelusil MPS Tablet',qty:2}] });
  await placeOrder({ consumer:arjun,  store:store1, invByMed:s1ByMed, daysBack:9,  status:'rejected',  deliveryType:'pickup',   paymentMethod:'card', items:[{name:'Shelcal 500mg',qty:2}], rejectionReason:'Out of stock on requested batch.' });

  // Day 8
  await placeOrder({ consumer:ananya, store:store1, invByMed:s1ByMed, daysBack:8,  status:'delivered', deliveryType:'delivery', paymentMethod:'upi',  items:[{name:'Crocin 500mg',qty:3},{name:'Benadryl Cough 100ml',qty:1}] });
  await placeOrder({ consumer:priya,  store:store1, invByMed:s1ByMed, daysBack:8,  status:'delivered', deliveryType:'pickup',   paymentMethod:'upi',  items:[{name:'Allegra 120mg',qty:1},{name:'Limcee 500mg',qty:2}] });

  // Day 7
  await placeOrder({ consumer:rohit,  store:store1, invByMed:s1ByMed, daysBack:7,  status:'delivered', deliveryType:'delivery', paymentMethod:'cod',  items:[{name:'Electral ORS Sachet',qty:8},{name:'Betadine Ointment 20g',qty:1}] });
  await placeOrder({ consumer:arjun,  store:store1, invByMed:s1ByMed, daysBack:7,  status:'delivered', deliveryType:'delivery', paymentMethod:'upi',  items:[{name:'Dolo 650mg',qty:3},{name:'Pan-D Capsule',qty:1}] });
  await placeOrder({ consumer:priya,  store:store1, invByMed:s1ByMed, daysBack:7,  status:'delivered', deliveryType:'pickup',   paymentMethod:'card', items:[{name:'Becosules Capsule',qty:1},{name:'Shelcal 500mg',qty:1}] });

  // Day 6
  await placeOrder({ consumer:ananya, store:store1, invByMed:s1ByMed, daysBack:6,  status:'delivered', deliveryType:'delivery', paymentMethod:'upi',  items:[{name:'Crocin 500mg',qty:4},{name:'Limcee 500mg',qty:3}] });
  await placeOrder({ consumer:rohit,  store:store1, invByMed:s1ByMed, daysBack:6,  status:'delivered', deliveryType:'delivery', paymentMethod:'card', items:[{name:'Volini Gel 30g',qty:1},{name:'Betadine Ointment 20g',qty:1}] });

  // Day 5
  await placeOrder({ consumer:priya,  store:store1, invByMed:s1ByMed, daysBack:5,  status:'delivered', deliveryType:'delivery', paymentMethod:'upi',  items:[{name:'Pan-D Capsule',qty:2},{name:'Dolo 650mg',qty:1}] });
  await placeOrder({ consumer:arjun,  store:store1, invByMed:s1ByMed, daysBack:5,  status:'delivered', deliveryType:'pickup',   paymentMethod:'upi',  items:[{name:'Electral ORS Sachet',qty:6},{name:'Crocin 500mg',qty:2}] });
  await placeOrder({ consumer:ananya, store:store1, invByMed:s1ByMed, daysBack:5,  status:'rejected',  deliveryType:'delivery', paymentMethod:'card', items:[{name:'Asthalin Inhaler',qty:1}], rejectionReason:'Store closing early today.' });

  // Day 4
  await placeOrder({ consumer:rohit,  store:store1, invByMed:s1ByMed, daysBack:4,  status:'delivered', deliveryType:'delivery', paymentMethod:'upi',  items:[{name:'Benadryl Cough 100ml',qty:1},{name:'Strepsils Lozenges',qty:1},{name:'Dolo 650mg',qty:2}] });
  await placeOrder({ consumer:priya,  store:store1, invByMed:s1ByMed, daysBack:4,  status:'delivered', deliveryType:'delivery', paymentMethod:'card', items:[{name:'Allegra 120mg',qty:2},{name:'Limcee 500mg',qty:2}] });

  // Day 3
  await placeOrder({ consumer:arjun,  store:store1, invByMed:s1ByMed, daysBack:3,  status:'delivered', deliveryType:'pickup',   paymentMethod:'upi',  items:[{name:'Pan-D Capsule',qty:1},{name:'Gelusil MPS Tablet',qty:2}] });
  await placeOrder({ consumer:ananya, store:store1, invByMed:s1ByMed, daysBack:3,  status:'delivered', deliveryType:'delivery', paymentMethod:'upi',  items:[{name:'Crocin 500mg',qty:2},{name:'Shelcal 500mg',qty:1}] });
  await placeOrder({ consumer:rohit,  store:store1, invByMed:s1ByMed, daysBack:3,  status:'delivered', deliveryType:'delivery', paymentMethod:'cod',  items:[{name:'Electral ORS Sachet',qty:10},{name:'Limcee 500mg',qty:2}] });

  // Day 2
  await placeOrder({ consumer:priya,  store:store1, invByMed:s1ByMed, daysBack:2,  status:'delivered', deliveryType:'delivery', paymentMethod:'card', items:[{name:'Dolo 650mg',qty:3},{name:'Becosules Capsule',qty:1}] });
  await placeOrder({ consumer:arjun,  store:store1, invByMed:s1ByMed, daysBack:2,  status:'delivered', deliveryType:'pickup',   paymentMethod:'upi',  items:[{name:'Crocin 500mg',qty:3},{name:'Limcee 500mg',qty:3}] });

  // Day 1
  await placeOrder({ consumer:rohit,  store:store1, invByMed:s1ByMed, daysBack:1,  status:'delivered', deliveryType:'delivery', paymentMethod:'upi',  items:[{name:'Pan-D Capsule',qty:2},{name:'Dolo 650mg',qty:2}] });
  await placeOrder({ consumer:ananya, store:store1, invByMed:s1ByMed, daysBack:1,  status:'delivered', deliveryType:'delivery', paymentMethod:'card', items:[{name:'Allegra 120mg',qty:1},{name:'Benadryl Cough 100ml',qty:1}] });
  await placeOrder({ consumer:priya,  store:store1, invByMed:s1ByMed, daysBack:1,  status:'dispatched', deliveryType:'delivery', paymentMethod:'upi', items:[{name:'Crocin 500mg',qty:2},{name:'Electral ORS Sachet',qty:4}] });

  // Today (active orders visible in dashboard)
  await placeOrder({ consumer:arjun,  store:store1, invByMed:s1ByMed, daysBack:0,  status:'accepted',  deliveryType:'delivery', paymentMethod:'upi',  items:[{name:'Pan-D Capsule',qty:1},{name:'Limcee 500mg',qty:2}] });
  await placeOrder({ consumer:rohit,  store:store1, invByMed:s1ByMed, daysBack:0,  status:'confirmed', deliveryType:'pickup',   paymentMethod:'card', items:[{name:'Dolo 650mg',qty:2}] });

  // ── STORE 2 orders (Pune, last 14 days) ──────────────────────────────────
  await placeOrder({ consumer:sneha,  store:store2, invByMed:s2ByMed, daysBack:13, status:'delivered', deliveryType:'delivery', paymentMethod:'upi',  items:[{name:'Crocin 500mg',qty:2},{name:'Electral ORS Sachet',qty:5}] });
  await placeOrder({ consumer:arjun,  store:store2, invByMed:s2ByMed, daysBack:13, status:'delivered', deliveryType:'pickup',   paymentMethod:'card', items:[{name:'Pan-D Capsule',qty:1},{name:'Dolo 650mg',qty:2}] });

  await placeOrder({ consumer:sneha,  store:store2, invByMed:s2ByMed, daysBack:12, status:'delivered', deliveryType:'delivery', paymentMethod:'cod',  items:[{name:'Glucon-D 200g',qty:2},{name:'Limcee 500mg',qty:3}] });
  await placeOrder({ consumer:priya,  store:store2, invByMed:s2ByMed, daysBack:12, status:'rejected',  deliveryType:'delivery', paymentMethod:'upi',  items:[{name:'Pan-D Capsule',qty:2}], rejectionReason:'Batch requested is out of stock.' });

  await placeOrder({ consumer:sneha,  store:store2, invByMed:s2ByMed, daysBack:11, status:'delivered', deliveryType:'pickup',   paymentMethod:'upi',  items:[{name:'Strepsils Lozenges',qty:2},{name:'Benadryl Cough 100ml',qty:1}] });
  await placeOrder({ consumer:arjun,  store:store2, invByMed:s2ByMed, daysBack:11, status:'delivered', deliveryType:'delivery', paymentMethod:'card', items:[{name:'Crocin 500mg',qty:3},{name:'Shelcal 500mg',qty:1}] });

  await placeOrder({ consumer:sneha,  store:store2, invByMed:s2ByMed, daysBack:10, status:'delivered', deliveryType:'delivery', paymentMethod:'upi',  items:[{name:'Allegra 120mg',qty:1},{name:'Limcee 500mg',qty:2}] });
  await placeOrder({ consumer:priya,  store:store2, invByMed:s2ByMed, daysBack:10, status:'delivered', deliveryType:'pickup',   paymentMethod:'card', items:[{name:'Electral ORS Sachet',qty:6},{name:'Dolo 650mg',qty:1}] });

  await placeOrder({ consumer:sneha,  store:store2, invByMed:s2ByMed, daysBack:9,  status:'delivered', deliveryType:'delivery', paymentMethod:'upi',  items:[{name:'Pan-D Capsule',qty:2},{name:'Digene Syrup 200ml',qty:1}] });
  await placeOrder({ consumer:arjun,  store:store2, invByMed:s2ByMed, daysBack:9,  status:'cancelled', deliveryType:'delivery', paymentMethod:'upi',  items:[{name:'Glucon-D 200g',qty:1}] });

  await placeOrder({ consumer:sneha,  store:store2, invByMed:s2ByMed, daysBack:8,  status:'delivered', deliveryType:'pickup',   paymentMethod:'card', items:[{name:'Crocin 500mg',qty:4},{name:'Limcee 500mg',qty:2}] });
  await placeOrder({ consumer:priya,  store:store2, invByMed:s2ByMed, daysBack:8,  status:'delivered', deliveryType:'delivery', paymentMethod:'upi',  items:[{name:'Strepsils Lozenges',qty:2},{name:'Otrivin Nasal 10ml',qty:1}] });

  await placeOrder({ consumer:sneha,  store:store2, invByMed:s2ByMed, daysBack:7,  status:'delivered', deliveryType:'delivery', paymentMethod:'cod',  items:[{name:'Electral ORS Sachet',qty:8},{name:'Dolo 650mg',qty:2}] });
  await placeOrder({ consumer:arjun,  store:store2, invByMed:s2ByMed, daysBack:7,  status:'delivered', deliveryType:'pickup',   paymentMethod:'upi',  items:[{name:'Allegra 120mg',qty:1},{name:'Otrivin Nasal 10ml',qty:1}] });

  await placeOrder({ consumer:priya,  store:store2, invByMed:s2ByMed, daysBack:6,  status:'delivered', deliveryType:'delivery', paymentMethod:'upi',  items:[{name:'Pan-D Capsule',qty:2},{name:'Limcee 500mg',qty:3}] });
  await placeOrder({ consumer:sneha,  store:store2, invByMed:s2ByMed, daysBack:6,  status:'delivered', deliveryType:'delivery', paymentMethod:'card', items:[{name:'Crocin 500mg',qty:3},{name:'Shelcal 500mg',qty:1}] });

  await placeOrder({ consumer:sneha,  store:store2, invByMed:s2ByMed, daysBack:5,  status:'delivered', deliveryType:'delivery', paymentMethod:'upi',  items:[{name:'Glucon-D 200g',qty:1},{name:'Electral ORS Sachet',qty:5}] });
  await placeOrder({ consumer:arjun,  store:store2, invByMed:s2ByMed, daysBack:5,  status:'rejected',  deliveryType:'pickup',   paymentMethod:'card', items:[{name:'Digene Syrup 200ml',qty:2}], rejectionReason:'Item unavailable today.' });

  await placeOrder({ consumer:priya,  store:store2, invByMed:s2ByMed, daysBack:4,  status:'delivered', deliveryType:'delivery', paymentMethod:'upi',  items:[{name:'Dolo 650mg',qty:2},{name:'Benadryl Cough 100ml',qty:1}] });
  await placeOrder({ consumer:sneha,  store:store2, invByMed:s2ByMed, daysBack:4,  status:'delivered', deliveryType:'pickup',   paymentMethod:'upi',  items:[{name:'Strepsils Lozenges',qty:3},{name:'Otrivin Nasal 10ml',qty:1}] });

  await placeOrder({ consumer:sneha,  store:store2, invByMed:s2ByMed, daysBack:3,  status:'delivered', deliveryType:'delivery', paymentMethod:'card', items:[{name:'Crocin 500mg',qty:2},{name:'Limcee 500mg',qty:2},{name:'Pan-D Capsule',qty:1}] });
  await placeOrder({ consumer:arjun,  store:store2, invByMed:s2ByMed, daysBack:3,  status:'delivered', deliveryType:'delivery', paymentMethod:'upi',  items:[{name:'Electral ORS Sachet',qty:4},{name:'Glucon-D 200g',qty:1}] });

  await placeOrder({ consumer:priya,  store:store2, invByMed:s2ByMed, daysBack:2,  status:'delivered', deliveryType:'pickup',   paymentMethod:'upi',  items:[{name:'Allegra 120mg',qty:2},{name:'Calamine Lotion 100ml',qty:1}] });
  await placeOrder({ consumer:sneha,  store:store2, invByMed:s2ByMed, daysBack:2,  status:'delivered', deliveryType:'delivery', paymentMethod:'card', items:[{name:'Dolo 650mg',qty:3},{name:'Shelcal 500mg',qty:1}] });

  await placeOrder({ consumer:sneha,  store:store2, invByMed:s2ByMed, daysBack:1,  status:'delivered', deliveryType:'delivery', paymentMethod:'upi',  items:[{name:'Pan-D Capsule',qty:2},{name:'Limcee 500mg',qty:2}] });
  await placeOrder({ consumer:arjun,  store:store2, invByMed:s2ByMed, daysBack:1,  status:'packing',   deliveryType:'delivery', paymentMethod:'card', items:[{name:'Crocin 500mg',qty:3},{name:'Benadryl Cough 100ml',qty:1}] });

  await placeOrder({ consumer:priya,  store:store2, invByMed:s2ByMed, daysBack:0,  status:'confirmed', deliveryType:'delivery', paymentMethod:'upi',  items:[{name:'Electral ORS Sachet',qty:6},{name:'Dolo 650mg',qty:2}] });
  await placeOrder({ consumer:sneha,  store:store2, invByMed:s2ByMed, daysBack:0,  status:'accepted',  deliveryType:'pickup',   paymentMethod:'card', items:[{name:'Allegra 120mg',qty:1},{name:'Strepsils Lozenges',qty:2}] });

  console.log(`✅  ${orderSeq} orders created`);

  // ── Blacklisted batch ─────────────────────────────────────────────────────
  await prisma.blacklistedBatch.create({
    data: {
      medicine_id: M['Crocin 500mg'].id, batch_number: 'CR24Z999',
      reason: 'CDSCO Recall Notice RC/2026/0048 — sub-potent batch detected',
      blacklisted_by: milind.id, blacklisted_at: daysAgo(10),
    },
  });

  // ── Notifications ─────────────────────────────────────────────────────────
  await prisma.notification.createMany({
    data:[
      // Rahul (Store 1) — pharmacy notifications
      { recipient_id:rahul.id,  type:'store.approved',  title:'Pharmacy approved 🎉',           body:'MedPlus Pharmacy — Saket is now live on MedMarket.', channel:'in_app', sent_at:daysAgo(58), read_at:daysAgo(57) },
      { recipient_id:rahul.id,  type:'order.new',       title:'New order received',             body:'A new order has been placed. Accept within 30 minutes.', channel:'in_app', sent_at:daysAgo(0) },
      { recipient_id:rahul.id,  type:'expiry.alert',    title:'⚠️ Expiry Alert — 24 days',      body:'Strepsils Lozenges (Batch ST25P01) expires in 24 days. Take action now.', channel:'in_app', sent_at:daysAgo(0) },
      // Fatima (Store 2)
      { recipient_id:fatima.id, type:'store.approved',  title:'Pharmacy approved 🎉',           body:'HealthCure Medical Store is now live on MedMarket.', channel:'in_app', sent_at:daysAgo(72), read_at:daysAgo(71) },
      { recipient_id:fatima.id, type:'order.new',       title:'New order received',             body:'2 new orders waiting. Accept within 30 minutes.', channel:'in_app', sent_at:daysAgo(0) },
      { recipient_id:fatima.id, type:'expiry.alert',    title:'⚠️ Expiry Alert — 58 days',      body:'Combiflam (Batch CB25P02) expires in 58 days.', channel:'in_app', sent_at:daysAgo(0) },
      // Consumer notifications
      { recipient_id:priya.id,  type:'order.delivered', title:'Order delivered ✓',              body:'Your order from MedPlus Pharmacy has been delivered. Thank you!', channel:'in_app', sent_at:daysAgo(2), read_at:daysAgo(2) },
      { recipient_id:priya.id,  type:'order.accepted',  title:'Order accepted',                 body:'HealthCure Medical Store has accepted your order.', channel:'in_app', sent_at:daysAgo(0) },
      { recipient_id:sneha.id,  type:'order.delivered', title:'Order delivered ✓',              body:'Your Pune order has been delivered. Feel better soon!', channel:'in_app', sent_at:daysAgo(1), read_at:daysAgo(1) },
      { recipient_id:sneha.id,  type:'order.accepted',  title:'Order accepted',                 body:'HealthCure Medical Store accepted your order.', channel:'in_app', sent_at:daysAgo(0) },
      { recipient_id:arjun.id,  type:'order.rejected',  title:'Order rejected',                 body:'Your order was rejected: Out of stock on requested batch. Please try another store.', channel:'in_app', sent_at:daysAgo(9), read_at:daysAgo(9) },
      // Pending/rejected pharmacy owners
      { recipient_id:vikram.id, type:'store.pending',   title:'Application received',           body:'Your pharmacy application is under review. We will notify you within 2–3 business days.', channel:'in_app', sent_at:daysAgo(5) },
      { recipient_id:deepa.id,  type:'store.rejected',  title:'Application not approved',       body:'Janta Medical was not approved. Reason: Drug License was expired. Please resubmit.', channel:'in_app', sent_at:daysAgo(8) },
    ],
  });

  // ── Complaints ────────────────────────────────────────────────────────────
  await prisma.complaint.createMany({
    data:[
      {
        consumer_id: priya.id,
        order_id:    null,
        store_id:    store1.id,
        category:    'order',
        type:        'overcharged',
        subject:     'Overcharged / Above MRP',
        body:        'The app showed ₹78 for Pan-D but the store charged ₹85. Please look into this pricing discrepancy.',
        status:      'resolved',
        resolution:  'Investigated — pharmacy had set incorrect price. Price corrected to ₹78. Consumer notified and refund processed.',
        created_at:  daysAgo(20),
      },
      {
        consumer_id: sneha.id,
        order_id:    null,
        store_id:    store2.id,
        category:    'pharmacy',
        type:        'frequent_cancels',
        subject:     'Frequent Order Cancellations',
        body:        'HealthCure has cancelled two of my last three orders without a proper reason. This is very inconvenient.',
        status:      'open',
        created_at:  daysAgo(1),
      },
    ],
  });

  // ── Audit logs ────────────────────────────────────────────────────────────
  await prisma.auditLog.createMany({
    data:[
      { actor_id:milind.id, actor_role:'admin', action:'pharmacy.approved', entity_type:'pharmacy_store', entity_id:store1.id, metadata:{ store:'MedPlus Pharmacy — Saket' }, ip_address:'122.160.10.1', created_at:daysAgo(58) },
      { actor_id:milind.id, actor_role:'admin', action:'pharmacy.approved', entity_type:'pharmacy_store', entity_id:store2.id, metadata:{ store:'HealthCure Medical Store' }, ip_address:'122.160.10.1', created_at:daysAgo(72) },
      { actor_id:milind.id, actor_role:'admin', action:'pharmacy.rejected', entity_type:'pharmacy_store', entity_id:store2.id, metadata:{ reason:'Drug License expired' },    ip_address:'122.160.10.1', created_at:daysAgo(8) },
      { actor_id:milind.id, actor_role:'admin', action:'batch.blacklisted', entity_type:'blacklisted_batch', entity_id:M['Crocin 500mg'].id, metadata:{ batch:'CR24Z999', reason:'CDSCO Recall RC/2026/0048' }, ip_address:'122.160.10.1', created_at:daysAgo(10) },
    ],
  });

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(58));
  console.log('🎉  Seed complete!\n');
  console.log('  👤 Admin');
  console.log('     milind@medmarket.in          Admin@1234\n');
  console.log('  🏪 Pharmacy Owners              Pharma@1234');
  console.log('     rahul@medplus.in             → Approved  (Delhi)');
  console.log('     fatima@healthcure.in         → Approved  (Pune)');
  console.log('     vikram@apollo.in             → Pending');
  console.log('     deepa@janta.in               → Rejected\n');
  console.log('  🛒 Consumers                    Consumer@1234');
  console.log('     priya@gmail.com   arjun@gmail.com');
  console.log('     sneha@gmail.com   rohit@gmail.com   ananya@gmail.com\n');
  console.log(`  💊 20 medicines | ${orderSeq} orders across 14 days`);
  console.log('  📈 Analytics: 14-day revenue trend with daily variation');
  console.log('  ⏰ Hourly heatmap: peaks at 9-11am and 7-9pm');
  console.log('  🔄 Repeat customers: all 5 consumers ordered 3-8x');
  console.log('  ⚠️  Expiry alerts: 2 near-expiry batches (24d & 58d)');
  console.log('  📦 Dead stock: Isabgol (Store 1) — no orders in 14 days');
  console.log('─'.repeat(58) + '\n');
}

main()
  .catch(e => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
