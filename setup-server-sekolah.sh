#!/usr/bin/env bash
# ==============================================================================
# Script Instalasi Otomatis Server Sekolah — JN ExamCBTCore (SQLite WAL Mode)
# Jalankan script ini setelah `git clone` / `git pull` di Komputer Server Sekolah
# ==============================================================================

set -e
cd "$(dirname "$0")"

echo "================================================================="
echo "  🏫 INSTALASI SERVER SEKOLAH — JN ExamCBTCore (4 Marhalah)      "
echo "  Engine Database: SQLite 3 (Write-Ahead Logging / WAL Mode)     "
echo "================================================================="
echo ""

echo "[1/4] Memeriksa Node.js & Python3 SQLite..."
node -v
python3 -c "import sqlite3; print('SQLite Engine Ready:', sqlite3.sqlite_version)"

echo ""
echo "[2/4] Menginstal paket dependensi aplikasi (npm install)..."
npm install

echo ""
echo "[3/4] Menginisialisasi Database Lokal SQLite (database/jn_cbt_server.sqlite)..."
chmod +x server/sqlite_engine.py jalankan.sh
python3 server/sqlite_engine.py status

echo ""
echo "[4/4] Mem-build aset produksi (npm run build)..."
npm run build

LAN_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")

echo ""
echo "================================================================="
echo "  ✅ INSTALASI SERVER SEKOLAH SELESAI!                           "
echo "  File Database : $(pwd)/database/jn_cbt_server.sqlite           "
echo "  Cara Menjalankan Server Ujian:                                 "
echo "    ./jalankan.sh                                                "
echo "  Akses dari Komputer/HP Santri di Jaringan LAN/Wi-Fi Sekolah:   "
echo "    http://${LAN_IP}:5174                                        "
echo "================================================================="
