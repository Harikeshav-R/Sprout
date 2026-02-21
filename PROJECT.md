### **The Tech Stack**

* **AI Orchestration:** LangGraph (Python) for the stateful, multi-agent workflows.  
* **Backend:** FastAPI (Python) for high-performance API routing and logic.  
* **Database:** PostgreSQL (with SQLAlchemy and Alembic for migrations).  
* **Frontend:** React (TypeScript, Vite, Tailwind CSS).  
* **Infrastructure:** Docker & Docker Compose for seamless local development and deployment.  
* **Dev Environment:** Your standard macOS, iTerm2, and Neovim setup.

### ---

**Phase 1: The Discovery & Audit Pipeline (LangGraph)**

This serves as a competitive analysis tool for the farmer to understand the digital health of parallel businesses in their region.

1. **The USDA API Wrapper:** Create a Python utility to hit the USDA Local Food Directories API. You'll specifically want to query the /api/csa/ and /api/farmersmarket/ endpoints using state and zip parameters to pull a local list of registered farms.  
2. **The State Graph (AgentState):** Define a TypedDict in LangGraph that holds the farm\_name, location, google\_places\_data, and digital\_health\_score.  
3. **The Sourcing Agent:** Takes the USDA data and queries the Google Places API to find competitor farms' official business listings and website URLs.  
4. **The Audit Agent:** Scrapes the competitor URLs (if they exist) using a tool like BeautifulSoup or a headless browser. It evaluates mobile responsiveness, SEO tags, and load speed, assigning a "Digital Health Score" from 1-100. This lets the farmer benchmark their own digital presence against local competitors.

### **Phase 2: The Autonomous Web Builder**

This feature allows the farmer to rapidly generate and iterate on their own marketing presence. Instead of paying an agency, the AI gives them endless website variations to try out.

1. **Asset Generation Agent:** Takes the farmer's inventory data and farm story, then autonomously drafts a highly personalized brand persona, tagline, and tone.
2. **Website Iteration:** Generates different distinct Tailwind CSS layouts for the farmer's website, allowing them to preview and select the highest-converting look.
3. **Deployment:** Pushes the farmer's chosen website design live instantly.

### **Phase 3: The Autonomous B2B SDR**

Adapt the autonomous multi-agent sales architecture from LeadForge and point it directly at finding potential local farm-to-table restaurants for the farmer.

1. **Menu Scraping Node:** An agent that searches for local restaurants within a 30-mile radius of the farmer and scrapes their online menus for seasonal keywords (e.g., "heirloom," "pasture-raised," "squash").  
2. **Drafting Agent:** When a match is found, this agent takes the farmer's current PostgreSQL inventory data and autonomously drafts a highly personalized email to the restaurant's chef or procurement manager, offering a sample drop-off.  
3. **Human-in-the-loop (Optional):** Route the drafted email to the React dashboard so the farmer can click "Approve & Send" rather than fully automating the outbound send.

### **Phase 3: Predictive Analytics & Market Dashboard**

This module proves the platform is a data powerhouse, not just a website builder.

1. **Database Schema:** In PostgreSQL, create tables for CommodityPricing (historical prices of crops in the county) and FarmInventory.  
2. **Statistical Modeling (FastAPI):** Write a Python service that runs regression analyses comparing local crop pricing against seasonal trends.  
3. **Confidence Intervals:** Instead of just showing raw data, use scipy.stats to calculate confidence intervals for local demand. Surface this on the React frontend as an actionable insight: *"There is a 95% probability that organic zucchini prices will rise by 12% in the next three weeks based on local scarcity."*

### **Phase 5: Voice-to-CRM Agent (Handling Inbound Customer Calls)**

Farmers can't answer the phone while on a tractor. This AI agent answers calls from potential customers (e.g., CSA subscribers, chefs) and logs the sales interactions directly into the CRM.

1. **The Twilio Webhook:** Set up a Twilio phone number that routes incoming customer audio to a FastAPI endpoint.  
2. **Speech-to-Text & AI Voice Response:** Pass the audio payload to OpenAI's Whisper API/Gemini Live for transcription and conversational response, allowing the AI to answer inventory questions for customers calling in.
3. **NLP Structuring Agent:** Send the raw transcript to an LLM with a strict JSON schema prompt: *"Extract the crop name, quantity requested, and buyer name from this customer call."*  
4. **Database Sync:** The FastAPI backend takes that JSON and updates the FarmInventory and Transactions tables in PostgreSQL, instantly logging the customer's purchase or inquiry.

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

