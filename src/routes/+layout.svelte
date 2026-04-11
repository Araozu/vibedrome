<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { ModeWatcher } from 'mode-watcher';
	import { QueryClientProvider, QueryClient } from '@tanstack/svelte-query';
	import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools';
	import Navbar from '$lib/components/Navbar.svelte';

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
		<main class="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
			{@render children()}
		</main>
	</div>
	<SvelteQueryDevtools />
</QueryClientProvider>
