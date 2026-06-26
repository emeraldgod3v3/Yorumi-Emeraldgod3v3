import React from 'react';
import { mangaService } from '../../../services/mangaService';
import type { Manga } from '../../../types/manga';
import MangaCarouselSection from './MangaCarouselSection';

interface AllTimePopularMangaProps {
    onMangaClick: (mangaId: string, autoRead?: boolean, manga?: Manga) => void;
    onViewAll?: () => void;
}

const fetchPopularManga = () => mangaService.getPopularManga(1);

const AllTimePopularManga: React.FC<AllTimePopularMangaProps> = ({ onMangaClick, onViewAll }) => (
    <MangaCarouselSection
        title="All Time Popular"
        peekData={mangaService.peekPopularManga(1)}
        fetchData={fetchPopularManga}
        onMangaClick={onMangaClick}
        onViewAll={onViewAll}
    />
);

export default AllTimePopularManga;
