import React, { useEffect, useState, useRef } from "react";
import { UserProfile, WeddingChecklistItem, MaharItem, GuestItem } from "../types";
import { 
  Calendar, 
  DollarSign, 
  Coins, 
  CheckCircle, 
  Users, 
  Clock, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  AlertCircle
} from "lucide-react";

interface BudgetSummaryProps {
  profile: UserProfile;
  checklistItems: WeddingChecklistItem[];
  maharItems: MaharItem[];
  onNavigate: (tab: string) => void;
  onSaveProfile?: (fullName: string, partnerName: string, weddingDate: string, totalBudget: number) => Promise<void>;
}

const islamicBanners = [
  { text: "بَارَكَ اللهُ لَكَ وَبَارَكَ عَلَيْكَ وَجَمَعَ بَيْنَكُمَا فِي خَيْرٍ", translation: "Semoga Allah memberkahimu di waktu bahagia dan memberkahimu di waktu susah, serta mempersatukan kalian berdua dalam kebaikan.", source: "HR. Abu Daud" },
  { text: "أَعْظَمُ النِّكَاحِ بَرَكَةً أَيْسَرُهُ مُؤْنَةً", translation: "Pernikahan yang paling besar barakahnya adalah yang paling mudah biayanya.", source: "HR. Ahmad" },
  { text: "إِذَا تَزَوَّجَ الْعَبْدُ فَقَدِ اسْتَكْمَلَ نِصْفَ الدِّينِ", translation: "Bila seorang hamba menikah, maka sungguh ia telah menyempurnakan setengah agamanya. Maka bertaqwalah kepada Allah pada setengah sisanya.", source: "HR. Al-Baihaqi" },
  { text: "رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا", translation: "Ya Rabb kami, anugerahkanlah kepada kami istri-istri kami dan keturunan kami sebagai penyenang hati (kami), dan jadikanlah kami imam bagi orang-orang yang bertaqwa.", source: "QS. Al-Furqan: 74" }
];

