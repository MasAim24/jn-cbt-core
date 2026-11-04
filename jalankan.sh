#!/usr/bin/env bash
# ==============================================================================
# Script Menjalankan Server Ujian JN ExamCBTCore (SQLite WAL + LAN Server)
# ==============================================================================

export PATH="/home/masaim/snap/antigravity-cli/common/local/bin:$PATH"

cd "$(dirname "$0")"

chmod +x server/sqlite_engine.py 2>/dev/null || true
python3 server/sqlite_engine.py status >/dev/null 2>&1 || true

LAN_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")

echo "================================================================="
echo "  🚀 MEMULAI SERVER UJIAN JN ExamCBTCore (SQLite WAL Aktif)      "
echo "  Jenjang: MTs • Madrasah Aliyah • PDF Wustho • Ma'had 'Ulya     "
echo "================================================================="
echo ""
echo "  📌 Akses Lokal (PC Admin) : http://localhost:5174"
echo "  🌐 Akses Jaringan LAN     : http://${LAN_IP}:5174"
echo "  🗄️  Database SQLite Lokal  : database/jn_cbt_server.sqlite"
echo ""

npm run dev -- --host --port 5174
