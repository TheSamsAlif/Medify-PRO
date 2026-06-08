"""Medify - AI Healthcare Assistant Backend with JWT Auth."""
import json
import logging
import os
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import List, Optional

import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, FastAPI, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL_CHAT = os.environ.get("OPENROUTER_MODEL_CHAT", "openai/gpt-oss-120b:free")
OPENROUTER_MODEL_VISION = os.environ.get("OPENROUTER_MODEL_VISION", "nvidia/nemotron-nano-12b-v2-vl:free")
APP_URL = os.environ.get("APP_URL", "https://medify.app")
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_HOURS = int(os.environ.get("JWT_EXPIRE_HOURS", "720"))

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Medify API")
api = APIRouter(prefix="/api")
auth_router = APIRouter(prefix="/api/auth", tags=["auth"])

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer = HTTPBearer(auto_error=False)


# ---------- Helpers ----------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def hash_password(p: str) -> str:
    return pwd_ctx.hash(p)


def verify_password(p: str, hashed: str) -> bool:
    try:
        return pwd_ctx.verify(p, hashed)
    except Exception:
        return False


def create_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    if not creds or not creds.credentials:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing token")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
    except JWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token")
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")
    return user


# ---------- Models ----------
class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    age: Optional[int] = None
    language: str = "en"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


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
    user_id: str
    name: str
    dosage: str = ""
    frequency: str = "1-0-1"
    times: List[str] = Field(default_factory=list)
    duration_days: int = 30
    instructions: str = ""
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


class MedicineLogCreate(BaseModel):
    medicine_id: str
    scheduled_time: str
    date: str
    status: str


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
    language: str = "en"
    session_id: str = "default"


class AppointmentCreate(BaseModel):
    doctor_name: str
    specialty: str = ""
    date: str
    time: str = ""
    location: str = ""
    notes: str = ""


class HealthRecordCreate(BaseModel):
    title: str
    record_type: str = "report"
    description: str = ""
    image_base64: Optional[str] = None
    record_date: Optional[str] = None


class SOSRequest(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    message: str = "Emergency! Patient needs immediate help."


# ---------- Seed ----------
async def ensure_seed_data():
    await db.users.create_index("email", unique=True)

    if await db.emergency_contacts.count_documents({}) == 0:
        await db.emergency_contacts.insert_many([
            {"id": "ec1", "name": "National Emergency", "phone": "999", "category": "national", "icon": "shield"},
            {"id": "ec2", "name": "Health Helpline", "phone": "16263", "category": "national", "icon": "heart"},
            {"id": "ec3", "name": "Ambulance Service", "phone": "10921", "category": "ambulance", "icon": "ambulance"},
            {"id": "ec4", "name": "Fire Service", "phone": "102", "category": "national", "icon": "flame"},
            {"id": "ec5", "name": "Dhaka Medical College Hospital", "phone": "+8809666700400", "category": "hospital", "icon": "hospital"},
            {"id": "ec6", "name": "Square Hospital", "phone": "+88029610556", "category": "hospital", "icon": "hospital"},
        ])

    if await db.hospitals.count_documents({}) == 0:
        await db.hospitals.insert_many([
            {"id": "h1", "name": "Dhaka Medical College Hospital", "address": "Bakshibazar, Dhaka", "phone": "+8809666700400", "emergency_phone": "+88029668690", "distance_km": 2.4, "type": "government"},
            {"id": "h2", "name": "Square Hospital", "address": "18/F West Panthapath, Dhaka", "phone": "+88029610556", "emergency_phone": "10616", "distance_km": 3.1, "type": "hospital"},
            {"id": "h3", "name": "United Hospital", "address": "Plot 15, Road 71, Gulshan, Dhaka", "phone": "+88028836444", "emergency_phone": "+88028836000", "distance_km": 5.8, "type": "hospital"},
            {"id": "h4", "name": "Apollo Hospitals Dhaka", "address": "Plot 81, Block E, Bashundhara R/A", "phone": "+88010678", "emergency_phone": "10678", "distance_km": 7.2, "type": "hospital"},
            {"id": "h5", "name": "Popular Diagnostic Centre", "address": "House 16, Road 2, Dhanmondi", "phone": "+88029669301", "emergency_phone": "", "distance_km": 4.0, "type": "diagnostic"},
            {"id": "h6", "name": "Ibn Sina Diagnostic", "address": "House 48, Road 9/A, Dhanmondi", "phone": "+88029126625", "emergency_phone": "", "distance_km": 4.5, "type": "diagnostic"},
            {"id": "h7", "name": "Suhrawardy Hospital", "address": "Sher-E-Bangla Nagar, Dhaka", "phone": "+88029131114", "emergency_phone": "+88029131111", "distance_km": 6.0, "type": "government"},
        ])


def make_patient_profile(user_id: str, name: str, age: Optional[int], language: str) -> dict:
    return {
        "id": user_id,
        "user_id": user_id,
        "name": name,
        "age": age or 0,
        "gender": "",
        "blood_group": "",
        "conditions": [],
        "language": language,
        "guardian_name": "",
        "guardian_phone": "",
        "doctor_name": "",
        "doctor_phone": "",
        "location": "",
    }


def public_user(user: dict) -> dict:
    return {"id": user["id"], "name": user.get("name", ""), "email": user["email"]}


# ---------- Auth Routes ----------
@auth_router.post("/register")
async def register(req: RegisterRequest):
    email = req.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "Email already registered")
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "name": req.name.strip(),
        "email": email,
        "password": hash_password(req.password),
        "created_at": now_iso(),
    }
    await db.users.insert_one(user_doc.copy())
    # Auto-create patient profile
    profile = make_patient_profile(user_id, req.name.strip(), req.age, req.language)
    await db.patients.insert_one(profile.copy())
    token = create_token(user_id, email)
    return {"token": token, "user": public_user(user_doc)}


