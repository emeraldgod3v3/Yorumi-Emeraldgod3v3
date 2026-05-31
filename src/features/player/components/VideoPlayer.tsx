import { useEffect, useRef } from 'react';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import type { SubtitleTrack } from '../../../types/stream';
import { API_BASE } from '../../../config/api';

interface VideoPlayerProps {
    streamUrl?: string;
    episodeSession?: string;
    isHls?: boolean;
    subtitles?: SubtitleTrack[];
    isLoading: boolean;
    hasPlayableSource?: boolean;
    streamExhausted?: boolean;
    onLoad?: () => void;
    onError?: () => void;
    onProgress?: (progress: { currentTime: number; duration: number; ended?: boolean }) => void;
    startAtSeconds?: number;
}

export default function VideoPlayer(props: VideoPlayerProps) {
    const {
        streamUrl,
        episodeSession,
        isLoading,
        hasPlayableSource = true,
        streamExhausted = false,
        onLoad,
    } = props;

    const onLoadRef = useRef(onLoad);
    const apiOrigin = API_BASE.replace(/\/+$/, '').replace(/\/api$/i, '');

    const resolvedStreamUrl = (() => {
        if (!streamUrl) return streamUrl;
        if (streamUrl.includes('/api/scraper/embed')) return streamUrl;
        if (!/^https?:\/\/([^/]+\.)?kwik\./i.test(streamUrl)) return streamUrl;
        return `${apiOrigin}/api/scraper/embed?url=${encodeURIComponent(streamUrl)}`;
    })();

    useEffect(() => {
        onLoadRef.current = onLoad;
    }, [onLoad]);

    return (
        <div className="watch-player-shell w-full max-w-full h-full max-h-full relative bg-[#0b0c0f] group transition-all duration-300 overflow-hidden rounded-none shadow-none md:rounded-2xl md:shadow-2xl md:shadow-black/80">
            {isLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20">
                    <LoadingSpinner />
                    <p className="mt-4 text-gray-400 animate-pulse">Loading Stream...</p>
                </div>
            ) : resolvedStreamUrl ? (
                <div className="relative w-full max-w-full h-full bg-black flex items-center justify-center z-10 overflow-hidden rounded-none md:rounded-2xl">
                    <div className="w-full h-full max-w-full max-h-full flex items-center justify-center bg-black overflow-hidden rounded-none md:rounded-2xl">
                        <iframe
                            key={`${episodeSession ?? ''}::${resolvedStreamUrl ?? ''}`}
                            src={resolvedStreamUrl}
                            className="w-full h-full border-0 bg-black"
                            loading="eager"
                            allowFullScreen
                            allow="autoplay; encrypted-media"
                            referrerPolicy="no-referrer"
                            title="Video Player"
                            onLoad={() => onLoadRef.current?.()}
                        />
                    </div>
                </div>
            ) : !hasPlayableSource || streamExhausted ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20">
                    <LoadingSpinner />
                    <p className="mt-4 text-gray-400 animate-pulse">
                        {streamExhausted ? 'Still retrying stream...' : 'Retrying stream...'}
                    </p>
                </div>
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                    <span className="mb-2 text-6xl opacity-20">▶</span>
                    <p>Select an episode</p>
                </div>
            )}
        </div>
    );
}
