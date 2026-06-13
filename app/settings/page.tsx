'use client';

import { useState, useEffect, useRef } from 'react';
import TopNavBar from '@/src/components/TopNavBar';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [capacity, setCapacity] = useState(25);
  const [earnRate, setEarnRate] = useState('1.5x');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const appearanceRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (sectionId: string, ref: React.RefObject<HTMLDivElement | null>) => {
    setActiveTab(sectionId);
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 160;

      if (appearanceRef.current && scrollPos >= appearanceRef.current.offsetTop) {
        setActiveTab('appearance');
      } else if (workspaceRef.current && scrollPos >= workspaceRef.current.offsetTop) {
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

  return (
    <div className="flex-grow flex flex-col min-h-screen ml-64 transition-colors duration-200">
      <TopNavBar placeholder="Search settings..." />

      <main className="flex-1 p-12 overflow-y-auto custom-scrollbar">
        <div className="max-w-[1280px] mx-auto">
          <div className="mb-12">
            <h2 className="text-4xl font-bold tracking-tight text-primary dark:text-white mb-2">Settings</h2>
            <p className="text-lg text-secondary dark:text-outline/80">
              Manage your personal profile, workspace preferences, and application look.
            </p>
          </div>

          <div className="grid grid-cols-12 gap-8">
            {/* Settings Navigation */}
            <div className="col-span-3">
              <nav className="flex flex-col gap-2 sticky top-24">
                {[
                  { id: 'profile', label: 'Profile', ref: profileRef },
                  { id: 'notifications', label: 'Notifications', ref: notificationsRef },
                  { id: 'workspace', label: 'Workspace', ref: workspaceRef },
                  { id: 'appearance', label: 'Appearance', ref: appearanceRef },
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => scrollToSection(tab.id, tab.ref)}
                      className={`flex items-center justify-between group px-4 py-3 bg-white dark:bg-[#16171d] border rounded-xl transition-all cursor-pointer text-left ${
                        isActive
                          ? 'border-primary dark:border-white font-bold shadow-sm'
                          : 'border-outline-variant dark:border-[#2d2f39] hover:border-primary dark:hover:border-white'
                      }`}
                    >
                      <span className={`font-label-caps text-xs ${isActive ? 'text-primary dark:text-white' : 'text-secondary dark:text-outline'}`}>
                        {tab.label}
                      </span>
                      <span className="material-symbols-outlined text-sm opacity-0 group-hover:opacity-100 transition-opacity text-primary dark:text-white">
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
              <div ref={profileRef} className="bg-surface-container-lowest dark:bg-[#16171d] border border-outline-variant dark:border-[#2d2f39] rounded-2xl p-8 scroll-mt-24">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-lg font-bold text-primary dark:text-white">Profile Settings</h3>
                    <p className="text-xs text-secondary dark:text-outline">Information that identifies you across the HQ.</p>
                  </div>
                  <button className="px-4 py-2 border border-outline-variant dark:border-[#2d2f39] text-primary dark:text-white rounded-lg font-label-caps text-xs font-bold hover:bg-surface-container dark:hover:bg-[#1c1d24] transition-colors cursor-pointer">
                    Edit
                  </button>
                </div>
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-surface dark:bg-[#1c1d24]/50 border border-outline-variant dark:border-[#2d2f39] rounded-xl">
                    <div className="w-16 h-16 rounded-full overflow-hidden relative group border border-outline-variant dark:border-[#2d2f39]">
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
                      <h4 className="font-label-caps text-xs text-primary dark:text-white font-bold">Avatar</h4>
                      <p className="text-xs text-secondary dark:text-outline/80">Recommended: 200x200px</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-label-caps text-[10px] font-bold text-secondary dark:text-outline block mb-1">Full Name</label>
                      <input
                        type="text"
                        defaultValue="Alex Rivera"
                        className="w-full bg-white dark:bg-[#0d0e12] border border-outline-variant dark:border-[#2d2f39] text-on-surface dark:text-white rounded-lg px-4 py-3 text-sm focus:border-primary dark:focus:border-white transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-label-caps text-[10px] font-bold text-secondary dark:text-outline block mb-1">Email Address</label>
                      <input
                        type="email"
                        defaultValue="alex.rivera@holidayhq.com"
                        className="w-full bg-white dark:bg-[#0d0e12] border border-outline-variant dark:border-[#2d2f39] text-on-surface dark:text-white rounded-lg px-4 py-3 text-sm focus:border-primary dark:focus:border-white transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Notification Preferences */}
              <div ref={notificationsRef} className="bg-surface-container-lowest dark:bg-[#16171d] border border-outline-variant dark:border-[#2d2f39] rounded-2xl p-8 scroll-mt-24">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-primary dark:text-white">Notification Preferences</h3>
                  <p className="text-xs text-secondary dark:text-outline">Choose how and when you receive updates.</p>
                </div>
                <div className="divide-y divide-outline-variant dark:divide-[#2d2f39]">
                  <div className="py-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-primary dark:text-white">Email Notifications</h4>
                      <p className="text-xs text-secondary dark:text-outline/85">Daily digest of leave requests and balance updates.</p>
                    </div>
                    <button
                      onClick={() => setEmailNotifications(!emailNotifications)}
                      className={`w-12 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                        emailNotifications ? 'bg-primary dark:bg-white' : 'bg-surface-variant dark:bg-[#2d2f39]'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full transition-transform shadow-sm ${
                          emailNotifications
                            ? 'translate-x-6 bg-white dark:bg-black'
                            : 'bg-white dark:bg-[#1c1d24]'
                        }`}
                      ></div>
                    </button>
                  </div>
                  <div className="py-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-primary dark:text-white">Push Notifications</h4>
                      <p className="text-xs text-secondary dark:text-outline/85">Instant alerts for team approvals or denials.</p>
                    </div>
                    <button
                      onClick={() => setPushNotifications(!pushNotifications)}
                      className={`w-12 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                        pushNotifications ? 'bg-primary dark:bg-white' : 'bg-surface-variant dark:bg-[#2d2f39]'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full transition-transform shadow-sm ${
                          pushNotifications
                            ? 'translate-x-6 bg-white dark:bg-black'
                            : 'bg-white dark:bg-[#1c1d24]'
                        }`}
                      ></div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Workspace Settings */}
              <div ref={workspaceRef} className="bg-surface-container-lowest dark:bg-[#16171d] border border-outline-variant dark:border-[#2d2f39] rounded-2xl p-8 scroll-mt-24">
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-primary dark:text-white">Workspace Settings</h3>
                  <p className="text-xs text-secondary dark:text-outline">Global rules for your team's holiday planning.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <label className="font-label-caps text-xs text-primary dark:text-white font-bold block mb-1">
                        Daily Capacity Limit
                      </label>
                      <p className="text-[11px] text-secondary dark:text-outline/80 mb-4">
                        Maximum percentage of team members allowed off simultaneously.
                      </p>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={capacity}
                          onChange={(e) => setCapacity(Number(e.target.value))}
                          className="w-full h-1 bg-surface-variant dark:bg-[#2d2f39] rounded-lg appearance-none cursor-pointer accent-primary dark:accent-white"
                        />
                        <span className="text-sm font-bold text-primary dark:text-white w-12 text-right">{capacity}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="font-label-caps text-xs text-primary dark:text-white font-bold block mb-1">
                        Weekend Earn Rate
                      </label>
                      <p className="text-[11px] text-secondary dark:text-outline/80 mb-4">
                        Multiplier for balance accrued during overtime/weekends.
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 px-4 py-3 bg-white dark:bg-[#0d0e12] border border-outline-variant dark:border-[#2d2f39] text-on-surface dark:text-white rounded-lg flex items-center justify-between">
                          <span className="text-xs text-secondary dark:text-outline">Base Rate</span>
                          <span className="text-sm font-bold text-primary dark:text-white">{earnRate}</span>
                        </div>
                        <select
                          value={earnRate}
                          onChange={(e) => setEarnRate(e.target.value)}
                          className="p-3 border border-outline-variant dark:border-[#2d2f39] rounded-lg bg-white dark:bg-[#16171d] text-xs hover:bg-surface-container dark:hover:bg-[#1c1d24] transition-colors cursor-pointer outline-none font-bold text-on-surface dark:text-white"
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

              {/* Appearance */}
              <div ref={appearanceRef} className="bg-surface-container-lowest dark:bg-[#16171d] border border-outline-variant dark:border-[#2d2f39] rounded-2xl p-8 mb-12 scroll-mt-24">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-primary dark:text-white">Appearance</h3>
                  <p className="text-xs text-secondary dark:text-outline">Customize the interface visual tone.</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="cursor-pointer group">
                    <div className="aspect-video bg-white dark:bg-[#0d0e12] border-2 border-primary dark:border-white rounded-xl p-1 mb-2 transition-all">
                      <div className="w-full h-full bg-surface-container dark:bg-[#16171d] flex flex-col gap-1 p-2">
                        <div className="w-full h-2 bg-outline-variant dark:bg-[#2d2f39] rounded"></div>
                        <div className="flex gap-1">
                          <div className="w-4 h-4 bg-outline-variant dark:bg-[#2d2f39] rounded"></div>
                          <div className="w-full h-4 bg-white dark:bg-[#0d0e12] rounded shadow-sm"></div>
                        </div>
                      </div>
                    </div>
                    <span className="font-label-caps text-[10px] text-primary dark:text-white flex items-center gap-1 font-bold">
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      Minimalist Light
                    </span>
                  </div>

                  <div className="opacity-45 cursor-not-allowed">
                    <div className="aspect-video bg-on-surface border border-outline-variant rounded-xl p-1 mb-2">
                      <div className="w-full h-full bg-on-surface-variant flex flex-col gap-1 p-2">
                        <div className="w-full h-2 bg-on-secondary-container rounded"></div>
                        <div className="flex gap-1">
                          <div className="w-4 h-4 bg-on-secondary-container rounded"></div>
                          <div className="w-full h-4 bg-on-surface rounded shadow-sm"></div>
                        </div>
                      </div>
                    </div>
                    <span className="font-label-caps text-[10px] text-secondary dark:text-outline font-bold">Mono Dark (Coming Soon)</span>
                  </div>

                  <div className="opacity-45 cursor-not-allowed">
                    <div className="aspect-video bg-surface-container border border-outline-variant rounded-xl p-1 mb-2">
                      <div className="w-full h-full bg-surface-variant flex flex-col gap-1 p-2">
                        <div className="w-full h-2 bg-outline-variant rounded"></div>
                        <div className="flex gap-1">
                          <div className="w-4 h-4 bg-outline-variant rounded"></div>
                          <div className="w-full h-4 bg-white rounded shadow-sm"></div>
                        </div>
                      </div>
                    </div>
                    <span className="font-label-caps text-[10px] text-secondary dark:text-outline font-bold">System Default</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-4 pb-12">
                <button className="font-label-caps text-xs text-secondary dark:text-outline hover:text-primary dark:hover:text-white transition-colors cursor-pointer font-bold tracking-wider">
                  Discard Changes
                </button>
                <button className="bg-primary dark:bg-white text-on-primary dark:text-black px-8 py-3 rounded-xl font-label-caps text-xs font-bold scale-95 active:scale-90 transition-transform shadow-lg shadow-primary/10 cursor-pointer tracking-wider">
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
