import { queryOptions } from '@tanstack/svelte-query';
import { getLyricsBySongId, type StructuredLyrics } from '$lib/subsonic';
import { getActiveServer } from '$lib/server-store.svelte';

export const lyricsQuery = (songId: string) =>
	queryOptions({
		queryKey: ['lyrics', songId],
		queryFn: async (): Promise<StructuredLyrics[]> => {
			const server = getActiveServer();
			if (!server) throw new Error('No server configured');
			return getLyricsBySongId(server, songId);
		},
		enabled: !!getActiveServer() && !!songId,
		staleTime: Infinity // lyrics don't change for a given song
	});
