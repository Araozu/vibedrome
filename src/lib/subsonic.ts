const CLIENT_NAME = 'Vibedrome';
const API_VERSION = '1.16.1';

export interface ServerConfig {
	url: string;
	user: string;
	password: string;
}

/**
 * Compute MD5 hex digest. Uses a minimal pure-JS implementation so we don't
 * need any extra dependencies (Web Crypto doesn't expose MD5).
 */
function md5(input: string): string {
	const bytes = new TextEncoder().encode(input);

	const bitLen = bytes.length * 8;
	const padLen = (bytes.length % 64 < 56 ? 56 : 120) - (bytes.length % 64);
	const padded = new Uint8Array(bytes.length + padLen + 8);
	padded.set(bytes);
	padded[bytes.length] = 0x80;
	const view = new DataView(padded.buffer);
	view.setUint32(padded.length - 8, bitLen >>> 0, true);
	view.setUint32(padded.length - 4, 0, true);

	const S = [
		7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9,
		14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21,
		6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
	];

	const K = new Uint32Array(64);
	for (let i = 0; i < 64; i++) {
		K[i] = Math.floor(2 ** 32 * Math.abs(Math.sin(i + 1))) >>> 0;
	}

	let a0 = 0x67452301 >>> 0;
	let b0 = 0xefcdab89 >>> 0;
	let c0 = 0x98badcfe >>> 0;
	let d0 = 0x10325476 >>> 0;

	for (let offset = 0; offset < padded.length; offset += 64) {
		const M = new Uint32Array(16);
		for (let j = 0; j < 16; j++) {
			M[j] = view.getUint32(offset + j * 4, true);
		}

		let A = a0,
			B = b0,
			C = c0,
			D = d0;

		for (let i = 0; i < 64; i++) {
			let F: number, g: number;
			if (i < 16) {
				F = (B & C) | (~B & D);
				g = i;
			} else if (i < 32) {
				F = (D & B) | (~D & C);
				g = (5 * i + 1) % 16;
			} else if (i < 48) {
				F = B ^ C ^ D;
				g = (3 * i + 5) % 16;
			} else {
				F = C ^ (B | ~D);
				g = (7 * i) % 16;
			}
			F = (F + A + K[i] + M[g]) >>> 0;
			A = D;
			D = C;
			C = B;
			B = (B + ((F << S[i]) | (F >>> (32 - S[i])))) >>> 0;
		}

		a0 = (a0 + A) >>> 0;
		b0 = (b0 + B) >>> 0;
		c0 = (c0 + C) >>> 0;
		d0 = (d0 + D) >>> 0;
	}

	function toHex(n: number): string {
		return Array.from(new Uint8Array(new Uint32Array([n]).buffer))
			.map((b) => b.toString(16).padStart(2, '0'))
			.join('');
	}

	return toHex(a0) + toHex(b0) + toHex(c0) + toHex(d0);
}

/**
 * Build Subsonic auth query params with a **deterministic** salt derived from
 * the server identity (user + url). Because the salt never changes for a given
 * server, every URL produced for the same endpoint + params is identical across
 * calls and page reloads, allowing the browser HTTP cache to work normally.
 */
function buildAuthParams(config: ServerConfig): URLSearchParams {
	const salt = md5(config.user + config.url);
	const token = md5(config.password + salt);
	return new URLSearchParams({
		u: config.user,
		t: token,
		s: salt,
		v: API_VERSION,
		c: CLIENT_NAME,
		f: 'json'
	});
}

async function apiRequest<T>(
	config: ServerConfig,
	endpoint: string,
	params?: Record<string, string>
): Promise<T> {
	const url = config.url.replace(/\/+$/, '');
	const authParams = buildAuthParams(config);

	if (params) {
		for (const [k, v] of Object.entries(params)) {
			authParams.set(k, v);
		}
	}

	const response = await fetch(`${url}/rest/${endpoint}?${authParams.toString()}`);

	if (!response.ok) {
		throw new Error(`Subsonic API error: ${response.status} ${response.statusText}`);
	}

	const json = await response.json();
	const root = json['subsonic-response'];

	if (!root) {
		throw new Error('Invalid Subsonic API response');
	}

	if (root.status !== 'ok') {
		const err = root.error;
		throw new Error(`Subsonic error ${err?.code}: ${err?.message}`);
	}

	return root as T;
}

