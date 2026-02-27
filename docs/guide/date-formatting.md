# Date Formatting

This document explains how date formatting works in fortune-sheet: what input formats are accepted, how dates are stored internally, and what display formats are available.

## How a Date Cell Is Created

When a user types a string into a cell, the following pipeline runs:

1. **Detection** — `isdatetime()` in `packages/core/src/modules/validation.ts` checks if the string looks like a date by delegating to `detectDateFormat()`.
2. **Format detection & parsing** — `detectDateFormat()` in `packages/core/src/modules/validation.ts` identifies the input pattern, extracts year/month/day/time components, and returns a `DateFormatInfo` object.
3. **Serialization** — `datenum_local()` in `packages/core/src/modules/format.ts` converts the constructed `Date` to an Excel-compatible serial number stored as `cell.v`.
4. **Cell population:**
   - `ct.t = "d"` — marks the cell as a date type
   - `ct.fa = <format string>` — stores the display format (chosen automatically from the detected input pattern)
   - `v = <serial number>` — raw value stored internally
   - `m = SSF.format(ct.fa, v)` — the rendered string shown in the grid

## Accepted Input Formats

`detectDateFormat()` accepts all of the following patterns. Each input pattern maps to a specific display format (`ct.fa`) that is auto-assigned when the cell is created.

### Year-first formats

| Input pattern         | Example               | Auto-assigned `ct.fa` | Example output |
| --------------------- | --------------------- | --------------------- | -------------- |
| `yyyy-MM-dd`          | `2026-02-25`          | `dd/MM/yyyy`          | `25/02/2026`   |
| `yyyy-MM-dd HH:mm`    | `2026-02-25 14:30`    | `dd/MM/yyyy`          | `25/02/2026`   |
| `yyyy-MM-dd HH:mm:ss` | `2026-02-25 14:30:00` | `dd/MM/yyyy`          | `25/02/2026`   |
| `yyyy-MM-ddTHH:mm`    | `2026-02-25T14:30`    | `dd/MM/yyyy`          | `25/02/2026`   |
| `yyyy-MM-ddTHH:mm:ss` | `2026-02-25T14:30:00` | `dd/MM/yyyy`          | `25/02/2026`   |
| `yyyy/MM/dd`          | `2026/02/25`          | `dd/MM/yyyy`          | `25/02/2026`   |
| `yyyy/MM/dd HH:mm`    | `2026/02/25 14:30`    | `dd/MM/yyyy`          | `25/02/2026`   |
| `yyyy/MM/dd HH:mm:ss` | `2026/02/25 14:30:00` | `dd/MM/yyyy`          | `25/02/2026`   |
| `yyyy.MM.dd`          | `2026.02.25`          | `yyyy.MM.dd`          | `2026.02.25`   |

> ISO-style datetime inputs (24h, T or space separator) are stored with their time component but displayed as date-only using `dd/MM/yyyy`.

### Day/Month-first formats (slash separator)

Disambiguation rule: if the **first** part > 12 it is the day (`dd/MM/yyyy`); if the **second** part > 12 it is the day (`MM/dd/yyyy`); if both ≤ 12, defaults to `MM/dd/yyyy`.

| Input pattern                   | Example              | Auto-assigned `ct.fa`   | Example output       |
| ------------------------------- | -------------------- | ----------------------- | -------------------- |
| `dd/MM/yyyy` (first > 12)       | `25/02/2026`         | `dd/MM/yyyy`            | `25/02/2026`         |
| `MM/dd/yyyy`                    | `02/25/2026`         | `MM/dd/yyyy`            | `02/25/2026`         |
| `M/d/yyyy` (single-digit month) | `2/25/2026`          | `M/d/yyyy`              | `2/25/2026`          |
| `MM/dd/yy`                      | `02/25/26`           | `MM/dd/yy`              | `02/25/26`           |
| `MM/dd/yyyy h:mm AM/PM`         | `02/25/2026 2:30 PM` | `MM/dd/yyyy h:mm AM/PM` | `02/25/2026 2:30 PM` |

### Day-first formats (dash / dot separator)

