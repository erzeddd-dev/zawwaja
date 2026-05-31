import React, { useState } from "react";
import { 
  registerUserProfile, 
  updatePaymentStatusToPaid, 
  loginAsAdminMock, 
  simulateSocialLogin, 
  isMockMode, 
  loginWithEmail, 
  signUpWithEmail, 
  uploadPaymentProof,
  signUpOrSignInWithGoogle,
  initializeEmptyProfile
} from "../lib/firebase";
import { UserProfile } from "../types";
import { 
  Heart, 
  Coins, 
  Wallet, 
  Calendar, 
  CheckCircle2, 
  ArrowRight, 
  AlertCircle,
  QrCode,
  Compass,
  User,
  Instagram,
  Lock,
  MessageSquare,
  Upload,
  FileText,
  Loader2,
  Check
} from "lucide-react";
import { QRISCard } from "./QRISCard";

interface OnboardingProps {
  onSuccess: (profile: UserProfile) => void;
  onLogout: () => void;
  profile: UserProfile | null;
  userId: string | null;
  setUser: (user: any) => void;
}

export default function Onboarding({ onSuccess, onLogout, profile, userId, setUser }: OnboardingProps) {
  // Local states
  const [step, setStep] = useState<"auth" | "payment" | "pending">(
    profile ? (profile.paymentStatus === "pending" ? "payment" : "pending") : "auth"
  );

  React.useEffect(() => {
    if (profile) {
      if (profile.paymentStatus === "pending") {
        setStep("payment");
      } else if (profile.approvalStatus === "pending") {
        setStep("pending");
      } else if (profile.approvalStatus === "approved") {
        onSuccess(profile);
      }
    } else {
      if (!userId) {
        setStep("auth");
      }
    }
  }, [profile, userId]);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUpMode, setIsSignUpMode] = useState(false); // Toggle between login and signup
  const [errorMess, setErrorMess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // File upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Quick preset account helper
  const handleQuickLogin = async (type: "general" | "admin") => {
    setIsLoading(true);
    setErrorMess("");
    try {
      if (type === "admin") {
        await loginAsAdminMock();
      } else {
        const result = await simulateSocialLogin("pengantin.barakah@gmail.com", "Rian & Amira");
        setUser(result);
        await initializeEmptyProfile(result.uid, "pengantin.barakah@gmail.com");
        setStep("payment");
      }
    } catch (err: any) {
      setErrorMess("Gagal melakukan aksi simulasi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMess("Harap isi email dan kata sandi Anda.");
      return;
    }
    if (password.length < 6) {
      setErrorMess("Kata sandi harus minimal berbentuk 6 karakter.");
      return;
    }
    setErrorMess("");
    setIsLoading(true);

    try {
      if (isSignUpMode) {
        const result = await signUpWithEmail(email, password);
        setUser(result);
        await initializeEmptyProfile(result.uid, email);
        setStep("payment");
      } else {
        const result = await loginWithEmail(email, password);
        setUser(result);
        
        let activeProfile: UserProfile | null = null;
        if (isMockMode) {
          const allProfilesStr = localStorage.getItem("zawwaja_mock_users") || "[]";
          const allProfiles: UserProfile[] = JSON.parse(allProfilesStr);
          activeProfile = allProfiles.find(p => p.email.toLowerCase() === email.toLowerCase()) || null;
        }
        
        if (!activeProfile) {
          activeProfile = await initializeEmptyProfile(result.uid, email);
        }

        if (activeProfile) {
          if (activeProfile.paymentStatus === "pending") {
            setStep("payment");
          } else if (activeProfile.approvalStatus === "pending") {
            setStep("pending");
          } else {
            onSuccess(activeProfile);
          }
        }
      }
    } catch (err: any) {
      setErrorMess(err.message || "Pendaftaran/masuk gagal. Silakan coba kembali.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMess("");
    try {
      const result = await signUpOrSignInWithGoogle();
      setUser(result);
      const activeProfile = await initializeEmptyProfile(result.uid, result.email, result.displayName);
      if (activeProfile) {
        if (activeProfile.paymentStatus === "pending") {
          setStep("payment");
        } else if (activeProfile.approvalStatus === "pending") {
          setStep("pending");
        } else {
          onSuccess(activeProfile);
        }
      }
    } catch (err: any) {
      setErrorMess(err.message || "Gagal masuk menggunakan Google.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadAndProceed = async () => {
    if (!selectedFile) {
      setErrorMess("Silakan pilih berkas bukti pembayaran terlebih dahulu.");
      return;
    }
    const pUid = userId || (profile ? profile.uid : null);
    if (!pUid) {
      setErrorMess("ID pengguna tidak terdeteksi. Harap muat ulang halaman.");
      return;
    }

    setIsUploadingFile(true);
    setErrorMess("");
    try {
      await uploadPaymentProof(pUid, selectedFile);
      setStep("pending");
    } catch (err: any) {
      console.error(err);
      setErrorMess(err.message || "Gagal mengunggah berkas bukti transaksi.");
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleAlreadyPaid = async () => {
    setIsLoading(true);
    try {
      const activeUid = userId || "unknown";
      await updatePaymentStatusToPaid(activeUid);
      setStep("pending");
    } catch (err) {
      setErrorMess("Gagal menyimpan data pembayaran.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#333333] flex flex-col justify-between" id="onboarding-root">
      {/* Top Header */}
      <header className="p-4 bg-white/50 backdrop-blur-md border-b border-stone-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img src="/favicon.svg" alt="Zawwaja" className="w-8 h-8 rounded-lg shadow-sm shrink-0 object-cover border border-[#B76E79]/20" />
            <span className="text-xl font-bold font-serif tracking-tight text-[#B76E79]">Zawwaja.id</span>
          </div>
        </div>
      </header>

      {/* Main Form Blocks */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-[#B76E79]/4 border border-stone-200/50 overflow-hidden">
          
          {/* STEP 1: AUTHENTICATION FLOW */}
          {step === "auth" && (
            <div className="p-8">
              <div className="text-center mb-6">
                <Heart className="mx-auto text-[#B76E79] mb-2 fill-[#B76E79]/10" size={36} />
                <h2 className="text-2xl font-serif font-bold text-[#2D2D2D]">
                  {isSignUpMode ? "Mulai Pernikahan Barakah" : "Masuk ke Zawwaja.id"}
                </h2>
                <p className="text-stone-500 text-xs mt-1 font-sans">
                  {isSignUpMode 
                    ? "Susun rencana terbaik berlandaskan nilai syari'at" 
                    : "Lanjutkan perencanaan sakinah planner Anda"
                  }
                </p>
              </div>

              {/* Tab Selector */}
              <div className="flex border border-stone-200/80 bg-stone-50 rounded-lg p-1 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUpMode(false);
                    setErrorMess("");
                  }}
                  className={`flex-1 text-center py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    !isSignUpMode
                      ? "bg-white text-[#B76E79] shadow-sm"
                      : "text-stone-500 hover:text-stone-800"
                  }`}
                >
                  Masuk (Sign In)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUpMode(true);
                    setErrorMess("");
                  }}
                  className={`flex-1 text-center py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    isSignUpMode
                      ? "bg-white text-[#B76E79] shadow-sm"
                      : "text-stone-500 hover:text-stone-800"
                  }`}
                >
                  Daftar (Sign Up)
                </button>
              </div>

              {errorMess && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2 font-sans">
                  <AlertCircle size={16} />
                  <span>{errorMess}</span>
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1 font-sans">
                    Surel / Alamat Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="nama.anda@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-1 focus:ring-[#B76E79] font-sans text-stone-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1 w-full flex justify-between font-sans">
                    <span>{isSignUpMode ? "Kata Sandi Baru" : "Kata Sandi"}</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-1 focus:ring-[#B76E79] text-stone-850 font-sans"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-gradient-to-r from-[#B76E79] to-[#D4A5A5] text-white font-bold rounded-xl shadow-md hover:opacity-95 transition-all duration-200 flex items-center justify-center cursor-pointer font-sans"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Memproses...
                      </span>
                    ) : (
                      <>
                        {isSignUpMode ? "Daftar & Lanjut Pembayaran" : "Masuk ke Dashboard"}
                        <ArrowRight size={18} className="ml-2" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full py-3 border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-bold rounded-lg text-xs flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4 mr-2.5 shrink-0" viewBox="0 0 24 24" fill="none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                    </svg>
                    {isSignUpMode ? "Daftar dengan Google" : "Masuk dengan Google"}
                  </button>
                </div>
              </form>


            </div>
          )}

          {/* STEP 3: QRIS PAYMENT MODULE */}
          {step === "payment" && (
            <div className="p-8">
              <div className="text-center mb-6">
                <Coins className="mx-auto text-emerald-600 mb-2" size={36} />
                <h2 className="text-xl font-serif font-bold text-stone-950">Aktivasi Zawwaja.id</h2>
                <p className="text-stone-500 text-sm mt-1">Satu kali investasi pendaftaran barakah selamanya</p>
              </div>

              {/* Price Tag box */}
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                <p className="text-xs uppercase font-semibold text-emerald-800 tracking-wider">Pendaftaran Pernikahan Premium</p>
                <h3 className="text-3xl font-bold font-mono text-emerald-950 mt-1">Rp 25.000</h3>
                <p className="text-[11px] text-emerald-700 mt-1">Tanpa biaya bulanan tersembunyi</p>
              </div>

              {errorMess && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{errorMess}</span>
                </div>
              )}

              {/* Custom QRIS Card with Download support */}
              <div className="mb-6">
                <QRISCard />
              </div>

              {/* Connected File Upload Element */}
              <div className="space-y-2 mb-6">
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Unggah Bukti Bayar (Melalui Firebase Storage)
                </label>
                
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                    dragActive 
                      ? "border-emerald-600 bg-emerald-50/50" 
                      : selectedFile 
                        ? "border-emerald-500 bg-emerald-50/20" 
                        : "border-stone-200 hover:border-emerald-500 hover:bg-stone-50"
                  }`}
                >
                  <input
                    type="file"
                    id="payment-proof-file"
                    className="hidden"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                  />
                  
                  {selectedFile ? (
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 mb-2">
                        <FileText size={20} />
                      </div>
                      <p className="text-xs font-bold text-stone-900 max-w-full truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-[10px] text-stone-400 mt-0.5">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Klik daerah ini untuk mengganti berkas
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="mt-3 text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                      >
                        Hapus berkas
                      </button>
                    </div>
                  ) : (
                    <label htmlFor="payment-proof-file" className="cursor-pointer flex flex-col items-center">
                      <Upload className="text-stone-400 mb-2 hover:text-emerald-600 transition-colors" size={24} />
                      <p className="text-xs font-semibold text-stone-700">
                        Seret berkas ke sini, atau <span className="text-emerald-700 underline font-bold">pilih berkas Anda</span>
                      </p>
                      <p className="text-[10px] text-stone-400 mt-1">
                        Format berkas: JPG, PNG, atau PDF (Maks. 5MB)
                      </p>
                    </label>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleUploadAndProceed}
                  disabled={isUploadingFile || !selectedFile}
                  className={`w-full py-3 text-white font-bold rounded-lg shadow flex items-center justify-center transition-all cursor-pointer ${
                    selectedFile 
                      ? "bg-emerald-700 hover:bg-emerald-800" 
                      : "bg-stone-300 cursor-not-allowed opacity-70"
                  }`}
                >
                  {isUploadingFile ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="animate-spin" size={18} />
                      Mengunggah ke Firebase Storage...
                    </span>
                  ) : (
                    <>
                      <Wallet size={18} className="mr-2" />
                      Kirim Bukti Pembayaran
                    </>
                  )}
                </button>


                <button
                  onClick={onLogout}
                  className="w-full py-2 border border-stone-200 text-stone-500 hover:text-stone-800 transition-colors text-xs font-semibold rounded-lg flex items-center justify-center cursor-pointer"
                >
                  Batal / Keluar
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: WAITING APPROVAL SCREEN */}
          {step === "pending" && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-300 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <AlertCircle className="text-amber-600" size={32} />
              </div>

              <h2 className="text-xl font-serif font-bold text-stone-950">Menunggu Verifikasi Pembayaran</h2>
              <p className="text-stone-500 text-sm mt-1">Pembayaran Rp 25.000 QRIS Anda sedang diproses</p>

              {/* Informative Step instructions */}
              <div className="my-6 p-4 rounded-xl bg-stone-50 border border-stone-200 text-left space-y-3 text-xs text-stone-600">
                <div className="flex gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">1</span>
                  <p>Sistem merekam data registrasi pasangan tanggal akad Anda.</p>
                </div>
                <div className="flex gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">2</span>
                  <p>Notifikasi otomatis telah terkirim via WhatsApp ke nomor antrian Admin.</p>
                </div>
                <div className="flex gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">3</span>
                  <p>Setelah Admin memverifikasi dana di mutasi QRIS, akun Anda akan aktif dan notifikasi WhatsApp konfirmasi dikirim otomatis ke Anda.</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-3">
                <button
                  onClick={onLogout}
                  className="w-full py-2 border border-stone-200 text-stone-500 hover:text-stone-700 transition-colors text-xs font-semibold rounded-lg"
                >
                  Kembali ke Halaman Utama
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Aesthetic Footer */}
      <footer className="p-4 border-t border-stone-200 bg-white text-center text-xs text-stone-400">
        <p className="font-serif">Zawwaja.id • Mewujudkan Pernikahan Sakinah Sharia-Compliant</p>
        <p className="text-[10px] mt-1 text-stone-400">Copyright © 2026. All rights reserved by Phronesis Works.</p>
      </footer>
    </div>
  );
}
