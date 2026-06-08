# Medify - AI Powered Smart Healthcare Assistant

## Vision
Mobile-first healthcare companion for elderly patients, chronic-disease patients, and caregivers in Bangladesh and beyond. Supports Bengali + English with voice-first accessibility, elderly-friendly UI, dark/light themes.

## Tech Stack
- **Frontend**: Expo (React Native), Expo Router, lucide-react-native icons, AsyncStorage
- **Backend**: FastAPI (Python), Motor (async MongoDB)
- **Database**: MongoDB (`medify_db`)
- **AI**: OpenRouter API (user-supplied key) — `openai/gpt-oss-120b:free` for chat (Bengali + English), `nvidia/nemotron-nano-12b-v2-vl:free` for prescription vision OCR

## MVP Scope (Patient role, single demo user)
Auto-seeded demo patient: `Rahima Begum` (68y, Type 2 Diabetes + Hypertension).

### Features delivered
1. **Dashboard (Home)** — greeting, language toggle (EN/BN), Emergency SOS banner, weekly adherence score with stats, quick actions grid (Scan, Add Medicine, Find Hospital, Emergency), upcoming medicines today, upcoming appointments, AI assistant banner.
2. **Smart Prescription Scanner** — camera capture + gallery upload, sends base64 to backend, OpenRouter vision model extracts JSON `{doctor_name, visit_date, next_followup, diagnosis, medicines[], notes}`, user reviews/edits, auto-creates medicines on save.
3. **Medicine Schedule & Reminders** — time-slot timeline (Morning/Noon/Evening/Night), per-dose Taken/Skipped logging, soft-delete medicines, manual add via `/medicine/add`.
4. **AI Health Assistant** — bilingual chat (BN/EN), conversation history persisted in Mongo, listen with `expo-speech` TTS, suggestion chips, clear chat, safety system prompt forbidding diagnosis/medication changes.
5. **Emergency SOS** — animated pulsing button, requests location, calls `/api/sos`, displays notified contacts (guardian + doctor) with one-tap call, ambulance shortcut (10921).
6. **Hospital Locator** — list with distance, type pill, call/SOS/navigate (Google Maps deep-link).
7. **Emergency Contacts** — National Emergency 999, Health Helpline 16263, Ambulance 10921, Fire 102, plus seeded hospitals — one-tap `tel:` dial.
8. **Appointments** — list + modal form to add, delete.
9. **Health Records** — list with thumbnails, add prescriptions/reports/test results with optional image (camera/gallery, base64).
10. **Profile** — patient card with conditions, settings (language toggle, dark mode), care-team contacts (guardian/doctor) with call buttons, shortcuts.

## Backend API (all under `/api`)
- `GET /patient`, `PUT /patient`
- `GET/POST/PUT/DELETE /medicines`, `POST /medicine-logs`, `GET /medicine-logs`, `GET /adherence`
- `GET/POST/DELETE /prescriptions`, `POST /prescriptions/scan` (OpenRouter vision)
- `POST /chat`, `GET /chat/history`, `DELETE /chat/history`
- `GET/POST/PUT/DELETE /appointments`
- `GET/POST/DELETE /health-records`
- `GET /hospitals`, `GET /emergency-contacts`
- `POST /sos`, `GET /sos`

## Permissions
Camera (prescription scan, record photo), Photo library, Location (SOS), Audio (future voice input). Declared in `app.json` for iOS infoPlist + Android.

## Out of scope for MVP (future work)
- Multi-role (Guardian, Doctor, Admin dashboards)
- Real-time push notifications for missed doses (requires native build)
- Voice input STT (Whisper integration)
- Real Google Maps embed (currently uses deep-link)
- Auth (currently single demo user)
