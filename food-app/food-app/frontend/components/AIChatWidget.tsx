'use client';

import { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '@/lib/api/client';
import { useAuthStore } from '@/store/auth';

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; content: string }[]>([
    { role: 'bot', content: 'Xin chào! Tôi là trợ lý ảo HOANG FOOD. Tôi có thể giúp bạn tìm món ăn ngon hôm nay nha! 😋' },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const { token } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage(userMessage, token || undefined);
      setMessages((prev) => [...prev, { role: 'bot', content: response.reply }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'bot', content: 'Xin lỗi, hệ thống AI đang bận. Vui lòng thử lại sau.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  // Web Speech API cho Voice Search
  const toggleListen = () => {
    if (isListening) return; // Nếu đang nghe thì dừng, nhưng Web Speech tự tắt sau khi nhận diện
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt của bạn không hỗ trợ Nhận diện giọng nói (Speech Recognition). Vui lòng dùng Chrome hoặc Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setInput(speechToText);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Nút bật/tắt (Bubble) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-primary to-accent text-white shadow-xl hover:scale-105 active:scale-95 transition-all"
        >
          <span className="text-3xl animate-bounce mt-1">🤖</span>
        </button>
      )}

      {/* Cửa sổ Chat */}
      {isOpen && (
        <div className="mb-4 mr-2 flex h-[500px] w-80 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-200">
          {/* Header */}
          <div className="bg-primary px-4 py-3 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              <h3 className="font-bold">Trợ lý AI</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 scrollbar-hide">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-br-sm'
                      : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex w-full justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-white border border-gray-100 px-4 py-3 text-gray-400 text-sm flex gap-1 shadow-sm">
                  <span className="animate-bounce inline-block">.</span>
                  <span className="animate-bounce inline-block" style={{ animationDelay: '100ms' }}>.</span>
                  <span className="animate-bounce inline-block" style={{ animationDelay: '200ms' }}>.</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-100 bg-white p-3 flex gap-2">
            <button
              onClick={toggleListen}
              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-colors ${
                isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
              }`}
              title="Nhập bằng giọng nói"
            >
              🎤
            </button>
            <input
              type="text"
              className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm focus:border-primary focus:outline-none"
              placeholder="Hỏi về món ăn..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white transition-all hover:bg-primary-600 disabled:opacity-50"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
