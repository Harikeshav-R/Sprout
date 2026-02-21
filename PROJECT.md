### **The Tech Stack**

* **AI Orchestration:** LangGraph (Python) for the stateful, multi-agent workflows.  
* **Backend:** FastAPI (Python) for high-performance API routing and logic.  
* **Database:** PostgreSQL (with SQLAlchemy and Alembic for migrations).  
* **Frontend:** React (TypeScript, Vite, Tailwind CSS).  
* **Infrastructure:** Docker & Docker Compose for seamless local development and deployment.  
* **Dev Environment:** Your standard macOS, iTerm2, and Neovim setup.

### ---

**Phase 1: The Discovery & Audit Pipeline (LangGraph)**

This is the lead-generation engine that autonomously finds farms with poor digital health.

1. **The USDA API Wrapper:** Create a Python utility to hit the USDA Local Food Directories API. You'll specifically want to query the /api/csa/ and /api/farmersmarket/ endpoints using state and zip parameters to pull a local list of registered farms.  
2. **The State Graph (AgentState):** Define a TypedDict in LangGraph that holds the farm\_name, location, google\_places\_data, and digital\_health\_score.  
3. **The Sourcing Agent:** Takes the USDA data and queries the Google Places API to find the farm's official business listing and website URL.  
4. **The Audit Agent:** Scrapes the found URL (if it exists) using a tool like BeautifulSoup or a headless browser. It evaluates mobile responsiveness, SEO tags, and load speed, assigning a "Digital Health Score" from 1-100. Farms scoring under 50 are written to your PostgreSQL database as target leads.

### **Phase 2: The Autonomous B2B SDR Adapt the autonomous multi-agent sales architecture from LeadForge and point it directly at local farm-to-table restaurants.**

1. **Menu Scraping Node:** An agent that searches for local restaurants within a 30-mile radius of the farm and scrapes their online menus for seasonal keywords (e.g., "heirloom," "pasture-raised," "squash").  
2. **Drafting Agent:** When a match is found, this agent takes the farm's current PostgreSQL inventory data and autonomously drafts a highly personalized email to the restaurant's chef or procurement manager, offering a sample drop-off.  
3. **Human-in-the-loop (Optional):** Route the drafted email to the React dashboard so the farmer can click "Approve & Send" rather than fully automating the outbound send.

### **Phase 3: Predictive Analytics & Market Dashboard**

This module proves the platform is a data powerhouse, not just a website builder.

1. **Database Schema:** In PostgreSQL, create tables for CommodityPricing (historical prices of crops in the county) and FarmInventory.  
2. **Statistical Modeling (FastAPI):** Write a Python service that runs regression analyses comparing local crop pricing against seasonal trends.  
3. **Confidence Intervals:** Instead of just showing raw data, use scipy.stats to calculate confidence intervals for local demand. Surface this on the React frontend as an actionable insight: *"There is a 95% probability that organic zucchini prices will rise by 12% in the next three weeks based on local scarcity."*

### **Phase 4: Voice-to-CRM Field Agent**

Farmers can't type while on a tractor. This is your "wow factor" feature for the judges.

1. **The Twilio Webhook:** Set up a Twilio phone number that routes incoming audio to a FastAPI endpoint.  
2. **Speech-to-Text:** Pass the audio payload to OpenAI's Whisper API (or a local quantized model) for transcription.  
3. **NLP Structuring Agent:** Send the raw transcript to an LLM with a strict JSON schema prompt: *"Extract the crop name, quantity harvested, and buyer name from this transcript."*  
4. **Database Sync:** The FastAPI backend takes that JSON and updates the FarmInventory and Transactions tables in PostgreSQL, instantly updating the farm's generated website stock.

### ---

**36-Hour Hackathon Execution Plan**

* **Hours 1-4: Infrastructure Plumbing**  
  * Set up your Git repo.  
  * Write the docker-compose.yml to spin up PostgreSQL, the FastAPI backend, and the React frontend. Ensure hot-reloading is working in your Neovim environment so you aren't fighting Docker during the hackathon.  
* **Hours 5-14: LangGraph & The Database**  
  * Define your SQLAlchemy models and run the initial Alembic migration.  
  * Build the LangGraph workflow for the Discovery & Audit Pipeline. Connect it to the USDA and Google Places APIs.  
