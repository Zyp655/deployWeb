'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api/client';
import io, { Socket } from 'socket.io-client';

interface ChatMessage {
  id: string;
  orderId: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    role: string;
  };
}

interface LiveChatWidgetProps {
  orderId: string;
  receiverId: string;
  receiverName: string;
  receiverRole: string; // 'DRIVER' or 'CUSTOMER'
  currentUserId: string;
}

export default function LiveChatWidget({ orderId, receiverId, receiverName, receiverRole, currentUserId }: LiveChatWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch initial chat history
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${api.baseUrl}/chat/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (err) {
        console.error('Failed to fetch chat history', err);
      }
    };
    fetchHistory();

    // Connect to WebSocket
    const token = localStorage.getItem('token');
    if (token) {
      if (!socketRef.current) {
         socketRef.current = io(api.baseUrl, { auth: { token } });
      }

      socketRef.current.on('chat-message-received', (msg: ChatMessage) => {
        if (msg.orderId === orderId) {
          setMessages(prev => {
             // Prevents duplicate messages from fast socket emissions
             if (prev.some(m => m.id === msg.id)) return prev;
             return [...prev, msg];
          });
          
          if (!isOpen && msg.senderId !== currentUserId) {
            setUnreadCount(prev => prev + 1);
            // Play notification sound
            try {
              const audio = new Audio('/notification.mp3'); // Fallback if exists
              audio.play().catch(() => {});
            } catch (e) {}
          }
        }
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.off('chat-message-received');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [orderId, isOpen, currentUserId]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !socketRef.current) return;

    socketRef.current.emit('send-chat-message', {
      orderId,
      receiverId,
      content: inputValue.trim()
    });

    setInputValue('');
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 p-4 bg-primary text-white rounded-full shadow-2xl hover:bg-primary-600 transition-transform hover:scale-105 z-50 flex items-center justify-center group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-full max-w-[360px] max-h-[500px] h-[500px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col border border-gray-100 overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-accent p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg shadow-inner">
                {receiverRole === 'DRIVER' ? '🛵' : '👤'}
              </div>
              <div>
                <h3 className="font-bold leading-tight">{receiverName}</h3>
                <span className="text-xs text-white/80 font-medium">
                  {receiverRole === 'DRIVER' ? 'Tài xế giao hàng' : 'Khách hàng'}
                </span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/20 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-3">
            <div className="text-center text-xs text-gray-400 my-2">
              Bắt đầu trò chuyện với {receiverRole === 'DRIVER' ? 'tài xế' : 'khách hàng'}
            </div>
            
            {messages.map((msg, idx) => {
              const isMe = msg.senderId === currentUserId;
              return (
                <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    isMe 
                      ? 'bg-primary text-white rounded-br-none shadow-sm' 
                      : 'bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-100'
                  }`}>
                    <p className="text-sm">{msg.content}</p>
                    <span className={`text-[10px] mt-1 block ${isMe ? 'text-primary-100 text-right' : 'text-gray-400'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Nhập tin nhắn..." 
              className="flex-1 bg-gray-100 text-sm rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50 transition-all text-gray-800"
            />
            <button 
              type="submit"
              disabled={!inputValue.trim()}
              className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shrink-0 hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:hover:bg-primary"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
