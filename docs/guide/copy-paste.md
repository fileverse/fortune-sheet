# Copy / Paste Mechanism

This document explains how cell content is copied to (and restored from) the clipboard in Fortune Sheet.

---

## Entry Points

| Function | File | Role |
|---|---|---|
| `handleCopy(ctx)` | [`packages/core/src/events/copy.ts`](../../packages/core/src/events/copy.ts) | Public handler — validates selection before copying |
| `copy(ctx)` | [`packages/core/src/modules/selection.ts`](../../packages/core/src/modules/selection.ts) | Builds clipboard HTML and stores copy metadata on `ctx` |

`handleCopy` runs a series of guards first:
- Cancels format-painter if active
- Returns early if the selection contains a **partial merged cell**
- Returns early if a conditional-format region spans multiple incompatible selections

If all guards pass it calls `copy()`, then sets `ctx.luckysheet_paste_iscut = false`.

---

## What Is Written to the Clipboard

A single **`text/html`** string — an HTML `<table>` produced by `rangeValueToHtml()` in [`packages/core/src/modules/selection.ts`](../../packages/core/src/modules/selection.ts).

### Table structure

```html
<table data-type="fortune-copy-action-table">
  <colgroup width="72px"></colgroup>
  <colgroup width="120px"></colgroup>

  <tr height="19px">
    <td
      style="white-space:pre-line; font-size:11pt; color:#000000; background:#ffffff; ..."
      rowspan="1"
      colspan="1"
      data-fortune-cell="%7B%22v%22%3A42%2C%22m%22%3A%2242%22%2C...%7D"
    >
      42
    </td>
    <!-- more <td> elements -->
  </tr>
  <!-- more <tr> elements -->
</table>
```

The root element carries `data-type="fortune-copy-action-table"` — the marker the paste handler uses to distinguish an internal Fortune Sheet copy from content pasted from an external source (Excel, Google Sheets, etc.).

### Per-cell `<td>` attributes

| Attribute | Source | Content |
|---|---|---|
| `style` | `getStyleByCell()` in [`packages/core/src/modules/cell.ts`](../../packages/core/src/modules/cell.ts) | Inline CSS: font family/size/color, background, text-align, borders, text-wrap, rotation |
| `rowspan` / `colspan` | `cell.mc.rs` / `cell.mc.cs` | Merged-cell spans |
| `data-fortune-cell` | `JSON.stringify({ ...cell, _srcRow, _srcCol })` | URL-encoded JSON of the **complete cell object** (see below) |
| Text content | `getCellValue(r, c, d, "m")` in [`packages/core/src/modules/cell.ts`](../../packages/core/src/modules/cell.ts) | The formatted display value shown to the user |

### `data-fortune-cell` JSON fields

This attribute carries everything needed for a lossless round-trip paste:

| Field | Type | Meaning |
|---|---|---|
| `v` | `string \| number \| boolean` | Raw cell value |
| `m` | `string \| number` | Display / formatted value |
| `f` | `string` | Formula (e.g. `=SUM(A1:A3)`) |
| `ct` | `{ fa, t }` | Cell type — format string (`fa`) and type tag (`t`: `"g"`, `"s"`, `"d"`, `"inlineStr"`) |
| `bg` | `string` | Background color (CSS) |
| `bl` | `0 \| 1` | Bold |
| `it` | `0 \| 1` | Italic |
| `un` | `0 \| 1 \| 3` | Underline |
| `cl` | `0 \| 1` | Strikethrough |
| `ff` | `number \| string` | Font-family index or name |
| `fs` | `number` | Font size (pt) |
| `fc` | `string` | Font color (CSS) |
| `ht` | `0 \| 1 \| 2` | Horizontal alignment: 0 = center, 1 = left, 2 = right |
| `vt` | `0 \| 1 \| 2` | Vertical alignment: 0 = middle, 1 = top, 2 = bottom |
| `tb` | `string` | Text wrap mode |
| `rt` | `number` | Text rotation angle |
| `mc` | `{ r, c, rs?, cs? }` | Merge-cell anchor and span |
| `_srcRow` | `number` | Original row index (used to adjust formula references on paste) |
| `_srcCol` | `number` | Original column index |

Type definition: [`packages/core/src/types.ts`](../../packages/core/src/types.ts) — `Cell` and `CellStyle`.

