// lib/agent/live-audio.ts

/**
 * Áudio da conversa por voz (Gemini Live): o Live recebe PCM 16-bit mono a 16 kHz
 * e devolve PCM 16-bit mono a 24 kHz.
 *
 * PORQUÊ: Usamos um único AudioContext na taxa nativa do aparelho para microfone e
 * reprodução. Forçar a taxa no AudioContext falha no Firefox (mic em outra taxa) e
 * no iOS; reamostrar no worklet e criar buffers de 24 kHz funciona em todos.
 */

const TARGET_RATE = 16000
const PLAYBACK_RATE = 24000

// Reamostra para 16 kHz (média por janela) e envia blocos de ~100 ms com o nível de volume
const WORKLET_SOURCE = `
class PcmCapture extends AudioWorkletProcessor {
  constructor() {
    super()
    this.ratio = sampleRate / ${TARGET_RATE}
    this.pos = 0; this.sum = 0; this.count = 0
    this.chunk = new Int16Array(${TARGET_RATE / 10}); this.n = 0; this.energy = 0
  }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0]
    if (!ch) return true
    for (let i = 0; i < ch.length; i++) {
      this.sum += ch[i]; this.count++; this.pos++
      if (this.pos >= this.ratio) {
        this.pos -= this.ratio
        const s = Math.max(-1, Math.min(1, this.sum / this.count))
        this.sum = 0; this.count = 0
        this.energy += s * s
        this.chunk[this.n++] = s < 0 ? s * 0x8000 : s * 0x7fff
        if (this.n === this.chunk.length) {
          this.port.postMessage({ pcm: this.chunk.buffer, level: Math.sqrt(this.energy / this.n) }, [this.chunk.buffer])
          this.chunk = new Int16Array(${TARGET_RATE / 10}); this.n = 0; this.energy = 0
        }
      }
    }
    return true
  }
}
registerProcessor("pcm-capture", PcmCapture)
`

function toBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ""
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(binary)
}

function fromBase64(data: string) {
  const binary = atob(data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

export class LiveAudio {
  readonly ctx: AudioContext
  private stream: MediaStream | null = null
  private worklet: AudioWorkletNode | null = null
  private sources = new Set<AudioBufferSourceNode>()
  private nextStart = 0
  onPlaybackEnd: (() => void) | null = null

  /** Precisa ser chamado dentro do gesto do usuário (toque), por causa do autoplay do iOS. */
  constructor() {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext
    this.ctx = new Ctx()
    void this.ctx.resume()
  }

  async startMic(onChunk: (base64: string, level: number) => void) {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 }
    })
    const url = URL.createObjectURL(new Blob([WORKLET_SOURCE], { type: "application/javascript" }))
    try {
      await this.ctx.audioWorklet.addModule(url)
    } finally {
      URL.revokeObjectURL(url)
    }
    this.worklet = new AudioWorkletNode(this.ctx, "pcm-capture")
    this.worklet.port.onmessage = (e) => onChunk(toBase64(e.data.pcm), e.data.level)
    this.ctx.createMediaStreamSource(this.stream).connect(this.worklet)
  }

  /** Enfileira um trecho de áudio da Gaga logo após o anterior, sem lacunas. */
  play(base64: string) {
    const pcm = new Int16Array(fromBase64(base64))
    if (!pcm.length) return
    const buffer = this.ctx.createBuffer(1, pcm.length, PLAYBACK_RATE)
    const channel = buffer.getChannelData(0)
    for (let i = 0; i < pcm.length; i++) channel[i] = pcm[i] / 0x8000

    const source = this.ctx.createBufferSource()
    source.buffer = buffer
    source.connect(this.ctx.destination)
    const startAt = Math.max(this.nextStart, this.ctx.currentTime + 0.05)
    source.start(startAt)
    this.nextStart = startAt + buffer.duration
    this.sources.add(source)
    source.onended = () => {
      this.sources.delete(source)
      if (!this.sources.size) this.onPlaybackEnd?.()
    }
  }

  get isPlaying() {
    return this.sources.size > 0
  }

  /** Usuário interrompeu a Gaga: corta o que estava tocando e o que estava na fila. */
  interrupt() {
    this.sources.forEach((s) => {
      s.onended = null
      try {
        s.stop()
      } catch {
        // já tinha terminado
      }
    })
    this.sources.clear()
    this.nextStart = 0
  }

  close() {
    this.interrupt()
    this.worklet?.disconnect()
    this.stream?.getTracks().forEach((t) => t.stop())
    void this.ctx.close().catch(() => {})
  }
}
