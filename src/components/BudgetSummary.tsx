import React, { useEffect, useState } from "react";
import { UserProfile, WeddingChecklistItem, MaharItem } from "../types";
import { 
  Calendar, 
  Sparkles,
  AlertCircle,
  Syringe,
  Info,
  Check,
  ChevronDown,
  ChevronUp,
  X,
  Compass,
  FileText,
  Camera,
  Gift,
  Mail,
  Gem,
  TrendingUp,
  Users
} from "lucide-react";

interface BudgetSummaryProps {
  profile: UserProfile;
  checklistItems: WeddingChecklistItem[];
  maharItems: MaharItem[];
  onNavigate: (tab: string) => void;
  onSaveProfile?: (fullName: string, partnerName: string, weddingDate: string, totalBudget: number) => Promise<void>;
  onSaveChecklistItem?: (item: WeddingChecklistItem) => Promise<void>;
}

export default function BudgetSummary({ 
  profile, 
  checklistItems, 
  maharItems, 
  onNavigate, 
  onSaveProfile,
  onSaveChecklistItem
}: BudgetSummaryProps) {
  // Stats state
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [weeksRemaining, setWeeksRemaining] = useState(0);
  const [currentDateFormatted, setCurrentDateFormatted] = useState("");

  // Modals state
  const [showVaccineModal, setShowVaccineModal] = useState(false);
  const [showKuaModal, setShowKuaModal] = useState(false);

  // Welcome Onboarding Modal states
  const [onboardFullName, setOnboardFullName] = useState("");
  const [onboardPartnerName, setOnboardPartnerName] = useState("");
  const [onboardWeddingDate, setOnboardWeddingDate] = useState("2026-12-12");
  const [onboardTotalBudget, setOnboardTotalBudget] = useState(35000000);
  const [isSavingOnboard, setIsSavingOnboard] = useState(false);
  const [onboardError, setOnboardError] = useState("");

  // Tooltip state
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);

  const showWelcomeModal = !profile.fullName || !profile.partnerName || !profile.weddingDate;

  // Calculate current date and remaining days
  useEffect(() => {
    const today = new Date();
    setCurrentDateFormatted(
      today.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "short",
        year: "numeric"
      })
    );

    const calculateTime = () => {
      if (!profile.weddingDate) {
        setDaysRemaining(0);
        setWeeksRemaining(0);
        return;
      }
      const targetDate = new Date(profile.weddingDate);
      const today = new Date();
      const differenceMs = targetDate.getTime() - today.getTime();

      if (differenceMs > 0) {
        const totalDays = Math.floor(differenceMs / (1000 * 60 * 60 * 24));
        const weeks = Math.floor(totalDays / 7);
        setDaysRemaining(totalDays);
        setWeeksRemaining(weeks);
      } else {
        setDaysRemaining(0);
        setWeeksRemaining(0);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, [profile.weddingDate]);

  // Dynamic ranges logic based on profile registration date and wedding date
  const weddingDateObj = profile.weddingDate ? new Date(profile.weddingDate) : null;
  const creationDateObj = profile.createdAt ? new Date(profile.createdAt) : new Date();
  const totalPrepDays = weddingDateObj 
    ? Math.max(180, Math.floor((weddingDateObj.getTime() - creationDateObj.getTime()) / (1000 * 60 * 60 * 24)))
    : 180;
  
  const segmentLength = totalPrepDays / 6;
  const daysElapsed = Math.max(0, totalPrepDays - daysRemaining);
  const activePhaseId = Math.min(6, Math.max(1, Math.floor(daysElapsed / segmentLength) + 1));

  // Daily Tips logic
  const tips = [
    "Komunikasi adalah kunci. Jangan lupa bicarakan ekspektasi finansial setelah menikah bersama pasangan.",
    "Perbanyak puasa sunnah dan doa menjelang hari akad untuk memohon kelancaran.",
    "Bandingkan vendor dengan cermat. Jangan terburu-buru membayar DP sebelum ada perjanjian (MoU) yang jelas.",
    "Cek kembali syarat KUA jauh-jauh hari agar tidak ada dokumen yang kurang saat hari pendaftaran."
  ];
  const [activeTip, setActiveTip] = useState(0);
  
  useEffect(() => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    setActiveTip(dayOfYear % tips.length);
  }, []);

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
  const totalChecklistActual = checklistItems.reduce((acc, curr) => acc + (curr.budgetActual || 0), 0);
  const totalMaharActual = maharItems.reduce((acc, curr) => acc + (curr.price || 0), 0);
  const totalActualSpent = totalChecklistActual + totalMaharActual;

  // Checklist achievements
  const totalChecklistCount = checklistItems.length;
  const completedChecklistCount = checklistItems.filter(i => i.isDone).length;
  const checklistPercentage = totalChecklistCount > 0 ? Math.round((completedChecklistCount / totalChecklistCount) * 100) : 0;

  // Percentage & remaining budget calculations
  const remainingTargetBudgetBalance = totalTargetBudget - totalActualSpent;
  const isBudgetSafe = remainingTargetBudgetBalance >= 0;

  // Formatting currency helper
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(num);
  };

  // Dynamic MMR Deadline calculation: 3 months before wedding date
  const getMMRDeadline = () => {
    if (!profile.weddingDate) return "September 2026";
    const date = new Date(profile.weddingDate);
    date.setMonth(date.getMonth() - 3);
    return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  };

  // Timeline phase data structure with icons and navigation targets
  const phases = [
    {
      id: 1,
      title: "Persiapan Awal",
      subtitle: "5 Bulan",
      icon: Compass,
      navigateTo: "checklist",
      categories: ["Persiapan Awal"]
    },
    {
      id: 2,
      title: "Administrasi & Dokumen",
      subtitle: "4 Bulan",
      icon: FileText,
      navigateTo: "checklist",
      categories: ["Administrasi Persiapan Menikah"]
    },
    {
      id: 3,
      title: "Vendor & Tempat",
      subtitle: "3 Bulan",
      icon: Camera,
      navigateTo: "vendors",
      categories: ["Tempat", "Make up dan Busana", "Dokumentasi", "Entertaint"]
    },
    {
      id: 4,
      title: "Mahar & Seserahan",
      subtitle: "2 Bulan",
      icon: Gift,
      navigateTo: "mahar",
      categories: ["Mahar dan Cincin"]
    },
    {
      id: 5,
      title: "Undangan & Tamu",
      subtitle: "1 Bulan",
      icon: Users,
      navigateTo: "checklist",
      categories: ["Makanan", "Undangan dan Souvenir"]
    },
    {
      id: 6,
      title: "Finalisasi & Hari-H",
      subtitle: "Hari-H",
      icon: Gem,
      navigateTo: "checklist",
      categories: ["Persiapan Lainnya"]
    }
  ];

  // Helper to filter checklist items for each phase
  const getItemsForPhase = (phaseId: number) => {
    const phase = phases.find(p => p.id === phaseId);
    if (!phase) return [];
    return checklistItems.filter(item => {
      return phase.categories.some(cat => cat.toLowerCase() === item.category.toLowerCase());
    });
  };

  // Calculate progress per phase
  const getPhaseProgress = (phaseId: number) => {
    const items = getItemsForPhase(phaseId);
    if (items.length === 0) return 0;
    const done = items.filter(i => i.isDone).length;
    return Math.round((done / items.length) * 100);
  };

  // SVG Budget mini chart data points (simulate 6-point trend line)
  const chartPoints = phases.map((phase) => {
    const items = getItemsForPhase(phase.id);
    return items.reduce((acc, i) => acc + (i.budgetActual || 0), 0);
  });
  const maxChartVal = Math.max(...chartPoints, 1);

  // Generate SVG path for budget chart
  const chartWidth = 400;
  const chartHeight = 80;
  const chartPadding = 20;
  const chartInnerWidth = chartWidth - chartPadding * 2;
  const chartInnerHeight = chartHeight - chartPadding;
  
  const chartPathPoints = chartPoints.map((val, i) => {
    const x = chartPadding + (i / (chartPoints.length - 1)) * chartInnerWidth;
    const y = chartHeight - chartPadding / 2 - (val / maxChartVal) * chartInnerHeight;
    return { x, y };
  });
  
  const chartPathD = chartPathPoints.reduce((acc, point, i) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    const prev = chartPathPoints[i - 1];
    const cpx1 = prev.x + (point.x - prev.x) / 3;
    const cpx2 = point.x - (point.x - prev.x) / 3;
    return `${acc} C ${cpx1} ${prev.y}, ${cpx2} ${point.y}, ${point.x} ${point.y}`;
  }, "");

  const chartAreaD = `${chartPathD} L ${chartPathPoints[chartPathPoints.length - 1].x} ${chartHeight} L ${chartPathPoints[0].x} ${chartHeight} Z`;

  // Progress Ring helper
  const ProgressRing = ({ percent, size = 44, strokeWidth = 3 }: { percent: number; size?: number; strokeWidth?: number }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;
    
    return (
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(42, 92, 77, 0.1)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(42, 92, 77, 0.7)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="progress-ring-circle"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6 relative" id="dashboard-view">

      {/* ============================================ */}
      {/* 1. FLOATING HEADER (compact on mobile)       */}
      {/* ============================================ */}
      <div className="animate-fade-up">
        {/* Mobile: single-row header with countdown pill */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-text-tertiary mb-1">
              <Calendar size={12} />
              <span>{currentDateFormatted}</span>
            </div>
            <h1 className="text-xl md:text-3xl font-serif font-bold text-text-primary leading-tight" style={{ textShadow: '0 2px 8px rgba(42, 92, 77, 0.08)' }}>
              Assalamu'alaikum, <span className="text-brand-600">{profile.fullName || "Pengantin"}</span>
            </h1>
            <p className="text-text-secondary text-sm md:text-base mt-1.5">
              dalam <span className="font-bold text-brand-600">{daysRemaining} hari</span> lagi bersama <span className="font-semibold text-brand-600">{profile.partnerName || "Pasangan"}</span>
            </p>
          </div>

          {/* Floating Countdown Pill — mobile only (Enhanced for Focal Point) */}
          <div className="md:hidden bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-xl shadow-brand-900/20 px-4 py-2.5 flex flex-col items-center justify-center text-center shrink-0 animate-countdown border border-brand-500/30" style={{ minWidth: '85px', borderRadius: '16px' }}>
            <span className="text-[8px] font-bold uppercase tracking-widest text-brand-100 mb-0.5">Menuju Akad</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-display font-black text-white leading-none tracking-tight" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                {daysRemaining}
              </span>
              <span className="text-[10px] font-bold text-brand-200 uppercase tracking-wider">hr</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* 2. TIMELINE — DOMINANT on mobile, first!     */}
      {/* ============================================ */}
      <div className="glass-panel animate-fade-up relative" style={{ animationDelay: '0.1s' }}>
        <div className="px-4 pt-4 pb-1 flex items-center justify-between">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-tertiary">
            Timeline Persiapan Nikah
          </h2>
          <span className="text-[9px] text-brand-600 font-bold bg-brand-50/80 px-2 py-0.5 rounded-full border border-brand-100">
            Fase {activePhaseId}/6
          </span>
        </div>

        {/* Mobile: Vertical Timeline */}
        <div className="md:hidden px-4 py-4 relative">
          {/* Vertical Connector Line (Background) */}
          <div className="absolute left-[42px] top-8 bottom-8 w-1 rounded-full" style={{ background: 'rgba(0,0,0,0.06)' }}>
            <div
              className="w-full rounded-full transition-all duration-700"
              style={{
                height: `${((activePhaseId - 1) / 5) * 100}%`,
                background: 'linear-gradient(180deg, #2A5C4D, #539C85)'
              }}
            />
          </div>

          <div className="flex flex-col gap-6 relative z-10">
            {phases.map((phase, idx) => {
              const Icon = phase.icon;
              const isActive = phase.id === activePhaseId;
              const progress = getPhaseProgress(phase.id);

              return (
                <div key={phase.id} className="flex items-center gap-4">
                  {/* Glass Node */}
                  <button
                    onClick={() => onNavigate(phase.navigateTo)}
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                      ...(isActive ? {
                        // ACTIVE state: bright glowing brand fill
                        background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(210,240,230,0.85) 100%)',
                        border: '2.5px solid rgba(42,92,77,0.7)',
                        boxShadow: '0 0 0 4px rgba(42,92,77,0.15), 0 0 20px rgba(42,92,77,0.4), 0 4px 16px rgba(0,0,0,0.08), inset 0 2px 3px rgba(255,255,255,0.9)'
                      } : {
                        // NORMAL state: muted grey glass
                        background: 'linear-gradient(145deg, rgba(240,240,240,0.7) 0%, rgba(220,225,223,0.6) 100%)',
                        border: '1.5px solid rgba(200,210,207,0.6)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04), inset 0 1px 2px rgba(255,255,255,0.5)'
                      })
                    }}
                    id={`timeline-node-mobile-${phase.id}`}
                    aria-label={phase.title}
                  >
                    <Icon size={20} className={isActive ? 'text-brand-600' : 'text-text-disabled'} />
                  </button>

                  {/* Info / Text area */}
                  <div className="flex-1 min-w-0 py-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className={`text-[12px] font-bold leading-tight truncate ${
                        isActive ? 'text-brand-600' : 'text-text-primary'
                      }`}>
                        {phase.title}
                      </p>
                      {isActive && (
                        <span className="text-[7px] font-black text-brand-600 uppercase tracking-wider bg-brand-50 px-1.5 py-0.5 rounded-full border border-brand-100 shrink-0 animate-pulse">
                          Aktif
                        </span>
                      )}
                    </div>
                    
                    <p className="text-[10px] text-text-tertiary leading-tight line-clamp-1 mb-1">
                      {phase.subtitle}
                    </p>

                    {/* Progress indicator specifically for active phase */}
                    {isActive && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <ProgressRing percent={progress} size={16} strokeWidth={2} />
                        <span className="text-[9px] font-bold text-brand-600">{progress}% selesai</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Desktop SVG Ribbon Path + Nodes */}
        <div className="hidden md:block relative p-8 pt-4" style={{ minHeight: '280px' }}>
          {/* SVG Curved Ribbon Path */}
          <svg
            viewBox="0 0 900 200"
            className="w-full h-auto absolute top-1/2 -translate-y-1/2 left-0"
            preserveAspectRatio="xMidYMid meet"
            style={{ filter: 'drop-shadow(0 2px 4px rgba(42, 92, 77, 0.05))' }}
          >
            <path
              d="M 50 100 C 150 40, 250 160, 350 100 C 450 40, 550 160, 650 100 C 750 40, 850 100, 850 100"
              className="timeline-path"
            />
            <path
              d="M 50 100 C 150 40, 250 160, 350 100 C 450 40, 550 160, 650 100 C 750 40, 850 100, 850 100"
              className="timeline-path-active"
              strokeDasharray={`${(activePhaseId / 6) * 1200}`}
              strokeDashoffset="0"
            />
          </svg>

          {/* Desktop Timeline Nodes */}
          <div className="relative flex justify-between items-start px-4" style={{ minHeight: '280px' }}>
            {phases.map((phase, index) => {
              const Icon = phase.icon;
              const isActive = phase.id === activePhaseId;
              const isDone = phase.id < activePhaseId;
              const progress = getPhaseProgress(phase.id);
              const isEven = index % 2 === 0;
              const topPos = isEven ? '10px' : '120px';

              return (
                <div
                  key={phase.id}
                  className={`flex flex-col items-center relative animate-scale-in anim-delay-${phase.id}`}
                  style={{ top: topPos, position: 'relative', flex: '1', maxWidth: '130px' }}
                >
                  <button
                    onClick={() => onNavigate(phase.navigateTo)}
                    className={`glass-node w-16 h-16 flex items-center justify-center relative z-10 ${
                      isActive ? 'glass-node-active' : ''
                    }`}
                    id={`timeline-node-${phase.id}`}
                    aria-label={phase.title}
                  >
                    <Icon size={24} className={`${
                      isActive ? 'text-brand-600' : 'text-text-tertiary'
                    }`} />
                  </button>

                  {isActive && (
                    <div className="glass-badge px-2.5 py-1 mt-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-600 animate-pulse" />
                      <span className="text-[8px] font-black text-brand-600 uppercase tracking-wider">Sedang Berjalan</span>
                    </div>
                  )}

                  <div className="text-center mt-2">
                    <p className={`text-[11px] font-bold leading-tight ${isActive ? 'text-brand-600' : 'text-text-primary'}`}>
                      {phase.title}
                    </p>
                    <p className="text-[9px] text-text-tertiary mt-0.5">{phase.subtitle}</p>
                  </div>

                  {(phase.id === 1 || isActive) && (
                    <div className="mt-1.5 flex items-center gap-1">
                      <ProgressRing percent={progress} size={28} strokeWidth={2.5} />
                      <span className="text-[9px] font-bold text-text-secondary">{progress}%</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* 3. STATS ROW: desktop countdown + cards      */}
      {/* ============================================ */}
      {/* Desktop: Countdown + stats side by side */}
      <div className="hidden md:grid md:grid-cols-3 gap-4 animate-fade-up" style={{ animationDelay: '0.2s' }}>
        {/* Countdown Cylinder Widget - desktop only full version */}
        <div className="glass-cylinder p-5 flex flex-col items-center justify-center text-center animate-countdown md:col-span-1">
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-tertiary mb-2">Hitung Mundur</span>
          <div className="flex items-baseline gap-1">
            <span className="text-5xl md:text-6xl font-display font-extrabold text-brand-600 leading-none tracking-tight" style={{ textShadow: '0 2px 12px rgba(42, 92, 77, 0.15)' }}>
              {daysRemaining}
            </span>
            <span className="text-sm font-bold text-brand-400 uppercase tracking-wider">Hari</span>
          </div>
          <p className="text-[10px] text-text-tertiary mt-2 font-medium">~{weeksRemaining} minggu menuju akad</p>
          <p className="text-[9px] text-text-tertiary mt-0.5">
            {profile.weddingDate ? new Date(profile.weddingDate).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }) : "Belum ditentukan"}
          </p>
        </div>

        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          <div className="glass-panel p-4 flex flex-col justify-between">
            <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-text-tertiary">Progres Persiapan</span>
            <div className="flex items-center gap-3 mt-3">
              <ProgressRing percent={checklistPercentage} size={52} strokeWidth={4} />
              <div>
                <span className="text-2xl font-display font-bold text-text-primary leading-none">{checklistPercentage}<span className="text-sm">%</span></span>
                <p className="text-[9px] text-text-tertiary mt-0.5">{completedChecklistCount}/{totalChecklistCount} tugas</p>
              </div>
            </div>
            <p className="text-[9px] text-brand-600 font-semibold mt-2">
              {checklistPercentage === 0 ? "Mulai dari Fase 1 ↓" : `Fase ${activePhaseId} sedang berjalan`}
            </p>
          </div>

          <div className="glass-panel p-4 flex flex-col justify-between">
            <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-text-tertiary">Serapan Anggaran</span>
            <div className="mt-3">
              <span className="text-lg font-display font-bold text-text-primary leading-none">{formatIDR(totalActualSpent)}</span>
              <p className="text-[9px] text-text-tertiary mt-1">dari {formatIDR(totalTargetBudget)}</p>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <div className={`w-2 h-2 rounded-full ${isBudgetSafe ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span className={`text-[10px] font-bold ${isBudgetSafe ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isBudgetSafe ? `${formatIDR(remainingTargetBudgetBalance)} (Aman)` : "Overbudget!"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: compact progress + budget row */}
      <div className="md:hidden grid grid-cols-2 gap-3 animate-fade-up" style={{ animationDelay: '0.2s' }}>
        <div className="glass-panel p-3 flex flex-col justify-between">
          <span className="text-[8px] font-bold uppercase tracking-wider text-text-tertiary">Progres</span>
          <div className="flex items-center gap-2 mt-2">
            <ProgressRing percent={checklistPercentage} size={38} strokeWidth={3} />
            <div>
              <span className="text-lg font-display font-bold text-text-primary leading-none">{checklistPercentage}<span className="text-xs">%</span></span>
              <p className="text-[8px] text-text-tertiary">{completedChecklistCount}/{totalChecklistCount}</p>
            </div>
          </div>
        </div>
        <div className="glass-panel p-3 flex flex-col justify-between">
          <span className="text-[8px] font-bold uppercase tracking-wider text-text-tertiary">Anggaran</span>
          <div className="mt-2">
            <span className="text-sm font-display font-bold text-text-primary leading-none">{formatIDR(totalActualSpent)}</span>
          </div>
          <div className="flex items-center gap-1 mt-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${isBudgetSafe ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <span className={`text-[9px] font-bold ${isBudgetSafe ? 'text-emerald-600' : 'text-rose-600'}`}>
              {isBudgetSafe ? 'Aman' : 'Overbudget!'}
            </span>
          </div>
        </div>
      </div>



      {/* ============================================ */}
      {/* 4. BUDGET LINE CHART (Glass)                 */}
      {/* ============================================ */}
      <div className="glass-chart p-5 animate-fade-up" style={{ animationDelay: '0.3s' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-text-tertiary">Tren Pengeluaran per Fase</h4>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp size={13} className={isBudgetSafe ? 'text-emerald-500' : 'text-rose-500'} />
            <span className={`text-[10px] font-bold ${isBudgetSafe ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatIDR(totalActualSpent)} {isBudgetSafe ? '(Aman)' : '(Over!)'}
            </span>
          </div>
        </div>

        {/* SVG Line Chart */}
        <div className="w-full overflow-hidden">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 10}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
            {/* Grid lines */}
            {[0.25, 0.5, 0.75].map((ratio, i) => (
              <line
                key={i}
                x1={chartPadding}
                y1={chartHeight - chartPadding / 2 - ratio * chartInnerHeight}
                x2={chartWidth - chartPadding}
                y2={chartHeight - chartPadding / 2 - ratio * chartInnerHeight}
                stroke="rgba(42, 92, 77, 0.06)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            ))}
            
            {/* Area fill under the line */}
            <path
              d={chartAreaD}
              fill="url(#chartGradient)"
              opacity="0.4"
            />
            
            {/* The line itself */}
            <path
              d={chartPathD}
              fill="none"
              stroke="rgba(42, 92, 77, 0.5)"
              strokeWidth="2.5"
              strokeLinecap="round"
              style={{ filter: 'drop-shadow(0 1px 3px rgba(42, 92, 77, 0.2))' }}
            />
            
            {/* Data points */}
            {chartPathPoints.map((point, i) => (
              <g key={i}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={i + 1 === activePhaseId ? 5 : 3.5}
                  fill={i + 1 === activePhaseId ? 'rgba(42, 92, 77, 0.9)' : 'rgba(42, 92, 77, 0.4)'}
                  stroke="white"
                  strokeWidth="2"
                  style={{ filter: i + 1 === activePhaseId ? 'drop-shadow(0 0 4px rgba(42, 92, 77, 0.4))' : 'none' }}
                />
                {/* Phase label below point */}
                <text
                  x={point.x}
                  y={chartHeight + 6}
                  textAnchor="middle"
                  fontSize="7"
                  fill="rgba(114, 132, 126, 0.8)"
                  fontFamily="Inter, sans-serif"
                  fontWeight="600"
                >
                  Fase {i + 1}
                </text>
              </g>
            ))}
            
            {/* Gradient definition */}
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(42, 92, 77, 0.25)" />
                <stop offset="100%" stopColor="rgba(42, 92, 77, 0.02)" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* ============================================ */}
      {/* 5. TIP HARIAN + CTA BUTTONS                  */}
      {/* ============================================ */}
      <div className="glass-panel p-4 flex items-start gap-3 cursor-pointer hover:shadow-lg transition-shadow animate-fade-up"
        onClick={() => setActiveTip((prev) => (prev + 1) % tips.length)}
        title="Klik untuk melihat tip berikutnya"
        style={{ animationDelay: '0.35s' }}
      >
        <div className="bg-white/60 p-2 rounded-xl text-brand-600 border border-white/50 shadow-sm shrink-0 backdrop-blur-sm">
          <Sparkles size={18} className="fill-brand-100" />
        </div>
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-brand-600/80">Tip Pranikah Hari Ini</h4>
          <p className="text-xs text-text-secondary mt-0.5 font-medium leading-relaxed">
            {tips[activeTip]}
          </p>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-up" style={{ animationDelay: '0.4s' }}>
        <button
          onClick={() => onNavigate("checklist")}
          className="py-3 px-4 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg transition-all cursor-pointer hover:shadow-xl hover:-translate-y-0.5"
        >
          Mulai fase {activePhaseId} ↗
        </button>
        <button
          onClick={() => setShowVaccineModal(true)}
          className="py-3 px-4 glass-panel hover:shadow-lg text-text-primary font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:-translate-y-0.5"
        >
          Jadwal vaksin ↗
        </button>
        <button
          onClick={() => setShowKuaModal(true)}
          className="py-3 px-4 glass-panel hover:shadow-lg text-text-primary font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:-translate-y-0.5"
        >
          Panduan KUA ↗
        </button>
      </div>

      {/* ============================================ */}
      {/* VACCINATION SCHEDULE POPUP MODAL              */}
      {/* ============================================ */}
      {showVaccineModal && (
        <div className="fixed inset-0 bg-stone-950/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-surface-raised rounded-2xl border border-surface-border shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
            <div className="bg-brand-600 p-4 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Syringe size={18} />
                <h3 className="font-serif font-bold text-sm">Panduan & Jadwal Vaksinasi Pranikah Syar'i</h3>
              </div>
              <button 
                onClick={() => setShowVaccineModal(false)}
                className="p-1 hover:bg-surface-raised/10 rounded text-rose-100 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs overflow-y-auto text-text-secondary">
              <p className="leading-relaxed text-text-secondary font-medium">
                Pemberian imunisasi dan vaksinasi pramilu/pranikah merupakan bagian dari ikhtiar menjaga kesehatan jasmani keturunan (Hifzhun Nasl) yang dianjurkan dalam Islam.
              </p>
              
              <div className="space-y-3.5 divide-y divide-stone-100">
                <div className="pt-0">
                  <h4 className="font-bold text-brand-600 text-xs flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-600"></span>
                    1. Vaksin Tetanus Toksoid (TT) <span className="px-1.5 py-0.2 bg-rose-50 text-rose-600 rounded text-[9px] font-black border border-rose-150">Wajib KUA</span>
                  </h4>
                  <p className="mt-1 leading-relaxed text-text-secondary">
                    Sangat krusial untuk mencegah infeksi tetanus pada ibu saat melahirkan dan neonatus (bayi baru lahir). KUA mewajibkan bukti suntik TT (biasanya TT1 dan TT2 dengan selang waktu minimal 4 minggu) sebagai salah satu prasyarat administrasi resmi akad nikah.
                  </p>
                </div>

                <div className="pt-3">
                  <h4 className="font-bold text-text-primary text-xs flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-600"></span>
                    2. Vaksin MMR (Measles, Mumps, Rubella)
                  </h4>
                  <p className="mt-1 leading-relaxed text-text-secondary">
                    Melindungi dari bahaya Campak, Gondongan, dan terutama Rubella yang dapat menyebabkan cacat lahir bawaan (kebutaan, ketulian, kelainan jantung) pada janin. <strong className="text-stone-750">Harus selesai minimal 3 bulan sebelum hamil</strong> karena vaksin ini berbasis virus hidup dan tidak boleh diberikan kepada wanita hamil.
                  </p>
                </div>

                <div className="pt-3">
                  <h4 className="font-bold text-text-primary text-xs flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-600"></span>
                    3. Vaksin HPV (Human Papillomavirus)
                  </h4>
                  <p className="mt-1 leading-relaxed text-text-secondary">
                    Mencegah infeksi virus HPV penyebab kanker serviks (leher rahim) pada wanita. Paling efektif jika diberikan secara lengkap dalam 3 dosis sebelum aktif berhubungan seksual secara rutin.
                  </p>
                </div>

                <div className="pt-3">
                  <h4 className="font-bold text-text-primary text-xs flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-600"></span>
                    4. Vaksin Varisela & Hepatitis B
                  </h4>
                  <p className="mt-1 leading-relaxed text-text-secondary">
                    Mencegah cacar air berat pada ibu hamil dan mencegah penularan Hepatitis B (infeksi hati kronis) yang berisiko menular ke pasangan atau ditularkan dari ibu ke anak selama masa persalinan.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-surface-sunken border-t border-stone-150 flex justify-end shrink-0">
              <button
                onClick={() => setShowVaccineModal(false)}
                className="px-4 py-2 bg-brand-600 text-white font-bold rounded-xl text-xs hover:bg-[#985e49] transition-colors cursor-pointer border-none"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* KUA REGISTRATION GUIDE POPUP MODAL            */}
      {/* ============================================ */}
      {showKuaModal && (
        <div className="fixed inset-0 bg-stone-950/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-surface-raised rounded-2xl border border-surface-border shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
            <div className="bg-brand-600 p-4 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Info size={18} />
                <h3 className="font-serif font-bold text-sm">Panduan & Syarat Pendaftaran KUA</h3>
              </div>
              <button 
                onClick={() => setShowKuaModal(false)}
                className="p-1 hover:bg-surface-raised/10 rounded text-rose-100 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs overflow-y-auto text-text-secondary">
              <h4 className="font-serif font-bold text-text-primary text-sm">Alur Administrasi Pendaftaran Nikah Resmi</h4>
              
              <div className="space-y-4">
                <div className="bg-surface-sunken p-3 rounded-xl border border-surface-border space-y-1.5">
                  <span className="font-bold text-brand-600 uppercase tracking-wider text-[9px] block">Langkah 1: Pengantar RT/RW & Kelurahan (N1-N4)</span>
                  <p className="text-text-secondary leading-relaxed">
                    Minta Surat Pengantar Nikah dari RT dan RW setempat. Bawa surat pengantar tersebut bersama berkas KTP & KK ke Kantor Kelurahan domisili Anda untuk diterbitkan Formulir N1, N2, N3, dan N4.
                  </p>
                </div>

                <div className="bg-surface-sunken p-3 rounded-xl border border-surface-border space-y-1.5">
                  <span className="font-bold text-brand-600 uppercase tracking-wider text-[9px] block">Langkah 2: Cek Kesehatan & Imunisasi TT di Puskesmas</span>
                  <p className="text-text-secondary leading-relaxed">
                    Kunjungi Puskesmas atau rumah sakit rujukan terdekat untuk melakukan tes kesehatan pranikah dan mendapatkan suntikan imunisasi Tetanus Toksoid (TT). Surat keterangan imunisasi ini wajib disertakan saat mendaftar ke KUA.
                  </p>
                </div>

                <div className="bg-surface-sunken p-3 rounded-xl border border-surface-border space-y-1.5">
                  <span className="font-bold text-brand-600 uppercase tracking-wider text-[9px] block">Langkah 3: Pendaftaran ke KUA Kecamatan</span>
                  <p className="text-text-secondary leading-relaxed">
                    Serahkan semua berkas ke KUA Kecamatan tempat akad nikah dilangsungkan <strong className="text-stone-750">minimal 10 hari kerja</strong> sebelum akad. Jika pernikahan dilakukan di luar wilayah kecamatan domisili Anda, mintalah Surat Rekomendasi Nikah dari KUA asal domisili Anda terlebih dahulu.
                  </p>
                </div>

                <div className="bg-surface-sunken p-3 rounded-xl border border-surface-border space-y-1.5">
                  <span className="font-bold text-brand-600 uppercase tracking-wider text-[9px] block">Langkah 4: Mengikuti Kursus/Bimbingan Pranikah (Bimwin)</span>
                  <p className="text-text-secondary leading-relaxed">
                    Mengikuti pembekalan keluarga sakinah (bimbingan perkawinan) yang diselenggarakan oleh KUA setempat guna memahami hak, kewajiban, dan ilmu syar'i tentang membina rumah tangga islami.
                  </p>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <h5 className="font-bold text-text-primary text-xs">Dokumen Persyaratan Utama yang Wajib Disiapkan:</h5>
                <ul className="list-disc pl-5 space-y-1 text-stone-550 leading-relaxed">
                  <li>Fotocopy KTP & KK (masing-masing calon mempelai dan orang tua).</li>
                  <li>Fotocopy Akta Kelahiran & Ijazah Terakhir (calon mempelai).</li>
                  <li>Surat Pengantar Nikah (N1) dan berkas administrasi kelurahan pendukung (N2-N4).</li>
                  <li>Surat Keterangan Imunisasi TT (Wajib bagi mempelai wanita).</li>
                  <li>Pas foto latar biru: ukuran 2x3 (4 lembar) & 3x4 (4 lembar).</li>
                  <li>Fotocopy KTP Wali Nikah dan 2 orang Saksi Nikah.</li>
                </ul>
              </div>
            </div>

            <div className="p-4 bg-surface-sunken border-t border-stone-150 flex justify-end shrink-0">
              <button
                onClick={() => setShowKuaModal(false)}
                className="px-4 py-2 bg-brand-600 text-white font-bold rounded-xl text-xs hover:bg-[#985e49] transition-colors cursor-pointer border-none"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* MANDATORY WELCOME MODAL SETUP                */}
      {/* ============================================ */}
      {showWelcomeModal && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-lg flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-surface-raised rounded-2xl border border-surface-border p-6 md:p-8 max-w-lg w-full shadow-2xl relative">
            <div className="text-center mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider text-emerald-850 bg-emerald-50 border border-emerald-100 uppercase">
                Bismillah, Selamat Datang di Zawwaja
              </span>
              <h2 className="text-2xl font-serif font-black text-text-primary mt-3">Lengkapi Profil Akad Pernikahan</h2>
              <p className="text-text-secondary text-xs mt-1 leading-relaxed">
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
                <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">
                  Calon Pengantin Pria
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rian Hardi"
                  value={onboardFullName}
                  onChange={(e) => setOnboardFullName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-sunken rounded-lg border border-surface-border focus:outline-none focus:ring-2 focus:ring-brand-600 font-sans text-sm text-text-primary placeholder-stone-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">
                  Calon Pengantin Wanita
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Amira Syafira"
                  value={onboardPartnerName}
                  onChange={(e) => setOnboardPartnerName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-sunken rounded-lg border border-surface-border focus:outline-none focus:ring-2 focus:ring-brand-600 font-sans text-sm text-text-primary placeholder-stone-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">
                    Rencana Tanggal Akad Nikah
                  </label>
                  <input
                    type="date"
                    required
                    value={onboardWeddingDate}
                    onChange={(e) => setOnboardWeddingDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-sunken rounded-lg border border-surface-border focus:outline-none focus:ring-2 focus:ring-brand-600 font-mono text-xs text-text-primary"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">
                    Estimasi Anggaran (IDR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-text-secondary text-sm font-semibold">Rp</span>
                    <input
                      type="number"
                      required
                      min={1000000}
                      step={500000}
                      value={onboardTotalBudget}
                      onChange={(e) => setOnboardTotalBudget(Number(e.target.value))}
                      className="w-full pl-9 pr-3 py-2.5 bg-surface-sunken rounded-lg border border-surface-border focus:outline-none focus:ring-2 focus:ring-brand-600 font-mono text-xs text-text-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingOnboard}
                  className="w-full py-3 bg-brand-600 hover:bg-[#985e49] text-white font-semibold rounded-lg shadow-md transition-all duration-200 flex items-center justify-center cursor-pointer text-sm"
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
