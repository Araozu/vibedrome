import type { Song } from './subsonic';
import { getStreamUrl, getCoverArtUrl } from './subsonic';
import { getActiveServer } from './server-store.svelte';

// ---- State ----

let queue = $state<Song[]>([]);
let currentIndex = $state<number>(-1);
let playing = $state(false);
let currentTime = $state(0);
let duration = $state(0);
let expanded = $state(false);

const currentSong = $derived<Song | null>(
	currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex] : null
);

const hasNext = $derived(currentIndex < queue.length - 1);
const hasPrev = $derived(currentIndex > 0);

// ---- Audio element (singleton) ----

let audio: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement {
	if (!audio) {
		audio = new Audio();
		audio.addEventListener('timeupdate', () => {
			currentTime = audio!.currentTime;
		});
		audio.addEventListener('durationchange', () => {
			duration = audio!.duration;
		});
		audio.addEventListener('ended', () => {
			if (hasNext) {
				next();
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

// ---- Internal helpers ----

function loadAndPlay(song: Song): void {
	const server = getActiveServer();
	if (!server) return;

	const el = getAudio();
	el.src = getStreamUrl(server, song.id);
	el.load();
	el.play().catch(() => {
		// Autoplay may be blocked by browser policy; state will stay paused
		playing = false;
	});
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
	if (!hasNext) return;
	currentIndex += 1;
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
export function getCurrentCoverArtUrl(size = 300): string | null {
	const song = currentSong;
	if (!song?.coverArt) return null;
	const server = getActiveServer();
	if (!server) return null;
	return getCoverArtUrl(server, song.coverArt, size);
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

/** Format seconds as m:ss */
export function formatTime(seconds: number): string {
	if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
	const m = Math.floor(seconds / 60);
	const s = Math.floor(seconds % 60);
	return `${m}:${s.toString().padStart(2, '0')}`;
}
