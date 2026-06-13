'use server';

import { BalanceValidator, RedeemTokensInput } from './schema';

export async function redeemTokensAction(input: RedeemTokensInput) {
  const error = BalanceValidator.validateRedeem(input);
  if (error) {
    return { success: false, error };
  }

  console.log('Tokens redeemed on server:', input);
  return { success: true };
}

export async function requestCarryOverAction() {
  console.log('Carry-over token redemption requested on server.');
  return { success: true };
}
