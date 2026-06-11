import React, { useState, useEffect } from "react";
import { CreditCard, CheckCircle, ShieldCheck } from "lucide-react";

interface PaymentGatewayProps {
  userId: string;
  userEmail: string;
  userFullName: string;
  onPaymentSuccess: () => void;
}

export function PaymentGateway({ userId, userEmail, userFullName, onPaymentSuccess }: PaymentGatewayProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSnapLoaded, setIsSnapLoaded] = useState(false);

  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [showEmbed, setShowEmbed] = useState(false);

  useEffect(() => {
    // Load Midtrans Snap script dynamically
    const snapScriptUrl = "https://app.sandbox.midtrans.com/snap/snap.js";
    const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY || "";

    if (!clientKey) {
      console.warn("VITE_MIDTRANS_CLIENT_KEY is missing. Payment might fail.");
    }

    let scriptTag = document.querySelector(`script[src="${snapScriptUrl}"]`) as HTMLScriptElement;

    if (!scriptTag) {
      scriptTag = document.createElement("script");
      scriptTag.src = snapScriptUrl;
      scriptTag.setAttribute("data-client-key", clientKey);
      scriptTag.async = true;
      scriptTag.onload = () => setIsSnapLoaded(true);
      document.body.appendChild(scriptTag);
    } else {
      setIsSnapLoaded(true);
    }

    return () => {};
  }, []);

  // Polling for robust local dev without Webhooks
  useEffect(() => {
    if (!pendingOrderId) return;
    
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/status?orderId=${pendingOrderId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.transaction_status === 'settlement' || data.transaction_status === 'capture') {
            clearInterval(interval);
            setPendingOrderId(null);
            console.log("Polling success! Transaksi lunas via API backend.");
            onPaymentSuccess();
          }
        }
      } catch (err) {
        console.error("Gagal polling status Midtrans", err);
      }
    }, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, [pendingOrderId, onPaymentSuccess]);

  const handlePay = async () => {
    if (!isSnapLoaded) {
      setError("Midtrans API sedang dimuat, mohon tunggu sebentar.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create a unique order ID for this transaction attempt
      // Midtrans order_id max length is 50. Firebase UID (28) + ZAWWAJA (8) + Date (13) is exactly 50, which is risky.
      // We will shorten it to: ZWJ-{short_uid}-{timestamp}
      const shortUid = userId ? userId.substring(0, 8) : "GUEST";
      const orderId = `ZWJ-${shortUid}-${Date.now()}`;

      // Call our Vercel Serverless Function to get the snap token
      const response = await fetch("/api/transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          amount: 25000,
          customerDetails: {
            // Ensure first_name doesn't contain invalid characters
            first_name: userFullName.replace(/[^a-zA-Z0-9\s]/g, '').trim() || "Pengantin",
            email: userEmail || "guest@zawwaja.id",
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMsg = data.error || "Terjadi kesalahan saat memproses pembayaran.";
        if (data.details && data.details.error_messages) {
          errorMsg += " - " + data.details.error_messages.join(", ");
        }
        throw new Error(errorMsg);
      }

      // Start robust polling
      setPendingOrderId(orderId);
      setShowEmbed(true);

      // Trigger Midtrans Snap in Embed Mode after a tiny delay so the div renders
      setTimeout(() => {
        // @ts-ignore
        window.snap.embed(data.token, {
          embedId: 'snap-container',
          onSuccess: function (result: any) {
            console.log("Payment success (from embed):", result);
            setPendingOrderId(null);
            onPaymentSuccess();
          },
          onPending: function (result: any) {
            console.log("Payment pending:", result);
            setError("Pembayaran sedang diproses (Pending). Sistem akan mendeteksi otomatis jika lunas.");
          },
          onError: function (result: any) {
            console.log("Payment error:", result);
            setError("Pembayaran gagal. Silakan muat ulang halaman untuk mencoba lagi.");
          }
        });
      }, 100);

    } catch (err: any) {
      console.error("Payment Gateway Error:", err);
      setError(err.message || "Gagal memanggil layanan pembayaran.");
      setIsLoading(false);
      setShowEmbed(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full mx-auto transition-all duration-500" id="payment-gateway-wrapper">
      <div className={`relative w-full transition-all duration-500 ${showEmbed ? "bg-transparent rounded-none" : "bg-white/60 backdrop-blur-md shadow-xl border border-white/40 rounded-[20px] p-1.5 overflow-hidden"}`}>
        
        {/* Intro Screen - Hidden when embedded gateway opens */}
        <div className={`transition-all duration-300 ${showEmbed ? "opacity-0 h-0 hidden" : "opacity-100 h-auto"}`}>
          <div className="bg-gradient-to-br from-brand-50 to-stone-50 p-6 rounded-[16px] border border-white flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-brand-100/50 rounded-full flex items-center justify-center mb-3">
              <ShieldCheck size={24} className="text-brand-600" />
            </div>
            <h3 className="font-serif font-bold text-text-primary text-lg mb-1">Aktivasi Akun Zawwaja</h3>
            <p className="text-xs text-text-secondary leading-relaxed mb-4">
              Untuk membuka seluruh fitur perencanaan pernikahan, silakan selesaikan pembayaran iuran sebesar <strong className="text-brand-600">Rp 25.000</strong>.
            </p>

            <div className="bg-white px-4 py-3 rounded-xl border border-stone-100 shadow-sm w-full mb-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-tertiary">Total Tagihan</span>
                <span className="font-bold text-brand-600 font-mono text-sm">Rp 25.000</span>
              </div>
            </div>

            {error && (
              <div className="w-full mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs text-left flex items-start gap-2">
                ⚠️ <span>{error}</span>
              </div>
            )}

            <button
              onClick={handlePay}
              disabled={isLoading || !isSnapLoaded}
              className={`w-full py-3.5 rounded-xl font-bold text-white shadow-md flex items-center justify-center gap-2 transition-all ${
                isLoading || !isSnapLoaded
                  ? "bg-stone-300 cursor-not-allowed"
                  : "bg-brand-600 hover:bg-brand-500 cursor-pointer active:scale-95"
              }`}
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Memproses...
                </>
              ) : (
                <>
                  <CreditCard size={18} />
                  Bayar Sekarang
                </>
              )}
            </button>
          </div>

          <div className="p-4 text-center space-y-2">
            <p className="text-[10px] text-text-tertiary flex items-center justify-center gap-1">
              <CheckCircle size={12} className="text-emerald-500" />
              Pembayaran diproses secara aman oleh <strong>Midtrans</strong>
            </p>
          </div>
        </div>

        {/* Embedded Midtrans Container */}
        <div 
          id="snap-container" 
          className={`w-full overflow-hidden transition-all duration-700 ease-in-out ${showEmbed ? "min-h-[400px] opacity-100 bg-transparent" : "h-0 opacity-0"}`}
        ></div>

      </div>
    </div>
  );
}
