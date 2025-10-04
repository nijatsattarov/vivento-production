#!/usr/bin/env python3
"""
Elegant çiçək dizaynlı toy şablonunu Vivento-ya əlavə etmək üçün script
"""

import os
import sys
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import uuid

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'test_database')

# Yeni elegant toy şablonu
ELEGANT_WEDDING_TEMPLATE = {
    "id": str(uuid.uuid4()),
    "name": "Elegant Çiçək Toy Dəvətnaməsi",
    "category": "toy",
    "thumbnail_url": "https://customer-assets.emergentagent.com/job_voxcard/artifacts/cc7vhovp_image.png",
    "is_premium": False,
    "design_data": {
        "canvas": {
            "width": 400, 
            "height": 600, 
            "background": "#faf9f7",
            "backgroundImage": "https://customer-assets.emergentagent.com/job_voxcard/artifacts/cc7vhovp_image.png"
        },
        "elements": [
            {
                "id": "header-text",
                "type": "text",
                "content": "TOY MƏRASİMİMİZDƏ İŞTİRAKINIZI GÖZLƏYİRİK",
                "x": 30, "y": 40, "width": 340, "height": 60,
                "fontSize": 14, "fontFamily": "Playfair Display",
                "color": "#8B7355", "fontWeight": "400", 
                "textAlign": "center", "lineHeight": 1.2
            },
            {
                "id": "bride-groom-names",
                "type": "text", 
                "content": "GƏLİN ADI\n&\nKİŞİ ADI",
                "x": 50, "y": 180, "width": 300, "height": 120,
                "fontSize": 32, "fontFamily": "Playfair Display",
                "color": "#8B7355", "fontWeight": "400",
                "textAlign": "center", "lineHeight": 1.3
            },
            {
                "id": "save-date-label",
                "type": "text",
                "content": "TARİXİ QEYD EDİN",
                "x": 50, "y": 350, "width": 300, "height": 30,
                "fontSize": 12, "fontFamily": "Playfair Display", 
                "color": "#8B7355", "fontWeight": "300",
                "textAlign": "center", "letterSpacing": "2px"
            },
            {
                "id": "wedding-date",
                "type": "text",
                "content": "Cümə axşamı, 25 Dekabr 2024\n18:00",
                "x": 50, "y": 390, "width": 300, "height": 60,
                "fontSize": 18, "fontFamily": "Playfair Display",
                "color": "#8B7355", "fontWeight": "400", 
                "textAlign": "center", "lineHeight": 1.4
            },
            {
                "id": "location-icon",
                "type": "text", 
                "content": "📍",
                "x": 180, "y": 470, "width": 40, "height": 30,
                "fontSize": 20, "textAlign": "center"
            },
            {
                "id": "wedding-location",
                "type": "text",
                "content": "Toy məkanı ünvanı\nŞəhər, Rayon",
                "x": 50, "y": 500, "width": 300, "height": 50,
                "fontSize": 16, "fontFamily": "Playfair Display",
                "color": "#8B7355", "fontWeight": "300",
                "textAlign": "center", "lineHeight": 1.3
            },
            {
                "id": "decorative-element-1",
                "type": "shape",
                "shape": "flower",
                "x": 20, "y": 50, "width": 80, "height": 120,
                "color": "#D8BFD8", "opacity": 0.7
            },
            {
                "id": "decorative-element-2", 
                "type": "shape",
                "shape": "flower",
                "x": 300, "y": 450, "width": 80, "height": 120,
                "color": "#D8BFD8", "opacity": 0.7
            }
        ]
    },
    "created_at": datetime.now(timezone.utc)
}

async def add_elegant_template():
    """MongoDB-yə elegant toy şablonunu əlavə edir"""
    try:
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        
        # Şablonu əlavə et
        print("🌸 Elegant çiçək toy şablonu əlavə edilir...")
        result = await db.templates.insert_one(ELEGANT_WEDDING_TEMPLATE)
        
        print(f"✅ Şablon uğurla əlavə edildi! ID: {result.inserted_id}")
        print(f"📝 Şablon adı: {ELEGANT_WEDDING_TEMPLATE['name']}")
        print(f"🎨 Kateqoriya: {ELEGANT_WEDDING_TEMPLATE['category']}")
        print(f"💎 Premium: {'Bəli' if ELEGANT_WEDDING_TEMPLATE['is_premium'] else 'Xeyr'}")
        
        # Ümumi şablon sayını yoxla
        total_templates = await db.templates.count_documents({})
        print(f"📊 Ümumi şablon sayı: {total_templates}")
            
        client.close()
        
    except Exception as e:
        print(f"❌ Xəta baş verdi: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("🚀 Elegant toy şablonu əlavə edilir...")
    asyncio.run(add_elegant_template())
    print("🎉 Hazırdır! Şablon istifadəyə hazırdır.")