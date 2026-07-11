import { AuditLog } from '../types';

export class AuditLogsController {
  private logs: AuditLog[] = [];
  private updateCallback: () => void;

  constructor(updateCallback: () => void) {
    this.updateCallback = updateCallback;
  }

  public getLogs(): AuditLog[] {
    return this.logs;
  }

  public getFilteredLogs(searchQuery: string, selectedAction: string): AuditLog[] {
    const query = searchQuery.toLowerCase().trim();
    return this.logs.filter((log) => {
      const matchesSearch =
        log.userName.toLowerCase().includes(query) ||
        log.details.toLowerCase().includes(query);
      const matchesAction = selectedAction === 'ALL' || log.action === selectedAction;
      return matchesSearch && matchesAction;
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
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `system_audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
