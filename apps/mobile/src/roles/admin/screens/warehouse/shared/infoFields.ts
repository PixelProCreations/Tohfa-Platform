/**
 * Label / value fields for the two-column InfoCard (wallet-cashtopup/WalletParts).
 *
 * Detail screens build a flat list in design order, with `undefined` for a
 * field the API did not carry; pairFields drops those and packs the rest two
 * per row, so a hidden field never leaves a hole or a placeholder value.
 */
export interface InfoFieldValue {
  label: string;
  value: string;
}

export function pairFields(fields: readonly (InfoFieldValue | undefined)[]): InfoFieldValue[][] {
  const shown = fields.filter((field): field is InfoFieldValue => field !== undefined);
  const rows: InfoFieldValue[][] = [];
  for (let i = 0; i < shown.length; i += 2) rows.push(shown.slice(i, i + 2));
  return rows;
}
