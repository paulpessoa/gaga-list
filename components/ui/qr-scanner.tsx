'use client';

import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X } from 'lucide-react';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function QRScanner({ onScanSuccess, onScanError, isOpen, onClose }: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (isOpen) {
      const isCameraEnabled = localStorage.getItem("hw_camera") !== "false";
      if (!isCameraEnabled) {
        alert("A câmera está desativada nas configurações do aplicativo.");
        onClose();
        return;
      }

      const timer = setTimeout(() => {
        try {
          const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true,
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          };

          const scanner = new Html5QrcodeScanner('qr-reader', config, false);
          scannerRef.current = scanner;

          scanner.render(
            (decodedText) => {
              scanner.clear().then(() => {
                onScanSuccess(decodedText);
              }).catch(err => console.error(err));
            },
            (errorMessage) => {
              if (onScanError && !errorMessage.includes("No MultiFormat Readers")) {
                onScanError(errorMessage);
              }
            }
          );
        } catch (err) {
          console.error("Erro ao iniciar QR Scanner:", err);
        }
      }, 500);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
          try {
            scannerRef.current.clear().catch(e => {});
          } catch (e) {}
        }
      };
    }
  }, [isOpen, onScanSuccess, onScanError, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-[#131313]/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#131313] w-full max-w-sm rounded-[3rem] p-8 flex flex-col items-center shadow-2xl relative overflow-hidden border-2 border-[#3d4a3d]/30">
        <button
          onClick={onClose}
          className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors p-2 z-10 bg-[#1c1b1b] rounded-xl border border-[#3d4a3d]/60"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-xl font-black text-[#e5e2e1] mb-6 mt-4 tracking-tight uppercase">Escanear Convite</h2>
        
        <div className="w-full rounded-[2.5rem] overflow-hidden border-2 border-[#53E076]/20 bg-[#1c1b1b] shadow-inner min-h-[300px]">
          <div id="qr-reader" className="w-full"></div>
        </div>
        
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mt-10 text-center leading-relaxed max-w-[220px]">
          Aponte a câmera para o QR Code de um amigo.
        </p>

        {/* Estilização para mover botões da lib para baixo */}
        <style jsx global>{`
          #qr-reader__dashboard_section_swaplink {
            display: block !important;
            margin-top: 24px !important;
            color: #53E076 !important;
            text-decoration: none !important;
            font-weight: 900 !important;
            font-size: 10px !important;
            text-transform: uppercase !important;
            letter-spacing: 0.1em !important;
          }
          #qr-reader button {
            background-color: #53E076 !important;
            color: #131313 !important;
            border: none !important;
            padding: 14px 28px !important;
            border-radius: 16px !important;
            font-weight: 900 !important;
            font-size: 10px !important;
            text-transform: uppercase !important;
            letter-spacing: 0.1em !important;
            cursor: pointer !important;
            margin-top: 15px !important;
            transition: all 0.2s !important;
            box-shadow: 0 10px 15px -3px rgba(83, 224, 118, 0.2) !important;
          }
          #qr-reader button:active {
            transform: scale(0.95) !important;
          }
        `}</style>
      </div>
    </div>
  );
}