* **Hero section** — A bold tagline like *"Stop farming for clicks. Let AI handle your sales."* with a brief explanation: Sprout gives farmers a complete toolkit to compete digitally, handle customers automatically, and analyze local markets.  
* **Feature highlights** — Visual cards or sections summarizing what Sprout does:  
  1. *Competitor Audit* — Analyze local competitor farms and benchmark your own digital score.  
  2. *Instant Website Iteration* — AI generates endless professional website variations for you to preview and choose.  
  3. *Brand Persona* — We craft a marketing identity based on what makes your farm unique.  
  4. *Market Intelligence* — Real-time crop pricing trends and demand forecasts.  
  5. *Restaurant SDR Outreach* — AI hunts down local restaurants and pitches your excess inventory.  
  6. *Inbound Voice Agent* — An AI phone assistant that answers customer calls and logs sales while you're in the field.  
* **How It Works** — A simple 3-4 step flow:  
  1. You create an account and list your inventory.  
  2. AI audits your competitors and generates a superior website for you.  
  3. Sprout begins pitching local chefs on your behalf.  
  4. The Voice Agent handles incoming customer calls and logs sales straight to your dashboard.  
* **Discover page preview / teaser** — A visual showing the map of competitor farms Sprout has analyzed.  
* **Call to action** — "Get your farm online" or "Try the Sprout dashboard" — a way for a farmer to opt in.

---

### **2\. The Sprout Dashboard (Authenticated Farm View)**

Once a farm is onboarded (or claimed), they get their own personalized dashboard. This is where all the intelligence, tools, and outreach live — everything consolidated into one place for that specific farm.

---

## **Dashboard Pages**

### **Competitor Discovery Page**

This is the map view — a visual, interactive map allowing the farmer to analyze their local competition.

**What's on it:**

* **Interactive map** — Pins for every competing farm in a configurable radius, color-coded by their Digital Health Score (red \= poor, yellow \= fair, green \= strong).  
* **Search and filter controls** — Filter by location (state, zip, radius), farm type, and health score range.  
* **Competitor list sidebar** — A scrollable list alongside the map showing farm name, location, score, and a quick summary (e.g., "No website detected," "Inactive social media," "Strong Google listing").  
* **Data sources shown** — Badges indicating where the competitor was found: USDA Local Food Directory or Google Places.  
* **Click-through** — Clicking a farm pin pulls up an audit card detailing what that competitor is doing wrong (so the farmer can do it better).

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

#### **Section: Generated Website Iterations & Persona**

Sprout doesn't just build one site — it builds options. This section lets the farmer try out different website designs.

**What's shown:**

* **Live preview of the generated websites** — A carousel of different auto-built landing page variations (e.g., Rustic, Modern, Boutique). The farmer can click through and select their favorite.  
* **Marketing persona card** — Based on the farmer's intake, Sprout generates a brand identity:  
  * *Farm story summary* — A 2-3 sentence narrative crafted to appeal to their target demographic.  
  * *Suggested tagline* — e.g., "Family-grown produce since 1987" or "Pasture-raised, neighbor-trusted."  
  * *Target audience* — Who this farm should be marketing to (local families, farm-to-table restaurants, CSA subscribers, farmers market shoppers).  
  * *Tone and voice recommendation* — e.g., "Warm, family-oriented, emphasize heritage" or "Modern, sustainability-focused, emphasize organic certifications."  
  * *Recommended channels* — Where to focus marketing effort.
* **Deployment options** — The farmer can click "Deploy" to instantly push their chosen layout to a live subdomain (e.g., `smithfarm.Sprout.app`).

**How it works under the hood:**

* The Builder agent takes the farmer's inventory and story prompt.  
* The page is built using LLM-generated HTML/Tailwind templates with sections for: hero image, seasonal produce section, farm story, CSA signup, and contact info.  
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

#### **Section: Inbound Voice Agent (CRM & Call Log)**

Farmers can't answer the phone while on a tractor. This AI agent acts as a virtual receptionist, answering customer calls, quoting inventory, and logging sales.

**What's shown:**

