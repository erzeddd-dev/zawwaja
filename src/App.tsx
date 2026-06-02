import React, { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import Onboarding from "./components/Onboarding";
import BudgetSummary from "./components/BudgetSummary";
import Preparation from "./components/Preparation";
import Vendors from "./components/Vendors";
import Mahar from "./components/Mahar";
import AdminPortal from "./components/AdminPortal";
import AdminDashboard from "./components/AdminDashboard";
import Undangan from "./components/Undangan";

import { 
  subscribeToAuth, 
  logoutUser, 
  getChecklistItems, 
  saveChecklistItem, 
  deleteChecklistItem,
  resetChecklistToDefault,
  clearChecklist,
  getVendorItems,
  saveVendorItem,
  deleteVendorItem,
  getMaharItems,
  saveMaharItem,
  deleteMaharItem,
  updateProfileSettings,
  isMockMode,
  defaultChecklistItems
} from "./lib/firebase";
import { 
  UserProfile, 
  WeddingChecklistItem, 
  VendorItem, 
  MaharItem 
} from "./types";
import { 
  Heart, 
  Calendar, 
  DollarSign, 
  Menu, 
  Settings, 
  CheckCircle,
  HelpCircle,
  AlertCircle,
  LogOut
} from "lucide-react";

export default function App() {
  // Authentication & Profile States
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [currentTab, setCurrentTab] = useState<string>("dashboard");

  // Core Document Database Collections
  const [checklistItems, setChecklistItems] = useState<WeddingChecklistItem[]>(defaultChecklistItems);
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [maharItems, setMaharItems] = useState<MaharItem[]>([]);


  // Settings / Update states
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsFullName, setSettingsFullName] = useState("");
  const [settingsPartnerName, setSettingsPartnerName] = useState("");
  const [settingsWeddingDate, setSettingsWeddingDate] = useState("");
  const [settingsTotalBudget, setSettingsTotalBudget] = useState(0);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const [showMobileProfileMenu, setShowMobileProfileMenu] = useState(false);

  // Subscribe to Auth changes
  useEffect(() => {
    const unsubscribe = subscribeToAuth((activeUser, activeProfile) => {
      setUser(activeUser);
      setProfile(activeProfile);
      setAuthReady(true);
      
      // If of admin category, activate admin portal tab automatically
      if (activeProfile && (activeProfile.role === "admin" || activeProfile.email === "erzeddd@gmail.com")) {
        // Keeps user on current tab unless initialized to dashboard
      }
    });

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  // Fetch collections once authenticated
  const fetchUserData = async () => {
    if (profile?.uid) {
      const pUid = profile.uid;
      try {
        const check = await getChecklistItems(pUid);
        const vend = await getVendorItems(pUid);
        const mahar = await getMaharItems(pUid);


        setChecklistItems(check && check.length > 0 ? check : defaultChecklistItems);
        setVendors(vend || []);
        setMaharItems(mahar || []);

        // Load settings inputs
        setSettingsFullName(profile.fullName || "");
        setSettingsPartnerName(profile.partnerName || "");
        setSettingsWeddingDate(profile.weddingDate || "");
        setSettingsTotalBudget(profile.totalBudget || 0);
      } catch (err) {
        console.error("Error reading data collections index:", err);
      }
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [profile?.uid]);

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setProfile(null);
    setCurrentTab("dashboard");
  };

  const getInitials = (name?: string) => {
    if (!name) return "P";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0] ? parts[0][0].toUpperCase() : "P";
  };

  const handleOnboardingSuccess = (newProfile: UserProfile) => {
    setProfile(newProfile);
    setCurrentTab("dashboard");
  };

  const handleSaveProfileFromDashboardOnboard = async (fullName: string, partnerName: string, weddingDate: string, totalBudget: number) => {
    if (!profile?.uid) return;
    try {
      await updateProfileSettings(profile.uid, {
        fullName,
        partnerName,
        weddingDate,
        totalBudget
      });
      setSettingsFullName(fullName);
      setSettingsPartnerName(partnerName);
      setSettingsWeddingDate(weddingDate);
      setSettingsTotalBudget(totalBudget);
      setProfile(prev => prev ? {
        ...prev,
        fullName,
        partnerName,
        weddingDate,
        totalBudget
      } : null);
    } catch (err: any) {
      console.error("Dashboard Onboarding Save error:", err);
      throw new Error(err.message || "Sistem gagal merekam rincian rencana akad pernikahan Anda.");
    }
  };

  // --- 1. Operations: Preparation Checklist ---
  const handleSaveChecklistItem = async (item: WeddingChecklistItem) => {
    if (!profile?.uid) return;
    await saveChecklistItem(profile.uid, item);
    // Refresh local
    const data = await getChecklistItems(profile.uid);
    setChecklistItems(data);
  };

  const handleDeleteChecklistItem = async (id: string) => {
    if (!profile?.uid) return;
    await deleteChecklistItem(profile.uid, id);
    const data = await getChecklistItems(profile.uid);
    setChecklistItems(data);
  };

  const handleClearChecklist = async () => {
    if (!profile?.uid) return;
    if (window.confirm("Bismillah, yakin ingin mengosongkan seluruh daftar persiapan nikah Anda?")) {
      setIsUpdatingSettings(true);
      try {
        await clearChecklist(profile.uid);
        setChecklistItems([]);
      } catch (err) {
        console.error("Gagal mengosongkan checklist:", err);
      } finally {
        setIsUpdatingSettings(false);
      }
    }
  };

  const handleResetChecklistDefaults = async () => {
    // Immediately reset UI state to default items to be reactive
    setChecklistItems(defaultChecklistItems);
    
    if (!profile?.uid) return;
    setIsUpdatingSettings(true);
    try {
      const data = await resetChecklistToDefault(profile.uid);
      setChecklistItems(data);
    } catch (err) {
      console.error("Failed to sync reset items:", err);
      setChecklistItems(defaultChecklistItems);
    } finally {
      setIsUpdatingSettings(false);
    }
  };


  // --- 2. Operations: Vendor Management ---
  const handleSaveVendor = async (vendor: VendorItem) => {
    if (!profile?.uid) return;
    await saveVendorItem(profile.uid, vendor);
    const data = await getVendorItems(profile.uid);
    setVendors(data);
  };

  const handleDeleteVendor = async (id: string) => {
    if (!profile?.uid) return;
    await deleteVendorItem(profile.uid, id);
    const data = await getVendorItems(profile.uid);
    setVendors(data);
  };

  const handleClearVendors = async () => {
    if (!profile?.uid) return;
    if (window.confirm("Bismillah, yakin ingin menghapus seluruh kontak vendor terdaftar?")) {
      for (const v of vendors) {
        await deleteVendorItem(profile.uid, v.id);
      }
      setVendors([]);
    }
  };

  const handleResetVendorDefaults = async () => {
    if (!profile?.uid) return;
    const defaults = [
      { name: "Baitul Ma'mur Convention Hall", category: "Venue", contact: "081234567800", socialMedia: "@baitulmamur_venue", notes: "Sewa aula include sound system syar'i terpisah hijab tabir." },
      { name: "Khadijah Halal Catering Service", category: "Catering", contact: "081890123456", socialMedia: "@khadijah_halalcatering", notes: "Sertifikasi Halal MUI, menu gulai kambing & batagor recommended." },
      { name: "Aishah Sharia Hijab & Gown Bridal", category: "Rias & Busana", contact: "082345678912", socialMedia: "@aishah_bridal_syari", notes: "Menyediakan kebaya modern longgar dengan cadar & jas CPP syar'i." },
      { name: "Nuansa Foto Sharia Creative", category: "Dokumentasi", contact: "082133445566", socialMedia: "@nuansafoto", notes: "Tim fotografer pria khusus pengantin putra, tim wanita khusus pengantin putri." }
    ];

    setIsUpdatingSettings(true);
    for (const v of defaults) {
      const item: VendorItem = {
        id: "default-v-" + Math.random().toString(36).substring(2, 9),
        name: v.name,
        category: v.category,
        contact: v.contact,
        socialMedia: v.socialMedia,
        notes: v.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await saveVendorItem(profile.uid, item);
    }
    const data = await getVendorItems(profile.uid);
    setVendors(data);
    setIsUpdatingSettings(false);
  };


  // --- 3. Operations: Mahar & Seserahan ---
  const handleSaveMaharItem = async (item: MaharItem) => {
    if (!profile?.uid) return;
    await saveMaharItem(profile.uid, item);
    const data = await getMaharItems(profile.uid);
    setMaharItems(data);
  };

  const handleDeleteMaharItem = async (id: string) => {
    if (!profile?.uid) return;
    await deleteMaharItem(profile.uid, id);
    const data = await getMaharItems(profile.uid);
    setMaharItems(data);
  };

  const handleClearMahar = async () => {
    if (!profile?.uid) return;
    if (window.confirm("Bismillah, yakin ingin mengosongkan seluruh daftar mahar dan seserahan Anda?")) {
      for (const i of maharItems) {
        await deleteMaharItem(profile.uid, i.id);
      }
      setMaharItems([]);
    }
  };

  const handleResetMaharDefaults = async () => {
    if (!profile?.uid) return;
    const defaults = [
      { name: "Logam Mulia Mas Kawin Antam Berpijar", brand: "Antam Gold", ecommerceLink: "https://www.tokopedia.com", price: 6500000, isJewelry: true, jewelryWeight: 5, jewelryPricePerGram: 1300000 },
      { name: "Mushaf Al-Qur'an Madinah & Mukena Renda Silk Sharia", brand: "Sutera Sharia", ecommerceLink: "https://shopee.co.id", price: 900000, isJewelry: false, jewelryWeight: 0, jewelryPricePerGram: 0 },
      { name: "Paket Kosmetik Sharia Halal Lengkap", brand: "Wardah Beauty", ecommerceLink: "https://shopee.co.id", price: 600000, isJewelry: false, jewelryWeight: 0, jewelryPricePerGram: 0 }
    ];

    setIsUpdatingSettings(true);
    for (const i of defaults) {
      const item: MaharItem = {
        id: "default-m-" + Math.random().toString(36).substring(2, 9),
        name: i.name,
        brand: i.brand,
        ecommerceLink: i.ecommerceLink,
        price: i.price,
        isJewelry: i.isJewelry,
        jewelryWeight: i.jewelryWeight,
        jewelryPricePerGram: i.jewelryPricePerGram,
        isPurchased: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await saveMaharItem(profile.uid, item);
    }
    const data = await getMaharItems(profile.uid);
    setMaharItems(data);
    setIsUpdatingSettings(false);
  };





  // --- 5. Operations: Profile Settings update ---
  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.uid) return;
    
    setIsUpdatingSettings(true);
    try {
      await updateProfileSettings(profile.uid, {
        fullName: settingsFullName,
        partnerName: settingsPartnerName,
        weddingDate: settingsWeddingDate,
        totalBudget: Number(settingsTotalBudget) || 0
      });
      setShowSettingsModal(false);
      
      // Update local profile representation
      setProfile(prev => prev ? {
        ...prev,
        fullName: settingsFullName,
        partnerName: settingsPartnerName,
        weddingDate: settingsWeddingDate,
        totalBudget: Number(settingsTotalBudget) || 0
      }: null);

    } catch (err) {
      alert("Gagal merubah data profil pernikahan");
    } finally {
      setIsUpdatingSettings(false);
    }
  };


  // If the Auth validation is pending, show loading state
  if (!authReady) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center space-y-3" id="app-loading">
        <img src="/logo.png" alt="Zawwaja" className="w-16 h-16 object-contain animate-pulse mb-1" />
        <h3 className="font-serif font-bold text-emerald-950 text-md">Bismillah, Zawwaja Memuat...</h3>
        <p className="text-xs text-stone-400">Menyisir konfigurasi Syari'at & Database Islami</p>
      </div>
    );
  }

  // Handle Onboarding gating: if not logged in or profile is in verification stage, run Onboarding
  const isApproved = profile && profile.approvalStatus === "approved";
  const isAdminUser = (profile && (profile.role === "admin" || profile.email === "erzeddd@gmail.com")) || (user && user.uid === "TCJDTGcaTZRcBo9jC1JZBOAnWgo2");
  
  // Show onboarding if they aren't authenticated or aren't approved yet (unless they're an admin, who can log straight into the workspace)
  if (!user || (!profile && user.uid !== "TCJDTGcaTZRcBo9jC1JZBOAnWgo2") || (!isApproved && !isAdminUser)) {
    return (
      <Onboarding 
        onSuccess={handleOnboardingSuccess} 
        onLogout={handleLogout}
        profile={profile}
        userId={user?.uid || null}
        setUser={setUser}
      />
    );
  }

  if (user?.uid === "TCJDTGcaTZRcBo9jC1JZBOAnWgo2") {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  return (
    <div className="flex h-screen bg-[#FAFAFA] font-sans text-stone-700" id="main-workspace">
      
      {/* 1. Left Sidebar Navigation */}
      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        profile={profile}
        onLogout={handleLogout}
        onOpenSettings={() => setShowSettingsModal(true)}
      />

      {/* 2. Main Work Panel Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Workspace Top Header */}
        <header className="bg-white border-b border-stone-200 px-4 h-16 md:px-8 flex flex-row items-center justify-between z-30 shrink-0 transition-all">
          <div className="flex items-center space-x-2 animate-fade-in min-w-0">
            <h2 className="text-stone-800 font-serif font-semibold text-base sm:text-xl md:text-2xl tracking-wide truncate">
              {currentTab === "dashboard" && "Dashboard Pelacak Akad"}
              {currentTab === "checklist" && "Daftar Persiapan Nikah"}
              {currentTab === "vendors" && "Direktori Rekanan Vendor"}
              {currentTab === "mahar" && "Daftar Mahar & Seserahan"}
              {currentTab === "guests" && "Daftar Tamu & RSVP"}
              {currentTab === "admin" && "Panel Verifikasi Administratif"}
            </h2>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <div className="relative">
              <button
                onClick={() => setShowMobileProfileMenu(!showMobileProfileMenu)}
                className="w-9 h-9 rounded-full bg-[#af7661]/10 text-[#af7661] border border-[#af7661]/20 flex items-center justify-center font-extrabold text-[11px] uppercase cursor-pointer hover:bg-[#af7661]/20 transition-all shadow-xs shrink-0"
                title="Menu Profil & Setelan"
              >
                {getInitials(profile?.fullName)}
              </button>

              {showMobileProfileMenu && (
                <>
                  {/* Backdrop to close dropdown when clicking outside */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowMobileProfileMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-stone-200 rounded-xl shadow-xl z-50 p-3.5 animate-in fade-in slide-in-from-top-3 duration-150">
                    <div className="pb-2.5 border-b border-stone-150 mb-2 text-left">
                      <p className="text-xs font-bold text-stone-850 truncate">{profile?.fullName || "Pengantin Baru"}</p>
                      <p className="text-[10px] text-stone-450 mt-0.5 truncate">{profile?.email || user?.email}</p>
                      <span className="inline-block text-[8px] bg-stone-100 text-stone-500 font-bold uppercase px-2 py-0.5 rounded-full mt-1.5 leading-none">
                        {profile?.role === "admin" ? "Syar'i Admin" : "Pasangan Akad"}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          setShowMobileProfileMenu(false);
                          setShowSettingsModal(true);
                        }}
                        className="w-full text-left px-2.5 py-2 text-xs text-stone-700 hover:bg-stone-50 hover:text-[#af7661] rounded-lg transition-colors font-medium flex items-center gap-2 cursor-pointer border-0 bg-transparent"
                      >
                        <Settings size={14} className="text-stone-400 shrink-0" />
                        Ubah Rencana Akad
                      </button>
                      <button
                        onClick={() => {
                          setShowMobileProfileMenu(false);
                          handleLogout();
                        }}
                        className="w-full text-left px-2.5 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors font-medium flex items-center gap-2 cursor-pointer border-0 bg-transparent"
                      >
                        <LogOut size={14} className="text-rose-400 shrink-0" />
                        Keluar / Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Outer scrolling content block with bottom padding to fit bottom bar on mobile */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pb-24 md:pb-8">
          <div className="max-w-6xl mx-auto pb-12">
            
            {/* Render Views depending on state */}
            {currentTab === "dashboard" && (
              <BudgetSummary
                profile={profile}
                checklistItems={checklistItems}
                maharItems={maharItems}
                onNavigate={(tab) => setCurrentTab(tab)}
                onSaveProfile={handleSaveProfileFromDashboardOnboard}
              />
            )}

            {currentTab === "checklist" && (
              <Preparation
                items={checklistItems}
                onSaveItem={handleSaveChecklistItem}
                onDeleteItem={handleDeleteChecklistItem}
                onClearAll={handleClearChecklist}
                onResetDefaults={handleResetChecklistDefaults}
                isUpdating={isUpdatingSettings}
              />
            )}

            {currentTab === "vendors" && (
              <Vendors
                vendors={vendors}
                onSaveVendor={handleSaveVendor}
                onDeleteVendor={handleDeleteVendor}
                onClearAll={handleClearVendors}
                onResetDefaults={handleResetVendorDefaults}
              />
            )}

            {currentTab === "mahar" && (
              <Mahar
                items={maharItems}
                onSaveItem={handleSaveMaharItem}
                onDeleteItem={handleDeleteMaharItem}
                onClearAll={handleClearMahar}
                onResetDefaults={handleResetMaharDefaults}
              />
            )}

            {currentTab === "undangan" && (
              <Undangan
                profile={profile}
              />
            )}



            {currentTab === "admin" && isAdminUser && (
              <AdminPortal 
                onApprovalChanged={async () => {
                  // If admin disproved their active viewing account, it refreshes
                  const updatedList = await getChecklistItems(profile?.uid || "");
                  setChecklistItems(updatedList);
                }}
              />
            )}

          </div>
        </main>

      </div>

      {/* --- QUICK ONBOARDING PROFILE SETTINGS MODAL --- */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#af7661] p-4 text-white flex justify-between items-center">
              <h3 className="font-serif font-bold text-sm">Ubah Rencana Onboarding Akad</h3>
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="p-1 hover:bg-white/10 rounded text-[#D4A5A5] hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateSettings} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">Calon Pengantin Pria</label>
                <input
                  type="text"
                  required
                  value={settingsFullName}
                  onChange={(e) => setSettingsFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-200 focus:outline-none focus:ring-1 focus:ring-[#af7661] text-stone-750"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">Calon Pengantin Wanita</label>
                <input
                  type="text"
                  required
                  value={settingsPartnerName}
                  onChange={(e) => setSettingsPartnerName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-200 focus:outline-none focus:ring-1 focus:ring-[#af7661] text-stone-750"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">Rencana Tanggal Akad Nikah</label>
                <input
                  type="date"
                  required
                  value={settingsWeddingDate}
                  onChange={(e) => setSettingsWeddingDate(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-200 focus:outline-none focus:ring-1 focus:ring-[#af7661] text-stone-750"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">Target Alokasi Anggaran (IDR)</label>
                <input
                  type="number"
                  required
                  min={100000}
                  value={settingsTotalBudget}
                  onChange={(e) => setSettingsTotalBudget(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-200 focus:outline-none focus:ring-1 focus:ring-[#af7661] font-mono text-[#4A1F16]"
                />
              </div>

              <div className="flex gap-2 pt-4 border-t border-stone-100 justify-end">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 border border-stone-200 text-stone-500 rounded-xl font-semibold hover:bg-stone-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingSettings}
                  className="px-4 py-2 bg-gradient-to-r from-[#af7661] to-[#D4A5A5] text-white rounded-xl font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
                >
                  {isUpdatingSettings ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Simple X icon helper since we need it in the setting modal
function X(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
