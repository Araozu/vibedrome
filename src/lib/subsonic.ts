const CLIENT_NAME = 'Vibedrome';
const API_VERSION = '1.16.1';

function getConfig() {
	const url = import.meta.env.VITE_NAVIDROME_URL;
	const user = import.meta.env.VITE_NAVIDROME_USER;
	const password = import.meta.env.VITE_NAVIDROME_PASSWORD;

	if (!url || !user || !password) {
		throw new Error(
			'Missing Navidrome env vars. Set VITE_NAVIDROME_URL, VITE_NAVIDROME_USER, VITE_NAVIDROME_PASSWORD in .env'
		);
	}

	return { url: url.replace(/\/+$/, ''), user, password };
}

function generateSalt(length = 16): string {
	const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
	let salt = '';
	const values = crypto.getRandomValues(new Uint8Array(length));
	for (const v of values) {
		salt += chars[v % chars.length];
	}
	return salt;
}

/**
 * Compute MD5 hex digest. Uses a minimal pure-JS implementation so we don't
 * need any extra dependencies (Web Crypto doesn't expose MD5).
 */
function md5(input: string): string {
	// Encode input as UTF-8 bytes
	const bytes = new TextEncoder().encode(input);

	// Pre-processing
	const bitLen = bytes.length * 8;
	// Padding: append 0x80, then zeros, then 64-bit length
	const padLen = (bytes.length % 64 < 56 ? 56 : 120) - (bytes.length % 64);
	const padded = new Uint8Array(bytes.length + padLen + 8);
	padded.set(bytes);
	padded[bytes.length] = 0x80;
	// Append length in bits as 64-bit LE
	const view = new DataView(padded.buffer);
	view.setUint32(padded.length - 8, bitLen >>> 0, true);
	view.setUint32(padded.length - 4, 0, true);

	// Constants
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
		// Little-endian hex
		return Array.from(new Uint8Array(new Uint32Array([n]).buffer))
			.map((b) => b.toString(16).padStart(2, '0'))
			.join('');
	}

	return toHex(a0) + toHex(b0) + toHex(c0) + toHex(d0);
}

function buildAuthParams(user: string, password: string): URLSearchParams {
	const salt = generateSalt();
	const token = md5(password + salt);
	return new URLSearchParams({
		u: user,
		t: token,
		s: salt,
		v: API_VERSION,
		c: CLIENT_NAME,
		f: 'json'
	});
}

async function apiRequest<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
	const { url, user, password } = getConfig();
	const authParams = buildAuthParams(user, password);

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

interface GetAlbumList2Response {
	status: string;
	albumList2: {
		album: Album[];
	};
}

interface PingResponse {
	status: string;
	version: string;
}

// ---------- Public API ----------

export async function ping(): Promise<PingResponse> {
	return apiRequest<PingResponse>('ping');
}

export async function getAlbumList(
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
	const res = await apiRequest<GetAlbumList2Response>('getAlbumList2', {
		type,
		size: String(size),
		offset: String(offset)
	});
	return res.albumList2?.album ?? [];
}
