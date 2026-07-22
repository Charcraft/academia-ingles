"use client";

import { Suspense, useState, useRef, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Send, ChevronLeft, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message, StudentWithProfile } from "@/types";

// ── Mock Students (for left panel) ───────────────────────────────────────────

const mockStudents: StudentWithProfile[] = [
  {
    id: "1", first_name: "Maria", last_name: "Garcia", email: "maria@example.com",
    country: "Mexico", country_code: "MX", phone: "+521234567890",
    profession: "Enfermera", license_number: "ENF-12345", experience_years: 5,
    exam_interest: "ielts_academic", current_level: "A2", global_progress: 35,
    daily_goal: 30, daily_minutes_today: 15, role: "student",
    validation_status: "approved", validation_photo_url: null,
    validation_approved_at: null, validation_photo_delete_at: null,
    avatar_url: null, streak: 12,
    last_active_date: new Date().toISOString(), total_xp: 1250,
    exam_path: "ielts_academic", is_blocked: false,
    created_at: "2026-01-15T00:00:00Z", updated_at: new Date().toISOString(),
    speaking_score_avg: 5.5,
  },
  {
    id: "2", first_name: "Carlos", last_name: "Lopez", email: "carlos@example.com",
    country: "Colombia", country_code: "CO", phone: "+573001234567",
    profession: "Enfermero", license_number: "ENF-67890", experience_years: 3,
    exam_interest: "toefl_ibt", current_level: "B1", global_progress: 62,
    daily_goal: 45, daily_minutes_today: 40, role: "student",
    validation_status: "approved", validation_photo_url: null,
    validation_approved_at: null, validation_photo_delete_at: null,
    avatar_url: null, streak: 28,
    last_active_date: new Date().toISOString(), total_xp: 4800,
    exam_path: "toefl_ibt", is_blocked: false,
    created_at: "2026-01-20T00:00:00Z", updated_at: new Date().toISOString(),
    speaking_score_avg: 6.5,
  },
  {
    id: "3", first_name: "Juan", last_name: "Dela Cruz", email: "juan@example.com",
    country: "Philippines", country_code: "PH", phone: "+639123456789",
    profession: "Fisioterapeuta", license_number: "FIS-11111", experience_years: 2,
    exam_interest: "undecided", current_level: "A0", global_progress: 8,
    daily_goal: 20, daily_minutes_today: 0, role: "student",
    validation_status: "pending", validation_photo_url: null,
    validation_approved_at: null, validation_photo_delete_at: null,
    avatar_url: null, streak: 0,
    last_active_date: new Date(Date.now() - 8 * 86400000).toISOString(), total_xp: 120,
    exam_path: null, is_blocked: false,
    created_at: "2026-06-01T00:00:00Z", updated_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    speaking_score_avg: 4.0,
  },
  {
    id: "6", first_name: "Sofia", last_name: "Ramirez", email: "sofia@example.com",
    country: "Chile", country_code: "CL", phone: "+56212345678",
    profession: "Enfermera", license_number: "ENF-44444", experience_years: 6,
    exam_interest: "ielts_academic", current_level: "B1", global_progress: 91,
    daily_goal: 45, daily_minutes_today: 50, role: "student",
    validation_status: "approved", validation_photo_url: null,
    validation_approved_at: null, validation_photo_delete_at: null,
    avatar_url: null, streak: 18,
    last_active_date: new Date().toISOString(), total_xp: 9800,
    exam_path: "ielts_academic", is_blocked: false,
    created_at: "2026-02-01T00:00:00Z", updated_at: new Date().toISOString(),
    speaking_score_avg: 7.5,
  },
];

// ── Mock Messages ────────────────────────────────────────────────────────────

