# Legislation Color Token Spec

## Goal

Replace legislation labels' purple/violet color with `#1a2540` (deep
navy). Add a proper design token so it's reusable.

## Implementation

### 1. Token (`clms-app/src/styles/tokens.css`)

Add to the `:root` color block (near `--color-info`):

```css
--color-legislation: #1a2540;
--color-legislation-rgb: 26 37 64;
```

The `-rgb` triple lets us use it with Tailwind's `/` opacity syntax
in soft-tint backgrounds (`bg-legislation/10`).

### 2. Tailwind config (`clms-app/tailwind.config.js`)

Inside `theme.extend.colors`:

```js
legislation: {
  DEFAULT: 'var(--color-legislation)',
},
```

This makes `text-legislation`, `bg-legislation`, and
`bg-legislation/10` all valid utilities. For the opacity variant to
work cleanly, also expose the rgb variable. The simplest approach is
to add a separate utility-friendly color entry:

```js
legislation: 'rgb(var(--color-legislation-rgb) / <alpha-value>)',
```

Pick whichever pattern matches how the project already exposes
`info` / `success` / `danger` for opacity. Keep consistent with that
pattern.

### 3. Replace legislation purple usages

Audit all `text-purple-600`, `bg-purple-50`, `text-violet-600`,
`bg-violet-50`, `bg-violet-100` occurrences. Where the context is
legislation labeling, swap to the new token.

| File | Lines | Current | New |
|---|---|---|---|
| `clms-app/src/components/molecules/HeaderSearchBar.jsx` | ~287 | `bg-violet-100 text-violet-600` (legislation row icon) | `bg-legislation/10 text-legislation` |
| `clms-app/src/components/molecules/HeaderSearchBar.jsx` | ~304 | `bg-violet-50 ... text-violet-600` (legislation pill) | `bg-legislation/10 ... text-legislation` |
| `clms-app/src/components/molecules/HeroMockup.jsx` | ~202 | `bg-purple-50 ... text-purple-600` (Legislation chip) | `bg-legislation/10 ... text-legislation` |
| `clms-app/src/components/molecules/SearchResultCard.jsx` | ~82 | `text-purple-600` (JADE chip — note: this is JADE, not legislation specifically — leave as is) | **leave unchanged** |
| `clms-app/src/components/molecules/SearchResultCard.jsx` | ~84 | `text-purple-600` (legislation type chip) | `text-legislation` |
| `clms-app/src/components/pages/app/BarristerListsPage.jsx` | ~346 | `text-purple-600` (legislation badge) | `text-legislation` |
| `clms-app/src/components/pages/app/BarristerListsPage.jsx` | ~1535, 1538, 2165, 2242, 2328 | `text-purple-600` in `item.type === 'legislation'` branches | `text-legislation` |

Codex should grep for any other `purple-` / `violet-` use **inside
legislation conditional branches** and convert. Leave non-legislation
uses (like `ReviewCard.jsx`'s `violet` variant or `members.js` avatar
color or `HeaderSearchBar.jsx:82` JADE pill — JADE != legislation)
unchanged. If the call site is ambiguous (e.g. a generic `JADE` chip),
leave it.

## Acceptance criteria

1. `tokens.css` contains `--color-legislation: #1a2540;` and the rgb
   triple.
2. Tailwind config exposes the `legislation` color so `text-legislation`
   and `bg-legislation/10` work.
3. Every place a legislation label was previously purple now uses the
   new token. Visual check: legislation chips render in the
   `#1a2540` deep-navy color.
4. Non-legislation purple uses remain untouched.
5. `npm run build` clean.
