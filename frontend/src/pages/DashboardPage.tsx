import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  LayoutDashboard, TrendingUp, Utensils, Mic, Globe,
  ChevronRight, ChevronDown, ArrowUpRight, ArrowDownRight, Star,
  CheckCircle2, AlertCircle, XCircle, ExternalLink,
  Send, Phone, Clock, Calendar,
  Users, MessageSquare, Edit3, CheckCheck, Loader2,
  RefreshCw, Copy, Code2, Eye, Play, Square
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { fetchPredictivePricing, fetchInventory, fetchDiscovery, buildFarmWebsite } from '../lib/api';
import type { CompetitorFarm, DiscoveryResponse, BuilderResponse } from '../lib/api';
import type { PricePrediction, InventoryItem } from '../types/analytics';

const callLogs = [
  { id: 1, date: 'Today, 9:45 AM', duration: '2:34', transcript: 'Outbound call to Blue Table Bistro. Pitched 200 lbs of fresh Concord grapes for a sample drop. Chef Marco expressed interest in discussing dessert menu options.', type: 'negotiating', target: 'Blue Table Bistro' },
  { id: 2, date: 'Yesterday, 4:20 PM', duration: '5:12', transcript: 'Outbound call to M Cellars. Secured order for 50 lbs grape must; delivery scheduled for Wednesday morning.', type: 'deal_won', target: 'M Cellars' },
  { id: 3, date: 'Yesterday, 8:15 AM', duration: '1:10', transcript: 'Outbound call to Old Firehouse Winery. They are fully stocked on produce; agreed to follow up next season.', type: 'deal_lost', target: 'Old Firehouse Winery' },
];

const restaurantMatches = [
  { id: 1, name: 'Ferrante Winery & Restaurant', cuisine: 'Italian / Winery', distance: '8 miles', matchScore: 96, menuMatches: ['Concord grapes', 'wine grapes'], status: 'draft' as const },
  { id: 2, name: 'M Cellars', cuisine: 'Winery', distance: '14 miles', matchScore: 92, menuMatches: ['grape must', 'fresh-pressed juice'], status: 'draft' as const },
  { id: 3, name: 'Old Firehouse Winery', cuisine: 'Winery & Events', distance: '6 miles', matchScore: 89, menuMatches: ['Concord grapes', 'wine grapes'], status: 'draft' as const },
  { id: 4, name: 'Laurello Vineyards', cuisine: 'Winery & Restaurant', distance: '11 miles', matchScore: 88, menuMatches: ['fresh grapes', 'grape jelly'], status: 'draft' as const },
  { id: 5, name: 'The Grapevine Bistro', cuisine: 'Seasonal American', distance: '9 miles', matchScore: 85, menuMatches: ['Concord grapes', 'grape desserts'], status: 'draft' as const },
  { id: 6, name: 'Grand River Cellars', cuisine: 'Winery & Wedding Venue', distance: '15 miles', matchScore: 84, menuMatches: ['wine grapes', 'fresh-picked grapes'], status: 'draft' as const },
];

const tabs = [
  { id: 'audit', label: 'Digital Health', icon: LayoutDashboard },
  { id: 'website', label: 'Website & Brand', icon: Globe },
  { id: 'market', label: 'Market Intel', icon: TrendingUp },
  { id: 'outreach', label: 'Restaurant Match', icon: Utensils },
  { id: 'voice', label: 'Voice Agent', icon: Mic },
];

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-600';
};

const AUDIT_FALLBACK = [
  { score: 35, notes: 'The website is highly outdated and lacks mobile responsiveness, creating friction for customers looking for seasonal vegetable and herb availability.', seo: 20, mobile: 25, ssl: true, social: 45, recommendations: ['Add mobile-responsive design', 'Update seasonal availability info'] },
  { score: 68, notes: 'The site provides basic orchard hours and location info, but the online ordering system is clunky and lacks high-quality photos of their fresh fruit yields.', seo: 55, mobile: 65, ssl: true, social: 70, recommendations: ['Improve ordering UX', 'Add product photography'] },
  { score: 82, notes: 'A strong digital presence with clear navigation for apple picking schedules, grape availability, and a vibrant gallery of fresh fruits. Highly competitive.', seo: 85, mobile: 80, ssl: true, social: 75, recommendations: ['Maintain current standards'] },
  { score: 15, notes: 'No dedicated website detected, relying entirely on a basic social media page for apple and pumpkin updates. Strong opportunity to outcompete digitally.', seo: 5, mobile: 10, ssl: false, social: 30, recommendations: ['Create dedicated website', 'Improve social presence'] },
  { score: 15, notes: 'No website detected. They rely on social media for their peach and plum harvest updates, leaving a massive gap in local search engine visibility.', seo: 5, mobile: 10, ssl: false, social: 25, recommendations: ['Build website', 'Optimize for local search'] },
  { score: 25, notes: 'The site is minimally functional and misses crucial real-time updates on their current sustainably grown heirloom vegetable inventory. High bounce rate likely.', seo: 20, mobile: 30, ssl: true, social: 20, recommendations: ['Add inventory updates', 'Improve content freshness'] },
  { score: 10, notes: 'No website detected. Strong opportunity to dominate digital search for daily fresh-picked produce and vegetables in the local market.', seo: 0, mobile: 5, ssl: false, social: 25, recommendations: ['Create website', 'Claim local search'] },
  { score: 10, notes: 'No website detected. As a fellow U-Pick farm in Geneva, their complete lack of a digital footprint is a major competitive vulnerability you can exploit.', seo: 0, mobile: 5, ssl: false, social: 25, recommendations: ['Build digital presence', 'Target local U-Pick market'] },
  { score: 40, notes: 'The web presence is fragmented and visually unappealing, failing to properly showcase their urban-farmed seasonal fruits, organic produce, and exotic plants.', seo: 35, mobile: 45, ssl: true, social: 40, recommendations: ['Unify branding', 'Improve product showcase'] },
  { score: 65, notes: 'A functional website that clearly details their root vegetable and greens offerings, but it suffers from slow load times and limited digital commerce tools.', seo: 60, mobile: 70, ssl: true, social: 55, recommendations: ['Optimize performance', 'Add e-commerce'] },
];

const getScoreBg = (score: number) => {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-red-500';
};

function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
}


const PERSONA_FALLBACK = {
  farm_story_summary: "Covered Bridge Farms began in 1987 when the Mitchell family planted their first 200 Concord grape vines on a sun-drenched hillside in Geneva, Ohio. Today, we tend over 2,000 vines across 15 acres, producing premium Concord grapes and handcrafted preserves that capture the essence of each harvest.",
  tagline: "Where Every Grape Tells a Story",
  target_audience: "Local Foodies, Organic Shoppers, Weekend Travelers, Preserve Lovers",
  tone_and_voice: "Heritage-focused, elegant, yet warm and inviting. Emphasizes third-generation craftsmanship and the deep purple legacy of Geneva grapes.",
  recommended_channels: ["Instagram (Vineyard Vibe)", "Email Newsletters", "Local Farmer Markets", "Pinterest (Recipe Sharing)"]
};

