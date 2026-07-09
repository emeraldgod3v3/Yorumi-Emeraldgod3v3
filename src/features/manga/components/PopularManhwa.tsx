import React from 'react';
import { mangaService } from '../../../services/mangaService';
import type { Manga } from '../../../types/manga';
import MangaCarouselSection from './MangaCarouselSection';

interface PopularManhwaProps {
    onMangaClick: (mangaId: string, autoRead?: boolean, manga?: Manga) => void;
    onViewAll?: () => void;
}

const fetchPopularManhwa = () => mangaService.getPopularManhwa(1);

const PopularManhwa: React.FC<PopularManhwaProps> = ({ onMangaClick, onViewAll }) => (
    <MangaCarouselSection
        title="Popular Manhwa"
        peekData={mangaService.peekPopularManhwa(1)}
        fetchData={fetchPopularManhwa}
        onMangaClick={onMangaClick}
        onViewAll={onViewAll}
    />
);

export default PopularManhwa;
