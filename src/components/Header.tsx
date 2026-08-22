import React from 'react';
import {
  Search,
  Bell,
  Calendar,
  ChevronDown,
  Plus,
  Radio
} from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle: string;
  unreadCount?: number;
  onNewInvestigation?: () => void;
  onOpenAlerts?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  unreadCount = 7,
  onNewInvestigation,
  onOpenAlerts,
}) => {
  const currentDateStr = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const currentTimeStr = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <header className="sticky top-0 z-20 bg-[#0a0a0b]/95 backdrop-blur-md border-b border-white/5 px-8 py-4 flex items-center justify-between">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-xl md:text-2xl font-light tracking-tight text-white flex items-center gap-2 font-editorial">
          {title}
        </h1>
        <p className="text-[11px] text-white/40 uppercase tracking-[0.15em] font-medium mt-0.5">{subtitle}</p>
      </div>

      {/* Actions & Utilities */}
      <div className="flex items-center gap-3">
        {/* Live Date Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded bg-white/[0.02] border border-white/5 text-[11px] text-white/60 font-mono">
          <Calendar className="w-3.5 h-3.5 text-[#c5a059]" />
          <span>{currentDateStr} • {currentTimeStr}</span>
        </div>

        {/* Timeframe Dropdown */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded bg-white/[0.02] border border-white/5 text-[11px] text-white/60 hover:text-white hover:border-[#c5a059]/40 cursor-pointer transition-all">
          <span className="uppercase tracking-wider">Last 7 Days</span>
          <ChevronDown className="w-3 h-3 text-white/40" />
        </div>

        {/* Search button */}
        <button
          className="p-2 rounded bg-white/[0.02] border border-white/5 text-white/40 hover:text-white hover:border-[#c5a059]/40 transition-all"
          title="Search Intelligence"
        >
          <Search className="w-3.5 h-3.5" />
        </button>

        {/* Notification Bell with Badge */}
        <button
          onClick={onOpenAlerts}
          className="relative p-2 rounded bg-white/[0.02] border border-white/5 text-white/40 hover:text-white hover:border-[#c5a059]/40 transition-all"
          title="Alerts"
        >
          <Bell className="w-3.5 h-3.5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#c5a059] text-black text-[9px] font-bold flex items-center justify-center border border-[#0a0a0b]">
              {unreadCount}
            </span>
          )}
        </button>

        {/* New Investigation CTA */}
        {onNewInvestigation && (
          <button
            onClick={onNewInvestigation}
            className="flex items-center gap-2 px-4 py-2 rounded bg-[#c5a059] hover:bg-[#d6b26b] text-black text-xs font-semibold tracking-wide uppercase shadow-sm shadow-[#c5a059]/30 transition-all active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5 text-black" />
            <span>New Investigation</span>
          </button>
        )}

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1e1e24] to-[#0a0a0b] border border-[#c5a059]/40 flex items-center justify-center cursor-pointer">
          <span className="text-[11px] font-medium text-[#c5a059] font-mono">
            SY
          </span>
        </div>
      </div>
    </header>
  );
};
