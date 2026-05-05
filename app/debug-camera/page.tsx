"use client"

import { useState, useRef, useCallback } from "react"
import { Camera, RefreshCw, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"

export default function DebugCameraPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  
  const [status, setStatus] = useState("Aguardando...")
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [aiResult, setAiResult] = useState<any>(null)

  const startCamera = async () => {
    try {
      setStatus("Solicitando permissão...")
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" },
        audio: false 
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setStatus("Câmera Ativa")
    } catch (err: any) {
      setStatus(`Erro: ${err.message}`)
    }
  }

  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return
    
    const video = videoRef.current
    const canvas = canvasRef.current
    
    // Debug de dimensões
    console.log("Video Width:", video.videoWidth)
    console.log("Video Height:", video.videoHeight)

    if (video.videoWidth === 0) {
      setStatus("Erro: Vídeo ainda não carregou os frames.")
      return
    }

    const ctx = canvas.getContext("2d")
    if (ctx) {
      // Usar dimensões nativas para o teste 1
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0)
      
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8)
      setCapturedImage(dataUrl)
      setStatus("Foto Capturada!")
    }
  }

  const sendToAi = async () => {
    if (!capturedImage) return
    setIsProcessing(true)
    setStatus("Enviando para IA...")
    
    try {
      const response = await fetch("/api/ai/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: capturedImage })
      })
      const data = await response.json()
      setAiResult(data)
      setStatus("IA Respondeu!")
    } catch (err: any) {
      setStatus(`Erro IA: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6 font-mono text-xs">
      <h1 className="text-xl font-bold mb-4 text-indigo-400">CAMERA DEBUG v1.0</h1>
      
      <div className="bg-black rounded-xl overflow-hidden aspect-video mb-4 relative border border-zinc-800">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-[10px]">
          STATUS: {status}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <button onClick={startCamera} className="bg-zinc-800 p-4 rounded-xl flex flex-col items-center gap-2">
          <RefreshCw className="w-5 h-5 text-indigo-400" />
          LIGAR CÂMERA
        </button>
        <button onClick={capture} className="bg-zinc-800 p-4 rounded-xl flex flex-col items-center gap-2">
          <Camera className="w-5 h-5 text-emerald-400" />
          CAPTURAR
        </button>
      </div>

      {capturedImage && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="border-2 border-emerald-500 rounded-xl overflow-hidden">
            <p className="bg-emerald-500 text-black px-2 py-1 font-bold">PREVIEW DA CAPTURA:</p>
            <img src={capturedImage} className="w-full h-auto" />
          </div>
          
          <button 
            onClick={sendToAi} 
            disabled={isProcessing}
            className="w-full bg-indigo-600 p-6 rounded-2xl font-bold text-base flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
          >
            {isProcessing ? <Loader2 className="animate-spin" /> : <Send />}
            TESTAR IA COM ESTA FOTO
          </button>
        </div>
      )}

      {aiResult && (
        <div className="mt-6 p-4 bg-zinc-800 rounded-xl border border-zinc-700">
          <p className="text-indigo-400 font-bold mb-2">RESULTADO IA:</p>
          <pre className="overflow-auto max-h-40 text-[10px]">
            {JSON.stringify(aiResult, null, 2)}
          </pre>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
