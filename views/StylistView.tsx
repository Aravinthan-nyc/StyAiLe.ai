import React, { useState, useRef, useEffect } from 'react';
import { WardrobeItem, OutfitSuggestion, ChatMessage, OccasionType } from '../types';
import { getAlgorithmRecommendations, getOccasionOptions } from '../services/outfitAlgorithmService';
import { askAiWithContext, getAiOutfitSuggestions } from '../services/unifiedAiService';
import { generateId } from '../utils';
import MarkdownText from '../components/MarkdownText';
import TypewriterText from '../components/TypewriterText';
import { Send, User, Sparkles, Trash2, Shirt } from '../components/Icons';

interface StylistViewProps {
    wardrobe: WardrobeItem[];
    initialContext?: WardrobeItem[];
    onContextUsed?: () => void;
    onLockItems?: (id: string, days?: number) => void;
}

// Get occasions from algorithm service
const occasions = getOccasionOptions();

const CHAT_STORAGE_KEY = 'stylist_chat_history';

const StylistView: React.FC<StylistViewProps> = ({ wardrobe, initialContext, onContextUsed, onLockItems }) => {
    // Load chat history from localStorage
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        try {
            const stored = localStorage.getItem(CHAT_STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.warn('Could not load chat history:', e);
        }
        return [];
    });
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showOccasions, setShowOccasions] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Save chat history to localStorage whenever messages change
    useEffect(() => {
        try {
            localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
        } catch (e) {
            console.warn('Could not save chat history:', e);
        }
    }, [messages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Initial greeting (only if no history)
    useEffect(() => {
        if (messages.length === 0) {
            const greeting: ChatMessage = {
                id: generateId(),
                role: 'model',
                text: wardrobe.length < 2
                    ? "Hi! I'm your personal stylist. Add at least 2 items to your wardrobe and I'll help you create amazing outfits!"
                    : `Hi! I'm your personal stylist. I see you have ${wardrobe.length} items. Pick an occasion or tell me what you're dressing for.`,
                timestamp: Date.now(),
            };
            setMessages([greeting]);
        }
    }, [wardrobe.length]);

    // Function to clear chat history
    const clearChatHistory = () => {
        localStorage.removeItem(CHAT_STORAGE_KEY);
        setMessages([]);
        setShowOccasions(true);
    };

    // Handle initial context from wardrobe selection
    const processingContextRef = useRef(false);

    useEffect(() => {
        if (initialContext && initialContext.length > 0 && !isLoading && !processingContextRef.current) {
            const analyzeSelectedItems = async () => {
                processingContextRef.current = true;
                setShowOccasions(false);
                setIsLoading(true);

                // Create user message showing selected items
                const itemNames = initialContext.map(i => i.description).join(', ');
                const userMsg: ChatMessage = {
                    id: generateId(),
                    role: 'user',
                    text: `I've selected ${initialContext.length} item(s): ${itemNames}. What can I do with these?`,
                    timestamp: Date.now(),
                };
                setMessages(prev => [...prev, userMsg]);

                try {
                    // Ask AI for styling suggestions with selected items
                    const contextItems = initialContext.map(item => ({
                        id: item.id,
                        description: item.description,
                        summary: item.aiAnalysis?.summary,
                        colors: item.colors,
                        category: item.category,
                    }));

                    const response = await askAiWithContext(
                        `The user selected these specific items from their wardrobe. Suggest how they can style these pieces together, what occasions they work for, and what other items would complement them.`,
                        contextItems
                    );

                    const responseMsg: ChatMessage = {
                        id: generateId(),
                        role: 'model',
                        text: response,
                        timestamp: Date.now(),
                    };
                    setMessages(prev => [...prev, responseMsg]);
                } catch (error) {
                    console.error('Context analysis error:', error);
                    const errorMsg: ChatMessage = {
                        id: generateId(),
                        role: 'model',
                        text: "I see your lovely selections! Unfortunately I'm having trouble connecting right now. Try asking me a question about these items!",
                        timestamp: Date.now(),
                    };
                    setMessages(prev => [...prev, errorMsg]);
                }

                setIsLoading(false);

                // Clear the context so it doesn't re-trigger
                if (onContextUsed) {
                    onContextUsed();
                }

                // Reset ref after a short delay
                setTimeout(() => {
                    processingContextRef.current = false;
                }, 1000);
            };

            analyzeSelectedItems();
        }
    }, [initialContext, onContextUsed]);

    const handleOccasionClick = (occasionId: OccasionType) => {
        if (isLoading || wardrobe.length < 2) return;

        const occasion = occasions.find(o => o.id === occasionId);
        if (!occasion) return;

        setShowOccasions(false);
        setIsLoading(true);

        // Add user message
        const userMsg: ChatMessage = {
            id: generateId(),
            role: 'user',
            text: `I need an outfit for: ${occasion.label}`,
            timestamp: Date.now(),
        };
        setMessages(prev => [...prev, userMsg]);

        // Use algorithm (synchronous, no API call needed)
        const result = getAlgorithmRecommendations(wardrobe, occasionId);

        const responseMsg: ChatMessage = {
            id: generateId(),
            role: 'model',
            text: result.message,
            suggestions: result.suggestions,
            timestamp: Date.now(),
        };
        setMessages(prev => [...prev, responseMsg]);

        setIsLoading(false);
    };

    const handleSendMessage = async () => {
        if (!inputText.trim() || isLoading) return;

        setShowOccasions(false);
        setIsLoading(true);

        const userMsg: ChatMessage = {
            id: generateId(),
            role: 'user',
            text: inputText.trim(),
            timestamp: Date.now(),
        };
        setMessages(prev => [...prev, userMsg]);
        const query = inputText.trim();
        setInputText('');

        try {
            // Check if it's an outfit request
            const isOutfitRequest = /outfit|wear|dress|what should i|suggest|recommend/i.test(query);

            if (isOutfitRequest && wardrobe.length >= 2) {
                // Use AI for outfit suggestions
                const contextItems = wardrobe.map(item => ({
                    id: item.id,
                    description: item.description,
                    summary: item.aiAnalysis?.summary,
                    colors: item.colors,
                    category: item.category,
                }));

                const result = await getAiOutfitSuggestions(contextItems, query);

                const responseMsg: ChatMessage = {
                    id: generateId(),
                    role: 'model',
                    text: result.message,
                    suggestions: result.suggestions,
                    timestamp: Date.now(),
                };
                setMessages(prev => [...prev, responseMsg]);
            } else {
                // Use AI for general chat with wardrobe context
                const contextItems = wardrobe.map(item => ({
                    id: item.id,
                    description: item.description,
                    summary: item.aiAnalysis?.summary,
                    colors: item.colors,
                    category: item.category,
                }));

                const response = await askAiWithContext(query, contextItems);

                const responseMsg: ChatMessage = {
                    id: generateId(),
                    role: 'model',
                    text: response,
                    timestamp: Date.now(),
                };
                setMessages(prev => [...prev, responseMsg]);
            }
        } catch (error) {
            console.error('Chat error:', error);
            const errorMsg: ChatMessage = {
                id: generateId(),
                role: 'model',
                text: "I'm having trouble connecting. Please try again!",
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, errorMsg]);
        }

        setIsLoading(false);
    };

    const getItemById = (id: string): WardrobeItem | undefined => {
        return wardrobe.find(item => item.id === id);
    };

    const renderOutfitCard = (suggestion: OutfitSuggestion, index: number) => {
        const items = suggestion.itemIds.map(getItemById).filter(Boolean) as WardrobeItem[];
        if (items.length === 0) return null;

        return (
            <div key={index} className="glass-card rounded-2xl p-4 mt-3 animate-slide-up bg-white/5 border border-white/10" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={16} className="text-secondary" />
                    <h4 className="font-semibold text-gray-200">{suggestion.name}</h4>
                </div>

                {/* Item thumbnails */}
                <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
                    {items.map((item) => (
                        <div key={item.id} className="flex-shrink-0">
                            <img
                                src={item.imageData}
                                alt={item.description}
                                className="w-20 h-20 rounded-xl object-cover border border-white/10"
                            />
                            <p className="text-xs text-gray-400 text-center mt-1 truncate w-20">{item.description}</p>
                        </div>
                    ))}
                </div>

                {/* Reasoning */}
                <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                    <p className="text-sm text-gray-300 flex items-start gap-2">
                        <span className="text-primary mt-1"><Shirt size={12} /></span>
                        {suggestion.reasoning}
                    </p>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-screen pb-20 bg-[#050505]">
            {/* Header */}
            <div className="sticky top-0 bg-[#050505]/80 backdrop-blur-xl z-20 px-4 py-4 border-b border-white/5">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                        <Sparkles size={20} className="text-black" />
                    </div>
                    <div className="flex-1">
                        <h1 className="font-bold text-white tracking-tight">Flareo Assistant</h1>
                        <p className="text-xs text-primary font-medium tracking-wide">ONLINE • AI ACTIVE</p>
                    </div>
                    {messages.length > 1 && (
                        <button
                            onClick={clearChatHistory}
                            className="p-2 text-gray-500 hover:text-red-400 hover:bg-white/5 rounded-full transition-colors"
                            title="Clear chat history"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar space-y-6">
                {messages.map((msg) => {
                    const isRecent = Date.now() - msg.timestamp < 10000; // 10 seconds threshold for animation
                    return (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                            <div className={`max-w-[85%] ${msg.role === 'user' ? 'bg-gradient-to-br from-primary to-secondary text-black rounded-2xl rounded-tr-sm px-5 py-3 shadow-lg' : 'glass-card rounded-2xl rounded-tl-sm px-5 py-4 border border-white/5'}`}>
                                {msg.role === 'user' ? (
                                    <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                                ) : (
                                    <div className="min-h-[20px]">
                                        {/* Use Typewriter for model messages if they are recent, otherwise static text */}
                                        {isRecent ? (
                                            <TypewriterText text={msg.text} speed={15} className="text-gray-300 text-sm leading-relaxed" />
                                        ) : (
                                            <MarkdownText text={msg.text} className="text-gray-300 text-sm leading-relaxed" />
                                        )}
                                    </div>
                                )}

                                {/* Outfit suggestions */}
                                {msg.suggestions && msg.suggestions.length > 0 && (
                                    <div className="mt-4 border-t border-white/5 pt-2">
                                        {msg.suggestions.map((suggestion, i) => renderOutfitCard(suggestion, i))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Loading indicator */}
                {isLoading && (
                    <div className="flex justify-start animate-fade-in">
                        <div className="glass-card px-5 py-4 rounded-2xl rounded-tl-sm border border-white/5">
                            <div className="flex gap-1.5">
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Occasion Buttons */}
            {showOccasions && wardrobe.length >= 2 && (
                <div className="px-4 py-3 bg-[#050505]/90 backdrop-blur-md border-t border-white/5">
                    <p className="text-xs font-medium text-gray-400 mb-3 ml-1 uppercase tracking-wider">Quick Suggestions</p>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                        {occasions.map((occ) => (
                            <button
                                key={occ.id}
                                onClick={() => handleOccasionClick(occ.id)}
                                disabled={isLoading}
                                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 btn-press disabled:opacity-50 transition-all group"
                            >
                                <span className="text-lg group-hover:scale-110 transition-transform duration-300 grayscale group-hover:grayscale-0">{occ.emoji}</span>
                                <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">{occ.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input Area */}
            <div className="sticky bottom-20 px-4 py-3 bg-[#050505]/80 backdrop-blur-md border-t border-white/5">
                <div className="flex gap-3 items-center relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 blur-xl opacity-20 -z-10" />
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder={wardrobe.length < 2 ? "Add items to start chatting..." : "Ask Flareo..."}
                        disabled={isLoading || wardrobe.length < 2}
                        className="flex-1 px-5 py-3.5 bg-black/40 border border-white/10 rounded-full text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary/50 focus:shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all disabled:opacity-50"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!inputText.trim() || isLoading || wardrobe.length < 2}
                        className="p-3.5 bg-white text-black rounded-full shadow-[0_0_15px_rgba(255,255,255,0.3)] btn-press disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StylistView;
