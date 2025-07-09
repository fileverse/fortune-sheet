# Crypto Denomination Feature Documentation

## Overview

The Crypto Denomination feature allows users to convert cell values between different cryptocurrency denominations (BTC, ETH, SOL) and fiat currencies (USD, EUR, etc.) in real-time using live market prices from CoinGecko API. This feature is particularly useful for financial analysis, portfolio tracking, and crypto-related spreadsheet work.

## Architecture

### Core Components

#### 1. CryptoDenominationSelector Component
**Location**: `packages/react/src/components/CryptoDenominationSelector/`

**Purpose**: Main UI component that provides a dropdown interface for selecting cryptocurrency denominations and decimal precision.

**Key Features**:
- Dropdown selector for crypto currencies (BTC, ETH, SOL)
- Decimal precision control (1-18 decimal places)
- Real-time price conversion
- Visual indicators for active currency
- Integration with toolbar

**Props**:
```typescript
interface CryptoDenominationSelectorProps {
  initialDecimals?: number; // Default: 6
  children: React.ReactNode;
}
```

#### 2. Crypto API Utilities
**Location**: `packages/react/src/utils/cryptoApi.ts`

**Purpose**: Handles cryptocurrency price fetching and caching.

**Key Functions**:
- `getCryptoPrice(crypto: string, fiat: string)`: Fetches live prices from CoinGecko
- `clearCryptoPriceCache()`: Clears cached prices
- Built-in 1-minute caching to reduce API calls

**Supported Cryptocurrencies**:
- Bitcoin (BTC) → CoinGecko ID: "bitcoin"
- Ethereum (ETH) → CoinGecko ID: "ethereum"  
- Solana (SOL) → CoinGecko ID: "solana"

#### 3. Cell Conversion Utilities
**Location**: `packages/react/src/utils/convertCellsToCrypto.ts`

**Purpose**: Converts selected cells between different cryptocurrency denominations.

**Key Functions**:
- `convertCellsToCrypto()`: Main conversion function
- `getFiatSymbol()`: Maps currency codes to symbols ($, €, £, etc.)

**Conversion Logic**:
1. Stores original USD base value in cell metadata
2. Fetches current crypto price from CoinGecko
3. Converts USD value to selected cryptocurrency
4. Updates cell format and display value
5. Preserves base value for future conversions

#### 4. Decimal Format Utilities
**Location**: `packages/react/src/utils/updateCellsDecimalFormat.ts`

**Purpose**: Updates decimal precision for crypto and fiat formatted cells.

**Features**:
- Supports both crypto and fiat decimal formatting
- Maintains currency symbols and formatting
- Updates cell display values with new precision

#### 5. Crypto Cells Hook
**Location**: `packages/react/src/hooks/useCryptoCells.ts`

**Purpose**: Manages real-time price updates for crypto cells (future enhancement).

**Features**:
- Tracks crypto cells across the spreadsheet
- Automatic price refresh every 20 minutes
- Cell value updates based on price changes

## Integration Points

### Toolbar Integration
**Location**: `packages/react/src/components/Toolbar/index.tsx`

The crypto denomination selector is integrated into the toolbar as a custom button:

```typescript
<CryptoDenominationSelector>
  <Button
    iconId="crypto"
    tooltip="Crypto denominations"
    key="crypto-denominations"
    style={{
      backgroundColor: "#e8ebec",
      borderRadius: "8px",
    }}
  />
</CryptoDenominationSelector>
```

### Currency Dropdown Integration
The feature extends the existing currency dropdown to include crypto options:

```typescript
// Constants for crypto options
export const CRYPTO_OPTIONS = [
  { label: "Bitcoin (BTC)", value: "BTC", icon: "Btc", type: "crypto" },
  { label: "Ethereum (ETH)", value: "ETH", icon: "Ethereum", type: "crypto" },
  { label: "Solana (SOL)", value: "SOL", icon: "Solana", type: "crypto" },
];
```

### Settings Integration
**Location**: `packages/core/src/settings.ts`

The feature integrates with the existing settings system through:
- Custom toolbar items configuration
- Currency formatting options
- Decimal precision controls

## Data Flow

### 1. User Interaction Flow
```
User clicks crypto button → 
CryptoDenominationSelector opens → 
User selects crypto/decimals → 
convertCellsToCrypto() called → 
API price fetch → 
Cell conversion → 
UI update
```

### 2. Cell Data Structure
Crypto cells store additional metadata:

```typescript
type CryptoCell = {
  v?: string | number | boolean;        // Display value
  m?: string | number;                  // Formatted value
  ct?: { fa?: string; t?: string; s?: any }; // Cell format
  baseValue?: number;                   // Original USD value
  [key: string]: any;
};
```

### 3. Format String Structure
Crypto cells use a specific format string:
```
"0.000000 \"ETH\""  // 6 decimal places for Ethereum
"0.00000000 \"BTC\"" // 8 decimal places for Bitcoin
```

## API Integration

### CoinGecko API
- **Base URL**: `https://api.coingecko.com/api/v3/simple/price`
- **Rate Limit**: Free tier with reasonable limits
- **Caching**: 1-minute cache to reduce API calls
- **Error Handling**: Graceful fallback to default values

### API Response Format
```json
{
  "bitcoin": {
    "usd": 45000.50
  },
  "ethereum": {
    "usd": 3200.75
  }
}
```

## Future Enhancements

### Planned Features
1. **Real-time Price Updates**: Automatic refresh of crypto cell values
2. **More Cryptocurrencies**: Support for additional coins
