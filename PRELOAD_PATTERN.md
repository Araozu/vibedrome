# SvelteKit Preload + TanStack Query Placeholder Pattern

Combine SvelteKit's `data-sveltekit-preload-data="hover"` with TanStack Query's `placeholderData` to get instant page transitions. SvelteKit fires the `+page.ts` `load` on hover; by the time the user clicks, the data is already fetched and the UI renders immediately with no loading state.

## How it works

1. `app.html` has `data-sveltekit-preload-data="hover"` on `<body>`, so SvelteKit calls every `+page.ts` `load` when the user **hovers** a link.
2. `+page.ts` fetches the data and returns an **unwrapped promise** (not awaited) so the page can render a skeleton while the fetch completes.
3. `+page.svelte` receives the resolved data via `PageProps` and passes it as `placeholderData` to a TanStack Query hook.
4. The query hook uses it to render instantly, then silently re-validates in the background when stale.

## Files involved

```
routes/.../[id]/
  +page.ts        -- SvelteKit load: fetch & return promise
  queries.ts      -- TanStack Query hook accepting placeholderData
  +page.svelte    -- Wires load data into the query, renders views/skeletons
```

## Usage

### 1. `+page.ts` -- preload the data

Return an **unawaited** promise so SvelteKit streams the page shell immediately.

```ts
import type { PageLoad } from './$types';
import type { components } from '~/api';

type MyDto = components['schemas']['MyDto'];

export const load: PageLoad = async ({ params, fetch }) => {
	const dataPromise = fetch(`/api/things/${params.id}`, {
		credentials: 'include'
	}).then((res) => res.json() as Promise<MyDto>);

	return { dataPromise };
};
```

### 2. `queries.ts` -- define the query with `placeholderData`

Accept a reactive `placeholderData` store. The query key must match whatever other code might share this cache entry.

```ts
import { createQuery } from '@tanstack/svelte-query';
import { derived, type Readable } from 'svelte/store';

export function useMyQuery($id: Readable<string>, $placeholderData: Readable<MyDto>) {
	const query = createQuery(
		derived([$id, $placeholderData], ([id, placeholderData]) => ({
			queryKey: ['things', id],
			queryFn: async () => {
				const res = await fetch(`/api/Things/${id}`, {
					credentials: 'include'
				});
				if (!res.ok) throw await res.json();
				return (await res.json()) as MyDto;
			},
			staleTime: 5 * 60 * 1000,
			placeholderData,
			refetchOnWindowFocus: false
		}))
	);
	return query;
}
```

### 3. `+page.svelte` -- wire it together

Use `{#await}` to show a skeleton until the promise resolves, then pass the resolved data into the query.

```svelte
<script lang="ts">
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
</script>

{#await data.dataPromise}
	<MySkeleton />
{:then preloaded}
	<!-- preloaded is immediately available; the query re-validates silently -->
	<MyView data={preloaded} />
{:catch error}
	<ErrorState {error} />
{/await}
```

## Why this works well

- **Hover = prefetch**: The `load` fires ~200-400ms before click. Most API calls resolve in that window.
- **No waterfall**: The fetch starts before the page component even mounts.
- **Skeleton only on slow networks**: `{#await}` shows the skeleton only if the promise hasn't resolved yet.
- **Cache sharing**: Because the data lands in TanStack Query's cache, other components using the same query key get it for free.
- **Background re-validation**: TanStack Query will silently refetch once the data is stale, so the user always sees fresh data after the initial paint.
