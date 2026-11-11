import React from 'react';
import { useAuth } from '../context/AuthContext';
import { FlowLogo } from './FlowLogo';
import { 
  LayoutDashboard, 
  Receipt, 
  Wallet, 
  BarChart3, 
  Target, 
  Settings, 
  LogOut
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage }) => {
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'budget', label: 'Budget', icon: Wallet },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'goals', label: 'Goals', icon: Target },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-100 bg-white h-screen sticky top-0 px-4 py-6 justify-between select-none">
        <div className="flex flex-col gap-8">
          {/* Logo */}
          <div className="px-2">
            <FlowLogo size="sm" showSubtitle={true} />
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-violet-50/70 text-violet-600 font-semibold' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-violet-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-100 pt-4">
          {/* Settings Link */}
          <button
            onClick={() => setCurrentPage('settings')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              currentPage === 'settings' 
                ? 'bg-violet-50/70 text-violet-600 font-semibold' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4 text-slate-400" />
            Settings
          </button>

          {/* Profile card (opens Settings) */}
          <button
            onClick={() => setCurrentPage('settings')}
            className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-slate-50 transition-colors text-left min-w-0"
            title="Edit profile"
          >
            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-display font-medium border border-slate-200 text-sm flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </button>

          {/* Log Out — pinned to the bottom of the sidebar */}
          <button
            onClick={() => logout()}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition-all duration-200 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-2 py-2 flex justify-around items-center z-40 shadow-[0_-4px_16px_rgba(0,0,0,0.03)]">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all ${
                isActive ? 'text-violet-600 font-semibold scale-105' : 'text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={() => setCurrentPage('settings')}
          className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all ${
            currentPage === 'settings' ? 'text-violet-600 font-semibold scale-105' : 'text-slate-400'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px]">Settings</span>
        </button>
      </nav>
    </>
  );
};
