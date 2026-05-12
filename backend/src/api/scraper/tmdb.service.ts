import axios from 'axios';
import { cacheGet, cacheSet } from '../../utils/redis-cache';

const TMDB_API_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';
const TMDB_ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN || process.env.TMDB_BEARER_TOKEN || '';
const TMDB_API_KEY = process.env.TMDB_API_KEY || process.env.THEMOVIEDB_API_KEY || '';

type TmdbSearchInput = {
    title?: string;
    titles?: Array<string | undefined>;
    year?: string | number;
    format?: string;
};

type TmdbSearchResult = {
    id: number;
    name?: string;
    title?: string;
    original_name?: string;
    original_title?: string;
    first_air_date?: string;
    release_date?: string;
    origin_country?: string[];
    original_language?: string;
    backdrop_path?: string;
    poster_path?: string;
    popularity?: number;
};

const normalizeTitle = (value: unknown) =>
    String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const getYear = (value: unknown) => {
    const match = String(value || '').match(/\b(19|20)\d{2}\b/);
    return match?.[0] || '';
};

class TmdbService {
    private memoryCache = new Map<string, { expiresAt: number; value: string | null }>();

    private isConfigured() {
        return Boolean(TMDB_ACCESS_TOKEN || TMDB_API_KEY);
    }

    private async get<T>(path: string, params: Record<string, unknown>) {
        if (!this.isConfigured()) return null;

        const { data } = await axios.get<T>(`${TMDB_API_BASE}${path}`, {
            params: TMDB_API_KEY ? { ...params, api_key: TMDB_API_KEY } : params,
            timeout: 8000,
            proxy: false,
            headers: {
                Accept: 'application/json',
                ...(TMDB_ACCESS_TOKEN ? { Authorization: `Bearer ${TMDB_ACCESS_TOKEN}` } : {}),
            },
        });

        return data;
    }

    private buildImageUrl(path?: string | null, size = 'original') {
        const filePath = String(path || '').trim();
        return filePath ? `${TMDB_IMAGE_BASE}/${size}${filePath}` : '';
    }

    private scoreCandidate(candidate: TmdbSearchResult, titleTokens: string[], year?: string) {
        const candidateTitles = [
            candidate.name,
            candidate.title,
            candidate.original_name,
            candidate.original_title,
        ].map(normalizeTitle).filter(Boolean);
        let score = Number(candidate.popularity || 0) / 100;

        for (const target of titleTokens) {
            for (const candidateTitle of candidateTitles) {
                if (candidateTitle === target) score += 100;
                else if (candidateTitle.includes(target) || target.includes(candidateTitle)) score += 55;
            }
        }

        const candidateYear = getYear(candidate.first_air_date || candidate.release_date);
        if (year && candidateYear === year) score += 25;
        if (candidate.backdrop_path) score += 15;
        if (candidate.origin_country?.includes('JP') || candidate.original_language === 'ja') score += 10;

        return score;
    }

    async resolveBackdrop(input: TmdbSearchInput): Promise<string | undefined> {
        const titles = [
            ...(Array.isArray(input.titles) ? input.titles : []),
            input.title,
        ].map((title) => String(title || '').trim()).filter(Boolean);
        const titleTokens = [...new Set(titles.map(normalizeTitle).filter(Boolean))];
        if (titleTokens.length === 0 || !this.isConfigured()) return undefined;

        const year = getYear(input.year);
        const cacheKey = `tmdb:backdrop:v1:${titleTokens.join('|')}:${year}:${String(input.format || '').toUpperCase()}`;
        const now = Date.now();
        const mem = this.memoryCache.get(cacheKey);
        if (mem && mem.expiresAt > now) return mem.value || undefined;

        const redisCached = await cacheGet<string | null>(cacheKey).catch(() => null);
        if (redisCached !== null) {
            this.memoryCache.set(cacheKey, { expiresAt: now + 24 * 60 * 60 * 1000, value: redisCached });
            return redisCached || undefined;
        }

        const mediaTypes = String(input.format || '').toUpperCase() === 'MOVIE'
            ? ['movie', 'tv']
            : ['tv', 'movie'];
        const candidates: TmdbSearchResult[] = [];

        for (const title of titles.slice(0, 3)) {
            for (const mediaType of mediaTypes) {
                const payload = await this.get<{ results?: TmdbSearchResult[] }>(`/search/${mediaType}`, {
                    query: title,
                    include_adult: false,
                    language: 'en-US',
                    ...(year
                        ? mediaType === 'movie'
                            ? { primary_release_year: year }
                            : { first_air_date_year: year }
                        : {}),
                }).catch(() => null);

                if (Array.isArray(payload?.results)) {
                    candidates.push(...payload.results);
                }
            }
        }

        const best = candidates
            .filter((candidate) => candidate.backdrop_path || candidate.poster_path)
            .map((candidate) => ({
                candidate,
                score: this.scoreCandidate(candidate, titleTokens, year),
            }))
            .sort((a, b) => b.score - a.score)[0]?.candidate;
        const resolved = this.buildImageUrl(best?.backdrop_path || best?.poster_path) || null;

        this.memoryCache.set(cacheKey, { expiresAt: now + 24 * 60 * 60 * 1000, value: resolved });
        cacheSet(cacheKey, resolved, 24 * 60 * 60).catch(() => undefined);

        return resolved || undefined;
    }
}

export const tmdbService = new TmdbService();
