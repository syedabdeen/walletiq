import { useEffect, useState } from 'react';
import walletiqLogo from '@/assets/walletiq-logo.png';

interface SplashScreenProps {
  onComplete: () => void;
  minDuration?: number;
}

export function SplashScreen({ onComplete, minDuration = 1500 }: SplashScreenProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      // Wait for exit animation to complete
      setTimeout(onComplete, 500);
    }, minDuration);

    return () => clearTimeout(timer);
  }, [minDuration, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] gradient-hero flex flex-col items-center justify-center transition-all duration-500 ${
        isExiting ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
      }`}
    >
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-64 h-64 rounded-full bg-primary/10 animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-primary/5 animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Logo and content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Animated logo */}
        <div className="relative">
          <div className="absolute inset-0 rounded-3xl blur-xl opacity-50 animate-pulse bg-primary/30" />
          <img 
            src={walletiqLogo} 
            alt="WalletIQ" 
            className="relative w-28 h-28 animate-scale-in"
          />
        </div>

        {/* App name */}
        <h1 
          className="mt-6 text-3xl font-bold text-primary-foreground animate-fade-in"
          style={{ animationDelay: '0.2s' }}
        >
          WalletIQ
        </h1>

        {/* Tagline */}
        <p 
          className="mt-2 text-primary-foreground/70 animate-fade-in"
          style={{ animationDelay: '0.4s' }}
        >
          Smart expense tracking
        </p>

        {/* Loading indicator */}
        <div 
          className="mt-8 flex gap-1.5 animate-fade-in"
          style={{ animationDelay: '0.6s' }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-primary-foreground/60 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>

      {/* Brand badge */}
      <div 
        className="absolute bottom-12 text-center animate-fade-in"
        style={{ animationDelay: '0.8s' }}
      >
        <p className="text-primary-foreground/50 text-sm">
          Powered by WalletIQ
        </p>
      </div>
    </div>
  );
}
