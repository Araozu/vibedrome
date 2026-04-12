<script lang="ts">
	import { page } from '$app/state';
	import { createQuery } from '@tanstack/svelte-query';
	import { artistDetailQuery } from '$lib/queries/artists';
	import { getActiveServer } from '$lib/server-store.svelte';
	import { getCoverArtUrl } from '$lib/subsonic';
	import CoverImage from '$lib/components/CoverImage.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import ArrowLeftIcon from 'phosphor-svelte/lib/ArrowLeft';
	import UserIcon from 'phosphor-svelte/lib/User';
	import MusicNoteIcon from 'phosphor-svelte/lib/MusicNote';

	const artistId = $derived(page.params.id ?? '');
	const query = createQuery(() => artistDetailQuery(artistId));
</script>

<div class="space-y-6">
	<div>
		<Button variant="ghost" size="sm" href="/artists">
			<ArrowLeftIcon class="size-4" />
			Artists
		</Button>
	</div>

	{#if query.isPending}
		<div class="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
			<div class="size-48 shrink-0 animate-pulse rounded-full bg-muted"></div>
			<div class="flex-1 space-y-3 text-center sm:text-left">
				<div class="mx-auto h-7 w-1/2 animate-pulse rounded bg-muted sm:mx-0"></div>
				<div class="mx-auto h-4 w-1/3 animate-pulse rounded bg-muted sm:mx-0"></div>
			</div>
		</div>
	{:else if query.isError}
		<p class="text-destructive">{query.error.message}</p>
	{:else if query.data}
		{@const artist = query.data}
		{@const server = getActiveServer()}

		<!-- Artist header -->
		<div class="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
			<div class="size-48 shrink-0 overflow-hidden rounded-full bg-muted shadow-md">
				{#if artist.coverArt && server}
					<CoverImage src={getCoverArtUrl(server, artist.coverArt, 600)} alt={artist.name} />
				{:else}
					<div class="flex h-full w-full items-center justify-center">
						<UserIcon class="size-16 text-muted-foreground" />
					</div>
				{/if}
			</div>

			<div class="flex flex-col justify-end space-y-1 text-center sm:text-left">
				<p class="text-xs font-medium tracking-wider text-muted-foreground uppercase">Artist</p>
				<h1 class="text-3xl font-bold tracking-tight text-foreground">{artist.name}</h1>
				<p class="text-sm text-muted-foreground">
					{artist.albumCount}
					{artist.albumCount === 1 ? 'album' : 'albums'}
				</p>
			</div>
		</div>

		<Separator />

		<!-- Albums grid -->
		{#if artist.album && artist.album.length > 0}
			<section class="space-y-4">
				<h2 class="text-lg font-semibold text-foreground">Albums</h2>
				<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
					{#each artist.album as album (album.id)}
						<a href="/albums/{album.id}" class="group space-y-2">
							<div class="relative aspect-square overflow-hidden rounded-lg bg-muted">
								{#if album.coverArt && server}
									<CoverImage
										src={getCoverArtUrl(server, album.coverArt, 300)}
										alt={album.name}
										class="transition-transform duration-200 group-hover:scale-105"
									/>
								{:else}
									<div class="flex h-full w-full items-center justify-center">
										<MusicNoteIcon class="size-12 text-muted-foreground" />
									</div>
								{/if}
							</div>
							<div class="min-w-0">
								<p class="truncate text-sm font-medium text-foreground group-hover:underline">
									{album.name}
								</p>
								<p class="truncate text-xs text-muted-foreground">
									{#if album.year}{album.year} &middot;
									{/if}
									{album.songCount}
									{album.songCount === 1 ? 'song' : 'songs'}
								</p>
							</div>
						</a>
					{/each}
				</div>
			</section>
		{:else}
			<p class="text-muted-foreground">No albums found for this artist.</p>
		{/if}
	{/if}
</div>
