export interface AnimeSearchResult {
    id: string;
    title: string;
    url: string;
    poster?: string;
    status?: string;
    type?: string;
    episodes?: number;
    sub?: number;
    dub?: number;
    year?: string;
    score?: string;
    session: string;
}

export interface Episode {
    id: string;
    episodeNumber: number;
    url: string;
    title?: string;
    duration?: string;
    date?: string;
    snapshot?: string;
    session: string;
    isSubbed?: boolean;
    isDubbed?: boolean;
    isFiller?: boolean;
}

export interface StreamLink {
    quality: string;
    audio: string;
    provider?: string;
    server?: string;
    url: string;
    directUrl?: string;
    referer?: string;
    cookie?: string;
    audioLanguage?: string;
    isHls: boolean;
    subtitles?: { url: string; lang: string; default?: boolean }[];
    thumbnails?: ThumbnailInfo;
}

export interface ThumbnailInfo {
    spriteUrl?: string;
    spriteGrid?: { columns: number; rows: number };
    thumbnailUrl?: string;
    interval?: number;
    vttUrl?: string;
}
