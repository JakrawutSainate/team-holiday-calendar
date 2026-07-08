import { CalendarEvent, TeamMember, botHolidays2026 } from '@/src/libs/calendarData';

export interface MatrixCell {
  date: string; // YYYY-MM-DD
  dayNum: number;
  status: 'LEAVE' | 'WEEKEND_WORK' | 'HOLIDAY_WORK' | 'PUBLIC_HOLIDAY' | 'WEEKEND' | 'NONE';
  label: string;
  details?: string;
}

export interface MemberMatrixRow {
  member: TeamMember;
  cells: MatrixCell[];
  totalLeave: number;
  totalEarned: number;
}

export abstract class CalendarExporter {
  protected year: number;
  protected month: number;
  protected events: CalendarEvent[];
  protected members: TeamMember[];
  protected language: 'en' | 'th';
  protected selectedUserId?: string;

  constructor(
    year: number,
    month: number,
    events: CalendarEvent[],
    members: TeamMember[],
    language: 'en' | 'th' = 'th',
    selectedUserId?: string
  ) {
    this.year = year;
    this.month = month;
    this.language = language;
    this.selectedUserId = selectedUserId;
    
    if (selectedUserId && selectedUserId !== 'all') {
      this.members = members.filter(m => m.id === selectedUserId);
      this.events = events.filter(e => e.userId === selectedUserId || e.userId === 'system-holiday');
    } else {
      this.members = members;
      this.events = events;
    }
  }

  protected t(key: string): string {
    const dict: Record<'en' | 'th', Record<string, string>> = {
      en: {
        reportTitle: 'Monthly Leave & Special Shift Summary',
        employeeName: 'Employee Name',
        title: 'Title',
        date: 'Date',
        totalLeaves: 'Total Leaves (L)',
        specialShifts: 'Special Shifts (W/H)',
        publicHolidaysTitle: 'Public Holidays This Month',
        dailyLeavesTitle: 'Daily Leave Summary',
        legendTitle: 'Legend',
        descL: 'Normal Leave (Deducts 1.0 Token)',
        descW: 'Weekend Shift (+1.0 Token)',
        descH: 'Holiday Shift (+1.0 Token)',
        descPH: 'General Public Holiday',
        descWE: 'General Weekend',
        noHolidays: 'No public holidays this month',
        noLeaves: 'No leaves this month',
        monthPrefix: 'For',
        datePrefix: 'Date',
      },
      th: {
        reportTitle: 'รายงานสรุปการลาและวันทำงานพิเศษ',
        employeeName: 'รายชื่อพนักงาน',
        title: 'ตำแหน่ง',
        date: 'วันที่',
        totalLeaves: 'จำนวนวันลา (L)',
        specialShifts: 'วันทำงานพิเศษ (W/H)',
        publicHolidaysTitle: 'วันหยุดเทศกาลในเดือนนี้',
        dailyLeavesTitle: 'สรุปรายชื่อผู้ลาหยุดรายวัน',
        legendTitle: 'คำอธิบายสัญลักษณ์ (Legend)',
        descL: 'ลาหยุดปกติ (หัก 1.0 Token)',
        descW: 'ทำงานวันเสาร์-อาทิตย์ (+1.0 Token)',
        descH: 'ทำงานวันหยุดนักขัตฤกษ์ (+1.0 Token)',
        descPH: 'วันหยุดนักขัตฤกษ์ทั่วไป',
        descWE: 'วันเสาร์-อาทิตย์ทั่วไป',
        noHolidays: 'ไม่มีวันหยุดเทศกาลในเดือนนี้',
        noLeaves: 'ไม่มีผู้ลาหยุดในเดือนนี้',
        monthPrefix: 'ประจำเดือน',
        datePrefix: 'วันที่',
      }
    };
    return dict[this.language][key] || key;
  }

  // Get total days of the current month
  protected getDaysInMonth(): number {
    return new Date(this.year, this.month, 0).getDate();
  }

  // Get public holiday name for a specific date
  protected getPublicHoliday(dateStr: string): string | null {
    const holiday = botHolidays2026.find((h) => h.date === dateStr);
    return holiday ? (this.language === 'en' ? holiday.nameEn : holiday.nameTh) : null;
  }

  // Check if a date is weekend
  protected isWeekend(dateStr: string): boolean {
    const day = new Date(dateStr).getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  }

