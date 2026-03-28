# Branch 57: `feature/cloudinary-integration` — Cloudinary CDN for Image Uploads

**Date:** 2026-03-28

## What Was Built

Integrated Cloudinary as the CDN and image upload service for product media. The integration is optional — if Cloudinary credentials are not configured, uploads fall back to local disk storage (existing behavior).

## How It Works

### Upload Flow
1. Seller uploads an image via `POST /api/v1/seller/products/:id/media`
2. Multer stores the file temporarily on disk
3. `uploadToCloudinary()` uploads the temp file to Cloudinary CDN
4. Cloudinary returns a `secure_url` (e.g., `https://res.cloudinary.com/your-cloud/image/upload/...`)
5. The Cloudinary URL is saved to `ProductMedia.filePath` in the database
6. The temp file is deleted
7. Frontend displays the image via `next/image` with Cloudinary's auto-optimized URL

### Cloudinary Features Used
- **Auto-format:** Serves WebP/AVIF based on browser support
- **Auto-quality:** Adjusts compression based on content
- **Max dimensions:** Images capped at 1200x1200 pixels
- **Folder organization:** `crochet-hub/products/{productId}/`

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CLOUDINARY_CLOUD_NAME` | No | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | No | API key from Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | No | API secret from Cloudinary dashboard |

**All optional** — if not set, uploads use local disk storage.

## Setup Instructions

1. Sign up at [cloudinary.com](https://cloudinary.com) (free — 25GB storage, 25GB bandwidth/month)
2. Go to Dashboard → copy Cloud Name, API Key, API Secret
3. Add to `.env` (local) or Render environment variables (production)
4. Restart the API server

## Files Created/Modified

| File | Change |
|------|--------|
| `apps/api/src/config/cloudinary.ts` | NEW — Cloudinary config, upload, delete functions |
| `apps/api/src/config/env.ts` | Added CLOUDINARY_* env vars (optional) |
| `apps/api/src/routes/seller.routes.ts` | Updated media upload to use Cloudinary, clean up temp files |
| `apps/web/next.config.ts` | Added `res.cloudinary.com` to image remote patterns |
| `.env.example` | Added Cloudinary env vars |
| `render.yaml` | Added Cloudinary env var placeholders |

## How to Verify

```bash
# Without Cloudinary (local fallback)
curl -X POST http://localhost:4000/api/v1/seller/products/{id}/media \
  -H "Authorization: Bearer {token}" \
  -F "file=@test-image.jpg"
# Returns: { filePath: "uploads/abc123" }

# With Cloudinary configured
# Returns: { filePath: "https://res.cloudinary.com/your-cloud/image/upload/..." }
```
