/**
 * Simple Markdown Renderer
 * Converts basic Markdown to React elements
 * Supports: **bold**, *italic*, # headers, - lists, \n newlines
 */

import React from 'react';

interface MarkdownTextProps {
    text: string;
    className?: string;
}

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Parse and render markdown text using react-markdown
 */
export const MarkdownText: React.FC<MarkdownTextProps> = ({ text, className = '' }) => {
    return (
        <div className={`markdown-content ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ node, ...props }) => <h1 className="text-xl font-bold text-white mt-4 mb-2" {...props} />,
                    h2: ({ node, ...props }) => <h2 className="text-lg font-bold text-gray-100 mt-6 mb-3" {...props} />,
                    h3: ({ node, ...props }) => <h3 className="text-md font-bold text-gray-200 mt-4 mb-2" {...props} />,
                    h4: ({ node, ...props }) => <h4 className="text-sm font-bold text-gray-200 mt-3 mb-1" {...props} />,
                    p: ({ node, ...props }) => <p className="text-gray-300 my-2" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc list-inside my-3 space-y-2 text-gray-300" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal list-inside my-3 space-y-2 text-gray-300" {...props} />,
                    li: ({ node, ...props }) => <li className="text-gray-300" {...props} />,
                    strong: ({ node, ...props }) => <strong className="font-bold text-white" {...props} />,
                    em: ({ node, ...props }) => <em className="italic text-gray-300" {...props} />,
                }}
            >
                {text}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownText;
