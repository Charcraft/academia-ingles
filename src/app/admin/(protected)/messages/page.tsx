"use client";

import { Suspense, useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Send, ChevronLeft, MessageSquare, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Message, StudentWithProfile } from "@/types";

// ── Main Page (inner, uses searchParams) ──────────────────────────────────────

function MessagesContent() {
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get("student");

  const [adminId, setAdminId] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentWithProfile[]>([]);
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    preselectedId || null
  );
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setAdminId(user.id);

    const { data: studentsData } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "student");
    setStudents((studentsData ?? []) as unknown as StudentWithProfile[]);

    const { data: messagesData } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: true });
    setAllMessages((messagesData ?? []) as unknown as Message[]);

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime: new messages involving this admin
  useEffect(() => {
    if (!adminId) return;
    const supabase = createClient();
    const channel = supabase
      .channel("admin-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${adminId}` },
        (payload) => {
          setAllMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [adminId]);

  // Update preselected when search params change
  useEffect(() => {
    if (preselectedId) {
      setSelectedStudentId(preselectedId);
    }
  }, [preselectedId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages, selectedStudentId]);

  // Mark incoming messages from the selected student as read
  useEffect(() => {
    if (!selectedStudentId || !adminId) return;
    const unread = allMessages.filter(
      (m) => m.sender_id === selectedStudentId && m.receiver_id === adminId && !m.is_read
    );
    if (unread.length === 0) return;

    const supabase = createClient();
    const ids = unread.map((m) => m.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("messages")
      .update({ is_read: true })
      .in("id", ids)
      .then(() => {
        setAllMessages((prev) =>
          prev.map((m) => (ids.includes(m.id) ? { ...m, is_read: true } : m))
        );
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudentId, adminId, allMessages.length]);

  const conversations = useMemo(() => {
    if (!adminId) return {} as Record<string, Message[]>;
    const map: Record<string, Message[]> = {};
    for (const m of allMessages) {
      const otherParty = m.sender_id === adminId ? m.receiver_id : m.sender_id;
      if (!map[otherParty]) map[otherParty] = [];
      map[otherParty].push(m);
    }
    return map;
  }, [allMessages, adminId]);

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
  const currentMessages = selectedStudentId ? conversations[selectedStudentId] || [] : [];

  function unreadCount(studentId: string): number {
    const msgs = conversations[studentId] || [];
    return msgs.filter((m) => m.sender_id === studentId && !m.is_read).length;
  }

  function getLastMessage(studentId: string): Message | null {
    const msgs = conversations[studentId] || [];
    return msgs.length > 0 ? msgs[msgs.length - 1] : null;
  }

  function formatMessageTime(date: string): string {
    const msgDate = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - msgDate.getTime()) / 86400000);
    if (diffDays === 0) {
      return msgDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    if (diffDays < 7) return `${diffDays}d ago`;
    return msgDate.toLocaleDateString();
  }

  async function handleSend() {
    if (!newMessage.trim() || !selectedStudentId || !adminId) return;
    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("messages")
      .insert({
        sender_id: adminId,
        receiver_id: selectedStudentId,
        content,
        is_read: false,
      })
      .select()
      .single();

    if (!error && data) {
      setAllMessages((prev) => [...prev, data as unknown as Message]);
    }
    setSending(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (loading) {
    return (
      <div className="h-[calc(100vh-7rem)] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
      </div>
    );
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
                        {lastMsg.sender_id === adminId ? "You: " : ""}
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
        {!selectedStudentId || !selectedStudent ? (
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
                {selectedStudent.first_name[0]}
                {selectedStudent.last_name[0]}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200">
                  {selectedStudent.first_name} {selectedStudent.last_name}
                </p>
                <p className="text-xs text-slate-500">
                  {selectedStudent.current_level} · {selectedStudent.profession}
                </p>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {currentMessages.length === 0 && (
                <p className="text-center text-sm text-slate-500 pt-8">
                  No messages yet. Say hello!
                </p>
              )}
              <AnimatePresence>
                {currentMessages.map((msg, i) => {
                  const isAdmin = msg.sender_id === adminId;
                  const showTimestamp =
                    i === 0 ||
                    new Date(msg.created_at).getTime() -
                      new Date(currentMessages[i - 1].created_at).getTime() >
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
                  disabled={sending}
                  className="flex-1 px-4 py-2.5 bg-charcoal-900 border border-charcoal-700 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-teal-500/50 transition-all disabled:opacity-60"
                />
                <button
                  onClick={handleSend}
                  disabled={!newMessage.trim() || sending}
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
