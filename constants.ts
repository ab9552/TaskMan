
import { Task } from './types';

export const TARGET_DATE = new Date('2025-02-26T23:59:59');

export const INITIAL_TASKS: Partial<Task>[] = [
  { id: '1', title: 'Identify all EC2 Classic instances', category: 'Compute', status: 'Completed', priority: 'High', owner: 'DevOps Team', dueDate: '2025-02-10', comments: [], dependencies: [], history: [] },
  { id: '2', title: 'Snapshot and migrate S3 buckets to new org', category: 'Storage', status: 'In Progress', priority: 'High', owner: 'Data Team', dueDate: '2025-02-15', comments: [{ id: 'c1', author: 'System', text: 'Migration started. Estimated time: 4 hours.', timestamp: '2025-02-10 10:00 AM' }], dependencies: ['1'], history: [] },
  { id: '3', title: 'Update DNS records for VPC Endpoints', category: 'Networking', status: 'Pending', priority: 'Medium', owner: 'Network Eng', dueDate: '2025-02-18', comments: [], dependencies: ['2'], history: [] },
  { id: '4', title: 'Revoke legacy IAM roles and policies', category: 'Security', status: 'Pending', priority: 'High', owner: 'Security Team', dueDate: '2025-02-20', comments: [], dependencies: ['2', '3'], history: [] },
  { id: '5', title: 'Final decommission of legacy Direct Connect', category: 'Networking', status: 'Blocked', priority: 'High', owner: 'Network Eng', dueDate: '2025-02-22', comments: [{ id: 'c2', author: 'NetAdmin', text: 'Blocked by dependency on legacy partner connection.', timestamp: '2025-02-12 02:30 PM' }], dependencies: ['3'], history: [] },
  { id: '6', title: 'Final sanity check on all resource deletion', category: 'Cleanup', status: 'Pending', priority: 'Medium', owner: 'Audit Team', dueDate: '2025-02-25', comments: [], dependencies: ['4', '5'], history: [] },
];
