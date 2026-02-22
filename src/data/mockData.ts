import type { User, WorkLog, Contract, Task } from '../types';

export const defaultUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    name: 'System Admin',
    role: 'admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    department: 'Management',
  },
  {
    id: '2',
    username: 'wang',
    password: '123456',
    name: 'Wang Xiaoming',
    role: 'employee',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang',
    department: 'Technical',
  },
  {
    id: '3',
    username: 'li',
    password: '123456',
    name: 'Li Xiaohong',
    role: 'employee',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=li',
    department: 'Design',
  },
  {
    id: '4',
    username: 'zhang',
    password: '123456',
    name: 'Zhang San',
    role: 'employee',
    avatar: 'https://api.dicebear.com/7.x//svg?seed=zavataaarshang',
    department: 'Product',
  },
];

export const defaultContract: Contract = {
  id: '1',
  title: 'Employee Contract',
  version: 1,
  content: `<h2>员工劳动合同书</h2>
<p><strong>版本: 1.0 | 更新日期: 2026-01-01</strong></p>

<h3>第一章 总则</h3>
<p>第一条 根据《中华人民共和国劳动法》及有关规定，甲乙双方经平等协商一致，自愿签订本劳动合同。</p>

<h3>第二章 劳动期限</h3>
<p>第二条 本合同期限类型为固定期限合同，合同期限为一年。</p>

<h3>第三章 工作内容</h3>
<p>第三条 乙方同意根据甲方工作需要，担任相应岗位工作。</p>
<p>第四条 甲方因生产经营需要，可调整乙方的工作岗位。</p>

<h3>第四章 劳动报酬</h3>
<p>第五条 甲方按月支付乙方工资，具体金额根据岗位确定。</p>
<p>第六条 甲方于每月15日前支付乙方上月薪资。</p>

<h3>第五章 社会保险</h3>
<p>第七条 甲方依法为乙方缴纳社会保险费。</p>
<p>第八条 乙方患病或因工负伤的，按国家规定享受相应待遇。</p>

<h3>第六章 劳动纪律</h3>
<p>第九条 乙方应遵守甲方依法制定的各项规章制度。</p>
<p>第十条 乙方应保守甲方的商业秘密。</p>

<h3>第七章 保险局新規定遵守条款</h3>
<p>第十一条 乙方应遵守保险局发布之最新规定，包括但不限于：</p>
<ul>
<li>如实申报个人资料</li>
<li>及时更新联系方式</li>
<li>遵守业务操作规范</li>
<li>定期参加培训</li>
</ul>

<h3>第八章 合同变更</h3>
<p>第十二条 订立本合同所依据的客观情况发生重大变化，可变更本合同相关内容。</p>

<h3>第九章 违约责任</h3>
<p>第十三条 任何一方违反本合同约定，应承担相应法律责任。</p>

<h3>附则</h3>
<p>本合同一式两份，甲乙双方各执一份。本合同自双方签字盖章之日起生效。</p>`,
  updatedAt: '2026-01-01T00:00:00Z',
};

export const defaultWorkLogs: WorkLog[] = [
  {
    id: '1',
    userId: '2',
    date: '2026-02-22',
    task: '完成用户登录模块开发，包括用户名密码登录和验证码登录',
    response: '已按需求完成开发，代码已提交审查',
    completionDate: '2026-02-22',
    timeSpent: '6小时',
    problems: '验证码发送接口有超时问题，需要优化',
    status: 'completed',
    createdAt: '2026-02-22T09:00:00Z',
    updatedAt: '2026-02-22T17:00:00Z',
  },
  {
    id: '2',
    userId: '2',
    date: '2026-02-21',
    task: '参加产品需求评审会议',
    response: '确认了第二季度的需求优先级',
    completionDate: '2026-02-21',
    timeSpent: '2小时',
    problems: '部分需求细节需要进一步确认',
    status: 'completed',
    createdAt: '2026-02-21T09:00:00Z',
    updatedAt: '2026-02-21T11:00:00Z',
  },
  {
    id: '3',
    userId: '3',
    date: '2026-02-22',
    task: '设计新版首页 UI',
    response: '已完成高保真设计稿',
    completionDate: '2026-02-25',
    timeSpent: '5小时',
    problems: '移动端适配需要更多时间',
    status: 'processing',
    createdAt: '2026-02-22T10:00:00Z',
    updatedAt: '2026-02-22T15:00:00Z',
  },
];

export const defaultTasks: Task[] = [
  {
    id: '1',
    title: '客户投诉：订单无法提交',
    description: '客户反映在提交订单时出现系统错误，无法完成购买。客户非常着急，希望尽快处理。',
    source: 'client',
    attachment: 'Email: customer@company.com',
    assignedTo: '2',
    response: '',
    completionDate: '',
    status: 'pending',
    createdAt: '2026-02-22T10:00:00Z',
    updatedAt: '2026-02-22T10:00:00Z',
  },
  {
    id: '2',
    title: '厂商供货延迟通知',
    description: '原材料供应商通知由于物流问题，供货将延迟一周。需要调整生产计划。',
    source: 'vendor',
    attachment: '文件：supply_delaynotice.pdf',
    assignedTo: '3',
    response: '',
    completionDate: '',
    status: 'pending',
    createdAt: '2026-02-21T14:00:00Z',
    updatedAt: '2026-02-21T14:00:00Z',
  },
  {
    id: '3',
    title: '客户数据迁移需求',
    description: '企业客户要求将历史数据迁移到新系统，需要技术团队支持。',
    source: 'client',
    attachment: 'Email: enterprise@bigcorp.com',
    assignedTo: '2',
    response: '已完成数据备份，正在编写迁移脚本',
    completionDate: '2026-02-28',
    status: 'processing',
    createdAt: '2026-02-20T09:00:00Z',
    updatedAt: '2026-02-22T11:00:00Z',
  },
];

export const availableStatuses = ['pending', 'processing', 'completed'];
