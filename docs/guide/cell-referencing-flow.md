# Cell Referencing Flow

This document captures the full implementation context for formula editing: cell referencing, keyboard/mouse selection, the Fx bar vs in-cell editor, suggestion insertion, undo/redo, **`functionHint`**, and **formula editor ownership** caching.

It is meant to be reused later as context for future work on formula input behavior.

## Main goals

We wanted formula reference insertion to behave by the real caret position, not by the last token in the editor.

Key expected behavior:

- Mouse drag and keyboard range selection should update the correct reference token.
- If the caret is in a new argument slot, a new ref should be inserted there instead of overwriting an older one.
- `=,A4` with the caret between `=` and `,` should insert before `A4`.
- `=SUM(A1,` with the caret after the comma should insert the next argument, not replace `A1`.
- Plain arrow navigation and `Shift+Arrow` / `Cmd+Shift+Arrow` should behave consistently.
- Formula suggestion accept should insert `FUNCTION(` at the caret instead of rebuilding editor DOM in a fragile way.
- Native undo inside the formula editor should keep working.

## Important decisions

- Do not normalize formula text in a way that removes commas or rewrites the user input unexpectedly.
- Do not rely on "last span wins" for keyboard reference sync.
- Do not remove managed `fortune-formula-functionrange-cell` spans during live range editing.
- Prefer caret-derived insertion/replacement decisions over DOM-tail heuristics.

## Files involved

- `packages/core/src/modules/formula.ts` (range logic, `rangeSetValue`, `rangeHightlightselected`, `getFormulaEditorOwner`, `setFormulaEditorOwner`, `helpFunctionExe`, …)
- `packages/core/src/modules/cell.ts` (`cancelNormalSelected` clears owner + `functionHint`)
- `packages/core/src/events/keyboard.ts`
- `packages/core/src/events/mouse.ts` (formula mouseup / range drag; respects cached editor owner)
- `packages/core/src/modules/toolbar.ts`
- `packages/react/src/components/SheetOverlay/InputBox.tsx`
- `packages/react/src/components/FxEditor/index.tsx`
- `packages/react/src/hooks/useFormulaEditorHistory.ts` (shared formula undo/redo stack)
- `packages/react/src/components/SheetOverlay/helper.ts`
- `packages/react/src/components/FormulaSearch/index.tsx` (sets `functionHint` on confirm)
- `packages/react/src/components/Workbook/api.ts` (API paths that insert `=FUNCTION(` set `functionHint`)

## Implementation flow

### 1. Preserve managed range spans during replacement

Problem:

- While dragging or updating a formula reference, the code could remove the last span even when it was already a managed range span.
- That broke replace-vs-append behavior because the live reference span disappeared.

Fix:

- In `rangeSetValue()` only strip a trailing plain `A1`-style token.
- Do not strip `fortune-formula-functionrange-cell`.

Effect:

- Mouse-driven and keyboard-driven reference updates keep the correct live span available for replacement.

### 2. Keep keyboard reference flow active after keyboard selection starts

Problem:

- Keyboard selection could move into a state where the code no longer considered the flow to be "active", so later updates used append logic when replacement was expected.

Fix:

- In `rangeSetValue()`, treat `formulaCache.rangeSelectionActive === true` as part of the active range flow.

Effect:

- Once keyboard formula range selection starts, later sync still uses the replace branch when the caret is targeting an existing reference span.

### 3. Stop using only the last range index for keyboard sync

Problem:

- Keyboard sync was effectively biased toward the last reference span in the formula.
- That caused the wrong token to be replaced when the caret was elsewhere.

Fix:

- Added `getFormulaRangeIndexAtCaret($editor)`.
- Added `getFormulaRangeIndexForKeyboardSync($editor)`.

Logic:

- If the caret is inside a `fortune-formula-functionrange-cell`, use that span's `rangeindex`.
- Otherwise, only fall back to the last range span if the caret is not before that span.

Effect:

- The active reference token is chosen by caret position instead of always choosing the last token.

### 4. Fix the `=SUM(A1,` case

Problem:

- With the caret after a comma, the fallback still chose the last range token (`A1`), so the next selection replaced `A1` instead of inserting the second argument.

