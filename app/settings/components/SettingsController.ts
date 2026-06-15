export class SettingsController {
  private fullName: string = 'Alex Rivera';
  private emailAddress: string = 'alex.rivera@holidayhq.com';
  private maxOffAllowed: number = 2;
  private earnRate: string = '1.5x';
  private message: { type: 'success' | 'error'; text: string } | null = null;
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

  public getMessage(): { type: 'success' | 'error'; text: string } | null {
    return this.message;
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

  public loadState(): void {
    if (typeof window === 'undefined') return;

    const savedMaxOff = localStorage.getItem('holidayhq_max_off_allowed');
    if (savedMaxOff) this.maxOffAllowed = parseInt(savedMaxOff);

    const savedEarnRate = localStorage.getItem('holidayhq_earn_rate');
    if (savedEarnRate) this.earnRate = `${savedEarnRate}x`;

    this.updateCallback();
  }

  public async save(
    role: string,
    saveProfileSettings: (input: { fullName: string; emailAddress: string }) => Promise<{ success: boolean; error?: string }>,
    saveWorkspaceSettings: (input: { capacity: number; earnRate: string }) => Promise<{ success: boolean; error?: string }>
  ): Promise<void> {
    this.message = null;
    this.updateCallback();

    const profileRes = await saveProfileSettings({ fullName: this.fullName, emailAddress: this.emailAddress });
    if (!profileRes.success) {
      this.message = { type: 'error', text: profileRes.error || 'Profile save failed' };
      this.updateCallback();
      return;
    }

    if (role === 'ADMIN') {
      const rawEarnRate = this.earnRate.replace('x', '');
      const workspaceRes = await saveWorkspaceSettings({ capacity: this.maxOffAllowed, earnRate: rawEarnRate });
      if (!workspaceRes.success) {
        this.message = { type: 'error', text: workspaceRes.error || 'Workspace save failed' };
        this.updateCallback();
        return;
      }
      localStorage.setItem('holidayhq_max_off_allowed', this.maxOffAllowed.toString());
      localStorage.setItem('holidayhq_earn_rate', rawEarnRate);
    }

    this.message = { type: 'success', text: 'Settings saved successfully!' };
    this.updateCallback();
  }
}
