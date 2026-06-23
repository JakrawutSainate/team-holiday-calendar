'use server';

import { BalanceValidator, RedeemTokensInput } from './schema';
import { sanitize } from '@/src/libs/security';
import { runGraphQLAction } from '@/src/actions/auth';

export async function redeemTokensAction(input: RedeemTokensInput) {
  const sanitizedInput: RedeemTokensInput = {
    tokensToRedeem: Number(input.tokensToRedeem),
    reason: sanitize(input.reason)
  };
  const error = BalanceValidator.validateRedeem(sanitizedInput);
  if (error !== '') {
    return { success: false, error };
  }

  try {
    const query = `
      mutation redeemTokens($amount: Float!, $description: String!) {
        redeemTokens(amount: $amount, description: $description) {
          id
        }
      }
    `;
    const res = await runGraphQLAction(query, {
      amount: sanitizedInput.tokensToRedeem,
      description: sanitizedInput.reason || 'Token Rollover/Payout Request'
    });

    if (res.errors && res.errors.length > 0) {
      return { success: false, error: res.errors[0].message };
    }
    return { success: true, error: '' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Connection failed' };
  }
}

export async function requestCarryOverAction() {
  console.log('Carry-over token redemption requested on server.');
  return { success: true, error: '' };
}
