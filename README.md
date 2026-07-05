# Medify PRO - AI-Powered Smart Healthcare Assistant

**বুদ্ধিমান স্বাস্থ্যসেবা সহায়ক | AI-Powered Healthcare for Everyone**

Medify is a production-ready, AI-powered healthcare web application built with Next.js. It helps elderly patients, chronic disease patients, and their families manage medicines, scan prescriptions, get AI medical advice, find hospitals, and send emergency SOS alerts — all in Bengali and English.

## ✨ Features

| Feature | Description |
|---|---|
| **🤖 AI Medical Assistant** | Bilingual (BN/EN) AI chat using OpenRouter with multi-model fallback |
| **📷 Prescription Scanner** | OCR-powered prescription scanning with AI extraction |
| **💊 Medicine Management** | Schedule, reminders, taken/skipped logging with adherence tracking |
| **🏥 Hospital Finder** | GPS-based nearby hospitals, diagnostics, pharmacies |
| **🆘 SOS Emergency** | One-tap emergency alert with location sharing |
| **📊 Health Records** | Track BP, sugar, weight, heart rate, lab reports |
| **📅 Appointments** | Book and manage doctor appointments |
| **🛡️ Drug Interaction Checker** | AI-powered medication safety analysis |
| **🥗 Lifestyle Hub** | Diet planning, water tracker, exercise logging |
| **👨‍👩‍👧 Guardian Dashboard** | Monitor family members' health and adherence |
| **👨‍⚕️ Doctor Dashboard** | Patient lists, appointments, communication |
| **🌙 Dark/Light Mode** | Full theme support with system-aware toggle |
| **🔊 Accessibility-First** | Large text (18px+), 56px touch targets, Bangla-first UI |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- OpenRouter API key (free at [openrouter.ai](https://openrouter.ai/keys))

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.local .env
# Edit .env with your database URL and API keys

# 3. Push database schema
npx prisma db push

# 4. Seed demo data
npx prisma db seed

# 5. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Required Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `AUTH_SECRET` | ✅ | NextAuth secret (run `npx auth secret` to generate) |
| `OPENROUTER_API_KEY` | ❌ | OpenRouter API key for AI features (free) |

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (Turbopack) |
| **Language** | TypeScript |
| **Typography** | Work Sans (headings), DM Sans (body) |
| **Styling** | Tailwind CSS v4 + Shadcn UI |
| **Database** | PostgreSQL + Prisma 7 |
| **Auth** | Auth.js (NextAuth v5) |
| **AI** | OpenRouter API (DeepSeek, Qwen, Llama, Gemma) |
| **Animations** | Framer Motion |
| **Icons** | Lucide React |

## 📁 Project Structure

```
src/
├── app/
│   ├── (dashboard)/   # Protected dashboard pages (14 screens)
│   ├── auth/          # Login & Register
│   ├── api/           # All API routes (20 endpoints)
│   └── page.tsx       # Landing page
├── components/
│   ├── ui/            # 30+ Shadcn UI components
│   ├── layout/        # Sidebar, top bar, mobile nav
│   └── medical/       # Medical-specific dialogs
├── lib/
│   ├── auth.ts        # Auth.js configuration
│   ├── auth.config.ts # Middleware auth config
│   └── db/prisma.ts   # Prisma client singleton
└── types/
    ├── index.ts       # All TypeScript types
    └── next-auth.d.ts # Auth type declarations
```

## 🚢 Deployment

### One-Click Vercel Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/TheSamsAlif/Medify-PRO)

### Manual Production Build

```bash
npm run build    # Build for production
npm start        # Start production server
```

## 📄 License

MIT &copy; 2026 Medify. Built with care for everyone.
