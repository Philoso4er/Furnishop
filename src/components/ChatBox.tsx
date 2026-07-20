import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Sparkles, User, Brain } from "lucide-react";
import { ChatMessage, PlacedItem } from "../types";

interface ChatBoxProps {
  placedItems: PlacedItem[];
  roomStyle: string;
  spaceType: string;
}

const QUICK_PROMPTS = [
  "Suggest a cozy chair design",
  "What lighting fits a modern space?",
  "Recommend some low-maintenance plants",
  "How can I maximize empty corners?"
];

export const ChatBox: React.FC<ChatBoxProps> = ({ placedItems, roomStyle, spaceType }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I am your AI Interior Designer. I can help you decorate and lay out this room style. Tap anywhere in the camera feed above to request items, use the sketchpad, or ask me for decor advice!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Math.random().toString(),
      role: "user",
      content: textToSend,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const history = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          roomDescription: `A ${roomStyle} styled ${spaceType}`,
          placedItems: placedItems.map((item) => ({
            name: item.name,
            category: item.category,
            price: item.price,
            status: item.status
          }))
        })
      });

      if (!res.ok) {
        throw new Error("Chat api request failed");
      }

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          role: "assistant",
          content: data.text || "I apologize, I wasn't able to process that properly. Could you rephrase?",
          timestamp: new Date()
        }
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          role: "assistant",
          content: "Sorry, I am experiencing temporary connectivity issues. Please try again.",
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-full bg-stone-900 rounded-xl border border-stone-800 overflow-hidden shadow-inner">
      {/* Messages Window */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-stone-800">
        {messages.map((m) => {
          const isUser = m.role === "user";
          return (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 max-w-[85%] ${
                isUser ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                isUser ? "bg-amber-500" : "bg-stone-800 border border-stone-700"
              }`}>
                {isUser ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Brain className="w-4 h-4 text-amber-500" />
                )}
              </div>
              <div className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                isUser 
                  ? "bg-amber-600 text-white rounded-tr-none" 
                  : "bg-stone-800 text-stone-200 border border-stone-750 rounded-tl-none"
              }`}>
                {m.content}
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="flex items-start gap-2.5 max-w-[85%]">
            <div className="w-7 h-7 rounded-full flex items-center justify-center bg-stone-800 border border-stone-700">
              <Brain className="w-4 h-4 text-amber-500 animate-pulse" />
            </div>
            <div className="bg-stone-850 px-3.5 py-2.5 rounded-2xl text-xs text-stone-400 border border-stone-850 rounded-tl-none flex items-center gap-2">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce delay-100" />
                <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce delay-200" />
                <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce delay-300" />
              </span>
              <span>Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-1.5 bg-stone-950/40 border-t border-stone-850 overflow-x-auto whitespace-nowrap flex gap-1.5 select-none scrollbar-none">
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => sendMessage(prompt)}
            className="inline-block bg-stone-800 hover:bg-stone-750 text-stone-300 px-2.5 py-1 rounded-full text-[10px] font-medium border border-stone-750 transition active:scale-95"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Text Input Footer */}
      <div className="p-3 bg-stone-950/60 border-t border-stone-800/80 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Ask AI designer or seek style advice..."
          className="flex-1 bg-stone-900 border border-stone-850 rounded-lg px-3 py-2 text-xs text-stone-200 placeholder-stone-500 outline-none focus:border-amber-500/50 transition-all"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          className="p-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-lg transition shadow active:scale-95"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
