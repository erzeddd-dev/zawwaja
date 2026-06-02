import React, { useState, useEffect } from "react";
import { WeddingChecklistItem } from "../types";
import { 
  Plus, 
  Trash2, 
  RotateCcw, 
  UserCheck2,
  ChevronDown,
  ChevronUp,
  Edit2,
  FolderPlus,
  Check
} from "lucide-react";

interface PreparationProps {
  items: WeddingChecklistItem[];
  onSaveItem: (item: WeddingChecklistItem) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  onClearAll: () => Promise<void>;
  onResetDefaults: () => Promise<void>;
  isUpdating?: boolean;
}

export default function Preparation({ 
  items, 
  onSaveItem, 
  onDeleteItem, 
  onClearAll, 
  onResetDefaults,
  isUpdating = false 
}: PreparationProps) {
  // Preset default blueprint category list
  const defaultCategories = [
    "Persiapan Awal",
    "Administrasi Persiapan Menikah",
    "Tempat",
    "Mahar dan Cincin",
    "Make up dan Busana",
    "Dokumentasi",
    "Makanan",
    "Undangan dan Souvenir",
    "Entertaint",
    "Persiapan Lainnya"
  ];

  // Dynamic Categories list backed by localStorage
  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem("zawwaja_checklist_categories");
    return saved ? JSON.parse(saved) : defaultCategories;
  });

  // Keep localStorage in sync
  useEffect(() => {
    localStorage.setItem("zawwaja_checklist_categories", JSON.stringify(categories));
  }, [categories]);

  // Accordion open/close state. First category is open by default.
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (categories.length > 0) {
      initial[categories[0]] = true; // First one is expanded initially
    }
    return initial;
  });

  // Track inline task inputs for each category
  const [inlineTaskNames, setInlineTaskNames] = useState<Record<string, string>>({});
  const [inlineTaskEstimates, setInlineTaskEstimates] = useState<Record<string, string>>({});
  const [inlineTaskActuals, setInlineTaskActuals] = useState<Record<string, string>>({});
  const [requiresDualCheckInput, setRequiresDualCheckInput] = useState<Record<string, boolean>>({});
  const [activeAddFormCat, setActiveAddFormCat] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Dynamic Category Forms
  const [showAddCatForm, setShowAddCatForm] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editedCatName, setEditedCatName] = useState("");

  const toggleAccordion = (cat: string) => {
    setExpandedCats(prev => ({
      ...prev,
      [cat]: !prev[cat]
    }));
  };

  // Add category handler
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newCatName.trim();
    if (!cleanName) return;
    if (categories.includes(cleanName)) {
      alert("Kategori ini sudah terdaftar!");
      return;
    }
    setCategories([...categories, cleanName]);
    setNewCatName("");
    setShowAddCatForm(false);
    // Expand the new category automatically
    setExpandedCats(prev => ({ ...prev, [cleanName]: true }));
  };

  // Delete category handler
  const handleDeleteCategory = (catToDelete: string) => {
    if (window.confirm(`Yakin ingin menghapus kategori "${catToDelete}"? Item persiapan di dalam kategori ini akan dipindahkan ke "Persiapan Lainnya".`)) {
      // Move items in the deleted category to "Persiapan Lainnya"
      const targetCat = "Persiapan Lainnya";
      if (!categories.includes(targetCat)) {
        setCategories(prev => [...prev.filter(c => c !== catToDelete), targetCat]);
      } else {
        setCategories(prev => prev.filter(c => c !== catToDelete));
      }

      // Update existing items belonging to deleted category
      items.forEach(async (item) => {
        if (item.category.trim().toLowerCase() === catToDelete.trim().toLowerCase()) {
          await onSaveItem({
            ...item,
            category: targetCat,
            updatedAt: new Date().toISOString()
          });
        }
      });
    }
  };

  // Edit category handler
  const handleStartEditCategory = (cat: string) => {
    setEditingCat(cat);
    setEditedCatName(cat);
  };

  const handleSaveCategoryName = async (oldName: string) => {
    const cleanName = editedCatName.trim();
    if (!cleanName || cleanName === oldName) {
      setEditingCat(null);
      return;
    }

    if (categories.includes(cleanName)) {
      alert("Nama kategori sudah digunakan!");
      return;
    }

    // Update categories array
    setCategories(prev => prev.map(c => c === oldName ? cleanName : c));
    setEditingCat(null);

    // Update all matching items belonging to old category
    items.forEach(async (item) => {
      if (item.category.trim().toLowerCase() === oldName.trim().toLowerCase()) {
        await onSaveItem({
          ...item,
          category: cleanName,
          updatedAt: new Date().toISOString()
        });
      }
    });
  };

  // Inline dynamic task additions
  const handleAddNewTask = async (cat: string) => {
    const taskName = inlineTaskNames[cat]?.trim();
    if (!taskName) return;

    const dualCheck = !!requiresDualCheckInput[cat];

    const newItem: WeddingChecklistItem = {
      id: "item-" + Math.random().toString(36).substring(2, 9),
      name: taskName,
      category: cat,
      budgetEstimate: Number(inlineTaskEstimates[cat]) || 0,
      budgetActual: Number(inlineTaskActuals[cat]) || 0,
      isGroomChecked: false,
      isBrideChecked: false,
      status: "Belum",
      requiresDualCheck: dualCheck,
      isDone: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await onSaveItem(newItem);

    // Clear inline states for this category
    setInlineTaskNames(prev => ({ ...prev, [cat]: "" }));
    setInlineTaskEstimates(prev => ({ ...prev, [cat]: "" }));
    setInlineTaskActuals(prev => ({ ...prev, [cat]: "" }));
    setRequiresDualCheckInput(prev => ({ ...prev, [cat]: false }));
    setActiveAddFormCat(null);
  };

  // Empathetic check-status-sync
  const handleToggleCheck = async (item: WeddingChecklistItem, field: "cpp" | "cpw") => {
    const updatedItem = { ...item };
    if (field === "cpp") {
      updatedItem.isGroomChecked = !item.isGroomChecked;
    } else {
      updatedItem.isBrideChecked = !item.isBrideChecked;
    }
    
    // Auto sync 3-state progress depending on both checkmarks
    if (updatedItem.isGroomChecked && updatedItem.isBrideChecked) {
      updatedItem.status = "Selesai";
      updatedItem.isDone = true;
    } else if (updatedItem.isGroomChecked || updatedItem.isBrideChecked) {
      updatedItem.status = "Dalam Proses";
      updatedItem.isDone = false;
    } else {
      updatedItem.status = "Belum";
      updatedItem.isDone = false;
    }

    updatedItem.updatedAt = new Date().toISOString();
    
    await onSaveItem(updatedItem);
  };

  const handleCostChange = async (item: WeddingChecklistItem, value: string, type: "estimate" | "actual") => {
    const val = Number(value) || 0;
    const updated = { 
      ...item, 
      budgetEstimate: type === "estimate" ? val : item.budgetEstimate,
      budgetActual: type === "actual" ? val : item.budgetActual,
      updatedAt: new Date().toISOString()
    };
    await onSaveItem(updated);
  };

  // Hardreset back to default preset list
  const handleResetToPresetCategories = () => {
    if (window.confirm("Bismillah, yakin ingin memulihkan daftar kategori ke pengaturan awal?")) {
      setCategories(defaultCategories);
      localStorage.setItem("zawwaja_checklist_categories", JSON.stringify(defaultCategories));
      // Expand first
      setExpandedCats({ [defaultCategories[0]]: true });
    }
  };

  // Calculations for Summary
  const tEstimate = items.reduce((acc, curr) => acc + (curr.budgetEstimate || 0), 0);
  const tActual = items.reduce((acc, curr) => acc + (curr.budgetActual || 0), 0);
  const variance = tEstimate - tActual;
  const completedCount = items.filter(i => (i.status === "Selesai" || i.isDone)).length;
  const totalCount = items.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(num);
  };

  return (
    <div className="space-y-5" id="preparation-view">
      
      {/* Title Header with dynamic category tool adds */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-serif font-bold text-stone-900">Daftar Persiapan Nikah Syar'i</h2>
          <p className="text-stone-500 text-xs mt-0.5">Kelola kebutuhan administrasi & logistik pernikahan khidmat secara terperinci.</p>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowAddCatForm(!showAddCatForm)}
            disabled={isUpdating}
            className="px-3.5 py-1.5 bg-[#af7661] hover:bg-[#915c4a] text-white text-xs font-semibold rounded-lg flex items-center shadow-xs cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FolderPlus size={14} className="mr-1.5" />
            Tambah Kategori
          </button>
          
          <button
            onClick={async () => {
              if (window.confirm("Bismillah, yakin ingin memulihkan seluruh item persiapan bawaan ke pengaturan awal?")) {
                await onResetDefaults();
                setCategories(defaultCategories);
              }
            }}
            disabled={isUpdating}
            className="px-3 py-1.5 border border-stone-200 text-stone-700 bg-white hover:bg-stone-50 text-xs font-semibold rounded-lg flex items-center cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Muat ulang seluruh item default Sharia"
          >
            <RotateCcw size={13} className="mr-1.5 text-stone-400" />
            {isUpdating ? "Memproses..." : "Muat Default"}
          </button>

          <button
            onClick={onClearAll}
            disabled={isUpdating}
            className="px-3 py-1.5 border border-stone-200 text-stone-500 hover:text-red-650 bg-white hover:bg-red-50 text-xs font-semibold rounded-lg flex items-center cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Kosongkan seluruh data pada checklist"
          >
            <Trash2 size={13} className="mr-1.5 text-stone-400" />
            Kosongkan Checklist
          </button>

          <button
            onClick={handleResetToPresetCategories}
            disabled={isUpdating}
            className="px-2 py-1.5 text-stone-400 hover:text-stone-700 text-xs font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            title="Kembalikan nama-nama kategori ke standar"
          >
            Reset Kategori
          </button>
        </div>
      </div>

      {/* Dynamic Category Addition Form Inline */}
      {showAddCatForm && (
        <form onSubmit={handleAddCategory} className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs max-w-md animate-fade-in space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">Tambah Kategori Baru</h4>
            <button type="button" onClick={() => setShowAddCatForm(false)} className="text-stone-400 hover:text-stone-600 text-xs">Batal</button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              required
              placeholder="Contoh: Mahar & Cincin, Transportasi dsb"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs bg-stone-50 rounded-lg border border-stone-250 focus:outline-none focus:ring-1 focus:ring-[#af7661]"
            />
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#af7661] hover:bg-[#915c4a] text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Tambah
            </button>
          </div>
        </form>
      )}

      {/* Soft and Compact Summary Card (Anti-Overwhelm Layout) */}
      <div className="bg-stone-50/50 border border-stone-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Progress Display (Empathy Focus) */}
        <div className="flex-1 min-w-[200px] space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-stone-700">Kemajuan Persiapan Nikah</span>
            <span className="font-mono font-bold text-[#af7661]">{completionRate}%</span>
          </div>
          <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-300 ${completionRate === 100 ? "bg-emerald-600" : "bg-[#af7661]"}`} style={{ width: `${completionRate}%` }}></div>
          </div>
          <p className="text-[10px] text-stone-500">
            Alhamdulillah, {completedCount} dari {totalCount} kebutuhan dan persiapan tercatat selesai.
          </p>
        </div>

        {/* Small Budget Metrics */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 md:border-l border-stone-200 md:pl-6 shrink-0">
          <div className="space-y-0.5">
            <p className="text-[10px] text-stone-400 uppercase font-semibold tracking-wider">Est. Total Anggaran</p>
            <p className="text-xs font-semibold font-mono text-stone-700">{formatIDR(tEstimate)}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] text-stone-400 uppercase font-semibold tracking-wider">Riil Terpakai</p>
            <p className="text-xs font-semibold font-mono text-stone-800">{formatIDR(tActual)}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] text-stone-400 uppercase font-semibold tracking-wider">Selisih Sisa</p>
            <p className={`text-xs font-bold font-mono ${variance < 0 ? "text-rose-600" : "text-emerald-700"}`}>
              {formatIDR(variance)}
            </p>
          </div>
        </div>

      </div>

      {/* Accordion List Categories */}
      <div className="space-y-3" id="categories-accordions">
        {categories.map((cat, index) => {
          const isExpanded = !!expandedCats[cat];
          const catItems = items.filter(i => 
            i.category.trim().toLowerCase() === cat.trim().toLowerCase()
          );
          const isAdministrasi = cat.toLowerCase().includes("administrasi");

          // Inline category aggregations (Estimates & Actuals)
          const catEstimate = catItems.reduce((acc, curr) => acc + (curr.budgetEstimate || 0), 0);
          const catActual = catItems.reduce((acc, curr) => acc + (curr.budgetActual || 0), 0);

          return (
            <div key={cat} className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
              
              {/* Accordion Item Header Trigger */}
              <div 
                className={`p-3 flex items-center justify-between gap-4 cursor-pointer select-none transition-colors ${
                  isExpanded ? "bg-stone-50/50 border-b border-stone-200" : "hover:bg-stone-50/30"
                }`}
                onClick={() => toggleAccordion(cat)}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {isExpanded ? (
                    <ChevronUp size={15} className="text-stone-450 shrink-0" />
                  ) : (
                    <ChevronDown size={15} className="text-stone-450 shrink-0" />
                  )}
                  
                  {editingCat === cat ? (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editedCatName}
                        onChange={(e) => setEditedCatName(e.target.value)}
                        className="px-2 py-0.5 text-xs font-medium border border-stone-250 bg-white rounded focus:outline-none"
                      />
                      <button 
                        onClick={() => handleSaveCategoryName(cat)}
                        className="px-2 py-0.5 bg-green-600 text-white text-[10px] font-bold rounded"
                      >
                        OK
                      </button>
                      <button 
                        onClick={() => setEditingCat(null)}
                        className="text-stone-400 text-[10px]"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 min-w-0">
                      <h3 className="text-xs md:text-sm font-semibold text-stone-850 truncate">
                        {cat}
                      </h3>
                      <span className="px-1.5 py-0.2 text-[9px] font-bold bg-stone-100 rounded-full text-stone-600 text-center shrink-0">
                        {catItems.length}
                      </span>
                    </div>
                  )}
                </div>

                {/* Left Mini Stats on Header & Tools */}
                <div className="flex items-center gap-3 text-xs shrink-0 font-sans" onClick={(e) => e.stopPropagation()}>
                  
                  {/* Category sums */}
                  <div className="hidden sm:flex items-center gap-2 text-[11px] text-stone-400 pr-1">
                    <span>Est: <strong className="text-stone-600 font-mono font-medium">{formatIDR(catEstimate)}</strong></span>
                    <span>•</span>
                    <span>Spent: <strong className="text-stone-600 font-mono font-medium">{formatIDR(catActual)}</strong></span>
                  </div>

                  {/* Add, Edit, Delete Controls */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStartEditCategory(cat)}
                      className="p-1 text-stone-400 hover:text-[#af7661] hover:bg-stone-100 rounded transition-colors"
                      title="Edit Nama Kategori"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat)}
                      className="p-1 text-stone-400 hover:text-red-600 hover:bg-stone-100 rounded transition-colors"
                      title="Hapus Kategori"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                </div>

              </div>

              {/* Accordion Content Area */}
              {isExpanded && (
                <div className="p-3 md:p-4 space-y-3.5">
                  
                  {/* Task list details */}
                  {catItems.length === 0 ? (
                    <div className="py-6 text-center text-stone-400 text-xs">
                      <p>Kategori kosong. Tekan "Tambah Item Kebutuhan Baru" di bawah ini untuk memulai.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-stone-100">
                      {catItems.map((item) => {
                        const isSelesaiStatus = item.status === "Selesai" || item.isDone;
                        const isProsesStatus = item.status === "Dalam Proses";
                        const isEditing = editingTaskId === item.id;

                        return (
                          <div key={item.id} className="py-2.5 first:pt-0 last:pb-0 flex flex-col border-b border-stone-50 last:border-b-0">
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
                                          ? "bg-[#af7661]/15 border-[#af7661] text-[#af7661]" 
                                          : "bg-stone-50 border-stone-250 text-stone-400 hover:border-stone-400"
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
                                          ? "bg-[#af7661]/15 border-[#af7661] text-[#af7661]" 
                                          : "bg-stone-50 border-stone-250 hover:border-stone-400 text-stone-400"
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
                                        ? "bg-[#af7661] border-[#af7661] text-white"
                                        : "bg-white border-stone-250 hover:border-[#af7661]/60 text-stone-400"
                                    } ${isUpdating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                  >
                                    {isSelesaiStatus && <Check size={14} className="stroke-[3px]" />}
                                  </button>
                                )}
                              </div>

                              {/* Middle: Title & Compact Budget Display */}
                              <div className="flex-1 min-w-0" onClick={() => setEditingTaskId(isEditing ? null : item.id)}>
                                <h4 className={`text-xs md:text-sm font-semibold leading-snug truncate cursor-pointer hover:text-[#af7661] transition-colors ${
                                  isSelesaiStatus ? "text-stone-400 line-through font-normal" : "text-stone-850"
                                }`}>
                                  {item.name}
                                </h4>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                                  {isAdministrasi && item.requiresDualCheck && (
                                    <span className="text-[8px] bg-stone-100 text-stone-500 font-bold uppercase px-1 rounded">Dual Check</span>
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
                                    : "bg-stone-50 text-stone-500 border border-stone-200/50"
                                }`}>
                                  {item.status || (item.isDone ? "Selesai" : "Belum")}
                                </span>                                 <button
                                  onClick={() => setEditingTaskId(isEditing ? null : item.id)}
                                  disabled={isUpdating}
                                  className={`p-1 text-stone-405 hover:text-[#af7661] rounded transition-colors ${
                                    isEditing ? "bg-stone-100 text-[#af7661]" : "hover:bg-stone-50"
                                  } ${isUpdating ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                                  title="Edit detail item"
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button
                                  onClick={() => onDeleteItem(item.id)}
                                  disabled={isUpdating}
                                  className={`p-1 text-stone-400 hover:text-red-650 hover:bg-red-50 rounded transition-colors ${isUpdating ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                                  title="Hapus item"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>

                            </div>

                            {/* DYNAMIC EDIT DRAWER PANEL */}
                            {isEditing && (
                              <div className="mt-2.5 bg-stone-50/80 border border-stone-200 rounded-xl p-3.5 animate-fade-in space-y-3">
                                <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
                                  <span className="text-[9px] font-bold text-stone-500 uppercase tracking-wider">Detail Anggaran & Pengaturan</span>
                                  <button 
                                    onClick={() => setEditingTaskId(null)} 
                                    className="text-[10px] text-[#af7661] font-bold hover:underline bg-transparent border-0 cursor-pointer"
                                  >
                                    Simpan & Selesai
                                  </button>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                                  {/* Task Name Edit */}
                                  <div className="md:col-span-6">
                                    <label className="block text-[8px] uppercase font-bold text-stone-500 mb-1">Nama Keperluan / Kegiatan</label>
                                    <input
                                      type="text"
                                      value={item.name}
                                      onChange={async (e) => {
                                        const updated = { ...item, name: e.target.value, updatedAt: new Date().toISOString() };
                                        await onSaveItem(updated);
                                      }}
                                      className="w-full px-2.5 py-1 text-xs bg-white rounded border border-stone-250 focus:outline-none focus:ring-1 focus:ring-[#af7661]"
                                    />
                                  </div>

                                  {/* Status Select */}
                                  <div className="md:col-span-3">
                                    <label className="block text-[8px] uppercase font-bold text-stone-500 mb-1">Status Progres</label>
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
                                      className="w-full px-2 py-1 text-xs bg-white rounded border border-stone-250 text-stone-750 focus:outline-none cursor-pointer"
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
                                        className="rounded border-stone-300 text-[#af7661] focus:ring-[#af7661] w-3.5 h-3.5 cursor-pointer"
                                      />
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-550">Dual Check (CPP & CPW)</span>
                                    </label>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-1">
                                  {/* Est. Budget */}
                                  <div>
                                    <label className="block text-[8px] uppercase font-bold text-stone-500 mb-1">Est. Anggaran (Rp)</label>
                                    <div className="relative">
                                      <span className="absolute left-2 top-1 text-[10px] text-stone-400">Rp</span>
                                      <input
                                        type="number"
                                        placeholder="0"
                                        value={item.budgetEstimate || ""}
                                        onChange={async (e) => await handleCostChange(item, e.target.value, "estimate")}
                                        className="w-full pl-7 pr-2.5 py-1 text-xs bg-white rounded border border-stone-250 font-mono text-stone-700 focus:outline-none"
                                      />
                                    </div>
                                  </div>

                                  {/* Actual Spent */}
                                  <div>
                                    <label className="block text-[8px] uppercase font-bold text-stone-500 mb-1">Riil Terpakai (Rp)</label>
                                    <div className="relative">
                                      <span className="absolute left-2 top-1 text-[10px] text-stone-400">Rp</span>
                                      <input
                                        type="number"
                                        placeholder="0"
                                        value={item.budgetActual || ""}
                                        onChange={async (e) => await handleCostChange(item, e.target.value, "actual")}
                                        className="w-full pl-7 pr-2.5 py-1 text-xs bg-white rounded border border-stone-250 font-mono text-stone-700 focus:outline-none"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Micro Inline add form customized inside each category accordion */}
                  <div className="pt-2.5 border-t border-stone-200 flex flex-col sm:flex-row items-center gap-3">
                    {activeAddFormCat === cat ? (
                      <div className="w-full bg-stone-50 p-3 rounded-lg border border-stone-200 flex flex-col gap-3">
                        <div className="flex flex-col md:flex-row gap-3 items-end">
                          <div className="flex-1 min-w-0 w-full">
                            <label className="block text-[8px] uppercase font-bold text-stone-550 mb-1">Nama Keperluan / Kegiatan</label>
                            <input
                              type="text"
                              required
                              placeholder="Sewa fotografer Syar'i, tes kesehatan, KUA..."
                              value={inlineTaskNames[cat] || ""}
                              onChange={(e) => {
                                const v = e.target.value;
                                setInlineTaskNames(prev => ({ ...prev, [cat]: v }));
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddNewTask(cat);
                                }
                              }}
                              className="w-full px-2.5 py-1 text-xs bg-white rounded border border-stone-250 focus:outline-none focus:ring-1 focus:ring-[#af7661]"
                            />
                          </div>

                          <div className="flex gap-2 shrink-0 w-full md:w-auto">
                            <div className="flex-1 md:flex-none">
                              <label className="block text-[8px] uppercase font-bold text-stone-550 mb-1">Est. Budget (Rp)</label>
                              <input
                                type="number"
                                placeholder="0"
                                value={inlineTaskEstimates[cat] || ""}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setInlineTaskEstimates(prev => ({ ...prev, [cat]: v }));
                                }}
                                className="w-full md:w-24 px-2 py-1 text-xs bg-white rounded border border-stone-250 font-mono focus:outline-none focus:ring-1 focus:ring-[#af7661]"
                              />
                            </div>

                            <div className="flex-1 md:flex-none">
                              <label className="block text-[8px] uppercase font-bold text-stone-550 mb-1">Riil Budget (Rp)</label>
                              <input
                                type="number"
                                placeholder="0"
                                value={inlineTaskActuals[cat] || ""}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setInlineTaskActuals(prev => ({ ...prev, [cat]: v }));
                                }}
                                className="w-full md:w-24 px-2 py-1 text-xs bg-white rounded border border-stone-250 font-mono focus:outline-none focus:ring-1 focus:ring-[#af7661]"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Dual-check toggle switch inline custom item assignment support */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-stone-200">
                          <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-605 select-none font-medium">
                            <input
                              type="checkbox"
                              checked={!!requiresDualCheckInput[cat]}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setRequiresDualCheckInput(prev => ({ ...prev, [cat]: checked }));
                              }}
                              className="rounded border-stone-300 text-[#af7661] focus:ring-[#af7661] w-3.5 h-3.5"
                            />
                            <span>Apakah item ini butuh checklist CPP & CPW terpisah? (Misal: Berkas KTP, KK, dsb)</span>
                          </label>

                           <div className="flex gap-2 self-end">
                            <button
                              type="button"
                              onClick={() => {
                                setRequiresDualCheckInput(prev => ({ ...prev, [cat]: false }));
                                setActiveAddFormCat(null);
                              }}
                              disabled={isUpdating}
                              className="px-2.5 py-1 border border-stone-250 text-stone-500 rounded bg-white text-xs hover:bg-stone-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddNewTask(cat)}
                              disabled={!inlineTaskNames[cat]?.trim() || isUpdating}
                              className="px-3.5 py-1 bg-[#af7661] hover:bg-[#915c4a] text-white text-xs font-bold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                              Simpan Item
                            </button>
                          </div>
                        </div>

                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          // open and set to empty
                          setActiveAddFormCat(cat);
                        }}
                        disabled={isUpdating}
                        className="py-1 px-3 border border-stone-200 hover:border-[#af7661] hover:bg-[#af7661]/5 text-stone-600 hover:text-[#af7661] text-xs font-semibold rounded flex items-center transition-all gap-1.5 mr-auto disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus size={12} />
                        Tambah Item Kebutuhan Baru
                      </button>
                    )}
                  </div>

                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
}
