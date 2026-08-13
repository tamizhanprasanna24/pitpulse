'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { DashboardShell } from '@/components/dashboard/shell';
import { getAIResponse, AIResponse } from '@/lib/ai-service';
import type { ChatMessage } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Brain, Send, User, Sparkles, AlertTriangle, Mic, MicOff, Volume2,
  VolumeX, Copy, Check, Trash2, ShieldAlert, CheckCircle2, HeartPulse,
  Pill, Activity, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function AIAssistantPage() {
  const { profile } = useAuth();
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [isListening, setIsListening] = React.useState(false);
  const [speakingMsgId, setSpeakingMsgId] = React.useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = React.useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Load chat history or initialize welcome message
  React.useEffect(() => {
    if (!profile) return;
    (async () => {
      try {
        const { data } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: true })
          .limit(50);
        if (data && data.length > 0) {
          setMessages(data as ChatMessage[]);
        } else {
          setWelcomeMessage(profile.full_name);
        }
      } catch {
        setWelcomeMessage(profile.full_name);
      }
    })();
  }, [profile]);

  const setWelcomeMessage = (userName?: string) => {
    const greeting = userName ? `, ${userName}` : '';
    setMessages([{
      id: 'welcome',
      user_id: profile?.id || 'guest',
      role: 'assistant',
      content: `### 👋 Welcome to PitPulse AI Health Assistant${greeting}!\n\nI am your **24/7 Advanced AI Medical Companion**. Ask me **any health question** clearly, and I will provide instant clinical guidance, medication safety rules, nutrition advice, and emergency recommendations.`,
      metadata: {
        severity: 'low',
        category: 'general',
        recommendations: [
          'Ask about symptoms (e.g. "I have fever and sore throat")',
          'Inquire about blood pressure or blood sugar ranges',
          'Check medicine dosage & drug interaction safety',
          'Get personalized pregnancy care & nutrition tips'
        ]
      },
      created_at: new Date().toISOString(),
    }]);
  };

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  // Voice Input (Speech-to-Text)
  const toggleVoiceInput = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
                              (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error('Voice recognition is not supported by your browser. Please type your query.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListening(true);
      toast.info('🎙️ Listening... Speak your health question clearly.');

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        toast.success(`Captured: "${transcript}"`);
      };

      recognition.onerror = () => {
        setIsListening(false);
        toast.error('Could not hear voice input clearly. Please try again or type.');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
      toast.error('Voice input error. Please type your message.');
    }
  };

  // Text-to-Speech (Voice Playback)
  const toggleSpeech = (msgId: string, textToSpeak: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      toast.error('Text-to-speech is not supported on this browser.');
      return;
    }

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown symbols for natural audio speech
    const cleanText = textToSpeak.replace(/[#*`_~]/g, '').replace(/[-•]/g, ',');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // Copy Response
  const handleCopy = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    toast.success('Response copied to clipboard!');
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  // Clear Chat History
  const handleClearChat = async () => {
    if (!profile) return;
    try {
      await supabase.from('chat_messages').delete().eq('user_id', profile.id);
    } catch {
      // Ignore
    }
    setWelcomeMessage(profile.full_name);
    toast.success('Chat history cleared.');
  };

  // Send Message
  const sendMessage = async (queryText: string) => {
    const textToSend = queryText.trim();
    if (!textToSend || !profile) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      user_id: profile.id,
      role: 'user',
      content: textToSend,
      metadata: null,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      await supabase.from('chat_messages').insert({
        user_id: profile.id,
        role: 'user',
        content: textToSend,
      });
    } catch {
      // Proceed even if database save is delayed
    }

    // Call Advanced Medical AI Service with Patient Context
    const aiResponse: AIResponse = getAIResponse(textToSend, profile);

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

      try {
        await supabase.from('chat_messages').insert({
          user_id: profile.id,
          role: 'assistant',
          content: aiResponse.text,
          metadata: aiResponse as unknown as Record<string, unknown>,
        });
      } catch {
        // Local state already updated
      }
    }, 600);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  // Simple Markdown text renderer helper
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="mb-2 text-base font-bold text-primary">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. ')) {
        return <p key={idx} className="mb-1 font-semibold text-foreground">{formatBoldText(line)}</p>;
      }
      if (line.startsWith('   • ') || line.startsWith('• ') || line.startsWith('- ')) {
        return (
          <div key={idx} className="ml-3 my-0.5 flex items-start gap-1.5 text-xs text-muted-foreground">
            <span className="font-bold text-accent">•</span>
            <span>{formatBoldText(line.replace(/^(   • |• |- )/, ''))}</span>
          </div>
        );
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-1.5" />;
      }
      return <p key={idx} className="mb-1 leading-relaxed">{formatBoldText(line)}</p>;
    });
  };

  const formatBoldText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="italic text-muted-foreground">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  const promptCategories = [
    {
      category: 'Symptoms & Illness',
      icon: HeartPulse,
      prompts: [
        'I have a fever, headache and body pain',
        'Stomach pain and nausea after eating',
        'What should I do for severe cough and sore throat?'
      ]
    },
    {
      category: 'Chronic & Vitals',
      icon: Activity,
      prompts: [
        'How to manage high blood pressure 140/90?',
        'Blood sugar diet plan for diabetes',
        'What is a normal resting heart rate?'
      ]
    },
    {
      category: 'Medicines & Dosage',
      icon: Pill,
      prompts: [
        'Paracetamol 650mg dosage and side effects',
        'Can I take antibiotics for viral flu?',
        'Drug safety rules and expiry checks'
      ]
    },
    {
      category: 'Pregnancy & Maternal',
      icon: Sparkles,
      prompts: [
        'Pregnancy care tips and folic acid dosage',
        'How to manage morning sickness in 1st trimester?'
      ]
    }
  ];

  return (
    <DashboardShell title="AI Health Assistant" description="24/7 Advanced AI-powered clinical guidance & health companion">
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Main Chat Interface */}
        <Card className="glass lg:col-span-3 flex flex-col h-[680px] shadow-xl border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4">
            <CardTitle className="flex items-center gap-2.5 text-lg font-bold">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-md text-white">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <span>PitPulse AI Health Assistant</span>
                <span className="block text-xs font-normal text-muted-foreground">Advanced Multi-Clinical Intelligence System</span>
              </div>
            </CardTitle>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs px-2.5 py-1 flex items-center gap-1 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Active AI Core
              </Badge>
              <Button variant="ghost" size="icon" onClick={handleClearChat} title="Clear Chat History" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col justify-between p-4 overflow-hidden">
            {/* Messages Scroll Container */}
            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto pr-2">
              {messages.map(msg => {
                const meta = msg.metadata as unknown as AIResponse | null;
                const severity = meta?.severity;
                const recs = meta?.recommendations;
                const precautions = meta?.precautions;

                return (
                  <div key={msg.id} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                    {msg.role === 'assistant' && (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-md">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                    )}

                    <div className={cn(
                      'group relative max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-sm shadow-sm transition-all',
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                        : 'glass border border-border/50 text-foreground rounded-tl-none'
                    )}>
                      {/* Message Content */}
                      <div className="space-y-1">
                        {renderFormattedContent(msg.content)}
                      </div>

                      {/* Clinical Badges & Severity */}
                      {msg.role === 'assistant' && severity && (
                        <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-border/40">
                          {severity === 'high' && (
                            <Badge variant="destructive" className="flex items-center gap-1 text-[11px] font-semibold">
                              <ShieldAlert className="h-3 w-3" /> EMERGENCY ALERT
                            </Badge>
                          )}
                          {severity === 'medium' && (
                            <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[11px]">
                              ⚠️ Clinical Monitoring Advisable
                            </Badge>
                          )}
                          {severity === 'low' && (
                            <Badge variant="secondary" className="text-[11px] flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-emerald-500" /> General Health Information
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Recommendations List Card */}
                      {msg.role === 'assistant' && recs && recs.length > 0 && (
                        <div className="mt-3 rounded-xl bg-card/60 p-3 border border-primary/10 space-y-1.5">
                          <p className="text-xs font-bold text-primary flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-accent" /> Key Clinical Action Steps:
                          </p>
                          {recs.map((rec, i) => (
                            <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                              <span className="font-bold text-accent">•</span>
                              <span>{rec}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Precautions List */}
                      {msg.role === 'assistant' && precautions && precautions.length > 0 && (
                        <div className="mt-2 rounded-xl bg-amber-500/5 p-2.5 border border-amber-500/20 space-y-1">
                          <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <Info className="h-3 w-3" /> Precautions:
                          </p>
                          {precautions.map((p, i) => (
                            <p key={i} className="text-[11px] text-muted-foreground ml-3">• {p}</p>
                          ))}
                        </div>
                      )}

                      {/* Action Bar (Copy & Voice Playback) */}
                      {msg.role === 'assistant' && (
                        <div className="mt-2 flex items-center justify-end gap-1 opacity-80 hover:opacity-100">
                          <button
                            onClick={() => toggleSpeech(msg.id, msg.content)}
                            className="p-1 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                            title={speakingMsgId === msg.id ? 'Stop Voice Playback' : 'Read Response Out Loud'}
                          >
                            {speakingMsgId === msg.id ? (
                              <VolumeX className="h-3.5 w-3.5 text-accent animate-pulse" />
                            ) : (
                              <Volume2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleCopy(msg.id, msg.content)}
                            className="p-1 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                            title="Copy Response"
                          >
                            {copiedMsgId === msg.id ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {msg.role === 'user' && (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary shadow-sm border border-border">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Typing Animation */}
              {loading && (
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-md">
                    <Sparkles className="h-5 w-5 text-white animate-spin" />
                  </div>
                  <div className="glass rounded-2xl rounded-tl-none p-4 border border-border/50">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-primary">PitPulse AI is analyzing medical knowledge...</span>
                      <div className="flex gap-1">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: '0s' }} />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: '0.2s' }} />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: '0.4s' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Form with Voice Support */}
            <form onSubmit={handleFormSubmit} className="mt-4 flex items-center gap-2 border-t border-border/40 pt-3">
              <Button
                type="button"
                variant={isListening ? 'destructive' : 'outline'}
                size="icon"
                onClick={toggleVoiceInput}
                className={cn('shrink-0 transition-all', isListening && 'animate-pulse ring-2 ring-destructive')}
                title={isListening ? 'Listening... Click to stop' : 'Speak health question'}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4 text-accent" />}
              </Button>

              <Input
                placeholder="Ask clearly about any symptom, medicine, blood pressure, sugar, nutrition..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-card/50 focus-visible:ring-accent"
              />

              <Button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-gradient-to-r from-primary to-accent text-white shadow-md hover:opacity-90 transition-opacity"
              >
                <Send className="h-4 w-4 mr-1" /> Send
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Sidebar Prompts & Emergency Warning */}
        <div className="space-y-4">
          <Card className="glass shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Brain className="h-4 w-4 text-accent" /> Clinical Quick Queries
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-3">
              {promptCategories.map((group, idx) => {
                const IconComponent = group.icon;
                return (
                  <div key={idx} className="space-y-1.5">
                    <p className="text-[11px] font-semibold text-primary uppercase tracking-wider flex items-center gap-1">
                      <IconComponent className="h-3 w-3" /> {group.category}
                    </p>
                    <div className="space-y-1">
                      {group.prompts.map(prompt => (
                        <button
                          key={prompt}
                          onClick={() => sendMessage(prompt)}
                          className="w-full rounded-lg bg-card/60 p-2 text-left text-xs text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary hover:border-primary/20 border border-border/30 flex items-center justify-between group"
                        >
                          <span className="truncate pr-1">{prompt}</span>
                          <Send className="h-3 w-3 opacity-0 group-hover:opacity-100 text-primary shrink-0 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Emergency Box */}
          <Card className="glass border-destructive/30 bg-destructive/5 shadow-md">
            <CardContent className="pt-5">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-5 w-5 shrink-0 text-destructive animate-pulse" />
                <div>
                  <p className="text-sm font-bold text-destructive">Medical Emergency?</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    For acute emergencies (chest pain, severe bleeding, breathing difficulty), click <strong>Emergency SOS</strong> or call <strong>108</strong> immediately.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
