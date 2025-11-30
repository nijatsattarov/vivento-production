#!/bin/bash

# BU FAYILI RUN EDIN - TEK KOMANDA!

echo "🚀 Vivento Production - GitHub Push"
echo ""
echo "Git hazırdır! İndi push edirəm..."
echo ""

cd /app

# Force push - köhnə history overwrite olacaq
git push -u origin main --force

echo ""
echo "✅ Push tamamlandı!"
echo ""
echo "🔥 İNDİ BU ADDIMLAR:"
echo "1. Render.com → Environment variables əlavə et"
echo "2. Netlify → Environment variables əlavə et"
echo "3. Hər ikisində deploy et"
echo ""
echo "Environment variables-ı /app/QUICK_DEPLOY_SUMMARY.md-də tapa bilərsiniz"
