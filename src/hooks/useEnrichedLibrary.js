import { useState, useMemo, useEffect } from 'react';
import { animeApiClient } from '../services/index.js';
import { userLibraryService } from '../api/userLibraryService.js';
import { useGlobalCatalogCache } from './useGlobalCatalogCache.js';
import { useDashboardStore, selectFavorites } from '../store/index.js';

function parseScoreNum(val) {
    if (val === null || val === undefined || val === '') return null;
    const n = Number(val);
    return !Number.isNaN(n) && n > 0 ? Number(n.toFixed(2)) : null;
}

export function useEnrichedLibrary(libraryItems = []) {
    const { itemsById: catalogItemsById } = useGlobalCatalogCache();
    const favorites = useDashboardStore(selectFavorites);

    const [extraMetadata, setExtraMetadata] = useState({});
    const [isEnriching, setIsEnriching] = useState(false);

    const enrichedItems = useMemo(() => {
        if (!Array.isArray(libraryItems)) return [];

        return libraryItems.map((item) => {
            const key = String(item.id);
            const hasDbGenres = Array.isArray(item.genres) && item.genres.length > 0;
            const cachedExtra = extraMetadata[key];
            const favEntry = favorites[key];
            const catalogEntry = catalogItemsById?.get(key);

            const genres = hasDbGenres
                ? item.genres
                : (cachedExtra?.genres?.length > 0
                    ? cachedExtra.genres
                    : (favEntry?.genres?.length > 0
                        ? favEntry.genres
                        : (catalogEntry?.genres || [])));

            const kitsu_score = parseScoreNum(item.kitsu_score)
                ?? parseScoreNum(cachedExtra?.kitsu_score)
                ?? parseScoreNum(favEntry?.score)
                ?? parseScoreNum(catalogEntry?.score);

            const poster = item.poster || cachedExtra?.poster || favEntry?.poster || catalogEntry?.poster || '';
            const subtype = item.subtype || cachedExtra?.subtype || favEntry?.subtype || catalogEntry?.subtype || '';
            const release_year = item.release_year ?? cachedExtra?.release_year ?? favEntry?.year ?? catalogEntry?.year ?? null;

            return {
                ...item,
                genres,
                kitsu_score,
                poster,
                subtype,
                release_year
            };
        });
    }, [libraryItems, extraMetadata, favorites, catalogItemsById]);

    const missingIdsKey = useMemo(() => {
        if (!Array.isArray(libraryItems) || libraryItems.length === 0) return '';

        return libraryItems
            .filter((item) => {
                if (item.metadata_synced) return false;
                const key = String(item.id);
                const hasDbGenres = Array.isArray(item.genres) && item.genres.length > 0;
                const hasDbScore = parseScoreNum(item.kitsu_score) !== null;
                const hasExtra = Object.hasOwn(extraMetadata, key);
                const fav = favorites[key];
                const cat = catalogItemsById?.get(key);

                const hasAnyGenres = hasDbGenres ||
                    (Array.isArray(fav?.genres) && fav.genres.length > 0) ||
                    (Array.isArray(cat?.genres) && cat.genres.length > 0);
                const hasAnyScore = hasDbScore || parseScoreNum(fav?.score) !== null || parseScoreNum(cat?.score) !== null;

                return !hasExtra && (!hasAnyGenres || !hasAnyScore);
            })
            .map((item) => String(item.id))
            .sort()
            .join(',');
    }, [libraryItems, extraMetadata, favorites, catalogItemsById]);

    useEffect(() => {
        if (!missingIdsKey) return;

        const controller = new AbortController();
        let active = true;
        const targets = missingIdsKey.split(',').filter(Boolean);

        (async () => {
            await Promise.resolve();
            if (!active || controller.signal.aborted) return;
            setIsEnriching(true);

            try {
                const CONCURRENCY = 3;
                for (let i = 0; i < targets.length; i += CONCURRENCY) {
                    if (!active || controller.signal.aborted) break;

                    const batch = targets.slice(i, i + CONCURRENCY);
                    const results = await Promise.all(
                        batch.map(async (animeId) => {
                            try {
                                const anime = await animeApiClient.getAnimeById(animeId, controller.signal);
                                const genres = Array.isArray(anime?.genres)
                                    ? anime.genres
                                        .map((g) => (typeof g === 'string' ? g.trim() : String(g?.name || '').trim()))
                                        .filter(Boolean)
                                    : [];

                                const meta = {
                                    kitsu_score: parseScoreNum(anime?.score),
                                    genres,
                                    poster: anime?.poster || '',
                                    subtype: anime?.subtype || '',
                                    release_year: anime?.year ?? null
                                };

                                try {
                                    await userLibraryService.updateLibraryMetadata(animeId, meta, controller.signal);
                                } catch {
                                    // Non-fatal if metadata cache update fails
                                }
                                return [animeId, meta];
                            } catch (err) {
                                if (err?.name === 'AbortError') {
                                    return null;
                                }
                                return [animeId, { kitsu_score: null, genres: [], poster: '', subtype: '', release_year: null }];
                            }
                        })
                    );

                    if (!active || controller.signal.aborted) break;

                    const patch = {};
                    for (const entry of results) {
                        if (entry) {
                            patch[entry[0]] = entry[1];
                        }
                    }

                    if (Object.keys(patch).length > 0) {
                        setExtraMetadata((prev) => ({ ...prev, ...patch }));
                    }
                }
            } finally {
                if (active) {
                    setIsEnriching(false);
                }
            }
        })();

        return () => {
            active = false;
            controller.abort();
        };
    }, [missingIdsKey]);

    return {
        items: enrichedItems,
        isEnriching
    };
}

export default useEnrichedLibrary;
