import React, { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import type { Anime } from '../../../types/anime';
import AnimeLogoImage from '../../../components/anime/AnimeLogoImage';
import SpotlightSkeleton from './SpotlightSkeleton';
import { useTitleLanguage } from '../../../context/TitleLanguageContext';
import { getDisplayTitle } from '../../../utils/titleLanguage';

interface SpotlightHeroProps {
    animeList: Anime[];
    isLoading?: boolean;
    onAnimeClick: (anime: Anime) => void;
    onWatchClick: (anime: Anime) => void;
    onAnimeHover?: (anime: Anime) => void;
}

type AnimeWithCoverCandidates = Anime & {
    backgroundCover?: string;
    background_cover?: string;
    backdrop?: string;
    backdropImage?: string;
    banner?: string;
    bannerImage?: string;
    coverImage?: {
        extraLarge?: string;
        large?: string;
        medium?: string;
    };
    image?: string;
    poster?: string;
    thumbnail?: string;
};

const getAnimeCoverImage = (anime: Anime): string => {
    const candidate = anime as AnimeWithCoverCandidates;

    return (
        candidate.images?.jpg?.large_image_url ||
        candidate.images?.jpg?.image_url ||
        candidate.anilist_cover_image ||
        candidate.coverImage?.extraLarge ||
        candidate.coverImage?.large ||
        candidate.coverImage?.medium ||
        candidate.poster ||
        candidate.image ||
        candidate.thumbnail ||
        ''
    );
};

const getAnimeBackgroundCover = (anime: Anime, fallbackImage: string): string => {
    const candidate = anime as AnimeWithCoverCandidates;

    return (
        candidate.backgroundCover ||
        candidate.background_cover ||
        candidate.backdrop ||
        candidate.backdropImage ||
        candidate.bannerImage ||
        candidate.banner ||
        candidate.anilist_banner_image ||
        fallbackImage
    );
};

const SpotlightCover: React.FC<{ thumbnail: string; title: string }> = ({ thumbnail, title }) => {
    const cardRef = React.useRef<HTMLDivElement>(null);
    const [rotation, setRotation] = React.useState({ x: 0, y: 0 });
    const [glare, setGlare] = React.useState({ x: 50, y: 50, opacity: 0 });
    const [isHovered, setIsHovered] = React.useState(false);

    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        setRotation({
            x: ((y - centerY) / centerY) * -10,
            y: ((x - centerX) / centerX) * 10,
        });
        setGlare({
            x: (x / rect.width) * 100,
            y: (y / rect.height) * 100,
            opacity: 1,
        });
    };

    const handleMouseLeave = () => {
        setRotation({ x: 0, y: 0 });
        setGlare((current) => ({ ...current, opacity: 0 }));
        setIsHovered(false);
    };

    return (
        <div
            ref={cardRef}
            className={`hidden md:block w-56 lg:w-64 shrink-0 rounded-xl relative perspective-1000 transition-transform duration-500 ease-out ${isHovered ? 'rotate-0' : 'rotate-3'}`}
            style={{ perspective: '1000px' }}
            onMouseEnter={(event) => {
                setIsHovered(true);
                handleMouseMove(event);
            }}
            onMouseLeave={handleMouseLeave}
            onMouseMove={handleMouseMove}
        >
            <div
                className="relative h-full w-full overflow-hidden rounded-xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.6)] transition-all duration-75 ease-out"
                style={{
                    transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale3d(${isHovered ? 1.02 : 1}, ${isHovered ? 1.02 : 1}, 1)`,
                    transformStyle: 'preserve-3d',
                }}
            >
                <div
                    className="pointer-events-none absolute inset-0 z-30 mix-blend-overlay transition-opacity duration-300"
                    style={{
                        background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.4) 0%, transparent 80%)`,
                        opacity: glare.opacity,
                    }}
                />
                <img src={thumbnail} alt={title} className="h-auto w-full object-cover" />
            </div>
        </div>
    );
};

