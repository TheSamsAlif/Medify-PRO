"""Medify - AI Healthcare Assistant Backend."""
import json
import logging
import os
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import List, Optional

import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL_CHAT = os.environ.get("OPENROUTER_MODEL_CHAT", "google/gemini-2.0-flash-exp:free")
OPENROUTER_MODEL_VISION = os.environ.get("OPENROUTER_MODEL_VISION", "google/gemini-2.0-flash-exp:free")
APP_URL = os.environ.get("APP_URL", "https://medify.app")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Medify API")
api = APIRouter(prefix="/api")

DEMO_PATIENT_ID = "demo-patient-001"


# ---------- Models ----------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class Patient(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = "Rahima Begum"
    age: int = 68
    gender: str = "female"
    blood_group: str = "B+"
    conditions: List[str] = Field(default_factory=lambda: ["Type 2 Diabetes", "Hypertension"])
    language: str = "en"  # en | bn
    guardian_name: str = "Karim Hossain"
    guardian_phone: str = "+8801711000000"
    doctor_name: str = "Dr. A. Rahman"
    doctor_phone: str = "+8801712000000"
    location: str = "Dhaka, Bangladesh"


class PatientUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    conditions: Optional[List[str]] = None
    language: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    doctor_name: Optional[str] = None
    doctor_phone: Optional[str] = None
    location: Optional[str] = None


