import axios from 'axios';
import * as cheerio from 'cheerio';
import type { AnimeSearchResult } from './types';

const REANIME_BASE = 'https://reanime.to';
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36';

type TopTrendingRange = 'now' | 'day' | 'week' | 'month';

type ReAnimeListItem = {
    title: string;
    jname?: string;
    poster?: string;
    banner?: string;
    description?: string;
    type?: string;
    episodes?: number;
    latestEpisode?: number;
    sub?: number;
    dub?: number;
    link: string;
    scraperId: string;
    dataId?: string;
    score?: string;
    year?: string;
    genres?: string;
};

type ReAnimeGenreItem = {
    name: string;
    slug: string;
};

type ReAnimeHomeAnime = {
    anime_id?: string;
    average_score?: number;
    banner_image?: string;
    cover_image?: {
        extra_large?: string;
        large?: string;
        medium?: string;
    };
    description?: string;
    dubbed?: number;
    duration?: string;
    episode?: {
        episode_number?: number;
        title?: string;
    };
    episodes?: number;
    format?: string;
    genres?: string[];
    season_year?: number;
    status?: string;
    subbed?: number;
    title?: {
        english?: string;
        native?: string;
        romaji?: string;
        user_preferred?: string;
    };
};

type ReAnimeHomeData = {
    latest_aired: ReAnimeHomeAnime[];
    new_on_site: ReAnimeHomeAnime[];
    trending: ReAnimeHomeAnime[];
    upcoming: ReAnimeHomeAnime[];
};

export class ReAnimeScraper {
    async close() { }

