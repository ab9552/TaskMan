
export type ViewType = 'Dashboard' | 'Infrastructure' | 'Reports';

export interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

export interface HistoryEntry {
  id: string;
  field: 'status' | 'owner' | 'priority' | 'reminder';
  oldValue: string;
  newValue: string;
  timestamp: string;
  author: string;
}

export interface Task {
  id: string;
  title: string;
  category: 'Compute' | 'Storage' | 'Networking' | 'Security' | 'Cleanup';
  status: 'Pending' | 'In Progress' | 'Completed' | 'Blocked';
  priority: 'High' | 'Medium' | 'Low';
  owner: string;
  dueDate: string;
  comments: Comment[];
  dependencies: string[];
  history: HistoryEntry[];
  reminder?: string; // ISO string for the reminder date/time
}

export interface Workspace {
  id: string;
  name: string;
  status: 'Healthy' | 'At Risk' | 'Critical';
  team: string[]; // List of assigned users for this workspace
  tasks: Task[];
  region: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export enum DecommissionStatus {
  PLANNING = 'Planning',
  EXECUTION = 'Execution',
  VERIFICATION = 'Verification',
  COMPLETED = 'Completed'
}
