import { sanitize } from '@/src/libs/security';

export interface RedeemTokensInput {
  tokensToRedeem: number;
  reason: string;
}

export class BalanceValidator {
  public static validateRedeem(input: RedeemTokensInput): string {
    const reason = sanitize(input.reason);

    if (input.tokensToRedeem <= 0) {
      return 'Tokens to redeem must be greater than 0';
    }
    if (!reason.trim()) {
      return 'Reason is required';
    }
    return '';
  }
}
