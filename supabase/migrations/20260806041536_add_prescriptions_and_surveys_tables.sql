/*
# Add prescriptions and asha_surveys tables

1. New Tables
- `prescriptions` — Stores patient prescriptions with doctor name, medicines, date, notes, and status. Owner-scoped to the patient (user_id).
  - id (uuid PK)
  - user_id (uuid, NOT NULL DEFAULT auth.uid(), FK to profiles, ON DELETE CASCADE)
  - doctor_name (text)
  - medicines (text) — free-text or JSON-encoded list of medicines
  - notes (text)
  - prescribed_date (date)
  - status (text, CHECK in 'active', 'completed', 'expired')
  - created_at (timestamptz DEFAULT now())
- `asha_surveys` — Stores ASHA worker health survey records per village/patient. Owner-scoped to the ASHA worker (asha_id).
  - id (uuid PK)
  - asha_id (uuid, NOT NULL DEFAULT auth.uid(), FK to profiles, ON DELETE CASCADE)
  - patient_id (uuid, FK to profiles, ON DELETE SET NULL)
  - patient_name (text)
  - village (text)
  - survey_type (text, CHECK in 'household', 'maternal', 'child_health', 'disease_surveillance', 'nutrition')
  - responses (jsonb) — survey answers as key-value pairs
  - status (text, CHECK in 'pending', 'completed', 'follow_up')
  - survey_date (timestamptz DEFAULT now())
  - created_at (timestamptz DEFAULT now())

2. Security
- RLS enabled on both tables.
- prescriptions: owner-scoped CRUD (auth.uid() = user_id), TO authenticated, 4 policies.
- asha_surveys: owner-scoped CRUD (auth.uid() = asha_id), TO authenticated, 4 policies.
*/

-- Prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_name text,
  medicines text NOT NULL,
  notes text,
  prescribed_date date DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_user_id ON prescriptions(user_id);

ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_prescriptions" ON prescriptions;
CREATE POLICY "select_own_prescriptions" ON prescriptions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_prescriptions" ON prescriptions;
CREATE POLICY "insert_own_prescriptions" ON prescriptions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_prescriptions" ON prescriptions;
CREATE POLICY "update_own_prescriptions" ON prescriptions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_prescriptions" ON prescriptions;
CREATE POLICY "delete_own_prescriptions" ON prescriptions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ASHA surveys table
CREATE TABLE IF NOT EXISTS asha_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asha_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  patient_name text,
  village text,
  survey_type text NOT NULL DEFAULT 'household' CHECK (survey_type IN ('household', 'maternal', 'child_health', 'disease_surveillance', 'nutrition')),
  responses jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'follow_up')),
  survey_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_asha_surveys_asha_id ON asha_surveys(asha_id);
CREATE INDEX IF NOT EXISTS idx_asha_surveys_village ON asha_surveys(village);

ALTER TABLE asha_surveys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_asha_surveys" ON asha_surveys;
CREATE POLICY "select_own_asha_surveys" ON asha_surveys FOR SELECT
  TO authenticated USING (auth.uid() = asha_id);
DROP POLICY IF EXISTS "insert_own_asha_surveys" ON asha_surveys;
CREATE POLICY "insert_own_asha_surveys" ON asha_surveys FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = asha_id);
DROP POLICY IF EXISTS "update_own_asha_surveys" ON asha_surveys;
CREATE POLICY "update_own_asha_surveys" ON asha_surveys FOR UPDATE
  TO authenticated USING (auth.uid() = asha_id) WITH CHECK (auth.uid() = asha_id);
DROP POLICY IF EXISTS "delete_own_asha_surveys" ON asha_surveys;
CREATE POLICY "delete_own_asha_surveys" ON asha_surveys FOR DELETE
  TO authenticated USING (auth.uid() = asha_id);