  // Generate Matrix data structure
  public generateMatrix(): MemberMatrixRow[] {
    const daysCount = this.getDaysInMonth();
    const matrix: MemberMatrixRow[] = [];

    // Filter events for this month
    const monthPrefix = `${this.year}-${this.month.toString().padStart(2, '0')}`;
    const monthlyEvents = this.events.filter((e) => e.date.startsWith(monthPrefix));

    for (const member of this.members) {
      const cells: MatrixCell[] = [];
      let totalLeave = 0;
      let totalEarned = 0;

      for (let day = 1; day <= daysCount; day++) {
        const dateStr = `${monthPrefix}-${day.toString().padStart(2, '0')}`;
        const isWe = this.isWeekend(dateStr);
        const publicHolidayName = this.getPublicHoliday(dateStr);

        // Find events for this member on this date
        const memberEvent = monthlyEvents.find((e) => e.userId === member.id && e.date === dateStr);

        let cellStatus: MatrixCell['status'] = 'NONE';
        let cellLabel = '';
        let cellDetails = memberEvent?.details || undefined;

        if (memberEvent) {
          if (memberEvent.status === 'COMPENSATORY_OFF' || memberEvent.status === 'NORMAL') {
            cellStatus = 'LEAVE';
            cellLabel = 'L'; // Leave
            totalLeave += 1;
          } else if (memberEvent.status === 'WEEKEND_WORK') {
            cellStatus = 'WEEKEND_WORK';
            cellLabel = 'W'; // Weekend work
            totalEarned += 1;
          } else if (memberEvent.status === 'HOLIDAY_WORK') {
            cellStatus = 'HOLIDAY_WORK';
            cellLabel = 'H'; // Holiday work
            totalEarned += 1;
          }
        } else if (publicHolidayName) {
          cellStatus = 'PUBLIC_HOLIDAY';
          cellLabel = 'PH';
          cellDetails = publicHolidayName;
        } else if (isWe) {
          cellStatus = 'WEEKEND';
          cellLabel = 'WE';
        }

        cells.push({
          date: dateStr,
          dayNum: day,
          status: cellStatus,
          label: cellLabel,
          details: cellDetails,
        });
      }

      matrix.push({
        member,
        cells,
        totalLeave,
        totalEarned,
      });
    }

    return matrix;
  }

  // Get summary of who is on leave on which day
  protected getDailyLeavesSummary(): { day: number; names: string[] }[] {
    const daysCount = this.getDaysInMonth();
    const monthPrefix = `${this.year}-${this.month.toString().padStart(2, '0')}`;
    const monthlyEvents = this.events.filter((e) => e.date.startsWith(monthPrefix));
    const summary: { day: number; names: string[] }[] = [];

    for (let day = 1; day <= daysCount; day++) {
      const dateStr = `${monthPrefix}-${day.toString().padStart(2, '0')}`;
      const leavesOnDay = monthlyEvents.filter(
        (e) => e.date === dateStr && (e.status === 'COMPENSATORY_OFF' || e.status === 'NORMAL')
      );

      if (leavesOnDay.length > 0) {
        const names = leavesOnDay.map((e) => {
          const member = this.members.find((m) => m.id === e.userId);
          return member ? `${member.name} (${member.title})` : e.userName;
        });
        summary.push({ day, names });
      }
    }

    return summary;
  }

  // Method to be implemented by child classes
  public abstract export(): void;
}

