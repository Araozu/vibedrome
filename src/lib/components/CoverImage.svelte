<script lang="ts">
	import { cn } from '$lib/utils';

	let { src, alt, class: className }: { src: string; alt: string; class?: string } = $props();

	let loaded = $state(false);
</script>

<img
	{src}
	{alt}
	class={cn(
		'h-full w-full object-cover transition-opacity duration-200',
		loaded ? 'opacity-100' : 'opacity-0',
		className
	)}
	onload={() => (loaded = true)}
/>
