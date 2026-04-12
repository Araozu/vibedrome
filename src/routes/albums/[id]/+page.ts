import type { PageLoad } from './$types';
import { getActiveServer } from '$lib/server-store.svelte';
import { getAlbum } from '$lib/subsonic';

export const load: PageLoad = ({ params }) => {
	const server = getActiveServer();
	if (!server || !params.id) return { albumPromise: null };

	const albumPromise = getAlbum(server, params.id);
	return { albumPromise };
};