* **Customer Call log** — A chronological list of all incoming customer calls, each showing:  
  * Timestamp and duration.  
  * Raw audio player (listen back).  
  * Full transcription of the customer's call.  
  * Extracted structured data: buyer name, requested crop, quantity, sale amount.  
* **Auto-updated inventory** — A confirmation of what changed in the farm's inventory due to the customer order. e.g., *"Logged sale: 50 lbs heirloom tomatoes to Blue Table Bistro."*  
* **Correction interface** — If the AI misunderstood the customer, the farmer can tap to correct the logged sale.  
* **Activity summary** — A weekly/monthly summary card: total inbound customer calls, orders placed, sales recorded.

**How it works under the hood:**

* A Twilio phone number routes incoming calls to a FastAPI webhook.  
* Audio is passed to Gemini Live API for live conversational response with the customer.  
* The raw transcript is sent to an LLM with a strict JSON schema prompt to extract structured fields: crop name, quantity, buyer name, transaction type.  
* The FastAPI backend takes the structured JSON and updates `FarmInventory` and `Transactions` tables in PostgreSQL.  
* Changes immediately reflect on the farm's dashboard and website stock.

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

### **Phase 1: Competitor Discovery & Audit Pipeline**

`USDA API → Google Places Enrichment → Competitor Website Scraping → Digital Health Scoring → PostgreSQL`

### **Phase 2: Asset Generation & Iteration**

`Farmer Intake Data → Persona Generation → Tailwind Layout Generation → User Selection → Deploy`

### **Phase 3: Restaurant Matchmaking SDR**

`Local Restaurant Search → Menu Scraping → Keyword Matching (Farm Inventory) → Email Drafting → Human Approval → Send & Track`

### **Phase 4: Market Intelligence**

`Historical Pricing Data → Regression Analysis → Confidence Intervals → Dashboard Insights`

### **Phase 5: Inbound Voice Customer Agent**

`Twilio Inbound Call (Customer) → Gemini Live API Response → Sales Extraction → Database Sync`

---

## **LangChain Tools**

To elevate Sprout into an enterprise-grade platform, the following tools should be integrated into the workflow:

### **1. Discovery, Audit & Asset Generation**
*   **`scrape_social_media` (Facebook/Instagram Scraper):** Scrapes recent posts to capture authentic "voice," photos, and updates for the Persona Generation LLM.
*   **`check_domain_availability`:** Proactively proposes 3 available, catchy domains when generating a new website.
*   **`analyze_competitor_gap`:** Finds the 3 nearest competing farms, scrapes their sites, and returns a competitive advantage report.
*   **`fetch_local_seo_keywords`:** Queries a keyword API (e.g., DataForSEO) for the farm's zip code to find what locals are actually searching for, ensuring localized SEO.

### **2. Restaurant Matchmaking / SDR**
*   **`find_decision_maker_email` (Hunter.io or Apollo API wrapper):** Hunts for the specific email address of the "Executive Chef", "Owner", or "Procurement Manager".
*   **`analyze_restaurant_reviews` (Yelp/Google Sentiment):** Scans customer reviews for phrases praising localization (e.g., "farm-to-table" or "fresh local ingredients") to find high-conversion leads.
*   **`search_linkedin_profiles`:** Finds the LinkedIn profile of the chef or owner to hyper-personalize outreach emails.

### **3. Predictive Analytics & Market Intelligence**
*   **`fetch_usda_ams_pricing` (USDA Market News API):** Pulls real-time wholesale pricing for specific commodities from the nearest major terminal market, feeding live data into regression models.
*   **`fetch_agricultural_weather` (NOAA/OpenWeatherMap API):** Pulls hyper-local microclimate forecasts and historical precipitation data to feed into the LLM for yield and demand insights.
*   **`search_local_food_events`:** Scrapes for upcoming local food festivals, farmers markets, or community events where the farm could set up a booth.

### **4. Voice CRM & Operations**
*   **`send_sms_notification` (Twilio):** Gives the LLM the ability to instantly blast an SMS to CSA subscribers based on farmer voice commands.
*   **`sync_ecommerce_inventory` (Shopify/Square API):** Directly updates "Items in Stock" on the farm's Sprout-hosted storefront via voice command.
*   **`generate_invoice` (QuickBooks/Stripe):** Automatically drafts and emails a PDF invoice to a restaurant for B2B sales logged over the phone.

