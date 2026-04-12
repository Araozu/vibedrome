<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { ModeWatcher } from 'mode-watcher';
	import { QueryClientProvider, QueryClient } from '@tanstack/svelte-query';
	import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools';
	import Navbar from '$lib/components/Navbar.svelte';
	import MiniPlayer from '$lib/components/MiniPlayer.svelte';
	import ExpandedPlayer from '$lib/components/ExpandedPlayer.svelte';
	import { getCurrentSong } from '$lib/player-store.svelte';

	let { children } = $props();

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 60 * 1000,
				retry: 1
			}
		}
	});
</script>

<ModeWatcher />
<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<QueryClientProvider client={queryClient}>
	<div class="flex min-h-svh flex-col bg-background text-foreground">
		<Navbar />
		<main class="mx-auto w-full max-w-7xl flex-1 px-4 py-6" class:pb-24={!!getCurrentSong()}>
			{@render children()}
		</main>
	</div>
	<MiniPlayer />
	<ExpandedPlayer />
	<SvelteQueryDevtools />
</QueryClientProvider>
