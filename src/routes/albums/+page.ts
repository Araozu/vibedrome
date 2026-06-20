import type { PageLoad } from './$types';
import { getActiveServer } from '$lib/server-store.svelte';
import { getAlbumList, searchAlbums, type AlbumListType } from '$lib/subsonic';

const PAGE_SIZE = 50;

function parsePage(value: string | null): number {
	const parsed = Number(value ?? '0');
	return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

function parseSort(value: string | null): AlbumListType {
	switch (value) {
		case 'alphabeticalByArtist':
		case 'newest':
		case 'recent':
		case 'frequent':
		case 'random':
		case 'starred':
			return value;
		default:
			return 'alphabeticalByName';
	}
}

export const load: PageLoad = ({ url }) => {
	const server = getActiveServer();
	if (!server) return { albumsPromise: null };

	const query = url.searchParams.get('q')?.trim() ?? '';
	const sort = parseSort(url.searchParams.get('sort'));
	const currentPage = parsePage(url.searchParams.get('page'));
	const offset = currentPage * PAGE_SIZE;

	const albumsPromise = query
		? searchAlbums(server, query, PAGE_SIZE, offset)
		: getAlbumList(server, sort, PAGE_SIZE, offset);

	return { albumsPromise };
};
