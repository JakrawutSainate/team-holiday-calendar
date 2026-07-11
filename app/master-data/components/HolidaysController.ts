import { botHolidays2026, BOHoliday } from '@/src/libs/calendarData';

export class HolidaysController {
  public getFilteredHolidays(searchQuery: string): BOHoliday[] {
    const query = searchQuery.toLowerCase().trim();
    return botHolidays2026.filter((h) => {
      return (
        h.date.includes(query) ||
        h.nameEn.toLowerCase().includes(query) ||
        h.nameTh.toLowerCase().includes(query)
      );
    });
  }

  public exportToCSV(filteredHolidays: BOHoliday[], language: 'en' | 'th'): void {
    const headers = [
      language === 'th' ? 'วันที่' : 'Date',
      language === 'th' ? 'วันของสัปดาห์' : 'Day of Week',
      language === 'th' ? 'ชื่อวันหยุด (ไทย)' : 'Holiday Name (TH)',
      language === 'th' ? 'ชื่อวันหยุด (อังกฤษ)' : 'Holiday Name (EN)'
    ];

    const getDayName = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString(language === 'en' ? 'en-US' : 'th-TH', { weekday: 'long' });
    };

    const rows = filteredHolidays.map((h) => [
      h.date,
      getDayName(h.date),
      h.nameTh,
      h.nameEn
    ]);

    const csvContent = [headers, ...rows]
      .map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `public_holidays_2026_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
