'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@/src/components/LanguageContext';
import { useRole } from '@/src/components/RoleContext';
import TopNavBar from '@/src/components/TopNavBar';
import { saveProfileSettings, saveWorkspaceSettings } from '../actions';
import { SettingsController } from './SettingsController';

export default function SettingsClient() {
  const { t } = useTranslation();
  const { role } = useRole();
  const [, setTick] = useState(0);
  const [controller] = useState(() => new SettingsController(() => setTick((tick) => tick + 1)));

  useEffect(() => {
    controller.loadState();
  }, [controller]);

  const handleSave = async () => {
    await controller.save(role, saveProfileSettings, saveWorkspaceSettings);
  };

  const messageText = controller.getMessageText();
  const messageType = controller.getMessageType();

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
                  <img
                    alt="Profile Avatar"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDAxqpaUNIleLAD9XYhKsX2Qooc6XptE2clDD2Vk35OtdDPrAbhVDtIBD5grW9dmuu0t_0_76tdEww6kzLNxGg1CNiS2NgIYQTICX6W93GldTrIWnWxYJ-qQvE36Q_1xzfyaK-_ioen7Mbpeau6fhmNuVY4v-QQMP6x6YaT12g4TZGfVVmBrEBT_BEadMETd7nN13afYPgbqP4_Zn0c3eLBOGRF__MXE_indHaUYg9RGaFX72v1Cso3YvGiw-J8tEsIVKjxT2ORvKb_"
                  />
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
