/**
 * CSV writer for the report exports (BR-76). Pure: no I/O, no database.
 *
 * Two jobs that must never be skipped:
 *
 *  1. RFC 4180 quoting. A cell holding a comma, a double quote, a CR or an LF is wrapped in double
 *     quotes with each inner double quote doubled. Rows end in CRLF, the last one too.
 *  2. CSV injection. A spreadsheet treats a cell that starts with `=`, `+`, `-`, `@`, a tab or a CR
 *     as a formula. Any TEXT cell starting with one of them is prefixed with a single quote, which
 *     the spreadsheet hides and which turns the cell back into text. The prefix is applied BEFORE
 *     the quoting, so a guarded cell is still quoted when it needs to be.
 *
 * Number columns are not guarded (`-5.00` is a number, not a formula) but are checked to BE numbers:
 * a text value that ends up in a number column would otherwise skip the guard. That is a bug in the
 * caller, so it throws instead of quietly writing a file.
 */

export type CsvColumnKind = 'text' | 'number';

export interface CsvColumn {
  /** The stable machine name written in the header row. */
  name: string;
  kind: CsvColumnKind;
}

/** `null` is an empty cell. */
export type CsvCell = string | null;

const FORMULA_TRIGGERS = new Set(['=', '+', '-', '@', '\t', '\r']);
const NEEDS_QUOTING = /[",\r\n]/;
const NUMERIC = /^-?[0-9]+(\.[0-9]+)?$/;

/** Neutralises a text cell that a spreadsheet would run as a formula. */
export function guardCell(value: string): string {
  const first = value.charAt(0);
  return FORMULA_TRIGGERS.has(first) ? `'${value}` : value;
}

function quote(value: string): string {
  return NEEDS_QUOTING.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

function cellText(column: CsvColumn, cell: CsvCell): string {
  if (cell === null) return '';
  if (column.kind === 'number') {
    if (!NUMERIC.test(cell)) throw new Error(`CSV column "${column.name}" is a number column but got a non-numeric value`);
    return cell;
  }
  return quote(guardCell(cell));
}

/** The whole file: a header row, then one line per row, every line ending in CRLF. */
export function toCsv(columns: readonly CsvColumn[], rows: ReadonlyArray<readonly CsvCell[]>): string {
  const header = columns.map((column) => quote(column.name)).join(',');
  const body = rows.map((row) => {
    if (row.length !== columns.length) {
      throw new Error(`CSV row has ${row.length} cells but the header has ${columns.length}`);
    }
    return columns.map((column, i) => cellText(column, row[i] as CsvCell)).join(',');
  });
  return [header, ...body].map((line) => `${line}\r\n`).join('');
}
