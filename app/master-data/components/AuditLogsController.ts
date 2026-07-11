import { AuditLog } from '../types';

export class AuditLogsController {
  private logs: AuditLog[] = [];
  private updateCallback: () => void;
  private startDate: string = '';
  private endDate: string = '';

  constructor(updateCallback: () => void) {
    this.updateCallback = updateCallback;
  }

  public getLogs(): AuditLog[] {
    return this.logs;
  }

  public setLogs(data: AuditLog[]): void {
    this.logs = data;
    this.updateCallback();
  }

  public setDateRange(start: string, end: string): void {
    this.startDate = start;
    this.endDate = end;
    this.updateCallback();
  }

  public getFilteredLogs(searchQuery: string, selectedAction: string): AuditLog[] {
    const query = searchQuery.toLowerCase().trim();
    return this.logs.filter((log) => {
      const matchesSearch =
        log.userName.toLowerCase().includes(query) ||
        log.details.toLowerCase().includes(query);
      const matchesAction = selectedAction === 'ALL' || log.action === selectedAction;

      let matchesDate = true;
      if (this.startDate) {
        // Log dates are ISO strings. Compare local date or string start
        const logDate = new Date(log.createdAt).toLocaleDateString('sv-SE');
        matchesDate = matchesDate && logDate >= this.startDate;
      }
      if (this.endDate) {
        const logDate = new Date(log.createdAt).toLocaleDateString('sv-SE');
        matchesDate = matchesDate && logDate <= this.endDate;
      }

      return matchesSearch && matchesAction && matchesDate;
    });
  }

  public async loadData(fetchLogs: () => Promise<AuditLog[]>): Promise<void> {
    try {
      const data = await fetchLogs();
      this.logs = data;
      this.updateCallback();
    } catch (e) {
      console.error('AuditLogsController loadData failed:', e);
    }
  }

  public exportToCSV(filteredLogs: AuditLog[], language: 'en' | 'th'): void {
    const headers = [
      language === 'th' ? 'วันที่/เวลา' : 'Timestamp',
      language === 'th' ? 'ผู้ดำเนินการ (Admin)' : 'Admin Operator',
      language === 'th' ? 'ประเภทการกระทำ' : 'Action Type',
      language === 'th' ? 'รายละเอียด' : 'Details'
    ];

    const rows = filteredLogs.map((log) => [
      new Date(log.createdAt).toLocaleString(language === 'en' ? 'en-US' : 'th-TH'),
      log.userName,
      log.action,
      log.details
    ]);

    const csvContent = [headers, ...rows]
      .map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const localDateStr = new Date().toLocaleDateString('sv-SE');
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `system_audit_logs_${localDateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