* **Hours 15-22: The React Dashboard & Generation**  
  * Build the central hub where the farmer logs in.  
  * Create the AI prompt that takes the farmer's intake form and generates the tailored HTML/Tailwind code for their new website.  
* **Hours 23-30: Voice Integration & Analytics**  
  * Wire up the Twilio webhook and Whisper API for the Voice-to-CRM feature.  
  * Write the statistical modeling logic in FastAPI and visualize the confidence intervals using a charting library in React.  
* **Hours 31-36: The Pitch & Polish**  
  * Ensure the live demo flows perfectly: Find a bad website \-\> Generate a new one \-\> Show the analytics \-\> Call the Twilio number to update inventory live.

# **Sprout — Feature Breakdown & Product Spec**

## **What Is Sprout?**

Sprout is an AI-powered platform that helps small, local farms grow their business through automated digital marketing, market intelligence, and sales outreach. Most small farms have no marketing team, no budget for agencies, and no time to build a web presence — their only real differentiator is how they market themselves, and most aren't marketing at all.

Sprout finds these farms, audits their digital presence, and gives them a complete marketing toolkit — a generated website, a crafted brand persona, market pricing insights, restaurant matchmaking, and a voice-powered field assistant — all from a single dashboard.

---

## **The Two Interfaces**

Sprout has two distinct user-facing surfaces:

### **1\. The Sprout Landing Page (Public Marketing Site)**

This is the front door — a public-facing page that advertises Sprout itself and what it does for farms. It's not a dashboard; it's a pitch.

**What's on it:**

* **Hero section** — A bold tagline like *"Your farm deserves to be found."* with a brief explanation: Sprout discovers farms with weak digital presence and gives them everything they need to reach more customers.  
* **Feature highlights** — Visual cards or sections summarizing what Sprout does:  
  1. *Discovery & Audit* — We find farms and score their digital health.  
  2. *Instant Website* — We build you a modern site automatically.  
  3. *Brand Persona* — We craft a marketing identity based on what makes your farm unique.  
  4. *Market Intelligence* — Real-time crop pricing trends and demand forecasts.  
  5. *Restaurant Matchmaking* — We connect you to local restaurants looking for your products.  
  6. *Voice Field Agent* — Log inventory and sales by calling in from the field.  
* **How It Works** — A simple 3-4 step flow:  
  1. We discover your farm through USDA and Google data.  
  2. We audit your website, social media, and online presence.  
  3. We build you a complete marketing toolkit.  
  4. We connect you to buyers and help you grow.  
* **Discover page preview / teaser** — A visual showing the map of farms Sprout works with, inviting visitors to explore.  
* **Call to action** — "Claim your farm" or "See your digital health score" — a way for a farmer to opt in.

---

### **2\. The Sprout Dashboard (Authenticated Farm View)**

Once a farm is onboarded (or claimed), they get their own personalized dashboard. This is where all the intelligence, tools, and outreach live — everything consolidated into one place for that specific farm.

---

## **Dashboard Pages**

### **Discovery Page**

This is the map view — a visual, interactive map showing all the farms Sprout has discovered and works with in a given area.

**What's on it:**

