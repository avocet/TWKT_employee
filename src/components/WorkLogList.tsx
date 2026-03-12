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
  paused: 'bg-gray-100 text-gray-700',
  completed: 'bg-green-100 text-green-700',
};

const statusLabels = {
  pending: '待處理',
  processing: '處理中',
  paused: '暫停處理',
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
  const [itemNewStatus, setItemNewStatus] = useState<'pending' | 'processing' | 'paused' | 'completed'>('pending');
  const [updatedWorkItems, setUpdatedWorkItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [replyingPendingItem, setReplyingPendingItem] = useState<{logId: string; itemId: string} | null>(null);
  const [pendingReplyContent, setPendingReplyContent] = useState('');
  const [pendingReplyStatus, setPendingReplyStatus] = useState<'pending' | 'processing' | 'paused' | 'completed'>('pending');
  const [showStats, setShowStats] = useState(false);

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

  const filteredLogs = filterUserId
    ? logs.filter(log => log.userId === filterUserId)
    : logs;

  const pendingItems = filteredLogs.flatMap(log => 
    (log.workItems || [])
      .filter(item => item.status !== 'completed')
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

  const toggleReplies = (itemId: string) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handlePendingReply = async (logId: string, itemId: string) => {
    const log = logs.find(l => l.id === logId);
    if (!log) return;
    
    const newReply = {
      content: pendingReplyContent,
      by: userId,
      byName: users.find(u => u.id === userId)?.name || '未知',
      at: new Date().toISOString(),
      isAdmin: isAdmin
    };
    
    const updatedItems = (log.workItems || []).map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          replies: [...(item.replies || []), newReply],
          status: isAdmin ? pendingReplyStatus : item.status
        };
      }
      return item;
    });
    
    await updateWorkLog(logId, { workItems: updatedItems });
    await loadData();
    setReplyingPendingItem(null);
    setPendingReplyContent('');
    setPendingReplyStatus('pending');
  };

  const handleReply = async () => {
    if (!replyingLog) return;
    
    // Handle individual item reply
    if (replyingItemId) {
      const newReply = {
        content: itemReplyContent,
        by: userId,
        byName: users.find(u => u.id === userId)?.name || '未知',
        at: new Date().toISOString(),
        isAdmin: isAdmin
      };
      
      const updatedItems = (replyingLog.workItems || []).map(item => {
        if (item.id === replyingItemId) {
          return {
            ...item,
            replies: [...(item.replies || []), newReply],
            status: isAdmin ? itemNewStatus : item.status
          };
        }
        return item;
      });
      
      await updateWorkLog(replyingLog.id, { workItems: updatedItems });
      await loadData();
      setReplyingItemId(null);
      setItemReplyContent('');
      setItemNewStatus('pending');
      return;
    }
    
    // Handle log-level reply (admin only)
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

  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyLogs = logs.filter(log => log.date.startsWith(currentMonth));
  
  const employeeStats = users.filter(u => u.role === 'employee').map(emp => {
    const empLogs = monthlyLogs.filter(log => log.userId === emp.id);
    const allItems = empLogs.flatMap(log => log.workItems || []);
    const completed = allItems.filter(item => item.status === 'completed').length;
    const pending = allItems.filter(item => item.status === 'pending').length;
    const processing = allItems.filter(item => item.status === 'processing').length;
    const total = completed + pending + processing;
    return {
      userId: emp.id,
      name: emp.name,
      completed,
      pending,
      processing,
      total,
      completedPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
      pendingPercent: total > 0 ? Math.round((pending / total) * 100) : 0,
      processingPercent: total > 0 ? Math.round((processing / total) * 100) : 0,
    };
  });

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">載入中...</p>
      </div>
    );
  }

  return (
    <div className={isAdmin ? "lg:flex lg:gap-6" : ""}>
      {isAdmin && (
        <>
          {/* Mobile: Show button */}
          <button
            onClick={() => setShowStats(true)}
            className="lg:hidden fixed bottom-4 right-4 z-40 bg-primary text-white p-4 rounded-full shadow-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>

          {/* Mobile: Modal */}
          {showStats && (
            <div className="lg:hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowStats(false)}>
              <div className="bg-white rounded-xl p-4 w-full max-w-sm max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-900">{currentMonth.slice(5)}月 統計報表</h3>
                  <button onClick={() => setShowStats(false)} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-4">已完成 / 待處理 / 處理中</p>
                <div className="space-y-3">
                  {employeeStats.map(stat => (
                    <div key={stat.userId} className="border-b border-gray-100 pb-3 last:border-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">{stat.name}</span>
                        <span className="text-xs text-gray-500">{stat.total} 項</span>
                      </div>
                      <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-gray-100">
                        {stat.completed > 0 && (
                          <div className="bg-green-400" style={{ width: `${stat.completedPercent}%` }} />
                        )}
                        {stat.pending > 0 && (
                          <div className="bg-yellow-400" style={{ width: `${stat.pendingPercent}%` }} />
                        )}
                        {stat.processing > 0 && (
                          <div className="bg-blue-400" style={{ width: `${stat.processingPercent}%` }} />
                        )}
                      </div>
                      <div className="flex justify-between mt-1 text-xs">
                        <span className="text-green-600">{stat.completed} ({stat.completedPercent}%)</span>
                        <span className="text-yellow-600">{stat.pending} ({stat.pendingPercent}%)</span>
                        <span className="text-blue-600">{stat.processing} ({stat.processingPercent}%)</span>
                      </div>
                    </div>
                  ))}
                {employeeStats.every(s => s.total === 0) && (
                  <p className="text-sm text-gray-400 text-center py-4">本月尚無資料</p>
                )}
              </div>
            </div>
            </div>
          )}

          {/* Desktop: Show on left side */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 sticky top-4">
              <h3 className="font-semibold text-gray-900 mb-1">{currentMonth.slice(5)}月 統計報表</h3>
              <p className="text-xs text-gray-500 mb-4">已完成 / 待處理 / 處理中</p>
              <div className="space-y-3">
                {employeeStats.map(stat => (
                  <div key={stat.userId} className="border-b border-gray-100 pb-3 last:border-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">{stat.name}</span>
                      <span className="text-xs text-gray-500">{stat.total} 項</span>
                    </div>
                    <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-gray-100">
                      {stat.completed > 0 && (
                        <div className="bg-green-400" style={{ width: `${stat.completedPercent}%` }} />
                      )}
                      {stat.pending > 0 && (
                        <div className="bg-yellow-400" style={{ width: `${stat.pendingPercent}%` }} />
                      )}
                      {stat.processing > 0 && (
                        <div className="bg-blue-400" style={{ width: `${stat.processingPercent}%` }} />
                      )}
                    </div>
                    <div className="flex justify-between mt-1 text-xs">
                      <span className="text-green-600">{stat.completed} ({stat.completedPercent}%)</span>
                      <span className="text-yellow-600">{stat.pending} ({stat.pendingPercent}%)</span>
                      <span className="text-blue-600">{stat.processing} ({stat.processingPercent}%)</span>
                    </div>
                  </div>
                ))}
                {employeeStats.every(s => s.total === 0) && (
                  <p className="text-sm text-gray-400 text-center py-4">本月尚無資料</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
      <div className="lg:flex-1">
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
              {users.filter(u => u.role === 'admin').map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
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
            {pendingItems.map((item) => {
              const hasReplies = item.replies && item.replies.length > 0;
              const isExpanded = expandedReplies.has(item.id);
              const log = logs.find(l => l.workItems?.some(wi => wi.id === item.id));
              
              return (
                <div key={item.id} className="bg-white rounded-lg border border-orange-100">
                  <div 
                    className="flex items-center gap-2 text-sm p-2 cursor-pointer hover:bg-orange-100 rounded-t-lg"
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleReplies(item.id); }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[item.status]}`}>
                      {statusLabels[item.status]}
                    </span>
                    {isAdmin && (
                      <span className="text-xs text-gray-500">({getUserName(item.userId)})</span>
                    )}
                    <span className="text-gray-700 flex-1">{item.content}</span>
                    <span className="text-gray-400 text-xs">{item.date}</span>
                    {hasReplies && (
                      <span className="text-xs text-gray-400">({item.replies?.length})</span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); setReplyingPendingItem({ logId: log?.id || '', itemId: item.id }); }}
                      className="text-xs text-primary hover:underline"
                    >
                      回覆
                    </button>
                  </div>
                  
                  {isExpanded && hasReplies && (
                    <div className="px-2 pb-2 pl-6 space-y-2">
                      {item.replies?.map((reply, idx) => (
                        <div key={idx} className="pl-2 border-l-2 border-blue-300">
                          <p className="text-xs text-blue-600 mb-1">{reply.isAdmin ? '主管回覆' : '員工回覆'} - {reply.byName}</p>
                          <p className="text-sm text-gray-700">{reply.content}</p>
                          <p className="text-xs text-gray-400">{new Date(reply.at).toLocaleString('zh-TW')}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {replyingPendingItem?.itemId === item.id && (
                    <div className="px-2 pb-2 pl-6 space-y-2">
                      {isAdmin && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">狀態：</span>
                          <select
                            value={pendingReplyStatus}
                            onChange={(e) => setPendingReplyStatus(e.target.value as 'pending' | 'processing' | 'paused' | 'completed')}
                            className="px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:border-primary"
                          >
                            <option value="pending">待處理</option>
                            <option value="processing">處理中</option>
                            <option value="paused">暫停處理</option>
                            <option value="completed">已完成</option>
                          </select>
                        </div>
                      )}
                      <textarea
                        value={pendingReplyContent}
                        onChange={(e) => setPendingReplyContent(e.target.value)}
                        placeholder="輸入回覆..."
                        rows={2}
                        className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:border-primary"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => { if (log) handlePendingReply(log.id, item.id); }}
                          className="px-2 py-1 bg-primary text-white text-xs rounded"
                        >
                          儲存
                        </button>
                        <button
                          onClick={() => { setReplyingPendingItem(null); setPendingReplyContent(''); setPendingReplyStatus('pending'); }}
                          className="px-2 py-1 text-gray-600 text-xs bg-gray-100 rounded"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
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
                    {isAdmin || log.date === today ? (
                      <>
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
                      </>
                    ) : (
                      <span className="text-sm text-gray-400">（已鎖定）</span>
                    )}
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
                      <button
                        onClick={() => { setReplyingLog(log); setReplyingItemId(item.id); }}
                        className="text-xs text-primary hover:underline"
                      >
                        回覆
                      </button>
                    </div>
                    {item.replies && item.replies.length > 0 && (
                      <div className="mt-2">
                        {expandedReplies.has(item.id) ? (
                          <div className="space-y-2 pl-2 border-l-2 border-blue-300">
                            {item.replies.map((reply, idx) => (
                              <div key={idx}>
                                <p className="text-xs text-blue-600 mb-1">{reply.isAdmin ? '主管回覆' : '員工回覆'} - {reply.byName}</p>
                                <p className="text-sm text-gray-700">{reply.content}</p>
                                <p className="text-xs text-gray-400">{new Date(reply.at).toLocaleString('zh-TW')}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <button
                            onClick={() => toggleReplies(item.id)}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            展開 {item.replies.length}則對話
                          </button>
                        )}
                        {expandedReplies.has(item.id) && (
                          <button
                            onClick={() => toggleReplies(item.id)}
                            className="text-xs text-gray-500 hover:text-gray-700 mt-1"
                          >
                            收合
                          </button>
                        )}
                      </div>
                    )}
                    {replyingItemId === item.id && (
                      <div className="mt-2 space-y-2">
                        {isAdmin && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">狀態：</span>
                            <select
                              value={itemNewStatus}
                              onChange={(e) => setItemNewStatus(e.target.value as 'pending' | 'processing' | 'paused' | 'completed')}
                              className="px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:border-primary"
                            >
                              <option value="pending">待處理</option>
                              <option value="processing">處理中</option>
                              <option value="paused">暫停處理</option>
                              <option value="completed">已完成</option>
                            </select>
                          </div>
                        )}
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
                            className="px-2 py-1 bg-primary text-white text-xs rounded"
                          >
                            儲存
                          </button>
                          <button
                            onClick={() => { setReplyingItemId(null); setItemReplyContent(''); setItemNewStatus('pending'); }}
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
                                    const newStatus = e.target.value as 'pending' | 'processing' | 'paused' | 'completed';
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
                                  <option value="paused">暫停處理</option>
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
                          onClick={() => { setReplyingLog(null); setReplyContent(''); setReplyingItemId(null); setUpdatedWorkItems([]); setItemNewStatus('pending'); }}
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
          isAdmin={isAdmin}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleCreate}
        />
      )}

      {editingLog && (
        <WorkLogForm
          isAdmin={isAdmin}
          initialData={editingLog}
          onClose={() => setEditingLog(null)}
          onSubmit={(data) => handleUpdate(editingLog.id, data)}
        />
      )}
      </div>
    </div>
  );
}
