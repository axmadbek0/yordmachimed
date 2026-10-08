/**
 * SchoolAdminLayout — Maktab admini kabineti shell
 * Desktopda: chap tomonlama Sidebar
 * Mobilda: Mobil ilova bilan bir xil pastki Tab Bar
 */

import { Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BarChart3,
  School,
  Video,
  Megaphone,
  LogOut,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { Sidebar, BottomNav, type NavItem } from './Sidebar';

export const schoolAdminNavItems: NavItem[] = [
  {
    label: 'Boshqaruv paneli',
    shortLabel: 'Panel',
    icon: LayoutDashboard,
    path: '/school-admin/dashboard',
  },
  {
    label: "O'qituvchilar",
    shortLabel: "O'qituvchi",
    icon: Users,
    path: '/school-admin/teachers',
  },
  {
    label: "O'quvchilar",
    shortLabel: "O'quvchi",
    icon: GraduationCap,
    path: '/school-admin/students',
  },
  {
    label: 'Hisobotlar',
    shortLabel: 'Hisobot',
    icon: BarChart3,
    path: '/school-admin/reports',
  },
  {
    label: 'Kamera sozlamalari',
    shortLabel: 'Kameralar',
    icon: Video,
    path: '/school-admin/cameras',
  },
  {
    label: 'Maktab profili',
    shortLabel: 'Maktab',
    icon: School,
    path: '/school-admin/profile',
  },
];

export function SchoolAdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const schoolNumber = user?.schoolNumber || 71;

  return (
    <div className="min-h-screen bg-bg flex flex-col md:flex-row font-sans text-ink">
      {/* Desktop Chap Sidebar */}
      <Sidebar
        items={schoolAdminNavItems}
        logoSubtitle="MAKTAB ADMINI"
        footer={
          <>
            <div className="bg-white/10 rounded-xl p-3 border border-white/10 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-sm shadow-md">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="bg-[#E8734A] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                    ADMIN
                  </span>
                  <p className="text-xs font-bold text-white truncate">
                    {user?.displayName || `${schoolNumber}-Maktab Admini`}
                  </p>
                </div>
                <p className="text-[10px] text-[#D3E6F5]/70 truncate mt-0.5">
                  №{schoolNumber}-sonli Maktab-Internat
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 min-h-[44px] py-2.5 border-2 border-coral/30 text-coral hover:bg-coral/10 hover:border-coral rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Chiqish
            </button>
          </>
        }
      />

      {/* Asosiy Ish Maydoni */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Mobil Header */}
        <header className="md:hidden bg-white/95 backdrop-blur-md border-b border-cardBlue/60 sticky top-0 z-20 shadow-xs flex items-center justify-between px-4 py-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary text-white rounded-xl p-2 shadow-sm">
              <School className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-deep block leading-tight font-serif">
                  YORDAMCHI <span className="text-[#E8734A] text-[10px]">MED</span>
                </span>
                <span className="bg-primary/10 text-primary text-[9px] font-bold px-1.5 py-0.2 rounded">
                  ADMIN
                </span>
              </div>
              <span className="text-[10px] text-muted">№{schoolNumber}-Maktab-Internat</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => navigate('/school-admin/announcements')}
              className="text-primary p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-primary/5 rounded-xl transition-colors cursor-pointer"
              aria-label="Xabarlar"
            >
              <Megaphone className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={logout}
              className="text-coral p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-coral/5 rounded-xl transition-colors cursor-pointer"
              aria-label="Chiqish"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Asosiy Sahifa Kontenti (Mobilda pastki tab bar ustida bo'lishi uchun pb-24) */}
        <main className="flex-1 flex flex-col p-4 sm:p-8 pb-24 md:pb-8 overflow-y-auto max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      {/* Mobil Pastki Tab Bar */}
      <BottomNav items={schoolAdminNavItems} />
    </div>
  );
}
