'use client';

import { useState, useEffect, useRef } from 'react';
import { KulfyIcon } from '@/components/kulfy-icon';

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'prompt' | 'progress';
}

interface GenerationResult {
  success: boolean;
  completed_at?: string;
  summary?: {
    status: string;
    articles_scraped: number;
    concepts_generated: number;
    images_created: number;
    successful_uploads: number;
    failed_uploads: number;
    errors: string[];
    upload_results: Array<{
      success: boolean;
      title: string;
      cid?: string;
      id?: string;
      error?: string;
    }>;
  };
  error?: string;
}

export default function GeneratePage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [urls, setUrls] = useState<string>('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    }]);
  };

  const startGeneration = async () => {
    // Parse URLs from textarea
    const urlList = urls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0);

    // Validate at least one URL
    if (urlList.length === 0) {
      setStatus('error');
      setError('Please enter at least one URL');
      return;
    }

    setIsGenerating(true);
    setStatus('running');
    setError(null);
    setResult(null);
    setLogs([]);
    setCurrentStep('Initializing...');
    setProgress(0);

    addLog(`Starting meme generation with ${urlList.length} URL(s)...`, 'info');
    addLog(`URLs: ${urlList.join(', ')}`, 'info');

    try {
      addLog('🚀 Sending request to Kulfy Agent...', 'info');
      
      const response = await fetch('/api/agent/generate-memes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ count: 5, urls: urlList }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || data.error || 'Failed to start generation');
      }

      addLog('✅ Agent started successfully!', 'success');
      setCurrentStep('Fetching content from URLs...');
      setProgress(10);

      // Poll for status with detailed updates
      pollDetailedStatus();
    } catch (err: any) {
      console.error('Failed to start generation:', err);
      setStatus('error');
      setError(err.message || 'Failed to connect to agent service');
      setIsGenerating(false);
      addLog(`❌ Error: ${err.message}`, 'error');
    }
  };

  const pollDetailedStatus = async () => {
    let pollCount = 0;
    const maxPolls = 200; // 10 minutes max (200 * 3s)
    
    const interval = setInterval(async () => {
      pollCount++;
      
      try {
        const response = await fetch('/api/agent/generate-memes');
        const data = await response.json();

        // Update logs if available
        if (data.logs && data.logs.length > 0) {
          data.logs.forEach((log: any) => {
            // Only add new logs (check if message already exists)
            const isDuplicate = logs.some(existingLog => existingLog.message === log.message);
            if (!isDuplicate) {
              addLog(log.message, log.type || 'info');
            }
          });
        }

        // Update current step
        if (data.current_step) {
          setCurrentStep(data.current_step);
        }

        // Update progress based on status
        if (data.status === 'running' || data.is_running) {
          // Estimate progress based on typical timings
          if (pollCount < 5) {
            if (!data.current_step) setCurrentStep('📥 Fetching content from URLs...');
            setProgress(Math.min(20, pollCount * 4));
          } else if (pollCount < 25) {
            if (!data.current_step) setCurrentStep('🧠 GPT-4 analyzing content and generating concepts...');
            setProgress(Math.min(40, 20 + (pollCount - 5) * 1));
          } else {
            if (!data.current_step) setCurrentStep('🎨 DALL-E 3 generating meme images...');
            const imageProgress = Math.min(85, 40 + (pollCount - 25) * 2);
            setProgress(imageProgress);
          }
        }

        if (data.status === 'idle' || data.status === 'completed' || data.status === 'error') {
          clearInterval(interval);
          setIsGenerating(false);
          
          if (data.last_result) {
            setStatus('completed');
            setResult(data.last_result);
            setProgress(100);
            setCurrentStep('✅ Generation complete!');
            addLog('🎉 Meme generation completed!', 'success');
            
            if (data.last_result.summary) {
              const summary = data.last_result.summary;
              addLog(`📊 Summary: ${summary.successful_uploads}/${summary.images_created} memes uploaded successfully`, 'success');
            }
          } else if (data.status === 'error') {
            setStatus('error');
            setError(data.error || 'Generation failed');
            addLog(`❌ Generation failed: ${data.error}`, 'error');
          }
        }

        // Stop polling after max time
        if (pollCount >= maxPolls) {
          clearInterval(interval);
          setIsGenerating(false);
          setStatus('error');
          setError('Generation timed out after 10 minutes');
          addLog('⏱️ Timeout: Generation took too long', 'error');
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000); // Poll every 3 seconds
  };

  const getStepIcon = (step: string) => {
    if (step.includes('Fetching')) return '📥';
    if (step.includes('GPT-4')) return '🧠';
    if (step.includes('DALL-E')) return '🎨';
    if (step.includes('Uploading')) return '⬆️';
    if (step.includes('complete')) return '✅';
    return '⏳';
  };

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'prompt': return 'text-yellow-300';
      case 'progress': return 'text-blue-400';
      default: return 'text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 relative overflow-hidden py-12 px-4">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Navigation */}
        <div className="mb-6 flex gap-3">
          <a
            href="/feed"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors text-sm"
          >
            ← Back to Feed
          </a>
          <a
            href="/upload"
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors text-sm"
          >
            ⬆️ Upload
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Input */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl sticky top-6">
              <div className="text-center mb-6">
                <div className={`text-6xl mb-4 ${isGenerating ? 'animate-bounce-slow' : ''}`}>
                  {status === 'completed' ? '🎉' : status === 'error' ? '❌' : '🤖'}
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  AI Meme Generator
                </h2>
                <p className="text-sm text-purple-200">
                  Create Telugu memes with AI
                </p>
              </div>

              {status === 'idle' && (
                <>
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-purple-300 mb-2">
                      📰 Article URLs (one per line)
                    </label>
                    <textarea
                      value={urls}
                      onChange={(e) => setUrls(e.target.value)}
                      placeholder="https://www.greatandhra.com/...&#10;https://www.telugu360.com/...&#10;https://www.123telugu.com/..."
                      className="w-full h-32 px-3 py-2 bg-white/10 border border-purple-400/30 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      style={{ fontFamily: 'monospace', fontSize: '11px' }}
                    />
                    <p className="text-xs text-gray-400 mt-2">
                      💡 Paste URLs from Telugu news sites
                    </p>
                  </div>

                  <button
                    onClick={startGeneration}
                    disabled={!urls.trim()}
                    className={`w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-full hover:shadow-lg hover:shadow-green-500/50 transform hover:scale-105 transition-all duration-300 ${
                      !urls.trim() ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    🚀 Generate 5 Memes
                  </button>

                  <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
                    <p className="text-xs text-gray-400 mb-2">📊 Process:</p>
                    <ul className="text-xs text-gray-300 space-y-1">
                      <li>• Fetch content (5s)</li>
                      <li>• GPT-4 analysis (30-60s)</li>
                      <li>• DALL-E images (2-3 min)</li>
                      <li>• Upload to Kulfy (10s)</li>
                    </ul>
                    <p className="text-xs text-orange-300 mt-2 font-semibold">
                      Total: ~3-5 minutes
                    </p>
                  </div>
                </>
              )}

              {status === 'running' && (
                <div className="space-y-4">
                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-white">
                        {getStepIcon(currentStep)} {currentStep}
                      </span>
                      <span className="text-sm font-bold text-purple-300">
                        {progress}%
                      </span>
                    </div>
                    <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center gap-2 text-yellow-300 text-sm mb-2">
                      <KulfyIcon size="sm" className="animate-spin-slow" />
                      <span className="font-semibold">Processing...</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      This takes 3-5 minutes. Keep this page open!
                    </p>
                  </div>
                </div>
              )}

              {status === 'completed' && result && (
                <div className="space-y-4">
                  <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                    <p className="text-green-300 font-semibold text-center">
                      ✅ Generation Complete!
                    </p>
                  </div>

                  {result.summary && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 bg-white/5 rounded-lg text-center">
                        <p className="text-2xl font-bold text-purple-400">
                          {result.summary.concepts_generated || 0}
                        </p>
                        <p className="text-xs text-gray-400">Concepts</p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg text-center">
                        <p className="text-2xl font-bold text-green-400">
                          {result.summary.successful_uploads || 0}
                        </p>
                        <p className="text-xs text-gray-400">Uploaded</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <a
                      href="/admin"
                      className="block w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-full text-center transition-colors text-sm"
                    >
                      👀 Review in Admin
                    </a>
                    <button
                      onClick={() => {
                        setStatus('idle');
                        setResult(null);
                        setUrls('');
                        setLogs([]);
                        setProgress(0);
                      }}
                      className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-full transition-colors text-sm"
                    >
                      🔄 Generate More
                    </button>
                  </div>
                </div>
              )}

              {status === 'error' && (
                <div className="space-y-4">
                  <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                    <p className="text-red-300 font-semibold text-center text-sm">
                      ❌ {error || 'Generation failed'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setStatus('idle');
                      setError(null);
                      setLogs([]);
                    }}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full transition-colors text-sm"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Live Logs & Results */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="animate-pulse">📟</span> Live Console
                </h3>
                {logs.length > 0 && (
                  <button
                    onClick={() => setLogs([])}
                    className="text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    Clear Logs
                  </button>
                )}
              </div>

              {/* Logs */}
              <div className="bg-black/40 rounded-lg p-4 h-[600px] overflow-y-auto font-mono text-xs border border-white/10">
                {logs.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <div className="text-4xl mb-3">💬</div>
                      <p>Logs will appear here when you start generation</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {logs.map((log, index) => (
                      <div key={index} className="flex gap-2">
                        <span className="text-gray-500 flex-shrink-0">[{log.timestamp}]</span>
                        <span className={`${getLogColor(log.type)} break-all`}>
                          {log.message}
                        </span>
                      </div>
                    ))}
                    <div ref={logsEndRef} />
                  </div>
                )}
              </div>

              {/* Generated Memes Preview */}
              {status === 'completed' && result?.summary?.upload_results && result.summary.upload_results.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Generated Memes</h4>
                  <div className="space-y-3">
                    {result.summary.upload_results.map((meme, index) => (
                      <div key={index} className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/10">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{meme.success ? '✅' : '❌'}</span>
                          <div>
                            <p className="text-sm font-semibold text-white">{meme.title}</p>
                            {meme.cid && (
                              <p className="text-xs text-gray-400 font-mono">CID: {meme.cid.substring(0, 20)}...</p>
                            )}
                          </div>
                        </div>
                        {meme.success && meme.id && (
                          <a
                            href={`/kulfy/${meme.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-full transition-colors"
                          >
                            View →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
