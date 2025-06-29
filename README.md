# UpGenie — AI-Powered Proposal Generator for Upwork

**UpGenie** is a browser extension and SaaS platform that automates the creation of personalized job proposals on Upwork using GPT-4o.  
It helps freelancers streamline the application process and improve response rates with well-crafted, context-aware submissions — in seconds.

---

## 🔧 Key Features

- 🔍 Contextual parsing of job descriptions on Upwork
- 🤖 AI-generated proposals using OpenAI GPT-4o
- 🧑‍💼 Custom profile input (stored locally)
- ⚙️ Configurable settings
- 🔐 Authentication via Clerk (Google, GitHub)
- 📊 Usage tracking and daily request limits (Free plan)
- 💳 Stripe-powered billing for Pro plan
- 🌍 Scalable architecture with upcoming support for Fiverr & Freelancer

---

## 🧱 Tech Stack

| Layer          | Technology                 |
| -------------- | -------------------------- |
| Frontend (ext) | JavaScript (Manifest V3)   |
| Backend API    | Node.js (Vercel / Express) |
| AI Integration | OpenAI API (GPT-4o)        |
| Auth           | Clerk.dev                  |
| Database       | Supabase (PostgreSQL)      |
| Billing        | Stripe (Subscriptions)     |
| Hosting        | Vercel                     |
| Analytics      | Plausible / PostHog (opt.) |

---

## 🚀 Quick Start

1. Clone the repository

```bash
git clone https://github.com/pashak1207/UpGenie.git
cd upgenie
```

2. Install dependencies

```bash
npm install
```

3. Set up environment variables

   Create a .env file based on .env.example with:

   • OPENAI_API_KEY

   • CLERK_SECRET_KEY

   • SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

   • STRIPE_SECRET_KEY

4. Load Chrome Extension

   • Go to chrome://extensions

   • Enable Developer Mode

   • Click Load unpacked

   • Select /extension directory

## 🔐 Authentication & Usage Limits

• Auth handled by Clerk.dev (Google / GitHub OAuth)

• Daily request limits enforced for Free users (5/day)

• Pro plan unlocks unlimited usage via Stripe Subscriptions

• Usage logs stored in Supabase

## 📌 Roadmap

• Firefox & Safari versions

• Proposal tone presets (e.g. friendly, formal, expert)

• Fiverr / Freelancer parsing support

• In-dashboard proposal history

• User feedback ranking for proposal quality

## 📝 License

MIT — open for personal and commercial use.

Built to help freelancers pitch smarter and faster 🚀
