import { Member } from '../types';

export class UserDataController {
  private members: Member[] = [];
  private updateCallback: () => void;

  constructor(updateCallback: () => void) {
    this.updateCallback = updateCallback;
  }

  public getMembers(): Member[] {
    return this.members;
  }

  public setMembers(data: Member[]): void {
    this.members = data;
    this.updateCallback();
  }

  public getFilteredMembers(searchQuery: string, selectedDept: string): Member[] {
    const query = searchQuery.toLowerCase().trim();
    return this.members.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(query) ||
        m.email.toLowerCase().includes(query) ||
        m.title.toLowerCase().includes(query);
      const matchesDept = selectedDept === 'ALL' || m.department === selectedDept;
      return matchesSearch && matchesDept;
    });
  }

  public async loadData(fetchMembers: () => Promise<Member[]>): Promise<void> {
    try {
      const data = await fetchMembers();
      this.members = data;
      this.updateCallback();
    } catch (e) {
      console.error('UserDataController loadData failed:', e);
    }
  }

  public exportToCSV(filteredMembers: Member[], language: 'en' | 'th'): void {
    const headers = [
      language === 'th' ? 'ชื่อ-นามสกุล' : 'Name',
      language === 'th' ? 'อีเมล' : 'Email',
      language === 'th' ? 'บทบาท' : 'Role',
      language === 'th' ? 'แผนก' : 'Department',
      language === 'th' ? 'ตำแหน่ง' : 'Title',
      language === 'th' ? 'โควตาลาป่วยคงเหลือ (วัน)' : 'Sick Leave Balance (Days)',
      language === 'th' ? 'โควตาลาพักร้อนคงเหลือ (วัน)' : 'Annual Leave Balance (Days)',
      language === 'th' ? 'ยอดโทเค็นสะสม' : 'Token Balance'
    ];

    const rows = filteredMembers.map((m) => [
      m.name,
      m.email,
      m.role,
      m.department,
      m.title,
      m.sickLeaveBalance ?? 30,
      m.annualLeaveBalance ?? 6,
      m.tokensBalance
    ]);

    const csvContent = [headers, ...rows]
      .map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const localDateStr = new Date().toLocaleDateString('sv-SE');
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `employee_data_${localDateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
