'use client';
import { useState, useRef, useEffect } from 'react';

export default function Home() {
  const [blobState, setBlobState] = useState('idle'); // idle | listening | thinking | speaking
  const [captionRole, setCaptionRole] = useState('VANI');
  const [captionText, setCaptionText] = useState('');
  const [showCaption, setShowCaption] = useState(false);
  const [muted, setMuted] = useState(false);
  const [supported, setSupported] = useState(true);

  const historyRef = useRef([]); // conversation memory sent to the API each turn
  const recognitionRef = useRef(null);
  const recognizingRef = useRef(false);
  const captionTimerRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    const recognition = new SR();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      recognizingRef.current = true;
      setBlobState('listening');
    };
    recognition.onend = () => {
      recognizingRef.current = false;
      setBlobState((s) => (s === 'listening' ? 'idle' : s));
    };
    recognition.onerror = () => {
      recognizingRef.current = false;
      setBlobState('idle');
    };
    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      handleUserUtterance(text);
    };
    recognitionRef.current = recognition;

    // opening line
    const t = setTimeout(() => {
      const opener = "Namaste! I'm VANI. Tap the mic and ask me anything — balance, transactions, or just talk.";
      showCaptionFor('VANI', opener, 6000);
      speak(opener);
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function showCaptionFor(role, text, hideAfter = 3200) {
    clearTimeout(captionTimerRef.current);
    setCaptionRole(role);
    setCaptionText(text);
    setShowCaption(true);
    captionTimerRef.current = setTimeout(() => setShowCaption(false), hideAfter);
  }

  function speak(text) {
    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1;
    u.pitch = 1;
    u.onstart = () => setBlobState('speaking');
    u.onend = () => setBlobState('idle');
    window.speechSynthesis.speak(u);
  }

  async function handleUserUtterance(text) {
    showCaptionFor('YOU', text, 3000);
    setBlobState('thinking');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: text, history: historyRef.current }),
      });
      const data = await res.json();
      const reply = data.reply || "Sorry, I didn't catch that.";

      historyRef.current = [
        ...historyRef.current,
        { role: 'user', content: text },
        { role: 'assistant', content: reply },
      ].slice(-16); // keep last 16 turns of memory

      showCaptionFor('VANI', reply, 6500);
      speak(reply);
    } catch (err) {
      const fallback = "I couldn't reach my brain just now. Try again?";
      showCaptionFor('VANI', fallback, 4000);
      speak(fallback);
      setBlobState('idle');
    }
  }

  function toggleMic() {
    if (!supported || muted) return;
    const recognition = recognitionRef.current;
    if (!recognition) return;
    if (recognizingRef.current) {
      recognition.stop();
      return;
    }
    window.speechSynthesis.cancel();
    recognition.start();
  }

  function toggleMute() {
    setMuted((m) => {
      const next = !m;
      if (next && recognizingRef.current) recognitionRef.current.stop();
      return next;
    });
  }

  function resetConversation() {
    window.speechSynthesis.cancel();
    if (recognizingRef.current) recognitionRef.current.stop();
    historyRef.current = [];
    setBlobState('idle');
    showCaptionFor('VANI', 'Conversation reset. Tap the mic to start again.', 2500);
  }

  return (
    <div style={styles.screen}>
      <style>{keyframes}</style>

      <div style={{ textAlign: 'center' }}>
        <div style={styles.name}>VANI</div>
        <div style={styles.modeLabel}>Voice mode · Live AI</div>
      </div>

      {!supported && (
        <div style={styles.warn}>
          Speech recognition isn&apos;t supported here — try Chrome on desktop or Android.
        </div>
      )}

      <div style={styles.blobStage}>
        <div style={{ ...styles.blob, ...blobStyleFor(blobState) }} />
      </div>

      <div style={styles.captionWrap}>
        <div style={{ ...styles.captionRole, opacity: showCaption ? 1 : 0 }}>{captionRole}</div>
        <div
          style={{
            ...styles.caption,
            opacity: showCaption ? 1 : 0,
            transform: showCaption ? 'translateY(0)' : 'translateY(6px)',
          }}
        >
          {captionText}
        </div>
      </div>

      <div>
        <div style={styles.controls}>
          <button style={styles.ctrlBtn} onClick={toggleMute} title="Mute mic">
            <MicIcon />
          </button>
          <button
            style={{
              ...styles.ctrlBtn,
              width: 68,
              height: 68,
              background: muted ? '#3A2323' : '#F2F2F5',
              color: muted ? '#FF8A8A' : '#0A0A0C',
            }}
            onClick={toggleMic}
            title="Tap to speak"
          >
            <MicIcon />
          </button>
          <button
            style={{ ...styles.ctrlBtn, background: '#3A1F22', color: '#FF6B6B' }}
            onClick={resetConversation}
            title="Reset conversation"
          >
            <CloseIcon />
          </button>
        </div>
        <div style={styles.hint}>Tap the center button and just talk — VANI thinks for real.</div>
      </div>
    </div>
  );
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <path d="M12 14a3 3 0 003-3V5a3 3 0 00-6 0v6a3 3 0 003 3zm5-3a5 5 0 01-10 0H5a7 7 0 006 6.92V21h2v-3.08A7 7 0 0019 11h-2z" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </svg>
  );
}

