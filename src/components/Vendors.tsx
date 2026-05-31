import React, { useState } from "react";
import { VendorItem } from "../types";
import { 
  Building, 
  Plus, 
  Trash2, 
  MessageSquare, 
  Instagram, 
  Globe, 
  ExternalLink,
  RotateCcw,
  Search,
  Filter
} from "lucide-react";

interface VendorsProps {
  vendors: VendorItem[];
  onSaveVendor: (vendor: VendorItem) => Promise<void>;
  onDeleteVendor: (id: string) => Promise<void>;
  onClearAll: () => Promise<void>;
  onResetDefaults: () => Promise<void>;
}

export default function Vendors({ vendors, onSaveVendor, onDeleteVendor, onClearAll, onResetDefaults }: VendorsProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("Semua");

  // Input states
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Catering");
  const [contact, setContact] = useState("");
  const [socialMedia, setSocialMedia] = useState("");
  const [notes, setNotes] = useState("");

  const categories = ["Semua", "Venue", "Catering", "Rias & Busana", "Dokumentasi", "Dekorasi", "MC Syar'i", "Lainnya"];

  const handleAddNewVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !contact) return;

    const newVendor: VendorItem = {
      id: "vendor-" + Math.random().toString(36).substring(2, 9),
      name,
      category,
      contact,
      socialMedia,
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await onSaveVendor(newVendor);

    // Reset fields
    setName("");
    setContact("");
    setSocialMedia("");
    setNotes("");
    setShowAddForm(false);
  };

  // Filter items
  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          vendor.notes.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === "Semua" || vendor.category.trim().toLowerCase() === activeCategory.trim().toLowerCase();
    return matchesSearch && matchesCategory;
  });

  // Direct WhatsApp hyperlink redirect generator
  const getWhatsAppLink = (phone: string) => {
    let cleanPhone = phone.replace(/[^0-9]/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "62" + cleanPhone.slice(1);
    }
    return `https://wa.me/${cleanPhone}?text=Bismillah,%20Halo%20Zawwaja.id%20Vendor%20Partnership.%20Saya%20tertarik%20dengan%20layanan%20Anda.`;
  };

  return (
    <div className="space-y-6" id="vendors-view">
      
      {/* Page Title & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-stone-900">Manajemen Kontak Vendor</h2>
          <p className="text-stone-500 text-xs mt-0.5">Pendataan terpusat portofolio vendor, akun media sosial, dan negosiasi kontrak akad pernikahan</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center shadow-sm cursor-pointer"
          >
            <Plus size={16} className="mr-1.5" />
            Tambah Kontak Vendor
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
            Hapus Semua Kontak
          </button>
        </div>
      </div>

      {/* Add Custom Vendor Form inline panel */}
      {showAddForm && (
        <form onSubmit={handleAddNewVendor} className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-md space-y-4">
          <h3 className="font-bold text-emerald-950 text-sm font-serif">Simpan Detail Rekanan Vendor</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Nama Perusahaan/Vendor</label>
              <input
                type="text"
                required
                placeholder="Contoh: Sakinah Catering & Co"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-stone-50 rounded border border-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-stone-50 rounded border border-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                {categories.filter(c => c !== "Semua").map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Kontak Telp/WA</label>
              <input
                type="text"
                required
                placeholder="081xxxxxxxxxx"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-stone-50 rounded border border-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Instagram (@) atau website link</label>
              <input
                type="text"
                placeholder="Ketik username @sakinah_catering"
                value={socialMedia}
                onChange={(e) => setSocialMedia(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-stone-50 rounded border border-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Catatan Tambahan (Ketentuan DP, Menu, Paket)</label>
              <input
                type="text"
                placeholder="Tulis negosiasi pembayaran, tanggal pelunasan, diskon tambahan..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-stone-50 rounded border border-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
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
              Simpan Vendor
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search parameters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-stone-400" size={16} />
          <input
            type="text"
            placeholder="Cari nama vendor atau catatan nego..."
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

      {/* Grid of vendors */}
      {filteredVendors.length === 0 ? (
        <div className="bg-white border border-stone-200 p-12 rounded-2xl text-center text-stone-400 space-y-2">
          <Building size={36} className="mx-auto text-stone-200" />
          <h4 className="font-semibold text-stone-900 text-sm">Direktori Vendor Masih Kosong</h4>
          <p className="text-xs">Silakan muat vendor default Islami atau tambahkan secara manual milik Anda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVendors.map(vendor => (
            <div key={vendor.id} className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-emerald-500 hover:shadow transition-all relative group">
              
              <button
                onClick={() => onDeleteVendor(vendor.id)}
                className="absolute top-4 right-4 text-stone-300 hover:text-rose-600 transition-colors p-1 rounded"
                title="Hapus Kontak Vendor"
              >
                <Trash2 size={16} />
              </button>

              <div className="space-y-3">
                <div className="space-y-1 pr-6">
                  <span className="text-[9px] uppercase font-bold tracking-wide px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded">
                    {vendor.category}
                  </span>
                  <h4 className="font-bold text-stone-950 text-base font-serif mt-1">{vendor.name}</h4>
                </div>

                {vendor.notes && (
                  <p className="text-stone-600 text-xs bg-stone-50 p-2.5 rounded-lg border border-stone-100 italic">
                    "{vendor.notes}"
                  </p>
                )}

                <div className="space-y-1.5 text-xs text-stone-500 border-t border-stone-100 pt-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={14} className="text-emerald-600 shrink-0" />
                    <span className="truncate">{vendor.contact}</span>
                  </div>

                  {vendor.socialMedia && (
                    <div className="flex items-center gap-2">
                      <Instagram size={14} className="text-amber-600 shrink-0" />
                      <span className="truncate">{vendor.socialMedia}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action trigger links */}
              <div className="flex gap-2 mt-5 pt-3 border-t border-stone-50 text-xs">
                <a
                  href={getWhatsAppLink(vendor.contact)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-lg text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-sm text-[11px]"
                >
                  <MessageSquare size={12} />
                  Hubungi WA Mitra
                </a>

                {vendor.socialMedia && (
                  <a
                    href={`https://instagram.com/${vendor.socialMedia.replace("@", "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 bg-stone-100 hover:bg-amber-100 hover:text-amber-900 text-stone-600 rounded-lg flex items-center justify-center cursor-pointer"
                    title="Buka Instagram Vendor"
                  >
                    <Instagram size={14} />
                  </a>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
