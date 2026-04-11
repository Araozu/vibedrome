<script lang="ts">
	import { ping, getAlbumList, type Album } from '$lib/subsonic';

	let albums = $state<Album[]>([]);
	let error = $state<string | null>(null);
	let loading = $state(true);
	let connected = $state(false);

	async function load() {
		loading = true;
		error = null;

		try {
			await ping();
			connected = true;

			albums = await getAlbumList('newest', 50);
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	load();
</script>

<main style="padding: 2rem; font-family: monospace;">
	<h1>Vibedrome</h1>

	{#if loading}
		<p>Connecting to Navidrome...</p>
	{:else if error}
		<p style="color: red;">Error: {error}</p>
	{:else}
		<p style="color: green;">Connected to Navidrome</p>
		<p>{albums.length} albums loaded</p>

		<hr />

		<ul style="list-style: none; padding: 0;">
			{#each albums as album}
				<li style="margin-bottom: 0.5rem;">
					<strong>{album.name}</strong> &mdash; {album.artist}
					{#if album.year}
						({album.year}){/if}
					&bull; {album.songCount} tracks
					{#if album.genre}
						&bull; {album.genre}{/if}
				</li>
			{/each}
		</ul>
	{/if}
</main>
