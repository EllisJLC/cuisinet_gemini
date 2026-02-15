
import React, { useState, useCallback, useMemo } from 'react';
import { 
  ShoppingBag, 
  MapPin, 
  Search, 
  ExternalLink, 
  RefreshCw, 
  AlertCircle, 
  ListChecks, 
  Globe, 
  ArrowRight, 
  Sparkles, 
  Store, 
  Tag, 
  Info,
  BadgeDollarSign,
  Trophy,
  History
} from 'lucide-react';
import { fetchGroceryData } from './services/geminiService';
import { GroceryResponse, GroceryItem, StoreComparison } from './types';
import { Skeleton } from './components/ui/Skeleton';

const LOCATIONS = {
  "USA": ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego"],
  "Canada": ["Toronto", "Montreal", "Vancouver", "Calgary", "Edmonton", "Ottawa", "Winnipeg"],
  "United Kingdom": ["London", "Birmingham", "Manchester", "Glasgow", "Liverpool", "Leeds", "Sheffield"],
  "Australia": ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast"],
  "Germany": ["Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt"],
  "India": ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai"],
  "France": ["Paris", "Marseille", "Lyon", "Toulouse", "Nice"]
} as const;

type CountryKey = keyof typeof LOCATIONS;

const StoreCard: React.FC<{ store: StoreComparison }> = ({ store }) => {
  const budgetColor = {
    'Low': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Mid': 'bg-amber-100 text-amber-700 border-amber-200',
    'High': 'bg-rose-100 text-rose-700 border-rose-200'
  }[store.budgetRating];

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 p-7 shadow-sm hover:shadow-xl hover:shadow-slate-200 transition-all duration-300 flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div className="bg-slate-50 p-3.5 rounded-2xl">
          <Store className="w-6 h-6 text-slate-600" />
        </div>
        <span className={`px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] border ${budgetColor}`}>
          {store.budgetRating} Budget
        </span>
      </div>
      
      <div>
        <h4 className="text-xl font-black text-slate-900 leading-tight">{store.name}</h4>
        <div className="flex items-center gap-1.5 mt-2 text-emerald-600">
          <Trophy className="w-4 h-4" />
          <span className="text-xs font-black uppercase tracking-wider">{store.bestFor}</span>
        </div>
      </div>

      {store.examplePrices.length > 0 && (
        <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Tag className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Typical Pricing</span>
          </div>
          {store.examplePrices.map((ex, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-600">{ex.item}</span>
              <span className="text-sm font-black text-slate-900">{ex.price}</span>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-500 font-medium leading-relaxed italic border-l-2 border-slate-100 pl-3">
        "{store.note}"
      </p>
    </div>
  );
};

const GroceryItemCard: React.FC<{ item: GroceryItem }> = ({ item }) => {
  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 group flex flex-col h-full border-t-4 border-t-emerald-500">
      <div className="flex items-start justify-between mb-6">
        <div className="bg-emerald-50 p-4 rounded-[1.25rem] group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500">
          <ShoppingBag className="w-6 h-6" />
        </div>
        <div className="bg-emerald-100/50 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
          Real-Time Data
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-2xl font-black text-slate-900 mb-2 group-hover:text-emerald-700 transition-colors tracking-tight">
          {item.name}
        </h3>
        <p className="text-sm text-slate-500 font-medium leading-relaxed">
          {item.description}
        </p>
      </div>

      <div className="mt-auto space-y-6">
        <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-5 shadow-inner">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Market Winner</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="bg-white p-1.5 rounded-lg shrink-0">
                <Store className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="font-black text-slate-800 text-sm truncate uppercase tracking-tight">{item.bestStore}</span>
            </div>
            <div className="text-emerald-700 font-black text-2xl tracking-tighter shrink-0">
              {item.bestPrice}
            </div>
          </div>
        </div>

        {item.comparison.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Full Comparison</h4>
              <div className="h-px flex-grow bg-slate-100"></div>
            </div>
            <div className="divide-y divide-slate-50">
              {item.comparison.map((c, i) => {
                const isNotCarried = c.price.toLowerCase().includes('not carried');
                return (
                  <div key={i} className="flex items-center justify-between py-2.5 px-1 first:pt-0 last:pb-0">
                    <span className={`text-sm font-bold truncate mr-4 ${isNotCarried ? 'text-slate-300 line-through' : 'text-slate-500'}`}>
                      {c.store}
                    </span>
                    <span className={`text-sm font-black tabular-nums ${isNotCarried ? 'text-slate-300' : 'text-slate-400'}`}>
                      {c.price}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [country, setCountry] = useState<CountryKey | "">("");
  const [city, setCity] = useState("");
  const [groceryList, setGroceryList] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<GroceryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const availableCities = useMemo(() => {
    return country ? LOCATIONS[country as CountryKey] : [];
  }, [country]);

  const handleSearch = useCallback(async () => {
    if (!country || !city) {
      setError("Selection required: Please choose your country and city first.");
      return;
    }

    setError(null);
    setIsSearching(true);
    try {
      const data = await fetchGroceryData(city, country, groceryList);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "An unexpected market data error occurred.");
    } finally {
      setIsSearching(false);
    }
  }, [country, city, groceryList]);

  return (
    <div className="min-h-screen pb-24 bg-slate-50 text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-600 p-3 rounded-[1.25rem] shadow-xl shadow-emerald-200 rotate-2">
              <ShoppingBag className="text-white w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter leading-none">SmartShop</h1>
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Real-Time Market Intel</p>
              </div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-50 border border-slate-100 px-5 py-2.5 rounded-2xl">
            <Globe className="w-3.5 h-3.5 text-emerald-500" />
            Global Price Grounding
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-16 space-y-20">
        {/* Input Interface */}
        <section className="bg-white rounded-[3.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="p-8 md:p-14 space-y-12">
            <div className="text-center space-y-3">
              <h2 className="text-4xl font-black tracking-tight text-slate-900">Beat Grocery Inflation.</h2>
              <p className="text-slate-400 text-lg font-medium max-w-lg mx-auto leading-relaxed">Instantly find where staples are cheapest or compare specific brands at major retailers.</p>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative group">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none z-10 transition-transform group-focus-within:scale-110">
                    <Globe className="w-6 h-6" />
                  </div>
                  <select
                    className="w-full pl-16 pr-10 py-6 rounded-3xl border-2 border-slate-50 focus:border-emerald-500 focus:ring-8 focus:ring-emerald-500/5 transition-all outline-none bg-slate-50 appearance-none font-bold text-slate-700 cursor-pointer shadow-sm"
                    value={country}
                    onChange={(e) => { setCountry(e.target.value as CountryKey); setCity(""); }}
                  >
                    <option value="" disabled>Select Country</option>
                    {Object.keys(LOCATIONS).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="relative group">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none z-10 transition-transform group-focus-within:scale-110">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <select
                    className="w-full pl-16 pr-10 py-6 rounded-3xl border-2 border-slate-50 focus:border-emerald-500 focus:ring-8 focus:ring-emerald-500/5 transition-all outline-none bg-slate-50 appearance-none font-bold text-slate-700 cursor-pointer disabled:opacity-50 shadow-sm"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={!country}
                  >
                    <option value="" disabled>Select City</option>
                    {availableCities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="relative group">
                <textarea
                  placeholder="Tell us what you're buying... (e.g. 'Bananas, Milk, Cage-free Eggs')"
                  className="w-full min-h-[160px] px-10 py-8 rounded-[3rem] border-2 border-slate-50 focus:border-emerald-500 focus:ring-8 focus:ring-emerald-500/5 transition-all outline-none bg-slate-50 resize-none font-bold text-slate-700 placeholder:text-slate-300 shadow-sm text-lg"
                  value={groceryList}
                  onChange={(e) => setGroceryList(e.target.value)}
                />
                <div className="absolute right-8 bottom-8 flex items-center gap-3 opacity-30 group-focus-within:opacity-100 transition-opacity">
                  <BadgeDollarSign className="w-6 h-6 text-emerald-600" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Local Price Check</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSearch}
              disabled={isSearching || !city}
              className="group relative w-full py-7 bg-slate-900 hover:bg-emerald-600 disabled:bg-slate-200 text-white rounded-[2.5rem] font-black text-xl shadow-2xl shadow-slate-300 hover:shadow-emerald-200 transition-all duration-500 flex items-center justify-center gap-4 overflow-hidden transform active:scale-[0.98]"
            >
              {isSearching ? (
                <RefreshCw className="w-7 h-7 animate-spin" />
              ) : (
                <Search className="w-7 h-7 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500" />
              )}
              <span>{isSearching ? "Crawling Live Inventories..." : (groceryList.trim() ? "Compare List Prices" : "Analyze Affordable Essentials")}</span>
            </button>
          </div>
        </section>

        {/* Error Handling */}
        {error && !isSearching && (
          <div className="bg-rose-50 border-2 border-rose-100 rounded-[2.5rem] p-8 flex items-center gap-6 text-rose-800 animate-in slide-in-from-top-6 duration-500 shadow-lg">
            <div className="bg-rose-100 p-3 rounded-2xl shrink-0">
              <AlertCircle className="w-8 h-8 text-rose-600" />
            </div>
            <p className="font-bold text-lg">{error}</p>
          </div>
        )}

        {/* Loading Skeletons */}
        {isSearching && (
          <div className="space-y-16">
            <Skeleton className="h-64 w-full rounded-[3.5rem]" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {[1, 2, 3].map(i => <Skeleton key={i} className="h-72 w-full rounded-[2.5rem]" />)}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-96 w-full rounded-[2.5rem]" />)}
            </div>
          </div>
        )}

        {/* Detailed Results Display */}
        {result && !isSearching && (
          <div className="space-y-20 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            {/* Context Hero Section */}
            <div className="bg-emerald-600 rounded-[4rem] p-12 md:p-20 text-white relative overflow-hidden shadow-2xl shadow-emerald-200">
              <div className="relative z-10 space-y-8 max-w-4xl">
                <div className="flex items-center gap-3 text-emerald-100 text-[10px] font-black uppercase tracking-[0.4em]">
                  <Sparkles className="w-5 h-5" />
                  Market Analysis Engine
                </div>
                <h3 className="text-5xl md:text-6xl font-black tracking-tighter leading-none">
                  Shopping in {city}
                </h3>
                <p className="text-xl md:text-2xl text-emerald-50 font-medium leading-relaxed opacity-95 border-l-4 border-emerald-400 pl-8">
                  {result.intro}
                </p>
              </div>
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[500px] h-[500px] bg-emerald-400/20 rounded-full blur-[120px]"></div>
              <div className="absolute bottom-10 right-10 text-emerald-400/20 pointer-events-none select-none">
                <BadgeDollarSign className="w-64 h-64 rotate-12" />
              </div>
            </div>

            {/* Store Comparison Section */}
            {result.stores.length > 0 && (
              <section className="space-y-10">
                <div className="flex items-center gap-6 px-4">
                  <div className="flex flex-col">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-1">Local Landscape</h3>
                    <p className="text-2xl font-black text-slate-800 tracking-tight">Market Leaderboard</p>
                  </div>
                  <div className="h-px flex-grow bg-slate-200/60"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {result.stores.map((store, idx) => (
                    <StoreCard key={idx} store={store} />
                  ))}
                </div>
              </section>
            )}

            {/* Price Cards Section */}
            <section className="space-y-10">
              <div className="flex items-center gap-6 px-4">
                <div className="flex flex-col">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-1">Savings Finder</h3>
                  <p className="text-2xl font-black text-slate-800 tracking-tight">Item Price Comparison</p>
                </div>
                <div className="h-px flex-grow bg-slate-200/60"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {result.items.map((item, idx) => (
                  <GroceryItemCard key={idx} item={item} />
                ))}
                
                {result.items.length === 0 && (
                  <div className="col-span-full bg-white rounded-[3rem] border-4 border-dashed border-slate-100 p-20 text-center space-y-6">
                    <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto border border-slate-100">
                      <History className="w-10 h-10 text-slate-300" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-800">Searching for specifics...</h3>
                      <p className="text-slate-400 max-w-md mx-auto mt-2 font-medium">We found general store data but specific item tags are still being verified. Check the summary above for immediate insights.</p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Grounding Attribution */}
            {result.sources.length > 0 && (
              <div className="bg-white rounded-[3rem] border border-slate-100 p-12 shadow-sm">
                <div className="flex items-center gap-6 mb-10">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] whitespace-nowrap">Source Verification</h4>
                  <div className="h-[2px] flex-grow bg-slate-100/50"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {result.sources.map((source, idx) => (
                    <a
                      key={idx}
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 bg-slate-50/50 border border-slate-100 px-6 py-5 rounded-[1.5rem] text-slate-600 hover:text-emerald-700 hover:border-emerald-300 hover:bg-white hover:shadow-2xl hover:shadow-emerald-500/5 transition-all group overflow-hidden"
                    >
                      <div className="bg-white p-2.5 rounded-xl shadow-sm group-hover:bg-emerald-50 transition-colors">
                        <ExternalLink className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-emerald-500" />
                      </div>
                      <span className="text-sm font-black truncate tracking-tight">{source.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State Welcome */}
        {!result && !isSearching && !error && (
          <div className="py-24 text-center space-y-12 animate-in fade-in zoom-in duration-1000">
            <div className="relative inline-block group">
              <div className="absolute inset-0 bg-emerald-200 rounded-full blur-[100px] opacity-20 scale-150 group-hover:scale-[2.5] transition-all duration-1000"></div>
              <div className="relative bg-white w-40 h-40 rounded-[3rem] shadow-2xl flex items-center justify-center mx-auto border border-slate-50 transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-500">
                <BadgeDollarSign className="w-20 h-20 text-emerald-600" />
              </div>
            </div>
            <div className="space-y-6">
              <h2 className="text-6xl font-black text-slate-900 tracking-tighter leading-[0.9]">Local Price <br/><span className="text-emerald-600">Intelligence.</span></h2>
              <p className="text-slate-400 max-w-lg mx-auto text-xl font-medium leading-relaxed">
                Unlock live market data for any city. Discover where your grocery list costs the least, down to the cent.
              </p>
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-6xl mx-auto px-6 mt-32 pb-16 flex flex-col items-center gap-8">
        <div className="w-12 h-1 bg-slate-200 rounded-full"></div>
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] text-center">
          Intelligence by Gemini 3 Pro & Google Search
        </p>
      </footer>
    </div>
  );
};

export default App;
