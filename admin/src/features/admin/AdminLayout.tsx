/**
 * Admin Layout — Desktop-first sidebar + content wrapper
 */

import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import {
  LayoutDashboard,
  School,
  Users,
  BarChart3,
  CreditCard,
  Settings,
  LogOut,
  Shield,
  Heart,
  MessageSquare,
} from 'lucide-react';
import { motion } from 'motion/react';

const NAV_ITEMS = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Boshqaruv paneli' },
  { to: '/admin/inquiries', icon: MessageSquare, label: 'Murojaatlar / Savollar' },
  { to: '/admin/schools', icon: School, label: 'Maktablar' },
  { to: '/admin/users', icon: Users, label: 'Foydalanuvchilar' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Tahlil va hisobotlar' },
  { to: '/admin/billing', icon: CreditCard, label: 'Obunalar / To\'lovlar' },
  { to: '/admin/settings', icon: Settings, label: 'Tizim sozlamalari' },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen flex bg-bg">
      {/* Sidebar — always open, 260px */}
      <aside className="w-[260px] min-h-screen bg-white border-r border-primary/8 flex flex-col shrink-0 shadow-sm">
        {/* Logo / brand area */}
        <div className="px-5 pt-5 pb-4 border-b border-primary/5">
          <div className="flex items-center gap-2.5">
            <div className="bg-deep text-white rounded-xl p-2 shadow-sm">
              <Heart className="w-5 h-5" fill="currentColor" />
            </div>
            <div className="leading-tight">
              <h1 className="text-base font-black text-deep font-serif tracking-tight">
                YORDAMCHI<span className="text-coral">.MED</span>
              </h1>
            </div>
          </div>
          <div className="mt-2.5">
            <span className="inline-flex items-center gap-1 bg-deep text-white text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded">
              <Shield className="w-2.5 h-2.5" />
              SUPER-ADMIN
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-primary/8 text-primary font-semibold'
                    : 'text-muted hover:bg-bg hover:text-deep'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                      isActive ? 'text-primary' : 'text-muted group-hover:text-deep'
                    }`}
                  />
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="admin-nav-indicator"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User & Logout */}
        <div className="px-3 pb-4 border-t border-primary/5 pt-3">
          <div className="flex items-center gap-2.5 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-deep/10 flex items-center justify-center text-deep text-xs font-bold">
              SA
            </div>
            <div className="leading-tight flex-1 min-w-0">
              <p className="text-sm font-semibold text-deep truncate">{user?.displayName || 'Admin'}</p>
              <p className="text-[11px] text-muted truncate">{user?.login}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted hover:bg-coral/5 hover:text-coral transition-all cursor-pointer"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Chiqish
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-h-screen overflow-y-auto">
        <div className="max-w-[1280px] mx-auto p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