Fix:

- Extended `getFormulaRangeIndexForKeyboardSync()` so that:
  - if the caret is after the last range cell, and
  - there is a structural continuation after that cell, like a comma or another ref,
  - then return `null` instead of the last range index.

- Added `hasCommaOrAnotherRefAfterRangeCell(cell)`.

Effect:

- `=SUM(A1,` now inserts the next reference into the next argument slot.
- `=A1` at end-of-input still keeps replacing `A1` as expected.

### 5. Fix `israngeseleciton()` caret and delimiter handling

Problem:

- `israngeseleciton()` had incorrect `substring()` calls that did not actually read the last character the way the code expected.
- It could return `false` when it should have allowed reference insertion.
- It could also leave `rangeSetValueTo` stale.
- Empty text nodes between formula separators were rejected too early.

Fixes:

- Replaced broken `substring()` usage with `slice(-1)` and `charAt(...)`.
- Stopped requiring `anchor.textContent` to be non-empty.
- Added caret-based fallback logic that can derive `rangeSetValueTo` from the actual caret position when range flow is already active.
- Added `setRangeSetValueToFromCaretPosition(...)`.
- Avoided assigning `rangeSetValueTo` too early in branches where delimiter checks may fail.

Effect:

- Caret positions like between `=` and `,` or just after `(` are resolved correctly.
- Insertion anchor comes from the real caret instead of stale state.

### 6. Fix plain single-cell insertion after comma

Problem:

- Single-cell refs like `A1` behaved differently from range refs like `A1:A4`.
- One reason was the special path that strips a trailing plain `A1`-style token before reinserting a managed ref.
- That path recreated `innerHTML` and then could recompute the insertion anchor incorrectly.

Fix:

- After removing the trailing plain single-cell token, reuse the new last child as the insertion anchor instead of relying on a fragile re-read from selection state.

Effect:

- Plain single-cell references and multi-cell ranges now share the same logical insertion slot behavior.

### 7. Fix plain Arrow vs Shift+Arrow mismatch

Problem:

- `Shift+Arrow` and `Cmd/Ctrl+Shift+Arrow` worked better than plain `Arrow`.
- The reason was that `Shift+Arrow` already prevented the browser from moving the contenteditable caret, but plain `Arrow` did not.
- So plain arrow could move the caret from the intended slot before formula sync ran.

Fix:

- Added `e.preventDefault()` at the end of `handleArrowKey()` in `packages/core/src/events/keyboard.ts`.

Effect:

- Plain arrow no longer moves the formula caret out from the intended insertion point.
- This fixed cases like `=,A3` plus plain arrow selection producing a misplaced insertion.

### 8. Remove debug logging

Problem:

- Temporary `[FS-RANGE]` logs were added during debugging.

Fix:

- Removed the debug logs from the touched formula/range-related files, including formula and mouse/toolbar paths.

Effect:

- Cleaner console and easier debugging of real issues.

### 9. Fix formula helper crash

Problem:

- A formula helper path crashed with `Cannot read properties of undefined (reading 'classList')`.
- It used an index from one child-node list to read from a different span list.

Fix:

- In `helpFunctionExe()`:
  - resolve the selected span with `closest("span")`
  - compute index from the actual span list
  - return early when there is no valid span
  - guard `.classList` checks with optional chaining

Effect:

- No more crash when the selection node and span list are misaligned.

### 10. Improve formula suggestion insertion

Goal:

- When a formula suggestion is accepted with Enter/Tab/click, insert the selected formula name plus `(` at the real caret position.
- Avoid the old fragile DOM surgery approach that manually removed/recreated spans.

Target design:

- Compute the next plain formula text around the caret.
- Replace the typed function token with `FUNCTION(`.
- Run the result through core formula HTML generation.
- Restore the caret after the inserted `(`.

Supporting helpers added for this direction:

- `buildFormulaSuggestionText(...)`
- `setCursorPosition(...)`

Intent:

- Keep formula suggestion insertion cursor-based and driven by core formatting instead of manual editor span manipulation.

### 11. Undo/redo in formula editors (workbook vs editor)

