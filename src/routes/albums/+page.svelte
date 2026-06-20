<script lang="ts">
	import type { PageProps } from './$types';
	import { createQuery } from '@tanstack/svelte-query';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { untrack } from 'svelte';
	import { albumsQuery, albumSearchQuery } from '$lib/queries/albums';
	import { getActiveServer } from '$lib/server-store.svelte';
	import { getCoverArtUrl, type AlbumListType } from '$lib/subsonic';
	import CoverImage from '$lib/components/CoverImage.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import * as Select from '$lib/components/ui/select';
	import { cn } from '$lib/utils';
	import MusicNoteIcon from 'phosphor-svelte/lib/MusicNote';
	import MagnifyingGlassIcon from 'phosphor-svelte/lib/MagnifyingGlass';
	import XIcon from 'phosphor-svelte/lib/X';
	import CaretLeftIcon from 'phosphor-svelte/lib/CaretLeft';
	import CaretRightIcon from 'phosphor-svelte/lib/CaretRight';
	import ArrowClockwiseIcon from 'phosphor-svelte/lib/ArrowClockwise';

	let { data }: PageProps = $props();

	const PAGE_SIZE = 50;
	const DEFAULT_SORT: AlbumListType = 'alphabeticalByName';

	type SortOption = {
		value: AlbumListType;
		label: string;
		description: string;
	};

	const SORT_OPTIONS: SortOption[] = [
		{ value: 'alphabeticalByName', label: 'A-Z', description: 'Album title' },
		{ value: 'alphabeticalByArtist', label: 'Artist', description: 'Artist name' },
		{ value: 'newest', label: 'Newest', description: 'Recently added' },
		{ value: 'recent', label: 'Recent', description: 'Recently played' },
		{ value: 'frequent', label: 'Frequent', description: 'Most played' },
		{ value: 'random', label: 'Random', description: 'Surprise me' },
		{ value: 'starred', label: 'Starred', description: 'Favorites' }
	];

	function parsePage(value: string | null): number {
		const parsed = Number(value ?? '0');
		return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
	}

	function parseSort(value: string | null): AlbumListType {
		switch (value) {
			case 'alphabeticalByArtist':
			case 'newest':
			case 'recent':
			case 'frequent':
			case 'random':
			case 'starred':
				return value;
			default:
				return DEFAULT_SORT;
		}
	}

	function getSortLabel(value: AlbumListType): string {
		return SORT_OPTIONS.find((option) => option.value === value)?.label ?? 'A-Z';
	}

	const urlSearch = $derived(page.url.searchParams.get('q')?.trim() ?? '');
	const currentPage = $derived(parsePage(page.url.searchParams.get('page')));
	const currentSort = $derived(parseSort(page.url.searchParams.get('sort')));
	const selectedSortLabel = $derived(getSortLabel(currentSort));

	let searchInput = $state(page.url.searchParams.get('q') ?? '');

	function albumsRoute(q: string, p: number, sort: AlbumListType): '/albums' | `/albums?${string}` {
		const query = q.trim();
		const parts: string[] = [];

		if (query) parts.push(`q=${encodeURIComponent(query)}`);
		if (sort !== DEFAULT_SORT) parts.push(`sort=${encodeURIComponent(sort)}`);
		if (p > 0) parts.push(`page=${p}`);

		const qs = parts.join('&');
		return qs ? `/albums?${qs}` : '/albums';
	}

	function updateUrl(q: string, p: number, sort: AlbumListType = currentSort, replace = false) {
		goto(resolve(albumsRoute(q, p, sort)), {
			replaceState: replace,
			keepFocus: true,
			noScroll: true
		});
	}

	function handleSortChange(value: string) {
		updateUrl(urlSearch, 0, parseSort(value));
	}

	function clearSearch() {
		searchInput = '';
		updateUrl('', 0, currentSort, true);
	}

	function pageHref(pageNumber: number): string {
		return resolve(albumsRoute(urlSearch, pageNumber, currentSort));
	}

	function paginationPages(hasNextPage: boolean): number[] {
		const pages: number[] = [];
		const end = hasNextPage ? currentPage + 1 : currentPage;
		const addPage = (pageNumber: number) => {
			if (!pages.includes(pageNumber)) pages.push(pageNumber);
		};

		addPage(0);
		for (let index = Math.max(0, currentPage - 2); index <= end; index++) {
			addPage(index);
		}

		return pages.sort((a, b) => a - b);
	}

	let initialized = false;
	$effect(() => {
		const q = searchInput;

		if (!initialized) {
			initialized = true;
			return;
		}

		if (q.trim() === untrack(() => urlSearch)) return;

		const timeout = setTimeout(() => {
			updateUrl(q, 0, currentSort, true);
		}, 300);

		return () => clearTimeout(timeout);
	});

	$effect(() => {
		const q = urlSearch;
		untrack(() => {
			searchInput = q;
		});
	});

	const browseQuery = createQuery(() =>
		albumsQuery(currentSort, PAGE_SIZE, currentPage * PAGE_SIZE)
	);
	const searchQuery = createQuery(() =>
		albumSearchQuery(urlSearch, PAGE_SIZE, currentPage * PAGE_SIZE)
	);

	const query = $derived(urlSearch ? searchQuery : browseQuery);
	const hasNextPage = $derived((query.data?.length ?? 0) === PAGE_SIZE);
	const hasPrevPage = $derived(currentPage > 0);
	const visiblePages = $derived(paginationPages(hasNextPage));
	const resultStart = $derived(currentPage * PAGE_SIZE + 1);
	const resultEnd = $derived(currentPage * PAGE_SIZE + (query.data?.length ?? 0));
	const statusText = $derived(
		urlSearch
			? `Search results for “${urlSearch}”`
			: `${selectedSortLabel} albums from ${getActiveServer()?.name ?? 'your library'}`
	);
