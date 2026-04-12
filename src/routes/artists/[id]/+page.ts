import type { PageLoad } from './$types';
import { getActiveServer } from '$lib/server-store.svelte';
import { getArtist } from '$lib/subsonic';

export const load: PageLoad = ({ params }) => {
	const server = getActiveServer();
	if (!server || !params.id) return { artistPromise: null };

	const artistPromise = getArtist(server, params.id);
	return { artistPromise };
};
