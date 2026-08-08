-- ============================================================
-- PIT PULSE: SUPABASE DATABASE SEED SCRIPT FOR 40 MEDICINES
-- Instructions: Copy and paste this script into your Supabase
-- SQL Editor (https://supabase.com/dashboard/project/jbaucxebzxgsirpycirp/sql)
-- ============================================================

-- 1. Disable Row-Level Security (RLS) on medicines and pharmacies tables for public access
ALTER TABLE IF EXISTS public.medicines DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pharmacies DISABLE ROW LEVEL SECURITY;

-- 2. Seed Default Pharmacy Outlet
INSERT INTO public.pharmacies (id, name, address, latitude, longitude, phone, is_24x7, is_open, rating, delivery_available)
VALUES ('pharma-1', 'Apollo Lifecare Pharmacy (24x7)', 'Shop 12, Main Market Road, Rampur', 28.6160, 77.2110, '+91 98765 55555', true, true, 4.9, true)
ON CONFLICT (id) DO NOTHING;

-- 3. Seed Master Catalog of 40 Real-World Medicines
INSERT INTO public.medicines (id, pharmacy_id, name, brand, generic_name, batch_number, expiry_date, quantity, price, discount, prescription_required, category, description, form, strength, manufacturer)
VALUES
('med-1', 'pharma-1', 'Paracetamol', 'Dolo 650 / Crocin', 'Paracetamol (Acetaminophen)', 'PCM-2026-01', '2027-12-31', 150, 25, 0, false, 'Fever / Pain', 'Relieves fever, mild to moderate headaches, muscle aches, and body pain.', 'Tablet', '500 mg', 'Micro Labs Ltd'),
('med-2', 'pharma-1', 'Ibuprofen', 'Brufen 400', 'Ibuprofen', 'IBU-2026-02', '2027-10-31', 120, 35, 5, false, 'Pain / Inflammation', 'Non-steroidal anti-inflammatory drug (NSAID) for joint pain, swelling, and toothaches.', 'Tablet', '400 mg', 'Abbott India'),
('med-3', 'pharma-1', 'Cetirizine', 'Cetzine / Okacet', 'Cetirizine Hydrochloride', 'CET-2026-03', '2028-03-31', 200, 20, 0, false, 'Allergy', 'Antihistamine for sneezing, runny nose, watery eyes, and allergic skin rashes.', 'Tablet', '10 mg', 'Cipla'),
('med-4', 'pharma-1', 'Levocetirizine', 'LCC / Levocet', 'Levocetirizine Dihydrochloride', 'LVC-2026-04', '2027-08-31', 180, 45, 10, false, 'Allergy', 'Fast-acting second-generation antihistamine for seasonal allergies and rhinitis.', 'Tablet', '5 mg', 'Dr. Reddys Laboratories'),
('med-5', 'pharma-1', 'Loratadine', 'Lorfast / Claritin', 'Loratadine', 'LOR-2026-05', '2027-11-30', 110, 50, 5, false, 'Allergy', 'Non-drowsy antihistamine for hay fever, hives, and pollen allergy.', 'Tablet', '10 mg', 'Cadila Healthcare'),
('med-6', 'pharma-1', 'Azithromycin', 'Azithral 500', 'Azithromycin Dihydrate', 'AZI-2026-06', '2027-06-30', 75, 120, 10, true, 'Antibiotic', 'Macrolide antibiotic for respiratory tract, ear, throat, and skin infections.', 'Tablet', '500 mg', 'Cipla'),
('med-7', 'pharma-1', 'Amoxicillin', 'Mox 500 / Novamox', 'Amoxicillin Trihydrate', 'AMX-2026-07', '2027-05-31', 90, 85, 5, true, 'Antibiotic', 'Penicillin-type antibiotic for chest infections, dental abscesses, and UTIs.', 'Capsule', '500 mg', 'GlaxoSmithKline'),
('med-8', 'pharma-1', 'Cefixime', 'Taxim-O 200 / Zifi', 'Cefixime Trihydrate', 'CFX-2026-08', '2027-09-30', 60, 140, 8, true, 'Antibiotic', 'Cephalosporin antibiotic for typhoid fever, urinary tract, and ENT infections.', 'Tablet', '200 mg', 'Alkem Laboratories'),
('med-9', 'pharma-1', 'Doxycycline', 'Doxypal / Doxy-1', 'Doxycycline Hyclate', 'DOX-2026-09', '2027-04-30', 80, 95, 5, true, 'Antibiotic', 'Tetracycline antibiotic for bacterial infections, severe acne, and vector-borne fevers.', 'Capsule', '100 mg', 'Sun Pharma'),
('med-10', 'pharma-1', 'Metronidazole', 'Flagyl 400 / Metrogyl', 'Metronidazole', 'MTZ-2026-10', '2028-01-31', 100, 30, 0, true, 'Antimicrobial', 'Treats amoebic dysentery, gastrointestinal infections, and dental infections.', 'Tablet', '400 mg', 'J.B. Chemicals'),
('med-11', 'pharma-1', 'Omeprazole', 'Omez 20', 'Omeprazole Gastro-resistant', 'OMP-2026-11', '2027-12-31', 130, 40, 5, false, 'Acidity', 'Proton pump inhibitor (PPI) reducing stomach acid production and heartburn.', 'Capsule', '20 mg', 'Dr. Reddys Laboratories'),
('med-12', 'pharma-1', 'Pantoprazole', 'Pan-40 / Pantocid', 'Pantoprazole Sodium', 'PNT-2026-12', '2028-02-28', 140, 55, 10, false, 'Acidity', 'Relieves severe acid reflux, GERD, and stomach ulcers.', 'Tablet', '40 mg', 'Torrent Pharmaceuticals'),
('med-13', 'pharma-1', 'Famotidine', 'Famocid 20', 'Famotidine', 'FAM-2026-13', '2027-07-31', 90, 25, 0, false, 'Acidity', 'H2 receptor blocker providing rapid relief from indigestion and stomach gas.', 'Tablet', '20 mg', 'Sun Pharma'),
('med-14', 'pharma-1', 'Ondansetron', 'Emeset 4 / Vomikind', 'Ondansetron Hydrochloride', 'OND-2026-14', '2027-10-31', 110, 48, 5, true, 'Nausea / Vomiting', 'Prevents nausea and vomiting caused by stomach bugs, motion sickness, or medical treatments.', 'Tablet', '4 mg', 'Cipla'),
('med-15', 'pharma-1', 'ORS', 'Electral / W.H.O. ORS', 'Oral Rehydration Salts (WHO Formula)', 'ORS-2026-15', '2028-06-30', 300, 18, 0, false, 'Dehydration', 'Essential electrolyte powder to restore lost fluid balance during diarrhea or fever.', 'Sachet', '21.8 g', 'FDC Limited'),
('med-16', 'pharma-1', 'Zinc Sulphate', 'Zocon / Zincvit', 'Zinc Sulphate Monohydrate', 'ZNC-2026-16', '2028-04-30', 250, 30, 0, false, 'Zinc Supplement', 'Supports immune function, wound healing, and pediatric diarrhea recovery.', 'Tablet', '20 mg', 'Wallace Pharmaceuticals'),
('med-17', 'pharma-1', 'Calcium Carbonate', 'Shelcal 500', 'Calcium Carbonate + Vitamin D3', 'CLC-2026-17', '2027-09-30', 160, 75, 8, false, 'Calcium Supplement', 'Strengthens bones, teeth, and supports bone density during pregnancy and aging.', 'Tablet', '500 mg', 'Torrent Pharmaceuticals'),
('med-18', 'pharma-1', 'Vitamin D3', 'Calcirol 60K / Uprise D3', 'Cholecalciferol (Vitamin D3)', 'VD3-2026-18', '2028-05-31', 140, 110, 10, false, 'Vitamin Supplement', 'High-potency weekly Vitamin D3 supplement for immunity and bone health.', 'Sachet', '60,000 IU', 'Cadila Healthcare'),
('med-19', 'pharma-1', 'Ferrous Sulfate', 'Autrin / Fefol', 'Ferrous Sulfate + Folic Acid', 'FES-2026-19', '2027-11-30', 200, 45, 5, false, 'Iron Supplement', 'Treats iron-deficiency anemia, fatigue, and replenishes hemoglobin levels.', 'Tablet', '100 mg', 'Pfizer India'),
('med-20', 'pharma-1', 'Folic Acid', 'Folvite 5mg', 'Folic Acid (Vitamin B9)', 'FOL-2026-20', '2028-03-31', 220, 22, 0, false, 'Folate Supplement', 'Crucial prenatal nutrient for red blood cell synthesis and fetal neural development.', 'Tablet', '5 mg', 'Cipla'),
('med-21', 'pharma-1', 'Multivitamin', 'Becosules Z / Supradyn', 'B-Complex + Vitamin C + Zinc', 'MTV-2026-21', '2027-12-31', 180, 135, 12, false, 'Nutritional Supplement', 'Daily multivitamin capsule boost for stamina, skin health, and energy metabolism.', 'Capsule', 'Daily Formula', 'Pfizer India'),
('med-22', 'pharma-1', 'Albendazole', 'Zentel 400 / Bandy', 'Albendazole', 'ALB-2026-22', '2027-08-31', 85, 18, 0, true, 'Deworming', 'Broad-spectrum antihelminthic for intestinal worm infestations in children and adults.', 'Chewable Tablet', '400 mg', 'GlaxoSmithKline'),
('med-23', 'pharma-1', 'Mebendazole', 'Mebex 100', 'Mebendazole', 'MEB-2026-23', '2027-06-30', 70, 24, 0, true, 'Deworming', 'Deworming tablet for pinworm, roundworm, and hookworm infections.', 'Tablet', '100 mg', 'Janssen Pharmaceuticals'),
('med-24', 'pharma-1', 'Domperidone', 'Vomistop / Domstal', 'Domperidone Maleate', 'DOM-2026-24', '2027-10-31', 125, 38, 5, true, 'Nausea / Gastric Symptoms', 'Prokinetic medicine relieving upper abdominal bloating, nausea, and fullness.', 'Tablet', '10 mg', 'Torrent Pharmaceuticals'),
('med-25', 'pharma-1', 'Lactulose', 'Duphalac Syrup', 'Lactulose Concentrate', 'LAC-2026-25', '2028-02-28', 65, 160, 10, false, 'Constipation', 'Gentle osmotic laxative syrup softening stools without causing cramping.', 'Syrup', '10 g / 15 ml', 'Abbott India'),
('med-26', 'pharma-1', 'Bisacodyl', 'Dulcolax 5', 'Bisacodyl', 'BIS-2026-26', '2027-09-30', 190, 12, 0, false, 'Constipation', 'Overnight stimulant laxative for temporary constipation relief.', 'Tablet', '5 mg', 'Sanofi India'),
('med-27', 'pharma-1', 'Salbutamol', 'Asthalin Inhaler', 'Salbutamol Sulphate', 'SAL-2026-27', '2027-07-31', 50, 145, 5, true, 'Breathing Conditions', 'Fast-acting bronchodilator inhaler providing immediate asthma attack relief.', 'Inhaler', '100 mcg', 'Cipla'),
('med-28', 'pharma-1', 'Montelukast', 'Montek-LC / Romilast', 'Montelukast Sodium + Levocetirizine', 'MON-2026-28', '2027-11-30', 95, 110, 10, true, 'Allergy / Asthma Management', 'Leukotriene receptor antagonist controlling chronic allergic rhinitis and asthma.', 'Tablet', '10 mg', 'Sun Pharma'),
('med-29', 'pharma-1', 'Budesonide', 'Budecort 200 / Pulmicort', 'Budesonide', 'BUD-2026-29', '2027-05-31', 40, 210, 15, true, 'Respiratory Conditions', 'Inhaled corticosteroid reducing airway swelling and preventing asthma flare-ups.', 'Inhaler', '200 mcg', 'Cipla'),
('med-30', 'pharma-1', 'Diclofenac', 'Voveran SR / Diclogesic', 'Diclofenac Sodium', 'DIC-2026-30', '2027-09-30', 140, 42, 5, true, 'Pain / Inflammation', 'Potent pain relief for arthritis, joint injuries, and post-surgical swelling.', 'Tablet', '50 mg', 'Novartis India'),
('med-31', 'pharma-1', 'Naproxen', 'Naprosyn 500', 'Naproxen Sodium', 'NPX-2026-31', '2027-10-31', 85, 65, 5, true, 'Pain / Inflammation', 'Long-acting anti-inflammatory for chronic joint pain, gout, and migraine relief.', 'Tablet', '500 mg', 'RPG Life Sciences'),
('med-32', 'pharma-1', 'Antacid Suspension', 'Gelusil MPS / Digene', 'Aluminum Hydroxide + Magnesium Hydroxide', 'ANT-2026-32', '2028-04-30', 110, 125, 8, false, 'Acidity', 'Mint-flavored liquid antacid neutralizing stomach acid and relieving flatulence.', 'Suspension', '200 ml', 'Abbott India'),
('med-33', 'pharma-1', 'Povidone-Iodine', 'Betadine Ointment 5%', 'Povidone-Iodine', 'PVI-2026-33', '2028-03-31', 150, 60, 0, false, 'Antiseptic', 'Topical antiseptic ointment preventing infection in minor cuts, scrapes, and burns.', 'Ointment', '5% w/w', 'Win-Medicare'),
('med-34', 'pharma-1', 'Chlorhexidine', 'Clohex Mouthwash', 'Chlorhexidine Gluconate', 'CHX-2026-34', '2027-12-31', 120, 95, 5, false, 'Antiseptic', 'Antiseptic oral rinse for gum inflammation, mouth ulcers, and plaque control.', 'Mouthwash', '0.2% w/v', 'ICPA Health Products'),
('med-35', 'pharma-1', 'Calamine Lotion', 'Lacto Calamine', 'Calamine + Zinc Oxide Lotion', 'CLM-2026-35', '2028-06-30', 130, 140, 10, false, 'Skin Irritation', 'Soothes sunburn, insect bites, prickly heat rash, and skin itching.', 'Lotion', '120 ml', 'Piramal Pharma'),
('med-36', 'pharma-1', 'Clotrimazole', 'Candid Cream / Dusting Powder', 'Clotrimazole', 'CLT-2026-36', '2028-01-31', 160, 75, 5, false, 'Fungal Skin Infections', 'Broad-spectrum antifungal cream treating ringworm, athlete foot, and fungal rashes.', 'Cream', '1% w/w', 'Glenmark Pharmaceuticals'),
('med-37', 'pharma-1', 'Mupirocin', 'T-Bact Ointment', 'Mupirocin', 'MUP-2026-37', '2027-08-31', 75, 135, 10, true, 'Bacterial Skin Infections', 'Topical antibiotic ointment for impetigo, folliculitis, and infected skin wounds.', 'Ointment', '2% w/w', 'GlaxoSmithKline'),
('med-38', 'pharma-1', 'Amlodipine', 'Amlopress 5 / Stamlo', 'Amlodipine Besylate', 'AML-2026-38', '2027-11-30', 150, 28, 0, true, 'Blood Pressure', 'Calcium channel blocker managing hypertension (high BP) and preventing angina.', 'Tablet', '5 mg', 'Cipla'),
('med-39', 'pharma-1', 'Metformin', 'Glycomet 500 SR', 'Metformin Hydrochloride SR', 'MET-2026-39', '2028-02-28', 180, 32, 0, true, 'Type 2 Diabetes', 'First-line oral anti-diabetic medication lowering blood glucose levels in Type 2 Diabetes.', 'Tablet', '500 mg', 'USV Private Limited'),
('med-40', 'pharma-1', 'Atorvastatin', 'Atorva 10 / Lipitor', 'Atorvastatin Calcium', 'ATV-2026-40', '2027-10-31', 140, 70, 5, true, 'Cholesterol', 'Statin medication lowering LDL cholesterol and triglycerides to protect heart health.', 'Tablet', '10 mg', 'Sun Pharma')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  generic_name = EXCLUDED.generic_name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  quantity = EXCLUDED.quantity,
  prescription_required = EXCLUDED.prescription_required,
  description = EXCLUDED.description,
  form = EXCLUDED.form,
  strength = EXCLUDED.strength,
  manufacturer = EXCLUDED.manufacturer;
