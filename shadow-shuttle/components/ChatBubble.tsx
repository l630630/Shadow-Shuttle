import React from 'react';
import { ChatMessage } from '../types';

interface ChatBubbleProps {
  message: ChatMessage;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  if (message.type === 'command') {
    return (
      <div className="pl-11 pr-2 w-full animate-fade-in">
        <div className="flex flex-col rounded-xl overflow-hidden shadow-lg border border-slate-700 bg-[#0f141e]">
          <div className="flex items-center justify-between bg-[#1a2130] px-4 py-2 border-b border-slate-700">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">terminal</span>
              命令预览
            </span>
            <div className="flex gap-1.5">
              <div className="size-2.5 rounded-full bg-red-500/20 border border-red-500"></div>
              <div className="size-2.5 rounded-full bg-yellow-500/20 border border-yellow-500"></div>
              <div className="size-2.5 rounded-full bg-green-500/20 border border-green-500"></div>
            </div>
          </div>
          <div className="p-5 font-mono text-sm relative group">
            <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="text-slate-400 hover:text-white">
                <span className="material-symbols-outlined text-[18px]">content_copy</span>
              </button>
            </div>
            <p className="text-emerald-400 font-bold mb-1">
              {message.metadata?.user}@{message.metadata?.host}:{message.metadata?.path}#
            </p>
            <p className="text-white break-all">{message.content}</p>
          </div>
        </div>
      </div>
    );
  }

  if (message.type === 'warning') {
    return (
      <div className="pl-11 pr-2 w-full animate-fade-in">
        <div className="flex flex-col rounded-xl border border-warning/30 bg-warning/5 p-5 gap-4 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-warning"></div>
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-warning text-[24px] shrink-0 mt-0.5">warning</span>
            <div className="flex flex-col gap-1">
              <p className="text-white text-base font-bold leading-tight">高风险命令警告</p>
              <p className="text-secondary text-sm font-normal leading-normal">
                {message.content.split('rm *.log').map((part, i, arr) => (
                    <React.Fragment key={i}>
                        {part}
                        {i < arr.length - 1 && <code className="font-mono bg-white/10 px-1 rounded mx-1">rm *.log</code>}
                    </React.Fragment>
                ))}
              </p>
            </div>
          </div>
          <div className="flex flex-row items-center gap-3 pt-2 w-full">
            <button className="flex-1 cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-transparent border border-slate-600 text-slate-300 text-sm font-medium hover:bg-slate-800 transition-colors">
              取消
            </button>
            <button className="flex-1 cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-primary hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-900/20 transition-colors">
              确认执行
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Standard Text Message
  return (
    <div className={`flex items-end gap-3 w-full animate-fade-in ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="size-8 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-primary shrink-0 flex items-center justify-center shadow-lg">
          <span className="material-symbols-outlined text-white text-[18px]">smart_toy</span>
        </div>
      )}

      <div className={`flex flex-col gap-1 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-3 shadow-md text-base leading-normal ${
            isUser
              ? 'bg-primary text-white rounded-2xl rounded-tr-sm'
              : 'bg-surface text-slate-100 rounded-2xl rounded-tl-sm border border-slate-700/50'
          }`}
        >
          {message.image && (
             <img src={message.image} alt="User upload" className="mb-2 rounded-lg max-h-48 object-cover border border-white/10" />
          )}
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        <span className="text-secondary text-[11px] font-medium px-1">
          {isUser ? '你' : '影梭 AI'} • {message.timestamp}
        </span>
      </div>

      {isUser && (
        <div className="size-8 rounded-full bg-slate-700 shrink-0 overflow-hidden bg-center bg-cover border border-white/10" style={{backgroundImage: 'url("https://picsum.photos/100/100")'}}></div>
      )}
    </div>
  );
};

export default ChatBubble;
