import { Member, DepartmentGroup } from '../types';

export class DepartmentsController {
  private members: Member[] = [];
  private updateCallback: () => void;

  constructor(updateCallback: () => void) {
    this.updateCallback = updateCallback;
  }

  public getMembers(): Member[] {
    return this.members;
  }

  public getDepartmentGroups(): DepartmentGroup[] {
    const groupsMap: Record<string, Member[]> = {};
    this.members.forEach((m) => {
      if (!groupsMap[m.department]) {
        groupsMap[m.department] = [];
      }
      groupsMap[m.department].push(m);
    });

    return Object.keys(groupsMap).map((deptName) => {
      const deptMembers = groupsMap[deptName];
      const uniqueTitles = Array.from(new Set(deptMembers.map((m) => m.title)));
      return {
        name: deptName,
        headcount: deptMembers.length,
        titles: uniqueTitles,
        members: deptMembers
      };
    });
  }

  public async loadData(fetchMembers: () => Promise<Member[]>): Promise<void> {
    try {
      const data = await fetchMembers();
      this.members = data;
      this.updateCallback();
    } catch (e) {
      console.error('DepartmentsController loadData failed:', e);
    }
  }
}
