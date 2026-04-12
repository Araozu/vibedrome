# Agents

## Project Overview

**viesglo/frontend** -- a SvelteKit single-page application. Client-only, no SSR. Static adapter produces a pre-rendered SPA.

## Tech Stack

| Layer         | Technology                                                                          |
| ------------- | ----------------------------------------------------------------------------------- |
| Framework     | SvelteKit 2 with **Svelte 5** (runes mode enforced)                                 |
| Adapter       | `@sveltejs/adapter-static` (client-only, no SSR)                                    |
| Language      | TypeScript (strict mode)                                                            |
| Styling       | Tailwind CSS v4 (via `@tailwindcss/vite` plugin)                                    |
| Component lib | **shadcn-svelte** (Mira style, Neutral base color, Lucide icons)                    |
| Animations    | `tw-animate-css`                                                                    |
| API types     | **openapi-typescript** (generates `schema.d.ts` from backend OpenAPI doc)           |
| Data fetching | **TanStack Query v6** (`@tanstack/svelte-query`, `@tanstack/svelte-query-devtools`) |
| Utilities     | `clsx` + `tailwind-merge` (via `cn()` helper), `tailwind-variants`                  |
| Icons         | `@lucide/svelte`                                                                    |
| Font          | Inter Variable (`@fontsource-variable/inter`)                                       |
| Package mgr   | pnpm (workspace enabled)                                                            |
| Linting       | ESLint (flat config) + Prettier                                                     |
| Build         | Vite 8                                                                              |

## Critical Rules

### No SSR

This is a **client-only SPA**. There is no server-side rendering.

- The adapter is `@sveltejs/adapter-static`. Never switch to a server adapter.
- Do not create `+page.server.ts`, `+layout.server.ts`, or server-side `load` functions.
- Do not use `+server.ts` API routes.
- All data fetching happens client-side via **TanStack Query** (see Data Fetching section below).
- Browser APIs (`window`, `document`, `localStorage`, etc.) are safe to use directly in components -- there is no server context to worry about.

### Svelte 5 Runes Mode

Runes mode is **enforced project-wide** via `svelte.config.js`. All components must use runes syntax.

- Use `$state()`, `$derived()`, `$effect()`, `$props()`, `$bindable()` -- never legacy `let` reactivity, `$:`, `export let`, `createEventDispatcher`, or stores for component-local state.
- Use `{@render children()}` for slot content -- never `<slot />`.
- Use `$inspect()` for debugging -- never `console.log` in reactive contexts.
- Snippets (`{#snippet}`) replace named slots.

### Styling -- No Hardcoded Colors

**Never hardcode color values.** All colors must come from CSS custom properties via Tailwind's theme tokens.

- Use semantic Tailwind classes that reference the CSS variable palette: `bg-background`, `text-foreground`, `bg-primary`, `text-primary-foreground`, `bg-muted`, `text-muted-foreground`, `border-border`, `bg-destructive`, `bg-card`, `text-card-foreground`, `bg-popover`, `bg-accent`, `text-accent-foreground`, `bg-secondary`, `text-secondary-foreground`, etc.
- The full set of available color tokens is defined in `src/routes/layout.css` under `:root` and `.dark`, then mapped in the `@theme inline` block.
- Never use raw Tailwind color classes like `bg-red-500`, `text-gray-700`, `border-blue-300`, etc.
- Never use inline `style="color: #xxx"` or any hex/rgb/hsl/oklch literals outside of `layout.css` theme definitions.
- If a new semantic color is needed, add a CSS variable to `:root` / `.dark` in `layout.css` and map it in `@theme inline`.
- Dark mode is class-based (`.dark` on a parent element). The custom variant is `@custom-variant dark (&:is(.dark *))`.

### shadcn-svelte Components

- **Always prefer shadcn-svelte components** over building custom UI primitives. Before creating a new component, check if shadcn-svelte provides one.
- Install new shadcn components via: `pnpm dlx shadcn-svelte@latest add <component>`
- shadcn components live in `$lib/components/ui/`.
- Custom (non-shadcn) components go in `$lib/components/` (not inside `ui/`).
- The shadcn configuration uses the **Mira** style with **Neutral** base color. Refer to `components.json` for full config.
- Use `tailwind-variants` for component variant definitions when building custom components -- this is already a project dependency.

## Directory Structure

```
src/
  app.html              # HTML shell
  app.d.ts              # Global type declarations
  lib/
    index.ts            # Public $lib exports
    utils.ts            # cn() helper + shared TS types
    assets/             # Static assets imported by components (favicon, etc.)
    components/
      ui/               # shadcn-svelte components (auto-managed, do not manually edit)
    hooks/              # Svelte 5 rune-based hooks / composables
    api/
      schema.d.ts       # Auto-generated OpenAPI types (do NOT edit manually)
    queries/            # TanStack Query queryOptions definitions
    mutations/          # TanStack Query mutationOptions definitions
  routes/
    layout.css          # Global CSS: Tailwind imports, CSS variables, base styles
    +layout.svelte      # Root layout (imports layout.css, QueryClientProvider)
    +page.svelte        # Home page
    ...                 # Route-based file structure per SvelteKit conventions
```

