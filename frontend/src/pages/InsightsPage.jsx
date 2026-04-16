import React from 'react';
import { motion } from 'framer-motion';
import { useFinanceStore } from '../store/financeStore';
import { formatCurrency } from '../utils/helpers';

export const InsightsPage = () => {
  const store = useFinanceStore();
  const monthlyExpenses = store.expenses || [];
  const totalMonthly = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <main className="pt-28 pb-32 px-4 max-w-7xl mx-auto min-h-screen">
      {/* Hero Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Weekly Spending Chart */}
        <div className="lg:col-span-2 glass-panel rounded-xl p-8 relative overflow-hidden shadow-[0_0_20px_rgba(129,236,255,0.15),_inset_0_0_10px_rgba(129,236,255,0.05)]">
          <div className="absolute top-0 right-0 p-4">
            <span className="text-[10px] font-label text-primary/40 tracking-[0.2em] uppercase">Telemetry Active</span>
          </div>
          <div className="flex flex-col gap-1 mb-8">
            <label className="font-label text-xs text-primary tracking-widest uppercase">Weekly Capital Flux</label>
            <h2 className="text-4xl font-headline font-bold text-on-surface">{formatCurrency(totalMonthly)}</h2>
          </div>
          
          {/* SVG Line Chart Mock */}
          <div className="h-64 w-full relative">
            <svg className="w-full h-full" viewBox="0 0 1000 300" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGradient2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#81ecff" stopOpacity="0.3"></stop>
                  <stop offset="100%" stopColor="#81ecff" stopOpacity="0"></stop>
                </linearGradient>
              </defs>
              <path d="M0,250 Q100,220 200,240 T400,150 T600,180 T800,80 T1000,120" fill="transparent" stroke="#81ecff" strokeWidth="3"></path>
              <path d="M0,250 Q100,220 200,240 T400,150 T600,180 T800,80 T1000,120 V300 H0 Z" fill="url(#chartGradient2)"></path>
              <circle className="animate-pulse" cx="200" cy="240" fill="#81ecff" r="4"></circle>
              <circle className="animate-pulse" cx="400" cy="150" fill="#81ecff" r="4"></circle>
              <circle className="animate-pulse" cx="800" cy="80" fill="#81ecff" r="4"></circle>
            </svg>
            <div className="absolute top-10 left-[75%] glass-panel px-3 py-2 rounded-lg border border-primary/30 text-[10px] font-label text-primary">
              PEAK FLUX: +24%
            </div>
          </div>
          
          <div className="flex justify-between mt-4 font-label text-[10px] text-on-surface-variant uppercase tracking-tighter">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </div>
        
        {/* Smart Suggestions & AI Feedback */}
        <div className="flex flex-col gap-6">
          <div className="glass-panel rounded-xl p-6 relative shadow-[0_0_20px_rgba(129,236,255,0.15)] border border-secondary/20">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-secondary" style={{fontVariationSettings: "'FILL' 1"}}>auto_awesome</span>
              <h3 className="font-headline text-sm font-bold text-secondary uppercase tracking-widest">FRIDAY Insight</h3>
            </div>
            <div className="relative">
              <div className="bg-secondary/10 border-l-2 border-secondary p-4 rounded-r-lg mb-4 italic text-sm text-on-surface-variant">
                "System indicates high recurring subscriptions in the Tertiary sector. Recommend a 15% reduction to optimize liquidity."
              </div>
              <button className="w-full py-3 rounded-lg border border-secondary/30 bg-secondary/5 font-label text-[10px] text-secondary uppercase tracking-widest hover:bg-secondary/20 transition-all">
                Execute Optimization
              </button>
            </div>
          </div>
          
          {/* Alert Section */}
          <div className="glass-panel rounded-xl p-6 bg-error/5 border border-error/30" style={{animation: "pulse-soft 2s infinite"}}>
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-error">warning</span>
              <h3 className="font-headline text-sm font-bold text-error uppercase tracking-widest">Budget Breach</h3>
            </div>
            <p className="text-xs text-on-surface-variant mb-4 font-body">Node 04 (Entertainment) has exceeded predefined limits by 32%.</p>
            <div className="w-full bg-surface-container-high h-1 rounded-full overflow-hidden">
              <div className="bg-error w-full h-full shadow-[0_0_10px_#ff716c]"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid Data Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Grid Item 1 */}
        <div className="glass-panel p-6 rounded-xl border border-primary/10 hover:border-primary/40 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <span className="material-symbols-outlined text-primary/60 group-hover:text-primary transition-colors">hub</span>
            <span className="text-[10px] font-label text-on-surface-variant">NODE_01</span>
          </div>
          <div className="font-headline text-2xl font-bold text-on-surface mb-1">94.2%</div>
          <div className="text-[10px] font-label text-primary/50 uppercase">Efficiency Rating</div>
        </div>
        
        {/* Grid Item 2 */}
        <div className="glass-panel p-6 rounded-xl border border-primary/10 hover:border-primary/40 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <span className="material-symbols-outlined text-primary/60 group-hover:text-primary transition-colors">account_balance_wallet</span>
            <span className="text-[10px] font-label text-on-surface-variant">VAL_STK</span>
          </div>
          <div className="font-headline text-2xl font-bold text-on-surface mb-1">{formatCurrency((store.salary?.amount || 12400) * 0.2)}</div>
          <div className="text-[10px] font-label text-primary/50 uppercase">Liquidity Pool</div>
        </div>
        
        {/* Image Panel 1 */}
        <div className="lg:col-span-2 glass-panel rounded-xl relative overflow-hidden group">
          <img 
            className="w-full h-40 object-cover opacity-40 group-hover:opacity-60 group-hover:scale-105 transition-all duration-700" 
            alt="Data Streams" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCeMhfoyaSAjtJp7eiyU2ONWvLJ3tS3B7EUxDi1iWwgtVLg96iLhzxxFD5rwgppNP-p5hDINLfWHda--mEXNhB7RFUCuOCPLoa2B4RbWKHneETgJ6WeLCbRQPaSNmgY6eqibhlQz2ebPwGq4RI3DRz-HmfVFUr9i5236wY_IDb46CYz9a74my5Yx1JDQttc5FDrl5gGjhPZxCK2yex5IDBV5JoKnN2EJV5O1phwL2Bn4o8gUhjudxUiwZC36wMWAj1aJXyem1RAVEo"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-container to-transparent"></div>
          <div className="absolute bottom-4 left-6">
            <h4 className="font-headline text-lg font-bold text-primary uppercase">Sector Analytics</h4>
            <p className="text-xs text-on-surface-variant uppercase font-label">Global distribution visualization</p>
          </div>
        </div>
        
        {/* Grid Item 3 */}
        <div className="glass-panel p-6 rounded-xl border border-secondary/10 hover:border-secondary/40 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <span className="material-symbols-outlined text-secondary/60 group-hover:text-secondary transition-colors">query_stats</span>
            <span className="text-[10px] font-label text-on-surface-variant">FLUX_RT</span>
          </div>
          <div className="font-headline text-2xl font-bold text-on-surface mb-1">+0.08%</div>
          <div className="text-[10px] font-label text-secondary/50 uppercase">Volatility Index</div>
        </div>
        
        {/* Grid Item 4 */}
        <div className="glass-panel p-6 rounded-xl border border-primary/10 hover:border-primary/40 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <span className="material-symbols-outlined text-primary/60 group-hover:text-primary transition-colors">terminal</span>
            <span className="text-[10px] font-label text-on-surface-variant">SYS_LOG</span>
          </div>
          <div className="font-headline text-2xl font-bold text-on-surface mb-1">ACTIVE</div>
          <div className="text-[10px] font-label text-primary/50 uppercase">Neural Network Status</div>
        </div>
        
        {/* Image Panel 2 */}
        <div className="lg:col-span-2 glass-panel rounded-xl relative overflow-hidden group">
          <img 
            className="w-full h-40 object-cover opacity-40 group-hover:opacity-60 group-hover:scale-105 transition-all duration-700" 
            alt="Neural Network" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_snYM6KRRoliw3P4eAyQnWSs2icGJb3AgCfrpCOxWVegevAZrkIiGlEO_WBFc_e7bjb6oFRKEGyuEFUhwUT7-OnxKZBb0vgNitjoMIq7QeoqhIP6JJl9LiCHs4iDOTn6sFepUfqLvV3TXlfStmVOFkMqqOS-jmtLEUIK9363n5imje7TOYgVr6SqD3iKPij9v67Pj0ZODrA7noyqPTwYNQSq77bK4kEQtQdJcszZ8CZXJcsMNrUvgVUyqjHWMydzOsstT2dtGhjw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-container to-transparent"></div>
          <div className="absolute bottom-4 left-6">
            <h4 className="font-headline text-lg font-bold text-primary uppercase">Neural Sync</h4>
            <p className="text-xs text-on-surface-variant uppercase font-label">Real-time cross-platform telemetry</p>
          </div>
        </div>
      </div>

      {/* Recent Logs Section */}
      <section className="mt-8 glass-panel rounded-xl p-8 border border-primary/5">
        <h3 className="font-headline text-sm font-bold text-primary uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
          Real-Time Data Feed
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-white/5 hover:bg-white/5 px-4 rounded transition-colors group">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-primary/40 group-hover:text-primary transition-colors">shopping_cart</span>
              <div>
                <div className="text-sm font-headline font-medium text-on-surface">Amazon Core Services</div>
                <div className="text-[10px] font-label text-on-surface-variant uppercase">Transaction: Hash_821092</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-headline font-bold text-primary">-Ξ 120.50</div>
              <div className="text-[10px] font-label text-on-surface-variant uppercase">08:42:11 GMT</div>
            </div>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b border-white/5 hover:bg-white/5 px-4 rounded transition-colors group">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-secondary/40 group-hover:text-secondary transition-colors">token</span>
              <div>
                <div className="text-sm font-headline font-medium text-on-surface">Staking Reward Cycle</div>
                <div className="text-[10px] font-label text-on-surface-variant uppercase">Transaction: Hash_110921</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-headline font-bold text-secondary">+Ξ 42.10</div>
              <div className="text-[10px] font-label text-on-surface-variant uppercase">04:15:55 GMT</div>
            </div>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b border-white/5 hover:bg-white/5 px-4 rounded transition-colors group">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-error/40 group-hover:text-error transition-colors">electric_bolt</span>
              <div>
                <div className="text-sm font-headline font-medium text-on-surface">Energy Grid Overload Fee</div>
                <div className="text-[10px] font-label text-on-surface-variant uppercase">Transaction: Hash_992182</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-headline font-bold text-error">-Ξ 290.00</div>
              <div className="text-[10px] font-label text-on-surface-variant uppercase">01:02:19 GMT</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};
