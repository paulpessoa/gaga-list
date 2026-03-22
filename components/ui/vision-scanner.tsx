'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { X, RefreshCw, Loader2, ShoppingBag, ShieldAlert } from 'lucide-react';
import { useHaptic } from '@/hooks/use-haptic';
import { extractJSON } from '@/lib/ai-utils';

interface VisionScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (data: any) => void;
  mode?: 'product' | 'ocr';
}

export function VisionScanner({ isOpen, onClose, onScanSuccess, mode = 'product' }: VisionScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [rawAiResponse, setRawAiResponse] = useState<string | null>(null);
  const { trigger } = useHaptic();

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCapturedImage(null);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }, 
        audio: false 
      });
      streamRef.current = s;
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
    } catch (err) {
      console.error('Erro ao acessar câmera:', err);
      alert('Permissão de câmera negada.');
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, startCamera, stopCamera]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const maxWidth = 800;
      const scale = maxWidth / video.videoWidth;
      canvas.width = maxWidth;
      canvas.height = video.videoHeight * scale;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setCapturedImage(dataUrl);
        trigger('medium');
        processImage(dataUrl);
      }
    }
  };

  const processImage = async (base64Image: string) => {
    setIsAiProcessing(true);
    setRawAiResponse(null);
    try {
      const endpoint = mode === 'product' ? '/api/ai/vision' : '/api/ai/ocr';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image })
      });
      
      const textResponse = await response.text();
      let result;
      
      try {
        result = extractJSON(textResponse);
        if (!result) {
          setRawAiResponse(textResponse);
          throw new Error("Não foi possível extrair dados válidos da IA.");
        }
      } catch (parseError) {
        if (!rawAiResponse) setRawAiResponse(textResponse);
        throw new Error("A IA retornou um formato inesperado.");
      }

      if (!response.ok) throw new Error(result.details || result.error || 'Falha na análise');
      
      trigger('success' as any);
      onScanSuccess(result);
    } catch (err: any) {
      console.error('Erro no Scanner:', err);
      // Se não houver rawAiResponse setado (erro de rede, etc), mostra alerta
      if (!rawAiResponse) {
        alert(`Erro: ${err.message}`);
        setCapturedImage(null);
      }
    } finally {
      setIsAiProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black flex flex-col animate-in fade-in duration-300">
      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10 pointer-events-none">
        <button onClick={onClose} className="p-3 rounded-2xl bg-zinc-900/50 backdrop-blur-md border border-white/10 text-white pointer-events-auto active:scale-95 transition-all"><X className="w-6 h-6" /></button>
        <div className="bg-zinc-900/50 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl text-white">
          <span className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            {mode === 'product' ? 'AI Scanner' : 'Lista via Foto'}
          </span>
        </div>
        <div className="w-12" />
      </div>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {isAiProcessing ? (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4 text-white p-8 text-center z-20">
             <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
             <div className="space-y-1">
                <h3 className="text-xl font-black">Analisando com IA</h3>
                <p className="text-zinc-400 text-sm font-medium">{mode === 'product' ? 'Identificando produto...' : 'Lendo lista de papel...'}</p>
             </div>
          </div>
        ) : rawAiResponse ? (
          <div className="absolute inset-0 bg-zinc-950 p-8 flex flex-col gap-6 z-30 overflow-y-auto pt-24">
             <div className="flex items-center gap-3 text-amber-500">
                <ShieldAlert className="w-6 h-6" />
                <h2 className="text-xl font-black uppercase tracking-tight text-white">Resposta Bruta da IA</h2>
             </div>
             <p className="text-zinc-400 text-xs font-medium leading-relaxed">
               A IA retornou um formato inesperado. Você pode copiar o texto abaixo:
             </p>
             <div className="bg-zinc-900 rounded-2xl p-6 border border-white/5 font-mono text-[10px] text-zinc-300 whitespace-pre-wrap break-words shadow-inner max-h-48 overflow-y-auto">
                {rawAiResponse}
             </div>
             
             <div className="flex flex-col gap-3">
               <button 
                 onClick={() => {
                   trigger('success' as any);
                   onScanSuccess({ 
                     items: [{ name: rawAiResponse.substring(0, 100) + (rawAiResponse.length > 100 ? '...' : '') }],
                     isRaw: true 
                   });
                   setRawAiResponse(null);
                 }}
                 className="w-full py-4.5 bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all shadow-lg shadow-indigo-500/20"
               >
                 Usar como Item Solto
               </button>
               <button 
                 onClick={() => { setRawAiResponse(null); setCapturedImage(null); startCamera(); }}
                 className="w-full py-4.5 bg-zinc-800 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all"
               >
                 Tentar Novamente
               </button>
             </div>
          </div>
        ) : capturedImage ? (
          <img src={capturedImage} className="w-full h-full object-cover" alt="Capturado" />
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        )}

        {!capturedImage && !isAiProcessing && !rawAiResponse && (
          <div className="absolute bottom-32 left-0 right-0 flex justify-center">
            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest bg-black/40 px-6 py-3 rounded-full backdrop-blur-md border border-white/5">
              {mode === 'product' ? 'Aponte para o produto' : 'Aponte para a lista'}
            </p>
          </div>
        )}
      </div>

      <div className="p-10 bg-zinc-950 flex items-center justify-center gap-8 relative">
        <button onClick={() => { setRawAiResponse(null); setCapturedImage(null); setIsAiProcessing(false); startCamera(); }} className="p-4 rounded-full bg-zinc-900 text-zinc-500 active:scale-95 transition-all"><RefreshCw className="w-6 h-6" /></button>
        <button onClick={capturePhoto} disabled={!!capturedImage || isAiProcessing || !!rawAiResponse} className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)] active:scale-90 transition-all disabled:opacity-50"><div className="w-16 h-16 rounded-full border-4 border-zinc-950 flex items-center justify-center"><div className="w-12 h-12 rounded-full bg-indigo-500" /></div></button>
        <div className="w-14" />
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
