import React from "react";

/**
 * Wrapper component to render app components inside Remotion
 * Provides necessary styling context and viewport dimensions
 * Uses Outfit font for premium feel
 */
export interface AppWrapperProps {
  children: React.ReactNode;
  scale?: number;
}

export const AppWrapper: React.FC<AppWrapperProps> = ({
  children,
  scale = 1
}) => {
  return (
    <div
      style={{
        width: 1080,
        height: 1920,
        backgroundColor: "#050505",
        fontFamily: "'Outfit', 'SF Pro Display', system-ui, sans-serif",
        overflow: "hidden",
        position: "relative",
        transform: `scale(${scale})`,
        transformOrigin: "top left",
      }}
    >
      {/* Google Font import + global styles */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
          
          * {
            box-sizing: border-box;
          }
          
          /* Tailwind-like utilities that app uses */
          .glass-card {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.05);
          }
          
          .glass-card-strong {
            background: rgba(30, 30, 30, 0.9);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .btn-press:active {
            transform: scale(0.98);
          }
          
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          
          .animate-fade-in {
            animation: fadeIn 0.3s ease-in;
          }
          
          .animate-slide-up {
            animation: slideUp 0.4s ease-out;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
      {children}
    </div>
  );
};
