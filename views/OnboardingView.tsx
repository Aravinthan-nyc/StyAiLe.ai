/**
 * OnboardingView - Tutorial slides for new users
 * Shows app features after first sign-in
 */

import React, { useState } from 'react';
import { Shirt, Sparkles, Lock, Camera, ChevronRight, Check } from '../components/Icons';

interface OnboardingViewProps {
    onComplete: () => void;
}

const slides = [
    {
        icon: Sparkles,
        title: 'Welcome to StyAiLe.ai',
        description: 'Your AI-powered personal stylist. Let\'s get you started with the coolest wardrobe app ever!',
    },
    {
        icon: Shirt,
        title: 'Your Digital Wardrobe',
        description: 'Upload photos of your clothes. AI analyzes colors, styles, and occasions automatically.',
    },
    {
        icon: Sparkles,
        title: 'AI Stylist Chat',
        description: 'Chat with your personal AI stylist. Get outfit recommendations for any occasion - dates, parties, work!',
    },
    {
        icon: Lock,
        title: 'Smart Laundry Tracking',
        description: 'Wore an outfit? Lock those items! AI won\'t suggest them until they\'re washed and ready.',
    },
    {
        icon: Camera,
        title: 'Rate My Fit',
        description: 'Send a selfie in your outfit. AI rates your look and gives honest, helpful feedback!',
    },
];

const OnboardingView: React.FC<OnboardingViewProps> = ({ onComplete }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const handleNext = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(currentSlide + 1);
        } else {
            onComplete();
        }
    };

    const handleSkip = () => {
        onComplete();
    };

    const slide = slides[currentSlide];
    const Icon = slide.icon;
    const isLastSlide = currentSlide === slides.length - 1;

    return (
        <div className="min-h-screen bg-black flex flex-col text-white font-sans">
            {/* Background */}
            <div className="absolute inset-0 bg-black" />

            {/* Skip button - moved down slightly for better touch area */}
            {!isLastSlide && (
                <button
                    onClick={handleSkip}
                    className="absolute top-8 right-8 text-gray-500 hover:text-white text-sm font-bold z-20 tracking-wide uppercase transition-colors"
                >
                    Skip
                </button>
            )}

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10">
                {/* Icon */}
                <div className="w-40 h-40 rounded-[2.5rem] bg-white flex items-center justify-center mb-12 shadow-[0_0_50px_-10px_rgba(255,255,255,0.3)] transform transition-transform duration-500 hover:scale-105">
                    <Icon size={64} className="text-black" />
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold text-white text-center mb-6 tracking-tight">
                    {slide.title}
                </h1>

                {/* Description */}
                <p className="text-gray-400 text-center text-lg leading-relaxed max-w-sm font-medium">
                    {slide.description}
                </p>
            </div>

            {/* Bottom section */}
            <div className="px-8 pb-12 relative z-10">
                {/* Progress dots */}
                <div className="flex justify-center gap-3 mb-10">
                    {slides.map((_, index) => (
                        <div
                            key={index}
                            className={`h-2 rounded-full transition-all duration-300 ${index === currentSlide
                                ? 'w-10 bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]'
                                : 'w-2 bg-white/20'
                                }`}
                        />
                    ))}
                </div>

                {/* Next button */}
                <button
                    onClick={handleNext}
                    className="w-full py-5 bg-white text-black font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-100 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-white/5 text-lg"
                >
                    {isLastSlide ? (
                        <>
                            Get Started <Check size={24} />
                        </>
                    ) : (
                        <>
                            Next <ChevronRight size={24} />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default OnboardingView;
