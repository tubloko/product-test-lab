# Design system

## When to use

Activate this skill any time you build UI for ProductTestLab — choosing colors, typography, components, layout — so the visual language matches AdTestLab.

## Reference: AdTestLab patterns

### CSS approach

- **Tailwind CSS v4** (`tailwindcss: "^4"`) via the PostCSS plugin (`@tailwindcss/postcss`).
- **No `tailwind.config.js`.** Tailwind v4 uses CSS-first configuration. All theme tokens live inside `@theme inline { … }` in `app/globals.css`.
- **`tw-animate-css`** for keyframe utilities (used by shadcn data-state animations).
- **shadcn** primitives are imported from `shadcn/tailwind.css` (style: `base-nova`, baseColor: `neutral`, css variables enabled).
- **Class merger**: every component composes classes with `cn(...)` from `@/lib/utils`:
  ```ts
  import { clsx, type ClassValue } from "clsx";
  import { twMerge } from "tailwind-merge";
  export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
  ```

### Theme tokens (verbatim from `app/globals.css`)

The full file is at `ad-test-lab/app/globals.css`. The design tokens are defined twice — once as Tailwind theme bindings (`@theme inline`), and once as raw CSS variables under `:root, .dark` and `.light`.

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  /* AdTestLab tokens — explicit names used by app code */
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-elevated: var(--elevated);

  --color-text: var(--text);
  --color-text-muted: var(--text-muted);
  --color-text-subtle: var(--text-subtle);
  --color-text-inverse: var(--text-inverse);

  --color-border: var(--border);
  --color-border-subtle: var(--border-subtle);
  --color-border-strong: var(--border-strong);

  --color-primary: var(--primary);
  --color-primary-hover: var(--primary-hover);
  --color-primary-foreground: var(--primary-foreground);

  --color-success-bg: var(--success-bg);
  --color-success-text: var(--success-text);
  --color-success-border: var(--success-border);

  --color-warning-bg: var(--warning-bg);
  --color-warning-text: var(--warning-text);
  --color-warning-border: var(--warning-border);

  --color-danger-bg: var(--danger-bg);
  --color-danger-text: var(--danger-text);
  --color-danger-border: var(--danger-border);

  --color-info-bg: var(--info-bg);
  --color-info-text: var(--info-text);
  --color-info-border: var(--info-border);

  /* Shadcn aliases — primitives reference these by their own names */
  --color-background: var(--bg);
  --color-foreground: var(--text);
  --color-card: var(--surface);
  --color-card-foreground: var(--text);
  --color-popover: var(--elevated);
  --color-popover-foreground: var(--text);
  --color-muted: var(--surface);
  --color-muted-foreground: var(--text-muted);
  --color-accent: var(--surface);
  --color-accent-foreground: var(--text);
  --color-secondary: var(--surface);
  --color-secondary-foreground: var(--text);
  --color-destructive: var(--danger-bg);
  --color-input: var(--border);
  --color-ring: var(--primary);

  --font-sans: var(--font-inter), system-ui, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, monospace;
  --font-heading: var(--font-inter), system-ui, sans-serif;

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;

  --shadow-sm: var(--shadow-sm-value);
  --shadow-md: var(--shadow-md-value);
}
```

```css
/* :root,.dark — warm dark, the default */
--bg:           rgb(28 25 23);
--surface:      rgb(38 34 32);
--elevated:     rgb(48 43 41);
--text:         rgb(250 248 245);
--text-muted:   rgb(168 162 158);
--text-subtle:  rgb(120 113 108);
--text-inverse: rgb(28 25 23);
--border:        rgb(60 55 52);
--border-subtle: rgb(48 43 41);
--border-strong: rgb(120 113 108);
--primary:            rgb(245 158 11);   /* amber */
--primary-hover:      rgb(252 175 35);
--primary-foreground: rgb(28 25 23);
--success-bg: rgb(34 197 94);  --success-text: rgb(134 239 172);  --success-border: rgb(34 197 94);
--warning-bg: rgb(234 179 8);  --warning-text: rgb(253 224 71);   --warning-border: rgb(234 179 8);
--danger-bg:  rgb(239 68 68);  --danger-text:  rgb(252 165 165);  --danger-border:  rgb(239 68 68);
--info-bg:    rgb(59 130 246); --info-text:    rgb(147 197 253);  --info-border:    rgb(59 130 246);
--shadow-sm-value: 0 2px 4px rgb(0 0 0 / 0.3);
--shadow-md-value: 0 8px 24px rgb(0 0 0 / 0.4);
--sidebar-rail-width: 56px;
--sidebar-expanded-width: 240px;

