import React, { useState, useEffect, useRef } from "react";
import { UserProfile } from "../types";
import { 
  subscribeToAuth, 
  db, 
  isMockMode, 
  handleFirestoreError, 
  OperationType 
} from "../lib/firebase";
import { 
  doc, 
  getDoc, 
  setDoc 
} from "firebase/firestore";
import { 
  Mail, 
  Sparkles, 
  AlertCircle, 
  Calendar, 
  MapPin, 
  Music, 
  Phone, 
  UserCheck, 
  Plus, 
  Trash, 
  Copy, 
  ExternalLink, 
  Volume2, 
  VolumeX, 
  Clock, 
  Heart, 
  Send, 
  Check, 
  Settings, 
  Camera, 
  Compass, 
  Coins, 
  Wallet,
  Play,
  Pause
} from "lucide-react";

interface UndanganProps {
  profile: UserProfile | null;
}

// Interfaces for our digital invitation data structure
interface StoryStage {
  id: string;
  title: string;
  date: string;
  description: string;
}

interface DigitalGuest {
  id: string;
  name: string;
  phoneNumber: string;
  domicile: string;
  category: string;
}

interface RsvpGreeting {
  id: string;
  name: string;
  status: "Hadir" | "Tidak Hadir";
  message: string;
  createdAt: string;
}

interface InvitationConfig {
  theme: "terracotta" | "alabaster" | "obsidian";
  bgMusicUrl: string;
  
  // Mempelai Pria (CPP)
  groomNickname: string;
  groomFullName: string;
  groomFather: string;
  groomMother: string;
  
  // Mempelai Wanita (CPW)
  brideNickname: string;
  brideFullName: string;
  brideFather: string;
  brideMother: string;
  
  // Akad Nikah
  akadDate: string;
  akadTimeStart: string;
  akadTimeEnd: string;
  akadLocationName: string;
  akadAddress: string;
  akadMapsUrl: string;
  
  // Resepsi
  resepsiDate: string;
  resepsiTimeStart: string;
  resepsiTimeEnd: string;
  resepsiLocationName: string;
  resepsiAddress: string;
  resepsiMapsUrl: string;
  
  // Streaming & Media
  streamUrl: string;
  
  // Amplop Digital
  bankName: string;
  bankAccountNumber: string;
  bankAccountOwner: string;
  qrisImageUrl: string;
  
  // Story & Guests
  loveStory: StoryStage[];
  guests: DigitalGuest[];
  greetings: RsvpGreeting[];
  
  // Custom message draft template
  messageTemplate: string;
}

const DEFAULT_CONFIG: InvitationConfig = {
  theme: "terracotta",
  bgMusicUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", // Neutral elegant test track
  
  groomNickname: "Rian",
  groomFullName: "Rian Hidayatullah, S.T.",
  groomFather: "Bapak H. Ahmad Fauzi",
  groomMother: "Ibu Hj. Siti Aminah",
  
  brideNickname: "Amira",
  brideFullName: "Amira Nur Latifah, S.Psi.",
  brideFather: "Bapak H. Muhammad Yusuf",
  brideMother: "Ibu Hj. Rahmawati",
  
  akadDate: "2026-08-22",
  akadTimeStart: "08:00",
  akadTimeEnd: "10:00",
  akadLocationName: "Masjid Al-Barkah",
  akadAddress: "Jl. Barakah No. 12, Kebayoran Baru, Jakarta Selatan",
  akadMapsUrl: "https://maps.google.com",
  
  resepsiDate: "2026-08-22",
  resepsiTimeStart: "11:00",
  resepsiTimeEnd: "14:00",
  resepsiLocationName: "Gedung Sakinah Walimah",
  resepsiAddress: "Jl. Sakinah No. 45, Kebayoran Baru, Jakarta Selatan",
  resepsiMapsUrl: "https://maps.google.com",
  
  streamUrl: "https://youtube.com/live-stream-placeholder",
  
  bankName: "BSI (Bank Syariah Indonesia)",
  bankAccountNumber: "7123456789",
  bankAccountOwner: "Rian Hidayatullah",
  qrisImageUrl: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=qris-payment-mock-zawwaja",
  
  loveStory: [
    { id: "1", title: "Proses Ta'aruf", date: "Januari 2026", description: "Bismillah, kami diperkenalkan melalui perantara keluarga kami secara syar'i." },
    { id: "2", title: "Khitbah (Lamaran)", date: "April 2026", description: "Pertemuan keluarga besar untuk melamar calon mempelai wanita." }
  ],
  guests: [
    { id: "1", name: "Ahmad Husaini", phoneNumber: "6285713071197", domicile: "Jakarta", category: "Keluarga" },
    { id: "2", name: "Ustadz Budi Pratama", phoneNumber: "", domicile: "Bandung", category: "VIP / Tokoh" }
  ],
  greetings: [
    { id: "1", name: "Fathur & Najwa", status: "Hadir", message: "Baarakallahu laka wa baaraka 'alayka wa jama'a baynakuma fii khair. Semoga berkah lahir batin Rian & Amira!", createdAt: "2026-06-02T10:00:00Z" }
  ],
  messageTemplate: "Assalamu'alaikum Wr. Wb.\n\nTanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i *{nama}* untuk menghadiri acara akad dan walimah pernikahan kami.\n\nBerikut link undangan digital personal Anda:\n{link}\n\nMerupakan suatu kebahagiaan bagi kami apabila Bapak/Ibu berkenan hadir mendoakan kami secara langsung.\n\nWassalamu'alaikum Wr. Wb."
};

