import React, { useState, useRef, useEffect } from 'react';
import cssContent from './ChatButton.css';

interface Message {
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
  id: string;
}

interface ApiResponse {
  response?: string;
  error?: string;
}

const initialBotMessage = "سلام! چطور می‌تونم کمکتون کنم؟";

const ChatButton = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { 
      sender: "bot", 
      text: initialBotMessage,
      timestamp: new Date(),
      id: 'initial'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const chatBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const styleId = 'chat-button-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = cssContent;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    if (open && chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, open, isTyping]);

  const sendMessageToAPI = async (message: string): Promise<string> => {
    try {
      const response = await fetch('https://n8n.ai.diseec.com/webhook/166c42f9-9455-437d-9ac1-c8481e671373/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          timestamp: new Date().toISOString(),
          user: 'keivanpourzang'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      return data.response || 'متاسفانه پاسخی دریافت نکردم. لطفاً دوباره تلاش کنید.';
    } catch (error) {
      console.error('Error sending message:', error);
      return 'خطا در ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی کنید.';
    }
  };

  const generateId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

  const handleSend = async () => {
    if (input.trim().length === 0 || isLoading) return;

    const userMessage: Message = { 
      sender: "user", 
      text: input.trim(),
      timestamp: new Date(),
      id: generateId()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setIsTyping(true);

    try {
      // شبیه‌سازی typing delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const botResponse = await sendMessageToAPI(userMessage.text);
      
      const botMessage: Message = {
        sender: "bot",
        text: botResponse,
        timestamp: new Date(),
        id: generateId()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        sender: "bot",
        text: "متاسفانه خطایی رخ داد. لطفاً دوباره تلاش کنید.",
        timestamp: new Date(),
        id: generateId()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([
      { 
        sender: "bot", 
        text: initialBotMessage,
        timestamp: new Date(),
        id: 'initial'
      }
    ]);
  };

  return (
    <>
      <div className={`chat-modal ${open ? 'open' : ''}`}>
        <div className="chat-header">
          <div className="header-content">
            <span>چت هوشمند</span>
            <div className="status-indicator">
              <span className={`status-dot ${isLoading ? 'connecting' : 'online'}`}></span>
              <span className="status-text">
                {isLoading ? 'در حال پردازش...' : 'آنلاین'}
              </span>
            </div>
          </div>
          <div className="header-actions">
            <button 
              className="clear-chat" 
              onClick={clearChat}
              title="پاک کردن چت"
              disabled={isLoading}
            >
              🗑️
            </button>
            <button className="close-chat" onClick={() => setOpen(false)}>×</button>
          </div>
        </div>
        
        <div className="chat-body" ref={chatBodyRef}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`chat-message ${msg.sender}`}
            >
              <div className="message-content">{msg.text}</div>
              <div className="message-time">
                {msg.timestamp.toLocaleTimeString('fa-IR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="chat-message bot typing">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
        </div>
        
        <div className="chat-input-row">
          <input
            className="chat-input"
            placeholder={isLoading ? "منتظر پاسخ..." : "پیامت رو بنویس..."}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
            autoFocus={open}
            disabled={isLoading}
            maxLength={500}
          />
          <button 
            className="send-btn" 
            onClick={handleSend}
            disabled={isLoading || input.trim().length === 0}
          >
            {isLoading ? '⏳' : 'ارسال'}
          </button>
        </div>
        
        <div className="chat-footer">
          <span className="powered-by">Powered by AI • diseec.com</span>
        </div>
      </div>
      
      <button className="chat-fab" onClick={() => setOpen(true)}>
        <span className="fab-icon">💬</span>
        {!open && (
          <span className="notification-badge">AI</span>
        )}
      </button>
    </>
  );
};

export default ChatButton;