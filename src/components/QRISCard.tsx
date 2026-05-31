import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { Download, Check, RefreshCw } from "lucide-react";

export function QRISCard() {
  const [qrisImage, setQrisImage] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  // Constants representing the verified static QRIS payload
  const QRIS_PAYLOAD = "00020101021126590014ID10265011676820118936009140000000010203A010303A0151110014ID102650116768202159360091400000000303A015204000053033605405250005802ID5933PHRONESIS WORKS, DIGITAL & KREATIF6013KOTA SEMARANG61055013162070703A016304FC71";

  // Helper to draw clean vector hearts on canvas context
  const drawHeart = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y + size / 4);
    ctx.bezierCurveTo(x, y - size / 2, x - size, y - size / 2, x - size, y + size / 4);
    ctx.bezierCurveTo(x - size, y + (size * 3) / 4, x, y + size * 1.1, x, y + size * 1.25);
    ctx.bezierCurveTo(x, y + size * 1.1, x + size, y + (size * 3) / 4, x + size, y + size / 4);
    ctx.bezierCurveTo(x + size, y - size / 2, x, y - size / 2, x, y + size / 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  useEffect(() => {
    async function generateQRISImage() {
      try {
        setIsGenerating(true);

        // Define a canvas with high print-ready resolution (width=600px, height=840px)
        const canvas = document.createElement("canvas");
        canvas.width = 600;
        canvas.height = 840;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // 1. Base Clean White background
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, 600, 840);

        // 2. Left Decorative Red Ribbons (GPN Style)
        ctx.fillStyle = "#E52F38";
        ctx.beginPath();
        ctx.moveTo(0, 216);
        ctx.lineTo(80, 276);
        ctx.lineTo(0, 420);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#BA121A";
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, 240);
        ctx.lineTo(54, 281);
        ctx.lineTo(0, 372);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // 3. Bottom Right Decorative Red Ribbons (GPN Style)
        ctx.fillStyle = "#E52F38";
        ctx.beginPath();
        ctx.moveTo(600, 636);
        ctx.lineTo(600, 840);
        ctx.lineTo(360, 840);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#BA121A";
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(600, 672);
        ctx.lineTo(600, 840);
        ctx.lineTo(408, 840);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // 4. Draw Header Section Logos
        // A. QRIS National Logo (Left)
        // Red circle icon background for 'Q'
        ctx.fillStyle = "#E52F38";
        ctx.beginPath();
        ctx.arc(52, 42, 16, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(52, 42, 10, 0, 2 * Math.PI);
        ctx.fill();
        // Inner blue circle dot
        ctx.fillStyle = "#202A44";
        ctx.beginPath();
        ctx.arc(52, 42, 4, 0, 2 * Math.PI);
        ctx.fill();

        // Logo letters 'RIS'
        ctx.fillStyle = "#1C2E5A";
        ctx.font = "900 28px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText("RIS", 72, 44);

        // Sub-text standards
        ctx.fillStyle = "#1F2F57";
        ctx.font = "bold 8px system-ui, -apple-system, sans-serif";
        ctx.fillText("QR Code Standar", 136, 36);
        ctx.fillText("Pembayaran Nasional", 136, 46);

        // B. GPN National Logo (Right)
        // Red colored wing graphic representing GPN
        ctx.fillStyle = "#E52F38";
        ctx.beginPath();
        ctx.moveTo(540, 24);
        ctx.quadraticCurveTo(515, 30, 502, 44);
        ctx.lineTo(528, 42);
        ctx.quadraticCurveTo(538, 30, 545, 26);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#BA121A";
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(542, 25);
        ctx.quadraticCurveTo(520, 32, 510, 44);
        ctx.lineTo(530, 42);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1.0;

        ctx.fillStyle = "#1C2E5A";
        ctx.font = "900 13px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "right";
        ctx.fillText("GPN", 540, 60);

        // C. Divider Header Line
        ctx.strokeStyle = "#E8E7E4";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(36, 76);
        ctx.lineTo(564, 76);
        ctx.stroke();

        // 5. Merchant Identity Blocks
        ctx.fillStyle = "#111111";
        ctx.textAlign = "center";
        
        ctx.font = "bold 18px system-ui, -apple-system, sans-serif";
        ctx.fillText("PHRONESIS WORKS, DIGITAL & KREATIF", 300, 126);

        ctx.fillStyle = "#333333";
        ctx.font = "bold 12px ui-monospace, SFMono-Regular, Monaco, Consolas, monospace";
        ctx.fillText("NMID: ID1026501167682", 300, 154);

        ctx.fillStyle = "#555555";
        ctx.font = "bold 14px system-ui, -apple-system, sans-serif";
        ctx.fillText("A01", 300, 180);

        // 6. Draw main center QR Code background card frame with small rounded shadow corners
        ctx.fillStyle = "#FFFFFF";
        ctx.strokeStyle = "#111111";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(82, 218, 436, 436, 12);
        } else {
          ctx.rect(82, 218, 436, 436);
        }
        ctx.fill();
        ctx.stroke();

        // Corner stylish marks inside the QRIS outer space card
        const offset = 8;
        ctx.fillStyle = "#E52F38";
        // Top Left corner marker
        ctx.fillRect(82 + offset, 218 + offset, 18, 3);
        ctx.fillRect(82 + offset, 218 + offset, 3, 18);
        // Top Right corner marker
        ctx.fillRect(518 - offset - 18, 218 + offset, 18, 3);
        ctx.fillRect(518 - offset - 3, 218 + offset, 3, 18);
        // Bottom Left corner marker
        ctx.fillRect(82 + offset, 654 - offset - 3, 18, 3);
        ctx.fillRect(82 + offset, 654 - offset - 18, 3, 18);
        // Bottom Right corner marker
        ctx.fillRect(518 - offset - 18, 654 - offset - 3, 18, 3);
        ctx.fillRect(518 - offset - 3, 654 - offset - 18, 3, 18);

        // 7. Generate MATHEMATICALLY REAL & SCANNABLE QR patterns using the official Node-QRCode engine
        // Using High error correction level ("Q") to safely allow the central custom Zawwaja badge placement
        const qrCodeDataUrl = await QRCode.toDataURL(QRIS_PAYLOAD, {
          margin: 1,
          errorCorrectionLevel: 'Q',
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });

        // Load the rendered QR matrix image onto our canvas container
        const qrImg = new Image();
        qrImg.onload = () => {
          // Draw QR code centered nicely on current card context
          ctx.drawImage(qrImg, 110, 246, 380, 380);

          // 8. Place official looking aesthetic double-heart center-badge
          const centerBadgeSize = 48;
          const badgeX = 300 - centerBadgeSize / 2;
          const badgeY = 436 - centerBadgeSize / 2;

          ctx.fillStyle = "#FFFFFF";
          ctx.strokeStyle = "#111111";
          ctx.lineWidth = 1;
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(badgeX, badgeY, centerBadgeSize, centerBadgeSize, 6);
          } else {
            ctx.rect(badgeX, badgeY, centerBadgeSize, centerBadgeSize);
          }
          ctx.fill();
          ctx.stroke();

          // Dark blue background inner envelope
          ctx.fillStyle = "#1C2E5A";
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(badgeX + 3, badgeY + 3, centerBadgeSize - 6, centerBadgeSize - 6, 4);
          } else {
            ctx.rect(badgeX + 3, badgeY + 3, centerBadgeSize - 6, centerBadgeSize - 6);
          }
          ctx.fill();

          // Brand overlapping love hearts
          ctx.fillStyle = "#E52F38";
          drawHeart(ctx, 300, 436, 12);
          ctx.fillStyle = "#FFA3A6";
          drawHeart(ctx, 303, 433, 9);

          // 9. Informational and Printed details Footer blocks
          ctx.fillStyle = "#1F2F57";
          ctx.textAlign = "center";
          ctx.font = "bold 15px system-ui, -apple-system, sans-serif";
          ctx.fillText("SATU QRIS UNTUK SEMUA", 300, 686);

          ctx.fillStyle = "#444444";
          ctx.font = "600 9px system-ui, -apple-system, sans-serif";
          ctx.fillText("Cek aplikasi penyelenggara di: www.aspi-qris.id", 300, 702);

          // Technical printed footer labels list (Bottom Left)
          ctx.fillStyle = "#555555";
          ctx.textAlign = "left";
          ctx.font = "bold 8.5px system-ui, -apple-system, sans-serif";
          ctx.fillText("Dicetak oleh: 93600914", 36, 786);
          ctx.fillText("Versi cetak: v0.0.2026.04.03", 36, 800);

          // Instruction visual panels (Bottom Right)
          ctx.fillStyle = "#666666";
          ctx.textAlign = "right";
          ctx.font = "bold 8.5px system-ui, -apple-system, sans-serif";
          ctx.fillText("Cara pembayaran QRIS", 564, 758);

          // Icon coordinates circles
          ctx.strokeStyle = "#888888";
          ctx.lineWidth = 1;
          ctx.fillStyle = "#FFFFFF";
          
          // Icon 1 (Buka Aplikasi)
          ctx.beginPath();
          ctx.arc(424, 788, 12, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();

          // Draw minimalist phone mockup inside Icon 1
          ctx.strokeStyle = "#333333";
          ctx.strokeRect(420, 782, 8, 12);
          ctx.fillStyle = "#333333";
          ctx.fillRect(423, 792, 2, 1);

          // Icon 2 (Scan dan Cek)
          ctx.beginPath();
          ctx.arc(474, 788, 12, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();

          // Draw Scan frame inside Icon 2
          ctx.strokeStyle = "#333333";
          ctx.strokeRect(470, 784, 8, 8);
          ctx.strokeStyle = "#E52F38";
          ctx.beginPath();
          ctx.moveTo(468, 788);
          ctx.lineTo(480, 788);
          ctx.stroke();

          // Icon 3 (Bayar)
          ctx.beginPath();
          ctx.arc(524, 788, 12, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();

          // Draw Check/Clock icon inside Icon 3
          ctx.strokeStyle = "#333333";
          ctx.beginPath();
          ctx.arc(524, 788, 5, 0, 2 * Math.PI);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(524, 785);
          ctx.lineTo(524, 788);
          ctx.lineTo(527, 788);
          ctx.stroke();

          // Labels under the instructions circles
          ctx.fillStyle = "#555555";
          ctx.textAlign = "center";
          ctx.font = "bold 6.5px system-ui, -apple-system, sans-serif";
          ctx.fillText("Buka Aplikasi", 424, 810);
          ctx.fillText("Berlogo QRIS", 424, 818);

          ctx.fillText("Scan dan cek", 474, 810);
          ctx.fillText("Bayar", 524, 810);

          // Export full vector-high context to a flat data URL representation
          const finalDataUrl = canvas.toDataURL("image/png");
          setQrisImage(finalDataUrl);
          setIsGenerating(false);
        };

        qrImg.onerror = (e) => {
          console.error("QR image compilation failed", e);
          setIsGenerating(false);
        };

        qrImg.src = qrCodeDataUrl;

      } catch (error) {
        console.error("Failed compiling dynamic QRIS PNG", error);
        setIsGenerating(false);
      }
    }

    generateQRISImage();
  }, []);

  const handleDownloadOriginal = () => {
    if (!qrisImage) return;
    setDownloadSuccess(false);

    try {
      const downloadLink = document.createElement("a");
      downloadLink.href = qrisImage;
      downloadLink.download = "QRIS-Phronesis-Works.png";
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
      
      {/* 
        PRECISE FIT & LOOK AS DEMANDED:
        Loads the flat, authentic generated image file using standard <img> tag.
        Allows standard mobile gestures (deep-press to save, pinch-zoom, native sharing).
      */}
      <div className="relative bg-white border border-stone-200 shadow-md rounded-2xl p-2 sm:p-4 w-full select-none overflow-hidden transition-all hover:shadow-lg">
        {isGenerating ? (
          <div className="h-[430px] w-full flex flex-col items-center justify-center gap-3 bg-stone-50/50 rounded-xl" id="qris-loading-fallback">
            <RefreshCw className="w-8 h-8 text-[#B76E79] animate-spin" />
            <p className="text-xs text-stone-500 font-sans">Menyiapkan berkas QRIS resmi...</p>
          </div>
        ) : (
          <img 
            src={qrisImage} 
            alt="Official QRIS Phronesis Works, Digital & Kreatif" 
            className="w-full h-auto rounded-xl object-contain object-center pointer-events-auto"
            id="qris-actual-image"
          />
        )}
      </div>

      {/* Controller Area */}
      <div className="w-full mt-4 flex flex-col gap-2" id="qris-card-controls">
        <button
          onClick={handleDownloadOriginal}
          disabled={isGenerating || !qrisImage}
          type="button"
          className="w-full py-2.5 px-4 bg-[#B76E79] hover:bg-[#A35964] active:bg-[#8F4B55] disabled:bg-stone-300 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer border-none outline-none"
        >
          {downloadSuccess ? (
            <Check size={16} />
          ) : (
            <Download size={16} />
          )}
          <span>{downloadSuccess ? "Tersimpan ke Galeri!" : "Unduh QRIS Resmi (PNG)"}</span>
        </button>
        
        {downloadSuccess && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-800 text-[10px] text-center font-sans tracking-wide leading-relaxed animate-fade-in">
            ✓ Berhasil diunduh! Silakan buka aplikasi perbankan atau dompet digital Anda (GoPay, OVO, ShopeePay, Dana, dll), scan berkas QRIS ini untuk menyelesaikan transaksi registrasi.
          </div>
        )}
      </div>
    </div>
  );
}
