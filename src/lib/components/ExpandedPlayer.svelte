<script lang="ts">
	import { cn } from '$lib/utils';
	import {
		getCurrentSong,
		isPlaying,
		togglePlay,
		next,
		prev,
		getCurrentTime,
		getDuration,
		seek,
		formatTime,
		getHasNext,
		getHasPrev,
		getCurrentCoverArtUrl,
		isExpanded,
		setExpanded,
		getQueue,
		getCurrentIndex,
		playAt
	} from '$lib/player-store.svelte';
	import PlayIcon from 'phosphor-svelte/lib/Play';
	import PauseIcon from 'phosphor-svelte/lib/Pause';
	import SkipForwardIcon from 'phosphor-svelte/lib/SkipForward';
	import SkipBackIcon from 'phosphor-svelte/lib/SkipBack';
	import MusicNoteIcon from 'phosphor-svelte/lib/MusicNote';
	import XIcon from 'phosphor-svelte/lib/X';
	import QueueIcon from 'phosphor-svelte/lib/Queue';

	let showQueue = $state(false);
	let seeking = $state(false);
	let seekValue = $state(0);

	const progress = $derived(getDuration() > 0 ? (getCurrentTime() / getDuration()) * 100 : 0);

	function handleSeekStart(e: MouseEvent | TouchEvent) {
		seeking = true;
		handleSeekMove(e);
	}

	function handleSeekMove(e: MouseEvent | TouchEvent) {
		if (!seeking) return;
		const target = (e.currentTarget ?? e.target) as HTMLElement;
		const bar = target.closest('[data-seek-bar]') as HTMLElement | null;
		if (!bar) return;
		const rect = bar.getBoundingClientRect();
		const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
		const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
		seekValue = pct * 100;
	}

	function handleSeekEnd() {
		if (!seeking) return;
		seeking = false;
		const dur = getDuration();
		if (dur > 0) {
			seek((seekValue / 100) * dur);
		}
	}
</script>

<svelte:window
	onmousemove={handleSeekMove}
	onmouseup={handleSeekEnd}
	ontouchmove={handleSeekMove}
	ontouchend={handleSeekEnd}
/>

