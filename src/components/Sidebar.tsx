import React from 'react';
import {
  LayoutDashboard,
  Search,
  Building2,
  Compass,
  Bell,
  FileText,
  TrendingUp,
  Bookmark,
  Globe,
  Settings,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Shield,
  Zap
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  unreadAlertsCount?: number;
  onOpenLanding?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  unreadAlertsCount = 7,
  onOpenLanding,
}) => {
  const navItems = [
    { id: 'command-center', label: 'Command Center', icon: LayoutDashboard },
    { id: 'investigations', label: 'Investigations', icon: Search },
    { id: 'competitors', label: 'Competitors', icon: Building2 },
    { id: 'topics', label: 'Topics', icon: Compass },
    { id: 'alerts', label: 'Alerts', icon: Bell, badge: unreadAlertsCount },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'trends', label: 'Trends', icon: TrendingUp },
    { id: 'watchlist', label: 'Watchlist', icon: Bookmark },
    { id: 'sources', label: 'Sources', icon: Globe },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-[#0a0a0b] border-r border-white/5 flex flex-col h-screen select-none sticky top-0 z-30">
      {/* Brand Logo */}
      <div className="p-5 flex items-center justify-between border-b border-white/5">
        <div 
          onClick={onOpenLanding}
          className="cursor-pointer flex items-center gap-3 group"
          title="ARCIA — Autonomous Intel"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1c1c1f] to-[#0a0a0b] border border-[#c5a059]/40 flex items-center justify-center shadow-md shadow-black/40 group-hover:border-[#c5a059] transition-all duration-300">
            <div className="w-2.5 h-2.5 rounded-full bg-[#c5a059] shadow-sm shadow-[#c5a059]/50"></div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-white uppercase font-cinzel">ARCIA</span>
              <span className="text-[#c5a059] text-xs">•</span>
              <span className="text-[9px] uppercase tracking-[0.25em] text-[#c5a059] font-medium">Intel</span>
            </div>
            <p className="text-[8px] uppercase tracking-[0.2em] text-white/30 font-medium">Autonomous Intelligence</p>
          </div>
        </div>
      </div>

      {/* Main Navigation Menu */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs tracking-wide transition-all duration-200 group ${
                isActive
                  ? 'bg-white/[0.04] text-white border-l-2 border-[#c5a059] font-semibold pl-3'
                  : 'text-white/40 hover:text-white/80 hover:bg-white/[0.02]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-[#c5a059]' : 'text-white/30 group-hover:text-white/70'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* User Profile & Agent Status Footer */}
      <div className="p-3.5 border-t border-white/5 space-y-3 bg-[#0a0a0b]">
        {/* User Card */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all cursor-pointer">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1e1e24] to-[#0a0a0b] border border-[#c5a059]/30 flex items-center justify-center">
                <span className="text-[11px] font-medium text-[#c5a059] font-mono">SY</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#c5a059] border border-[#0a0a0b]"></div>
            </div>
            <div className="text-left">
              <p className="text-xs font-medium text-white/90 leading-tight">S. Yarramreddy</p>
              <p className="text-[9px] text-white/30 uppercase tracking-widest">Director of Intel</p>
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-white/30" />
        </div>

        {/* Real-time Agent Status HUD Widget */}
        <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
          <div className="flex items-center justify-between text-[10px] mb-1.5">
            <span className="text-white/30 uppercase tracking-widest">Agent Node</span>
            <span className="flex items-center gap-1.5 text-[#c5a059] font-medium text-[9px] uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c5a059] animate-ping"></span>
              Synchronized
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-white/40 mb-1">
            <span className="tracking-wide">Core Uptime</span>
            <span className="font-mono text-white/80">99.98%</span>
          </div>
          {/* Mini SVG Sparkline */}
          <div className="h-4 w-full flex items-end">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 20" preserveAspectRatio="none">
              <path
                d="M0,15 Q15,8 30,12 T60,5 T85,9 T100,2"
                fill="none"
                stroke="#c5a059"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Upgrade / Pro CTA */}
        <div className="p-2.5 rounded-lg bg-gradient-to-br from-[#161618] to-[#0d0d0f] border border-[#c5a059]/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#c5a059]" />
            <div>
              <p className="text-[10px] font-semibold text-white uppercase tracking-wider">Enterprise Fleet</p>
              <p className="text-[9px] text-white/30">Continuous auto-recon</p>
            </div>
          </div>
          <button 
            onClick={() => onSelectTab('settings')}
            className="p-1 rounded bg-[#c5a059]/10 hover:bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]/30 transition-all"
          >
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </aside>
  );
};
