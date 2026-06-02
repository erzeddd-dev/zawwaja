import React, { useState, useEffect } from "react";
import { Download, Check, Loader2, Sparkles } from "lucide-react";
import jsQR from "jsqr";
import QRCode from "qrcode";
import { convertQRIS } from "../lib/qris";

export function QRISCard() {
  const [isDecoding, setIsDecoding] = useState<boolean>(true);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [dynamicQRUrl, setDynamicQRUrl] = useState<string | null>(null);
  const [qrisError, setQrisError] = useState<string | null>(null);

  // Decode static /qris.jpg once on mount and convert to dynamic 25k QRIS
  useEffect(() => {
    const img = new Image();
    img.onload = async () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setQrisError("Gagal memproses canvas gambar QRIS.");
          setIsDecoding(false);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, canvas.width, canvas.height);
        
        if (code && code.data) {
          // Generate the dynamic QRIS payload (Rp 25.000)
          const dynamicPayload = convertQRIS(code.data, { amount: 25000 });
          
          // Render it using the QRCode library
          const qrDataUrl = await QRCode.toDataURL(dynamicPayload, {
            width: 512,
            margin: 2,
            color: {
              dark: "#000000",
              light: "#ffffff",
            },
          });
          setDynamicQRUrl(qrDataUrl);
        } else {
          console.warn("QR code not detected inside qris.jpg. Falling back to static image mode.");
          setQrisError("QRIS payload tidak terdeteksi. Menampilkan gambar statis.");
        }
      } catch (err: any) {
        console.error("Error generating dynamic QRIS:", err);
        setQrisError("Gagal merubah ke QRIS Dinamis. Menampilkan gambar statis.");
      } finally {
        setIsDecoding(false);
      }
    };
    img.onerror = () => {
      setQrisError("Gagal memuat gambar QRIS.");
      setIsDecoding(false);
    };
    img.src = "/qris.jpg";
  }, []);

  const handleDownloadQR = () => {
    setDownloadSuccess(false);

    try {
      const downloadLink = document.createElement("a");
      // If we have the dynamic QR code, download that! Otherwise, fallback to the original image.
      downloadLink.href = dynamicQRUrl || "/qris.jpg";
      downloadLink.download = dynamicQRUrl ? "QRIS-Dinamis-Zawwaja-25k.png" : "QRIS-Zawwaja.jpg";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (error) {
      console.error("Error downloading file", error);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-xs sm:max-w-md mx-auto" id="qris-card-wrapper">
      
      {/* Dynamic QRIS Card Container */}
      <div className="relative bg-white border border-stone-200 shadow-md rounded-2xl p-4 w-full select-none overflow-hidden transition-all hover:shadow-lg flex flex-col items-center justify-center min-h-[420px]">
        {isDecoding && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-stone-50/70 rounded-xl z-10 animate-fade-in" id="qris-loading-fallback">
            <Loader2 className="w-8 h-8 text-[#af7661] animate-spin" />
            <p className="text-xs text-stone-500 font-sans">Menghasilkan QRIS Dinamis Rp 25.000...</p>
          </div>
        )}
        
        {dynamicQRUrl ? (
          // DYNAMIC QR CODE DISPLAY
          <div className="w-full flex flex-col items-center gap-3 animate-fade-in">
            {/* Aesthetic Header */}
            <div className="w-full text-center border-b pb-2 mb-2 border-stone-100">
              <div className="flex items-center justify-center gap-1.5 text-[#af7661] font-bold text-xs uppercase tracking-widest font-serif">
                <Sparkles size={14} />
                <span>QRIS Dinamis Otomatis</span>
              </div>
              <p className="text-[10px] text-stone-400 mt-0.5">Nominal presisi, tak perlu ketik manual</p>
            </div>

            {/* Generated QR Code Canvas Image */}
            <div className="p-2 border border-stone-100 rounded-xl bg-stone-50 shadow-inner flex items-center justify-center w-64 h-64 sm:w-72 sm:h-72">
              <img 
                src={dynamicQRUrl} 
                alt="QRIS Dinamis Rp 25.000" 
                className="w-full h-full object-contain rounded-lg"
              />
            </div>

            {/* Aesthetic Footer badge */}
            <div className="text-center mt-1">
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-emerald-150 shadow-xs">
                🪙 Nominal: Rp 25.000
              </span>
            </div>
          </div>
        ) : (
          // STATIC IMAGE FALLBACK (IF DECODING FAILS OR HAS ERROR)
          <div className="w-full flex flex-col items-center gap-2 animate-fade-in">
            {qrisError && (
              <p className="text-[10px] text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100 mb-2 text-center w-full">
                ⚠️ {qrisError}
              </p>
            )}
            <img 
              src="/qris.jpg" 
              alt="Official QRIS static fallback" 
              className="w-full h-auto rounded-xl object-contain object-center max-h-[360px]"
            />
          </div>
        )}
      </div>

      {/* Controller Area */}
      <div className="w-full mt-4 flex flex-col gap-2" id="qris-card-controls">
        <button
          onClick={handleDownloadQR}
          disabled={isDecoding}
          type="button"
          className="w-full py-2.5 px-4 bg-[#af7661] hover:bg-[#915c4a] active:bg-[#572309] disabled:bg-stone-300 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer border-none outline-none"
        >
          {downloadSuccess ? (
            <Check size={16} />
          ) : (
            <Download size={16} />
          )}
          <span>{downloadSuccess ? "Tersimpan ke Galeri!" : "Unduh QRIS"}</span>
        </button>
        
        <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-800 text-[10px] text-center font-sans tracking-wide leading-relaxed">
          {dynamicQRUrl ? (
            <span>✓ Pindai QR di atas menggunakan dompet digital Anda (GoPay, OVO, ShopeePay, Dana, LinkAja) atau Mobile Banking. Nominal <strong>Rp 25.000</strong> akan otomatis terisi secara presisi!</span>
          ) : (
            <span>✓ Silakan buka aplikasi perbankan atau dompet digital Anda, scan berkas QRIS di atas untuk menyelesaikan transaksi registrasi Rp 25.000.</span>
          )}
        </div>
      </div>
    </div>
  );
}

