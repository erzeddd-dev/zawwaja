import React, { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  Loader2, 
  ShieldCheck, 
  Calendar, 
  Mail, 
  User,
  RefreshCw,
  LogOut,
  CheckCircle2,
  Trash2,
  XCircle
} from "lucide-react";
import { UserProfile } from "../types";
import { getAllUserProfiles, approveUserProfile, deleteUserProfile } from "../lib/firebase";

interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const profiles = await getAllUserProfiles();
      setUsers(profiles);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Gagal memuat data dari database Firestore.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminApprove = async (uid: string) => {
    setIsActionLoading(true);
    setErrorMessage(null);
    try {
      await approveUserProfile(uid, true);
      const profiles = await getAllUserProfiles();
      setUsers(profiles);
      const updatedUser = profiles.find(p => p.uid === uid) || null;
      setSelectedUser(updatedUser);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Gagal menyetujui akun pengantin.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAdminSuspend = async (uid: string) => {
    setIsActionLoading(true);
    setErrorMessage(null);
    try {
      await approveUserProfile(uid, false);
      const profiles = await getAllUserProfiles();
      setUsers(profiles);
      const updatedUser = profiles.find(p => p.uid === uid) || null;
      setSelectedUser(updatedUser);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Gagal menangguhkan akun pengantin.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAdminDelete = async (uid: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus akun pengantin ini secara permanen dari database? Seluruh data checklist, tamu, dan anggaran mereka akan ikut terhapus.")) {
      return;
    }
    setIsActionLoading(true);
    setErrorMessage(null);
    try {
      await deleteUserProfile(uid);
      const profiles = await getAllUserProfiles();
      setUsers(profiles);
      setSelectedUser(null);
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Gagal menghapus data pengantin.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAdminData();
    setIsRefreshing(false);
  };

  // Filter users based on search query
  const filteredUsers = users.filter(user => {
    const q = searchQuery.toLowerCase();
    return (
      (user.email || "").toLowerCase().includes(q) ||
      (user.fullName || "").toLowerCase().includes(q) ||
      (user.partnerName || "").toLowerCase().includes(q) ||
      (user.uid || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-stone-50 text-stone-700 font-sans" id="admin-dashboard-container">
      {/* 1. Header Banner */}
      <header className="bg-white border-b border-stone-200 py-4 px-6 md:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/10 flex items-center justify-center text-purple-700 border border-purple-200">
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif font-black text-lg md:text-xl text-stone-900 tracking-wide uppercase">Zawwaja</h1>
              <span className="text-[10px] uppercase font-mono font-bold text-white bg-purple-600 border border-purple-700 rounded-full px-2.5 py-0.5 shadow-sm">
                🛡️ ADMIN VIEW
              </span>
            </div>
            <p className="text-xs text-stone-500 font-medium">Sistem Manajemen & Verifikasi Profil Pengantin</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            className="p-2 sm:px-3 sm:py-2 bg-stone-100 hover:bg-stone-200/80 rounded-xl border border-stone-250 text-stone-600 text-xs font-bold font-mono transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
            title="Muat Ulang Data"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            {!isRefreshing && <span className="hidden sm:inline">Refresh</span>}
          </button>

          <button
            onClick={onLogout}
            className="p-2 sm:px-3 sm:py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl border border-rose-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Keluar"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* 2. Main Content Layout */}
      <main className="p-4 sm:p-6 md:p-10 max-w-7xl mx-auto">
        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs mb-6 flex items-start gap-2 max-w-4xl mx-auto">
            <ShieldCheck size={18} className="text-rose-500 shrink-0" />
            <div>
              <p className="font-bold">Error Administratif:</p>
              <p className="mt-0.5 text-stone-600">{errorMessage}</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <Loader2 size={40} className="animate-spin text-purple-600" />
            <p className="text-sm text-stone-500 font-semibold font-mono">Mengakses Database Firestore Aman...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* 3. User Listing Panel */}
            <div className="col-span-1 lg:col-span-7 bg-white rounded-2xl border border-stone-200/85 shadow-md p-5 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <Users className="text-purple-600" size={18} />
                  <h2 className="font-serif font-bold text-sm text-stone-800 uppercase tracking-wider">Semua Pengguna Terdaftar ({users.length})</h2>
                </div>

                {/* Search query box */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Cari email / nama..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 w-full sm:w-56 text-xs rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:border-purple-500 font-medium text-stone-700"
                  />
                  <Search size={14} className="absolute left-2.5 top-2.5 text-stone-400" />
                </div>
              </div>

              {filteredUsers.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-stone-400 text-xs">Tidak ada pengguna yang cocok dengan pencarian Anda.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-stone-600 text-[11px]">
                    <thead>
                      <tr className="bg-stone-50 text-[10px] font-bold text-stone-500 uppercase tracking-wider border-b border-stone-200">
                        <th className="py-3 px-4">Calon Pengantin (Profil)</th>
                        <th className="py-3 px-4">Kontak / Tanggal Terdaftar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filteredUsers.map((u) => {
                        const isCurrentlySelected = selectedUser?.uid === u.uid;
                        const createdDate = u.createdAt ? new Date(u.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        }) : "Tidak Tercatat";

                        return (
                          <tr 
                            key={u.uid} 
                            onClick={() => setSelectedUser(u)}
                            className={`hover:bg-stone-50 cursor-pointer transition-all duration-150 ${isCurrentlySelected ? "bg-purple-50/50 hover:bg-purple-50" : ""}`}
                            id={`admin-user-row-${u.uid}`}
                          >
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-stone-950 text-xs">
                                {u.fullName || "Pria Baru"} & {u.partnerName || "Wanita Baru"}
                              </div>
                              <div className="text-[10px] text-stone-400 mt-0.5 flex items-center gap-1 font-mono hover:underline">
                                <Mail size={10} className="text-stone-300" />
                                {u.email}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-stone-500 text-[11px]">
                              <div className="flex items-center gap-1">
                                <Calendar size={11} className="text-stone-300" />
                                {createdDate}
                              </div>
                              <div className="text-[9px] text-stone-400 mt-0.5">{u.uid.substring(0, 10)}...</div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 4. Selected User Details Inspector */}
            <div className="col-span-1 lg:col-span-5">
              {selectedUser ? (
                <div className="bg-white rounded-2xl border border-stone-200/85 shadow-md p-5 pb-6 animate-in fade-in slide-in-from-right-4 duration-200" id="profile-inspector-panel">
                  <div className="flex items-center justify-between pb-4 mb-5 border-b border-stone-100">
                    <div className="flex items-center gap-2">
                      <User className="text-purple-600" size={18} />
                      <div>
                        <h3 className="font-serif font-black text-sm text-stone-850">INSPEKTUR PROFIL</h3>
                        <p className="text-[10px] text-stone-400 font-mono">Pengguna: {selectedUser.fullName || "Pengantin"}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedUser(null)}
                      className="text-stone-400 hover:text-stone-600 text-xs font-bold transition-colors p-1"
                      title="Selesai Tinjau"
                    >
                      Tutup
                    </button>
                  </div>

                  {/* Summary Profile of bride and groom */}
                  <div className="p-5 bg-stone-50 rounded-xl border border-stone-200/60 font-mono text-[11px] space-y-3.5 text-stone-650 text-left">
                    <div>
                      <span className="text-stone-450 block text-[9px] uppercase font-bold tracking-wider">Calon Pengantin Pria</span>
                      <span className="font-semibold text-stone-800 text-xs">{selectedUser.fullName || "-"}</span>
                    </div>
                    <div>
                      <span className="text-stone-450 block text-[9px] uppercase font-bold tracking-wider">Calon Pengantin Wanita</span>
                      <span className="font-semibold text-stone-800 text-xs">{selectedUser.partnerName || "-"}</span>
                    </div>
                    <div>
                      <span className="text-stone-450 block text-[9px] uppercase font-bold tracking-wider">Rencana Tanggal Akad</span>
                      <span className="font-semibold text-stone-850 text-xs">
                        {selectedUser.weddingDate ? new Date(selectedUser.weddingDate).toLocaleDateString("id-ID", {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-450 block text-[9px] uppercase font-bold tracking-wider">Target Alokasi Anggaran</span>
                      <span className="font-semibold text-stone-850 text-xs">
                        Rp {(selectedUser.totalBudget || 0).toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-450 block text-[9px] uppercase font-bold tracking-wider">Surel / Alamat Email</span>
                      <span className="font-semibold text-stone-850 text-xs">{selectedUser.email}</span>
                    </div>
                    <div>
                      <span className="text-stone-450 block text-[9px] uppercase font-bold tracking-wider">User ID</span>
                      <span className="text-[10px] text-stone-500 font-mono break-all">{selectedUser.uid}</span>
                    </div>
                    <div>
                      <span className="text-stone-450 block text-[9px] uppercase font-bold tracking-wider">Status Pembayaran / Akun</span>
                      <span className={`inline-block mt-1 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
                        selectedUser.approvalStatus === "approved" 
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}>
                        {selectedUser.approvalStatus === "approved" ? "🟢 AKTIF PREMIUM" : "🟡 MENUNGGU VERIFIKASI / PENDING"}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons for Admin Management */}
                  <div className="mt-5 space-y-2.5">
                    {selectedUser.approvalStatus !== "approved" ? (
                      <button
                        onClick={() => handleAdminApprove(selectedUser.uid)}
                        disabled={isActionLoading}
                        className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow transition-all duration-200 border-none outline-none"
                      >
                        <CheckCircle2 size={15} />
                        Setujui & Aktifkan Premium
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAdminSuspend(selectedUser.uid)}
                        disabled={isActionLoading}
                        className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow transition-all duration-200 border-none outline-none"
                      >
                        <XCircle size={15} />
                        Tangguhkan Premium (Nonaktifkan)
                      </button>
                    )}

                    <button
                      onClick={() => handleAdminDelete(selectedUser.uid)}
                      disabled={isActionLoading}
                      className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer border border-rose-200 shadow-xs transition-all duration-200"
                    >
                      <Trash2 size={15} />
                      Hapus Pengguna dari Database
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-stone-200 rounded-2xl py-16 px-6 text-center bg-stone-50/30">
                  <div className="w-12 h-12 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center mx-auto mb-4 text-stone-400">
                    <User size={20} />
                  </div>
                  <h4 className="text-stone-850 text-xs font-bold uppercase tracking-wider">Silakan Pilih Pengguna</h4>
                  <p className="text-[11px] text-stone-550 mt-1 max-w-xs mx-auto">
                    Klik nama pengguna di tabel sebelah kiri untuk meninjau informasi rincian rencana akad pernikahan mereka secara lengkap.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