* **Interactive map** — Pins for every farm in a configurable radius, color-coded by their Digital Health Score (red \= poor, yellow \= fair, green \= strong).  
* **Search and filter controls** — Filter by location (state, zip, radius), farm type (CSA, farmers market, u-pick, organic, livestock), and health score range.  
* **Farm list sidebar** — A scrollable list alongside the map showing farm name, location, score, and a quick summary (e.g., "No website detected," "Inactive social media," "Strong Google listing").  
* **Data sources shown** — Badges indicating where the farm was found: USDA Local Food Directory, Google Places, or both.  
* **Click-through** — Clicking a farm pin or list item navigates to that farm's individual dashboard (if you're the farm owner) or shows a public summary card (if you're browsing).

**How it works under the hood:**

* The USDA Local Food Directories API (`/api/csa/` and `/api/farmersmarket/` endpoints) is queried by state and zip to pull registered farms.  
* Each farm is cross-referenced against Google Places API to find their business listing, website URL, phone number, and reviews.  
* Results are stored in PostgreSQL and displayed on the map.

---

### **My Farm Dashboard (The Core Experience)**

This is the single, consolidated view a farmer sees when they log in. Everything about their farm — audit results, generated assets, market data, outreach, and field logs — lives here.

#### **Section: Digital Health Audit**

The first thing a farmer sees is their overall digital presence score and what's driving it.

**What's shown:**

* **Digital Health Score** — A prominent 0-100 score with a color indicator.  
* **Breakdown categories**, each with their own sub-score:  
  * *Website* — Does one exist? Is it mobile-friendly? Load speed? SSL? Last updated?  
  * *SEO* — Meta tags, title tags, alt text, sitemap, schema markup.  
  * *Google Business Profile* — Is the listing claimed? Are hours listed? Photos? Correct category?  
  * *Reviews* — Google review count and average rating. Yelp if applicable.  
  * *Social Media Presence* — Does a Facebook page exist? Instagram? How recently active? Follower count?  
* **Specific recommendations** — Actionable items like "Your website is not mobile-friendly," "You have no Google reviews," "Your Facebook page hasn't posted in 6 months."  
* **Before/after comparison** — If Sprout has generated a new site, show a side-by-side screenshot of the old site vs. the Sprout-generated one.

**How it works under the hood:**

* The Audit Agent scrapes the farm's website using BeautifulSoup or a headless browser (Playwright).  
* It checks for responsive meta tags, page speed (via Lighthouse or similar), SSL certificate, SEO meta tags, and basic content quality.  
* Social media presence is detected by searching for the farm name on Facebook/Instagram and checking for linked profiles on Google Business.  
* All scores are computed and stored in PostgreSQL.

---

#### **Section: Generated Website & Marketing Persona**

Sprout doesn't just critique — it builds. This section shows the farm what Sprout has created for them.

**What's shown:**

* **Live preview of the generated website** — An embedded iframe or screenshot carousel of the auto-built landing page. The farmer can click through to the live deployed version.  
* **Marketing persona card** — Based on what was scraped and analyzed, Sprout generates a brand identity:  
  * *Farm story summary* — A 2-3 sentence narrative about what makes this farm unique (generated from scraped About pages, Google descriptions, USDA data, and review sentiment).  
  * *Suggested tagline* — e.g., "Family-grown produce since 1987" or "Pasture-raised, neighbor-trusted."  
  * *Target audience* — Who this farm should be marketing to (local families, farm-to-table restaurants, CSA subscribers, farmers market shoppers).  
  * *Tone and voice recommendation* — e.g., "Warm, family-oriented, emphasize heritage" or "Modern, sustainability-focused, emphasize organic certifications."  
  * *Recommended channels* — Where to focus marketing effort (Facebook for community farms, Instagram for visually appealing produce, Google Business for local search).  
* **Download / claim options** — The farmer can download the generated website as a zip, or Sprout can deploy it to a subdomain (e.g., `smithfarm.Sprout.app`).

**How it works under the hood:**

* The Builder agent takes the scraped URL, runs a visual analysis (screenshot \+ AI critique), and generates a prompt for building a modern landing page.  
* The page is built with farm-specific templates: hero image, seasonal produce section, farm story, CSA signup, hours/location, and contact info.  
* The marketing persona is generated by an LLM that synthesizes all available data about the farm into a cohesive brand identity.  
* The Deployer service hosts the generated static site and makes it immediately accessible.

---

#### **Section: Market Intelligence**

This section turns Sprout from a marketing tool into a business intelligence platform.

**What's shown:**

* **Crop pricing trends** — Charts showing historical and current prices for the farm's relevant crops in their county/region. Line charts with time on the x-axis and price on the y-axis.  
* **Demand forecasts with confidence intervals** — Actionable insight cards like: *"There is a 95% probability that organic zucchini prices will rise by 12% in the next three weeks based on local scarcity."*  
* **Seasonal trend indicators** — Visual indicators showing which crops are trending up or down in local demand.  
* **Competitor context** — How many other farms in the area are selling the same crops, and how the farmer's pricing compares (without naming competitors directly).  
* **Inventory tracker** — A table showing the farm's current stock (populated via the Voice Field Agent or manual entry), with columns for crop name, quantity, unit, and last updated timestamp.

**How it works under the hood:**

* PostgreSQL tables for `CommodityPricing` (historical county-level crop prices) and `FarmInventory`.  
* A FastAPI service runs regression analysis comparing local crop pricing against seasonal trends.  
* `scipy.stats` calculates confidence intervals for local demand projections.  
* Data is surfaced to the React frontend as both charts (using a charting library like Recharts) and plain-language insight cards.

---

#### **Section: Restaurant Matchmaking (Outreach)**

This is the autonomous SDR — connecting farms to local restaurants that need their products.

**What's shown:**

* **Matched restaurants** — A list of local restaurants (within a configurable radius, e.g., 30 miles) whose menus contain keywords matching the farm's inventory. Each match shows:  
  * Restaurant name, location, and cuisine type.  
  * Menu keyword matches highlighted (e.g., "heirloom tomato" found on menu, farm grows heirloom tomatoes).  
  * A match confidence score.  
* **Draft outreach emails** — For each match, Sprout auto-drafts a personalized email to the restaurant's chef or procurement contact, offering a sample drop-off or introducing the farm. The email references specific menu items and available inventory.  
* **Approve & Send workflow** — The farmer reviews each draft, can edit it, and clicks "Approve & Send." Nothing goes out without farmer approval (human-in-the-loop).  
* **Outreach status tracker** — A pipeline view showing: Drafted → Sent → Opened → Replied → Converted.

**How it works under the hood:**

* The Menu Scraping Node searches for local restaurants via Google Places and scrapes their online menus for seasonal/farm-relevant keywords ("heirloom," "pasture-raised," "local," "seasonal," "squash," etc.).  
* The Drafting Agent pulls from the farm's PostgreSQL inventory data and the restaurant's menu to compose a personalized outreach email.  
* Emails are routed to the React dashboard for human approval before sending.  
* Send status is tracked in PostgreSQL and displayed in the pipeline UI.

---

#### **Section: Voice Field Agent (Call Log & CRM)**

Farmers can't type while on a tractor. This feature lets them call in and update their inventory, log sales, and manage their business by voice.

**What's shown:**

* **Call log** — A chronological list of all incoming voice calls, each showing:  
  * Timestamp and duration.  
  * Raw audio player (listen back).  
  * Full transcription of the call.  
  * Extracted structured data displayed next to the transcript: crop name, quantity harvested, buyer name, sale amount (if mentioned).  
* **Auto-updated inventory** — A confirmation of what changed in the farm's inventory after each call. e.g., *"Added 200 lbs of Roma tomatoes to inventory"* or *"Logged sale: 50 lbs heirloom tomatoes to Blue Table Bistro."*  
* **Correction interface** — If the extraction got something wrong, the farmer can tap to correct it (e.g., fix a misheard crop name).  
* **Activity summary** — A weekly/monthly summary card: total calls, inventory updates logged, sales recorded.

**How it works under the hood:**

* A Twilio phone number routes incoming calls to a FastAPI webhook.  
* Audio is passed to Gemini Live API for live conversation.  
* The raw transcript is sent to an LLM with a strict JSON schema prompt to extract structured fields: crop name, quantity, buyer name, transaction type.  
* The FastAPI backend takes the structured JSON and updates `FarmInventory` and `Transactions` tables in PostgreSQL.  
* Changes immediately reflect on the farm's dashboard and generated website (e.g., updating the "available now" section).

---

## **Tech Stack Summary**

| Layer | Technology |
| ----- | ----- |
| AI Orchestration | LangGraph (Python) — stateful, multi-agent workflows |
| Backend | FastAPI (Python) — API routing, business logic, voice webhook |
| Database | PostgreSQL with SQLAlchemy and Alembic (migrations) |
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Infrastructure | Docker & Docker Compose |
| External APIs | USDA Local Food Directories, Google Maps/Places, Twilio (Voice), OpenAI Whisper, Cartesia/Deepgram (Voice Synthesis) |
| Statistical Analysis | scipy.stats for regression and confidence intervals |

---

## **Agent Workflow Summary**

### **Phase 1: Discovery & Audit Pipeline**

`USDA API → Google Places Enrichment → Website Scraping → Digital Health Scoring → PostgreSQL`

### **Phase 2: Asset Generation**

`Scraped Data → AI Analysis → Website Build → Marketing Persona Generation → Deploy`

### **Phase 3: Restaurant Matchmaking SDR**

`Local Restaurant Search → Menu Scraping → Keyword Matching → Email Drafting → Human Approval → Send & Track`

### **Phase 4: Market Intelligence**

`Historical Pricing Data → Regression Analysis → Confidence Intervals → Dashboard Insights`

### **Phase 5: Voice Field Agent**

`Twilio Inbound Call → Gemini Live API → Database Update → Dashboard Sync`

