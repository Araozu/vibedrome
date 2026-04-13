const STORAGE_KEY = 'vibedrome:lyrics-prefs';

export type LyricsFontSize = 'sm' | 'base' | 'lg' | 'xl';
export type LyricsTextAlign = 'left' | 'center' | 'right';
export type LyricsSpacing = 'compact' | 'normal' | 'relaxed';

export interface LyricsPrefs {
	fontSize: LyricsFontSize;
	customFontSizePt: number | null;
	textAlign: LyricsTextAlign;
	spacing: LyricsSpacing;
}

const FONT_SIZES: LyricsFontSize[] = ['sm', 'base', 'lg', 'xl'];
const TEXT_ALIGNS: LyricsTextAlign[] = ['left', 'center', 'right'];
const SPACINGS: LyricsSpacing[] = ['compact', 'normal', 'relaxed'];

const defaults: LyricsPrefs = {
	fontSize: 'base',
	customFontSizePt: null,
	textAlign: 'left',
	spacing: 'normal'
};

function loadPrefs(): LyricsPrefs {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) return { ...defaults };
		const parsed = JSON.parse(stored) as Partial<LyricsPrefs>;
		const rawCustom = parsed.customFontSizePt;
		return {
			fontSize: FONT_SIZES.includes(parsed.fontSize!) ? parsed.fontSize! : defaults.fontSize,
			customFontSizePt:
				typeof rawCustom === 'number' && rawCustom >= 8 && rawCustom <= 96 ? rawCustom : null,
			textAlign: TEXT_ALIGNS.includes(parsed.textAlign!) ? parsed.textAlign! : defaults.textAlign,
			spacing: SPACINGS.includes(parsed.spacing!) ? parsed.spacing! : defaults.spacing
		};
	} catch {
		return { ...defaults };
	}
}

let prefs = $state<LyricsPrefs>(loadPrefs());

function save(): void {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function getLyricsPrefs(): LyricsPrefs {
	return prefs;
}

export function setLyricsFontSize(size: LyricsFontSize): void {
	prefs = { ...prefs, fontSize: size, customFontSizePt: null };
	save();
}

export function setLyricsTextAlign(align: LyricsTextAlign): void {
	prefs = { ...prefs, textAlign: align };
	save();
}

export function setLyricsSpacing(spacing: LyricsSpacing): void {
	prefs = { ...prefs, spacing: spacing };
	save();
}

export function setLyricsCustomFontSize(pt: number | null): void {
	prefs = { ...prefs, customFontSizePt: pt };
	save();
}

// Tailwind class maps – defined here so LyricsPanel can import them alongside the store.
export const fontSizeMap: Record<LyricsFontSize, { inactive: string; active: string }> = {
	sm: { inactive: 'text-xs', active: 'text-sm font-semibold' },
	base: { inactive: 'text-sm', active: 'text-lg font-semibold' },
	lg: { inactive: 'text-base', active: 'text-xl font-semibold' },
	xl: { inactive: 'text-lg', active: 'text-2xl font-semibold' }
};

export const alignMap: Record<LyricsTextAlign, string> = {
	left: 'text-left',
	center: 'text-center',
	right: 'text-right'
};

export const spacingMap: Record<LyricsSpacing, string> = {
	compact: 'space-y-0',
	normal: 'space-y-1',
	relaxed: 'space-y-4'
};
