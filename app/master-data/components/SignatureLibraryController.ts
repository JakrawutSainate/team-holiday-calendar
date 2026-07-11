import { Member } from '../types';

export class SignatureLibraryController {
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
      console.error('SignatureLibraryController loadData failed:', e);
    }
  }
}
