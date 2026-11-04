#!/usr/bin/env python3
"""
JN ExamCBTCore — Mesin Database Lokal SQLite (WAL Mode) untuk Server Sekolah
Menangani penyimpanan relasional ACID untuk Bank Soal, Jadwal, Santri Real,
Akun Pejabat/Guru (RBAC), Live Proctoring LAN, dan Rekap Nilai.
"""
import json
import os
import sqlite3
import sys
import time
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_DIR = os.path.join(BASE_DIR, "database")
DB_PATH = os.path.join(DB_DIR, "jn_cbt_server.sqlite")
SCHEMA_PATH = os.path.join(DB_DIR, "schema.sql")

LEGACY_DUMMY_STUDENT_IDS = {
    "std-mts-1",
    "std-mts-2",
    "std-mts-3",
    "std-ma-1",
    "std-ma-2",
    "std-wst-1",
    "std-wst-2",
    "std-uly-1",
    "std-uly-2",
}
LEGACY_DUMMY_TEACHER_IDS = {"tch-1", "tch-2", "tch-3", "tch-4"}
LEGACY_DUMMY_SUBMISSION_IDS = {"sub-01", "sub-02", "sub-03", "sub-04"}


def get_connection() -> sqlite3.Connection:
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=15.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    conn.execute("PRAGMA foreign_keys = ON;")
    if os.path.exists(SCHEMA_PATH):
        with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
            conn.executescript(f.read())
    return conn


def cmd_status() -> dict:
    conn = get_connection()
    cur = conn.cursor()
    journal_mode = cur.execute("PRAGMA journal_mode;").fetchone()[0]
    counts = {
        "packets": cur.execute("SELECT COUNT(*) FROM cbt_packets").fetchone()[0],
        "questions": cur.execute("SELECT COUNT(*) FROM cbt_questions").fetchone()[0],
        "schedules": cur.execute("SELECT COUNT(*) FROM cbt_schedules").fetchone()[0],
        "students": cur.execute("SELECT COUNT(*) FROM cbt_students").fetchone()[0],
        "teachers": cur.execute("SELECT COUNT(*) FROM cbt_teachers").fetchone()[0],
        "submissions": cur.execute("SELECT COUNT(*) FROM cbt_submissions").fetchone()[0],
        "settings": cur.execute("SELECT COUNT(*) FROM cbt_settings").fetchone()[0],
    }
    conn.close()
    size_bytes = os.path.getsize(DB_PATH) if os.path.exists(DB_PATH) else 0
    return {
        "ok": True,
        "engine": f"SQLite {sqlite3.sqlite_version} ({str(journal_mode).upper()} Mode)",
        "dbPath": "database/jn_cbt_server.sqlite",
        "sizeBytes": size_bytes,
        "sizeKb": round(size_bytes / 1024, 1),
        "counts": counts,
        "hasInitialData": counts["packets"] > 0 or counts["settings"] > 0,
        "timestamp": datetime.now().isoformat(),
    }


