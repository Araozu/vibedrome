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
		setExpanded,
		getVolume,
		isMuted,
		toggleMute,
		isShuffle,
		toggleShuffle,
		getRepeat,
		cycleRepeat
	} from '$lib/player-store.svelte';
	import PlayIcon from 'phosphor-svelte/lib/Play';
	import PauseIcon from 'phosphor-svelte/lib/Pause';
	import SkipForwardIcon from 'phosphor-svelte/lib/SkipForward';
	import SkipBackIcon from 'phosphor-svelte/lib/SkipBack';
	import MusicNoteIcon from 'phosphor-svelte/lib/MusicNote';
	import CoverImage from '$lib/components/CoverImage.svelte';
	import SpeakerHighIcon from 'phosphor-svelte/lib/SpeakerHigh';
	import SpeakerLowIcon from 'phosphor-svelte/lib/SpeakerLow';
	import SpeakerNoneIcon from 'phosphor-svelte/lib/SpeakerNone';
	import SpeakerSlashIcon from 'phosphor-svelte/lib/SpeakerSlash';
	import ShuffleIcon from 'phosphor-svelte/lib/Shuffle';
	import RepeatIcon from 'phosphor-svelte/lib/Repeat';
	import RepeatOnceIcon from 'phosphor-svelte/lib/RepeatOnce';

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

{#if getCurrentSong()}
	{@const song = getCurrentSong()!}
	{@const coverUrl = getCurrentCoverArtUrl(96)}

	<div
		class="fixed right-0 bottom-0 left-0 z-40 border-t border-border bg-background/95 backdrop-blur-lg"
	>
		<!-- Seek bar (thin line at top of mini player) -->
		<div
			data-seek-bar
			class="group relative h-1 w-full cursor-pointer bg-muted transition-[height] hover:h-2"
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
				class="pointer-events-none h-full bg-primary transition-[width]"
				style="width: {seeking ? seekValue : progress}%"
			></div>
		</div>

		<div class="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
			<!-- Cover art + song info (clickable to expand) -->
			<button class="flex min-w-0 flex-1 items-center gap-3" onclick={() => setExpanded(true)}>
				<div class="size-10 shrink-0 overflow-hidden rounded bg-muted">
					{#if coverUrl}
						<CoverImage src={coverUrl} alt={song.title} />
					{:else}
						<div class="flex h-full w-full items-center justify-center">
							<MusicNoteIcon class="size-5 text-muted-foreground" />
						</div>
					{/if}
				</div>
				<div class="min-w-0 text-left">
					<p class="truncate text-sm font-medium text-foreground">{song.title}</p>
					<p class="truncate text-xs text-muted-foreground">{song.artist}</p>
				</div>
			</button>

			<!-- Controls -->
			<div class="flex items-center gap-1">
				<!-- Shuffle (desktop only) -->
				<button
					class={cn(
						'hidden items-center justify-center rounded-full transition-colors sm:inline-flex sm:size-8',
						isShuffle()
							? 'text-primary hover:bg-accent'
							: 'text-muted-foreground hover:bg-accent hover:text-foreground'
					)}
					onclick={toggleShuffle}
					aria-label="Shuffle"
					aria-pressed={isShuffle()}
				>
					<ShuffleIcon class="size-4" weight={isShuffle() ? 'bold' : 'regular'} />
				</button>

				<button
					class={cn(
						'inline-flex size-9 items-center justify-center rounded-full transition-colors',
						getHasPrev() ? 'text-foreground hover:bg-accent' : 'text-muted-foreground/40'
					)}
					disabled={!getHasPrev() && getCurrentTime() <= 3}
					onclick={prev}
					aria-label="Previous"
				>
					<SkipBackIcon class="size-5" weight="fill" />
				</button>

				<button
					class="inline-flex size-10 items-center justify-center rounded-full bg-foreground text-background transition-colors hover:bg-foreground/90"
					onclick={togglePlay}
					aria-label={isPlaying() ? 'Pause' : 'Play'}
				>
					{#if isPlaying()}
						<PauseIcon class="size-5" weight="fill" />
					{:else}
						<PlayIcon class="size-5" weight="fill" />
					{/if}
				</button>

				<button
					class={cn(
						'inline-flex size-9 items-center justify-center rounded-full transition-colors',
						getHasNext() ? 'text-foreground hover:bg-accent' : 'text-muted-foreground/40'
					)}
					disabled={!getHasNext()}
					onclick={next}
					aria-label="Next"
				>
					<SkipForwardIcon class="size-5" weight="fill" />
				</button>

				<!-- Repeat (desktop only) -->
				<button
					class={cn(
						'hidden items-center justify-center rounded-full transition-colors sm:inline-flex sm:size-8',
						getRepeat() !== 'off'
							? 'text-primary hover:bg-accent'
							: 'text-muted-foreground hover:bg-accent hover:text-foreground'
					)}
					onclick={cycleRepeat}
					aria-label="Repeat: {getRepeat()}"
				>
					{#if getRepeat() === 'one'}
						<RepeatOnceIcon class="size-4" weight="bold" />
					{:else}
						<RepeatIcon class="size-4" weight={getRepeat() === 'all' ? 'bold' : 'regular'} />
					{/if}
				</button>
			</div>

			<!-- Volume + Time (desktop only) -->
			<div class="hidden items-center gap-2 sm:flex">
				<button
					class="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
					onclick={toggleMute}
					aria-label={isMuted() ? 'Unmute' : 'Mute'}
				>
					{#if isMuted() || getVolume() === 0}
						<SpeakerSlashIcon class="size-4" />
					{:else if getVolume() < 0.33}
						<SpeakerNoneIcon class="size-4" />
					{:else if getVolume() < 0.66}
						<SpeakerLowIcon class="size-4" />
					{:else}
						<SpeakerHighIcon class="size-4" />
					{/if}
				</button>
				<div class="w-20 text-right text-xs text-muted-foreground tabular-nums">
					{formatTime(getCurrentTime())} / {formatTime(getDuration())}
				</div>
			</div>
		</div>
	</div>
{/if}
