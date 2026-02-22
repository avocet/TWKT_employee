import { useState, useEffect } from 'react';
import type { WorkLog, WorkLogFormData } from '../types';

interface WorkLogFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: WorkLogFormData) => void;
  editingLog?: WorkLog | null;
}

export default function WorkLogForm({ isOpen, onClose, onSubmit, editingLog }: WorkLogFormProps) {
  const [date, setDate] = useState('');
  const [task, setTask] = useState('');
  const [response, setResponse] = useState('');
  const [completionDate, setCompletionDate] = useState('');
  const [timeSpent, setTimeSpent] = useState('');
  const [problems, setProblems] = useState('');
  const [status, setStatus] = useState<'pending' | 'processing' | 'completed'>('pending');

  useEffect(() => {
    if (editingLog) {
      setDate(editingLog.date);
      setTask(editingLog.task);
      setResponse(editingLog.response);
      setCompletionDate(editingLog.completionDate);
      setTimeSpent(editingLog.timeSpent);
      setProblems(editingLog.problems);
      setStatus(editingLog.status);
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      setTask('');
      setResponse('');
      setCompletionDate('');
      setTimeSpent('');
      setProblems('');
      setStatus('pending');
    }
  }, [editingLog, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!task.trim()) return;
    onSubmit({
      date,
      task: task.trim(),
      response: response.trim(),
      completionDate,
      timeSpent: timeSpent.trim(),
      problems: problems.trim(),
      status,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingLog ? '编辑工作日志' : '新建工作日志'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">日期</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">状态</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as typeof status)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="pending">待处理</option>
                  <option value="processing">处理中</option>
                  <option value="completed">已完成</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">完成事项 <span className="text-red-500">*</span></label>
              <textarea
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="今日完成的工作事项..."
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">回复</label>
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="对上级或客户的回复..."
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">完成日期</label>
                <input
                  type="date"
                  value={completionDate}
                  onChange={(e) => setCompletionDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">花费时间</label>
                <input
                  type="text"
                  value={timeSpent}
                  onChange={(e) => setTimeSpent(e.target.value)}
                  placeholder="如：2小时30分钟"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">遇到的问题</label>
              <textarea
                value={problems}
                onChange={(e) => setProblems(e.target.value)}
                placeholder="工作中遇到的问题..."
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-gray-700 bg-white border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
          >
            {editingLog ? '保存' : '创建'}
          </button>
        </div>
      </div>
    </div>
  );
}
