import React from 'react';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-[#101622] text-white overflow-x-hidden font-sans selection:bg-primary/30">
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#101622]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center size-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 shadow-lg shadow-primary/20">
               <span className="material-symbols-outlined text-white text-[20px]">webhook</span>
            </div>
            <span className="text-lg font-bold tracking-tight">Shadow Shuttle</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="hidden text-sm font-medium text-slate-400 hover:text-white sm:block transition-colors">文档</a>
            <a href="#" className="hidden text-sm font-medium text-slate-400 hover:text-white sm:block transition-colors">GitHub</a>
            <button 
              onClick={onGetStarted}
              className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
            >
              登录
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-24">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px] opacity-50"></div>
        <div className="absolute bottom-0 right-0 -z-10 h-[400px] w-[400px] rounded-full bg-purple-600/10 blur-[100px] opacity-30"></div>

        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-6 inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary backdrop-blur-sm">
            <span className="mr-1.5 flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            v2.4.0 Now Available with Gemini 3 Pro
          </div>
          <h1 className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-6xl lg:text-7xl mb-6">
            服务器管理的<br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">AI 驱动新范式</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-400 mb-10 leading-relaxed">
            Shadow Shuttle 是一个由人工智能驱动的现代化服务器网格管理平台。
            告别繁琐的命令行记忆，让 AI 协助您完成运维监控、日志分析与安全审计。
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button 
              onClick={onGetStarted}
              className="h-12 rounded-full bg-primary px-8 text-base font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:scale-105 hover:bg-blue-600 active:scale-95 flex items-center gap-2"
            >
              立即开始
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
            <button className="h-12 rounded-full border border-slate-700 bg-[#161b22] px-8 text-base font-medium text-slate-300 transition-all hover:bg-slate-800 hover:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">code</span>
              查看源码
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-[#0b0f17]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: 'smart_toy',
                title: 'Gemini AI 助手',
                desc: '集成 Google Gemini 3 Pro 模型，能够理解自然语言并转换为复杂的 Shell 命令，提供实时安全建议。',
                color: 'text-blue-400',
                bg: 'bg-blue-400/10'
              },
              {
                icon: 'hub',
                title: 'Mesh 网格网络',
                desc: '无需公网 IP，通过加密隧道构建点对点 Mesh 网络，随时随地安全连接您的家庭或企业服务器。',
                color: 'text-purple-400',
                bg: 'bg-purple-400/10'
              },
              {
                icon: 'shield_lock',
                title: '企业级安全',
                desc: '内置隐私护盾，所有数据端对端加密。支持两步验证 (2FA) 和实时会话审计，确保权限可控。',
                color: 'text-emerald-400',
                bg: 'bg-emerald-400/10'
              }
            ].map((feature, idx) => (
              <div key={idx} className="group relative rounded-2xl border border-white/5 bg-[#121826] p-8 transition-all hover:border-white/10 hover:shadow-2xl hover:shadow-primary/5">
                <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.bg} ${feature.color}`}>
                  <span className="material-symbols-outlined text-3xl">{feature.icon}</span>
                </div>
                <h3 className="mb-3 text-xl font-bold text-white group-hover:text-primary transition-colors">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Installation / Code Section */}
      <section className="py-24 border-y border-white/5 bg-[#101622]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center lg:flex-row lg:gap-16">
            <div className="flex-1 text-center lg:text-left mb-10 lg:mb-0">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">
                五分钟快速部署
              </h2>
              <p className="text-lg text-slate-400 mb-8">
                Shadow Shuttle 支持 Docker 一键部署。只需一条命令，即可在您的私有服务器上启动控制端节点。
              </p>
              <div className="flex flex-col gap-4 sm:flex-row justify-center lg:justify-start">
                 <div className="flex items-center gap-2 text-sm text-slate-400">
                    <span className="material-symbols-outlined text-green-500">check_circle</span>
                    <span>开源免费</span>
                 </div>
                 <div className="flex items-center gap-2 text-sm text-slate-400">
                    <span className="material-symbols-outlined text-green-500">check_circle</span>
                    <span>Linux / macOS / Windows</span>
                 </div>
              </div>
            </div>
            
            <div className="w-full max-w-lg flex-1">
               <div className="rounded-xl bg-[#0d1117] border border-slate-800 shadow-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-[#161b22]">
                     <div className="flex gap-2">
                        <div className="size-3 rounded-full bg-red-500/80"></div>
                        <div className="size-3 rounded-full bg-yellow-500/80"></div>
                        <div className="size-3 rounded-full bg-green-500/80"></div>
                     </div>
                     <span className="text-xs text-slate-500 font-mono">bash</span>
                  </div>
                  <div className="p-6 overflow-x-auto">
                     <pre className="font-mono text-sm leading-relaxed">
                        <span className="text-purple-400">docker</span> run -d \<br/>
                        &nbsp;&nbsp;--name shadow-shuttle \<br/>
                        &nbsp;&nbsp;-p <span className="text-orange-400">8080</span>:80 \<br/>
                        &nbsp;&nbsp;-e <span className="text-blue-400">GEMINI_API_KEY</span>=your_key \<br/>
                        &nbsp;&nbsp;shadowshuttle/core:latest
                     </pre>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 text-center text-sm text-slate-600 bg-[#0b0f17]">
        <div className="mb-4 flex justify-center gap-6">
          <a href="#" className="hover:text-primary transition-colors">隐私政策</a>
          <a href="#" className="hover:text-primary transition-colors">服务条款</a>
          <a href="#" className="hover:text-primary transition-colors">联系我们</a>
        </div>
        <p>© 2024 Shadow Shuttle. All rights reserved.</p>
        <p className="mt-2 text-xs">Designed with React, Tailwind & Gemini AI.</p>
      </footer>
    </div>
  );
};

export default LandingPage;