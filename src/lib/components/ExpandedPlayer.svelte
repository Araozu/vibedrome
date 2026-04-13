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
		playAt,
		removeFromQueue,
		getVolume,
		setVolume,
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
	import XIcon from 'phosphor-svelte/lib/X';
	import QueueIcon from 'phosphor-svelte/lib/Queue';
	import ShuffleIcon from 'phosphor-svelte/lib/Shuffle';
	import RepeatIcon from 'phosphor-svelte/lib/Repeat';
	import RepeatOnceIcon from 'phosphor-svelte/lib/RepeatOnce';
	import SpeakerHighIcon from 'phosphor-svelte/lib/SpeakerHigh';
	import SpeakerLowIcon from 'phosphor-svelte/lib/SpeakerLow';
	import SpeakerNoneIcon from 'phosphor-svelte/lib/SpeakerNone';
	import SpeakerSlashIcon from 'phosphor-svelte/lib/SpeakerSlash';
	import MicrophoneStageIcon from 'phosphor-svelte/lib/MicrophoneStage';
	import LyricsPanel from '$lib/components/LyricsPanel.svelte';

	type Panel = 'queue' | 'lyrics' | null;
	let activePanel = $state<Panel>(null);
	const showQueue = $derived(activePanel === 'queue');
	const showLyrics = $derived(activePanel === 'lyrics');
	const showPanel = $derived(activePanel !== null);

	function togglePanel(panel: 'queue' | 'lyrics') {
		activePanel = activePanel === panel ? null : panel;
	}
	let seeking = $state(false);
	let seekValue = $state(0);
	let volumeSeeking = $state(false);
	let volumeSeekValue = $state(0);

	const progress = $derived(getDuration() > 0 ? (getCurrentTime() / getDuration()) * 100 : 0);
	const volumePercent = $derived(isMuted() ? 0 : getVolume() * 100);

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

	function handleVolumeStart(e: MouseEvent | TouchEvent) {
		volumeSeeking = true;
		handleVolumeMove(e);
	}

	function handleVolumeMove(e: MouseEvent | TouchEvent) {
		if (!volumeSeeking) return;
		const target = (e.currentTarget ?? e.target) as HTMLElement;
		const bar = target.closest('[data-volume-bar]') as HTMLElement | null;
		if (!bar) return;
		const rect = bar.getBoundingClientRect();
		const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
		const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
		volumeSeekValue = pct * 100;
		setVolume(pct);
	}

	function handleVolumeEnd() {
		volumeSeeking = false;
	}
</script>

<svelte:window
	onmousemove={(e) => {
		handleSeekMove(e);
		handleVolumeMove(e);
	}}
	onmouseup={() => {
		handleSeekEnd();
		handleVolumeEnd();
	}}
	ontouchmove={(e) => {
		handleSeekMove(e);
		handleVolumeMove(e);
	}}
	ontouchend={() => {
		handleSeekEnd();
		handleVolumeEnd();
	}}
/>

