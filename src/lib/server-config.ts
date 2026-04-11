import type { ServerConfig } from './subsonic';

const STORAGE_KEY = 'vibedrome:server';

export function getServerConfig(): ServerConfig | null {
	const raw = localStorage.getItem(STORAGE_KEY);
	if (!raw) return null;

	try {
		const parsed = JSON.parse(raw);
		if (parsed.url && parsed.user && parsed.password) {
			return parsed as ServerConfig;
		}
		return null;
	} catch {
		return null;
	}
}

export function saveServerConfig(config: ServerConfig): void {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function clearServerConfig(): void {
	localStorage.removeItem(STORAGE_KEY);
}
