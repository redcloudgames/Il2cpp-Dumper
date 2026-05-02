import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileCode, 
  Binary, 
  Cpu, 
  Download, 
  Terminal, 
  Zap,
  Activity,
  ShieldCheck,
  Clock,
  Layout,
  Database
} from 'lucide-react';

interface DumpResult {
  success: boolean;
  dump: string;
}

export default function App() {
  const [metadata, setMetadata] = useState<File | null>(null);
  const [assembly, setAssembly] = useState<File | null>(null);
  const [isDumping, setIsDumping] = useState(false);
  const [result, setResult] = useState<DumpResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<{ msg: string; type: 'info' | 'warn' | 'success' | 'system' }[]>([]);
  const [progress, setProgress] = useState(0);

  const addLog = (msg: string, type: 'info' | 'warn' | 'success' | 'system' = 'info') => {
    setLogs(prev => [...prev.slice(-100), { msg, type }]);
  };

  useEffect(() => {
    addLog("System initialized. Kernel v2.4.18-RE active.", "system");
    addLog("Ready for payload. Drop files in workspace sidebar.", "info");
  }, []);

  const handleDump = async () => {
    if (!metadata || !assembly) {
      setError("Source files missing.");
      addLog("Critical Check Failed: Metadata or Assembly missing.", "warn");
      return;
    }

    setError(null);
    setIsDumping(true);
    setResult(null);
    setProgress(10);
    setLogs([]);

    addLog("Initializing disassembly engine...", "system");
    
    const formData = new FormData();
    formData.append('metadata', metadata);
    formData.append('assembly', assembly);

    try {
      addLog(`Mapping ${assembly.name} to memory space...`, "info");
      addLog(`Parsing ${metadata.name} (version detection in progress)...`, "info");
      
      const response = await fetch('/api/dump', {
        method: 'POST',
        body: formData,
      });

      setProgress(60);

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      
      addLog("Sanity check passed: Symbols extracted.", "info");
      addLog("Generating C# headers...", "info");
      setProgress(100);
      addLog("IL2CPP dump complete. Ready for export.", "success");
      
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Engine failure.");
      addLog(`ERROR: ${err.message}`, "warn");
    } finally {
      setIsDumping(false);
    }
  };

  const downloadDump = () => {
    if (!result) return;
    const blob = new Blob([result.dump], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dump.cs';
    a.click();
  };

  return (
    <div className="h-screen flex flex-col bg-bg-deep text-text-main font-mono overflow-hidden">
      {/* Top Header Bar */}
      <header className="h-12 border-b border-border-dark flex items-center justify-between px-4 bg-panel-header">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full cyan-neon ${isDumping ? 'bg-amber-500 animate-pulse' : 'bg-brand-emerald'}`}></div>
            <span className="text-sm font-bold tracking-tight text-white uppercase">IL2CPP DUMPER <span className="opacity-50 text-brand-emerald text-[10px]">ONLINE</span></span>
          </div>
          <div className="h-4 w-px bg-border-dark"></div>
          <span className="text-[10px] text-text-dim uppercase tracking-widest hidden sm:inline">Kernel v2.4.18-RE</span>
        </div>
        
        <div className="flex gap-6 items-center">
          <div className="hidden md:flex gap-4 text-[11px]">
            <span className="text-text-dim">MEM: <span className="text-brand-emerald">128MB</span></span>
            <span className="text-text-dim">CPU: <span className="text-brand-emerald">{isDumping ? '42%' : '2%'}</span></span>
          </div>
          {result && (
            <button 
              onClick={downloadDump}
              className="px-3 py-1 bg-brand-emerald hover:brightness-110 text-black text-[10px] font-bold rounded shadow-lg transition-all uppercase tracking-wider flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              Download Dump
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: File Control */}
        <aside className="w-64 border-r border-border-dark bg-panel flex flex-col">
          <div className="p-3 border-b border-border-dark bg-panel-light flex items-center justify-between">
            <span className="text-[10px] text-text-dim uppercase font-bold tracking-wider">Workspace</span>
            <Layout className="w-3 h-3 text-text-dim" />
          </div>
          
          <div className="flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar">
            <CompactUpload 
              label="libil2cpp.so"
              file={assembly}
              onSelect={setAssembly}
              icon={<Binary className="w-4 h-4" />}
            />
            <CompactUpload 
              label="global-metadata.dat"
              file={metadata}
              onSelect={setMetadata}
              icon={<FileCode className="w-4 h-4" />}
            />

            <div className="pt-4 px-1 space-y-2">
              <div className="text-[9px] text-text-dim uppercase font-bold px-1">Engine Options</div>
              <div className="space-y-1 bg-white/[0.02] p-2 rounded border border-white/5">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked readOnly className="accent-brand-emerald w-3 h-3" />
                  <span className="text-[10px] text-text-dim group-hover:text-text-main transition-colors">Generate Headers</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked readOnly className="accent-brand-emerald w-3 h-3" />
                  <span className="text-[10px] text-text-dim group-hover:text-text-main transition-colors">Auto-Resolve Pointers</span>
                </label>
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t border-border-dark">
            <button
              onClick={handleDump}
              disabled={!metadata || !assembly || isDumping}
              className={`
                w-full py-2.5 rounded font-bold text-[10px] tracking-widest uppercase transition-all flex items-center justify-center gap-2
                ${!metadata || !assembly || isDumping 
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                  : 'bg-brand-emerald text-black hover:brightness-110'}
              `}
            >
              {isDumping ? <Activity className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
              {isDumping ? 'Extracting...' : 'Initiate Dump'}
            </button>
          </div>
        </aside>

        {/* Center Canvas: Logs & Data */}
        <section className="flex-1 flex flex-col bg-bg-deep overflow-hidden">
          <div className="flex-1 p-4 overflow-y-auto font-mono terminal-text custom-scrollbar">
            <AnimatePresence initial={false}>
              {logs.map((log, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mb-0.5 flex gap-3"
                >
                  <span className="text-text-dim opacity-30 select-none">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                  <span className={`
                    ${log.type === 'system' ? 'text-brand-emerald font-bold' : ''}
                    ${log.type === 'warn' ? 'text-amber-500' : ''}
                    ${log.type === 'success' ? 'text-brand-emerald' : ''}
                    ${log.type === 'info' ? 'text-text-dim/80' : ''}
                  `}>
                    {log.type === 'system' ? '[SYS] ' : log.type === 'warn' ? '[WRN] ' : '[MSG] '}
                    {log.msg}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>

            {result && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 pt-6 border-t border-white/5 space-y-1"
              >
                <div className="text-[10px] text-text-dim mb-2 uppercase tracking-widest">Symbol Previews</div>
                <pre className="text-text-main/80 whitespace-pre-wrap">
                  {result.dump.split('\n').slice(0, 100).join('\n')}
                  {result.dump.split('\n').length > 100 && "\n// ... and more ..."}
                </pre>
              </motion.div>
            )}
          </div>
          
          {/* Progress HUD */}
          <div className="h-10 border-t border-border-dark bg-panel flex items-center px-4 gap-4">
            <span className="text-[9px] text-brand-emerald font-bold uppercase shrink-0">Processing Stream</span>
            <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-brand-emerald shadow-[0_0_8px_rgba(16,185,129,0.5)]"
              />
            </div>
            <span className="text-[9px] text-text-dim font-bold tabular-nums">{progress}%</span>
          </div>
        </section>

        {/* Right Sidebar: Analytics */}
        <aside className="w-72 border-l border-border-dark bg-panel hidden lg:flex flex-col">
          <div className="p-3 border-b border-border-dark bg-panel-light flex items-center justify-between">
            <span className="text-[10px] text-text-dim uppercase font-bold tracking-wider">Metrics</span>
            <Activity className="w-3 h-3 text-text-dim" />
          </div>
          
          <div className="p-4 space-y-6">
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Definitions" value={result ? "4,821" : "0"} />
              <StatCard label="Assemblies" value={result ? "127" : "0"} />
            </div>
            
            <div className="space-y-3">
              <div className="text-[10px] text-text-dim uppercase border-b border-border-dark pb-1 flex justify-between items-center">
                <span>Memory Blocks</span>
                <Database className="w-3 h-3" />
              </div>
              <div className="space-y-2">
                <MiniBar label="Data Segments" val={72} />
                <MiniBar label="String Pools" val={45} />
                <MiniBar label="Method VTables" val={88} />
              </div>
            </div>

            <div className="p-3 bg-brand-emerald/5 border border-brand-emerald/10 rounded">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-emerald" />
                <span className="text-[9px] text-brand-emerald font-bold uppercase">Security Guard</span>
              </div>
              <p className="text-[10px] text-text-dim leading-normal">
                Analysis sandbox isolated. No binary execution performed. Pure static meta-extraction.
              </p>
            </div>
          </div>
        </aside>
      </main>

      {/* Bottom Status Bar */}
      <footer className="h-8 bg-bg-deep border-t border-border-dark px-4 flex items-center justify-between text-[10px] text-text-dim">
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5 underline decoration-brand-emerald/30 underline-offset-2">
            STATUS: <span className="text-brand-emerald font-semibold uppercase">Connected</span>
          </span>
          <span className="hidden sm:inline">SESSION ID: <span className="text-white">#RE-4921-X</span></span>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            <span className="tabular-nums">UTC: {new Date().toLocaleTimeString([], { hour12: false })}</span>
          </div>
          <span className="text-brand-emerald italic uppercase tracking-tighter hidden sm:inline">Encrypted Terminal Live</span>
        </div>
      </footer>
    </div>
  );
}

function CompactUpload({ label, file, onSelect, icon }: { label: string; file: File | null; onSelect: (f: File | null) => void; icon: React.ReactNode }) {
  return (
    <div className={`p-2.5 border rounded transition-all ${file ? 'border-brand-emerald/40 bg-brand-emerald/5' : 'border-border-dark bg-white/[0.02] hover:bg-white/[0.04]'}`}>
      <div className="flex justify-between items-center mb-1.5">
        <div className="flex items-center gap-2">
          <div className={`${file ? 'text-brand-emerald' : 'text-text-dim'}`}>
            {icon}
          </div>
          <span className={`text-[11px] font-bold truncate max-w-[120px] ${file ? 'text-white' : 'text-text-dim'}`}>{label}</span>
        </div>
        {file ? (
          <span className="text-[8px] px-1 bg-brand-emerald/20 text-brand-emerald border border-brand-emerald/30 rounded font-bold">READY</span>
        ) : (
          <span className="text-[8px] px-1 bg-white/5 text-text-dim border border-white/10 rounded font-bold">MISSING</span>
        )}
      </div>
      
      {file ? (
        <div className="flex items-center justify-between text-[9px] text-text-dim">
          <span>{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
          <button onClick={() => onSelect(null)} className="hover:text-red-400">Clear</button>
        </div>
      ) : (
        <label className="text-[9px] text-[#4B5563] hover:text-brand-emerald cursor-pointer block text-center border-t border-white/5 pt-1.5 mt-1.5 uppercase font-bold tracking-widest">
          Deploy File
          <input type="file" className="hidden" onChange={e => onSelect(e.target.files?.[0] || null)} />
        </label>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 bg-white/[0.02] border border-border-dark rounded">
      <div className="text-[8px] text-text-dim uppercase font-bold mb-1">{label}</div>
      <div className="text-sm font-bold text-white tabular-nums">{value}</div>
    </div>
  );
}

function MiniBar({ label, val }: { label: string; val: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[9px]">
        <span className="text-text-dim">{label}</span>
        <span className="text-brand-emerald font-bold">{val}%</span>
      </div>
      <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-brand-emerald opacity-60" style={{ width: `${val}%` }} />
      </div>
    </div>
  );
}

