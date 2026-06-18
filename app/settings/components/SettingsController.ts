import { getDayCapacitySetting, updateMaxOffAllowedMutation } from '@/src/libs/calendarData';

export class SettingsController {
  private fullName: string = '';
  private emailAddress: string = '';
  private maxOffAllowed: number = 2;
  private earnRate: string = '1.0x';
  private messageType: string = '';
  private messageText: string = '';
  private updateCallback: () => void;

  constructor(updateCallback: () => void) {
    this.updateCallback = updateCallback;
  }

  // Getters
  public getFullName(): string {
    return this.fullName;
  }

  public getEmailAddress(): string {
    return this.emailAddress;
  }

  public getMaxOffAllowed(): number {
    return this.maxOffAllowed;
  }

  public getEarnRate(): string {
    return this.earnRate;
  }

  public getMessageType(): string {
    return this.messageType;
  }

  public getMessageText(): string {
    return this.messageText;
  }

  // Setters/mutators
  public setFullName(name: string): void {
    this.fullName = name;
    this.updateCallback();
  }

  public setEmailAddress(email: string): void {
    this.emailAddress = email;
    this.updateCallback();
  }

  public setMaxOffAllowed(val: number): void {
    this.maxOffAllowed = val;
    this.updateCallback();
  }

  public setEarnRate(rate: string): void {
    this.earnRate = rate;
    this.updateCallback();
  }

  /** Pre-fill profile info from logged-in user */
  public initFromUser(name: string, email: string): void {
    if (this.fullName === '' && name) {
      this.fullName = name;
    }
    if (this.emailAddress === '' && email) {
      this.emailAddress = email;
    }
    this.updateCallback();
  }

  public async loadState(): Promise<void> {
    if (typeof window === 'undefined') return;

    // Load capacity from DB
    try {
      const today = new Date().toISOString().split('T')[0];
      const setting = await getDayCapacitySetting(today);
      if (setting && setting.maxOffAllowed) {
        this.maxOffAllowed = setting.maxOffAllowed;
      }
    } catch (e) {
      console.error('Failed to load capacity setting:', e);
    }

    const savedEarnRate = localStorage.getItem('holidayhq_earn_rate');
    if (savedEarnRate) this.earnRate = `${savedEarnRate}x`;

    this.updateCallback();
  }

  public async save(
    role: string,
    saveProfileSettings: (input: { fullName: string; emailAddress: string }) => Promise<{ success: boolean; error: string }>,
    saveWorkspaceSettings: (input: { capacity: number; earnRate: string }) => Promise<{ success: boolean; error: string }>
  ): Promise<void> {
    this.messageType = '';
    this.messageText = '';
    this.updateCallback();

    const profileRes = await saveProfileSettings({ fullName: this.fullName, emailAddress: this.emailAddress });
    if (!profileRes.success) {
      this.messageType = 'error';
      this.messageText = profileRes.error || 'Profile save failed';
      this.updateCallback();
      return;
    }

    if (role === 'ADMIN') {
      const rawEarnRate = this.earnRate.replace('x', '');
      const workspaceRes = await saveWorkspaceSettings({ capacity: this.maxOffAllowed, earnRate: rawEarnRate });
      if (!workspaceRes.success) {
        this.messageType = 'error';
        this.messageText = workspaceRes.error || 'Workspace save failed';
        this.updateCallback();
        return;
      }

      // Persist capacity setting to backend
      try {
        await updateMaxOffAllowedMutation(this.maxOffAllowed);
      } catch (e) {
        console.error('Failed to update capacity in DB:', e);
      }

      localStorage.setItem('holidayhq_earn_rate', rawEarnRate);
    }

    this.messageType = 'success';
    this.messageText = 'Settings saved successfully!';
    this.updateCallback();
  }
}
