'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '@/src/components/LanguageContext';
import TopNavBar from '@/src/components/TopNavBar';
import { saveProfileSettings, saveWorkspaceSettings } from '../actions';

export default function SettingsView() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('profile');
  const [fullName, setFullName] = useState('Alex Rivera');
  const [emailAddress, setEmailAddress] = useState('alex.rivera@holidayhq.com');
  const [capacity, setCapacity] = useState(25);
  const [earnRate, setEarnRate] = useState('1.5x');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (sectionId: string, ref: React.RefObject<HTMLDivElement | null>) => {
    setActiveTab(sectionId);
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 160;

      if (workspaceRef.current && scrollPos >= workspaceRef.current.offsetTop) {
        setActiveTab('workspace');
      } else if (notificationsRef.current && scrollPos >= notificationsRef.current.offsetTop) {
        setActiveTab('notifications');
      } else if (profileRef.current && scrollPos >= profileRef.current.offsetTop) {
        setActiveTab('profile');
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSave = async () => {
    setMessage(null);
    const profileRes = await saveProfileSettings({ fullName, emailAddress });
    if (!profileRes.success) {
      setMessage({ type: 'error', text: profileRes.error || 'Profile save failed' });
      return;
    }
    const workspaceRes = await saveWorkspaceSettings({ capacity, earnRate });
    if (!workspaceRes.success) {
      setMessage({ type: 'error', text: workspaceRes.error || 'Workspace save failed' });
      return;
    }
    setMessage({ type: 'success', text: 'Settings saved successfully!' });
  };

  return (
    <div className="flex-grow flex flex-col min-h-screen ml-64">
      <TopNavBar placeholder={t('searchSettings')} />

      <main className="flex-1 p-12 overflow-y-auto custom-scrollbar">
        <div className="max-w-[1280px] mx-auto">
          <div className="mb-12">
            <h2 className="text-4xl font-bold tracking-tight text-primary mb-2">{t('settings')}</h2>
            <p className="text-lg text-secondary">
              {t('settingsDesc')}
            </p>
          </div>

          {message && (
            <div
              className={`mb-6 p-4 rounded-xl text-sm font-semibold border ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-12 gap-8">
            {/* Settings Navigation */}
            <div className="col-span-3">
              <nav className="flex flex-col gap-2 sticky top-24">
                {[
                  { id: 'profile', label: t('profile'), ref: profileRef },
                  { id: 'notifications', label: t('notifications'), ref: notificationsRef },
                  { id: 'workspace', label: t('workspace'), ref: workspaceRef },
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => scrollToSection(tab.id, tab.ref)}
                      className={`flex items-center justify-between group px-4 py-3 bg-white border rounded-xl transition-all cursor-pointer text-left ${
                        isActive
                          ? 'border-primary font-bold shadow-sm'
                          : 'border-outline-variant hover:border-primary'
                      }`}
                    >
                      <span className={`font-label-caps text-xs ${isActive ? 'text-primary' : 'text-secondary'}`}>
                        {tab.label}
                      </span>
                      <span className="material-symbols-outlined text-sm opacity-0 group-hover:opacity-100 transition-opacity text-primary">
                        arrow_forward_ios
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Content Area */}
            <div className="col-span-9 flex flex-col gap-12">
              {/* Profile Settings */}
              <div ref={profileRef} className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 scroll-mt-24 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-lg font-bold text-primary">{t('profileSettings')}</h3>
                    <p className="text-xs text-secondary">{t('profileSettingsDesc')}</p>
                  </div>
                  <button className="px-4 py-2 border border-outline-variant text-primary rounded-lg font-label-caps text-xs font-bold hover:bg-surface-container transition-colors cursor-pointer">
                    {t('edit')}
                  </button>
                </div>
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-surface border border-outline-variant rounded-xl">
                    <div className="w-16 h-16 rounded-full overflow-hidden relative group border border-outline-variant">
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
                      <h4 className="font-label-caps text-xs text-primary font-bold">{t('avatar')}</h4>
                      <p className="text-xs text-secondary">{t('recommendedSize')}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-label-caps text-[10px] font-bold text-secondary block mb-1">{t('fullName')}</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-white border border-outline-variant text-on-surface rounded-lg px-4 py-3 text-sm focus:border-primary transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-label-caps text-[10px] font-bold text-secondary block mb-1">{t('emailAddress')}</label>
                      <input
                        type="email"
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                        className="w-full bg-white border border-outline-variant text-on-surface rounded-lg px-4 py-3 text-sm focus:border-primary transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Notification Preferences */}
              <div ref={notificationsRef} className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 scroll-mt-24 shadow-sm">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-primary">{t('notificationPreferences')}</h3>
                  <p className="text-xs text-secondary">{t('notificationPreferencesDesc')}</p>
                </div>
                <div className="divide-y divide-outline-variant">
                  <div className="py-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-primary">{t('emailNotifications')}</h4>
                      <p className="text-xs text-secondary">{t('emailNotificationsDesc')}</p>
                    </div>
                    <button
                      onClick={() => setEmailNotifications(!emailNotifications)}
                      className={`w-12 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                        emailNotifications ? 'bg-primary' : 'bg-surface-variant'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full transition-transform shadow-sm bg-white ${
                          emailNotifications ? 'translate-x-6' : ''
                        }`}
                      ></div>
                    </button>
                  </div>
                  <div className="py-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-primary">{t('pushNotifications')}</h4>
                      <p className="text-xs text-secondary">{t('pushNotificationsDesc')}</p>
                    </div>
                    <button
                      onClick={() => setPushNotifications(!pushNotifications)}
                      className={`w-12 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                        pushNotifications ? 'bg-primary' : 'bg-surface-variant'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full transition-transform shadow-sm bg-white ${
                          pushNotifications ? 'translate-x-6' : ''
                        }`}
                      ></div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Workspace Settings */}
              <div ref={workspaceRef} className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 scroll-mt-24 shadow-sm">
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-primary">{t('workspaceSettings')}</h3>
                  <p className="text-xs text-secondary">{t('workspaceSettingsDesc')}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <label className="font-label-caps text-xs text-primary font-bold block mb-1">
                        {t('dailyCapacityLimit')}
                      </label>
                      <p className="text-[11px] text-secondary mb-4">
                        {t('dailyCapacityLimitDesc')}
                      </p>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={capacity}
                          onChange={(e) => setCapacity(Number(e.target.value))}
                          className="w-full h-1 bg-surface-variant rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <span className="text-sm font-bold text-primary w-12 text-right">{capacity}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="font-label-caps text-xs text-primary font-bold block mb-1">
                        {t('weekendEarnRate')}
                      </label>
                      <p className="text-[11px] text-secondary mb-4">
                        {t('weekendEarnRateDesc')}
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 px-4 py-3 bg-white border border-outline-variant text-on-surface rounded-lg flex items-center justify-between">
                          <span className="text-xs text-secondary">{t('baseRate')}</span>
                          <span className="text-sm font-bold text-primary">{earnRate}</span>
                        </div>
                        <select
                          value={earnRate}
                          onChange={(e) => setEarnRate(e.target.value)}
                          className="p-3 border border-outline-variant rounded-lg bg-white text-xs hover:bg-surface-container transition-colors cursor-pointer outline-none font-bold text-on-surface"
                        >
                          <option value="1.0x">1.0x</option>
                          <option value="1.5x">1.5x</option>
                          <option value="2.0x">2.0x</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-4 pb-12">
                <button className="font-label-caps text-xs text-secondary hover:text-primary transition-colors cursor-pointer font-bold tracking-wider">
                  {t('discardChanges')}
                </button>
                <button onClick={handleSave} className="bg-primary text-on-primary px-8 py-3 rounded-xl font-label-caps text-xs font-bold scale-95 active:scale-90 transition-transform shadow-lg shadow-primary/10 cursor-pointer tracking-wider">
                  {t('savePreferences')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