const SpotlightHero: React.FC<SpotlightHeroProps> = ({ animeList, isLoading = false, onAnimeClick, onWatchClick, onAnimeHover }) => {
    const { language } = useTitleLanguage();
    // Embla Carousel hook
    const [emblaRef, emblaApi] = useEmblaCarousel({
        loop: true,
        duration: 20
    });
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Update selected index when slide changes
    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setSelectedIndex(emblaApi.selectedScrollSnap());
    }, [emblaApi]);

    // Attach event listener
    useEffect(() => {
        if (!emblaApi) return;
        const frameId = window.requestAnimationFrame(onSelect);
        emblaApi.on('select', onSelect);
        return () => {
            window.cancelAnimationFrame(frameId);
            emblaApi.off('select', onSelect);
        };
    }, [emblaApi, onSelect]);

    useEffect(() => {
        const activeAnime = animeList[selectedIndex];
        if (activeAnime) {
            onAnimeHover?.(activeAnime);
        }
    }, [animeList, onAnimeHover, selectedIndex]);

    const handleNext = useCallback(() => {
        if (emblaApi) emblaApi.scrollNext();
    }, [emblaApi]);

    const handlePrev = useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev();
    }, [emblaApi]);

    const scrollTo = useCallback((index: number) => {
        if (emblaApi) emblaApi.scrollTo(index);
    }, [emblaApi]);

    // Keep the hero's space reserved until spotlight data is available.
    if (isLoading || animeList.length === 0) {
        return <SpotlightSkeleton />;
    }

    return (
        <div className="relative w-full h-[55vh] md:h-[75vh] min-h-[500px] md:min-h-[600px] group bg-[#0a0a0a] overflow-hidden mb-8">
            {/* Embla Viewport */}
            <div className="absolute inset-0 overflow-hidden" ref={emblaRef}>
                <div className="flex h-full touch-pan-y">
                    {animeList.map((anime, index) => {
                        const displayTitle = getDisplayTitle(anime as unknown as Record<string, unknown>, language);
                        const coverImage = getAnimeCoverImage(anime);
                        const backgroundCover = getAnimeBackgroundCover(anime, coverImage);

                        return (
                            <div
                                key={`${anime.scraperId || anime.id || anime.mal_id || anime.title}-${index}`}
                                className="relative min-w-full h-full flex-[0_0_100%]"
                            >
                                {/* Background Image */}
                                <div className="absolute inset-0 z-0 select-none overflow-hidden">
                                    <div
                                        className="absolute inset-0 bg-no-repeat bg-cover bg-center opacity-70"
                                        style={{
                                            backgroundImage: backgroundCover ? `url(${backgroundCover})` : 'none',
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-black/60 md:bg-black/40" />
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a]/60 to-[#0a0a0a]" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent pointer-events-none" />
                                </div>

                                {/* Content */}
                                <div className="absolute inset-0 flex items-center px-8 md:px-14 z-10 pointer-events-none">
                                    <div className="flex flex-col md:flex-row gap-12 items-center w-full max-w-7xl mx-auto mt-12">

                                        {/* Text Info (Left) */}
                                        <div className="flex-1 pointer-events-auto max-w-2xl">
                                            <div className="text-yorumi-accent font-bold tracking-wider text-base mb-3 uppercase select-none flex items-center gap-3">
                                                {coverImage && (
                                                    <div className="md:hidden h-24 w-16 rounded-md overflow-hidden shadow-lg shadow-black/50 border border-white/10 flex-shrink-0 relative">
                                                        <img
                                                            src={coverImage}
                                                            alt={displayTitle}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                                    </div>
                                                )}
                                                <span>#{index + 1} Trending</span>
                                            </div>

                                            <div className={`${displayTitle.length > 50 ? 'max-h-12 md:max-h-16' :
                                                displayTitle.length > 30 ? 'max-h-16 md:max-h-20' :
                                                    'max-h-20 md:max-h-24'
                                                } mb-8 md:mb-12 flex items-start overflow-visible`}>
                                                <AnimeLogoImage
                                                    anilistId={anime.id || anime.mal_id}
                                                    title={displayTitle}
                                                    year={anime.year}
                                                    episodes={anime.latestEpisode || anime.episodes}
                                                    format={anime.type}
                                                    className="drop-shadow-2xl max-h-full origin-left object-contain"
                                                    size="medium"
                                                />
                                            </div>

                                            <div className="flex items-center flex-wrap gap-4 text-sm text-white mb-4 md:mb-6 font-medium select-none">
                                                {anime.score > 0 && (
                                                    <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                                                        <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                                                        {anime.score.toFixed(1)}
                                                    </span>
                                                )}
                                                {(anime.latestEpisode || anime.episodes) ? (
                                                    <span className="bg-[#22c55e] text-white px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1">
                                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 4H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm-8 7H9.5v-.5h-2v3h2V13H11v2H6V9h5v2zm7 0h-1.5v-.5h-2v3h2V13H18v2h-5V9h5v2z" /></svg>
                                                        {anime.latestEpisode || anime.episodes}
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                                                        <span className={`w-2 h-2 rounded-full ${String(anime.status || '').toUpperCase() === 'RELEASING' || String(anime.status || '').toLowerCase() === 'airing' ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                                                        {anime.status || 'Unknown'}
                                                    </span>
                                                )}
                                                <span className="bg-yorumi-accent/20 text-yorumi-accent px-3 py-1.5 rounded-lg text-xs font-bold border border-yorumi-accent/50 uppercase">
                                                    {anime.type || 'Anime'}
                                                </span>
                                            </div>

                                            <p className="text-gray-300 text-sm md:text-base line-clamp-3 mb-8 max-w-xl leading-relaxed">
                                                {anime.synopsis || "No synopsis available."}
                                            </p>

                                            <div className="flex gap-4">
                                                <button
                                                    onMouseEnter={() => onAnimeHover?.(anime)}
                                                    onFocus={() => onAnimeHover?.(anime)}
                                                    onClick={() => onWatchClick(anime)}
                                                    className="bg-yorumi-accent text-yorumi-bg px-6 md:px-8 py-3 md:py-3.5 rounded-full font-bold hover:bg-white transition-all duration-300 transform hover:scale-105 flex items-center gap-3 shadow-[0_0_20px_rgba(61,180,242,0.3)] hover:shadow-[0_0_30px_rgba(61,180,242,0.6)] text-sm md:text-base"
                                                >
                                                    <div className="bg-yorumi-bg text-white rounded-full p-1.5 -ml-2">
                                                        <svg className="w-3 h-3 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                                    </div>
                                                    Watch Now
                                                </button>
                                                <button
                                                    onMouseEnter={() => onAnimeHover?.(anime)}
                                                    onFocus={() => onAnimeHover?.(anime)}
                                                    onClick={() => onAnimeClick(anime)}
                                                    className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 md:px-8 py-3 md:py-3.5 rounded-full font-bold hover:bg-white/20 transition-all duration-300 flex items-center gap-2 text-sm md:text-base"
                                                >
                                                    Detail <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Cover Image (Right - Portrait) */}
                                        <div className="ml-auto lg:mr-12 xl:mr-20">
                                            {coverImage && <SpotlightCover thumbnail={coverImage} title={displayTitle} />}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Navigation Buttons (Bottom Right) - Desktop Only */}
            <div className="absolute bottom-8 right-8 z-20 hidden md:flex gap-2">
                <button
                    onClick={handlePrev}
                    className="p-2 bg-black/60 hover:bg-yorumi-accent hover:text-yorumi-bg text-white rounded-lg border border-white/10 transition-all backdrop-blur-md"
                    aria-label="Previous Slide"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button
                    onClick={handleNext}
                    className="p-2 bg-black/60 hover:bg-yorumi-accent hover:text-yorumi-bg text-white rounded-lg border border-white/10 transition-all backdrop-blur-md"
                    aria-label="Next Slide"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
            </div>

            {/* Dots Indicator */}
            <div className="absolute z-20 flex gap-2 right-4 top-1/2 -translate-y-1/2 flex-col md:flex-row md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:top-auto md:right-auto md:translate-y-0">
                {animeList.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => scrollTo(idx)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === selectedIndex ? 'bg-yorumi-accent md:w-6 h-6 md:h-2' : 'bg-white/30 hover:bg-white/50'
                            }`}
                        aria-label={`Go to slide ${idx + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default SpotlightHero;
