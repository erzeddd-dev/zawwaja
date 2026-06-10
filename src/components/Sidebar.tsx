import React, { memo } from "react";
import { 
  CircleUser, 
  CheckSquare, 
  Building, 
  Gift, 
  UserCheck, 
  LogOut, 
  Settings,
  PanelLeftClose,
} from "lucide-react";
import { UserProfile } from "../types";

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  profile: UserProfile | null;
  onLogout: () => void;
  onOpenSettings: () => void;
}

export default memo(function Sidebar({ 
  currentTab, 
  setCurrentTab, 
  profile, 
  onLogout,
  onOpenSettings 
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const menuItems = [
    { id: "dashboard", label: "Profil", icon: CircleUser },
    { id: "checklist", label: "Persiapan Nikah", icon: CheckSquare },
    { id: "vendors", label: "Manajemen Vendor", icon: Building },
    { id: "mahar", label: "Seserahan & Mahar", icon: Gift },
  ];

  const isAdmin = profile?.role === "admin" || profile?.email === "erzeddd@gmail.com";

  // Helper to extract initials for user profile avatar
  const getInitials = (name?: string) => {
    if (!name) return "P";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0] ? parts[0][0].toUpperCase() : "P";
  };

  return (
    <>
      {/* 1. MOBILE VIEW: Bottom Navigation Bar (md:hidden) — Glassmorphism */}
      {/* Order: Mahar | Vendor | Persiapan | Dashboard (rightmost) */}
      <div className="fixed bottom-0 left-0 right-0 h-16 glass-bottom-bar flex md:hidden items-center justify-around px-2 z-40">
        {[...menuItems].reverse().map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          
          let shortLabel = item.label;
          if (item.id === "dashboard") shortLabel = "Profil";
          if (item.id === "checklist") shortLabel = "Persiapan";
          if (item.id === "vendors") shortLabel = "Vendor";
          if (item.id === "mahar") shortLabel = "Mahar";
          
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 flex-1 transition-all cursor-pointer relative ${
                isActive 
                  ? "text-brand-600" 
                  : "text-text-secondary hover:text-brand-600"
              }`}
              title={item.label}
              id={`nav-item-mobile-${item.id}`}
            >
              {/* Active indicator dot — top */}
              <span className={`absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full transition-all duration-300 ${
                isActive ? 'bg-brand-600 opacity-100' : 'opacity-0'
              }`} />
              <Icon size={isActive ? 20 : 18} className={`mb-0.5 transition-all ${isActive ? 'scale-110' : ''}`} />
              <span className={`text-[9px] font-sans tracking-tight transition-all ${isActive ? "text-brand-600 font-bold" : "text-text-tertiary font-medium"}`}>
                {shortLabel}
              </span>
            </button>
          );
        })}
        
        {/* Render Admin entry if user is admin */}
        {isAdmin && (
          <button
            onClick={() => setCurrentTab("admin")}
            className={`flex flex-col items-center justify-center py-1 flex-1 transition-all cursor-pointer relative ${
              currentTab === "admin" 
                ? "text-amber-700" 
                : "text-stone-550 hover:text-amber-700"
            }`}
            title="Portal Admin"
            id="nav-item-mobile-admin"
          >
            <span className={`absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full transition-all duration-300 ${
              currentTab === "admin" ? 'bg-amber-600 opacity-100' : 'opacity-0'
            }`} />
            <UserCheck size={currentTab === "admin" ? 20 : 18} className="mb-0.5 transition-all" />
            <span className={`text-[9px] font-sans tracking-tight ${currentTab === "admin" ? "text-amber-700 font-bold" : "text-stone-400 font-medium"}`}>
              Admin
            </span>
          </button>
        )}
      </div>


      {/* 2. DESKTOP VIEW: Glassmorphism Sidebar (md:flex) */}
      <div 
        className={`hidden md:flex h-screen glass-sidebar flex-col justify-between transition-all duration-300 shrink-0 relative z-10 ${
          isCollapsed ? "w-16" : "w-64"
        }`}
        id="app-sidebar"
      >
        <div>
          {/* Header Area with Branding & Toggle */}
          <div className={`flex items-center h-16 border-b border-white/20 ${
            isCollapsed ? "justify-center" : "justify-between px-4"
          }`}>
            {!isCollapsed ? (
              <>
                <div className="flex items-center space-x-2.5 min-w-0">
                  <img src="/logo.webp" alt="Zawwaja" className="w-8 h-8 rounded-lg shadow-sm shrink-0 object-cover border border-white/30" width="32" height="32" loading="eager" fetchpriority="high" />
                  <div className="min-w-0">
                    <h1 className="text-text-primary font-bold font-serif tracking-wide text-xs truncate">Zawwaja</h1>
                    <p className="text-[8px] text-brand-600 uppercase tracking-wider font-semibold leading-none truncate">Sharia Planner</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCollapsed(true)}
                  className="p-1.5 rounded-lg text-text-secondary hover:text-brand-600 hover:bg-white/20 transition-colors cursor-pointer shrink-0"
                  title="Collapse Sidebar"
                >
                  <PanelLeftClose size={18} />
                </button>
              </>
            ) : (
              <button 
                onClick={() => setIsCollapsed(false)}
                className="w-10 h-10 rounded-xl overflow-hidden hover:scale-105 hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center border border-white/25 shadow-sm cursor-pointer bg-white/10"
                title="Buka Sidebar"
              >
                <img src="/logo.webp" alt="Zawwaja" className="w-8 h-8 rounded-lg object-cover" width="32" height="32" loading="eager" fetchpriority="high" />
              </button>
            )}
          </div>

          {/* User Partner Badge Banner (only in expanded state) */}
          {!isCollapsed && profile && (
            <div className="p-3.5 mx-3.5 my-4 rounded-xl bg-white/30 border border-white/40 flex flex-col gap-1 shadow-sm backdrop-blur-sm">
              <p className="text-[9px] text-text-secondary font-bold uppercase tracking-wider">Perencanaan Akad</p>
              <p className="text-xs font-bold truncate text-text-primary font-serif">
                {profile.fullName || "Anda"} & {profile.partnerName || "Pasangan"}
              </p>
              <span className="text-[8px] mt-1.5 inline-block self-start px-2.5 py-0.5 rounded-full bg-white/50 text-text-secondary border border-white/40 font-semibold uppercase tracking-wider shadow-sm">
                Syar'i Planner
              </span>
            </div>
          )}

          {/* Navigation Items */}
          <nav className="mt-4 px-2 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`w-full flex items-center rounded-xl text-xs font-semibold tracking-wide transition-all group cursor-pointer ${
                    isCollapsed ? "justify-center p-3" : "justify-start px-4 py-3"
                  } ${
                    isActive 
                      ? "bg-brand-600/15 text-brand-600 font-bold border border-brand-400/20 shadow-sm" 
                      : "text-text-secondary hover:bg-white/25 hover:text-text-primary border border-transparent"
                  }`}
                  title={item.label}
                >
                  <Icon size={16} className={`shrink-0 ${isActive ? "text-brand-600" : "text-brand-400 group-hover:text-brand-600"}`} />
                  {!isCollapsed && <span className="ml-3 truncate font-sans">{item.label}</span>}
                </button>
              );
            })}

            {/* Admin Portal Nav Item (visible only for admins) */}
            {isAdmin && (
              <button
                onClick={() => setCurrentTab("admin")}
                className={`w-full flex items-center rounded-xl text-xs font-semibold tracking-wide transition-all group cursor-pointer ${
                  isCollapsed ? "justify-center p-3" : "justify-start px-4 py-3"
                } ${
                  currentTab === "admin" 
                    ? "bg-amber-600/10 text-amber-700 font-bold border border-amber-400/20" 
                    : "text-amber-700 hover:bg-white/20 hover:text-amber-800 border border-transparent"
                }`}
                title="Portal Admin"
              >
                <UserCheck size={16} className={`shrink-0 ${currentTab === "admin" ? "text-amber-700" : "text-amber-600/70"}`} />
                {!isCollapsed && <span className="ml-3 truncate font-sans">Portal Admin</span>}
              </button>
            )}
          </nav>
        </div>

        {/* Profile & Settings at Bottom */}
        {!isCollapsed ? (
          <div className="p-3 border-t border-white/20 bg-white/15 backdrop-blur-sm flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-full bg-brand-50/80 text-brand-600 flex items-center justify-center font-extrabold text-[11px] shrink-0 border border-brand-400/20 uppercase backdrop-blur-sm">
                {getInitials(profile?.fullName)}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-xs font-bold truncate text-text-primary leading-tight">
                  {profile?.fullName || "Pengantin Baru"}
                </p>
                <p className="text-[10px] text-text-tertiary truncate leading-none mt-0.5 font-sans">
                  {profile?.role === "admin" ? "Syar'i Admin" : "Pasangan Akad"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button 
                onClick={onOpenSettings} 
                className="p-1.5 rounded-lg text-text-secondary hover:text-brand-600 hover:bg-white/25 transition-colors cursor-pointer"
                title="Kelola Pengaturan Rencana Akad"
              >
                <Settings size={16} />
              </button>
              <button 
                onClick={onLogout} 
                className="p-1.5 rounded-lg text-text-tertiary hover:text-rose-600 hover:bg-rose-50/50 transition-colors cursor-pointer"
                title="Keluar / Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="py-4 border-t border-white/20 bg-white/10 flex flex-col items-center gap-3.5">
            {/* Settings gear icon directly above profile avatar */}
            <button 
              onClick={onOpenSettings} 
              className="p-1.5 rounded-lg text-text-secondary hover:text-brand-600 hover:bg-white/25 transition-colors cursor-pointer flex items-center justify-center"
              title="Kelola Pengaturan Rencana Akad"
            >
              <Settings size={16} />
            </button>
            
            <button 
              onClick={onLogout}
              className="w-8 h-8 rounded-full bg-brand-50/80 text-brand-600 flex items-center justify-center font-extrabold text-[10px] border border-brand-400/20 cursor-pointer shadow-sm hover:bg-rose-50/80 hover:border-rose-200 hover:text-rose-600 transition-all duration-200 uppercase"
              title="Klik untuk Keluar (Logout)"
            >
              {getInitials(profile?.fullName)}
            </button>
          </div>
        )}
      </div>
    </>
  );
});