Problem:

- `Cmd/Ctrl+Z` inside a formula editor could be captured by the **workbook-level** shortcut handler, so sheet undo ran instead of (or in addition to) editing formula text.

Fix (layered):

- **Stop propagation** for `Cmd/Ctrl+Z` / related chords in **cell** and **Fx** formula key handlers so workbook handlers do not run for those keys during an edit session.
- **Custom formula history** (see **§18**): while the formula starts with `=` or the custom stack is active, **undo/redo** is handled by the shared hook; **`preventDefault()`** when a history step is applied so it does not stack with native contenteditable undo.
- Outside that formula-history path, behavior follows the same key-handler rules as before (avoid stealing shortcuts from non-formula editing where applicable).

Effect:

- Formula text undo is predictable in both **in-cell** and **Fx bar** editors; workbook undo is not triggered by the same shortcut during formula editing.

## Formula selection sync in React

`InputBox.tsx` was updated so selection changes do the following:

1. Skip duplicate sync when the change came from mouse drag formula range behavior.
2. Call `israngeseleciton(ctx)` to prepare `rangeSetValueTo`.
3. Call `getFormulaRangeIndexForKeyboardSync(...)`.
4. If a valid target index exists:
   - set `formulaCache.rangechangeindex`
   - set `rangestart = true`
5. Otherwise:
   - clear `rangechangeindex`
   - set `rangestart = false`
6. Set `rangeSelectionActive = true`
7. Call `rangeSetValue(...)`
8. Rebuild range highlight/select UI for keyboard-driven reference selection

This makes keyboard selection use the same formula reference machinery as mouse-driven selection.

## Later corrections

### 12. Shift/Cmd+Shift range navigation belongs in core

During debugging, a temporary editor-side fallback for `Shift+Arrow` and
`Cmd/Ctrl+Shift+Arrow` was attempted in `InputBox` / `FxEditor`.

That approach was wrong for this codebase because:

- it moved sheet selection locally
- but it bypassed the real core keyboard flow
- so formula text sync and blue range highlight/select state became inconsistent

Final decision:

- modified-arrow formula range navigation should stay in `packages/core/src/events/keyboard.ts`
- React editors should not implement a parallel local selection engine for this

### 13. Dirty awareness scope was narrowed

There are two different ideas that were explored:

1. Dirty inserted range token
2. Dirty manual formula text session

The second one turned out to be overcomplicated and too sticky.

Final decision:

- keep dirty-awareness only for the real original purpose:
  manual modification of a programmatically inserted managed range token
- do not keep separate session-level dirty state for all manual typing/deleting

Concretely:

- `rangeSelectionActive === false` remains the meaningful dirty state for managed range tokens
- the extra `formulaManualInputDirty` experiment was removed

### 14. Valid range edit condition is the main gate

The final model is:

- if the caret is at a valid formula reference insertion point, allow mouse/key reference insertion
- if not, do not allow it

The important source of truth is:

- `israngeseleciton(ctx)` for caret-slot validity
- `isFormulaReferenceInputMode(ctx)` for broader formula reference mode

Examples of valid fresh insertion points:

- after `=`
- between `=` and `,` in something like `=,A2`
- after `,`
- after `(`
- inside an existing managed range token when replacement is intended

Examples of invalid fresh insertion points:

- empty editor / plain text not starting with `=`
- manual identifier typing like `=A`, `=SUM`, `=foo`
- other locations where there is manual content in the current slot already

### 15. Dirty recovery should depend on caret validity, not full formula cleanup

At one point, dirty recovery required all managed range tokens to be gone from the
formula before keyboard/mouse reference insertion could resume.

That was wrong for cases like:

- `=A1,A2`
- user deletes the first ref back to `=,A2`
- caret is now between `=` and `,`

Even though `A2` still exists elsewhere in the formula, the first argument slot is
fresh and valid again.

Final decision:

- dirty recovery should depend on:
  - formula still starts with `=`
  - caret is back at a valid insertion point via `israngeseleciton(ctx)`
- it should not require all range tokens elsewhere in the formula to disappear

### 16. Incomplete manual tails are still a known edge case

