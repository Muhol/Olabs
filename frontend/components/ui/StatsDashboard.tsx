import React from 'react';
import { Book, Users, ClipboardList, TrendingUp, Bookmark } from 'lucide-react';

interface StatsProps {
  stats: {
    totalItems: number;
    totalAssets: number;
    activeBorrows: number;
    utilization: number;
  }
}

const StatsDashboard: React.FC<StatsProps> = ({ stats }) => {
  const cards = [
    {
      label: 'TOTAL ARCHIVES',
      value: stats.totalItems,
      icon: Book,
      color: 'from-emerald-400 to-emerald-600',
      trend: '+12% from last term',
      detail: 'Unique titles cataloged'
    },
    {
      label: 'RESOURCE ASSETS',
      value: stats.totalAssets,
      icon: Bookmark,
      color: 'from-blue-400 to-blue-600',
      trend: '98% catalog integrity',
      detail: 'Cumulative physical units'
    },
    {
      label: 'ACTIVE CIRCULATION',
      value: stats.activeBorrows,
      icon: ClipboardList,
      color: 'from-amber-400 to-amber-600',
      trend: `${stats.activeBorrows} units in-field`,
      detail: 'Current student borrowings'
    },
    {
      label: 'SYSTEM UTILIZATION',
      value: `${stats.utilization.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'from-indigo-400 to-indigo-600',
      trend: 'Optimization required',
      detail: 'Inventory turnover rate'
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="group relative overflow-hidden glass-card rounded-3xl p-8 transition-all hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(16,185,129,0.15)] bg-white/5 border border-white/10"
        >
          {/* Background Glow */}
          <div className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br ${card.color} opacity-10 blur-3xl group-hover:opacity-20 transition-opacity`} />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className={`p-4 rounded-2xl bg-gradient-to-br ${card.color} text-white shadow-lg`}>
                <card.icon size={24} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 opacity-60">
                Live Metric
              </span>
            </div>

            <div className="space-y-1">
              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                {card.label}
              </h4>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black tracking-tighter text-foreground">
                  {card.value}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex flex-col gap-1">
              <span className="text-xs font-bold text-primary flex items-center gap-1">
                <TrendingUp size={12} /> {card.trend}
              </span>
              <span className="text-[10px] text-slate-500 font-medium lowercase">
                {card.detail}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsDashboard;