</script>

<div class="space-y-8">
	<section
		class="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm sm:p-6"
	>
		<div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
			<div class="space-y-2">
				<p class="text-xs font-medium tracking-wider text-muted-foreground uppercase">Library</p>
				<div class="space-y-1">
					<h1 class="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Albums</h1>
					<p class="max-w-2xl text-sm text-muted-foreground">
						Browse, search, and jump through your collection without losing your place.
					</p>
				</div>
			</div>

			{#if getActiveServer()}
				<div class="flex flex-col gap-3 sm:flex-row lg:min-w-[32rem]">
					<div class="relative min-w-0 flex-1">
						<MagnifyingGlassIcon
							class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
						/>
						<Input
							type="search"
							placeholder="Search albums, artists…"
							bind:value={searchInput}
							class="h-11 pr-10 pl-9"
						/>
						{#if searchInput}
							<button
								type="button"
								class="absolute top-1/2 right-2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
								onclick={clearSearch}
								aria-label="Clear search"
							>
								<XIcon class="size-4" />
							</button>
						{/if}
					</div>

					<Select.Root type="single" value={currentSort} onValueChange={handleSortChange}>
						<Select.Trigger class="h-11 min-w-42 justify-between">
							Sort: {selectedSortLabel}
						</Select.Trigger>
						<Select.Content>
							{#each SORT_OPTIONS as option (option.value)}
								<Select.Item value={option.value} label={option.label}>
									<div class="flex flex-col">
										<span>{option.label}</span>
										<span class="text-xs text-muted-foreground">{option.description}</span>
									</div>
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
			{/if}
		</div>

		{#if getActiveServer()}
			<div class="mt-5 hidden flex-wrap gap-2 md:flex">
				{#each SORT_OPTIONS as option (option.value)}
					<button
						type="button"
						class={cn(
							'rounded-full border px-3 py-1.5 text-sm transition-colors',
							currentSort === option.value
								? 'border-primary bg-primary text-primary-foreground'
								: 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'
						)}
						onclick={() => updateUrl(urlSearch, 0, option.value)}
						aria-pressed={currentSort === option.value}
					>
						{option.label}
					</button>
				{/each}
			</div>
		{/if}
	</section>

	{#if !getActiveServer()}
		<section
			class="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-8 text-center"
		>
			<div class="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
				<MusicNoteIcon class="size-8 text-muted-foreground" />
			</div>
			<h2 class="text-xl font-semibold text-foreground">Connect a music server</h2>
			<p class="mt-2 max-w-md text-sm text-muted-foreground">
				Albums will appear here once Vibedrome knows which Subsonic server to browse.
			</p>
			<Button class="mt-5" href={resolve('/settings')}>Open Settings</Button>
		</section>
	{:else}
		{#await data.albumsPromise}
			<div
				class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
			>
				{#each Array.from({ length: 12 }, (_, index) => index) as index (index)}
					<div class="space-y-3 rounded-xl border border-border bg-card p-2">
						<div class="aspect-square animate-pulse rounded-lg bg-muted"></div>
						<div class="space-y-2 px-1 pb-1">
							<div class="h-4 w-4/5 animate-pulse rounded bg-muted"></div>
							<div class="h-3 w-3/5 animate-pulse rounded bg-muted"></div>
						</div>
					</div>
				{/each}
			</div>
		{:then preloaded}
			{@const activeQuery = createQuery(() => ({
				...(urlSearch
					? albumSearchQuery(urlSearch, PAGE_SIZE, currentPage * PAGE_SIZE)
					: albumsQuery(currentSort, PAGE_SIZE, currentPage * PAGE_SIZE)),
				placeholderData: preloaded ?? undefined
			}))}
			{@const displayQuery = activeQuery.data ? activeQuery : query}

			{#if displayQuery.isPending}
				<div
					class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
				>
					{#each Array.from({ length: 12 }, (_, index) => index) as index (index)}
						<div class="space-y-3 rounded-xl border border-border bg-card p-2">
							<div class="aspect-square animate-pulse rounded-lg bg-muted"></div>
							<div class="space-y-2 px-1 pb-1">
								<div class="h-4 w-4/5 animate-pulse rounded bg-muted"></div>
								<div class="h-3 w-3/5 animate-pulse rounded bg-muted"></div>
							</div>
						</div>
					{/each}
				</div>
			{:else if displayQuery.isError}
				<section
					class="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-border bg-card p-8 text-center"
				>
					<h2 class="text-lg font-semibold text-foreground">Albums could not load</h2>
					<p class="mt-2 max-w-md text-sm text-destructive">{displayQuery.error.message}</p>
					<Button class="mt-5" variant="outline" onclick={() => displayQuery.refetch()}>
						<ArrowClockwiseIcon class="size-4" />
						Try again
					</Button>
				</section>
			{:else if displayQuery.data.length === 0}
				<section
					class="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-8 text-center"
				>
					<div class="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
						<MusicNoteIcon class="size-8 text-muted-foreground" />
					</div>
					<h2 class="text-lg font-semibold text-foreground">
						{urlSearch ? 'No albums matched that search' : 'No albums found'}
					</h2>
					<p class="mt-2 max-w-md text-sm text-muted-foreground">
						{urlSearch
							? 'Try a shorter search, a different artist name, or clear the search to browse everything.'
							: 'This view is empty. Try another sort mode or check the selected server.'}
					</p>
					{#if urlSearch}
						<Button class="mt-5" variant="outline" onclick={clearSearch}>Clear search</Button>
					{/if}
				</section>
			{:else}
				<div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<h2 class="text-lg font-semibold text-foreground">{statusText}</h2>
						<p class="text-sm text-muted-foreground">
							Showing {resultStart}-{resultEnd}{hasNextPage ? '+' : ''} · Page {currentPage + 1}
						</p>
					</div>

					{#if displayQuery.isFetching}
						<p class="text-sm text-muted-foreground">Refreshing…</p>
					{/if}
				</div>

				<div
					class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
				>
					{#each displayQuery.data as album (album.id)}
						{@const server = getActiveServer()}
						<a
							href={resolve('/albums/[id]', { id: album.id })}
							data-sveltekit-preload-data="hover"
							class="group rounded-xl border border-transparent p-2 outline-hidden transition-all hover:-translate-y-0.5 hover:border-border hover:bg-card hover:shadow-sm focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
						>
							<div class="relative aspect-square overflow-hidden rounded-lg bg-muted shadow-sm">
								{#if album.coverArt && server}
									<CoverImage
										src={getCoverArtUrl(server, album.coverArt)}
										alt={album.name}
										class="transition-transform duration-300 group-hover:scale-105"
									/>
								{:else}
									<div class="flex h-full w-full items-center justify-center">
										<MusicNoteIcon class="size-12 text-muted-foreground" />
									</div>
								{/if}
								<div
									class="pointer-events-none absolute inset-0 opacity-0 ring-1 ring-foreground/10 transition-opacity group-hover:opacity-100"
								></div>
							</div>

							<div class="min-w-0 px-1 pt-3">
								<p class="truncate text-sm font-semibold text-foreground group-hover:underline">
									{album.name}
								</p>
								<p class="truncate text-xs text-muted-foreground">{album.artist}</p>
								<p class="mt-1 truncate text-xs text-muted-foreground">
									{album.songCount}
									{album.songCount === 1 ? 'song' : 'songs'}
									{#if album.year}
										· {album.year}{/if}
								</p>
							</div>
						</a>
					{/each}
				</div>

				<div class="flex flex-col items-center gap-3 pt-2">
					<div class="flex flex-wrap items-center justify-center gap-2">
						<Button
							variant="outline"
							size="sm"
							disabled={!hasPrevPage}
							onclick={() => updateUrl(urlSearch, currentPage - 1)}
						>
							<CaretLeftIcon class="size-4" />
							Previous
						</Button>

						{#if visiblePages.length > 1 && visiblePages[1] > 1}
							<span class="px-1 text-sm text-muted-foreground">…</span>
						{/if}

						{#each visiblePages as pageNumber (pageNumber)}
							<Button
								variant={pageNumber === currentPage ? 'default' : 'outline'}
								size="sm"
								href={pageHref(pageNumber)}
								aria-label="Go to page {pageNumber + 1}"
							>
								{pageNumber + 1}
							</Button>
						{/each}

						<Button
							variant="outline"
							size="sm"
							disabled={!hasNextPage}
							onclick={() => updateUrl(urlSearch, currentPage + 1)}
						>
							Next
							<CaretRightIcon class="size-4" />
						</Button>
					</div>
					<p class="text-xs text-muted-foreground">
						More page numbers appear as Vibedrome discovers more albums.
					</p>
				</div>
			{/if}
		{:catch error}
			<section
				class="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-border bg-card p-8 text-center"
			>
				<h2 class="text-lg font-semibold text-foreground">Albums could not load</h2>
				<p class="mt-2 max-w-md text-sm text-destructive">{error.message}</p>
			</section>
		{/await}
	{/if}
</div>
