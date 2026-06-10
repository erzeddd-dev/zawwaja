import React, { useEffect, useState, useCallback, Suspense, lazy } from "react";
import Sidebar from "./components/Sidebar";
import Onboarding from "./components/Onboarding";
import BudgetSummary from "./components/BudgetSummary";

const Preparation = lazy(() => import("./components/Preparation"));
const Vendors = lazy(() => import("./components/Vendors"));
const Mahar = lazy(() => import("./components/Mahar"));
const AdminPortal = lazy(() => import("./components/AdminPortal"));
const AdminDashboard = lazy(() => import("./components/AdminDashboard"));


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
  const [currentTab, setCurrentTab] = useState<string>(() => {
    return localStorage.getItem("zawwaja_current_tab") || "dashboard";
  });

  useEffect(() => {
    localStorage.setItem("zawwaja_current_tab", currentTab);
  }, [currentTab]);

  // Core Document Database Collections
  const [checklistItems, setChecklistItems] = useState<WeddingChecklistItem[]>(defaultChecklistItems);
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [maharItems, setMaharItems] = useState<MaharItem[]>([]);


  // Settings / Update states
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
  const handleSaveChecklistItem = useCallback(async (item: WeddingChecklistItem) => {
    if (!profile?.uid) return;
    
    // Optimistic Update
    setChecklistItems(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) {
        return prev.map(i => i.id === item.id ? item : i);
      } else {
        return [...prev, item];
      }
    });

    try {
      await saveChecklistItem(profile.uid, item);
    } catch (err) {
      console.error(err);
      const data = await getChecklistItems(profile.uid);
      setChecklistItems(data);
    }
  }, [profile?.uid]);

  const handleDeleteChecklistItem = useCallback(async (id: string) => {
    if (!profile?.uid) return;
    await deleteChecklistItem(profile.uid, id);
    const data = await getChecklistItems(profile.uid);
    setChecklistItems(data);
  }, [profile?.uid]);

  const handleClearChecklist = useCallback(async () => {
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
  }, [profile?.uid]);

  const handleResetChecklistDefaults = useCallback(async () => {
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
  }, [profile?.uid]);


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
      <div className="min-h-screen bg-surface-base flex flex-col items-center justify-center space-y-3" id="app-loading">
        <img src="/logo.png" alt="Zawwaja" className="w-16 h-16 object-contain animate-pulse mb-1" />
        <h3 className="font-serif font-bold text-text-primary text-md">Bismillah, Zawwaja Memuat...</h3>
        <p className="text-xs text-text-tertiary">Menyisir konfigurasi Syari'at & Database Islami</p>
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
    <div className="flex h-screen antigravity-bg font-sans text-text-primary" id="main-workspace">
      
      {/* 1. Left Sidebar Navigation */}
      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        profile={profile}
        onLogout={handleLogout}
        onOpenSettings={() => setCurrentTab("profile")}
      />

      {/* 2. Main Work Panel Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-[1]">
        
        {/* Workspace Top Header Removed */}
        {/* Outer scrolling content block with bottom padding to fit bottom bar on mobile */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pb-24 md:pb-8">
          <div className="max-w-6xl mx-auto pb-12">
            <Suspense fallback={
              <div className="flex flex-col items-center justify-center py-20 text-text-tertiary animate-pulse">
                <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4"></div>
                <p className="text-xs font-semibold">Memuat halaman...</p>
              </div>
            }>
            {/* Render Views depending on state */}
            {currentTab === "dashboard" && (
              <BudgetSummary
                profile={profile}
                checklistItems={checklistItems}
                maharItems={maharItems}
                onNavigate={(tab) => setCurrentTab(tab)}
                onSaveProfile={handleSaveProfileFromDashboardOnboard}
                onSaveChecklistItem={handleSaveChecklistItem}
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





            {currentTab === "admin" && isAdminUser && (
              <AdminPortal 
                onApprovalChanged={async () => {
                  // If admin disproved their active viewing account, it refreshes
                  const updatedList = await getChecklistItems(profile?.uid || "");
                  setChecklistItems(updatedList);
                }}
              />
            )}
            </Suspense>

            {currentTab === "profile" && (
              <div className="max-w-md mx-auto space-y-6 animate-fade-in pt-4">
                <div className="text-center space-y-2 mb-6">
                  <div className="w-20 h-20 mx-auto rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-2xl border-4 border-brand-50 shadow-md">
                    {getInitials(profile?.fullName)}
                  </div>
                  <h2 className="text-xl font-serif font-bold text-text-primary">{profile?.fullName || "Pengantin"}</h2>
                  <p className="text-xs text-text-tertiary">{profile?.email || user?.email}</p>
                  <span className="inline-block text-[10px] bg-brand-50 text-brand-700 font-bold uppercase px-3 py-1 rounded-full mt-2">
                    {profile?.role === "admin" ? "Syar'i Admin" : "Pasangan Akad"}
                  </span>
                </div>

                <div className="bg-surface-raised p-6 rounded-2xl border border-surface-border shadow-sm">
                  <h3 className="font-serif font-bold text-sm text-text-primary mb-4 border-b border-surface-border pb-2">Ubah Rencana Akad</h3>
                  <form onSubmit={handleUpdateSettings} className="space-y-4 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-text-tertiary mb-1">Calon Pengantin Pria</label>
                      <input
                        type="text"
                        required
                        value={settingsFullName}
                        onChange={(e) => setSettingsFullName(e.target.value)}
                        className="w-full px-3 py-2 bg-surface-base rounded-xl border border-surface-border focus:outline-none focus:ring-1 focus:ring-brand-600 text-text-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-text-tertiary mb-1">Calon Pengantin Wanita</label>
                      <input
                        type="text"
                        required
                        value={settingsPartnerName}
                        onChange={(e) => setSettingsPartnerName(e.target.value)}
                        className="w-full px-3 py-2 bg-surface-base rounded-xl border border-surface-border focus:outline-none focus:ring-1 focus:ring-brand-600 text-text-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-text-tertiary mb-1">Rencana Tanggal Akad Nikah</label>
                      <input
                        type="date"
                        required
                        value={settingsWeddingDate}
                        onChange={(e) => setSettingsWeddingDate(e.target.value)}
                        className="w-full px-3 py-2 bg-surface-base rounded-xl border border-surface-border focus:outline-none focus:ring-1 focus:ring-brand-600 text-text-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-text-tertiary mb-1">Target Alokasi Anggaran (IDR)</label>
                      <input
                        type="text"
                        required
                        value={settingsTotalBudget === 0 ? "" : new Intl.NumberFormat('en-US').format(settingsTotalBudget)}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, "");
                          setSettingsTotalBudget(val === "" ? 0 : Number(val));
                        }}
                        className="w-full px-3 py-2 bg-surface-base rounded-xl border border-surface-border focus:outline-none focus:ring-1 focus:ring-brand-600 font-mono text-text-primary"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isUpdatingSettings}
                        className="w-full py-2.5 bg-brand-600 text-white rounded-xl font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-sm text-sm"
                      >
                        {isUpdatingSettings ? "Menyimpan..." : "Simpan Perubahan"}
                      </button>
                    </div>
                  </form>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full py-3 bg-rose-50 text-rose-600 font-bold rounded-xl border border-rose-200 hover:bg-rose-100 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut size={18} />
                  Keluar / Logout
                </button>
              </div>
            )}

          </div>
        </main>

      </div>

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
