import React, { useEffect, useState } from "react";
import { UserProfile, WeddingChecklistItem, MaharItem, GuestItem } from "../types";
import { 
  Calendar, 
  DollarSign, 
  Coins, 
  CheckCircle, 
  Users, 
  Clock, 
  ChevronRight, 
  MessageSquare, 
  ArrowUpRight,
  AlertCircle
} from "lucide-react";

interface BudgetSummaryProps {
  profile: UserProfile;
  checklistItems: WeddingChecklistItem[];
  maharItems: MaharItem[];
  guests: GuestItem[];
  onNavigate: (tab: string) => void;
  onSaveProfile?: (fullName: string, partnerName: string, weddingDate: string, totalBudget: number) => Promise<void>;
}

export default function BudgetSummary({ profile, checklistItems, maharItems, guests, onNavigate, onSaveProfile }: BudgetSummaryProps) {
  // Stats state
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [weeksRemaining, setWeeksRemaining] = useState(0);
  const [hoursRemaining, setHoursRemaining] = useState(0);

  // Welcome Modal states
  const [onboardFullName, setOnboardFullName] = useState("");
  const [onboardPartnerName, setOnboardPartnerName] = useState("");
  const [onboardWeddingDate, setOnboardWeddingDate] = useState("2026-12-12");
  const [onboardTotalBudget, setOnboardTotalBudget] = useState(35000000);
  const [isSavingOnboard, setIsSavingOnboard] = useState(false);
  const [onboardError, setOnboardError] = useState("");

  const showWelcomeModal = !profile.fullName || !profile.partnerName || !profile.weddingDate;

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

  const totalChecklistEstimate = checklistItems.reduce((acc, curr) => acc + (curr.budgetEstimate || 0), 0);
  const totalEstimatedCostsCombined = totalChecklistEstimate + maharItems.reduce((acc, curr) => acc + (curr.price || 0), 0);

  // Checklist achievements
  const totalChecklistCount = checklistItems.length;
  const completedChecklistCount = checklistItems.filter(i => i.isDone).length;
  const checklistPercentage = totalChecklistCount > 0 ? Math.round((completedChecklistCount / totalChecklistCount) * 100) : 0;

  // CPP vs CPW stats
  const cppCompleted = checklistItems.filter(i => i.isGroomChecked).length;
  const cpwCompleted = checklistItems.filter(i => i.isBrideChecked).length;

  // Guests stats
  const totalGuests = guests.length;
  const confirmedGuests = guests.filter(g => g.isRsvp).length;
  const digitalInvites = guests.filter(g => g.invitationType === "Digital").length;
  const printedInvites = guests.filter(g => g.invitationType === "Cetak").length;

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

  return (
    <div className="space-y-6" id="dashboard-view">
      
      {/* Welcome Bar Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-br from-[#c07c88]/15 via-[#FAF6F5] to-[#e6d0d3]/30 p-6 rounded-2xl text-stone-900 shadow-sm border border-[#e6d0d3]/30">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800 bg-white/70 px-3 py-1 rounded-full border border-emerald-300/30 shadow-xs">
            Zawwaja.id Sakinah Planner
          </span>
          <h2 className="text-2xl md:text-3xl font-serif font-bold mt-2 text-stone-900">
            Marhaban yaa, {profile.fullName}!
          </h2>
          <p className="text-stone-600 text-xs md:text-sm mt-1 max-w-xl font-sans">
            Insya Allah akad pernikahan Anda bersama <strong className="text-emerald-700 font-semibold">{profile.partnerName}</strong> akan dipersiapkan dengan barakah dan terstruktur.
          </p>
        </div>
        <div className="bg-white/60 backdrop-blur-sm border border-emerald-300/30 p-4 rounded-xl flex items-center gap-3 self-start md:self-auto shrink-0 shadow-xs">
          <Calendar className="text-emerald-600" size={32} />
          <div>
            <p className="text-[10px] text-stone-600 uppercase tracking-wider font-semibold">Hari Pernikahan</p>
            <p className="text-sm font-bold text-stone-900">
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

      {/* Sleek Statistics Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: solid rose gold countdown */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[160px]">
          <div className="relative z-10">
            <p className="text-stone-400 text-xs uppercase tracking-wider font-bold">Hitung Mundur</p>
            <h2 className="text-4xl font-normal mt-2 font-serif tracking-tight text-stone-800">
              {daysRemaining} <span className="text-lg font-normal text-stone-500">Hari</span>
            </h2>
            <p className="text-stone-500 text-xs mt-3 font-sans">
              Menuju Akad: {profile.weddingDate ? new Date(profile.weddingDate).toLocaleDateString("id-ID", {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              }) : "Belum ditentukan"}
            </p>
          </div>
          <div className="absolute right-[-15px] bottom-[-15px] text-[#B76E79]/5 shrink-0 pointer-events-none">
            <Clock size={110} />
          </div>
        </div>

        {/* Card 2: Total Anggaran */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[160px]">
          <div>
            <p className="text-stone-400 text-xs font-bold uppercase tracking-wider">Total Anggaran</p>
            <h2 className="text-3xl font-extrabold text-stone-800 mt-2 italic font-serif">
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                maximumFractionDigits: 0
              }).format(totalTargetBudget)}
            </h2>
            <div className="mt-4 w-full bg-stone-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-600 h-full transition-all duration-500" 
                style={{ width: `${spentPercentOfTarget}%` }}
              ></div>
            </div>
          </div>
          <p className="text-xs text-stone-500 mt-3 font-medium">Terpakai: {formatIDR(totalActualSpent)} ({spentPercentOfTarget}%)</p>
        </div>

        {/* Card 3: Progres Persiapan */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[160px]">
          <div>
            <p className="text-stone-400 text-xs font-bold uppercase tracking-wider">Progres Persiapan</p>
            <h2 className="text-3xl font-black text-stone-900 mt-2 font-mono">{checklistPercentage}%</h2>
            <p className="text-xs text-emerald-600 mt-2 font-semibold">
              {completedChecklistCount === totalChecklistCount && totalChecklistCount > 0
                ? "Sempurna! Semua tuntas!" 
                : `+${completedChecklistCount} dari ${totalChecklistCount} kebutuhan selesai`}
            </p>
          </div>
          <div className="flex gap-1.5 mt-4">
            <div className={`h-1.5 flex-1 rounded-full ${checklistPercentage >= 25 ? "bg-emerald-600" : "bg-stone-200"}`}></div>
            <div className={`h-1.5 flex-1 rounded-full ${checklistPercentage >= 50 ? "bg-emerald-600" : "bg-stone-200"}`}></div>
            <div className={`h-1.5 flex-1 rounded-full ${checklistPercentage >= 75 ? "bg-emerald-600" : "bg-stone-200"}`}></div>
            <div className={`h-1.5 flex-1 rounded-full ${checklistPercentage >= 100 ? "bg-emerald-600" : "bg-stone-200"}`}></div>
          </div>
        </div>

      </div>

      {/* Main Budget Tracker Aggregation Frame */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-6">
          <div>
            <h3 className="font-bold text-stone-900 text-lg font-serif">Arus Kas & Pelacak Anggaran (Budget Tracker)</h3>
            <p className="text-xs text-stone-500 mt-0.5">Ringkasan pengeluaran riil pernikahan berdasarkan checklist & mahar</p>
          </div>
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
            Kalkulator Riil Terotomatisasi
          </span>
        </div>

        {/* Bento Grid Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Target Budget */}
          <div className="p-5 rounded-xl border border-stone-200 bg-white shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs text-stone-500 font-semibold uppercase tracking-wider">Target Margin Budget</span>
              <DollarSign size={18} className="text-stone-400" />
            </div>
            <h4 className="text-2xl font-bold font-mono text-stone-800 mt-2">{formatIDR(totalTargetBudget)}</h4>
            <p className="text-[10px] text-stone-400 mt-1">Estimasi awal yang diisikan saat onboarding</p>
          </div>

          {/* Card 2: Actual Spent */}
          <div className="p-5 rounded-xl border border-stone-200 bg-white shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs text-stone-500 font-semibold uppercase tracking-wider">Total Pengeluaran Saat Ini</span>
              <Coins size={18} className="text-[#B76E79]" />
            </div>
            <h4 className="text-2xl font-bold font-mono text-stone-850 mt-2">{formatIDR(totalActualSpent)}</h4>
            <p className="text-[10px] text-stone-400 mt-1">Checklist ({formatIDR(totalChecklistActual)}) + Mahar ({formatIDR(totalMaharActual)})</p>
          </div>

          {/* Card 3: Difference margin */}
          <div className={`p-5 rounded-xl border shadow-xs ${remainingTargetBudgetBalance < 0 ? "border-red-200 bg-red-50/20" : "border-stone-200 bg-white"}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-stone-500 font-semibold uppercase tracking-wider">Sisa Saldo Aman</span>
              <div className={`w-2 h-2 rounded-full ${remainingTargetBudgetBalance < 0 ? "bg-red-500" : "bg-green-500"}`}></div>
            </div>
            <h4 className={`text-2xl font-bold font-mono mt-2 ${remainingTargetBudgetBalance < 0 ? "text-red-600" : "text-green-600"}`}>
              {formatIDR(remainingTargetBudgetBalance)}
            </h4>
            <p className="text-[10px] text-stone-400 mt-1">
              {remainingTargetBudgetBalance < 0 
                ? "⚠️ Pengeluaran melampaui target anggaran onboarding!" 
                : "Sisa porsi aman untuk didelegasikan ke kebutuhan cadangan"}
            </p>
          </div>

        </div>

        {/* Visual progress comparison */}
        <div className="mt-6 pt-4 border-t border-stone-100 space-y-2">
          <div className="flex justify-between text-xs text-stone-500 font-medium">
            <span>Progress Penggunaan Kuota Anggaran Mas kawin/Seserahan</span>
            <span>{spentPercentOfTarget}% dari Target</span>
          </div>
          <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${spentPercentOfTarget > 90 ? "bg-rose-600" : spentPercentOfTarget > 70 ? "bg-amber-500" : "bg-emerald-600"}`}
              style={{ width: `${spentPercentOfTarget}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Guest Status + Quick Action panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Guest table status panel */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h4 className="font-bold text-stone-900 text-sm">Undangan & Kondsolidasi RSVPs</h4>
              <span className="text-xs text-stone-400 font-mono">{totalGuests} Terdaftar</span>
            </div>
            
            <div className="grid grid-cols-3 gap-3 py-4 text-center">
              <div className="p-2 border border-stone-100 rounded-lg">
                <span className="block text-xl font-bold text-stone-900 font-mono">{confirmedGuests}</span>
                <span className="text-[10px] text-stone-400 uppercase tracking-tight">Hadir (RSVP)</span>
              </div>
              <div className="p-2 border border-stone-100 rounded-lg">
                <span className="block text-xl font-bold text-stone-900 font-mono">{digitalInvites}</span>
                <span className="text-[10px] text-stone-400 uppercase tracking-tight">Undangan Digital</span>
              </div>
              <div className="p-2 border border-stone-100 rounded-lg">
                <span className="block text-xl font-bold text-stone-900 font-mono">{printedInvites}</span>
                <span className="text-[10px] text-stone-400 uppercase tracking-tight">Undangan Cetak</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => onNavigate("guests")}
            className="w-full py-2.5 bg-stone-50 hover:bg-emerald-50 text-emerald-800 border border-stone-200 text-xs font-bold rounded-lg transition-colors flex items-center justify-center cursor-pointer"
          >
            Manajemen Daftar Tamu Undangan
            <ChevronRight size={16} className="ml-1" />
          </button>
        </div>

        {/* Sharia Counseling / Quick Advices banner */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-stone-900 text-sm">Prinsip Pernikahan Sharia Barakah</h4>
            <p className="text-stone-500 text-xs mt-1">Beberapa panduan asasi dalam menyelenggarakan hari akad yang berkah:</p>
            
            <ul className="text-xs text-stone-600 mt-3 space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="text-emerald-600 shrink-0 mt-0.5" size={14} />
                <span><strong>No Israf (Berlebih-lebihan)</strong>: Atur katering dan dekorasi secara khidmat tanpa melampaui kemampuan keuangan riil Anda.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="text-emerald-600 shrink-0 mt-0.5" size={14} />
                <span><strong>Mahar yang Memudahkan</strong>: Mahar yang paling agung nilainya adalah mahar yang memudahkan bagi suami dan memuliakan bagi istri.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="text-emerald-600 shrink-0 mt-0.5" size={14} />
                <span><strong>Silaturahim Diutamakan</strong>: Dahulukan mengundang sanak kerabat dekat, para asatidzah, dan fakir miskin di sekitar tempat tinggal Anda.</span>
              </li>
            </ul>
          </div>

          <div className="text-[10px] text-stone-400 mt-2 italic text-center">
            "Pernikahan yang paling besar barakahnya adalah yang paling mudah biayanya" (HR. Ahmad)
          </div>
        </div>

      </div>

      {/* MANDATORY WELCOME MODAL FOR FIRST-TIME PROFILE SETUP */}
      {showWelcomeModal && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 md:p-8 max-w-lg w-full shadow-2xl relative">
            <div className="text-center mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider text-emerald-805 bg-emerald-50 border border-emerald-100 uppercase">
                Bismillah, Selamat Datang di Zawwaja.id
              </span>
              <h2 className="text-2xl font-serif font-black text-stone-950 mt-3 animate-fade-in">Lengkapi Profil Akad Pernikahan</h2>
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
