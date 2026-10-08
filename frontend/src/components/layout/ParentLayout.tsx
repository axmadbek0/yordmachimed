/**
 * ParentLayout — ota-ona kabineti shell
 * Desktopda: chap tomonlama Sidebar
 * Mobilda: Mobil ilova bilan bir xil pastki Tab Bar (Hisobot -> AI -> Yotoqxona -> Oshxona -> Profil)
 */

import { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Activity, MessageSquare, Video, UtensilsCrossed, User, LogOut, Heart, Bell } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { getStudents } from '../../lib/db';
import type { Student } from '../../types';
import { Sidebar, BottomNav, type NavItem } from './Sidebar';
import { ParentNotificationToast } from '../../features/parent/ParentNotificationToast';

export const parentNavItems: NavItem[] = [
  { label: 'Kundalik Hisobot', shortLabel: 'Hisobot', icon: Activity, path: '/parent/reports' },
  { label: 'AI Maslahatchi', shortLabel: 'AI', icon: MessageSquare, path: '/parent/ai-chat' },
  { label: 'Yotoqxona kuzatuvi', shortLabel: 'Yotoqxona', icon: Video, path: '/parent/dormitory-camera' },
  { label: 'Oshxona', shortLabel: 'Oshxona', icon: UtensilsCrossed, path: '/parent/kitchen-camera' },
  { label: 'Mening Profilim', shortLabel: 'Profil', icon: User, path: '/parent/profile' },
];

export function ParentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);

  useEffect(() => {
    if (user?.associatedStudentId) {
      getStudents().then((students) => {
        const matched = students.find((s) => s.id === user.associatedStudentId);
        if (matched) setStudent(matched);
      });
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-bg flex flex-col md:flex-row font-sans text-ink">
      {/* Desktop Chap Sidebar */}
      <Sidebar
        items={parentNavItems}
        logoSubtitle="OTA-ONA KABINETI"
        footer={
          <>
            {student && (
              <Link
                to="/parent/profile"
                className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center gap-3 cursor-pointer transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-[#1B6FA8] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-inner">
                  {student.fullName[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate text-white leading-tight">{student.fullName}</p>
                  <p className="text-[10px] text-[#D3E6F5] opacity-60 truncate">
                    {student.className} o‘quvchisi • Profil →
                  </p>
                </div>
              </Link>
            )}
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
            <div className="bg-coral text-white rounded-xl p-2 shadow-sm">
              <Heart className="w-4 h-4" fill="currentColor" />
            </div>
            <div>
              <span className="text-sm font-black text-deep block leading-tight font-serif">
                YORDAMCHI <span className="text-[#E8734A] text-[10px]">MED</span>
              </span>
              <span className="text-[10px] text-muted block">
                Ota-ona kabineti • №{user?.schoolNumber || 12}-Maktab
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => navigate('/parent/notifications')}
              className="text-primary p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-primary/5 rounded-xl transition-colors cursor-pointer"
              aria-label="Xabarlar"
            >
              <Bell className="w-5 h-5" />
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

      {/* Mobil Pastki Tab Bar (Native ilova bilan bir xil tartib va uslub) */}
      <BottomNav items={parentNavItems} />

      <ParentNotificationToast />
    </div>
  );
}
