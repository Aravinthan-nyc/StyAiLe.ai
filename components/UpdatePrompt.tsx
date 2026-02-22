/**
 * UpdatePrompt - Professional Update UI Component
 * 
 * Features:
 * - Beautiful premium UI
 * - Progress tracking
 * - Mandatory/optional update handling
 * - Changelog display
 * - Background download
 * - Skip version option
 */

import React, { useState, useEffect } from 'react';
import {
    checkForUpdates,
    downloadUpdate,
    applyUpdate,
    skipVersion,
    isVersionSkipped,
    UpdateManifest,
    UpdateProgress,
    UpdateStatus,
    APP_VERSION,
} from '../services/liveUpdateService';

interface UpdatePromptProps {
    onDismiss?: () => void;
}

const UpdatePrompt: React.FC<UpdatePromptProps> = ({ onDismiss }) => {
    const [status, setStatus] = useState<UpdateStatus | null>(null);
    const [progress, setProgress] = useState<UpdateProgress | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isApplying, setIsApplying] = useState(false);
    const [showChangelog, setShowChangelog] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Listen for update events
    useEffect(() => {
        const handleUpdateAvailable = (event: CustomEvent<UpdateManifest>) => {
            setStatus({
                available: true,
                manifest: event.detail,
                lastChecked: Date.now(),
                skippedVersion: null,
            });
        };

        const handleMandatoryUpdate = (event: CustomEvent<UpdateManifest>) => {
            setStatus({
                available: true,
                manifest: event.detail,
                lastChecked: Date.now(),
                skippedVersion: null,
            });
        };

        window.addEventListener('update-available', handleUpdateAvailable as EventListener);
        window.addEventListener('mandatory-update', handleMandatoryUpdate as EventListener);

        // Initial check
        checkForUpdates(true).then(setStatus);

        return () => {
            window.removeEventListener('update-available', handleUpdateAvailable as EventListener);
            window.removeEventListener('mandatory-update', handleMandatoryUpdate as EventListener);
        };
    }, []);

    // No update available
    if (!status?.available || !status.manifest) {
        return null;
    }

    const manifest = status.manifest;
    const isMandatory = manifest.mandatory;
    const isSkipped = isVersionSkipped(manifest.version);

    // If skipped and not mandatory, don't show
    if (isSkipped && !isMandatory) {
        return null;
    }

    const handleDownload = async () => {
        setIsDownloading(true);
        setError(null);

        const success = await downloadUpdate(manifest, (prog) => {
            setProgress(prog);
            if (prog.error) {
                setError(prog.error);
            }
        });

        if (success) {
            setIsDownloading(false);
            // Auto-apply after download
            handleApply();
        } else {
            setIsDownloading(false);
        }
    };

    const handleApply = async () => {
        setIsApplying(true);
        setError(null);

        await applyUpdate((prog) => {
            setProgress(prog);
            if (prog.error) {
                setError(prog.error);
                setIsApplying(false);
            }
        });
    };

    const handleSkip = () => {
        if (!isMandatory) {
            skipVersion(manifest.version);
            setStatus(null);
            onDismiss?.();
        }
    };

    const handleDismiss = () => {
        if (!isMandatory) {
            onDismiss?.();
        }
    };

    // Format release date
    const releaseDate = new Date(manifest.releaseDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[9999] p-4">
            <div className="w-full max-w-md">
                {/* Card */}
                <div className="bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">

                    {/* Header with gradient */}
                    <div className="bg-gradient-to-br from-white/10 to-transparent p-8 text-center">
                        {/* Update Icon */}
                        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-white/20">
                            {isApplying || isDownloading ? (
                                <div className="w-8 h-8 border-3 border-black border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                            )}
                        </div>

                        {/* Title */}
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {isApplying ? 'Installing Update' : isDownloading ? 'Downloading Update' : 'Update Available'}
                        </h2>

                        {/* Version Badge */}
                        <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                            <span className="text-gray-400 text-sm">{APP_VERSION.version}</span>
                            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                            <span className="text-white text-sm font-bold">{manifest.version}</span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4">

                        {/* Mandatory Badge */}
                        {isMandatory && (
                            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400 shrink-0">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                </svg>
                                <p className="text-red-300 text-sm font-medium">
                                    This is a mandatory update. You must update to continue using the app.
                                </p>
                            </div>
                        )}

                        {/* Progress Bar */}
                        {(isDownloading || isApplying) && progress && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400">{progress.message}</span>
                                    <span className="text-white font-mono">{progress.progress}%</span>
                                </div>
                                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-white h-full transition-all duration-300 ease-out"
                                        style={{ width: `${progress.progress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400 shrink-0">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="15" y1="9" x2="9" y2="15"></line>
                                    <line x1="9" y1="9" x2="15" y2="15"></line>
                                </svg>
                                <p className="text-red-300 text-sm">{error}</p>
                            </div>
                        )}

                        {/* Changelog Section */}
                        {!isDownloading && !isApplying && (
                            <>
                                <button
                                    onClick={() => setShowChangelog(!showChangelog)}
                                    className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 rounded-xl px-4 py-3 transition-colors"
                                >
                                    <span className="text-gray-300 text-sm font-medium">What's New</span>
                                    <svg
                                        width={18}
                                        height={18}
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        className={`text-gray-500 transition-transform ${showChangelog ? 'rotate-180' : ''}`}
                                    >
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </button>

                                {showChangelog && (
                                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                                            {manifest.changelog}
                                        </p>
                                        <p className="text-gray-500 text-xs mt-3">
                                            Released on {releaseDate}
                                        </p>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Update Details */}
                        {!isDownloading && !isApplying && (
                            <div className="flex items-center justify-between text-sm text-gray-500">
                                <span>Download size</span>
                                <span className="font-mono">{formatBytes(manifest.bundleSize)}</span>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="p-6 pt-0">
                        {!isDownloading && !isApplying ? (
                            <div className="space-y-3">
                                {/* Update Button */}
                                <button
                                    onClick={handleDownload}
                                    className="w-full py-4 bg-white text-black font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-100 active:scale-[0.98] transition-all shadow-xl shadow-white/10"
                                >
                                    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                        <polyline points="7 10 12 15 17 10"></polyline>
                                        <line x1="12" y1="15" x2="12" y2="3"></line>
                                    </svg>
                                    Update Now
                                </button>

                                {/* Skip/Later Buttons */}
                                {!isMandatory && (
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleSkip}
                                            className="flex-1 py-3 bg-white/5 border border-white/10 text-gray-400 font-medium rounded-xl hover:bg-white/10 transition-colors"
                                        >
                                            Skip this version
                                        </button>
                                        <button
                                            onClick={handleDismiss}
                                            className="flex-1 py-3 bg-white/5 border border-white/10 text-gray-400 font-medium rounded-xl hover:bg-white/10 transition-colors"
                                        >
                                            Remind later
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : progress?.stage === 'complete' ? (
                            <div className="text-center">
                                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                </div>
                                <p className="text-white font-bold mb-2">Update Installed!</p>
                                <p className="text-gray-400 text-sm">Restarting app...</p>
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 text-sm">
                                Please wait while the update is being installed...
                            </div>
                        )}
                    </div>
                </div>

                {/* Current Version Footer */}
                <p className="text-center text-gray-600 text-xs mt-4">
                    Current: v{APP_VERSION.version} (Build {APP_VERSION.buildNumber})
                </p>
            </div>
        </div>
    );
};

// Utility function
function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default UpdatePrompt;
