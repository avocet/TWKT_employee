import { useState, useEffect, useCallback } from 'react';
import type { WorkLog, WorkLogFormData, User, WorkItem } from '../types';
import { getWorkLogs, addWorkLog, updateWorkLog, deleteWorkLog } from '../utils/storage';
import { getUsers } from '../hooks/useAuth';
import WorkLogForm from './WorkLogForm';

interface WorkLogListProps {
  userId: string;
  isAdmin: boolean;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
};

const statusLabels = {
  pending: '待處理',
  processing: '處理中',
  completed: '已完成',
};

export default function WorkLogList({ userId, isAdmin }: WorkLogListProps) {
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<WorkLog | null>(null);
  const [filterUserId, setFilterUserId] = useState(isAdmin ? '' : userId);
  const [replyingLog, setReplyingLog] = useState<WorkLog | null>(null);
  const [replyingItemId, setReplyingItemId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [itemReplyContent, setItemReplyContent] = useState('');
  const [updatedWorkItems, setUpdatedWorkItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [fetchedLogs, fetchedUsers] = await Promise.all([
      getWorkLogs(userId, isAdmin),
      getUsers()
    ]);
    setLogs(fetchedLogs);
    setUsers(fetchedUsers);
    setLoading(false);
  }, [userId, isAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const today = new Date().toISOString().split('T')[0];
  const hasLoggedToday = logs.some(log => log.userId === userId && log.date === today);
  const canCreateLog = isAdmin || !hasLoggedToday;

  // Get all pending/processing work items across all logs
  const pendingItems = logs.flatMap(log => 
    (log.workItems || [])
      .filter(item => item.status === 'pending' || item.status === 'processing')
      .map(item => ({
        ...item,
        date: log.date,
        userId: log.userId
      }))
  );

  const handleCreate = async (data: WorkLogFormData) => {
    await addWorkLog({ userId, ...data });
    await loadData();
    setIsFormOpen(false);
  };

  const handleUpdate = async (id: string, data: Partial<WorkLog>) => {
    await updateWorkLog(id, data);
    await loadData();
    setEditingLog(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除這筆日誌嗎？')) return;
    await deleteWorkLog(id);
    await loadData();
  };

  const handleReply = async () => {
    if (!replyingLog) return;
    
    // Handle individual item reply
    if (replyingItemId && itemReplyContent.trim()) {
      const updatedItems = (replyingLog.workItems || []).map(item => {
        if (item.id === replyingItemId) {
          return {
            ...item,
            reply: itemReplyContent,
            replyAt: new Date().toISOString(),
            repliedBy: userId
          };
        }
        return item;
      });
      
      await updateWorkLog(replyingLog.id, { workItems: updatedItems });
      await loadData();
      setReplyingItemId(null);
      setItemReplyContent('');
      return;
    }
    
    // Handle log-level reply
    const updateData: Partial<WorkLog> = {
      supervisorReply: replyContent,
      supervisorReplyAt: new Date().toISOString()
    };
    
    // If work items status was updated, include them in the update
    if (updatedWorkItems.length > 0) {
      updateData.workItems = updatedWorkItems;
    }
    
    await updateWorkLog(replyingLog.id, updateData);
    await loadData();
    setReplyingLog(null);
    setReplyContent('');
    setUpdatedWorkItems([]);
  };

  const getUserName = (uid: string) => users.find(u => u.id === uid)?.name || '未知';
  const getUserDepartment = (uid: string) => users.find(u => u.id === uid)?.department || '';

  const filteredLogs = filterUserId
    ? logs.filter(log => log.userId === filterUserId)
    : logs;

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">載入中...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">工作日誌</h2>
        <div className="flex gap-3">
          {isAdmin && (
            <select
              value={filterUserId}
              onChange={(e) => setFilterUserId(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
            >
              <option value="">全部員工</option>
              {users.filter(u => u.role === 'employee').map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          )}
          {canCreateLog && (
            <button
              onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新增日誌
            </button>
          )}
        </div>
      </div>

      {!canCreateLog && !isAdmin && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
          今日已提交工作日誌
        </div>
      )}

      {pendingItems.length > 0 && (
        <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <h3 className="font-medium text-orange-800 mb-2">進行中事項 ({pendingItems.length})</h3>
          <div className="space-y-2">
            {pendingItems.map((item) => (
              <div 
                key={item.id} 
                onClick={() => {
                  const log = logs.find(l => l.workItems?.some(wi => wi.id === item.id));
                  if (log) {
                    setReplyingLog(log);
                    // Scroll to the log entry
                    setTimeout(() => {
                      const element = document.getElementById(`log-${log.id}`);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }, 100);
                  }
                }}
                className="flex items-center gap-2 text-sm cursor-pointer hover:bg-orange-100 p-1 rounded"
              >
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[item.status]}`}>
                  {statusLabels[item.status]}
                </span>
                <span className="text-gray-700 flex-1">{item.content}</span>
                <span className="text-gray-400 text-xs">{item.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredLogs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>暫無工作日誌</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLogs.map(log => (
            <div key={log.id} id={`log-${log.id}`} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{log.date}</span>
                  {isAdmin && (
                    <span className="text-sm text-gray-400">• {getUserName(log.userId)} ({getUserDepartment(log.userId)})</span>
                  )}
                </div>
                {log.userId === userId && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingLog(log)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      編輯
                    </button>
                    <button
                      onClick={() => handleDelete(log.id)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      刪除
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2 mb-2">
                {log.workItems?.map((item) => (
                  <div key={item.id} className="p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[item.status]}`}>
                        {statusLabels[item.status]}
                      </span>
                      <span className="text-gray-700 flex-1">{item.content}</span>
                      {isAdmin && !item.reply && (
                        <button
                          onClick={() => { setReplyingLog(log); setReplyingItemId(item.id); }}
                          className="text-xs text-primary hover:underline"
                        >
                          回覆
                        </button>
                      )}
                    </div>
                    {item.reply && (
                      <div className="mt-2 pl-2 border-l-2 border-blue-300">
                        <p className="text-xs text-blue-600 mb-1">主管回覆</p>
                        <p className="text-sm text-gray-700">{item.reply}</p>
                      </div>
                    )}
                    {replyingItemId === item.id && (
                      <div className="mt-2 space-y-2">
                        <textarea
                          value={itemReplyContent}
                          onChange={(e) => setItemReplyContent(e.target.value)}
                          placeholder="輸入回覆..."
                          rows={2}
                          className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:border-primary"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleReply}
                            disabled={!itemReplyContent.trim()}
                            className="px-2 py-1 bg-primary text-white text-xs rounded disabled:opacity-50"
                          >
                            儲存
                          </button>
                          <button
                            onClick={() => { setReplyingItemId(null); setItemReplyContent(''); }}
                            className="px-2 py-1 text-gray-600 text-xs bg-gray-100 rounded"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {log.response && (
                <p className="text-gray-600 text-sm mb-2">
                  <span className="font-medium">回覆：</span>{log.response}
                </p>
              )}

              {log.problems && (
                <div className="p-3 bg-red-50 rounded-lg mb-3">
                  <p className="text-xs text-red-600 mb-1">遇到問題</p>
                  <p className="text-gray-700 text-sm">{log.problems}</p>
                </div>
              )}

              {log.supervisorReply && (
                <div className="p-3 bg-blue-50 rounded-lg mb-3">
                  <p className="text-xs text-blue-600 mb-1">主管回覆</p>
                  <p className="text-gray-700 text-sm">{log.supervisorReply}</p>
                </div>
              )}

              {isAdmin && !log.supervisorReply && (
                <div className="border-t border-gray-100 pt-3 mt-3">
                  {replyingLog?.id === log.id ? (
                    <div className="space-y-3">
                      {/* Work items status update */}
                      {(log.workItems || []).filter(item => item.status !== 'completed').length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">更新事項狀態：</p>
                          <div className="space-y-2">
                            {(log.workItems || []).filter(item => item.status !== 'completed').map(item => (
                              <div key={item.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                <select
                                  value={updatedWorkItems.find(wi => wi.id === item.id)?.status || item.status}
                                  onChange={(e) => {
                                    const newStatus = e.target.value as 'pending' | 'processing' | 'completed';
                                    const existing = updatedWorkItems.find(wi => wi.id === item.id);
                                    if (existing) {
                                      setUpdatedWorkItems(updatedWorkItems.map(wi => 
                                        wi.id === item.id ? { ...wi, status: newStatus } : wi
                                      ));
                                    } else {
                                      setUpdatedWorkItems([...updatedWorkItems, { ...item, status: newStatus }]);
                                    }
                                  }}
                                  className="px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:border-primary"
                                >
                                  <option value="pending">待處理</option>
                                  <option value="processing">處理中</option>
                                  <option value="completed">已完成</option>
                                </select>
                                <span className="text-sm text-gray-700 flex-1">{item.content}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="請輸入對員工日誌的回覆..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleReply}
                          className="px-3 py-1 bg-primary text-white rounded-lg text-sm"
                        >
                          儲存回覆
                        </button>
                        <button
                          onClick={() => { setReplyingLog(null); setReplyContent(''); setReplyingItemId(null); setUpdatedWorkItems([]); }}
                          className="px-3 py-1 text-gray-600 bg-gray-100 rounded-lg text-sm"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setReplyingLog(log)}
                      className="text-sm text-primary hover:underline"
                    >
                      回覆日誌
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isFormOpen && (
        <WorkLogForm
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleCreate}
        />
      )}

      {editingLog && (
        <WorkLogForm
          initialData={editingLog}
          onClose={() => setEditingLog(null)}
          onSubmit={(data) => handleUpdate(editingLog.id, data)}
        />
      )}
    </div>
  );
}
