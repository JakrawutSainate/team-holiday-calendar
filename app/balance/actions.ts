'use server';

import { BalanceValidator, RedeemTokensInput } from './schema';
import { sanitize } from '@/src/libs/security';

export async function redeemTokensAction(input: RedeemTokensInput) {
  const sanitizedInput: RedeemTokensInput = {
    tokensToRedeem: Number(input.tokensToRedeem),
    reason: sanitize(input.reason)
  };
  const error = BalanceValidator.validateRedeem(sanitizedInput);
  if (error !== '') {
    return { success: false, error };
  }

  console.log('Tokens redeemed on server:', sanitizedInput);
  return { success: true, error: '' };
}

export async function requestCarryOverAction() {
  console.log('Carry-over token redemption requested on server.');
  return { success: true, error: '' };
}