---

## HTML Generation Pipeline

```
rangeValueToHtml(ctx, sheetId, ranges)          selection.ts
  │
  ├─ Reads ctx.luckysheet_select_save for row/column bounds
  │   Skips hidden rows  (ctx.config.rowhidden)
  │   Skips hidden cols  (ctx.config.colhidden)
  │
  ├─ <colgroup width="…"> per visible column
  │   Width source: ctx.config.columnlen, fallback ctx.defaultColWidth
  │
  └─ Per cell:
      ├─ getStyleByCell(ctx, d, r, c)            cell.ts
      │   → CSS object converted to kebab-case inline style string
      │
      ├─ borderInfoCompute[`${r}_${c}`]
      │   → border-left/right/top/bottom CSS via getHtmlBorderStyle()
      │
      ├─ JSON.stringify({ ...cell, _srcRow: r, _srcCol: c })
      │   → URL-encoded → data-fortune-cell attribute
      │
      └─ getCellValue(r, c, d, "m")              cell.ts
          → escapeHTMLTag()                      utils/index.ts
          → text content of <td>
```

---

## Writing to the Clipboard

`clipboard.writeHtml(str)` in [`packages/core/src/modules/clipboard.ts`](../../packages/core/src/modules/clipboard.ts):

**Modern path (all current browsers):** writes two blobs directly via `navigator.clipboard.write()` —
- `text/html` — the raw HTML string as-is
- `text/plain` — tags stripped, `<br>` converted to `\n`, multi-line values wrapped in quotes

**Fallback path (legacy browsers):** creates a hidden offscreen `contentEditable` div, sets its `innerHTML`, and uses `document.execCommand("copy")`. This path produces bloated output because the browser serialises all computed DOM styles onto every element.

