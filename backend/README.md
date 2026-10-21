# VITALS backend

FastAPI + async SQLAlchemy. SQLite by default, PostgreSQL-ready (`postgresql+asyncpg://...`).

## Run

```bash
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                # set SECRET_KEY
uvicorn app.main:app --reload --port 8000
```

Interactive docs: http://localhost:8000/docs. Tables are created on startup (use Alembic for production migrations).

## Endpoints (`/api/v1`)

| Method | Path | Notes |
|---|---|---|
| POST | `/auth/signup` | Unique email check, returns a 60-minute `setup_token` |
| GET | `/auth/email-available?email=` | Powers the live check on the signup form |
| POST | `/auth/setup` | Bearer setup token. Saves profile + batch-creates family members, returns access + refresh tokens |
| POST | `/auth/login` | Returns `access_token`, `refresh_token`, `user` |
| POST | `/auth/refresh` | Exchanges a refresh token for a new pair |
| GET | `/auth/me` | Current user |
| POST | `/auth/forgot-password/request-otp` | Simulated email: code is logged to the server console. With `DEBUG=true` it is also returned as `dev_otp` |
| POST | `/auth/forgot-password/verify-reset` | 6-digit OTP, 10-minute expiry, 5 attempts |
| GET / POST | `/family/members` | List / add a family member |
| POST | `/documents/upload` | `multipart/form-data`: `file` (PDF, PNG, JPG, WEBP, max 20 MB), optional `member_id`, `title` (defaults to the file name), `document_type` (`prescription` \| `lab_report` \| `discharge_summary` \| `other`, default `lab_report`). Owner comes from the access token |
| GET | `/documents/all?member_id=` | Documents for the account and its family |
| GET | `/documents/{id}/file` | Original file streamed through the API (auth required) |
| GET | `/documents/{id}/view` | `{view_url, file_mime_type}`: signed Cloudinary link, expires in 15 min |
| GET | `/documents/{id}/download` | `{download_url}`: signed Cloudinary link, forces download, expires in 5 min |
| DELETE | `/documents/{id}` | Permanent delete: ChromaDB vectors, then the Cloudinary asset, then the database row |

Document ids are UUID strings. Other users' documents return 404.

## Storage

Original PDFs and images are stored in **Cloudinary** as private (`authenticated`) assets: they have no public URL and are only reachable through API-signed, expiring links. Metadata lives in the database and text chunks (500 chars, 50 overlap) in ChromaDB (`./chroma_db`).

Setup (once):

1. Create a free account at https://cloudinary.com and open the Dashboard to find your **Cloud name**, **API key** and **API secret**.
2. Add them to `backend/.env` (see `.env.example`):
   ```
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   ```
3. `pip install -r requirements.txt`, restart the backend, upload a file from `samples/`.

Without these keys the rest of the app works and uploads return a 503 saying the keys are missing. Files are stored under `vitals/users/{user_id}/{doc_id}/{name}` (change the `vitals` prefix with `CLOUDINARY_FOLDER`). The UI previews a document through `GET /documents/{id}/file` (the API fetches it from Cloudinary behind the user's login); Download uses `GET /documents/{id}/download`.

Limits: Cloudinary's free plan caps image/PDF uploads at 10 MB, which is the default `MAX_UPLOAD_MB`; raise both together on a paid plan. If PDFs come back blocked, check Cloudinary's security settings for PDF delivery.

Notes: the first indexed upload downloads Chroma's default embedding model (needs internet once). Images and scans have no text layer, so they are stored but not indexed. If you have an older dev `vitals.db`, delete it (the `documents` table changed shape); for an existing Postgres database run `migrations/002_*.sql`.

Tests: `pip install -r requirements-dev.txt && pytest -q` (Cloudinary's network calls are faked, URL signing and Chroma are real).

## How uploads are parsed

File type is detected from magic bytes, not the client's header. PDFs with a text layer are scanned for HbA1c, blood pressure, total cholesterol and LDL, and values outside typical reference ranges produce `flags` (document status `Flagged`). Images and scanned PDFs have no text layer, so they get metadata only; add an OCR engine in `app/services/parser.py` to read them. The flag thresholds are screening hints, not diagnoses.

`samples/` has two synthetic lab reports you can upload to try the flow.

## Before production

- Set a strong `SECRET_KEY` and `DEBUG=false`.
- Replace the logged OTP in `routers/auth.py` with a real email provider.
- Keep the Cloudinary API secret out of git, and review Cloudinary's data-processing terms before storing real patient records.
- Add rate limiting on `/auth/*` and Alembic migrations.
