import { sanitize } from '@/src/libs/security';

export class MasterDataValidator {
  public static sanitizeSearch(query: string): string {
    return sanitize(query).trim();
  }
}
