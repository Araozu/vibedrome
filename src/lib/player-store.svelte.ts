import type { Song } from './subsonic';
import { getStreamUrl, getCoverArtUrl } from './subsonic';
import { getActiveServer } from './server-store.svelte';

// ---- Types ----

export type RepeatMode = 'off' | 'all' | 'one';

// ---- Persistence ----

const VOLUME_KEY = 'player:volume';
const MUTED_KEY = 'player:muted';

function readVolume(): number {
	const raw = localStorage.getItem(VOLUME_KEY);
	if (raw === null) return 1;
	const n = parseFloat(raw);
	return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 1;
}

function readMuted(): boolean {
	return localStorage.getItem(MUTED_KEY) === 'true';
}

// ---- State ----

let queue = $state<Song[]>([]);
let currentIndex = $state<number>(-1);
let playing = $state(false);
let currentTime = $state(0);
let duration = $state(0);
let expanded = $state(false);
let volume = $state(readVolume());
let muted = $state(readMuted());
let shuffle = $state(false);
let repeat = $state<RepeatMode>('off');

const currentSong = $derived<Song | null>(
	currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex] : null
);

const hasNext = $derived(repeat === 'all' || currentIndex < queue.length - 1);
const hasPrev = $derived(currentIndex > 0);

// ---- Audio element (singleton) ----

let audio: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement {
	if (!audio) {
		audio = new Audio();
		audio.volume = muted ? 0 : volume;
		audio.addEventListener('timeupdate', () => {
			currentTime = audio!.currentTime;
		});
		audio.addEventListener('durationchange', () => {
			duration = audio!.duration;
		});
		audio.addEventListener('ended', () => {
			if (repeat === 'one') {
				const el = audio!;
				el.currentTime = 0;
				el.play().catch(() => {
					playing = false;
				});
			} else if (shuffle) {
				playShuffledNext();
			} else if (currentIndex < queue.length - 1) {
				next();
			} else if (repeat === 'all' && queue.length > 0) {
				currentIndex = 0;
				const song = queue[0];
				if (song) loadAndPlay(song);
			} else {
				playing = false;
			}
		});
		audio.addEventListener('pause', () => {
			playing = false;
		});
		audio.addEventListener('play', () => {
			playing = true;
		});
	}
	return audio;
}

/** Pick a random different track index from the queue. */
function playShuffledNext(): void {
	if (queue.length <= 1) {
		if (repeat === 'all' && queue.length === 1) {
			const el = getAudio();
			el.currentTime = 0;
			el.play().catch(() => {
				playing = false;
			});
		} else {
			playing = false;
		}
		return;
	}
	let nextIdx: number;
	do {
		nextIdx = Math.floor(Math.random() * queue.length);
	} while (nextIdx === currentIndex);
	currentIndex = nextIdx;
	const song = queue[currentIndex];
	if (song) loadAndPlay(song);
}

// ---- MediaSession ----

let mediaSessionInitialized = false;

function initMediaSession(): void {
	if (mediaSessionInitialized || !('mediaSession' in navigator)) return;
	mediaSessionInitialized = true;

	navigator.mediaSession.setActionHandler('play', () => {
		const el = getAudio();
		if (currentSong) el.play();
	});
	navigator.mediaSession.setActionHandler('pause', () => {
		getAudio().pause();
	});
	navigator.mediaSession.setActionHandler('previoustrack', () => {
		prev();
	});
	navigator.mediaSession.setActionHandler('nexttrack', () => {
		next();
	});
	navigator.mediaSession.setActionHandler('seekto', (details) => {
		if (details.seekTime !== undefined && details.seekTime !== null) {
			seek(details.seekTime);
		}
	});
}

function updateMediaSessionMetadata(song: Song): void {
	if (!('mediaSession' in navigator)) return;

	const server = getActiveServer();
	const artwork: MediaImage[] = [];
	if (song.coverArt && server) {
		const src = getCoverArtUrl(server, song.coverArt);
		artwork.push(
			{ src, sizes: '96x96', type: 'image/jpeg' },
			{ src, sizes: '256x256', type: 'image/jpeg' },
			{ src, sizes: '512x512', type: 'image/jpeg' }
		);
	}

	navigator.mediaSession.metadata = new MediaMetadata({
		title: song.title,
		artist: song.artist,
		album: song.album,
		artwork
	});
}

// ---- Internal helpers ----

function loadAndPlay(song: Song): void {
	const server = getActiveServer();
	if (!server) return;

	initMediaSession();

	const el = getAudio();
	el.src = getStreamUrl(server, song.id);
	el.load();
	el.play().catch(() => {
		// Autoplay may be blocked by browser policy; state will stay paused
		playing = false;
	});

	updateMediaSessionMetadata(song);
}

// ---- Public API ----

export function getQueue(): Song[] {
	return queue;
}

