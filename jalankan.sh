#!/usr/bin/env bash
# ==============================================================================
# Script Menjalankan Aplikasi JN ExamCBTCore (MTs, Aliyah, Wustho, 'Ulya)
# ==============================================================================

export PATH="/home/masaim/snap/antigravity-cli/common/local/bin:$PATH"

cd "$(dirname "$0")"

echo "=========================================================="
echo "  🚀 MEMULAI JN ExamCBTCore — Sistem Ujian CBT Terpadu    "
echo "  Jenjang: MTs • Madrasah Aliyah • Wustho • 'Ulya         "
echo "=========================================================="
echo ""
echo "Aplikasi dapat diakses di: http://localhost:5174"
echo ""

npm run dev -- --host --port 5174
