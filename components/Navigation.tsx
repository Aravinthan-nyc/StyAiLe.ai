import React from 'react';
import { AppView } from '../types';
import { Shirt, Plus, Sparkles, Settings } from './Icons';

interface NavigationProps {
    currentView: AppView;
    setView: (view: AppView) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, setView }) => {
    const navItems = [
        {
            view: AppView.WARDROBE,
            label: 'Wardrobe',
            icon: <Shirt size={22} />,
        },
        {
            view: AppView.ADD_ITEM,
            label: 'Add',
            icon: <Plus size={22} />,
        },
        {
            view: AppView.STYLIST,
            label: 'Stylist',
            icon: <Sparkles size={22} />,
        },
        {
            view: AppView.SETTINGS,
            label: 'Settings',
            icon: <Settings size={22} />,
        },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 max-w-xl mx-auto z-50">
            {/* Glass Navigation Bar */}
            <div className="glass-card-strong mx-4 mb-4 rounded-full px-2 py-2">
                <div className="flex justify-around items-center">
                    {navItems.map((item) => {
                        const isActive = currentView === item.view;
                        return (
                            <button
                                key={item.view}
                                onClick={() => setView(item.view)}
                                className={`flex flex-col items-center py-2 px-4 rounded-full transition-all duration-300 btn-press
                                ${isActive ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
                            >
                                <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                                    {item.icon}
                                </div>
                                {isActive && (
                                    <span className="text-[9px] mt-1 font-semibold tracking-wider uppercase">
                                        {item.label}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
};

export default Navigation;