class Medicine(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    dosage: str = ""  # e.g. "500mg"
    frequency: str = "1-0-1"  # morning-noon-evening pattern or free text
    times: List[str] = Field(default_factory=list)  # e.g. ["08:00","20:00"]
    duration_days: int = 30
    instructions: str = ""  # e.g. "After meal"
    start_date: str = Field(default_factory=now_iso)
    prescription_id: Optional[str] = None
    active: bool = True
    created_at: str = Field(default_factory=now_iso)


class MedicineCreate(BaseModel):
    name: str
    dosage: str = ""
    frequency: str = ""
    times: List[str] = []
    duration_days: int = 30
    instructions: str = ""
    prescription_id: Optional[str] = None


class MedicineLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    medicine_id: str
    medicine_name: str
    scheduled_time: str  # "HH:MM"
    date: str  # YYYY-MM-DD
    status: str = "pending"  # pending | taken | skipped | delayed
    logged_at: str = Field(default_factory=now_iso)


class MedicineLogCreate(BaseModel):
    medicine_id: str
    scheduled_time: str
    date: str
    status: str  # taken | skipped | delayed


class Prescription(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    doctor_name: str = ""
    visit_date: str = ""
    next_followup: str = ""
    diagnosis: str = ""
    medicines: List[dict] = Field(default_factory=list)
    notes: str = ""
    image_base64: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)


class PrescriptionCreate(BaseModel):
    doctor_name: str = ""
    visit_date: str = ""
    next_followup: str = ""
    diagnosis: str = ""
    medicines: List[dict] = []
    notes: str = ""
    image_base64: Optional[str] = None


class ScanRequest(BaseModel):
    image_base64: str


class ChatRequest(BaseModel):
    message: str
    language: str = "en"  # en | bn
    session_id: str = "default"


class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str = "default"
    role: str  # user | assistant
    text: str
    language: str = "en"
    created_at: str = Field(default_factory=now_iso)


class Appointment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    doctor_name: str
    specialty: str = ""
    date: str  # ISO date
    time: str = ""  # HH:MM
    location: str = ""
    notes: str = ""
    status: str = "upcoming"  # upcoming | completed | cancelled
    created_at: str = Field(default_factory=now_iso)


class AppointmentCreate(BaseModel):
    doctor_name: str
    specialty: str = ""
    date: str
    time: str = ""
    location: str = ""
    notes: str = ""


class HealthRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    record_type: str = "report"  # prescription | report | test_result | image
    description: str = ""
    image_base64: Optional[str] = None
    record_date: str = Field(default_factory=now_iso)
    created_at: str = Field(default_factory=now_iso)


class HealthRecordCreate(BaseModel):
    title: str
    record_type: str = "report"
    description: str = ""
    image_base64: Optional[str] = None
    record_date: Optional[str] = None


class EmergencyContact(BaseModel):
    id: str
    name: str
    phone: str
    category: str  # national | ambulance | hospital | guardian | doctor
    icon: str = "phone"


class Hospital(BaseModel):
    id: str
    name: str
    address: str
    phone: str
    emergency_phone: str = ""
    distance_km: float = 0.0
    type: str = "hospital"  # hospital | clinic | diagnostic | government


class SOSRequest(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    message: str = "Emergency! Patient needs immediate help."


# ---------- Helpers ----------
def clean(doc: dict) -> dict:
    if doc and "_id" in doc:
        doc.pop("_id", None)
    return doc


async def ensure_seed_data():
    # Patient
    if not await db.patients.find_one({"id": DEMO_PATIENT_ID}):
        p = Patient(id=DEMO_PATIENT_ID).dict()
        await db.patients.insert_one(p)

    # Emergency contacts (Bangladesh)
    if await db.emergency_contacts.count_documents({}) == 0:
        contacts = [
            {"id": "ec1", "name": "National Emergency", "phone": "999", "category": "national", "icon": "shield"},
            {"id": "ec2", "name": "Health Helpline", "phone": "16263", "category": "national", "icon": "heart-pulse"},
            {"id": "ec3", "name": "Ambulance Service", "phone": "10921", "category": "ambulance", "icon": "ambulance"},
            {"id": "ec4", "name": "Fire Service", "phone": "102", "category": "national", "icon": "flame"},
            {"id": "ec5", "name": "Dhaka Medical College Hospital", "phone": "+8809666700400", "category": "hospital", "icon": "hospital"},
            {"id": "ec6", "name": "Square Hospital", "phone": "+88029610556", "category": "hospital", "icon": "hospital"},
        ]
        await db.emergency_contacts.insert_many(contacts)

    # Hospitals
    if await db.hospitals.count_documents({}) == 0:
        hospitals = [
            {"id": "h1", "name": "Dhaka Medical College Hospital", "address": "Bakshibazar, Dhaka", "phone": "+8809666700400", "emergency_phone": "+88029668690", "distance_km": 2.4, "type": "government"},
            {"id": "h2", "name": "Square Hospital", "address": "18/F West Panthapath, Dhaka", "phone": "+88029610556", "emergency_phone": "10616", "distance_km": 3.1, "type": "hospital"},
            {"id": "h3", "name": "United Hospital", "address": "Plot 15, Road 71, Gulshan, Dhaka", "phone": "+88028836444", "emergency_phone": "+88028836000", "distance_km": 5.8, "type": "hospital"},
            {"id": "h4", "name": "Apollo Hospitals Dhaka", "address": "Plot 81, Block E, Bashundhara R/A", "phone": "+88010678", "emergency_phone": "10678", "distance_km": 7.2, "type": "hospital"},
            {"id": "h5", "name": "Popular Diagnostic Centre", "address": "House 16, Road 2, Dhanmondi", "phone": "+88029669301", "emergency_phone": "", "distance_km": 4.0, "type": "diagnostic"},
            {"id": "h6", "name": "Ibn Sina Diagnostic", "address": "House 48, Road 9/A, Dhanmondi", "phone": "+88029126625", "emergency_phone": "", "distance_km": 4.5, "type": "diagnostic"},
            {"id": "h7", "name": "Suhrawardy Hospital", "address": "Sher-E-Bangla Nagar, Dhaka", "phone": "+88029131114", "emergency_phone": "+88029131111", "distance_km": 6.0, "type": "government"},
        ]
        await db.hospitals.insert_many(hospitals)


# ---------- Patient ----------
@api.get("/patient")
async def get_patient():
    doc = await db.patients.find_one({"id": DEMO_PATIENT_ID}, {"_id": 0})
    if not doc:
        await ensure_seed_data()
        doc = await db.patients.find_one({"id": DEMO_PATIENT_ID}, {"_id": 0})
    return doc


@api.put("/patient")
async def update_patient(update: PatientUpdate):
    data = {k: v for k, v in update.dict().items() if v is not None}
    if data:
        await db.patients.update_one({"id": DEMO_PATIENT_ID}, {"$set": data})
    return await db.patients.find_one({"id": DEMO_PATIENT_ID}, {"_id": 0})


# ---------- Medicines ----------
@api.get("/medicines")
async def list_medicines():
    docs = await db.medicines.find({"active": True}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return docs


@api.post("/medicines")
async def create_medicine(m: MedicineCreate):
    med = Medicine(**m.dict())
    # If no times given, derive from frequency pattern "1-0-1"
    if not med.times and med.frequency:
        defaults = {"morning": "08:00", "noon": "13:00", "evening": "20:00"}
        parts = med.frequency.split("-")
        if len(parts) == 3:
            slots = ["morning", "noon", "evening"]
            med.times = [defaults[slots[i]] for i, p in enumerate(parts) if p.strip() not in ("0", "")]
    if not med.times:
        med.times = ["08:00", "20:00"]
    await db.medicines.insert_one(med.dict())
    return med.dict()


@api.put("/medicines/{medicine_id}")
async def update_medicine(medicine_id: str, m: MedicineCreate):
    data = {k: v for k, v in m.dict().items() if v is not None and v != ""}
    if "times" in m.dict() and m.times:
        data["times"] = m.times
    await db.medicines.update_one({"id": medicine_id}, {"$set": data})
    doc = await db.medicines.find_one({"id": medicine_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Not found")
    return doc


@api.delete("/medicines/{medicine_id}")
async def delete_medicine(medicine_id: str):
    await db.medicines.update_one({"id": medicine_id}, {"$set": {"active": False}})
    return {"ok": True}


@api.post("/medicine-logs")
async def log_medicine(log: MedicineLogCreate):
    med = await db.medicines.find_one({"id": log.medicine_id}, {"_id": 0})
    if not med:
        raise HTTPException(404, "Medicine not found")
    # Upsert: one log per (medicine_id, date, scheduled_time)
    existing = await db.medicine_logs.find_one(
        {"medicine_id": log.medicine_id, "date": log.date, "scheduled_time": log.scheduled_time}
    )
    record = MedicineLog(
        medicine_id=log.medicine_id,
        medicine_name=med["name"],
        scheduled_time=log.scheduled_time,
        date=log.date,
        status=log.status,
    )
    if existing:
        await db.medicine_logs.update_one(
            {"id": existing["id"]},
            {"$set": {"status": log.status, "logged_at": now_iso()}},
        )
        record.id = existing["id"]
    else:
        await db.medicine_logs.insert_one(record.dict())
    return record.dict()


@api.get("/medicine-logs")
async def list_logs(days: int = 7):
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).date().isoformat()
    docs = await db.medicine_logs.find({"date": {"$gte": cutoff}}, {"_id": 0}).sort("date", -1).to_list(1000)
    return docs


@api.get("/adherence")
async def adherence_stats(days: int = 7):
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).date().isoformat()
    logs = await db.medicine_logs.find({"date": {"$gte": cutoff}}, {"_id": 0}).to_list(2000)
    taken = sum(1 for log in logs if log["status"] == "taken")
    skipped = sum(1 for log in logs if log["status"] == "skipped")
    delayed = sum(1 for log in logs if log["status"] == "delayed")
    total = taken + skipped + delayed
    score = round((taken / total) * 100) if total else 0
    return {
        "adherence_score": score,
        "taken": taken,
        "skipped": skipped,
        "delayed": delayed,
        "total": total,
        "days": days,
    }


# ---------- Prescriptions ----------
@api.get("/prescriptions")
async def list_prescriptions():
    docs = await db.prescriptions.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return docs


@api.post("/prescriptions")
async def create_prescription(p: PrescriptionCreate):
    pres = Prescription(**p.dict())
    await db.prescriptions.insert_one(pres.dict())
    # Auto-create medicines from prescription
    for m in pres.medicines:
        if not m.get("name"):
            continue
        med = Medicine(
            name=m.get("name", ""),
            dosage=m.get("dosage", ""),
            frequency=m.get("frequency", ""),
            duration_days=int(m.get("duration_days", 30) or 30),
            instructions=m.get("instructions", ""),
            prescription_id=pres.id,
        )
        if not med.times:
            slots = []
            freq = (med.frequency or "").lower()
            if "morning" in freq or freq.startswith("1"): slots.append("08:00")
            if "noon" in freq or "afternoon" in freq: slots.append("13:00")
            if "evening" in freq or "night" in freq or freq.endswith("1"): slots.append("20:00")
            if not slots:
                slots = ["08:00", "20:00"]
            med.times = slots
        await db.medicines.insert_one(med.dict())
    return pres.dict()


@api.delete("/prescriptions/{pres_id}")
async def delete_prescription(pres_id: str):
    await db.prescriptions.delete_one({"id": pres_id})
    return {"ok": True}


@api.post("/prescriptions/scan")
async def scan_prescription(req: ScanRequest):
    """Use OpenRouter vision model to extract prescription data."""
    if not OPENROUTER_API_KEY:
        raise HTTPException(500, "OpenRouter API key not configured")

    system_prompt = (
        "You are a medical OCR assistant. Extract prescription details from the image. "
        "Return STRICT JSON ONLY, no markdown, no commentary. Schema: "
        '{"doctor_name": str, "visit_date": str (YYYY-MM-DD or ""), '
        '"next_followup": str (YYYY-MM-DD or ""), "diagnosis": str, '
        '"medicines": [{"name": str, "dosage": str, "frequency": str, "duration_days": int, "instructions": str}], '
        '"notes": str}. '
        "If a field is unclear, return empty string or 0. Frequency examples: '1-0-1', '1-1-1', 'twice daily'. "
        "If image is not a prescription, return empty schema with notes='not_a_prescription'."
    )

    image_data_url = req.image_base64
    if not image_data_url.startswith("data:"):
        image_data_url = f"data:image/jpeg;base64,{image_data_url}"

    payload = {
        "model": OPENROUTER_MODEL_VISION,
        "messages": [
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Extract prescription details from this image as strict JSON."},
                    {"type": "image_url", "image_url": {"url": image_data_url}},
                ],
            },
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.1,
    }

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": APP_URL,
        "X-Title": "Medify Healthcare Assistant",
    }

    try:
        async with httpx.AsyncClient(timeout=90.0) as http:
            resp = await http.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
        content = data["choices"][0]["message"]["content"]
        # Strip markdown fences if any
        content = content.strip()
        if content.startswith("```"):
            content = content.strip("`")
            if content.lower().startswith("json"):
                content = content[4:]
            content = content.strip()
        parsed = json.loads(content)
        return {"ok": True, "extracted": parsed}
    except httpx.HTTPStatusError as e:
        logging.exception("OpenRouter HTTP error")
        return {
            "ok": False,
            "error": f"OpenRouter error: {e.response.text[:200]}",
            "extracted": {
                "doctor_name": "",
                "visit_date": "",
                "next_followup": "",
                "diagnosis": "",
                "medicines": [],
                "notes": "Unable to read prescription automatically. Please enter manually.",
            },
        }
    except Exception as e:
        logging.exception("Scan failure")
        # Fallback: return empty extraction so user can edit manually
        return {
            "ok": False,
            "error": str(e),
            "extracted": {
                "doctor_name": "",
                "visit_date": "",
                "next_followup": "",
                "diagnosis": "",
                "medicines": [],
                "notes": "Unable to read prescription automatically. Please enter manually.",
            },
        }


# ---------- AI Chat ----------
def chat_system_prompt(language: str, patient: dict) -> str:
    name = patient.get("name", "the patient")
    age = patient.get("age", "")
    conds = ", ".join(patient.get("conditions") or []) or "none reported"
    base = (
        f"You are Medify AI, a friendly healthcare assistant helping {name} ({age} years old). "
        f"Known conditions: {conds}. "
        "STRICT RULES: "
        "1) Never diagnose diseases. 2) Never advise stopping or changing medication without consulting a doctor. "
        "3) Always encourage professional medical consultation. 4) Use simple, easy-to-understand language for elderly users. "
        "5) Show a brief medical disclaimer at the end of important medical answers. "
        "Capabilities: explain medicines (use, dosage, side effects, precautions, food interactions, missed-dose advice, elderly warnings), "
        "explain prescriptions and tests, suggest questions to ask the doctor, give general health education and diet tips. "
        "Keep responses concise (under 200 words) with short paragraphs and bullets when helpful."
    )
    if language == "bn":
        base += " সবসময় বাংলায় উত্তর দিন। সহজ ভাষা ব্যবহার করুন।"
    else:
        base += " Always respond in clear English."
    return base


@api.post("/chat")
async def chat(req: ChatRequest):
    if not OPENROUTER_API_KEY:
        raise HTTPException(500, "OpenRouter API key not configured")

    patient = await db.patients.find_one({"id": DEMO_PATIENT_ID}, {"_id": 0}) or {}
    system = chat_system_prompt(req.language, patient)

    # Save user message
    user_msg = ChatMessage(session_id=req.session_id, role="user", text=req.message, language=req.language)
    await db.chat_messages.insert_one(user_msg.dict())

    # Build conversation history (last 10 messages)
    history_docs = await db.chat_messages.find(
        {"session_id": req.session_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(10)
    history_docs.reverse()
    messages = [{"role": "system", "content": system}]
    for h in history_docs:
        messages.append({"role": h["role"], "content": h["text"]})

    payload = {
        "model": OPENROUTER_MODEL_CHAT,
        "messages": messages,
        "temperature": 0.3,
        "max_tokens": 800,
    }
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": APP_URL,
        "X-Title": "Medify Healthcare Assistant",
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as http:
            resp = await http.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
        reply = data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        logging.exception("Chat failure")
        reply = (
            "দুঃখিত, এই মুহূর্তে আমি উত্তর দিতে পারছি না। অনুগ্রহ করে কিছুক্ষণ পরে আবার চেষ্টা করুন।"
            if req.language == "bn"
            else "Sorry, I couldn't respond right now. Please try again in a moment."
        )

    bot_msg = ChatMessage(session_id=req.session_id, role="assistant", text=reply, language=req.language)
    await db.chat_messages.insert_one(bot_msg.dict())
    return {"reply": reply, "message_id": bot_msg.id}


@api.get("/chat/history")
async def chat_history(session_id: str = "default", limit: int = 50):
    docs = await db.chat_messages.find(
        {"session_id": session_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(limit)
    return docs


@api.delete("/chat/history")
async def clear_chat(session_id: str = "default"):
    await db.chat_messages.delete_many({"session_id": session_id})
    return {"ok": True}


# ---------- Appointments ----------
@api.get("/appointments")
async def list_appointments():
    docs = await db.appointments.find({}, {"_id": 0}).sort("date", 1).to_list(200)
    return docs


@api.post("/appointments")
async def create_appointment(a: AppointmentCreate):
    apt = Appointment(**a.dict())
    await db.appointments.insert_one(apt.dict())
    return apt.dict()


@api.put("/appointments/{apt_id}")
async def update_appointment(apt_id: str, a: AppointmentCreate):
    data = a.dict()
    await db.appointments.update_one({"id": apt_id}, {"$set": data})
    doc = await db.appointments.find_one({"id": apt_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Not found")
    return doc


@api.delete("/appointments/{apt_id}")
async def delete_appointment(apt_id: str):
    await db.appointments.delete_one({"id": apt_id})
    return {"ok": True}


# ---------- Health Records ----------
@api.get("/health-records")
async def list_records():
    docs = await db.health_records.find({}, {"_id": 0}).sort("record_date", -1).to_list(500)
    return docs


@api.post("/health-records")
async def create_record(r: HealthRecordCreate):
    rec = HealthRecord(**{k: v for k, v in r.dict().items() if v is not None})
    if r.record_date:
        rec.record_date = r.record_date
    await db.health_records.insert_one(rec.dict())
    return rec.dict()


@api.delete("/health-records/{rec_id}")
async def delete_record(rec_id: str):
    await db.health_records.delete_one({"id": rec_id})
    return {"ok": True}


# ---------- Hospitals & Emergency ----------
@api.get("/hospitals")
async def list_hospitals():
    docs = await db.hospitals.find({}, {"_id": 0}).sort("distance_km", 1).to_list(50)
    return docs


@api.get("/emergency-contacts")
async def list_emergency_contacts():
    docs = await db.emergency_contacts.find({}, {"_id": 0}).to_list(50)
    return docs


@api.post("/sos")
async def trigger_sos(req: SOSRequest):
    patient = await db.patients.find_one({"id": DEMO_PATIENT_ID}, {"_id": 0}) or {}
    sos_record = {
        "id": str(uuid.uuid4()),
        "patient_id": DEMO_PATIENT_ID,
        "latitude": req.latitude,
        "longitude": req.longitude,
        "message": req.message,
        "notified": [
            {"name": patient.get("guardian_name", ""), "phone": patient.get("guardian_phone", "")},
            {"name": patient.get("doctor_name", ""), "phone": patient.get("doctor_phone", "")},
        ],
        "created_at": now_iso(),
    }
    await db.sos_alerts.insert_one(sos_record.copy())
    sos_record.pop("_id", None)
    return {"ok": True, "alert": sos_record}


@api.get("/sos")
async def list_sos():
    docs = await db.sos_alerts.find({}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return docs


# ---------- Health ----------
@api.get("/")
async def root():
    return {"message": "Medify API", "status": "ok"}


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")


@app.on_event("startup")
async def on_startup():
    await ensure_seed_data()


@app.on_event("shutdown")
async def on_shutdown():
    client.close()