Known remaining issue to remember:

- incomplete range tails like `=E4:F` are still not handled perfectly
- mouse drag and keyboard behavior may disagree there

Expected eventual behavior:

- incomplete/manual partial refs such as `=A`, `=E4:F`, and similar unfinished tails
  should not be treated as valid fresh range-edit entry points
  unless we intentionally design a specific rule for them later

Most likely place to revisit:

- `packages/core/src/modules/formula.ts`
- specifically `israngeseleciton()` / `allowRangeInsertionAtCaret()`

### 17. Formula editor ownership cache (`cell` vs `fx`)

**Problem**

- Core and React sometimes need to know whether the **in-cell** contenteditable (`#luckysheet-rich-text-editor`) or the **formula bar** (`#luckysheet-functionbox-cell`) is the “source of truth” for the current formula edit (e.g. where to send `rangeSetValue` output, or whether to skip a duplicate React sync).
- Relying only on **`document.activeElement`** is unreliable: focus can move to the canvas or the other editor during range clicks/drags, so the wrong editor could be updated or the same reference inserted twice (e.g. `=A1A1`).

**Design**

- Store an explicit owner on context: **`ctx.formulaCache.formulaEditorOwner`** with values **`"cell"` | `"fx"` | `null`** (see `FormulaCache` in `formula.ts`).
- **`setFormulaEditorOwner(ctx, owner)`** — assign owner.
- **`getFormulaEditorOwner(ctx)`** — returns cached `"cell"` / `"fx"` when set; otherwise falls back to `activeElement` id checks (`luckysheet-functionbox-cell` → `fx`, `luckysheet-rich-text-editor` → `cell`).

**Where it is cleared**

- **`cancelNormalSelected`** in `cell.ts` sets **`formulaEditorOwner = null`** (along with `functionHint` and edit session teardown).

**React: when owner is set (important for stability)**

- **Do not rely on `onFocus` alone** for the in-cell editor to set owner: focus can jump during canvas interaction and flip owner at the wrong time.
- **InputBox**: set owner to **`"cell"`** on **`onKeyDown`** and **`onMouseUp`** on the cell editor (after real user interaction).
- **FxEditor**: set owner to **`"fx"`** on **`onKeyDown`** and **`onMouseUp`**; **`onFocus`** on the Fx bar still starts/continues edit session and sets owner (Fx focus is less often stolen than cell overlay during range pick).
- **InputBox selection→formula sync effect**: when **`getFormulaEditorOwner(ctx) === "fx"`**, skip the effect that would call `rangeSetValue` from cell selection changes — core already updates both editors when the Fx bar owns the session, and a second pass caused duplicate refs.

- **Formula list + expand (`FormulaSearch` / `FormulaHint`)**: **`InputBox`** only mounts that UI when **`luckysheetCellUpdate`** is active **and** **`getFormulaEditorOwner(context) === "cell"`**; **`FxEditor`** only when **`=== "fx"`**. So at most one editor shows suggestion list + help chrome; while the cache says **`fx`**, picking a range on the sheet (focus leaves editors) still keeps **`fx`** as owner so the formula bar chrome can remain the one that’s shown.

**Core usage (examples)**

- **`rangeSetValue`** (or related paths) use **`getFormulaEditorOwner(ctx)`** to choose which DOM node receives updates when both editors exist.
- **Mouse** formula-drag / `mouseup` handling uses **`getFormulaEditorOwner(ctx) === "fx"`** instead of only `activeElement` for deciding Fx-specific behavior.

**Regression to watch**

- Any new code that branches on “which formula editor is active” should prefer **`getFormulaEditorOwner(ctx)`** over raw **`document.activeElement`** unless there is a deliberate reason not to.

### 18. Custom formula undo/redo for cell editor and Fx bar

**Goal**

- **`Cmd/Ctrl+Z` / `Cmd+Shift+Z` / `Ctrl+Y`** should undo **formula text** while editing, with a **consistent stack** whether the user types in the **cell overlay** or the **Fx bar**.
- Shortcuts must **`stopPropagation()`** so the workbook-level undo handler does not run at the same time.
- When the custom stack handles a step, **`preventDefault()`** is used so the browser does not also apply native contenteditable undo on top.

