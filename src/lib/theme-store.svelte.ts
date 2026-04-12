const STORAGE_KEY = 'vibedrome:color-theme';

export interface ThemeOption {
	id: string;
	label: string;
}

export const themes: ThemeOption[] = [
	{ id: 'corporate-memo', label: 'Corporate Memo' },
	{ id: 'wishful-aurosa', label: 'Wishful Aurosa' },
	{ id: 'misty-dream', label: 'Misty Dream' },
	{ id: 'twilight-echoes', label: 'Twilight Echoes' },
	{ id: 'crimson-shade', label: 'Crimson Shade' },
	{ id: 'spectral-mist', label: 'Spectral Mist' },
	{ id: 'golden-plume', label: 'Golden Plume' },
	{ id: 'forest-ripple', label: 'Forest Ripple' },
	{ id: 'blazing-fields', label: 'Blazing Fields' },
	{ id: 'enchanted-encounter', label: 'Enchanted Encounter' }
];

function loadTheme(): string {
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored && themes.some((t) => t.id === stored)) return stored;
	return 'corporate-memo';
}

const initialTheme = loadTheme();
let activeTheme = $state<string>(initialTheme);

function applyTheme(id: string): void {
	document.documentElement.setAttribute('data-theme', id);
}

// Apply on init
applyTheme(initialTheme);

export function getActiveTheme(): string {
	return activeTheme;
}

export function setActiveTheme(id: string): void {
	if (!themes.some((t) => t.id === id)) return;
	activeTheme = id;
	localStorage.setItem(STORAGE_KEY, id);
	applyTheme(id);
}