@auth_router.post("/login")
async def login(req: LoginRequest):
    email = req.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(req.password, user.get("password", "")):
        raise HTTPException(401, "Incorrect email or password")
    token = create_token(user["id"], user["email"])
    return {"token": token, "user": public_user(user)}


@auth_router.get("/me")
async def me(current=Depends(get_current_user)):
    return public_user(current)


# ---------- Patient ----------
@api.get("/patient")
async def get_patient(current=Depends(get_current_user)):
    doc = await db.patients.find_one({"user_id": current["id"]}, {"_id": 0})
    if not doc:
        profile = make_patient_profile(current["id"], current.get("name", ""), 0, "en")
        await db.patients.insert_one(profile.copy())
        doc = profile
    return doc


@api.put("/patient")
async def update_patient(update: PatientUpdate, current=Depends(get_current_user)):
    data = {k: v for k, v in update.dict().items() if v is not None}
    if data:
        await db.patients.update_one({"user_id": current["id"]}, {"$set": data}, upsert=True)
    return await db.patients.find_one({"user_id": current["id"]}, {"_id": 0})


# ---------- Medicines ----------
def _default_times_from_freq(freq: str) -> List[str]:
    slots: List[str] = []
    f = (freq or "").lower()
    if "morning" in f or f.startswith("1"):
        slots.append("08:00")
    if "noon" in f or "afternoon" in f:
        slots.append("13:00")
    if "evening" in f or "night" in f or f.endswith("1"):
        slots.append("20:00")
    return slots or ["08:00", "20:00"]