Only recognised unambiguously when the first part > 12.

| Input pattern | Example      | Auto-assigned `ct.fa` | Example output |
| ------------- | ------------ | --------------------- | -------------- |
| `dd-MM-yyyy`  | `25-02-2026` | `dd/MM/yyyy`          | `25/02/2026`   |
| `dd.MM.yyyy`  | `25.02.2026` | `dd.MM.yyyy`          | `25.02.2026`   |

### Named-month formats

All named-month variants map to `dd/MM/yyyy`.

| Input pattern   | Example             | Example output |
| --------------- | ------------------- | -------------- |
| `MMMM dd, yyyy` | `February 25, 2026` | `25/02/2026`   |
| `MMM dd, yyyy`  | `Feb 25, 2026`      | `25/02/2026`   |
| `MMMM dd yyyy`  | `February 25 2026`  | `25/02/2026`   |
| `dd MMMM yyyy`  | `25 February 2026`  | `25/02/2026`   |
| `dd MMM yyyy`   | `25 Feb 2026`       | `25/02/2026`   |
| `MMM-dd-yyyy`   | `Feb-25-2026`       | `25/02/2026`   |

### Validation constraints

- Year must be ≥ 1900
- Month must be 1–12
- Day must be valid for the given month (leap year aware)
- Minimum 5 characters required
- For `dd-MM-yyyy` and `dd.MM.yyyy`: first part must be > 12 (otherwise left as plain text to avoid ambiguity)
- For `MM/dd/yy`: first part must be ≤ 12

## How `detectDateFormat()` Works

`detectDateFormat(str)` is exported from `packages/core/src/modules/validation.ts`. It tries each pattern in priority order and returns a `DateFormatInfo` object on the first match, or `null` if none match.

```typescript
export type DateFormatInfo = {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  seconds: number;
  formatType: string; // e.g. "dd/MM/yyyy", "MM/dd/yyyy", "named", …
};
```

Pattern priority (highest to lowest):

1. ISO 8601 with `T` separator (`yyyy-MM-ddTHH:mm[:ss]`)
2. `yyyy-MM-dd` with optional space+time
3. `yyyy/MM/dd` with optional space+time
4. `yyyy.MM.dd`
5. `MM/dd/yyyy h:mm AM/PM`
6. Slash-separated, 4-digit year last (disambiguated by first/second part > 12)
7. Slash-separated, 2-digit year (`MM/dd/yy`)
8. `dd-MM-yyyy` (first part > 12 only)
9. `dd.MM.yyyy` (first part > 12 only)
10. Named month first (`February 25, 2026` / `Feb 25, 2026` / `February 25 2026`)
11. Day first with named month (`25 February 2026` / `25 Feb 2026`)
12. Abbreviated month with dashes (`Feb-25-2026`)

`checkDateTime()` is now a thin wrapper around `detectDateFormat()`. `isdatetime()` is unchanged externally.

### Implementation update (2026-02-25)

- `genarate()` in `packages/core/src/modules/format.ts` now delegates string parsing to `detectDateFormat()` from `packages/core/src/modules/validation.ts`.
- When a date-like string is detected `genarate()` constructs a `Date` from the `DateFormatInfo`, converts it to an Excel serial with `datenum_local()`, sets `ct.t = "d"`, and assigns `ct.fa` using the mapping in the table below.
- Time components (24h or AM/PM) are preserved in the stored serial number; display formats are chosen per the mapping (e.g. ISO datetimes still display as `dd/MM/yyyy` by default, while `MM/dd/yyyy h:mm AM/PM` keeps the time and AM/PM indicator).

## Auto-Assigned Display Format

The display format (`ct.fa`) is chosen based on the detected input pattern, not input length. The mapping is defined in `genarate()` in `packages/core/src/modules/format.ts`:

