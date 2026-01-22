import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
  intent?: string;
}

interface ChatResponse {
  response: string;
  intent: string;
  confidence: number;
  hasContext: boolean;
}

export function useChatbot() {
  const { user, userRole } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'bot',
      content: `Hello! 👋 I'm your AI academic assistant for Miracle Educational Society.\n\nI can help you with:\n• 📅 Timetable and schedule\n• ✅ Attendance information\n• 📝 Assignment deadlines\n• 💰 Fee status\n• 📚 Syllabus and materials\n• ❓ General academic queries\n\nHow can I assist you today?`,
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (message: string): Promise<ChatResponse | null> => {
    if (!message.trim() || !user) return null;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chatbot', {
        body: {
          message,
          userId: user.id,
          userRole: userRole || 'student',
        },
      });

      if (error) throw error;

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: data.response,
        timestamp: new Date(),
        intent: data.intent,
      };

      setMessages(prev => [...prev, botMessage]);
      
      return {
        response: data.response,
        intent: data.intent,
        confidence: data.confidence,
        hasContext: data.hasContext,
      };
    } catch (error) {
      console.error('Chatbot error:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment, or contact support if the issue persists.",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, userRole]);

  const clearMessages = useCallback(() => {
    setMessages([
      {
        id: '1',
        role: 'bot',
        content: `Hello! 👋 I'm your AI academic assistant. How can I help you today?`,
        timestamp: new Date(),
      },
    ]);
  }, []);

  return {
    messages,
    sendMessage,
    clearMessages,
    isLoading,
  };
}
