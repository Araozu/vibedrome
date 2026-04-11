<script lang="ts">
	import { getActiveServer } from '$lib/server-store.svelte';
</script>

<div class="space-y-4">
	<h1 class="text-2xl font-bold tracking-tight text-foreground">Home</h1>

	{#if getActiveServer()}
		<p class="text-muted-foreground">
			Connected to <span class="font-medium text-foreground">{getActiveServer()?.name}</span>
		</p>
	{:else}
		<p class="text-muted-foreground">
			No server selected. Go to <a
				href="/settings"
				class="text-primary underline underline-offset-4">Settings</a
			> to add one.
		</p>
	{/if}
</div>
