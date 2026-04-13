<script lang="ts">
	import { cn } from '$lib/utils';
	import { createQuery } from '@tanstack/svelte-query';
	import { lyricsQuery } from '$lib/queries/lyrics';
	import { getCurrentTime, seek } from '$lib/player-store.svelte';
	import {
		getLyricsPrefs,
		fontSizeMap,
		alignMap,
		spacingMap
	} from '$lib/lyrics-prefs-store.svelte';
	import MicrophoneStageIcon from 'phosphor-svelte/lib/MicrophoneStage';
	import LyricsSettings from '$lib/components/LyricsSettings.svelte';

	let { songId }: { songId: string } = $props();

	const query = createQuery(() => lyricsQuery(songId));

	const prefs = $derived(getLyricsPrefs());

	// When a custom pt is set, suppress Tailwind size classes and use inline style instead
	const inactiveFontClass = $derived(
		prefs.customFontSizePt === null ? fontSizeMap[prefs.fontSize].inactive : ''
	);
	const activeFontClass = $derived(
		prefs.customFontSizePt === null ? fontSizeMap[prefs.fontSize].active : 'font-semibold'
	);

	// Pick the best lyrics entry: prefer synced, fall back to first available
	const activeLyrics = $derived.by(() => {
		const data = query.data;
		if (!data || data.length === 0) return null;
		return data.find((l) => l.synced) ?? data[0] ?? null;
	});

	// For synced lyrics: find the index of the current line
	const currentLineIdx = $derived.by(() => {
		if (!activeLyrics?.synced) return -1;
		const timeMs = getCurrentTime() * 1000;
		const offset = activeLyrics.offset ?? 0;
		const lines = activeLyrics.line;
		let idx = -1;
		for (let i = 0; i < lines.length; i++) {
			const start = (lines[i].start ?? 0) + offset;
			if (start <= timeMs) {
				idx = i;
			} else {
				break;
			}
		}
		return idx;
	});

	// Auto-scroll the active line into view
	let scrollContainer: HTMLDivElement | undefined = $state();

	$effect(() => {
		if (currentLineIdx < 0 || !scrollContainer) return;
		const lineEl = scrollContainer.querySelector(`[data-line-index="${currentLineIdx}"]`);
		if (lineEl) {
			const containerHeight = scrollContainer.clientHeight;
			const lineTop = (lineEl as HTMLElement).offsetTop;
			const lineHeight = (lineEl as HTMLElement).offsetHeight;
			const targetScrollTop = lineTop - containerHeight * 0.4 + lineHeight / 2;
			scrollContainer.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
		}
	});
</script>

<div class="flex w-1/2 flex-col border-l border-border">
	<div class="flex items-center justify-between px-4 pt-4 pb-2">
		<h2 class="text-sm font-semibold tracking-wider text-muted-foreground uppercase">Lyrics</h2>
		<LyricsSettings />
	</div>

	{#if query.isPending}
		<div class="flex flex-1 items-center justify-center">
			<p class="text-sm text-muted-foreground">Loading lyrics...</p>
		</div>
	{:else if query.isError}
		<div class="flex flex-1 items-center justify-center">
			<p class="text-sm text-destructive">Failed to load lyrics</p>
		</div>
	{:else if !activeLyrics || activeLyrics.line.length === 0}
		<div class="flex flex-1 flex-col items-center justify-center gap-2">
			<MicrophoneStageIcon class="size-10 text-muted-foreground/50" />
			<p class="text-sm text-muted-foreground">No lyrics available</p>
		</div>
	{:else}
		<div bind:this={scrollContainer} class="flex-1 overflow-y-auto px-4 pb-4">
			<div class={cn('py-4', spacingMap[prefs.spacing], alignMap[prefs.textAlign])}>
				{#each activeLyrics.line as line, i (i)}
					{#if line.value.trim() === ''}
						<div class="h-4"></div>
					{:else}
						<button
							type="button"
							data-line-index={i}
							style={prefs.customFontSizePt !== null
								? `font-size: ${activeLyrics.synced && i === currentLineIdx ? prefs.customFontSizePt + 4 : prefs.customFontSizePt}pt`
								: undefined}
							class={cn(
								'w-full rounded-md bg-transparent px-2 py-1 leading-relaxed transition-all duration-300',
								activeLyrics.synced ? 'cursor-pointer hover:bg-accent/50' : 'cursor-default',
								inactiveFontClass,
								activeLyrics.synced
									? i === currentLineIdx
										? cn(activeFontClass, 'text-foreground')
										: i < currentLineIdx
											? 'text-muted-foreground/50'
											: 'text-muted-foreground'
									: 'text-foreground'
							)}
							onclick={activeLyrics.synced
								? () => seek(((line.start ?? 0) + (activeLyrics.offset ?? 0)) / 1000)
								: undefined}
						>
							{line.value}
						</button>
					{/if}
				{/each}
			</div>
		</div>
	{/if}
</div>