// ---------- Types ----------

export interface Album {
	id: string;
	name: string;
	artist: string;
	artistId: string;
	coverArt: string;
	songCount: number;
	duration: number;
	year?: number;
	genre?: string;
}

export interface Song {
	id: string;
	title: string;
	album: string;
	albumId: string;
	artist: string;
	artistId: string;
	track?: number;
	discNumber?: number;
	year?: number;
	genre?: string;
	duration: number;
	size: number;
	suffix: string;
	contentType: string;
	bitRate?: number;
	coverArt?: string;
}

export interface AlbumDetail extends Album {
	song: Song[];
}

export interface Artist {
	id: string;
	name: string;
	albumCount: number;
	coverArt?: string;
}

export interface ArtistDetail extends Artist {
	album: Album[];
}

interface ArtistIndex {
	name: string;
	artist: Artist[];
}

interface GetAlbumList2Response {
	status: string;
	albumList2: {
		album: Album[];
	};
}

interface Search3Response {
	status: string;
	searchResult3: {
		album?: Album[];
	};
}

interface GetAlbumResponse {
	status: string;
	album: AlbumDetail;
}

interface GetArtistsResponse {
	status: string;
	artists: {
		index: ArtistIndex[];
	};
}

interface GetArtistResponse {
	status: string;
	artist: ArtistDetail;
}

interface PingResponse {
	status: string;
	version: string;
}

// ---------- Public API ----------

export async function ping(config: ServerConfig): Promise<PingResponse> {
	return apiRequest<PingResponse>(config, 'ping');
}

export async function getAlbumList(
	config: ServerConfig,
	type:
		| 'newest'
		| 'frequent'
		| 'recent'
		| 'random'
		| 'alphabeticalByName'
		| 'alphabeticalByArtist'
		| 'starred'
		| 'byYear'
		| 'byGenre' = 'newest',
	size = 50,
	offset = 0
): Promise<Album[]> {
	const res = await apiRequest<GetAlbumList2Response>(config, 'getAlbumList2', {
		type,
		size: String(size),
		offset: String(offset)
	});
	return res.albumList2?.album ?? [];
}

export async function getAlbum(config: ServerConfig, id: string): Promise<AlbumDetail> {
	const res = await apiRequest<GetAlbumResponse>(config, 'getAlbum', { id });
	return res.album;
}

export async function searchAlbums(
	config: ServerConfig,
	query: string,
	size = 50,
	offset = 0
): Promise<Album[]> {
	const res = await apiRequest<Search3Response>(config, 'search3', {
		query,
		albumCount: String(size),
		albumOffset: String(offset),
		artistCount: '0',
		songCount: '0'
	});
	return res.searchResult3?.album ?? [];
}

export async function getArtists(config: ServerConfig): Promise<Artist[]> {
	const res = await apiRequest<GetArtistsResponse>(config, 'getArtists');
	const indexes = res.artists?.index ?? [];
	return indexes.flatMap((idx) => idx.artist ?? []);
}

export async function getArtist(config: ServerConfig, id: string): Promise<ArtistDetail> {
	const res = await apiRequest<GetArtistResponse>(config, 'getArtist', { id });
	return res.artist;
}

/**
 * Build an authenticated URL to the `getCoverArt` endpoint.
 * Returns a full URL string that can be used as an `<img src>`.
 */
export function getCoverArtUrl(config: ServerConfig, coverArtId: string): string {
	const base = config.url.replace(/\/+$/, '');
	const params = buildAuthParams(config);
	params.set('id', coverArtId);
	params.set('size', '600');
	return `${base}/rest/getCoverArt?${params.toString()}`;
}

/**
 * Build an authenticated URL to the `stream` endpoint.
 * Uses `format=raw` so the server sends the original file without re-encoding.
 */
export function getStreamUrl(config: ServerConfig, songId: string): string {
	const base = config.url.replace(/\/+$/, '');
	const params = buildAuthParams(config);
	params.set('id', songId);
	params.set('format', 'raw');
	return `${base}/rest/stream?${params.toString()}`;
}
