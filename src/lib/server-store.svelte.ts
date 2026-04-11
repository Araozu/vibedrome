import type { ServerConfig } from './subsonic';

const STORAGE_KEY = 'vibedrome:servers';
const ACTIVE_KEY = 'vibedrome:active-server';

export interface StoredServer extends ServerConfig {
	id: string;
	name: string;
}

interface ServersState {
	servers: StoredServer[];
	activeId: string | null;
}

function loadState(): ServersState {
	const raw = localStorage.getItem(STORAGE_KEY);
	const activeId = localStorage.getItem(ACTIVE_KEY);
	if (!raw) return { servers: [], activeId: null };

	try {
		const servers = JSON.parse(raw) as StoredServer[];
		return {
			servers,
			activeId: activeId && servers.some((s) => s.id === activeId) ? activeId : null
		};
	} catch {
		return { servers: [], activeId: null };
	}
}

function persist(servers: StoredServer[], activeId: string | null): void {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(servers));
	if (activeId) {
		localStorage.setItem(ACTIVE_KEY, activeId);
	} else {
		localStorage.removeItem(ACTIVE_KEY);
	}
}

function generateId(): string {
	return crypto.randomUUID();
}

const initial = loadState();

let servers = $state<StoredServer[]>(initial.servers);
let activeId = $state<string | null>(initial.activeId);

const activeServer = $derived(servers.find((s) => s.id === activeId) ?? null);

export function getServers(): StoredServer[] {
	return servers;
}

export function getActiveServer(): StoredServer | null {
	return activeServer;
}

export function getActiveId(): string | null {
	return activeId;
}

export function setActiveId(id: string | null): void {
	if (id !== null && !servers.some((s) => s.id === id)) return;
	activeId = id;
	persist(servers, activeId);
}

export function addServer(config: {
	name: string;
	url: string;
	user: string;
	password: string;
}): StoredServer {
	const server: StoredServer = {
		id: generateId(),
		name: config.name,
		url: config.url,
		user: config.user,
		password: config.password
	};
	servers = [...servers, server];
	if (servers.length === 1) {
		activeId = server.id;
	}
	persist(servers, activeId);
	return server;
}

export function updateServer(
	id: string,
	config: { name: string; url: string; user: string; password: string }
): void {
	servers = servers.map((s) =>
		s.id === id
			? { ...s, name: config.name, url: config.url, user: config.user, password: config.password }
			: s
	);
	persist(servers, activeId);
}

export function removeServer(id: string): void {
	servers = servers.filter((s) => s.id !== id);
	if (activeId === id) {
		activeId = servers.length > 0 ? servers[0].id : null;
	}
	persist(servers, activeId);
}
