import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Dropzone from './components/Dropzone';
import DocumentViewer from './components/DocumentViewer';
import RiskMatrix from './components/RiskMatrix';
import ChatDrawer from './components/ChatDrawer';
import RedlineViewer from './components/RedlineViewer';
import { ShieldAlert, MessageSquare, Sparkles, Scale, AlertCircle } from 'lucide-react';

const API_BASE = "http://127.0.0.1:8000/api";

export default function App() {
  const [metadata, setMetadata] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [activeTab, setActiveTab] = useState("risk"); // "risk" | "chat" | "redline"
  
  const [activeClauseId, setActiveClauseId] = useState(null);
  const [selectedClauseForRedline, setSelectedClauseForRedline] = useState(null);
  const [redlineResult, setRedlineResult] = useState(null);

  const [chatMessages, setChatMessages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isChatThinking, setIsChatThinking] = useState(false);
  const [isGeneratingRedline, setIsGeneratingRedline] = useState(false);
  const [systemStatus, setSystemStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Check system status on mount
  useEffect(() => {
    fetchSystemStatus();
  }, []);

  const fetchSystemStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/status`);
      if (res.ok) {
        const data = await res.json();
        setSystemStatus(data);
      }
    } catch (err) {
      console.warn("Backend not yet connected:", err);
    }
  };

  // Upload file handler
  const handleFileUpload = async (file) => {
    setIsUploading(true);
    setErrorMessage(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to upload contract.");
      }

      const data = await res.json();
      setMetadata(data.metadata);
      setChunks(data.chunks);
      setAnalysis(null);
      setRedlineResult(null);
      setChatMessages([]);
      setActiveClauseId(null);
      setSelectedClauseForRedline(null);

      // Auto-trigger risk audit for seamless DX
      triggerAnalysis(data.chunks);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Load sample contract handler
  const handleLoadSample = async (sampleId) => {
    setIsUploading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`${API_BASE}/sample/${sampleId}`, {
        method: "POST",
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to load sample.");
      }

      const data = await res.json();
      setMetadata(data.metadata);
      setChunks(data.chunks);
      setAnalysis(null);
      setRedlineResult(null);
      setChatMessages([]);
      setActiveClauseId(null);
      setSelectedClauseForRedline(null);

      // Auto-trigger audit
      triggerAnalysis(data.chunks);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Run AI Risk Audit
  const triggerAnalysis = async (loadedChunks) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Analysis failed.");
      }

      const data = await res.json();
      setAnalysis(data.analysis);
      setActiveTab("risk");
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Send message to Chat RAG
  const handleSendMessage = async (queryText) => {
    const userMsg = { role: "user", content: queryText };
    setChatMessages(prev => [...prev, userMsg]);
    setIsChatThinking(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: queryText,
          history: chatMessages.slice(-6).map(m => ({ role: m.role, content: m.content })),
          top_k: 4
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Chat query failed.");
      }

      const data = await res.json();
      const assistantMsg = {
        role: "assistant",
        content: data.answer,
        citations: data.citations || []
      };
      setChatMessages(prev => [...prev, assistantMsg]);

      // If citation exists, highlight first clause
      if (data.citations && data.citations.length > 0) {
        setActiveClauseId(data.citations[0].clause_id);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, {
        role: "assistant",
        content: `Error retrieving response: ${err.message}`
      }]);
    } finally {
      setIsChatThinking(false);
    }
  };

  // Generate Redline
  const handleGenerateRedline = async (redlinePayload) => {
    setIsGeneratingRedline(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`${API_BASE}/redline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(redlinePayload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Redline generation failed.");
      }

      const data = await res.json();
      setRedlineResult(data.redline);
      setActiveTab("redline");
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsGeneratingRedline(false);
    }
  };

  // Jump to specific clause and highlight
  const handleJumpToClause = (clauseId) => {
    setActiveClauseId(clauseId);
  };

  // Select clause and open Redline Tab
  const handleSelectForRedline = (clause) => {
    setSelectedClauseForRedline(clause);
    setActiveClauseId(clause.id || clause.clause_id);
    setActiveTab("redline");
  };

  const handleReset = () => {
    setMetadata(null);
    setChunks([]);
    setAnalysis(null);
    setChatMessages([]);
    setRedlineResult(null);
    setActiveClauseId(null);
    setSelectedClauseForRedline(null);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-main)',
      overflow: 'hidden'
    }}>
      {/* Top Navbar */}
      <Header 
        metadata={metadata}
        analysis={analysis}
        systemStatus={systemStatus}
        onLoadSample={handleLoadSample}
        onTriggerAnalysis={() => triggerAnalysis(chunks)}
        isAnalyzing={isAnalyzing}
        onReset={handleReset}
      />

      {/* Error Alert Banner if any */}
      {errorMessage && (
        <div style={{
          margin: '8px 20px 0 20px',
          padding: '8px 16px',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.82rem',
          color: '#fca5a5'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={15} color="#ef4444" />
            <span>{errorMessage}</span>
          </div>
          <button 
            onClick={() => setErrorMessage(null)} 
            style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Workspace Area */}
      <main style={{
        flex: 1,
        overflow: 'hidden',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {!metadata ? (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <Dropzone 
              onFileUpload={handleFileUpload}
              onLoadSample={handleLoadSample}
              isUploading={isUploading}
            />
          </div>
        ) : (
          /* Split Workspace Layout */
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.05fr 1fr',
            gap: '16px',
            height: '100%',
            overflow: 'hidden'
          }}>
            {/* Left Column: Interactive Document Viewer */}
            <div style={{ height: '100%', overflow: 'hidden' }}>
              <DocumentViewer 
                chunks={chunks}
                metadata={metadata}
                activeClauseId={activeClauseId}
                onSelectForRedline={handleSelectForRedline}
                onClauseClick={(c) => setActiveClauseId(c.id)}
              />
            </div>

            {/* Right Column: Tabbed Intelligence Panel */}
            <div className="glass-panel" style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              overflow: 'hidden',
              border: '1px solid var(--border-subtle)'
            }}>
              {/* Tabs Navigation */}
              <div style={{
                display: 'flex',
                borderBottom: '1px solid var(--border-subtle)',
                background: 'rgba(15, 23, 42, 0.6)',
                padding: '4px 6px'
              }}>
                <button
                  onClick={() => setActiveTab("risk")}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    background: activeTab === "risk" ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                    color: activeTab === "risk" ? '#ffffff' : 'var(--text-muted)',
                    border: 'none',
                    borderBottom: activeTab === "risk" ? '2px solid #6366f1' : '2px solid transparent',
                    borderRadius: '6px 6px 0 0',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <ShieldAlert size={16} color={activeTab === "risk" ? "#818cf8" : "var(--text-dim)"} />
                  <span>Risk Audit Matrix</span>
                </button>

                <button
                  onClick={() => setActiveTab("chat")}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    background: activeTab === "chat" ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                    color: activeTab === "chat" ? '#ffffff' : 'var(--text-muted)',
                    border: 'none',
                    borderBottom: activeTab === "chat" ? '2px solid #6366f1' : '2px solid transparent',
                    borderRadius: '6px 6px 0 0',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <MessageSquare size={16} color={activeTab === "chat" ? "#818cf8" : "var(--text-dim)"} />
                  <span>Co-Pilot Chat</span>
                </button>

                <button
                  onClick={() => setActiveTab("redline")}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    background: activeTab === "redline" ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                    color: activeTab === "redline" ? '#ffffff' : 'var(--text-muted)',
                    border: 'none',
                    borderBottom: activeTab === "redline" ? '2px solid #6366f1' : '2px solid transparent',
                    borderRadius: '6px 6px 0 0',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Scale size={16} color={activeTab === "redline" ? "#818cf8" : "var(--text-dim)"} />
                  <span>Clause Redlines</span>
                </button>
              </div>

              {/* Tab Content Panels */}
              <div style={{ flex: 1, overflow: 'hidden' }}>
                {activeTab === "risk" && (
                  <RiskMatrix 
                    analysis={analysis}
                    onJumpToClause={handleJumpToClause}
                    onSelectForRedline={handleSelectForRedline}
                    isAnalyzing={isAnalyzing}
                    onTriggerAnalysis={() => triggerAnalysis(chunks)}
                  />
                )}

                {activeTab === "chat" && (
                  <ChatDrawer 
                    messages={chatMessages}
                    onSendMessage={handleSendMessage}
                    isThinking={isChatThinking}
                    onJumpToClause={handleJumpToClause}
                  />
                )}

                {activeTab === "redline" && (
                  <RedlineViewer 
                    selectedClause={selectedClauseForRedline}
                    chunks={chunks}
                    onGenerateRedline={handleGenerateRedline}
                    redlineResult={redlineResult}
                    isGenerating={isGeneratingRedline}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
