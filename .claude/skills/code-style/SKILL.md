# Code style

## When to use

Activate this skill any time you write or modify TypeScript/React code in ProductTestLab — file structure, imports, naming, state, forms, validation, error handling — so the project mirrors AdTestLab conventions.

## Reference: AdTestLab patterns

### Framework and versions

Source: `ad-test-lab/package.json`.

- **Next.js 16.2.4**, **React 19.2.4**, **TypeScript ^5**
- App Router with React Server Components (no `pages/` directory)
- Build/dev: `next dev` / `next build`. Type-check: `tsc --noEmit`. Tests: `vitest` (`@vitest/coverage-v8`)
- ESLint via `eslint-config-next` (flat config in `eslint.config.mjs`)
- No custom `next.config.ts` — defaults only

### TypeScript configuration

Source: `ad-test-lab/tsconfig.json`.

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "paths": { "@/*": ["./*"] }
  }
}
```

- `strict: true` (always)
- Single path alias: `@/*` → repo root. Import everything as `@/components/...`, `@/lib/...`, `@/hooks/...`, `@/types/...`.

### Folder structure (top-level)

```
app/                # Next.js App Router
  (app)/            # authenticated route group; has its own layout + auth guard
    layout.tsx
    page.tsx
    products/[id]/...
  (auth)/           # public route group (login)
    login/page.tsx
  api/              # route handlers (POST endpoints)
    diagnose/route.ts
    feedback/route.ts
  layout.tsx        # root layout — fonts, theme bootstrap, <Toaster/>
  globals.css       # tailwind + theme tokens (see design-system skill)

components/         # all React components, flat at top level
  ui/               # shadcn primitives (button, input, card, dialog, etc.)
  forms/            # higher-level forms (ProductForm, CampaignForm, dialogs)
  charts/           # recharts wrappers
  tables/           # @tanstack/react-table wrappers
  icons/            # custom SVG components
  verdict/          # feature-specific cluster (AI verdict UI)
  *.tsx             # other shared components, kebab-or-PascalCase file names

hooks/              # custom hooks, one file per hook (useFoo.ts)

lib/
  firebase/         # client + admin SDK, services per collection, paths, converters
  claude/           # Anthropic SDK wrappers, prompts, parse, schema
  metrics/          # pure compute functions (cpa, ctr, profit, …) + colocated tests
  verdict-engine/   # pure rule engine
  email/            # resend integration
  utils/            # generic helpers (date, format*, hash, threshold-color, …)
  utils.ts          # `cn()` helper only

types/              # zod schemas + inferred types per domain entity
  product.ts campaign.ts adset.ts entry.ts diagnosis.ts user.ts feedback.ts
  index.ts          # re-exports all of the above
```

There is no `features/` directory. Domain code is organized by *kind* (component / hook / service / type), not by feature.

### Component organization

- **One component per file**, exported with a named export (no default exports for components except Next.js `page.tsx` / `layout.tsx`).
- **No barrel `index.ts`** files in `components/` or `hooks/`. Import directly from the file path. Only `types/index.ts` re-exports.
- **Types live next to the component** as `interface FooProps { … }` declared above the function. No separate `*.types.ts` file.

```tsx
// components/StatusBadge.tsx
interface StatusBadgeProps {
  status: Status;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <Badge variant={VARIANT[status]}>{status}</Badge>;
}
```

### Naming conventions

- **Component files**: `PascalCase.tsx` matching the export (`ProductForm.tsx`, `Sidebar.tsx`).
- **shadcn/ui primitives**: `lowercase.tsx` (`button.tsx`, `dialog.tsx`) — preserved from the shadcn generator.
- **Hooks**: `useThing.ts`, single file per hook (`useProducts.ts`, `useDiagnose.ts`). Exported as `useThing`.
- **Pages/layouts**: lowercase Next.js conventions (`page.tsx`, `layout.tsx`, `route.ts`).
- **Lib utilities**: `camelCase.ts` matching the main export (`hash.ts`, `formatCurrency.ts`).
- **Types/zod schemas**: `PascalCaseSchema` for the schema, `PascalCase` for the inferred type. `const FOO_VALUES = […] as const` for enums; `XSchema = z.enum(FOO_VALUES)`.

```ts
// types/product.ts
export const PRODUCT_STATUSES = ['testing', 'scaled', 'killed', 'paused'] as const;
export const ProductStatusSchema = z.enum(PRODUCT_STATUSES);
export const ProductInputSchema = z.object({ … });
export type ProductInput = z.infer<typeof ProductInputSchema>;
```

### State management

- **No external state library** (no Zustand, Redux, Jotai). Server state comes from Firestore via `react-firebase-hooks`; component state is `useState`/`useReducer`.
- **Firestore-backed state** flows through small custom hooks that wrap `useCollection` / `useDocument` and return `{ data, loading, error }` with already-converted domain types.
- **Auth state**: `useUser()` wraps `useAuthState(auth)`; `useAuthBootstrap()` provisions the user doc once per session.
- **No Context for app state.** The only Context use in the codebase is internal to shadcn `form.tsx` (`FormFieldContext`, `FormItemContext`).

```tsx
// hooks/useProducts.ts
export function useProducts(): ProductsResult {
  const { data: user } = useUser();
  const q = user
    ? query(collection(db, paths.products(user.uid)), orderBy('createdAt', 'desc'))
    : null;
  const [snap, loading, error] = useCollection(q);
  if (!user) return { data: [], loading: false, error: undefined };
  const data = (snap?.docs ?? []).map((d) => toProduct({ id: d.id, ...d.data() }));
  return { data, loading, error };
}
```

### Routing

- **App Router**, file-based, with **route groups** for auth boundaries:
  - `app/(app)/...` — wrapped by an authenticated layout that redirects to `/login` if the user is signed out.
  - `app/(auth)/login/page.tsx` — public.
- **Dynamic routes** use `[id]` folders: `app/(app)/products/[id]/page.tsx`.
- **Layouts** are colocated; the auth layout is a `'use client'` component that calls `useUser()` + `useEffect(() => router.replace('/login'))` on signed-out, then renders `<Sidebar />` + `{children}`.

```tsx
// app/(app)/layout.tsx (excerpt)
useEffect(() => {
  if (!loading && !user) router.replace('/login');
}, [user, loading, router]);
if (loading) return <div>Loading…</div>;
if (!user) return null;
```

### Form handling

- **`react-hook-form` ^7.75** with **`@hookform/resolvers/zod`** for validation.
- Forms are written as **plain `<form>` + `register(...)`** in most places. The shadcn `Form` / `FormField` / `FormItem` primitives exist (`components/ui/form.tsx`) but the app code in `components/forms/*` does NOT use them — it composes `<Label>` + `<Input>` + inline error `<p>` directly.
- Number inputs use a shared `setValueAs` to coerce empty strings to `undefined`:
  ```ts
  const numberSetValueAs = (v: unknown) =>
    v === '' || v === null || v === undefined ? undefined : Number(v);
  ```
- Submit buttons disable on `formState.isSubmitting` and show a "Saving…" label.

```tsx
const { register, handleSubmit, formState: { errors, isSubmitting } } =
  useForm<ProductInput>({ resolver: zodResolver(ProductInputSchema), defaultValues });

return (
  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
    <Label htmlFor="name">Product name</Label>
    <Input id="name" aria-invalid={Boolean(errors.name)} {...register('name')} />
    {errors.name && <p className="text-caption text-danger-text">{errors.name.message}</p>}
    <Button type="submit" disabled={isSubmitting}>
      {isSubmitting ? 'Saving…' : 'Save product'}
    </Button>
  </form>
);
```

### Validation

- **Zod ^4.4** for everything. Schemas live in `types/<entity>.ts` next to the inferred TS type.
- **Same schema is reused** by forms (`zodResolver`) and API route handlers (`safeParse`). API routes never use a separate validator.
- Pattern: `XInputSchema` for create/update payloads → `XSchema = XInputSchema.extend({ id, createdAt, updatedAt })` for the persisted entity.

```ts
// app/api/diagnose/route.ts (excerpt)
const parsed = BodySchema.safeParse(json);
if (!parsed.success) {
  console.error('[diagnose] invalid body', { uid, issues: parsed.error.issues });
  return NextResponse.json({ error: 'bad_request', message: 'Invalid request body.' }, { status: 400 });
}
```

### Error handling

- **No React Error Boundary component** in the codebase. Errors surface through:
  - **Toasts** via `sonner` (`toast.error(...)`) for transient failures.
  - **`error` state in custom hooks** (`useDiagnose`, `useLogin`) that callers render inline.
  - **Inline `<p className="text-danger-text">`** for form-level errors.
- **Firebase errors** are caught with `instanceof FirebaseError` and mapped to user-friendly strings via a local `errorMessage(code)` switch (see `useLogin.ts`).
- **API routes** return `{ error: '<kind>', message: '<user-facing>' }` JSON with appropriate HTTP status (400/401/429/502/503/504/500). Client hooks switch on `res.status` and map to a tagged `kind` union.
- **Server logs** use `console.error('[scope] message', { ...context })` consistently — first arg is a bracketed scope tag.

```ts
// hooks/useLogin.ts (excerpt)
try {
  await action();
  router.push(redirectTo);
} catch (e) {
  const code = e instanceof FirebaseError ? e.code : '';
  const message = errorMessage(code);
  if (message) setError(message);
}
```

### Async / loading

- **No React Suspense** for data — every async hook returns explicit `{ data, loading, error }`.
- **No global loading spinner.** Each layout/page renders its own placeholder text or skeleton:
  - Auth layout: `<div>Loading…</div>` while `useUser()` is loading.
  - shadcn `Skeleton` (`components/ui/skeleton.tsx`) is available for content placeholders.
- **Mutation flows** track local state (`status: 'idle' | 'loading' | 'success' | 'error'`) inside the hook (e.g., `useDiagnose`).
- **Cleanup**: real-time listeners are managed by `react-firebase-hooks` (auto-unsubscribe). Manual `useEffect` listeners always return a cleanup callback.

## Common pitfalls

- **Don't introduce a state library.** No Zustand, no Redux, no Context-for-state. Compose custom hooks over `react-firebase-hooks`.
- **Don't add barrel `index.ts` files** in `components/` or `hooks/`. Direct imports only. The exception is `types/index.ts`.
- **Don't use the shadcn `Form`/`FormField` API** — app code uses raw `register()` + inline `<Label>`/`<Input>`. Be consistent with the existing pattern.
- **Don't return `unknown`-shaped Firestore docs**. Always pipe through a `to<Entity>()` converter from `lib/firebase/converters.ts` so dates and defaults are normalized before the data leaves the data layer.
- **Don't import server code into client code.** Files starting with `import 'server-only'` (admin SDK, Anthropic client) must never be imported from a `'use client'` component.

## Open questions / gaps

- **Testing for components/hooks**: AdTestLab has Vitest configured, but tests only exist for `lib/metrics/*`, `lib/utils/*`, `lib/verdict-engine/*`, `lib/claude/*`, and `types/__tests__/`. There are **no component or hook tests**. Decision needed for ProductTestLab on whether to add `@testing-library/react`.
- **Error boundary**: missing in AdTestLab. ProductTestLab may want one for the Wizard (per spec Part 7) — requires decision.
- **Storybook / component playground**: missing in AdTestLab, requires decision.
- **Accessibility audit pattern**: AdTestLab uses `aria-invalid` and `aria-label` ad-hoc but has no documented a11y conventions — requires decision if ProductTestLab wants stricter rules.
