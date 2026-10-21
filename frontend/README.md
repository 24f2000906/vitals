# VITALS frontend

Next.js 16 (App Router) · Tailwind CSS v4 · Framer Motion · Radix primitives (shadcn-style) · react-hook-form + zod · next-themes.

## Run

```bash
npm install
cp .env.example .env.local     # NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
npm run dev                    # http://localhost:3000
```

Start the backend first (see `vitals-backend/README.md`). Sample lab PDFs for testing are in `vitals-backend/samples/`.

## Routes

| Route | What it does |
|---|---|
| `/auth/signup` | Email (live format + availability check), password with strength meter, confirm |
| `/auth/setup` | Two-step slide wizard: your details, then a dynamic list of family members |
| `/auth/signin` | Sign in, "Forgot password?" modal (email, then OTP + new password) |
| `/dashboard` | Metric cards built from extracted lab values, draggable recent uploads, "Ask" widget with guardrails |
| `/report` | Master health report: sticky horizontal timeline driven by vertical scroll |
| `/documents` | Drag-and-drop upload (PDF, PNG, JPG, WEBP), status-tagged grid, viewer with original beside extracted JSON |

The sidebar collapses on desktop and becomes a slide-in drawer on mobile. Picking a family member in it switches every page to that person.

## Notes

- Sessions: tokens are kept in `localStorage` and refreshed automatically on a 401. For stricter security, move them to httpOnly cookies behind a Next.js route handler.
- The metric cards and report show only what the backend extracted. Empty states appear until a report with HbA1c, blood pressure or cholesterol is uploaded.
- The "Ask" widget runs `lib/assistant.ts`, a preview responder that reads back the latest values and applies the emergency check and disclaimer. Swap its body for your LLM endpoint.
- Brand tokens live at the top of `src/app/globals.css`. Dark mode is its own palette, and status colours (green, amber, red) are separate from the sage brand colour.
- Fonts (Bricolage Grotesque, Figtree) load through `next/font/google`, so the first build needs internet access.