> The modern path was introduced to eliminate Tailwind `--tw-*` and other computed-style noise from the clipboard HTML (see [Changes](#changes)).

---

## Copy State Stored on `ctx`

After a copy, the following context fields are set (defined in [`packages/core/src/context.ts`](../../packages/core/src/context.ts)):

```typescript
ctx.luckysheet_copy_save = {
  dataSheetId: string,            // ID of the sheet that was copied
  copyRange: [                    // One entry per selection rectangle
    { row: [r1, r2], column: [c1, c2] }
  ],
  RowlChange: boolean,            // true if any row had a custom height
  HasMC: boolean,                 // true if any merged cell was included
};

ctx.luckysheet_paste_iscut = false;   // true when the operation was Cut
ctx.iscopyself = true;                // marks this app as the clipboard source
```

---

## How Paste Consumes the Clipboard

Paste handler: [`packages/core/src/events/paste.ts`](../../packages/core/src/events/paste.ts)

```
clipboardData.getData("text/html")
  │
  ├─ Contains "fortune-copy-action-table" AND content matches saved copy?
  │   └─ Internal paste — use ctx.luckysheet_copy_save directly (no re-parse)
  │       ├─ Cut  → pasteHandlerOfCutPaste()
  │       └─ Copy → pasteHandlerOfCopyPaste()
  │
  ├─ Contains "<table>" (from Excel, Google Sheets, etc.)?
  │   └─ handlePastedTable()                       paste-table-helpers.ts
  │       ├─ If <td> has data-fortune-cell → decode JSON (lossless restore)
  │       └─ Otherwise → parse inline CSS via buildCellFromTd()
  │           Formula references adjusted by adjustFormulaForPaste()
  │
  └─ Plain text / formula
      ├─ Starts with "=" → handleFormulaStringPaste()
      └─ Otherwise       → pasteHandler() (plain text)
```

External table parsing: [`packages/core/src/paste-table-helpers.ts`](../../packages/core/src/paste-table-helpers.ts) — `handlePastedTable()` and `buildCellFromTd()`.

---

## Changes

The following improvements were made to bring clipboard behaviour closer to Google Sheets parity.

---

### 1. Single-cell copy emits `<span>` instead of `<table>`

**Files:** [`packages/core/src/modules/selection.ts`](../../packages/core/src/modules/selection.ts), [`packages/core/src/events/paste.ts`](../../packages/core/src/events/paste.ts)

Previously every copy — even a single cell — was wrapped in a `<table>`. External apps (Google Docs, Notion, etc.) interpreted this as a literal 1×1 table.

Now `copy()` detects a single-cell selection and emits a `<span>` instead:

```html
<span data-type="fortune-copy-action-span" style="color:#000;font-family:Arial;...">value</span>
```

The paste handler was updated in three places to recognise `fortune-copy-action-span` alongside `fortune-copy-action-table`, so internal copy-paste continues to work unchanged. Multi-cell copies still use the `<table>` path.

---

### 2. Clipboard HTML no longer carries Tailwind computed styles

**File:** [`packages/core/src/modules/clipboard.ts`](../../packages/core/src/modules/clipboard.ts)

The old `document.execCommand("copy")` approach serialised the full computed DOM styles of every element — including ~45 Tailwind `--tw-*` custom properties, `box-sizing`, `scrollbar-*`, etc. — onto each element.

`clipboard.writeHtml()` now uses `navigator.clipboard.write()` with a raw `Blob`, which writes the HTML string directly without going through DOM serialisation. The `execCommand` path is kept as a fallback for browsers that don't support the Clipboard API.

---

### 3. `font-family` resolved from index to name

**File:** [`packages/core/src/modules/cell.ts`](../../packages/core/src/modules/cell.ts)

`getStyleByCell()` was emitting `font-family:0` because the `ff` cell field stores a numeric index into the locale font array, not a font name. The handler now resolves the index via `locale(ctx).fontarray`, producing `font-family:Arial` (or whichever font the index maps to).

---

### 4. Single-cell span includes full default styles

**File:** [`packages/core/src/modules/selection.ts`](../../packages/core/src/modules/selection.ts)

The span generated for single-cell copy now always includes a complete baseline style block — `color`, `font-family`, `font-size`, `font-weight`, `font-style`, `text-align`, `white-space: pre-wrap`, `background-color` — with cell-specific values merged on top. Previously only explicitly-set cell properties were included, leaving unstyled cells with `style=""`.

---

### 5. Font styles apply to inline-string (multiline) cells

**File:** [`packages/core/src/modules/cell.ts`](../../packages/core/src/modules/cell.ts)

`getStyleByCell()` previously skipped `getFontStyleByCell()` for inline-string cells (`ct.t === "inlineStr"`), so bold, italic, font-size, and font-color were absent from the style of multiline cells. The `isInline` guard was removed so all cells get the same style treatment.

---

### 6. Multiline values use `<br>` in HTML and `\n` in plain text

**Files:** [`packages/core/src/modules/selection.ts`](../../packages/core/src/modules/selection.ts), [`packages/core/src/modules/clipboard.ts`](../../packages/core/src/modules/clipboard.ts)

`getCellValue()` returns multiline content as `"line1<br />line2"`. `escapeHTMLTag()` was then escaping those tags to `&lt;br /&gt;`, making them appear literally in the clipboard HTML.

Two fixes:
- **HTML** — after `escapeHTMLTag`, `&lt;br\s*\/?&gt;` is restored to `<br>` so line breaks render correctly when pasted.
- **Plain text** — the text blob for `navigator.clipboard.write()` converts `<br>` → `\n` before stripping all other tags, matching Google Sheets plain-text output.

---

### 7. Multi-line plain text wrapped in quotes

**File:** [`packages/core/src/modules/clipboard.ts`](../../packages/core/src/modules/clipboard.ts)

When the plain-text clipboard value contains newlines, it is now wrapped in double-quotes — matching Google Sheets behaviour for multi-line cell values.

---

### 8. Two copy paths distinguished: normal vs. in-cell edit

**Files:** [`packages/core/src/events/keyboard.ts`](../../packages/core/src/events/keyboard.ts), [`packages/react/src/components/SheetOverlay/InputBox.tsx`](../../packages/react/src/components/SheetOverlay/InputBox.tsx)

There are two ways to copy content:

| Mode | Trigger | Clipboard output |
|---|---|---|
| **Normal copy** | Cell selected, Ctrl+C | Styled HTML `<span>` or `<table>` |
| **In-cell copy** | Double-click into cell, select text, Ctrl+C | Plain text only, no HTML |

Previously both paths called `handleCopy()` and wrote HTML. Now:
- `handleWithCtrlOrMetaKey` in `keyboard.ts` checks `ctx.luckysheetCellUpdate.length > 0` (edit mode). If in edit mode it writes the selected text (or full cell text) as `text/plain` only via `navigator.clipboard.writeText()`.
- `InputBox.tsx` adds an `onCopy` handler to the `ContentEditable` that intercepts the browser `copy` event while in edit mode, prevents the default HTML copy, and writes plain text only. This covers right-click → Copy as well as Ctrl+C.

---

### 9. Yjs sync added to cut-paste and copy-paste handlers

**File:** [`packages/core/src/events/paste.ts`](../../packages/core/src/events/paste.ts)

`pasteHandlerOfCutPaste` and `pasteHandlerOfCopyPaste` previously did not call `ctx.hooks.updateCellYdoc` after writing cells, so collaborative (Yjs) peers never received the changes.

Both handlers now accumulate a `changes` array during their cell-write loops and call `ctx.hooks.updateCellYdoc(changes)` once at the end. In `pasteHandlerOfCopyPaste` an `afterHookCalled` flag is tracked per-cell: if the formula evaluation path already triggered `afterUpdateCell` (which handles its own Yjs sync), that cell is excluded from the batch `changes` array to avoid double-syncing.

---

### 10. Date auto-detection on plain-text paste uses `genarate()`

**File:** [`packages/core/src/events/paste.ts`](../../packages/core/src/events/paste.ts)

The previous implementation used a custom `detectDateFormat()` + `datenum_local()` pipeline to decide whether a pasted plain-text string was a date. This was replaced with the existing `genarate()` utility (the same function used when typing into a cell), which returns `[m, ct, v]` — formatted display value, cell-type descriptor, and raw value.

Key behavioural changes:
- If `genarate` identifies the string as a date (`ct.t === "d"`), the cell's `ct` is always updated so that the toolbar correctly shows the "Date" format.
- If `genarate` returns a non-date type, the destination cell's existing format is preserved and only the value is updated.
- For hex-address strings (`0x…`), the `@` string format is kept as before.

The old `detectDateFormat` and `datenum_local` imports were removed.

---

### 11. `handleFormulaOnPaste` guarded by formula presence check

**File:** [`packages/core/src/events/paste.ts`](../../packages/core/src/events/paste.ts)

`handleFormulaOnPaste` (which re-evaluates formula cells after a paste) was called unconditionally on every plain-text paste. It is now called only when the pasted data string contains `"="`, skipping the traversal entirely for non-formula pastes and avoiding spurious recalculations.

---

### 12. Bug fix: double-nested `changes.push()` with wrong row/column offsets

**File:** [`packages/core/src/events/paste.ts`](../../packages/core/src/events/paste.ts)

In `pasteHandler`, the Yjs change record was accidentally written as `changes.push(changes.push({…}))` — pushing the return value of the inner `push` (an array length integer) as a second element. The row and column indices were also using `r`/`c` (local loop counters) instead of `r + curR` / `c + curC` (absolute sheet coordinates), so the Yjs sync pointed to the wrong cells.

Both issues are now fixed: the call is a single `changes.push({…})` using `r + curR` / `c + curC`.

---

## Key Files at a Glance

| File | Purpose |
|---|---|
| [`packages/core/src/events/copy.ts`](../../packages/core/src/events/copy.ts) | `handleCopy()` — entry point and validation |
| [`packages/core/src/modules/selection.ts`](../../packages/core/src/modules/selection.ts) | `copy()`, `rangeValueToHtml()` — HTML generation |
| [`packages/core/src/modules/clipboard.ts`](../../packages/core/src/modules/clipboard.ts) | `clipboard.writeHtml()` — writes to OS clipboard |
| [`packages/core/src/modules/cell.ts`](../../packages/core/src/modules/cell.ts) | `getCellValue()`, `getStyleByCell()` — value/style extraction |
| [`packages/core/src/events/paste.ts`](../../packages/core/src/events/paste.ts) | Paste routing and execution |
| [`packages/core/src/paste-table-helpers.ts`](../../packages/core/src/paste-table-helpers.ts) | `handlePastedTable()`, `buildCellFromTd()` — external table parsing |
| [`packages/core/src/types.ts`](../../packages/core/src/types.ts) | `Cell`, `CellStyle`, `Selection`, `Range` type definitions |
| [`packages/core/src/context.ts`](../../packages/core/src/context.ts) | `ctx` fields for copy/paste state |
