#!/usr/bin/env python3
"""
Vivento üçün əsas şablonları MongoDB-yə əlavə etməyə yarayan script.
Bu script ilk dəfə işə salarkən istifadə edilir.
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

# Əsas şablonlar
TEMPLATES = [
    {
        "id": str(uuid.uuid4()),
        "name": "Klassik Toy Dəvətnaməsi",
        "category": "toy",
        "thumbnail_url": "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=400&h=600&fit=crop&crop=center",
        "is_premium": False,
        "design_data": {
            "canvas": {"width": 400, "height": 600, "background": "#ffffff"},
            "elements": [
                {
                    "id": "title",
                    "type": "text",
                    "content": "Toy Mərasimi",
                    "x": 50, "y": 80, "width": 300, "height": 60,
                    "fontSize": 32, "fontFamily": "Space Grotesk",
                    "color": "#1f2937", "fontWeight": "bold", "textAlign": "center"
                },
                {
                    "id": "names",
                    "type": "text",
                    "content": "Gəlin və Kişi adları",
                    "x": 50, "y": 160, "width": 300, "height": 40,
                    "fontSize": 20, "fontFamily": "Inter",
                    "color": "#6b7280", "textAlign": "center"
                },
                {
                    "id": "date",
                    "type": "text",
                    "content": "Tədbir tarixi",
                    "x": 50, "y": 220, "width": 300, "height": 30,
                    "fontSize": 16, "fontFamily": "Inter",
                    "color": "#9ca3af", "textAlign": "center"
                },
                {
                    "id": "location",
                    "type": "text",
                    "content": "Tədbir yeri",
                    "x": 50, "y": 260, "width": 300, "height": 30,
                    "fontSize": 14, "fontFamily": "Inter",
                    "color": "#9ca3af", "textAlign": "center"
                }
            ]
        },
        "created_at": datetime.now(timezone.utc)
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Elegant Nişan Kartı",
        "category": "nişan",
        "thumbnail_url": "https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=400&h=600&fit=crop&crop=center",
        "is_premium": True,
        "design_data": {
            "canvas": {"width": 400, "height": 600, "background": "#fdf2f8"},
            "elements": [
                {
                    "id": "title",
                    "type": "text",
                    "content": "Nişan Mərasimi",
                    "x": 50, "y": 100, "width": 300, "height": 50,
                    "fontSize": 28, "fontFamily": "Space Grotesk",
                    "color": "#be185d", "fontWeight": "bold", "textAlign": "center"
                },
                {
                    "id": "decoration",
                    "type": "shape",
                    "shape": "heart",
                    "x": 175, "y": 170, "width": 50, "height": 50,
                    "color": "#f9a8d4"
                }
            ]
        },
        "created_at": datetime.now(timezone.utc)
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Rəngarəng Doğum Günü",
        "category": "doğum_günü",
        "thumbnail_url": "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=600&fit=crop&crop=center",
        "is_premium": False,
        "design_data": {
            "canvas": {"width": 400, "height": 600, "background": "#fef3c7"},
            "elements": [
                {
                    "id": "title",
                    "type": "text",
                    "content": "Doğum Günü Partisi! 🎉",
                    "x": 50, "y": 120, "width": 300, "height": 60,
                    "fontSize": 24, "fontFamily": "Space Grotesk",
                    "color": "#f59e0b", "fontWeight": "bold", "textAlign": "center"
                }
            ]
        },
        "created_at": datetime.now(timezone.utc)
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Peşəkar Korporativ",
        "category": "korporativ",
        "thumbnail_url": "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=600&fit=crop&crop=center",
        "is_premium": True,
        "design_data": {
            "canvas": {"width": 400, "height": 600, "background": "#f8fafc"},
            "elements": [
                {
                    "id": "title",
                    "type": "text",
                    "content": "Korporativ Tədbir",
                    "x": 50, "y": 100, "width": 300, "height": 50,
                    "fontSize": 26, "fontFamily": "Space Grotesk",
                    "color": "#1e40af", "fontWeight": "600", "textAlign": "center"
                }
            ]
        },
        "created_at": datetime.now(timezone.utc)
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Minimalist Ağ",
        "category": "toy",
        "thumbnail_url": "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=600&fit=crop&crop=center",
        "is_premium": False,
        "design_data": {
            "canvas": {"width": 400, "height": 600, "background": "#ffffff"},
            "elements": [
                {
                    "id": "title",
                    "type": "text",
                    "content": "Minimalist Dizayn",
                    "x": 50, "y": 200, "width": 300, "height": 40,
                    "fontSize": 22, "fontFamily": "Inter",
                    "color": "#374151", "fontWeight": "300", "textAlign": "center"
                }
            ]
        },
        "created_at": datetime.now(timezone.utc)
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Lüks Qızıl Toy",
        "category": "toy",
        "thumbnail_url": "https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?w=400&h=600&fit=crop&crop=center",
        "is_premium": True,
        "design_data": {
            "canvas": {"width": 400, "height": 600, "background": "#1f2937"},
            "elements": [
                {
                    "id": "title",
                    "type": "text",
                    "content": "Lüks Toy Mərasimi",
                    "x": 50, "y": 150, "width": 300, "height": 60,
                    "fontSize": 28, "fontFamily": "Space Grotesk",
                    "color": "#fbbf24", "fontWeight": "bold", "textAlign": "center"
                }
            ]
        },
        "created_at": datetime.now(timezone.utc)
    }
]

async def init_templates():
    """MongoDB-yə əsas şablonları əlavə edir"""
    try:
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        
        # Əvvəlki şablonları təmizləmək (ixtiyari)
        print("🧹 Köhnə şablonlar təmizlənir...")
        await db.templates.delete_many({})
        
        # Yeni şablonları əlavə et
        print("📝 Yeni şablonlar əlavə edilir...")
        result = await db.templates.insert_many(TEMPLATES)
        
        print(f"✅ {len(result.inserted_ids)} şablon uğurla əlavə edildi!")
        
        # Şablonları siyahıla
        print("\n📋 Əlavə edilmiş şablonlar:")
        for template in TEMPLATES:
            premium_badge = "🏆 Premium" if template["is_premium"] else "🆓 Pulsuz"
            print(f"  • {template['name']} ({template['category']}) - {premium_badge}")
            
        client.close()
        
    except Exception as e:
        print(f"❌ Xəta baş verdi: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("🚀 Vivento şablonları əlavə edilir...")
    asyncio.run(init_templates())
    print("🎉 Hazırdır! Şablonlar istifadəyə hazırdır.")