import React, { useState } from "react";
import { 
  registerUserProfile, 
  autoActivateUser,
  loginAsAdminMock, 
  simulateSocialLogin, 
  isMockMode, 
  loginWithEmail, 
  signUpWithEmail, 
  signUpOrSignInWithGoogle,
  initializeEmptyProfile,
  resetUserPassword
} from "../lib/firebase";
import { UserProfile } from "../types";

// GANTI NOMOR INI DENGAN NOMOR WHATSAPP ANDA (Gunakan kode negara, e.g. 628...)
const ADMIN_WHATSAPP_NUMBER = "6285713071197";
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
  const [step, setStep] = useState<"auth" | "payment" | "pending">(() => {
    if (profile) {
      const isPendingLocal = localStorage.getItem(`zawwaja_pending_activation_${profile.uid}`) === "true";
      if (profile.paymentStatus === "pending" && !isPendingLocal) {
        return "payment";
      }
      return "pending";
    }
    return "auth";
  });

  React.useEffect(() => {
    if (profile) {
      const isPendingLocal = localStorage.getItem(`zawwaja_pending_activation_${profile.uid}`) === "true";
      if (profile.approvalStatus === "approved") {
        onSuccess(profile);
      } else if (profile.paymentStatus === "pending" && !isPendingLocal) {
        setStep("payment");
      } else {
        setStep("pending");
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
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState("");

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

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMess("Harap isi alamat email Anda.");
      return;
    }
    setErrorMess("");
    setResetSuccessMessage("");
    setIsLoading(true);

    try {
      await resetUserPassword(email);
      setResetSuccessMessage(
        "Tautan untuk mengatur ulang kata sandi telah dikirim ke email Anda. Silakan periksa kotak masuk dan folder spam Anda beberapa saat lagi."
      );
    } catch (err: any) {
      setErrorMess(err.message || "Gagal mengirim email reset kata sandi. Silakan coba lagi.");
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

  const handleConfirmPaymentAndWhatsApp = async () => {
    setIsLoading(true);
    setErrorMess("");
    
    const pUid = userId || (profile ? profile.uid : null);
    const pEmail = email || (profile ? profile.email : "");
    const pName = (profile && profile.fullName) || email.split("@")[0] || "Pengantin Baru";
    
    if (!pUid) {
      setErrorMess("ID pengguna tidak terdeteksi. Harap muat ulang halaman.");
      setIsLoading(false);
      return;
    }
    
    try {
      // 1. Open WhatsApp window with pre-filled confirmation message
      const text = encodeURIComponent(
        `Assalamualaikum Admin Zawwaja,\n\n` +
        `Saya telah melakukan pembayaran aktivasi premium Rp 25.000 via QRIS.\n\n` +
        `Berikut rincian akun saya:\n` +
        `- Nama: ${pName}\n` +
        `- Email: ${pEmail}\n` +
        `- UID: ${pUid}\n\n` +
        `Mohon divalidasi pembayarannya. Terima kasih! 😊`
      );
      const waUrl = `https://api.whatsapp.com/send?phone=${ADMIN_WHATSAPP_NUMBER}&text=${text}`;
      
      // Open in a new tab
      window.open(waUrl, "_blank");
      
      // 2. Set local storage flag to preserve pending view
      localStorage.setItem(`zawwaja_pending_activation_${pUid}`, "true");
      
      // 3. Move to the pending waiting screen
      setStep("pending");
    } catch (err: any) {
      console.error(err);
      setErrorMess(err.message || "Gagal memproses konfirmasi pembayaran.");
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "auth") {
    return (
      <div className="min-h-screen antigravity-bg text-text-primary flex flex-col lg:flex-row font-sans relative overflow-hidden" id="onboarding-auth">
        {/* Decorative background glows across the whole canvas */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-brand-500/10 blur-3xl -z-10 pointer-events-none"></div>
        <div className="absolute bottom-10 left-1/4 w-80 h-80 rounded-full bg-brand-600/10 blur-3xl -z-10 pointer-events-none animate-pulse"></div>

        {/* Left Column: Form & Branding */}
        <div className="w-full lg:w-1/2 flex flex-col justify-between min-h-screen p-6 lg:p-12 bg-transparent relative z-10">
          <div className="hidden lg:block"></div> {/* Spacer to push form to center vertically */}

          {/* Form Content Container */}
          <div className="max-w-md w-full mx-auto my-auto py-6 glass-panel px-6 md:px-8 mt-12 md:mt-auto">
            
            {/* Majestic Centered Brand Emblem (No Text Clutter) */}
            <div className="text-center mb-8 flex justify-center">
              <img 
                src="/logo.png" 
                alt="Zawwaja Premium Emblem" 
                className="w-24 h-24 object-contain filter drop-shadow-[0_4px_12px_rgba(175,118,97,0.15)] hover:scale-105 transition-all duration-300 cursor-pointer"
              />
            </div>

            {isForgotPasswordMode ? (
              <div>
                <div className="text-center mb-6 flex flex-col items-center">
                  <Lock className="text-brand-600 mb-2.5 fill-brand-600/10 animate-pulse" size={36} />
                  <h2 className="text-2xl font-serif font-bold text-text-primary leading-tight">
                    Lupa Kata Sandi?
                  </h2>
                  <p className="text-text-secondary text-xs mt-1.5 font-sans">
                    Masukkan email Anda untuk menerima tautan atur ulang kata sandi.
                  </p>
                </div>

                {errorMess && (
                  <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2 font-sans">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{errorMess}</span>
                  </div>
                )}

                {resetSuccessMessage ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs flex flex-col gap-2 font-sans shadow-xs">
                      <div className="flex items-center gap-2 font-semibold">
                        <CheckCircle2 size={18} className="text-emerald-600" />
                        <span>Email Terkirim!</span>
                      </div>
                      <p className="text-text-secondary leading-relaxed font-sans">
                        {resetSuccessMessage}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPasswordMode(false);
                        setResetSuccessMessage("");
                        setErrorMess("");
                      }}
                      className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl shadow-md hover:bg-brand-500 transition-all duration-200 flex items-center justify-center cursor-pointer font-sans"
                    >
                      Kembali ke Masuk
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPasswordSubmit} className="space-y-4" autoComplete="off">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1 font-sans">
                        Surel / Alamat Email
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="nama.anda@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="off"
                        className="w-full px-4 py-2.5 rounded-xl border border-surface-border focus:outline-none focus:ring-1 focus:ring-brand-600 font-sans text-text-primary"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 bg-gradient-to-r from-brand-600 to-brand-500 text-white font-bold rounded-xl shadow-md hover:opacity-95 transition-all duration-200 flex items-center justify-center cursor-pointer font-sans"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Mengirim Tautan...
                        </span>
                      ) : (
                        <>
                          Kirim Tautan Atur Ulang
                          <ArrowRight size={18} className="ml-2" />
                        </>
                      )}
                    </button>

                    <div className="text-center mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPasswordMode(false);
                          setErrorMess("");
                        }}
                        className="text-brand-600 hover:underline text-xs font-semibold font-sans cursor-pointer bg-transparent border-0 p-0"
                      >
                        Kembali ke Masuk
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-serif font-bold text-text-primary tracking-tight leading-tight">
                    {isSignUpMode ? "Mulai Pernikahan Barakah" : "Masuk ke Zawwaja"}
                  </h2>
                  <p className="text-text-secondary text-xs mt-1 font-sans">
                    {isSignUpMode 
                      ? "Susun rencana terbaik berlandaskan nilai syari'at" 
                      : "Lanjutkan perencanaan sakinah planner Anda"
                    }
                  </p>
                </div>

                {/* Tab Selector */}
                <div className="flex bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-1 mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUpMode(false);
                      setErrorMess("");
                    }}
                    className={`flex-1 text-center py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
                      !isSignUpMode
                        ? "bg-white/30 text-brand-700 shadow-sm"
                        : "text-text-secondary hover:text-text-primary"
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
                        ? "bg-white/30 text-brand-700 shadow-sm"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    Daftar (Sign Up)
                  </button>
                </div>

                {errorMess && (
                  <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2 font-sans">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{errorMess}</span>
                  </div>
                )}

                <form onSubmit={handleAuthSubmit} className="space-y-4" autoComplete="off">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1 font-sans">
                      Surel / Alamat Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="nama.anda@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="off"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/40 border border-white/50 focus:outline-none focus:ring-1 focus:ring-brand-600 font-sans text-text-primary placeholder-stone-500 backdrop-blur-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1 w-full flex justify-between font-sans">
                      <span>{isSignUpMode ? "Kata Sandi Baru" : "Kata Sandi"}</span>
                      {!isSignUpMode && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsForgotPasswordMode(true);
                            setErrorMess("");
                            setResetSuccessMessage("");
                          }}
                          className="text-brand-600 hover:underline normal-case font-semibold cursor-pointer bg-transparent border-0 p-0"
                        >
                          Lupa Kata Sandi?
                        </button>
                      )}
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/40 border border-white/50 focus:outline-none focus:ring-1 focus:ring-brand-600 text-text-primary font-sans placeholder-stone-500 backdrop-blur-sm"
                    />
                  </div>

                  <div className="pt-2 space-y-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 bg-gradient-to-r from-brand-600 to-brand-500 text-white font-bold rounded-xl shadow-md hover:opacity-95 transition-all duration-200 flex items-center justify-center cursor-pointer font-sans"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
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
                      className="w-full py-3 border border-white/30 bg-white/20 hover:bg-white/30 text-text-secondary font-bold rounded-lg text-xs flex items-center justify-center shadow-sm transition-colors cursor-pointer backdrop-blur-sm"
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

                {/* Footer Switcher Mode */}
                <div className="text-center mt-6 pt-3 border-t border-surface-border">
                  <p className="text-xs text-text-secondary font-sans">
                    {isSignUpMode ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUpMode(!isSignUpMode);
                        setErrorMess("");
                      }}
                      className="text-brand-600 hover:text-[#915c4a] hover:underline font-bold bg-transparent border-0 p-0 cursor-pointer"
                    >
                      {isSignUpMode ? "Masuk ke Akun" : "Daftar Akun Baru"}
                    </button>
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="hidden lg:block text-center text-[10px] text-text-tertiary font-sans">
            <p>Copyright © 2026 Zawwaja.id • All rights reserved by Phronesis Works.</p>
          </div>
        </div>

        {/* Right Column: Promotional Value Cards & Soft Vertical Gradient */}
        <div className="w-full lg:w-1/2 min-h-[400px] lg:min-h-screen bg-transparent flex flex-col justify-center px-8 py-12 lg:px-16 relative z-10 lg:pl-8">
          
          <div className="absolute top-1/3 right-10 w-72 h-72 rounded-full bg-brand-500/15 blur-3xl -z-10 pointer-events-none animate-pulse"></div>

          <div className="max-w-md mx-auto mb-8 w-full">
            <h3 className="text-2xl font-serif font-bold text-text-primary leading-tight">
              Planner Pernikahan Syar'i Terpadu
            </h3>
            <p className="text-text-secondary text-xs mt-2 font-sans leading-relaxed">
              Zawwaja membantu pasangan Muslim merencanakan tahapan pernikahan akad & walimah yang barakah, rapi, dan sejalan dengan syariat Islam.
            </p>
          </div>

          <div className="max-w-md mx-auto space-y-4 w-full">
            {/* Card 1 */}
            <div className="group bg-surface-raised/95 p-4 rounded-xl border border-brand-200/30 shadow-md shadow-stone-100/55 hover:shadow-lg hover:border-brand-500/40 transition-all duration-300 flex gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-surface-raised shadow-xs border border-brand-200/35 flex items-center justify-center text-brand-600 shrink-0">
                <CheckCircle2 size={18} className="stroke-[2.5]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-text-primary font-sans">
                  Rencana Akad Syar'i
                </h4>
                <p className="text-[10px] text-text-secondary leading-relaxed font-sans mt-0.5">
                  Kelola rincian administrasi KUA & logistik walimah sesuai syariat Islam.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="group bg-surface-raised/95 p-4 rounded-xl border border-brand-200/30 shadow-md shadow-stone-100/55 hover:shadow-lg hover:border-brand-500/40 transition-all duration-300 flex gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-surface-raised shadow-xs border border-brand-200/35 flex items-center justify-center text-brand-600 shrink-0">
                <Coins size={18} className="stroke-[2.5]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-text-primary font-sans">
                  Anggaran Sakinah
                </h4>
                <p className="text-[10px] text-text-secondary leading-relaxed font-sans mt-0.5">
                  Pantau alokasi budget dan pengeluaran secara transparan tanpa israf (boros).
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="group bg-surface-raised/95 p-4 rounded-xl border border-brand-200/30 shadow-md shadow-stone-100/55 hover:shadow-lg hover:border-brand-500/40 transition-all duration-300 flex gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-surface-raised shadow-xs border border-brand-200/35 flex items-center justify-center text-brand-600 shrink-0">
                <Compass size={18} className="stroke-[2.5]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-text-primary font-sans">
                  Direktori Vendor Syar'i
                </h4>
                <p className="text-[10px] text-text-secondary leading-relaxed font-sans mt-0.5">
                  Temukan rekanan katering, MUA, & dekorasi berkonsep syar'i terpisah dengan mudah.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Payment & Pending state uses centered card layout
  return (
    <div className="min-h-screen antigravity-bg text-text-primary flex flex-col justify-between relative overflow-hidden" id="onboarding-root">
      {/* Background decoration */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-brand-500/10 blur-3xl -z-10 pointer-events-none"></div>
      
      <main className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-md glass-panel overflow-hidden">
          
          {/* STEP 3: QRIS PAYMENT MODULE */}
          {step === "payment" && (
            <div className="p-8">
              <div className="text-center mb-6">
                <Coins className="mx-auto text-brand-600 mb-2" size={36} />
                <h2 className="text-xl font-serif font-bold text-text-primary">Aktivasi Zawwaja</h2>
                <p className="text-text-secondary text-sm mt-1">Satu kali investasi pendaftaran barakah selamanya</p>
              </div>

              {/* Price Tag box */}
              <div className="mb-6 p-4 rounded-xl bg-white/40 border border-white/50 text-center backdrop-blur-sm">
                <p className="text-xs uppercase font-semibold text-brand-800 tracking-wider">Pendaftaran Pernikahan Premium</p>
                <h3 className="text-3xl font-bold font-mono text-brand-950 mt-1">Rp 25.000</h3>
                <p className="text-[11px] text-brand-700 mt-1">Tanpa biaya bulanan tersembunyi</p>
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

              {/* Automated Grace Period info */}
              <div className="bg-white/40 border border-white/50 rounded-xl p-4 mb-6 space-y-2 text-stone-700 backdrop-blur-sm">
                <div className="flex gap-2.5">
                  <span className="text-base">💡</span>
                  <div className="text-xs leading-relaxed">
                    <p className="font-bold mb-0.5">Sistem Aktivasi Instan (Terpercaya):</p>
                    <p>Setelah scan QRIS dan transfer, klik tombol di bawah. Sistem akan **membuka dashboard Anda seketika** (tanpa menunggu), dan mengarahkan Anda untuk mengirim pesan konfirmasi ke WhatsApp Admin.</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleConfirmPaymentAndWhatsApp}
                  disabled={isLoading}
                  className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-lg shadow flex items-center justify-center transition-all cursor-pointer font-sans"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Mengaktifkan Akun...
                    </span>
                  ) : (
                    <>
                      <Wallet size={18} className="mr-2" />
                      Konfirmasi Transfer & Masuk
                    </>
                  )}
                </button>

                <button
                  onClick={onLogout}
                  className="w-full py-2 border border-surface-border text-text-secondary hover:text-text-primary transition-colors text-xs font-semibold rounded-lg flex items-center justify-center cursor-pointer"
                >
                  Batal / Keluar
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: WAITING APPROVAL SCREEN */}
          {step === "pending" && (
            <div className="p-8 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-300 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <CheckCircle2 className="text-emerald-600" size={32} />
              </div>

              <h2 className="text-xl font-serif font-bold text-text-primary">Pendaftaran Berhasil</h2>
              <p className="text-brand-600 text-sm font-semibold mt-2">Terima kasih, Anda sudah terdaftar.</p>
              <p className="text-text-secondary text-xs mt-1">Mohon ditunggu untuk aktivasi akun Anda oleh Admin.</p>

              {/* Informative Step instructions */}
              <div className="my-6 p-4 rounded-xl bg-surface-sunken border border-surface-border text-left space-y-3 text-xs text-text-secondary">
                <div className="flex gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">1</span>
                  <p>Data registrasi dan nomor akad Anda sudah tersimpan dengan aman.</p>
                </div>
                <div className="flex gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">2</span>
                  <p>Notifikasi pembayaran QRIS otomatis terkirim langsung ke WhatsApp Admin.</p>
                </div>
                <div className="flex gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">3</span>
                  <p>Setelah Admin memeriksa mutasi, akun Anda akan diaktifkan secara instan untuk membuka akses penuh planner pernikahan.</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-3">
                <button
                  onClick={onLogout}
                  className="w-full py-2 border border-surface-border text-text-secondary hover:text-text-secondary transition-colors text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Kembali ke Halaman Utama / Logout
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Aesthetic Footer */}
      <footer className="p-4 border-t border-white/20 bg-white/10 backdrop-blur-md text-center text-xs text-text-tertiary relative z-10">
        <p className="font-serif">Zawwaja • Mewujudkan Pernikahan Sakinah Sharia-Compliant</p>
        <p className="text-[10px] mt-1 text-text-tertiary">Copyright © 2026. All rights reserved by Phronesis Works.</p>
      </footer>
    </div>
  );
}