    private async fetchHtml(path: string) {
        const { data } = await axios.get(`${REANIME_BASE}${path}`, {
            timeout: 20000,
            proxy: false,
            headers: {
                'User-Agent': BROWSER_UA,
                Referer: `${REANIME_BASE}/`,
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
        });
        return String(data || '');
    }

    private async fetchPage(path: string) {
        return cheerio.load(await this.fetchHtml(path));
    }

    private findMatchingToken(source: string, start: number, open: string, close: string) {
        let depth = 0;
        let inString = false;
        let escaped = false;

        for (let index = start; index < source.length; index += 1) {
            const char = source[index];

            if (inString) {
                if (escaped) {
                    escaped = false;
                } else if (char === '\\') {
                    escaped = true;
                } else if (char === '"') {
                    inString = false;
                }
                continue;
            }

            if (char === '"') {
                inString = true;
                continue;
            }
            if (char === open) depth += 1;
            if (char === close) {
                depth -= 1;
                if (depth === 0) return index;
            }
        }

        return -1;
    }

    private quoteJsObjectKeys(source: string) {
        let output = '';
        let inString = false;
        let escaped = false;

        for (let index = 0; index < source.length; index += 1) {
            const char = source[index];

            if (inString) {
                output += char;
                if (escaped) {
                    escaped = false;
                } else if (char === '\\') {
                    escaped = true;
                } else if (char === '"') {
                    inString = false;
                }
                continue;
            }

            if (char === '"') {
                inString = true;
                output += char;
                continue;
            }

            if (char === '{' || char === ',') {
                output += char;
                let cursor = index + 1;
                while (/\s/.test(source[cursor] || '')) {
                    output += source[cursor];
                    cursor += 1;
                }

                const keyMatch = source.slice(cursor).match(/^([A-Za-z_$][\w$]*)(\s*:)/);
                if (keyMatch) {
                    output += `"${keyMatch[1]}"${keyMatch[2]}`;
                    index = cursor + keyMatch[0].length - 1;
                    continue;
                }

                index = cursor - 1;
                continue;
            }

            output += char;
        }

        return output;
    }

    private extractHomeArray(html: string, key: keyof ReAnimeHomeData): ReAnimeHomeAnime[] {
        const marker = `${key}:[`;
        const markerIndex = html.indexOf(marker);
        if (markerIndex < 0) return [];

        const start = markerIndex + key.length + 1;
        const end = this.findMatchingToken(html, start, '[', ']');
        if (end < 0) return [];

        try {
            const arraySource = html.slice(start, end + 1);
            const jsonSource = this.quoteJsObjectKeys(arraySource);
            const parsed = JSON.parse(jsonSource);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error(`ReAnime embedded ${key} parse error:`, error);
            return [];
        }
    }

    private async getHomeData(): Promise<ReAnimeHomeData> {
        const html = await this.fetchHtml('/home');
        return {
            latest_aired: this.extractHomeArray(html, 'latest_aired'),
            new_on_site: this.extractHomeArray(html, 'new_on_site'),
            trending: this.extractHomeArray(html, 'trending'),
            upcoming: this.extractHomeArray(html, 'upcoming'),
        };
    }

    private extractBackgroundImage(input: string): string | undefined {
        const match = String(input || '').match(/url\((['"]?)(.*?)\1\)/i);
        const value = String(match?.[2] || '').trim();
        return value || undefined;
    }

    private normalizeGenreSlug(value: string): string {
        return String(value || '')
            .trim()
            .replace(/^https?:\/\/[^/]+/i, '')
            .replace(/^\/?search\?genre=/i, '')
            .replace(/[_\s]+/g, '-')
            .replace(/[^a-z0-9-]/gi, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .toLowerCase();
    }

    private parseScraperId(href: string) {
        return String(href || '')
            .trim()
            .replace(/^https?:\/\/[^/]+/i, '')
            .replace(/^\/+/, '')
            .replace(/^(watch|anime)\//i, '')
            .split(/[?#]/)[0]
            .trim();
    }

    private absoluteLink(href: string) {
        const value = String(href || '').trim();
        if (!value) return '';
        if (/^https?:\/\//i.test(value)) return value;
        return `${REANIME_BASE}${value.startsWith('/') ? value : `/${value}`}`;
    }

    private parseEpisodeCounts(text: string) {
        const match = text.match(/^\s*(\d+(?:\.\d+)?)\s+(\d+)\s*\/\s*(\d+)\s*\/\s*(\d+|\?)/);
        const score = match?.[1];
        const sub = Number(match?.[2] || 0) || 0;
        const dub = Number(match?.[3] || 0) || 0;
        const episodes = match?.[4] && match[4] !== '?' ? Number(match[4]) || undefined : undefined;
        return {
            score,
            sub: sub || undefined,
            dub: dub || undefined,
            episodes,
            latestEpisode: Math.max(sub, dub) || undefined,
        };
    }

    private parseFormat(text: string): string | undefined {
        const match = text.match(/\b(TV_SHORT|TV|MOVIE|SPECIAL|OVA|ONA|MUSIC)\b/i);
        return match?.[1]?.toUpperCase();
    }

    private normalizeTitle(title: string) {
        return String(title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    private getHomeAnimeTitle(item: ReAnimeHomeAnime) {
        return String(
            item.title?.english ||
            item.title?.user_preferred ||
            item.title?.romaji ||
            item.title?.native ||
            ''
        ).trim();
    }

    private mapHomeAnime(item: ReAnimeHomeAnime): ReAnimeListItem | null {
        const title = this.getHomeAnimeTitle(item);
        const scraperId = String(item.anime_id || '').trim();
        if (!title || !scraperId) return null;

        const sub = Number(item.subbed || 0) || 0;
        const dub = Number(item.dubbed || 0) || 0;
        const episodeNumber = Number(item.episode?.episode_number || 0) || 0;
        const latestEpisode = Math.max(sub, dub, episodeNumber) || undefined;
        const episodes = Number(item.episodes || 0) || undefined;
        const score = Number(item.average_score || 0);

        return {
            title,
            jname: item.title?.romaji || item.title?.native || undefined,
            poster: item.cover_image?.large || item.cover_image?.extra_large || item.cover_image?.medium || undefined,
            banner: item.banner_image || undefined,
            description: String(item.description || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() || undefined,
            type: item.format || undefined,
            episodes,
            latestEpisode,
            sub: sub || undefined,
            dub: dub || undefined,
            link: `${REANIME_BASE}/${latestEpisode ? 'watch' : 'anime'}/${scraperId}${latestEpisode ? '?ep=latest' : ''}`,
            scraperId,
            score: score > 0 ? (score / 10).toFixed(1) : undefined,
            year: item.season_year ? String(item.season_year) : undefined,
            genres: Array.isArray(item.genres) ? item.genres.join(', ') : undefined,
        };
    }

    private parseCard($: any, element: any): ReAnimeListItem | null {
        const $el = $(element);
        const href = String($el.attr('href') || '').trim();
        const scraperId = this.parseScraperId(href);
        const img = $el.find('img').first();
        const title = String($el.find('h3').first().text() || img.attr('alt') || '').replace(/\s+/g, ' ').trim();
        const poster = String(img.attr('src') || '').trim();
        const text = String($el.text() || '').replace(/\s+/g, ' ').trim();
        const counts = this.parseEpisodeCounts(text);

        if (!title || !scraperId) return null;

        return {
            title,
            poster: poster || undefined,
            type: this.parseFormat(text),
            link: this.absoluteLink(href),
            scraperId,
            ...counts,
        };
    }

    private getSectionCards($: any, heading: string): ReAnimeListItem[] {
        const h2 = $('h2').filter((_: number, element: any) =>
            String($(element).text() || '').trim().toLowerCase() === heading.toLowerCase()
        ).first();
        if (!h2.length) return [];

        const sectionRoot = h2.parent().parent().parent();
        const seen = new Set<string>();
        const items: ReAnimeListItem[] = [];
        sectionRoot.find('a[href^="/watch/"], a[href^="/anime/"]').each((_: number, element: any) => {
            const item = this.parseCard($, element);
            if (!item || seen.has(item.scraperId)) return;
            seen.add(item.scraperId);
            items.push(item);
        });
        return items;
    }

    private parseHero($: any): ReAnimeListItem | null {
        const hero = $('[role="region"][aria-label*="Hero"]').first();
        const title = String(hero.find('h1').first().text() || '').replace(/\s+/g, ' ').trim();
        if (!hero.length || !title) return null;

        const description = String(hero.find('p').first().text() || '').replace(/\s+/g, ' ').trim();
        const meta = hero.find('span').map((_: number, el: any) => String($(el).text() || '').trim()).get();
        const score = String(meta.find((value: string) => value.includes('★')) || '').replace(/[^\d.]/g, '') || undefined;
        const type = meta.find((value: string) => /^(TV_SHORT|TV|MOVIE|SPECIAL|OVA|ONA|MUSIC)$/i.test(value));
        const year = meta.find((value: string) => /^\d{4}$/.test(value));
        const desktopBg = this.extractBackgroundImage(String(hero.find('[style*="background-image"]').first().attr('style') || ''));
        const mobileBg = this.extractBackgroundImage(String(hero.find('[style*="background-image"]').eq(1).attr('style') || ''));

        return {
            title,
            description: description || undefined,
            banner: desktopBg || undefined,
            poster: mobileBg || desktopBg || undefined,
            score,
            type,
            year,
            link: `${REANIME_BASE}/search?q=${encodeURIComponent(title)}`,
            scraperId: title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, ''),
        };
    }

    async getSpotlightAnime(): Promise<ReAnimeListItem[]> {
        try {
            const homeData = await this.getHomeData();
            const seen = new Set<string>();
            const items = homeData.trending
                .map((item) => this.mapHomeAnime(item))
                .slice(0, 8)
                .filter(Boolean) as ReAnimeListItem[];

            return items.filter((item) => {
                const key = this.normalizeTitle(item.title);
                if (!key || seen.has(key)) return false;
                seen.add(key);
                return true;
            });
        } catch (error) {
            console.error('ReAnime spotlight error:', error);
            return [];
        }
    }

    async getLatestUpdates(): Promise<ReAnimeListItem[]> {
        try {
            const homeData = await this.getHomeData();
            const items = homeData.latest_aired
                .map((item) => this.mapHomeAnime(item))
                .filter(Boolean) as ReAnimeListItem[];
            return items;
        } catch (error) {
            console.error('ReAnime latest updates error:', error);
            return [];
        }
    }

    async getNewReleases(page: number = 1, limit: number = 18): Promise<{
        data: ReAnimeListItem[];
        pagination: {
            current_page: number;
            last_visible_page: number;
            has_next_page: boolean;
        };
    }> {
        const safePage = Math.max(1, Number(page) || 1);
        const safeLimit = Math.max(1, Number(limit) || 18);

        try {
            const homeData = await this.getHomeData();
            const latest = homeData.latest_aired
                .map((item) => this.mapHomeAnime(item))
                .filter(Boolean) as ReAnimeListItem[];
            const newOnSite = homeData.new_on_site
                .map((item) => this.mapHomeAnime(item))
                .filter(Boolean) as ReAnimeListItem[];
            const combined = [...latest, ...newOnSite];
            const seen = new Set<string>();
            const unique = combined.filter((item) => {
                if (seen.has(item.scraperId)) return false;
                seen.add(item.scraperId);
                return true;
            });
            const start = (safePage - 1) * safeLimit;
            const data = unique.slice(start, start + safeLimit);
            const lastPage = Math.max(1, Math.ceil(unique.length / safeLimit));

            return {
                data,
                pagination: {
                    current_page: safePage,
                    last_visible_page: lastPage,
                    has_next_page: safePage < lastPage,
                },
            };
        } catch (error) {
            console.error('ReAnime new releases error:', error);
            return {
                data: [],
                pagination: {
                    current_page: safePage,
                    last_visible_page: safePage,
                    has_next_page: false,
                },
            };
        }
    }

    async getTopTrending(range: TopTrendingRange): Promise<ReAnimeListItem[]> {
        try {
            const homeData = await this.getHomeData();
            const source = range === 'week' || range === 'month'
                ? homeData.trending
                : [...homeData.latest_aired, ...homeData.new_on_site];
            const items = source
                .map((item) => this.mapHomeAnime(item))
                .filter(Boolean) as ReAnimeListItem[];

            return items
                .sort((a, b) => (Number(b.score || 0) - Number(a.score || 0)))
                .slice(0, 10)
                .map((item, index) => ({ ...item, dataId: String(index + 1) }));
        } catch (error) {
            console.error('ReAnime top trending error:', error);
            return [];
        }
    }

    async getAZList(letter: string, page: number = 1): Promise<{
        data: ReAnimeListItem[];
        pagination: {
            current_page: number;
            last_visible_page: number;
            has_next_page: boolean;
        };
    }> {
        const safePage = Math.max(1, Number(page) || 1);
        const rawLetter = String(letter || 'All').trim();
        const allItems = await this.search('');
        const normalized = rawLetter.toUpperCase();
        const filtered = normalized === 'ALL'
            ? allItems
            : allItems.filter((item) => {
                const first = item.title.trim().charAt(0).toUpperCase();
                return normalized === '#' || normalized === '0-9'
                    ? /^\d/.test(first)
                    : first === normalized;
            });
        const safeLimit = 24;
        const start = (safePage - 1) * safeLimit;
        const data = filtered.slice(start, start + safeLimit).map((item) => ({
            title: item.title,
            poster: item.poster,
            type: item.type,
            episodes: item.episodes,
            latestEpisode: item.sub,
            sub: item.sub,
            dub: item.dub,
            link: item.url,
            scraperId: item.session,
        }));
        const lastPage = Math.max(1, Math.ceil(filtered.length / safeLimit));

        return {
            data,
            pagination: {
                current_page: safePage,
                last_visible_page: lastPage,
                has_next_page: safePage < lastPage,
            },
        };
    }

    async getGenres(): Promise<ReAnimeGenreItem[]> {
        try {
            const $ = await this.fetchPage('/anime/haikyu-tj52en');
            const seen = new Set<string>();
            const genres: ReAnimeGenreItem[] = [];
            $('a[href^="/search?genre="]').each((_: number, element: any) => {
                const name = String($(element).text() || '').trim();
                const href = String($(element).attr('href') || '').trim();
                const slug = this.normalizeGenreSlug(decodeURIComponent(href));
                if (!name || !slug || seen.has(slug)) return;
                seen.add(slug);
                genres.push({ name, slug });
            });
            return genres;
        } catch (error) {
            console.error('ReAnime genres error:', error);
            return [];
        }
    }

    async getGenreAnime(genre: string, page: number = 1, limit: number = 24): Promise<{
        genre: ReAnimeGenreItem;
        data: ReAnimeListItem[];
        pagination: {
            current_page: number;
            last_visible_page: number;
            has_next_page: boolean;
        };
    }> {
        const safePage = Math.max(1, Number(page) || 1);
        const safeLimit = Math.max(1, Number(limit) || 24);
        const rawGenre = String(genre || '').trim();
        const slug = this.normalizeGenreSlug(rawGenre);

        try {
            const $ = await this.fetchPage(`/search?genre=${encodeURIComponent(rawGenre)}`);
            const cards = $('a[href^="/watch/"], a[href^="/anime/"]')
                .map((_: number, element: any) => this.parseCard($, element))
                .get()
                .filter(Boolean) as ReAnimeListItem[];
            const start = (safePage - 1) * safeLimit;
            const data = cards.slice(start, start + safeLimit);
            const lastPage = Math.max(1, Math.ceil(cards.length / safeLimit));

            return {
                genre: { name: rawGenre || slug, slug },
                data,
                pagination: {
                    current_page: safePage,
                    last_visible_page: lastPage,
                    has_next_page: safePage < lastPage,
                },
            };
        } catch (error) {
            console.error(`ReAnime genre page error (${rawGenre}, page=${safePage}):`, error);
            return {
                genre: { name: rawGenre || slug, slug },
                data: [],
                pagination: {
                    current_page: safePage,
                    last_visible_page: safePage,
                    has_next_page: false,
                },
            };
        }
    }

    async search(query: string): Promise<AnimeSearchResult[]> {
        const normalizedQuery = this.normalizeTitle(query);

        try {
            const $ = await this.fetchPage('/home');
            const items = [
                ...this.getSectionCards($, 'Latest Episodes'),
                ...this.getSectionCards($, 'New on Site'),
                ...this.getSectionCards($, 'Upcoming'),
            ];
            const seen = new Set<string>();

            return items
                .filter((item) => {
                    const key = this.normalizeTitle(item.title);
                    if (!key || seen.has(item.scraperId)) return false;
                    seen.add(item.scraperId);
                    return !normalizedQuery || key.includes(normalizedQuery) || normalizedQuery.includes(key);
                })
                .map((item) => ({
                    id: item.scraperId,
                    session: item.scraperId,
                    title: item.title,
                    url: `/watch/${item.scraperId}`,
                    poster: item.poster,
                    type: item.type,
                    episodes: item.episodes,
                    sub: item.sub,
                    dub: item.dub,
                    score: item.score,
                }));
        } catch (error) {
            console.error('ReAnime search error:', error);
            return [];
        }
    }

    async getAnimeInfo(animeSessionId: string): Promise<{
        id: string;
        title: string;
        poster?: string;
        description?: string;
        status?: string;
        episodes?: number;
        type?: string;
        year?: string;
    } | null> {
        const session = this.parseScraperId(animeSessionId);
        if (!session) return null;

        for (const path of [`/anime/${session}`, `/watch/${session}`]) {
            try {
                const $ = await this.fetchPage(path);
                const title = String($('h1').first().text() || $('h2').first().text() || '').replace(/\s+/g, ' ').trim();
                if (!title || /^episodes$/i.test(title)) continue;

                const poster = String($('img[alt]').filter((_: number, el: any) =>
                    String($(el).attr('alt') || '').toLowerCase() === title.toLowerCase()
                ).first().attr('src') || $('img').eq(1).attr('src') || '').trim();
                const banner = String($('img[alt="banner"]').attr('src') || '').trim();
                const description = String($('p').first().text() || '').replace(/\s+/g, ' ').trim();
                const pageText = String($('body').text() || '').replace(/\s+/g, ' ');
                const year = pageText.match(/\b(19|20)\d{2}\b/)?.[0];
                const format = this.parseFormat(pageText);
                const counts = this.parseEpisodeCounts(pageText);

                return {
                    id: session,
                    title,
                    poster: poster || banner || undefined,
                    description: description || undefined,
                    status: pageText.match(/\b(Releasing|Finished|Not Yet Released|Cancelled)\b/i)?.[1],
                    episodes: counts.episodes,
                    type: format,
                    year,
                };
            } catch {
                // Try the alternate Re:ANIME route before giving up.
            }
        }

        return null;
    }
}
