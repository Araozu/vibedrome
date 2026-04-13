<script lang="ts">
	import { page } from '$app/state';
	import { cn } from '$lib/utils';
	import { getServers, getActiveId, setActiveId } from '$lib/server-store.svelte';
	import { themes, getActiveTheme, setActiveTheme } from '$lib/theme-store.svelte';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import ThemeSelector from '$lib/components/ThemeSelector.svelte';
	import CoverImage from '$lib/components/CoverImage.svelte';
	import {
		getCurrentSong,
		isPlaying,
		togglePlay,
		next,
		prev,
		getCurrentTime,
		getDuration,
		seek,
		getHasNext,
		getHasPrev,
		getCurrentCoverArtUrl,
		setExpanded
	} from '$lib/player-store.svelte';
	import ServerIcon from 'phosphor-svelte/lib/HardDrives';
	import ListIcon from 'phosphor-svelte/lib/List';
	import XIcon from 'phosphor-svelte/lib/X';
	import HouseIcon from 'phosphor-svelte/lib/House';
	import MusicNotesIcon from 'phosphor-svelte/lib/MusicNotes';
	import MicrophoneIcon from 'phosphor-svelte/lib/Microphone';
	import GearIcon from 'phosphor-svelte/lib/Gear';
	import PaletteIcon from 'phosphor-svelte/lib/Palette';
	import CaretDownIcon from 'phosphor-svelte/lib/CaretDown';
	import CheckIcon from 'phosphor-svelte/lib/Check';
	import MusicNoteIcon from 'phosphor-svelte/lib/MusicNote';
	import PlayIcon from 'phosphor-svelte/lib/Play';
	import PauseIcon from 'phosphor-svelte/lib/Pause';
	import SkipForwardIcon from 'phosphor-svelte/lib/SkipForward';
	import SkipBackIcon from 'phosphor-svelte/lib/SkipBack';

	const navItems = [
		{ href: '/', label: 'Home', icon: HouseIcon, exact: true },
		{ href: '/albums', label: 'Albums', icon: MusicNotesIcon },
		{ href: '/artists', label: 'Artists', icon: MicrophoneIcon },
		{ href: '/settings', label: 'Settings', icon: GearIcon }
	];

	let selectValue = $state(getActiveId() ?? '');
	let mobileOpen = $state(false);
	let themeOpen = $state(false);

	// Seek state for the sidebar player card
	let seeking = $state(false);
	let seekValue = $state(0);

	const sidebarProgress = $derived(
		getDuration() > 0 ? (getCurrentTime() / getDuration()) * 100 : 0
	);

	function handleSeekStart(e: MouseEvent | TouchEvent) {
		seeking = true;
		handleSeekMove(e);
	}

	function handleSeekMove(e: MouseEvent | TouchEvent) {
		if (!seeking) return;
		const target = (e.currentTarget ?? e.target) as HTMLElement;
		const bar = target.closest('[data-seek-bar-sidebar]') as HTMLElement | null;
		if (!bar) return;
		const rect = bar.getBoundingClientRect();
		const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
		const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
		seekValue = pct * 100;
	}

	function handleSeekEnd() {
		if (!seeking) return;
		seeking = false;
		const dur = getDuration();
		if (dur > 0) {
			seek((seekValue / 100) * dur);
		}
	}

	$effect(() => {
		const id = getActiveId();
		selectValue = id ?? '';
	});

	$effect(() => {
		page.url.pathname;
		mobileOpen = false;
	});

	function handleServerChange(val: string) {
		selectValue = val;
		setActiveId(val || null);
	}

	function isActive(item: { href: string; exact?: boolean }) {
		if (item.exact) return page.url.pathname === item.href;
		return page.url.pathname.startsWith(item.href);
	}

	const navLinkClass =
		'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors text-muted-foreground hover:bg-accent/50 hover:text-foreground';
</script>

<svelte:window
	onmousemove={handleSeekMove}
	onmouseup={handleSeekEnd}
	ontouchmove={handleSeekMove}
	ontouchend={handleSeekEnd}
/>

<!-- Desktop sidebar -->
<aside
	class="sticky top-0 hidden h-svh w-56 shrink-0 flex-col border-r border-border bg-background sm:flex"
