
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Countdown from './components/Countdown';
import TaskList from './components/TaskList';
import ChatInterface from './components/ChatInterface';
import { INITIAL_TASKS } from './constants';
import { Task, Comment, ViewType, Workspace, HistoryEntry } from './types';

const App: React.FC = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([
    {
      id: 'ws-1',
      name: 'Legacy Production (AWS 1.0)',
      status: 'Healthy',
      team: ['DevOps Team', 'Data Team', 'Network Eng', 'Audit Team'],
      tasks: INITIAL_TASKS as Task[],
      region: 'us-east-1'
    }
  ]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('ws-1');
  const [activeView, setActiveView] = useState<ViewType>('Dashboard');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('Just now');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');

  // Derive current workspace and its tasks
  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0];
  const tasks = activeWorkspace.tasks;

  // Reminder check interval
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      tasks.forEach(task => {
        if (task.reminder) {
          const reminderDate = new Date(task.reminder);
          // If reminder is within the last minute and task is not completed
          if (reminderDate <= now && task.status !== 'Completed') {
            const timeDiff = now.getTime() - reminderDate.getTime();
            if (timeDiff < 60000) { // Only alert if triggered in the last 60 seconds
              alert(`REMINDER: Task "${task.title}" requires immediate attention!`);
            }
          }
        }
      });
    };
    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [tasks]);

  // Real-time Update Mechanism (Simulated)
  useEffect(() => {
    const simulateLiveUpdate = () => {
      setIsSyncing(true);
      setTimeout(() => {
        setWorkspaces((prevWorkspaces: Workspace[]) => prevWorkspaces.map((ws: Workspace): Workspace => {
          if (ws.id !== activeWorkspaceId) return ws;
          
          const pendingTasks = ws.tasks.filter(t => t.status !== 'Completed');
          if (pendingTasks.length === 0) return ws;
          
          const targetTask = pendingTasks[Math.floor(Math.random() * pendingTasks.length)];
          const newTasks: Task[] = ws.tasks.map((task: Task): Task => {
            if (task.id === targetTask.id) {
              const action = Math.random() > 0.5 ? 'status' : 'comment';
              if (action === 'status' && task.status === 'Pending') {
                return { ...task, status: 'In Progress' };
              } else {
                return { ...task, comments: [...task.comments, { 
                  id: `auto-${Date.now()}`, 
                  author: 'Decommission Bot', 
                  text: "Routine background check performed.", 
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                }] };
              }
            }
            return task;
          });
          return { ...ws, tasks: newTasks };
        }));
        setIsSyncing(false);
        setLastUpdate(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }, 1200);
    };
    const interval = setInterval(simulateLiveUpdate, 45000);
    return () => clearInterval(interval);
  }, [activeWorkspaceId]);

  const createHistoryEntry = (field: HistoryEntry['field'], oldValue: string, newValue: string): HistoryEntry => ({
    id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    field,
    oldValue,
    newValue,
    timestamp: new Date().toLocaleString(),
    author: 'Current User'
  });

  const updateActiveWorkspace = (updater: (ws: Workspace) => Workspace) => {
    setWorkspaces(prev => prev.map(ws => 
      ws.id === activeWorkspaceId ? updater(ws) : ws
    ));
  };

  const handleToggleTask = (id: string) => {
    updateActiveWorkspace(ws => ({
      ...ws,
      tasks: ws.tasks.map(t => {
        if (t.id === id) {
          const newStatus = t.status === 'Completed' ? 'Pending' : 'Completed';
          return { 
            ...t, 
            status: newStatus,
            history: [...(t.history || []), createHistoryEntry('status', t.status, newStatus)]
          };
        }
        return t;
      })
    }));
  };

  const handleUploadTasks = (newTasks: Task[]) => {
    updateActiveWorkspace(ws => ({ ...ws, tasks: [...ws.tasks, ...newTasks] }));
  };

  const handleAddComment = (taskId: string, text: string) => {
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      author: 'Current User',
      text,
      timestamp: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
    };
    updateActiveWorkspace(ws => ({
      ...ws,
      tasks: ws.tasks.map(t => t.id === taskId ? { ...t, comments: [...t.comments, newComment] } : t)
    }));
  };

  const handleReorderTasks = (newTasks: Task[]) => {
    updateActiveWorkspace(ws => ({ ...ws, tasks: newTasks }));
  };

  const handleUpdateDependencies = (taskId: string, dependencies: string[]) => {
    updateActiveWorkspace(ws => ({
      ...ws,
      tasks: ws.tasks.map(t => t.id === taskId ? { ...t, dependencies } : t)
    }));
  };

  const handleUpdateTaskOwner = (taskId: string, owner: string) => {
    updateActiveWorkspace(ws => ({
      ...ws,
      tasks: ws.tasks.map(t => {
        if (t.id === taskId) {
          return { 
            ...t, 
            owner,
            history: [...(t.history || []), createHistoryEntry('owner', t.owner, owner)]
          };
        }
        return t;
      })
    }));
  };

  const handleUpdateTaskPriority = (taskId: string, priority: Task['priority']) => {
    updateActiveWorkspace(ws => ({
      ...ws,
      tasks: ws.tasks.map(t => {
        if (t.id === taskId) {
          return { 
            ...t, 
            priority,
            history: [...(t.history || []), createHistoryEntry('priority', t.priority, priority)]
          };
        }
        return t;
      })
    }));
  };

  const handleSetReminder = (taskId: string, reminder: string) => {
    updateActiveWorkspace(ws => ({
      ...ws,
      tasks: ws.tasks.map(t => {
        if (t.id === taskId) {
          return { 
            ...t, 
            reminder,
            history: [...(t.history || []), createHistoryEntry('reminder', t.reminder || 'None', reminder)]
          };
        }
        return t;
      })
    }));
  };

  const handleUpdateWorkspaceStatus = (status: Workspace['status']) => {
    updateActiveWorkspace(ws => ({ ...ws, status }));
  };

  const handleAddTeamMember = () => {
    if (!newMemberName.trim()) return;
    updateActiveWorkspace(ws => ({
      ...ws,
      team: [...ws.team, newMemberName.trim()]
    }));
    setNewMemberName('');
  };

  const handleRemoveTeamMember = (member: string) => {
    updateActiveWorkspace(ws => ({
      ...ws,
      team: ws.team.filter(m => m !== member)
    }));
  };

  const createNewWorkspace = (name: string, region: string, status: Workspace['status']) => {
    const newWs: Workspace = {
      id: `ws-${Date.now()}`,
      name,
      region,
      status,
      team: ['System Admin'],
      tasks: [],
    };
    setWorkspaces(prev => [...prev, newWs]);
    setActiveWorkspaceId(newWs.id);
    setShowCreateModal(false);
  };

  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const totalTasks = tasks.length || 1;
  const progressPercent = Math.round((completedTasks / totalTasks) * 100);

  const renderDashboard = () => (
    <>
      <div className="lg:col-span-8 space-y-8">
        <div className="flex justify-between items-center mb-[-24px]">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`}></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {isSyncing ? 'Synchronizing...' : `Live Sync Active • ${lastUpdate}`}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <select 
                value={activeWorkspace.status}
                onChange={(e) => handleUpdateWorkspaceStatus(e.target.value as any)}
                className={`appearance-none cursor-pointer px-3 py-1 rounded text-[10px] font-bold border transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 ${
                  activeWorkspace.status === 'Healthy' ? 'bg-green-100 text-green-700 border-green-200' :
                  activeWorkspace.status === 'At Risk' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                  'bg-red-100 text-red-700 border-red-200'
                }`}
              >
                <option value="Healthy">HEALTHY</option>
                <option value="At Risk">AT RISK</option>
                <option value="Critical">CRITICAL</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current opacity-50">
                <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Region: {activeWorkspace.region}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Overall Progress</p>
            <div className="flex items-end gap-2"><span className="text-3xl font-black text-slate-900">{progressPercent}%</span></div>
            <div className="absolute bottom-0 left-0 h-1 bg-orange-500" style={{ width: `${progressPercent}%` }}></div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Tasks Completed</p>
            <div className="flex items-end gap-2"><span className="text-3xl font-black text-slate-900">{completedTasks}</span><span className="text-slate-400 text-sm font-medium mb-1.5">/ {tasks.length}</span></div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-red-500">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Blockers</p>
            <div className="flex items-end gap-2"><span className="text-3xl font-black text-red-600">{tasks.filter(t => t.status === 'Blocked').length}</span></div>
          </div>
        </div>
        <TaskList 
          tasks={tasks} 
          team={activeWorkspace.team}
          onToggleTask={handleToggleTask} 
          onUploadTasks={handleUploadTasks} 
          onAddComment={handleAddComment}
          onReorderTasks={handleReorderTasks}
          onUpdateDependencies={handleUpdateDependencies}
          onUpdateOwner={handleUpdateTaskOwner}
          onUpdatePriority={handleUpdateTaskPriority}
          onSetReminder={handleSetReminder}
        />
      </div>
      <div className="lg:col-span-4 space-y-8">
        <Countdown />
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Team Assignment</h4>
            <span className="text-[10px] text-slate-400 font-medium">Workspace Active Users</span>
          </div>
          <div className="space-y-3 mb-6">
            <div className="flex flex-wrap gap-2">
              {activeWorkspace.team.map(member => (
                <div key={member} className="group relative">
                  <span className="bg-slate-100 text-slate-600 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border border-slate-200 uppercase flex items-center gap-2">
                    {member}
                    <button 
                      onClick={() => handleRemoveTeamMember(member)}
                      className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTeamMember()}
              placeholder="New member name..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button 
              onClick={handleAddTeamMember}
              className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        <ChatInterface />
      </div>
    </>
  );

  const renderInfrastructure = () => {
    const categories: ('Compute' | 'Storage' | 'Networking' | 'Security' | 'Cleanup')[] = ['Compute', 'Storage', 'Networking', 'Security', 'Cleanup'];
    return (
      <div className="lg:col-span-12 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black text-slate-900">Infrastructure Inventory: {activeWorkspace.name}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map(cat => {
            const catTasks = tasks.filter(t => t.category === cat);
            const catCompleted = catTasks.filter(t => t.status === 'Completed').length;
            const catProgress = catTasks.length ? Math.round((catCompleted / catTasks.length) * 100) : 0;
            return (
              <div key={cat} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-orange-200 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-slate-800">{cat} Cluster</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${catProgress > 80 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {catProgress === 100 ? 'Healthy' : 'Migrating'}
                  </span>
                </div>
                <div className="space-y-4">
                   <div className="flex justify-between text-xs font-bold">
                     <span className="text-slate-400 uppercase">Resources Flagged</span>
                     <span className="text-slate-900">{catTasks.length}</span>
                   </div>
                   <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                     <div className="bg-orange-500 h-full transition-all duration-500" style={{ width: `${catProgress}%` }}></div>
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderReports = () => {
    const blockers = tasks.filter(t => t.status === 'Blocked');
    return (
      <div className="lg:col-span-12 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-black text-slate-900">Workspace Execution Report</h2>
            <p className="text-slate-500 font-medium">Project: {activeWorkspace.name}</p>
          </div>
          <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg hover:bg-slate-800 transition-colors">
            Export PDF Audit
          </button>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Burndown Rate</span>
              <div className="text-3xl font-black text-slate-900">4.2 <span className="text-sm text-green-500 font-bold">tasks/day</span></div>
           </div>
           <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Compliance Status</span>
              <div className="text-3xl font-black text-green-600">PASSED</div>
           </div>
           <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Blockers</span>
              <div className="text-3xl font-black text-red-600">{blockers.length}</div>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header 
        activeView={activeView} 
        onViewChange={setActiveView} 
        activeWorkspaceId={activeWorkspaceId}
        workspaces={workspaces}
        onWorkspaceChange={setActiveWorkspaceId}
        onCreateWorkspace={() => setShowCreateModal(true)}
      />
      
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {activeView === 'Dashboard' && renderDashboard()}
        {activeView === 'Infrastructure' && renderInfrastructure()}
        {activeView === 'Reports' && renderReports()}
      </main>

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in duration-200">
            <h3 className="text-xl font-black text-slate-900 mb-6">Create New Dashboard</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              createNewWorkspace(
                formData.get('ws-name') as string, 
                formData.get('ws-region') as string,
                formData.get('ws-status') as any
              );
            }}>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Workspace Name</label>
                  <input name="ws-name" required placeholder="e.g. Mobile Backend Migration" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">AWS Region</label>
                  <select name="ws-region" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm">
                    <option value="us-east-1">us-east-1 (N. Virginia)</option>
                    <option value="us-west-2">us-west-2 (Oregon)</option>
                    <option value="eu-central-1">eu-central-1 (Frankfurt)</option>
                    <option value="ap-southeast-1">ap-southeast-1 (Singapore)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Initial Status</label>
                  <div className="flex gap-2">
                    <label className="flex-1 cursor-pointer">
                      <input type="radio" name="ws-status" value="Healthy" defaultChecked className="hidden peer" />
                      <div className="text-center p-2 rounded-lg border border-slate-200 text-[10px] font-bold peer-checked:bg-green-50 peer-checked:border-green-500 peer-checked:text-green-700 transition-all uppercase">Healthy</div>
                    </label>
                    <label className="flex-1 cursor-pointer">
                      <input type="radio" name="ws-status" value="At Risk" className="hidden peer" />
                      <div className="text-center p-2 rounded-lg border border-slate-200 text-[10px] font-bold peer-checked:bg-orange-50 peer-checked:border-orange-500 peer-checked:text-orange-700 transition-all uppercase">At Risk</div>
                    </label>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex gap-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold text-slate-400 hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 bg-orange-500 text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20">Initialize</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-[1600px] mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-slate-400 text-xs font-medium">
          <p>© 2025 Cloud Operations Command.</p>
          <div className="flex gap-4">
            <span className="text-green-500 font-bold">SYSTEM STABLE</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 tracking-widest uppercase">Encryption Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
