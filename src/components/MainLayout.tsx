import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import WorkLogList from './WorkLogList';
import ContractAdmin from './ContractAdmin';
import ContractSigning from './ContractSigning';
import { TaskDistribution } from './TaskDistribution';
import EmployeeAdmin from './EmployeeAdmin';
import UserSettings from './UserSettings';
import { getAnnouncements, addAnnouncement, deleteAnnouncement } from '../utils/storage';
import type { Announcement } from '../types';

type Tab = 'worklog' | 'contract' | 'tasks' | 'employees' | 'settings';

export default function MainLayout() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('worklog');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    const data = await getAnnouncements();
    setAnnouncements(data);
  };

  const handleAddAnnouncement = async () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) return;
    await addAnnouncement({
      title: newAnnouncement.title,
      content: newAnnouncement.content,
      createdBy: user.name
    });
    setNewAnnouncement({ title: '', content: '' });
    setShowAnnouncementForm(false);
    loadAnnouncements();
  };

  const handleDeleteAnnouncement = async (id: string) => {
    await deleteAnnouncement(id);
    loadAnnouncements();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="font-semibold text-gray-900">阿克索工作日誌系統</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowAnnouncements(!showAnnouncements)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg relative"
                title="公告"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {announcements.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>

              {showAnnouncements && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-3 border-b flex items-center justify-between">
                    <span className="font-medium text-gray-900">公告</span>
                    {isAdmin && (
                      <button
                        onClick={() => setShowAnnouncementForm(true)}
                        className="text-sm text-primary hover:underline"
                      >
                        新增
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {announcements.length === 0 ? (
                      <p className="p-3 text-sm text-gray-500">暂无公告</p>
                    ) : (
                      announcements.map((announcement) => (
                        <div key={announcement.id} className="p-3 border-b last:border-b-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{announcement.title}</p>
                              <p className="text-gray-600 text-sm mt-1">{announcement.content}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {announcement.createdBy} · {new Date(announcement.createdAt).toLocaleDateString('zh-TW')}
                              </p>
                            </div>
                            {isAdmin && (
                              <button
                                onClick={() => handleDeleteAnnouncement(announcement.id)}
                                className="text-gray-400 hover:text-red-500"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full bg-gray-200" />
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{isAdmin ? '管理員' : '員工'}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              title="登出"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200">
        <div className="flex px-6 gap-1">
          <NavButton 
            active={activeTab === 'worklog'} 
            onClick={() => setActiveTab('worklog')}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          >
            工作日誌
          </NavButton>
          
          {isAdmin ? (
            <NavButton 
              active={activeTab === 'contract'} 
              onClick={() => setActiveTab('contract')}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              }
            >
              契約管理
            </NavButton>
          ) : (
            <NavButton 
              active={activeTab === 'contract'} 
              onClick={() => setActiveTab('contract')}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              }
            >
              勞動契約
            </NavButton>
          )}

          <NavButton 
            active={activeTab === 'tasks'} 
            onClick={() => setActiveTab('tasks')}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            }
          >
            交辦事項
          </NavButton>

          {isAdmin && (
            <NavButton 
              active={activeTab === 'employees'} 
              onClick={() => setActiveTab('employees')}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              }
            >
              員工管理
            </NavButton>
          )}

          <NavButton 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          >
            個人設定
          </NavButton>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {activeTab === 'worklog' && (
          <WorkLogList userId={user.id} isAdmin={isAdmin} />
        )}
        
        {activeTab === 'contract' && (
          isAdmin ? <ContractAdmin /> : <ContractSigning />
        )}
        
        {activeTab === 'tasks' && (
          <TaskDistribution userId={user.id} userName={user.name} isAdmin={isAdmin} />
        )}

        {activeTab === 'employees' && isAdmin && (
          <EmployeeAdmin />
        )}

        {activeTab === 'settings' && (
          <UserSettings />
        )}
      </main>

      {showAnnouncementForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAnnouncementForm(false)} />
          <div className="relative bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">新增公告</h2>
              <button onClick={() => setShowAnnouncementForm(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">標題</label>
                <input
                  type="text"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                  placeholder="公告標題"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">內容</label>
                <textarea
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                  placeholder="公告內容"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowAnnouncementForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg"
                >
                  取消
                </button>
                <button
                  onClick={handleAddAnnouncement}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                >
                  發布
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NavButton({ 
  active, 
  onClick, 
  children, 
  icon 
}: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
        active
          ? 'text-primary border-primary'
          : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
