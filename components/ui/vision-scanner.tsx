'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { X, RefreshCw, Loader2, ShoppingBag } from 'lucide-react';
import { useHaptic } from '@/hooks/use-haptic';

interface VisionScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (data: any) => void;
  mode?: 'product' | 'ocr';
}

export function VisionScanner({ isOpen, onClose, onScanSuccess, mode = 'product' }: VisionScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isProcessing, setIsAiProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const { trigger } = useHaptic();

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCapturedImage(null);
  }, [stream]);

  const startCamera = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: false 
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
    } catch (err) {
      console.error('Erro ao acessar câmera:', err);
      alert('Não foi possível acessar a câmera.');
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, startCamera, stopCamera, stream]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(dataUrl);
        trigger('medium');
        processImage(dataUrl);
      }
    }
  };

  const processImage = async (base64Image: string) => {
    setIsAiProcessing(true);
    try {
      const endpoint = mode === 'product' ? '/api/ai/vision' : '/api/ai/ocr';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image })
      });

      if (!response.ok) throw new Error('Falha na análise da IA');
      
      const data = await response.json();
      trigger('success' as any);
      onScanSuccess(mode === 'product' ? data.data : data.items);
    } catch (err) {
      console.error(err);
      alert('Erro ao identificar produto com IA.');
      setCapturedImage(null);
    } finally {
      setIsAiProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black flex flex-col animate-in fade-in duration-300">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10 pointer-events-none">
        <button
          onClick={onClose}
          className="p-3 rounded-2xl bg-zinc-900/50 backdrop-blur-md border border-white/10 text-white pointer-events-auto active:scale-95 transition-all"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="bg-zinc-900/50 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl text-white">
          <span className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            {mode === 'product' ? 'AI Scanner' : 'Lista via Foto'}
          </span>
        </div>
        <div className="w-12" />
      </div>

      {/* Viewport */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {capturedImage ? (
          <img src={capturedImage} className="w-full h-full object-cover" alt="Capturado" />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}

        {/* Overlay do Scanner */}
        {!capturedImage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-64 h-64 border-2 border-indigo-500/50 rounded-[3rem] relative">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500 rounded-tl-2xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500 rounded-tr-2xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500 rounded-bl-2xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500 rounded-br-2xl" />
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-indigo-500/30 animate-scan" />
            </div>
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-8 bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">
              {mode === 'product' ? 'Enquadre o produto ou rótulo' : 'Enquadre a lista de papel'}
            </p>
          </div>
        )}

        {isProcessing && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4 text-white p-8 text-center">
            <div className="relative">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
              <ShoppingBag className="w-6 h-6 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black">Analisando com IA</h3>
              <p className="text-zinc-400 text-sm font-medium">
                {mode === 'product' ? 'O GROQ está identificando o produto...' : 'O GROQ está lendo sua lista de papel...'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer / Controls */}
      <div className="p-10 bg-zinc-950 flex items-center justify-center gap-8 relative">
        <button
          onClick={() => {
            setCapturedImage(null);
            setIsAiProcessing(false);
            startCamera();
          }}
          className="p-4 rounded-full bg-zinc-900 text-zinc-500 active:scale-95 transition-all"
        >
          <RefreshCw className="w-6 h-6" />
        </button>

        <button
          onClick={capturePhoto}
          disabled={!!capturedImage || isProcessing}
          className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)] active:scale-90 transition-all disabled:opacity-50 disabled:scale-100"
        >
          <div className="w-16 h-16 rounded-full border-4 border-zinc-950 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-indigo-500" />
          </div>
        </button>

        <div className="w-14 h-14" />
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <style jsx global>{`
        @keyframes scan {
          0%, 100% { transform: translateY(-120px); }
          50% { transform: translateY(120px); }
        }
        .animate-scan {
          animation: scan 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
