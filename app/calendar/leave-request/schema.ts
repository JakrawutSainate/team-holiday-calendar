import { sanitize } from '@/src/libs/security';

export interface LeaveRequestInput {
  fromDate: string;
  fullName: string;
  signatureType: 'TEXT' | 'DRAW';
  signatureText?: string;
  signatureImage?: string;
}

export class LeaveRequestValidator {
  public static validate(input: LeaveRequestInput, language: string): string {
    const fromDate = sanitize(input.fromDate);
    const fullName = sanitize(input.fullName);
    const sigText = input.signatureText ? sanitize(input.signatureText) : '';

    if (!fromDate) {
      return language === 'th' ? 'กรุณาระบุวันที่เริ่มลา' : 'Please specify start date';
    }
    if (!fullName.trim()) {
      return language === 'th' ? 'กรุณาระบุชื่อ-นามสกุล' : 'Please specify name';
    }
    if (input.signatureType === 'TEXT' && !sigText.trim()) {
      return language === 'th' ? 'กรุณาพิมพ์ลายเซ็น' : 'Please type signature';
    }
    if (input.signatureType === 'DRAW' && !input.signatureImage) {
      return language === 'th' ? 'กรุณาวาดลายเซ็น' : 'Please draw signature';
    }
    return '';
  }
}