@api.get("/medicines")
async def list_medicines(current=Depends(get_current_user)):
    docs = await db.medicines.find({"user_id": current["id"], "active": True}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return docs


@api.post("/medicines")
async def create_medicine(m: MedicineCreate, current=Depends(get_current_user)):
    med = Medicine(user_id=current["id"], **m.dict())
    if not med.times:
        med.times = _default_times_from_freq(med.frequency)
    await db.medicines.insert_one(med.dict())
    return med.dict()


@api.put("/medicines/{medicine_id}")
async def update_medicine(medicine_id: str, m: MedicineCreate, current=Depends(get_current_user)):
    existing = await db.medicines.find_one({"id": medicine_id, "user_id": current["id"]})
    if not existing:
        raise HTTPException(404, "Not found")
    data = {k: v for k, v in m.dict().items() if v is not None and v != ""}
    if m.times:
        data["times"] = m.times
    await db.medicines.update_one({"id": medicine_id, "user_id": current["id"]}, {"$set": data})
    return await db.medicines.find_one({"id": medicine_id, "user_id": current["id"]}, {"_id": 0})


@api.delete("/medicines/{medicine_id}")
async def delete_medicine(medicine_id: str, current=Depends(get_current_user)):
    await db.medicines.update_one({"id": medicine_id, "user_id": current["id"]}, {"$set": {"active": False}})
    return {"ok": True}


@api.post("/medicine-logs")
async def log_medicine(log: MedicineLogCreate, current=Depends(get_current_user)):
    med = await db.medicines.find_one({"id": log.medicine_id, "user_id": current["id"]}, {"_id": 0})
    if not med:
        raise HTTPException(404, "Medicine not found")
    existing = await db.medicine_logs.find_one({
        "user_id": current["id"],
        "medicine_id": log.medicine_id,
        "date": log.date,
        "scheduled_time": log.scheduled_time,
    })
    record = {
        "id": existing["id"] if existing else str(uuid.uuid4()),
        "user_id": current["id"],
        "medicine_id": log.medicine_id,
        "medicine_name": med["name"],
        "scheduled_time": log.scheduled_time,
        "date": log.date,
        "status": log.status,
        "logged_at": now_iso(),
    }
    if existing:
        await db.medicine_logs.update_one({"id": existing["id"]}, {"$set": {"status": log.status, "logged_at": record["logged_at"]}})
    else:
        await db.medicine_logs.insert_one(record.copy())
    return record


@api.get("/medicine-logs")
async def list_logs(days: int = 7, current=Depends(get_current_user)):
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).date().isoformat()
    docs = await db.medicine_logs.find({"user_id": current["id"], "date": {"$gte": cutoff}}, {"_id": 0}).sort("date", -1).to_list(1000)
    return docs


@api.get("/adherence")
async def adherence_stats(days: int = 7, current=Depends(get_current_user)):
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).date().isoformat()
    logs = await db.medicine_logs.find({"user_id": current["id"], "date": {"$gte": cutoff}}, {"_id": 0}).to_list(2000)
    taken = sum(1 for log in logs if log["status"] == "taken")
    skipped = sum(1 for log in logs if log["status"] == "skipped")
    delayed = sum(1 for log in logs if log["status"] == "delayed")
    total = taken + skipped + delayed
    score = round((taken / total) * 100) if total else 0
    return {"adherence_score": score, "taken": taken, "skipped": skipped, "delayed": delayed, "total": total, "days": days}


