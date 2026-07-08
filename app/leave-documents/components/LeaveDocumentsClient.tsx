'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from '@/src/components/LanguageContext';
import { useRole } from '@/src/components/RoleContext';
import { useAuth } from '@/src/components/AuthContext';
import TopNavBar from '@/src/components/TopNavBar';
import { useConfirm } from '@/src/components/ConfirmDialog';
import { ErrorBoundary } from '@/src/components/ErrorBoundary';
import LeaveDocumentFormModal from '@/src/components/LeaveDocumentFormModal';
import LeaveDocumentDetailModal from '@/src/components/LeaveDocumentDetailModal';
import { runGraphQLAction } from '@/src/actions/auth';
import { useRealtimeSync } from '@/src/hooks/useRealtimeSync';

interface LeaveDocument {
  id: string;
  userId: string;
  userName: string;
  department: string;
  title: string;
  leaveDate: string;
  leaveType: string;
  reason: string;
  signature: string;
  status: string;
  attachment?: string | null;
  rejectReason?: string | null;
  createdAt: string;
}

export default function LeaveDocumentsClient() {
  const { language } = useTranslation();
  const { role } = useRole();
  const { user, refreshUser } = useAuth();
  const confirm = useConfirm();
  
  const [documents, setDocuments] = useState<LeaveDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<LeaveDocument | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const pageSize = 8;

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const query = `
        query {
          getLeaveDocuments {
            id
            userId
            userName
            department
            title
            leaveDate
            leaveType
            reason
            signature
            status
            attachment
            rejectReason
            createdAt
          }
        }
      `;
      const response = await runGraphQLAction(query);
      if (response?.data?.getLeaveDocuments) {
        setDocuments(response.data.getLeaveDocuments);
      } else if (response?.errors) {
        console.error('GraphQL Errors:', response.errors);
      }
    } catch (err) {
      console.error('Failed to load leave documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadDocuments();
    }
  }, [user?.id]);

  // Real-time synchronization
  useRealtimeSync(() => {
    if (user?.id) loadDocuments();
  });

  const handleCreateDocument = async (data: {
    leaveDate: string;
    leaveType: string;
    reason: string;
    signature: string;
    attachment?: string;
  }) => {
    const mutation = `
      mutation createLeaveDocument($leaveDate: String!, $leaveType: String!, $reason: String!, $signature: String!, $attachment: String) {
        createLeaveDocument(leaveDate: $leaveDate, leaveType: $leaveType, reason: $reason, signature: $signature, attachment: $attachment) {
          id
        }
      }
    `;
    const response = await runGraphQLAction(mutation, data);
    if (response?.errors) {
      throw new Error(response.errors[0].message || 'ไม่สามารถยื่นเอกสารได้');
    }
    toast.success(
      language === 'th' ? 'ยื่นเอกสารใบลาสำเร็จ' : 'Leave Request Submitted',
      { description: language === 'th' ? 'กรุณารอการอนุมัติจากผู้ดูแลระบบ' : 'Please wait for administrator approval.' }
    );
    await refreshUser();
    loadDocuments();
  };

  const handleApproveDocument = async (id: string) => {
    const ok = await confirm({
      title: language === 'th' ? 'อนุมัติใบลาพักงาน?' : 'Approve Leave Request?',
      text: language === 'th'
        ? 'คุณต้องการอนุมัติเอกสารใบลาฉบับนี้ และสร้างกำหนดวันหยุดบนปฏิทินหรือไม่?'
        : 'Are you sure you want to approve this leave request and register it on the calendar?',
      confirmText: language === 'th' ? 'อนุมัติ' : 'Approve',
      cancelText: language === 'th' ? 'ยกเลิก' : 'Cancel',
      variant: 'default',
    });
    if (!ok) return;

    const mutation = `
      mutation approveLeaveDocument($id: String!) {
        approveLeaveDocument(id: $id) {
          id
          status
        }
      }
    `;
    const response = await runGraphQLAction(mutation, { id });
    if (response?.errors) {
      toast.error(
        language === 'th' ? 'อนุมัติไม่สำเร็จ' : 'Approval Failed',
        { description: response.errors[0].message }
      );
      return;
    }
    toast.success(
      language === 'th' ? 'อนุมัติใบลาสำเร็จ' : 'Leave Approved',
      { description: language === 'th' ? 'หักโทเค็น/โควตาวันลา และบันทึกวันหยุดบนปฏิทินแล้ว' : 'Deducted token/quota and registered leave event!' }
    );
    await refreshUser();
    loadDocuments();
  };

  const handleRejectDocument = async (id: string, rejectReason?: string) => {
    const ok = await confirm({
      title: language === 'th' ? 'ปฏิเสธใบลาพักงาน?' : 'Reject Leave Request?',
      text: language === 'th'
        ? 'คุณต้องการปฏิเสธคำขอลาพักงานฉบับนี้หรือไม่?'
        : 'Are you sure you want to reject this leave request?',
      confirmText: language === 'th' ? 'ปฏิเสธ' : 'Reject',
      cancelText: language === 'th' ? 'ยกเลิก' : 'Cancel',
      variant: 'danger',
    });
    if (!ok) return;

    const mutation = `
      mutation rejectLeaveDocument($id: String!, $rejectReason: String) {
        rejectLeaveDocument(id: $id, rejectReason: $rejectReason) {
          id
          status
        }
      }
    `;
    const response = await runGraphQLAction(mutation, { id, rejectReason });
    if (response?.errors) {
      toast.error(
        language === 'th' ? 'ทำรายการไม่สำเร็จ' : 'Action Failed',
        { description: response.errors[0].message }
      );
      return;
    }
    toast.success(
      language === 'th' ? 'ปฏิเสธใบลาแล้ว' : 'Leave Request Rejected'
    );
    await refreshUser();
    loadDocuments();
  };

  const handleDeleteDocument = async (id: string) => {
    const ok = await confirm({
      title: language === 'th' ? 'ลบเอกสารใบลา?' : 'Delete Leave Request?',
      text: language === 'th'
        ? 'คุณต้องการลบเอกสารฉบับนี้ออกจากระบบอย่างถาวรหรือไม่? (หากอนุมัติแล้ว จะทำการลบวันหยุดและคืนโควตา/โทเค็น)'
        : 'Are you sure you want to permanently delete this document? (If approved, calendar event will be removed and quota/token refunded)',
      confirmText: language === 'th' ? 'ยืนยันลบ' : 'Confirm Delete',
      cancelText: language === 'th' ? 'ยกเลิก' : 'Cancel',
      variant: 'danger',
    });
    if (!ok) return;

    const mutation = `
      mutation deleteLeaveDocument($id: String!) {
        deleteLeaveDocument(id: $id)
      }
    `;
    const response = await runGraphQLAction(mutation, { id });
    if (response?.errors) {
      toast.error(
        language === 'th' ? 'ลบไม่สำเร็จ' : 'Deletion Failed',
        { description: response.errors[0].message }
      );
      return;
    }
    toast.success(
      language === 'th' ? 'ลบเอกสารสำเร็จ' : 'Document Deleted'
    );
    await refreshUser();
    loadDocuments();
  };

  const filteredDocuments = documents.filter((doc) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      doc.userName.toLowerCase().includes(searchLower) ||
      doc.department.toLowerCase().includes(searchLower) ||
      doc.leaveType.toLowerCase().includes(searchLower) ||
      doc.leaveDate.includes(searchLower) ||
      doc.status.toLowerCase().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(filteredDocuments.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedDocs = filteredDocuments.slice(startIndex, startIndex + pageSize);

  const getLeaveTypeTag = (type: string) => {
    switch (type) {
      case 'SICK':
        return <span className="px-2.5 py-0.5 bg-red-50 text-red-700 border border-red-100 rounded-lg text-xs font-semibold">{language === 'th' ? 'ลาป่วย' : 'Sick'}</span>;
      case 'CASUAL':
        return <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-xs font-semibold">{language === 'th' ? 'ลากิจ' : 'Casual'}</span>;
      case 'ANNUAL':
        return <span className="px-2.5 py-0.5 bg-green-50 text-green-700 border border-green-100 rounded-lg text-xs font-semibold">{language === 'th' ? 'ลาพักร้อน' : 'Annual'}</span>;
      case 'COMPENSATORY':
        return <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-xs font-semibold">{language === 'th' ? 'ลาชดเชย' : 'Comp Off'}</span>;
      default:
        return <span className="px-2.5 py-0.5 bg-zinc-50 text-zinc-700 border border-zinc-100 rounded-lg text-xs font-semibold">{type}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="text-green-700 font-bold text-xs flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">check_circle</span>{language === 'th' ? 'อนุมัติแล้ว' : 'Approved'}</span>;
      case 'REJECTED':
        return <span className="text-red-600 font-bold text-xs flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">cancel</span>{language === 'th' ? 'ปฏิเสธ' : 'Rejected'}</span>;
      default:
        return <span className="text-amber-600 font-bold text-xs flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">pending</span>{language === 'th' ? 'รออนุมัติ' : 'Pending'}</span>;
    }
  };

  return (
    <ErrorBoundary>
      <div className="grow flex flex-col min-h-screen lg:ml-64 bg-background">
        <TopNavBar placeholder={language === 'th' ? 'ค้นหาเอกสารใบลา...' : 'Search leave documents...'} />

        <main className="flex-1 p-6 lg:p-12 pb-24 lg:pb-12 overflow-y-auto custom-scrollbar">
          <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-4xl font-bold tracking-tight text-zinc-900">
                  {language === 'th' ? 'เอกสารใบลางานรายวัน' : 'Leave Documents'}
                </h2>
                <p className="text-zinc-500 mt-2 text-base">
                  {language === 'th'
                    ? 'จัดการเอกสารยื่นใบลาอย่างเป็นทางการพร้อมลายมือชื่อพนักงาน'
                    : 'Manage and review official leave documents with employee signatures.'}
                </p>
              </div>

              {role === 'USER' && (
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="px-5 py-3 bg-zinc-900 text-white rounded-2xl hover:bg-zinc-800 transition-colors font-bold text-sm flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  {language === 'th' ? 'เขียนใบลาใหม่' : 'New Leave Request'}
                </button>
              )}
            </div>

            {/* Main Content Area */}
            <div className="bg-white border border-zinc-100 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
              {/* Search filter bar */}
              <div className="p-4 border-b border-zinc-100 bg-zinc-50/30 flex items-center gap-3">
                <span className="material-symbols-outlined text-zinc-400 text-lg">search</span>
                <input
                  type="text"
                  placeholder={language === 'th' ? 'ค้นหาตามชื่อ แผนก วันที่ หรือสถานะ...' : 'Search by name, department, date, status...'}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent border-none outline-none w-full text-sm font-medium text-zinc-800 placeholder-zinc-400"
                />
              </div>

              {isLoading ? (
                <div className="p-16 flex flex-col justify-center items-center gap-3 text-zinc-400">
                  <span className="animate-spin rounded-full h-8 w-8 border-4 border-zinc-200 border-t-zinc-800"></span>
                  <span className="text-xs font-semibold">{language === 'th' ? 'กำลังโหลดเอกสาร...' : 'Loading documents...'}</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-100 bg-zinc-50/50">
                        <th className="p-4 pl-6 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                          {language === 'th' ? 'วันที่ยื่นขอลา' : 'LEAVE DATE'}
                        </th>
                        {role === 'ADMIN' && (
                          <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                            {language === 'th' ? 'พนักงาน' : 'EMPLOYEE'}
                          </th>
                        )}
                        <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                          {language === 'th' ? 'ประเภทการลา' : 'LEAVE TYPE'}
                        </th>
                        <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                          {language === 'th' ? 'เหตุผล' : 'REASON'}
                        </th>
                        <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                          {language === 'th' ? 'สถานะเอกสาร' : 'STATUS'}
                        </th>
                        <th className="p-4 pr-6 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">
                          {language === 'th' ? 'จัดการ' : 'ACTIONS'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedDocs.length === 0 ? (
                        <tr>
                          <td colSpan={role === 'ADMIN' ? 6 : 5} className="p-12 text-center text-sm text-zinc-400 font-medium">
                            {language === 'th' ? 'ไม่พบข้อมูลเอกสารใบลาพักงาน' : 'No leave documents found.'}
                          </td>
                        </tr>
                      ) : (
                        paginatedDocs.map((doc) => {
                          const displayDate = new Date(doc.leaveDate).toLocaleDateString(
                            language === 'en' ? 'en-US' : 'th-TH',
                            { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' }
                          );
                          return (
                            <tr
                              key={doc.id}
                              className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50/30 transition-colors"
                            >
                              <td className="p-4 pl-6 text-sm font-bold text-zinc-900">
                                {displayDate}
                              </td>
                              {role === 'ADMIN' && (
                                <td className="p-4 text-sm font-medium text-zinc-800">
                                  <div className="flex flex-col">
                                    <span className="font-bold text-zinc-900">{doc.userName}</span>
                                    <span className="text-[10px] text-zinc-400">{doc.department}</span>
                                  </div>
                                </td>
                              )}
                              <td className="p-4 text-sm font-semibold">
                                {getLeaveTypeTag(doc.leaveType)}
                              </td>
                              <td className="p-4 text-sm text-zinc-500 max-w-xs truncate">
                                {doc.reason}
                              </td>
                              <td className="p-4 text-sm">
                                {getStatusBadge(doc.status)}
                              </td>
                              <td className="p-4 pr-6 text-right">
                                <button
                                  onClick={() => {
                                    setSelectedDoc(doc);
                                    setIsDetailOpen(true);
                                  }}
                                  className="px-3.5 py-1.5 border border-zinc-200 text-zinc-700 hover:border-zinc-300 rounded-xl text-xs font-bold hover:bg-zinc-50 transition-colors cursor-pointer"
                                >
                                  {language === 'th' ? 'ดูรายละเอียด' : 'Details'}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination UI */}
              {filteredDocuments.length > pageSize && (
                <div className="flex justify-between items-center p-4 pl-6 pr-6 bg-zinc-50/50 border-t border-zinc-100">
                  <span className="text-xs text-zinc-500 font-medium">
                    {language === 'th'
                      ? `แสดง ${startIndex + 1}-${Math.min(startIndex + pageSize, filteredDocuments.length)} จากทั้งหมด ${filteredDocuments.length} รายการ`
                      : `Showing ${startIndex + 1}-${Math.min(startIndex + pageSize, filteredDocuments.length)} of ${filteredDocuments.length} documents`}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 border border-zinc-200 text-zinc-600 rounded-xl text-xs font-semibold hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                      {language === 'th' ? 'ก่อนหน้า' : 'Prev'}
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`w-7 h-7 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                          currentPage === p
                            ? 'bg-zinc-900 text-white shadow-xs'
                            : 'border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 border border-zinc-200 text-zinc-600 rounded-xl text-xs font-semibold hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                      {language === 'th' ? 'ถัดไป' : 'Next'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Modal Forms */}
        <LeaveDocumentFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleCreateDocument}
        />

        <LeaveDocumentDetailModal
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedDoc(null);
          }}
          document={selectedDoc}
          onApprove={handleApproveDocument}
          onReject={handleRejectDocument}
          onDelete={handleDeleteDocument}
        />
      </div>
    </ErrorBoundary>
  );
}
