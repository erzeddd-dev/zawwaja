import React, { useState } from "react";
import { GuestItem } from "../types";
import { 
  Users, 
  Plus, 
  Trash2, 
  Mail, 
  FileText, 
  Search, 
  Filter, 
  RotateCcw,
  CheckCircle,
  MessageSquare
} from "lucide-react";

interface GuestsProps {
  guests: GuestItem[];
  onSaveGuest: (guest: GuestItem) => Promise<void>;
  onDeleteGuest: (id: string) => Promise<void>;
  onClearAll: () => Promise<void>;
  onResetDefaults: () => Promise<void>;
}

export default function Guests({ guests, onSaveGuest, onDeleteGuest, onClearAll, onResetDefaults }: GuestsProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("Semua");

  // Input states
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState<GuestItem["relationship"]>("Keluarga");
  const [invitationType, setInvitationType] = useState<GuestItem["invitationType"]>("Digital");
  const [notes, setNotes] = useState("");
  const [isRsvp, setIsRsvp] = useState(false);

  const categories = ["Semua", "Keluarga", "Sahabat", "Rekan Kerja", "Tetangga", "Lainnya"];

  const handleAddNewGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const newGuest: GuestItem = {
      id: "guest-" + Math.random().toString(36).substring(2, 9),
      name,
      relationship,
      invitationType,
      isRsvp,
      notes: notes || "-",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await onSaveGuest(newGuest);

    // Reset fields
    setName("");
    setNotes("");
    setIsRsvp(false);
    setShowAddForm(false);
  };

  const handleToggleRsvp = async (guest: GuestItem) => {
    const updated = {
      ...guest,
      isRsvp: !guest.isRsvp,
      updatedAt: new Date().toISOString()
    };
    await onSaveGuest(updated);
  };

  // Filter items
  const filteredGuests = guests.filter(guest => {
    const matchesSearch = guest.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (guest.notes && guest.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = activeCategory === "Semua" || guest.relationship === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Aggregated analytics
  const totalInvited = guests.length;
  const totalRsvpConfirmed = guests.filter(g => g.isRsvp).length;
  const totalDigital = guests.filter(g => g.invitationType === "Digital").length;
  const totalPrinted = guests.filter(g => g.invitationType === "Cetak").length;

  return (
    <div className="space-y-6" id="guests-view">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-stone-900">Manajemen Daftar Tamu</h2>
          <p className="text-stone-500 text-xs mt-0.5">Klasifikasi hubungan keluarga/rekan, model undangan cetak/digital, serta pengelolaan konfirmasi kehadiran (RSVP)</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center shadow-sm cursor-pointer"
          >
            <Plus size={16} className="mr-1.5" />
            Tambah Daftar Tamu
          </button>
          
          <button
            onClick={onResetDefaults}
            className="px-3.5 py-2 border border-emerald-200 text-emerald-800 bg-emerald-100/30 hover:bg-emerald-100 text-xs font-semibold rounded-lg flex items-center cursor-pointer"
          >
            <RotateCcw size={14} className="mr-1.5" />
            Muat Default
          </button>

          <button
            onClick={onClearAll}
            className="px-3.5 py-2 border border-rose-200 text-rose-800 bg-rose-50 hover:bg-rose-100 text-xs font-semibold rounded-lg flex items-center cursor-pointer"
          >
            <Trash2 size={14} className="mr-1.5" />
            Kosongkan Daftar
          </button>
        </div>
      </div>

      {/* Add Guest Form Inline drawer */}
      {showAddForm && (
        <form onSubmit={handleAddNewGuest} className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-md space-y-4">
          <h3 className="font-bold text-emerald-950 text-sm font-serif">Pendaftaran Tamu Undangan Baru</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Nama Lengkap Tamu</label>
              <input
                type="text"
                required
                placeholder="Contoh: Ustadz Adi Hidayat / Ahmad Husaini & Istri"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-stone-50 rounded border border-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Hubungan Pertemanan</label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value as GuestItem["relationship"])}
                className="w-full px-3 py-1.5 text-xs bg-stone-50 rounded border border-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                {categories.filter(c => c !== "Semua").map(rel => (
                  <option key={rel} value={rel}>{rel}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Jenis Undangan</label>
              <select
                value={invitationType}
                onChange={(e) => setInvitationType(e.target.value as GuestItem["invitationType"])}
                className="w-full px-3 py-1.5 text-xs bg-stone-50 rounded border border-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                <option value="Digital">Digital / E-Invitation Link</option>
                <option value="Cetak">Cetak / Kartu Undangan Fisik</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Catatan Domisili / Kerabat Siapa</label>
              <input
                type="text"
                placeholder="Contoh: Domisili Depok, Sahabat dekat CPP S1"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-stone-50 rounded border border-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-stone-700">
                <input
                  type="checkbox"
                  checked={isRsvp}
                  onChange={(e) => setIsRsvp(e.target.checked)}
                  className="w-4 h-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                />
                Sudah Konfirmasi Hadir (RSVP)
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-1.5 border border-stone-200 text-stone-500 rounded text-xs hover:bg-stone-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-700 text-white rounded text-xs font-semibold hover:bg-emerald-800 cursor-pointer"
            >
              Masukkan Daftar
            </button>
          </div>
        </form>
      )}

      {/* Analytics stats banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-white border border-stone-200 p-4 rounded-xl shadow-sm">
          <span className="text-[10px] text-stone-400 font-bold uppercase block tracking-wider">Total Tamu Diundang</span>
          <span className="text-xl font-bold font-mono text-stone-900 mt-1 block">{totalInvited} Orang</span>
        </div>

        <div className="bg-white border border-stone-200 p-4 rounded-xl shadow-sm">
          <span className="text-[10px] text-stone-400 font-bold uppercase block tracking-wider">Konfirmasi RSVP Hadir</span>
          <span className="text-xl font-bold font-mono text-emerald-800 mt-1 block">{totalRsvpConfirmed} Orang</span>
        </div>

        <div className="bg-white border border-stone-200 p-4 rounded-xl shadow-sm">
          <span className="text-[10px] text-stone-400 font-bold uppercase block tracking-wider">Undangan Digital</span>
          <span className="text-xl font-bold font-mono text-blue-900 mt-1 block">{totalDigital} Tamu</span>
        </div>

        <div className="bg-white border border-stone-200 p-4 rounded-xl shadow-sm">
          <span className="text-[10px] text-stone-400 font-bold uppercase block tracking-wider">Undangan Cetak/Fisik</span>
          <span className="text-xl font-bold font-mono text-zinc-900 mt-1 block">{totalPrinted} Tamu</span>
        </div>

      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-stone-400" size={16} />
          <input
            type="text"
            placeholder="Cari nama tamu undangan atau catatan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 shrink-0">
          <Filter size={14} className="text-stone-400 shrink-0" />
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold select-none transition-all cursor-pointer ${
                activeCategory === cat 
                  ? "bg-emerald-700 text-white" 
                  : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid Table area */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
        
        {filteredGuests.length === 0 ? (
          <div className="p-12 text-center text-stone-400 space-y-2">
            <Users size={36} className="mx-auto text-stone-200" />
            <h4 className="font-semibold text-stone-900 text-sm">Tamu Undangan Terfilter Tidak Ditemukan</h4>
            <p className="text-xs">Klik "Muat Default" atau silakan tambahkan data tamu secara manual.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                  <th className="p-4 w-16 text-center">RSVP</th>
                  <th className="p-4">Nama Tamu Undangan</th>
                  <th className="p-4">Klasifikasi</th>
                  <th className="p-4">Jenis Undangan</th>
                  <th className="p-4">Catatan Identifikasi / Domisili</th>
                  <th className="p-4 w-12 text-center">Hapus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredGuests.map(guest => (
                  <tr key={guest.id} className={`hover:bg-stone-50/50 ${guest.isRsvp ? "bg-emerald-50/10" : ""}`}>
                    
                    {/* Check RSVP */}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleToggleRsvp(guest)}
                        className={`w-6 h-6 rounded-full border flex items-center justify-center mx-auto transition-colors cursor-pointer ${
                          guest.isRsvp 
                            ? "bg-emerald-600 border-emerald-600 text-white" 
                            : "bg-white border-stone-300 text-stone-300 hover:border-emerald-500"
                        }`}
                        title={guest.isRsvp ? "Konfirm Hadir" : "Tandai Hadir"}
                      >
                        {guest.isRsvp && <CheckCircle size={14} />}
                      </button>
                    </td>

                    {/* Nama */}
                    <td className="p-4">
                      <span className={`font-semibold text-stone-900 text-sm ${guest.isRsvp ? "text-emerald-800" : ""}`}>
                        {guest.name}
                      </span>
                    </td>

                    {/* Klasifikasi */}
                    <td className="p-4">
                      <span className="font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full text-[10px] border border-stone-200">
                        {guest.relationship}
                      </span>
                    </td>

                    {/* Undangan */}
                    <td className="p-4">
                      {guest.invitationType === "Digital" ? (
                        <span className="text-[10px] bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded font-bold inline-flex items-center gap-1">
                          <Mail size={12} className="shrink-0" />
                          Link Digital
                        </span>
                      ) : (
                        <span className="text-[10px] bg-zinc-50 text-zinc-800 border border-zinc-200 px-2 py-0.5 rounded font-bold inline-flex items-center gap-1">
                          <FileText size={12} className="shrink-0" />
                          Undangan Fisik
                        </span>
                      )}
                    </td>

                    {/* Catatan / Domisili */}
                    <td className="p-4 text-stone-500 italic max-w-xs truncate">{guest.notes || "-"}</td>

                    {/* Aksi delete */}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => onDeleteGuest(guest.id)}
                        className="text-stone-300 hover:text-rose-600 transition-colors p-1"
                        title="Hapus baris"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
}