/* .light — warm cream, opt-in via document.documentElement.classList */
--bg:        rgb(250 248 245);
--surface:   rgb(245 241 236);
--elevated:  rgb(255 253 250);
--text:      rgb(28 25 23);
--text-muted:rgb(82 78 74);
--text-subtle:rgb(120 113 108);
--text-inverse: rgb(250 248 245);
--border:        rgb(220 215 210);
--border-subtle: rgb(232 228 222);
--border-strong: rgb(82 78 74);
--primary:            rgb(217 119 6);
--primary-hover:      rgb(180 83 9);
--primary-foreground: rgb(255 251 235);
/* status text only — bg/border inherited from dark */
--success-text: rgb(21 128 61);
--warning-text: rgb(161 98 7);
--danger-text:  rgb(185 28 28);
--info-text:    rgb(29 78 216);
--shadow-sm-value: 0 2px 4px rgb(28 25 23 / 0.06);
--shadow-md-value: 0 8px 24px rgb(28 25 23 / 0.1);
```

Theme is set on `<html>` via a tiny synchronous script in `app/layout.tsx` (default `dark`, persisted as `localStorage.theme`).

### Color palette — usage names

These are the Tailwind classes you write in JSX (driven by `@theme inline`):

| Token group | Classes |
|---|---|
| Background surfaces | `bg-bg`, `bg-surface`, `bg-elevated` |
| Text | `text-text`, `text-text-muted`, `text-text-subtle`, `text-text-inverse` |
| Border | `border-border`, `border-border-subtle`, `border-border-strong` |
| Brand | `bg-primary`, `bg-primary-hover`, `text-primary`, `text-primary-foreground` |
| Status: success | `bg-success-bg`, `text-success-text`, `border-success-border` |
| Status: warning | `bg-warning-bg`, `text-warning-text`, `border-warning-border` |
| Status: danger  | `bg-danger-bg`, `text-danger-text`, `border-danger-border` |
| Status: info    | `bg-info-bg`, `text-info-text`, `border-info-border` |

Shadcn-aliased classes (`bg-background`, `text-foreground`, `bg-popover`, `bg-card`, `text-destructive`, etc.) also work because they map back to the same variables — primitives use these by default.

### Typography

- **Font family**: Inter (loaded via `next/font/google` in `app/layout.tsx`, exposed as the `--font-inter` CSS variable; consumed as `font-sans` and `font-heading`).
- **Mono**: `ui-monospace, SFMono-Regular, Menlo, monospace` (`font-mono`).
- **Type scale** is not Tailwind's default — it's a small set of component classes defined in `@layer components`:

| Class           | Size  | Weight | Line-height | Tracking |
|-----------------|-------|--------|-------------|----------|
| `text-display`  | 32px  | 600    | 1.2         | -0.02em  |
| `text-heading`  | 20px  | 600    | 1.3         | -0.01em  |
| `text-subheading` | 16px | 500   | 1.4         | —        |
| `text-body`     | 14px  | 400    | 1.5         | —        |
| `text-caption`  | 12px  | 400    | 1.4         | —        |
| `text-mono`     | 13px  | 400    | 1.5         | tabular-nums, mono family |

Use these — not Tailwind's `text-xs/sm/base/lg`. (Tailwind primitives shipped from shadcn still reference `text-xs/sm` internally; that's fine.)

### Spacing, radius, shadow

- **Spacing**: Tailwind v4 default scale (4px base). Conventions seen across the codebase: gap/padding usually `2`, `3`, `4`, `6`; section vertical rhythm `space-y-4`/`space-y-5`/`space-y-6`. Cards use `p-4` (size=sm) or `p-6` (default).
- **Radius scale**: `--radius-sm: 4px`, `--radius-md: 8px`, `--radius-lg: 12px`. Inputs use `rounded-sm`; buttons and cards use `rounded-md` / `rounded-lg`; dialogs `rounded-xl`. Badges use `rounded-4xl` (pill).
- **Shadow scale**: `--shadow-sm`, `--shadow-md` (theme-aware: lighter in light mode, darker in dark mode). Used sparingly — only popovers, toasts, and select dropdowns.

### Base components

All shadcn primitives are in `components/ui/*`. They are built on **`@base-ui/react`** primitives (NOT Radix UI for most; only `Collapsible`, `Label`, `Slot` come from Radix). Variants are declared with `class-variance-authority`.

| Component | File | Notes |
|---|---|---|
| `Button` | `ui/button.tsx` | variants: `default \| secondary \| outline \| ghost \| destructive \| link`; sizes: `default \| sm \| lg \| icon` |
| `Input` | `ui/input.tsx` | `h-10 rounded-sm border bg-surface`. `aria-invalid` styles error state. |
| `Textarea` | `ui/textarea.tsx` | `field-sizing-content` auto-grow, `min-h-16`. |
| `Label` | `ui/label.tsx` | `text-caption text-text-muted`; pairs with `htmlFor`. |
| `Card` + `CardHeader/Title/Description/Content/Footer/Action` | `ui/card.tsx` | `size?: 'default' \| 'sm'` controls padding/gap |
| `Dialog` family | `ui/dialog.tsx` | `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose` |
| `Select` family | `ui/select.tsx` | `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`, `SelectValue`, `SelectGroup`, `SelectLabel`, `SelectSeparator` |
| `Tabs` family | `ui/tabs.tsx` | `Tabs`, `TabsList` (`variant: default \| line`), `TabsTrigger`, `TabsContent` |
| `Tooltip` family | `ui/tooltip.tsx` | `TooltipProvider`, `Tooltip`, `TooltipTrigger`, `TooltipContent` |
| `Collapsible` family | `ui/collapsible.tsx` | re-exports `@radix-ui/react-collapsible` (no styles) |
| `Badge` | `ui/badge.tsx` | variants: `default \| secondary \| destructive \| outline \| ghost \| link` |
| `Separator` | `ui/separator.tsx` | horizontal/vertical, `bg-border` |
| `Skeleton` | `ui/skeleton.tsx` | `animate-pulse rounded-md bg-muted` |
| `Toaster` (sonner) | `ui/sonner.tsx` | mounted in `app/layout.tsx`. Use `toast.success/error/info/warning/loading(...)` from `sonner`. |
| `Form` family | `ui/form.tsx` | shadcn react-hook-form integration — exists but **not currently used in app code** (forms compose `<Label>` + `<Input>` directly). |

#### Usage examples

```tsx
<Button variant="default" size="lg" disabled={loading} onClick={onSave}>
  {loading ? 'Saving…' : 'Save product'}
</Button>
```

```tsx
<Input id="email" type="email" autoComplete="email"
  aria-invalid={Boolean(errors.email)} {...register('email')} />
```

```tsx
<Card size="sm">
  <CardHeader><CardTitle>Linen Tote</CardTitle></CardHeader>
  <CardContent>Target CPA: $25</CardContent>
</Card>
```

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader><DialogTitle>New product</DialogTitle></DialogHeader>
    <ProductForm onSubmit={handleSubmit} onCancel={() => setOpen(false)} />
  </DialogContent>
</Dialog>
```

```tsx
<Select value={status} onValueChange={setStatus}>
  <SelectTrigger size="sm"><SelectValue placeholder="Status" /></SelectTrigger>
  <SelectContent>
    {PRODUCT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
  </SelectContent>
</Select>
```

```tsx
<Tabs defaultValue="overview">
  <TabsList><TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="entries">Entries</TabsTrigger></TabsList>
  <TabsContent value="overview"><Overview /></TabsContent>
</Tabs>
```

```tsx
<TooltipProvider>
  <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon"><Info /></Button></TooltipTrigger>
    <TooltipContent>Spend net of fees</TooltipContent></Tooltip>
</TooltipProvider>
```

```tsx
<Badge variant="destructive">killed</Badge>
<Skeleton className="h-6 w-32" />
<Separator className="my-4" />
import { toast } from 'sonner';
toast.success('Saved');
```

### Icon library

- **`lucide-react` ^1.14**. Usage: `import { Menu, X, LayoutDashboard } from 'lucide-react';`
- Sizing convention: `className="size-4"` (16px) inside buttons/triggers, `size-5` (20px) for hero/icon buttons.
- Custom SVG components live in `components/icons/` (e.g. `GoogleIcon.tsx`, `BmcIcon.tsx`).

### Layout patterns

- **Container max-width**: `max-w-6xl` (1152px), centered with `mx-auto w-full`. Page padding: `p-4 md:p-8`.
- **App shell** (`app/(app)/layout.tsx`):
  - Mobile (< `md`): top bar with logo + theme toggle + burger; tap burger to reveal drawer (full-width section, no sidebar).
  - Desktop (≥ `md`): collapsible left **Sidebar** (`56px` rail, `240px` expanded — see `--sidebar-rail-width` / `--sidebar-expanded-width`), main column to its right with `min-w-0 flex-1 p-4 md:p-8`.
  - Theme toggle is mounted both in the mobile top bar and the desktop sidebar.
- **Auth shell** (`app/(auth)/login/page.tsx`): centered card on a full-screen `bg-bg` background — `flex min-h-svh items-center justify-center`, card is `max-w-sm rounded-lg border border-border bg-surface p-8`.
- **Breakpoints**: Tailwind defaults — `sm 640`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1536`. The codebase uses `md:` as the desktop boundary.
- **Min-height**: `min-h-svh` (small-viewport units) for full-page surfaces — better than `min-h-screen` on mobile browsers with dynamic toolbars.
- **`suppressHydrationWarning`** on `<html>` because the theme script mutates classList synchronously during render.

## Common pitfalls

- **Don't add a `tailwind.config.js`** — Tailwind v4 in this project is purely CSS-configured. Add new tokens by extending `@theme inline { … }` in `app/globals.css`.
- **Use the AdTestLab type-scale classes** (`text-display`, `text-heading`, `text-subheading`, `text-body`, `text-caption`, `text-mono`), not Tailwind's `text-xs/sm/base/lg`. Mixing the two visibly drifts.
- **Use the explicit color tokens** (`bg-surface`, `text-text-muted`) for app code; reserve the shadcn aliases (`bg-card`, `text-muted-foreground`) for primitives in `components/ui/*` to keep the layer boundary clear.
- **Theme toggling**: classes go on `document.documentElement` and persist to `localStorage.theme`. Don't use `next-themes`'s default attribute mode — the inline `themeScript` in `app/layout.tsx` already handles flash-prevention.
- **Don't import from `@radix-ui/*` for new components** unless a `@base-ui/react` equivalent doesn't exist. The two patterns differ; mixing is fine but follow the existing primitive's lineage.

## Open questions / gaps

- **`tailwind.config.js`**: explicitly missing in AdTestLab (Tailwind v4 CSS-first). Document above is verbatim; no inventing required.
- **No `Dropdown` / `Popover` / `Sheet` / `Accordion` / `Switch` / `Checkbox` / `RadioGroup` / `Slider` / `Avatar` / `Progress` / `AlertDialog` / `Command` primitives** in AdTestLab. ProductTestLab will need at least Progress (wizard progress dots), Sheet/Drawer, Accordion (hypothesis tree), and possibly Avatar — **requires decision**: install via shadcn CLI when first needed.
- **No `Form`/`FormField` adoption**: the wrapper exists in `ui/form.tsx` but app code doesn't use it. Decision needed for ProductTestLab — keep raw `register()` for parity, or adopt `Form` for the wizard's complex multi-step fields.
- **No animation primitives** beyond `tw-animate-css` data-state animations and Tailwind built-in transitions. Spec Part 7.2 calls for "horizontal slide transitions", "staggered AI result reveal" — ProductTestLab will need to add Framer Motion or similar; **requires decision**.
- **No design-system docs / Storybook** — no source of truth besides reading the components. Same gap noted in code-style skill.
