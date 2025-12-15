#!/usr/bin/env python3
"""
Setup script to create initial pages in production MongoDB
Run this on Render.com or locally pointing to production DB
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import os
from dotenv import load_dotenv

load_dotenv()

async def setup_pages():
    # Connect to MongoDB
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'test_database')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print(f"Connected to MongoDB: {db_name}")
    
    # Privacy Policy Content
    privacy_content = """<h1>Vivento - Məxfilik Siyasəti</h1><p><strong>Son yenilənmə tarixi: 01.12.2025</strong></p><h2>📌 1. Məxfilik Siyasəti</h2><h3>1.1. Toplanan məlumatlar</h3><p>MyVivento istifadəçilərdən və qonaqlardan aşağıdakı məlumatları toplaya bilər:</p><ul><li>Ad, soyad</li><li>Telefon nömrəsi</li><li>E-poçt ünvanı</li><li>Tədbir haqqında məlumat (tarix, məkan, qonaq siyahısı və s.)</li><li>RSVP cavabları</li><li>Qonaqların qeyd etdiyi əlavə qeydlər və mesajlar</li><li>Ödəniş məlumatları (yalnız ödəniş təminatçısı vasitəsilə)</li><li>Texniki məlumatlar: IP ünvanı, brauzer tipi, cihaz növü və s.</li></ul><h3>1.2. Məlumatların istifadə məqsədi</h3><p>Toplanan məlumatlar aşağıdakı məqsədlərlə istifadə olunur:</p><ul><li>Rəqəmsal dəvətnamələrin yaradılması və idarə olunması</li><li>RSVP cavablarının toplanması və emalı</li><li>MyVivento xidmətlərinin təkmilləşdirilməsi</li><li>İstifadəçi dəstəyi</li><li>Təhlükəsizlik və fırıldaqçılığın qarşısının alınması</li><li>Xidmətlə bağlı bildirişlərin göndərilməsi</li></ul><h3>1.3. Məlumatların üçüncü tərəflərlə paylaşılması</h3><p>MyVivento istifadəçi məlumatlarını heç bir halda üçüncü tərəflərə satmır. Məlumatlar aşağıdakı hallarda paylaşılır:</p><ul><li>Ödəniş təminatçıları ilə (yalnız ödənişin icrası üçün)</li><li>Hüquq-mühafizə orqanları ilə (yalnız qanun tələb edərsə)</li><li>Analitika və texniki xidmət təminatçıları ilə (məxfilik şərtləri daxilində)</li></ul><h3>1.4. Məlumatların saxlanması</h3><p>Məlumatlar yalnız xidmət göstərmək və hüquqi tələbləri yerinə yetirmək üçün lazım olduğu müddətdə saxlanılır.</p><h3>1.5. Kukilər (Cookies)</h3><p>MyVivento aşağıdakı kuki növlərindən istifadə edə bilər:</p><ul><li>Sessiya kukiləri</li><li>Analitika kukiləri</li><li>Funksional kukilər</li></ul><p>İstifadəçilər kukiləri istənilən vaxt brauzer ayarlarından deaktiv edə bilər.</p><h3>1.6. İstifadəçi hüquqları</h3><p>İstifadəçilər aşağıdakı hüquqlara malikdir:</p><ul><li>Məlumatlarına çıxış</li><li>Düzəliş və yenilənmə</li><li>Silinmə (\"Unudulma hüququ\")</li><li>Məhdudlaşdırma</li><li>Məlumatların başqa xidmətə keçirilməsi</li></ul><h3>1.7. Təhlükəsizlik</h3><p>MyVivento məlumatların qorunması üçün SSL şifrələməsi və digər təhlükəsizlik standartlarından istifadə edir.</p><h3>Əlaqə</h3><p>E-poçt: support@myvivento.com<br>Sayt: <a href="https://myvivento.com">https://myvivento.com</a><br>Telefon: +994 99 730 94 86</p>"""
    
    # Terms Content
    terms_content = """<h1>Vivento - İstifadə Şərtləri</h1><p><strong>Son yenilənmə tarixi: 01.12.2025</strong></p><h2>📌 2. İstifadə Şərtləri</h2><h3>2.1. Qəbul etmə</h3><p>MyVivento.com saytına daxil olmaqla və platformadan istifadə etməklə bu şərtləri qəbul etmiş olursunuz.</p><h3>2.2. Xidmətin təsviri</h3><p>MyVivento aşağıdakı xidmətləri təqdim edir:</p><ul><li>Rəqəmsal dəvətnamələrin hazırlanması</li><li>Tədbir səhifələrinin yaradılması</li><li>RSVP toplama və qonaq siyahısı idarəetməsi</li><li>Qonaqlara bildiriş göndərmə</li></ul><h3>2.3. İstifadəçinin öhdəlikləri</h3><p>İstifadəçi:</p><ul><li>Doğru məlumat təqdim etməlidir</li><li>Platformadan qanunsuz məqsədlərlə istifadə etməməlidir</li><li>Başqa şəxslərin məlumatlarını icazəsiz paylaşmamalıdır</li><li>Hesab təhlükəsizliyini qorumağa məsuldur</li></ul><h3>2.4. Qadağan olunan fəaliyyətlər</h3><ul><li>Fırıldaqçılıq məqsədilə istifadə</li><li>Spam və kütləvi göndərişlər</li><li>Sistemə icazəsiz müdaxilə cəhdləri</li><li>Başqa istifadəçilərin məlumatlarının icazəsiz istifadəsi</li></ul><h3>2.5. Ödənişlər və qaytarılma</h3><p>Ödənişli xidmətlər üçün qiymətlər saytda göstərilir. Ödənişlər üçüncü tərəf ödəniş təminatçısı vasitəsilə həyata keçirilir. Qaytarılma şərtləri ayrıca "Qaytarılma siyasəti" sənədi ilə tənzimlənir.</p><h3>2.6. Xidmətə dəyişikliklər</h3><p>MyVivento istənilən zaman:</p><ul><li>Xidmət funksiyalarını genişləndirə və ya dəyişə bilər</li><li>Şərtləri yeniləyə bilər (istifadəçilərə əvvəlcədən bildiriləcək)</li></ul><h3>2.7. Hesabın silinməsi</h3><p>İstifadəçi hesabını istənilən vaxt silə bilər. Hesab silindikdən sonra bəzi məlumatlar hüquqi məqsədlərlə saxlanıla bilər.</p><h3>2.8. Zəmanət verilməməsi</h3><p>MyVivento xidmətlərinin fasiləsiz işləyəcəyinə 100% zəmanət vermir, lakin texniki stabilliyi daim qorumağa çalışır.</p><h3>2.9. Hüquqi məsuliyyətin məhdudlaşdırılması</h3><p>Platforma aşağıdakılara görə məsuliyyət daşımır:</p><ul><li>İstifadəçinin məlumatları səhv təqdim etməsi</li><li>Qonaqların RSVP cavablarının doğruluğu</li><li>Üçüncü tərəf xidmətlərində yaranan problemlər</li></ul><h3>2.10. Əlaqə</h3><p>Sual və müraciətlər üçün:</p><p>E-poçt: support@myvivento.com<br>Sayt: <a href="https://myvivento.com">https://myvivento.com</a><br>Telefon: +994 99 730 94 86</p><h3>📌 3. Qəbul bildirişi</h3><p>MyVivento.com saytından istifadə etməklə bu sənəddə göstərilən Məxfilik Siyasəti və İstifadə Şərtlərini qəbul etmiş olursunuz.</p>"""
    
    # Contact Page Content
    contact_content = """<h1>Bizimlə Əlaqə</h1><p>Suallarınız və ya təklifləriniz üçün bizimlə əlaqə saxlayın.</p><h3>Əlaqə Məlumatları</h3><p><strong>E-poçt:</strong> support@myvivento.com</p><p><strong>Telefon:</strong> +994 99 730 94 86</p><p><strong>Ünvan:</strong> Bakı, Azərbaycan</p><p><strong>İş saatları:</strong> Bazar ertəsi - Cümə, 09:00 - 18:00</p><h3>Texniki Dəstək</h3><p>Texniki problemlər və ya suallar üçün bizimlə əlaqə saxlayın. Komandamız ən qısa zamanda sizə cavab verəcək.</p>"""
    
    # Pages to create
    pages = [
        {
            "slug": "privacy",
            "title": "Məxfilik Siyasəti",
            "content": privacy_content,
            "meta_description": "Vivento Məxfilik Siyasəti - Şəxsi məlumatlarınızın qorunması və istifadəsi haqqında",
            "published": True,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "slug": "terms",
            "title": "İstifadə Şərtləri",
            "content": terms_content,
            "meta_description": "Vivento İstifadə Şərtləri - Platformadan istifadə qaydaları",
            "published": True,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "slug": "contact",
            "title": "Əlaqə",
            "content": contact_content,
            "meta_description": "Vivento ilə əlaqə - Bizə yazın",
            "published": True,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
    ]
    
    # Insert or update pages
    for page in pages:
        existing = await db.pages.find_one({"slug": page["slug"]})
        if existing:
            await db.pages.update_one(
                {"slug": page["slug"]},
                {"$set": page}
            )
            print(f"✅ Updated: {page['slug']} - {page['title']}")
        else:
            await db.pages.insert_one(page)
            print(f"✅ Created: {page['slug']} - {page['title']}")
    
    print("\n🎉 Pages setup complete!")
    client.close()

if __name__ == "__main__":
    asyncio.run(setup_pages())
