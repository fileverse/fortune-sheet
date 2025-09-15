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

export function isLetterNumberPattern(str: string): boolean {
  const regex = /^[a-zA-Z]\d+$/;
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
  for (let i = 0; i < colPart.length; i++) {
    colNumber = colNumber * 26 + (colPart.charCodeAt(i) - 64);
  }
  return colNumber;
}

function numberToColumn(colNumber: number) {
  let colPart = "";
  while (colNumber > 0) {
    colNumber--;
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