# ---------- Prescriptions ----------
@api.get("/prescriptions")
async def list_prescriptions(current=Depends(get_current_user)):
    return await db.prescriptions.find({"user_id": current["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)


@api.post("/prescriptions")
async def create_prescription(p: PrescriptionCreate, current=Depends(get_current_user)):
    pres_id = str(uuid.uuid4())
    pres = {
        "id": pres_id,
        "user_id": current["id"],
        "doctor_name": p.doctor_name,
        "visit_date": p.visit_date,
        "next_followup": p.next_followup,
        "diagnosis": p.diagnosis,
        "medicines": p.medicines,
        "notes": p.notes,
        "image_base64": p.image_base64,
        "created_at": now_iso(),
    }
    await db.prescriptions.insert_one(pres.copy())
    for m in p.medicines:
        if not m.get("name"):
            continue
        med = Medicine(
            user_id=current["id"],
            name=m.get("name", ""),
            dosage=m.get("dosage", ""),
            frequency=m.get("frequency", "") or "1-0-1",
            duration_days=int(m.get("duration_days", 30) or 30),
            instructions=m.get("instructions", ""),
            prescription_id=pres_id,
        )
        if not med.times:
            med.times = _default_times_from_freq(med.frequency)
        await db.medicines.insert_one(med.dict())
    pres.pop("_id", None)
    return pres


@api.delete("/prescriptions/{pres_id}")
async def delete_prescription(pres_id: str, current=Depends(get_current_user)):
    await db.prescriptions.delete_one({"id": pres_id, "user_id": current["id"]})
    return {"ok": True}


@api.post("/prescriptions/scan")
async def scan_prescription(req: ScanRequest, current=Depends(get_current_user)):
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
            {"role": "user", "content": [
                {"type": "text", "text": "Extract prescription details from this image as strict JSON."},
                {"type": "image_url", "image_url": {"url": image_data_url}},
            ]},
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
    fallback = {
        "doctor_name": "", "visit_date": "", "next_followup": "", "diagnosis": "",
        "medicines": [], "notes": "Unable to read prescription automatically. Please enter manually.",
    }
    try:
        async with httpx.AsyncClient(timeout=90.0) as http:
            resp = await http.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload)
        if resp.status_code >= 400:
            return {"ok": False, "error": resp.text[:300], "extracted": fallback}
        data = resp.json()
        content = data["choices"][0]["message"]["content"].strip()
        if content.startswith("```"):
            content = content.strip("`")
            if content.lower().startswith("json"):
                content = content[4:]
            content = content.strip()
        parsed = json.loads(content)
        return {"ok": True, "extracted": parsed}
    except Exception as e:
        logging.exception("Scan failure")
        return {"ok": False, "error": str(e), "extracted": fallback}


# ---------- Chat ----------
def chat_system_prompt(language: str, patient: dict) -> str:
    name = patient.get("name", "the patient")
    age = patient.get("age", "")
    conds = ", ".join(patient.get("conditions") or []) or "none reported"
    base = (
        f"You are Medify AI, a friendly healthcare assistant helping {name} ({age} years old). "
        f"Known conditions: {conds}. "
        "STRICT RULES: 1) Never diagnose diseases. 2) Never advise stopping or changing medication without consulting a doctor. "
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
async def chat(req: ChatRequest, current=Depends(get_current_user)):
    if not OPENROUTER_API_KEY:
        raise HTTPException(500, "OpenRouter API key not configured")

    patient = await db.patients.find_one({"user_id": current["id"]}, {"_id": 0}) or {}
    system = chat_system_prompt(req.language, patient)

    user_msg = {
        "id": str(uuid.uuid4()),
        "user_id": current["id"],
        "session_id": req.session_id,
        "role": "user",
        "text": req.message,
        "language": req.language,
        "created_at": now_iso(),
    }
    await db.chat_messages.insert_one(user_msg.copy())

    history_docs = await db.chat_messages.find(
        {"user_id": current["id"], "session_id": req.session_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(10)
    history_docs.reverse()
    messages = [{"role": "system", "content": system}]
    for h in history_docs:
        messages.append({"role": h["role"], "content": h["text"]})

    payload = {"model": OPENROUTER_MODEL_CHAT, "messages": messages, "temperature": 0.3, "max_tokens": 800}
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": APP_URL,
        "X-Title": "Medify Healthcare Assistant",
    }
    try:
        async with httpx.AsyncClient(timeout=60.0) as http:
            resp = await http.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
        reply = data["choices"][0]["message"]["content"].strip()
    except Exception:
        logging.exception("Chat failure")
        reply = (
            "দুঃখিত, এই মুহূর্তে আমি উত্তর দিতে পারছি না। অনুগ্রহ করে কিছুক্ষণ পরে আবার চেষ্টা করুন।"
            if req.language == "bn"
            else "Sorry, I couldn't respond right now. Please try again in a moment."
        )

    bot_msg = {
        "id": str(uuid.uuid4()),
        "user_id": current["id"],
        "session_id": req.session_id,
        "role": "assistant",
        "text": reply,
        "language": req.language,
        "created_at": now_iso(),
    }
    await db.chat_messages.insert_one(bot_msg.copy())
    return {"reply": reply, "message_id": bot_msg["id"]}


@api.get("/chat/history")
async def chat_history(session_id: str = "default", limit: int = 50, current=Depends(get_current_user)):
    return await db.chat_messages.find(
        {"user_id": current["id"], "session_id": session_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(limit)


@api.delete("/chat/history")
async def clear_chat(session_id: str = "default", current=Depends(get_current_user)):
    await db.chat_messages.delete_many({"user_id": current["id"], "session_id": session_id})
    return {"ok": True}


# ---------- Appointments ----------
@api.get("/appointments")
async def list_appointments(current=Depends(get_current_user)):
    return await db.appointments.find({"user_id": current["id"]}, {"_id": 0}).sort("date", 1).to_list(200)


@api.post("/appointments")
async def create_appointment(a: AppointmentCreate, current=Depends(get_current_user)):
    apt = {
        "id": str(uuid.uuid4()),
        "user_id": current["id"],
        **a.dict(),
        "status": "upcoming",
        "created_at": now_iso(),
    }
    await db.appointments.insert_one(apt.copy())
    return apt


@api.put("/appointments/{apt_id}")
async def update_appointment(apt_id: str, a: AppointmentCreate, current=Depends(get_current_user)):
    res = await db.appointments.update_one({"id": apt_id, "user_id": current["id"]}, {"$set": a.dict()})
    if res.matched_count == 0:
        raise HTTPException(404, "Not found")
    return await db.appointments.find_one({"id": apt_id, "user_id": current["id"]}, {"_id": 0})


@api.delete("/appointments/{apt_id}")
async def delete_appointment(apt_id: str, current=Depends(get_current_user)):
    await db.appointments.delete_one({"id": apt_id, "user_id": current["id"]})
    return {"ok": True}


# ---------- Health Records ----------
@api.get("/health-records")
async def list_records(current=Depends(get_current_user)):
    return await db.health_records.find({"user_id": current["id"]}, {"_id": 0}).sort("record_date", -1).to_list(500)


@api.post("/health-records")
async def create_record(r: HealthRecordCreate, current=Depends(get_current_user)):
    rec = {
        "id": str(uuid.uuid4()),
        "user_id": current["id"],
        "title": r.title,
        "record_type": r.record_type,
        "description": r.description,
        "image_base64": r.image_base64,
        "record_date": r.record_date or now_iso(),
        "created_at": now_iso(),
    }
    await db.health_records.insert_one(rec.copy())
    return rec


@api.delete("/health-records/{rec_id}")
async def delete_record(rec_id: str, current=Depends(get_current_user)):
    await db.health_records.delete_one({"id": rec_id, "user_id": current["id"]})
    return {"ok": True}


# ---------- Hospitals & Emergency (PUBLIC) ----------
@api.get("/hospitals")
async def list_hospitals():
    return await db.hospitals.find({}, {"_id": 0}).sort("distance_km", 1).to_list(50)


@api.get("/emergency-contacts")
async def list_emergency_contacts():
    return await db.emergency_contacts.find({}, {"_id": 0}).to_list(50)


# ---------- SOS ----------
@api.post("/sos")
async def trigger_sos(req: SOSRequest, current=Depends(get_current_user)):
    patient = await db.patients.find_one({"user_id": current["id"]}, {"_id": 0}) or {}
    sos_record = {
        "id": str(uuid.uuid4()),
        "user_id": current["id"],
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
    return {"ok": True, "alert": sos_record}


@api.get("/sos")
async def list_sos(current=Depends(get_current_user)):
    return await db.sos_alerts.find({"user_id": current["id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)


# ---------- Health ----------
@api.get("/")
async def root():
    return {"message": "Medify API", "status": "ok"}


app.include_router(auth_router)
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
