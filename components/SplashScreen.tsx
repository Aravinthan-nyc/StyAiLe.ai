import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
    onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
    const [stage, setStage] = useState(0);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer1 = setTimeout(() => setStage(1), 400);
        const timer2 = setTimeout(() => setStage(2), 1200);
        const timer3 = setTimeout(() => setStage(3), 2000);
        const timer4 = setTimeout(() => setIsExiting(true), 3000);
        const timer5 = setTimeout(onComplete, 3500);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
            clearTimeout(timer4);
            clearTimeout(timer5);
        };
    }, [onComplete]);

    return (
        <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black transition-opacity duration-700 ${isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>

            {/* Subtle Background Glow */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-white/5 rounded-full blur-[100px] animate-pulse"></div>

            <div className="relative z-10 text-center">
                {/* Logo Image */}
                <div className={`mb-6 transform transition-all duration-1000 ${stage >= 1 ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-90'}`}>
                    <div className="relative inline-block">
                        <img
                            src="/image.png"
                            alt="StyAiLe.ai Logo"
                            className="w-40 h-40 object-contain drop-shadow-[0_0_35px_rgba(255,255,255,0.4)]"
                        />
                        {/* Glow effect behind logo */}
                        <div className="absolute inset-0 bg-white/15 blur-3xl rounded-full -z-10"></div>
                    </div>
                </div>

                {/* App Name */}
                <div className={`transform transition-all duration-700 delay-200 ${stage >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'}`}>
                    <h1 className="text-4xl font-bold text-white tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        Sty<span className="text-white/70">Ai</span>Le<span className="text-white/50">.ai</span>
                    </h1>
                </div>

                {/* Tagline */}
                <div className={`mt-4 transform transition-all duration-700 ${stage >= 3 ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'}`}>
                    <p className="text-gray-500 text-xs font-medium tracking-[0.4em] uppercase">
                        Your AI Wardrobe
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SplashScreen;
