'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { DashboardShell } from '@/components/dashboard/shell';
import { getAIResponse } from '@/lib/ai-service';
import type { ChatMessage } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Send, User, Sparkles, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AIAssistantPage() {
  const { profile } = useAuth();
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: true })
        .limit(50);
      if (data && data.length > 0) {
        setMessages(data as ChatMessage[]);
      } else {
        setMessages([{
          id: 'welcome',
          user_id: profile.id,
          role: 'assistant',
          content: 'Hello! I am your AI Health Assistant. I can help you with symptom checking, medicine recommendations, drug interactions, nutrition, exercise, and general health guidance. How can I help you today?',
          metadata: null,
          created_at: new Date().toISOString(),
        }]);
      }
    })();
  }, [profile]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !profile) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      user_id: profile.id,
      role: 'user',
      content: input,
      metadata: null,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    await supabase.from('chat_messages').insert({
      user_id: profile.id,
      role: 'user',
      content: input,
    });

    const aiResponse = getAIResponse(input);

    setTimeout(async () => {
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        user_id: profile.id,
        role: 'assistant',
        content: aiResponse.text,
        metadata: aiResponse as unknown as Record<string, unknown>,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setLoading(false);

      await supabase.from('chat_messages').insert({
        user_id: profile.id,
        role: 'assistant',
        content: aiResponse.text,
        metadata: aiResponse as unknown as Record<string, unknown>,
      });
    }, 800);
  };

  const quickPrompts = [
    'I have a fever and headache',
    'Check my blood pressure',
    'Nutrition advice for diabetes',
    'Exercise plan for beginners',
    'Pregnancy care tips',
  ];

  return (
    <DashboardShell title="AI Health Assistant" description="Your 24/7 AI-powered health companion">
      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="glass lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-accent" /> Chat with AI Assistant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div ref={scrollRef} className="h-[500px] space-y-4 overflow-y-auto rounded-lg bg-card/30 p-4">
              {messages.map(msg => (
                <div key={msg.id} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  {msg.role === 'assistant' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div className={cn(
                    'max-w-[75%] rounded-xl p-3 text-sm',
                    msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'glass'
                  )}>
                    {msg.content}
                    {msg.metadata && typeof msg.metadata === 'object' && 'recommendations' in msg.metadata && (
                      <div className="mt-2 space-y-1 border-t border-border/50 pt-2">
                        {(msg.metadata as { recommendations?: string[] }).recommendations?.map((rec, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-xs">
                            <span className="text-accent">-</span> {rec}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div className="glass rounded-xl p-3">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: '0s' }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: '0.2s' }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <form onSubmit={handleSend} className="mt-4 flex gap-2">
              <Input placeholder="Ask about symptoms, medicines, nutrition..." value={input} onChange={(e) => setInput(e.target.value)} />
              <Button type="submit" disabled={loading} className="bg-gradient-to-r from-primary to-accent text-white">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-sm">Quick Prompts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickPrompts.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  className="w-full rounded-lg bg-card/50 p-2 text-left text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {prompt}
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="glass border-destructive/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
                <div>
                  <p className="text-sm font-semibold">Emergency?</p>
                  <p className="text-xs text-muted-foreground">For medical emergencies, use the SOS button on your dashboard or call 108 immediately.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
