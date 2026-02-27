
import React, { useState, useRef } from 'react';
import { Task, Comment, HistoryEntry } from '../types';

interface TaskListProps {
  tasks: Task[];
  team: string[];
  onToggleTask: (id: string) => void;
  onUploadTasks: (newTasks: Task[]) => void;
  onAddComment: (taskId: string, commentText: string) => void;
  onReorderTasks: (newTasks: Task[]) => void;
  onUpdateDependencies: (taskId: string, dependencies: string[]) => void;
  onUpdateOwner: (taskId: string, owner: string) => void;
  onUpdatePriority: (taskId: string, priority: Task['priority']) => void;
  onSetReminder: (taskId: string, reminder: string) => void;
}

const TaskList: React.FC<TaskListProps> = ({ 
  tasks, 
  team,
  onToggleTask, 
  onUploadTasks, 
  onAddComment, 
  onReorderTasks,
  onUpdateDependencies,
  onUpdateOwner,
  onUpdatePriority,
  onSetReminder
}) => {
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [expandedTab, setExpandedTab] = useState<'comments' | 'history' | 'deps'>('comments');
  const [commentInput, setCommentInput] = useState<string>('');
  const [showFormatGuide, setShowFormatGuide] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getStatusDisplay = (status: Task['status']) => {
    switch (status) {
      case 'Completed': return {
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.1)]',
        icon: (
          <div className="bg-emerald-500 rounded-full p-0.5">
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )
      };
      case 'In Progress': return {
        color: 'bg-sky-50 text-sky-700 border-sky-200 shadow-[0_0_10px_rgba(14,165,233,0.1)]',
        icon: (
          <div className="flex gap-0.5 items-center">
            <div className="w-1 h-3 bg-sky-500 animate-[bounce_1s_infinite]"></div>
            <div className="w-1 h-3 bg-sky-500 animate-[bounce_1s_infinite_.2s]"></div>
            <div className="w-1 h-3 bg-sky-500 animate-[bounce_1s_infinite_.4s]"></div>
          </div>
        )
      };
      case 'Blocked': return {
        color: 'bg-rose-50 text-rose-700 border-rose-200 shadow-[0_0_10px_rgba(244,63,94,0.1)] animate-pulse',
        icon: (
          <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )
      };
      default: return {
        color: 'bg-slate-50 text-slate-500 border-slate-200',
        icon: (
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      };
    }
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'Medium': return 'text-amber-600 bg-amber-50 border-amber-100';
      default: return 'text-slate-500 bg-slate-50 border-slate-100';
    }
  };

  const isTaskBlocked = (task: Task) => {
    return task.dependencies.some(depId => {
      const depTask = tasks.find(t => t.id === depId);
      return depTask && depTask.status !== 'Completed';
    });
  };

  const filteredTasks = priorityFilter === 'All' 
    ? tasks 
    : tasks.filter(task => task.priority === priorityFilter);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      if (lines.length < 2) return;

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const newTasks: Task[] = lines.slice(1).filter(line => line.trim() !== '').map((line, index) => {
        const values = line.split(',').map(v => v.trim());
        const taskObj: any = {
          id: `uploaded-${Date.now()}-${index}`,
          status: 'Pending',
          comments: [],
          dependencies: [],
          history: []
        };
        
        headers.forEach((header, i) => {
          if (['title', 'category', 'priority', 'owner', 'duedate'].includes(header)) {
            const key = header === 'duedate' ? 'dueDate' : header;
            taskObj[key] = values[i] || (team[0] || 'Unknown');
          }
        });

        return taskObj as Task;
      });

      onUploadTasks(newTasks);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const toggleDependency = (taskId: string, depId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const newDeps = task.dependencies.includes(depId)
      ? task.dependencies.filter(id => id !== depId)
      : [...task.dependencies, depId];
    onUpdateDependencies(taskId, newDeps);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === index) return;
    const newTasks = [...tasks];
    const draggedItem = newTasks[draggedItemIndex];
    newTasks.splice(draggedItemIndex, 1);
    newTasks.splice(index, 0, draggedItem);
    setDraggedItemIndex(index);
    onReorderTasks(newTasks);
  };

  const handleDragEnd = () => setDraggedItemIndex(null);

  const toggleExpand = (taskId: string) => {
    if (expandedTaskId === taskId) {
      setExpandedTaskId(null);
    } else {
      setExpandedTaskId(taskId);
      setExpandedTab('comments');
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl shadow-slate-200/50">
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-slate-800 tracking-tight">Operation Burndown</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Task Execution</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select 
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-600 shadow-sm transition-all"
          >
            <option value="All">All Priorities</option>
            <option value="High">🔴 High Priority</option>
            <option value="Medium">🟠 Medium Priority</option>
            <option value="Low">⚪ Low Priority</option>
          </select>
          
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".csv" />
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="text-xs bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-all font-bold flex items-center gap-2 shadow-lg shadow-slate-900/10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Import Operations
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] border-b border-slate-100">
              <th className="px-2 w-8"></th>
              <th className="px-5 py-4">Operational Task</th>
              <th className="px-5 py-4">Category</th>
              <th className="px-5 py-4">Health Status</th>
              <th className="px-5 py-4">Owner</th>
              <th className="px-5 py-4 text-center">Log</th>
              <th className="px-5 py-4">Deadline</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTasks.map((task, index) => {
              const blocked = isTaskBlocked(task);
              const statusInfo = getStatusDisplay(task.status);
              return (
                <React.Fragment key={task.id}>
                  <tr 
                    draggable={priorityFilter === 'All'}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`
                      group transition-all duration-300
                      ${draggedItemIndex === index ? 'opacity-40 bg-orange-50' : 'hover:bg-slate-50/80'}
                      ${expandedTaskId === task.id ? 'bg-orange-50/30' : ''}
                      ${blocked ? 'bg-rose-50/10' : ''}
                    `}
                  >
                    <td className="px-2 text-slate-300">
                      <div className="cursor-grab active:cursor-grabbing p-1 opacity-0 group-hover:opacity-100 transition-all">
                        <svg width="12" height="20" viewBox="0 0 12 20" fill="currentColor">
                          <circle cx="3" cy="3" r="1.5" /><circle cx="3" cy="10" r="1.5" /><circle cx="3" cy="17" r="1.5" />
                          <circle cx="9" cy="3" r="1.5" /><circle cx="9" cy="10" r="1.5" /><circle cx="9" cy="17" r="1.5" />
                        </svg>
                      </div>
                    </td>
                    <td className="px-5 py-5">
                      <div className="flex items-center gap-4">
                        <div className="relative flex items-center shrink-0">
                          <input 
                            type="checkbox" 
                            checked={task.status === 'Completed'} 
                            disabled={blocked}
                            onChange={() => !blocked && onToggleTask(task.id)}
                            className={`w-5 h-5 rounded-lg border-2 border-slate-200 text-orange-500 focus:ring-orange-500 cursor-pointer transition-all ${blocked ? 'opacity-30 cursor-not-allowed bg-slate-100' : 'hover:border-orange-300'}`}
                          />
                          {blocked && (
                            <div className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full shadow-lg border-2 border-white p-0.5">
                              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M12 9v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold text-slate-700 tracking-tight transition-all ${task.status === 'Completed' ? 'line-through text-slate-400 opacity-60' : ''} ${blocked ? 'text-slate-400' : ''}`}>
                              {task.title}
                            </span>
                            {task.reminder && (
                              <div className="relative flex items-center" title={`Reminder set for ${new Date(task.reminder).toLocaleString()}`}>
                                <svg className="w-3.5 h-3.5 text-orange-500 animate-[swing_2s_ease-in-out_infinite]" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 8.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                                </svg>
                                <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-rose-500 rounded-full border border-white"></span>
                              </div>
                            )}
                          </div>
                          {task.dependencies.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                              </svg>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Dependent on {task.dependencies.length} node{task.dependencies.length > 1 ? 's' : ''}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-5 whitespace-nowrap">
                      <span className="text-[11px] font-black text-slate-500 uppercase bg-slate-100 px-2 py-1 rounded-md">
                        {task.category}
                      </span>
                    </td>
                    <td className="px-5 py-5">
                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-wider transition-all duration-300 ${statusInfo.color}`}>
                        {statusInfo.icon}
                        {task.status}
                      </span>
                    </td>
                    <td className="px-5 py-5">
                      <select 
                        value={task.owner}
                        onChange={(e) => onUpdateOwner(task.id, e.target.value)}
                        className="bg-slate-50 border border-slate-100 rounded-lg px-2 py-1.5 text-[11px] font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-100 transition-all cursor-pointer hover:bg-white hover:border-slate-200"
                      >
                        {team.map(member => (
                          <option key={member} value={member}>{member}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-5 text-center">
                      <button 
                        onClick={() => toggleExpand(task.id)}
                        className={`p-2 rounded-xl transition-all relative ${expandedTaskId === task.id ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        {(task.comments.length > 0 || task.history.length > 0) && (
                          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-white">
                            {task.comments.length + task.history.length}
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-5 whitespace-nowrap">
                       <div className="flex flex-col">
                          <span className="text-[11px] font-black text-slate-800 tracking-tight">{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                          <select 
                             value={task.priority}
                             onChange={(e) => onUpdatePriority(task.id, e.target.value as any)}
                             className={`appearance-none bg-transparent text-[9px] font-black uppercase cursor-pointer focus:outline-none border-b border-transparent hover:border-current transition-all ${getPriorityStyles(task.priority).split(' ')[0]}`}
                          >
                             <option value="High">High Priority</option>
                             <option value="Medium">Medium</option>
                             <option value="Low">Low Priority</option>
                          </select>
                       </div>
                    </td>
                  </tr>
                  
                  {expandedTaskId === task.id && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={7} className="px-8 py-8 border-l-4 border-orange-500">
                        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                            <div className="flex gap-6">
                               {[
                                 { id: 'comments', label: 'Updates', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
                                 { id: 'history', label: 'Audit Trail', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
                                 { id: 'deps', label: 'Dependency Graph', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101' }
                               ].map(tab => (
                                 <button
                                   key={tab.id}
                                   onClick={() => setExpandedTab(tab.id as any)}
                                   className={`flex items-center gap-2 pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${expandedTab === tab.id ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}
                                 >
                                   <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={tab.icon} /></svg>
                                   {tab.label}
                                   {expandedTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-1 bg-orange-500 rounded-t-full"></div>}
                                 </button>
                               ))}
                            </div>
                            <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                               <div className="flex items-center gap-2 px-2 border-r border-slate-100">
                                  <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Set Alert</span>
                               </div>
                               <input 
                                  type="datetime-local" 
                                  value={task.reminder || ''} 
                                  onChange={(e) => onSetReminder(task.id, e.target.value)}
                                  className="text-[10px] font-bold text-slate-700 bg-transparent focus:outline-none"
                               />
                            </div>
                          </div>

                          <div className="min-h-[200px]">
                             {expandedTab === 'comments' && (
                               <div className="space-y-6">
                                  <div className="space-y-4 max-h-64 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                                     {task.comments.length > 0 ? (
                                        task.comments.map(c => (
                                          <div key={c.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                                             <div className="absolute top-0 left-0 w-1 h-full bg-orange-200"></div>
                                             <div className="flex justify-between items-center mb-2">
                                                <span className="text-[11px] font-black text-slate-900 uppercase tracking-wider">{c.author}</span>
                                                <span className="text-[10px] text-slate-400 font-bold">{c.timestamp}</span>
                                             </div>
                                             <p className="text-sm text-slate-600 leading-relaxed font-medium">{c.text}</p>
                                          </div>
                                        ))
                                     ) : (
                                        <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl opacity-60">
                                           <svg className="w-8 h-8 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No updates posted yet</p>
                                        </div>
                                     )}
                                  </div>
                                  <div className="flex gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-lg focus-within:ring-2 focus-within:ring-orange-200 transition-all">
                                     <input 
                                        type="text" 
                                        value={commentInput}
                                        onChange={(e) => setCommentInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (onAddComment(task.id, commentInput), setCommentInput(''))}
                                        placeholder="Add an operational update..."
                                        className="flex-1 bg-transparent px-4 py-2 text-sm font-medium text-slate-700 focus:outline-none"
                                     />
                                     <button 
                                        onClick={() => (onAddComment(task.id, commentInput), setCommentInput(''))}
                                        className="bg-slate-900 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg shadow-slate-900/10 active:scale-95"
                                     >
                                        Post Update
                                     </button>
                                  </div>
                               </div>
                             )}

                             {expandedTab === 'history' && (
                               <div className="space-y-3 max-h-80 overflow-y-auto pr-4">
                                  {task.history.length > 0 ? (
                                     task.history.slice().reverse().map(entry => (
                                        <div key={entry.id} className="group flex gap-4 text-xs p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-orange-200 transition-all items-start">
                                           <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                              entry.field === 'status' ? 'bg-emerald-100 text-emerald-600' :
                                              entry.field === 'owner' ? 'bg-sky-100 text-sky-600' :
                                              entry.field === 'priority' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
                                           }`}>
                                              {entry.field === 'status' ? '✓' : entry.field === 'owner' ? '👤' : entry.field === 'priority' ? '!' : '⏰'}
                                           </div>
                                           <div className="flex-1">
                                              <div className="flex justify-between items-start mb-1">
                                                <p className="text-slate-800 font-bold tracking-tight">
                                                   <span className="font-black uppercase text-[10px] text-orange-500 mr-2">{entry.field} update</span>
                                                   <span className="text-slate-400 font-medium">Changed from </span>
                                                   <span className="line-through opacity-50">{entry.oldValue || 'None'}</span>
                                                   <span className="mx-2 text-slate-400">→</span>
                                                   <span className="font-black text-slate-900">{entry.newValue}</span>
                                                </p>
                                                <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">{entry.timestamp}</span>
                                              </div>
                                              <div className="flex items-center gap-2 mt-1">
                                                 <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-black text-slate-500">U</div>
                                                 <span className="text-[10px] font-bold text-slate-500 uppercase">Modified by {entry.author}</span>
                                              </div>
                                           </div>
                                        </div>
                                     ))
                                  ) : (
                                     <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl opacity-60">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No historical data recorded</p>
                                     </div>
                                  )}
                               </div>
                             )}

                             {expandedTab === 'deps' && (
                               <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-inner">
                                  <div className="flex items-center gap-3 mb-6">
                                     <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>
                                     </div>
                                     <div>
                                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Prerequisite Graph</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select tasks that must conclude first</p>
                                     </div>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2 scrollbar-thin">
                                     {tasks.filter(t => t.id !== task.id).map(t => (
                                        <label key={t.id} className={`flex items-center gap-4 group p-3 rounded-2xl border-2 transition-all cursor-pointer ${task.dependencies.includes(t.id) ? 'bg-orange-50 border-orange-200 shadow-sm' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                                           <div className="relative">
                                              <input 
                                                type="checkbox" 
                                                checked={task.dependencies.includes(t.id)}
                                                onChange={() => toggleDependency(task.id, t.id)}
                                                className="w-5 h-5 rounded-lg text-orange-500 border-slate-200 focus:ring-orange-500 cursor-pointer transition-all"
                                              />
                                              {task.dependencies.includes(t.id) && <div className="absolute inset-0 bg-orange-500 rounded-lg pointer-events-none flex items-center justify-center"><svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg></div>}
                                           </div>
                                           <div className="flex flex-col flex-1 min-w-0">
                                              <span className={`text-xs truncate transition-all ${task.dependencies.includes(t.id) ? 'font-black text-slate-900' : 'font-bold text-slate-500'}`}>
                                                {t.title}
                                              </span>
                                              <div className="flex items-center gap-2 mt-1">
                                                 <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${t.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                                                   {t.status}
                                                 </span>
                                                 <span className="text-[8px] font-bold text-slate-300 uppercase truncate">ID: {t.id}</span>
                                              </div>
                                           </div>
                                        </label>
                                     ))}
                                  </div>
                               </div>
                             )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TaskList;
