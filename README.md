# GenUI Engine 🤖📊

> **Turn natural language into interactive, data-driven dashboards.**

GenUI Engine is an AI-native application framework that transforms user prompts (e.g., *"Show me the velocity of the Backend team"*) into fully functional, interactive React dashboards. 

Unlike traditional chatbots that output text, GenUI Engine outputs **Software Interfaces**.

## ✨ Core Features

*   **AI-Orchestrated UI:** The LLM decides which components (Charts, Tables, KPIs) to render based on the data shape.
*   **Zero-Hallucination Data:** The AI *configures* the view, but the browser fetches real-time data directly from your database.
*   **Snapshot Architecture:** AI-generated insights are "frozen" in time snapshots, ensuring consistency during pagination and filtering.
*   **Smart Components:**
    *   **SmartTable:** Server-side pagination, sorting, and deep-linking.
    *   **SmartChart:** Interactive Recharts with automatic time-series aggregation.
    *   **SmartStatCard:** Instant KPI lookups.
*   **Enterprise Ready:** Built on Next.js 15, MongoDB, and Vercel AI SDK.

## 🚀 Quick Start

### Prerequisites
*   Node.js 18+
*   MongoDB (Local or Atlas)
*   OpenAI API Key

### 1. Clone & Install
```bash
git clone https://github.com/your-org/genui-engine.git
cd genui-engine/generative-UI
npm install
```

### 2. Configure Environment
Create a `.env.local` file:
```env
MONGODB_URI=mongodb://localhost:27017/genui_engine
OPENAI_API_KEY=sk-your-key-here
LANGFUSE_PUBLIC_KEY=pk-lf-... (Optional: for observability)
LANGFUSE_SECRET_KEY=sk-lf-...
```

### 3. Seed Mock Data
Populate the database with realistic developer personas and 1 year of metrics history:
```bash
npm run seed
```
*Generates ~16,000 records across 9 teams (Architects, Product, QA, etc.).*

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

## 🏗 Architecture

### The "Architect" Flow
1.  **User** asks a question.
2.  **AI** calls `get_metrics_summary` to understand the data context.
3.  **AI** calls `render_dashboard` with a JSON configuration (Layout + Components).
4.  **Server** captures a **Data Snapshot** and embeds the ID into the configuration.
5.  **Client** renders the UI, which hydrates data from `/api/snapshots/[id]`.

### Smart Pagination & Sorting
The `SmartTable` component uses a hybrid approach:
*   **Data Source:** The Snapshot (source of truth).
*   **Slicing:** Server-side `skip/limit` via the API Route.
*   **Sorting:** Server-side sorting on the full Snapshot dataset before slicing.

## 🧪 Testing

We use **Vitest** for unit tests and **Playwright** for E2E.

```bash
# Run Unit & Component Tests
npm run test

# Run End-to-End Tests
npx playwright test
```

## 🛠 Tech Stack

*   **Framework:** Next.js 15 (App Router)
*   **AI:** Vercel AI SDK (UseChat, Tools)
*   **Database:** MongoDB (Mongoose)
*   **Styling:** Tailwind CSS
*   **Charts:** Recharts
*   **Testing:** Vitest, Happy-DOM, MSW

## 🤝 Contributing

1.  Fork the repo.
2.  Create a feature branch.
3.  Ensure `npm run lint` and `npm run test` pass.
4.  Submit a Pull Request.

---
*Built with ❤️ for the AI Engineer World.*