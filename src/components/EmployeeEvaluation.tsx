import { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc, getDocs, query, collection, where } from 'firebase/firestore';
import { db } from '../utils/firebase';
import type { User } from '../types';

interface EvaluationItemData {
  score: number;
  note: string;
}

interface MonthEvaluation {
  item1: EvaluationItemData;
  item2: EvaluationItemData;
  item3: EvaluationItemData;
  item4: EvaluationItemData;
  totalScore: number;
  createdAt: string;
  updatedAt: string;
}

type EvaluationData = Record<string, MonthEvaluation>;

interface EmployeeEvaluationProps {
  users: User[];
}

export default function EmployeeEvaluation({ users }: EmployeeEvaluationProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [evaluationData, setEvaluationData] = useState<EvaluationData>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);
  const currentMonthValue = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(currentMonthValue);
  const [mountKey, setMountKey] = useState(0);
  const [workLogCount, setWorkLogCount] = useState(0);
  const [taskResponseCount, setTaskResponseCount] = useState(0);
  const [workLogReplyCount, setWorkLogReplyCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [completedList, setCompletedList] = useState<{type: string, title: string, date: string, completedAt: string}[]>([]);
  const [showCompletedModal, setShowCompletedModal] = useState(false);

  useEffect(() => {
    if (wheelRef.current) {
      setTimeout(() => {
        if (wheelRef.current && selectedMonth) {
          const items = wheelRef.current.querySelectorAll('.month-item');
          items.forEach((item, index) => {
            const opt = getMonthOptions()[index];
            if (opt?.value === selectedMonth) {
              item.scrollIntoView({ block: 'center', behavior: 'instant' });
            }
          });
        }
      }, 150);
    }
  }, [selectedMonth, currentMonthValue, mountKey]);

  const employees = users.filter(u => u.role === 'employee');

  const evaluationItems = [
    { key: 'item1', label: '工作日誌', description: '每個工作日有更新進度，主管口頭交辦事項有寫入工作日誌並主動每日跟進與更新。' },
    { key: 'item2', label: '即時回覆', description: '客戶、廠商、同仁之間Line工作群組有即時回覆與處理。' },
    { key: 'item3', label: '主動性', description: '工作主動性與積極性、正確率。' },
    { key: 'item4', label: '完成度', description: '客戶訂單出貨、物料到場、各職位應交表格有標註於行事曆，並按預定時間完成和出貨。' },
  ];

  const getMonthOptions = () => {
    const months = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    for (let year = 2020; year <= currentYear + 1; year++) {
      const maxMonth = year === currentYear + 1 ? currentMonth : 12;
      const minMonth = year === 2020 ? 1 : 1;
      for (let month = minMonth; month <= maxMonth; month++) {
        const value = `${year}-${String(month).padStart(2, '0')}`;
        const label = `${year}年${month}月`;
        months.push({ value, label });
      }
    }
    return months;
  };

  const loadEvaluation = async (userId: string) => {
    setLoading(true);
    try {
      const docRef = doc(db, 'evaluations', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setEvaluationData(docSnap.data() as EvaluationData);
      } else {
        setEvaluationData({});
      }
    } catch (error) {
      console.error('Error loading evaluation:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!selectedEmployee || !selectedMonth) return;

    const loadStats = async () => {
      const [year, month] = selectedMonth.split('-');
      const startDate = `${year}-${month}-01`;
      const endDate = `${year}-${month}-31`;

      const workLogsSnapshot = await getDocs(
        query(
          collection(db, 'workLogs'),
          where('userId', '==', selectedEmployee.id)
        )
      );

      const workLogsInMonth = workLogsSnapshot.docs.filter(doc => {
        const date = doc.data().date;
        return date >= startDate && date <= endDate;
      });
      setWorkLogCount(workLogsInMonth.length);

      const tasksSnapshot = await getDocs(
        query(
          collection(db, 'tasks'),
          where('assignedTo', 'array-contains', selectedEmployee.id)
        )
      );

      let responseCount = 0;
      tasksSnapshot.docs.forEach(doc => {
        const responses = doc.data().responses || [];
        responses.forEach((r: any) => {
          if (r.byName === selectedEmployee.name && r.createdAt && r.createdAt.startsWith(selectedMonth)) {
            responseCount++;
          }
        });
      });
      setTaskResponseCount(responseCount);

      let workLogReplyCount = 0;
      workLogsSnapshot.docs.forEach(doc => {
        const workItems = doc.data().workItems || [];
        workItems.forEach((item: any) => {
          const replies = item.replies || [];
          replies.forEach((reply: any) => {
            if (reply.byName === selectedEmployee.name && reply.at && reply.at.startsWith(selectedMonth)) {
              workLogReplyCount++;
            }
          });
        });
      });
      setWorkLogReplyCount(workLogReplyCount);

      let completed = 0;
      const completedItems: {type: string, title: string, date: string, completedAt: string}[] = [];
      workLogsSnapshot.docs.forEach(doc => {
        const date = doc.data().date;
        if (date >= startDate && date <= endDate) {
          const workItems = doc.data().workItems || [];
          workItems.forEach((item: any) => {
            if (item.status === 'completed') {
              const completedTime = item.completedAt || item.updatedAt || item.createdAt || date;
              if (completedTime.startsWith(selectedMonth)) {
                completed++;
                completedItems.push({
                  type: '工作日誌',
                  title: item.content,
                  date: date,
                  completedAt: completedTime
                });
              }
            }
          });
        }
      });
      tasksSnapshot.docs.forEach(doc => {
        const taskData = doc.data();
        if (taskData.status === 'completed') {
          const completedTime = taskData.completedAt || taskData.updatedAt || taskData.createdAt;
          if (completedTime.startsWith(selectedMonth)) {
            completed++;
            completedItems.push({
              type: '交辦事項',
              title: taskData.title,
              date: taskData.completionDate || taskData.createdAt,
              completedAt: completedTime
            });
          }
        }
      });
      console.log('Completed check - workLogs:', completed, 'items:', completedItems);
      setCompletedCount(completed);
      setCompletedList(completedItems);
    };

    loadStats();
  }, [selectedEmployee, selectedMonth]);

  const handleSelectEmployee = (employee: User) => {
    setSelectedEmployee(employee);
    loadEvaluation(employee.id);
    setSelectedMonth(currentMonthValue);
    setMountKey(k => k + 1);
  };

  const handleSelectMonth = (month: string) => {
    setSelectedMonth(month);
  };

  const getLocalDateString = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  const handleScoreChange = (itemKey: string, score: number) => {
    if (!selectedMonth) return;
    
    setEvaluationData(prev => {
      const updated = { ...prev };
      if (!updated[selectedMonth]) {
        updated[selectedMonth] = {
          item1: { score: 0, note: '' },
          item2: { score: 0, note: '' },
          item3: { score: 0, note: '' },
          item4: { score: 0, note: '' },
          totalScore: 0,
          createdAt: getLocalDateString(),
          updatedAt: getLocalDateString(),
        };
      }
      
      const itemData = updated[selectedMonth] as any;
      itemData[itemKey] = { ...itemData[itemKey], score };
      
      const items = ['item1', 'item2', 'item3', 'item4'];
      let total = 0;
      for (const key of items) {
        total += (itemData[key]?.score || 0);
      }
      itemData.totalScore = total;
      itemData.updatedAt = getLocalDateString();
      
      return updated;
    });
  };

  const handleNoteChange = (itemKey: string, note: string) => {
    if (!selectedMonth) return;
    
    setEvaluationData(prev => {
      const updated = { ...prev };
      if (!updated[selectedMonth]) {
        updated[selectedMonth] = {
          item1: { score: 0, note: '' },
          item2: { score: 0, note: '' },
          item3: { score: 0, note: '' },
          item4: { score: 0, note: '' },
          totalScore: 0,
          createdAt: getLocalDateString(),
          updatedAt: getLocalDateString(),
        };
      }
      
      const itemData = updated[selectedMonth] as any;
      itemData[itemKey] = { ...itemData[itemKey], note };
      itemData.updatedAt = getLocalDateString();
      
      return updated;
    });
  };

  const handleSave = async () => {
    if (!selectedEmployee || !selectedMonth) return;
    
    setSaving(true);
    try {
      const docRef = doc(db, 'evaluations', selectedEmployee.id);
      await setDoc(docRef, evaluationData, { merge: true });
      alert('儲存成功');
    } catch (error) {
      console.error('Error saving evaluation:', error);
      alert('儲存失敗');
    }
    setSaving(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600';
    if (score >= 3) return 'text-yellow-600';
    if (score >= 1) return 'text-red-600';
    return 'text-gray-400';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 16) return 'bg-green-500';
    if (score >= 12) return 'bg-green-400';
    if (score >= 8) return 'bg-yellow-400';
    if (score >= 4) return 'bg-orange-400';
    return 'bg-red-400';
  };

  if (selectedEmployee) {
    const currentMonthData = evaluationData[selectedMonth];
    const currentTotalScore = currentMonthData?.totalScore || 0;
    
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedEmployee(null)}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-xl font-semibold text-gray-900">{selectedEmployee.name} - 員工評核</h2>
          </div>
          <button
            onClick={handleSave}
            disabled={!selectedMonth || saving}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
          >
            {saving ? '儲存中...' : '儲存'}
          </button>
        </div>

        {(() => {
          const monthsWithScores = Object.keys(evaluationData)
            .filter(month => evaluationData[month]?.totalScore > 0)
            .sort((a, b) => a.localeCompare(b));

          if (monthsWithScores.length === 0) return null;

          return (
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg overflow-x-auto">
              <h4 className="text-sm font-medium text-gray-700 mb-3">每月評核分數</h4>
              <div className="flex items-end gap-3 h-32 min-w-max">
                {monthsWithScores.map(month => {
                  const score = evaluationData[month]?.totalScore || 0;
                  const percentage = (score / 20) * 100;
                  const [year, monthNum] = month.split('-');
                  const monthLabel = `${year}/${monthNum}月`;

                  return (
                    <div key={month} className="w-14 flex flex-col items-center">
                      <div className="relative w-full flex flex-col items-center justify-end h-24">
                        <span className="text-xs font-medium text-gray-700 mb-1">{score}</span>
                        <div
                          className={`w-full rounded-t-md ${getScoreBarColor(score)} transition-all`}
                          style={{ height: `${percentage}%`, minHeight: score > 0 ? '4px' : '0' }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 mt-1">{monthLabel}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">評核月份</label>
          <div className="relative h-36 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="w-full h-10 bg-blue-100 opacity-50 border-y border-blue-200" />
            </div>
            <div 
              ref={wheelRef}
              className="h-full overflow-y-auto scroll-smooth"
              onScroll={(e) => {
                const el = e.target as HTMLElement;
                const items = el.querySelectorAll('.month-item');
                items.forEach((item, index) => {
                  const rect = item.getBoundingClientRect();
                  const elRect = el.getBoundingClientRect();
                  const isCenter = rect.top >= elRect.top + 48 && rect.bottom <= elRect.bottom - 48;
                  (item as HTMLElement).style.opacity = isCenter ? '1' : '0.4';
                  (item as HTMLElement).style.fontWeight = isCenter ? '600' : '400';
                  if (isCenter) {
                    const opt = getMonthOptions()[index];
                    if (opt) handleSelectMonth(opt.value);
                  }
                });
              }}
            >
              <div className="pt-12 pb-12">
                {getMonthOptions().map(opt => (
                  <div
                    key={opt.value}
                    onClick={() => handleSelectMonth(opt.value)}
                    className={`month-item h-10 flex items-center justify-center cursor-pointer transition-all duration-200 ${
                      selectedMonth === opt.value 
                        ? 'text-primary' 
                        : opt.value === currentMonthValue
                          ? 'text-blue-600'
                          : 'text-gray-500'
                    }`}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <style>{`
            #month-wheel::-webkit-scrollbar { width: 0; }
            #month-wheel { scrollbar-width: none; -ms-overflow-style: none; }
          `}</style>
        </div>

        {selectedEmployee && selectedMonth && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{workLogCount}</p>
                <p className="text-sm text-gray-600">員工日誌</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{taskResponseCount}</p>
                <p className="text-sm text-gray-600">回應交辦</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{workLogReplyCount}</p>
                <p className="text-sm text-gray-600">回應日誌</p>
              </div>
              <div
                className="cursor-pointer hover:bg-gray-100 rounded-lg p-2 -m-2 transition-colors"
                onClick={() => completedCount > 0 && setShowCompletedModal(true)}
              >
                <p className="text-2xl font-bold text-primary">{completedCount}</p>
                <p className="text-sm text-gray-600">已完成</p>
              </div>
            </div>
          </div>
        )}

        {showCompletedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowCompletedModal(false)} />
            <div className="relative bg-white rounded-xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
                <h2 className="text-lg font-semibold">已完成項目</h2>
                <button onClick={() => setShowCompletedModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                {completedList.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">無已完成項目</p>
                ) : (
                  <div className="space-y-3">
                    {completedList.map((item, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded ${item.type === '工作日誌' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                            {item.type}
                          </span>
                          <span className="text-xs text-gray-500">
                            完成於 {new Date(item.completedAt).toLocaleString('zh-TW')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800">{item.title}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {selectedMonth && currentMonthData && currentTotalScore > 0 && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-blue-800 font-medium">總分</span>
              <span className={`text-2xl font-bold ${getScoreColor(currentTotalScore)}`}>
                {currentTotalScore} / 20
              </span>
            </div>
          </div>
        )}

        {selectedMonth && (
          <div className="space-y-4">
            {evaluationItems.map(item => {
              const itemData = currentMonthData?.[item.key as keyof MonthEvaluation] as EvaluationItemData | undefined;
              const currentScore = itemData?.score || 0;
              const currentNote = itemData?.note || '';
              
              return (
                <div key={item.key} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <div className="mb-3">
                    <h3 className="font-medium text-gray-900">{item.label}</h3>
                    <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-3">
                    <span className="text-sm text-gray-600">分數：</span>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(score => (
                        <button
                          key={score}
                          onClick={() => handleScoreChange(item.key, score)}
                          className={`w-10 h-10 rounded-full font-medium ${
                            currentScore >= score
                              ? 'bg-primary text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                    <span className={`text-lg font-medium ${getScoreColor(currentScore)}`}>
                      {currentScore}分
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">備註</label>
                    <textarea
                      value={currentNote}
                      onChange={(e) => handleNoteChange(item.key, e.target.value)}
                      placeholder="選填備註..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-sm"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">員工評核</h2>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">
          <p>載入中...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {employees.map(employee => (
            <button
              key={employee.id}
              onClick={() => handleSelectEmployee(employee)}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:border-primary hover:shadow-md transition-all text-left"
            >
              <div className="flex items-center gap-3">
                {employee.avatar ? (
                  <img src={employee.avatar} alt={employee.name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-lg font-medium text-gray-600">
                      {employee.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">{employee.name}</p>
                  <p className="text-sm text-gray-500">{employee.department || '未設定部門'}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}