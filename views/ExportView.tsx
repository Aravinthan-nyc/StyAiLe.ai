import React, { useState } from 'react';
import { WardrobeItem, OutfitSuggestion } from '../types';
import { hasFeature } from '../services/subscriptionService';

interface ExportViewProps {
    wardrobe: WardrobeItem[];
    onBack: () => void;
}

const OUTFITS_KEY = 'styaile_saved_outfits';
const CHAT_KEY = 'styaile_chat_history';

const ExportView: React.FC<ExportViewProps> = ({ wardrobe, onBack }) => {
    const [exporting, setExporting] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    // Feature gate
    if (!hasFeature('hasExport')) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4 border border-white/20">
                    <span className="text-2xl">⬡</span>
                </div>
                <h2 className="text-2xl font-bold mb-2">Starter Feature</h2>
                <p className="text-gray-400 text-center mb-6">
                    Export is available on Starter, Pro, and Premium plans.
                </p>
                <button onClick={onBack} className="btn-primary px-6 py-3 rounded-xl">
                    Upgrade Now
                </button>
            </div>
        );
    }

    const downloadFile = (content: string, filename: string, type: string) => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };

    const exportWardrobe = async (format: 'json' | 'csv') => {
        setExporting('wardrobe-' + format);

        try {
            await new Promise(r => setTimeout(r, 500)); // Simulate processing

            if (format === 'json') {
                const data = JSON.stringify(wardrobe, null, 2);
                downloadFile(data, 'wardrobe.json', 'application/json');
            } else {
                // CSV format
                const headers = ['id', 'description', 'category', 'colors', 'tags', 'occasions', 'season', 'createdAt', 'wearCount'];
                const rows = wardrobe.map(item => [
                    item.id,
                    `"${item.description.replace(/"/g, '""')}"`,
                    item.category,
                    `"${item.colors.join(', ')}"`,
                    `"${item.tags.join(', ')}"`,
                    `"${item.occasions.join(', ')}"`,
                    `"${item.season.join(', ')}"`,
                    new Date(item.createdAt).toISOString(),
                    item.wearCount || 0
                ]);
                const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                downloadFile(csv, 'wardrobe.csv', 'text/csv');
            }
        } finally {
            setExporting(null);
        }
    };

    const exportOutfits = async (format: 'json' | 'csv') => {
        setExporting('outfits-' + format);

        try {
            await new Promise(r => setTimeout(r, 500));

            const outfits: OutfitSuggestion[] = JSON.parse(localStorage.getItem(OUTFITS_KEY) || '[]');

            if (format === 'json') {
                downloadFile(JSON.stringify(outfits, null, 2), 'outfits.json', 'application/json');
            } else {
                const headers = ['id', 'name', 'itemIds', 'reasoning', 'occasion', 'timesWorn', 'isFavorite'];
                const rows = outfits.map(o => [
                    o.id || '',
                    `"${o.name.replace(/"/g, '""')}"`,
                    `"${o.itemIds.join(', ')}"`,
                    `"${o.reasoning.replace(/"/g, '""')}"`,
                    o.occasion || '',
                    o.timesWorn || 0,
                    o.isFavorite ? 'Yes' : 'No'
                ]);
                const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                downloadFile(csv, 'outfits.csv', 'text/csv');
            }
        } finally {
            setExporting(null);
        }
    };

    const exportChat = async () => {
        setExporting('chat');

        try {
            await new Promise(r => setTimeout(r, 500));

            const chat = localStorage.getItem(CHAT_KEY) || '[]';
            const messages = JSON.parse(chat);

            // Format as readable text
            const text = messages.map((m: any) =>
                `[${new Date(m.timestamp).toLocaleString()}] ${m.role === 'user' ? 'You' : 'Stylist'}: ${m.text}`
            ).join('\n\n');

            downloadFile(text, 'chat-history.txt', 'text/plain');
        } finally {
            setExporting(null);
        }
    };

    const exportAll = async () => {
        setExporting('all');

        try {
            await new Promise(r => setTimeout(r, 1000));

            const outfits = JSON.parse(localStorage.getItem(OUTFITS_KEY) || '[]');
            const chat = JSON.parse(localStorage.getItem(CHAT_KEY) || '[]');

            const data = {
                exportDate: new Date().toISOString(),
                appVersion: '1.0.0',
                wardrobe,
                outfits,
                chatHistory: chat
            };

            downloadFile(JSON.stringify(data, null, 2), 'styaile-backup.json', 'application/json');
        } finally {
            setExporting(null);
        }
    };

    const exportOptions = [
        {
            id: 'wardrobe',
            title: 'Wardrobe',
            description: 'Export all your wardrobe items',
            icon: '👗',
            count: wardrobe.length,
            onExportJson: () => exportWardrobe('json'),
            onExportCsv: () => exportWardrobe('csv')
        },
        {
            id: 'outfits',
            title: 'Outfits',
            description: 'Export saved outfit combinations',
            icon: '👔',
            count: JSON.parse(localStorage.getItem(OUTFITS_KEY) || '[]').length,
            onExportJson: () => exportOutfits('json'),
            onExportCsv: () => exportOutfits('csv')
        }
    ];

    return (
        <div className="min-h-screen bg-black text-white pb-24">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-white/10">
                <div className="flex items-center justify-between p-4">
                    <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="text-xl font-bold">Export Data</h1>
                    <div className="w-10" />
                </div>
            </div>

            {/* Success Toast */}
            {showSuccess && (
                <div className="fixed top-20 left-4 right-4 bg-green-500/90 backdrop-blur-lg text-white px-4 py-3 rounded-xl z-50 animate-slide-up">
                    <div className="flex items-center gap-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-medium">Export downloaded successfully!</span>
                    </div>
                </div>
            )}

            <div className="p-4">
                {/* Info */}
                <div className="glass-card rounded-2xl p-4 mb-6">
                    <p className="text-gray-400 text-sm">
                        Download your data in various formats. JSON is best for backups, CSV works with spreadsheets.
                    </p>
                </div>

                {/* Export Options */}
                <div className="space-y-4">
                    {exportOptions.map(option => (
                        <div key={option.id} className="glass-card rounded-2xl p-4">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-3xl">{option.icon}</span>
                                <div className="flex-1">
                                    <h3 className="font-semibold">{option.title}</h3>
                                    <p className="text-sm text-gray-400">{option.description}</p>
                                </div>
                                <span className="text-sm bg-white/10 px-2 py-1 rounded-lg">{option.count} items</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={option.onExportJson}
                                    disabled={exporting !== null}
                                    className="py-2 rounded-xl btn-secondary flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {exporting === `${option.id}-json` ? (
                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            JSON
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={option.onExportCsv}
                                    disabled={exporting !== null}
                                    className="py-2 rounded-xl btn-secondary flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {exporting === `${option.id}-csv` ? (
                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            CSV
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Chat History */}
                    <div className="glass-card rounded-2xl p-4">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-3xl">💬</span>
                            <div className="flex-1">
                                <h3 className="font-semibold">Chat History</h3>
                                <p className="text-sm text-gray-400">Export stylist conversations</p>
                            </div>
                        </div>
                        <button
                            onClick={exportChat}
                            disabled={exporting !== null}
                            className="w-full py-2 rounded-xl btn-secondary flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {exporting === 'chat' ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Export as Text
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Full Backup */}
                <div className="mt-6">
                    <button
                        onClick={exportAll}
                        disabled={exporting !== null}
                        className="w-full py-4 rounded-2xl btn-primary flex items-center justify-center gap-3"
                    >
                        {exporting === 'all' ? (
                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                </svg>
                                <span className="font-semibold">Download Full Backup</span>
                            </>
                        )}
                    </button>
                    <p className="text-center text-sm text-gray-400 mt-2">
                        Includes wardrobe, outfits, and chat history
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ExportView;
