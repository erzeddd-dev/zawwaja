import React, { useState } from "react";
import { MaharItem } from "../types";
import { 
  Gift, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Coins, 
  Link2,
  RotateCcw,
  CheckCircle2,
  ShoppingBag
} from "lucide-react";

interface MaharProps {
  items: MaharItem[];
  onSaveItem: (item: MaharItem) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  onClearAll: () => Promise<void>;
  onResetDefaults: () => Promise<void>;
}

export default function Mahar({ items, onSaveItem, onDeleteItem, onClearAll, onResetDefaults }: MaharProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  // New item states
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [ecommerceLink, setEcommerceLink] = useState("");
  const [isJewelry, setIsJewelry] = useState(false);
  const [price, setPrice] = useState("");
  const [jewelryWeight, setJewelryWeight] = useState("");
  const [jewelryPricePerGram, setJewelryPricePerGram] = useState("");

  const handleAddNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    // Calculate final price based on type
    let calculatedPrice = Number(price) || 0;
    let finalWeight = Number(jewelryWeight) || 0;
    let finalPricePerGram = Number(jewelryPricePerGram) || 0;

    if (isJewelry) {
      calculatedPrice = finalWeight * finalPricePerGram;
    }

    const newItem: MaharItem = {
      id: "mahar-" + Math.random().toString(36).substring(2, 9),
      name,
      brand: brand || "-",
      ecommerceLink: ecommerceLink || "",
      price: calculatedPrice,
      isJewelry,
      jewelryWeight: isJewelry ? finalWeight : 0,
      jewelryPricePerGram: isJewelry ? finalPricePerGram : 0,
      isPurchased: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await onSaveItem(newItem);

    // Reset fields
    setName("");
    setBrand("");
    setEcommerceLink("");
    setIsJewelry(false);
    setPrice("");
    setJewelryWeight("");
    setJewelryPricePerGram("");
    setShowAddForm(false);
  };

  const handleToggleBought = async (item: MaharItem) => {
    const updated = {
      ...item,
      isPurchased: !item.isPurchased,
      updatedAt: new Date().toISOString()
    };
    await onSaveItem(updated);
  };

  // Aggregated totals
  const totalCostCombined = items.reduce((acc, curr) => acc + (curr.price || 0), 0);
  const totalPurchasedCost = items.filter(i => i.isPurchased).reduce((acc, curr) => acc + (curr.price || 0), 0);
  
  // Jewelry statistics
  const goldItems = items.filter(i => i.isJewelry);
  const totalGoldWeight = goldItems.reduce((acc, curr) => acc + (curr.jewelryWeight || 0), 0);

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(num);
  };

  return (
    <div className="space-y-6" id="mahar-view">
      
      {/* Page header title & controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-stone-900">Mahar & Seserahan Pernikahan</h2>
          <p className="text-stone-500 text-xs mt-0.5">Pendataan mahar/mas kawin dan pernak-pernik seserahan syar'i beserta kalkulator emas murni</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center shadow-sm cursor-pointer"
          >
            <Plus size={16} className="mr-1.5" />
            Tambah Barang Seserahan
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

      {/* Interactive Form panel */}
      {showAddForm && (
        <form onSubmit={handleAddNewItem} className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-md space-y-4">
          <h3 className="font-bold text-emerald-950 text-sm font-serif">Tambah Mahar / Seserahan Baru</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Deskripsi Barang</label>
              <input
                type="text"
                required
                placeholder="Contoh: Logam Mulia Mas Kawin, Sajadah, etc..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-stone-50 rounded border border-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Brand / Merek / Toko</label>
              <input
                type="text"
                placeholder="Contoh: Antam, Wardah, Zara, dll..."
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-stone-50 rounded border border-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Tautan E-commerce / Link Belanja</label>
              <input
                type="url"
                placeholder="https://tokopedia.com/..."
                value={ecommerceLink}
                onChange={(e) => setEcommerceLink(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-stone-50 rounded border border-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-emerald-950">
                <input
                  type="checkbox"
                  checked={isJewelry}
                  onChange={(e) => setIsJewelry(e.target.checked)}
                  className="w-4 h-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                />
                ⚠️ Kategori Emas / Perhiasan Logam Mulia
              </label>
              <p className="text-[10px] text-emerald-800">Centang apabila barang ini adalah perhiasan untuk memunculkan hitungan berat gram secara otomatis</p>
            </div>

            {!isJewelry ? (
              <div className="w-full md:w-64">
                <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Harga Beli Riil (IDR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-stone-400">Rp</span>
                  <input
                    type="number"
                    placeholder="Contoh: 750000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white rounded border border-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>
            ) : (
              <div className="flex gap-3 w-full md:w-auto">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Berat (Gram)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Contoh: 5"
                    value={jewelryWeight}
                    onChange={(e) => setJewelryWeight(e.target.value)}
                    className="w-24 px-3 py-1.5 text-xs bg-white rounded border border-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">Harga per Gram</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs text-stone-400 font-bold">Rp</span>
                    <input
                      type="number"
                      placeholder="Contoh: 1300000"
                      value={jewelryPricePerGram}
                      onChange={(e) => setJewelryPricePerGram(e.target.value)}
                      className="w-36 pl-7 pr-2 py-1.5 text-xs bg-white rounded border border-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>
                </div>
                {/* Visual computed feedback */}
                <div className="bg-emerald-950 text-white rounded-lg px-3.5 py-1 text-center shrink-0 flex flex-col justify-center">
                  <span className="text-[9px] text-emerald-300 font-semibold uppercase">Estimasi Hasil</span>
                  <span className="text-xs font-bold font-mono">
                    {formatIDR((Number(jewelryWeight) || 0) * (Number(jewelryPricePerGram) || 0))}
                  </span>
                </div>
              </div>
            )}
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
              Masukkan ke Daftar
            </button>
          </div>
        </form>
      )}

      {/* Aggregated widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-stone-200 p-4 rounded-xl shadow-sm text-center">
          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Total Kebutuhan Anggaran</span>
          <span className="text-2xl font-bold font-mono text-stone-900 mt-1 block">{formatIDR(totalCostCombined)}</span>
          <span className="text-xs text-stone-500 mt-0.5 inline-block font-sans">{items.length} Barang Terdaftar</span>
        </div>

        <div className="bg-white border border-stone-200 p-4 rounded-xl shadow-sm text-center">
          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Telah Dibeli / Terbayar</span>
          <span className="text-2xl font-bold font-mono text-emerald-800 mt-1 block">{formatIDR(totalPurchasedCost)}</span>
          <span className="text-xs text-stone-500 mt-0.5 inline-block font-sans">{items.filter(i => i.isPurchased).length} Barang Selesai</span>
        </div>

        <div className="bg-white border border-stone-200 p-4 rounded-xl shadow-sm text-center">
          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Portofolio Emas Kawin</span>
          <span className="text-2xl font-bold font-mono text-indigo-950 mt-1 block">{totalGoldWeight} Gram</span>
          <span className="text-xs text-stone-500 mt-0.5 inline-block font-sans">Emas Murni Terkonsolidasi</span>
        </div>
      </div>

      {/* Main Table area */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
        
        {items.length === 0 ? (
          <div className="p-12 text-center text-stone-400 space-y-2">
            <Gift size={36} className="mx-auto text-stone-200" />
            <h4 className="font-semibold text-stone-900 text-sm">Daftar Mahar & Seserahan Kosong</h4>
            <p className="text-xs">Klik "Muat Default" untuk menyusun referensi perlengkapan pernikahan Islami.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                  <th className="p-4 w-12 text-center">Beli</th>
                  <th className="p-4">Deskripsi Barang / Mahar</th>
                  <th className="p-4">Brand</th>
                  <th className="p-4">Tipe Barang</th>
                  <th className="p-4 text-right">Harga Barang</th>
                  <th className="p-4 w-28 text-center">Situs Belanja</th>
                  <th className="p-4 w-12 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {items.map(item => (
                  <tr key={item.id} className={`hover:bg-stone-50/50 ${item.isPurchased ? "bg-stone-50/20" : ""}`}>
                    
                    {/* Status Check */}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleToggleBought(item)}
                        className={`w-6 h-6 rounded border flex items-center justify-center mx-auto transition-colors cursor-pointer ${
                          item.isPurchased 
                            ? "bg-emerald-600 border-emerald-600 text-white" 
                            : "bg-white border-stone-300 text-stone-300 hover:border-emerald-500"
                        }`}
                        title={item.isPurchased ? "Telah dibeli" : "Tandai dibeli"}
                      >
                        {item.isPurchased && <CheckCircle2 size={14} />}
                      </button>
                    </td>

                    {/* Deskripsi */}
                    <td className="p-4">
                      <span className={`font-semibold text-stone-900 text-sm ${item.isPurchased ? "text-stone-400 line-through" : ""}`}>
                        {item.name}
                      </span>
                    </td>

                    {/* Brand */}
                    <td className="p-4 text-stone-500">{item.brand}</td>

                    {/* Tipe / Berat emas */}
                    <td className="p-4">
                      {item.isJewelry ? (
                        <div className="space-y-0.5">
                          <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-bold font-sans">
                            Emas Murni
                          </span>
                          <p className="text-[10px] text-stone-400 font-mono mt-0.5">{item.jewelryWeight} Gram ({formatIDR(item.jewelryPricePerGram)}/gr)</p>
                        </div>
                      ) : (
                        <span className="text-stone-400">Seserahan Umum</span>
                      )}
                    </td>

                    {/* Harga */}
                    <td className="p-4 text-right font-mono font-bold text-stone-900">
                      {formatIDR(item.price)}
                    </td>

                    {/* Shopee/Tokopedia link element */}
                    <td className="p-4 text-center">
                      {item.ecommerceLink ? (
                        <a
                          href={item.ecommerceLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-950 text-[10px] font-bold bg-emerald-50 border border-emerald-100 px-2 py-1 rounded"
                        >
                          <ShoppingBag size={12} />
                          Buka Olshop
                        </a>
                      ) : (
                        <span className="text-stone-400 italic text-[10px]">Luring/Offline</span>
                      )}
                    </td>

                    {/* Action delete */}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => onDeleteItem(item.id)}
                        className="text-stone-400 hover:text-rose-600 transition-all p-1"
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
