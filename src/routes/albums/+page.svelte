<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { albumsQuery, albumSearchQuery } from '$lib/queries/albums';
	import { getActiveServer } from '$lib/server-store.svelte';
	import { getCoverArtUrl } from '$lib/subsonic';
	import CoverImage from '$lib/components/CoverImage.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import MusicNoteIcon from 'phosphor-svelte/lib/MusicNote';
	import CaretLeftIcon from 'phosphor-svelte/lib/CaretLeft';
	import CaretRightIcon from 'phosphor-svelte/lib/CaretRight';

	const PAGE_SIZE = 50;

	let searchInput = $state('');
	let debouncedSearch = $state('');
	let page = $state(0);

	$effect(() => {
		const q = searchInput;
		const timeout = setTimeout(() => {
			debouncedSearch = q;
			page = 0;
		}, 300);
		return () => clearTimeout(timeout);
	});

	const browseQuery = createQuery(() =>
		albumsQuery('alphabeticalByName', PAGE_SIZE, page * PAGE_SIZE)
	);
	const searchQuery = createQuery(() =>
		albumSearchQuery(debouncedSearch, PAGE_SIZE, page * PAGE_SIZE)
	);

	const query = $derived(debouncedSearch ? searchQuery : browseQuery);

	const hasNextPage = $derived((query.data?.length ?? 0) === PAGE_SIZE);
	const hasPrevPage = $derived(page > 0);
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between gap-4">
		<h1 class="text-2xl font-bold tracking-tight text-foreground">Albums</h1>
		{#if getActiveServer()}
			<div class="w-full max-w-xs">
				<Input type="search" placeholder="Search albums…" bind:value={searchInput} class="h-9" />
			</div>
		{/if}
	</div>

	{#if !getActiveServer()}
		<p class="text-muted-foreground">
			No server selected. Go to
			<a href="/settings" class="text-primary underline underline-offset-4">Settings</a>
			to add one.
		</p>
	{:else if query.isPending}
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
		<p class="text-muted-foreground">
			{debouncedSearch ? 'No albums match your search.' : 'No albums found.'}
		</p>
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

		{#if hasPrevPage || hasNextPage}
			<div class="flex items-center justify-center gap-3 pt-2">
				<Button variant="outline" size="sm" disabled={!hasPrevPage} onclick={() => (page -= 1)}>
					<CaretLeftIcon class="size-4" />
					Previous
				</Button>
				<span class="text-sm text-muted-foreground">Page {page + 1}</span>
				<Button variant="outline" size="sm" disabled={!hasNextPage} onclick={() => (page += 1)}>
					Next
					<CaretRightIcon class="size-4" />
				</Button>
			</div>
		{/if}
	{/if}
</div>