export class ExcelExporter extends CalendarExporter {
  public override export(): void {
    const matrix = this.generateMatrix();
    const daysCount = this.getDaysInMonth();
    const monthNamesTh = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const monthNamesEn = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthName = this.language === 'en' ? monthNamesEn[this.month - 1] : monthNamesTh[this.month - 1];

    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <style>
          table { border-collapse: collapse; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
          th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; font-size: 11pt; }
          th { background-color: #f1f5f9; font-weight: bold; color: #1e293b; }
          .member-name { text-align: left; background-color: #f8fafc; font-weight: bold; }
          .cell-leave { background-color: #fee2e2; color: #991b1b; font-weight: bold; }
          .cell-weekend-work { background-color: #dcfce7; color: #166534; font-weight: bold; }
          .cell-holiday-work { background-color: #bbf7d0; color: #14532d; font-weight: bold; }
          .cell-public-holiday { background-color: #e0f2fe; color: #0369a1; font-weight: bold; }
          .cell-weekend { background-color: #f1f5f9; color: #64748b; }
          .title-header { font-size: 16pt; font-weight: bold; padding: 10px 0; text-align: left; border: none; }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <td colspan="${daysCount + 4}" class="title-header">
              ${this.t('reportTitle')} ${this.t('monthPrefix')} ${monthName} ${this.year}
            </td>
          </tr>
          <tr>
            <th rowspan="2">${this.t('employeeName')}</th>
            <th rowspan="2">${this.t('title')}</th>
            <th colspan="${daysCount}">${this.t('date')}</th>
            <th colspan="2">${this.language === 'en' ? 'Summary' : 'สรุปประจำเดือน'}</th>
          </tr>
          <tr>
            ${Array.from({ length: daysCount }, (_, i) => `<th>${i + 1}</th>`).join('')}
            <th>${this.t('totalLeaves')}</th>
            <th>${this.t('specialShifts')}</th>
          </tr>
    `;

    for (const row of matrix) {
      html += `
        <tr>
          <td class="member-name">${row.member.name}</td>
          <td style="text-align: left; color: #475569;">${row.member.title}</td>
          ${row.cells.map((cell) => {
            let className = '';
            if (cell.status === 'LEAVE') className = 'cell-leave';
            else if (cell.status === 'WEEKEND_WORK') className = 'cell-weekend-work';
            else if (cell.status === 'HOLIDAY_WORK') className = 'cell-holiday-work';
            else if (cell.status === 'PUBLIC_HOLIDAY') className = 'cell-public-holiday';
            else if (cell.status === 'WEEKEND') className = 'cell-weekend';

            return `<td class="${className}" title="${cell.details || ''}">${cell.label}</td>`;
          }).join('')}
          <td style="font-weight: bold; background-color: #fffbeb; color: #b45309;">${row.totalLeave}</td>
          <td style="font-weight: bold; background-color: #f0fdf4; color: #15803d;">${row.totalEarned}</td>
        </tr>
      `;
    }

    const monthPrefix = `${this.year}-${this.month.toString().padStart(2, '0')}`;
    const monthlyHolidays = botHolidays2026.filter((h) => h.date.startsWith(monthPrefix));

    if (monthlyHolidays.length > 0) {
      html += `
        <tr><td colspan="${daysCount + 4}" style="border: none; height: 20px;"></td></tr>
        <tr>
          <th colspan="2" style="text-align: left; background-color: #e0f2fe; color: #0369a1;">${this.t('publicHolidaysTitle')}</th>
          <th colspan="${daysCount + 2}" style="text-align: left; background-color: #e0f2fe; color: #0369a1;">${this.language === 'en' ? 'Details' : 'รายละเอียด'}</th>
        </tr>
      `;
      for (const h of monthlyHolidays) {
        const day = parseInt(h.date.split('-')[2]);
        html += `
          <tr>
            <td style="text-align: left; font-weight: bold;">${this.t('datePrefix')} ${day}</td>
            <td colspan="${daysCount + 3}" style="text-align: left;">${this.language === 'en' ? h.nameEn : h.nameTh}</td>
          </tr>
        `;
      }
    }

    const dailyLeaves = this.getDailyLeavesSummary();
    if (dailyLeaves.length > 0) {
      html += `
        <tr><td colspan="${daysCount + 4}" style="border: none; height: 20px;"></td></tr>
        <tr>
          <th colspan="2" style="text-align: left; background-color: #fef3c7; color: #b45309;">${this.t('dailyLeavesTitle')}</th>
          <th colspan="${daysCount + 2}" style="text-align: left; background-color: #fef3c7; color: #b45309;">${this.language === 'en' ? 'List of employees on leave (Title)' : 'รายชื่อพนักงานที่ลาหยุด (ตำแหน่ง)'}</th>
        </tr>
      `;
      for (const item of dailyLeaves) {
        html += `
          <tr>
            <td style="text-align: left; font-weight: bold;">${this.t('datePrefix')} ${item.day}</td>
            <td colspan="${daysCount + 3}" style="text-align: left;">${item.names.join(', ')}</td>
          </tr>
        `;
      }
    }

    // Legend
    html += `
        <tr><td colspan="${daysCount + 4}" style="border: none; height: 20px;"></td></tr>
        <tr>
          <th colspan="2" style="text-align: left; background-color: #f1f5f9;">${this.t('legendTitle')}</th>
          <td colspan="${daysCount + 2}" style="text-align: left; font-size: 10pt; line-height: 1.6;">
            <span style="background-color: #fee2e2; color: #991b1b; padding: 2px 6px; font-weight: bold; border-radius: 4px; border: 1px solid #fca5a5;">L</span> = ${this.t('descL')} &nbsp;&nbsp;&nbsp;&nbsp;
            <span style="background-color: #dcfce7; color: #166534; padding: 2px 6px; font-weight: bold; border-radius: 4px; border: 1px solid #86efac;">W</span> = ${this.t('descW')} &nbsp;&nbsp;&nbsp;&nbsp;
            <span style="background-color: #bbf7d0; color: #14532d; padding: 2px 6px; font-weight: bold; border-radius: 4px; border: 1px solid #86efac;">H</span> = ${this.t('descH')} &nbsp;&nbsp;&nbsp;&nbsp;
            <span style="background-color: #e0f2fe; color: #0369a1; padding: 2px 6px; font-weight: bold; border-radius: 4px; border: 1px solid #7dd3fc;">PH</span> = ${this.t('descPH')} &nbsp;&nbsp;&nbsp;&nbsp;
            <span style="background-color: #f1f5f9; color: #64748b; padding: 2px 6px; font-weight: bold; border-radius: 4px; border: 1px solid #cbd5e1;">WE</span> = ${this.t('descWE')}
          </td>
        </tr>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const today = new Date();
    const dateSuffix = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    link.download = `calendar_report_${dateSuffix}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  }
}

export class PdfExporter extends CalendarExporter {
  public override export(): void {
    const existing = document.getElementById('print-matrix-modal');
    if (existing) {
      existing.remove();
    }

    const today = new Date();
    const dateSuffix = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const filename = `calendar_report_${dateSuffix}`;
    const originalTitle = document.title;
    document.title = filename;

    const matrix = this.generateMatrix();
    const daysCount = this.getDaysInMonth();
    const monthNamesTh = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const monthNamesEn = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthName = this.language === 'en' ? monthNamesEn[this.month - 1] : monthNamesTh[this.month - 1];

    const printContainer = document.createElement('div');
    printContainer.id = 'print-matrix-modal';
    printContainer.style.display = 'none';
    printContainer.className = 'print-only-layout';

    const monthPrefix = `${this.year}-${this.month.toString().padStart(2, '0')}`;
    const monthlyHolidays = botHolidays2026.filter((h) => h.date.startsWith(monthPrefix));
    const dailyLeaves = this.getDailyLeavesSummary();

    printContainer.innerHTML = `
      <div style="max-width: 100%; margin: 0 auto; font-family: 'Geist', 'Inter', sans-serif;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px;">
          <div>
            <h1 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0;">HolidayHQ Calendar Report</h1>
            <p style="font-size: 12px; color: #475569; margin: 2px 0 0 0;">${this.t('reportTitle')} ${this.t('monthPrefix')} ${monthName} ${this.year}</p>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 12px;">
          <thead>
            <tr>
              <th rowspan="2" style="border: 1px solid #e2e8f0; background-color: #f8fafc; padding: 5px; text-align: left; font-weight: bold;">${this.t('employeeName')}</th>
              <th rowspan="2" style="border: 1px solid #e2e8f0; background-color: #f8fafc; padding: 5px; text-align: left; font-weight: bold;">${this.t('title')}</th>
              <th colspan="${daysCount}" style="border: 1px solid #e2e8f0; background-color: #f8fafc; padding: 4px; text-align: center; font-weight: bold;">${this.t('date')}</th>
              <th colspan="2" style="border: 1px solid #e2e8f0; background-color: #f8fafc; padding: 4px; text-align: center; font-weight: bold;">${this.language === 'en' ? 'Sum' : 'รวม'}</th>
            </tr>
            <tr>
              ${Array.from({ length: daysCount }, (_, i) => `<th style="border: 1px solid #e2e8f0; background-color: #f8fafc; padding: 3px; text-align: center; font-weight: bold; width: 22px;">${i + 1}</th>`).join('')}
              <th style="border: 1px solid #e2e8f0; background-color: #fffbeb; padding: 3px; text-align: center; color: #b45309; font-weight: bold; width: 32px;">L</th>
              <th style="border: 1px solid #e2e8f0; background-color: #f0fdf4; padding: 3px; text-align: center; color: #15803d; font-weight: bold; width: 32px;">W/H</th>
            </tr>
          </thead>
          <tbody>
            ${matrix.map((row) => `
              <tr>
                <td style="border: 1px solid #e2e8f0; padding: 5px; text-align: left; font-weight: bold; color: #0f172a; white-space: nowrap;">${row.member.name}</td>
                <td style="border: 1px solid #e2e8f0; padding: 5px; text-align: left; color: #475569; white-space: nowrap;">${row.member.title}</td>
                ${row.cells.map((cell) => {
                  let bgColor = '#ffffff';
                  let color = '#0f172a';
                  let weight = 'normal';
                  
                  if (cell.status === 'LEAVE') {
                    bgColor = '#fee2e2';
                    color = '#991b1b';
                    weight = 'bold';
                  } else if (cell.status === 'WEEKEND_WORK' || cell.status === 'HOLIDAY_WORK') {
                    bgColor = '#dcfce7';
                    color = '#166534';
                    weight = 'bold';
                  } else if (cell.status === 'PUBLIC_HOLIDAY') {
                    bgColor = '#e0f2fe';
                    color = '#0369a1';
                    weight = 'bold';
                  } else if (cell.status === 'WEEKEND') {
                    bgColor = '#f8fafc';
                    color = '#94a3b8';
                  }

                  return `
                    <td style="border: 1px solid #e2e8f0; padding: 3px; text-align: center; background-color: ${bgColor}; color: ${color}; font-weight: ${weight};" title="${cell.details || ''}">
                      ${cell.label || ''}
                    </td>
                  `;
                }).join('')}
                <td style="border: 1px solid #e2e8f0; padding: 3px; text-align: center; background-color: #fffbeb; color: #b45309; font-weight: bold;">${row.totalLeave}</td>
                <td style="border: 1px solid #e2e8f0; padding: 3px; text-align: center; background-color: #f0fdf4; color: #15803d; font-weight: bold;">${row.totalEarned}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="display: grid; grid-template-columns: 1fr 1.2fr 1.8fr; gap: 20px; font-size: 10px;">
          <div>
            <h3 style="font-size: 11px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">${this.t('legendTitle')}</h3>
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <div style="display: flex; align-items: center; gap: 8px;"><span style="display: inline-block; width: 20px; text-align: center; background-color: #fee2e2; color: #991b1b; font-weight: bold; border-radius: 4px; border: 1px solid #fca5a5;">L</span> <span>${this.t('descL')}</span></div>
              <div style="display: flex; align-items: center; gap: 8px;"><span style="display: inline-block; width: 20px; text-align: center; background-color: #dcfce7; color: #166534; font-weight: bold; border-radius: 4px; border: 1px solid #86efac;">W</span> <span>${this.t('descW')}</span></div>
              <div style="display: flex; align-items: center; gap: 8px;"><span style="display: inline-block; width: 20px; text-align: center; background-color: #dcfce7; color: #14532d; font-weight: bold; border-radius: 4px; border: 1px solid #86efac;">H</span> <span>${this.t('descH')}</span></div>
              <div style="display: flex; align-items: center; gap: 8px;"><span style="display: inline-block; width: 20px; text-align: center; background-color: #e0f2fe; color: #0369a1; font-weight: bold; border-radius: 4px; border: 1px solid #7dd3fc;">PH</span> <span>${this.t('descPH')}</span></div>
              <div style="display: flex; align-items: center; gap: 8px;"><span style="display: inline-block; width: 20px; text-align: center; background-color: #f8fafc; color: #94a3b8; border-radius: 4px; border: 1px solid #e2e8f0;">WE</span> <span>${this.t('descWE')}</span></div>
            </div>
          </div>
          <div>
            <h3 style="font-size: 11px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">${this.t('publicHolidaysTitle')}</h3>
            ${monthlyHolidays.length > 0 ? `
              <ul style="margin: 0; padding-left: 16px; display: grid; grid-template-columns: 1fr; gap: 4px;">
                ${monthlyHolidays.map((h) => {
                  const day = parseInt(h.date.split('-')[2]);
                  return `<li><strong>${this.t('datePrefix')} ${day}:</strong> ${this.language === 'en' ? h.nameEn : h.nameTh}</li>`;
                }).join('')}
              </ul>
            ` : `<p style="color: #64748b; margin: 0;">${this.t('noHolidays')}</p>`}
          </div>
          <div>
            <h3 style="font-size: 11px; font-weight: 700; color: #b45309; margin: 0 0 6px 0; border-bottom: 1px solid #fef3c7; padding-bottom: 4px;">${this.t('dailyLeavesTitle')}</h3>
            ${dailyLeaves.length > 0 ? `
              <div style="max-height: 100px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; padding-right: 4px;">
                ${dailyLeaves.map((item) => `
                  <div><strong>${this.t('datePrefix')} ${item.day}:</strong> ${item.names.join(', ')}</div>
                `).join('')}
              </div>
            ` : `<p style="color: #64748b; margin: 0;">${this.t('noLeaves')}</p>`}
          </div>
        </div>
      </div>

      <style>
        @media print {
          body > *:not(#print-matrix-modal) {
            display: none !important;
          }
          #print-matrix-modal {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            padding: 0;
            margin: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: landscape;
            margin: 0.5cm;
          }
        }
      </style>
    `;

    document.body.appendChild(printContainer);

    const cleanup = () => {
      document.title = originalTitle;
      printContainer.remove();
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup);
    
    // Add a 150ms delay to let the document title update propagate to the browser print engine
    setTimeout(() => {
      window.print();
    }, 150);
  }
}
