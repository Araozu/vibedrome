import type { PageLoad } from './$types';
import { getActiveServer } from '$lib/server-store.svelte';
import { getAlbumList } from '$lib/subsonic';

export const load: PageLoad = () => {
	const server = getActiveServer();
	if (!server) return { recentPromise: null, randomPromise: null };

	const recentPromise = getAlbumList(server, 'newest', 10);
	const randomPromise = getAlbumList(server, 'random', 10);
	return { recentPromise, randomPromise };
};
