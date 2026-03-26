export function moveCursorToEnd(editableDiv: HTMLDivElement) {
  editableDiv.focus(); // Ensure the element is focused

  const range = document.createRange();
  const selection = window.getSelection();

  // Set range to cover the entire content
  range.selectNodeContents(editableDiv);
  range.collapse(false); // Collapse to the end

  if (selection) {
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

// ✅ Get cursor position inside a contentEditable div
export function getCursorPosition(editableDiv: HTMLDivElement): number {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return 0;

  const range = selection.getRangeAt(0);
  const preRange = range.cloneRange();

  preRange.selectNodeContents(editableDiv);
  preRange.setEnd(range.endContainer, range.endOffset);

  return preRange.toString().length; // caret offset in characters
}

export function setCursorPosition(
  editableDiv: HTMLDivElement,
  targetOffset: number
) {
  editableDiv.focus();

  const selection = window.getSelection();
  if (!selection) return;

  const range = document.createRange();
  const walker = document.createTreeWalker(editableDiv, NodeFilter.SHOW_TEXT);
  let remaining = Math.max(0, targetOffset);
  let node = walker.nextNode();

  while (node) {
    const textLength = node.textContent?.length ?? 0;
    if (remaining <= textLength) {
      range.setStart(node, remaining);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      return;
    }
    remaining -= textLength;
    node = walker.nextNode();
  }

  range.selectNodeContents(editableDiv);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

export function buildFormulaSuggestionText(
  editableDiv: HTMLDivElement,
  formulaName: string
) {
  const fullText = editableDiv.innerText || "";
  const selection = window.getSelection();
  const selectionInEditor =
    !!selection?.rangeCount &&
    editableDiv.contains(selection.getRangeAt(0).startContainer);
  const caretOffset = selectionInEditor
    ? getCursorPosition(editableDiv)
    : fullText.length;

  const safeCaretOffset = Math.max(0, Math.min(caretOffset, fullText.length));
  const beforeCaret = fullText.slice(0, safeCaretOffset);
  const afterCaret = fullText.slice(safeCaretOffset);

  let replaceStart = safeCaretOffset;
  const tokenMatch = beforeCaret.match(/[A-Za-z_][A-Za-z0-9_]*$/);
  if (tokenMatch) {
    const token = tokenMatch[0];
    const tokenStart = safeCaretOffset - token.length;
    const charBeforeToken = tokenStart > 0 ? beforeCaret[tokenStart - 1] : "";
    if (tokenStart === 0 || /[\s=(,+\-*/&^<>]$/.test(charBeforeToken)) {
      replaceStart = tokenStart;
    }
  }

  const shouldAddOpeningParen = !afterCaret.startsWith("(");
  const insertedText = `${formulaName}${shouldAddOpeningParen ? "(" : ""}`;
  const nextText = fullText.slice(0, replaceStart) + insertedText + afterCaret;

  return {
    text: nextText,
    caretOffset: replaceStart + insertedText.length,
  };
}

export function isLetterNumberPattern(str: string): boolean {
  const regex = /^[a-zA-Z]+\d+$/;
  return regex.test(str);
}

export function removeLastSpan(htmlString: string) {
  // Create a temporary container
  const container = document.createElement("div");
  container.innerHTML = htmlString;

  // Get all span elements
  const spans = container.querySelectorAll("span");

  if (spans.length > 0) {
    const lastSpan = spans[spans.length - 1];
    lastSpan.remove();
  }

  // Return the updated HTML string
  return container.innerHTML;
}

function parseCell(input: string) {
  const match = input.match(/^([A-Z]+)(\d+)$/i);
  if (!match) return null;
  return {
    colPart: match[1].toUpperCase(),
    rowPart: parseInt(match[2], 10),
  };
}

function columnToNumber(colPart: string) {
  let colNumber = 0;
  for (let i = 0; i < colPart.length; i += 1) {
    colNumber = colNumber * 26 + (colPart.charCodeAt(i) - 64);
  }
  return colNumber;
}

export function numberToColumn(colNumber: number) {
  let colPart = "";
  while (colNumber > 0) {
    colNumber -= 1;
    colPart = String.fromCharCode(65 + (colNumber % 26)) + colPart;
    colNumber = Math.floor(colNumber / 26);
  }
  return colPart;
}

export function incrementColumn(cell: string): string {
  const parsed = parseCell(cell);
  if (!parsed) return "";

  let colNumber = columnToNumber(parsed.colPart);
  colNumber += 1;

  const newColPart = numberToColumn(colNumber);
  return newColPart + parsed.rowPart;
}

export function decrementColumn(cell: string): string {
  const parsed = parseCell(cell);
  if (!parsed) return "";

  let colNumber = columnToNumber(parsed.colPart);
  colNumber = Math.max(1, colNumber - 1); // Prevent going below 'A'

  const newColPart = numberToColumn(colNumber);
  return newColPart + parsed.rowPart;
}

export function incrementRow(cell: string): string {
  const parsed = parseCell(cell);
  if (!parsed) return "";

  const newRowPart = parsed.rowPart + 1;
  return parsed.colPart + newRowPart;
}

export function decrementRow(cell: string): string {
  const parsed = parseCell(cell);
  if (!parsed) return "";

  const newRowPart = Math.max(1, parsed.rowPart - 1); // Prevent going below row 1
  return parsed.colPart + newRowPart;
}

export function countCommasBeforeCursor(editableDiv: HTMLDivElement): number {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return 0;

  const range = selection.getRangeAt(0);
  const preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(editableDiv);
  preCaretRange.setEnd(range.endContainer, range.endOffset);

  const textBeforeCursor = preCaretRange.toString();

  let inQuotes = false;
  let count = 0;

  for (let i = 0; i < textBeforeCursor.length; i += 1) {
    const char = textBeforeCursor[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      count += 1;
    }
  }

  return count;
}
