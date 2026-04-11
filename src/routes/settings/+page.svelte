<script lang="ts">
	import {
		getServers,
		getActiveId,
		setActiveId,
		addServer,
		updateServer,
		removeServer,
		type StoredServer
	} from '$lib/server-store.svelte';
	import { ping } from '$lib/subsonic';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import PencilIcon from 'phosphor-svelte/lib/PencilSimple';
	import TrashIcon from 'phosphor-svelte/lib/Trash';
	import PlusIcon from 'phosphor-svelte/lib/Plus';
	import CheckCircleIcon from 'phosphor-svelte/lib/CheckCircle';
	import WarningIcon from 'phosphor-svelte/lib/Warning';

	// Dialog state
	let dialogOpen = $state(false);
	let editingId = $state<string | null>(null);

	// Form fields
	let formName = $state('');
	let formUrl = $state('');
	let formUser = $state('');
	let formPassword = $state('');
	let formError = $state<string | null>(null);
	let formLoading = $state(false);
	let testResult = $state<'success' | 'error' | null>(null);
	let testMessage = $state('');

	function openAddDialog() {
		editingId = null;
		formName = '';
		formUrl = '';
		formUser = '';
		formPassword = '';
		formError = null;
		testResult = null;
		testMessage = '';
		dialogOpen = true;
	}

	function openEditDialog(server: StoredServer) {
		editingId = server.id;
		formName = server.name;
		formUrl = server.url;
		formUser = server.user;
		formPassword = server.password;
		formError = null;
		testResult = null;
		testMessage = '';
		dialogOpen = true;
	}

	async function testConnection() {
		testResult = null;
		testMessage = '';
		formLoading = true;

		try {
			await ping({ url: formUrl.trim(), user: formUser.trim(), password: formPassword });
			testResult = 'success';
			testMessage = 'Connection successful';
		} catch (e) {
			testResult = 'error';
			testMessage = e instanceof Error ? e.message : String(e);
		} finally {
			formLoading = false;
		}
	}

	function saveServer() {
		formError = null;

		const name = formName.trim();
		const url = formUrl.trim();
		const user = formUser.trim();
		const password = formPassword;

		if (!name || !url || !user || !password) {
			formError = 'All fields are required.';
			return;
		}

		if (editingId) {
			updateServer(editingId, { name, url, user, password });
		} else {
			addServer({ name, url, user, password });
		}

		dialogOpen = false;
	}

	function handleRemove(id: string) {
		removeServer(id);
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
			<p class="mt-1 text-muted-foreground">Manage your Navidrome server connections.</p>
		</div>
	</div>

	<Separator />

	<section class="space-y-4">
		<div class="flex items-center justify-between">
			<h2 class="text-lg font-semibold text-foreground">Servers</h2>
			<Button size="sm" onclick={openAddDialog}>
				<PlusIcon class="size-4" />
				Add Server
			</Button>
		</div>

		{#if getServers().length === 0}
			<Card.Root>
				<Card.Content class="py-8 text-center">
					<p class="text-muted-foreground">No servers configured yet.</p>
					<Button variant="outline" class="mt-4" onclick={openAddDialog}>
						<PlusIcon class="size-4" />
						Add your first server
					</Button>
				</Card.Content>
			</Card.Root>
		{:else}
			<div class="grid gap-3">
				{#each getServers() as server}
					<Card.Root
						class={getActiveId() === server.id ? 'border-primary/50 ring-2 ring-primary/20' : ''}
					>
						<Card.Header>
							<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
								<div class="min-w-0">
									<Card.Title class="text-sm">{server.name}</Card.Title>
									<Card.Description class="truncate">
										{server.url} &middot; {server.user}
									</Card.Description>
								</div>
								<div class="flex items-center gap-1">
									{#if getActiveId() !== server.id}
										<Button variant="outline" size="sm" onclick={() => setActiveId(server.id)}>
											Set Active
										</Button>
									{:else}
										<span
											class="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
										>
											Active
										</span>
									{/if}
									<Button variant="ghost" size="icon" onclick={() => openEditDialog(server)}>
										<PencilIcon class="size-4" />
									</Button>
									<Button variant="ghost" size="icon" onclick={() => handleRemove(server.id)}>
										<TrashIcon class="size-4" />
									</Button>
								</div>
							</div>
						</Card.Header>
					</Card.Root>
				{/each}
			</div>
		{/if}
	</section>
</div>

<!-- Add / Edit Server Dialog -->
<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>{editingId ? 'Edit Server' : 'Add Server'}</Dialog.Title>
			<Dialog.Description>
				{editingId
					? 'Update the connection details for this server.'
					: 'Enter the connection details for your Navidrome server.'}
			</Dialog.Description>
		</Dialog.Header>

		<form
			class="grid gap-4"
			onsubmit={(e) => {
				e.preventDefault();
				saveServer();
			}}
		>
			<div class="grid gap-2">
				<Label for="server-name">Name</Label>
				<Input id="server-name" placeholder="My Navidrome" bind:value={formName} required />
			</div>

			<div class="grid gap-2">
				<Label for="server-url">Server URL</Label>
				<Input
					id="server-url"
					type="url"
					placeholder="https://navidrome.example.com"
					bind:value={formUrl}
					required
				/>
			</div>

			<div class="grid gap-2">
				<Label for="server-user">Username</Label>
				<Input
					id="server-user"
					placeholder="admin"
					bind:value={formUser}
					autocomplete="username"
					required
				/>
			</div>

			<div class="grid gap-2">
				<Label for="server-password">Password</Label>
				<Input
					id="server-password"
					type="password"
					bind:value={formPassword}
					autocomplete="current-password"
					required
				/>
			</div>

			{#if formError}
				<p class="text-sm text-destructive">{formError}</p>
			{/if}

			{#if testResult === 'success'}
				<div class="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
					<CheckCircleIcon class="size-4" />
					{testMessage}
				</div>
			{:else if testResult === 'error'}
				<div class="flex items-center gap-2 text-sm text-destructive">
					<WarningIcon class="size-4" />
					{testMessage}
				</div>
			{/if}

			<Dialog.Footer class="gap-2 sm:gap-0">
				<Button type="button" variant="outline" onclick={testConnection} disabled={formLoading}>
					{formLoading ? 'Testing...' : 'Test Connection'}
				</Button>
				<Button type="submit">
					{editingId ? 'Save Changes' : 'Add Server'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