| Detected `formatType`   | Assigned `ct.fa`        |
| ----------------------- | ----------------------- |
| `yyyy-MM-dd`            | `dd/MM/yyyy`            |
| `yyyy/MM/dd`            | `dd/MM/yyyy`            |
| `yyyy.MM.dd`            | `yyyy.MM.dd`            |
| `yyyy-MM-dd HH:mm`      | `dd/MM/yyyy`            |
| `yyyy/MM/dd HH:mm`      | `dd/MM/yyyy`            |
| `yyyy-MM-ddTHH:mm`      | `dd/MM/yyyy`            |
| `MM/dd/yyyy`            | `MM/dd/yyyy`            |
| `M/d/yyyy`              | `M/d/yyyy`              |
| `MM/dd/yy`              | `MM/dd/yy`              |
| `dd/MM/yyyy`            | `dd/MM/yyyy`            |
| `dd-MM-yyyy`            | `dd/MM/yyyy`            |
| `dd.MM.yyyy`            | `dd.MM.yyyy`            |
| `named`                 | `dd/MM/yyyy`            |
| `MM/dd/yyyy h:mm AM/PM` | `MM/dd/yyyy h:mm AM/PM` |

## Supported Display Formats

### Format Picker Formats

These are the formats available in the **date format picker** (`dateFmtList` in `packages/core/src/locale/`):

| Format string       | Example output |
| ------------------- | -------------- |
| `yyyy-MM-dd`        | 1930-08-05     |
| `yyyy/MM/dd`        | 1930/8/5       |
| `MM-dd`             | 08-05          |
| `M-d`               | 8-5            |
| `h:mm:ss`           | 13:30:30       |
| `h:mm`              | 13:30          |
| `AM/PM hh:mm`       | PM 01:30       |
| `AM/PM h:mm`        | PM 1:30        |
| `AM/PM h:mm:ss`     | PM 1:30:30     |
| `MM-dd AM/PM hh:mm` | 08-05 PM 01:30 |

### Toolbar Quick Formats

These appear in the **toolbar format dropdown** (`defaultFmt` in locale files):

| Format string            | Label          | Example output     |
| ------------------------ | -------------- | ------------------ |
| `yyyy-MM-dd`             | Date           | 2017-11-29         |
| `hh:mm AM/PM`            | Time           | 3:00 PM            |
| `hh:mm`                  | Time 24H       | 15:00              |
| `yyyy-MM-dd hh:mm AM/PM` | Date time      | 2017-11-29 3:00 PM |
| `yyyy-MM-dd hh:mm`       | Date time 24H  | 2017-11-29 15:00   |

### Auto-assigned Formats

These are set automatically by `genarate()` when a date string is typed. They are valid `ct.fa` values but are **not** in the format picker UI:

| Format string           | Example output     |
| ----------------------- | ------------------ |
| `dd/MM/yyyy`            | 29/11/2017         |
| `MM/dd/yyyy`            | 11/29/2017         |
| `M/d/yyyy`              | 11/29/2017         |
| `MM/dd/yy`              | 11/29/17           |
| `yyyy.MM.dd`            | 2017.11.29         |
| `dd.MM.yyyy`            | 29.11.2017         |
| `MM/dd/yyyy h:mm AM/PM` | 11/29/2017 2:30 PM |

### SSF format string conventions

SSF (the rendering engine in `packages/core/src/modules/ssf.js`) interprets format characters case-insensitively for date parts — `M`, `D`, `Y` are lowercased internally to `m`, `d`, `y`. The exception is `m` following an `h` (hour) token, where `m` becomes minutes (`M`). A backward pass over tokens ensures `h` correctly switches to 12-hour mode when `AM/PM` appears later in the format string.

| Token          | Meaning                             |
| -------------- | ----------------------------------- |
| `y` / `yy`     | 2-digit year                        |
| `yyyy`         | 4-digit year                        |
| `m` / `M`      | month, no leading zero              |
| `mm` / `MM`    | month, zero-padded                  |
| `d`            | day, no leading zero                |
| `dd`           | day, zero-padded                    |
| `h`            | 12-hour hour (when `AM/PM` present) |
| `hh`           | 12-hour hour, zero-padded           |
| `H`            | 24-hour hour (standalone)           |
| `m` after `h`  | minutes                             |
| `mm` after `h` | minutes, zero-padded                |
| `AM/PM`        | AM/PM indicator                     |

