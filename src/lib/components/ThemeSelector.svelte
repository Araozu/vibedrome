<script lang="ts">
	import { cn } from '$lib/utils';
	import { themes, getActiveTheme, setActiveTheme } from '$lib/theme-store.svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import PaletteIcon from 'phosphor-svelte/lib/Palette';
	import CaretDownIcon from 'phosphor-svelte/lib/CaretDown';
	import CheckIcon from 'phosphor-svelte/lib/Check';

	let open = $state(false);
</script>

<div class="flex items-center gap-2">
	<PaletteIcon class="size-4 text-muted-foreground" />
	<Popover.Root bind:open>
		<Popover.Trigger
			class={cn(
				'flex h-7 w-[160px] items-center justify-between gap-1.5 rounded-md border border-input bg-input/20 px-2 py-1.5 text-xs/relaxed whitespace-nowrap transition-colors outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30 dark:hover:bg-input/50'
			)}
		>
			<span class="truncate">
				{themes.find((t) => t.id === getActiveTheme())?.label ?? 'Select theme'}
			</span>
			<CaretDownIcon class="pointer-events-none size-3.5 text-muted-foreground" />
		</Popover.Trigger>
		<Popover.Content class="w-[200px] gap-0 p-1" align="end">
			{#each themes as theme}
				<button
					type="button"
					class={cn(
						'relative flex w-full cursor-default items-center rounded-md px-2 py-1.5 text-xs/relaxed outline-hidden select-none hover:bg-accent hover:text-accent-foreground',
						getActiveTheme() === theme.id && 'bg-accent text-accent-foreground'
					)}
					onclick={() => setActiveTheme(theme.id)}
				>
					<span class="mr-6">{theme.label}</span>
					{#if getActiveTheme() === theme.id}
						<CheckIcon class="absolute end-2 size-3.5" />
					{/if}
				</button>
			{/each}
		</Popover.Content>
	</Popover.Root>
</div>
