import { queryOptions } from '@tanstack/svelte-query';
import { getArtists, getArtist, type Artist, type ArtistDetail } from '$lib/subsonic';
import { getActiveServer } from '$lib/server-store.svelte';

export const artistsQuery = () =>
	queryOptions({
		queryKey: ['artists'],
		queryFn: async (): Promise<Artist[]> => {
			const server = getActiveServer();
			if (!server) throw new Error('No server configured');
			return getArtists(server);
		},
		enabled: !!getActiveServer()
	});

export const artistDetailQuery = (id: string) =>
	queryOptions({
		queryKey: ['artists', id],
		queryFn: async (): Promise<ArtistDetail> => {
			const server = getActiveServer();
			if (!server) throw new Error('No server configured');
			return getArtist(server, id);
		},
		enabled: !!getActiveServer() && !!id
	});
