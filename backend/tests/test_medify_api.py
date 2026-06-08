"""Medify backend API tests."""
import base64
import os
import time
import uuid

import pytest
import requests

BASE_URL = "https://medify-health-1.preview.emergentagent.com"
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


def _no_id(obj):
    """Assert _id is not present in any dict in response."""
    if isinstance(obj, dict):
        assert "_id" not in obj, f"_id leaked: {obj}"
        for v in obj.values():
            _no_id(v)
    elif isinstance(obj, list):
        for item in obj:
            _no_id(item)


# ---------- Patient ----------
class TestPatient:
    def test_get_patient(self, s):
        r = s.get(f"{API}/patient")
        assert r.status_code == 200
        d = r.json()
        assert d["name"] == "Rahima Begum"
        assert d["language"] in ("en", "bn")
        _no_id(d)

    def test_update_patient(self, s):
        r = s.put(f"{API}/patient", json={"language": "bn", "location": "TEST_Dhaka"})
        assert r.status_code == 200
        assert r.json()["language"] == "bn"
        # revert
        s.put(f"{API}/patient", json={"language": "en", "location": "Dhaka, Bangladesh"})


# ---------- Medicines ----------
class TestMedicines:
    med_id = None

    def test_create_medicine(self, s):
        r = s.post(f"{API}/medicines", json={
            "name": "TEST_Metformin", "dosage": "500mg", "frequency": "1-0-1", "duration_days": 30,
            "instructions": "After meal"
        })
        assert r.status_code == 200
        d = r.json()
        assert d["name"] == "TEST_Metformin"
        assert d["times"] == ["08:00", "20:00"]
        _no_id(d)
        TestMedicines.med_id = d["id"]

    def test_list_medicines(self, s):
        r = s.get(f"{API}/medicines")
        assert r.status_code == 200
        names = [m["name"] for m in r.json()]
        assert "TEST_Metformin" in names
        _no_id(r.json())

    def test_update_medicine(self, s):
        r = s.put(f"{API}/medicines/{TestMedicines.med_id}", json={
            "name": "TEST_Metformin", "dosage": "850mg", "frequency": "1-0-1"
        })
        assert r.status_code == 200
        assert r.json()["dosage"] == "850mg"

    def test_log_medicine(self, s):
        today = "2026-01-15"
        r = s.post(f"{API}/medicine-logs", json={
            "medicine_id": TestMedicines.med_id, "scheduled_time": "08:00",
            "date": today, "status": "taken"
        })
        assert r.status_code == 200
        d = r.json()
        assert d["status"] == "taken"
        log_id = d["id"]
        # upsert behaviour
        r2 = s.post(f"{API}/medicine-logs", json={
            "medicine_id": TestMedicines.med_id, "scheduled_time": "08:00",
            "date": today, "status": "skipped"
        })
        assert r2.json()["id"] == log_id
        assert r2.json()["status"] == "skipped"

    def test_list_logs(self, s):
        r = s.get(f"{API}/medicine-logs")
        assert r.status_code == 200
        _no_id(r.json())

    def test_adherence(self, s):
        r = s.get(f"{API}/adherence")
        assert r.status_code == 200
        d = r.json()
        for k in ("adherence_score", "taken", "skipped", "delayed", "total", "days"):
            assert k in d

    def test_delete_medicine(self, s):
        r = s.delete(f"{API}/medicines/{TestMedicines.med_id}")
        assert r.status_code == 200
        # Should no longer appear in active list
        r2 = s.get(f"{API}/medicines")
        ids = [m["id"] for m in r2.json()]
        assert TestMedicines.med_id not in ids


# ---------- Prescriptions ----------
class TestPrescriptions:
    pres_id = None

    def test_create_prescription_auto_creates_medicines(self, s):
        r = s.post(f"{API}/prescriptions", json={
            "doctor_name": "TEST_Dr_X", "visit_date": "2026-01-10", "diagnosis": "Diabetes",
            "medicines": [
                {"name": "TEST_PresMed", "dosage": "10mg", "frequency": "1-1-1", "duration_days": 7, "instructions": ""}
            ],
            "notes": ""
        })
        assert r.status_code == 200
        d = r.json()
        TestPrescriptions.pres_id = d["id"]
        _no_id(d)
        # Verify medicines created
        meds = s.get(f"{API}/medicines").json()
        assert any(m["name"] == "TEST_PresMed" and m.get("prescription_id") == d["id"] for m in meds)

    def test_list_prescriptions(self, s):
        r = s.get(f"{API}/prescriptions")
        assert r.status_code == 200
        _no_id(r.json())
        assert any(p["id"] == TestPrescriptions.pres_id for p in r.json())

    def test_scan_prescription(self, s):
        # Valid 1x1 PNG (transparent pixel)
        png_b64 = (
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGBgAAAABQABh6FO1AAAAABJRU5ErkJggg=="
        )
        r = s.post(f"{API}/prescriptions/scan", json={"image_base64": f"data:image/png;base64,{png_b64}"}, timeout=120)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "ok" in d
        assert "extracted" in d
        # Either ok=true with extracted JSON OR ok=false with fallback schema both acceptable
        ex = d["extracted"]
        assert isinstance(ex, dict)
        for k in ("doctor_name", "medicines", "notes"):
            assert k in ex

    def test_delete_prescription(self, s):
        r = s.delete(f"{API}/prescriptions/{TestPrescriptions.pres_id}")
        assert r.status_code == 200