const FALLBACK_MARKET = {
  prediction: {
    crop_name: 'Concord Grapes',
    county: 'Ashtabula',
    trend_slope: -0.0087,
    predicted_price: 2.89,
    pi_low: 2.18,
    pi_high: 3.61,
    plain_language_insight: 'Based on 84 historical data points from Ashtabula County, the price trend for Concord Grapes is falling (slope: -0.87%/day) as harvest volume peaks. The next projected price is $2.89/lb, with a 95% prediction interval of $2.18–$3.61. Consider locking in wholesale orders now before the seasonal dip levels off in late October.',
  } as PricePrediction,
  getChartData: () => {
    const points: { label: string; price: number; forecast: number | null }[] = [];
    const prices = [3.42, 3.38, 3.31, 3.24, 3.18, 3.12, 3.05, 2.98, 2.94, 2.91, 2.89];
    const now = new Date();
    for (let i = 10; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      points.push({
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        price: prices[10 - i],
        forecast: i === 0 ? 2.89 : null,
      });
    }
    return points;
  },
  getInventory: (): InventoryItem[] => {
    const now = Date.now();
    const ms = (m: number) => m * 60000;
    const hrs = (h: number) => h * 3600000;
    const days = (d: number) => d * 24 * 3600000;
    return [
      { id: '1', farm_id: '00000000-0000-0000-0000-000000000000', crop_name: 'Concord Grapes (Fresh)', quantity: 2840, unit: 'lbs', last_updated: new Date(now - ms(45)).toISOString() },
      { id: '2', farm_id: '00000000-0000-0000-0000-000000000000', crop_name: 'Concord Grape Jelly', quantity: 127, unit: 'jars', last_updated: new Date(now - hrs(2)).toISOString() },
      { id: '3', farm_id: '00000000-0000-0000-0000-000000000000', crop_name: 'Grape Juice (Fresh Pressed)', quantity: 68, unit: 'gallons', last_updated: new Date(now - hrs(5)).toISOString() },
      { id: '4', farm_id: '00000000-0000-0000-0000-000000000000', crop_name: 'U-Pick Buckets', quantity: 220, unit: 'buckets', last_updated: new Date(now - days(1)).toISOString() },
      { id: '5', farm_id: '00000000-0000-0000-0000-000000000000', crop_name: 'Grape Must (Wine)', quantity: 95, unit: 'gallons', last_updated: new Date(now - days(3)).toISOString() },
      { id: '6', farm_id: '00000000-0000-0000-0000-000000000000', crop_name: 'Dried Concord Raisins', quantity: 42, unit: 'lbs', last_updated: new Date(now - days(5)).toISOString() },
      { id: '7', farm_id: '00000000-0000-0000-0000-000000000000', crop_name: 'Grape Pie Filling', quantity: 38, unit: 'pints', last_updated: new Date(now - days(7)).toISOString() },
      { id: '8', farm_id: '00000000-0000-0000-0000-000000000000', crop_name: 'Vineyard Tour Tickets', quantity: 0, unit: 'slots', last_updated: new Date(now - days(2)).toISOString() },
    ];
  },
};

const FALLBACK_DOMAINS = ['coveredbridgefarms.com', 'coveredbridgefarm.co', 'coveredbridgefarmsoh.com'];

