import React, { memo } from "react";
import { WeddingChecklistItem } from "../types";
import { Check, Edit2, Trash2 } from "lucide-react";

interface PreparationRowProps {
  item: WeddingChecklistItem;
  isEditing: boolean;
  isUpdating: boolean;
  isAdministrasi: boolean;
  onSaveItem: (item: WeddingChecklistItem) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  handleToggleCheck: (item: WeddingChecklistItem, field: "cpp" | "cpw") => Promise<void>;
  setEditingTaskId: (id: string | null) => void;
  handleCostChange: (item: WeddingChecklistItem, value: string, type: "estimate" | "actual") => Promise<void>;
}

const formatIDR = (num: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(num);
};

export const PreparationRow = memo(({
  item,
  isEditing,
  isUpdating,
  isAdministrasi,
  onSaveItem,
  onDeleteItem,
  handleToggleCheck,
  setEditingTaskId,
  handleCostChange
}: PreparationRowProps) => {
  const isSelesaiStatus = item.status === "Selesai" || item.isDone;
  const isProsesStatus = item.status === "Dalam Proses";

  return (
    <div className="py-2.5 first:pt-0 last:pb-0 flex flex-col border-b border-stone-50 last:border-b-0">
      {/* COLLAPSED / SIMPLE VIEW */}
      <div className="flex items-center justify-between gap-3 text-stone-750">
        
        {/* Left: Checkbox (or Dual Checkboxes) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {item.requiresDualCheck ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleToggleCheck(item, "cpp")}
                disabled={isUpdating}
                className={`w-6 h-6 rounded-md flex items-center justify-center border text-[9px] font-bold transition-all shrink-0 ${
                  item.isGroomChecked 
                    ? "bg-brand-600/15 border-brand-600 text-brand-600" 
                    : "bg-surface-sunken border-surface-border text-text-tertiary hover:border-stone-400"
                } ${isUpdating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                title="Kelengkapan dokumen CPP (Pria)"
              >
                L
              </button>
              <button
                onClick={() => handleToggleCheck(item, "cpw")}
                disabled={isUpdating}
                className={`w-6 h-6 rounded-md flex items-center justify-center transition-all border text-[9px] font-bold shrink-0 ${
                  item.isBrideChecked 
                    ? "bg-brand-600/15 border-brand-600 text-brand-600" 
                    : "bg-surface-sunken border-surface-border hover:border-stone-400 text-text-tertiary"
                } ${isUpdating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                title="Kelengkapan dokumen CPW (Wanita)"
              >
                W
              </button>
            </div>
          ) : (
            <button
              onClick={async () => {
                const nextDone = !isSelesaiStatus;
                const updated = {
                  ...item,
                  isDone: nextDone,
                  isGroomChecked: nextDone,
                  isBrideChecked: nextDone,
                  status: nextDone ? "Selesai" as const : "Belum" as const,
                  updatedAt: new Date().toISOString()
                };
                await onSaveItem(updated);
              }}
              disabled={isUpdating}
              className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                isSelesaiStatus
                  ? "bg-brand-600 border-brand-600 text-white"
                  : "bg-surface-raised border-surface-border hover:border-brand-600/60 text-text-tertiary"
              } ${isUpdating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {isSelesaiStatus && <Check size={14} className="stroke-[3px]" />}
            </button>
          )}
        </div>

        {/* Middle: Title & Compact Budget Display */}
        <div className="flex-1 min-w-0" onClick={() => setEditingTaskId(isEditing ? null : item.id)}>
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <h4 className={`text-xs md:text-sm font-semibold leading-snug truncate cursor-pointer hover:text-brand-600 transition-colors ${
              isSelesaiStatus ? "text-text-tertiary line-through font-normal" : "text-text-primary"
            }`}>
              {item.name}
            </h4>
            {item.name.toLowerCase().includes("vaksin tt") && (
              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-200 rounded-md shrink-0">
                wajib KUA
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
            {isAdministrasi && item.requiresDualCheck && (
              <span className="text-[8px] bg-stone-100 text-text-secondary font-bold uppercase px-1 rounded">Dual Check</span>
            )}
            {(item.budgetEstimate > 0 || item.budgetActual > 0) && (
              <span className="text-[9px] font-mono text-stone-450 leading-none">
                Est: {formatIDR(item.budgetEstimate)} {item.budgetActual > 0 && `| Riil: ${formatIDR(item.budgetActual)}`}
              </span>
            )}
          </div>
        </div>

        {/* Right: Status Badge & Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
            isSelesaiStatus
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
              : isProsesStatus
              ? "bg-amber-50 text-amber-700 border border-amber-250/50"
              : "bg-surface-sunken text-text-secondary border border-surface-border/50"
          }`}>
            {item.status || (item.isDone ? "Selesai" : "Belum")}
          </span>
          <button
            onClick={() => setEditingTaskId(isEditing ? null : item.id)}
            disabled={isUpdating}
            className={`p-1 text-stone-405 hover:text-brand-600 rounded transition-colors ${
              isEditing ? "bg-stone-100 text-brand-600" : "hover:bg-surface-sunken"
            } ${isUpdating ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
            title="Edit detail item"
          >
            <Edit2 size={12} />
          </button>
          <button
            onClick={() => onDeleteItem(item.id)}
            disabled={isUpdating}
            className={`p-1 text-text-tertiary hover:text-red-650 hover:bg-red-50 rounded transition-colors ${isUpdating ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
            title="Hapus item"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* DYNAMIC EDIT DRAWER PANEL */}
      {isEditing && (
        <div className="mt-2.5 bg-surface-sunken/80 border border-surface-border rounded-xl p-3.5 animate-fade-in space-y-3">
          <div className="flex items-center justify-between border-b border-surface-border pb-1.5">
            <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">Detail Anggaran & Pengaturan</span>
            <button 
              onClick={() => setEditingTaskId(null)} 
              className="text-[10px] text-brand-600 font-bold hover:underline bg-transparent border-0 cursor-pointer"
            >
              Simpan & Selesai
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            {/* Task Name Edit */}
            <div className="md:col-span-6">
              <label className="block text-[8px] uppercase font-bold text-text-secondary mb-1">Nama Keperluan / Kegiatan</label>
              <input
                type="text"
                value={item.name}
                onChange={async (e) => {
                  const updated = { ...item, name: e.target.value, updatedAt: new Date().toISOString() };
                  await onSaveItem(updated);
                }}
                className="w-full px-2.5 py-1 text-xs bg-surface-raised rounded border border-surface-border focus:outline-none focus:ring-1 focus:ring-brand-600"
              />
            </div>

            {/* Status Select */}
            <div className="md:col-span-3">
              <label className="block text-[8px] uppercase font-bold text-text-secondary mb-1">Status Progres</label>
              <select
                value={item.status || "Belum"}
                onChange={async (e) => {
                  const val = e.target.value as "Belum" | "Dalam Proses" | "Selesai";
                  const updated = {
                    ...item,
                    status: val,
                    isDone: val === "Selesai",
                    isGroomChecked: val === "Selesai" ? true : item.isGroomChecked,
                    isBrideChecked: val === "Selesai" ? true : item.isBrideChecked,
                    updatedAt: new Date().toISOString()
                  };
                  await onSaveItem(updated);
                }}
                className="w-full px-2 py-1 text-xs bg-surface-raised rounded border border-surface-border text-stone-750 focus:outline-none cursor-pointer"
              >
                <option value="Belum">Belum</option>
                <option value="Dalam Proses">Proses</option>
                <option value="Selesai">Selesai</option>
              </select>
            </div>

            {/* Dual Check Requirement */}
            <div className="md:col-span-3 flex items-center h-8">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-600 select-none">
                <input
                  type="checkbox"
                  checked={item.requiresDualCheck}
                  onChange={async (e) => {
                    const checked = e.target.checked;
                    const updated = { ...item, requiresDualCheck: checked, updatedAt: new Date().toISOString() };
                    await onSaveItem(updated);
                  }}
                  className="rounded border-stone-300 text-brand-600 focus:ring-brand-600 w-3.5 h-3.5 cursor-pointer"
                />
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Dual Check (CPP & CPW)</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Est. Budget */}
            <div>
              <label className="block text-[8px] uppercase font-bold text-text-secondary mb-1">Est. Anggaran (Rp)</label>
              <div className="relative">
                <span className="absolute left-2 top-1 text-[10px] text-text-tertiary">Rp</span>
                <input
                  type="number"
                  placeholder="0"
                  value={item.budgetEstimate || ""}
                  onChange={async (e) => await handleCostChange(item, e.target.value, "estimate")}
                  className="w-full pl-7 pr-2.5 py-1 text-xs bg-surface-raised rounded border border-surface-border font-mono text-text-secondary focus:outline-none"
                />
              </div>
            </div>

            {/* Actual Spent */}
            <div>
              <label className="block text-[8px] uppercase font-bold text-text-secondary mb-1">Riil Terpakai (Rp)</label>
              <div className="relative">
                <span className="absolute left-2 top-1 text-[10px] text-text-tertiary">Rp</span>
                <input
                  type="number"
                  placeholder="0"
                  value={item.budgetActual || ""}
                  onChange={async (e) => await handleCostChange(item, e.target.value, "actual")}
                  className="w-full pl-7 pr-2.5 py-1 text-xs bg-surface-raised rounded border border-surface-border font-mono text-text-secondary focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
