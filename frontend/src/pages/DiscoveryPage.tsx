import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, MapPin, ExternalLink, 
  ChevronDown, SlidersHorizontal, Building2, 
  CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';

// Mock data for farms
const mockFarms = [
  {
    id: 1,
    name: "Covered Bridge Farms",
    location: "Geneva, OH",
    score: 85,
    type: "Organic",
    summary: "Strong Google listing, active social media",
    hasWebsite: true,
    hasSocial: true,
    sources: ["USDA", "Google"],
    lat: 41.8019,
    lng: -80.9488
  },
  {
    id: 2,
    name: "Green Meadows Farm",
    location: "Eugene, OR",
    score: 42,
    type: "CSA",
    summary: "No website detected, inactive social media",
    hasWebsite: false,
    hasSocial: false,
    sources: ["USDA"],
    lat: 44.0521,
    lng: -123.0868
  },
  {
    id: 3,
    name: "Riverbend Produce",
    location: "Salem, OR",
    score: 67,
    type: "Farmers Market",
    summary: "Basic website, needs SEO improvement",
    hasWebsite: true,
    hasSocial: true,
    sources: ["Google"],
    lat: 44.9429,
    lng: -123.0351
  },
  {
    id: 4,
    name: "Highland Ranch",
    location: "Bend, OR",
    score: 23,
    type: "Livestock",
    summary: "Minimal online presence",
    hasWebsite: false,
    hasSocial: false,
    sources: ["USDA"],
    lat: 44.0582,
    lng: -121.3153
  },
  {
    id: 5,
    name: "Willamette Valley Farms",
    location: "Corvallis, OR",
    score: 91,
    type: "U-Pick",
    summary: "Excellent digital presence across all channels",
    hasWebsite: true,
    hasSocial: true,
    sources: ["USDA", "Google"],
    lat: 44.5646,
    lng: -123.2620
  },
  {
    id: 6,
    name: "Cascade Mountain Growers",
    location: "Hood River, OR",
    score: 56,
    type: "Organic",
    summary: "Good website, limited social engagement",
    hasWebsite: true,
    hasSocial: false,
    sources: ["Google"],
    lat: 45.7091,
    lng: -121.5212
  }
];

const getScoreColor = (score: number) => {
  if (score >= 70) return 'bg-emerald-500';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-red-500';
};

export default function DiscoveryPage() {
  const [selectedFarm, setSelectedFarm] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterScore, setFilterScore] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  const filteredFarms = mockFarms.filter(farm => {
    const matchesSearch = farm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         farm.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'All' || farm.type === filterType;
    const matchesScore = filterScore === 'All' || 
                        (filterScore === 'High' && farm.score >= 70) ||
                        (filterScore === 'Medium' && farm.score >= 40 && farm.score < 70) ||
                        (filterScore === 'Low' && farm.score < 40);
    return matchesSearch && matchesType && matchesScore;
  });

  const farmTypes = ['All', 'Organic', 'CSA', 'Farmers Market', 'U-Pick', 'Livestock'];

  return (
    <motion.div
      className="min-h-screen bg-sprout-cream"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5, ease: 'easeOut' }}
    >
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display font-bold text-2xl text-sprout-green">Discovery</h1>
              <p className="text-sm text-gray-500">Explore farms in your area</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Strong (70+)</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Fair (40-69)</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500"></span> Poor (&lt;40)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-140px)]">
        {/* Sidebar */}
        <div className="w-96 bg-white border-r border-gray-100 flex flex-col">
          {/* Search & Filters */}
          <div className="p-4 border-b border-gray-100">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search farms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-sprout-gold focus:ring-2 focus:ring-sprout-gold/20 outline-none text-sm"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-sprout-green transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {showFilters && (
              <div className="mt-3 space-y-3 pt-3 border-t border-gray-100">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Farm Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-sprout-gold outline-none"
                  >
                    {farmTypes.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Health Score</label>
                  <select
                    value={filterScore}
                    onChange={(e) => setFilterScore(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-sprout-gold outline-none"
                  >
                    <option value="All">All Scores</option>
                    <option value="High">High (70+)</option>
                    <option value="Medium">Medium (40-69)</option>
                    <option value="Low">Low (&lt;40)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Farm List */}
          <div className="flex-1 overflow-y-auto">
            {filteredFarms.map((farm) => (
              <div
                key={farm.id}
                onClick={() => setSelectedFarm(farm.id)}
                className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                  selectedFarm === farm.id ? 'bg-sprout-gold/5 border-l-4 border-l-sprout-gold' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-sprout-green text-sm">{farm.name}</h3>
                  <div className={`px-2 py-0.5 rounded-full text-xs font-bold ${getScoreColor(farm.score)} text-white`}>
                    {farm.score}
                  </div>
                </div>
                
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                  <MapPin className="w-3 h-3" />
                  {farm.location}
                </div>
                
                <p className="text-xs text-gray-600 mb-2">{farm.summary}</p>
                
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-sprout-sage/10 text-sprout-sage text-xs rounded-full">
                    {farm.type}
                  </span>
                  {farm.sources.map(source => (
                    <span key={source} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                      {source}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Map Area */}
        <div className="flex-1 relative bg-sprout-sage/5">
          {/* Stylized Map Background */}
          <div className="absolute inset-0 overflow-hidden">
            <img 
              src="/map-preview.jpg" 
              alt="Map"
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-sprout-cream/30 to-transparent" />
          </div>

          {/* Map Pins */}
          {filteredFarms.map((farm, index) => {
            const top = 15 + (index % 3) * 25;
            const left = 15 + Math.floor(index / 3) * 30;
            
            return (
              <div
                key={farm.id}
                onClick={() => setSelectedFarm(farm.id)}
                className="absolute cursor-pointer group"
                style={{ top: `${top}%`, left: `${left}%` }}
              >
                <div className={`relative w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${getScoreColor(farm.score)}`}>
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <div className="bg-white rounded-lg shadow-lg px-3 py-2 whitespace-nowrap">
                    <p className="font-semibold text-sm text-sprout-green">{farm.name}</p>
                    <p className="text-xs text-gray-500">Score: {farm.score}</p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Selected Farm Detail Card */}
          {selectedFarm && (
            <div className="absolute bottom-6 right-6 w-80 bg-white rounded-2xl card-shadow p-5 z-20">
              {(() => {
                const farm = mockFarms.find(f => f.id === selectedFarm);
                if (!farm) return null;
                
                return (
                  <>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-display font-bold text-lg text-sprout-green">{farm.name}</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {farm.location}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(farm.score)} text-white`}>
                        {farm.score}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        {farm.hasWebsite ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className={farm.hasWebsite ? 'text-gray-700' : 'text-gray-500'}>
                          Website {farm.hasWebsite ? 'detected' : 'not found'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {farm.hasSocial ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                        )}
                        <span className={farm.hasSocial ? 'text-gray-700' : 'text-gray-500'}>
                          Social media {farm.hasSocial ? 'active' : 'inactive'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <span className="px-2 py-1 bg-sprout-sage/10 text-sprout-sage text-xs rounded-full">
                        {farm.type}
                      </span>
                      {farm.sources.map(source => (
                        <span key={source} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          {source}
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Link to="/dashboard" className="flex-1 bg-sprout-gold hover:bg-sprout-terracotta text-white text-sm font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-1">
                        <Building2 className="w-4 h-4" />
                        View Dashboard
                      </Link>
                      <button className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <ExternalLink className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
