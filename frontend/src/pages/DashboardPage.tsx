import { useState, useEffect } from 'react';
import {
  LayoutDashboard, TrendingUp, Utensils, Mic, Globe,
  ChevronRight, ArrowUpRight, ArrowDownRight, Star,
  CheckCircle2, AlertCircle, XCircle, ExternalLink,
  Download, Send, Phone, Clock, Calendar,
  Users, MessageSquare, Edit3, CheckCheck, Loader2
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { fetchPredictivePricing, fetchInventory, fetchDiscovery } from '../lib/api';
import type { CompetitorFarm, DiscoveryResponse } from '../lib/api';
import type { PricePrediction, InventoryItem } from '../types/analytics';

const callLogs = [
  { id: 1, date: 'Today, 9:45 AM', duration: '2:34', transcript: 'Added 200 pounds of Roma tomatoes to inventory. Also sold 50 pounds to Blue Table Bistro.', type: 'inventory' },
  { id: 2, date: 'Yesterday, 4:20 PM', duration: '1:52', transcript: 'Logged harvest of 150 pounds of zucchini. Ready for market pickup tomorrow.', type: 'harvest' },
  { id: 3, date: 'Yesterday, 8:15 AM', duration: '3:10', transcript: 'Updated cucumber stock. Down to 100 pounds after weekend market sales.', type: 'update' },
];

const restaurantMatches = [
  { 
    id: 1, 
    name: 'Blue Table Bistro', 
    cuisine: 'Farm-to-Table',
    distance: '12 miles',
    matchScore: 94,
    menuMatches: ['heirloom tomatoes', 'organic zucchini'],
    status: 'draft'
  },
  { 
    id: 2, 
    name: 'Harvest Kitchen', 
    cuisine: 'Seasonal American',
    distance: '18 miles',
    matchScore: 87,
    menuMatches: ['bell peppers', 'cucumbers'],
    status: 'sent'
  },
  { 
    id: 3, 
    name: 'Green Leaf Cafe', 
    cuisine: 'Vegetarian',
    distance: '8 miles',
    matchScore: 82,
    menuMatches: ['organic produce', 'fresh herbs'],
    status: 'replied'
  },
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

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('audit');
  const [selectedEmail, setSelectedEmail] = useState<number | null>(null);
  const [prediction, setPrediction] = useState<PricePrediction | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketError, setMarketError] = useState<string | null>(null);

  // Discovery agent state
  const [discoveryResults, setDiscoveryResults] = useState<CompetitorFarm[]>([]);
  const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [marketGapReport, setMarketGapReport] = useState<Record<string, any> | null>(null);
  const [seoReport, setSeoReport] = useState<Record<string, any> | null>(null);
  const [discoveryRan, setDiscoveryRan] = useState(false);

  const runDiscovery = async () => {
    setDiscoveryLoading(true);
    setDiscoveryError(null);
    try {
      const data = await fetchDiscovery({
        farm_name: 'Sunset Valley Organics',
        farm_offerings: 'organic produce',
        zip_code: '97201',
        state: 'OR',
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

  // Fetch market data when market tab is active
  useEffect(() => {
    if (activeTab !== 'market') return;
    setMarketLoading(true);
    setMarketError(null);
    Promise.all([
      fetchPredictivePricing('Zucchini', 'Multnomah'),
      fetchInventory('00000000-0000-0000-0000-000000000000'), // TODO: Replace with actual farm ID from auth context
    ])
      .then(([pred, inv]) => {
        setPrediction(pred);
        setInventory(inv);
      })
      .catch((e) => setMarketError(e.message))
      .finally(() => setMarketLoading(false));
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

  const renderAuditSection = () => {
    const scoredCompetitors = discoveryResults.filter((c) => c.digital_health_score != null);
    const avgScore = scoredCompetitors.length
      ? Math.round(scoredCompetitors.reduce((sum, c) => sum + (c.digital_health_score ?? 0), 0) / scoredCompetitors.length)
      : 0;

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
                <>
                  <div className="text-right">
                    <div className={`font-display font-bold text-5xl ${getScoreColor(avgScore)}`}>{avgScore}</div>
                    <div className="text-sm text-gray-500">avg out of 100</div>
                  </div>
                  <div className="w-20 h-20 rounded-full border-4 border-gray-100 flex items-center justify-center relative">
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle cx="40" cy="40" r="36" fill="none" stroke="#E5E7EB" strokeWidth="4" />
                      <circle cx="40" cy="40" r="36" fill="none" stroke={avgScore >= 80 ? '#10B981' : avgScore >= 60 ? '#D4A03A' : '#EF4444'} strokeWidth="4"
                        strokeDasharray={`${avgScore * 2.26} 226`} strokeLinecap="round" />
                    </svg>
                  </div>
                </>
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
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium text-gray-700">{comp.farm_name}</td>
                      <td className="py-3 px-4 text-sm">
                        {comp.website_url ? (
                          <a href={comp.website_url} target="_blank" rel="noopener noreferrer" className="text-sprout-gold hover:underline flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" />
                            Visit
                          </a>
                        ) : (
                          <span className="text-gray-400">None</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-display font-bold text-lg ${getScoreColor(comp.digital_health_score ?? 0)}`}>
                          {comp.digital_health_score ?? '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">{comp.audit_notes || '—'}</td>
                    </tr>
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

  const renderWebsiteSection = () => (
    <div className="space-y-6">
      {/* Generated Website Preview */}
      <div className="bg-white rounded-2xl card-shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display font-bold text-xl text-sprout-green">Your Generated Website</h2>
            <p className="text-sm text-gray-500">Preview of your auto-built farm landing page</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" />
              Download
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-sprout-gold text-white rounded-lg text-sm font-medium hover:bg-sprout-terracotta transition-colors">
              <ExternalLink className="w-4 h-4" />
              View Live
            </button>
          </div>
        </div>
        
        <div className="aspect-video bg-gradient-to-br from-sprout-sage/10 to-sprout-gold/10 rounded-xl border border-sprout-sage/20 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-white rounded-2xl card-shadow flex items-center justify-center mx-auto mb-4">
              <div className="w-12 h-12 bg-sprout-green rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-sprout-gold" />
              </div>
            </div>
            <p className="text-lg font-display font-bold text-sprout-green">Sunset Valley Organics</p>
            <p className="text-sm text-gray-500">Family-grown produce since 1987</p>
          </div>
        </div>
      </div>

      {/* Marketing Persona */}
      <div className="bg-white rounded-2xl card-shadow p-6">
        <h3 className="font-display font-bold text-lg text-sprout-green mb-4">Marketing Persona</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="p-4 bg-sprout-gold/5 rounded-xl">
              <p className="text-xs font-medium text-sprout-gold uppercase tracking-wide mb-2">Farm Story</p>
              <p className="text-sm text-gray-700 leading-relaxed">
                A third-generation family farm specializing in organic vegetables and sustainable farming practices. 
                Known for heirloom tomatoes and community-supported agriculture programs.
              </p>
            </div>
            
            <div className="p-4 bg-sprout-sage/5 rounded-xl">
              <p className="text-xs font-medium text-sprout-sage uppercase tracking-wide mb-2">Suggested Tagline</p>
              <p className="text-sm font-display font-bold text-sprout-green">
                "Family-grown produce since 1987"
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Target Audience</p>
              <div className="flex flex-wrap gap-2">
                {['Local Families', 'Farm-to-Table Restaurants', 'CSA Subscribers', 'Farmers Market Shoppers'].map(tag => (
                  <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Tone & Voice</p>
              <p className="text-sm text-gray-700">Warm, family-oriented, emphasize heritage and sustainability</p>
            </div>
            
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Recommended Channels</p>
              <div className="flex gap-3">
                <div className="flex items-center gap-1 text-sm text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Facebook
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Instagram
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Google Business
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

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

    // Build chart data: show predicted price with confidence interval
    const chartData = prediction
      ? [
          { label: 'Low', price: prediction.pi_low, forecast: null },
          { label: 'Predicted', price: prediction.predicted_price, forecast: prediction.predicted_price },
          { label: 'High', price: prediction.pi_high, forecast: null },
        ]
      : [];

    return (
      <div className="space-y-6">
        {/* Price Trends Chart */}
        <div className="bg-white rounded-2xl card-shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display font-bold text-xl text-sprout-green">Crop Pricing Trends</h2>
              <p className="text-sm text-gray-500">
                {prediction ? `${prediction.crop_name} prices in ${prediction.county} County` : 'Organic zucchini prices in your county'}
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
                        <stop offset="5%" stopColor="#D4A03A" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#D4A03A" stopOpacity={0}/>
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
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.quantity > 0
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
          { label: 'Matches Found', value: '12', icon: Users },
          { label: 'Drafts', value: '4', icon: Edit3 },
          { label: 'Sent', value: '6', icon: Send },
          { label: 'Replied', value: '2', icon: MessageSquare },
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
          {restaurantMatches.map((restaurant) => (
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
                      I'm reaching out from Sunset Valley Organics, a local organic farm just {restaurant.distance} from you. 
                      I noticed {restaurant.name} features {restaurant.menuMatches[0]} on your menu, and I wanted to introduce 
                      ourselves as a potential supplier.
                    </p>
                    <p className="mb-2">
                      We currently have fresh {restaurant.menuMatches.join(' and ')} available for delivery. 
                      Would you be interested in a sample drop-off this week?
                    </p>
                    <p>Best regards,<br/>Sunset Valley Organics</p>
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
        </div>
      </div>

      {/* Pipeline */}
      <div className="bg-white rounded-2xl card-shadow p-6">
        <h3 className="font-display font-bold text-lg text-sprout-green mb-4">Outreach Pipeline</h3>
        <div className="flex items-center justify-between">
          {['Drafted', 'Sent', 'Opened', 'Replied', 'Converted'].map((stage, i) => (
            <div key={stage} className="flex items-center">
              <div className={`w-24 py-2 px-3 rounded-lg text-center text-sm font-medium ${
                i <= 2 ? 'bg-sprout-gold text-white' : 'bg-gray-100 text-gray-500'
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
      {/* Call Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl card-shadow p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-sprout-gold/10 rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5 text-sprout-gold" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-sprout-green">24</p>
              <p className="text-xs text-gray-500">Calls This Week</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl card-shadow p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-sprout-sage/10 rounded-lg flex items-center justify-center">
              <CheckCheck className="w-5 h-5 text-sprout-sage" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-sprout-green">18</p>
              <p className="text-xs text-gray-500">Inventory Updates</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl card-shadow p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-sprout-green">6</p>
              <p className="text-xs text-gray-500">Sales Logged</p>
            </div>
          </div>
        </div>
      </div>

      {/* Call Log */}
      <div className="bg-white rounded-2xl card-shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg text-sprout-green">Recent Calls</h3>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Phone className="w-4 h-4" />
            <span>Call (555) 123-FARM to log by voice</span>
          </div>
        </div>
        
        <div className="space-y-4">
          {callLogs.map((call) => (
            <div key={call.id} className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    call.type === 'inventory' ? 'bg-sprout-gold/10' :
                    call.type === 'harvest' ? 'bg-sprout-sage/10' : 'bg-gray-100'
                  }`}>
                    {call.type === 'inventory' && <CheckCheck className="w-5 h-5 text-sprout-gold" />}
                    {call.type === 'harvest' && <TrendingUp className="w-5 h-5 text-sprout-sage" />}
                    {call.type === 'update' && <Edit3 className="w-5 h-5 text-gray-500" />}
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
              
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <p className="text-sm text-gray-600 italic">"{call.transcript}"</p>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Extracted:</span>
                {call.type === 'inventory' && (
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                    +200 lbs Roma tomatoes
                  </span>
                )}
                {call.type === 'harvest' && (
                  <span className="px-2 py-1 bg-sprout-gold/10 text-sprout-gold text-xs rounded-full">
                    +150 lbs zucchini harvested
                  </span>
                )}
                {call.type === 'update' && (
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
                    Cucumber stock updated
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Summary */}
      <div className="bg-white rounded-2xl card-shadow p-6">
        <h3 className="font-display font-bold text-lg text-sprout-green mb-4">Weekly Activity Summary</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-4 bg-sprout-gold/5 rounded-xl">
            <Calendar className="w-6 h-6 text-sprout-gold mx-auto mb-2" />
            <p className="text-2xl font-display font-bold text-sprout-green">24</p>
            <p className="text-xs text-gray-500">Total Calls</p>
          </div>
          <div className="text-center p-4 bg-sprout-sage/5 rounded-xl">
            <CheckCheck className="w-6 h-6 text-sprout-sage mx-auto mb-2" />
            <p className="text-2xl font-display font-bold text-sprout-green">18</p>
            <p className="text-xs text-gray-500">Inventory Updates</p>
          </div>
          <div className="text-center p-4 bg-emerald-50 rounded-xl">
            <TrendingUp className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
            <p className="text-2xl font-display font-bold text-sprout-green">6</p>
            <p className="text-xs text-gray-500">Sales Recorded</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <Clock className="w-6 h-6 text-gray-500 mx-auto mb-2" />
            <p className="text-2xl font-display font-bold text-sprout-green">42m</p>
            <p className="text-xs text-gray-500">Total Call Time</p>
          </div>
        </div>
      </div>
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
                <h1 className="font-display font-bold text-xl text-sprout-green">Sunset Valley Organics</h1>
                <p className="text-sm text-gray-500">Portland, OR • Organic Farm</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {discoveryRan && discoveryResults.filter(c => c.digital_health_score != null).length > 0 ? (() => {
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
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id 
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
