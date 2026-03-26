# Cell Referencing Flow

This document captures the full implementation context for the recent formula-editing, cell-referencing, keyboard-selection, suggestion-insertion, and undo-related fixes.

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

- `packages/core/src/modules/formula.ts`
- `packages/core/src/events/keyboard.ts`
- `packages/core/src/events/mouse.ts`
- `packages/core/src/modules/toolbar.ts`
- `packages/react/src/components/SheetOverlay/InputBox.tsx`
- `packages/react/src/components/FxEditor/index.tsx`
- `packages/react/src/components/SheetOverlay/helper.ts`

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

### 11. Restore native undo/redo in formula editors

Problem:

- `Cmd/Ctrl+Z` inside the formula editor could be captured by the workbook-level global shortcut handler.
- That prevented normal contenteditable undo from working reliably while typing.

Fix:

- Stop propagation for `Cmd/Ctrl+Z` in the formula editor key handlers.
- Do not call `preventDefault()`, so native editor undo/redo still works.

Effect:

- Undo/redo while typing in the input editors stays local to the editor instead of immediately triggering workbook undo.

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
- When adding editor keyboard shortcuts, be careful not to steal native contenteditable undo/redo.
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
- type in the input editor and verify `Cmd/Ctrl+Z` undoes editor text changes
