/**
 * Umumiy kabinet navigatsiyasi — Desktop Sidebar & Mobil Bottom Tab Bar
 * Desktopda: chap tomonlama Sidebar
 * Mobilda: Mobil ilova bilan 100% bir xil pastki Tab Bar (BottomNav / BottomTabItem)
 */

import type { ComponentType, ReactNode, SVGProps } from 'react';
import { Link, useLocation } from 'react-router-dom';

export type NavIcon = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

export interface NavItem {
  label: string;
  icon: NavIcon;
  path: string;
  /** Mobil tab’da qisqa yorliq */
  shortLabel?: string;
  badge?: number | string;
}

export interface SidebarProps {
  items: NavItem[];
  logoSubtitle: string;
  footer?: ReactNode;
}

/** Desktop Sidebar */
export function Sidebar({ items, logoSubtitle, footer }: SidebarProps) {
  const location = useLocation();

  return (
    <aside className="w-64 bg-[#123C5C] flex flex-col h-screen sticky top-0 shrink-0 text-[#D3E6F5] hidden md:flex z-20 shadow-xl border-r border-cardBlue/10">
      <div className="p-6 mb-2">
        <p className="text-white font-serif text-2xl italic tracking-tight leading-tight">
          Yordamchi <span className="text-[#E8734A] text-sm not-italic font-semibold">med</span>
        </p>
        <p className="text-[10px] tracking-wider text-white/50 uppercase mt-1.5">
          {logoSubtitle}
        </p>
      </div>

      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-150 ${
                isActive
                  ? 'bg-[#1B6FA8] text-white font-medium shadow-md shadow-primary/25'
                  : 'text-white/70 hover:bg-white/5'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="text-sm font-semibold">{item.label}</span>
              {item.badge !== undefined && (
                <span className="ml-auto bg-coral text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {footer && (
        <div className="p-4 border-t border-[#D3E6F5]/10 flex flex-col gap-3 mt-auto">
          {footer}
        </div>
      )}
    </aside>
  );
}

/** Mobil pastki tab elementi (48px tap target, mobil ilova bilan bir xil) */
export interface BottomTabItemProps {
  icon: NavIcon;
  label: string;
  path: string;
  isActive: boolean;
  badge?: number | string;
}

export function BottomTabItem({
  icon: Icon,
  label,
  path,
  isActive,
  badge,
}: BottomTabItemProps) {
  return (
    <Link
      to={path}
      className={`flex-1 flex flex-col items-center justify-center min-h-[48px] py-1.5 px-0.5 rounded-xl transition-all select-none ${
        isActive ? 'text-primary' : 'text-slate-500 hover:text-slate-800'
      }`}
    >
      <div className="relative flex items-center justify-center">
        <div
          className={`w-9 h-7 rounded-full flex items-center justify-center transition-colors ${
            isActive ? 'bg-primary/10 text-primary' : 'text-slate-500'
          }`}
        >
          <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
        </div>
        {badge !== undefined && (
          <span className="absolute -top-1 -right-1.5 bg-coral text-white text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-xs">
            {badge}
          </span>
        )}
      </div>
      <span
        className={`text-[10.5px] mt-0.5 tracking-tight truncate max-w-[64px] text-center ${
          isActive ? 'font-bold text-primary' : 'font-medium text-slate-500'
        }`}
      >
        {label}
      </span>
    </Link>
  );
}

/** Mobil pastki Tab Bar navigatsiyasi */
export function BottomNav({ items }: { items: NavItem[] }) {
  const location = useLocation();

  return (
    <nav
      aria-label="Mobil navigatsiya paneli"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-cardBlue/60 shadow-[0_-4px_20px_rgba(18,60,92,0.08)] flex items-center justify-around py-1 px-1.5 safe-area-pb"
    >
      {items.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <BottomTabItem
            key={item.path}
            icon={item.icon}
            label={item.shortLabel || item.label}
            path={item.path}
            isActive={isActive}
            badge={item.badge}
          />
        );
      })}
    </nav>
  );
}

/** Deprecated alias — orqaga moslik uchun */
export const MobileNavTabs = BottomNav;