def cmd_load() -> dict:
    conn = get_connection()
    cur = conn.cursor()

    # Check if database has been seeded yet
    settings_row = cur.execute("SELECT * FROM cbt_settings WHERE id = 1").fetchone()
    packet_rows = cur.execute("SELECT * FROM cbt_packets").fetchall()

    if not settings_row and len(packet_rows) == 0:
        conn.close()
        return {"ok": True, "empty": True}

    settings = None
    if settings_row:
        settings = {
            "namaYayasan": settings_row["nama_yayasan"],
            "namaAplikasi": settings_row["nama_aplikasi"],
            "tahunAjaran": settings_row["tahun_ajaran"],
            "semester": settings_row["semester"],
            "alamat": settings_row["alamat"],
            "kota": settings_row["kota"],
            "kepalaMTs": settings_row["kepala_mts"],
            "kepalaMA": settings_row["kepala_ma"],
            "mudirWustho": settings_row["mudir_wustho"],
            "mudirUlya": settings_row["mudir_ulya"],
            "ketuaPanitia": settings_row["ketua_panitia"],
            "adminName": settings_row["admin_name"],
            "adminUsername": settings_row["admin_username"],
            "adminPassword": settings_row["admin_password"],
            "antiCheatFullscreen": bool(settings_row["anti_cheat_fullscreen"]),
            "antiCheatBlockTabSwitch": bool(settings_row["anti_cheat_block_tab_switch"]),
            "maxViolationsAllowed": int(settings_row["max_violations_allowed"]),
            "autoRotateTokenMinutes": int(settings_row["auto_rotate_token_minutes"]),
            "supabaseUrl": "",
            "supabaseAnonKey": "",
            "syncMode": "LOCAL_STORAGE",
        }

    # Load packets + questions
    packets = []
    for p in packet_rows:
        q_rows = cur.execute(
            "SELECT * FROM cbt_questions WHERE packet_id = ? ORDER BY nomor ASC",
            (p["id"],),
        ).fetchall()
        questions = []
        for q in q_rows:
            q_obj = {
                "id": q["id"],
                "nomor": int(q["nomor"]),
                "type": q["type"],
                "prompt": q["prompt"],
                "weight": int(q["weight"]),
            }
            if q["arabic_prompt"]:
                q_obj["arabicPrompt"] = q["arabic_prompt"]
            if q["kitab_reference"]:
                q_obj["kitabReference"] = q["kitab_reference"]
            if q["is_rtl"]:
                q_obj["isRtl"] = bool(q["is_rtl"])
            if q["media_image_url"]:
                q_obj["mediaImageUrl"] = q["media_image_url"]
            if q["media_audio_url"]:
                q_obj["mediaAudioUrl"] = q["media_audio_url"]
            if q["media_caption"]:
                q_obj["mediaCaption"] = q["media_caption"]
            if q["options_json"]:
                q_obj["options"] = json.loads(q["options_json"])
            if q["correct_answer"]:
                q_obj["correctAnswer"] = q["correct_answer"]
            if q["correct_answers_json"]:
                q_obj["correctAnswers"] = json.loads(q["correct_answers_json"])
            if q["correct_boolean"] is not None:
                q_obj["correctBoolean"] = bool(q["correct_boolean"])
            if q["essay_rubric"]:
                q_obj["essayRubric"] = q["essay_rubric"]
            if q["pembahasan"]:
                q_obj["pembahasan"] = q["pembahasan"]
            questions.append(q_obj)

        packets.append(
            {
                "id": p["id"],
                "code": p["code"],
                "title": p["title"],
                "mapel": p["mapel"],
                "jenjang": p["jenjang"],
                "kelas": p["kelas"],
                "guruNama": p["guru_nama"],
                "optionCount": int(p["option_count"]),
                "kkm": int(p["kkm"]),
                "hasArabicKitab": bool(p["has_arabic_kitab"]),
                "updatedAt": p["updated_at"],
                "questions": questions,
            }
        )

    # Load schedules + live_participants
    schedule_rows = cur.execute("SELECT * FROM cbt_schedules").fetchall()
    schedules = []
    for s in schedule_rows:
        lp_rows = cur.execute(
            "SELECT * FROM cbt_live_participants WHERE schedule_id = ?", (s["id"],)
        ).fetchall()
        live_participants = [
            {
                "studentId": lp["student_id"],
                "studentName": lp["student_name"],
                "nomorPeserta": lp["nomor_peserta"],
                "kelas": lp["kelas"],
                "status": lp["status"],
                "answeredCount": int(lp["answered_count"]),
                "totalQuestions": int(lp["total_questions"]),
                "remainingMinutes": int(lp["remaining_minutes"]),
                "violations": int(lp["violations"]),
                "ipAddress": lp["ip_address"],
                "lastActivity": lp["last_activity"],
            }
            for lp in lp_rows
        ]
        sch_obj = {
            "id": s["id"],
            "packetId": s["packet_id"],
            "packetTitle": s["packet_title"],
            "mapel": s["mapel"],
            "jenjang": s["jenjang"],
            "kelasTarget": s["kelas_target"],
            "tanggal": s["tanggal"],
            "waktuMulai": s["waktu_mulai"],
            "waktuSelesai": s["waktu_selesai"],
            "durasiMenit": int(s["durasi_menit"]),
            "token": s["token"],
            "ruang": s["ruang"],
            "pengawas": s["pengawas"],
            "status": s["status"],
            "acakSoal": bool(s["acak_soal"]),
            "acakOpsi": bool(s["acak_opsi"]),
            "totalPeserta": int(s["total_peserta"]),
            "hadirCount": int(s["hadir_count"]),
            "selesaiCount": int(s["selesai_count"]),
            "liveParticipants": live_participants,
        }
        if s["announcement"]:
            sch_obj["announcement"] = s["announcement"]
        schedules.append(sch_obj)

    # Load students
    student_rows = cur.execute("SELECT * FROM cbt_students").fetchall()
    students = [
        {
            "id": st["id"],
            "nomorPeserta": st["nomor_peserta"],
            "nisn": st["nisn"],
            "nama": st["nama"],
            "jenjang": st["jenjang"],
            "kelas": st["kelas"],
            "ruang": st["ruang"],
            "sesi": st["sesi"],
            "pin": st["pin"],
            "gender": st["gender"],
            "statusAktif": bool(st["status_aktif"]),
        }
        for st in student_rows
    ]

    # Load teachers
    teacher_rows = cur.execute("SELECT * FROM cbt_teachers").fetchall()
    teachers = [
        {
            "id": t["id"],
            "nip": t["nip"],
            "username": t["username"],
            "password": t["password"],
            "nama": t["nama"],
            "gelar": t["gelar"],
            "mapelAmpu": t["mapel_ampu"],
            "kelasBinaan": t["kelas_binaan"] if t["kelas_binaan"] else None,
            "jenjangAmpu": json.loads(t["jenjang_ampu_json"] or '["MTs"]'),
            "peran": t["peran"],
            "hakAkses": json.loads(t["hak_akses_json"] or '["dashboard"]'),
            "noHp": t["no_hp"],
            "statusAktif": bool(t["status_aktif"]),
        }
        for t in teacher_rows
    ]

    # Load submissions
    sub_rows = cur.execute("SELECT * FROM cbt_submissions").fetchall()
    submissions = []
    for sub in sub_rows:
        sub_obj = {
            "id": sub["id"],
            "scheduleId": sub["schedule_id"],
            "packetId": sub["packet_id"],
            "studentId": sub["student_id"],
            "studentName": sub["student_name"],
            "nomorPeserta": sub["nomor_peserta"],
            "jenjang": sub["jenjang"],
            "kelas": sub["kelas"],
            "mapel": sub["mapel"],
            "submittedAt": sub["submitted_at"],
            "durationUsedMinutes": int(sub["duration_used_minutes"]),
            "pgScore": int(sub["pg_score"]),
            "pgKompleksScore": int(sub["pg_kompleks_score"]),
            "benarSalahScore": int(sub["benar_salah_score"]),
            "esaiScore": int(sub["esai_score"]),
            "totalScore": int(sub["total_score"]),
            "kkm": int(sub["kkm"]),
            "isEsaiGraded": bool(sub["is_esai_graded"]),
            "violations": int(sub["violations"]),
        }
        if sub["essay_answer_sample"]:
            sub_obj["essayAnswerSample"] = sub["essay_answer_sample"]
        if sub["essay_question_prompt"]:
            sub_obj["essayQuestionPrompt"] = sub["essay_question_prompt"]
        if sub["item_responses_json"]:
            sub_obj["itemResponses"] = json.loads(sub["item_responses_json"])
        submissions.append(sub_obj)

    conn.close()
    return {
        "ok": True,
        "empty": False,
        "settings": settings,
        "packets": packets,
        "schedules": schedules,
        "students": students,
        "teachers": teachers,
        "submissions": submissions,
    }


