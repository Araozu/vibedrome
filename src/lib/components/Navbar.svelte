<script lang="ts">
	import { page } from '$app/state';
	import { cn } from '$lib/utils';
	import { getServers, getActiveId, setActiveId } from '$lib/server-store.svelte';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import ServerIcon from 'phosphor-svelte/lib/HardDrives';
	import ListIcon from 'phosphor-svelte/lib/List';
	import XIcon from 'phosphor-svelte/lib/X';

	const navItems = [
		{ href: '/albums', label: 'Albums' },
		{ href: '/artists', label: 'Artists' },
		{ href: '/settings', label: 'Settings' }
	];

	let selectValue = $state(getActiveId() ?? '');
	let mobileMenuOpen = $state(false);

	$effect(() => {
		const id = getActiveId();
		selectValue = id ?? '';
	});

	function handleServerChange(val: string) {
		selectValue = val;
		setActiveId(val || null);
	}
</script>

<nav class="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
	<div class="mx-auto flex h-12 w-full max-w-7xl items-center gap-6 px-4">
		<!-- App name / Home link -->
		<a href="/" class="text-sm font-semibold tracking-tight text-foreground">Vibedrome</a>

		<!-- Desktop nav links -->
		<div class="hidden items-center gap-1 sm:flex">
			{#each navItems as item}
				<a
					href={item.href}
					class={cn(
						'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
						page.url.pathname.startsWith(item.href)
							? 'bg-accent text-accent-foreground'
							: 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
					)}
				>
					{item.label}
				</a>
			{/each}
		</div>

		<!-- Spacer -->
		<div class="flex-1"></div>

		<!-- Server selector (desktop) -->
		{#if getServers().length > 0}
			<div class="hidden items-center gap-2 sm:flex">
				<ServerIcon class="size-4 text-muted-foreground" />
				<Select.Root
					type="single"
					value={selectValue}
					onValueChange={(val) => handleServerChange(val)}
				>
					<Select.Trigger class="w-[160px]">
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

		<!-- Mobile menu toggle -->
		<Button
			variant="ghost"
			size="icon"
			class="sm:hidden"
			onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
			aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
		>
			{#if mobileMenuOpen}
				<XIcon class="size-5" />
			{:else}
				<ListIcon class="size-5" />
			{/if}
		</Button>
	</div>

	<!-- Mobile menu -->
	{#if mobileMenuOpen}
		<div class="border-t border-border bg-background px-4 pt-2 pb-4 sm:hidden">
			<div class="flex flex-col gap-1">
				{#each navItems as item}
					<a
						href={item.href}
						onclick={() => (mobileMenuOpen = false)}
						class={cn(
							'rounded-md px-3 py-2 text-sm font-medium transition-colors',
							page.url.pathname.startsWith(item.href)
								? 'bg-accent text-accent-foreground'
								: 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
						)}
					>
						{item.label}
					</a>
				{/each}
			</div>

			{#if getServers().length > 0}
				<div class="mt-3 flex items-center gap-2 border-t border-border pt-3">
					<ServerIcon class="size-4 text-muted-foreground" />
					<Select.Root
						type="single"
						value={selectValue}
						onValueChange={(val) => handleServerChange(val)}
					>
						<Select.Trigger class="flex-1">
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
		</div>
	{/if}
</nav>
