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
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-zinc-950/95 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[2.5rem] p-8 flex flex-col items-center shadow-2xl relative overflow-hidden border border-zinc-200 dark:border-zinc-800">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors p-2 z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-xl font-black text-zinc-900 dark:text-white mb-6 mt-2 tracking-tight uppercase">Escanear Convite</h2>
        
        <div className="w-full rounded-3xl overflow-hidden border-2 border-indigo-500/20 bg-zinc-100 dark:bg-zinc-950 shadow-inner min-h-[300px]">
          <div id="qr-reader" className="w-full"></div>
        </div>
        
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-8 text-center leading-relaxed max-w-[200px]">
          Aponte a câmera para o QR Code de um amigo.
        </p>

        {/* Estilização para mover botões da lib para baixo */}
        <style jsx global>{`
          #qr-reader__dashboard_section_swaplink {
            display: block !important;
            margin-top: 20px !important;
            color: #6366f1 !important;
            text-decoration: none !important;
            font-weight: bold !important;
            font-size: 12px !important;
            text-transform: uppercase !important;
          }
          #qr-reader button {
            background-color: #6366f1 !important;
            color: white !important;
            border: none !important;
            padding: 10px 20px !important;
            border-radius: 12px !important;
            font-weight: bold !important;
            cursor: pointer !important;
            margin-top: 10px !important;
          }
        `}</style>
      </div>
    </div>
  );
}
