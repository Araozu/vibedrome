<script lang="ts">
	import { cn } from '$lib/utils';
	import * as Popover from '$lib/components/ui/popover';
	import {
		getLyricsPrefs,
		setLyricsFontSize,
		setLyricsTextAlign,
		setLyricsSpacing,
		setLyricsCustomFontSize,
		type LyricsFontSize,
		type LyricsTextAlign,
		type LyricsSpacing
	} from '$lib/lyrics-prefs-store.svelte';
	import SlidersIcon from 'phosphor-svelte/lib/Sliders';
	import TextAlignLeftIcon from 'phosphor-svelte/lib/TextAlignLeft';
	import TextAlignCenterIcon from 'phosphor-svelte/lib/TextAlignCenter';
	import TextAlignRightIcon from 'phosphor-svelte/lib/TextAlignRight';
	import type { Component } from 'svelte';

	const prefs = $derived(getLyricsPrefs());

	// Local input value – kept in sync with persisted prefs via $effect below
	let inputValue = $state('');

	$effect(() => {
		inputValue = prefs.customFontSizePt?.toString() ?? '';
	});

	function handlePtInput(e: Event) {
		const raw = (e.currentTarget as HTMLInputElement).value;
		inputValue = raw;
		const val = parseInt(raw, 10);
		if (!isNaN(val) && val >= 8 && val <= 96) {
			setLyricsCustomFontSize(val);
		}
	}

	function handlePtBlur() {
		const val = parseInt(inputValue, 10);
		if (isNaN(val) || val < 8) {
			// Invalid – revert to whatever is persisted (or empty if preset mode)
			inputValue = prefs.customFontSizePt?.toString() ?? '';
		} else {
			const clamped = Math.min(96, val);
			inputValue = clamped.toString();
			setLyricsCustomFontSize(clamped);
		}
	}

	const fontSizes: { value: LyricsFontSize; label: string }[] = [
		{ value: 'sm', label: 'S' },
		{ value: 'base', label: 'M' },
		{ value: 'lg', label: 'L' },
		{ value: 'xl', label: 'XL' }
	];

	const alignments: {
		value: LyricsTextAlign;
		icon: Component<{ class?: string }>;
		label: string;
	}[] = [
		{ value: 'left', icon: TextAlignLeftIcon, label: 'Left' },
		{ value: 'center', icon: TextAlignCenterIcon, label: 'Center' },
		{ value: 'right', icon: TextAlignRightIcon, label: 'Right' }
	];

	const spacings: { value: LyricsSpacing; label: string }[] = [
		{ value: 'compact', label: 'Compact' },
		{ value: 'normal', label: 'Normal' },
		{ value: 'relaxed', label: 'Relaxed' }
	];
</script>

<Popover.Root>
	<Popover.Trigger>
		{#snippet child({ props })}
			<button
				{...props}
				class={cn(
					'inline-flex size-7 items-center justify-center rounded-md transition-colors',
					'text-muted-foreground hover:bg-accent hover:text-foreground'
				)}
				aria-label="Lyrics display settings"
			>
				<SlidersIcon class="size-4" />
			</button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content align="end" class="w-56">
		<div class="flex flex-col gap-3">
			<!-- Font size -->
			<div class="flex flex-col gap-1.5">
				<p class="text-xs font-medium text-muted-foreground">Font size</p>
				<!-- Presets -->
				<div class="flex gap-1">
					{#each fontSizes as { value, label } (value)}
						<button
							class={cn(
								'flex h-7 flex-1 items-center justify-center rounded-md text-xs font-medium transition-colors',
								prefs.customFontSizePt === null && prefs.fontSize === value
									? 'bg-primary text-primary-foreground'
									: 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
							)}
							onclick={() => setLyricsFontSize(value)}
						>
							{label}
						</button>
					{/each}
				</div>
				<!-- Manual pt input -->
				<div class="flex items-center gap-1.5">
					<input
						type="number"
						min="8"
						max="96"
						placeholder="—"
						value={inputValue}
						oninput={handlePtInput}
						onblur={handlePtBlur}
						class={cn(
							'h-7 w-full rounded-md border bg-background px-2 text-xs text-foreground placeholder:text-muted-foreground',
							'focus:ring-1 focus:outline-none',
							prefs.customFontSizePt !== null
								? 'border-primary focus:ring-primary'
								: 'border-border focus:ring-ring'
						)}
						aria-label="Custom font size in points"
					/>
					<span class="shrink-0 text-xs text-muted-foreground">pt</span>
				</div>
			</div>

			<!-- Text alignment -->
			<div class="flex flex-col gap-1.5">
				<p class="text-xs font-medium text-muted-foreground">Alignment</p>
				<div class="flex gap-1">
					{#each alignments as { value, icon: Icon, label } (value)}
						<button
							class={cn(
								'flex h-7 flex-1 items-center justify-center rounded-md transition-colors',
								prefs.textAlign === value
									? 'bg-primary text-primary-foreground'
									: 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
							)}
							onclick={() => setLyricsTextAlign(value)}
							aria-label={label}
						>
							<Icon class="size-3.5" />
						</button>
					{/each}
				</div>
			</div>

			<!-- Spacing -->
			<div class="flex flex-col gap-1.5">
				<p class="text-xs font-medium text-muted-foreground">Spacing</p>
				<div class="flex gap-1">
					{#each spacings as { value, label } (value)}
						<button
							class={cn(
								'flex h-7 flex-1 items-center justify-center rounded-md text-xs font-medium transition-colors',
								prefs.spacing === value
									? 'bg-primary text-primary-foreground'
									: 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
							)}
							onclick={() => setLyricsSpacing(value)}
						>
							{label}
						</button>
					{/each}
				</div>
			</div>
		</div>
	</Popover.Content>
</Popover.Root>
