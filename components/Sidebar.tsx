import React from 'react';
import { AppView } from '../types';
import {
    X,
    Shirt,
    Save,
    Calendar,
    Package,
    Layers,
    BarChart3,
    CreditCard,
    Key,
    Download,
    Sparkles,
    Settings,
    Trash2
} from './Icons';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    currentView: AppView;
    onNavigate: (view: AppView) => void;
    hasFeature: (feature: string) => boolean;
}

interface MenuItem {
    icon: React.ReactNode;
    label: string;
    view: AppView;
    badge?: string;
    requiresFeature?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, currentView, onNavigate, hasFeature }) => {
    const menuSections = [
        {
            title: 'My Wardrobe',
            items: [
                { icon: <Shirt size={20} />, label: 'Wardrobe', view: AppView.WARDROBE },
                { icon: <Save size={20} />, label: 'Saved Outfits', view: AppView.SAVED_OUTFITS },
                { icon: <Trash2 size={20} />, label: 'Laundry Tracker', view: AppView.LAUNDRY },
                { icon: <Calendar size={20} />, label: 'Weekly Planner', view: AppView.OUTFIT_PLANNER, requiresFeature: 'hasExport', badge: 'Starter+' },
            ] as MenuItem[]
        },
        {
            title: 'Premium Features',
            icon: <Sparkles size={16} className="text-gray-400" />,
            items: [
                { icon: <Package size={20} />, label: 'Packing Lists', view: AppView.PACKING_LIST, requiresFeature: 'hasPacking', badge: 'Pro+' },
                { icon: <Layers size={20} />, label: 'Capsule Wardrobe', view: AppView.CAPSULE_WARDROBE, requiresFeature: 'hasPacking', badge: 'Pro+' },
                { icon: <BarChart3 size={20} />, label: 'Analytics', view: AppView.ANALYTICS, requiresFeature: 'hasAnalytics', badge: 'Premium' },
            ] as MenuItem[]
        },
        {
            title: 'Settings',
            icon: <Settings size={16} className="text-gray-400" />,
            items: [
                { icon: <Key size={20} />, label: 'API Keys', view: AppView.SETTINGS },
                { icon: <Download size={20} />, label: 'Export Data', view: AppView.EXPORT, requiresFeature: 'hasExport', badge: 'Starter+' },
            ] as MenuItem[]
        }
    ];

    const handleNavigate = (item: MenuItem) => {
        if (item.requiresFeature && !hasFeature(item.requiresFeature)) {
            // Navigate but the view will show paywall
        }
        onNavigate(item.view);
        onClose();
    };

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div className={`fixed top-0 left-0 h-full w-80 bg-black/95 backdrop-blur-xl border-r border-white/10 z-50 transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                            StyAiLe
                        </h1>
                        <p className="text-xs text-gray-400 mt-1">Your AI Style Assistant</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Menu Sections */}
                <div className="overflow-y-auto h-[calc(100vh-100px)] p-4">
                    {menuSections.map((section, idx) => (
                        <div key={idx} className="mb-6">
                            {/* Section Title */}
                            <div className="flex items-center gap-2 px-3 mb-2">
                                {section.icon}
                                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    {section.title}
                                </h3>
                            </div>

                            {/* Menu Items */}
                            <div className="space-y-1">
                                {section.items.map((item, itemIdx) => {
                                    const isActive = currentView === item.view;
                                    const isLocked = item.requiresFeature && !hasFeature(item.requiresFeature);

                                    return (
                                        <button
                                            key={itemIdx}
                                            onClick={() => handleNavigate(item)}
                                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group
                                                ${isActive
                                                    ? 'bg-white/10 text-white shadow-lg'
                                                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                                }
                                                ${isLocked ? 'opacity-60' : ''}
                                            `}
                                        >
                                            <div className={`${isActive ? 'text-blue-400' : 'text-gray-400 group-hover:text-white'} transition-colors`}>
                                                {item.icon}
                                            </div>
                                            <span className="flex-1 text-left text-sm font-medium">
                                                {item.label}
                                            </span>
                                            {item.badge && (
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold
                                                    ${isLocked
                                                        ? 'bg-gray-500/20 text-gray-400'
                                                        : 'bg-blue-500/20 text-blue-400'
                                                    }
                                                `}>
                                                    {item.badge}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default Sidebar;