def cmd_save(payload: dict) -> dict:
    conn = get_connection()
    cur = conn.cursor()
    now_iso = datetime.now().isoformat()

    try:
        cur.execute("BEGIN IMMEDIATE;")

        if "settings" in payload and payload["settings"]:
            s = payload["settings"]
            cur.execute(
                """
                INSERT INTO cbt_settings (
                  id, nama_yayasan, nama_aplikasi, tahun_ajaran, semester,
                  alamat, kota, kepala_mts, kepala_ma, mudir_wustho, mudir_ulya,
                  ketua_panitia, admin_name, admin_username, admin_password,
                  anti_cheat_fullscreen, anti_cheat_block_tab_switch,
                  max_violations_allowed, auto_rotate_token_minutes, updated_at
                ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                  nama_yayasan=excluded.nama_yayasan,
                  nama_aplikasi=excluded.nama_aplikasi,
                  tahun_ajaran=excluded.tahun_ajaran,
                  semester=excluded.semester,
                  alamat=excluded.alamat,
                  kota=excluded.kota,
                  kepala_mts=excluded.kepala_mts,
                  kepala_ma=excluded.kepala_ma,
                  mudir_wustho=excluded.mudir_wustho,
                  mudir_ulya=excluded.mudir_ulya,
                  ketua_panitia=excluded.ketua_panitia,
                  admin_name=excluded.admin_name,
                  admin_username=excluded.admin_username,
                  admin_password=excluded.admin_password,
                  anti_cheat_fullscreen=excluded.anti_cheat_fullscreen,
                  anti_cheat_block_tab_switch=excluded.anti_cheat_block_tab_switch,
                  max_violations_allowed=excluded.max_violations_allowed,
                  auto_rotate_token_minutes=excluded.auto_rotate_token_minutes,
                  updated_at=excluded.updated_at
                """,
                (
                    s.get("namaYayasan", ""),
                    s.get("namaAplikasi", "JN ExamCBTCore"),
                    s.get("tahunAjaran", "2026/2027"),
                    s.get("semester", "Ganjil"),
                    s.get("alamat", ""),
                    s.get("kota", ""),
                    s.get("kepalaMTs", ""),
                    s.get("kepalaMA", ""),
                    s.get("mudirWustho", ""),
                    s.get("mudirUlya", ""),
                    s.get("ketuaPanitia", ""),
                    s.get("adminName", "Administrator Utama CBT"),
                    s.get("adminUsername", "admin"),
                    s.get("adminPassword", "admin123"),
                    1 if s.get("antiCheatFullscreen", True) else 0,
                    1 if s.get("antiCheatBlockTabSwitch", True) else 0,
                    int(s.get("maxViolationsAllowed", 3)),
                    int(s.get("autoRotateTokenMinutes", 15)),
                    now_iso,
                ),
            )

        if "packets" in payload and isinstance(payload["packets"], list):
            cur.execute("DELETE FROM cbt_questions;")
            cur.execute("DELETE FROM cbt_packets;")
            for p in payload["packets"]:
                cur.execute(
                    """
                    INSERT INTO cbt_packets (
                      id, code, title, mapel, jenjang, kelas, guru_nama,
                      option_count, kkm, has_arabic_kitab, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        p["id"],
                        p.get("code", ""),
                        p.get("title", ""),
                        p.get("mapel", ""),
                        p.get("jenjang", "MTs"),
                        p.get("kelas", ""),
                        p.get("guruNama", ""),
                        int(p.get("optionCount", 4)),
                        int(p.get("kkm", 75)),
                        1 if p.get("hasArabicKitab") else 0,
                        p.get("updatedAt", now_iso),
                    ),
                )
                for q in p.get("questions", []):
                    cur.execute(
                        """
                        INSERT INTO cbt_questions (
                          id, packet_id, nomor, type, prompt, arabic_prompt,
                          kitab_reference, is_rtl, media_image_url, media_audio_url,
                          media_caption, options_json, correct_answer,
                          correct_answers_json, correct_boolean, essay_rubric,
                          weight, pembahasan
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            q["id"],
                            p["id"],
                            int(q.get("nomor", 1)),
                            q.get("type", "PG"),
                            q.get("prompt", ""),
                            q.get("arabicPrompt"),
                            q.get("kitabReference"),
                            1 if q.get("isRtl") else 0,
                            q.get("mediaImageUrl"),
                            q.get("mediaAudioUrl"),
                            q.get("mediaCaption"),
                            json.dumps(q["options"]) if q.get("options") else None,
                            q.get("correctAnswer"),
                            json.dumps(q["correctAnswers"])
                            if q.get("correctAnswers")
                            else None,
                            (1 if q["correctBoolean"] else 0)
                            if "correctBoolean" in q and q["correctBoolean"] is not None
                            else None,
                            q.get("essayRubric"),
                            int(q.get("weight", 25)),
                            q.get("pembahasan"),
                        ),
                    )

        if "schedules" in payload and isinstance(payload["schedules"], list):
            keep_sch_ids = [sch["id"] for sch in payload["schedules"] if "id" in sch]
            if keep_sch_ids:
                placeholders = ",".join("?" for _ in keep_sch_ids)
                cur.execute(
                    f"DELETE FROM cbt_live_participants WHERE schedule_id NOT IN ({placeholders});",
                    tuple(keep_sch_ids),
                )
                cur.execute(
                    f"DELETE FROM cbt_schedules WHERE id NOT IN ({placeholders});",
                    tuple(keep_sch_ids),
                )
            else:
                cur.execute("DELETE FROM cbt_live_participants;")
                cur.execute("DELETE FROM cbt_schedules;")
            for sch in payload["schedules"]:
                cur.execute(
                    """
                    INSERT OR REPLACE INTO cbt_schedules (
                      id, packet_id, packet_title, mapel, jenjang, kelas_target,
                      tanggal, waktu_mulai, waktu_selesai, durasi_menit, token,
                      ruang, pengawas, status, announcement, acak_soal, acak_opsi,
                      total_peserta, hadir_count, selesai_count
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        sch["id"],
                        sch.get("packetId", ""),
                        sch.get("packetTitle", ""),
                        sch.get("mapel", ""),
                        sch.get("jenjang", "MTs"),
                        sch.get("kelasTarget", ""),
                        sch.get("tanggal", ""),
                        sch.get("waktuMulai", ""),
                        sch.get("waktuSelesai", ""),
                        int(sch.get("durasiMenit", 90)),
                        sch.get("token", ""),
                        sch.get("ruang", ""),
                        sch.get("pengawas", ""),
                        sch.get("status", "LIVE"),
                        sch.get("announcement"),
                        1 if sch.get("acakSoal", True) else 0,
                        1 if sch.get("acakOpsi", True) else 0,
                        int(sch.get("totalPeserta", 0)),
                        int(sch.get("hadirCount", 0)),
                        int(sch.get("selesaiCount", 0)),
                    ),
                )
                for lp in sch.get("liveParticipants", []):
                    if lp.get("studentId") in LEGACY_DUMMY_STUDENT_IDS:
                        continue
                    cur.execute(
                        """
                        INSERT OR REPLACE INTO cbt_live_participants (
                          schedule_id, student_id, student_name, nomor_peserta,
                          kelas, status, answered_count, total_questions,
                          remaining_minutes, violations, ip_address, last_activity
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            sch["id"],
                            lp.get("studentId", ""),
                            lp.get("studentName", ""),
                            lp.get("nomorPeserta", ""),
                            lp.get("kelas", ""),
                            lp.get("status", "MENGERJAKAN"),
                            int(lp.get("answeredCount", 0)),
                            int(lp.get("totalQuestions", 0)),
                            int(lp.get("remainingMinutes", 0)),
                            int(lp.get("violations", 0)),
                            lp.get("ipAddress", "LAN"),
                            lp.get("lastActivity", "Baru saja"),
                        ),
                    )

        if "students" in payload and isinstance(payload["students"], list):
            cur.execute("DELETE FROM cbt_students;")
            for st in payload["students"]:
                if st.get("id") in LEGACY_DUMMY_STUDENT_IDS:
                    continue
                cur.execute(
                    """
                    INSERT OR REPLACE INTO cbt_students (
                      id, nomor_peserta, nisn, nama, jenjang, kelas,
                      ruang, sesi, pin, gender, status_aktif
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        st["id"],
                        st.get("nomorPeserta", ""),
                        st.get("nisn", ""),
                        st.get("nama", ""),
                        st.get("jenjang", "MTs"),
                        st.get("kelas", ""),
                        st.get("ruang", ""),
                        st.get("sesi", "Sesi 1 (Pagi)"),
                        st.get("pin", ""),
                        st.get("gender", "L"),
                        1 if st.get("statusAktif", True) else 0,
                    ),
                )

        if "teachers" in payload and isinstance(payload["teachers"], list):
            cur.execute("DELETE FROM cbt_teachers;")
            for t in payload["teachers"]:
                if t.get("id") in LEGACY_DUMMY_TEACHER_IDS:
                    continue
                cur.execute(
                    """
                    INSERT OR REPLACE INTO cbt_teachers (
                      id, nip, username, password, nama, gelar, mapel_ampu,
                      kelas_binaan, jenjang_ampu_json, peran, hak_akses_json,
                      no_hp, status_aktif
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        t["id"],
                        t.get("nip", ""),
                        t.get("username", t.get("nip", "")),
                        t.get("password", "guru123"),
                        t.get("nama", ""),
                        t.get("gelar", ""),
                        t.get("mapelAmpu", ""),
                        t.get("kelasBinaan"),
                        json.dumps(t.get("jenjangAmpu", ["MTs"])),
                        t.get("peran", "Guru Mapel"),
                        json.dumps(t.get("hakAkses", ["dashboard"])),
                        t.get("noHp", "-"),
                        1 if t.get("statusAktif", True) else 0,
                    ),
                )

        if "submissions" in payload and isinstance(payload["submissions"], list):
            if len(payload["submissions"]) == 0 and payload.get("forceClearSubmissions"):
                cur.execute("DELETE FROM cbt_submissions;")
            for sub in payload["submissions"]:
                if sub.get("id") in LEGACY_DUMMY_SUBMISSION_IDS:
                    continue
                cur.execute(
                    """
                    INSERT OR REPLACE INTO cbt_submissions (
                      id, schedule_id, packet_id, student_id, student_name,
                      nomor_peserta, jenjang, kelas, mapel, submitted_at,
                      duration_used_minutes, pg_score, pg_kompleks_score,
                      benar_salah_score, esai_score, total_score, kkm,
                      is_esai_graded, violations, essay_answer_sample,
                      essay_question_prompt, item_responses_json
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        sub["id"],
                        sub.get("scheduleId", ""),
                        sub.get("packetId", ""),
                        sub.get("studentId", ""),
                        sub.get("studentName", ""),
                        sub.get("nomorPeserta", ""),
                        sub.get("jenjang", "MTs"),
                        sub.get("kelas", ""),
                        sub.get("mapel", ""),
                        sub.get("submittedAt", ""),
                        int(sub.get("durationUsedMinutes", 0)),
                        int(sub.get("pgScore", 0)),
                        int(sub.get("pgKompleksScore", 0)),
                        int(sub.get("benarSalahScore", 0)),
                        int(sub.get("esaiScore", 0)),
                        int(sub.get("totalScore", 0)),
                        int(sub.get("kkm", 75)),
                        1 if sub.get("isEsaiGraded") else 0,
                        int(sub.get("violations", 0)),
                        sub.get("essayAnswerSample"),
                        sub.get("essayQuestionPrompt"),
                        json.dumps(sub["itemResponses"])
                        if sub.get("itemResponses")
                        else None,
                    ),
                )

        conn.commit()
    except Exception as exc:
        conn.rollback()
        conn.close()
        return {"ok": False, "error": str(exc)}

    conn.close()
    return cmd_status()


def cmd_event_push(event_obj: dict) -> dict:
    conn = get_connection()
    cur = conn.cursor()
    ts = int(event_obj.get("timestamp") or int(time.time() * 1000))
    ev_type = event_obj.get("type")

    try:
        cur.execute("BEGIN IMMEDIATE;")
        cur.execute(
            "INSERT INTO cbt_live_events (timestamp, payload_json) VALUES (?, ?)",
            (ts, json.dumps(event_obj)),
        )
        # Keep only last 250 events so table stays compact
        cur.execute(
            """
            DELETE FROM cbt_live_events
            WHERE id NOT IN (
              SELECT id FROM cbt_live_events ORDER BY id DESC LIMIT 250
            )
            """
        )

        # Atomic LAN persistence for student progress, exam submissions, and proctor resets
        if ev_type in ("STUDENT_PROGRESS", "STUDENT_SUBMITTED"):
            sch_id = event_obj.get("scheduleId") or ""
            pkt_id = event_obj.get("packetId") or ""
            lp = event_obj.get("participant") or {}
            if not sch_id and pkt_id:
                row_sch = cur.execute(
                    "SELECT id FROM cbt_schedules WHERE packet_id = ? LIMIT 1", (pkt_id,)
                ).fetchone()
                if row_sch:
                    sch_id = row_sch["id"]
            if sch_id and lp.get("studentId") and lp.get("studentId") not in LEGACY_DUMMY_STUDENT_IDS:
                cur.execute(
                    """
                    INSERT OR REPLACE INTO cbt_live_participants (
                      schedule_id, student_id, student_name, nomor_peserta,
                      kelas, status, answered_count, total_questions,
                      remaining_minutes, violations, ip_address, last_activity
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        sch_id,
                        lp.get("studentId", ""),
                        lp.get("studentName", ""),
                        lp.get("nomorPeserta", ""),
                        lp.get("kelas", ""),
                        lp.get("status", "MENGERJAKAN"),
                        int(lp.get("answeredCount", 0)),
                        int(lp.get("totalQuestions", 0)),
                        int(lp.get("remainingMinutes", 0)),
                        int(lp.get("violations", 0)),
                        lp.get("ipAddress", "LAN"),
                        lp.get("lastActivity", "Baru saja"),
                    ),
                )
                selesai_cnt = cur.execute(
                    "SELECT COUNT(*) AS c FROM cbt_live_participants WHERE schedule_id = ? AND status = 'SELESAI'",
                    (sch_id,),
                ).fetchone()["c"]
                hadir_cnt = cur.execute(
                    "SELECT COUNT(*) AS c FROM cbt_live_participants WHERE schedule_id = ? AND status != 'BELUM_LOGIN'",
                    (sch_id,),
                ).fetchone()["c"]
                cur.execute(
                    "UPDATE cbt_schedules SET selesai_count = ?, hadir_count = MAX(hadir_count, ?) WHERE id = ?",
                    (int(selesai_cnt), int(hadir_cnt), sch_id),
                )

        if ev_type == "STUDENT_SUBMITTED":
            sub = event_obj.get("submission") or {}
            if sub.get("id") and sub.get("id") not in LEGACY_DUMMY_SUBMISSION_IDS:
                cur.execute(
                    """
                    INSERT OR REPLACE INTO cbt_submissions (
                      id, schedule_id, packet_id, student_id, student_name,
                      nomor_peserta, jenjang, kelas, mapel, submitted_at,
                      duration_used_minutes, pg_score, pg_kompleks_score,
                      benar_salah_score, esai_score, total_score, kkm,
                      is_esai_graded, violations, essay_answer_sample,
                      essay_question_prompt, item_responses_json
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        sub["id"],
                        sub.get("scheduleId", ""),
                        sub.get("packetId", ""),
                        sub.get("studentId", ""),
                        sub.get("studentName", ""),
                        sub.get("nomorPeserta", ""),
                        sub.get("jenjang", "MTs"),
                        sub.get("kelas", ""),
                        sub.get("mapel", ""),
                        sub.get("submittedAt", ""),
                        int(sub.get("durationUsedMinutes", 0)),
                        int(sub.get("pgScore", 0)),
                        int(sub.get("pgKompleksScore", 0)),
                        int(sub.get("benarSalahScore", 0)),
                        int(sub.get("esaiScore", 0)),
                        int(sub.get("totalScore", 0)),
                        int(sub.get("kkm", 75)),
                        1 if sub.get("isEsaiGraded") else 0,
                        int(sub.get("violations", 0)),
                        sub.get("essayAnswerSample"),
                        sub.get("essayQuestionPrompt"),
                        json.dumps(sub["itemResponses"])
                        if sub.get("itemResponses")
                        else None,
                    ),
                )

        elif ev_type == "PROCTOR_ACTION" and event_obj.get("action") == "RESET_SUBMIT":
            pkt_id = event_obj.get("packetId") or ""
            sch_id = event_obj.get("scheduleId") or ""
            std_id = event_obj.get("studentId") or ""
            no_peserta = event_obj.get("nomorPeserta") or ""
            cur.execute(
                """
                DELETE FROM cbt_submissions
                WHERE (packet_id = ? OR schedule_id = ?)
                  AND (student_id = ? OR nomor_peserta = ?)
                """,
                (pkt_id, sch_id, std_id, no_peserta),
            )
            cur.execute(
                """
                UPDATE cbt_live_participants
                SET status = 'MENGERJAKAN', violations = 0, last_activity = 'Direset Pengawas'
                WHERE (schedule_id = ?) AND (student_id = ? OR nomor_peserta = ?)
                """,
                (sch_id, std_id, no_peserta),
            )

        conn.commit()
    except Exception:
        conn.rollback()
    conn.close()
    return {"ok": True, "timestamp": ts}


def cmd_event_poll(since_ts: int) -> dict:
    conn = get_connection()
    cur = conn.cursor()
    rows = cur.execute(
        "SELECT id, timestamp, payload_json FROM cbt_live_events WHERE timestamp > ? ORDER BY id ASC",
        (since_ts,),
    ).fetchall()
    events = [json.loads(r["payload_json"]) for r in rows]
    conn.close()
    return {"ok": True, "events": events}


def main():
    action = sys.argv[1] if len(sys.argv) > 1 else "status"
    if action == "status":
        print(json.dumps(cmd_status()))
    elif action == "load":
        print(json.dumps(cmd_load()))
    elif action == "save":
        raw = sys.stdin.read()
        data = json.loads(raw) if raw.strip() else {}
        print(json.dumps(cmd_save(data)))
    elif action == "event_push":
        raw = sys.stdin.read()
        data = json.loads(raw) if raw.strip() else {}
        print(json.dumps(cmd_event_push(data)))
    elif action == "event_poll":
        since = int(sys.argv[2]) if len(sys.argv) > 2 else 0
        print(json.dumps(cmd_event_poll(since)))
    else:
        print(json.dumps({"ok": False, "error": f"Unknown action: {action}"}))


if __name__ == "__main__":
    main()
