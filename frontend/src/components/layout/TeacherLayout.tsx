/**
 * TeacherLayout — o‘qituvchi kabineti shell
 * Desktopda: chap tomonlama Sidebar
 * Mobilda: Mobil ilova bilan bir xil pastki Tab Bar (Sinf -> Qayd -> Hisobot -> Profil)
 */

import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Users, ClipboardList, BarChart, User, LogOut, School } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { Sidebar, BottomNav, type NavItem } from './Sidebar';

export const teacherNavItems: NavItem[] = [
  { label: 'Mening sinfim', shortLabel: 'Sinf', icon: Users, path: '/teacher/class' },
  { label: 'Kunlik holat kiritish', shortLabel: 'Qayd', icon: ClipboardList, path: '/teacher/daily-status' },
  { label: 'Hisobotlar', shortLabel: 'Hisobot', icon: BarChart, path: '/teacher/reports' },
  { label: 'Mening Profilim', shortLabel: 'Profil', icon: User, path: '/teacher/profile' },
];

export function TeacherLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg flex flex-col md:flex-row font-sans text-ink">
      {/* Desktop Chap Sidebar */}
      <Sidebar
        items={teacherNavItems}
        logoSubtitle="O‘QITUVCHI KABINETI"
        footer={
          <>
            <Link
              to="/teacher/profile"
              className="flex items-center space-x-3 text-white cursor-pointer hover:bg-white/5 p-1.5 rounded-xl transition-colors"
            >
              <div className="w-10 h-10 bg-coral rounded-full flex items-center justify-center font-bold text-white uppercase shadow-md shadow-coral/25 shrink-0">
                {user?.displayName ? user.displayName.slice(0, 2) : 'O‘'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate leading-tight text-white">
                  {user?.displayName || 'O‘qituvchi'}
                </p>
                <p className="text-[10px] text-[#D3E6F5] opacity-60 truncate">Sinf rahbari • Profil →</p>
              </div>
            </Link>
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
        {/* Mobil Yuqori Header */}
        <header className="md:hidden bg-white/95 backdrop-blur-md border-b border-cardBlue/60 sticky top-0 z-20 shadow-xs flex items-center justify-between px-4 py-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary text-white rounded-xl p-2 shadow-sm">
              <School className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-black text-deep block leading-tight font-serif">
                YORDAMCHI <span className="text-[#E8734A] text-[10px]">MED</span>
              </span>
              <span className="text-[10px] text-muted">№{user?.schoolNumber || 12}-Maktab • O'qituvchi</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => navigate('/teacher/profile')}
              className="text-primary p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-primary/5 rounded-xl transition-colors cursor-pointer"
              aria-label="Profil"
            >
              <User className="w-5 h-5" />
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
      <BottomNav items={teacherNavItems} />
    </div>
  );
}
