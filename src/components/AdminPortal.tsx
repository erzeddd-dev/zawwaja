import React, { useEffect, useState } from "react";
import { UserProfile } from "../types";
import { getAllUserProfiles, approveUserProfile } from "../lib/firebase";
import { 
  UserCheck, 
  ShieldCheck, 
  Clock, 
  X, 
  AlertCircle, 
  RefreshCw, 
  UserX,
  MessageSquare
} from "lucide-react";

interface AdminPortalProps {
  onApprovalChanged: () => void;
}

export default function AdminPortal({ onApprovalChanged }: AdminPortalProps) {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const fetchProfiles = async () => {
    setIsLoading(true);
    try {
      const data = await getAllUserProfiles();
      // Filter out admin profile itself from tables so it's clean, or display everything
      setProfiles(data);
    } catch (err) {
      setErrorMessage("Gagal memuat daftar pengantin.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleApprove = async (uid: string, fullName: string) => {
    setSuccessMessage("");
    setErrorMessage("");
    try {
      await approveUserProfile(uid, true);
      setSuccessMessage(`Berhasil mengaktifkan akun milik ${fullName}! Notifikasi WhatsApp aktivasi telah dikirim.`);
      fetchProfiles();
      onApprovalChanged();
    } catch (err) {
      setErrorMessage("Gagal memperbarui status akun.");
    }
  };

  const handleDeny = async (uid: string, fullName: string) => {
    setSuccessMessage("");
    setErrorMessage("");
    try {
      await approveUserProfile(uid, false);
      setSuccessMessage(`Berhasil menangguhkan akun ${fullName}.`);
      fetchProfiles();
      onApprovalChanged();
    } catch (err) {
      setErrorMessage("Gagal menangguhkan status akun.");
    }
  };

  // Separations
  const pendingCouples = profiles.filter(p => p.role !== "admin" && (p.paymentStatus === "paid" && p.approvalStatus === "pending"));
  const unpaidCouples = profiles.filter(p => p.role !== "admin" && p.paymentStatus === "pending");
  const approvedCouples = profiles.filter(p => p.role !== "admin" && p.approvalStatus === "approved");

  return (
    <div className="space-y-6" id="admin-view">
      
      {/* Admin header */}
      <div className="bg-amber-900 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border border-amber-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-amber-300" />
            <span className="text-xs uppercase tracking-wider font-bold text-amber-200">Zawwaja Admin System</span>
          </div>
          <h2 className="text-xl md:text-2xl font-serif font-bold">Portal Verifikasi QRIS Mudharabah</h2>
          <p className="text-amber-100/90 text-xs">Menu asasi untuk memantau mutasi QRIS masuk sebesar Rp 25.000 dan mengaktifkan fungsionalitas akun pengantin seketika</p>
        </div>

        <button
          onClick={fetchProfiles}
          disabled={isLoading}
          className="px-4 py-2 bg-amber-950/70 hover:bg-amber-950 text-amber-100 text-xs font-bold rounded-lg border border-amber-7000 flex items-center gap-2 self-start md:self-auto transition-colors cursor-pointer"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          Segarkan Mutasi
        </button>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2.5">
          <ShieldCheck size={18} className="text-emerald-700 shrink-0" />
          <div>
            <span className="font-bold">Aksi Sukses Admin:</span> {successMessage}
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle size={18} className="text-rose-700 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Grid segments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Module A: New paid registrations awaiting verification */}
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-stone-100">
            <div className="flex items-center gap-2">
              <Clock className="text-amber-600" size={18} />
              <h3 className="font-bold text-stone-900 text-sm font-serif">Menunggu Aktivasi (Sudah Bayar QRIS)</h3>
            </div>
            <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
              {pendingCouples.length} Antrian
            </span>
          </div>

          {pendingCouples.length === 0 ? (
            <div className="text-center text-stone-400 py-12 text-xs">
              Tidak ada antrian pengantin yang melampirkan bukti lunas QRIS Rp 25.000 baru saat ini.
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {pendingCouples.map(couple => (
                <div key={couple.uid} className="py-4 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-stone-900 text-sm">{couple.fullName} & {couple.partnerName}</h4>
                      <p className="text-[11px] text-stone-500">Email: {couple.email}</p>
                      <p className="text-[10px] text-stone-400">Akad: {new Date(couple.weddingDate).toLocaleDateString("id-ID")}</p>
                    </div>
                    <span className="text-[10px] font-mono bg-blue-50 border border-blue-200 text-blue-700 font-bold px-2 py-0.5 rounded">
                      Rp 25.000 Lunas
                    </span>
                  </div>

                  {couple.paymentProofUrl && (
                    <div className="border border-stone-200 rounded-lg p-2 bg-stone-50 flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-stone-200 border border-stone-300 overflow-hidden shrink-0 flex items-center justify-center">
                        {couple.paymentProofUrl.includes('.pdf') ? (
                          <div className="w-full h-full flex items-center justify-center bg-rose-50 text-rose-800 text-[10px] font-bold">PDF</div>
                        ) : (
                          <img 
                            src={couple.paymentProofUrl} 
                            alt="Bukti Bayar" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-stone-700">Lampiran Bukti Bayar QRIS</p>
                        <a 
                          href={couple.paymentProofUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-[10px] text-emerald-700 hover:underline font-bold flex items-center gap-0.5"
                        >
                          Buka di Tab Baru ↗
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="bg-amber-50/50 p-2.5 rounded border border-amber-100 text-[10px] text-amber-900 font-sans leading-relaxed">
                    📝 <span className="font-bold">Panduan Verifikasi Admin:</span><br />
                    Harap tinjau lampiran bukti transaksi QRIS pasangan {couple.fullName} di atas dengan teliti sebelum menekan tombol "Aktifkan Akun (Approve)" di bawah ini.
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(couple.uid, couple.fullName)}
                      className="flex-1 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded text-xs transition-colors cursor-pointer"
                    >
                      ✓ Aktifkan Akun (Approve)
                    </button>
                    <button
                      onClick={() => handleDeny(couple.uid, couple.fullName)}
                      className="px-3.5 py-1.5 border border-stone-200 text-stone-500 hover:text-rose-600 rounded text-xs transition-colors cursor-pointer"
                      title="Tolak Verifikasi"
                    >
                      Tolak
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Module B: Already Approved Couples */}
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-stone-100">
            <div className="flex items-center gap-2">
              <UserCheck className="text-emerald-700" size={18} />
              <h3 className="font-bold text-stone-900 text-sm font-serif">Alumni & Akun Aktif Premium</h3>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
              {approvedCouples.length} Pasangan
            </span>
          </div>

          {approvedCouples.length === 0 ? (
            <div className="text-center text-stone-400 py-12 text-xs">
              Belum ada pasangan premium terdaftar yang disetujui lunas.
            </div>
          ) : (
            <div className="divide-y divide-stone-100 max-h-96 overflow-y-auto">
              {approvedCouples.map(couple => (
                <div key={couple.uid} className="py-3 flex justify-between items-center gap-2 text-xs">
                  <div>
                    <h4 className="font-bold text-stone-900">{couple.fullName} & {couple.partnerName}</h4>
                    <p className="text-[10px] text-stone-400">{couple.email}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Aktif Premium
                    </span>
                    <button
                      onClick={() => handleDeny(couple.uid, couple.fullName)}
                      className="p-1 border border-stone-100 hover:border-rose-200 text-stone-400 hover:text-rose-500 rounded transition-colors"
                      title="Tangguhkan Akun"
                    >
                      <UserX size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Module C: Registered in platform but unpaid */}
      <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-sm space-y-3">
        <h3 className="font-serif font-bold text-stone-950 text-sm border-b pb-2.5 border-stone-100">
          User Terdaftar - Belum Menuntaskan Pembayaran QRIS (Membuka QRIS Screen)
        </h3>
        
        {unpaidCouples.length === 0 ? (
          <p className="text-xs text-stone-400 py-3 text-center">Seluruh pendaftar di platform telah menuntaskan kewajiban iuran QRIS.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {unpaidCouples.map(couple => (
              <div key={couple.uid} className="p-3 border rounded-xl bg-stone-50/50 flex justify-between items-center text-xs gap-3">
                <div>
                  <h4 className="font-bold text-stone-900">{couple.fullName || "Pengantin Baru"} & {couple.partnerName || "Pasangan"}</h4>
                  <p className="text-[10px] text-stone-400">{couple.email}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[9px] bg-stone-100 border text-stone-500 px-1.5 py-0.5 rounded font-mono">Pending QRIS</span>
                  <button
                    onClick={() => handleApprove(couple.uid, couple.fullName || "Pengantin Baru")}
                    className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-[9px] transition-all cursor-pointer"
                    title="Beri persetujuan langsung (bypass pembayaran)"
                  >
                    Bypass Lunas
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
