import { useState, useRef, useEffect, useCallback } from 'react';
import { apiPost, apiPut, getToken } from '../../api';
import '../../styles/chatbot.css';

const API_BASE = '';

async function chatApiCall(endpoint, body) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const resp = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  return resp.json();
}

function formatResolution(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

export default function ChatSupport() {
  const [messages, setMessages] = useState([]);
  const [inputVisible, setInputVisible] = useState(false);
  const [inputPlaceholder, setInputPlaceholder] = useState('Describe your issue...');
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [disabledGroups, setDisabledGroups] = useState(new Set());
  const chatAreaRef = useRef(null);
  const inputRef = useRef(null);
  const sessionIdRef = useRef(null);
  const stateRef = useRef({
    step: 'welcome',
    sectorKey: null,
    sectorName: null,
    subprocessKey: null,
    subprocessName: null,
    language: 'English',
    queryText: '',
    resolution: '',
  });
  const msgIdCounter = useRef(0);

  const nextId = () => ++msgIdCounter.current;

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (chatAreaRef.current) {
        chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
      }
    }, 100);
  }, []);

  const addMessage = useCallback((msg) => {
    const id = nextId();
    const groupId = msg.groupId || id;
    setMessages(prev => [...prev, { ...msg, id, groupId }]);
    scrollToBottom();
    return groupId;
  }, [scrollToBottom]);

  const disableGroup = useCallback((groupId) => {
    setDisabledGroups(prev => new Set([...prev, groupId]));
  }, []);

  const showInput = useCallback((placeholder) => {
    setInputVisible(true);
    setInputPlaceholder(placeholder || 'Describe your issue...');
    setTimeout(() => inputRef.current?.focus(), 200);
  }, []);

  const hideInput = useCallback(() => {
    setInputVisible(false);
  }, []);

  // ── Save message to backend session ──
  const saveMessage = useCallback(async (sender, content, meta = {}) => {
    if (!sessionIdRef.current) return;
    try {
      await chatApiCall(`/api/chat/session/${sessionIdRef.current}/message`, {
        sender,
        content,
        ...meta,
      });
    } catch (e) {
      // silently fail
    }
  }, []);

  // ── Create a new session on backend ──
  const createSession = useCallback(async () => {
    try {
      const data = await chatApiCall('/api/chat/session', {});
      if (data.session) {
        sessionIdRef.current = data.session.id;
      }
    } catch (e) {
      // silently fail
    }
  }, []);

  // ── Start Chat ──
  const startChat = useCallback(async () => {
    setMessages([]);
    setDisabledGroups(new Set());
    stateRef.current = {
      step: 'welcome', sectorKey: null, sectorName: null,
      subprocessKey: null, subprocessName: null, language: 'English',
      queryText: '', resolution: '',
    };
    hideInput();

    await createSession();

    const welcomeGroupId = nextId();
    setTimeout(() => {
      addMessage({
        type: 'bot',
        html: `<strong>Welcome to Customer Handling!</strong><br><br>` +
          `I'm here to help you resolve issues related to telecom services — mobile, broadband, DTH, landline, and enterprise solutions.<br><br>` +
          `<em>You can type in any language — I'll respond in your preferred language.</em><br><br>` +
          `Please select your <strong>telecom service category</strong> below:`,
      });
      setTimeout(() => loadSectorMenu(welcomeGroupId), 400);
    }, 500);
  }, [addMessage, hideInput, createSession]);

  // ── Load Sector Menu ──
  const loadSectorMenu = useCallback(async () => {
    const token = getToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const resp = await fetch(`${API_BASE}/api/menu`, { headers });
    const data = await resp.json();
    const groupId = nextId();
    addMessage({ type: 'sector-menu', menu: data.menu, groupId });
    stateRef.current.step = 'sector';
  }, [addMessage]);

  // ── Select Sector ──
  const selectSector = useCallback(async (key, name, groupId) => {
    disableGroup(groupId);
    stateRef.current.sectorKey = key;
    stateRef.current.sectorName = name;

    addMessage({ type: 'user', text: name });
    addMessage({ type: 'system', text: `Selected: ${name}` });
    saveMessage('user', name, { sector_name: name });

    setIsTyping(true);
    const data = await chatApiCall('/api/subprocesses', {
      sector_key: key, language: stateRef.current.language,
    });
    setIsTyping(false);

    addMessage({
      type: 'bot',
      html: `Great choice! Now please select the <strong>type of issue</strong> you're facing with <strong>${name}</strong>:`,
    });

    const spGroupId = nextId();
    addMessage({ type: 'subprocess-grid', subprocesses: data.subprocesses, groupId: spGroupId });
    stateRef.current.step = 'subprocess';
  }, [addMessage, disableGroup, saveMessage]);

  // ── Select Subprocess ──
  const selectSubprocess = useCallback((key, name, groupId) => {
    disableGroup(groupId);
    stateRef.current.subprocessKey = key;
    stateRef.current.subprocessName = name;

    addMessage({ type: 'user', text: name });
    saveMessage('user', name, { subprocess_name: name });

    const isOthers = name === 'Others' || name.includes('Other');
    addMessage({
      type: 'bot',
      html: isOthers
        ? `No problem! Please <strong>describe your issue</strong> in detail and I'll identify the right category and help you resolve it.`
        : `You selected <strong>${name}</strong>. Please <strong>describe your specific issue</strong> so I can provide the best resolution steps.`,
    });

    showInput('Describe your issue in any language...');
    stateRef.current.step = 'query';
  }, [addMessage, disableGroup, showInput, saveMessage]);

  // ── Send Message ──
  const sendMessage = useCallback(async () => {
    const text = inputValue.trim();
    if (!text) return;

    addMessage({ type: 'user', text });
    setInputValue('');
    hideInput();
    stateRef.current.queryText = text;
    saveMessage('user', text, { query_text: text });

    setIsTyping(true);
    try {
      const langData = await chatApiCall('/api/detect-language', { text });
      stateRef.current.language = langData.language || 'English';
    } catch {
      stateRef.current.language = 'English';
    }

    addMessage({ type: 'system', text: `Language detected: ${stateRef.current.language}` });

    const resolveData = await chatApiCall('/api/resolve', {
      query: text,
      sector_key: stateRef.current.sectorKey,
      subprocess_key: stateRef.current.subprocessKey,
      language: stateRef.current.language,
    });
    setIsTyping(false);

    if (!resolveData.is_telecom) {
      addMessage({ type: 'non-telecom-warning', html: formatResolution(resolveData.resolution) });
      saveMessage('bot', resolveData.resolution);
      setTimeout(() => {
        addMessage({ type: 'bot', html: `Would you like to try again? Let me show the menu once more.` });
        setTimeout(() => loadSectorMenu(), 400);
      }, 1500);
      return;
    }

    if (resolveData.identified_subprocess && stateRef.current.subprocessName?.includes('Other')) {
      addMessage({ type: 'system', text: `Identified category: ${resolveData.identified_subprocess}` });
    }

    stateRef.current.resolution = resolveData.resolution;
    saveMessage('bot', resolveData.resolution, {
      resolution: resolveData.resolution,
      language: stateRef.current.language,
    });

    addMessage({ type: 'resolution', html: formatResolution(resolveData.resolution) });

    setTimeout(() => {
      addMessage({ type: 'bot', html: `Were these steps helpful? Did they resolve your issue?` });
      const satGroupId = nextId();
      addMessage({ type: 'satisfaction', groupId: satGroupId });
    }, 1000);

    stateRef.current.step = 'feedback';
  }, [inputValue, addMessage, hideInput, loadSectorMenu, saveMessage]);

  // ── Send Summary Email ──
  const handleSendEmail = useCallback(async (groupId) => {
    disableGroup(groupId);
    if (!sessionIdRef.current) return;
    addMessage({ type: 'system', text: 'Sending summary to your email...' });
    try {
      const token = getToken();
      const resp = await fetch(`${API_BASE}/api/chat/session/${sessionIdRef.current}/send-summary-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      const data = await resp.json();
      if (resp.ok) {
        addMessage({ type: 'email-sent', message: data.message });
      } else {
        addMessage({ type: 'system', text: data.error || 'Failed to send email.' });
      }
    } catch {
      addMessage({ type: 'system', text: 'Failed to send email. Please try again later.' });
    }
  }, [addMessage, disableGroup]);

  // ── Satisfied → Resolved ──
  const handleSatisfied = useCallback(async (groupId) => {
    disableGroup(groupId);
    addMessage({ type: 'user', text: 'Yes, my issue is resolved' });
    addMessage({ type: 'thankyou' });
    saveMessage('user', 'Yes, my issue is resolved');

    // Mark session resolved on backend (generates summary)
    if (sessionIdRef.current) {
      try {
        const token = getToken();
        const resp = await fetch(`${API_BASE}/api/chat/session/${sessionIdRef.current}/resolve`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        });
        const data = await resp.json();
        if (data.summary) {
          addMessage({
            type: 'system',
            text: `Chat summary has been saved to your account.`,
          });
          // Show "Send Summary to Email" button
          setTimeout(() => {
            const emailGroupId = nextId();
            addMessage({ type: 'email-action', groupId: emailGroupId });
          }, 500);
        }
      } catch {}
    }

    setTimeout(() => {
      addMessage({ type: 'bot', html: `What would you like to do next?` });
      const actionGroupId = nextId();
      addMessage({ type: 'post-feedback-actions', groupId: actionGroupId });
    }, 2000);
    stateRef.current.step = 'resolved';
  }, [addMessage, disableGroup, saveMessage]);

  // ── Unsatisfied ──
  const handleUnsatisfied = useCallback((groupId) => {
    disableGroup(groupId);
    addMessage({ type: 'user', text: 'No, my issue is not resolved' });
    addMessage({ type: 'bot', html: `I'm sorry the steps didn't resolve your issue. Here's what we can do next:` });
    saveMessage('user', 'No, my issue is not resolved');
    setTimeout(() => {
      const unsatGroupId = nextId();
      addMessage({ type: 'unsat-options', groupId: unsatGroupId });
    }, 400);
  }, [addMessage, disableGroup, saveMessage]);

  // ── Back to Menu ──
  const handleBackToMenu = useCallback((groupId) => {
    disableGroup(groupId);
    addMessage({ type: 'user', text: 'Main Menu' });
    addMessage({ type: 'bot', html: `Sure! Please select your <strong>telecom service category</strong>:` });
    setTimeout(() => loadSectorMenu(), 400);
    stateRef.current.step = 'sector';
  }, [addMessage, disableGroup, loadSectorMenu]);

  // ── Exit ──
  const handleExit = useCallback((groupId) => {
    disableGroup(groupId);
    addMessage({ type: 'user', text: 'Exit' });
    addMessage({ type: 'exit-box' });
    hideInput();
    stateRef.current.step = 'exited';
  }, [addMessage, disableGroup, hideInput]);

  // ── Retry ──
  const handleRetry = useCallback((groupId) => {
    disableGroup(groupId);
    addMessage({ type: 'user', text: 'I want to describe my issue again' });
    addMessage({
      type: 'bot',
      html: `Sure! Please <strong>describe your issue again</strong> with as much detail as possible.`,
    });
    showInput('Describe your issue in more detail...');
    stateRef.current.step = 'query';
  }, [addMessage, disableGroup, showInput]);

  // ── Human Handoff → Raise Ticket ──
  const handleHumanHandoff = useCallback(async (groupId) => {
    disableGroup(groupId);
    addMessage({ type: 'user', text: 'Connect me to a human agent' });
    saveMessage('user', 'Connect me to a human agent');

    let refNum = 'TC-' + Date.now().toString(36).toUpperCase() + '-' +
      Math.random().toString(36).substring(2, 6).toUpperCase();

    // Escalate session → creates ticket on backend
    if (sessionIdRef.current) {
      try {
        const token = getToken();
        const resp = await fetch(`${API_BASE}/api/chat/session/${sessionIdRef.current}/escalate`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        });
        const data = await resp.json();
        if (data.ticket) {
          refNum = data.ticket.reference_number;
        }
      } catch {}
    }

    addMessage({
      type: 'handoff',
      sectorName: stateRef.current.sectorName || 'Telecom',
      subprocessName: stateRef.current.subprocessName || 'General',
      queryText: stateRef.current.queryText || 'N/A',
      refNum,
    });

    setTimeout(() => {
      addMessage({
        type: 'bot',
        html: `Your request has been submitted. A support ticket has been raised and a customer support executive will contact you shortly.<br><br>` +
          `Please save your reference number: <strong>${refNum}</strong><br><br>` +
          `You can track your ticket status from the dashboard.<br><br>` +
          `What would you like to do next?`,
      });
      setTimeout(() => {
        const actionGroupId = nextId();
        addMessage({ type: 'post-feedback-actions', groupId: actionGroupId });
      }, 400);
    }, 1500);
    stateRef.current.step = 'human_handoff';
  }, [addMessage, disableGroup, saveMessage]);

  // ── Key handler ──
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  // ── Auto-resize textarea ──
  const handleInputChange = useCallback((e) => {
    setInputValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  }, []);

  // ── Init ──
  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    startChat();
  }, []);

  // ── Render messages ──
  const renderMessage = (msg) => {
    const isDisabled = disabledGroups.has(msg.groupId);

    switch (msg.type) {
      case 'bot':
        return <div key={msg.id} className="message bot" dangerouslySetInnerHTML={{ __html: msg.html }} />;
      case 'user':
        return <div key={msg.id} className="message user">{msg.text}</div>;
      case 'system':
        return <div key={msg.id} className="message system">{msg.text}</div>;

      case 'sector-menu':
        return (
          <div key={msg.id} className="menu-container">
            {Object.entries(msg.menu).map(([key, sector]) => (
              <button key={key} className={`menu-card${isDisabled ? ' disabled' : ''}`}
                onClick={() => !isDisabled && selectSector(key, sector.name, msg.groupId)}>
                <div className="card-icon">{sector.icon}</div>
                <div className="card-label">{sector.name}</div>
                <div className="card-arrow">&rsaquo;</div>
              </button>
            ))}
          </div>
        );

      case 'subprocess-grid':
        return (
          <div key={msg.id} className="subprocess-grid">
            {Object.entries(msg.subprocesses).map(([sk, sname]) => (
              <button key={sk}
                className={`subprocess-chip${sname === 'Others' || sname.includes('Other') ? ' others' : ''}${isDisabled ? ' disabled' : ''}`}
                onClick={() => !isDisabled && selectSubprocess(sk, sname, msg.groupId)}>
                {sname}
              </button>
            ))}
          </div>
        );

      case 'resolution':
        return (
          <div key={msg.id} className="resolution-box">
            <h4>Resolution Steps</h4>
            <div dangerouslySetInnerHTML={{ __html: msg.html }} />
          </div>
        );

      case 'non-telecom-warning':
        return <div key={msg.id} className="non-telecom-warning" dangerouslySetInnerHTML={{ __html: msg.html }} />;

      case 'satisfaction':
        return (
          <div key={msg.id} className="satisfaction-container">
            <button className={`sat-btn yes${isDisabled ? ' disabled' : ''}`}
              onClick={() => !isDisabled && handleSatisfied(msg.groupId)}>Yes, Resolved</button>
            <button className={`sat-btn no${isDisabled ? ' disabled' : ''}`}
              onClick={() => !isDisabled && handleUnsatisfied(msg.groupId)}>No, Not Resolved</button>
          </div>
        );

      case 'thankyou':
        return (
          <div key={msg.id} className="thankyou-box">
            <div className="ty-icon">&#x1F389;</div>
            <div className="ty-title">Thank You!</div>
            <div className="ty-msg">We're glad we could help resolve your issue.<br />If you face any other telecom issues, feel free to come back anytime!</div>
          </div>
        );

      case 'post-feedback-actions':
        return (
          <div key={msg.id} className="post-feedback-actions">
            <button className={`action-btn menu-btn${isDisabled ? ' disabled' : ''}`}
              onClick={() => !isDisabled && handleBackToMenu(msg.groupId)}>Main Menu</button>
            <button className={`action-btn exit-btn${isDisabled ? ' disabled' : ''}`}
              onClick={() => !isDisabled && handleExit(msg.groupId)}>Exit</button>
          </div>
        );

      case 'exit-box':
        return (
          <div key={msg.id} className="exit-box">
            <div className="exit-icon">&#x1F44B;</div>
            <div className="exit-title">Goodbye!</div>
            <div className="exit-msg">Thank you for using Customer Handling.<br />Have a great day! Click <strong>Restart</strong> anytime to start a new session.</div>
          </div>
        );

      case 'unsat-options': {
        const options = [
          { cls: 'retry', icon: '&#x1F504;', title: 'Describe Again', desc: 'Provide more details for better resolution steps', fn: () => handleRetry(msg.groupId) },
          { cls: 'human', icon: '&#x1F464;', title: 'Connect to Human Agent', desc: 'A support ticket will be raised for you', fn: () => handleHumanHandoff(msg.groupId) },
          { cls: 'newc', icon: '&#x1F4CB;', title: 'Main Menu', desc: 'Go back to the main service category menu', fn: () => handleBackToMenu(msg.groupId) },
          { cls: 'exit', icon: '&#x1F6AA;', title: 'Exit', desc: 'End this session', fn: () => handleExit(msg.groupId) },
        ];
        return (
          <div key={msg.id} className="unsat-options">
            {options.map((opt, i) => (
              <button key={i} className={`unsat-btn${isDisabled ? ' disabled' : ''}`}
                onClick={() => !isDisabled && opt.fn()}>
                <div className={`o-icon ${opt.cls}`} dangerouslySetInnerHTML={{ __html: opt.icon }} />
                <div className="o-info">
                  <div className="o-title">{opt.title}</div>
                  <div className="o-desc">{opt.desc}</div>
                </div>
                <div className="o-arrow">&rsaquo;</div>
              </button>
            ))}
          </div>
        );
      }

      case 'email-action':
        return (
          <div key={msg.id} className="email-action-container">
            <button
              className={`email-btn${isDisabled ? ' disabled' : ''}`}
              onClick={() => !isDisabled && handleSendEmail(msg.groupId)}
            >
              <span className="email-btn-icon">&#x2709;</span>
              Send Summary to My Email
            </button>
          </div>
        );

      case 'email-sent':
        return (
          <div key={msg.id} className="email-sent-box">
            <div className="email-sent-icon">&#x2705;</div>
            <div className="email-sent-text">{msg.message}</div>
          </div>
        );

      case 'handoff':
        return (
          <div key={msg.id} className="handoff-box">
            <h4>Human Agent Request Submitted</h4>
            <div className="handoff-row"><span className="h-label">Category</span><span className="h-value">{msg.sectorName}</span></div>
            <div className="handoff-row"><span className="h-label">Issue Type</span><span className="h-value">{msg.subprocessName}</span></div>
            <div className="handoff-row"><span className="h-label">Complaint</span><span className="h-value">{msg.queryText}</span></div>
            <div className="handoff-row"><span className="h-label">Status</span><span className="h-value status-pending">Pending Agent Assignment</span></div>
            <div className="handoff-ref">Reference No: {msg.refNum}</div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="chat-support-page">
      <div className="app-container">
        <div className="header">
          <div className="header-icon">&#x1F4E1;</div>
          <div className="header-info">
            <h1>Customer Handling</h1>
            <p>AI-powered multilingual support</p>
          </div>
          <div className="status-dot" />
          <button className="restart-btn" onClick={startChat}>&#x21BB; Restart</button>
        </div>

        <div className="chat-area" ref={chatAreaRef}>
          {messages.map(renderMessage)}
          {isTyping && (
            <div className="typing-indicator visible">
              <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
            </div>
          )}
        </div>

        {inputVisible && (
          <div className="input-area">
            <div className="input-row">
              <textarea ref={inputRef} value={inputValue} onChange={handleInputChange}
                onKeyDown={handleKeyDown} placeholder={inputPlaceholder} rows={1} />
              <button className="send-btn" onClick={sendMessage} disabled={!inputValue.trim()}>&#x27A4;</button>
            </div>
            <div className="input-hint">Press Enter to send &middot; Supports any language</div>
          </div>
        )}
      </div>
    </div>
  );
}
