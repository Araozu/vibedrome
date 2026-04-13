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
	import EyedropperIcon from 'phosphor-svelte/lib/Eyedropper';
	import LyricsPanel from '$lib/components/LyricsPanel.svelte';

	// --- Color extraction ---
	interface RGB {
		r: number;
		g: number;
		b: number;
	}

	interface PaletteCache {
		colors: string[];
		idx: number;
		customColor?: string | null;
	}

	const PALETTE_CACHE_PREFIX = 'vd-palette:';

	function paletteLoadCache(url: string): PaletteCache | null {
		try {
			const raw = localStorage.getItem(PALETTE_CACHE_PREFIX + url);
			if (!raw) return null;
			return JSON.parse(raw) as PaletteCache;
		} catch {
			return null;
		}
	}

	function paletteSaveCache(
		url: string,
		colors: string[],
		idx: number,
		customColor: string | null
	): void {
		try {
			localStorage.setItem(
				PALETTE_CACHE_PREFIX + url,
				JSON.stringify({ colors, idx, customColor })
			);
		} catch {
			// storage unavailable or full — silently ignore
		}
	}

	// activePaletteIdx: 0–4 = extracted, 5 = custom pick, -1 = off
	let paletteColors = $state<string[]>([]);
	let customColor = $state<string | null>(null);
	let activePaletteIdx = $state(0);
	let pickMode = $state(false);

	// Non-reactive ref — holds the offscreen canvas drawn by extractColors for pixel sampling
	let coverCanvas: HTMLCanvasElement | null = null;

	const bgColor = $derived(
		activePaletteIdx === -1
			? ''
			: activePaletteIdx === 5
				? (customColor ?? '')
				: (paletteColors[activePaletteIdx] ?? '')
	);

	function rgbToString({ r, g, b }: RGB): string {
		return `rgb(${r}, ${g}, ${b})`;
	}

	function extractColors(imageUrl: string): Promise<string[]> {
		return new Promise((resolve) => {
			const img = new Image();
			img.crossOrigin = 'anonymous';
			img.onload = () => {
				try {
					const canvas = document.createElement('canvas');
					canvas.width = 64;
					canvas.height = 64;
					const ctx = canvas.getContext('2d');
					if (!ctx) {
						resolve([]);
						return;
					}
					ctx.drawImage(img, 0, 0, 64, 64);
					// Keep the canvas around for eyedropper pixel sampling
					coverCanvas = canvas;
					const { data } = ctx.getImageData(0, 0, 64, 64);
					const colorMap = new Map<string, { rgb: RGB; count: number }>();
					for (let i = 0; i < data.length; i += 4) {
						const r = data[i],
							g = data[i + 1],
							b = data[i + 2],
							a = data[i + 3];
						if (a < 128) continue;
						const qr = Math.floor(r / 32) * 32;
						const qg = Math.floor(g / 32) * 32;
						const qb = Math.floor(b / 32) * 32;
						const key = `${qr},${qg},${qb}`;
						const entry = colorMap.get(key);
						if (entry) entry.count++;
						else colorMap.set(key, { rgb: { r: qr, g: qg, b: qb }, count: 1 });
					}
					const sorted = [...colorMap.values()].sort((a, b) => b.count - a.count);
					resolve(sorted.slice(0, 5).map((e) => rgbToString(e.rgb)));
				} catch {
					resolve([]);
				}
			};
			img.onerror = () => resolve([]);
			img.src = imageUrl;
		});
	}

	function handleCoverPick(e: MouseEvent) {
		if (!pickMode || !coverCanvas) return;
		pickMode = false;
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const x = Math.max(0, Math.min(63, Math.floor(((e.clientX - rect.left) / rect.width) * 64)));
		const y = Math.max(0, Math.min(63, Math.floor(((e.clientY - rect.top) / rect.height) * 64)));
		const ctx = coverCanvas.getContext('2d');
		if (!ctx) return;
		const px = ctx.getImageData(x, y, 1, 1).data;
		customColor = rgbToString({ r: px[0], g: px[1], b: px[2] });
		activePaletteIdx = 5;
	}

	// Load palette: check cache first, fall back to canvas extraction.
	$effect(() => {
		const url = getCurrentCoverArtUrl();
		paletteColors = [];
		customColor = null;
		activePaletteIdx = 0;
		pickMode = false;
		coverCanvas = null;
		if (!url) return;

		const cached = paletteLoadCache(url);
		if (cached) {
			paletteColors = cached.colors;
			customColor = cached.customColor ?? null;
			activePaletteIdx = cached.idx;
			// Still draw image to canvas so eyedropper works even on cache hit
			const img = new Image();
			img.crossOrigin = 'anonymous';
			img.onload = () => {
				const canvas = document.createElement('canvas');
				canvas.width = 64;
				canvas.height = 64;
				const ctx = canvas.getContext('2d');
				if (ctx) {
					ctx.drawImage(img, 0, 0, 64, 64);
					coverCanvas = canvas;
				}
			};
			img.src = url;
			return;
		}

		let cancelled = false;
		extractColors(url).then((colors) => {
			if (!cancelled) {
				paletteColors = colors;
				activePaletteIdx = 0;
				paletteSaveCache(url, colors, 0, null);
			}
		});
		return () => {
			cancelled = true;
		};
	});

	// Persist index + customColor changes back to cache.
	$effect(() => {
		const url = getCurrentCoverArtUrl();
		const colors = paletteColors;
		const idx = activePaletteIdx;
		const custom = customColor;
		if (url && colors.length > 0) {
			paletteSaveCache(url, colors, idx, custom);
		}
	});

	// --- Panel state ---
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
		class="fixed inset-x-0 top-12 bottom-0 z-40 flex flex-col bg-background transition-colors duration-700 ease-in-out sm:top-0 sm:left-56"
		style:background-color={bgColor
			? `color-mix(in srgb, ${bgColor} 35%, var(--color-background) 65%)`
			: undefined}
		role="dialog"
		aria-label="Now Playing"
		onkeydown={(e) => {
			if (e.key === 'Escape') {
				if (pickMode) {
					pickMode = false;
					return;
				}
				setExpanded(false);
			}
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
					<div class="relative w-full max-w-xs sm:max-w-sm hd:max-w-[40rem]">
						<div class="overflow-hidden rounded-xl bg-muted shadow-lg">
							<div
								class={cn('aspect-square', pickMode && coverUrl ? 'cursor-crosshair' : '')}
								onclick={handleCoverPick}
								role="presentation"
							>
								{#if coverUrl}
									<CoverImage src={coverUrl} alt={song.title} />
								{:else}
									<div class="flex h-full w-full items-center justify-center">
										<MusicNoteIcon class="size-24 text-muted-foreground" />
									</div>
								{/if}
							</div>
						</div>

						{#if coverUrl}
							<button
								class={cn(
									'absolute top-2 right-2 inline-flex size-8 items-center justify-center rounded-full backdrop-blur-sm transition-all duration-150',
									pickMode
										? 'bg-foreground text-background shadow-md'
										: 'bg-background/60 text-foreground hover:bg-background/90'
								)}
								onclick={() => (pickMode = !pickMode)}
								aria-label={pickMode ? 'Cancel color pick' : 'Pick color from cover'}
								title={pickMode ? 'Click on the cover to sample a color' : 'Pick color from cover'}
							>
								<EyedropperIcon class="size-4" />
							</button>
						{/if}
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

						{#if paletteColors.length > 0}
							<div class="mt-3 flex items-center justify-center gap-2">
								{#each paletteColors as color, i}
									<button
										class={cn(
											'size-[1.1rem] cursor-pointer rounded-full transition-all duration-200',
											i === activePaletteIdx
												? 'scale-[1.35] ring-2 ring-foreground/40'
												: 'opacity-60 hover:scale-110 hover:opacity-100'
										)}
										style:background-color={color}
										onclick={() => (activePaletteIdx = i)}
										aria-label="Set background to color {i + 1}"
									></button>
								{/each}
								<!-- Custom eyedropper swatch -->
								{#if customColor}
									<button
										class={cn(
											'size-[1.1rem] cursor-pointer rounded-full ring-1 ring-foreground/20 transition-all duration-200',
											activePaletteIdx === 5
												? 'scale-[1.35] ring-2 ring-foreground/40'
												: 'opacity-60 hover:scale-110 hover:opacity-100'
										)}
										style:background-color={customColor}
										onclick={() => (activePaletteIdx = 5)}
										aria-label="Set background to picked color"
									></button>
								{/if}
								<!-- Off swatch -->
								<button
									class={cn(
										'size-[1.1rem] cursor-pointer rounded-full border border-border bg-muted transition-all duration-200',
										activePaletteIdx === -1
											? 'scale-[1.35] opacity-100 ring-2 ring-foreground/40'
											: 'opacity-50 hover:scale-110 hover:opacity-80'
									)}
									onclick={() => (activePaletteIdx = -1)}
									aria-label="Remove background color"
								></button>
							</div>
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
