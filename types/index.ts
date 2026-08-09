export type UserRole = 'patient' | 'asha' | 'doctor' | 'pharmacy' | 'delivery';
export type Gender = 'male' | 'female' | 'others';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  date_of_birth: string | null;
  age: number | null;
  gender: Gender | null;
  blood_group: string | null;
  mobile_number: string | null;
  address: string | null;
  emergency_contact: string | null;
  medical_history: string | null;
  allergies: string | null;
  chronic_diseases: string | null;
  current_medications: string | null;
  height: number | null;
  weight: number | null;
  bmi: number | null;
  profile_photo: string | null;
  is_pregnant: boolean;
  pregnancy_week: number | null;
  expected_delivery_date: string | null;
  previous_pregnancies: number;
  maternal_health_history: string | null;
  assigned_village: string | null;
  specialization: string | null;
  license_number: string | null;
  pharmacy_id: string | null;
  vehicle_number: string | null;
  vehicle_type: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type HealthRecordType =
  | 'blood_pressure' | 'blood_sugar' | 'heart_rate'
  | 'oxygen_saturation' | 'weight' | 'water_intake'
  | 'sleep' | 'exercise' | 'bmi';

export interface HealthRecord {
  id: string;
  user_id: string;
  type: HealthRecordType;
  value: number;
  secondary_value: number | null;
  unit: string | null;
  recorded_at: string;
  notes: string | null;
  created_at: string;
}

export interface Pharmacy {
  id: string;
  name: string;
  owner_id: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  is_24x7: boolean;
  is_open: boolean;
  rating: number;
  delivery_available: boolean;
  created_at: string;
}

export interface Medicine {
  id: string;
  pharmacy_id: string;
  name: string;
  brand: string | null;
  generic_name: string | null;
  batch_number: string | null;
  expiry_date: string | null;
  quantity: number;
  price: number;
  discount: number;
  prescription_required: boolean;
  category: string | null;
  description: string | null;
  image_url: string | null;
  form?: string | null;
  manufacturer?: string | null;
  strength?: string | null;
  dosage_instructions?: string | null;
  side_effects?: string | null;
  contraindications?: string | null;
  requires_prescription?: boolean;
  in_stock?: boolean;
  created_at: string;
}

export type OrderStatus =
  | 'placed' | 'accepted' | 'rejected' | 'preparing'
  | 'picked_up' | 'out_for_delivery' | 'delivered' | 'cancelled';

export type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'cod' | 'wallet';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface MedicineOrder {
  id: string;
  patient_id: string;
  pharmacy_id: string;
  delivery_partner_id: string | null;
  status: OrderStatus;
  total_amount: number;
  delivery_address: string | null;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  otp: string | null;
  scheduled_delivery: string | null;
  is_emergency: boolean;
  prescription_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface MedicineOrderItem {
  id: string;
  order_id: string;
  medicine_id: string | null;
  name: string;
  quantity: number;
  price: number;
  created_at: string;
}

export type HospitalType = 'government' | 'private' | 'clinic' | 'phc';

export interface Hospital {
  id: string;
  name: string;
  type: HospitalType;
  address: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  icu_beds_total: number;
  icu_beds_available: number;
  general_beds_total: number;
  general_beds_available: number;
  emergency_beds_total: number;
  emergency_beds_available: number;
  maternity_beds_total: number;
  maternity_beds_available: number;
  oxygen_available: boolean;
  ambulance_available: boolean;
  doctor_available: boolean;
  waiting_time_min: number;
  rating: number;
  created_at: string;
}

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string | null;
  hospital_id: string | null;
  scheduled_at: string;
  status: AppointmentStatus;
  reason: string | null;
  notes: string | null;
  created_at: string;
}

export interface LabReport {
  id: string;
  user_id: string;
  title: string;
  report_type: string | null;
  file_url: string | null;
  notes: string | null;
  uploaded_at: string;
}

export type VaccinationStatus = 'completed' | 'pending' | 'overdue';

export interface Vaccination {
  id: string;
  user_id: string;
  vaccine_name: string;
  dose_number: number;
  administered_date: string | null;
  next_due_date: string | null;
  administered_by: string | null;
  status: VaccinationStatus;
  notes: string | null;
  created_at: string;
}

export type ReminderType = 'medicine' | 'appointment' | 'vaccination' | 'checkup' | 'health' | 'delivery';

export interface Reminder {
  id: string;
  user_id: string;
  type: ReminderType;
  title: string;
  description: string | null;
  scheduled_time: string;
  is_completed: boolean;
  created_at: string;
}

export interface DeliveryPartner {
  id: string;
  profile_id: string;
  is_available: boolean;
  current_latitude: number | null;
  current_longitude: number | null;
  total_deliveries: number;
  total_earnings: number;
  rating: number;
  created_at: string;
}

export type VisitType = 'home_visit' | 'survey' | 'vaccination' | 'medicine_distribution' | 'emergency';
export type VisitStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

export interface AshaVisit {
  id: string;
  asha_id: string;
  patient_id: string | null;
  patient_name: string | null;
  village: string | null;
  visit_type: VisitType;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  status: VisitStatus;
  visit_date: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export type SOSStatus = 'active' | 'responded' | 'resolved' | 'cancelled';

export interface EmergencySOS {
  id: string;
  user_id: string;
  latitude: number | null;
  longitude: number | null;
  status: SOSStatus;
  responded_by: string | null;
  medical_summary: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface CartItem {
  medicine_id: string;
  name: string;
  price: number;
  quantity: number;
  prescription_required: boolean;
  pharmacy_id: string;
  image_url?: string | null;
}
