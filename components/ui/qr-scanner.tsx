'use client';

import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';

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
      // Pequeno delay para garantir que o container DOM existe
      const timer = setTimeout(() => {
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        };

        const scanner = new Html5QrcodeScanner('qr-reader', config, false);
        scannerRef.current = scanner;

        scanner.render(
          (decodedText) => {
            scanner.clear();
            onScanSuccess(decodedText);
          },
          (errorMessage) => {
            if (onScanError) onScanError(errorMessage);
          }
        );
      }, 100);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
          scannerRef.current.clear().catch(err => console.error('Failed to clear scanner', err));
        }
      };
    }
  }, [isOpen, onScanSuccess, onScanError]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[2.5rem] p-8 flex flex-col items-center shadow-2xl relative overflow-hidden border border-zinc-200 dark:border-zinc-800">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors p-2 z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>

        <h2 className="text-xl font-black text-zinc-900 dark:text-white mb-6 mt-2">Escanear QR CODE</h2>
        
        <div id="qr-reader" className="w-full rounded-2xl overflow-hidden border-2 border-indigo-500/20 bg-zinc-100 dark:bg-zinc-950 shadow-inner"></div>
        
        <p className="text-zinc-500 text-xs font-medium mt-6 text-center leading-relaxed">
          Aponte a câmera para o QR Code do convite da lista.
        </p>
      </div>
    </div>
  );
}
