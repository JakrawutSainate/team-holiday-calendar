'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/src/components/LanguageContext';
import { useRole } from '@/src/components/RoleContext';
import { useAuth } from '@/src/components/AuthContext';
import TopNavBar from '@/src/components/TopNavBar';
import { saveProfileSettings, saveWorkspaceSettings, saveSignatureAction, getUserSavedSignatureAction } from '../actions';
import { SettingsController } from './SettingsController';
import SettingsSkeleton from '@/src/components/skeletons/SettingsSkeleton';
import SignatureCanvas from '@/src/components/SignatureCanvas';

export default function SettingsClient() {
  const { t } = useTranslation();
  const { role } = useRole();
  const { user, refreshUser } = useAuth();
  const [newSignature, setNewSignature] = useState<string | null>(null);
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [controller] = useState(() => new SettingsController(() => setTick((tick) => tick + 1)));

  const loadSig = async () => {
    if (user) {
      const sig = await getUserSavedSignatureAction();
      setSavedSignature(sig);
    }
  };

  useEffect(() => {
    controller.loadState().finally(() => setIsLoading(false));
    loadSig();
  }, [controller, user]);

  // Pre-fill profile fields from logged-in user
  useEffect(() => {
    if (user) {
      controller.initFromUser(user.name, user.email);
    }
  }, [controller, user]);

  const handleSave = async () => {
    await controller.save(role, saveProfileSettings, saveWorkspaceSettings);
  };

  const messageText = controller.getMessageText();
  const messageType = controller.getMessageType();

  if (isLoading) return <SettingsSkeleton />;

  return (
    <div className="grow flex flex-col min-h-screen lg:ml-64 bg-background">
      <TopNavBar placeholder={t('searchSettings')} />

      <main className="flex-1 p-6 lg:p-12 pb-24 lg:pb-12 overflow-y-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-4xl font-bold tracking-tight text-zinc-900 mb-2">{t('settings')}</h2>
              <p className="text-lg text-zinc-500">{t('settingsDesc')}</p>
            </div>
            <div className="bg-zinc-50 border border-zinc-200/60 rounded-xl px-4 py-2 text-sm text-zinc-600 font-semibold shadow-xs">
              Role: <span className="text-zinc-900 font-bold">{role}</span>
            </div>
          </div>

          {messageText !== '' && (
            <div
              className={`p-4 rounded-xl text-sm font-semibold border ${
                messageType === 'success'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}
            >
              {messageText}
            </div>
          )}

          {/* Profile Settings Card */}
          <div className="bg-white border border-zinc-100/80 rounded-2xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-zinc-900">{t('profileSettings')}</h3>
                <p className="text-sm text-zinc-500 mt-1">{t('profileSettingsDesc')}</p>
              </div>
              <button className="px-4 py-2 border border-zinc-200 text-zinc-900 rounded-lg text-sm font-semibold hover:bg-zinc-50 transition-colors cursor-pointer">
                {t('edit')}
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4 p-5 bg-zinc-50/50 border border-zinc-100 rounded-xl">
                <div className="w-16 h-16 rounded-full overflow-hidden relative group border border-zinc-100">
                  {user?.avatarUrl ? (
                    <img
                      alt="Profile Avatar"
                      className="w-full h-full object-cover"
                      src={user.avatarUrl}
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-200 flex items-center justify-center">
                      <span className="material-symbols-outlined text-zinc-500 text-3xl">person</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                    <span className="material-symbols-outlined text-white">photo_camera</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm text-zinc-900 font-bold">{t('avatar')}</h4>
                  <p className="text-sm text-zinc-500 mt-1">{t('recommendedSize')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-semibold text-zinc-500 block mb-2">
                    {t('fullName')}
                  </label>
                  <input
                    type="text"
                    value={controller.getFullName()}
                    onChange={(e) => controller.setFullName(e.target.value)}
                    className="w-full bg-white border border-zinc-200 text-zinc-900 rounded-lg px-4 py-3 text-base focus:border-zinc-900 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-zinc-500 block mb-2">
                    {t('emailAddress')}
                  </label>
                  <input
                    type="email"
                    value={controller.getEmailAddress()}
                    onChange={(e) => controller.setEmailAddress(e.target.value)}
                    className="w-full bg-white border border-zinc-200 text-zinc-900 rounded-lg px-4 py-3 text-base focus:border-zinc-900 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Saved Signature Section */}
              <div className="border-t border-zinc-100 pt-6 space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-zinc-900">Saved Signature (ลายเซ็นที่บันทึกไว้)</h4>
                  <p className="text-xs text-zinc-500 mt-1">
                    ใช้ลายเซ็นนี้สำหรับลงนามคำขอลาอัตโนมัติ เพื่อความสะดวกในการยื่นเอกสาร
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  <div>
                    <label className="text-xs font-semibold text-zinc-400 block mb-2">
                      ลายเซ็นปัจจุบัน (Current Signature)
                    </label>
                    <div className="h-36 bg-zinc-50 border border-zinc-200/60 rounded-xl flex items-center justify-center overflow-hidden">
                      {savedSignature ? (
                        <img
                          src={savedSignature}
                          alt="Saved Signature"
                          className="max-h-full max-w-full object-contain filter invert"
                        />
                      ) : (
                        <span className="text-sm text-zinc-400 font-medium">ยังไม่มีลายเซ็นที่บันทึก (No saved signature)</span>
                      )}
                    </div>
                    {savedSignature && (
                      <button
                        onClick={async () => {
                          const res = await saveSignatureAction(null);
                          if (res.success) {
                            await loadSig();
                          } else {
                            alert(res.error);
                          }
                        }}
                        className="text-xs text-red-500 hover:text-red-700 font-bold mt-2 flex items-center gap-1 cursor-pointer bg-transparent border-0 outline-none"
                      >
                        <span className="material-symbols-outlined text-xs">delete</span> ลบลายเซ็นที่บันทึกไว้
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-zinc-400 block">
                      วาดลายเซ็นใหม่ (Draw New Signature)
                    </label>
                    <div className="border border-dashed border-zinc-200 rounded-xl overflow-hidden bg-white">
                      <SignatureCanvas onChange={(dataUrl) => setNewSignature(dataUrl)} />
                    </div>
                    <button
                      onClick={async () => {
                        if (!newSignature) {
                          alert('กรุณาวาดลายเซ็นก่อนกดบันทึก');
                          return;
                        }
                        const res = await saveSignatureAction(newSignature);
                        if (res.success) {
                          await refreshUser();
                          alert('บันทึกลายเซ็นเรียบร้อยแล้ว!');
                        } else {
                          alert(res.error);
                        }
                      }}
                      className="w-full bg-zinc-900 hover:bg-zinc-800 text-white py-2.5 rounded-lg text-xs font-semibold tracking-wider transition-colors cursor-pointer border-0 outline-none"
                    >
                      บันทึกลายเซ็นใหม่ (Save New Signature)
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Workspace Settings Card (Visible ONLY to Admin) */}
          {role === 'ADMIN' && (
            <div className="bg-white border border-zinc-100/80 rounded-2xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-8">
              <div>
                <h3 className="text-lg font-bold text-zinc-900">{t('workspaceSettings')}</h3>
                <p className="text-sm text-zinc-500 mt-1">{t('workspaceSettingsDesc')}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-zinc-900 block mb-1">
                      {t('dailyCapacityLimit')}
                    </label>
                    <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
                      {t('dailyCapacityLimitDesc')}
                    </p>
                    <div className="flex items-center gap-4">
                      <select
                        value={controller.getMaxOffAllowed()}
                        onChange={(e) => controller.setMaxOffAllowed(Number(e.target.value))}
                        className="p-3 border border-zinc-200 rounded-lg bg-white text-sm hover:bg-zinc-50 transition-colors cursor-pointer outline-none font-bold text-zinc-900 w-full"
                      >
                        <option value={1}>1 person (1 คน)</option>
                        <option value={2}>2 people (2 คน)</option>
                        <option value={3}>3 people (3 คน)</option>
                        <option value={4}>4 people (4 คน)</option>
                        <option value={5}>5 people (5 คน)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-zinc-900 block mb-1">
                      {t('weekendEarnRate')}
                    </label>
                    <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
                      {t('weekendEarnRateDesc')}
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 px-4 py-3 bg-white border border-zinc-200 text-zinc-950 rounded-lg flex items-center justify-between">
                        <span className="text-sm text-zinc-500">{t('baseRate')}</span>
                        <span className="text-base font-bold text-zinc-900">
                          {controller.getEarnRate()}
                        </span>
                      </div>
                      <select
                        value={controller.getEarnRate()}
                        onChange={(e) => controller.setEarnRate(e.target.value)}
                        className="p-3 border border-zinc-200 rounded-lg bg-white text-sm hover:bg-zinc-50 transition-colors cursor-pointer outline-none font-bold text-zinc-900"
                      >
                        <option value="1.0x">1.0x</option>
                        <option value="2.0x">2.0x</option>
                        <option value="3.0x">3.0x</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4">
            <button className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer font-bold tracking-wider">
              {t('discardChanges')}
            </button>
            <button
              onClick={handleSave}
              className="bg-zinc-900 text-white px-8 py-3.5 rounded-xl text-sm font-semibold scale-95 active:scale-90 transition-transform shadow-md cursor-pointer tracking-wider"
            >
              {t('savePreferences')}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
