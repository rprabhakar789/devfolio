import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiLoader, FiMessageCircle, FiSend, FiX } from 'react-icons/fi';
import { sendChatMessage } from '../lib/chatApi';
import '../styles/Chatbot.css';

const CHATBOT_STORAGE_KEY = 'portfolio-chatbot-state';

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  message:
    "Hi, I'm Rahul's portfolio assistant. Ask me about his work, education, achievements, or the systems he's built."
};

function createSessionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `session-${Date.now()}`;
}

function readStoredState() {
  if (typeof window === 'undefined') {
    return {
      isOpen: false,
      messages: [WELCOME_MESSAGE],
      sessionId: createSessionId()
    };
  }

  const savedState = window.sessionStorage.getItem(CHATBOT_STORAGE_KEY);

  if (!savedState) {
    return {
      isOpen: false,
      messages: [WELCOME_MESSAGE],
      sessionId: createSessionId()
    };
  }

  try {
    const parsed = JSON.parse(savedState);

    return {
      isOpen: parsed.isOpen ?? false,
      messages: Array.isArray(parsed.messages) && parsed.messages.length > 0 ? parsed.messages : [WELCOME_MESSAGE],
      sessionId: parsed.sessionId || createSessionId()
    };
  } catch {
    return {
      isOpen: false,
      messages: [WELCOME_MESSAGE],
      sessionId: createSessionId()
    };
  }
}

function Chatbot() {
  const storedState = useMemo(() => readStoredState(), []);
  const [isOpen, setIsOpen] = useState(storedState.isOpen);
  const [messages, setMessages] = useState(storedState.messages);
  const [sessionId, setSessionId] = useState(storedState.sessionId);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.sessionStorage.setItem(
      CHATBOT_STORAGE_KEY,
      JSON.stringify({
        isOpen,
        messages,
        sessionId
      })
    );
  }, [isOpen, messages, sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedMessage = input.trim();

    if (!trimmedMessage || isLoading) {
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      message: trimmedMessage
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setInput('');
    setError('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage({
        message: trimmedMessage,
        sessionId
      });

      if (response.sessionId) {
        setSessionId(response.sessionId);
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `assistant-${response.timestamp || Date.now()}`,
          role: response.role || 'assistant',
          message: response.message || 'Sorry, I could not generate a response just now.'
        }
      ]);
    } catch (requestError) {
      const fallbackMessage =
        requestError.response?.data?.message ||
        'Sorry, the chat service is unavailable right now. Please try again in a moment.';

      setError(fallbackMessage);
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          message: fallbackMessage,
          isError: true
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chatbot-shell">
      <AnimatePresence>
        {isOpen && (
          <motion.section
            className="chatbot-panel"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            aria-label="Portfolio chatbot"
          >
            <div className="chatbot-header">
              <div>
                <p className="chatbot-eyebrow">Ask Rahul AI</p>
                <h3>Portfolio Chat</h3>
              </div>
              <button
                type="button"
                className="chatbot-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="chatbot-messages" role="log" aria-live="polite">
              {messages.map((message) => (
                <article
                  key={message.id}
                  className={`chat-message ${message.role === 'user' ? 'user' : 'assistant'} ${
                    message.isError ? 'error' : ''
                  }`}
                >
                  <p>{message.message}</p>
                </article>
              ))}

              {isLoading && (
                <div className="chat-message assistant loading">
                  <FiLoader className="chat-spinner" size={16} />
                  <span>Thinking...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <form className="chatbot-input-row" onSubmit={handleSubmit}>
              <label className="sr-only" htmlFor="chatbot-message">
                Ask a question about Rahul
              </label>
              <input
                id="chatbot-message"
                ref={inputRef}
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about work, education, or achievements..."
                autoComplete="off"
                disabled={isLoading}
              />
              <button
                type="submit"
                className="chatbot-send"
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
              >
                <FiSend size={18} />
              </button>
            </form>

            {error && <p className="chatbot-status">{error}</p>}
          </motion.section>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        className="chatbot-trigger"
        onClick={() => setIsOpen((open) => !open)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        aria-label={isOpen ? 'Close portfolio chat' : 'Open portfolio chat'}
      >
        <FiMessageCircle size={22} />
        <span>{isOpen ? 'Hide chat' : 'Ask Rahul AI'}</span>
      </motion.button>
    </div>
  );
}

export default Chatbot;
