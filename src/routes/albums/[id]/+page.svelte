<script lang="ts">
	import type { PageProps } from './$types';
	import { page } from '$app/state';
	import { createQuery } from '@tanstack/svelte-query';
	import { albumDetailQuery } from '$lib/queries/albums';
	import { getActiveServer } from '$lib/server-store.svelte';
	import { getCoverArtUrl, type Song } from '$lib/subsonic';
	import CoverImage from '$lib/components/CoverImage.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { playQueue, getCurrentSong, isPlaying } from '$lib/player-store.svelte';
	import { cn } from '$lib/utils';
	import ArrowLeftIcon from 'phosphor-svelte/lib/ArrowLeft';
	import MusicNoteIcon from 'phosphor-svelte/lib/MusicNote';
	import SpeakerHighIcon from 'phosphor-svelte/lib/SpeakerHigh';

	let { data }: PageProps = $props();

	const albumId = $derived(page.params.id ?? '');

	function formatDuration(seconds: number): string {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${m}:${s.toString().padStart(2, '0')}`;
	}

	function formatTotalDuration(seconds: number): string {
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		if (h > 0) return `${h} hr ${m} min`;
		return `${m} min`;
	}

	function handleTrackClick(songs: Song[], index: number) {
		playQueue(songs, index);
	}

	function isSongActive(songId: string): boolean {
		const current = getCurrentSong();
		return current !== null && current.id === songId;
	}
</script>

<div class="space-y-6">
	<div>
		<Button variant="ghost" size="sm" href="/albums">
			<ArrowLeftIcon class="size-4" />
			Albums
		</Button>
	</div>

	{#await data.albumPromise}
		<div class="flex gap-6">
			<div class="size-48 shrink-0 animate-pulse rounded-lg bg-muted"></div>
			<div class="flex-1 space-y-3">
				<div class="h-7 w-1/2 animate-pulse rounded bg-muted"></div>
				<div class="h-4 w-1/3 animate-pulse rounded bg-muted"></div>
				<div class="h-4 w-1/4 animate-pulse rounded bg-muted"></div>
			</div>
		</div>
	{:then preloaded}
		{@const query = createQuery(() => ({
			...albumDetailQuery(albumId),
			placeholderData: preloaded ?? undefined
		}))}

		{#if query.isPending}
			<div class="flex gap-6">
				<div class="size-48 shrink-0 animate-pulse rounded-lg bg-muted"></div>
				<div class="flex-1 space-y-3">
					<div class="h-7 w-1/2 animate-pulse rounded bg-muted"></div>
					<div class="h-4 w-1/3 animate-pulse rounded bg-muted"></div>
					<div class="h-4 w-1/4 animate-pulse rounded bg-muted"></div>
				</div>
			</div>
		{:else if query.isError}
			<p class="text-destructive">{query.error.message}</p>
		{:else if query.data}
			{@const album = query.data}
			{@const server = getActiveServer()}

			<!-- Header -->
			<div class="flex flex-col gap-6 sm:flex-row">
				<div class="size-48 shrink-0 overflow-hidden rounded-lg bg-muted shadow-md">
					{#if album.coverArt && server}
						<CoverImage src={getCoverArtUrl(server, album.coverArt)} alt={album.name} />
					{:else}
						<div class="flex h-full w-full items-center justify-center">
							<MusicNoteIcon class="size-16 text-muted-foreground" />
						</div>
					{/if}
				</div>

				<div class="flex flex-col justify-end space-y-1">
					<p class="text-xs font-medium tracking-wider text-muted-foreground uppercase">Album</p>
					<h1 class="text-3xl font-bold tracking-tight text-foreground">{album.name}</h1>
					<p class="text-sm text-muted-foreground">
						<a href="/artists/{album.artistId}" class="hover:text-foreground hover:underline">
							{album.artist}
						</a>
						{#if album.year}&middot; {album.year}{/if}
						{#if album.genre}&middot; {album.genre}{/if}
					</p>
					<p class="text-xs text-muted-foreground">
						{album.songCount} songs &middot; {formatTotalDuration(album.duration)}
					</p>
				</div>
			</div>

			<Separator />

			<!-- Track list -->
			<div class="space-y-0.5">
				<div
					class="grid grid-cols-[2rem_1fr_auto] gap-4 px-3 pb-2 text-xs font-medium text-muted-foreground"
				>
					<span class="text-right">#</span>
					<span>Title</span>
					<span>Duration</span>
				</div>
				{#each album.song as song, i (song.id)}
					{@const active = isSongActive(song.id)}
					<button
						class={cn(
							'grid w-full grid-cols-[2rem_1fr_auto] items-center gap-4 rounded-md px-3 py-2 text-left text-sm transition-colors',
							active ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
						)}
						onclick={() => handleTrackClick(album.song, i)}
					>
						<span class="text-right text-xs tabular-nums">
							{#if active && isPlaying()}
								<SpeakerHighIcon class="ml-auto size-4 text-primary" weight="fill" />
							{:else}
								<span class={active ? 'text-primary' : 'text-muted-foreground'}>
									{song.track ?? '-'}
								</span>
							{/if}
						</span>
						<div class="min-w-0">
							<p class={cn('truncate', active ? 'text-primary' : 'text-foreground')}>
								{song.title}
							</p>
							{#if song.artist !== album.artist}
								<p class="truncate text-xs text-muted-foreground">{song.artist}</p>
							{/if}
						</div>
						<span class="text-xs text-muted-foreground tabular-nums">
							{formatDuration(song.duration)}
						</span>
					</button>
				{/each}
			</div>
		{/if}
	{:catch error}
		<p class="text-destructive">{error.message}</p>
	{/await}
</div>
