import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useChatbot } from '@/hooks/useChatbot';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  MessageSquare, Send, Bot, Sparkles, 
  HelpCircle, BookOpen, Calendar, CreditCard, Loader2, Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';

const suggestedQuestions = [
  { icon: <Calendar className="h-4 w-4" />, text: "What's my schedule for today?" },
  { icon: <BookOpen className="h-4 w-4" />, text: "Show my pending assignments" },
  { icon: <CreditCard className="h-4 w-4" />, text: "Check my fee status" },
  { icon: <HelpCircle className="h-4 w-4" />, text: "What is my attendance percentage?" },
];

export default function QueryBot() {
  const { user } = useAuth();
  const { messages, sendMessage, clearMessages, isLoading } = useChatbot();
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    const message = inputValue;
    setInputValue('');
    await sendMessage(message);
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question);
  };

  const userInitials = user?.email?.substring(0, 2).toUpperCase() || 'U';

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              AI Academic Assistant
            </h1>
            <p className="text-muted-foreground">Powered by Gemini AI - Ask anything about your academics</p>
          </div>
          <Button variant="outline" size="sm" onClick={clearMessages}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Chat
          </Button>
        </div>

        <div className="flex-1 flex gap-6 min-h-0">
          {/* Chat Area */}
          <Card className="flex-1 flex flex-col shadow-card">
            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.role === 'user' ? "flex-row-reverse" : ""
                    )}
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className={cn(
                        message.role === 'bot' 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted"
                      )}>
                        {message.role === 'bot' ? <Bot className="h-4 w-4" /> : userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-3",
                        message.role === 'user'
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted rounded-bl-md"
                      )}
                    >
                      <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                      <p className={cn(
                        "text-xs mt-1 opacity-60",
                        message.role === 'user' ? "text-right" : ""
                      )}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask about your schedule, assignments, fees, attendance..."
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button type="submit" variant="hero" disabled={!inputValue.trim() || isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </div>
          </Card>

          {/* Sidebar */}
          <div className="w-80 hidden lg:block space-y-4">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-base font-display">Quick Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-3"
                    onClick={() => handleSuggestedQuestion(question.text)}
                    disabled={isLoading}
                  >
                    <span className="mr-2">{question.icon}</span>
                    <span className="text-sm">{question.text}</span>
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-card bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">AI-Powered Assistant</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      I use Google Gemini AI to understand your queries and provide personalized responses based on your academic data.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-3">What I can help with:</h4>
                <ul className="text-xs text-muted-foreground space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />
                    View your class timetable
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />
                    Check attendance percentage
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />
                    Assignment deadlines
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />
                    Fee payment status
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />
                    Academic queries & FAQs
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