**Implementation**

- Shared hook: **`packages/react/src/hooks/useFormulaEditorHistory.ts`**
  - Tracks entries: `{ text, caret, spanValues }` (including span snapshot for `fortune-formula-functionrange-cell` deduping).
  - Seeds the first snapshot from **pre-keypress** state so undo can remove the initial `=`.
  - **`primary`**: **`"cell"`** (caret + history on `inputRef`) vs **`"fx"`** (caret + history on `refs.fxInput`).
  - On apply: writes HTML to **both** editors, places caret on the **primary** editor, then calls **`handleFormulaInput`** with the same argument order as that editor’s **`onChange`**:
    - Cell primary: `handleFormulaInput(ctx, fxInput, cellInput, 0)`
    - Fx primary: `handleFormulaInput(ctx, cellInput, fxInput, 0)`

**Lifecycle**

- **`capturePreFormulaState()`** — call at start of **`onKeyDown`** (after recording the key event), same idea as before: captures `innerText` + range span texts before the key mutates the DOM.
- **`appendFormulaHistoryFromPrimaryEditor(getCaret)`** — call from **`onChange`** when a key event is present (same gating as existing `handleFormulaInput` triggers).
- **`resetFormulaHistory()`** when **`luckysheetCellUpdate`** becomes empty (edit session ends) — both **InputBox** and **FxEditor** reset their respective stacks.

**Note**

- Cell and Fx maintain **separate stacks** (typing only in one surface fills that surface’s history). That matches independent interaction patterns and avoids cross-contamination.

### 19. `context.functionHint` — what it is and where it is set

**Role**

- **`functionHint`** is the **uppercase function name** for the **formula help / `FormulaHint` panel** (argument list, expand view, etc.), keyed into **`formulaCache.functionlistMap`**.

**Primary calculation (core)**

- **`rangeHightlightselected(ctx, $editor)`** in **`formula.ts`** updates **`ctx.functionHint`** from the caret and generated formula HTML:
  - Uses **`helpFunctionExe($editor, currSelection, ctx)`** to walk **spans** (e.g. `luckysheet-formula-text-func`) and infer which function the caret is inside.
  - If the token at the caret is **only letters** (typing a function name), **`functionHint` is set to `null`** and **`searchFunction`** fills **`functionCandidates`** for the **suggestion list** instead.
  - Otherwise **`functionHint = funcName?.toUpperCase()`** and list candidates are cleared.

**Explicit assignments (React)**

- Picking a function from **FormulaSearch** or **Workbook API** insert paths sets **`ctx.functionHint`** to the chosen name.
- **InputBox** / **FxEditor** **`insertSelectedFormula`** sets **`draftCtx.functionHint = formulaName`** when accepting a suggestion from the inline list.

**UI consumption**

- **InputBox** / **FxEditor** compute **`functionName`** for **`FormulaHint`** (expand help) in order:
  1. **`getFunctionNameFromFormulaCaretSpans(editor)`** — if the caret is on **`luckysheet-formula-text-func`** with next sibling **`luckysheet-formula-text-lpar`**, or on **`luckysheet-formula-text-lpar`** with previous sibling **`luckysheet-formula-text-func`**, use that function (nested calls, e.g. `SUM(MIN(` → **MIN** when the caret is on `MIN` / `(`).
  2. **`context.functionHint`** from **`rangeHightlightselected`** / core.
  3. **`getFunctionNameFromInput()`** — regex `=NAME(` or first **`.luckysheet-formula-text-func`** in the editor (legacy fallback).

- While a cell edit session is active, **`useRerenderOnFormulaCaret`** listens to **`selectionchange`** so the hint updates when only the caret moves (no React state change otherwise).

- **Fx bar (`FxEditor`)** mirrors **InputBox** for the expand/list experience: same **`functionName`** resolution, **`!showSearchHint`** gating, **`shouldShowFormulaFunctionList`** after insert, **`F10`** to toggle the hint panel, **`Tooltip`** on the collapsed chip, the same outer render guard **`functionCandidates | functionHint | defaultCandidates | fn`**, and **`onChange`** with no **`lastKeyDownEvent`** still runs **`rangeHightlightselected`** on the Fx or cell editor (whichever has the caret / formula) so **`functionHint`** stays aligned for the help card.

