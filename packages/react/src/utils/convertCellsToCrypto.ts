import { getFlowdata } from "@fileverse-dev/fortune-core";
import { getCryptoPrice } from "./cryptoApi";

export const getFiatSymbol = (code: string): string => {
  switch (code) {
    case "USD":
      return "$";
    case "EUR":
      return "€";
    case "GBP":
      return "£";
    case "JPY":
      return "¥";
    case "CNY":
      return "¥";
    case "INR":
      return "₹";
    default:
      return code;
  }
};

const COINGECKO_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  // add more as needed
};

// Extend the Cell type to include baseValue
type CryptoCell = {
  v?: string | number | boolean;
  m?: string | number;
  ct?: { fa?: string; t?: string; s?: any };
  baseValue?: number;
  [key: string]: any;
};

export async function convertCellsToCrypto({
  context,
  setContext,
  denomination,
  decimals,
  baseCurrency,
}: {
  context: any;
  setContext: (fn: (ctx: any) => void) => void;
  denomination: string;
  decimals: number;
  baseCurrency: string;
}) {
  const selections = context.luckysheet_select_save;
  const flowdata = getFlowdata(context);
  if (!selections || !flowdata) return;

  // Expand all selected cells
  const selectedCells: { row: number; col: number }[] = [];
  selections.forEach((selection: any) => {
    for (let row = selection.row[0]; row <= selection.row[1]; row += 1) {
      for (
        let col = selection.column[0];
        col <= selection.column[1];
        col += 1
      ) {
        selectedCells.push({ row, col });
      }
    }
  });

  let denomStr: string =
    typeof denomination === "string" && denomination.trim() !== ""
      ? denomination
      : "ETH";
  denomStr = denomStr.toUpperCase();
  const coingeckoId: string =
    typeof COINGECKO_IDS[denomStr] === "string"
      ? COINGECKO_IDS[denomStr]
      : "ethereum";

  // Get the crypto price in USD
  const price = await getCryptoPrice(
    String(coingeckoId),
    baseCurrency.toLowerCase()
  );

  selectedCells.forEach(({ row, col }) => {
    const cell = flowdata[row]?.[col] as CryptoCell;
    let baseValue: number = 0;

    // Check if we have a stored USD base value
    if (cell?.baseValue !== undefined) {
      baseValue = cell.baseValue;
    } else {
      // First time conversion - extract USD value from current cell
      if (typeof cell?.v === "number") {
        baseValue = cell.v;
      } else if (typeof cell?.v === "string") {
        baseValue = parseFloat(cell.v);
      }

      // If the cell already has a crypto denomination, assume it's USD equivalent
      // This handles cases where cells were previously converted
      if (cell?.ct?.fa && cell.ct.fa.includes('"')) {
        // Extract the numeric value from the formatted string
        const numericValue = parseFloat(cell.v?.toString() || "0");
        if (!Number.isNaN(numericValue)) {
          baseValue = numericValue;
        }
      }
    }

    if (!baseValue || Number.isNaN(baseValue)) return;

    // Convert USD base value to selected cryptocurrency
    const cryptoValue = baseValue / price;

    setContext((ctx: any) => {
      const d = getFlowdata(ctx);
      if (!d) return;
      d[row][col] = d[row][col] || {};
      d[row][col].v = cryptoValue;
      d[row][col].m = `${cryptoValue.toFixed(decimals)} ${denomStr}`;
      d[row][col].ct = {
        fa: `0.${"0".repeat(decimals)} "${denomStr}"`,
        t: "n",
      };
      // Store the original USD base value for future conversions
      (d[row][col] as CryptoCell).baseValue = baseValue;
    });
  });
}