const mockMessages: Record<string, Message[]> = {
  "1": [
    { id: "m1", sender_id: "1", receiver_id: "admin", content: "Hola! Tengo una duda sobre la lección de vocabulario.", is_read: true, created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
    { id: "m2", sender_id: "admin", receiver_id: "1", content: "Claro Maria, ¿en qué puedo ayudarte?", is_read: true, created_at: new Date(Date.now() - 55 * 60 * 1000).toISOString() },
    { id: "m3", sender_id: "1", receiver_id: "admin", content: "No entiendo bien la diferencia entre 'pain' y 'ache'.", is_read: true, created_at: new Date(Date.now() - 50 * 60 * 1000).toISOString() },
    { id: "m4", sender_id: "admin", receiver_id: "1", content: "'Pain' es más general, 'ache' es un dolor continuo y sordo. Por ejemplo: 'I have a headache' (dolor de cabeza) vs 'I feel pain in my arm'.", is_read: false, created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString() },
  ],
  "2": [
    { id: "m5", sender_id: "2", receiver_id: "admin", content: "Good morning! I just finished the B1 checkpoint test.", is_read: true, created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
    { id: "m6", sender_id: "admin", receiver_id: "2", content: "Great job Carlos! How did you feel about it?", is_read: true, created_at: new Date(Date.now() - 100 * 60 * 1000).toISOString() },
    { id: "m7", sender_id: "2", receiver_id: "admin", content: "It was challenging but I think I did well. The listening section was the hardest.", is_read: true, created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString() },
  ],
  "3": [
    { id: "m8", sender_id: "admin", receiver_id: "3", content: "Hi Juan, I noticed you haven't logged in for a few days. Everything okay?", is_read: false, created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
  ],
  "6": [
    { id: "m9", sender_id: "6", receiver_id: "admin", content: "¡Hola! Quería preguntar sobre el examen mock de IELTS.", is_read: true, created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
    { id: "m10", sender_id: "admin", receiver_id: "6", content: "Hola Sofia! El mock está disponible en la sección de práctica. Te recomiendo hacerlo este fin de semana.", is_read: true, created_at: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString() },
  ],
};

// ── Main Page (inner, uses searchParams) ──────────────────────────────────────

function MessagesContent() {
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get("student");

  const [students] = useState(mockStudents);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    preselectedId || null
  );
  const [conversations, setConversations] = useState(mockMessages);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Update preselected when search params change
  useEffect(() => {
    if (preselectedId) {
      setSelectedStudentId(preselectedId);
    }
  }, [preselectedId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, selectedStudentId]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(
      (s) =>
        s.first_name.toLowerCase().includes(q) ||
        s.last_name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  const selectedStudent = students.find((s) => s.id === selectedStudentId);
  const currentMessages = selectedStudentId
    ? conversations[selectedStudentId] || []
    : [];

  // Count unread per student
  function unreadCount(studentId: string): number {
    const msgs = conversations[studentId] || [];
    return msgs.filter(
      (m) => m.sender_id === studentId && !m.is_read
    ).length;
  }

  function getLastMessage(studentId: string): Message | null {
    const msgs = conversations[studentId] || [];
    return msgs.length > 0 ? msgs[msgs.length - 1] : null;
  }

  function formatMessageTime(date: string): string {
    const msgDate = new Date(date);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - msgDate.getTime()) / 86400000
    );
    if (diffDays === 0) {
      return msgDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    if (diffDays < 7) return `${diffDays}d ago`;
    return msgDate.toLocaleDateString();
  }

  function handleSend() {
    if (!newMessage.trim() || !selectedStudentId) return;

    const msg: Message = {
      id: `m-${Date.now()}`,
      sender_id: "admin",
      receiver_id: selectedStudentId,
      content: newMessage.trim(),
      is_read: true,
      created_at: new Date().toISOString(),
    };

    setConversations((prev) => ({
      ...prev,
      [selectedStudentId]: [...(prev[selectedStudentId] || []), msg],
    }));
    setNewMessage("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-0">
      {/* Left Panel - Student List */}
      <div
        className={cn(
          "w-full md:w-80 lg:w-96 bg-charcoal-950 border border-charcoal-700 rounded-2xl flex flex-col shrink-0",
          selectedStudentId && "hidden md:flex"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-charcoal-700">
          <h2 className="text-lg font-semibold text-slate-100 mb-3">
            Messages
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-charcoal-900 border border-charcoal-700 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-teal-500/50 transition-all"
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Supabase Realtime subscription ready
          </p>
        </div>

        {/* Student List */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence>
            {filteredStudents.map((student) => {
              const lastMsg = getLastMessage(student.id);
              const unread = unreadCount(student.id);
              const isSelected = student.id === selectedStudentId;

              return (
                <motion.button
                  key={student.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedStudentId(student.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-left border-b border-charcoal-800 transition-colors",
                    isSelected
                      ? "bg-teal-500/10 border-l-2 border-l-teal-500"
                      : "hover:bg-charcoal-800/50"
                  )}
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 text-sm font-bold uppercase shrink-0">
                    {student.first_name[0]}
                    {student.last_name[0]}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-200 truncate">
                        {student.first_name} {student.last_name}
                      </p>
                      {lastMsg && (
                        <span className="text-xs text-slate-500 shrink-0 ml-2">
                          {formatMessageTime(lastMsg.created_at)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {student.current_level} · {student.profession}
                    </p>
                    {lastMsg && (
                      <p
                        className={cn(
                          "text-xs mt-1 truncate",
                          unread > 0
                            ? "text-slate-200 font-medium"
                            : "text-slate-500"
                        )}
                      >
                        {lastMsg.sender_id === "admin" ? "You: " : ""}
                        {lastMsg.content}
                      </p>
                    )}
                  </div>

                  {/* Unread Badge */}
                  {unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-teal-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {unread}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </AnimatePresence>

          {filteredStudents.length === 0 && (
            <div className="p-8 text-center">
              <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No students found</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Chat */}
      <div
        className={cn(
          "flex-1 bg-charcoal-950 border border-charcoal-700 rounded-2xl flex flex-col ml-0 md:ml-4",
          !selectedStudentId && "hidden md:flex md:items-center md:justify-center"
        )}
      >
        {!selectedStudentId ? (
          <div className="text-center p-8">
            <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-lg font-medium">
              Select a conversation
            </p>
            <p className="text-slate-600 text-sm mt-1">
              Choose a student from the list to start chatting
            </p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-charcoal-700">
              <button
                onClick={() => setSelectedStudentId(null)}
                className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="w-9 h-9 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 text-xs font-bold uppercase shrink-0">
                {selectedStudent!.first_name[0]}
                {selectedStudent!.last_name[0]}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200">
                  {selectedStudent!.first_name} {selectedStudent!.last_name}
                </p>
                <p className="text-xs text-slate-500">
                  {selectedStudent!.current_level} ·{" "}
                  {selectedStudent!.profession}
                </p>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <AnimatePresence>
                {currentMessages.map((msg, i) => {
                  const isAdmin = msg.sender_id === "admin";
                  const showTimestamp =
                    i === 0 ||
                    new Date(msg.created_at).getTime() -
                      new Date(
                        currentMessages[i - 1].created_at
                      ).getTime() >
                      30 * 60 * 1000;

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        "flex flex-col",
                        isAdmin ? "items-end" : "items-start"
                      )}
                    >
                      {showTimestamp && (
                        <span className="text-xs text-slate-600 mb-4 self-center">
                          {formatMessageTime(msg.created_at)}
                        </span>
                      )}
                      <div
                        className={cn(
                          "max-w-[75%] px-4 py-2.5 rounded-2xl text-sm",
                          isAdmin
                            ? "bg-teal-600 text-white rounded-br-md"
                            : "bg-charcoal-700 text-slate-200 rounded-bl-md"
                        )}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-slate-600 mt-1 px-1">
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="px-4 py-3 border-t border-charcoal-700">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 px-4 py-2.5 bg-charcoal-900 border border-charcoal-700 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-teal-500/50 transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={!newMessage.trim()}
                  className="p-2.5 rounded-xl bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Exported page wrapped in Suspense (required for useSearchParams) ─────────

export default function AdminMessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[calc(100vh-7rem)] flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full"
          />
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
