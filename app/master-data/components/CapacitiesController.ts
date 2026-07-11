import { CapacitySetting } from '../types';

export class CapacitiesController {
  private settings: CapacitySetting[] = [];
  private earnRate: string = '1.0x';
  private updateCallback: () => void;

  constructor(updateCallback: () => void) {
    this.updateCallback = updateCallback;
  }

  public getSettings(): CapacitySetting[] {
    return this.settings;
  }

  public getGlobalDefault(): CapacitySetting | undefined {
    return this.settings.find((s) => s.id === 'global-default');
  }

  public getOverrides(): CapacitySetting[] {
    return this.settings.filter((s) => s.id !== 'global-default');
  }

  public getEarnRate(): string {
    return this.earnRate;
  }

  public async loadData(fetchCapacities: () => Promise<CapacitySetting[]>): Promise<void> {
    try {
      const data = await fetchCapacities();
      this.settings = data;

      // Load earn rate from localStorage
      if (typeof window !== 'undefined') {
        const savedEarnRate = localStorage.getItem('holidayhq_earn_rate');
        if (savedEarnRate) {
          this.earnRate = `${savedEarnRate}x`;
        }
      }
      this.updateCallback();
    } catch (e) {
      console.error('CapacitiesController loadData failed:', e);
    }
  }
}