export function getCurrentSong(): Song | null {
	return currentSong;
}

export function getCurrentIndex(): number {
	return currentIndex;
}

export function isPlaying(): boolean {
	return playing;
}

export function getCurrentTime(): number {
	return currentTime;
}

export function getDuration(): number {
	return duration;
}

export function getHasNext(): boolean {
	return hasNext;
}

export function getHasPrev(): boolean {
	return hasPrev;
}

export function isExpanded(): boolean {
	return expanded;
}

export function setExpanded(value: boolean): void {
	expanded = value;
}

export function getVolume(): number {
	return volume;
}

export function setVolume(v: number): void {
	volume = Math.max(0, Math.min(1, v));
	const el = getAudio();
	el.volume = muted ? 0 : volume;
	if (volume > 0 && muted) {
		muted = false;
		localStorage.setItem(MUTED_KEY, 'false');
	}
	localStorage.setItem(VOLUME_KEY, String(volume));
}

export function isMuted(): boolean {
	return muted;
}

export function toggleMute(): void {
	muted = !muted;
	const el = getAudio();
	el.volume = muted ? 0 : volume;
	localStorage.setItem(MUTED_KEY, String(muted));
}

export function isShuffle(): boolean {
	return shuffle;
}

export function toggleShuffle(): void {
	shuffle = !shuffle;
}

export function getRepeat(): RepeatMode {
	return repeat;
}

/** Cycle through repeat modes: off -> all -> one -> off */
export function cycleRepeat(): void {
	if (repeat === 'off') {
		repeat = 'all';
	} else if (repeat === 'all') {
		repeat = 'one';
	} else {
		repeat = 'off';
	}
}

/** Replace the queue and start playing from the given index. */
export function playQueue(songs: Song[], startIndex = 0): void {
	queue = [...songs];
	currentIndex = startIndex;
	const song = queue[currentIndex];
	if (song) {
		loadAndPlay(song);
	}
}

/** Toggle play/pause. */
export function togglePlay(): void {
	const el = getAudio();
	if (!currentSong) return;

	if (el.paused) {
		el.play();
	} else {
		el.pause();
	}
}

/** Seek to a position (in seconds). */
export function seek(time: number): void {
	const el = getAudio();
	if (!Number.isFinite(time)) return;
	el.currentTime = Math.max(0, Math.min(time, el.duration || 0));
}

/** Skip to next track. */
export function next(): void {
	if (shuffle) {
		playShuffledNext();
		return;
	}
	if (currentIndex < queue.length - 1) {
		currentIndex += 1;
	} else if (repeat === 'all' && queue.length > 0) {
		currentIndex = 0;
	} else {
		return;
	}
	const song = queue[currentIndex];
	if (song) {
		loadAndPlay(song);
	}
}

/** Skip to previous track. */
export function prev(): void {
	const el = getAudio();
	// If more than 3 seconds into the song, restart it instead
	if (el && el.currentTime > 3) {
		el.currentTime = 0;
		return;
	}
	if (!hasPrev) return;
	currentIndex -= 1;
	const song = queue[currentIndex];
	if (song) {
		loadAndPlay(song);
	}
}

/** Get cover art URL for the current song. */
export function getCurrentCoverArtUrl(): string | null {
	const song = currentSong;
	if (!song?.coverArt) return null;
	const server = getActiveServer();
	if (!server) return null;
	return getCoverArtUrl(server, song.coverArt);
}

/** Jump to a specific index in the queue. */
export function playAt(index: number): void {
	if (index < 0 || index >= queue.length) return;
	currentIndex = index;
	const song = queue[currentIndex];
	if (song) {
		loadAndPlay(song);
	}
}

/** Remove a track from the queue by index. */
export function removeFromQueue(index: number): void {
	if (index < 0 || index >= queue.length) return;

	// If removing the currently playing track
	if (index === currentIndex) {
		const el = getAudio();
		el.pause();
		el.removeAttribute('src');
		el.load();

		queue = queue.filter((_, i) => i !== index);

		if (queue.length === 0) {
			currentIndex = -1;
			playing = false;
			duration = 0;
			currentTime = 0;
		} else {
			// Clamp so we don't go past the end
			currentIndex = Math.min(currentIndex, queue.length - 1);
			const song = queue[currentIndex];
			if (song) loadAndPlay(song);
		}
	} else {
		const wasAfter = index > currentIndex;
		queue = queue.filter((_, i) => i !== index);
		if (!wasAfter) {
			// Removed before current, shift index down
			currentIndex -= 1;
		}
	}
}

/** Format seconds as m:ss */
export function formatTime(seconds: number): string {
	if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
	const m = Math.floor(seconds / 60);
	const s = Math.floor(seconds % 60);
	return `${m}:${s.toString().padStart(2, '0')}`;
}
