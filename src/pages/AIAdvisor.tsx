import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

export const AIAdvisor: React.FC = () => {
  const { lastMessage, status } = useWebSocket();
  const [chatLog, setChatLog] = useState<{ id: number; text: React.ReactNode; isUser: boolean; time: string }[]>([
    {
      id: 1,
      isUser: false,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: (
        <>
          <p className="mb-4">Hello! I am your AI Advisor. I'm connected to your Smart Cushion and analyzing your ergonomics in real-time.</p>
          <p>Sit back and work normally. I'll let you know if I detect any prolonged poor posture.</p>
        </>
      )
    }
  ]);

  const posture = lastMessage?.posture ?? 'EMPTY';
  const occupancy = lastMessage?.occupancy_state ?? 'empty';

  // Proactive AI logic based on live data
  useEffect(() => {
    if (status !== 'connected' || occupancy !== 'occupied') return;

    // A simple timeout to trigger AI advice if a bad posture is sustained
    // In a real app, this would rely on the backend alert_status or sustained duration
    if (lastMessage?.alert_status === 'WARNING' && lastMessage?.alert_active) {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // Prevent spamming the same message
      setChatLog(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && !lastMsg.isUser && lastMsg.time === now) return prev;

        let advice = "";
        if (posture === 'FORWARD') advice = "I notice you are leaning forward. This often correlates with 'mouse arm fatigue'. I recommend a quick reset: focus on retracting your shoulders.";
        else if (posture === 'BACKWARD') advice = "You're leaning quite far back. Make sure your lower back is supported by the chair.";
        else if (posture === 'RIGHT' || posture === 'LEFT') advice = "I detect an uneven lateral lean. This can misalign your spine over time. Try to center your weight evenly.";
        else advice = "I'm detecting some postural deviation. Please sit upright.";

        return [...prev, {
          id: Date.now(),
          isUser: false,
          time: now,
          text: (
            <>
              <p className="mb-4">{advice}</p>
              <div className="bg-secondary/10 p-4 rounded-xl border border-secondary/10 flex items-start gap-3 backdrop-blur-sm">
                <span className="material-symbols-outlined text-secondary">lightbulb</span>
                <p className="text-sm italic text-secondary">Clinical Insight: Sustained poor posture increases pressure on your vertebrae.</p>
              </div>
            </>
          )
        }];
      });
    }
  }, [lastMessage?.alert_count, status, occupancy, posture, lastMessage?.alert_status, lastMessage?.alert_active]);

  const [inputStr, setInputStr] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  // Helper to get the API URL (same as History API)
  const getApiUrl = () => {
    // We already set this in .env as VITE_API_BASE_URL
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8766';
    return `${baseUrl}/advisor/chat`;
  };

  const handleSend = async () => {
    if (!inputStr.trim() || isThinking) return;
    
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = inputStr;
    
    // Add user message to log
    setChatLog(prev => [...prev, { id: Date.now(), isUser: true, time: now, text: <p>{userMsg}</p> }]);
    setInputStr("");
    setIsThinking(true);

    try {
      const response = await fetch(getApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMsg })
      });

      if (!response.ok) throw new Error("Failed to reach AI Advisor");
      const data = await response.json();
      
      setChatLog(prev => [...prev, {
        id: Date.now(),
        isUser: false,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: (
          <div>
            <p className="mb-2 whitespace-pre-wrap">{data.response}</p>
            <p className="text-[10px] opacity-50 italic">AI advice generated locally using sensor telemetry.</p>
          </div>
        )
      }]);
    } catch (err) {
      console.error(err);
      setChatLog(prev => [...prev, {
        id: Date.now(),
        isUser: false,
        time: now,
        text: <p className="text-error">Sorry, I'm having trouble thinking right now. Is Ollama running?</p>
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-4 md:p-12">
      <header className="flex justify-between items-center w-full mb-8 md:mb-12">
        <h1 className="text-xl md:text-2xl font-black tracking-tighter text-on-surface">AI Advisor</h1>
        <div className="flex items-center gap-4 md:gap-8">
          <nav className="hidden md:flex items-center gap-6">
            <a className="text-on-surface/60 hover:text-primary transition-colors duration-200 font-medium tracking-tight" href="#">Support</a>
            <a className="text-on-surface/60 hover:text-primary transition-colors duration-200 font-medium tracking-tight" href="#">Docs</a>
          </nav>
          <div className="flex items-center gap-3 md:gap-4">
            <span className="material-symbols-outlined text-on-surface/60 cursor-pointer text-xl md:text-2xl">notifications</span>
            <div className="w-8 h-8 rounded-full bg-surface-container-high overflow-hidden">
              <img 
                className="w-full h-full object-cover" 
                alt="User headshot" 
                src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=2070&auto=format&fit=crop" 
              />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto w-full">
        <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] overflow-hidden border border-outline-variant/10 shadow-[0_20px_40px_rgba(11,28,48,0.03)] flex flex-col h-[500px] md:h-[700px]">
          <div className="px-4 md:px-8 py-4 md:py-6 border-b border-outline-variant/10 bg-surface-container-low/30 flex items-center justify-between">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-secondary flex items-center justify-center text-white shadow-lg shadow-secondary/20">
                <span className="material-symbols-outlined text-2xl md:text-3xl">psychology</span>
              </div>
              <div>
                <h3 className="font-bold text-sm md:text-lg text-on-surface">AI Advisor</h3>
                <div className="flex items-center gap-1.5 md:gap-2">
                  <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-tertiary animate-pulse"></span>
                  <span className="text-[8px] md:text-xs font-medium text-on-surface/40 uppercase tracking-widest">Live Analysis</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8">
            {chatLog.map(msg => (
              <div key={msg.id} className={`flex gap-2 md:gap-4 items-start max-w-[90%] md:max-w-[85%] ${msg.isUser ? 'ml-auto flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm ${msg.isUser ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>
                  <span className="material-symbols-outlined text-xs md:text-sm">{msg.isUser ? 'person' : 'auto_awesome'}</span>
                </div>
                <div className={`space-y-1 ${msg.isUser ? 'items-end flex flex-col' : ''}`}>
                  <div className={`p-4 md:p-5 rounded-[1.5rem] md:rounded-[2rem] text-[13px] md:text-base text-on-surface leading-relaxed ${
                    msg.isUser 
                      ? 'bg-primary text-white rounded-tr-none' 
                      : 'bg-secondary/5 border border-secondary/10 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                  <span className="text-[8px] md:text-[10px] text-on-surface/40 uppercase tracking-widest px-2">{msg.time}</span>
                </div>
              </div>
            ))}
            
            {isThinking && (
              <div className="flex gap-2 md:gap-4 items-start max-w-[90%] md:max-w-[85%] animate-pulse">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0 text-secondary">
                  <span className="material-symbols-outlined text-xs md:text-sm">psychology</span>
                </div>
                <div className="bg-secondary/5 border border-secondary/10 p-4 md:p-5 rounded-[1.5rem] md:rounded-[2rem] rounded-tl-none">
                  <div className="flex gap-1">
                    <span className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-secondary/40 animate-bounce"></span>
                    <span className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-secondary/40 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-secondary/40 animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 md:p-8 bg-white border-t border-outline-variant/10">
            <div className="hidden sm:flex flex-wrap gap-2 md:gap-3 mb-6 md:mb-8 justify-center">
              {[
                'How do I fix my mouse position?',
                'Show my fatigue map',
                'Stretch reminder'
              ].map((text, i) => (
                <button key={i} className="px-4 md:px-6 py-2 md:py-2.5 rounded-full border border-outline-variant/30 text-[10px] md:text-sm font-medium hover:bg-surface-container-low transition-all text-on-surface/70">
                  {text}
                </button>
              ))}
            </div>
            <div className="flex flex-col items-center gap-4">
              <button 
                onClick={() => handleSend()} 
                className="w-full sm:hidden bg-secondary text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-secondary/20">
                Analyze Posture
              </button>
              <div className="w-full flex items-center gap-2 md:gap-4 bg-surface-container-low px-4 md:px-6 py-1 md:py-2 rounded-xl md:rounded-2xl border-b-2 border-outline-variant/50 focus-within:border-secondary transition-colors">
                <input 
                  className="flex-1 bg-transparent border-none focus:ring-0 text-xs md:text-sm py-2 md:py-3 text-on-surface" 
                  placeholder="Ask anything..." 
                  type="text"
                  value={inputStr}
                  onChange={e => setInputStr(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                />
                <button onClick={handleSend} className="p-2 text-secondary">
                  <span className="material-symbols-outlined text-xl md:text-2xl">send</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 mt-8 md:mt-12">
          <div className="md:col-span-8 bg-white p-5 md:p-8 rounded-2xl md:rounded-3xl border border-outline-variant/5 shadow-sm">
            <h4 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-on-surface/40 mb-4 md:mb-6">Biometric Stream</h4>
            <div className="flex justify-between items-end h-24 md:h-32 gap-1 md:gap-2">
              {[60, 40, 80, 95, 70, 50, 85, 90, 65].map((h, i) => (
                <div 
                  key={i} 
                  className={`flex-1 rounded-t-md md:rounded-t-lg transition-all ${i >= 6 && i <= 7 ? 'bg-secondary/40 border-t-2 border-secondary' : 'bg-primary/10'}`} 
                  style={{ height: `${h}%` }}
                ></div>
              ))}
            </div>
          </div>
          <div className="md:col-span-4 bg-secondary/5 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-secondary/10 flex flex-row md:flex-col justify-between items-center md:items-start shadow-sm">
            <div>
              <span className="material-symbols-outlined text-tertiary mb-2 md:mb-4 text-2xl md:text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
              <h4 className="font-bold text-sm md:text-base text-on-surface mb-1">Posture Score</h4>
              <p className="hidden md:block text-xs text-on-surface/60 leading-relaxed">Better than last session.</p>
            </div>
            <div className="text-3xl md:text-4xl font-black text-tertiary tracking-tighter">
              84<span className="text-xs md:text-sm font-normal text-on-surface/40 ml-1">/100</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