function blobStyleFor(state) {
  switch (state) {
    case 'listening':
      return {
        background: 'radial-gradient(circle at 35% 25%, #9FD9FF, #3E7BFA 45%, #1B3FA8 75%, #0B1E60 100%)',
        boxShadow: '0 0 90px rgba(62,123,250,.45)',
        animation: 'listenPulse 1.6s ease-in-out infinite',
      };
    case 'speaking':
      return {
        background: 'conic-gradient(from 0deg, #FF9DE2, #9DB4FF, #9DFFE8, #FFE29D, #FF9DE2)',
        boxShadow: '0 0 100px rgba(157,180,255,.5)',
        animation: 'speakSpin 3s linear infinite, speakPulse .5s ease-in-out infinite alternate',
      };
    case 'thinking':
      return {
        background: 'radial-gradient(circle at 35% 30%, #D9D9DE, #6E6E76 70%)',
        animation: 'thinkSpin 1.1s linear infinite',
      };
    default:
      return {
        background: 'radial-gradient(circle at 30% 30%, #6E6E76, #2B2B31 70%)',
        boxShadow: '0 0 60px rgba(255,255,255,.06)',
        animation: 'idlePulse 4s ease-in-out infinite',
      };
  }
}

const keyframes = `
@keyframes idlePulse { 0%,100%{transform:scale(1);} 50%{transform:scale(1.03);} }
@keyframes listenPulse { 0%,100%{transform:scale(1);} 50%{transform:scale(1.08);} }
@keyframes speakSpin { 0%{filter:hue-rotate(0deg);} 100%{filter:hue-rotate(360deg);} }
@keyframes speakPulse { 0%{transform:scale(.97);} 100%{transform:scale(1.06);} }
@keyframes thinkSpin { 0%{transform:scale(1) rotate(0deg);} 50%{transform:scale(.9) rotate(180deg);} 100%{transform:scale(1) rotate(360deg);} }
`;

const styles = {
  screen: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '36px 20px 40px',
    color: '#F2F2F5',
    fontFamily: 'Inter, sans-serif',
    position: 'relative',
  },
  name: { fontWeight: 700, fontSize: 15, letterSpacing: 0.5 },
  modeLabel: { fontSize: 12, color: '#8A8A93', marginTop: 4, letterSpacing: 0.5 },
  blobStage: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' },
  blob: { width: 190, height: 190, borderRadius: '50%', filter: 'blur(1px)', transition: 'transform .12s ease-out' },
  captionWrap: { minHeight: 70, maxWidth: 560, textAlign: 'center', padding: '0 12px' },
  captionRole: { fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: '#8A8A93', marginBottom: 6, transition: 'opacity .3s' },
  caption: { fontSize: 19, lineHeight: 1.4, transition: 'opacity .35s, transform .35s' },
  controls: { display: 'flex', alignItems: 'center', gap: 26 },
  ctrlBtn: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#1C1C20',
    color: '#F2F2F5',
  },
  hint: { fontSize: 11, color: '#8A8A93', marginTop: 14, textAlign: 'center', maxWidth: 280 },
  warn: {
    position: 'absolute',
    top: 60,
    fontSize: 12,
    color: '#FF8A8A',
    background: '#1C1414',
    border: '1px solid #3A2323',
    padding: '8px 14px',
    borderRadius: 8,
    maxWidth: '80%',
    textAlign: 'center',
  },
};