## Path Aliases

| Alias  | Path      |
| ------ | --------- |
| `$lib` | `src/lib` |

Use `$lib/components/ui/button` (not relative paths) when importing from lib.

## Formatting & Linting

- **Tabs** for indentation (not spaces).
- **Single quotes**.
- **No trailing commas**.
- Print width: **100**.
- Prettier plugins: `prettier-plugin-svelte`, `prettier-plugin-tailwindcss`.
- Run `pnpm lint` to check, `pnpm format` to auto-fix.

## Scripts

| Command             | Purpose                                                              |
| ------------------- | -------------------------------------------------------------------- |
| `pnpm dev`          | Start Vite dev server                                                |
| `pnpm build`        | Production build (static output)                                     |
| `pnpm preview`      | Preview production build                                             |
| `pnpm check`        | Svelte type checking                                                 |
| `pnpm check:watch`  | Svelte type checking (watch mode)                                    |
| `pnpm lint`         | Prettier + ESLint check                                              |
| `pnpm format`       | Auto-format with Prettier                                            |
| `pnpm generate-api` | Generate TS types from backend OpenAPI doc (backend must be running) |

## Conventions

### File Naming

- Svelte components: `PascalCase.svelte` (e.g. `UserCard.svelte`).
- SvelteKit route files: `+page.svelte`, `+layout.svelte` (framework convention).
- TypeScript files: `camelCase.ts` or `kebab-case.ts`.
- CSS: co-located with routes when route-specific; global styles in `layout.css`.

### Component Authoring

- Always use `<script lang="ts">` in `.svelte` files.
- Props via `$props()`: destructure with defaults where appropriate.
- Use `{@render children()}` for composition -- not `<slot />`.
- Export reusable types alongside components when needed.
- Use the `cn()` helper from `$lib/utils` for conditional/merged Tailwind classes.

### State Management

- Component-local state: `$state()` and `$derived()`.
- Shared/global state: Svelte 5 rune-based patterns (exported `$state` from modules). Do not use legacy `writable`/`readable` stores.
- Side effects: `$effect()` with proper cleanup.

### Data Fetching -- TanStack Query

All data fetching **must** use TanStack Query (`@tanstack/svelte-query` v6). Do not use raw `fetch` in `$effect` or `onMount` for server data.

#### Setup

`QueryClientProvider` and `SvelteQueryDevtools` must wrap the app in the root layout (`+layout.svelte`). The provider supplies the `QueryClient` instance via Svelte context; the devtools panel provides a floating UI for inspecting queries at runtime.

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import './layout.css';
	import { QueryClientProvider, QueryClient } from '@tanstack/svelte-query';
	import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools';

	let { children } = $props();
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 60 * 1000,
				retry: 1
			}
		}
	});
</script>

<QueryClientProvider client={queryClient}>
	{@render children()}
	<SvelteQueryDevtools />
</QueryClientProvider>
```

#### Devtools

- **Package:** `@tanstack/svelte-query-devtools` -- installed as a dependency, automatically tree-shaken out of production builds.
- **Component:** `<SvelteQueryDevtools />` -- placed inside `QueryClientProvider` in `+layout.svelte`.
- Renders a floating toggle button (bottom-right by default) that opens a panel showing all query keys, statuses, cache state, and timing.
- Accepts optional props: `initialIsOpen`, `buttonPosition`, `position`, `client`, `errorTypes`, `styleNonce`, `shadowDOMTarget`.
- Do **not** conditionally render or lazy-load the devtools -- the component handles its own visibility.

#### Core APIs

All functions take an **accessor** (a `() => options` function), not a plain object. This is required for reactivity in Svelte 5.

| Function              | Purpose                            |
| --------------------- | ---------------------------------- |
| `createQuery`         | Fetch & cache data                 |
| `createMutation`      | Create / update / delete data      |
| `createInfiniteQuery` | Paginated / infinite-scroll        |
| `createQueries`       | Multiple parallel queries          |
| `queryOptions`        | Type-safe reusable query config    |
| `mutationOptions`     | Type-safe reusable mutation config |
| `useQueryClient`      | Access the `QueryClient`           |
| `useIsFetching`       | Global fetching indicator          |

#### Query Pattern

```svelte
<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';

	const query = createQuery(() => ({
		queryKey: ['todos'],
		queryFn: async () => {
			const res = await fetch('/api/todos');
			if (!res.ok) throw new Error('Failed to fetch');
			return res.json() as Promise<Todo[]>;
		}
	}));
</script>

