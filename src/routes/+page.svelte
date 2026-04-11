<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { albumsQuery } from '$lib/queries/albums';
	import { getActiveServer } from '$lib/server-store.svelte';
	import { getCoverArtUrl } from '$lib/subsonic';
	import MusicNoteIcon from 'phosphor-svelte/lib/MusicNote';

	const recentQuery = createQuery(() => albumsQuery('newest', 10));
	const randomQuery = createQuery(() => albumsQuery('random', 10));
</script>

<div class="space-y-8">
	<div>
		<h1 class="text-2xl font-bold tracking-tight text-foreground">Home</h1>
		{#if getActiveServer()}
			<p class="mt-1 text-sm text-muted-foreground">
				Connected to <span class="font-medium text-foreground">{getActiveServer()?.name}</span>
			</p>
		{:else}
			<p class="mt-1 text-muted-foreground">
				No server selected. Go to <a
					href="/settings"
					class="text-primary underline underline-offset-4">Settings</a
				> to add one.
			</p>
		{/if}
	</div>

	{#if getActiveServer()}
		<!-- Recently Added -->
		<section class="space-y-4">
			<div class="flex items-center justify-between">
				<h2 class="text-lg font-semibold text-foreground">Recently Added</h2>
				<a
					href="/albums"
					class="text-sm text-muted-foreground transition-colors hover:text-foreground"
				>
					View all
				</a>
			</div>

			{#if recentQuery.isPending}
				<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
					{#each { length: 5 } as _}
						<div class="space-y-2">
							<div class="aspect-square animate-pulse rounded-lg bg-muted"></div>
							<div class="h-4 w-3/4 animate-pulse rounded bg-muted"></div>
							<div class="h-3 w-1/2 animate-pulse rounded bg-muted"></div>
						</div>
					{/each}
				</div>
			{:else if recentQuery.isError}
				<p class="text-sm text-destructive">{recentQuery.error.message}</p>
			{:else if recentQuery.data.length === 0}
				<p class="text-sm text-muted-foreground">No albums found.</p>
			{:else}
				<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
					{#each recentQuery.data as album (album.id)}
						{@const server = getActiveServer()}
						<a href="/albums/{album.id}" class="group space-y-2">
							<div class="relative aspect-square overflow-hidden rounded-lg bg-muted">
								{#if album.coverArt && server}
									<img
										src={getCoverArtUrl(server, album.coverArt, 300)}
										alt={album.name}
										class="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
										loading="lazy"
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
		</section>

		<!-- Random Albums -->
		<section class="space-y-4">
			<h2 class="text-lg font-semibold text-foreground">Random Picks</h2>

			{#if randomQuery.isPending}
				<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
					{#each { length: 5 } as _}
						<div class="space-y-2">
							<div class="aspect-square animate-pulse rounded-lg bg-muted"></div>
							<div class="h-4 w-3/4 animate-pulse rounded bg-muted"></div>
							<div class="h-3 w-1/2 animate-pulse rounded bg-muted"></div>
						</div>
					{/each}
				</div>
			{:else if randomQuery.isError}
				<p class="text-sm text-destructive">{randomQuery.error.message}</p>
			{:else if randomQuery.data.length === 0}
				<p class="text-sm text-muted-foreground">No albums found.</p>
			{:else}
				<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
					{#each randomQuery.data as album (album.id)}
						{@const server = getActiveServer()}
						<a href="/albums/{album.id}" class="group space-y-2">
							<div class="relative aspect-square overflow-hidden rounded-lg bg-muted">
								{#if album.coverArt && server}
									<img
										src={getCoverArtUrl(server, album.coverArt, 300)}
										alt={album.name}
										class="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
										loading="lazy"
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
		</section>
	{/if}
</div>
