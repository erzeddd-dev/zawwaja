import React from "react";
import { 
  LayoutDashboard, 
  CheckSquare, 
  Building, 
  Gift, 
  Users, 
  UserCheck, 
  LogOut, 
  Menu,
  Settings,
  PanelLeftClose,
  PanelLeft,
  Mail
} from "lucide-react";
import { UserProfile } from "../types";

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  profile: UserProfile | null;
  onLogout: () => void;
  onOpenSettings: () => void;
}

export default function Sidebar({ 
  currentTab, 
  setCurrentTab, 
  profile, 
  onLogout,
  onOpenSettings 
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "checklist", label: "Persiapan Nikah", icon: CheckSquare },
    { id: "vendors", label: "Manajemen Vendor", icon: Building },
    { id: "mahar", label: "Seserahan & Mahar", icon: Gift },
    { id: "undangan", label: "Undangan Pernikahan", icon: Mail },
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
      {/* 1. MOBILE VIEW: Bottom Navigation Bar (md:hidden) */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-purple-100/50 flex md:hidden items-center justify-around px-2 z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          
          let shortLabel = item.label;
          if (item.id === "checklist") shortLabel = "Persiapan";
          if (item.id === "vendors") shortLabel = "Vendor";
          if (item.id === "mahar") shortLabel = "Mahar";
          if (item.id === "undangan") shortLabel = "Undangan";
          
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 flex-1 transition-all cursor-pointer ${
                isActive 
                  ? "text-[#af7661] scale-105" 
                  : "text-stone-500 hover:text-[#af7661]"
              }`}
              title={item.label}
              id={`nav-item-mobile-${item.id}`}
            >
              <Icon size={18} className="mb-0.5" />
              <span className={`text-[9px] font-sans font-medium tracking-tight ${isActive ? "text-[#af7661] font-bold" : "text-stone-400"}`}>
                {shortLabel}
              </span>
            </button>
          );
        })}
        
        {/* Render Admin entry if user is admin */}
        {isAdmin && (
          <button
            onClick={() => setCurrentTab("admin")}
            className={`flex flex-col items-center justify-center py-1 flex-1 transition-all cursor-pointer ${
              currentTab === "admin" 
                ? "text-amber-700 scale-105" 
                : "text-stone-550 hover:text-amber-700"
            }`}
            title="Portal Admin"
            id="nav-item-mobile-admin"
          >
            <UserCheck size={18} className="mb-0.5" />
            <span className={`text-[9px] font-sans font-medium tracking-tight ${currentTab === "admin" ? "text-amber-700 font-bold" : "text-stone-400"}`}>
              Admin
            </span>
          </button>
        )}
      </div>

      {/* 2. DESKTOP VIEW: Collapsible Gemini-Style Sidebar (md:flex) */}
      <div 
        className={`hidden md:flex h-screen bg-[#FAFAFA] text-stone-800 flex-col justify-between transition-all duration-300 border-r border-stone-200/60 shrink-0 ${
          isCollapsed ? "w-16" : "w-64"
        }`}
        id="app-sidebar"
      >
        <div>
          {/* Header Area with Gemini Style Top Branding & Toggle */}
          <div className={`flex items-center h-16 border-b border-stone-200/60 ${
            isCollapsed ? "justify-center" : "justify-between px-4"
          }`}>
            {!isCollapsed ? (
              <>
                <div className="flex items-center space-x-2.5 min-w-0">
                  <img src="/logo.png" alt="Zawwaja" className="w-8 h-8 rounded-lg shadow-sm shrink-0 object-cover border border-[#af7661]/20" />
                  <div className="min-w-0">
                    <h1 className="text-stone-850 font-bold font-serif tracking-wide text-xs truncate">Zawwaja</h1>
                    <p className="text-[8px] text-[#af7661] uppercase tracking-wider font-semibold leading-none truncate">Sharia Planner</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCollapsed(true)}
                  className="p-1.5 rounded-lg text-stone-500 hover:text-[#af7661] hover:bg-stone-100 transition-colors cursor-pointer shrink-0"
                  title="Collapse Sidebar"
                >
                  <PanelLeftClose size={18} />
                </button>
              </>
            ) : (
              <button 
                onClick={() => setIsCollapsed(false)}
                className="w-10 h-10 rounded-xl overflow-hidden hover:scale-105 hover:bg-stone-100/60 active:scale-95 transition-all flex items-center justify-center border border-[#af7661]/15 shadow-sm cursor-pointer bg-white"
                title="Buka Sidebar"
              >
                <img src="/logo.png" alt="Zawwaja" className="w-8 h-8 rounded-lg object-cover" />
              </button>
            )}
          </div>

          {/* User Partner Badge Banner (only in expanded state) */}
          {!isCollapsed && profile && (
            <div className="p-3.5 mx-3.5 my-4 rounded-xl bg-stone-50 border border-stone-200 flex flex-col gap-1 shadow-sm">
              <p className="text-[9px] text-stone-500 font-bold uppercase tracking-wider">Perencanaan Akad</p>
              <p className="text-xs font-bold truncate text-stone-800 font-serif">
                {profile.fullName || "Anda"} & {profile.partnerName || "Pasangan"}
              </p>
              <span className="text-[8px] mt-1.5 inline-block self-start px-2.5 py-0.5 rounded-full bg-white text-stone-600 border border-stone-200/60 font-semibold uppercase tracking-wider shadow-sm">
                Syar'i Planner
              </span>
            </div>
          )}

          {/* Safe Nav Bar Items */}
          <nav className="mt-4 px-2 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`w-full flex items-center rounded-lg text-xs font-semibold tracking-wider uppercase transition-all group cursor-pointer ${
                    isCollapsed ? "justify-center p-3" : "justify-start px-4 py-3"
                  } ${
                    isActive 
                      ? "bg-[#af7661]/10 text-[#af7661] font-bold border-r-2 border-[#af7661]" 
                      : "text-stone-600 hover:bg-stone-100/60 hover:text-stone-900"
                  }`}
                  title={item.label}
                >
                  <Icon size={16} className={`shrink-0 ${isActive ? "text-[#af7661]" : "text-[#af7661]/60 group-hover:text-[#af7661]"}`} />
                  {!isCollapsed && <span className="ml-3 truncate font-sans">{item.label}</span>}
                </button>
              );
            })}

            {/* Admin Portal Nav Item (visible only for admins) */}
            {isAdmin && (
              <button
                onClick={() => setCurrentTab("admin")}
                className={`w-full flex items-center rounded-lg text-xs font-semibold tracking-wider uppercase transition-all group cursor-pointer ${
                  isCollapsed ? "justify-center p-3" : "justify-start px-4 py-3"
                } ${
                  currentTab === "admin" 
                    ? "bg-[#af7661]/10 text-[#af7661] font-bold border-r-2 border-[#af7661]" 
                    : "text-amber-700 hover:bg-stone-100/60 hover:text-amber-800"
                }`}
                title="Portal Admin"
              >
                <UserCheck size={16} className={`shrink-0 ${currentTab === "admin" ? "text-[#af7661]" : "text-amber-600/70"}`} />
                {!isCollapsed && <span className="ml-3 truncate font-sans">Portal Admin</span>}
              </button>
            )}
          </nav>
        </div>

        {/* Gemini-Style Profile & Settings Stacked at the Absolute Bottom */}
        {!isCollapsed ? (
          <div className="p-3 border-t border-stone-200/60 bg-white/70 flex items-center justify-between shadow-[0_-2px_6px_rgba(0,0,0,0.01)]">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-full bg-[#af7661]/10 text-[#af7661] flex items-center justify-center font-extrabold text-[11px] shrink-0 border border-[#af7661]/20 uppercase">
                {getInitials(profile?.fullName)}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-xs font-bold truncate text-stone-850 leading-tight">
                  {profile?.fullName || "Pengantin Baru"}
                </p>
                <p className="text-[10px] text-stone-500 truncate leading-none mt-0.5 font-sans">
                  {profile?.role === "admin" ? "Syar'i Admin" : "Pasangan Akad"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button 
                onClick={onOpenSettings} 
                className="p-1.5 rounded-lg text-stone-500 hover:text-[#af7661] hover:bg-stone-100 transition-colors cursor-pointer"
                title="Kelola Pengaturan Rencana Akad"
              >
                <Settings size={16} />
              </button>
              <button 
                onClick={onLogout} 
                className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Keluar / Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="py-4 border-t border-stone-200/60 bg-white/50 flex flex-col items-center gap-3.5">
            {/* Settings gear icon directly above profile avatar */}
            <button 
              onClick={onOpenSettings} 
              className="p-1.5 rounded-lg text-stone-500 hover:text-[#af7661] hover:bg-stone-100/60 transition-colors cursor-pointer flex items-center justify-center"
              title="Kelola Pengaturan Rencana Akad"
            >
              <Settings size={16} />
            </button>
            
            <button 
              onClick={onLogout}
              className="w-8 h-8 rounded-full bg-[#af7661]/10 text-[#af7661] flex items-center justify-center font-extrabold text-[10px] border border-[#af7661]/20 cursor-pointer shadow-sm hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-all duration-200 uppercase"
              title="Klik untuk Keluar (Logout)"
            >
              {getInitials(profile?.fullName)}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
