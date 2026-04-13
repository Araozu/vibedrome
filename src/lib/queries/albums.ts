import { queryOptions } from '@tanstack/svelte-query';
import { getAlbumList, getAlbum, searchAlbums, type Album, type AlbumDetail } from '$lib/subsonic';
import { getActiveServer } from '$lib/server-store.svelte';

export const albumsQuery = (
	type: Parameters<typeof getAlbumList>[1] = 'newest',
	size = 50,
	offset = 0
) =>
	queryOptions({
		queryKey: ['albums', type, size, offset],
		queryFn: async (): Promise<Album[]> => {
			const server = getActiveServer();
			if (!server) throw new Error('No server configured');
			return getAlbumList(server, type, size, offset);
		},
		enabled: !!getActiveServer()
	});

export const albumDetailQuery = (id: string) =>
	queryOptions({
		queryKey: ['albums', id],
		queryFn: async (): Promise<AlbumDetail> => {
			const server = getActiveServer();
			if (!server) throw new Error('No server configured');
			return getAlbum(server, id);
		},
		enabled: !!getActiveServer() && !!id
	});

export const albumSearchQuery = (query: string, size = 50, offset = 0) =>
	queryOptions({
		queryKey: ['albums', 'search', query, size, offset],
		queryFn: async (): Promise<Album[]> => {
			const server = getActiveServer();
			if (!server) throw new Error('No server configured');
			return searchAlbums(server, query, size, offset);
		},
		enabled: !!getActiveServer() && query.length > 0
	});
