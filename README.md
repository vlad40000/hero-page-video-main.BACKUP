# Roadrunner Appliance Platform

A modern, AI-powered web platform for appliance sales, service, and inventory management. Designed for Roadrunner Inc. to streamline the buying and selling of used appliances.

## 🚀 Key Features

- **Storefront**: Browse high-quality used washers, dryers, refrigerators, and more.
- **Flood Engine (Inventory CRM)**: A powerful internal dashboard for employees to:
  - Add and manage inventory in real-time.
  - **AI Nameplate Analysis**: Scan appliance stickers using Gemini AI to auto-fill brand, model, and serial details.
  - **AI Grading**: Automatically assess unit condition and match with catalog data using computer vision.
  - **Pricing Engine**: Calculate optimal resale values based on age, MSRP, and condition.
- **Seamless Database Sync**: Automatic synchronization between local dashboard state and the public website database (Drizzle + Neon).
- **Service & Leasing**: Direct access to appliance repair requests and leasing options.

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (React 19)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Database**: [Neon](https://neon.tech/) (Serverless Postgres)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **AI/ML**: [Google Gemini Pro Vision / Flash](https://ai.google.dev/)
- **Components**: [Radix UI](https://www.radix-ui.com/) + [Lucide Icons](https://lucide.dev/)
- **Analytics**: Vercel Analytics

## 📂 Project Structure

- `app/`: Next.js App Router pages and layouts.
- `app/employee/inventory/`: The "Flood Engine" dashboard.
- `components/`: Reusable UI components.
- `lib/flood-engine/`: Core logic for the AI services, pricing engine, and inventory hooks.
- `lib/db/`: Database schema and connection logic.
- `scripts/`: Utility scripts for data verification and maintenance.

## ⚙️ Setup & Development

### 1. Prerequisites
- Node.js (Latest LTS)
- PNPM or NPM

### 2. Environment Variables
Create a `.env.local` file in the root directory and add the following:
```env
# Database
DATABASE_URL=your_postgres_connection_string

# AI Services
GEMINI_API_KEY=your_google_gemini_api_key
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
