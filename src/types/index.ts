export type Role = "PATIENT" | "GUARDIAN" | "DOCTOR" | "ADMIN"
export type Gender = "MALE" | "FEMALE" | "OTHER"
export type MedicineIntake = "BEFORE_MEAL" | "AFTER_MEAL" | "WITH_MEAL" | "EMPTY_STOMACH" | "ANYTIME"
export type MedicineStatus = "ACTIVE" | "PAUSED" | "COMPLETED" | "DISCONTINUED"
export type AppointmentStatus = "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "RESCHEDULED"
export type LogStatus = "TAKEN" | "SKIPPED" | "DELAYED" | "MISSED"

export interface UserProfile {
  id: string
  name: string | null
  email: string | null
  image: string | null
  role: Role
  phone: string | null
  age: number | null
  gender: Gender | null
  bloodGroup: string | null
  address: string | null
  city: string | null
  state: string | null
  language: string
  createdAt: string
}

export interface Medicine {
  id: string
  userId: string
  name: string
  dosage: string
  frequency: string
  intakeTime: MedicineIntake
  morning: boolean
  noon: boolean
  evening: boolean
  night: boolean
  startDate: string
  endDate: string | null
  duration: number | null
  notes: string | null
  status: MedicineStatus
  reminderEnabled: boolean
  prescriptionId: string | null
  createdAt: string
}

export interface MedicineLog {
  id: string
  medicineId: string
  userId: string
  status: LogStatus
  takenAt: string
  scheduledTime: string | null
  delayMinutes: number | null
  note: string | null
  medicine?: Medicine
}

export interface Prescription {
  id: string
  userId: string
  doctorName: string | null
  hospitalName: string | null
  diagnosis: string | null
  notes: string | null
  advice: string | null
  followUpDate: string | null
  imageUrl: string | null
  pdfUrl: string | null
  extractedText: string | null
  createdAt: string
  medicines?: Medicine[]
}

export interface ChatMessage {
  id: string
  userId: string
  role: "user" | "assistant" | "system"
  content: string
  metadata?: Record<string, unknown>
  createdAt: string
}

export interface HealthRecord {
  id: string
  userId: string
  type: string
  title: string
  description: string | null
  value: string | null
  unit: string | null
  date: string
  doctorName: string | null
  hospital: string | null
  imageUrl: string | null
  tags: string[]
  createdAt: string
}

export interface Appointment {
  id: string
  userId: string
  doctorName: string
  hospitalName: string | null
  specialty: string | null
  date: string
  duration: number
  status: AppointmentStatus
  notes: string | null
  location: string | null
  meetingLink: string | null
  createdAt: string
}

export interface HealthMetric {
  id: string
  userId: string
  type: string
  value: number
  unit: string
  date: string
  notes: string | null
  source: string
}

export interface Hospital {
  id: string
  name: string
  type: string
  address: string
  city: string
  state: string
  phone: string | null
  email: string | null
  website: string | null
  latitude: number
  longitude: number
  rating: number | null
  emergency: boolean
  ambulance: boolean
  bloodBank: boolean
  diagnostic: boolean
  specialties: string[]
  openingHours: string | null
  imageUrl: string | null
  distance?: number
}

export interface EmergencyContact {
  id: string
  name: string
  phone: string
  type: string
  priority: number
}

export interface SOSAlert {
  id: string
  userId: string
  latitude: number | null
  longitude: number | null
  message: string | null
  status: string
  createdAt: string
  resolvedAt: string | null
}

export interface AdherenceData {
  total: number
  taken: number
  skipped: number
  delayed: number
  missed: number
  percentage: number
  streak: number
  logs: MedicineLog[]
}

export interface DashboardData {
  user: UserProfile
  activeMedicines: number
  todayLogs: MedicineLog[]
  adherence: number
  upcomingAppointments: Appointment[]
  recentHealthMetrics: HealthMetric[]
  pendingPrescriptions: number
}

export interface AIAssistantMessage {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export interface LanguageOption {
  code: string
  name: string
  nativeName: string
}
