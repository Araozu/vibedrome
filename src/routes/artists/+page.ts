import type { PageLoad } from './$types';
import { getActiveServer } from '$lib/server-store.svelte';
import { getArtists } from '$lib/subsonic';

export const load: PageLoad = () => {
	const server = getActiveServer();
	if (!server) return { artistsPromise: null };

	const artistsPromise = getArtists(server);
	return { artistsPromise };
};