{#if isExpanded() && getCurrentSong()}
	{@const song = getCurrentSong()!}
	{@const coverUrl = getCurrentCoverArtUrl()}
	{@const queue = getQueue()}
	{@const currentIdx = getCurrentIndex()}

	<!-- Backdrop -->
	<div
		class="fixed inset-x-0 top-12 bottom-0 z-40 flex flex-col bg-background sm:top-0 sm:left-56"
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

			<div class="flex items-center gap-1">
				<button
					class={cn(
						'inline-flex size-9 items-center justify-center rounded-full transition-colors',
						showLyrics
							? 'bg-accent text-accent-foreground'
							: 'text-muted-foreground hover:bg-accent hover:text-foreground'
					)}
					onclick={() => togglePanel('lyrics')}
					aria-label="Toggle lyrics"
				>
					<MicrophoneStageIcon class="size-5" />
				</button>
				<button
					class={cn(
						'inline-flex size-9 items-center justify-center rounded-full transition-colors',
						showQueue
							? 'bg-accent text-accent-foreground'
							: 'text-muted-foreground hover:bg-accent hover:text-foreground'
					)}
					onclick={() => togglePanel('queue')}
					aria-label="Toggle queue"
				>
					<QueueIcon class="size-5" />
				</button>
			</div>
		</div>

		<!-- Main content area -->
		<div class="flex min-h-0 flex-1 flex-row">
			<!-- Left column: Album art + info + controls -->
			<div class={cn('flex flex-col', showPanel ? 'w-1/2' : 'w-full')}>
				<!-- Album art + info -->
				<div class="flex flex-1 flex-col items-center justify-center gap-6 px-6">
					<div
						class="w-full max-w-xs overflow-hidden rounded-xl bg-muted shadow-lg sm:max-w-sm hd:max-w-[40rem]"
					>
						<div class="aspect-square">
							{#if coverUrl}
								<CoverImage src={coverUrl} alt={song.title} />
							{:else}
								<div class="flex h-full w-full items-center justify-center">
									<MusicNoteIcon class="size-24 text-muted-foreground" />
								</div>
							{/if}
						</div>
					</div>

					<div class="w-full max-w-xs text-center sm:max-w-sm">
						<h2 class="truncate text-xl font-bold text-foreground">{song.title}</h2>
						<a
							href="/artists/{song.artistId}"
							onclick={() => setExpanded(false)}
							class="block truncate text-sm text-muted-foreground transition-colors hover:text-foreground"
							>{song.artist}</a
						>
						{#if song.album}
							<a
								href="/albums/{song.albumId}"
								onclick={() => setExpanded(false)}
								class="block truncate text-xs text-muted-foreground transition-colors hover:text-foreground"
								>{song.album}</a
							>
						{/if}
					</div>
				</div>

				<!-- Seek bar + controls -->
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
					<div class="mt-4 flex items-center justify-center gap-3">
						<!-- Shuffle -->
						<button
							class={cn(
								'inline-flex size-10 items-center justify-center rounded-full transition-colors',
								isShuffle()
									? 'text-primary hover:bg-accent'
									: 'text-muted-foreground hover:bg-accent hover:text-foreground'
							)}
							onclick={toggleShuffle}
							aria-label="Shuffle"
							aria-pressed={isShuffle()}
						>
							<ShuffleIcon class="size-5" weight={isShuffle() ? 'bold' : 'regular'} />
						</button>

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

						<!-- Repeat -->
						<button
							class={cn(
								'inline-flex size-10 items-center justify-center rounded-full transition-colors',
								getRepeat() !== 'off'
									? 'text-primary hover:bg-accent'
									: 'text-muted-foreground hover:bg-accent hover:text-foreground'
							)}
							onclick={cycleRepeat}
							aria-label="Repeat: {getRepeat()}"
						>
							{#if getRepeat() === 'one'}
								<RepeatOnceIcon class="size-5" weight="bold" />
							{:else}
								<RepeatIcon class="size-5" weight={getRepeat() === 'all' ? 'bold' : 'regular'} />
							{/if}
						</button>
					</div>

					<!-- Volume -->
					<div class="mx-auto mt-4 flex w-full max-w-xs items-center gap-2 sm:max-w-sm">
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
						<div
							data-volume-bar
							class="relative h-1.5 flex-1 cursor-pointer rounded-full bg-muted"
							onmousedown={handleVolumeStart}
							ontouchstart={handleVolumeStart}
							role="slider"
							aria-label="Volume"
							aria-valuenow={Math.round(volumePercent)}
							aria-valuemin={0}
							aria-valuemax={100}
							tabindex={0}
							onkeydown={(e) => {
								if (e.key === 'ArrowRight') setVolume(getVolume() + 0.05);
								if (e.key === 'ArrowLeft') setVolume(getVolume() - 0.05);
							}}
						>
							<div
								class="pointer-events-none h-full rounded-full bg-primary"
								style="width: {volumePercent}%"
							></div>
						</div>
					</div>
				</div>
			</div>

			<!-- Right column: Queue -->
			{#if showQueue}
				<div class="flex w-1/2 flex-col border-l border-border">
					<div class="px-4 pt-4 pb-2">
						<h2 class="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
							Queue
						</h2>
					</div>
					<div class="flex-1 overflow-y-auto px-4 pb-4">
						<div class="space-y-0.5">
							{#each queue as queueSong, i (queueSong.id + '-' + i)}
								<div
									class={cn(
										'group flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors',
										i === currentIdx
											? 'bg-accent text-accent-foreground'
											: 'text-foreground hover:bg-accent/50'
									)}
								>
									<button
										class="flex min-w-0 flex-1 items-center gap-3 text-left"
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
									<button
										class="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
										onclick={(e) => {
											e.stopPropagation();
											removeFromQueue(i);
										}}
										aria-label="Remove from queue"
									>
										<XIcon class="size-3.5" />
									</button>
								</div>
							{/each}
						</div>
					</div>
				</div>
			{/if}

			<!-- Right column: Lyrics -->
			{#if showLyrics}
				<LyricsPanel songId={song.id} />
			{/if}
		</div>
	</div>
{/if}
