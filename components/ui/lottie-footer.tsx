'use client';

import Lottie from 'lottie-react';
import { useEffect, useState } from 'react';

// URL verificada de um carrinho de compras animado (CDN estável)
const ANIMATION_URL = 'https://assets3.lottiefiles.com/packages/lf20_uw8n6at8.json';

export default function LottieFooter() {
  const [animationData, setAnimationData] = useState<any>(null);

  useEffect(() => {
    const loadLottie = async () => {
      try {
        const response = await fetch(ANIMATION_URL);
        
        // Verifica se a resposta é realmente um JSON
        const contentType = response.headers.get("content-type");
        if (response.ok && contentType && contentType.includes("application/json")) {
          const data = await response.json();
          setAnimationData(data);
        } else {
          console.warn('Lottie: URL não retornou um JSON válido.');
        }
      } catch (err) {
        console.error('Erro ao buscar animação Lottie:', err);
      }
    };

    loadLottie();
  }, []);

  if (!animationData) return <div className="h-48" />;

  return (
    <footer className="w-full h-48 relative flex items-end justify-center overflow-hidden pointer-events-none mt-auto">
      {/* Glow effect */}
      <div className="absolute bottom-[-50px] w-full h-32 bg-indigo-500/10 blur-[100px] rounded-full" />
      
      <div className="relative z-10 w-full max-w-[280px] h-full opacity-40 hover:opacity-100 transition-all duration-700">
        <Lottie 
          animationData={animationData} 
          loop={true} 
          className="w-full h-full"
        />
      </div>
      
      {/* Overlay para misturar com o fundo */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent h-24 bottom-0" />
    </footer>
  );
}
