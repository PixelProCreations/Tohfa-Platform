/**
 * Pure money logic for the direct-sale flow (no react-native import so vitest
 * can run it). The cart carries `pricePerKg` in rupees and a kg quantity as
 * plain numbers (SaleProduct); every total is computed here in integer paise.
 */
import { fromPaise, multiply, toPaise, type Paise } from '@tohfa/shared-types';
import { parseRupeesToPaise, rupeesNumberToPaise } from '../../../money/paise';

export interface PriceLine {
  pricePerKg: number;
  quantityKg: number;
}

export type PaymentMethodKind = 'Cash' | 'UPI' | 'Card' | 'Wallet';

export interface PaymentEvaluation {
  /** Whether the Confirm Payment button may be enabled. */
  canConfirm: boolean;
  /** Wallet method only: how much the wallet is short by (0 when it covers the sale). */
  shortfallPaise: Paise;
  /** Wallet method only: balance left after paying (never negative; see shortfallPaise). */
  balanceAfterPaise: Paise;
  /** Cash method only: change to hand back; 0 until a valid received amount covers the due. */
  changePaise: Paise;
}

/** One line: price per kg x kg, rounded half-up to the paisa (shared-types multiply). */
export function lineTotalPaise(pricePerKg: number, quantityKg: number): Paise {
  const unit = fromPaise(rupeesNumberToPaise(pricePerKg));
  return toPaise(multiply(unit, quantityKg));
}

/** Sum of line totals in integer paise. */
export function cartTotalPaise(lines: readonly PriceLine[]): Paise {
  let total = 0;
  for (const line of lines) total += lineTotalPaise(line.pricePerKg, line.quantityKg);
  return total;
}

/**
 * What the Payment screen shows and whether it may confirm.
 *
 * BR-17: wallet-first, an order is never confirmed with an unpaid balance, so a
 * wallet shortfall disables confirm (the shortfall must be topped up first; no
 * split payment is offered). Cash: confirm needs a valid received amount that
 * covers the due. UPI / Card keep their previous behaviour (not gated here).
 * UX only; the server remains the authority.
 */
export function evaluatePayment(args: {
  method: PaymentMethodKind;
  amountDuePaise: Paise;
  walletBalancePaise: Paise;
  receivedInput: string;
}): PaymentEvaluation {
  const { method, amountDuePaise, walletBalancePaise, receivedInput } = args;

  const shortfallPaise = Math.max(0, amountDuePaise - walletBalancePaise);
  const balanceAfterPaise = Math.max(0, walletBalancePaise - amountDuePaise);

  const receivedPaise = parseRupeesToPaise(receivedInput);
  const covered = receivedPaise !== null && receivedPaise >= amountDuePaise;
  const changePaise = covered ? receivedPaise - amountDuePaise : 0;

  let canConfirm = true;
  if (method === 'Wallet') canConfirm = shortfallPaise === 0;
  else if (method === 'Cash') canConfirm = covered;

  return { canConfirm, shortfallPaise, balanceAfterPaise, changePaise };
}
