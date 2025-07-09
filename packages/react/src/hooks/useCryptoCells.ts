// // TODO: This is a hook that you want real-time price updates for crypto cells

// import { useEffect, useRef, useState } from "react";
// import { getCryptoPrice } from "../utils/cryptoApi";

// // Type for a crypto cell
// export interface CryptoCell {
//   cellId: string;
//   baseValue: number;
//   cryptoType: string; // e.g., 'bitcoin'
//   fiat: string; // e.g., 'usd'
//   value: number; // last converted value
// }

// export function useCryptoCells() {
//   const [cryptoCells, setCryptoCells] = useState<CryptoCell[]>([]);
//   const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

//   // Add or update a crypto cell
//   const upsertCryptoCell = async (
//     cellId: string,
//     baseValue: number,
//     cryptoType: string,
//     fiat: string
//   ) => {
//     const price = await getCryptoPrice(cryptoType, fiat);
//     setCryptoCells((prev) => {
//       const idx = prev.findIndex((c) => c.cellId === cellId);
//       const newCell = {
//         cellId,
//         baseValue,
//         cryptoType,
//         fiat,
//         value: baseValue / price,
//       };
//       if (idx === -1) return [...prev, newCell];
//       const updated = [...prev];
//       updated[idx] = newCell;
//       return updated;
//     });
//   };

//   // Refresh all crypto cells every 20 minutes
//   useEffect(() => {
//     async function refreshAll() {
//       setCryptoCells((prev) => {
//         const updatePromises = prev.map(async (cell) => {
//           const price = await getCryptoPrice(cell.cryptoType, cell.fiat);
//           return { ...cell, value: cell.baseValue / price };
//         });
//         // Wait for all updates
//         return Promise.all(updatePromises) as unknown as CryptoCell[];
//       });
//     }
//     timerRef.current = setInterval(refreshAll, 1000);
//     return () => {
//       if (timerRef.current) clearInterval(timerRef.current);
//     };
//   }, []);

//   return { cryptoCells, upsertCryptoCell };
// }
