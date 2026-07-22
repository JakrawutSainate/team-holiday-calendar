'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from '@/src/components/LanguageContext';
import TopNavBar from '@/src/components/TopNavBar';
import { useMasterData } from './MasterDataContext';
import {
  fetchDepartmentsAction,
  fetchJobTitlesAction,
  createDepartmentAction,
  updateDepartmentAction,
  deleteDepartmentAction,
  createJobTitleAction,
  deleteJobTitleAction,
  updateTeamMemberProfileAction,
  DepartmentItem,
  JobTitleItem,
} from '../actions';
import { SkeletonHeader, SkeletonCardGrid } from './Skeleton';

const AVAILABLE_ICONS = [
  'groups',
  'code',
  'draw',
  'corporate_fare',
  'terminal',
  'support_agent',
  'payments',
  'trending_up',
  'handshake',
  'hub',
  'architecture',
  'science',
];

export default function DepartmentsClient() {
  const { language } = useTranslation();
  const { members: initialMembers, isLoading: isMasterLoading, error: masterError, refreshData } = useMasterData();

  const [members, setMembers] = useState(initialMembers);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [jobTitles, setJobTitles] = useState<JobTitleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Drag & Drop state
  const [draggedMemberId, setDraggedMemberId] = useState<string | null>(null);
  const [dragOverDeptName, setDragOverDeptName] = useState<string | null>(null);

  // Modal states
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentItem | null>(null);
  const [deptName, setDeptName] = useState('');
  const [deptDesc, setDeptDesc] = useState('');
  const [deptIcon, setDeptIcon] = useState('groups');
  const [isSubmittingDept, setIsSubmittingDept] = useState(false);

  const [showTitleModal, setShowTitleModal] = useState(false);
  const [titleTargetDept, setTitleTargetDept] = useState('');
  const [titleName, setTitleName] = useState('');
  const [isSubmittingTitle, setIsSubmittingTitle] = useState(false);

  const [deletingDept, setDeletingDept] = useState<DepartmentItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync initialMembers into local state
  useEffect(() => {
    setMembers(initialMembers);
  }, [initialMembers]);

  // Load Departments & JobTitles
  const loadDeptData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [depts, titles] = await Promise.all([
        fetchDepartmentsAction(),
        fetchJobTitlesAction(),
      ]);
      setDepartments(depts);
      setJobTitles(titles);
    } catch (err: any) {
      setError(err?.message || 'Failed to load department structure');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDeptData();
  }, [loadDeptData]);

  // ─── DRAG & DROP HANDLERS ──────────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, memberId: string) => {
    setDraggedMemberId(memberId);
    e.dataTransfer.setData('text/plain', memberId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, deptName: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverDeptName !== deptName) {
      setDragOverDeptName(deptName);
    }
  };

  const handleDragLeave = (e: React.DragEvent, deptName: string) => {
    e.preventDefault();
    if (dragOverDeptName === deptName) {
      setDragOverDeptName(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetDeptName: string) => {
    e.preventDefault();
    setDragOverDeptName(null);

    const memberId = draggedMemberId || e.dataTransfer.getData('text/plain');
    if (!memberId) return;

    const targetMember = members.find((m) => m.id === memberId);
    if (!targetMember || targetMember.department === targetDeptName) {
      setDraggedMemberId(null);
      return;
    }

    // Optimistic UI Update
    const previousDept = targetMember.department;
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, department: targetDeptName } : m))
    );
    setDraggedMemberId(null);

    // Sync DB
    const res = await updateTeamMemberProfileAction(
      targetMember.id,
      targetMember.name,
      targetDeptName,
      targetMember.title
    );

    if (res.success) {
      showToast(
        language === 'th'
          ? `ย้าย ${targetMember.name} ไปยัง ${targetDeptName} เรียบร้อยแล้ว`
          : `Moved ${targetMember.name} to ${targetDeptName}`
      );
      refreshData();
    } else {
      // Revert if error
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, department: previousDept } : m))
      );
      setActionError(res.error || 'Failed to reassign department');
    }
  };

  // ─── DEPARTMENT CRUD HANDLERS ──────────────────────────────────────────────
  const openAddDeptModal = () => {
    setEditingDept(null);
    setDeptName('');
    setDeptDesc('');
    setDeptIcon('groups');
    setActionError(null);
    setShowDeptModal(true);
  };

  const openEditDeptModal = (dept: DepartmentItem) => {
    setEditingDept(dept);
    setDeptName(dept.name);
    setDeptDesc(dept.description || '');
    setDeptIcon(dept.icon || 'groups');
    setActionError(null);
    setShowDeptModal(true);
  };

  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim()) return;

    setIsSubmittingDept(true);
    setActionError(null);

    try {
      if (editingDept) {
        const res = await updateDepartmentAction(editingDept.id, deptName.trim(), deptDesc.trim(), deptIcon);
        if (!res.success) throw new Error(res.error);
        showToast(language === 'th' ? 'อัปเดตแผนกเรียบร้อยแล้ว' : 'Department updated');
      } else {
        const res = await createDepartmentAction(deptName.trim(), deptDesc.trim(), deptIcon);
        if (!res.success) throw new Error(res.error);
        showToast(language === 'th' ? 'สร้างแผนกใหม่เรียบร้อยแล้ว' : 'Department created');
      }

      setShowDeptModal(false);
      await loadDeptData();
      await refreshData();
    } catch (err: any) {
      setActionError(err.message || 'Operation failed');
    } finally {
      setIsSubmittingDept(false);
    }
  };

  const handleDeleteDepartment = async () => {
    if (!deletingDept) return;
    setActionError(null);

    const res = await deleteDepartmentAction(deletingDept.id);
    if (res.success) {
      showToast(language === 'th' ? `ลบแผนก ${deletingDept.name} แล้ว` : `Deleted ${deletingDept.name}`);
      setDeletingDept(null);
      await loadDeptData();
      await refreshData();
    } else {
      setActionError(res.error || 'Failed to delete department');
    }
  };

  // ─── JOB TITLE CRUD HANDLERS ──────────────────────────────────────────────
  const openAddTitleModal = (deptName: string) => {
    setTitleTargetDept(deptName);
    setTitleName('');
    setActionError(null);
    setShowTitleModal(true);
  };

  const handleSaveTitle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleName.trim() || !titleTargetDept) return;

    setIsSubmittingTitle(true);
    setActionError(null);

    const res = await createJobTitleAction(titleName.trim(), titleTargetDept);
    setIsSubmittingTitle(false);

    if (res.success) {
      showToast(language === 'th' ? `เพิ่มตำแหน่ง ${titleName} เรียบร้อยแล้ว` : `Added title ${titleName}`);
      setShowTitleModal(false);
      await loadDeptData();
    } else {
      setActionError(res.error || 'Failed to create job title');
    }
  };

  const handleDeleteTitle = async (titleId: string, name: string) => {
    const res = await deleteJobTitleAction(titleId);
    if (res.success) {
      showToast(language === 'th' ? `ลบตำแหน่ง ${name} เรียบร้อยแล้ว` : `Removed title ${name}`);
      await loadDeptData();
    } else {
      showToast(res.error || 'Failed to delete title');
    }
  };

  const defaultAvatar =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDVLNtV3nW5jQ9v1QJ-Lp-jtql1Sl2gs9aUg1u-UQwGgb20KcoEREuR2Cj89a6cu8_NnbQvNqzwlEN2X0mTabrR0CnLpyY91cdXwmbTOeOjYQbFFO4WXrNog61BL9S7MaC3if-2Wao1Q7aXmPMQSMSkMvntSadX0VQnymZOJ8gHtexzgEx54o_6bFLRQoWWgrehsFB6DTylKcIMrtDCa4MMoOdvwBVeDpPz_AGnq2mxnvAKhJjAyDpK8qbwVD6fdwiyjwWoCJ6VUzpO';

  return (
    <div className="grow flex flex-col min-h-screen lg:ml-64 bg-zinc-50/50">
      <TopNavBar placeholder={language === 'th' ? 'ค้นหาพนักงาน หรือ แผนกงาน...' : 'Search employees or departments...'} />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-slide-up border border-zinc-800">
          <span className="material-symbols-outlined text-green-400 text-base">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="flex-1 p-6 lg:p-10 pb-24 lg:pb-12 overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-zinc-200/80 p-6 rounded-3xl shadow-xs">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-600">
                  <span className="material-symbols-outlined text-2xl">grid_view</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
                    {language === 'th' ? 'กระดานจัดแผนกและตำแหน่งงาน' : 'Departments & Titles Board'}
                  </h2>
                  <p className="text-zinc-500 text-xs mt-0.5">
                    {language === 'th'
                      ? 'ลากและวางพนักงานเพื่อเปลี่ยนแผนกแบบ Real-time พร้อมจัดการโครงสร้างแผนกและตำแหน่งงาน'
                      : 'Drag & drop members to reassign departments in real-time. Manage corporate branches & titles.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={refreshData}
                disabled={isMasterLoading || isLoading}
                className="p-2.5 hover:bg-zinc-100 rounded-2xl transition-all border border-zinc-200 outline-none cursor-pointer flex items-center justify-center text-zinc-600 hover:text-zinc-900 active:scale-95 disabled:opacity-50"
                title={language === 'th' ? 'รีเฟรชข้อมูล' : 'Refresh'}
              >
                <span className={`material-symbols-outlined text-xl ${isMasterLoading || isLoading ? 'animate-spin' : ''}`}>
                  refresh
                </span>
              </button>

              <button
                onClick={openAddDeptModal}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                <span>{language === 'th' ? 'เพิ่มแผนกใหม่' : 'Add Department'}</span>
              </button>
            </div>
          </div>

          {(error || masterError || actionError) && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{actionError || error || masterError}</span>
              </div>
              <button
                onClick={() => setActionError(null)}
                className="text-red-400 hover:text-red-700 text-xs font-bold cursor-pointer"
              >
                ปิด
              </button>
            </div>
          )}

          {/* Kanban Board Container */}
          {isLoading || isMasterLoading ? (
            <div className="space-y-6">
              <SkeletonHeader />
              <SkeletonCardGrid count={3} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
              {departments.map((dept) => {
                const deptMembers = members.filter((m) => m.department === dept.name);
                const deptJobTitles = jobTitles.filter((jt) => jt.departmentName === dept.name);
                const isDragTarget = dragOverDeptName === dept.name;

                return (
                  <div
                    key={dept.id}
                    onDragOver={(e) => handleDragOver(e, dept.name)}
                    onDragLeave={(e) => handleDragLeave(e, dept.name)}
                    onDrop={(e) => handleDrop(e, dept.name)}
                    className={`bg-white border rounded-3xl p-5 shadow-xs transition-all duration-200 flex flex-col justify-between space-y-5 relative ${
                      isDragTarget
                        ? 'border-indigo-500 ring-4 ring-indigo-500/10 bg-indigo-50/20 scale-[1.01]'
                        : 'border-zinc-200/80 hover:border-zinc-300'
                    }`}
                  >
                    {/* Header: Icon, Name, Actions */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-zinc-100 pb-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-zinc-100/80 border border-zinc-200/60 flex items-center justify-center text-zinc-700">
                            <span className="material-symbols-outlined text-2xl">{dept.icon || 'groups'}</span>
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-zinc-900 leading-snug">{dept.name}</h3>
                            {dept.description && (
                              <p className="text-[11px] text-zinc-400 truncate max-w-[180px]">{dept.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-1 bg-zinc-100 border border-zinc-200/60 rounded-xl text-xs font-bold text-zinc-700">
                            {deptMembers.length} {language === 'th' ? 'คน' : ''}
                          </span>
                          <button
                            onClick={() => openEditDeptModal(dept)}
                            className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
                            title="แก้ไขแผนก"
                          >
                            <span className="material-symbols-outlined text-base">edit</span>
                          </button>
                          <button
                            onClick={() => setDeletingDept(dept)}
                            className="p-1 text-zinc-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                            title="ลบแผนก"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      </div>

                      {/* Job Titles Section */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                            {language === 'th' ? 'ตำแหน่งงานในแผนก' : 'Titles'}
                          </span>
                          <button
                            onClick={() => openAddTitleModal(dept.name)}
                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 hover:underline cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-xs">add</span>
                            <span>{language === 'th' ? 'เพิ่มตำแหน่ง' : 'Add Title'}</span>
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-1.5 min-h-[28px] items-center">
                          {deptJobTitles.map((jt) => (
                            <span
                              key={jt.id}
                              className="group/jt px-2.5 py-1 bg-zinc-50 border border-zinc-200/70 text-zinc-700 rounded-xl text-xs font-medium flex items-center gap-1 hover:border-zinc-300 transition-all"
                            >
                              <span>{jt.name}</span>
                              <button
                                onClick={() => handleDeleteTitle(jt.id, jt.name)}
                                className="opacity-0 group-hover/jt:opacity-100 text-zinc-400 hover:text-red-600 transition-opacity cursor-pointer"
                                title="ลบตำแหน่งนี้"
                              >
                                <span className="material-symbols-outlined text-xs">close</span>
                              </button>
                            </span>
                          ))}
                          {deptJobTitles.length === 0 && (
                            <span className="text-[11px] text-zinc-400 italic">
                              {language === 'th' ? 'ยังไม่ได้ระบุชื่อตำแหน่ง' : 'No titles defined yet'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Member Cards / Drop Target */}
                      <div className="space-y-2 pt-1">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                          {language === 'th' ? 'พนักงานในแผนก (ลากย้ายได้)' : 'Members (Draggable)'}
                        </span>

                        <div className="space-y-2 min-h-[120px] p-2 bg-zinc-50/70 border border-dashed border-zinc-200 rounded-2xl transition-colors">
                          {deptMembers.map((member) => (
                            <div
                              key={member.id}
                              draggable="true"
                              onDragStart={(e) => handleDragStart(e, member.id)}
                              className="bg-white border border-zinc-200/80 hover:border-indigo-200 rounded-2xl p-2.5 shadow-2xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing flex items-center justify-between group select-none hover:-translate-y-0.5"
                            >
                              <div className="flex items-center gap-2.5 overflow-hidden">
                                <span className="material-symbols-outlined text-zinc-300 group-hover:text-zinc-500 text-lg cursor-grab">
                                  drag_indicator
                                </span>
                                <img
                                  src={member.avatarUrl || defaultAvatar}
                                  alt={member.name}
                                  className="w-8 h-8 rounded-full object-cover border border-zinc-200/80 shrink-0"
                                />
                                <div className="overflow-hidden">
                                  <h4 className="text-xs font-bold text-zinc-900 truncate leading-tight">
                                    {member.name}
                                  </h4>
                                  <p className="text-[10px] text-zinc-400 font-semibold truncate mt-0.5">
                                    {member.title || 'ไม่ได้ระบุตำแหน่ง'}
                                  </p>
                                </div>
                              </div>

                              <span
                                className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider shrink-0 ${
                                  member.role === 'ADMIN'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                                }`}
                              >
                                {member.role}
                              </span>
                            </div>
                          ))}

                          {deptMembers.length === 0 && (
                            <div className="h-24 flex flex-col items-center justify-center text-center p-4 text-zinc-400">
                              <span className="material-symbols-outlined text-2xl text-zinc-300 mb-1">
                                move_to_inbox
                              </span>
                              <p className="text-[11px] font-semibold">
                                {language === 'th' ? 'ลากพนักงานมาวางที่นี่' : 'Drop member cards here'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {departments.length === 0 && (
                <div className="col-span-full py-16 text-center text-zinc-450 bg-white border border-zinc-200 rounded-3xl p-8 shadow-xs space-y-4">
                  <span className="material-symbols-outlined text-5xl text-zinc-300">workspaces</span>
                  <p className="text-sm font-semibold text-zinc-600">
                    {language === 'th' ? 'ไม่พบแผนกงานในระบบ' : 'No departments active in system.'}
                  </p>
                  <button
                    onClick={openAddDeptModal}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer"
                  >
                    + {language === 'th' ? 'เพิ่มแผนกแรก' : 'Create First Department'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ─── MODAL: Add / Edit Department ─── */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-zinc-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-slide-up">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3.5">
              <h3 className="text-lg font-bold text-zinc-900">
                {editingDept
                  ? (language === 'th' ? 'แก้ไขแผนกงาน' : 'Edit Department')
                  : (language === 'th' ? 'เพิ่มแผนกงานใหม่' : 'Add New Department')}
              </h3>
              <button
                onClick={() => setShowDeptModal(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveDepartment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  {language === 'th' ? 'ชื่อแผนก' : 'Department Name'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="เช่น Engineering, Design, Sales"
                  className="w-full p-3 border border-zinc-200 rounded-2xl text-xs font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-zinc-900 bg-zinc-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  {language === 'th' ? 'ไอคอนประจำแผนก' : 'Department Icon'}
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {AVAILABLE_ICONS.map((iconName) => (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setDeptIcon(iconName)}
                      className={`p-2.5 rounded-2xl border flex items-center justify-center cursor-pointer transition-all ${
                        deptIcon === iconName
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-600 font-bold shadow-xs'
                          : 'border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xl">{iconName}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  {language === 'th' ? 'คำอธิบายเพิ่มเติม (ถ้ามี)' : 'Description (Optional)'}
                </label>
                <textarea
                  value={deptDesc}
                  onChange={(e) => setDeptDesc(e.target.value)}
                  placeholder="รายละเอียดหน้าที่หลักของแผนก..."
                  rows={2}
                  className="w-full p-3 border border-zinc-200 rounded-2xl text-xs font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-zinc-900 bg-zinc-50/50 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="px-4 py-2.5 border border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
                >
                  {language === 'th' ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDept}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isSubmittingDept ? 'กำลังบันทึก...' : language === 'th' ? 'บันทึก' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: Add Job Title ─── */}
      {showTitleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-zinc-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-slide-up">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3.5">
              <div>
                <h3 className="text-lg font-bold text-zinc-900">
                  {language === 'th' ? 'เพิ่มตำแหน่งงาน' : 'Add Job Title'}
                </h3>
                <p className="text-xs text-zinc-500">แผนก: {titleTargetDept}</p>
              </div>
              <button
                onClick={() => setShowTitleModal(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveTitle} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  {language === 'th' ? 'ชื่อตำแหน่งงาน' : 'Job Title Name'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={titleName}
                  onChange={(e) => setTitleName(e.target.value)}
                  placeholder="เช่น Senior Frontend Engineer, UX Specialist"
                  className="w-full p-3 border border-zinc-200 rounded-2xl text-xs font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-zinc-900 bg-zinc-50/50"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowTitleModal(false)}
                  className="px-4 py-2.5 border border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
                >
                  {language === 'th' ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTitle}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isSubmittingTitle ? 'กำลังเพิ่ม...' : language === 'th' ? 'เพิ่มตำแหน่ง' : 'Add Title'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: Delete Department Confirmation ─── */}
      {deletingDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-zinc-200 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-5 animate-slide-up text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-2xl">warning</span>
            </div>

            <div>
              <h3 className="text-base font-bold text-zinc-900">
                {language === 'th' ? `ลบแผนก ${deletingDept.name}?` : `Delete ${deletingDept.name}?`}
              </h3>
              <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                {language === 'th'
                  ? 'ชื่อตำแหน่งทั้งหมดในแผนกนี้จะถูกลบออก (พนักงานยังคงอยู่ในระบบ)'
                  : 'All title definitions under this department will be removed.'}
              </p>
            </div>

            <div className="flex justify-center gap-2.5 pt-2">
              <button
                onClick={() => setDeletingDept(null)}
                className="px-4 py-2.5 border border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
              >
                {language === 'th' ? 'ยกเลิก' : 'Cancel'}
              </button>
              <button
                onClick={handleDeleteDepartment}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                {language === 'th' ? 'ยืนยันการลบ' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
