<script lang="ts">
	import type { PageProps } from './$types';
	import { createQuery } from '@tanstack/svelte-query';
	import { artistsQuery } from '$lib/queries/artists';
	import { getActiveServer } from '$lib/server-store.svelte';
	import { getCoverArtUrl } from '$lib/subsonic';
	import CoverImage from '$lib/components/CoverImage.svelte';
	import UserIcon from 'phosphor-svelte/lib/User';

	let { data }: PageProps = $props();
</script>

<div class="space-y-6">
	<h1 class="text-2xl font-bold tracking-tight text-foreground">Artists</h1>

	{#if !getActiveServer()}
		<p class="text-muted-foreground">
			No server selected. Go to
			<a href="/settings" class="text-primary underline underline-offset-4">Settings</a>
			to add one.
		</p>
	{:else}
		{#await data.artistsPromise}
			<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
				{#each { length: 10 } as _}
					<div class="flex flex-col items-center space-y-2">
						<div class="aspect-square w-full animate-pulse rounded-full bg-muted"></div>
						<div class="h-4 w-3/4 animate-pulse rounded bg-muted"></div>
						<div class="h-3 w-1/2 animate-pulse rounded bg-muted"></div>
					</div>
				{/each}
			</div>
		{:then preloaded}
			{@const query = createQuery(() => ({
				...artistsQuery(),
				placeholderData: preloaded ?? undefined
			}))}

			{#if query.isPending}
				<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
					{#each { length: 10 } as _}
						<div class="flex flex-col items-center space-y-2">
							<div class="aspect-square w-full animate-pulse rounded-full bg-muted"></div>
							<div class="h-4 w-3/4 animate-pulse rounded bg-muted"></div>
							<div class="h-3 w-1/2 animate-pulse rounded bg-muted"></div>
						</div>
					{/each}
				</div>
			{:else if query.isError}
				<p class="text-destructive">{query.error.message}</p>
			{:else if query.data.length === 0}
				<p class="text-muted-foreground">No artists found.</p>
			{:else}
				<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
					{#each query.data as artist (artist.id)}
						{@const server = getActiveServer()}
						<a href="/artists/{artist.id}" class="group flex flex-col items-center space-y-2">
							<div class="relative aspect-square w-full overflow-hidden rounded-full bg-muted">
								{#if artist.coverArt && server}
									<CoverImage
										src={getCoverArtUrl(server, artist.coverArt)}
										alt={artist.name}
										class="transition-transform duration-200 group-hover:scale-105"
									/>
								{:else}
									<div class="flex h-full w-full items-center justify-center">
										<UserIcon class="size-12 text-muted-foreground" />
									</div>
								{/if}
							</div>
							<div class="min-w-0 text-center">
								<p class="truncate text-sm font-medium text-foreground group-hover:underline">
									{artist.name}
								</p>
								<p class="text-xs text-muted-foreground">
									{artist.albumCount}
									{artist.albumCount === 1 ? 'album' : 'albums'}
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
