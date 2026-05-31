import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Upload, 
  Trash2, 
  Download, 
  Eye, 
  Loader2, 
  FileCheck, 
  AlertCircle 
} from "lucide-react";
import { UserFile } from "../types";
import { getUserFiles, uploadUserFile, deleteUserFile } from "../lib/firebase";

interface UserFilesProps {
  userId: string;
}

export default function UserFiles({ userId }: UserFilesProps) {
  const [files, setFiles] = useState<UserFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFiles();
  }, [userId]);

  const fetchFiles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await getUserFiles(userId);
      setFiles(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err: any) {
      setError("Gagal memuat berkas-berkas Anda.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    // Restrict size to 5MB
    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran berkas maksimal adalah 5MB.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      await uploadUserFile(userId, file);
      await fetchFiles();
    } catch (err: any) {
      setError(err.message || "Gagal mengunggah berkas.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileDelete = async (fileId: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus berkas ini?")) return;
    
    setError(null);
    try {
      await deleteUserFile(userId, fileId);
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (err: any) {
      setError(err.message || "Gagal menghapus berkas.");
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-md p-6 max-w-4xl mx-auto" id="user-files-pane">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-stone-100">
        <div>
          <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
            <FileCheck className="text-[#B76E79]" size={20} />
            Berkas & Dokumen Pernikahan
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Unggah dokumen penting persiapan akademis seperti KK, KTP, Surat Menikah, atau surat pengantar.
          </p>
        </div>

        {/* Upload Button */}
        <div>
          <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#B76E79] hover:bg-[#a65f6a] transition-all cursor-pointer ${isUploading ? "opacity-75 pointer-events-none" : ""}`}>
            {isUploading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Upload size={16} />
            )}
            {isUploading ? "Mengunggah..." : "Unggah Dokumen"}
            <input 
              type="file" 
              className="hidden" 
              onChange={handleFileUpload}
              disabled={isUploading}
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
            />
          </label>
        </div>
      </div>

      {error && (
        <div className="p-3 mb-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0 text-rose-500" />
          <p>{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={32} className="animate-spin text-[#B76E79]" />
          <p className="text-xs text-stone-500 font-medium font-mono">Memuat dokumen aman...</p>
        </div>
      ) : files.length === 0 ? (
        <div className="border border-dashed border-stone-200 rounded-xl py-14 flex flex-col items-center justify-center text-center p-6 bg-stone-50/50">
          <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-4 border border-stone-200">
            <FileText size={22} />
          </div>
          <p className="text-stone-800 text-sm font-semibold">Belum Ada Berkas</p>
          <p className="text-xs text-stone-500 mt-1 max-w-xs">
            Unggah foto dokumen pendukung Anda di sini agar tersimpan rapi dalam folder akad digital Anda.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden border border-stone-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 select-none">
              <tr>
                <th className="py-3.5 px-4 font-bold text-stone-600 uppercase tracking-wider">Nama Berkas</th>
                <th className="py-3.5 px-4 font-bold text-stone-600 uppercase tracking-wider hidden sm:table-cell">Ukuran</th>
                <th className="py-3.5 px-4 font-bold text-stone-600 uppercase tracking-wider hidden md:table-cell">Tanggal Unggah</th>
                <th className="py-3.5 px-4 font-bold text-stone-600 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {files.map((file) => (
                <tr key={file.id} className="hover:bg-stone-50/60 transition-colors">
                  <td className="py-3 px-4 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-pink-50 text-[#B76E79] border border-pink-100 shrink-0">
                        <FileText size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-stone-800 truncate" title={file.name}>{file.name}</p>
                        <p className="text-[10px] text-stone-400 font-mono sm:hidden">{formatSize(file.size)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-stone-500 hidden sm:table-cell">
                    {formatSize(file.size)}
                  </td>
                  <td className="py-3 px-4 text-stone-500 hidden md:table-cell">
                    {new Date(file.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <a 
                        href={file.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-all flex items-center justify-center cursor-pointer"
                        title="Tinjau Berkas"
                      >
                        <Eye size={15} />
                      </a>
                      <a 
                        href={file.url} 
                        download={file.name}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-[#B76E79] hover:text-[#9c5661] hover:bg-[#B76E79]/5 transition-all flex items-center justify-center cursor-pointer"
                        title="Unduh Berkas"
                      >
                        <Download size={15} />
                      </a>
                      <button
                        onClick={() => handleFileDelete(file.id)}
                        className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-all flex items-center justify-center cursor-pointer"
                        title="Hapus Berkas"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
