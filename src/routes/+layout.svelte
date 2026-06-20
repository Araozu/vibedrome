<script lang="ts">
	import './layout.css';
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';
	import { ModeWatcher } from 'mode-watcher';
	import { QueryClientProvider, QueryClient } from '@tanstack/svelte-query';
	import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools';
	import Navbar from '$lib/components/Navbar.svelte';
	import MiniPlayer from '$lib/components/MiniPlayer.svelte';
	import ExpandedPlayer from '$lib/components/ExpandedPlayer.svelte';
	import { setExpanded } from '$lib/player-store.svelte';

	let { children } = $props();

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 60 * 1000,
				retry: 1
			}
		}
	});

	let currentPath = $state(page.url.pathname);

	$effect(() => {
		const nextPath = page.url.pathname;

		if (nextPath !== currentPath) {
			currentPath = nextPath;
			setExpanded(false);
		}
	});
</script>

<ModeWatcher />
<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Vibedrome</title>
</svelte:head>

<QueryClientProvider client={queryClient}>
	<div class="flex h-svh flex-col bg-background text-foreground sm:flex-row">
		<Navbar />
		<div class="flex min-h-0 min-w-0 flex-1 flex-col">
			<main class="flex-1 overflow-y-auto px-6 py-6">
				{@render children()}
			</main>
			<MiniPlayer />
		</div>
	</div>
	<ExpandedPlayer />
	<SvelteQueryDevtools />
</QueryClientProvider>
