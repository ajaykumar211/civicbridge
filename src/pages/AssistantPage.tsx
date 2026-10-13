import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Send, Bot, User, ArrowRight, ShieldCheck } from "lucide-react";
import { apiFetch } from "../lib/api.ts";
import { useAuth } from "../lib/auth.tsx";

interface ChatMessage {
  sender: "user" | "assistant";
  text: string;
  recommendedProblems?: any[];
}

export const AssistantPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: "assistant",
      text: `Hello ${user?.name || "there"}! I'm your CivicBridge AI Matchmaker. Tell me your university discipline, technical skills, or corporate CSR focus, and I'll query our verified database to recommend active societal problems that match your capabilities.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const quickPrompts = [
    "Which problems fit an embedded IoT or environmental engineering capstone?",
    "Which water contamination or sanitation problems can our CSR budget sponsor?",
    "Find beginner-friendly infrastructure projects for first-year students in Peenya.",
    "Show me critical health problems needing field verification or urgent grants.",
  ];

  const handleSend = async (messageText: string) => {
    if (!messageText.trim() || loading) return;

    const userMsg: ChatMessage = { sender: "user", text: messageText.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await apiFetch<any>("/api/assistant/chat", {
        method: "POST",
        body: JSON.stringify({ message: messageText.trim() }),
      });

      const assistantMsg: ChatMessage = {
        sender: "assistant",
        text: res.reply,
        recommendedProblems: res.recommended_problems || [],
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: "Sorry, I had trouble retrieving candidate recommendations. Please try asking with different keywords or role context.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Civic Matchmaker AI Assistant</h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Grounded matchmaking connecting student skillsets and corporate CSR mandates with real crowdsourced societal challenges.
        </p>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex flex-wrap gap-2">
        {quickPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p)}
            className="text-xs px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors text-left"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs min-h-[460px] flex flex-col justify-between space-y-6">
        <div className="space-y-6 overflow-y-auto max-h-[500px] pr-2">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${m.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  m.sender === "user" ? "bg-slate-900 text-white" : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {m.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`space-y-3 max-w-xl ${m.sender === "user" ? "text-right" : "text-left"}`}>
                <div
                  className={`inline-block p-4 rounded-xl text-xs leading-relaxed ${
                    m.sender === "user"
                      ? "bg-slate-900 text-white font-medium"
                      : "bg-slate-50 text-slate-800 border border-slate-100"
                  }`}
                >
                  {m.text}
                </div>

                {/* Grounded Recommendation Cards */}
                {m.recommendedProblems && m.recommendedProblems.length > 0 && (
                  <div className="space-y-2 pt-1 text-left">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Recommended Matched Problems from Database:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {m.recommendedProblems.map((p) => (
                        <div
                          key={p.id}
                          className="bg-white border border-slate-200 rounded-lg p-3 text-xs shadow-2xs hover:border-emerald-300 transition-colors flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                              <span className="capitalize">{p.category} &middot; {p.area_name}</span>
                              {p.verified && <ShieldCheck className="w-3 h-3 text-emerald-600" />}
                            </div>
                            <h4 className="font-semibold text-slate-900 line-clamp-2 leading-snug mb-1">
                              {p.title}
                            </h4>
                          </div>

                          <div className="pt-2 border-t border-slate-100 mt-2 flex items-center justify-between">
                            <span className="text-[11px] text-slate-500 capitalize">{p.severity} severity</span>
                            <Link
                              to={`/problems/${p.id}`}
                              className="font-semibold text-emerald-700 hover:underline flex items-center gap-0.5 text-[11px]"
                            >
                              <span>View Brief</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 italic">
                Searching candidate problems and consulting Gemini...
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-2 pt-3 border-t border-slate-100">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question or specify skills/CSR requirements..."
            className="flex-1 text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
