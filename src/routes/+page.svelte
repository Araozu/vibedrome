<script lang="ts">
	import { getServerConfig, saveServerConfig, clearServerConfig } from '$lib/server-config';
	import { ping, getAlbumList, type Album, type ServerConfig } from '$lib/subsonic';

	let config = $state<ServerConfig | null>(getServerConfig());

	// Setup form
	let formUrl = $state('');
	let formUser = $state('');
	let formPassword = $state('');
	let formError = $state<string | null>(null);
	let formLoading = $state(false);

	// Albums
	let albums = $state<Album[]>([]);
	let albumsError = $state<string | null>(null);
	let albumsLoading = $state(false);

	async function connect() {
		formError = null;
		formLoading = true;

		const candidate: ServerConfig = {
			url: formUrl.trim(),
			user: formUser.trim(),
			password: formPassword
		};

		if (!candidate.url || !candidate.user || !candidate.password) {
			formError = 'All fields are required.';
			formLoading = false;
			return;
		}

		try {
			await ping(candidate);
			saveServerConfig(candidate);
			config = candidate;
			loadAlbums();
		} catch (e) {
			formError = e instanceof Error ? e.message : String(e);
		} finally {
			formLoading = false;
		}
	}

	function disconnect() {
		clearServerConfig();
		config = null;
		albums = [];
		formUrl = '';
		formUser = '';
		formPassword = '';
	}

	async function loadAlbums() {
		if (!config) return;
		albumsLoading = true;
		albumsError = null;

		try {
			albums = await getAlbumList(config, 'newest', 50);
		} catch (e) {
			albumsError = e instanceof Error ? e.message : String(e);
		} finally {
			albumsLoading = false;
		}
	}

	// Load albums whenever config changes to a non-null value
	$effect(() => {
		if (config) {
			loadAlbums();
		}
	});
</script>

<main style="padding: 2rem; font-family: monospace; max-width: 800px;">
	<h1>Vibedrome</h1>

	{#if !config}
		<h2>Connect to Navidrome</h2>

		<form
			onsubmit={(e) => {
				e.preventDefault();
				connect();
			}}
			style="display: flex; flex-direction: column; gap: 0.5rem; max-width: 400px;"
		>
			<label>
				Server URL
				<input
					type="url"
					bind:value={formUrl}
					placeholder="https://navidrome.example.com"
					required
					style="display: block; width: 100%; padding: 0.25rem;"
				/>
			</label>

			<label>
				Username
				<input
					type="text"
					bind:value={formUser}
					required
					autocomplete="username"
					style="display: block; width: 100%; padding: 0.25rem;"
				/>
			</label>

			<label>
				Password
				<input
					type="password"
					bind:value={formPassword}
					required
					autocomplete="current-password"
					style="display: block; width: 100%; padding: 0.25rem;"
				/>
			</label>

			{#if formError}
				<p style="color: red;">{formError}</p>
			{/if}

			<button type="submit" disabled={formLoading} style="padding: 0.5rem; cursor: pointer;">
				{formLoading ? 'Connecting...' : 'Connect'}
			</button>
		</form>
	{:else}
		<p>
			Connected to <strong>{config.url}</strong> as {config.user}
			<button onclick={disconnect} style="margin-left: 1rem; cursor: pointer;">Disconnect</button>
		</p>

		{#if albumsLoading}
			<p>Loading albums...</p>
		{:else if albumsError}
			<p style="color: red;">Error: {albumsError}</p>
		{:else}
			<p>{albums.length} albums</p>
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
	{/if}
</main>
