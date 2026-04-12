import type { PageLoad } from './$types';
import { getActiveServer } from '$lib/server-store.svelte';
import { getAlbumList } from '$lib/subsonic';

export const load: PageLoad = () => {
	const server = getActiveServer();
	if (!server) return { albumsPromise: null };

	const albumsPromise = getAlbumList(server);
	return { albumsPromise };
};