export default function BudgetSummary({ profile, checklistItems, maharItems, onNavigate, onSaveProfile }: BudgetSummaryProps) {
  // Stats state
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [weeksRemaining, setWeeksRemaining] = useState(0);
  const [hoursRemaining, setHoursRemaining] = useState(0);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Touch and Mouse Drag controls for swipe gestures
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Welcome Modal states
  const [onboardFullName, setOnboardFullName] = useState("");
  const [onboardPartnerName, setOnboardPartnerName] = useState("");
  const [onboardWeddingDate, setOnboardWeddingDate] = useState("2026-12-12");
  const [onboardTotalBudget, setOnboardTotalBudget] = useState(35000000);
  const [isSavingOnboard, setIsSavingOnboard] = useState(false);
  const [onboardError, setOnboardError] = useState("");

  const showWelcomeModal = !profile.fullName || !profile.partnerName || !profile.weddingDate;

  const handleNextBanner = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setBannerIndex((prev) => (prev + 1) % islamicBanners.length);
    setTimeout(() => {
      setIsTransitioning(false);
    }, 500); // Debounce duration matching transition duration
  };

  const handlePrevBanner = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setBannerIndex((prev) => (prev - 1 + islamicBanners.length) % islamicBanners.length);
    setTimeout(() => {
      setIsTransitioning(false);
    }, 500); // Debounce duration matching transition duration
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50; // minimum pixels for swipe
    if (diff > threshold) {
      handleNextBanner();
    } else if (diff < -threshold) {
      handlePrevBanner();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    touchStartX.current = e.clientX;
    touchEndX.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (touchStartX.current === null) return;
    touchEndX.current = e.clientX;
  };

  const handleMouseUp = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;
    if (diff > threshold) {
      handleNextBanner();
    } else if (diff < -threshold) {
      handlePrevBanner();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Calculate countdown timer
  useEffect(() => {
    const calculateTime = () => {
      if (!profile.weddingDate) {
        setDaysRemaining(0);
        setWeeksRemaining(0);
        setHoursRemaining(0);
        return;
      }
      const targetDate = new Date(profile.weddingDate);
      const today = new Date();
      const differenceMs = targetDate.getTime() - today.getTime();

      if (differenceMs > 0) {
        const totalDays = Math.floor(differenceMs / (1000 * 60 * 60 * 24));
        const weeks = Math.floor(totalDays / 7);
        const hours = Math.floor((differenceMs / (1000 * 60 * 60)) % 24);
        setDaysRemaining(totalDays);
        setWeeksRemaining(weeks);
        setHoursRemaining(hours);
      } else {
        setDaysRemaining(0);
        setWeeksRemaining(0);
        setHoursRemaining(0);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, [profile.weddingDate]);

  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardFullName || !onboardPartnerName || !onboardWeddingDate || onboardTotalBudget <= 0) {
      setOnboardError("Harap lengkapi seluruh kolom informasi calon pengantin.");
      return;
    }
    setOnboardError("");
    setIsSavingOnboard(true);
    try {
      if (onSaveProfile) {
        await onSaveProfile(
          onboardFullName,
          onboardPartnerName,
          onboardWeddingDate,
          Number(onboardTotalBudget)
        );
      }
    } catch (err: any) {
      setOnboardError(err.message || "Gagal menyimpan rincian rencana akad.");
    } finally {
      setIsSavingOnboard(false);
    }
  };

  // Calculations for total budget stats
  const totalTargetBudget = profile.totalBudget || 0;
  
  // Total expenses are sum of checklist item actual expenditure AND purchased mahar details
  const totalChecklistActual = checklistItems.reduce((acc, curr) => acc + (curr.budgetActual || 0), 0);
  const totalMaharActual = maharItems.reduce((acc, curr) => acc + (curr.price || 0), 0);
  const totalActualSpent = totalChecklistActual + totalMaharActual;

  // Checklist achievements
  const totalChecklistCount = checklistItems.length;
  const completedChecklistCount = checklistItems.filter(i => i.isDone).length;
  const checklistPercentage = totalChecklistCount > 0 ? Math.round((completedChecklistCount / totalChecklistCount) * 100) : 0;



  // Formatting currency helper
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(num);
  };

  // Difference calculated
  const remainingTargetBudgetBalance = totalTargetBudget - totalActualSpent;
  const spentPercentOfTarget = totalTargetBudget > 0 ? Math.min(100, Math.round((totalActualSpent / totalTargetBudget) * 100)) : 0;

  // SVG Radial Ring constants
  const svgSize = 120;
  const strokeWidth = 8;
  const radius = (svgSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const checklistStrokeOffset = circumference - (checklistPercentage / 100) * circumference;
  const budgetStrokeOffset = circumference - (spentPercentOfTarget / 100) * circumference;

  return (
    <div className="space-y-6" id="dashboard-view">
      
      {/* 1. DYNAMIC ISLAMIC BANNER (HADITH & PRAYER MANUAL CAROUSEL) */}
      <div className="relative bg-gradient-to-r from-[#af7661] to-[#d4a5a5]/95 text-white p-6 rounded-2xl shadow-md overflow-hidden min-h-[140px] flex items-center transition-all duration-300">
        {/* Soft Background Geometry Grid */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
        <div className="absolute right-4 bottom-[-20px] text-white/5 pointer-events-none">
          <Sparkles size={160} />
        </div>

        <div className="w-full relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 relative pr-10 pl-10 md:pr-12 md:pl-12 space-y-2">
            {/* Left and Right Manual Chevrons */}
            <button
              onClick={handlePrevBanner}
              disabled={isTransitioning}
              className="absolute left-0 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 disabled:opacity-50 transition-all border-none outline-none cursor-pointer flex items-center justify-center text-white/80 hover:text-white shrink-0 z-20"
              title="Hadits Sebelumnya"
            >
              <ChevronLeft size={16} />
            </button>
            
            <button
              onClick={handleNextBanner}
              disabled={isTransitioning}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 disabled:opacity-50 transition-all border-none outline-none cursor-pointer flex items-center justify-center text-white/80 hover:text-white shrink-0 z-20"
              title="Hadits Selanjutnya"
            >
              <ChevronRight size={16} />
            </button>

            {/* Swipeable Container with Ultra-Soft Deceleration */}
            <div 
              className="w-full overflow-hidden cursor-grab active:cursor-grabbing select-none"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div 
                className="flex transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{ transform: `translateX(-${bannerIndex * 100}%)` }}
              >
                {islamicBanners.map((banner, idx) => (
                  <div key={idx} className="w-full shrink-0 min-h-[75px] flex flex-col justify-center text-center md:text-left pr-4">
                    <p className="text-sm font-serif italic text-rose-100 font-medium tracking-wide mb-1 leading-relaxed">
                      {banner.translation}
                    </p>
                    <p className="text-2xl md:text-3xl font-arabic text-white opacity-95 leading-relaxed mt-2 font-semibold">
                      {banner.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex items-center justify-center md:justify-start gap-3">
              <span className="inline-block text-[9px] uppercase tracking-widest font-black text-rose-100 bg-white/10 px-2.5 py-0.5 rounded-full select-none transition-all duration-300">
                💡 Hadits Pilihan • {islamicBanners[bannerIndex].source}
              </span>
              
              {/* Pagination Dots */}
              <div className="flex gap-1.5 z-20">
                {islamicBanners.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (isTransitioning || bannerIndex === i) return;
                      setIsTransitioning(true);
                      setBannerIndex(i);
                      setTimeout(() => {
                        setIsTransitioning(false);
                      }, 500);
                    }}
                    className={`h-1.5 rounded-full transition-all duration-300 border-none outline-none cursor-pointer ${
                      bannerIndex === i ? "w-3 bg-white" : "w-1.5 bg-white/40 hover:bg-white/60"
                    }`}
                    title={`Slide ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white/15 backdrop-blur-md border border-white/20 p-4 rounded-xl flex items-center gap-3 self-center md:self-auto shrink-0 shadow-xs">
            <Calendar className="text-rose-100" size={28} />
            <div className="text-left">
              <p className="text-[9px] text-rose-100 uppercase tracking-wider font-bold">Hari Pernikahan</p>
              <p className="text-xs font-bold text-white leading-tight font-serif mt-0.5">
                {profile.weddingDate ? new Date(profile.weddingDate).toLocaleDateString("id-ID", {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : "Belum ditentukan"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. INFOGRAPHIC DASHBOARD CORE: 3 STUNNING RADIAL/SVG SEGMENTS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card A: Countdown visual indicator */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col items-center text-center justify-between min-h-[220px] transition-all hover:shadow-md">
          <p className="text-stone-400 text-[10px] uppercase tracking-wider font-bold">Hitung Mundur Akad</p>
          
          <div className="relative my-3 flex items-center justify-center">
            {/* Elegant Calligraphy Backing arch */}
            <div className="absolute text-[#af7661]/5 font-arabic text-7xl select-none leading-none pointer-events-none">
              ز
            </div>
            <div className="text-center z-10 space-y-1">
              <span className="block text-4xl font-extrabold text-stone-850 font-serif leading-none">{daysRemaining}</span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#af7661]">Hari Tersisa</span>
            </div>
          </div>

          <div className="w-full border-t border-stone-100 pt-3 flex justify-between items-center text-[10px] text-stone-500 font-sans">
            <span>Akad: {profile.weddingDate ? new Date(profile.weddingDate).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' }) : "TBA"}</span>
            <span className="font-semibold text-[#af7661] bg-rose-50 px-2 py-0.5 rounded-full font-mono">{weeksRemaining} Minggu Lagi</span>
          </div>
        </div>

        {/* Card B: Circular Progress Infographic (Budget Spent) */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs flex flex-col items-center text-center justify-between min-h-[220px] transition-all hover:shadow-md">
          <p className="text-stone-400 text-[10px] uppercase tracking-wider font-bold">Kuota Anggaran Terpakai</p>
          
          <div className="relative my-2 flex items-center justify-center">
            <svg width={svgSize} height={svgSize} className="transform -rotate-90">
              {/* Outer track */}
              <circle
                cx={svgSize / 2}
                cy={svgSize / 2}
                r={radius}
                className="stroke-stone-100"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              {/* Active track */}
              <circle
                cx={svgSize / 2}
                cy={svgSize / 2}
                r={radius}
                className="stroke-[#af7661] transition-all duration-1000 ease-out"
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={budgetStrokeOffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center">
              <span className="block text-xl font-black text-stone-850 font-mono leading-none">{spentPercentOfTarget}%</span>
              <span className="text-[8px] text-stone-400 uppercase tracking-wider font-semibold block mt-0.5">Budget</span>
            </div>
          </div>

          <div className="w-full border-t border-stone-100 pt-3 flex justify-between items-center text-[10px] text-stone-500 font-sans">
            <span>Limit: {formatIDR(totalTargetBudget)}</span>
            <span className="font-bold text-stone-800">Pakai: {formatIDR(totalActualSpent)}</span>
          </div>
        </div>

        {/* Card C: Circular Progress Infographic (Checklist Progress) */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs flex flex-col items-center text-center justify-between min-h-[220px] transition-all hover:shadow-md">
          <p className="text-stone-400 text-[10px] uppercase tracking-wider font-bold">Progres Persiapan Akad</p>
          
          <div className="relative my-2 flex items-center justify-center">
            <svg width={svgSize} height={svgSize} className="transform -rotate-90">
              <circle
                cx={svgSize / 2}
                cy={svgSize / 2}
                r={radius}
                className="stroke-stone-100"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              <circle
                cx={svgSize / 2}
                cy={svgSize / 2}
                r={radius}
                className="stroke-emerald-600 transition-all duration-1000 ease-out"
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={checklistStrokeOffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center">
              <span className="block text-xl font-black text-stone-850 font-mono leading-none">{checklistPercentage}%</span>
              <span className="text-[8px] text-stone-400 uppercase tracking-wider font-semibold block mt-0.5">Selesai</span>
            </div>
          </div>

          <div className="w-full border-t border-stone-100 pt-3 flex justify-between items-center text-[10px] text-stone-500 font-sans">
            <span>Total Kebutuhan: {totalChecklistCount}</span>
            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">{completedChecklistCount} Tuntas</span>
          </div>
        </div>

      </div>

      {/* 3. DYNAMIC SEGMENTED INFOGRAPHICS: STACKED PROGRESS & BALANCE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Module A: Sakinah Budget Balance Stacked Progress (col: 12) */}
        <div className="bg-white border border-stone-200/80 rounded-2xl shadow-xs p-5 lg:col-span-12 flex flex-col justify-between min-h-[220px]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-sm font-serif">Aliran Anggaran Sakinah</h3>
              <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${remainingTargetBudgetBalance < 0 ? "bg-rose-50 text-rose-700 border border-rose-100" : "bg-emerald-50 text-emerald-800 border border-emerald-100"}`}>
                {remainingTargetBudgetBalance < 0 ? "⚠️ Overbudget" : "✓ Saldo Aman"}
              </span>
            </div>

            {/* Visual Segments */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4 font-mono text-[11px]">
              <div className="p-3 border border-stone-100 rounded-xl bg-stone-50/50">
                <span className="text-stone-400 block text-[8px] uppercase tracking-wider font-bold">Limit Maksimal</span>
                <span className="font-bold text-stone-850 block mt-1">{formatIDR(totalTargetBudget)}</span>
              </div>
              <div className="p-3 border border-stone-100 rounded-xl bg-stone-50/50">
                <span className="text-stone-400 block text-[8px] uppercase tracking-wider font-bold">Pengeluaran Riil</span>
                <span className="font-bold text-stone-850 block mt-1 text-[#af7661]">{formatIDR(totalActualSpent)}</span>
              </div>
              <div className="p-3 border border-stone-100 rounded-xl bg-stone-50/50">
                <span className="text-stone-400 block text-[8px] uppercase tracking-wider font-bold">Sisa Kuota</span>
                <span className={`font-bold block mt-1 ${remainingTargetBudgetBalance < 0 ? "text-rose-600 animate-pulse" : "text-emerald-700"}`}>{formatIDR(remainingTargetBudgetBalance)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 text-xs text-stone-500 font-medium">
            <div className="flex justify-between">
              <span>Rasio Penggunaan Dana</span>
              <span>{spentPercentOfTarget}% Terpakai</span>
            </div>
            <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${spentPercentOfTarget > 90 ? "bg-rose-600" : spentPercentOfTarget > 70 ? "bg-amber-500" : "bg-emerald-600"}`}
                style={{ width: `${spentPercentOfTarget}%` }}
              ></div>
            </div>
          </div>
        </div>

      </div>

      {/* 4. SHARIA GUIDE STACKED PRINCIPLES */}
      <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs">
        <div className="pb-3 border-b border-stone-100">
          <h4 className="font-serif font-black text-stone-900 text-sm">Prinsip Pernikahan Syar'i (Sakinah Guide)</h4>
          <p className="text-stone-500 text-[10px] mt-0.5">Ringkasan rujukan Islami dalam melangsungkan walimah yang penuh barakah</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-4 text-xs text-stone-650">
          <div className="p-3 border border-stone-100 rounded-xl hover:border-[#af7661]/30 hover:bg-rose-50/10 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="text-emerald-600 shrink-0" size={16} />
                <strong className="text-stone-850">No Israf (Bebas Boros)</strong>
              </div>
              <p className="leading-relaxed text-stone-500 text-[11px]">
                Mengatur katering, dekorasi, dan walimah secara khidmat tanpa melampaui batas kemampuan finansial. Syariat menganjurkan kesederhanaan.
              </p>
            </div>
          </div>

          <div className="p-3 border border-stone-100 rounded-xl hover:border-[#af7661]/30 hover:bg-rose-50/10 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="text-emerald-600 shrink-0" size={16} />
                <strong className="text-stone-850">Mahar yang Memudahkan</strong>
              </div>
              <p className="leading-relaxed text-stone-500 text-[11px]">
                Mahar terbaik adalah yang bernilai dan memudahkan suami serta memuliakan bagi istri. Tidak memberatkan pihak laki-laki secara berlebihan.
              </p>
            </div>
          </div>

          <div className="p-3 border border-stone-100 rounded-xl hover:border-[#af7661]/30 hover:bg-rose-50/10 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="text-emerald-600 shrink-0" size={16} />
                <strong className="text-stone-850">Mengutamakan Silaturahim</strong>
              </div>
              <p className="leading-relaxed text-stone-500 text-[11px]">
                Dahulukan mengundang sanak kerabat dekat, para asatidzah/guru, tetangga sekitar, serta fakir miskin di sekitar tempat tinggal Anda.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MANDATORY WELCOME MODAL SETUP */}
      {showWelcomeModal && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 md:p-8 max-w-lg w-full shadow-2xl relative">
            <div className="text-center mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider text-emerald-805 bg-emerald-50 border border-emerald-100 uppercase">
                Bismillah, Selamat Datang di Zawwaja
              </span>
              <h2 className="text-2xl font-serif font-black text-stone-950 mt-3">Lengkapi Profil Akad Pernikahan</h2>
              <p className="text-stone-500 text-xs mt-1 leading-relaxed">
                Silakan lengkapi informasi calon pengantin untuk mengonfigurasi jadwal, anggaran transparan, dan checklist syar'i Anda.
              </p>
            </div>

            {onboardError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{onboardError}</span>
              </div>
            )}

            <form onSubmit={handleOnboardSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Calon Pengantin Pria
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rian Hardi"
                  value={onboardFullName}
                  onChange={(e) => setOnboardFullName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-sans text-sm text-stone-850 placeholder-stone-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Calon Pengantin Wanita
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Amira Syafira"
                  value={onboardPartnerName}
                  onChange={(e) => setOnboardPartnerName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-sans text-sm text-stone-850 placeholder-stone-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Rencana Tanggal Akad Nikah
                  </label>
                  <input
                    type="date"
                    required
                    value={onboardWeddingDate}
                    onChange={(e) => setOnboardWeddingDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono text-xs text-stone-750"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Estimasi Anggaran (IDR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-stone-500 text-sm font-semibold">Rp</span>
                    <input
                      type="number"
                      required
                      min={1000000}
                      step={500000}
                      value={onboardTotalBudget}
                      onChange={(e) => setOnboardTotalBudget(Number(e.target.value))}
                      className="w-full pl-9 pr-3 py-2.5 bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono text-xs text-stone-850"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingOnboard}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg shadow-md transition-all duration-200 flex items-center justify-center cursor-pointer text-sm"
                >
                  {isSavingOnboard ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Menyimpan Data Akad...
                    </span>
                  ) : (
                    <>
                      Simpan & Buka Dashboard ⚡
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
