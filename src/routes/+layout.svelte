<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { ModeWatcher } from 'mode-watcher';
	import Navbar from '$lib/components/Navbar.svelte';

	let { children } = $props();
</script>

<ModeWatcher />
<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="flex min-h-svh flex-col bg-background text-foreground">
	<Navbar />
	<main class="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
		{@render children()}
	</main>
</div>