export default function Undangan({ profile }: UndanganProps) {
  const [config, setConfig] = useState<InvitationConfig>(DEFAULT_CONFIG);
  const [activeEditorTab, setActiveEditorTab] = useState<"general" | "mempelai" | "acara" | "story" | "gift" | "guests">("general");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  // Guest & RSVP local states for editor
  const [newGuestName, setNewGuestName] = useState("");
  const [newGuestPhone, setNewGuestPhone] = useState("");
  const [newGuestDomicile, setNewGuestDomicile] = useState("");
  const [newGuestCategory, setNewGuestCategory] = useState("Keluarga");

  // Story local states for editor
  const [newStoryTitle, setNewStoryTitle] = useState("");
  const [newStoryDate, setNewStoryDate] = useState("");
  const [newStoryDesc, setNewStoryDesc] = useState("");

  // Live Phone Mockup Interactive States
  const [selectedPreviewGuest, setSelectedPreviewGuest] = useState<string>(""); // Selected guest to preview URL params
  const [phoneRsvpName, setPhoneRsvpName] = useState("");
  const [phoneRsvpStatus, setPhoneRsvpStatus] = useState<"Hadir" | "Tidak Hadir">("Hadir");
  const [phoneRsvpMessage, setPhoneRsvpMessage] = useState("");
  const [isPhoneCoverOpened, setIsPhoneCoverOpened] = useState(false);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [activePhoneSection, setActivePhoneSection] = useState<"home" | "details" | "story" | "gift" | "rsvp">("home");

  // Load invitation config from Firestore or LocalStorage
  const loadConfig = async () => {
    if (!profile?.uid) return;
    try {
      if (isMockMode) {
        const localData = localStorage.getItem(`zawwaja_invitation_config_${profile.uid}`);
        if (localData) {
          setConfig(JSON.parse(localData));
        } else {
          // Fallback to default, customize with user details if possible
          const customized = {
            ...DEFAULT_CONFIG,
            groomNickname: profile.fullName ? profile.fullName.split(" ")[0] : DEFAULT_CONFIG.groomNickname,
            groomFullName: profile.fullName || DEFAULT_CONFIG.groomFullName,
            brideNickname: profile.partnerName ? profile.partnerName.split(" ")[0] : DEFAULT_CONFIG.brideNickname,
            brideFullName: profile.partnerName || DEFAULT_CONFIG.brideFullName,
            akadDate: profile.weddingDate || DEFAULT_CONFIG.akadDate,
            resepsiDate: profile.weddingDate || DEFAULT_CONFIG.resepsiDate,
          };
          setConfig(customized);
        }
      } else {
        const docRef = doc(db, "invitations", profile.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setConfig(docSnap.data() as InvitationConfig);
        } else {
          const customized = {
            ...DEFAULT_CONFIG,
            groomNickname: profile.fullName ? profile.fullName.split(" ")[0] : DEFAULT_CONFIG.groomNickname,
            groomFullName: profile.fullName || DEFAULT_CONFIG.groomFullName,
            brideNickname: profile.partnerName ? profile.partnerName.split(" ")[0] : DEFAULT_CONFIG.brideNickname,
            brideFullName: profile.partnerName || DEFAULT_CONFIG.brideFullName,
            akadDate: profile.weddingDate || DEFAULT_CONFIG.akadDate,
            resepsiDate: profile.weddingDate || DEFAULT_CONFIG.resepsiDate,
          };
          setConfig(customized);
          await setDoc(docRef, customized);
        }
      }
    } catch (err) {
      console.error("Gagal memuat konfigurasi undangan:", err);
    }
  };

  useEffect(() => {
    loadConfig();
  }, [profile?.uid]);

  // Audio effect handler for Live Preview
  useEffect(() => {
    if (config.bgMusicUrl) {
      audioRef.current = new Audio(config.bgMusicUrl);
      audioRef.current.loop = true;
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [config.bgMusicUrl]);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlayingMusic) {
      audioRef.current.pause();
      setIsPlayingMusic(false);
    } else {
      audioRef.current.play().catch(e => console.log("Audio play blocked by browser policy"));
      setIsPlayingMusic(true);
    }
  };

  // Save changes handler
  const handleSaveConfig = async (updatedConfig: InvitationConfig) => {
    if (!profile?.uid) return;
    setIsSaving(true);
    setSaveStatus("idle");
    try {
      if (isMockMode) {
        localStorage.setItem(`zawwaja_invitation_config_${profile.uid}`, JSON.stringify(updatedConfig));
        setConfig(updatedConfig);
        setSaveStatus("success");
      } else {
        const docRef = doc(db, "invitations", profile.uid);
        await setDoc(docRef, updatedConfig);
        setConfig(updatedConfig);
        setSaveStatus("success");
      }
    } catch (err: any) {
      console.error("Gagal menyimpan konfigurasi:", err);
      setSaveStatus("error");
      if (!isMockMode) {
        handleFirestoreError(err, OperationType.UPDATE, `invitations/${profile.uid}`);
      }
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  // Input change helpers
  const updateField = (field: keyof InvitationConfig, value: any) => {
    const updated = { ...config, [field]: value };
    setConfig(updated);
  };

  // Story stage operations
  const handleAddStory = () => {
    if (!newStoryTitle || !newStoryDate || !newStoryDesc) return;
    const newStage: StoryStage = {
      id: Date.now().toString(),
      title: newStoryTitle,
      date: newStoryDate,
      description: newStoryDesc
    };
    const updatedStory = [...config.loveStory, newStage];
    const updatedConfig = { ...config, loveStory: updatedStory };
    handleSaveConfig(updatedConfig);
    
    // Clear inputs
    setNewStoryTitle("");
    setNewStoryDate("");
    setNewStoryDesc("");
  };

  const handleDeleteStory = (id: string) => {
    const updatedStory = config.loveStory.filter(s => s.id !== id);
    const updatedConfig = { ...config, loveStory: updatedStory };
    handleSaveConfig(updatedConfig);
  };

  // Guest operations
  const handleAddGuest = () => {
    if (!newGuestName) return;
    
    // Normalize phone number to country code 62 format
    let cleanPhone = newGuestPhone.replace(/\D/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "62" + cleanPhone.substring(1);
    } else if (cleanPhone && !cleanPhone.startsWith("62")) {
      cleanPhone = "62" + cleanPhone;
    }

    const newGuest: DigitalGuest = {
      id: Date.now().toString(),
      name: newGuestName,
      phoneNumber: cleanPhone,
      domicile: newGuestDomicile || "Umum",
      category: newGuestCategory
    };
    const updatedGuests = [...config.guests, newGuest];
    const updatedConfig = { ...config, guests: updatedGuests };
    handleSaveConfig(updatedConfig);

    // Clear inputs
    setNewGuestName("");
    setNewGuestPhone("");
    setNewGuestDomicile("");
    setNewGuestCategory("Keluarga");
  };

  const handleDeleteGuest = (id: string) => {
    const updatedGuests = config.guests.filter(g => g.id !== id);
    const updatedConfig = { ...config, guests: updatedGuests };
    handleSaveConfig(updatedConfig);
  };

  // WhatsApp click-to-chat URL generator
  const getWhatsAppUrl = (guest: DigitalGuest) => {
    if (!guest.phoneNumber) return "";
    const invitationLink = `https://zawwaja.id/undangan/${profile?.uid || "sample"}?to=${encodeURIComponent(guest.name)}`;
    const fullText = config.messageTemplate
      .replace(/{nama}/g, guest.name)
      .replace(/{alamat}/g, guest.domicile)
      .replace(/{link}/g, invitationLink);
    
    return `https://api.whatsapp.com/send?phone=${guest.phoneNumber}&text=${encodeURIComponent(fullText)}`;
  };

  const handleCopyLink = (guest: DigitalGuest) => {
    const invitationLink = `https://zawwaja.id/undangan/${profile?.uid || "sample"}?to=${encodeURIComponent(guest.name)}`;
    navigator.clipboard.writeText(invitationLink);
    setCopyStatus(guest.id);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const handleCopyMessage = (guest: DigitalGuest) => {
    const invitationLink = `https://zawwaja.id/undangan/${profile?.uid || "sample"}?to=${encodeURIComponent(guest.name)}`;
    const fullText = config.messageTemplate
      .replace(/{nama}/g, guest.name)
      .replace(/{alamat}/g, guest.domicile)
      .replace(/{link}/g, invitationLink);
    navigator.clipboard.writeText(fullText);
    setCopyStatus(`msg-${guest.id}`);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  // Submit RSVP inside Mobile Mockup
  const handlePhoneRsvpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneRsvpName || !phoneRsvpMessage) return;

    const newGreeting: RsvpGreeting = {
      id: Date.now().toString(),
      name: phoneRsvpName,
      status: phoneRsvpStatus,
      message: phoneRsvpMessage,
      createdAt: new Date().toISOString()
    };

    const updatedGreetings = [newGreeting, ...config.greetings];
    const updatedConfig = { ...config, greetings: updatedGreetings };
    handleSaveConfig(updatedConfig);

    // Reset rsvp inputs inside mockup
    setPhoneRsvpName("");
    setPhoneRsvpMessage("");
    alert("Bismillah, ucapan selamat & konfirmasi kehadiran Anda berhasil terekam!");
  };

  // Theme specific style parameters
  const themeColors = {
    terracotta: {
      bg: "bg-[#FAF7F5]",
      primary: "bg-[#af7661]",
      hover: "hover:bg-[#915c4a]",
      text: "text-[#572309]",
      lightAccent: "bg-[#e3c8ba]/20",
      borderAccent: "border-[#c9937d]/35",
      buttonText: "text-white"
    },
    alabaster: {
      bg: "bg-[#FAFAF9]",
      primary: "bg-[#78716C]",
      hover: "hover:bg-[#57534E]",
      text: "text-[#292524]",
      lightAccent: "bg-[#E7E5E4]/40",
      borderAccent: "border-[#D6D3D1]",
      buttonText: "text-white"
    },
    obsidian: {
      bg: "bg-[#1C1917]",
      primary: "bg-[#c9937d]",
      hover: "hover:bg-[#af7661]",
      text: "text-white",
      lightAccent: "bg-[#44403C]/70",
      borderAccent: "border-[#78716C]/50",
      buttonText: "text-stone-900 font-bold"
    }
  }[config.theme];

  // Simulated countdown values
  const [countdown, setCountdown] = useState({ days: 120, hours: 8, minutes: 45 });
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59 };
        if (prev.days > 0) return { days: prev.days - 1, hours: 23, minutes: 59 };
        return prev;
      });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start my-4 w-full" id="invitation-engine">
      
      {/* LEFT SIDEBAR: DASHBOARD EDITOR (60% Width) */}
      <div className="w-full lg:w-3/5 bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-6">
        
        {/* Header Branding */}
        <div className="flex justify-between items-center pb-4 border-b border-stone-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#af7661]/10 flex items-center justify-center text-[#af7661]">
              <Mail size={18} className="stroke-[2]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-900 font-serif uppercase tracking-wider">Digital Invitation Studio</h2>
              <p className="text-[10px] text-stone-400">Desain, kelola tamu, dan sebar undangan sakinah syar'i Anda</p>
            </div>
          </div>
          
          <button
            onClick={() => handleSaveConfig(config)}
            disabled={isSaving}
            className="px-3.5 py-1.5 bg-[#af7661] hover:bg-[#915c4a] text-white text-[11px] font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer border-none outline-none"
          >
            {isSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Menyimpan...
              </>
            ) : saveStatus === "success" ? (
              <>
                <Check size={14} className="stroke-[2.5]" />
                Tersimpan!
              </>
            ) : (
              <>
                <Check size={14} className="stroke-[2.5]" />
                Simpan & Update
              </>
            )}
          </button>
        </div>

        {/* Tab Selectors */}
        <div className="flex flex-wrap gap-1 p-1 bg-stone-50 border border-stone-200/80 rounded-xl overflow-hidden text-xs">
          {[
            { id: "general", label: "Tema & Musik", icon: Music },
            { id: "mempelai", label: "Mempelai", icon: Heart },
            { id: "acara", label: "Jadwal & Lokasi", icon: Calendar },
            { id: "story", label: "Kisah Cinta", icon: Camera },
            { id: "gift", label: "Kado Digital", icon: Coins },
            { id: "guests", label: "Daftar Tamu & WA", icon: Phone }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveEditorTab(tab.id as any)}
                className={`px-3 py-2 flex items-center gap-1.5 rounded-lg font-semibold transition-all cursor-pointer border-none outline-none ${
                  activeEditorTab === tab.id
                    ? "bg-white text-[#af7661] shadow-xs"
                    : "text-stone-500 hover:text-stone-850"
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* EDITOR CARDS CONTENT */}
        <div className="bg-stone-50/40 border border-stone-200/50 rounded-2xl p-5 min-h-[300px]">
          
          {/* TAB 1: GENERAL (THEME & MUSIC) */}
          {activeEditorTab === "general" && (
            <div className="space-y-5 animate-fade-in text-xs">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wide">Kustomisasi Tema & Suasana</h3>
              
              {/* Select Theme Grid */}
              <div>
                <label className="block font-bold text-stone-500 mb-2 uppercase tracking-wide text-[10px]">Pilih Palet Tema Undangan</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "terracotta", name: "Terracotta Elegant", desc: "Hangat, etnik & sakinah", border: "border-[#af7661]/40", bg: "bg-[#FAF7F5]" },
                    { id: "alabaster", name: "Golden Alabaster", desc: "Putih, bersih & minimalis", border: "border-[#78716C]", bg: "bg-[#FAFAF9]" },
                    { id: "obsidian", name: "Obsidian Classic", desc: "Hitam, tegas & premium", border: "border-[#c9937d]", bg: "bg-[#1C1917]" }
                  ].map(themeOpt => (
                    <button
                      key={themeOpt.id}
                      onClick={() => updateField("theme", themeOpt.id)}
                      className={`p-3 text-left rounded-xl border-2 transition-all flex flex-col justify-between cursor-pointer ${
                        config.theme === themeOpt.id
                          ? `${themeOpt.border} bg-white shadow-xs`
                          : "border-stone-200 bg-white hover:bg-stone-50"
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="font-bold text-stone-800 text-[11px]">{themeOpt.name}</span>
                        <div className={`w-4 h-4 rounded-full ${themeOpt.bg} border border-stone-300 shadow-2xs`}></div>
                      </div>
                      <p className="text-[9px] text-stone-400 mt-2">{themeOpt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Backgroud Music Track Input */}
              <div className="space-y-1.5">
                <label className="block font-bold text-stone-500 uppercase tracking-wide text-[10px]">Link Musik Latar (.mp3)</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={config.bgMusicUrl}
                    onChange={(e) => updateField("bgMusicUrl", e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#af7661]"
                    placeholder="https://tautan-audio-anda.mp3"
                  />
                  <button
                    onClick={toggleMusic}
                    className="px-3.5 py-2 border border-stone-200 bg-white hover:bg-stone-50 rounded-xl text-stone-500 cursor-pointer"
                    title={isPlayingMusic ? "Mute" : "Play"}
                  >
                    {isPlayingMusic ? <VolumeX size={15} /> : <Volume2 size={15} />}
                  </button>
                </div>
                <p className="text-[10px] text-stone-400 mt-1">Masukkan URL lagu instrumen akad/walimah format `.mp3`. Klik ikon speaker di samping untuk menguji coba musik di pratinjau Anda.</p>
              </div>
            </div>
          )}

          {/* TAB 2: MEMPELAI (GROOM & BRIDE INFORMATION) */}
          {activeEditorTab === "mempelai" && (
            <div className="space-y-6 animate-fade-in text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Mempelai Pria CPP */}
                <div className="space-y-3.5 bg-white p-4 rounded-xl border border-stone-200/60 shadow-2xs">
                  <div className="flex items-center space-x-2 border-b border-stone-100 pb-2">
                    <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px]">♂</span>
                    <h4 className="font-bold text-stone-850">Mempelai Pria (CPP)</h4>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Nama Panggilan</label>
                    <input
                      type="text"
                      required
                      value={config.groomNickname}
                      onChange={(e) => updateField("groomNickname", e.target.value)}
                      className="w-full px-3 py-1.8 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#af7661]"
                      placeholder="e.g. Rian"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Nama Lengkap & Gelar</label>
                    <input
                      type="text"
                      required
                      value={config.groomFullName}
                      onChange={(e) => updateField("groomFullName", e.target.value)}
                      className="w-full px-3 py-1.8 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#af7661]"
                      placeholder="e.g. Rian Hidayatullah, S.T."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Nama Ayah</label>
                      <input
                        type="text"
                        value={config.groomFather}
                        onChange={(e) => updateField("groomFather", e.target.value)}
                        className="w-full px-3 py-1.8 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#af7661]"
                        placeholder="Bapak..."
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Nama Ibu</label>
                      <input
                        type="text"
                        value={config.groomMother}
                        onChange={(e) => updateField("groomMother", e.target.value)}
                        className="w-full px-3 py-1.8 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#af7661]"
                        placeholder="Ibu..."
                      />
                    </div>
                  </div>
                </div>

                {/* Mempelai Wanita CPW */}
                <div className="space-y-3.5 bg-white p-4 rounded-xl border border-stone-200/60 shadow-2xs">
                  <div className="flex items-center space-x-2 border-b border-stone-100 pb-2">
                    <span className="w-5 h-5 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-[10px]">♀</span>
                    <h4 className="font-bold text-stone-850">Mempelai Wanita (CPW)</h4>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Nama Panggilan</label>
                    <input
                      type="text"
                      required
                      value={config.brideNickname}
                      onChange={(e) => updateField("brideNickname", e.target.value)}
                      className="w-full px-3 py-1.8 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#af7661]"
                      placeholder="e.g. Amira"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Nama Lengkap & Gelar</label>
                    <input
                      type="text"
                      required
                      value={config.brideFullName}
                      onChange={(e) => updateField("brideFullName", e.target.value)}
                      className="w-full px-3 py-1.8 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#af7661]"
                      placeholder="e.g. Amira Nur Latifah, S.Psi."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Nama Ayah</label>
                      <input
                        type="text"
                        value={config.brideFather}
                        onChange={(e) => updateField("brideFather", e.target.value)}
                        className="w-full px-3 py-1.8 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#af7661]"
                        placeholder="Bapak..."
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Nama Ibu</label>
                      <input
                        type="text"
                        value={config.brideMother}
                        onChange={(e) => updateField("brideMother", e.target.value)}
                        className="w-full px-3 py-1.8 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#af7661]"
                        placeholder="Ibu..."
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: ACARA (EVENT JADWAL & LOKASI) */}
          {activeEditorTab === "acara" && (
            <div className="space-y-6 animate-fade-in text-xs">
              
              {/* Akad Event */}
              <div className="bg-white p-4 rounded-xl border border-stone-200/60 shadow-2xs space-y-3.5">
                <h4 className="font-bold text-stone-850 border-b border-stone-100 pb-2">Acara 1: Akad Nikah</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Tanggal</label>
                    <input
                      type="date"
                      value={config.akadDate}
                      onChange={(e) => updateField("akadDate", e.target.value)}
                      className="w-full px-3 py-1.8 border border-stone-200 rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Mulai</label>
                    <input
                      type="time"
                      value={config.akadTimeStart}
                      onChange={(e) => updateField("akadTimeStart", e.target.value)}
                      className="w-full px-3 py-1.8 border border-stone-200 rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Selesai</label>
                    <input
                      type="time"
                      value={config.akadTimeEnd}
                      onChange={(e) => updateField("akadTimeEnd", e.target.value)}
                      className="w-full px-3 py-1.8 border border-stone-200 rounded-lg focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Nama Tempat Venue</label>
                    <input
                      type="text"
                      value={config.akadLocationName}
                      onChange={(e) => updateField("akadLocationName", e.target.value)}
                      className="w-full px-3 py-1.8 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#af7661]"
                      placeholder="e.g. Masjid Al-Barkah"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Tautan Google Maps</label>
                    <input
                      type="url"
                      value={config.akadMapsUrl}
                      onChange={(e) => updateField("akadMapsUrl", e.target.value)}
                      className="w-full px-3 py-1.8 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#af7661]"
                      placeholder="e.g. https://goo.gl/maps/..."
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Alamat Lengkap</label>
                  <input
                    type="text"
                    value={config.akadAddress}
                    onChange={(e) => updateField("akadAddress", e.target.value)}
                    className="w-full px-3 py-1.8 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#af7661]"
                    placeholder="e.g. Jalan Barakah Raya No. 12"
                  />
                </div>
              </div>

              {/* Resepsi Event */}
              <div className="bg-white p-4 rounded-xl border border-stone-200/60 shadow-2xs space-y-3.5">
                <h4 className="font-bold text-stone-850 border-b border-stone-100 pb-2">Acara 2: Resepsi Pernikahan</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Tanggal</label>
                    <input
                      type="date"
                      value={config.resepsiDate}
                      onChange={(e) => updateField("resepsiDate", e.target.value)}
                      className="w-full px-3 py-1.8 border border-stone-200 rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Mulai</label>
                    <input
                      type="time"
                      value={config.resepsiTimeStart}
                      onChange={(e) => updateField("resepsiTimeStart", e.target.value)}
                      className="w-full px-3 py-1.8 border border-stone-200 rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Selesai</label>
                    <input
                      type="time"
                      value={config.resepsiTimeEnd}
                      onChange={(e) => updateField("resepsiTimeEnd", e.target.value)}
                      className="w-full px-3 py-1.8 border border-stone-200 rounded-lg focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Nama Tempat Venue</label>
                    <input
                      type="text"
                      value={config.resepsiLocationName}
                      onChange={(e) => updateField("resepsiLocationName", e.target.value)}
                      className="w-full px-3 py-1.8 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#af7661]"
                      placeholder="e.g. Gedung Sakinah Walimah"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Tautan Google Maps</label>
                    <input
                      type="url"
                      value={config.resepsiMapsUrl}
                      onChange={(e) => updateField("resepsiMapsUrl", e.target.value)}
                      className="w-full px-3 py-1.8 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#af7661]"
                      placeholder="e.g. https://goo.gl/maps/..."
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Alamat Lengkap</label>
                  <input
                    type="text"
                    value={config.resepsiAddress}
                    onChange={(e) => updateField("resepsiAddress", e.target.value)}
                    className="w-full px-3 py-1.8 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#af7661]"
                    placeholder="e.g. Jalan Sakinah Raya No. 45"
                  />
                </div>
              </div>

              {/* Streaming details */}
              <div className="bg-white p-4 rounded-xl border border-stone-200/60 shadow-2xs space-y-3">
                <h4 className="font-bold text-stone-850 border-b border-stone-100 pb-2">Penyiaran Siaran Langsung (Streaming)</h4>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Tautan Siaran Langsung (YouTube/Zoom/IG Live)</label>
                  <input
                    type="url"
                    value={config.streamUrl}
                    onChange={(e) => updateField("streamUrl", e.target.value)}
                    className="w-full px-3 py-1.8 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#af7661]"
                    placeholder="e.g. https://youtube.com/..."
                  />
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: LOVE STORY TIMELINE */}
          {activeEditorTab === "story" && (
            <div className="space-y-5 animate-fade-in text-xs">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wide">Linimasa Perjalanan Cinta (Kisah Ta'aruf / Khitbah)</h3>
              
              {/* Existing Story List */}
              <div className="space-y-3">
                {config.loveStory.map((stage) => (
                  <div key={stage.id} className="flex justify-between items-start bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-850">{stage.title}</span>
                        <span className="text-[9px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-500 font-mono font-semibold">{stage.date}</span>
                      </div>
                      <p className="text-[10px] text-stone-500 leading-relaxed">{stage.description}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteStory(stage.id)}
                      className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-stone-55 transition-colors cursor-pointer shrink-0 border-none bg-transparent"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                ))}
                {config.loveStory.length === 0 && (
                  <div className="text-center p-6 bg-white border border-stone-200 rounded-xl text-stone-400 italic">
                    Belum ada linimasa kisah yang dimasukkan.
                  </div>
                )}
              </div>

              {/* Add Story Form */}
              <div className="bg-white p-4 rounded-xl border border-stone-250/70 shadow-2xs space-y-3.5">
                <h4 className="font-bold text-stone-850 border-b border-stone-100 pb-2">Tambah Kisah Baru</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Judul Tahapan</label>
                    <input
                      type="text"
                      value={newStoryTitle}
                      onChange={(e) => setNewStoryTitle(e.target.value)}
                      className="w-full px-3 py-1.8 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#af7661]"
                      placeholder="e.g. Pertama Bertemu / Ta'aruf"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Waktu / Tanggal</label>
                    <input
                      type="text"
                      value={newStoryDate}
                      onChange={(e) => setNewStoryDate(e.target.value)}
                      className="w-full px-3 py-1.8 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#af7661]"
                      placeholder="e.g. Januari 2026"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Cerita Singkat</label>
                  <textarea
                    value={newStoryDesc}
                    onChange={(e) => setNewStoryDesc(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-1.8 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#af7661] resize-none font-sans"
                    placeholder="Tuliskan kisah singkat perjalanan syar'i Anda..."
                  />
                </div>
                <button
                  onClick={handleAddStory}
                  className="px-3.5 py-1.8 bg-[#af7661] hover:bg-[#915c4a] text-white text-[11px] font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer border-none"
                >
                  <Plus size={14} />
                  Tambah Kisah
                </button>
              </div>

            </div>
          )}

          {/* TAB 5: GIFT ENVELOPE CONFIG */}
          {activeEditorTab === "gift" && (
            <div className="space-y-5 animate-fade-in text-xs">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wide">Amplop Digital & Kado Nikah Pernikahan</h3>
              
              <div className="bg-white p-4 rounded-xl border border-stone-200/60 shadow-2xs space-y-3.5">
                <h4 className="font-bold text-stone-850 border-b border-stone-100 pb-2">Rincian Rekening Bank / E-Wallet</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Nama Bank / E-Wallet</label>
                    <input
                      type="text"
                      value={config.bankName}
                      onChange={(e) => updateField("bankName", e.target.value)}
                      className="w-full px-3 py-1.8 border border-stone-200 rounded-lg focus:outline-none"
                      placeholder="e.g. BSI / Bank Mandiri / GoPay"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Nomor Rekening / HP</label>
                    <input
                      type="text"
                      value={config.bankAccountNumber}
                      onChange={(e) => updateField("bankAccountNumber", e.target.value)}
                      className="w-full px-3 py-1.8 border border-stone-200 rounded-lg focus:outline-none"
                      placeholder="e.g. 7123456789"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Nama Pemilik Rekening</label>
                    <input
                      type="text"
                      value={config.bankAccountOwner}
                      onChange={(e) => updateField("bankAccountOwner", e.target.value)}
                      className="w-full px-3 py-1.8 border border-stone-200 rounded-lg focus:outline-none"
                      placeholder="e.g. Rian Hidayatullah"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-stone-200/60 shadow-2xs space-y-3.5">
                <h4 className="font-bold text-stone-850 border-b border-stone-100 pb-2">Simulasi Link QRIS Pembayaran</h4>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Tautan Gambar QRIS (Image URL)</label>
                  <input
                    type="url"
                    value={config.qrisImageUrl}
                    onChange={(e) => updateField("qrisImageUrl", e.target.value)}
                    className="w-full px-3 py-1.8 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#af7661]"
                    placeholder="https://api.qrserver.com/..."
                  />
                </div>
                <p className="text-[10px] text-stone-400 leading-relaxed">QRIS akan di-generate otomatis untuk pratinjau kado dari tamu. Anda bisa menyalin URL gambar QRIS Anda di atas.</p>
              </div>

            </div>
          )}

          {/* TAB 6: GUEST LIST & WHATSAPP BLAST GENERATOR */}
          {activeEditorTab === "guests" && (
            <div className="space-y-5 animate-fade-in text-xs">
              
              {/* Message Template Editor */}
              <div className="bg-white p-4 rounded-xl border border-stone-250/70 shadow-2xs space-y-3">
                <h4 className="font-bold text-stone-850 border-b border-stone-100 pb-2">Draft Template Undangan WhatsApp</h4>
                <textarea
                  value={config.messageTemplate}
                  onChange={(e) => updateField("messageTemplate", e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2.5 bg-stone-50/50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#af7661] resize-none font-mono text-[10.5px]"
                  placeholder="Template teks kirim WA..."
                />
                <div className="flex gap-4 text-[9px] text-stone-400 font-semibold uppercase tracking-wider bg-stone-50 p-2 rounded-lg justify-center">
                  <span>💡 Gunakan Tags:</span>
                  <span>`{nama}` = Nama Tamu</span>
                  <span>`{alamat}` = Domisili</span>
                  <span>`{link}` = Tautan Undangan</span>
                </div>
              </div>

              {/* Add New Guest */}
              <div className="bg-white p-4 rounded-xl border border-stone-200/60 shadow-2xs space-y-3.5">
                <h4 className="font-bold text-stone-850 border-b border-stone-100 pb-2">Tambah Tamu Digital Baru</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-stone-400 mb-1">Nama Tamu</label>
                    <input
                      type="text"
                      value={newGuestName}
                      onChange={(e) => setNewGuestName(e.target.value)}
                      className="w-full px-3 py-1.8 border border-stone-200 rounded-lg focus:outline-none"
                      placeholder="Nama Tamu"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-stone-400 mb-1">No. WhatsApp</label>
                    <input
                      type="tel"
                      value={newGuestPhone}
                      onChange={(e) => setNewGuestPhone(e.target.value)}
                      className="w-full px-3 py-1.8 border border-stone-200 rounded-lg focus:outline-none"
                      placeholder="e.g. 0857..."
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-stone-400 mb-1">Domisili / Kategori</label>
                    <input
                      type="text"
                      value={newGuestDomicile}
                      onChange={(e) => setNewGuestDomicile(e.target.value)}
                      className="w-full px-3 py-1.8 border border-stone-200 rounded-lg focus:outline-none"
                      placeholder="Tempat"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider text-stone-400 mb-1">Kelompok</label>
                    <select
                      value={newGuestCategory}
                      onChange={(e) => setNewGuestCategory(e.target.value)}
                      className="w-full px-3 py-1.8 border border-stone-200 rounded-lg focus:outline-none"
                    >
                      <option value="Keluarga">Keluarga</option>
                      <option value="Sahabat">Sahabat</option>
                      <option value="Rekan Kerja">Rekan Kerja</option>
                      <option value="VIP / Tokoh">VIP / Tokoh</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={handleAddGuest}
                  className="px-3.5 py-1.8 bg-[#af7661] hover:bg-[#915c4a] text-white text-[11px] font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer border-none"
                >
                  <Plus size={14} />
                  Tambah Tamu
                </button>
              </div>

              {/* Guest Lists & WhatsApp click actions */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1 font-bold text-stone-500 uppercase tracking-wider text-[10px]">
                  <span>Daftar Tamu Aktif ({config.guests.length})</span>
                  <span>Tindakan Pengiriman WA</span>
                </div>
                
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {config.guests.map((guest) => (
                    <div key={guest.id} className="flex justify-between items-center bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs hover:border-[#c9937d]/30 transition-all">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-850">{guest.name}</span>
                          <span className="text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 font-bold">{guest.category}</span>
                        </div>
                        <p className="text-[10px] text-stone-400">Domisili: {guest.domicile} • Tel: {guest.phoneNumber || "Tidak ada nomor"}</p>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedPreviewGuest(guest.name)}
                          className="px-2 py-1.2 border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 rounded-lg text-[10px] font-semibold transition-all cursor-pointer"
                        >
                          Lihat HP
                        </button>
                        
                        <button
                          onClick={() => handleCopyLink(guest)}
                          className="p-1.5 border border-stone-250 hover:border-[#af7661] bg-white hover:bg-stone-50 text-stone-500 hover:text-[#af7661] rounded-lg transition-colors cursor-pointer"
                          title="Salin Link Undangan"
                        >
                          {copyStatus === guest.id ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        </button>

                        <button
                          onClick={() => handleCopyMessage(guest)}
                          className="p-1.5 border border-stone-250 hover:border-[#af7661] bg-white hover:bg-stone-50 text-stone-500 hover:text-[#af7661] rounded-lg transition-colors cursor-pointer"
                          title="Salin Isi Pesan Lengkap"
                        >
                          {copyStatus === `msg-${guest.id}` ? <Check size={14} className="text-emerald-600" /> : <Mail size={14} />}
                        </button>

                        {guest.phoneNumber && (
                          <a
                            href={getWhatsAppUrl(guest)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-lg transition-colors cursor-pointer shadow-xs flex items-center justify-center border-none"
                            title="Kirim via WhatsApp"
                          >
                            <Send size={14} />
                          </a>
                        )}
                        
                        <button
                          onClick={() => handleDeleteGuest(guest.id)}
                          className="p-1.5 border border-stone-200 bg-white hover:bg-stone-50 text-stone-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Tamu"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {config.guests.length === 0 && (
                    <div className="text-center p-6 bg-white border border-stone-200 rounded-xl text-stone-400 italic">
                      Belum ada tamu digital yang didaftarkan.
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* RIGHT SIDEBAR: INTERACTIVE LIVE MOBILE PREVIEW MOCKUP (40% Width) */}
      <div className="w-full lg:w-2/5 flex flex-col items-center shrink-0">
        
        {/* Helper info banner */}
        <div className="w-full max-w-[340px] bg-stone-100/80 border border-stone-200 rounded-xl p-3.5 mb-4 text-center">
          <span className="text-[10px] uppercase font-bold text-[#af7661] tracking-wider block mb-1">Live smartphone Mockup</span>
          <p className="text-[10px] text-stone-500 leading-relaxed">Merender undangan secara live sesuai data yang Anda simpan. Gunakan tombol pratinjau di kiri untuk menguji parameter.</p>
        </div>

        {/* 3D-Like Smartphone Container */}
        <div className="max-w-[340px] w-full min-h-[600px] rounded-[2.8rem] border-[10px] border-stone-850 shadow-2xl relative bg-[#FAF9F6] overflow-hidden flex flex-col font-sans transition-all duration-300">
          
          {/* Top Notch Area */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-stone-850 rounded-b-2xl z-50 flex items-center justify-center">
            <div className="w-12 h-1 bg-stone-700/80 rounded-full mb-1"></div>
            <div className="w-2.5 h-2.5 bg-stone-800 rounded-full absolute right-6 top-1"></div>
          </div>

          {/* Music Floating controls */}
          {isPlayingMusic && (
            <button 
              onClick={toggleMusic}
              className="absolute bottom-16 right-4 w-9 h-9 rounded-full bg-white/90 text-[#af7661] shadow-md flex items-center justify-center animate-spin z-40 border-none outline-none cursor-pointer"
            >
              <Music size={16} />
            </button>
          )}

          {/* MOCKUP SCREEN LAYER */}
          <div className="flex-1 flex flex-col h-full overflow-y-auto relative pt-8 pb-14 text-[#333333] text-xs">
            
            {/* STEP A: COVER SCREEN (Before Open) */}
            {!isPhoneCoverOpened ? (
              <div className="absolute inset-0 bg-[#FAF9F6] bg-gradient-to-b from-white via-[#FAF9F6] to-[#e3c8ba]/10 flex flex-col justify-between p-6 text-center z-40 animate-fade-in">
                
                <div className="mt-8 flex flex-col items-center">
                  {/* Calligraphy logo seal */}
                  <img src="/logo.png" alt="Zawwaja logo" className="w-20 h-20 object-contain drop-shadow-md mb-4" />
                  <span className="text-[9px] uppercase font-bold tracking-widest text-[#af7661]">Walimatul 'Ursy</span>
                  <h3 className="text-xl font-serif font-bold text-[#572309] mt-2">
                    {config.groomNickname} & {config.brideNickname}
                  </h3>
                </div>

                {/* Cover info */}
                <div className="space-y-4">
                  <div className="p-3 bg-white/80 border border-[#e3c8ba]/30 rounded-2xl shadow-xs">
                    <p className="text-[10px] text-stone-500 font-semibold mb-1">Kepada Yth. Bapak/Ibu/Sdr/i:</p>
                    <h4 className="text-sm font-bold text-[#572309] truncate">
                      {selectedPreviewGuest || "Tamu Undangan Premium"}
                    </h4>
                    {newGuestDomicile && <p className="text-[9px] text-stone-400 mt-0.5">di {newGuestDomicile}</p>}
                  </div>
                  
                  <button
                    onClick={() => {
                      setIsPhoneCoverOpened(true);
                      // Auto play music on cover open
                      if (audioRef.current) {
                        audioRef.current.play().catch(e => console.log("Play failed"));
                        setIsPlayingMusic(true);
                      }
                    }}
                    className={`w-full py-2.8 text-white font-bold rounded-xl shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 border-none ${themeColors.primary} ${themeColors.hover}`}
                  >
                    <Mail size={14} />
                    Buka Undangan
                  </button>
                </div>
              </div>
            ) : (
              
              /* STEP B: ACTIVE WEDDING INVITATION (After Open) */
              <div className={`flex-1 flex flex-col justify-between ${themeColors.bg} transition-colors animate-fade-in`}>
                
                {/* Simulated Screen Body */}
                <div className="p-5 space-y-6">
                  
                  {/* Home Section */}
                  {activePhoneSection === "home" && (
                    <div className="text-center space-y-5 animate-fade-in">
                      <div className="flex flex-col items-center">
                        <img src="/logo.png" alt="Zawwaja Crest" className="w-16 h-16 object-contain drop-shadow-sm mb-3" />
                        <span className="text-[8px] uppercase font-bold tracking-widest text-[#af7661]">Walimatul 'Ursy</span>
                        <h3 className="text-lg font-serif font-bold text-[#572309] mt-1">{config.groomNickname} & {config.brideNickname}</h3>
                      </div>
                      
                      {/* Quranic Quote */}
                      <div className="p-4 bg-white/70 border border-[#e3c8ba]/20 rounded-xl space-y-2">
                        <p className="text-[14px] font-arabic leading-relaxed text-[#572309] text-center">وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُمْ مِنْ أَنْفُسِكُمْ أَزْوَاجًا لِتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُمْ مَوَدَّةً وَرَحْمَةً</p>
                        <p className="text-[9px] text-stone-500 italic leading-relaxed text-center">"Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu isteri-isteri dari jenismu sendiri, supaya kamu cenderung dan merasa tenteram kepadanya..." (QS. Ar-Rum: 21)</p>
                      </div>

                      {/* Countdown Box */}
                      <div className="p-3 bg-white/90 border border-stone-200 rounded-xl">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-stone-500 mb-2">Menuju Hari Sakinah</p>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-[#FAF7F5] p-2 rounded-lg">
                            <span className="text-base font-bold text-[#572309] font-mono">{countdown.days}</span>
                            <span className="block text-[8px] text-stone-400">Hari</span>
                          </div>
                          <div className="bg-[#FAF7F5] p-2 rounded-lg">
                            <span className="text-base font-bold text-[#572309] font-mono">{countdown.hours}</span>
                            <span className="block text-[8px] text-stone-400">Jam</span>
                          </div>
                          <div className="bg-[#FAF7F5] p-2 rounded-lg">
                            <span className="text-base font-bold text-[#572309] font-mono">{countdown.minutes}</span>
                            <span className="block text-[8px] text-stone-400">Menit</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Details Section (Akad / Resepsi / Maps) */}
                  {activePhoneSection === "details" && (
                    <div className="space-y-4 animate-fade-in">
                      <h4 className="font-bold text-center text-[#572309] font-serif uppercase tracking-wider text-[11px] mb-2">Jadwal & Lokasi Walimah</h4>
                      
                      {/* Akad Card */}
                      <div className="bg-white/95 p-4 rounded-xl border border-[#e3c8ba]/30 shadow-2xs space-y-2">
                        <div className="flex justify-between items-center border-b border-stone-100 pb-1.5">
                          <span className="font-bold text-[#af7661]">1. Akad Nikah</span>
                          <Clock size={12} className="text-stone-400" />
                        </div>
                        <p className="text-[10px] font-bold font-mono text-stone-700">{config.akadDate}</p>
                        <p className="text-[10px] text-stone-500">Pukul {config.akadTimeStart} - {config.akadTimeEnd} WIB</p>
                        <p className="text-[10px] text-stone-600 font-bold">{config.akadLocationName}</p>
                        <p className="text-[9px] text-stone-400 leading-snug">{config.akadAddress}</p>
                        <a 
                          href={config.akadMapsUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="mt-2 inline-flex items-center gap-1 text-[9px] font-bold text-[#af7661] hover:underline"
                        >
                          <MapPin size={11} /> Buka Google Maps <ExternalLink size={9} />
                        </a>
                      </div>

                      {/* Resepsi Card */}
                      <div className="bg-white/95 p-4 rounded-xl border border-[#e3c8ba]/30 shadow-2xs space-y-2">
                        <div className="flex justify-between items-center border-b border-stone-100 pb-1.5">
                          <span className="font-bold text-[#af7661]">2. Resepsi Walimah</span>
                          <Calendar size={12} className="text-stone-400" />
                        </div>
                        <p className="text-[10px] font-bold font-mono text-stone-700">{config.resepsiDate}</p>
                        <p className="text-[10px] text-stone-500">Pukul {config.resepsiTimeStart} - {config.resepsiTimeEnd} WIB</p>
                        <p className="text-[10px] text-stone-600 font-bold">{config.resepsiLocationName}</p>
                        <p className="text-[9px] text-stone-400 leading-snug">{config.resepsiAddress}</p>
                        <a 
                          href={config.resepsiMapsUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="mt-2 inline-flex items-center gap-1 text-[9px] font-bold text-[#af7661] hover:underline"
                        >
                          <MapPin size={11} /> Buka Google Maps <ExternalLink size={9} />
                        </a>
                      </div>

                      {/* Livestreaming Button */}
                      {config.streamUrl && (
                        <a 
                          href={config.streamUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2 bg-[#ea4335] text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-2xs hover:opacity-95"
                        >
                          <Play size={11} /> Nonton Siaran Langsung (Live)
                        </a>
                      )}
                    </div>
                  )}

                  {/* Love Story Section */}
                  {activePhoneSection === "story" && (
                    <div className="space-y-4 animate-fade-in">
                      <h4 className="font-bold text-center text-[#572309] font-serif uppercase tracking-wider text-[11px] mb-2">Kisah Cinta Mempelai</h4>
                      
                      <div className="relative pl-6 border-l border-[#c9937d]/40 space-y-4 ml-2">
                        {config.loveStory.map((stage, idx) => (
                          <div key={stage.id} className="relative space-y-1">
                            {/* Bullet */}
                            <div className="absolute -left-[30px] top-1 w-4 h-4 rounded-full bg-white border-2 border-[#af7661] flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#af7661]"></div>
                            </div>
                            <div className="bg-white/80 p-3 rounded-lg border border-stone-200/80 shadow-2xs">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-[#572309] text-[10.5px]">{stage.title}</span>
                                <span className="text-[8px] font-mono text-stone-400 font-bold">{stage.date}</span>
                              </div>
                              <p className="text-[9.5px] text-stone-500 mt-1 leading-snug">{stage.description}</p>
                            </div>
                          </div>
                        ))}
                        {config.loveStory.length === 0 && (
                          <div className="text-center p-6 bg-white/70 border border-stone-200 rounded-xl text-stone-400 italic">
                            Belum ada linimasa kisah.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Kado Digital Section */}
                  {activePhoneSection === "gift" && (
                    <div className="space-y-4 animate-fade-in">
                      <h4 className="font-bold text-center text-[#572309] font-serif uppercase tracking-wider text-[11px] mb-2">Amplop Digital & Kado Nikah</h4>
                      
                      <div className="bg-white/95 p-4 rounded-xl border border-[#e3c8ba]/30 shadow-2xs text-center space-y-3.5">
                        <div className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center mx-auto text-[#af7661]">
                          <Wallet size={16} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">Salin Nomor Rekening / E-Wallet</p>
                          <h5 className="font-bold text-[#572309] font-mono text-[13px]">{config.bankAccountNumber}</h5>
                          <p className="text-[9px] text-stone-500 font-bold">{config.bankName} a.n {config.bankAccountOwner}</p>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(config.bankAccountNumber);
                            alert("Bismillah, nomor rekening disalin!");
                          }}
                          className="px-4 py-1.5 bg-stone-50 hover:bg-stone-100 text-stone-700 font-bold rounded-lg border border-stone-200 text-[10px] inline-flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Copy size={11} /> Salin Rekening
                        </button>
                      </div>

                      {config.qrisImageUrl && (
                        <div className="bg-white/95 p-4 rounded-xl border border-[#e3c8ba]/30 shadow-2xs text-center space-y-2.5">
                          <p className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">Scan QRIS Kado Nikah</p>
                          <img src={config.qrisImageUrl} alt="QRIS Sakinah" className="w-32 h-32 mx-auto object-contain border border-stone-200 p-1.5 rounded-lg" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* RSVP & Buku Tamu Section */}
                  {activePhoneSection === "rsvp" && (
                    <div className="space-y-4 animate-fade-in">
                      <h4 className="font-bold text-center text-[#572309] font-serif uppercase tracking-wider text-[11px] mb-2">RSVP & Ucapan Tamu</h4>
                      
                      {/* RSVP Form */}
                      <form onSubmit={handlePhoneRsvpSubmit} className="bg-white/95 p-4 rounded-xl border border-stone-250 shadow-2xs space-y-3">
                        <div>
                          <label className="block text-[9px] font-bold uppercase tracking-wider text-stone-500 mb-1">Nama Pengirim</label>
                          <input
                            type="text"
                            required
                            value={phoneRsvpName}
                            onChange={(e) => setPhoneRsvpName(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-stone-200 rounded-lg text-[10.5px] focus:outline-none"
                            placeholder="Nama Anda"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setPhoneRsvpStatus("Hadir")}
                            className={`py-1.5 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                              phoneRsvpStatus === "Hadir"
                                ? "bg-[#af7661]/10 border-[#af7661] text-[#af7661]"
                                : "bg-white border-stone-200 text-stone-500"
                            }`}
                          >
                            Hadir
                          </button>
                          <button
                            type="button"
                            onClick={() => setPhoneRsvpStatus("Tidak Hadir")}
                            className={`py-1.5 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                              phoneRsvpStatus === "Tidak Hadir"
                                ? "bg-[#af7661]/10 border-[#af7661] text-[#af7661]"
                                : "bg-white border-stone-200 text-stone-500"
                            }`}
                          >
                            Tidak Hadir
                          </button>
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold uppercase tracking-wider text-stone-500 mb-1">Pesan Doa & Ucapan</label>
                          <textarea
                            required
                            value={phoneRsvpMessage}
                            onChange={(e) => setPhoneRsvpMessage(e.target.value)}
                            rows={3}
                            className="w-full px-2.5 py-1.5 border border-stone-200 rounded-lg text-[10.5px] focus:outline-none resize-none font-sans"
                            placeholder="Kirimkan doa terbaik Anda untuk kedua mempelai..."
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2 bg-[#af7661] hover:bg-[#915c4a] text-white text-[10px] font-bold rounded-lg shadow-xs flex items-center justify-center gap-1.5 border-none cursor-pointer"
                        >
                          <Send size={11} /> Kirim RSVP & Doa
                        </button>
                      </form>

                      {/* Display Greetings list */}
                      <div className="space-y-2 pt-2">
                        <p className="font-bold text-stone-500 uppercase tracking-wider text-[9px] px-1">Ucapan & Doa ({config.greetings.length})</p>
                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                          {config.greetings.map((greet) => (
                            <div key={greet.id} className="bg-white/80 p-3 rounded-lg border border-stone-200/80 shadow-2xs space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-[#572309] text-[10px]">{greet.name}</span>
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                                  greet.status === "Hadir" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                }`}>{greet.status}</span>
                              </div>
                              <p className="text-[9.5px] text-stone-500 leading-snug">{greet.message}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Simulated Bottom Navigation Bar on screen */}
                <div className="h-12 bg-white/95 backdrop-blur-xs border-t border-stone-200/80 flex items-center justify-around z-30 shrink-0 sticky bottom-0">
                  {[
                    { id: "home", label: "Cover", icon: Heart },
                    { id: "details", label: "Jadwal", icon: Calendar },
                    { id: "story", label: "Kisah", icon: Camera },
                    { id: "gift", label: "Kado", icon: Coins },
                    { id: "rsvp", label: "RSVP", icon: UserCheck }
                  ].map(sec => {
                    const Icon = sec.icon;
                    return (
                      <button
                        key={sec.id}
                        onClick={() => setActivePhoneSection(sec.id as any)}
                        className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer border-none bg-transparent ${
                          activePhoneSection === sec.id
                            ? "text-[#af7661] scale-105"
                            : "text-stone-400 hover:text-stone-600"
                        }`}
                      >
                        <Icon size={14} className="mb-0.5" />
                        <span className="text-[7.5px] font-bold">{sec.label}</span>
                      </button>
                    );
                  })}
                </div>

              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
