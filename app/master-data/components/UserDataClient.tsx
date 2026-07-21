'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/src/components/LanguageContext';
import { useAuth } from '@/src/components/AuthContext';
import { useRole } from '@/src/components/RoleContext';
import TopNavBar from '@/src/components/TopNavBar';
import { toast } from 'sonner';
import { updateTeamMemberProfileAction } from '../actions';
import { useMasterData } from './MasterDataContext';
import { UserDataController } from './UserDataController';
import { SkeletonHeader, SkeletonTable } from './Skeleton';

export default function UserDataClient() {
  const { user } = useAuth();
  const { role } = useRole();
  const { language } = useTranslation();
  const { members, isLoading, error, refreshData } = useMasterData();

  const [, setTick] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [controller] = useState(() => new UserDataController(() => setTick(t => t + 1)));

  // Details dialog state
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<any | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDepartment, setEditDepartment] = useState('');

  const handleOpenDetails = (u: any) => {
    setSelectedUserForDetails(u);
    setIsEditingProfile(false);
    setEditName(u.name || '');
    setEditTitle(u.title || '');
    setEditDepartment(u.department || '');
  };

  const handleUpdateProfileSubmit = async () => {
    if (!selectedUserForDetails) return;
    if (!editName.trim() || !editTitle.trim() || !editDepartment.trim()) {
      toast.error(language === 'th' ? 'กรุณากรอกข้อมูลให้ครบถ้วน' : 'Please fill all fields');
      return;
    }

    try {
      const res = await updateTeamMemberProfileAction(
        selectedUserForDetails.id,
        editName.trim(),
        editDepartment.trim(),
        editTitle.trim()
      );

      if (res.success) {
        toast.success(
          language === 'th' ? 'แก้ไขข้อมูลผู้ใช้งานสำเร็จ' : 'Profile Updated Successfully'
        );
        setSelectedUserForDetails(null);
        setIsEditingProfile(false);
        refreshData();
      } else {
        toast.error(res.error || 'Failed to update');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error occurred');
    }
  };

  // Sync context members into controller
  useEffect(() => {
    if (members.length > 0) {
      controller.setMembers(members);
    }
  }, [members, controller]);

  const filteredMembers = controller.getFilteredMembers(searchQuery, selectedDept);
  const currentUserData = controller.getMembers().find((m) => m.id === user?.id) || user;

  const handleExport = () => {
    controller.exportToCSV(filteredMembers, language);
  };

  return (
    <div className="grow flex flex-col min-h-screen lg:ml-64 bg-background">
      <TopNavBar placeholder={language === 'th' ? 'ค้นหาพนักงาน...' : 'Search employee files...'} />

      <main className="flex-1 p-6 lg:p-12 pb-24 lg:pb-12 overflow-y-auto custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-4xl font-bold tracking-tight text-zinc-900">
                  {language === 'th' ? 'ข้อมูลผู้ใช้งานและโควตาวันลา' : 'User Data & Quotas'}
                </h2>
                <button
                  onClick={refreshData}
                  disabled={isLoading}
                  className="p-1.5 hover:bg-zinc-100 rounded-xl transition-all border-none outline-none cursor-pointer flex items-center justify-center text-zinc-500 hover:text-zinc-900 active:scale-95 disabled:opacity-50"
                  title={language === 'th' ? 'รีเฟรชข้อมูล' : 'Refresh Data'}
                >
                  <span className={`material-symbols-outlined text-xl ${isLoading ? 'animate-spin' : ''}`}>
                    refresh
                  </span>
                </button>
              </div>
              <p className="text-zinc-500 mt-2 text-base">
                {language === 'th'
                  ? 'ตรวจสอบรายละเอียดผู้ใช้ ยอดคงเหลือ และโควตาสิทธิ์วันลาสะสมประเภทต่าง ๆ'
                  : 'Review user profile logs, leave quotas and compensatory token balances.'}
              </p>
            </div>
            {role === 'ADMIN' && !isLoading && filteredMembers.length > 0 && (
              <button
                onClick={handleExport}
                className="px-4 py-2.5 bg-zinc-900 text-white hover:bg-zinc-800 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer border-none outline-none"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                {language === 'th' ? 'ส่งออกข้อมูล CSV' : 'Export CSV'}
              </button>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="space-y-8">
              <SkeletonHeader />
              <div className="h-16 bg-white border border-zinc-100 rounded-2xl animate-pulse"></div>
              <SkeletonTable rows={6} cols={5} />
            </div>
          ) : (
            <>
              {role === 'ADMIN' ? (
                <div className="space-y-6">
                  {/* Filters Bar */}
                  <div className="flex flex-col sm:flex-row gap-4 bg-white border border-zinc-150 rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                    <div className="flex-1 flex items-center gap-3 px-3 py-2 bg-zinc-50/50 border border-zinc-200/60 rounded-xl">
                      <span className="material-symbols-outlined text-zinc-400 text-lg">search</span>
                      <input
                        type="text"
                        placeholder={language === 'th' ? 'ค้นหาตามชื่อ, อีเมล, ตำแหน่ง...' : 'Search by name, email, title...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent border-none outline-none w-full text-xs font-semibold text-zinc-800 placeholder-zinc-400"
                      />
                    </div>
                    <select
                      value={selectedDept}
                      onChange={(e) => setSelectedDept(e.target.value)}
                      className="px-4 py-2 border border-zinc-200/60 rounded-xl bg-white text-xs font-bold text-zinc-850 hover:bg-zinc-50 outline-none cursor-pointer"
                    >
                      <option value="ALL">{language === 'th' ? 'ทุกแผนก' : 'All Departments'}</option>
                      <option value="Engineering">{language === 'th' ? 'ฝ่ายวิศวกรรม' : 'Engineering'}</option>
                      <option value="Design">{language === 'th' ? 'ฝ่ายออกแบบ' : 'Design'}</option>
                      <option value="Management">{language === 'th' ? 'ฝ่ายบริหาร' : 'Management'}</option>
                    </select>
                  </div>

                  {/* Users Table */}
                  <div className="bg-white border border-zinc-100 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-100 bg-zinc-50/50">
                            <th className="p-4 pl-6 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                              {language === 'th' ? 'พนักงาน' : 'EMPLOYEE'}
                            </th>
                            <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                              {language === 'th' ? 'แผนก / ตำแหน่ง' : 'DEPT & TITLE'}
                            </th>
                            <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-center">
                              {language === 'th' ? 'โควตาลาป่วย' : 'SICK LEAVE'}
                            </th>
                            <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-center">
                              {language === 'th' ? 'โควตาลาพักร้อน' : 'ANNUAL LEAVE'}
                            </th>
                            <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-center">
                              {language === 'th' ? 'ยอดโทเค็นสะสม' : 'TOKEN BALANCE'}
                            </th>
                            <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-center">
                              {language === 'th' ? 'รายละเอียด' : 'DETAILS'}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredMembers.map((m) => (
                            <tr key={m.id} className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50/30 transition-colors">
                              <td className="p-4 pl-6 text-sm font-bold text-zinc-900">
                                <div className="flex flex-col">
                                  <span>{m.name}</span>
                                  <span className="text-[10px] text-zinc-400 font-medium">{m.email}</span>
                                </div>
                              </td>
                              <td className="p-4 text-sm text-zinc-800">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-zinc-900">{m.title}</span>
                                  <span className="text-[10px] text-zinc-450">{m.department}</span>
                                </div>
                              </td>
                              <td className="p-4 text-sm font-bold text-zinc-800 text-center">
                                <span className="px-2.5 py-1 bg-red-50 border border-red-100 text-red-750 rounded-lg text-xs font-semibold">
                                  {m.sickLeaveBalance ?? 30} {language === 'th' ? 'วัน' : 'Days'}
                                </span>
                              </td>
                              <td className="p-4 text-sm font-bold text-zinc-800 text-center">
                                <span className="px-2.5 py-1 bg-green-50 border border-green-100 text-green-750 rounded-lg text-xs font-semibold">
                                  {m.annualLeaveBalance ?? 6} {language === 'th' ? 'วัน' : 'Days'}
                                </span>
                              </td>
                              <td className="p-4 text-sm font-bold text-zinc-900 text-center">
                                <span className="px-2.5 py-1 bg-zinc-100 border border-zinc-200 text-zinc-800 rounded-lg text-xs font-bold">
                                  {m.tokensBalance.toFixed(1)} Tokens
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                <button
                                  onClick={() => handleOpenDetails(m)}
                                  className="px-2.5 py-1 hover:bg-zinc-100 border border-zinc-200 text-zinc-700 rounded-lg text-xs font-semibold cursor-pointer active:scale-95 transition-all bg-white"
                                >
                                  {language === 'th' ? 'รายละเอียด' : 'Details'}
                                </button>
                              </td>
                            </tr>
                          ))}
                          {filteredMembers.length === 0 && (
                            <tr>
                              <td colSpan={6} className="p-12 text-center text-sm text-zinc-400 font-semibold">
                                {language === 'th' ? 'ไม่พบข้อมูลตามที่ค้นหา' : 'No employee records found.'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                /* Regular user dashboard view */
                <div className="max-w-2xl mx-auto space-y-6">
                  {/* Profile Summary Card */}
                  <div className="bg-white border border-zinc-150 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold text-zinc-900">
                        {language === 'th' ? 'ข้อมูลของฉัน' : 'My Personal Profile'}
                      </h3>
                      <button
                        onClick={() => handleOpenDetails(currentUserData)}
                        className="px-3 py-1.5 hover:bg-zinc-100 border border-zinc-200 text-zinc-700 rounded-xl text-xs font-bold cursor-pointer active:scale-95 transition-all bg-white flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">info</span>
                        {language === 'th' ? 'รายละเอียดโปรไฟล์' : 'Details'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-zinc-400 block uppercase tracking-wide">
                          {language === 'th' ? 'ชื่อ-นามสกุล' : 'Full Name'}
                        </span>
                        <p className="text-sm font-bold text-zinc-800">{currentUserData?.name}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-zinc-400 block uppercase tracking-wide">
                          {language === 'th' ? 'อีเมลแอดเดรส' : 'Email Address'}
                        </span>
                        <p className="text-sm font-semibold text-zinc-700">{currentUserData?.email}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-zinc-400 block uppercase tracking-wide">
                          {language === 'th' ? 'บทบาทระบบ' : 'Role'}
                        </span>
                        <p className="text-sm font-bold text-zinc-800">
                          {currentUserData?.role === 'ADMIN' ? 'Admin' : currentUserData?.role === 'LEAD' ? 'Team Lead' : 'Member'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-zinc-400 block uppercase tracking-wide">
                          {language === 'th' ? 'ตำแหน่ง / แผนก' : 'Title & Department'}
                        </span>
                        <p className="text-sm font-semibold text-zinc-750">
                          {currentUserData?.title} ({currentUserData?.department})
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Quota Balances Card */}
                  <div className="bg-white border border-zinc-150 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-6">
                    <h3 className="text-lg font-bold text-zinc-900">
                      {language === 'th' ? 'โควตาวันลาและยอดคงเหลือสะสม' : 'My Leave Allowances & Balances'}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      {/* Sick Leave */}
                      <div className="p-4 bg-red-50/40 border border-red-100 rounded-2xl space-y-2 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-red-650 tracking-wider uppercase block">
                            {language === 'th' ? 'โควตาลาป่วย' : 'Sick Leave'}
                          </span>
                          <span className="text-2xl font-bold text-red-800 mt-1 block">
                            {currentUserData?.sickLeaveBalance ?? 30} {language === 'th' ? 'วัน' : 'Days'}
                          </span>
                        </div>
                        <p className="text-[10px] text-red-500 font-semibold">
                          {language === 'th' ? 'สิทธิ์ต่อปี: 30 วัน' : 'Annual Allowance: 30 Days'}
                        </p>
                      </div>

                      {/* Annual Leave */}
                      <div className="p-4 bg-green-50/40 border border-green-100 rounded-2xl space-y-2 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-green-650 tracking-wider uppercase block">
                            {language === 'th' ? 'โควตาลาพักร้อน' : 'Annual Leave'}
                          </span>
                          <span className="text-2xl font-bold text-green-800 mt-1 block">
                            {currentUserData?.annualLeaveBalance ?? 6} {language === 'th' ? 'วัน' : 'Days'}
                          </span>
                        </div>
                        <p className="text-[10px] text-green-500 font-semibold">
                          {language === 'th' ? 'สิทธิ์ต่อปี: 6 วัน' : 'Annual Allowance: 6 Days'}
                        </p>
                      </div>

                      {/* Tokens Balance */}
                      <div className="p-4 bg-zinc-50 border border-zinc-150 rounded-2xl space-y-2 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase block">
                            {language === 'th' ? 'ยอดโทเค็นสะสม' : 'Compo-Off Tokens'}
                          </span>
                          <span className="text-2xl font-bold text-zinc-900 mt-1 block">
                            {currentUserData?.tokensBalance?.toFixed(1) || '0.0'} Tokens
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-semibold">
                          {language === 'th' ? '*ใช้เคลมวันลาชดเชย' : '*Claim 1 day off per token'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {selectedUserForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setSelectedUserForDetails(null)} />
          <div className="relative bg-white border border-zinc-150 rounded-3xl w-full max-w-md p-6 shadow-xl animate-fade-in space-y-6">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <h3 className="text-lg font-bold text-zinc-900">
                {language === 'th' ? 'ข้อมูลผู้ใช้งานโดยละเอียด' : 'Detailed User Profile'}
              </h3>
              <button
                onClick={() => setSelectedUserForDetails(null)}
                className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors border-none outline-none cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-zinc-50 p-4 rounded-2xl border border-zinc-200/50">
                <div className="w-16 h-16 rounded-2xl bg-zinc-200 border border-zinc-300 flex items-center justify-center font-bold text-zinc-600 text-2xl select-none uppercase">
                  {selectedUserForDetails.name?.slice(0, 2) || 'US'}
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{language === 'th' ? 'บทบาท' : 'Role'}</div>
                  <div className="text-sm font-bold text-zinc-800">
                    {selectedUserForDetails.role === 'ADMIN' ? 'Admin' : selectedUserForDetails.role === 'LEAD' ? 'Team Lead' : 'Member'}
                  </div>
                  <div className="text-xs text-zinc-500 font-medium">{selectedUserForDetails.email}</div>
                </div>
              </div>

              <div className="space-y-3">
                {isEditingProfile ? (
                  <>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                        {language === 'th' ? 'ชื่อ-นามสกุล' : 'Full Name'}
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 bg-white focus:border-zinc-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                        {language === 'th' ? 'ตำแหน่ง' : 'Title'}
                      </label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 bg-white focus:border-zinc-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                        {language === 'th' ? 'แผนก' : 'Department'}
                      </label>
                      <select
                        value={editDepartment}
                        onChange={(e) => setEditDepartment(e.target.value)}
                        className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 bg-white focus:border-zinc-900 focus:outline-none cursor-pointer"
                      >
                        <option value="Engineering">{language === 'th' ? 'ฝ่ายวิศวกรรม (Engineering)' : 'Engineering'}</option>
                        <option value="Design">{language === 'th' ? 'ฝ่ายออกแบบ (Design)' : 'Design'}</option>
                        <option value="Management">{language === 'th' ? 'ฝ่ายบริหาร (Management)' : 'Management'}</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{language === 'th' ? 'ชื่อ-นามสกุล' : 'Full Name'}</span>
                        <span className="text-xs font-bold text-zinc-800">{selectedUserForDetails.name}</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{language === 'th' ? 'ตำแหน่ง' : 'Title'}</span>
                        <span className="text-xs font-semibold text-zinc-700">{selectedUserForDetails.title}</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{language === 'th' ? 'สังกัด / แผนก' : 'Department'}</span>
                        <span className="text-xs font-semibold text-zinc-700">{selectedUserForDetails.department}</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{language === 'th' ? 'อีเมลแอดเดรส' : 'Email'}</span>
                        <span className="text-xs font-semibold text-zinc-700">{selectedUserForDetails.email}</span>
                      </div>
                    </div>

                    <div className="border-t border-zinc-100 pt-3">
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">{language === 'th' ? 'ข้อมูลโควตาวันลาสะสม' : 'Leave Allowance Balances'}</div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 bg-red-50/50 border border-red-100 rounded-xl">
                          <div className="text-[9px] font-bold text-red-500 uppercase">{language === 'th' ? 'ลาป่วย' : 'Sick'}</div>
                          <div className="text-sm font-bold text-red-800 mt-0.5">{selectedUserForDetails.sickLeaveBalance ?? 30} วัน</div>
                        </div>
                        <div className="p-2 bg-green-50/50 border border-green-100 rounded-xl">
                          <div className="text-[9px] font-bold text-green-500 uppercase">{language === 'th' ? 'พักร้อน' : 'Annual'}</div>
                          <div className="text-sm font-bold text-green-800 mt-0.5">{selectedUserForDetails.annualLeaveBalance ?? 6} วัน</div>
                        </div>
                        <div className="p-2 bg-zinc-50 border border-zinc-150 rounded-xl">
                          <div className="text-[9px] font-bold text-zinc-500 uppercase">Tokens</div>
                          <div className="text-sm font-bold text-zinc-800 mt-0.5">{selectedUserForDetails.tokensBalance?.toFixed(1) || '0.0'}</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-zinc-100 pt-4">
              {isEditingProfile ? (
                <>
                  <button
                    onClick={() => setIsEditingProfile(false)}
                    className="px-4 py-2 border border-zinc-200 hover:bg-zinc-50 rounded-xl text-xs font-bold transition-all cursor-pointer bg-white text-zinc-700"
                  >
                    {language === 'th' ? 'ยกเลิก' : 'Cancel'}
                  </button>
                  <button
                    onClick={handleUpdateProfileSubmit}
                    className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer border-none outline-none"
                  >
                    {language === 'th' ? 'บันทึก' : 'Submit'}
                  </button>
                </>
              ) : (
                <>
                  {(user?.role === 'ADMIN' || user?.id === selectedUserForDetails.id) && (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200/60 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      {language === 'th' ? 'แก้ไขข้อมูล' : 'Edit'}
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedUserForDetails(null)}
                    className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer border-none outline-none"
                  >
                    {language === 'th' ? 'ปิด' : 'Close'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