>
	<!-- Logo -->
	<div class="border-b border-border px-4 py-5">
		<a href="/" class="text-sm font-semibold tracking-tight text-foreground">Vibedrome</a>
	</div>

	<!-- Nav + secondary controls -->
	<nav class="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
		{#each navItems as item}
			{@const Icon = item.icon}
			{@const active = isActive(item)}
			<a
				href={item.href}
				class={cn(
					'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
					active
						? 'bg-accent text-accent-foreground'
						: 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
				)}
			>
				<Icon class="size-4 shrink-0" />
				{item.label}
			</a>
		{/each}

		<!-- Separator -->
		<div class="my-1 border-t border-border" role="separator"></div>

		<!-- Server selector -->
		{#if getServers().length > 0}
			<Select.Root
				type="single"
				value={selectValue}
				onValueChange={(val) => handleServerChange(val)}
			>
				<Select.Trigger
					class="h-auto w-full justify-start gap-3 rounded-md border-0 bg-transparent px-3 py-2 text-sm font-medium text-muted-foreground shadow-none hover:bg-accent/50 hover:text-foreground focus-visible:ring-0 [&>svg:last-child]:ml-auto"
				>
					<ServerIcon class="size-4 shrink-0" />
					{#if getActiveId() && getServers().find((s) => s.id === getActiveId())}
						{getServers().find((s) => s.id === getActiveId())?.name}
					{:else}
						No server
					{/if}
				</Select.Trigger>
				<Select.Content>
					{#each getServers() as server}
						<Select.Item value={server.id} label={server.name} />
					{/each}
				</Select.Content>
			</Select.Root>
		{/if}

		<!-- Theme selector -->
		<Popover.Root bind:open={themeOpen}>
			<Popover.Trigger class={cn(navLinkClass, 'justify-between')}>
				<span class="flex items-center gap-3">
					<PaletteIcon class="size-4 shrink-0" />
					{themes.find((t) => t.id === getActiveTheme())?.label ?? 'Theme'}
				</span>
				<CaretDownIcon
					class={cn('size-3.5 shrink-0 transition-transform', themeOpen && 'rotate-180')}
				/>
			</Popover.Trigger>
			<Popover.Content class="w-48 gap-0 p-1" align="start" side="right">
				{#each themes as theme}
					<button
						type="button"
						class={cn(
							'relative flex w-full cursor-default items-center rounded-md px-2 py-1.5 text-xs/relaxed outline-hidden select-none hover:bg-accent hover:text-accent-foreground',
							getActiveTheme() === theme.id && 'bg-accent text-accent-foreground'
						)}
						onclick={() => {
							setActiveTheme(theme.id);
							themeOpen = false;
						}}
					>
						<span class="mr-6">{theme.label}</span>
						{#if getActiveTheme() === theme.id}
							<CheckIcon class="absolute end-2 size-3.5" />
						{/if}
					</button>
				{/each}
			</Popover.Content>
		</Popover.Root>
	</nav>

	<!-- Player card (full bottom) -->
	{#if getCurrentSong()}
		{@const song = getCurrentSong()!}
		{@const coverUrl = getCurrentCoverArtUrl()}

		<div class="border-t border-border">
			<!-- Full-width cover art -->
			<button
				class="relative block w-full cursor-pointer bg-muted"
				style="aspect-ratio: 1"
				onclick={() => setExpanded(true)}
				aria-label="Open player"
			>
				{#if coverUrl}
					<CoverImage src={coverUrl} alt={song.title} class="h-full w-full object-cover" />
				{:else}
					<div class="flex h-full w-full items-center justify-center">
						<MusicNoteIcon class="size-12 text-muted-foreground" />
					</div>
				{/if}
			</button>

			<!-- Song info -->
			<div class="px-3 pt-2.5 pb-1">
				<button class="w-full text-left" onclick={() => setExpanded(true)}>
					<p class="truncate text-sm font-semibold text-foreground">{song.title}</p>
					<p class="truncate text-xs text-muted-foreground">{song.artist}</p>
				</button>

				<!-- Controls -->
				<div class="mt-2 flex items-center justify-center gap-1">
					<button
						class={cn(
							'inline-flex size-7 items-center justify-center rounded-full transition-colors',
							getHasPrev() ? 'text-foreground hover:bg-accent' : 'text-muted-foreground/40'
						)}
						onclick={prev}
						aria-label="Previous"
					>
						<SkipBackIcon class="size-4" weight="fill" />
					</button>
					<button
						class="inline-flex size-9 items-center justify-center rounded-full bg-foreground text-background transition-colors hover:bg-foreground/90"
						onclick={togglePlay}
						aria-label={isPlaying() ? 'Pause' : 'Play'}
					>
						{#if isPlaying()}
							<PauseIcon class="size-4" weight="fill" />
						{:else}
							<PlayIcon class="size-4" weight="fill" />
						{/if}
					</button>
					<button
						class={cn(
							'inline-flex size-7 items-center justify-center rounded-full transition-colors',
							getHasNext() ? 'text-foreground hover:bg-accent' : 'text-muted-foreground/40'
						)}
						onclick={next}
						aria-label="Next"
					>
						<SkipForwardIcon class="size-4" weight="fill" />
					</button>
				</div>
			</div>

			<!-- Seek bar -->
			<div
				data-seek-bar-sidebar
				class="mt-1.5 h-1 w-full cursor-pointer bg-muted"
				onmousedown={handleSeekStart}
				ontouchstart={handleSeekStart}
				role="slider"
				aria-label="Seek"
				aria-valuenow={Math.round(getCurrentTime())}
				aria-valuemin={0}
				aria-valuemax={Math.round(getDuration())}
				tabindex={0}
				onkeydown={(e) => {
					if (e.key === 'ArrowRight') seek(getCurrentTime() + 5);
					if (e.key === 'ArrowLeft') seek(getCurrentTime() - 5);
				}}
			>
				<div
					class="pointer-events-none h-full bg-primary transition-[width]"
					style="width: {seeking ? seekValue : sidebarProgress}%"
				></div>
			</div>
		</div>
	{/if}
</aside>

<!-- Mobile: sticky top bar -->
<header
	class="flex h-12 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-lg sm:hidden"
>
	<a href="/" class="text-sm font-semibold tracking-tight text-foreground">Vibedrome</a>
	<div class="flex-1"></div>
	<Button
		variant="ghost"
		size="icon"
		onclick={() => (mobileOpen = !mobileOpen)}
		aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
	>
		{#if mobileOpen}
			<XIcon class="size-5" />
		{:else}
			<ListIcon class="size-5" />
		{/if}
	</Button>
</header>

<!-- Mobile drawer -->
{#if mobileOpen}
	<div
		class="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm sm:hidden"
		onclick={() => (mobileOpen = false)}
		role="presentation"
	></div>

	<aside
		class="fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-background sm:hidden"
	>
		<div class="flex h-12 items-center justify-between border-b border-border px-4">
			<a href="/" class="text-sm font-semibold tracking-tight text-foreground">Vibedrome</a>
			<Button
				variant="ghost"
				size="icon"
				onclick={() => (mobileOpen = false)}
				aria-label="Close menu"
			>
				<XIcon class="size-5" />
			</Button>
		</div>

		<nav class="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
			{#each navItems as item}
				{@const Icon = item.icon}
				{@const active = isActive(item)}
				<a
					href={item.href}
					class={cn(
						'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
						active
							? 'bg-accent text-accent-foreground'
							: 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
					)}
				>
					<Icon class="size-4 shrink-0" />
					{item.label}
				</a>
			{/each}
		</nav>

		<div class="flex flex-col gap-3 border-t border-border p-4">
			{#if getServers().length > 0}
				<div class="flex flex-col gap-1.5">
					<div class="flex items-center gap-2">
						<ServerIcon class="size-3.5 text-muted-foreground" />
						<span class="text-xs text-muted-foreground">Server</span>
					</div>
					<Select.Root
						type="single"
						value={selectValue}
						onValueChange={(val) => handleServerChange(val)}
					>
						<Select.Trigger class="w-full">
							{#if getActiveId() && getServers().find((s) => s.id === getActiveId())}
								{getServers().find((s) => s.id === getActiveId())?.name}
							{:else}
								<span class="text-muted-foreground">No server</span>
							{/if}
						</Select.Trigger>
						<Select.Content>
							{#each getServers() as server}
								<Select.Item value={server.id} label={server.name} />
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
			{/if}
			<ThemeSelector />
		</div>
	</aside>
{/if}
