# Sprout - AI Agent Guidelines

Welcome to the Sprout repository. You are an AI agent operating within this codebase. Your primary objective is to assist the user in building out the Sprout web application — an autonomous platform that helps small farms modernize through AI-powered digital marketing, predictive analytics, and voice-to-CRM integrations.

This document serves as your single source of truth for the project's architecture, technology stack, agentic workflows, and coding standards. **You MUST adhere to these rules at all times.**

---

## 🏗️ 1. Project Architecture & Stack

The repository is structured as a monorepo containing a full-stack web application.

- **`backend/`**: A high-performance, asynchronous REST API.
  - **Framework**: FastAPI (Python 3.12+)
  - **Dependency Manager**: `uv`
  - **Database ORM**: `SQLModel`
  - **Driver**: `psycopg3` (Async engine)
  - **Migrations**: Alembic
  - **AI Framework**: LangGraph (for stateful multi-agent workflows)
- **`frontend/`**: The web client dashboard.
  - **Framework**: React + Vite
  - **Language**: TypeScript
  - **Package Manager**: `pnpm`
  - **Styling**: Tailwind CSS
- **Infrastructure**:
  - **Development**: Docker Compose (`docker-compose.dev.yml`) for hot-reloading.
  - **Production**: Docker Compose (`docker-compose.yml`) utilizing multi-stage builds.
- **External APIs**: USDA Local Food Directories, Google Maps/Places, Twilio, Gemini Live API, OpenAI Whisper (or local quantized versions), Cartesia/Deepgram.
- **Analysis**: `scipy.stats` for mathematical and regression analysis.

---

## 🛠️ 2. Core Operational Rules (CRITICAL)

### A. Backend Rules
1. **Always use Async/Await:** The backend is fully asynchronous. You must use `AsyncSession` for all SQLModel queries, `async def` for FastAPI routes, and await database/network calls.
2. **Strict Directory Structure (`backend/src/`):**
   - `api/v1/endpoints/`: All FastAPI route definitions go here. Do NOT pollute `main.py`.
   - `models/`: All SQLModel schema definitions (`table=True`).
   - `schemas/`: Pydantic models for request/response serialization (non-database models).
   - `core/`: Global configurations, Pydantic `BaseSettings` (`config.py`).
   - `db/`: Database session injection logic (`session.py`).
   - `crud/`: Reusable database query logic.
   - `services/`: Complex business logic separating routes from the database.
   - `agents/`: LangGraph definitions, nodes, and state management.
   - `tools/`: Specific function-calling tools used by LangGraph agents.
3. **Database Migrations:** Never use `SQLModel.metadata.create_all` in production logic. ALWAYS use Alembic. When adding or modifying a model in `models/`, you MUST ensure it is imported in `alembic/env.py` and run `alembic revision --autogenerate -m "X"`.
4. **Environment Variables:** Use `Pydantic Settings` in `core/config.py` for all environment variables. Do not use `os.environ.get()` within application logic directly.

### B. Frontend Rules
1. **Tooling:** Use `pnpm` for all package management.
2. **Components:** Build functional React components using TypeScript interfaces for props.
3. **Styling:** Use exclusively Tailwind CSS classes. Do not write custom CSS unless absolutely necessary.
4. **Routing & Pages:** Build components to support two core UI areas:
   - **The Public Landing Page:** Hero sections, discovery mechanisms, map previews, and "Claim your farm" onboarding flows.
   - **The Farm Dashboard:** Includes the interactive Map/Discovery page, the Digital Health Audit breakdown, Generated Websites/Persona management, Market Intelligence charts, Restaurant Matchmaking (SDR UI), and the Voice Field Agent call logs.

---

## 🤖 3. Feature-Specific Architecture Rules & Workflows

Sprout encompasses 5 distinct agentic workflows. When implementing code for these workflows, adhere to the following logic boundaries:

### Phase 1: The Discovery & Audit Pipeline (LangGraph)
*Pipeline: USDA API → Google Places Enrichment → Website Scraping → Digital Health Scoring → PostgreSQL*
- **State:** Define strictly typed `AgentState` mapping `farm_name`, `location`, `google_places_data`, and `digital_health_score`.
- **Tools:** Isolate external API integrations into `backend/src/tools/`.
  - `usda_api`: Fetches `/api/csa/` and `/api/farmersmarket/`.
  - `google_places_api`: Fetches business listings and domains.
  - `web_scraper`: Beautifulsoup/Playwright to analyze SEO, SSL, and mobile responsiveness.
- **Database:** Target leads with digital health scores `< 50` natively in the SQLModel target table.

### Phase 2: Asset Generation (LangGraph)
*Pipeline: Scraped Data → AI Analysis → Website Build → Marketing Persona Generation → Deploy*
- **Role:** Taking the discovered target and auto-generating marketing materials.
- **Components:** Must generate a *farm story*, *tagline*, *target audience*, *tone*, and *recommended channels*.
- **Delivery:** Must be able to render the auto-generated site inside an embedded iframe or snapshot on the React frontend.

### Phase 3: Restaurant Matchmaking / SDR (LangGraph)
*Pipeline: Local Restaurant Search → Menu Scraping → Keyword Matching → Email Drafting → Human Approval → Send & Track*
- **Logic:** Agents calculate 30-mile radises to source target restaurants.
- **Scraping tools:** Must look for terms natively associated with the farm's inventory (e.g., "pasture-raised", "heirloom").
- **Human-in-the-Loop Constraint:** Outbound emails **must not** be fully automated. They must draft into PostgreSQL and surface in the React Dashboard for the "Approve & Send" interaction. Pipeline statuses (Drafted → Sent → Opened → Replied → Converted) must be strictly tracked.

### Phase 4: Predictive Analytics & Market Dashboard
*Pipeline: Historical Pricing Data → Regression Analysis → Confidence Intervals → Dashboard Insights*
- **Database:** Isolate `CommodityPricing` (historical prices) and `FarmInventory` tables in SQLModel.
- **Math/Analysis Isolation:** Write a dedicated Python service (`backend/src/services/` using `scipy.stats`) to calculate confidence intervals and seasonal regression. Keep math logic OUT of API routers.
- **Frontend Presentation:** Display charts using libraries (e.g., Recharts) alongside auto-generated plain-language insights (e.g., "There is a 95% probability...").

### Phase 5: Voice-to-CRM Field Agent
*Pipeline: Twilio Inbound Call → Gemini Live API → Database Update → Dashboard Sync*
- **Networking:** Expose a FastAPI webhook receiving Twilio audio payloads.
- **AI Processing:** Pass audio into Gemini Live API (conversational processing) and use LLMs to extract strictly validated JSON schemas.
- **Fields Expected:** `{ "crop_name": str, "quantity": int, "buyer_name": str, "transaction_amount": float }`.
- **Database Sync:** The extracted data must update the `FarmInventory` or `Transactions` tables natively in real-time, instantly reflecting on the React UI.

---

## 🚀 4. How to Execute Work

When given a task:
1. **Understand:** Cross-reference this document to ensure strict architectural compliance.
2. **Plan (Optional):** Use `implementation_plan.md` for major infrastructural changes.
3. **Execute:** Build the code abiding by the asynchronous, modular `psycopg3` backend structures and the React/Vite/Tailwind setups.
4. **Test & Verify:** Validate the components within the Docker Compose environment (`docker compose -f docker-compose.dev.yml up --build`).
5. **No Destructive Work:** Ask for permission if data loss or total schema resets are probable.
