import React, { useState, useRef, useEffect } from 'react';
import BottomNav from './components/BottomNav';
import DeviceList from './components/DeviceList';
import ChatBubble from './components/ChatBubble';
import { MOCK_DEVICES, INITIAL_CHAT_MESSAGES, MOCK_HISTORY } from './constants';
import { sendMessageToGemini } from './services/geminiService';
import { ChatMessage, DeviceStatus, HistoryRiskLevel, DeviceType, Device } from './types';

export default function App() {
  // --- Auth State ---
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // --- App State ---
  const [currentTab, setCurrentTab] = useState('dashboard');

  // --- Devices State ---
  const [devices, setDevices] = useState<Device[]>(MOCK_DEVICES);

  // --- Dashboard State ---
  const onlineCount = devices.filter(d => d.status === DeviceStatus.ONLINE).length;
  const offlineCount = devices.filter(d => d.status === DeviceStatus.OFFLINE).length;

  // --- Add Device State ---
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceIp, setNewDeviceIp] = useState('');
  const [newDeviceType, setNewDeviceType] = useState<DeviceType>(DeviceType.SERVER);

  // --- Terminal State ---
  const [activeTerminalDevice, setActiveTerminalDevice] = useState<Device | null>(null);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [terminalInput, setTerminalInput] = useState('');
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // --- Chat State ---
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(MOCK_DEVICES[0].id);
  const [isDeviceSelectorOpen, setIsDeviceSelectorOpen] = useState(false);
  
  // --- Profile State ---
  const [profileView, setProfileView] = useState<'main' | 'account' | 'security' | 'app_settings'>('main');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // --- Security Center State ---
  const [is2FAEnabled, setIs2FAEnabled] = useState(true);
  const [sessions, setSessions] = useState([
    { id: 1, device: 'Chrome on macOS', location: 'Shenzhen', isCurrent: true, icon: 'desktop_mac', time: '当前设备' },
    { id: 2, device: 'Shadow Shuttle App', location: 'Shanghai', isCurrent: false, icon: 'smartphone', time: '2小时前' },
    { id: 3, device: 'Firefox on Windows', location: 'Beijing', isCurrent: false, icon: 'laptop_windows', time: '1天前' }
  ]);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentDevice = devices.find(d => d.id === selectedDeviceId) || devices[0];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentTab]);

  useEffect(() => {
    if (activeTerminalDevice) {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLines, activeTerminalDevice]);

  // --- Auth Logic ---
  const handleLogin = () => {
    setCurrentTab('dashboard');
    setIsLoggedIn(true);
    setProfileView('main');
  };

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
        setIsLoggedIn(false);
        setIsLoggingOut(false);
        setProfileView('main');
        setCurrentTab('dashboard');
        setAuthMode('login'); // Reset to login mode on logout
    }, 1500);
  };

  // --- Security Logic ---
  const handleKickSession = (id: number) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  const handleChangePassword = () => {
    if (!passwordForm.current || !passwordForm.new || passwordForm.new !== passwordForm.confirm) return;
    
    setPasswordStatus('saving');
    setTimeout(() => {
        setPasswordStatus('success');
        setTimeout(() => {
            setIsChangePasswordOpen(false);
            setPasswordStatus('idle');
            setPasswordForm({ current: '', new: '', confirm: '' });
        }, 1000);
    }, 1500);
  };

  // --- Add Device Logic ---
  const handleAddDevice = () => {
    if (!newDeviceName.trim() || !newDeviceIp.trim()) return;

    const newDevice: Device = {
      id: Date.now().toString(),
      name: newDeviceName,
      ip: newDeviceIp,
      type: newDeviceType,
      status: DeviceStatus.ONLINE, 
    };

    setDevices(prev => [...prev, newDevice]);
    setIsAddDeviceOpen(false);
    
    // Reset form
    setNewDeviceName('');
    setNewDeviceIp('');
    setNewDeviceType(DeviceType.SERVER);
  };

  const deviceTypeOptions = [
    { type: DeviceType.SERVER, icon: 'dns', label: '服务器' },
    { type: DeviceType.DESKTOP, icon: 'desktop_windows', label: '台式机' },
    { type: DeviceType.LAPTOP, icon: 'laptop_mac', label: '笔记本' },
    { type: DeviceType.CHIP, icon: 'memory', label: '开发板' },
    { type: DeviceType.PHONE, icon: 'smartphone', label: '移动端' },
  ];

  // --- Terminal Logic ---
  const handleDeviceClick = (device: Device) => {
    setActiveTerminalDevice(device);
    setTerminalLines([]);
    setTimeout(() => setTerminalLines(prev => [...prev, `Initiating handshake with ${device.ip}...`]), 100);
    setTimeout(() => setTerminalLines(prev => [...prev, `Authenticating as root...`]), 400);
    setTimeout(() => setTerminalLines(prev => [...prev, `Connected to ${device.name}.`, '', `Welcome to ShadowOS v2.4 (GNU/Linux 5.15.0-76-generic x86_64)`, '', `System load: 0.12  Up time: 14 days`, `Usage: type 'help' for available commands.`, '']), 800);
  };

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    const cmd = terminalInput.trim();
    const newLines = [`root@${activeTerminalDevice?.name}:~# ${cmd}`];

    switch(cmd.toLowerCase()) {
      case 'help':
        newLines.push('Available commands: help, status, clear, ls, top, exit');
        break;
      case 'clear':
        setTerminalLines([]);
        setTerminalInput('');
        return;
      case 'ls':
        newLines.push('bin   dev  home  lib64  mnt  proc  run   srv  tmp  var');
        newLines.push('boot  etc  lib   media  opt  root  sbin  sys  usr');
        break;
      case 'status':
        newLines.push(`Status: ${activeTerminalDevice?.status === DeviceStatus.ONLINE ? 'ONLINE' : 'OFFLINE'}`);
        newLines.push(`IP: ${activeTerminalDevice?.ip}`);
        newLines.push(`Type: ${activeTerminalDevice?.type}`);
        break;
      case 'exit':
        setActiveTerminalDevice(null);
        setTerminalLines([]);
        return;
      default:
        newLines.push(`bash: ${cmd}: command not found`);
    }

    setTerminalLines(prev => [...prev, ...newLines]);
    setTerminalInput('');
  };

  // --- Chat Logic ---
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text'
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    const contextPrompt = `[Context: Connected to ${currentDevice.name} (${currentDevice.ip})] ${inputText}`;
    const responseText = await sendMessageToGemini(contextPrompt);

    const aiMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      content: responseText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text'
    };

    setMessages(prev => [...prev, aiMsg]);
    setIsTyping(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      const base64Data = base64.split(',')[1];

      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: '分析这张图片',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'text',
        image: base64
      };

      setMessages(prev => [...prev, userMsg]);
      setIsTyping(true);

      const responseText = await sendMessageToGemini('Please analyze this image and tell me if there are any security concerns visible, or just describe it.', base64Data);

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'text'
      };

      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    };
    reader.readAsDataURL(file);
  };

  const getDeviceIcon = (type: DeviceType) => {
    switch (type) {
      case DeviceType.SERVER: return 'dns';
      case DeviceType.DESKTOP: return 'desktop_windows';
      case DeviceType.LAPTOP: return 'laptop_mac';
      case DeviceType.CHIP: return 'memory';
      case DeviceType.PHONE: return 'smartphone';
      default: return 'devices';
    }
  };

  // --- Render Views ---

  const renderLogin = () => (
     <div className="flex flex-col items-center justify-center h-full w-full bg-[#101622] p-6 animate-fade-in relative overflow-hidden">
        {/* Fancy Background */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
            <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] bg-primary/20 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-[-20%] right-[-20%] w-[70%] h-[70%] bg-purple-600/20 rounded-full blur-[100px] animate-pulse delay-700"></div>
        </div>

        <div className="z-10 w-full max-w-sm flex flex-col gap-8">
            <div className="text-center space-y-2">
                <div className="flex justify-center mb-6">
                    <div className="relative flex items-center justify-center size-20 rounded-2xl bg-[#0f141e] border border-white/10 shadow-2xl shadow-primary/20">
                         <span className="material-symbols-outlined text-primary text-5xl">webhook</span>
                    </div>
                </div>
                <h1 className="text-3xl font-black italic tracking-tighter text-white font-sans">
                    SHADOW<span className="text-primary not-italic">SHUTTLE</span>
                </h1>
                <p className="text-slate-400 text-sm">Next-Gen Server Management Mesh</p>
            </div>

            <div className="bg-[#18202F]/80 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-xl space-y-4 transition-all duration-300">
                {authMode === 'login' ? (
                  <>
                    <div className="space-y-2 animate-fade-in">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">身份 ID</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-[20px]">person</span>
                            <input type="text" defaultValue="SysAdmin" className="w-full bg-[#111722] border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                        </div>
                    </div>
                    <div className="space-y-2 animate-fade-in">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">访问密钥</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-[20px]">key</span>
                            <input type="password" defaultValue="password" className="w-full bg-[#111722] border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                        </div>
                    </div>
                    <button onClick={handleLogin} className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/25 transition-all active:scale-[0.98] mt-2 animate-fade-in">
                        建立安全连接
                    </button>
                    <div className="pt-2 text-center animate-fade-in">
                        <button onClick={() => setAuthMode('register')} className="text-xs text-slate-400 hover:text-white transition-colors">
                             还没有账号？ <span className="text-primary font-bold">立即注册</span>
                        </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2 animate-fade-in">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">设置身份 ID</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-[20px]">person</span>
                            <input type="text" placeholder="设置用户名" className="w-full bg-[#111722] border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                        </div>
                    </div>
                    <div className="space-y-2 animate-fade-in">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">安全邮箱</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-[20px]">mail</span>
                            <input type="email" placeholder="email@example.com" className="w-full bg-[#111722] border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                        </div>
                    </div>
                    <div className="space-y-2 animate-fade-in">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">设置密钥</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-[20px]">key</span>
                            <input type="password" placeholder="设置密码" className="w-full bg-[#111722] border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                        </div>
                    </div>
                    <button onClick={handleLogin} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-900/20 transition-all active:scale-[0.98] mt-2 animate-fade-in">
                        初始化身份 (注册)
                    </button>
                    <div className="pt-2 text-center animate-fade-in">
                        <button onClick={() => setAuthMode('login')} className="text-xs text-slate-400 hover:text-white transition-colors">
                             已有账号？ <span className="text-primary font-bold">返回登录</span>
                        </button>
                    </div>
                  </>
                )}
            </div>
            
            <p className="text-center text-xs text-slate-600">v2.4.0 • 端对端加密</p>
        </div>
     </div>
  );

  const renderTerminal = () => (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0d1117] font-mono animate-fade-in">
       {/* Terminal Header */}
       <header className="flex items-center justify-between px-4 py-3 bg-[#161b22] border-b border-[#30363d] shrink-0">
          <div className="flex items-center gap-3">
             <button 
                onClick={() => setActiveTerminalDevice(null)}
                className="flex items-center justify-center size-8 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
             >
                <span className="material-symbols-outlined text-xl">arrow_back</span>
             </button>
             <div className="flex flex-col">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                   <span className="material-symbols-outlined text-[16px] text-green-500">terminal</span>
                   {activeTerminalDevice?.name}
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest">{activeTerminalDevice?.ip} • SSH-2.0</span>
             </div>
          </div>
          <div className="flex gap-2">
            <div className="size-3 rounded-full bg-red-500/80"></div>
            <div className="size-3 rounded-full bg-yellow-500/80"></div>
            <div className="size-3 rounded-full bg-green-500/80"></div>
          </div>
       </header>

       {/* Terminal Body */}
       <div className="flex-1 overflow-y-auto p-4 space-y-1 scroll-smooth" onClick={() => document.getElementById('terminal-input')?.focus()}>
          {terminalLines.map((line, i) => (
             <div key={i} className="text-sm break-all leading-relaxed">
                {line.startsWith(`root@`) ? (
                   <span className="text-white">
                      <span className="text-green-500 font-bold">{line.split(' ')[0]}</span>
                      <span className="text-blue-500 font-bold"> {line.split(' ')[1]}</span> 
                      {line.substring(line.indexOf(' '))}
                   </span>
                ) : (
                   <span className="text-slate-300">{line}</span>
                )}
             </div>
          ))}
          
          <form onSubmit={handleTerminalSubmit} className="flex items-center gap-2 mt-2">
             <span className="text-green-500 font-bold text-sm whitespace-nowrap">root@{activeTerminalDevice?.name || 'unknown'}:~#</span>
             <input 
                id="terminal-input"
                autoFocus
                autoComplete="off"
                className="flex-1 bg-transparent border-none outline-none text-white text-sm font-mono p-0 focus:ring-0 placeholder-transparent"
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
             />
             <div className="w-2 h-4 bg-slate-400 animate-pulse"></div>
          </form>
          <div ref={terminalEndRef} className="h-4"></div>
       </div>

       {/* Terminal Toolbar (Mobile friendly) */}
       <div className="bg-[#161b22] border-t border-[#30363d] p-2 flex gap-2 overflow-x-auto no-scrollbar">
          {['Ctrl+C', 'Tab', 'clear', 'ls -la', 'top', 'exit'].map(cmd => (
             <button 
                key={cmd}
                onClick={() => {
                   if(cmd === 'Ctrl+C') return; // Mock
                   setTerminalInput(prev => prev + (cmd === 'Tab' ? '  ' : cmd));
                   document.getElementById('terminal-input')?.focus();
                }}
                className="px-3 py-1.5 rounded bg-[#21262d] border border-[#30363d] text-xs text-slate-300 font-mono hover:bg-[#30363d] hover:text-white transition-colors whitespace-nowrap"
             >
                {cmd}
             </button>
          ))}
       </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="flex-1 flex flex-col p-5 gap-6 animate-fade-in overflow-y-auto scroll-smooth">
       {/* Header */}
       <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Logo Icon */}
            <div className="relative group cursor-pointer">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-purple-600 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                <div className="relative flex items-center justify-center size-10 rounded-xl bg-[#0f141e] border border-white/10 shadow-xl">
                     <span className="material-symbols-outlined text-primary group-hover:text-white transition-colors duration-300" style={{ fontSize: '24px' }}>webhook</span>
                </div>
            </div>
            
            <div className="flex flex-col justify-center">
                <h2 className="text-xl font-black italic tracking-tighter text-white font-sans leading-none">
                    SHADOW<span className="text-primary not-italic">SHUTTLE</span>
                </h2>
                <div className="flex items-center gap-1.5 mt-1">
                    <div className="h-0.5 w-3 bg-primary rounded-full"></div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Mesh Verified</span>
                </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center justify-center size-10 rounded-full text-slate-300 hover:bg-white/10 transition-colors">
              <span className="material-symbols-outlined text-2xl">search</span>
            </button>
            <div 
              onClick={() => setCurrentTab('profile')}
              className="size-9 rounded-full bg-cover bg-center border-2 border-primary cursor-pointer shadow-glow-blue transition-transform active:scale-95" 
              style={{backgroundImage: 'url("https://picsum.photos/100/100")'}}
            ></div>
          </div>
       </div>

       {/* Stats */}
       <section aria-label="Network Statistics" className="flex gap-4">
         <div className="flex flex-1 flex-col gap-3 rounded-2xl p-5 bg-surface border border-surface shadow-sm">
           <div className="flex items-center justify-between">
             <p className="text-slate-400 text-sm font-medium">在线节点</p>
             <span className="material-symbols-outlined text-green-500 text-xl">wifi</span>
           </div>
           <p className="text-3xl font-bold text-white">{onlineCount}</p>
         </div>
         <div className="flex flex-1 flex-col gap-3 rounded-2xl p-5 bg-surface border border-surface shadow-sm">
           <div className="flex items-center justify-between">
             <p className="text-slate-400 text-sm font-medium">离线节点</p>
             <span className="material-symbols-outlined text-red-500/80 text-xl">wifi_off</span>
           </div>
           <p className="text-3xl font-bold text-white">{offlineCount}</p>
         </div>
       </section>

       {/* Mesh Devices */}
       <div>
         <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-white">Mesh 设备</h3>
            <button className="text-sm font-medium text-primary hover:text-primary/80">查看地图</button>
         </div>
         <DeviceList devices={devices} onDeviceClick={handleDeviceClick} />
       </div>

       {/* FAB */}
       <button 
         onClick={() => setIsAddDeviceOpen(true)}
         className="fixed bottom-24 right-6 z-30 flex items-center justify-center size-14 rounded-2xl bg-primary text-white shadow-lg shadow-primary/40 active:scale-95 transition-all duration-200 group"
       >
         <span className="material-symbols-outlined text-2xl group-hover:rotate-90 transition-transform duration-300">add</span>
       </button>
    </div>
  );

  const renderAI = () => (
    <div className="flex flex-col h-full bg-background animate-fade-in relative">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-[#111722] border-b border-slate-800 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrentTab('dashboard')} className="flex items-center justify-center size-10 rounded-full hover:bg-slate-800 transition-colors text-white">
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <div className="flex flex-col">
            <h2 className="text-base font-bold leading-tight text-white">服务器: {currentDevice.name}</h2>
            <div className="flex items-center gap-1.5">
              <div className={`size-2 rounded-full ${currentDevice.status === DeviceStatus.ONLINE ? 'bg-emerald-500 shadow-glow-green' : 'bg-red-500'} `}></div>
              <span className="text-xs font-medium text-slate-400">{currentDevice.status === DeviceStatus.ONLINE ? '已连接' : '离线'}</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setIsDeviceSelectorOpen(true)}
          className="flex items-center justify-center size-10 rounded-full hover:bg-slate-800 transition-colors text-white"
        >
          <span className="material-symbols-outlined text-[24px]">settings</span>
        </button>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth pb-24">
        <div className="flex justify-center">
          <span className="text-xs font-medium text-slate-500 bg-slate-800 px-3 py-1 rounded-full">今天, 10:23 AM</span>
        </div>
        
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
        
        {isTyping && (
           <div className="flex items-center gap-2 pl-2">
             <div className="size-2 bg-slate-500 rounded-full animate-bounce"></div>
             <div className="size-2 bg-slate-500 rounded-full animate-bounce delay-100"></div>
             <div className="size-2 bg-slate-500 rounded-full animate-bounce delay-200"></div>
           </div>
        )}
        <div ref={messagesEndRef} className="h-4"></div>
      </main>

      {/* Input Area */}
      <footer className="absolute bottom-0 w-full max-w-md p-4 bg-[#111722] border-t border-slate-800 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input 
              className="w-full h-12 rounded-full bg-[#1e2430] border-none focus:ring-2 focus:ring-primary pl-5 pr-12 text-base text-white placeholder-slate-500 transition-shadow" 
              placeholder={`发送指令给 ${currentDevice.name}...`}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleImageUpload}
            />
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute right-10 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">attach_file</span>
            </button>
            <button 
                onClick={handleSendMessage}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary hover:text-blue-400 transition-colors"
            >
              <span className="material-symbols-outlined text-[24px]">send</span>
            </button>
          </div>
          <button className="flex shrink-0 items-center justify-center size-12 rounded-full bg-primary hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30 transition-all active:scale-95 group">
            <span className="material-symbols-outlined text-[24px] group-hover:scale-110 transition-transform">mic</span>
          </button>
        </div>
      </footer>

      {/* Device Selector Modal */}
      {isDeviceSelectorOpen && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in" onClick={() => setIsDeviceSelectorOpen(false)}>
          <div 
            className="w-full max-w-md bg-[#18202F] rounded-t-2xl sm:rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[80%]"
            onClick={(e) => e.stopPropagation()} // Prevent close when clicking inside
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-[#111722]">
              <h3 className="text-lg font-bold text-white">切换连接设备</h3>
              <button onClick={() => setIsDeviceSelectorOpen(false)} className="size-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="overflow-y-auto p-3 flex flex-col gap-2">
              {devices.map(device => {
                const isSelected = selectedDeviceId === device.id;
                const isOnline = device.status === DeviceStatus.ONLINE;
                return (
                  <button
                    key={device.id}
                    onClick={() => {
                      setSelectedDeviceId(device.id);
                      setIsDeviceSelectorOpen(false);
                    }}
                    className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all border ${
                      isSelected
                        ? 'bg-primary/10 border-primary/50 ring-1 ring-primary/20' 
                        : 'bg-surface border-transparent hover:bg-white/5 hover:border-slate-700'
                    } ${!isOnline && !isSelected ? 'opacity-60' : ''}`}
                  >
                    <div className={`flex items-center justify-center size-10 rounded-lg shrink-0 ${isSelected ? 'bg-primary text-white' : 'bg-slate-800 text-slate-400'}`}>
                        <span className="material-symbols-outlined">
                          {getDeviceIcon(device.type)}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>{device.name}</p>
                          {!isOnline && <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-medium">离线</span>}
                        </div>
                        <p className={`text-xs font-mono truncate ${isSelected ? 'text-primary/80' : 'text-slate-500'}`}>{device.ip}</p>
                    </div>
                    {isSelected && (
                        <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="p-3 border-t border-slate-700/50 bg-[#111722]">
               <button 
                  onClick={() => {
                    setIsDeviceSelectorOpen(false);
                    setIsAddDeviceOpen(true);
                  }}
                  className="w-full h-10 rounded-lg border border-slate-700 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
               >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  添加新设备
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderHistory = () => (
    <div className="flex-1 flex flex-col animate-fade-in bg-background pb-20 overflow-y-auto scroll-smooth">
        <header className="sticky top-0 z-50 bg-background border-b border-white/10 px-4 py-3">
            <div className="flex items-center justify-between">
            <button onClick={() => setCurrentTab('dashboard')} className="flex size-10 items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white">
                <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <h1 className="text-lg font-bold tracking-tight flex-1 text-center pr-2">命令历史</h1>
            <button className="flex size-10 items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white">
                <span className="material-symbols-outlined text-[24px]">search</span>
            </button>
            </div>
        </header>
        <div className="sticky top-[65px] z-40 bg-background/95 backdrop-blur-sm border-b border-white/5 py-3 pl-4">
            <div className="flex gap-3 overflow-x-auto pr-4 no-scrollbar pb-1">
                <button className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full bg-primary pl-4 pr-4 shadow-lg shadow-primary/20 transition-transform active:scale-95">
                    <span className="material-symbols-outlined text-[18px] text-white">tune</span>
                    <span className="text-white text-sm font-medium">全部</span>
                </button>
                {['风险等级', '设备', '日期范围'].map(label => (
                    <button key={label} className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full bg-surface border border-white/10 pl-4 pr-4 transition-colors hover:bg-white/5">
                        <span className="text-slate-300 text-sm font-medium">{label}</span>
                        <span className="material-symbols-outlined text-[18px] text-slate-400">arrow_drop_down</span>
                    </button>
                ))}
            </div>
        </div>
        <main className="flex flex-col gap-4 p-4">
            {MOCK_HISTORY.map((item) => (
                <div key={item.id} className={`group relative flex flex-col gap-3 rounded-lg bg-surface p-4 shadow-sm border border-white/5 transition-all hover:border-primary/30 ${item.status === 'error' ? 'ring-1 ring-red-500/30' : ''}`}>
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-slate-400">dns</span>
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{item.device}</span>
                        </div>
                        <span className="text-xs text-slate-400">{item.timestamp}</span>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1 space-y-2">
                            <p className="text-base font-semibold text-white leading-tight">{item.action}</p>
                            <div className="rounded bg-background px-2 py-1.5 font-mono text-xs text-slate-400 truncate w-full max-w-[280px]">
                                {item.command}
                            </div>
                        </div>
                        <div className="shrink-0 flex flex-col justify-center">
                            {item.status === 'success' && (
                                <div className="flex size-8 items-center justify-center rounded-full bg-green-500/10 text-green-500"><span className="material-symbols-outlined text-[20px]">check_circle</span></div>
                            )}
                            {item.status === 'warning' && (
                                <div className="flex size-8 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-500"><span className="material-symbols-outlined text-[20px]">warning</span></div>
                            )}
                             {item.status === 'error' && (
                                <div className="flex size-8 items-center justify-center rounded-full bg-red-500/10 text-red-500"><span className="material-symbols-outlined text-[20px]">dangerous</span></div>
                            )}
                        </div>
                    </div>
                    {item.output && (
                        <div className="pt-2 animate-fade-in">
                            <div className="flex flex-col rounded-lg border border-white/10 bg-[#0d1117] overflow-hidden">
                                <div className="flex items-center justify-between bg-white/5 px-3 py-2 border-b border-white/5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">终端输出</span>
                                    <div className="flex gap-1.5">
                                        <div className="size-2 rounded-full bg-red-500/50"></div>
                                        <div className="size-2 rounded-full bg-yellow-500/50"></div>
                                        <div className="size-2 rounded-full bg-green-500/50"></div>
                                    </div>
                                </div>
                                <div className="p-3 font-mono text-xs overflow-x-auto whitespace-pre-wrap text-slate-300">
                                    {item.output}
                                </div>
                                <div className="flex items-center justify-end gap-2 p-2 border-t border-white/5 bg-white/[0.02]">
                                    <button className="flex items-center justify-center h-8 px-3 rounded text-xs font-medium text-slate-400 hover:text-white transition-colors">
                                        <span className="material-symbols-outlined text-[16px] mr-1.5">content_copy</span>
                                        复制日志
                                    </button>
                                    <button className="flex items-center justify-center h-8 px-3 rounded bg-primary hover:bg-primary/90 text-xs font-medium text-white shadow-sm transition-colors">
                                        <span className="material-symbols-outlined text-[16px] mr-1.5">replay</span>
                                        重新运行
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-center pt-2">
                                <span className="material-symbols-outlined text-slate-600 text-[20px] rotate-180">expand_more</span>
                            </div>
                        </div>
                    )}
                </div>
            ))}
            <div className="py-6 text-center">
                <p className="text-sm text-slate-600">历史记录已全部加载</p>
            </div>
        </main>
    </div>
  );

  const renderProfile = () => {
    // --- Sub-View Renderers ---
    const renderAppSettingsContent = () => (
      <>
        {/* Privacy Shield */}
        <div className="flex items-stretch justify-between gap-4 rounded-xl bg-surface p-5 shadow-lg border border-slate-700/30 animate-fade-in">
            <div className="flex flex-[2_2_0px] flex-col justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined filled text-primary" style={{fontSize: '20px'}}>shield</span>
                        <p className="text-white text-base font-bold">隐私护盾</p>
                    </div>
                    <p className="text-secondary text-sm">通过主动 Mesh 加密保护您的身份。</p>
                </div>
                <div className="flex items-center gap-3">
                    <label className="relative flex h-[28px] w-[48px] cursor-pointer items-center rounded-full border-none bg-[#232f48] p-0.5 has-[:checked]:justify-end has-[:checked]:bg-primary transition-colors duration-200">
                        <div className="h-[24px] w-[24px] rounded-full bg-white shadow-sm"></div>
                        <input defaultChecked className="hidden" type="checkbox"/>
                    </label>
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary">已激活</span>
                </div>
            </div>
            <div className="w-24 bg-center bg-no-repeat bg-cover rounded-lg flex-1 shrink-0 overflow-hidden relative" style={{backgroundImage: 'url("https://picsum.photos/200/200?blur=5")'}}>
                <div className="absolute inset-0 bg-primary/40 mix-blend-overlay"></div>
                <span className="material-symbols-outlined absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/50 text-4xl">security</span>
            </div>
        </div>

        {/* Controls */}
        <div className="animate-fade-in">
            <h3 className="text-white text-base font-bold mb-2">控制选项</h3>
            <div className="flex flex-col bg-[#111722] rounded-xl overflow-hidden">
                <div className="flex items-center gap-4 px-4 min-h-14 justify-between border-b border-slate-800/50">
                    <div className="flex flex-col">
                        <p className="text-white text-sm font-medium">本地数据脱敏</p>
                        <p className="text-secondary text-xs">发送前匿名化个人敏感信息</p>
                    </div>
                    <label className="relative flex h-[24px] w-[40px] cursor-pointer items-center rounded-full border-none bg-[#232f48] p-0.5 has-[:checked]:justify-end has-[:checked]:bg-primary transition-colors">
                        <div className="h-[20px] w-[20px] rounded-full bg-white shadow-sm"></div>
                        <input defaultChecked className="hidden" type="checkbox"/>
                    </label>
                </div>
                <div className="flex items-center gap-4 px-4 min-h-14 justify-between">
                     <div className="flex flex-col">
                        <p className="text-white text-sm font-medium">日志保留</p>
                        <p className="text-secondary text-xs">自动清除本地日志</p>
                    </div>
                    <div className="flex items-center gap-2 cursor-pointer">
                        <span className="text-secondary text-sm">30 天</span>
                        <span className="material-symbols-outlined text-slate-400" style={{fontSize: '20px'}}>chevron_right</span>
                    </div>
                </div>
            </div>
        </div>

         {/* AI Providers */}
         <div className="animate-fade-in">
            <div className="flex justify-between items-end mb-2">
                <h3 className="text-white text-base font-bold">AI 服务商</h3>
                <span className="text-xs text-primary font-medium flex items-center gap-1">
                    <span className="block size-1.5 rounded-full bg-primary animate-pulse"></span> 已连接
                </span>
            </div>
            <div className="flex flex-col gap-3">
                <div className="group relative flex items-center gap-3 bg-surface p-3 rounded-xl border-2 border-primary shadow-lg cursor-pointer overflow-hidden transition-all">
                    <div className="absolute top-0 right-0 bg-primary px-2 py-0.5 rounded-bl-lg z-10">
                         <span className="text-[10px] font-bold text-white tracking-wider uppercase">已激活</span>
                    </div>
                    <div className="size-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-white" style={{fontSize: '24px'}}>smart_toy</span>
                    </div>
                    <div className="flex-1 min-w-0">
                         <div className="flex items-center gap-2">
                            <p className="text-white text-sm font-bold">OpenAI</p>
                            <span className="material-symbols-outlined filled text-primary text-[14px]">verified</span>
                         </div>
                         <p className="text-secondary text-xs truncate">GPT-4o (经由安全隧道)</p>
                    </div>
                    <div className="shrink-0 pr-1">
                        <div className="size-5 rounded-full border-[5px] border-primary bg-white"></div>
                    </div>
                </div>
                 <div className="group relative flex items-center gap-3 bg-[#111722] p-3 rounded-xl border border-slate-800 cursor-pointer hover:bg-surface transition-all">
                    <div className="size-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-slate-400" style={{fontSize: '24px'}}>spark</span>
                    </div>
                    <div className="flex-1 min-w-0">
                         <p className="text-slate-300 text-sm font-bold">Google</p>
                         <p className="text-slate-500 text-xs truncate">Gemini 3 Pro</p>
                    </div>
                     <div className="shrink-0 pr-1">
                        <div className="size-5 rounded-full border border-slate-600"></div>
                    </div>
                </div>
            </div>
         </div>
         
         {/* Credentials */}
         <div className="animate-fade-in">
            <h3 className="text-white text-base font-bold mb-2">凭证管理</h3>
            <div className="bg-surface p-4 rounded-xl border border-slate-700/50 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-white text-xs font-semibold uppercase tracking-wide">OpenAI API 密钥</label>
                    <span className="text-xs text-green-500 flex items-center gap-1 bg-green-500/10 px-1.5 py-0.5 rounded">
                         <span className="material-symbols-outlined text-[12px]">check_circle</span> 有效
                    </span>
                </div>
                <div className="relative flex items-center group/input">
                     <div className="absolute left-3 flex items-center justify-center text-slate-400">
                         <span className="material-symbols-outlined" style={{fontSize: '20px'}}>vpn_key</span>
                     </div>
                     <input className="w-full bg-[#111722] text-white text-sm font-mono rounded-lg border border-slate-700 py-3 pl-10 pr-24 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-slate-500" placeholder="sk-..." readOnly type="password" value="sk-proj-s8d7f6g5h4j3k2l1m0n9" />
                     <div className="absolute right-2 flex items-center gap-1">
                        <button className="bg-[#232f48] hover:bg-[#2d3b55] text-white text-[10px] font-bold uppercase tracking-wide px-2 py-1.5 rounded-md transition-colors">
                            粘贴
                        </button>
                     </div>
                </div>
                 <p className="text-[11px] text-secondary mt-3 flex items-start gap-1.5 leading-tight">
                    <span className="material-symbols-outlined text-[14px] shrink-0 mt-0.5">lock</span> 
                    密钥通过 Secure Enclave 加密，绝不会以明文形式存储在我们的服务器上。
                </p>
            </div>
         </div>
         
         <div className="text-center mt-2 animate-fade-in">
            <p className="text-[10px] text-slate-600 uppercase tracking-widest font-semibold">Shadow Shuttle v2.4.0</p>
         </div>
      </>
    );

    const renderAccountContent = () => (
      <div className="space-y-4 animate-fade-in">
           <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">用户名 (不可更改)</label>
              <div className="relative">
                  <input type="text" value="SysAdmin" readOnly className="w-full bg-[#111722] border border-slate-700 rounded-lg px-3 py-2 text-slate-400 text-sm outline-none cursor-not-allowed opacity-70" />
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 text-[16px]">lock</span>
              </div>
           </div>
           <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">邮箱</label>
              <input type="email" defaultValue="admin@shadowshuttle.io" className="w-full bg-[#111722] border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
           </div>
           <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">简介</label>
              <textarea rows={2} defaultValue="Senior Systems Architect." className="w-full bg-[#111722] border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"></textarea>
           </div>
           <button onClick={() => setProfileView('main')} className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-2.5 rounded-xl transition-colors mt-2">
               保存更改
           </button>
      </div>
    );

    const renderSecurityContent = () => (
      <div className="space-y-3 animate-fade-in relative">
           {/* Change Password Modal Overlay */}
           {isChangePasswordOpen && (
               <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsChangePasswordOpen(false)}>
                   <div className="bg-[#18202F] rounded-2xl border border-slate-700 shadow-2xl w-full max-w-xs p-5" onClick={e => e.stopPropagation()}>
                       <h3 className="text-lg font-bold text-white mb-4">修改密码</h3>
                       <div className="space-y-3">
                           <div>
                               <label className="text-[10px] text-slate-400 uppercase font-bold">当前密码</label>
                               <input 
                                    type="password" 
                                    value={passwordForm.current}
                                    onChange={e => setPasswordForm({...passwordForm, current: e.target.value})}
                                    className="w-full bg-[#111722] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-primary outline-none"
                               />
                           </div>
                           <div>
                               <label className="text-[10px] text-slate-400 uppercase font-bold">新密码</label>
                               <input 
                                    type="password"
                                    value={passwordForm.new}
                                    onChange={e => setPasswordForm({...passwordForm, new: e.target.value})}
                                    className="w-full bg-[#111722] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-primary outline-none"
                               />
                           </div>
                           <div>
                               <label className="text-[10px] text-slate-400 uppercase font-bold">确认新密码</label>
                               <input 
                                    type="password"
                                    value={passwordForm.confirm}
                                    onChange={e => setPasswordForm({...passwordForm, confirm: e.target.value})}
                                    className={`w-full bg-[#111722] border rounded-lg px-3 py-2 text-white text-sm focus:border-primary outline-none ${passwordForm.new && passwordForm.confirm && passwordForm.new !== passwordForm.confirm ? 'border-red-500' : 'border-slate-600'}`}
                               />
                           </div>
                       </div>
                       <div className="flex gap-2 mt-5">
                           <button onClick={() => setIsChangePasswordOpen(false)} className="flex-1 py-2 rounded-lg bg-slate-700 text-slate-300 text-xs font-bold">取消</button>
                           <button 
                                onClick={handleChangePassword} 
                                disabled={passwordStatus === 'saving' || !passwordForm.current || !passwordForm.new || passwordForm.new !== passwordForm.confirm}
                                className="flex-1 py-2 rounded-lg bg-primary text-white text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                           >
                                {passwordStatus === 'saving' && <div className="size-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                                {passwordStatus === 'success' ? '成功' : '保存'}
                           </button>
                       </div>
                   </div>
               </div>
           )}

           <div className="flex items-center justify-between p-3 rounded-xl bg-[#111722] border border-slate-700">
               <div className="flex items-center gap-3">
                   <div className={`size-8 rounded-lg flex items-center justify-center transition-colors ${is2FAEnabled ? 'bg-green-500/20 text-green-500' : 'bg-slate-700 text-slate-400'}`}>
                       <span className="material-symbols-outlined text-[18px]">verified_user</span>
                   </div>
                   <div>
                       <p className="text-sm font-bold text-white">两步验证</p>
                       <p className="text-[10px] text-slate-400">{is2FAEnabled ? '已启用 Authenticator' : '建议开启以保护账户'}</p>
                   </div>
               </div>
               <button 
                onClick={() => setIs2FAEnabled(!is2FAEnabled)}
                className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${is2FAEnabled ? 'bg-green-500' : 'bg-slate-600'}`}
               >
                   <div className={`absolute top-0.5 size-4 bg-white rounded-full transition-all duration-300 shadow-sm ${is2FAEnabled ? 'right-0.5' : 'left-0.5'}`}></div>
               </button>
           </div>
           
           <button 
            onClick={() => setIsChangePasswordOpen(true)}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-[#111722] border border-slate-700 hover:border-slate-500 transition-colors text-left group"
           >
               <div className="flex items-center gap-3">
                   <div className="size-8 bg-slate-700 text-slate-300 rounded-lg flex items-center justify-center">
                       <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                   </div>
                   <div>
                       <p className="text-sm font-bold text-white">修改密码</p>
                       <p className="text-[10px] text-slate-400">上次修改: 30天前</p>
                   </div>
               </div>
               <span className="material-symbols-outlined text-slate-500 text-[18px]">chevron_right</span>
           </button>

           <div className="pt-2">
               <p className="text-xs font-bold text-slate-500 uppercase mb-2">活跃会话</p>
               <div className="space-y-2">
                   {sessions.map(session => (
                       <div key={session.id} className={`flex items-center justify-between p-2 rounded-lg ${session.isCurrent ? 'bg-primary/10 border border-primary/20' : 'opacity-80'}`}>
                           <div className="flex items-center gap-3 min-w-0">
                               <span className="material-symbols-outlined text-slate-400 text-[20px]">{session.icon}</span>
                               <div className="truncate">
                                   <p className={`text-xs font-bold truncate ${session.isCurrent ? 'text-white' : 'text-slate-200'}`}>{session.device}</p>
                                   <p className={`text-[10px] ${session.isCurrent ? 'text-green-500' : 'text-slate-400'}`}>
                                       {session.isCurrent ? `当前设备 • ${session.location}` : `${session.time} • ${session.location}`}
                                   </p>
                               </div>
                           </div>
                           {!session.isCurrent && (
                               <button 
                                onClick={() => handleKickSession(session.id)}
                                className="shrink-0 text-[10px] text-red-400 border border-red-500/30 px-2 py-1 rounded hover:bg-red-500/10 transition-colors ml-2"
                               >
                                   踢出
                               </button>
                           )}
                       </div>
                   ))}
                   {sessions.length === 1 && (
                       <div className="text-center py-2">
                           <p className="text-[10px] text-slate-600">没有其他活跃会话</p>
                       </div>
                   )}
               </div>
           </div>
      </div>
    );

    return (
      <div className="flex-1 flex flex-col bg-background animate-fade-in pb-20 overflow-y-auto scroll-smooth relative">
        {isLoggingOut && (
          <div className="absolute inset-0 z-50 bg-[#18202F]/90 backdrop-blur flex flex-col items-center justify-center">
              <div className="size-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-3"></div>
              <p className="text-sm font-bold text-white">正在安全登出...</p>
          </div>
        )}

        {/* View: Main */}
        {profileView === 'main' && (
           <div className="flex flex-col p-4 space-y-6">
              <header className="flex items-center justify-between py-2">
                   <h1 className="text-xl font-bold text-white">个人中心</h1>
                   <button className="p-2 text-slate-400 hover:text-white">
                      <span className="material-symbols-outlined">notifications</span>
                   </button>
              </header>
              
              {/* User Card */}
              <div className="relative overflow-hidden rounded-2xl bg-[#18202F] p-6 border border-white/5 shadow-xl">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                   
                   <div className="relative flex items-center gap-4">
                       <div className="relative">
                          <img src="https://picsum.photos/100/100" className="size-16 rounded-full border-2 border-white/10" alt="Avatar"/>
                          <div className="absolute bottom-0 right-0 size-4 bg-emerald-500 border-2 border-[#18202F] rounded-full"></div>
                       </div>
                       <div>
                           <h2 className="text-lg font-bold text-white">SysAdmin</h2>
                           <div className="flex items-center gap-1.5 text-primary text-xs font-mono bg-primary/10 px-2 py-0.5 rounded-full w-fit mt-1">
                               <span className="material-symbols-outlined text-[12px]">verified_user</span>
                               Root Access
                           </div>
                       </div>
                   </div>

                   {/* Stats */}
                   <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/5">
                       <div className="text-center">
                           <div className="text-lg font-bold text-white">{devices.length}</div>
                           <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">节点</div>
                       </div>
                       <div className="text-center">
                           <div className="text-lg font-bold text-primary">99%</div>
                           <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">在线率</div>
                       </div>
                       <div className="text-center">
                           <div className="text-lg font-bold text-emerald-500">A+</div>
                           <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">健康度</div>
                       </div>
                   </div>
              </div>

              {/* Menu */}
              <div className="space-y-3">
                   <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">功能与设置</h3>
                   
                   {/* App Settings */}
                   <button 
                      onClick={() => setProfileView('app_settings')}
                      className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#18202F] border border-white/5 hover:bg-white/5 transition-colors group"
                   >
                      <div className="size-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                          <span className="material-symbols-outlined">tune</span>
                      </div>
                      <div className="flex-1 text-left">
                          <div className="text-sm font-bold text-white">系统设置</div>
                          <div className="text-xs text-slate-400">隐私, AI 模型, 凭证</div>
                      </div>
                      <span className="material-symbols-outlined text-slate-500 group-hover:text-white transition-colors">chevron_right</span>
                   </button>

                   <button 
                      onClick={() => setProfileView('account')}
                      className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#18202F] border border-white/5 hover:bg-white/5 transition-colors group"
                   >
                      <div className="size-10 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                          <span className="material-symbols-outlined">person</span>
                      </div>
                      <div className="flex-1 text-left">
                          <div className="text-sm font-bold text-white">账户信息</div>
                          <div className="text-xs text-slate-400">个人资料与身份</div>
                      </div>
                      <span className="material-symbols-outlined text-slate-500 group-hover:text-white transition-colors">chevron_right</span>
                   </button>

                   <button 
                      onClick={() => setProfileView('security')}
                      className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#18202F] border border-white/5 hover:bg-white/5 transition-colors group"
                   >
                      <div className="size-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                          <span className="material-symbols-outlined">shield</span>
                      </div>
                      <div className="flex-1 text-left">
                          <div className="text-sm font-bold text-white">安全中心</div>
                          <div className="text-xs text-slate-400">密码, 2FA, 会话</div>
                      </div>
                      <span className="material-symbols-outlined text-slate-500 group-hover:text-white transition-colors">chevron_right</span>
                   </button>
              </div>

               <button onClick={handleLogout} className="w-full py-3 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/10 font-bold text-sm transition-colors mt-4">
                  退出登录
               </button>
           </div>
        )}

        {/* Sub-views headers and content wrapper */}
        {profileView !== 'main' && (
            <div className="flex flex-col h-full animate-fade-in">
                 <div className="sticky top-0 z-20 flex items-center bg-[#111722]/95 backdrop-blur-md p-4 pb-2 justify-between border-b border-slate-800/50">
                      <button onClick={() => setProfileView('main')} className="flex size-10 items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white">
                          <span className="material-symbols-outlined">arrow_back</span>
                      </button>
                      <h2 className="text-white text-lg font-bold">
                          {profileView === 'app_settings' && '系统设置'}
                          {profileView === 'account' && '账户信息'}
                          {profileView === 'security' && '安全中心'}
                      </h2>
                      <div className="size-10"></div> {/* Spacer */}
                 </div>
                 
                 <div className="p-4 pt-6 space-y-6">
                     {profileView === 'app_settings' && renderAppSettingsContent()}
                     {profileView === 'account' && renderAccountContent()}
                     {profileView === 'security' && renderSecurityContent()}
                 </div>
            </div>
        )}
      </div>
    );
  };

  if (!isLoggedIn) {
      return (
        <div className="relative flex h-[100dvh] w-full flex-col max-w-md mx-auto bg-background shadow-2xl border-x border-surface/50 overflow-hidden">
            {renderLogin()}
        </div>
      );
  }

  return (
    <div className="relative flex h-[100dvh] w-full flex-col max-w-md mx-auto bg-background shadow-2xl border-x border-surface/50 overflow-hidden">
      {currentTab === 'dashboard' && (activeTerminalDevice ? renderTerminal() : renderDashboard())}
      {currentTab === 'ai' && renderAI()}
      {currentTab === 'history' && renderHistory()}
      {currentTab === 'profile' && renderProfile()}

      {currentTab !== 'ai' && !activeTerminalDevice && <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />}

      {/* Add Device Modal */}
      {isAddDeviceOpen && (
        <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsAddDeviceOpen(false)}>
           <div 
             className="w-full max-w-md bg-[#18202F] rounded-t-2xl sm:rounded-2xl border border-slate-700 shadow-2xl flex flex-col"
             onClick={(e) => e.stopPropagation()}
           >
              <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-[#111722]">
                <h3 className="text-lg font-bold text-white">添加新设备</h3>
                <button onClick={() => setIsAddDeviceOpen(false)} className="size-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              
              <div className="p-5 space-y-5">
                 <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">设备类型</label>
                    <div className="grid grid-cols-5 gap-2">
                      {deviceTypeOptions.map((opt) => (
                        <button
                          key={opt.type}
                          onClick={() => setNewDeviceType(opt.type)}
                          className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                            newDeviceType === opt.type 
                              ? 'bg-primary/20 border-primary text-white' 
                              : 'bg-[#111722] border-slate-700 text-slate-400 hover:border-slate-500'
                          }`}
                        >
                           <span className={`material-symbols-outlined text-[20px] ${newDeviceType === opt.type ? 'text-primary' : ''}`}>{opt.icon}</span>
                           <span className="text-[9px] font-medium">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                 </div>

                 <div className="space-y-3">
                    <div className="space-y-1">
                       <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">设备名称</label>
                       <input 
                          value={newDeviceName}
                          onChange={(e) => setNewDeviceName(e.target.value)}
                          className="w-full h-11 bg-[#111722] border border-slate-700 rounded-lg px-3 text-white placeholder-slate-600 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm transition-all"
                          placeholder="例如：Ubuntu Server 02"
                       />
                    </div>
                    <div className="space-y-1">
                       <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">IP 地址</label>
                       <input 
                          value={newDeviceIp}
                          onChange={(e) => setNewDeviceIp(e.target.value)}
                          className="w-full h-11 bg-[#111722] border border-slate-700 rounded-lg px-3 text-white placeholder-slate-600 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-mono text-sm transition-all"
                          placeholder="192.168.1.x"
                       />
                    </div>
                 </div>

                 <button 
                    onClick={handleAddDevice}
                    disabled={!newDeviceName.trim() || !newDeviceIp.trim()}
                    className="w-full h-12 bg-primary hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                 >
                    <span className="material-symbols-outlined">add_circle</span>
                    确认添加
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}