### Chinese Locale Formats (`zh` / `zh_TW`)

| Format string           | Example output    |
| ----------------------- | ----------------- |
| `yyyy"年"M"月"d"日"`    | 1930 年 8 月 5 日 |
| `M"月"d"日"`            | 8 月 5 日         |
| `上午/下午 hh:mm`       | 下午 02:30        |
| `上午/下午 h:mm`        | 下午 2:30         |
| `上午/下午 h:mm:ss`     | 下午 2:30:00      |
| `MM-dd 上午/下午 hh:mm` | 08-05 下午 02:30  |

### Excel Built-In Format Codes

These numeric codes are built into the SSF library (`packages/core/src/modules/ssf.js`) for Excel compatibility:

| Code | Format string   | Example      |
| ---- | --------------- | ------------ |
| 14   | `m/d/yy`        | 8/5/30       |
| 15   | `d-mmm-yy`      | 5-Aug-30     |
| 16   | `d-mmm`         | 5-Aug        |
| 17   | `mmm-yy`        | Aug-30       |
| 18   | `h:mm AM/PM`    | 2:30 PM      |
| 19   | `h:mm:ss AM/PM` | 2:30:00 PM   |
| 20   | `h:mm`          | 14:30        |
| 21   | `h:mm:ss`       | 14:30:00     |
| 22   | `m/d/yy h:mm`   | 8/5/30 14:30 |
| 45   | `mm:ss`         | 30:00        |
| 46   | `[h]:mm:ss`     | [14]:30:00   |
| 47   | `mmss.0`        | 3000.0       |

## Date Storage (Excel Serial Number System)

Dates are stored as `cell.v` — a decimal number representing days since **December 31, 1899** (same epoch as Microsoft Excel):

- Integer part = date (days offset from epoch)
- Decimal part = time (fraction of a 24-hour day)
- Supports 1904 date mode (subtract 1461 days) for compatibility
- Dates on or after March 1, 1900 get +1 day to replicate Excel's known leap year bug

Implemented in `datenum_local()` → `packages/core/src/modules/format.ts`

## Rendering Pipeline

```
cell.v  (Excel serial number)
    ↓
SSF.format(cell.ct.fa, cell.v)   ← packages/core/src/modules/ssf.js
    ↓
cell.m  (formatted string displayed in the grid)
```

`getCellValue()` in `packages/core/src/api/cell.ts` returns `cell.m` (not `cell.v`) for date cells.

## Data Validation for Date Cells

The data validation system (`packages/core/src/modules/dataVerification.ts`) uses **dayjs** for date comparisons.

Supported operators:

| Operator        | Description                   |
| --------------- | ----------------------------- |
| `between`       | Date is within a range        |
| `notBetween`    | Date is outside a range       |
| `equal`         | Date matches exactly          |
| `notEqualTo`    | Date does not match           |
| `earlierThan`   | Date is strictly before value |
| `noEarlierThan` | Date is on or after value     |
| `laterThan`     | Date is strictly after value  |
| `noLaterThan`   | Date is on or before value    |

## Key Source Files

| File                                            | Role                                                                             |
| ----------------------------------------------- | -------------------------------------------------------------------------------- |
| `packages/core/src/modules/validation.ts`       | `detectDateFormat()`, `isdatetime()` — input detection and format identification |
| `packages/core/src/modules/format.ts`           | `datenum_local()`, `genarate()` — serialize and assign format                    |
| `packages/core/src/modules/ssf.js`              | SSF rendering engine and Excel format code table                                 |
| `packages/core/src/api/cell.ts`                 | `getCellValue()`, `setCellFormat()` — display retrieval and format application   |
| `packages/core/src/modules/dataVerification.ts` | Date validation rules                                                            |
| `packages/core/src/modules/toolbar.ts`          | Toolbar format picker — maps format codes to `ct.t = "d"`                        |
| `packages/core/src/modules/dropCell.ts`         | Auto-fill series detection for date cells                                        |
| `packages/core/src/locale/`                     | Per-locale `dateFmtList` arrays listing available formats                        |
