'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { X, RefreshCw, Loader2, Camera, Send, ShieldCheck } from 'lucide-react';
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
  const streamRef = useRef<MediaStream | null>(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Pronto');
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
      setStatus('Iniciando...');
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: false 
      });
      streamRef.current = s;
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
      setStatus('Câmera Ativa');
    } catch (err) {
      console.error('Erro ao acessar câmera:', err);
      setStatus('Erro de Acesso');
      alert('Não conseguimos acessar sua câmera. Verifique as permissões.');
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setIsAiProcessing(false);
      setCapturedImage(null);
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

      if (video.videoWidth === 0) {
        setStatus('Vídeo não pronto');
        return;
      }

      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Usar dimensões nativas para máxima fidelidade
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(dataUrl);
        trigger('medium');
        setStatus('Capturado');
      }
    }
  };

  const processImage = async () => {
    if (!capturedImage) return;
    setIsAiProcessing(true);
    setStatus('Analisando...');
    
    try {
      const endpoint = mode === 'product' ? '/api/ai/vision' : '/api/ai/ocr';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: capturedImage })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro na IA');
      
      trigger('success' as any);
      onScanSuccess(data);
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
      setCapturedImage(null);
      setStatus('Erro na IA');
    } finally {
      setIsAiProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-black flex flex-col pointer-events-auto overflow-hidden">
      {/* Header com Badge de Versão */}
      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-20">
        <button 
          onClick={onClose} 
          className="p-3 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-white active:scale-95 transition-all pointer-events-auto"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="bg-indigo-500 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg shadow-indigo-500/40">
          <ShieldCheck className="w-4 h-4 text-white" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Motor V3 - Ativo</span>
        </div>
        
        <div className="w-12" />
      </div>

      {/* Área do Vídeo */}
      <div className="flex-1 relative flex items-center justify-center bg-zinc-950">
        {isAiProcessing ? (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center gap-6 text-white p-8 text-center z-30">
             <div className="relative">
                <Loader2 className="w-16 h-16 text-indigo-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-indigo-500 rounded-full animate-pulse" />
                </div>
             </div>
             <div className="space-y-2">
                <h3 className="text-2xl font-black tracking-tight italic">PROCESSANDO...</h3>
                <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest opacity-60">Enviando para o motor de IA</p>
             </div>
          </div>
        ) : capturedImage ? (
          <div className="relative w-full h-full">
            <img src={capturedImage} className="w-full h-full object-cover" alt="Capturado" />
            <div className="absolute inset-0 bg-black/20" />
          </div>
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        )}
        
        {/* Status discreto */}
        <div className="absolute bottom-32 left-0 right-0 flex justify-center pointer-events-none">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30">{status}</span>
        </div>
      </div>

      {/* Controles Inferiores */}
      <div className="p-10 bg-black flex items-center justify-center gap-8 relative border-t border-white/5 pointer-events-auto">
        {!capturedImage ? (
          <>
            <button 
              onClick={() => { setCapturedImage(null); startCamera(); }} 
              className="p-4 rounded-full bg-zinc-900 text-zinc-500 active:scale-95 transition-all pointer-events-auto"
            >
              <RefreshCw className="w-6 h-6" />
            </button>
            
            <button 
              onClick={capturePhoto} 
              className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.2)] active:scale-90 transition-all pointer-events-auto"
            >
              <div className="w-20 h-20 rounded-full border-[6px] border-black flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-indigo-500 shadow-inner" />
              </div>
            </button>
            
            <div className="w-14" />
          </>
        ) : (
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <button 
              onClick={processImage}
              disabled={isAiProcessing}
              className="w-full py-6 bg-white text-black rounded-[2rem] font-black uppercase tracking-[0.2em] text-[12px] flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all pointer-events-auto"
            >
              <Send className="w-5 h-5 fill-black" />
              Enviar para IA
            </button>
            <button 
              onClick={() => { setCapturedImage(null); startCamera(); }}
              className="w-full py-4 text-zinc-500 font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all pointer-events-auto"
            >
              Tirar Outra Foto
            </button>
          </div>
        )}
      </div>
      
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
