<script lang="ts">
	import { page } from '$app/state';
	import { cn } from '$lib/utils';
	import { getServers, getActiveId, setActiveId } from '$lib/server-store.svelte';
	import * as Select from '$lib/components/ui/select/index.js';
	import ServerIcon from 'phosphor-svelte/lib/HardDrives';

	const navItems = [
		{ href: '/albums', label: 'Albums' },
		{ href: '/artists', label: 'Artists' },
		{ href: '/settings', label: 'Settings' }
	];

	let selectValue = $state(getActiveId() ?? '');

	$effect(() => {
		const id = getActiveId();
		selectValue = id ?? '';
	});

	function handleServerChange(val: string) {
		selectValue = val;
		setActiveId(val || null);
	}
</script>

<nav
	class="sticky top-0 z-50 flex h-12 items-center border-b border-border bg-background/80 backdrop-blur-lg"
>
	<div class="mx-auto flex w-full max-w-7xl items-center gap-6 px-4">
		<!-- App name / Home link -->
		<a href="/" class="text-sm font-semibold tracking-tight text-foreground">Vibedrome</a>

		<!-- Nav links -->
		<div class="flex items-center gap-1">
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

		<!-- Server selector -->
		{#if getServers().length > 0}
			<div class="flex items-center gap-2">
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
	</div>
</nav>
