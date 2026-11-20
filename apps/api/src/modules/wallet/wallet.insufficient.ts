/**
 * BR-192: the one place a WALLET_INSUFFICIENT problem is built, so checkout, transfers and any
 * other debit carry the same machine-readable `shortfall`, `balance` and `required` members.
 */
import { lessThan, parseMoney, subtract, type Money } from '@tohfa/shared-types';
import { AppError } from '../../http/problem.js';

export function walletInsufficientError(input: {
  balance: Money | string;
  required: Money | string;
  detail?: string;
  cause?: unknown;
}): AppError {
  const balance = parseMoney(input.balance);
  const required = parseMoney(input.required);
  const shortfall = lessThan(balance, required) ? subtract(required, balance) : parseMoney('0.00');
  return new AppError('WALLET_INSUFFICIENT', {
    status: 402,
    detail: input.detail ?? `Wallet balance INR ${balance} is insufficient for INR ${required}.`,
    extensions: { shortfall, balance, required },
    // Kept for clients written against the pre-BR-192 shape.
    meta: { shortfall },
    ...(input.cause === undefined ? {} : { cause: input.cause }),
  });
}
