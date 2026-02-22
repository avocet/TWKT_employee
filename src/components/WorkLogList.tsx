import { useState, useEffect } from 'react';
import type { WorkLog, WorkLogFormData, User } from '../types';
import { getWorkLogs, saveWorkLogs, generateId } from '../utils/storage';
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

  useEffect(() => {
    setLogs(getWorkLogs());
    setUsers(getUsers());
  }, []);

  const handleCreate = (data: WorkLogFormData) => {
    const newLog: WorkLog = {
      id: generateId(),
      userId: userId,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newLog, ...logs];
    setLogs(updated);
    saveWorkLogs(updated);
  };

  const handleUpdate = (data: WorkLogFormData) => {
    if (!editingLog) return;
    const updated = logs.map(log =>
      log.id === editingLog.id
        ? { ...log, ...data, updatedAt: new Date().toISOString() }
        : log
    );
    setLogs(updated);
    saveWorkLogs(updated);
    setEditingLog(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm('確定要刪除這條日誌嗎？')) return;
    const updated = logs.filter(log => log.id !== id);
    setLogs(updated);
    saveWorkLogs(updated);
  };

  const filteredLogs = filterUserId
    ? logs.filter(log => log.userId === filterUserId)
    : logs;

  const sortedLogs = [...filteredLogs].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const getUserName = (uid: string) => users.find(u => u.id === uid)?.name || '未知';

  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };

  const canEdit = (log: WorkLog) => {
    if (isAdmin) return true;
    return log.userId === userId && isToday(log.date);
  };

  const handleExport = () => {
    const headers = ['日期', '員工姓名', '部門', '完成事項', '回覆', '完成日期', '花費時間', '遇到的問題', '狀態'];
    const csvContent = [
      headers.join(','),
      ...sortedLogs.map(log => {
        const user = users.find(u => u.id === log.userId);
        return [
          log.date,
          user?.name || '',
          user?.department || '',
          `"${log.task.replace(/"/g, '""')}"`,
          `"${log.response.replace(/"/g, '""')}"`,
          log.completionDate,
          log.timeSpent,
          `"${log.problems.replace(/"/g, '""')}"`,
          statusLabels[log.status]
        ].join(',');
      })
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `工作日誌_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">工作日誌</h2>
        <div className="flex gap-2">
          {isAdmin && sortedLogs.length > 0 && (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              匯出
            </button>
          )}
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新建日誌
          </button>
        </div>
      </div>

      {isAdmin && (
        <div className="mb-4">
          <select
            value={filterUserId}
            onChange={(e) => setFilterUserId(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
          >
            <option value="">全部員工</option>
            {users.filter(u => u.role === 'employee').map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
      )}

      {sortedLogs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>暫無工作日誌</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedLogs.map(log => (
            <div key={log.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">{log.date}</span>
                  {isAdmin && (
                    <span className="text-sm font-medium text-gray-700">{getUserName(log.userId)}</span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[log.status]}`}>
                    {statusLabels[log.status]}
                  </span>
                </div>
                {canEdit(log) && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingLog(log)}
                      className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-100 rounded"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(log.id)}
                      className="p-1.5 text-gray-400 hover:text-danger hover:bg-red-50 rounded"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1">完成事項</p>
                  <p className="text-gray-700">{log.task}</p>
                </div>

                {log.response && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">回覆</p>
                    <p className="text-gray-600">{log.response}</p>
                  </div>
                )}

                <div className="flex gap-6 text-sm">
                  {log.completionDate && (
                    <div>
                      <span className="text-gray-400">完成日期：</span>
                      <span className="text-gray-600">{log.completionDate}</span>
                    </div>
                  )}
                  {log.timeSpent && (
                    <div>
                      <span className="text-gray-400">花費時間：</span>
                      <span className="text-gray-600">{log.timeSpent}</span>
                    </div>
                  )}
                </div>

                {log.problems && (
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="text-xs text-red-600 font-medium mb-1">遇到的問題</p>
                    <p className="text-sm text-red-700">{log.problems}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <WorkLogForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreate}
        editingLog={null}
      />

      <WorkLogForm
        isOpen={!!editingLog}
        onClose={() => setEditingLog(null)}
        onSubmit={handleUpdate}
        editingLog={editingLog}
      />
    </div>
  );
}
