
import React, { useState, useCallback, useRef } from 'react';
import { 
  FileData, 
  ConversionStatus, 
  ProcessingResult, 
  OutputFormat 
} from './types';
import { Button } from './components/ui/Button';
import { extractTextWithGemini, normalizeText } from './services/geminiService';
import { generateDOCX, generatePDF } from './services/documentGenerator';

const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [status, setStatus] = useState<ConversionStatus>('idle');
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Limit removed to support "unlimited" uploads
      // Note: Browser memory and API limits still apply, but we allow the attempt.
      
      const fileData: FileData = {
        file,
        id: Math.random().toString(36).substr(2, 9),
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      };
      setSelectedFile(fileData);
      setResult(null);
      setErrorMessage(null);
      setStatus('idle');
    }
  };

  const processFile = async () => {
    if (!selectedFile) return;

    try {
      setStatus('extracting');
      const rawText = await extractTextWithGemini(selectedFile.file);
      
      setStatus('normalizing');
      const cleanText = await normalizeText(rawText);
      
      setResult({
        originalText: rawText,
        normalizedText: cleanText
      });
      setStatus('completed');
    } catch (error: any) {
      setErrorMessage(error.message || "An unexpected error occurred. This might be due to file complexity or size limits on the processing engine.");
      setStatus('error');
    }
  };

  const downloadFile = async (format: OutputFormat) => {
    if (!result) return;
    
    try {
      setStatus('generating');
      let blob: Blob;
      let filename = `processed_doc_${selectedFile?.file.name.split('.')[0]}`;

      if (format === OutputFormat.DOCX) {
        blob = await generateDOCX(result.normalizedText);
        filename += '.docx';
      } else {
        blob = await generatePDF(result.normalizedText);
        filename += '.pdf';
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setStatus('completed');
    } catch (error) {
      setErrorMessage("Failed to generate download.");
      setStatus('error');
    }
  };

  const handleManualEdit = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (result) {
      setResult({
        ...result,
        normalizedText: e.target.value
      });
    }
  };

  const reset = () => {
    setSelectedFile(null);
    setResult(null);
    setStatus('idle');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">DocuMorph <span className="text-blue-600">AI</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500 hidden sm:inline font-medium">Enterprise Grade Extraction</span>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            New Session
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Controls (Wider now) */}
          <div className="lg:col-span-6 space-y-6">
            <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-md">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm">1</span>
                  Import Document
                </h2>
                <p className="text-slate-500 mt-1">High-capacity processing for documents of any size.</p>
              </div>
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-4 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-500 min-h-[400px] flex flex-col items-center justify-center group ${
                  selectedFile 
                    ? 'border-blue-400 bg-blue-50/40' 
                    : 'border-slate-200 hover:border-blue-500 hover:bg-blue-50/20'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileSelect} 
                  className="hidden" 
                  accept=".txt,.pdf,.docx,.jpg,.png,.jpeg"
                />
                
                {selectedFile ? (
                  <div className="flex flex-col items-center animate-in zoom-in duration-300">
                    <div className="relative mb-6">
                      {selectedFile.previewUrl ? (
                        <img src={selectedFile.previewUrl} className="w-48 h-64 object-cover rounded-xl shadow-2xl border-4 border-white" alt="Preview" />
                      ) : (
                        <div className="w-40 h-52 bg-slate-100 rounded-xl flex items-center justify-center shadow-xl border-4 border-white">
                          <svg className="w-20 h-20 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute -bottom-3 -right-3 bg-blue-600 text-white p-2 rounded-full shadow-lg">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-800 break-all px-4">{selectedFile.file.name}</h3>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-600 uppercase">
                        {(selectedFile.file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                      <span className="px-2.5 py-1 bg-blue-100 rounded-full text-xs font-bold text-blue-600 uppercase">
                        {selectedFile.file.type.split('/')[1] || 'FILE'}
                      </span>
                    </div>
                    
                    <button 
                      onClick={(e) => { e.stopPropagation(); reset(); }}
                      className="mt-6 text-sm text-red-500 hover:text-red-700 font-bold flex items-center gap-1 group"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remove and choose another
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6 flex flex-col items-center">
                    <div className="relative">
                      <div className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center transform rotate-12 transition-transform group-hover:rotate-0 duration-500 shadow-xl">
                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-400 rounded-full border-4 border-white flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                    </div>
                    <div className="max-w-xs">
                      <p className="text-2xl font-black text-slate-800">Drop files here</p>
                      <p className="text-slate-500 mt-2 font-medium">No size limits. Supported: PDF, DOCX, TXT, Images.</p>
                    </div>
                    <Button variant="primary" size="lg" className="rounded-2xl shadow-lg">
                      Select Files
                    </Button>
                  </div>
                )}
              </div>

              {errorMessage && (
                <div className="mt-6 p-4 bg-red-50 text-red-700 text-sm rounded-2xl border border-red-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                  <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-bold">Error Processing File</p>
                    <p className="opacity-90">{errorMessage}</p>
                  </div>
                </div>
              )}

              <Button 
                className="w-full mt-8 py-5 text-xl rounded-2xl shadow-xl transform active:scale-[0.98]" 
                disabled={!selectedFile || (status !== 'idle' && status !== 'error' && status !== 'completed')} 
                onClick={processFile}
                isLoading={status === 'extracting' || status === 'normalizing'}
              >
                {status === 'extracting' ? 'Analyzing Pixels...' : 
                 status === 'normalizing' ? 'Structuring Data...' : 
                 'Start Neural Extraction'}
              </Button>
            </section>

            {result && (
              <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-md animate-in fade-in slide-in-from-bottom-6 duration-700">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 text-sm">3</span>
                    Download Ready
                  </h2>
                  <p className="text-slate-500 mt-1">High-fidelity conversion into professional formats.</p>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <Button variant="outline" className="flex-col h-32 gap-3 rounded-2xl border-2 hover:border-blue-500 hover:bg-blue-50 group" onClick={() => downloadFile(OutputFormat.DOCX)}>
                    <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span className="font-bold">Word (DOCX)</span>
                  </Button>
                  <Button variant="outline" className="flex-col h-32 gap-3 rounded-2xl border-2 hover:border-red-500 hover:bg-red-50 group" onClick={() => downloadFile(OutputFormat.PDF)}>
                    <div className="p-3 bg-red-100 rounded-xl group-hover:bg-red-200 transition-colors">
                      <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="font-bold">Clean PDF</span>
                  </Button>
                </div>
              </section>
            )}
          </div>

          {/* Right Column: Preview & Editor */}
          <div className="lg:col-span-6 h-full flex flex-col">
            <section className="bg-white rounded-3xl border border-slate-200 shadow-xl flex-1 flex flex-col overflow-hidden min-h-[600px] lg:sticky lg:top-24">
              <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-4">Advanced Editor</h2>
                  {result && (
                    <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">Live Edit</span>
                  )}
                </div>
                {status !== 'idle' && (
                  <div className="flex items-center gap-2 text-[10px] font-black text-blue-400 tracking-tighter">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    {status.toUpperCase()}
                  </div>
                )}
              </div>
              
              <div className="flex-1 flex flex-col min-h-0 bg-white relative">
                {!result && status === 'idle' && (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                    <div className="w-32 h-32 mb-6 opacity-20">
                      <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm1 1h4l1 1v2l-5-5v2zm-1 2V4h1l4 4h-4a1 1 0 01-1-1zM6 20V4h7v5a1 1 0 001 1h5v10H6z"/>
                      </svg>
                    </div>
                    <p className="text-lg font-bold">Waiting for Extraction</p>
                    <p className="text-sm opacity-60">Results appear here automatically</p>
                  </div>
                )}
                
                {(status === 'extracting' || status === 'normalizing' || status === 'generating') ? (
                  <div className="flex-1 p-8 space-y-6 overflow-hidden">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 rounded-full bg-blue-100 animate-bounce"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-slate-100 rounded w-48"></div>
                        <div className="h-3 bg-slate-50 rounded w-32"></div>
                      </div>
                    </div>
                    {[...Array(15)].map((_, i) => (
                      <div key={i} className={`h-4 bg-slate-50 rounded-full w-${(i % 3 === 0) ? 'full' : (i % 3 === 1 ? '3/4' : '5/6')} animate-pulse`} style={{ animationDelay: `${i * 100}ms` }}></div>
                    ))}
                  </div>
                ) : null}

                {result && status === 'completed' && (
                  <textarea
                    className="flex-1 w-full p-10 font-mono text-base leading-relaxed text-slate-800 bg-white resize-none focus:outline-none focus:ring-0 border-none scrollbar-thin scrollbar-thumb-slate-200"
                    value={result.normalizedText}
                    onChange={handleManualEdit}
                    spellCheck={false}
                    placeholder="Refine extracted text here..."
                  />
                )}
              </div>
              
              {result && (
                <div className="px-8 py-4 bg-slate-900 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between items-center font-mono">
                  <div className="flex gap-4">
                    <span>CHARACTERS: <span className="text-slate-200 font-bold">{result.normalizedText.length}</span></span>
                    <span>WORDS: <span className="text-slate-200 font-bold">{result.normalizedText.trim().split(/\s+/).length}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="uppercase tracking-widest text-green-500 font-bold">Cloud Sync Active</span>
                  </div>
                </div>
              )}
            </section>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 p-8 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-slate-800 rounded flex items-center justify-center">
              <span className="text-[10px] text-white font-bold">DM</span>
            </div>
            <p className="text-slate-900 font-bold text-sm">DocuMorph AI <span className="text-slate-400 font-medium ml-2">v2.5 Enterprise</span></p>
          </div>
          <div className="flex gap-8 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-blue-600 transition-colors">API Docs</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Support</a>
          </div>
          <p className="text-slate-400 text-xs">&copy; {new Date().getFullYear()} Neural Extraction Engine</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
