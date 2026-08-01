import React, { useState, useEffect } from 'react';
import { Play, Pause, Eye, ShieldCheck, Video, CheckCircle2, TrendingUp, Link as LinkIcon, Users, Lock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProductDemo() {
  const [activeTab, setActiveTab] = useState('evidence');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showBoundingBox, setShowBoundingBox] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  
  // Mock data for the demo
  const mockBlindspot = {
    time: "42:15",
    timestamp_seconds: 2535,
    description: "Missed blind-side runner during defensive transition",
    feedback: "Scan left shoulder before receiving. Body orientation is too square to the ball.",
    severity: "High"
  };

  const handlePlayEvidence = () => {
    setCurrentTime(mockBlindspot.timestamp_seconds - 3);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (!isPlaying && currentTime === 0) {
      setCurrentTime(mockBlindspot.timestamp_seconds - 3);
    }
    setIsPlaying((playing) => !playing);
  };

  useEffect(() => {
    if (!isPlaying) return undefined;

    const interval = window.setInterval(() => {
      setCurrentTime((time) => {
        const nextTime = time + 0.25;
        if (nextTime > mockBlindspot.timestamp_seconds + 4) {
          setIsPlaying(false);
          return mockBlindspot.timestamp_seconds + 4;
        }
        return nextTime;
      });
    }, 250);

    return () => window.clearInterval(interval);
  }, [isPlaying, mockBlindspot.timestamp_seconds]);

  useEffect(() => {
    setShowBoundingBox(
      currentTime >= mockBlindspot.timestamp_seconds &&
      currentTime <= mockBlindspot.timestamp_seconds + 3
    );
  }, [currentTime, mockBlindspot.timestamp_seconds]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-emerald-500/30">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-slate-800/60 bg-slate-900/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-900/0 to-slate-900/0"></div>
        <div className="max-w-6xl mx-auto px-6 py-20 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            New Features Live
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Trust the evidence. <br className="hidden md:block" />
            <span className="text-emerald-400">Prove the progress.</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed">
            SOcceroneman now features timestamped computer-vision evidence, measurable training blocks, and cryptographically secure player reports. Stop guessing, start proving.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={() => setActiveTab('evidence')}
              className={`rounded-full px-6 py-6 text-base ${activeTab === 'evidence' ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'}`}
            >
              <Video className="w-5 h-5 mr-2" />
              Timestamped Evidence
            </Button>
            <Button 
              onClick={() => setActiveTab('reports')}
              className={`rounded-full px-6 py-6 text-base ${activeTab === 'reports' ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'}`}
            >
              <ShieldCheck className="w-5 h-5 mr-2" />
              Secure Player Reports
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        
        {/* Feature 1: Timestamped Evidence */}
        {activeTab === 'evidence' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid lg:grid-cols-12 gap-12 items-start">
              
              <div className="lg:col-span-5 space-y-8">
                <div>
                  <h2 className="text-3xl font-bold mb-4">True Computer Vision</h2>
                  <p className="text-slate-400 leading-relaxed">
                    We replaced LLM guesswork with a real pose-estimation pipeline. Every flagged blindspot is now backed by physical head-swivel tracking and linked directly to the video timestamp.
                  </p>
                </div>
                
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded">High Severity</span>
                        <span className="text-xs font-medium text-slate-500 flex items-center gap-1"><Eye className="w-3 h-3"/> Vision Verified</span>
                      </div>
                      <h3 className="font-semibold text-lg">{mockBlindspot.description}</h3>
                    </div>
                    <span className="text-slate-400 font-mono text-sm bg-slate-950 px-2 py-1 rounded">{mockBlindspot.time}</span>
                  </div>
                  
                  <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/50">
                    <p className="text-sm text-slate-300"><span className="text-emerald-400 font-semibold">Coach Cue:</span> {mockBlindspot.feedback}</p>
                  </div>
                  
                  <Button 
                    onClick={handlePlayEvidence}
                    className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Jump to Evidence
                  </Button>
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 aspect-video group shadow-2xl shadow-emerald-900/10">
                  {/* Simulated Video Player */}
                  <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                    {/* Placeholder for actual video - using a stylized graphic for demo */}
                    <div className="w-full h-full relative bg-[url('https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=2535&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
                    
                    {/* Simulated Bounding Box Overlay */}
                    {showBoundingBox && (
                      <div className="absolute top-[30%] left-[60%] w-32 h-48 border-2 border-emerald-500 bg-emerald-500/10 rounded-lg animate-in fade-in duration-300 pointer-events-none">
                        <div className="absolute -top-6 left-0 bg-emerald-500 text-slate-950 text-xs font-bold px-2 py-0.5 rounded-t shadow-lg">
                          MISSED RUNNER
                        </div>
                        {/* Simulated Pose Tracking Lines */}
                        <div className="absolute top-4 left-1/2 w-0.5 h-12 bg-emerald-400/50"></div>
                        <div className="absolute top-6 left-4 w-24 h-0.5 bg-emerald-400/50"></div>
                      </div>
                    )}
                    
                    {/* Simulated Player Bounding Box */}
                    {showBoundingBox && (
                      <div className="absolute top-[40%] left-[30%] w-24 h-40 border-2 border-rose-500 bg-rose-500/10 rounded-lg animate-in fade-in duration-300 pointer-events-none">
                         <div className="absolute -top-6 left-0 bg-rose-500 text-slate-50 text-xs font-bold px-2 py-0.5 rounded-t shadow-lg">
                          #7 (NO SCAN)
                        </div>
                        {/* Head direction vector */}
                        <div className="absolute top-4 left-1/2 w-16 h-0.5 bg-rose-400 origin-left -rotate-12 shadow-[0_0_8px_rgba(244,63,94,0.8)]"></div>
                      </div>
                    )}

                    {/* Play/Pause Overlay */}
                    <button 
                      onClick={togglePlay}
                      className="absolute inset-0 w-full h-full flex items-center justify-center bg-transparent z-10"
                    >
                      {!isPlaying && (
                        <div className="w-16 h-16 bg-emerald-500/90 text-slate-950 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm transition-transform group-hover:scale-110">
                          <Play className="w-8 h-8 ml-1" />
                        </div>
                      )}
                    </button>
                  </div>
                  
                  {/* Fake Video Controls */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/90 to-transparent p-4 pt-12 flex items-center gap-4 z-20">
                    <button onClick={togglePlay} className="text-slate-200 hover:text-white">
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </button>
                    <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden relative">
                      <div 
                        className="absolute top-0 left-0 h-full bg-emerald-500" 
                        style={{ width: `${(currentTime / 5400) * 100}%` }} // Assume 90 min game
                      ></div>
                      {/* Marker for the blindspot */}
                      <div 
                        className="absolute top-0 w-1.5 h-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,1)]" 
                        style={{ left: `${(mockBlindspot.timestamp_seconds / 5400) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-mono text-slate-300">
                      {Math.floor(currentTime / 60).toString().padStart(2, '0')}:
                      {Math.floor(currentTime % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Interactive evidence simulation — click “Jump to Evidence” to reveal the vision overlay at 42:15.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feature 2: Secure Reports */}
        {activeTab === 'reports' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid lg:grid-cols-12 gap-12 items-start">
              
              <div className="lg:col-span-5 space-y-8">
                <div>
                  <h2 className="text-3xl font-bold mb-4">Cryptographic Player Reports</h2>
                  <p className="text-slate-400 leading-relaxed">
                    Generate read-only, time-limited report links for your players. Every link is strictly scoped to the coach's approved evidence—ensuring data privacy and preventing cross-coach leaks.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Coach-Approved Only</h4>
                      <p className="text-sm text-slate-400">Players only see blindspots you explicitly approve. Raw AI drafts are never exposed.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 shrink-0">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Immutable Match Scope</h4>
                      <p className="text-sm text-slate-400">The report is locked to the matches available at creation time. New matches aren't auto-shared.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Zero-Leak Architecture</h4>
                      <p className="text-sm text-slate-400">Tokens are cryptographically bound to the coach's ID. You can never accidentally share another coach's data.</p>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={() => setReportModalOpen(true)}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold py-6 rounded-xl text-lg shadow-lg shadow-emerald-500/20"
                >
                  <LinkIcon className="w-5 h-5 mr-2" />
                  Generate Demo Report Link
                </Button>
              </div>

              <div className="lg:col-span-7">
                {/* Mock Player Report View */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[600px]">
                  {/* Browser Bar */}
                  <div className="bg-slate-950 border-b border-slate-800 p-3 flex items-center gap-4">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-rose-500/50"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
                      <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
                    </div>
                    <div className="flex-1 bg-slate-900 rounded-md px-3 py-1.5 text-xs text-slate-500 font-mono flex items-center gap-2">
                      <Lock className="w-3 h-3 text-emerald-500" />
                      socceroneman.com/report/x7f9a2...
                    </div>
                  </div>
                  
                  {/* Report Content */}
                  <div className="p-8 overflow-y-auto flex-1 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-800/30 via-slate-900 to-slate-900">
                    <div className="flex justify-between items-end mb-8">
                      <div>
                        <div className="text-emerald-400 text-sm font-bold tracking-wider mb-2">READ-ONLY REPORT</div>
                        <h2 className="text-3xl font-bold">Player #7</h2>
                      </div>
                      <div className="text-right">
                        <div className="text-slate-400 text-sm mb-1">Valid until</div>
                        <div className="font-mono text-sm">Aug 30, 2026</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-8">
                      <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4">
                        <div className="text-slate-400 text-sm mb-2">Matches Analyzed</div>
                        <div className="text-3xl font-bold">4</div>
                      </div>
                      <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4">
                        <div className="text-slate-400 text-sm mb-2">Approved Blindspots</div>
                        <div className="text-3xl font-bold">12</div>
                      </div>
                      <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4">
                        <div className="text-slate-400 text-sm mb-2">Avg Scan Quality</div>
                        <div className="text-3xl font-bold text-amber-400">Fair</div>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                      Active Training Block
                    </h3>
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-6 mb-8">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold text-lg">Shoulder Scanning (4 Weeks)</h4>
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold">IN PROGRESS</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2 mb-2">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '50%' }}></div>
                      </div>
                      <div className="text-sm text-slate-400">4 of 8 sessions completed</div>
                    </div>
                    
                    <h3 className="text-xl font-semibold mb-4">Recent Verified Events</h3>
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-4 p-4 bg-slate-950/50 border border-slate-800 rounded-xl">
                          <div className="w-12 h-12 rounded-lg bg-slate-900 flex items-center justify-center font-mono text-sm text-slate-400 shrink-0">
                            {40 + i}:15
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">Missed blind-side runner</h4>
                            <p className="text-xs text-slate-500 mt-1">Match vs Riverside U18</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Share Modal Demo */}
      {reportModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-bold">Share Player Report</h3>
              <button onClick={() => setReportModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-100">
                Link generated successfully. This link is scoped to <strong>4 matches</strong> and expires in <strong>30 days</strong>.
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Secure Link</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value="https://socceroneman.com/report/x7f9a2b4c6d8e0f1" 
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-slate-300 focus:outline-none"
                  />
                  <Button className="bg-slate-800 hover:bg-slate-700 text-white">Copy</Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <div className="font-medium text-sm">Active Link</div>
                  <div className="text-xs text-slate-500 mt-0.5">Expires Aug 30, 2026</div>
                </div>
                <Button variant="destructive" size="sm" className="bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/20">
                  Revoke Access
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
