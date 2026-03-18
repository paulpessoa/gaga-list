'use client';

import Lottie from 'lottie-react';
import { useEffect, useState } from 'react';

// Um placeholder simples de animação Lottie (JSON mínimo válido)
const placeholderAnimation = {
  "v": "5.5.2",
  "fr": 60,
  "ip": 0,
  "op": 60,
  "w": 800,
  "h": 800,
  "nm": "Placeholder",
  "ddd": 0,
  "assets": [],
  "layers": []
};

export default function LottieFooter() {
  const [animationData, setAnimationData] = useState<any>(placeholderAnimation);

  useEffect(() => {
    // Em um cenário real, você importaria um JSON de animação 3D ou de personagens
    // import animationJson from '@/assets/animations/footer-characters.json';
    // setAnimationData(animationJson);
  }, []);

  return (
    <footer className="w-full h-48 mt-20 relative flex items-end justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/20 to-transparent pointer-events-none" />
      <div className="relative z-10 w-64 h-64 opacity-80 hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center">
        <Lottie 
          animationData={animationData} 
          loop={true} 
          className="w-full h-full absolute inset-0"
        />
        <div className="absolute bottom-10 left-0 w-full text-center text-xs text-indigo-300/50 font-mono">
          [Animação Lottie 3D Aqui]
        </div>
      </div>
    </footer>
  );
}
