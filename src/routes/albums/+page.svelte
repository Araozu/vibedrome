<script lang="ts">
	import type { PageProps } from './$types';
	import { createQuery } from '@tanstack/svelte-query';
	import { albumsQuery } from '$lib/queries/albums';
	import { getActiveServer } from '$lib/server-store.svelte';
	import { getCoverArtUrl } from '$lib/subsonic';
	import CoverImage from '$lib/components/CoverImage.svelte';
	import MusicNoteIcon from 'phosphor-svelte/lib/MusicNote';

	let { data }: PageProps = $props();

	function formatDuration(seconds: number): string {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${m}:${s.toString().padStart(2, '0')}`;
	}
</script>

<div class="space-y-6">
	<h1 class="text-2xl font-bold tracking-tight text-foreground">Albums</h1>

	{#if !getActiveServer()}
		<p class="text-muted-foreground">
			No server selected. Go to
			<a href="/settings" class="text-primary underline underline-offset-4">Settings</a>
			to add one.
		</p>
	{:else}
		{#await data.albumsPromise}
			<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
				{#each { length: 10 } as _}
					<div class="space-y-2">
						<div class="aspect-square animate-pulse rounded-lg bg-muted"></div>
						<div class="h-4 w-3/4 animate-pulse rounded bg-muted"></div>
						<div class="h-3 w-1/2 animate-pulse rounded bg-muted"></div>
					</div>
				{/each}
			</div>
		{:then preloaded}
			{@const query = createQuery(() => ({
				...albumsQuery(),
				placeholderData: preloaded ?? undefined
			}))}

			{#if query.isPending}
				<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
					{#each { length: 10 } as _}
						<div class="space-y-2">
							<div class="aspect-square animate-pulse rounded-lg bg-muted"></div>
							<div class="h-4 w-3/4 animate-pulse rounded bg-muted"></div>
							<div class="h-3 w-1/2 animate-pulse rounded bg-muted"></div>
						</div>
					{/each}
				</div>
			{:else if query.isError}
				<p class="text-destructive">{query.error.message}</p>
			{:else if query.data.length === 0}
				<p class="text-muted-foreground">No albums found.</p>
			{:else}
				<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
					{#each query.data as album (album.id)}
						<a href="/albums/{album.id}" class="group space-y-2">
							<div class="relative aspect-square overflow-hidden rounded-lg bg-muted">
								{#if album.coverArt && getActiveServer()}
									<CoverImage
										src={getCoverArtUrl(getActiveServer()!, album.coverArt)}
										alt={album.name}
										class=""
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
									{album.artist}
									{#if album.year}&middot; {album.year}{/if}
								</p>
							</div>
						</a>
					{/each}
				</div>
			{/if}
		{:catch error}
			<p class="text-destructive">{error.message}</p>
		{/await}
	{/if}
</div>