**Cleared**

- **`cancelNormalSelected`** sets **`functionHint = null`**.

### 20. Formula hint UI: list vs expanded help (reference)

- **Suggestion list** (`FormulaSearch`, `showSearchHint`): driven by **`shouldShowFormulaFunctionList(editor)`** (same letters-only tail rule as `onChange`). After **Enter / click** picks a function, **`insertSelectedFormula`** updates `innerHTML` without a native `input` event, so it must call **`setShowSearchHint(shouldShowFormulaFunctionList(...))`** immediately or the list flag stays true and blocks **`FormulaHint`** until the next keystroke.
- **Large help card** (`FormulaHint`): shown when **`showFormulaHint && fn && !showSearchHint`** — the expand/help UI is hidden while the function **list** is visible so they do not overlap.
- **Small “show more” chip** (when hints are collapsed): same **`!showSearchHint`** guard.
- **Expanded body** inside `FormulaHint`: **`showFunctionBody`**, defaulting from **`localStorage["formula-expand"]`**, toggled by the header/chevron in **`FormulaHint/index.tsx`**.

## Final expected behaviors

- `=,A4` with caret between `=` and `,` inserts before `A4`
- `=SUM(A1,` with caret after comma inserts the second argument instead of replacing `A1`
- `=A1` with caret at end continues to replace `A1`
- caret inside an existing reference replaces that reference
- mouse drag and keyboard selection both preserve managed range spans
- plain `Arrow` behaves consistently with `Shift+Arrow`
- accepting a formula suggestion should be cursor-based
- native undo in the formula editor should keep working
- once a managed inserted range token is manually edited, that specific dirty state should block further automatic range navigation until the caret returns to a valid fresh insertion point
- valid insertion-point checks are more important than broad session-level dirty tracking

## Things to be careful about in future changes

- Do not reintroduce "last span always wins" logic for formula reference replacement.
- Do not recreate formula editor HTML and then trust the old selection without restoring/deriving the caret.
- Do not strip managed `fortune-formula-functionrange-cell` spans during live editing.
- Do not normalize formula text in ways that remove commas or rewrite argument structure.
- When adding editor keyboard shortcuts, coordinate with **formula history** and **`stopPropagation`** so workbook undo/redo does not fight formula undo; prefer **`getFormulaEditorOwner(ctx)`** over **`document.activeElement`** for editor targeting.
- Do not add parallel React-side selection engines for modified arrow range navigation when core already owns that behavior.
- Do not add broad sticky dirty flags unless there is a very clear missing case that valid insertion-point checks cannot already cover.

## Suggested quick regression checks

- `=,A4` with caret between `=` and `,`, then pick a single cell
- `=SUM(A1,` with caret after comma, then pick a single cell
- `=SUM(A1,` with caret after comma, then extend to a range with `Shift+Arrow`
- `=A1` at end, then move selection with keyboard and confirm replacement
- caret inside `=SUM(A1,B2)` on `A1`, then on `B2`, verify correct replacement target
- `=A1,A2` -> delete first ref to `=,A2` -> ensure keyboard/mouse reference insertion is allowed again in the first slot
- `=A1` -> delete to `=A` -> ensure mouse/keyboard reference insertion is blocked because this is not a valid fresh insertion point
- type `=` in a fresh cell -> ensure mouse/keyboard reference insertion is allowed
- type random text, delete back to plain empty/non-formula text -> ensure mouse/keyboard reference insertion is blocked
- test incomplete tail cases such as `=E4:F` and document actual current behavior before changing it
- accept formula suggestion via Enter/Tab/click at different caret positions
- type in the **cell** editor and **Fx bar**; verify `Cmd/Ctrl+Z` steps through **formula** history (and does not trigger sheet undo)
- with **Fx bar** owning the session (`=` then click cells), verify **no** duplicate refs (`=A1A1`) and second click still extends formula instead of exiting edit mode incorrectly
