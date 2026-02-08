import React, { useState, useEffect, useRef } from 'react';
import MarkdownText from './MarkdownText';

interface TypewriterTextProps {
    text: string;
    speed?: number;
    onComplete?: () => void;
    className?: string;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({
    text,
    speed = 15,
    onComplete,
    className = ''
}) => {
    const [displayedText, setDisplayedText] = useState('');
    const indexRef = useRef(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Reset if text changes significantly (new message)
        // Simple check: if text starts differently or is completely new
        if (!text.startsWith(displayedText) && displayedText !== '') {
            setDisplayedText('');
            indexRef.current = 0;
        }
    }, [text]);

    useEffect(() => {
        if (indexRef.current >= text.length) {
            if (onComplete) onComplete();
            return;
        }

        timerRef.current = setInterval(() => {
            if (indexRef.current < text.length) {
                const nextChar = text.charAt(indexRef.current);
                setDisplayedText((prev) => prev + nextChar);
                indexRef.current++;
            } else {
                if (timerRef.current) clearInterval(timerRef.current);
                if (onComplete) onComplete();
            }
        }, speed);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [text, speed, onComplete]);

    // If the text is empty, ensure we show nothing
    if (!text) return null;

    return (
        <div className={`typewriter-container ${className}`}>
            <MarkdownText text={displayedText} className={className} />
        </div>
    );
};

export default TypewriterText;
