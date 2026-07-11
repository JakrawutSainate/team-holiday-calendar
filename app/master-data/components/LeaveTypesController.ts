export interface LeaveTypeRule {
  code: string;
  title: string;
  titleEn: string;
  quota: string;
  quotaEn: string;
  cost: string;
  costDesc: string;
  costDescEn: string;
  paidStatus: string;
  paidStatusEn: string;
  rule: string;
  ruleEn: string;
}

export class LeaveTypesController {
  public getLeaveTypes(): LeaveTypeRule[] {
    return [
      {
        code: 'SICK',
        title: 'ลาป่วย',
        titleEn: 'Sick Leave',
        quota: '30 วัน / ปี',
        quotaEn: '30 Days / Year',
        cost: '0 Tokens',
        costDesc: 'ไม่ต้องใช้โทเค็น',
        costDescEn: 'No token required',
        paidStatus: 'ได้รับค่าจ้างปกติ (Paid)',
        paidStatusEn: 'Fully Paid',
        rule: 'อนุญาตสำหรับกรณีการเจ็บป่วยจริง และต้องมีใบรับรองแพทย์แนบหากเป็นการลาป่วยตั้งแต่ 3 วันขึ้นไป',
        ruleEn: 'Applicable for medical illnesses. Requires official medical certificate attachments for leaves longer than 3 days.'
      },
      {
        code: 'ANNUAL',
        title: 'ลาพักร้อน',
        titleEn: 'Annual Leave',
        quota: '6 วัน / ปี',
        quotaEn: '6 Days / Year',
        cost: '0 Tokens',
        costDesc: 'ไม่ต้องใช้โทเค็น',
        costDescEn: 'No token required',
        paidStatus: 'ได้รับค่าจ้างปกติ (Paid)',
        paidStatusEn: 'Fully Paid',
        rule: 'วันลาพักร้อนประจำปีตามเกณฑ์องค์กร ควรส่งเอกสารขอล่วงหน้าเพื่อให้หัวหน้างานสามารถอนุมัติได้ทันเวลา',
        ruleEn: 'Annual vacation allowance. Requests should be submitted in advance for team workload review and manager approvals.'
      },
      {
        code: 'CASUAL',
        title: 'ลากิจ',
        titleEn: 'Casual Leave',
        quota: 'ตามความจำเป็น (ตามสิทธิ์ผู้ปฏิบัติงาน)',
        quotaEn: 'As necessary (Based on employee rights)',
        cost: '0 Tokens',
        costDesc: 'ไม่ต้องใช้โทเค็น',
        costDescEn: 'No token required',
        paidStatus: 'ได้รับค่าจ้างปกติ (Paid)',
        paidStatusEn: 'Fully Paid',
        rule: 'สำหรับการทำธุระส่วนตัวที่ไม่สามารถเลี่ยงหรือเลื่อนได้ ต้องได้รับอนุมัติล่วงหน้าจากผู้จัดการหรือหัวหน้างาน',
        ruleEn: 'For unavoidable personal matters. Prior supervisor approvals must be logged.'
      },
      {
        code: 'COMPENSATORY',
        title: 'ลาชดเชยเวรทำงาน',
        titleEn: 'Compensatory Off',
        quota: 'ไม่จำกัด (ขึ้นอยู่กับยอดโทเค็นสะสม)',
        quotaEn: 'Unlimited (Depends on token balance)',
        cost: '1 Token / วัน',
        costDesc: 'หัก 1 โทเค็นต่อการลา 1 วัน',
        costDescEn: 'Deducts 1 token per day',
        paidStatus: 'ได้รับค่าจ้างปกติ (Paid)',
        paidStatusEn: 'Fully Paid',
        rule: 'วันลาหยุดชดเชยพิเศษที่ได้จากการทำงานเสาร์-อาทิตย์หรือเวรหยุดนักขัตฤกษ์ โดยใช้ 1 โทเค็นเคลมวันหยุดได้ 1 วัน และขึ้นอยู่กับขีดจำกัดคนลาของทีมประจำวัน',
        ruleEn: 'Earned by working weekend or public holiday shifts. 1 Token allows claiming 1 day off, subject to daily capacity limits.'
      }
    ];
  }
}
