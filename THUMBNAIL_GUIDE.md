# Dəvətnamə Thumbnail Yükləmə Qaydası

## Thumbnail Ölçüsü (ÇOX VACİB!)

**Dəqiq Ölçü: 400x600 piksel**
- Genişlik: 400px
- Hündürlük: 600px
- Aspect Ratio: 2:3 (portrait)
- Format: JPG, PNG, WEBP
- Maksimum ölçü: 10MB

## Necə Thumbnail Hazırlamaq?

### Variant 1: Photoshop/Canva
1. Yeni layihə yarat: 400x600px
2. Dəvətnamə dizaynını import et
3. Tam səhifəni göstərmək üçün scale et
4. Export et: JPG və ya PNG

### Variant 2: Screenshot
1. Dəvətnamə dizaynını tam ekranda aç
2. Screenshot götür
3. Online tool ilə resize et: 400x600px
   - https://www.iloveimg.com/resize-image
   - https://www.img2go.com/resize-image

## Admin Panel-də Yükləmə

1. Admin Panel → Şablon Ayarları
2. "Thumbnail Yüklə" düyməsinə klik
3. 400x600px şəkli seç
4. Önizləmədə yoxla - TAM görünməlidir
5. "Yadda Saxla"

## Nümunə Thumbnail Ölçüləri

✅ DÜZGÜN:
- 400x600px (exact)
- 800x1200px (2x, auto-scale ediləcək)
- 200x300px (0.5x, auto-scale ediləcək)

❌ SƏHV:
- 500x500px (square - kəsiləcək)
- 1920x1080px (landscape - kəsiləcək)
- 300x400px (yanlış ratio)

## Cloudinary Auto-Optimize

Yüklənən thumbnail-lar Cloudinary tərəfindən avtomatik optimize edilir:
- Format conversion (WebP)
- Quality compression
- CDN delivery

## Produksiya Environment Variables

Render.com-da:
```
CLOUDINARY_CLOUD_NAME=dqdbh94e2
CLOUDINARY_API_KEY=461486386445189
CLOUDINARY_API_SECRET=VccwvlRUYBHMjcBFNOMx2pvsFGs
```