{#if isExpanded() && getCurrentSong()}
	{@const song = getCurrentSong()!}
	{@const coverUrl = getCurrentCoverArtUrl(600)}
	{@const queue = getQueue()}
	{@const currentIdx = getCurrentIndex()}

	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-50 flex flex-col bg-background"
		role="dialog"
		aria-label="Now Playing"
		onkeydown={(e) => {
			if (e.key === 'Escape') setExpanded(false);
		}}
	>
		<!-- Top bar -->
		<div class="flex items-center justify-between px-4 py-3">
			<button
				class="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
				onclick={() => setExpanded(false)}
				aria-label="Close"
			>
				<XIcon class="size-5" />
			</button>

			<p class="text-xs font-medium tracking-wider text-muted-foreground uppercase">Now Playing</p>

			<button
				class={cn(
					'inline-flex size-9 items-center justify-center rounded-full transition-colors',
					showQueue
						? 'bg-accent text-accent-foreground'
						: 'text-muted-foreground hover:bg-accent hover:text-foreground'
				)}
				onclick={() => (showQueue = !showQueue)}
				aria-label="Toggle queue"
			>
				<QueueIcon class="size-5" />
			</button>
		</div>

		{#if showQueue}
			<!-- Queue view -->
			<div class="flex-1 overflow-y-auto px-4 pb-4">
				<h2 class="mb-3 text-lg font-semibold text-foreground">Queue</h2>
				<div class="space-y-0.5">
					{#each queue as queueSong, i (queueSong.id + '-' + i)}
						<button
							class={cn(
								'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors',
								i === currentIdx
									? 'bg-accent text-accent-foreground'
									: 'text-foreground hover:bg-accent/50'
							)}
							onclick={() => playAt(i)}
						>
							<span class="w-6 text-right text-xs text-muted-foreground tabular-nums">
								{i + 1}
							</span>
							<div class="min-w-0 flex-1">
								<p class="truncate">{queueSong.title}</p>
								<p class="truncate text-xs text-muted-foreground">{queueSong.artist}</p>
							</div>
							<span class="text-xs text-muted-foreground tabular-nums">
								{formatTime(queueSong.duration)}
							</span>
						</button>
					{/each}
				</div>
			</div>
		{:else}
			<!-- Album art + info -->
			<div class="flex flex-1 flex-col items-center justify-center gap-6 px-6">
				<div class="w-full max-w-xs overflow-hidden rounded-xl bg-muted shadow-lg sm:max-w-sm">
					<div class="aspect-square">
						{#if coverUrl}
							<img src={coverUrl} alt={song.title} class="h-full w-full object-cover" />
						{:else}
							<div class="flex h-full w-full items-center justify-center">
								<MusicNoteIcon class="size-24 text-muted-foreground" />
							</div>
						{/if}
					</div>
				</div>

				<div class="w-full max-w-xs text-center sm:max-w-sm">
					<h2 class="truncate text-xl font-bold text-foreground">{song.title}</h2>
					<p class="truncate text-sm text-muted-foreground">{song.artist}</p>
					{#if song.album}
						<p class="truncate text-xs text-muted-foreground">{song.album}</p>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Seek bar + controls at bottom -->
		<div class="px-6 pb-8">
			<!-- Seek bar -->
			<div class="mx-auto w-full max-w-xs sm:max-w-sm">
				<div
					data-seek-bar
					class="group relative h-2 w-full cursor-pointer rounded-full bg-muted"
					onmousedown={handleSeekStart}
					ontouchstart={handleSeekStart}
					role="slider"
					aria-label="Seek"
					aria-valuenow={Math.round(getCurrentTime())}
					aria-valuemin={0}
					aria-valuemax={Math.round(getDuration())}
					tabindex={0}
					onkeydown={(e) => {
						if (e.key === 'ArrowRight') seek(getCurrentTime() + 5);
						if (e.key === 'ArrowLeft') seek(getCurrentTime() - 5);
					}}
				>
					<div
						class="pointer-events-none h-full rounded-full bg-primary"
						style="width: {seeking ? seekValue : progress}%"
					></div>
				</div>
				<div class="mt-1 flex justify-between text-xs text-muted-foreground tabular-nums">
					<span>{formatTime(getCurrentTime())}</span>
					<span>{formatTime(getDuration())}</span>
				</div>
			</div>

			<!-- Controls -->
			<div class="mt-4 flex items-center justify-center gap-4">
				<button
					class={cn(
						'inline-flex size-11 items-center justify-center rounded-full transition-colors',
						getHasPrev() || getCurrentTime() > 3
							? 'text-foreground hover:bg-accent'
							: 'text-muted-foreground/40'
					)}
					disabled={!getHasPrev() && getCurrentTime() <= 3}
					onclick={prev}
					aria-label="Previous"
				>
					<SkipBackIcon class="size-7" weight="fill" />
				</button>

				<button
					class="inline-flex size-14 items-center justify-center rounded-full bg-foreground text-background transition-colors hover:bg-foreground/90"
					onclick={togglePlay}
					aria-label={isPlaying() ? 'Pause' : 'Play'}
				>
					{#if isPlaying()}
						<PauseIcon class="size-7" weight="fill" />
					{:else}
						<PlayIcon class="size-7" weight="fill" />
					{/if}
				</button>

				<button
					class={cn(
						'inline-flex size-11 items-center justify-center rounded-full transition-colors',
						getHasNext() ? 'text-foreground hover:bg-accent' : 'text-muted-foreground/40'
					)}
					disabled={!getHasNext()}
					onclick={next}
					aria-label="Next"
				>
					<SkipForwardIcon class="size-7" weight="fill" />
				</button>
			</div>
		</div>
	</div>
{/if}
