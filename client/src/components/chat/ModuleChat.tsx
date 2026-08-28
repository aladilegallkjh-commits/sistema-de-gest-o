import { useState, useRef, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, User } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { format } from "date-fns";

export function ModuleChat({ open, onOpenChange, activeModule, moduleName }: { open: boolean; onOpenChange: (open: boolean) => void; activeModule: string; moduleName: string }) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const queryClient = trpc.useContext();
  const { data: messages, isLoading } = trpc.chat.list.useQuery({ moduleId: activeModule }, { enabled: open });
  
  const sendMessage = trpc.chat.send.useMutation({
    onSuccess: () => {
      setContent("");
      queryClient.chat.list.invalidate({ moduleId: activeModule });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    sendMessage.mutate({ moduleId: activeModule, content });
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 p-0 flex flex-col shadow-2xl">
        <SheetHeader className="p-5 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/30 backdrop-blur-xl">
          <SheetTitle className="text-lg flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
            <div className="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 p-2 rounded-xl">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div>
              <p className="leading-none">Chat da Equipe</p>
              <p className="text-xs font-normal text-zinc-500 mt-1">Módulo: {moduleName}</p>
            </div>
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/30 dark:bg-zinc-950" ref={scrollRef}>
          {isLoading ? (
            <div className="flex justify-center p-4"><span className="text-xs text-zinc-500">Carregando mensagens...</span></div>
          ) : messages?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400 dark:text-zinc-600 space-y-3">
              <MessageSquare className="h-10 w-10 opacity-20" />
              <p className="text-sm">Nenhuma mensagem neste módulo ainda.</p>
              <p className="text-xs">Comece a conversa abaixo!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {[...(messages ?? [])].reverse().map((msg) => {
                const isMe = msg.userId === user?.id;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-end gap-2 max-w-[85%]">
                      {!isMe && (
                        <div className="h-7 w-7 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                          <User className="h-4 w-4 text-zinc-500" />
                        </div>
                      )}
                      <div className={`px-4 py-2.5 rounded-2xl ${isMe ? 'bg-emerald-500 text-white rounded-br-sm' : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 rounded-bl-sm'}`}>
                        <p className="text-[13px] leading-relaxed break-words">{msg.content}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-zinc-400 mt-1 px-1">
                      {format(new Date(msg.createdAt), "HH:mm")}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 border-t border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950">
          <div className="flex gap-2 items-end">
            <Input 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Digite uma mensagem..." 
              className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-full h-11 px-5"
            />
            <Button 
              type="submit" 
              disabled={sendMessage.isPending || !content.trim()} 
              className="rounded-full h-11 w-11 p-0 shrink-0 bg-zinc-900 hover:bg-zinc-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
