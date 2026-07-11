import { Member, CapacitySetting } from '../types';
import { botHolidays2026 } from '@/src/libs/calendarData';

export class MasterDataHubController {
  private members: Member[] = [];
  private capacityLimit: number = 2;
  private updateCallback: () => void;

  constructor(updateCallback: () => void) {
    this.updateCallback = updateCallback;
  }

  public getMembers(): Member[] {
    return this.members;
  }

  public getCapacityLimit(): number {
    return this.capacityLimit;
  }

  public getTotalMembers(): number {
    return this.members.length;
  }

  public getMembersWithSignature(): number {
    return this.members.filter(m => m.savedSignature).length;
  }

  public getMissingSignatures(): Member[] {
    return this.members.filter(m => !m.savedSignature);
  }

  public getTotalHolidays(): number {
    return botHolidays2026.length;
  }

  public getUniqueDepartments(): number {
    return Array.from(new Set(this.members.map(m => m.department))).length;
  }

  public getTotalActiveTokens(): number {
    return this.members.reduce((acc, m) => acc + (m.tokensBalance || 0), 0);
  }

  public setLocalData(membersData: Member[], capacityData: CapacitySetting[]): void {
    this.members = membersData;
    const globalDefault = capacityData.find(s => s.id === 'global-default');
    if (globalDefault) {
      this.capacityLimit = globalDefault.maxOffAllowed;
    }
  }

  public async loadData(
    fetchMembers: () => Promise<Member[]>,
    fetchCapacities: () => Promise<CapacitySetting[]>
  ): Promise<void> {
    try {
      const [membersData, capacityData] = await Promise.all([
        fetchMembers(),
        fetchCapacities()
      ]);
      this.setLocalData(membersData, capacityData);
      this.updateCallback();
    } catch (e) {
      console.error('MasterDataHubController loadData failed:', e);
    }
  }
}
