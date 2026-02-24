import { useState, useEffect, useCallback } from 'react';
import type { WorkLog, WorkLogFormData, User } from '../types';
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
  const [replyContent, setReplyContent] = useState('');
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
    if (!replyingLog || !replyContent.trim()) return;
    await updateWorkLog(replyingLog.id, {
      supervisorReply: replyContent,
      supervisorReplyAt: new Date().toISOString()
    });
    await loadData();
    setReplyingLog(null);
    setReplyContent('');
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

      {filteredLogs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>暫無工作日誌</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLogs.map(log => (
            <div key={log.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[log.status]}`}>
                    {statusLabels[log.status]}
                  </span>
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

              <h3 className="font-semibold text-gray-900 mb-2">{log.task}</h3>
              <p className="text-gray-600 text-sm mb-2">{log.response}</p>

              <div className="flex gap-4 text-sm text-gray-500 mb-3">
                {log.completionDate && (
                  <span>完成日期：{log.completionDate}</span>
                )}
                {log.timeSpent && (
                  <span>花費時間：{log.timeSpent}</span>
                )}
              </div>

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
                    <div className="space-y-2">
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
                          onClick={() => { setReplyingLog(null); setReplyContent(''); }}
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