{#if query.isPending}
	<p>Loading...</p>
{:else if query.isError}
	<p class="text-destructive">{query.error.message}</p>
{:else}
	{#each query.data as todo}
		<p>{todo.title}</p>
	{/each}
{/if}
```

#### Mutation Pattern

```svelte
<script lang="ts">
	import { createMutation, useQueryClient } from '@tanstack/svelte-query';

	const client = useQueryClient();

	const mutation = createMutation(() => ({
		mutationFn: async (newTodo: CreateTodoInput) => {
			const res = await fetch('/api/todos', {
				method: 'POST',
				body: JSON.stringify(newTodo),
				headers: { 'Content-Type': 'application/json' }
			});
			if (!res.ok) throw new Error('Failed to create');
			return res.json() as Promise<Todo>;
		},
		onSuccess: () => {
			client.invalidateQueries({ queryKey: ['todos'] });
		}
	}));
</script>
```

#### Reusable Query Definitions with `queryOptions`

Define queries in standalone files so they can be shared across components and used for prefetching/invalidation.

```ts
// src/lib/queries/todos.ts
import { queryOptions } from '@tanstack/svelte-query';

export const todosQuery = () =>
	queryOptions({
		queryKey: ['todos'],
		queryFn: async () => {
			const res = await fetch('/api/todos');
			if (!res.ok) throw new Error('Failed to fetch');
			return res.json() as Promise<Todo[]>;
		}
	});

export const todoQuery = (id: string) =>
	queryOptions({
		queryKey: ['todos', id],
		queryFn: async () => {
			const res = await fetch(`/api/todos/${id}`);
			if (!res.ok) throw new Error('Failed to fetch');
			return res.json() as Promise<Todo>;
		}
	});
```

Then consume in components:

```svelte
<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { todosQuery } from '$lib/queries/todos';

	const query = createQuery(() => todosQuery());
</script>
```

#### Rules

- **Always wrap options in an accessor function** (`() => ({ ... })`). Passing a plain object will break reactivity.
- Use `queryOptions()` and `mutationOptions()` helpers for reusable, type-safe query/mutation definitions. Place them in `$lib/queries/` or `$lib/mutations/`.
- Query keys must be serializable arrays. Use a consistent hierarchical structure: `['resource', id, 'sub-resource']`.
- Prefer `query.isPending` / `query.isError` / `query.data` pattern over manual loading state tracking.
- Invalidate related queries in `onSuccess` callbacks after mutations.
- No `+page.server.ts`, `+layout.server.ts`, or `+server.ts` files -- all fetching is client-side via TanStack Query.
- **Use the Preload Pattern** when fetching data for a page. Combine SvelteKit's `+page.ts` `load` (triggered on hover via `data-sveltekit-preload-data`) with TanStack Query's `placeholderData` for instant page transitions. See [`PRELOAD_PATTERN.md`](./PRELOAD_PATTERN.md) for the full pattern and examples.

### API Types -- openapi-typescript

The backend exposes an OpenAPI document. We use `openapi-typescript` to generate a `schema.d.ts` file containing all path, operation, and component types. **This is the single source of truth for every API type in the frontend.**

#### Generation

Run `pnpm generate-api` while the backend is running on `http://localhost:5250`. This produces `src/lib/api/schema.d.ts`. **Never edit this file by hand** -- it is fully regenerated each run.

#### Importing Types

All API types come from the generated schema. Import the top-level helpers:

```ts
import type { paths, components } from '$lib/api/schema';
```

#### Accessing DTO / Schema Types

When a caller needs the underlying request or response type, **always** access it through the `components` map:

```ts
type LoginRequest = components['schemas']['LoginRequest'];
type UserResponse = components['schemas']['UserResponse'];
```

Do **not** duplicate, re-declare, or hand-write types that already exist in the schema.

#### Absolute Bans

- **Never use `any`.** Not in function signatures, not in generics, not in casts, not anywhere. If a type is unknown, figure out the real type or use `unknown` with a proper narrowing guard.
- **Never use `as` type assertions.** They bypass the compiler and hide bugs. If the type system cannot infer correctly, fix the root cause (add a generic, narrow with a conditional, adjust the return type). The only tolerable exception is `as const`, which is not a cast.

#### Using Types with TanStack Query

Queries and mutations must be fully typed through the generated schema. The `queryFn` / `mutationFn` return types and input types must trace back to the OpenAPI types -- never to hand-written interfaces or `any`.

```ts
// src/lib/queries/auth.ts
import { queryOptions } from '@tanstack/svelte-query';
import type { paths } from '$lib/api/schema';

type LoginResponse =
	paths['/api/auth/login']['post']['responses']['200']['content']['application/json'];

export const meQuery = () =>
	queryOptions({
		queryKey: ['me'],
		queryFn: async (): Promise<LoginResponse> => {
			const res = await fetch('/api/auth/me');
			if (!res.ok) throw new Error('Not authenticated');
			return res.json();
		}
	});
```

For request bodies:

```ts
import type { components } from '$lib/api/schema';

type CreateTodoInput = components['schemas']['CreateTodoRequest'];
```

The pattern is always: **schema types in, schema types out.** No manual DTOs.