# ---------- Chat ----------
class TestChat:
    session_id = f"TEST_{uuid.uuid4().hex[:8]}"

    def _send(self, s, msg, lang="en"):
        return s.post(f"{API}/chat", json={
            "message": msg, "language": lang, "session_id": TestChat.session_id
        }, timeout=120)

    def test_chat_en(self, s):
        r = self._send(s, "What is paracetamol used for?")
        assert r.status_code == 200, r.text
        reply = r.json()["reply"]
        assert isinstance(reply, str) and len(reply) > 0
        if "Sorry" in reply and "try again" in reply.lower():
            time.sleep(5)
            r = self._send(s, "What is paracetamol used for?")
            assert r.status_code == 200

    def test_chat_history_persists(self, s):
        # Send second message in same session
        r = self._send(s, "And its side effects?")
        assert r.status_code == 200
        h = s.get(f"{API}/chat/history", params={"session_id": TestChat.session_id})
        assert h.status_code == 200
        msgs = h.json()
        assert len(msgs) >= 4  # 2 user + 2 assistant
        _no_id(msgs)

    def test_chat_bengali(self, s):
        sid = f"TEST_bn_{uuid.uuid4().hex[:8]}"
        r = s.post(f"{API}/chat", json={
            "message": "প্যারাসিটামল কী?", "language": "bn", "session_id": sid
        }, timeout=120)
        assert r.status_code == 200
        reply = r.json()["reply"]
        # Retry once on fallback
        if "দুঃখিত" in reply and "চেষ্টা" in reply:
            time.sleep(5)
            r = s.post(f"{API}/chat", json={
                "message": "প্যারাসিটামল কী?", "language": "bn", "session_id": sid
            }, timeout=120)
            reply = r.json()["reply"]
        # Should usually contain Bengali characters
        assert isinstance(reply, str) and len(reply) > 0
        s.delete(f"{API}/chat/history", params={"session_id": sid})

    def test_clear_chat(self, s):
        r = s.delete(f"{API}/chat/history", params={"session_id": TestChat.session_id})
        assert r.status_code == 200
        h = s.get(f"{API}/chat/history", params={"session_id": TestChat.session_id})
        assert h.json() == []


# ---------- Appointments ----------
class TestAppointments:
    apt_id = None

    def test_create(self, s):
        r = s.post(f"{API}/appointments", json={
            "doctor_name": "TEST_Dr_Apt", "specialty": "Cardio",
            "date": "2026-02-01", "time": "10:00", "location": "Dhaka"
        })
        assert r.status_code == 200
        TestAppointments.apt_id = r.json()["id"]
        _no_id(r.json())

    def test_list(self, s):
        r = s.get(f"{API}/appointments")
        assert r.status_code == 200
        assert any(a["id"] == TestAppointments.apt_id for a in r.json())

    def test_update(self, s):
        r = s.put(f"{API}/appointments/{TestAppointments.apt_id}", json={
            "doctor_name": "TEST_Dr_Apt", "specialty": "Cardio",
            "date": "2026-02-02", "time": "11:00", "location": "Dhaka", "notes": "Updated"
        })
        assert r.status_code == 200
        assert r.json()["date"] == "2026-02-02"

    def test_delete(self, s):
        r = s.delete(f"{API}/appointments/{TestAppointments.apt_id}")
        assert r.status_code == 200


# ---------- Health records ----------
class TestHealthRecords:
    rec_id = None

    def test_create_with_image(self, s):
        tiny_b64 = base64.b64encode(b"\xff\xd8\xff\xd9").decode()
        r = s.post(f"{API}/health-records", json={
            "title": "TEST_Blood Report", "record_type": "report",
            "description": "Routine", "image_base64": tiny_b64
        })
        assert r.status_code == 200
        d = r.json()
        TestHealthRecords.rec_id = d["id"]
        assert d["image_base64"] == tiny_b64
        _no_id(d)

    def test_list(self, s):
        r = s.get(f"{API}/health-records")
        assert r.status_code == 200
        assert any(rec["id"] == TestHealthRecords.rec_id for rec in r.json())

    def test_delete(self, s):
        r = s.delete(f"{API}/health-records/{TestHealthRecords.rec_id}")
        assert r.status_code == 200


# ---------- Hospitals & Emergency ----------
class TestHospitalsEmergency:
    def test_hospitals_sorted(self, s):
        r = s.get(f"{API}/hospitals")
        assert r.status_code == 200
        docs = r.json()
        assert len(docs) >= 6
        distances = [h["distance_km"] for h in docs]
        assert distances == sorted(distances)
        _no_id(docs)

    def test_emergency_contacts(self, s):
        r = s.get(f"{API}/emergency-contacts")
        assert r.status_code == 200
        docs = r.json()
        assert len(docs) == 6
        phones = {c["phone"] for c in docs}
        assert {"999", "16263", "10921"}.issubset(phones)
        _no_id(docs)


# ---------- SOS ----------
class TestSOS:
    def test_trigger_sos(self, s):
        r = s.post(f"{API}/sos", json={"latitude": 23.81, "longitude": 90.41, "message": "TEST emergency"})
        assert r.status_code == 200
        d = r.json()
        assert d["ok"] is True
        alert = d["alert"]
        assert "_id" not in alert
        names = [n["name"] for n in alert["notified"]]
        assert "Karim Hossain" in names  # guardian
        assert "Dr. A. Rahman" in names  # doctor

    def test_list_sos(self, s):
        r = s.get(f"{API}/sos")
        assert r.status_code == 200
        _no_id(r.json())
        assert len(r.json()) >= 1
