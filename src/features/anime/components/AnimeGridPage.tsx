import { ArrowLeft } from 'lucide-react';
import AnimeCardSkeleton from './AnimeCardSkeleton';
import Pagination from '../../../components/ui/Pagination';
import AnimeCard from './AnimeCard';
import type { Anime } from '../../../types/anime';
import { useTitleLanguage } from '../../../context/TitleLanguageContext';
import { getDisplayTitle } from '../../../utils/titleLanguage';
import { getDisplayImageUrl } from '../../../utils/image';

interface AnimeGridPageProps {
    title: string;
    animeList: Anime[];
    isLoading: boolean;
    pagination: {
        current_page: number;
        last_visible_page: number;
        has_next_page: boolean;
    };
    onPageChange: (page: number) => void;
    onBack: () => void;
    onAnimeClick: (anime: Anime) => void;
    onAnimeHover?: (anime: Anime) => void;
    variant?: 'portrait' | 'landscape';
}

export default function AnimeGridPage({
    title,
    animeList,
    isLoading,
    pagination,
    onPageChange,
    onBack,
    onAnimeClick,
    onAnimeHover,
    variant = 'portrait'
}: AnimeGridPageProps) {
    const { language } = useTitleLanguage();
    const renderLandscapeCard = (item: Anime) => {
        const displayTitle = getDisplayTitle(item as unknown as Record<string, unknown>, language);
        const landscapeImage = getDisplayImageUrl(
            item.episodeMetadata?.[0]?.thumbnail ||
            item.anilist_banner_image ||
            item.images.jpg.large_image_url ||
            item.images.jpg.image_url
        );
        const episodeCount = item.latestEpisode || item.episodes;

        return (
            <button
                key={`${item.scraperId || item.id || item.mal_id || item.title}-${item.latestEpisode || item.episodes || 0}`}
                onClick={() => onAnimeClick(item)}
                onMouseEnter={() => onAnimeHover?.(item)}
                className="group min-w-0 text-left transition-transform duration-300 hover:-translate-y-1"
            >
                <div className="relative aspect-video rounded-lg overflow-hidden mb-3 shadow-lg border border-white/5 bg-white/5">
                    <img
                        src={landscapeImage}
                        alt={displayTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white ml-1">
                                <path fillRule="evenodd" d="M4.5 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                    {episodeCount && (
                        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur text-white text-[10px] font-bold px-1.5 py-0.5 rounded border border-white/10">
                            EP {episodeCount}
                        </div>
                    )}
                </div>
                <h3 className="block w-full overflow-hidden text-ellipsis whitespace-nowrap px-1 text-sm font-bold text-gray-200 group-hover:text-yorumi-accent transition-colors">
                    {displayTitle}
                </h3>
            </button>
        );
    };

    return (
        <div className="pb-12 min-h-screen pt-24 container mx-auto px-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={onBack}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <h2 className="text-2xl font-black text-white tracking-wide uppercase">{title}</h2>
            </div>
            {isLoading ? (
                <div className={variant === 'landscape'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                    : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6'}>
                    {Array.from({ length: 12 }).map((_, i) => (
                        variant === 'landscape' ? (
                            <div key={i} className="min-w-0">
                                <div className="aspect-video rounded-lg bg-white/10 animate-pulse mb-3" />
                                <div className="h-4 w-4/5 rounded bg-white/10 animate-pulse" />
                            </div>
                        ) : (
                            <AnimeCardSkeleton key={i} />
                        )
                    ))}
                </div>
            ) : (
                <>
                    {animeList.length > 0 ? (
                        <div className={variant === 'landscape'
                            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                            : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6'}>
                            {animeList.map((item) => variant === 'landscape'
                                ? renderLandscapeCard(item)
                                : (
                                    <AnimeCard
                                        key={`${item.scraperId || item.id || item.mal_id || item.title}-${item.latestEpisode || item.episodes || 0}`}
                                        anime={item}
                                        onClick={() => onAnimeClick(item)}
                                        onMouseEnter={() => onAnimeHover?.(item)}
                                    />
                                )
                            )}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-10 text-center text-gray-400">
                            No titles available right now.
                        </div>
                    )}
                    {pagination && (
                        <Pagination
                            currentPage={pagination.current_page}
                            lastPage={pagination.last_visible_page}
                            onPageChange={onPageChange}
                        />
                    )}
                </>
            )}
        </div>
    );
}