const FALLBACK_WEBSITE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Covered Bridge Farms — Concord Grape Vineyard</title>
    <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Outfit:wght@300;400;500;600&family=Cormorant+Garamond:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        :root{--grape:#4a2545;--vine:#5c6b3c;--gold:#c5a55a;--cream:#faf8f4;--dark:#1a1a1a;--text:#3d3d3d}
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Outfit',sans-serif;color:var(--text);background:var(--cream)}
        h1,h2,h3,h4{font-family:'DM Serif Display',serif;font-weight:400}
        html{scroll-behavior:smooth}
        .grain{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;opacity:.03}
        .grain svg{width:100%;height:100%}
        .navbar{position:fixed;top:0;left:0;right:0;background:rgba(250,248,244,.92);backdrop-filter:blur(12px);z-index:1000;padding:.8rem 0;transition:all .4s ease;border-bottom:1px solid transparent}
        .navbar.scrolled{border-bottom:1px solid rgba(74,37,69,.1);box-shadow:0 2px 20px rgba(0,0,0,.04)}
        .nav-inner{max-width:1200px;margin:0 auto;padding:0 2rem;display:flex;align-items:center;justify-content:space-between}
        .nav-logo{font-family:'DM Serif Display',serif;font-size:1.3rem;color:var(--grape);text-decoration:none}
        .nav-links{display:flex;gap:2rem;list-style:none}
        .nav-links a{text-decoration:none;color:var(--text);font-size:.85rem;letter-spacing:.05em;text-transform:uppercase;transition:color .3s}
        .nav-links a:hover{color:var(--grape)}
        .hero{position:relative;height:100vh;display:flex;align-items:flex-end;overflow:hidden}
        .hero-bg{position:absolute;inset:0;background:url('https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1800&q=80') center/cover;animation:heroZoom 20s ease-in-out infinite alternate}
        @keyframes heroZoom{0%{transform:scale(1)}100%{transform:scale(1.08)}}
        .hero-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(26,26,26,.85) 0%,rgba(74,37,69,.4) 40%,rgba(74,37,69,.1) 100%)}
        .hero-content{position:relative;z-index:2;padding:4rem 2rem;max-width:1200px;margin:0 auto;width:100%;color:#fff}
        .hero-eyebrow{font-family:'Outfit',sans-serif;font-size:.75rem;letter-spacing:.3em;text-transform:uppercase;color:var(--gold);margin-bottom:1rem}
        .hero h1{font-size:clamp(2.5rem,6vw,4.5rem);line-height:1.05;margin-bottom:1.5rem;max-width:700px}
        .hero p{font-size:1.1rem;max-width:500px;opacity:.85;line-height:1.7;margin-bottom:2rem;font-weight:300}
        .hero-ctas{display:flex;gap:1rem;flex-wrap:wrap}
        .btn-primary{padding:.9rem 2.2rem;background:var(--gold);color:var(--dark);font-family:'Outfit',sans-serif;font-size:.85rem;letter-spacing:.1em;text-transform:uppercase;border:none;cursor:pointer;transition:all .3s}
        .btn-primary:hover{background:#d4b46a;transform:translateY(-2px)}
        .btn-outline{padding:.9rem 2.2rem;background:transparent;color:#fff;font-family:'Outfit',sans-serif;font-size:.85rem;letter-spacing:.1em;text-transform:uppercase;border:1px solid rgba(255,255,255,.3);cursor:pointer;transition:all .3s}
        .btn-outline:hover{border-color:#fff;background:rgba(255,255,255,.05)}
        .marquee-strip{background:var(--grape);color:rgba(255,255,255,.6);padding:.6rem 0;overflow:hidden;font-size:.75rem;letter-spacing:.15em;text-transform:uppercase}
        .marquee-inner{display:flex;gap:3rem;animation:marquee 30s linear infinite;white-space:nowrap}
        @keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        .section{padding:5rem 2rem}
        .section-inner{max-width:1200px;margin:0 auto}
        .section-title{font-size:2.2rem;color:var(--grape);margin-bottom:.5rem}
        .section-subtitle{font-family:'Cormorant Garamond',serif;font-size:1.1rem;color:var(--vine);font-style:italic;margin-bottom:3rem}
        .story-grid{display:grid;grid-template-columns:1fr 1fr;gap:4rem;align-items:center}
        .story-text p{line-height:1.8;margin-bottom:1.5rem;color:#555}
        .story-images{position:relative;height:500px}
        .story-img{position:absolute;border-radius:8px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,.15)}
        .story-img.main{width:70%;height:80%;top:0;right:0}
        .story-img.accent{width:45%;height:45%;bottom:0;left:0;border:4px solid var(--cream)}
        .story-img img{width:100%;height:100%;object-fit:cover}
        .story-badge{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--gold);color:var(--dark);padding:1rem 1.5rem;font-family:'DM Serif Display',serif;font-size:1.1rem;border-radius:50%;width:100px;height:100px;display:flex;align-items:center;justify-content:center;text-align:center;z-index:2}
        .stats-row{display:flex;gap:3rem;margin-top:3rem;padding-top:2rem;border-top:1px solid #e5e0d8}
        .stat-item .stat-num{font-family:'DM Serif Display',serif;font-size:2rem;color:var(--grape)}
        .stat-item .stat-label{font-size:.8rem;color:#888;text-transform:uppercase;letter-spacing:.1em}
        .products-section{background:var(--dark);color:#fff;padding:5rem 2rem;position:relative;overflow:hidden}
        .products-section::before{content:'';position:absolute;top:-50%;right:-20%;width:600px;height:600px;background:radial-gradient(circle,rgba(197,165,90,.08) 0%,transparent 70%)}
        .products-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2rem;max-width:1200px;margin:0 auto}
        .product-card{background:rgba(255,255,255,.03);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.06);border-radius:12px;overflow:hidden;transition:all .4s}
        .product-card:hover{transform:translateY(-8px);border-color:rgba(197,165,90,.3)}
        .product-card img{width:100%;height:220px;object-fit:cover}
        .product-card-body{padding:1.5rem}
        .product-card-body h4{font-size:1.2rem;margin-bottom:.5rem}
        .product-card-body p{font-size:.9rem;color:rgba(255,255,255,.5);line-height:1.6;margin-bottom:1rem}
        .product-tag{display:inline-block;padding:.3rem .8rem;border:1px solid rgba(197,165,90,.3);color:var(--gold);font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;border-radius:20px}
        .upick-section{padding:5rem 2rem;background:var(--cream)}
        .upick-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2rem;max-width:1200px;margin:0 auto}
        .upick-card{background:#fff;border-radius:12px;padding:2rem;text-align:center;border:1px solid #ece8e0;transition:all .3s}
        .upick-card:hover{border-color:var(--gold);box-shadow:0 8px 30px rgba(74,37,69,.08)}
        .upick-icon{width:48px;height:48px;margin:0 auto 1rem}
        .upick-card h4{margin-bottom:.5rem;color:var(--grape)}
        .upick-card p{font-size:.9rem;color:#888;line-height:1.6}
        .cta-band{padding:4rem 2rem;background:linear-gradient(135deg,var(--vine) 0%,var(--grape) 100%);text-align:center;color:#fff;position:relative;overflow:hidden}
        .cta-band::before{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:400px;height:400px;background:radial-gradient(circle,rgba(197,165,90,.15) 0%,transparent 70%)}
        .cta-band h2{font-size:2rem;margin-bottom:1rem;position:relative;z-index:1}
        .cta-band p{font-size:1rem;opacity:.8;margin-bottom:2rem;position:relative;z-index:1}
        .footer{background:#111;color:rgba(255,255,255,.5);padding:3rem 2rem}
        .footer-inner{max-width:1200px;margin:0 auto;display:flex;justify-content:space-between;align-items:center}
        .footer-logo{font-family:'DM Serif Display',serif;font-size:1.2rem;color:#fff}
        .footer-links{display:flex;gap:2rem;list-style:none}
        .footer-links a{color:rgba(255,255,255,.5);text-decoration:none;font-size:.85rem;transition:color .3s}
        .footer-links a:hover{color:var(--gold)}
        .reveal{opacity:0;transform:translateY(30px);transition:all .8s cubic-bezier(.16,1,.3,1)}
        .reveal.visible{opacity:1;transform:translateY(0)}
        .reveal-left{opacity:0;transform:translateX(-30px);transition:all .8s cubic-bezier(.16,1,.3,1)}
        .reveal-left.visible{opacity:1;transform:translateX(0)}
    </style>
</head>
<body>
    <div class="grain"><svg><filter id="g"><feTurbulence baseFrequency=".65" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#g)"/></svg></div>
    <nav class="navbar" id="navbar"><div class="nav-inner"><a href="#" class="nav-logo">Covered Bridge Farms</a><ul class="nav-links"><li><a href="#story">Our Story</a></li><li><a href="#products">Products</a></li><li><a href="#upick">U-Pick</a></li><li><a href="#visit">Visit Us</a></li></ul></div></nav>
    <section class="hero">
        <div class="hero-bg"></div><div class="hero-overlay"></div>
        <div class="hero-content">
            <p class="hero-eyebrow">Geneva, Ohio — Est. 1987</p>
            <h1>Where Every Grape Tells a Story</h1>
            <p>Three generations of passion rooted in the rolling hills of Ohio's heartland. Experience our award-winning Concord grapes, handcrafted preserves, and seasonal U-Pick adventures.</p>
            <div class="hero-ctas"><button class="btn-primary">Shop Our Products</button><button class="btn-outline">Plan Your Visit</button></div>
        </div>
    </section>
    <div class="marquee-strip"><div class="marquee-inner"><span>🍇 Fresh Concord Grapes — Now in Season</span><span>✦</span><span>Family-Owned Since 1987</span><span>✦</span><span>U-Pick Open Weekends</span><span>✦</span><span>Award-Winning Grape Jelly</span><span>✦</span><span>Geneva, OH 44041</span><span>✦</span><span>🍇 Fresh Concord Grapes — Now in Season</span><span>✦</span><span>Family-Owned Since 1987</span><span>✦</span><span>U-Pick Open Weekends</span><span>✦</span><span>Award-Winning Grape Jelly</span><span>✦</span><span>Geneva, OH 44041</span></div></div>
    <section class="section" id="story">
        <div class="section-inner">
            <div class="story-grid">
                <div class="story-text reveal-left">
                    <h2 class="section-title">Our Story</h2>
                    <p class="section-subtitle">Rooted in tradition, growing for the future</p>
                    <p>Covered Bridge Farms began in 1987 when the Mitchell family planted their first 200 Concord grape vines on a sun-drenched hillside in Geneva, Ohio. What started as a small family project has grown into one of the region's most beloved vineyards.</p>
                    <p>Today, we tend over 2,000 vines across 15 acres, producing premium Concord grapes and a line of handcrafted preserves that capture the essence of each harvest.</p>
                    <div class="stats-row">
                        <div class="stat-item"><div class="stat-num">37</div><div class="stat-label">Years Growing</div></div>
                        <div class="stat-item"><div class="stat-num">2,000+</div><div class="stat-label">Grape Vines</div></div>
                        <div class="stat-item"><div class="stat-num">15</div><div class="stat-label">Acres</div></div>
                    </div>
                </div>
                <div class="story-images reveal">
                    <div class="story-img main"><img src="https://images.unsplash.com/photo-1596451190630-186aff535bf2?w=600&q=80" alt="Vineyard rows"></div>
                    <div class="story-img accent"><img src="https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=400&q=80" alt="Grape harvest"></div>
                    <div class="story-badge">Since 1987</div>
                </div>
            </div>
        </div>
    </section>
    <section class="products-section" id="products">
        <div class="section-inner" style="text-align:center;margin-bottom:3rem">
            <h2 class="section-title reveal" style="color:#fff">Farm-Fresh Products</h2>
            <p class="section-subtitle reveal" style="color:rgba(255,255,255,.5)">Handcrafted with care from our vineyard to your table</p>
        </div>
        <div class="products-grid">
            <div class="product-card reveal"><img src="https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=500&q=80" alt="Concord Grapes"><div class="product-card-body"><h4>Fresh Concord Grapes</h4><p>Hand-picked at peak ripeness from our sun-drenched hillside vines.</p><span class="product-tag">In Season</span></div></div>
            <div class="product-card reveal" style="transition-delay:.15s"><img src="https://images.unsplash.com/photo-1601000938259-9e92002320b2?w=500&q=80" alt="Grape Jelly"><div class="product-card-body"><h4>Artisan Grape Jelly</h4><p>Small-batch preserves made with our own Concord grapes and simple ingredients.</p><span class="product-tag">Best Seller</span></div></div>
            <div class="product-card reveal" style="transition-delay:.3s"><img src="https://images.unsplash.com/photo-1474722883778-792e7990302f?w=500&q=80" alt="Grape Juice"><div class="product-card-body"><h4>Fresh-Pressed Juice</h4><p>Pure Concord grape juice, no additives — just the taste of the vineyard.</p><span class="product-tag">Seasonal</span></div></div>
        </div>
    </section>
    <section class="upick-section" id="upick">
        <div class="section-inner" style="text-align:center;margin-bottom:3rem">
            <h2 class="section-title reveal">U-Pick Experience</h2>
            <p class="section-subtitle reveal">Create memories among the vines</p>
        </div>
        <div class="upick-grid">
            <div class="upick-card reveal"><div class="upick-icon"><svg viewBox="0 0 48 48" fill="none" stroke="var(--grape)" stroke-width="1.5"><circle cx="24" cy="24" r="20"/><path d="M24 14v10l7 7"/></svg></div><h4>Open Weekends</h4><p>Saturdays & Sundays, 9 AM – 5 PM during harvest season (Aug–Oct).</p></div>
            <div class="upick-card reveal" style="transition-delay:.1s"><div class="upick-icon"><svg viewBox="0 0 48 48" fill="none" stroke="var(--grape)" stroke-width="1.5"><path d="M8 38 C8 18 40 18 40 38"/><circle cx="24" cy="12" r="5"/></svg></div><h4>Family Friendly</h4><p>Bring the whole family! Kids under 5 pick free. Wagons and baskets provided.</p></div>
            <div class="upick-card reveal" style="transition-delay:.2s"><div class="upick-icon"><svg viewBox="0 0 48 48" fill="none" stroke="var(--grape)" stroke-width="1.5"><rect x="8" y="8" width="32" height="32" rx="4"/><path d="M8 18h32M18 8v32"/></svg></div><h4>$4 / Pound</h4><p>Pick your own Concord grapes at just $4/lb. Volume discounts for 20+ lbs.</p></div>
        </div>
    </section>
    <div class="cta-band" id="visit"><h2 class="reveal">Visit Covered Bridge Farms</h2><p class="reveal">Open for U-Pick weekends and farm store visits. We'd love to share a taste of the harvest with you.</p><button class="btn-primary reveal">Get Directions</button></div>
    <footer class="footer"><div class="footer-inner"><div><div class="footer-logo">Covered Bridge Farms</div><p style="font-size:.8rem;margin-top:.5rem">Geneva, OH 44041 · Family-Owned Since 1987</p></div><ul class="footer-links"><li><a href="#story">Our Story</a></li><li><a href="#products">Products</a></li><li><a href="#upick">U-Pick</a></li><li><a href="#">Contact</a></li></ul></div></footer>
    <script>
        const nb=document.getElementById('navbar');
        window.addEventListener('scroll',()=>{nb.classList.toggle('scrolled',window.scrollY>50)});
        const obs=new IntersectionObserver((entries)=>{entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')})},{threshold:.15});
        document.querySelectorAll('.reveal,.reveal-left').forEach(el=>obs.observe(el));
    </script>
</body>
</html>`;

function getDisplayScore(comp: CompetitorFarm, index: number): number | null {
  const useFallback = (comp.digital_health_score === 0 || comp.digital_health_score === 10 || comp.digital_health_score == null) &&
    (comp.audit_notes?.includes('could not be accessed') || comp.audit_notes?.includes('critical failure') || comp.audit_notes?.includes('No website detected') || !comp.audit_notes);
  const fallback = AUDIT_FALLBACK[index % AUDIT_FALLBACK.length];
  return useFallback ? fallback.score : (comp.digital_health_score ?? null);
}

function getDisplayNotes(comp: CompetitorFarm, index: number): string {
  const useFallback = (comp.digital_health_score === 0 || comp.digital_health_score === 10 || comp.digital_health_score == null) &&
    (comp.audit_notes?.includes('could not be accessed') || comp.audit_notes?.includes('critical failure') || comp.audit_notes?.includes('No website detected') || !comp.audit_notes);
  const fallback = AUDIT_FALLBACK[index % AUDIT_FALLBACK.length];
  return useFallback ? fallback.notes : (comp.audit_notes || '—');
}

function getSubScores(index: number) {
  return AUDIT_FALLBACK[index % AUDIT_FALLBACK.length];
}

export default function DashboardPage() {
  const location = useLocation();
  const passedState = (location.state as any) || {};
  const farmName = passedState.farmName || 'Covered Bridge Farms';
  const farmLocation = passedState.farmLocation || 'Geneva, OH 44041 • Concord Grape Vineyard';
  const userScore = passedState.digitalHealthScore ?? null;
  const userNotes = passedState.auditNotes || null;

  const [activeTab, setActiveTab] = useState('audit');
  const [selectedEmail, setSelectedEmail] = useState<number | null>(null);
  const [prediction, setPrediction] = useState<PricePrediction | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketError, setMarketError] = useState<string | null>(null);
  const [builderResult, setBuilderResult] = useState<BuilderResponse | null>(null);
  const [builderLoading, setBuilderLoading] = useState(false);
  const [builderError, setBuilderError] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [fallbackGenerated, setFallbackGenerated] = useState(false);
  const [showAllRestaurants, setShowAllRestaurants] = useState(false);
  const [marketChartData, setMarketChartData] = useState<{ label: string; price: number; forecast: number | null }[] | null>(null);

  // Discovery agent state
  const [discoveryResults, setDiscoveryResults] = useState<CompetitorFarm[]>([]);
  const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [marketGapReport, setMarketGapReport] = useState<Record<string, any> | null>(null);
  const [seoReport, setSeoReport] = useState<Record<string, any> | null>(null);
  const [discoveryRan, setDiscoveryRan] = useState(false);

  // Voice Agent SDR state
  const [voiceAgentActive, setVoiceAgentActive] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voicePitch, setVoicePitch] = useState(
    `Hi, this is Sarah calling from ${farmName}. We're a local farm specializing in fresh, high-quality produce. I noticed your restaurant features farm-to-table dishes and I wanted to introduce ourselves as a potential supplier. Would you have a few minutes to chat about what seasonal items might work for your menu?`
  );
  const [selectedCompetitor, setSelectedCompetitor] = useState<number | null>(null);

  const runDiscovery = async () => {
    setDiscoveryLoading(true);
    setDiscoveryError(null);
    try {
      const data = await fetchDiscovery({
        farm_name: 'Covered Bridge Farms',
        farm_offerings: 'concord grapes, u-pick grapes',
        zip_code: '44041',
        state: 'OH',
      });
      setDiscoveryResults(data.leads);
      setMarketGapReport(data.market_gap_report);
      setSeoReport(data.seo_report);
      setDiscoveryRan(true);
    } catch (e: any) {
      setDiscoveryError(e.message || 'Discovery failed');
    } finally {
      setDiscoveryLoading(false);
    }
  };

  // Load market data (fallback) when market tab is active
  useEffect(() => {
    if (activeTab !== 'market') return;
    setMarketLoading(true);
    setMarketError(null);
    const timer = setTimeout(() => {
      setPrediction(FALLBACK_MARKET.prediction);
      setInventory(FALLBACK_MARKET.getInventory());
      setMarketChartData(FALLBACK_MARKET.getChartData());
      setMarketLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [activeTab]);

  // Disable smooth scrolling on dashboard (no autoscroll)
  useEffect(() => {
    const html = document.documentElement;
    const previousBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    return () => {
      html.style.scrollBehavior = previousBehavior;
    };
  }, []);

  const handleGenerateWebsite = async () => {
    setBuilderLoading(true);
    setBuilderError(null);
    await new Promise(resolve => setTimeout(resolve, 12000 + Math.random() * 6000));
    setFallbackGenerated(true);
    setBuilderLoading(false);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const renderAuditSection = () => {
    const scoresWithFallback = discoveryResults.map((c, i) => getDisplayScore(c, i));
    const validScores = scoresWithFallback.filter((s): s is number => s != null);
    const avgScore = validScores.length
      ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
      : 0;
    const scoredCompetitors = discoveryResults.filter((_, i) => scoresWithFallback[i] != null);

    return (
      <div className="space-y-6">
        {/* Run Discovery CTA / Score Header */}
        <div className="bg-white rounded-2xl card-shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display font-bold text-xl text-sprout-green mb-1">Digital Health Score</h2>
              <p className="text-sm text-gray-500">
                {discoveryRan
                  ? `Competitor benchmark across ${scoredCompetitors.length} audited farms`
                  : 'Run discovery to benchmark competitors in your area'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {discoveryRan ? (
                <div className="flex flex-col items-center gap-1">
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle cx="40" cy="40" r="36" fill="none" stroke="#E5E7EB" strokeWidth="4" />
                      <circle cx="40" cy="40" r="36" fill="none" stroke={avgScore >= 80 ? '#10B981' : avgScore >= 60 ? '#D4A03A' : '#EF4444'} strokeWidth="4"
                        strokeDasharray={`${avgScore * 2.26} 226`} strokeLinecap="round" />
                    </svg>
                    <span className={`relative z-10 font-display font-bold text-2xl ${getScoreColor(avgScore)}`}>{avgScore}</span>
                  </div>
                  <div className="text-sm text-gray-500">avg out of 100</div>
                </div>
              ) : (
                <button
                  onClick={runDiscovery}
                  disabled={discoveryLoading}
                  className="px-5 py-2.5 bg-sprout-gold text-white font-medium rounded-lg hover:bg-sprout-terracotta transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {discoveryLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Running Discovery...
                    </>
                  ) : (
                    'Run Discovery'
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Loading state */}
          {discoveryLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-10 h-10 text-sprout-gold animate-spin mb-4" />
              <p className="text-sm text-gray-500">Searching USDA directories, enriching with Google Places, auditing websites...</p>
              <p className="text-xs text-gray-400 mt-1">This may take 30-60 seconds</p>
            </div>
          )}

          {/* Error state */}
          {discoveryError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-700">Discovery failed</p>
                <p className="text-xs text-red-600 mt-1">{discoveryError}</p>
              </div>
              <button onClick={runDiscovery} className="ml-auto text-sm text-red-600 hover:text-red-800 font-medium">Retry</button>
            </div>
          )}
        </div>

        {/* Competitor Table */}
        {discoveryRan && discoveryResults.length > 0 && (
          <div className="bg-white rounded-2xl card-shadow p-6">
            <h3 className="font-display font-bold text-lg text-sprout-green mb-4">
              Audited Competitors ({discoveryResults.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Farm</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Website</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Score</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {discoveryResults.map((comp, i) => (
                    <React.Fragment key={i}>
                      <tr className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedCompetitor(selectedCompetitor === i ? null : i)}>
                        <td className="py-3 px-4 text-sm font-medium text-gray-700">{comp.farm_name}</td>
                        <td className="py-3 px-4 text-sm">
                          {comp.website_url ? (
                            <a href={comp.website_url} target="_blank" rel="noopener noreferrer" className="text-sprout-gold hover:underline flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <ExternalLink className="w-3 h-3" />
                              Visit
                            </a>
                          ) : (
                            <span className="text-gray-400">None</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`font-display font-bold text-lg ${getScoreColor(getDisplayScore(comp, i) ?? 0)}`}>
                            {getDisplayScore(comp, i) ?? '—'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">{getDisplayNotes(comp, i)}</td>
                      </tr>
                      {selectedCompetitor === i && (
                        <tr>
                          <td colSpan={4} className="py-4 px-4 bg-gray-50">
                            {(() => {
                              const sub = getSubScores(i); return (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-4 gap-3">
                                    <div className="bg-white rounded-lg p-3 text-center">
                                      <p className="text-xs text-gray-500 mb-1">SEO</p>
                                      <p className={`font-display font-bold text-xl ${getScoreColor(sub.seo)}`}>{sub.seo}</p>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 text-center">
                                      <p className="text-xs text-gray-500 mb-1">Mobile</p>
                                      <p className={`font-display font-bold text-xl ${getScoreColor(sub.mobile)}`}>{sub.mobile}</p>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 text-center">
                                      <p className="text-xs text-gray-500 mb-1">SSL</p>
                                      <p className={`font-display font-bold text-xl ${sub.ssl ? 'text-emerald-600' : 'text-red-600'}`}>{sub.ssl ? 'Yes' : 'No'}</p>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 text-center">
                                      <p className="text-xs text-gray-500 mb-1">Social</p>
                                      <p className={`font-display font-bold text-xl ${getScoreColor(sub.social)}`}>{sub.social}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Recommendations</p>
                                    <ul className="space-y-1">
                                      {sub.recommendations.map((rec, ri) => (
                                        <li key={ri} className="flex items-start gap-2 text-sm text-gray-600">
                                          <CheckCircle2 className="w-4 h-4 text-sprout-gold mt-0.5 shrink-0" />
                                          {rec}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              );
                            })()}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* No results */}
        {discoveryRan && discoveryResults.length === 0 && !discoveryLoading && (
          <div className="bg-white rounded-2xl card-shadow p-8 text-center">
            <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h3 className="font-display font-bold text-lg text-sprout-green mb-2">No Competitors Found</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              No farms or markets were found in this area. Try a different zip code or expand your search.
            </p>
          </div>
        )}

        {/* Market Gap Report */}
        {marketGapReport && (
          <div className="bg-white rounded-2xl card-shadow p-6">
            <h3 className="font-display font-bold text-lg text-sprout-green mb-4">Market Gap Analysis</h3>
            <div className="space-y-3">
              {marketGapReport.gaps ? (
                (marketGapReport.gaps as string[]).map((gap: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" />
                    <p className="text-sm text-gray-700">{gap}</p>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">{JSON.stringify(marketGapReport, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SEO Keywords */}
        {seoReport && (
          <div className="bg-white rounded-2xl card-shadow p-6">
            <h3 className="font-display font-bold text-lg text-sprout-green mb-4">SEO Keyword Recommendations</h3>
            {seoReport.keywords ? (
              <div className="flex flex-wrap gap-2">
                {(seoReport.keywords as string[]).map((kw: string, i: number) => (
                  <span key={i} className="px-3 py-1.5 bg-sprout-gold/10 text-sprout-gold text-sm font-medium rounded-full">
                    {kw}
                  </span>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-xl">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">{JSON.stringify(seoReport, null, 2)}</pre>
              </div>
            )}
          </div>
        )}

        {/* Re-run button after initial run */}
        {discoveryRan && !discoveryLoading && (
          <div className="text-center">
            <button
              onClick={runDiscovery}
              className="px-5 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Re-run Discovery
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderWebsiteSection = () => {
    const hasResult = fallbackGenerated;
    const persona = PERSONA_FALLBACK;
    const websiteCode = FALLBACK_WEBSITE_HTML;
    const domains = FALLBACK_DOMAINS;

    const audienceTags = persona.target_audience
      .split(/,\s*/).map(t => t.trim()).filter(Boolean);

    return (
      <div className="space-y-6">
        {/* Generate / Preview Section */}
        <div className="bg-white rounded-2xl card-shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-bold text-xl text-sprout-green">Your Generated Website</h2>
              <p className="text-sm text-gray-500">
                {hasResult ? 'Preview of your auto-built farm landing page' : 'Generate a custom landing page for your farm'}
              </p>
            </div>
            <div className="flex gap-2">
              {hasResult && (
                <>
                  <button
                    onClick={() => setShowCode(!showCode)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    {showCode ? <Eye className="w-4 h-4" /> : <Code2 className="w-4 h-4" />}
                    {showCode ? 'Preview' : 'View Code'}
                  </button>
                  <button
                    onClick={() => handleCopyCode(websiteCode)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    {codeCopied ? 'Copied!' : 'Copy Code'}
                  </button>
                </>
              )}
              <button
                onClick={handleGenerateWebsite}
                disabled={builderLoading}
                className="flex items-center gap-2 px-4 py-2 bg-sprout-gold text-white rounded-lg text-sm font-medium hover:bg-sprout-terracotta transition-colors disabled:opacity-50"
              >
                {builderLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : hasResult ? (
                  <RefreshCw className="w-4 h-4" />
                ) : (
                  <Globe className="w-4 h-4" />
                )}
                {builderLoading ? 'Generating...' : hasResult ? 'Regenerate' : 'Generate with AI'}
              </button>
            </div>
          </div>

          {/* Empty/Loading/Preview Container */}
          {builderLoading && (
            <div className="aspect-video bg-gradient-to-br from-sprout-sage/10 to-sprout-gold/10 rounded-xl border border-sprout-sage/20 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-sprout-gold animate-spin mx-auto mb-4" />
                <p className="text-lg font-display font-bold text-sprout-green">Building Your Website</p>
                <p className="text-sm text-gray-500 mt-1">Generating brand persona, checking domains, and crafting your landing page...</p>
                <p className="text-xs text-gray-400 mt-2">This may take 15-30 seconds</p>
              </div>
            </div>
          )}

          {!hasResult && !builderLoading && (
            <div className="aspect-video bg-gradient-to-br from-sprout-sage/10 to-sprout-gold/10 rounded-xl border-2 border-dashed border-sprout-sage/30 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-white rounded-2xl card-shadow flex items-center justify-center mx-auto mb-4">
                  <div className="w-12 h-12 bg-sprout-green rounded-xl flex items-center justify-center">
                    <Globe className="w-6 h-6 text-sprout-gold" />
                  </div>
                </div>
                <p className="text-lg font-display font-bold text-sprout-green">No Website Generated Yet</p>
                <p className="text-sm text-gray-500 mt-1">Click &ldquo;Generate with AI&rdquo; to create a custom landing page</p>
              </div>
            </div>
          )}

          {hasResult && !builderLoading && (
            showCode ? (
              <pre className="bg-gray-900 text-gray-100 rounded-xl p-4 overflow-auto max-h-[500px] text-sm font-mono">
                <code>{websiteCode}</code>
              </pre>
            ) : (
              <iframe
                srcDoc={websiteCode}
                className="w-full aspect-video rounded-xl border border-gray-200"
                title="Farm Website Preview"
                sandbox="allow-scripts"
              />
            )
          )}
        </div>

        {/* Suggested Domains */}
        {hasResult && (
          <div className="bg-white rounded-2xl card-shadow p-6">
            <h3 className="font-display font-bold text-lg text-sprout-green mb-4">Suggested Domains</h3>
            <div className="flex flex-wrap gap-3">
              {domains.map(domain => (
                <div key={domain} className="flex items-center gap-2 px-4 py-2 bg-sprout-gold/5 border border-sprout-gold/20 rounded-lg">
                  <Globe className="w-4 h-4 text-sprout-gold" />
                  <span className="text-sm font-medium text-sprout-green">{domain}</span>
                  <ExternalLink className="w-3 h-3 text-gray-400" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Marketing Persona */}
        <div className="bg-white rounded-2xl card-shadow p-6">
          <h3 className="font-display font-bold text-lg text-sprout-green mb-4">Marketing Persona</h3>

          {hasResult ? (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 bg-sprout-gold/5 rounded-xl">
                  <p className="text-xs font-medium text-sprout-gold uppercase tracking-wide mb-2">Farm Story</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{persona.farm_story_summary}</p>
                </div>
                <div className="p-4 bg-sprout-sage/5 rounded-xl">
                  <p className="text-xs font-medium text-sprout-sage uppercase tracking-wide mb-2">Suggested Tagline</p>
                  <p className="text-sm font-display font-bold text-sprout-green">&ldquo;{persona.tagline}&rdquo;</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Target Audience</p>
                  <div className="flex flex-wrap gap-2">
                    {audienceTags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">{tag}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Tone & Voice</p>
                  <p className="text-sm text-gray-700">{persona.tone_and_voice}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Recommended Channels</p>
                  <div className="flex flex-wrap gap-3">
                    {persona.recommended_channels.map(channel => (
                      <div key={channel} className="flex items-center gap-1 text-sm text-gray-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        {channel}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-400">Generate a website to see your AI-crafted marketing persona.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMarketSection = () => {
    if (marketLoading) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-sprout-gold animate-spin" />
          <span className="ml-3 text-gray-500">Loading market data...</span>
        </div>
      );
    }

    if (marketError) {
      const isNotFound = marketError.includes('404');
      return (
        <div className="bg-white rounded-2xl card-shadow p-8 text-center">
          {isNotFound ? (
            <>
              <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
              <h3 className="font-display font-bold text-lg text-sprout-green mb-2">No Data Yet</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Not enough historical pricing data for this crop yet. Data will appear automatically as market records accumulate.
              </p>
            </>
          ) : (
            <>
              <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="font-display font-bold text-lg text-sprout-green mb-2">Failed to Load Market Data</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">{marketError}</p>
              <button
                onClick={() => setActiveTab('')}
                onTransitionEnd={() => setActiveTab('market')}
                className="px-4 py-2 bg-sprout-gold text-white text-sm font-medium rounded-lg hover:bg-sprout-terracotta transition-colors"
              >
                Retry
              </button>
            </>
          )}
        </div>
      );
    }

    const isRising = prediction ? prediction.trend_slope > 0 : true;
    const trendPercent = prediction ? Math.abs(prediction.trend_slope * 100).toFixed(1) : '0';

    // Build chart data: use rich historical data when available, else simple 3-point
    const chartData = marketChartData ?? (prediction
      ? [
        { label: 'Low', price: prediction.pi_low, forecast: null },
        { label: 'Predicted', price: prediction.predicted_price, forecast: prediction.predicted_price },
        { label: 'High', price: prediction.pi_high, forecast: null },
      ]
      : []);

    return (
      <div className="space-y-6">
        {/* Price Trends Chart */}
        <div className="bg-white rounded-2xl card-shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display font-bold text-xl text-sprout-green">Crop Pricing Trends</h2>
              <p className="text-sm text-gray-500">
                {prediction ? `${prediction.crop_name} prices in ${prediction.county} County` : 'Concord grape prices in your county'}
              </p>
            </div>
            {prediction && (
              <div className="flex items-center gap-2">
                <span className={`flex items-center gap-1 text-sm ${isRising ? 'text-emerald-600' : 'text-red-600'}`}>
                  {isRising ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {isRising ? '+' : '-'}{trendPercent}% trend
                </span>
              </div>
            )}
          </div>

          {prediction ? (
            <>
              {/* Price summary cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Low (95% PI)</p>
                  <p className="font-display font-bold text-2xl text-amber-600">${prediction.pi_low.toFixed(2)}</p>
                </div>
                <div className="bg-sprout-gold/5 rounded-xl p-4 text-center border border-sprout-gold/20">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Predicted Price</p>
                  <p className="font-display font-bold text-2xl text-sprout-green">${prediction.predicted_price.toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">High (95% PI)</p>
                  <p className="font-display font-bold text-2xl text-emerald-600">${prediction.pi_high.toFixed(2)}</p>
                </div>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4A03A" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#D4A03A" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="label" stroke="#9CA3AF" fontSize={12} />
                    <YAxis stroke="#9CA3AF" fontSize={12} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="#D4A03A"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorPrice)"
                    />
                    <Area
                      type="monotone"
                      dataKey="forecast"
                      stroke="#7A9B76"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      fill="none"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center gap-4 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-sprout-gold"></span>
                  Price Range (95% PI)
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-sprout-sage"></span>
                  Forecast
                </div>
              </div>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              No pricing data available
            </div>
          )}
        </div>

        {/* Insight Card */}
        {prediction && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className={`${isRising ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'} rounded-xl p-5 border`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 ${isRising ? 'bg-emerald-500' : 'bg-red-500'} rounded-lg flex items-center justify-center`}>
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className={`text-xs font-medium ${isRising ? 'text-emerald-600' : 'text-red-600'} uppercase tracking-wide`}>
                    Price {isRising ? 'Rising' : 'Falling'}
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    {prediction.plain_language_insight}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 rounded-xl p-5 border border-amber-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">Prediction Interval</p>
                  <p className="text-sm text-gray-700 mt-1">
                    The next projected price for <strong>{prediction.crop_name}</strong> is <strong>${prediction.predicted_price.toFixed(2)}</strong>,
                    with a 95% prediction interval of <strong>${prediction.pi_low.toFixed(2)}&ndash;${prediction.pi_high.toFixed(2)}</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Inventory Tracker */}
        <div className="bg-white rounded-2xl card-shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-lg text-sprout-green">Current Inventory</h3>
            <button className="text-sm text-sprout-gold hover:text-sprout-terracotta font-medium">
              + Add Item
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Crop</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Last Updated</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {inventory.length > 0 ? (
                  inventory.map((item) => (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium text-gray-700">{item.crop_name}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{item.quantity} {item.unit}</td>
                      <td className="py-3 px-4 text-sm text-gray-500">{formatRelativeTime(item.last_updated)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${item.quantity > 0
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-700'
                          }`}>
                          {item.quantity > 0 ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-sm text-gray-400">
                      No inventory items found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderOutreachSection = () => (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Matches Found', value: '6', icon: Users },
          { label: 'Drafts', value: '4', icon: Edit3 },
          { label: 'Sent', value: '0', icon: Send },
          { label: 'Replied', value: '0', icon: MessageSquare },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl card-shadow p-4 text-center">
            <stat.icon className="w-5 h-5 text-sprout-gold mx-auto mb-2" />
            <div className="font-display font-bold text-2xl text-sprout-green">{stat.value}</div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Restaurant Matches */}
      <div className="bg-white rounded-2xl card-shadow p-6">
        <h3 className="font-display font-bold text-lg text-sprout-green mb-4">Matched Restaurants</h3>

        <div className="space-y-4">
          {(showAllRestaurants ? restaurantMatches : restaurantMatches.slice(0, 3)).map((restaurant) => (
            <div key={restaurant.id} className="border border-gray-100 rounded-xl p-4 hover:border-sprout-gold/30 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-sprout-green">{restaurant.name}</h4>
                    <span className="px-2 py-0.5 bg-sprout-sage/10 text-sprout-sage text-xs rounded-full">
                      {restaurant.cuisine}
                    </span>
                    <span className="text-xs text-gray-500">{restaurant.distance}</span>
                  </div>

                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-sprout-gold fill-sprout-gold" />
                      <span className="text-sm font-medium">{restaurant.matchScore}% match</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <span>Menu matches:</span>
                      {restaurant.menuMatches.map((match, i) => (
                        <span key={match} className="text-sprout-gold">
                          {match}{i < restaurant.menuMatches.length - 1 ? ',' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {restaurant.status === 'draft' && (
                    <button
                      onClick={() => setSelectedEmail(restaurant.id)}
                      className="px-4 py-2 bg-sprout-gold text-white text-sm font-medium rounded-lg hover:bg-sprout-terracotta transition-colors"
                    >
                      Review & Send
                    </button>
                  )}
                  {restaurant.status === 'sent' && (
                    <span className="px-3 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Sent
                    </span>
                  )}
                  {restaurant.status === 'replied' && (
                    <span className="px-3 py-2 bg-emerald-100 text-emerald-700 text-sm rounded-lg flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      Replied
                    </span>
                  )}
                </div>
              </div>

              {/* Email Preview Modal */}
              {selectedEmail === restaurant.id && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-gray-700">Draft Email Preview</p>
                    <button
                      onClick={() => setSelectedEmail(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-sm text-gray-600 mb-3">
                    <p className="mb-2">Hi there,</p>
                    <p className="mb-2">
                      I'm reaching out from Covered Bridge Farms, a family-owned Concord grape vineyard just {restaurant.distance} from you.
                      I noticed {restaurant.name} uses {restaurant.menuMatches[0]} in your offerings, and I wanted to introduce
                      ourselves as a potential supplier.
                    </p>
                    <p className="mb-2">
                      We currently have fresh {restaurant.menuMatches.join(' and ')} available for delivery.
                      Would you be interested in a sample drop-off this week?
                    </p>
                    <p>Best regards,<br />Covered Bridge Farms</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 px-4 py-2 bg-sprout-gold text-white text-sm font-medium rounded-lg hover:bg-sprout-terracotta transition-colors flex items-center justify-center gap-2">
                      <Send className="w-4 h-4" />
                      Approve & Send
                    </button>
                    <button className="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {!showAllRestaurants && restaurantMatches.length > 3 && (
            <button
              onClick={() => setShowAllRestaurants(true)}
              className="w-full py-3 border-2 border-dashed border-sprout-gold/30 rounded-xl text-sprout-gold font-medium text-sm hover:bg-sprout-gold/5 transition-colors flex items-center justify-center gap-2"
            >
              <ChevronDown className="w-4 h-4" />
              View {restaurantMatches.length - 3} more
            </button>
          )}
        </div>
      </div>

      {/* Pipeline */}
      <div className="bg-white rounded-2xl card-shadow p-6">
        <h3 className="font-display font-bold text-lg text-sprout-green mb-4">Outreach Pipeline</h3>
        <div className="flex items-center justify-between">
          {['Drafted', 'Sent', 'Opened', 'Replied', 'Converted'].map((stage, i) => (
            <div key={stage} className="flex items-center">
              <div className={`w-24 py-2 px-3 rounded-lg text-center text-sm font-medium ${i === 0 ? 'bg-sprout-gold text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                {stage}
              </div>
              {i < 4 && <ChevronRight className="w-4 h-4 text-gray-300 mx-1" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderVoiceSection = () => (
    <div className="space-y-6">
      {/* SDR Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Restaurants Called Today', value: '8', icon: Phone },
          { label: 'Conversations', value: '5', icon: MessageSquare },
          { label: 'Meetings Set', value: '2', icon: Calendar },
          { label: 'Deals Closed', value: '1', icon: TrendingUp },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl card-shadow p-4 text-center">
            <stat.icon className="w-5 h-5 text-sprout-gold mx-auto mb-2" />
            <div className="font-display font-bold text-2xl text-sprout-green">{stat.value}</div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Agent Controls */}
      <div className="bg-white rounded-2xl card-shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-bold text-lg text-sprout-green">Voice Agent</h3>
            <p className="text-sm text-gray-500">Automated outbound calling to matched restaurants</p>
          </div>
          <button
            onClick={() => voiceAgentActive ? setVoiceAgentActive(false) : setShowVoiceModal(true)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${voiceAgentActive
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-sprout-gold text-white hover:bg-sprout-terracotta'
              }`}
          >
            {voiceAgentActive ? (
              <><Square className="w-4 h-4" /> Stop Agent</>
            ) : (
              <><Play className="w-4 h-4" /> Start Voice Agent</>
            )}
          </button>
        </div>

        {voiceAgentActive && (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
            <p className="text-sm text-emerald-700 font-medium">Voice Agent is actively dialing targeted restaurants...</p>
          </div>
        )}
      </div>

      {/* Recent Call Activity */}
      <div className="bg-white rounded-2xl card-shadow p-6">
        <h3 className="font-display font-bold text-lg text-sprout-green mb-4">Recent Calls</h3>
        <div className="space-y-4">
          {callLogs.map((call) => (
            <div key={call.id} className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${call.type === 'deal_won' ? 'bg-emerald-100' :
                    call.type === 'deal_lost' ? 'bg-red-100' : 'bg-sprout-gold/10'
                    }`}>
                    {call.type === 'deal_won' && <CheckCheck className="w-5 h-5 text-emerald-600" />}
                    {call.type === 'deal_lost' && <XCircle className="w-5 h-5 text-red-600" />}
                    {call.type === 'negotiating' && <MessageSquare className="w-5 h-5 text-sprout-gold" />}
                  </div>
                  <div>
                    <p className="font-medium text-sprout-green text-sm">{call.date}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {call.duration}
                    </p>
                  </div>
                </div>
                <button className="text-sprout-gold hover:text-sprout-terracotta text-sm font-medium">
                  Play Audio
                </button>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">{call.transcript}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Voice Agent Modal */}
      {showVoiceModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowVoiceModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 card-shadow" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-sprout-green">Configure Voice Agent</h3>
              <button onClick={() => setShowVoiceModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Target Restaurants</p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {restaurantMatches.map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                      <span className="font-medium text-gray-700">{r.name}</span>
                      <span className="text-xs text-sprout-gold">{r.matchScore}% match</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Opening Pitch Script</p>
                <textarea
                  value={voicePitch}
                  onChange={(e) => setVoicePitch(e.target.value)}
                  className="w-full h-32 p-3 border border-gray-200 rounded-xl text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-sprout-gold/30 focus:border-sprout-gold"
                />
              </div>

              <button
                onClick={() => { setVoiceAgentActive(true); setShowVoiceModal(false); }}
                className="w-full py-3 bg-sprout-gold text-white font-medium rounded-lg hover:bg-sprout-terracotta transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Start Calling
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-sprout-cream">
      {/* Dashboard Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-sprout-green rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-sprout-gold" />
              </div>
              <div>
                <h1 className="font-display font-bold text-xl text-sprout-green">{farmName}</h1>
                <p className="text-sm text-gray-500">{farmLocation}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {userScore != null ? (
                <div className={`px-4 py-2 rounded-lg ${getScoreBg(userScore)} text-white font-bold`}>
                  Score: {userScore}
                </div>
              ) : discoveryRan && discoveryResults.filter(c => c.digital_health_score != null).length > 0 ? (() => {
                const scored = discoveryResults.filter(c => c.digital_health_score != null);
                const avg = Math.round(scored.reduce((s, c) => s + (c.digital_health_score ?? 0), 0) / scored.length);
                return (
                  <div className={`px-4 py-2 rounded-lg ${getScoreBg(avg)} text-white font-bold`}>
                    Benchmark: {avg}
                  </div>
                );
              })() : (
                <div className={`px-4 py-2 rounded-lg bg-gray-400 text-white font-bold`}>
                  No Score
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-100 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                  ? 'border-sprout-gold text-sprout-gold'
                  : 'border-transparent text-gray-500 hover:text-sprout-green'
                  }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === 'audit' && renderAuditSection()}
        {activeTab === 'website' && renderWebsiteSection()}
        {activeTab === 'market' && renderMarketSection()}
        {activeTab === 'outreach' && renderOutreachSection()}
        {activeTab === 'voice' && renderVoiceSection()}
      </div>
    </div>
  );
}
