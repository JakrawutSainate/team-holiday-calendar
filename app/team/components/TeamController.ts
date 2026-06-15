import { TeamMember } from '@/src/libs/calendarData';
import { InviteMemberInput } from '../schema';

export class TeamController {
  private members: TeamMember[];
  private searchTerm: string;
  private updateCallback: () => void;

  constructor(
    initialMembers: TeamMember[],
    searchTerm: string,
    updateCallback: () => void
  ) {
    this.members = initialMembers;
    this.searchTerm = searchTerm;
    this.updateCallback = updateCallback;
  }

  public getMembers(): TeamMember[] {
    return this.members;
  }

  public getSearchTerm(): string {
    return this.searchTerm;
  }

  public setMembers(members: TeamMember[]): void {
    this.members = members;
    this.updateCallback();
  }

  public async inviteMember(
    inviteAction: (input: InviteMemberInput) => Promise<{ success: boolean; error?: string }>
  ): Promise<string> {
    const mockInput: InviteMemberInput = {
      name: 'John Doe',
      email: 'john.doe@holidayhq.com',
      role: 'MEMBER' as const,
      department: 'Engineering' as const,
      title: 'Software Engineer'
    };
    const res = await inviteAction(mockInput);
    if (!res.success) {
      throw new Error(res.error || 'Invitation failed');
    }
    return `Invited ${mockInput.name} successfully!`;
  }

  public async downloadReport(
    downloadAction: () => Promise<{ success: boolean; downloadUrl?: string }>
  ): Promise<string> {
    const res = await downloadAction();
    if (!res.success) {
      throw new Error('Report generation failed');
    }
    return `PDF report generated! File path: ${res.downloadUrl}`;
  }
}
