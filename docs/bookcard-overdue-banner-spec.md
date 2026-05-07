# BookCard Overdue Banner Spec

## Context

In APP-015 we kept `BookCard` body white for every state and stopped tinting
the overdue card background red. The overdue signal currently lives only in
the inline due-date row's red text, which is too quiet for a state that
should command attention.

## Goal

Render the overdue signal as a **full-width red banner** inside the card.
Non-overdue loans keep the current muted inline row.

## Implementation

File: `clms-app/src/components/molecules/BookCard.jsx`.

Locate the existing due-date conditional (renders only when
`onLoan && book.dueDate`):

```jsx
{onLoan && book.dueDate && (
  <div className={`mt-3 flex items-center gap-1 text-[11px] ${overdue ? 'font-medium text-danger' : 'text-text-muted'}`}>
    <Icon name="solar:calendar-linear" size={12} className="shrink-0" />
    <span>{overdue ? 'Overdue' : 'Due'} {formatShortDate(book.dueDate)}</span>
  </div>
)}
```

Replace it with a branched render:

```jsx
{onLoan && book.dueDate && (
  overdue ? (
    <div className="-mx-4 mt-3 flex items-center gap-1.5 bg-red-50 px-4 py-1.5 text-[11px] font-medium text-danger">
      <Icon name="solar:calendar-linear" size={12} className="shrink-0" />
      <span>Overdue {formatShortDate(book.dueDate)}</span>
    </div>
  ) : (
    <div className="mt-3 flex items-center gap-1 text-[11px] text-text-muted">
      <Icon name="solar:calendar-linear" size={12} className="shrink-0" />
      <span>Due {formatShortDate(book.dueDate)}</span>
    </div>
  )
)}
```

Key details:

- The overdue branch uses `-mx-4` to escape the parent's `p-4` padding so the
  banner reaches both card edges. The card's outer wrapper already has
  `overflow-hidden rounded-2xl`, so the banner corners clip cleanly.
- Banner background `bg-red-50` matches the deny-button background tone Sean
  picked earlier. Text stays `text-danger`, weight `font-medium`.
- Padding inside banner: `px-4 py-1.5` (vertical compact, horizontal restores
  the space the negative margin removed).
- Non-overdue branch is unchanged — it remains an inline muted row.

Do not change anything else in `BookCard.jsx`. Do not touch the action row,
the category tag, or the icon color.

## Acceptance criteria

1. Overdue stories in `BookCard.stories.jsx` render a full-width red banner
   strip inside the card, edge to edge horizontally.
2. Non-overdue loan stories (OnLoan, Borrowed) render the existing muted
   inline due-date row, unchanged in spacing.
3. The card itself stays white-backgrounded in every state (overdue does
   not retint the whole card).
4. `npm run build` in `clms-app/` is clean.
