import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, TrendingUp, Utensils, Mic, Globe,
  ChevronRight, ArrowUpRight, Star,
  CheckCircle2, AlertCircle, XCircle, ExternalLink,
  Download, Send, Phone, Clock, Calendar,
  Users, MessageSquare, Edit3, CheckCheck
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';

// Mock data for charts
const priceData = [
  { month: 'Jan', price: 2.40, forecast: null },
  { month: 'Feb', price: 2.55, forecast: null },
  { month: 'Mar', price: 2.80, forecast: null },
  { month: 'Apr', price: 3.10, forecast: null },
  { month: 'May', price: 3.45, forecast: null },
  { month: 'Jun', price: 3.20, forecast: 3.85 },
  { month: 'Jul', price: null, forecast: 4.20 },
  { month: 'Aug', price: null, forecast: 4.50 },
];

const inventoryData = [
  { crop: 'Tomatoes', quantity: 450, unit: 'lbs', lastUpdated: '2 hours ago' },
  { crop: 'Zucchini', quantity: 320, unit: 'lbs', lastUpdated: '5 hours ago' },
  { crop: 'Bell Peppers', quantity: 180, unit: 'lbs', lastUpdated: '1 day ago' },
  { crop: 'Cucumbers', quantity: 275, unit: 'lbs', lastUpdated: '3 hours ago' },
];

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

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('audit');
  const [selectedEmail, setSelectedEmail] = useState<number | null>(null);

  // Disable smooth scrolling on dashboard (no autoscroll)
  useEffect(() => {
    const html = document.documentElement;
    const previousBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    return () => {
      html.style.scrollBehavior = previousBehavior;
    };
  }, []);

  const renderAuditSection = () => (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="bg-white rounded-2xl card-shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display font-bold text-xl text-sprout-green mb-1">Digital Health Score</h2>
            <p className="text-sm text-gray-500">Overall assessment of your farm's online presence</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className={`font-display font-bold text-5xl ${getScoreColor(67)}`}>67</div>
              <div className="text-sm text-gray-500">out of 100</div>
            </div>
            <div className="w-20 h-20 rounded-full border-4 border-gray-100 flex items-center justify-center relative">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="40" cy="40" r="36" fill="none" stroke="#E5E7EB" strokeWidth="4" />
                <circle cx="40" cy="40" r="36" fill="none" stroke="#D4A03A" strokeWidth="4" 
                  strokeDasharray={`${67 * 2.26} 226`} strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Website', score: 45, icon: Globe, status: 'needs-work' },
            { name: 'SEO', score: 52, icon: TrendingUp, status: 'fair' },
            { name: 'Google Business', score: 78, icon: Star, status: 'good' },
            { name: 'Social Media', score: 35, icon: Users, status: 'poor' },
          ].map((category) => (
            <div key={category.name} className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <category.icon className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">{category.name}</span>
              </div>
              <div className={`font-display font-bold text-2xl ${getScoreColor(category.score)}`}>
                {category.score}
              </div>
              <div className="w-full h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
                <div className={`h-full ${getScoreBg(category.score)} rounded-full`} style={{ width: `${category.score}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-2xl card-shadow p-6">
        <h3 className="font-display font-bold text-lg text-sprout-green mb-4">Priority Recommendations</h3>
        <div className="space-y-3">
          {[
            { text: 'Your website is not mobile-friendly', priority: 'high', icon: XCircle },
            { text: 'Add alt text to your product images for better SEO', priority: 'medium', icon: AlertCircle },
            { text: 'Your Facebook page hasn\'t posted in 6 months', priority: 'high', icon: XCircle },
            { text: 'Google Business Profile is well-optimized', priority: 'good', icon: CheckCircle2 },
          ].map((rec, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
              <rec.icon className={`w-5 h-5 mt-0.5 ${
                rec.priority === 'high' ? 'text-red-500' : 
                rec.priority === 'medium' ? 'text-amber-500' : 'text-emerald-500'
              }`} />
              <div className="flex-1">
                <p className="text-sm text-gray-700">{rec.text}</p>
              </div>
              {rec.priority !== 'good' && (
                <button className="text-xs text-sprout-gold hover:text-sprout-terracotta font-medium">
                  Fix Now
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Before/After */}
      <div className="bg-white rounded-2xl card-shadow p-6">
        <h3 className="font-display font-bold text-lg text-sprout-green mb-4">Website Transformation</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-2">Current Website</p>
            <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <Globe className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No website detected</p>
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-2">Sprout Generated</p>
            <div className="aspect-video bg-sprout-sage/10 rounded-xl flex items-center justify-center border-2 border-dashed border-sprout-sage/30">
              <div className="text-center">
                <div className="w-12 h-12 bg-sprout-gold rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm text-sprout-green font-medium">Preview Available</p>
                <button className="mt-2 text-xs text-sprout-gold hover:text-sprout-terracotta">
                  View Generated Site →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

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

  const renderMarketSection = () => (
    <div className="space-y-6">
      {/* Price Trends Chart */}
      <div className="bg-white rounded-2xl card-shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display font-bold text-xl text-sprout-green">Crop Pricing Trends</h2>
            <p className="text-sm text-gray-500">Organic zucchini prices in your county</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-sm text-emerald-600">
              <ArrowUpRight className="w-4 h-4" />
              +12% this month
            </span>
          </div>
        </div>
        
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={priceData}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4A03A" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#D4A03A" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} domain={[2, 5]} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
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
            Historical
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-sprout-sage"></span>
            Forecast
          </div>
        </div>
      </div>

      {/* Demand Forecast Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">High Confidence</p>
              <p className="text-sm text-gray-700 mt-1">
                <strong>95% probability</strong> that organic zucchini prices will rise by <strong>12%</strong> in the next 3 weeks based on local scarcity.
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
              <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">Market Alert</p>
              <p className="text-sm text-gray-700 mt-1">
                <strong>3 competitors</strong> in your area are also harvesting tomatoes this week. Consider pricing 5-8% below market average.
              </p>
            </div>
          </div>
        </div>
      </div>

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
              {inventoryData.map((item) => (
                <tr key={item.crop} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm font-medium text-gray-700">{item.crop}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{item.quantity} {item.unit}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">{item.lastUpdated}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                      In Stock
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

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
    <div className="min-h-screen bg-sprout-cream pt-20">
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
              <div className={`px-4 py-2 rounded-lg ${getScoreBg(67)} text-white font-bold`}>
                Score: 67
              </div>
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
