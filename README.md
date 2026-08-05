# Roadrunner Appliance Platform

A modern, AI-powered web platform for appliance sales, service, and inventory management. Designed for Roadrunner Inc. to streamline the buying and selling of used appliances.

## 🚀 Key Features

- **Storefront**: Browse high-quality used washers, dryers, refrigerators, and more.
- **Flood Engine (Inventory CRM)**: A powerful internal dashboard for employees to:
  - Add and manage inventory in real-time.
  - **AI Nameplate Analysis**: Scan appliance stickers using Gemini AI to auto-fill brand, model, and serial details.
  - **AI Grading**: Automatically assess unit condition and match with catalog data using computer vision.
  - **Pricing Engine**: Calculate optimal resale values based on age, MSRP, and condition.
- **Parts Intelligence Layer**: A multi-provider appliance parts catalog and BOM system:
  - **Part Finder** (`/tools/part-finder`): Search appliance parts by model number across multiple distributors.
  - **Parts Catalog** (`/tools/parts-catalog`): Browse and retrieve structured BOM data with distributor pricing.
  - **Diagnostic Tool** (`/tools/diagnostic`): AI-assisted symptom-to-part matching with evidence sourcing.
- **Seamless Database Sync**: Automatic synchronization between local dashboard state and the public website database (Drizzle + Neon).
- **Service & Leasing**: Direct access to appliance repair requests and leasing options.

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (React 19)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Database**: [Neon](https://neon.tech/) (Serverless Postgres)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **AI/ML**: [Google Gemini](https://ai.google.dev/) (`gemini-3-flash-preview` for reasoning/vision, `gemini-3.1-flash-lite-preview` for high-volume tasks)
- **Components**: [Radix UI](https://www.radix-ui.com/) + [Lucide Icons](https://lucide.dev/)
- **Analytics**: Vercel Analytics

## 📂 Project Structure

- `app/`: Next.js App Router pages and layouts.
- `app/employee/inventory/`: The "Flood Engine" internal dashboard.
- `app/tools/`: Public-facing appliance tools (part-finder, parts-catalog, diagnostic, fix, repair-vs-replace, etc.).
- `components/`: Reusable UI components shared across routes.
- `lib/flood-engine/`: Core logic for inventory AI, pricing engine, and grading hooks.
- `lib/tools/parts/`: Appliance BOM, multi-provider catalog, distributor adapters, and AI-assisted parts retrieval.
- `lib/ai/gemini-policy.js`: Central Gemini model routing and policy enforcement.
- `lib/db/`: Database connection and schema (Drizzle + Neon).
- `actions/`: Server actions for auth, bookings, and wholesale.
- `scripts/`: Utility scripts for data verification, migration, and maintenance.

## ⚙️ Setup & Development

### 1. Prerequisites
- Node.js (Latest LTS)
- PNPM or NPM

### 2. Environment Variables
Create a `.env.local` file in the root directory and add the following:
```env
# Database
DATABASE_URL=your_neon_postgres_connection_string

# AI Services
GEMINI_API_KEY=your_google_gemini_api_key
GOOGLE_GENERATIVE_AI_API_KEY=your_fallback_gemini_api_key  # fallback if GEMINI_API_KEY unset

# Optional: override AI model per task type (defaults shown)
PARTS_BOM_SEARCH_MODEL=gemini-3.1-flash-lite-preview
PARTS_SCHEMATIC_SEARCH_MODEL=gemini-3.1-flash-lite-preview
DIAGNOSIS_EVIDENCE_MODEL=gemini-3.1-flash-lite-preview
DIAGNOSIS_PART_SEARCH_MODEL=gemini-3.1-flash-lite-preview
PRICING_GROUNDED_SEARCH_MODEL=gemini-3.1-flash-lite-preview

# Feature Flags
ENABLE_GEMINI_SEARCH_FALLBACK=true  # enables AI search fallback in distributor gap-fill
```

### 3. Installation
```bash
npm install
```

### 4. Run Locally
```bash
npm run dev
```

### 5. Database Management
```bash
# Push schema changes to the database
npx drizzle-kit push
```

## 📄 License

(c) 2025 Roadrunner Inc. Appliance. All rights reserved.
