"use client"

type AICreditModalState = {
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
}

// Singleton para o estado do modal
let listeners: Array<(state: boolean) => void> = []
let internalIsOpen = false

export const aiCreditModal = {
  open: () => {
    internalIsOpen = true
    listeners.forEach((l) => l(true))
  },
  close: () => {
    internalIsOpen = false
    listeners.forEach((l) => l(false))
  },
  subscribe: (listener: (state: boolean) => void) => {
    listeners.push(listener)
    return () => {
      listeners = listeners.filter((l) => l !== listener)
    }
  },
  getIsOpen: () => internalIsOpen
}

import { useState, useEffect } from "react"

export function useAICreditModal() {
  const [isOpen, setIsOpen] = useState(internalIsOpen)

  useEffect(() => {
    const unsubscribe = aiCreditModal.subscribe(setIsOpen)
    return unsubscribe
  }, [])

  return {
    isOpen,
    open: aiCreditModal.open,
    close: aiCreditModal.close
  }
}
