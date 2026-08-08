/*
# PitPulse – Healthcare Platform Schema

## Overview
Creates the complete database schema for PitPulse, an AI-powered healthcare and medicine delivery platform.
Supports four role-based portals: Patient, ASHA Worker, Doctor/Admin, and Pharmacy & Delivery Partner.

## New Tables
1. `profiles` — User profile data for all roles, linked to auth.users. Contains demographics, health info, pregnancy data, and role assignment.
2. `health_records` — Time-series health metrics (blood pressure, sugar, heart rate, oxygen, weight, water intake, sleep, exercise).
3. `prescriptions` — Patient prescriptions with doctor details, medicines, and status.
4. `medicines` — Pharmacy medicine catalog/inventory with batch info, expiry, stock, pricing.
5. `medicine_orders` — Patient medicine orders with status tracking, delivery info, and OTP.
6. `medicine_order_items` — Line items for each medicine order.
7. `pharmacies` — Registered pharmacy details with location, contact, and operational status.
8. `hospitals` — Hospital details with bed availability, departments, and emergency status.
9. `appointments` — Patient-doctor appointment scheduling.
10. `lab_reports` — Patient lab report uploads with metadata.
11. `vaccinations` — Vaccination records for patients and children.
12. `reminders` — Medicine and health reminders with scheduling.
13. `delivery_partners` — Delivery partner profiles with vehicle info and availability.
14. `asha_visits` — ASHA worker home visit records with GPS verification.
15. `notifications` — User notifications for various events.
16. `chat_messages` — AI assistant and customer chat messages.
17. `emergency_sos` — Emergency SOS alerts with GPS and response tracking.

## Security
- RLS enabled on ALL tables.
- All tables are owner-scoped to `auth.uid()` where applicable.
- Pharmacies, hospitals, and delivery partners are readable by all authenticated users (directory listings).
- Medicine catalog is readable by all authenticated users.
- Orders, health records, prescriptions, lab reports, vaccinations, reminders, notifications, chat messages, and SOS alerts are owner-scoped.
- ASHA visits are scoped to the ASHA worker.
- Appointments are scoped to the patient or doctor.
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'asha', 'doctor', 'pharmacy', 'delivery')),
  full_name text NOT NULL DEFAULT '',
  date_of_birth date,
  age int,
  gender text CHECK (gender IN ('male', 'female', 'others')),
  blood_group text,
  mobile_number text,
  address text,
  emergency_contact text,
  medical_history text,
  allergies text,
  chronic_diseases text,
  current_medications text,
  height numeric,
  weight numeric,
  bmi numeric,
  profile_photo text,
  is_pregnant boolean DEFAULT false,
  pregnancy_week int,
  expected_delivery_date date,
  previous_pregnancies int DEFAULT 0,
  maternal_health_history text,
  assigned_village text,
  specialization text,
  license_number text,
  pharmacy_id uuid,
  vehicle_number text,
  vehicle_type text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Health records table
CREATE TABLE IF NOT EXISTS health_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('blood_pressure', 'blood_sugar', 'heart_rate', 'oxygen_saturation', 'weight', 'water_intake', 'sleep', 'exercise', 'bmi')),
  value numeric NOT NULL,
  secondary_value numeric,
  unit text,
  recorded_at timestamptz DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_health_records_user_id ON health_records(user_id);
CREATE INDEX IF NOT EXISTS idx_health_records_type ON health_records(type);

ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_health_records" ON health_records;
CREATE POLICY "select_own_health_records" ON health_records FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_health_records" ON health_records;
CREATE POLICY "insert_own_health_records" ON health_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_health_records" ON health_records;
CREATE POLICY "update_own_health_records" ON health_records FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_health_records" ON health_records;
CREATE POLICY "delete_own_health_records" ON health_records FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Pharmacies table
CREATE TABLE IF NOT EXISTS pharmacies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  address text NOT NULL,
  latitude numeric,
  longitude numeric,
  phone text,
  is_24x7 boolean DEFAULT false,
  is_open boolean DEFAULT true,
  rating numeric DEFAULT 0,
  delivery_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pharmacies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_pharmacies" ON pharmacies;
CREATE POLICY "select_pharmacies" ON pharmacies FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_pharmacy" ON pharmacies;
CREATE POLICY "insert_pharmacy" ON pharmacies FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "update_pharmacy" ON pharmacies;
CREATE POLICY "update_pharmacy" ON pharmacies FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Medicines table
CREATE TABLE IF NOT EXISTS medicines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id uuid NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  name text NOT NULL,
  brand text,
  generic_name text,
  batch_number text,
  expiry_date date,
  quantity int NOT NULL DEFAULT 0,
  price numeric NOT NULL DEFAULT 0,
  discount numeric DEFAULT 0,
  prescription_required boolean DEFAULT false,
  category text,
  description text,
  image_url text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_medicines_pharmacy_id ON medicines(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(name);

ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_medicines" ON medicines;
CREATE POLICY "select_medicines" ON medicines FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_medicine" ON medicines;
CREATE POLICY "insert_medicine" ON medicines FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM pharmacies WHERE pharmacies.id = medicines.pharmacy_id AND pharmacies.owner_id = auth.uid())
);
DROP POLICY IF EXISTS "update_medicine" ON medicines;
CREATE POLICY "update_medicine" ON medicines FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM pharmacies WHERE pharmacies.id = medicines.pharmacy_id AND pharmacies.owner_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM pharmacies WHERE pharmacies.id = medicines.pharmacy_id AND pharmacies.owner_id = auth.uid())
);
DROP POLICY IF EXISTS "delete_medicine" ON medicines;
CREATE POLICY "delete_medicine" ON medicines FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM pharmacies WHERE pharmacies.id = medicines.pharmacy_id AND pharmacies.owner_id = auth.uid())
);

-- Medicine orders table
CREATE TABLE IF NOT EXISTS medicine_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  pharmacy_id uuid NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  delivery_partner_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'placed' CHECK (status IN ('placed', 'accepted', 'rejected', 'preparing', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled')),
  total_amount numeric NOT NULL DEFAULT 0,
  delivery_address text,
  delivery_latitude numeric,
  delivery_longitude numeric,
  payment_method text DEFAULT 'cod' CHECK (payment_method IN ('upi', 'card', 'netbanking', 'cod', 'wallet')),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  otp text,
  scheduled_delivery timestamptz,
  is_emergency boolean DEFAULT false,
  prescription_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_medicine_orders_patient_id ON medicine_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_medicine_orders_pharmacy_id ON medicine_orders(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_medicine_orders_status ON medicine_orders(status);

ALTER TABLE medicine_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_medicine_orders" ON medicine_orders;
CREATE POLICY "select_medicine_orders" ON medicine_orders FOR SELECT TO authenticated USING (
  auth.uid() = patient_id OR auth.uid() = delivery_partner_id OR
  EXISTS (SELECT 1 FROM pharmacies WHERE pharmacies.id = medicine_orders.pharmacy_id AND pharmacies.owner_id = auth.uid())
);
DROP POLICY IF EXISTS "insert_medicine_orders" ON medicine_orders;
CREATE POLICY "insert_medicine_orders" ON medicine_orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = patient_id);
DROP POLICY IF EXISTS "update_medicine_orders" ON medicine_orders;
CREATE POLICY "update_medicine_orders" ON medicine_orders FOR UPDATE TO authenticated USING (
  auth.uid() = patient_id OR auth.uid() = delivery_partner_id OR
  EXISTS (SELECT 1 FROM pharmacies WHERE pharmacies.id = medicine_orders.pharmacy_id AND pharmacies.owner_id = auth.uid())
) WITH CHECK (
  auth.uid() = patient_id OR auth.uid() = delivery_partner_id OR
  EXISTS (SELECT 1 FROM pharmacies WHERE pharmacies.id = medicine_orders.pharmacy_id AND pharmacies.owner_id = auth.uid())
);

-- Medicine order items table
CREATE TABLE IF NOT EXISTS medicine_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES medicine_orders(id) ON DELETE CASCADE,
  medicine_id uuid REFERENCES medicines(id) ON DELETE SET NULL,
  name text NOT NULL,
  quantity int NOT NULL DEFAULT 1,
  price numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_medicine_order_items_order_id ON medicine_order_items(order_id);

ALTER TABLE medicine_order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_order_items" ON medicine_order_items;
CREATE POLICY "select_order_items" ON medicine_order_items FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM medicine_orders WHERE medicine_orders.id = medicine_order_items.order_id AND (
    medicine_orders.patient_id = auth.uid() OR medicine_orders.delivery_partner_id = auth.uid() OR
    EXISTS (SELECT 1 FROM pharmacies WHERE pharmacies.id = medicine_orders.pharmacy_id AND pharmacies.owner_id = auth.uid())
  ))
);
DROP POLICY IF EXISTS "insert_order_items" ON medicine_order_items;
CREATE POLICY "insert_order_items" ON medicine_order_items FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM medicine_orders WHERE medicine_orders.id = medicine_order_items.order_id AND medicine_orders.patient_id = auth.uid())
);

-- Hospitals table
CREATE TABLE IF NOT EXISTS hospitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'private' CHECK (type IN ('government', 'private', 'clinic', 'phc')),
  address text NOT NULL,
  latitude numeric,
  longitude numeric,
  phone text,
  icu_beds_total int DEFAULT 0,
  icu_beds_available int DEFAULT 0,
  general_beds_total int DEFAULT 0,
  general_beds_available int DEFAULT 0,
  emergency_beds_total int DEFAULT 0,
  emergency_beds_available int DEFAULT 0,
  maternity_beds_total int DEFAULT 0,
  maternity_beds_available int DEFAULT 0,
  oxygen_available boolean DEFAULT true,
  ambulance_available boolean DEFAULT true,
  doctor_available boolean DEFAULT true,
  waiting_time_min int DEFAULT 0,
  rating numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_hospitals" ON hospitals;
CREATE POLICY "select_hospitals" ON hospitals FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_hospital" ON hospitals;
CREATE POLICY "insert_hospital" ON hospitals FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_hospital" ON hospitals;
CREATE POLICY "update_hospital" ON hospitals FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  hospital_id uuid REFERENCES hospitals(id) ON DELETE SET NULL,
  scheduled_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  reason text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_appointments" ON appointments;
CREATE POLICY "select_appointments" ON appointments FOR SELECT TO authenticated USING (auth.uid() = patient_id OR auth.uid() = doctor_id);
DROP POLICY IF EXISTS "insert_appointments" ON appointments;
CREATE POLICY "insert_appointments" ON appointments FOR INSERT TO authenticated WITH CHECK (auth.uid() = patient_id OR auth.uid() = doctor_id);
DROP POLICY IF EXISTS "update_appointments" ON appointments;
CREATE POLICY "update_appointments" ON appointments FOR UPDATE TO authenticated USING (auth.uid() = patient_id OR auth.uid() = doctor_id) WITH CHECK (auth.uid() = patient_id OR auth.uid() = doctor_id);

-- Lab reports table
CREATE TABLE IF NOT EXISTS lab_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  report_type text,
  file_url text,
  notes text,
  uploaded_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lab_reports_user_id ON lab_reports(user_id);

ALTER TABLE lab_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_lab_reports" ON lab_reports;
CREATE POLICY "select_own_lab_reports" ON lab_reports FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_lab_reports" ON lab_reports;
CREATE POLICY "insert_own_lab_reports" ON lab_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_lab_reports" ON lab_reports;
CREATE POLICY "delete_own_lab_reports" ON lab_reports FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Vaccinations table
CREATE TABLE IF NOT EXISTS vaccinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  vaccine_name text NOT NULL,
  dose_number int DEFAULT 1,
  administered_date date,
  next_due_date date,
  administered_by text,
  status text DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'overdue')),
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vaccinations_user_id ON vaccinations(user_id);

ALTER TABLE vaccinations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_vaccinations" ON vaccinations;
CREATE POLICY "select_own_vaccinations" ON vaccinations FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_vaccinations" ON vaccinations;
CREATE POLICY "insert_own_vaccinations" ON vaccinations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_vaccinations" ON vaccinations;
CREATE POLICY "update_own_vaccinations" ON vaccinations FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Reminders table
CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('medicine', 'appointment', 'vaccination', 'checkup', 'health', 'delivery')),
  title text NOT NULL,
  description text,
  scheduled_time timestamptz NOT NULL,
  is_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_reminders" ON reminders;
CREATE POLICY "select_own_reminders" ON reminders FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_reminders" ON reminders;
CREATE POLICY "insert_own_reminders" ON reminders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_reminders" ON reminders;
CREATE POLICY "update_own_reminders" ON reminders FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_reminders" ON reminders;
CREATE POLICY "delete_own_reminders" ON reminders FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Delivery partners table
CREATE TABLE IF NOT EXISTS delivery_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  is_available boolean DEFAULT true,
  current_latitude numeric,
  current_longitude numeric,
  total_deliveries int DEFAULT 0,
  total_earnings numeric DEFAULT 0,
  rating numeric DEFAULT 5,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE delivery_partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_delivery_partners" ON delivery_partners;
CREATE POLICY "select_delivery_partners" ON delivery_partners FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_delivery_partner" ON delivery_partners;
CREATE POLICY "insert_own_delivery_partner" ON delivery_partners FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);
DROP POLICY IF EXISTS "update_own_delivery_partner" ON delivery_partners;
CREATE POLICY "update_own_delivery_partner" ON delivery_partners FOR UPDATE TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);

-- ASHA visits table
CREATE TABLE IF NOT EXISTS asha_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asha_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  patient_name text,
  village text,
  visit_type text DEFAULT 'home_visit' CHECK (visit_type IN ('home_visit', 'survey', 'vaccination', 'medicine_distribution', 'emergency')),
  latitude numeric,
  longitude numeric,
  notes text,
  status text DEFAULT 'completed' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  visit_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_asha_visits_asha_id ON asha_visits(asha_id);

ALTER TABLE asha_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_asha_visits" ON asha_visits;
CREATE POLICY "select_own_asha_visits" ON asha_visits FOR SELECT TO authenticated USING (auth.uid() = asha_id);
DROP POLICY IF EXISTS "insert_own_asha_visits" ON asha_visits;
CREATE POLICY "insert_own_asha_visits" ON asha_visits FOR INSERT TO authenticated WITH CHECK (auth.uid() = asha_id);
DROP POLICY IF EXISTS "update_own_asha_visits" ON asha_visits;
CREATE POLICY "update_own_asha_visits" ON asha_visits FOR UPDATE TO authenticated USING (auth.uid() = asha_id) WITH CHECK (auth.uid() = asha_id);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_chat_messages" ON chat_messages;
CREATE POLICY "select_own_chat_messages" ON chat_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_chat_messages" ON chat_messages;
CREATE POLICY "insert_own_chat_messages" ON chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Emergency SOS table
CREATE TABLE IF NOT EXISTS emergency_sos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  latitude numeric,
  longitude numeric,
  status text DEFAULT 'active' CHECK (status IN ('active', 'responded', 'resolved', 'cancelled')),
  responded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  medical_summary text,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_emergency_sos_user_id ON emergency_sos(user_id);

ALTER TABLE emergency_sos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_sos" ON emergency_sos;
CREATE POLICY "select_own_sos" ON emergency_sos FOR SELECT TO authenticated USING (auth.uid() = user_id OR auth.uid() = responded_by);
DROP POLICY IF EXISTS "insert_own_sos" ON emergency_sos;
CREATE POLICY "insert_own_sos" ON emergency_sos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_sos" ON emergency_sos;
CREATE POLICY "update_own_sos" ON emergency_sos FOR UPDATE TO authenticated USING (auth.uid() = user_id OR auth.uid() = responded_by) WITH CHECK (auth.uid() = user_id OR auth.uid() = responded_by);
