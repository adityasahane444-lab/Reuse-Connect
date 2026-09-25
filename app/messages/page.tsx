"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@/lib/useUser";
import { timeAgo, formatDateTime } from "@/lib/format";
import { pingActivity } from "@/lib/useActivity";
import Avatar from "@/components/Avatar";
import LoginPrompt from "@/components/LoginPrompt";

interface ConversationSummary {
  id: string;
  other: { id: string; name: string; avatarUrl: string | null };
  lastMessage: { body: string; isSystem: boolean; mine: boolean; createdAt: string } | null;
  lastMessageAt: string;
  unread: number;
}
interface Message {
  id: string;
  body: string;
  isSystem: boolean;
  mine: boolean;
  createdAt: string;
}

function MessagesPageInner() {
  const { user, loading: userLoading } = useUser();
  const params = useSearchParams();

  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeOther, setActiveOther] = useState<{ id: string; name: string; avatarUrl: string | null } | null>(null);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    const res = await fetch("/api/messages", { cache: "no-store" });
    if (res.ok) setConversations((await res.json()).conversations);
  }, []);

  const loadMessages = useCallback(async (id: string) => {
    const res = await fetch(`/api/messages/${id}`, { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    setActiveOther(data.other);
    setMessages(data.messages);
    pingActivity();
  }, []);

  // Deep link: ?c=<conversationId> or ?to=<userId>&about=<title>
  useEffect(() => {
    if (!user) return;
    const c = params.get("c");
    const to = params.get("to");
    if (c) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- deep link from the URL on first load
      setActiveId(c);
      return;
    }
    if (to) {
      const about = params.get("about");
      fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: to }),
      })
        .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
        .then(({ ok, d }) => {
          if (!ok) {
            setError(d.error ?? "Could not open a chat with this person.");
            return;
          }
          setActiveId(d.conversationId);
          if (about) setDraft(`Hi! I'm interested in "${about}".`);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once from the initial URL only
  }, [user]);

  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    loadConversations();
    const t = setInterval(loadConversations, 20_000);
    return () => clearInterval(t);
  }, [user, loadConversations]);

  useEffect(() => {
    if (!activeId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- switching conversations needs its messages loaded immediately
    loadMessages(activeId);
    const t = setInterval(() => loadMessages(activeId), 5_000);
    return () => clearInterval(t);
  }, [activeId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  async function send() {
    const text = draft.trim();
    if (!text || !activeId) return;
    setSending(true);
    setError("");
    const res = await fetch(`/api/messages/${activeId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text }),
    });
    const data = await res.json().catch(() => ({}));
    setSending(false);
    if (!res.ok) {
      setError(data.error ?? "Could not send your message.");
      return;
    }
    setDraft("");
    setMessages((prev) => (prev ? [...prev, data.message] : prev));
    loadConversations();
  }

  if (userLoading) return <main className="flex-1 bg-[#F7FAF7] px-4 py-6 sm:py-10" />;
  if (!user) return <LoginPrompt message="Please log in to see your messages." />;

  return (
    <main className="flex-1 bg-[#F7FAF7] px-4 py-6 sm:py-8">
      <div className="mx-auto flex h-[calc(100dvh-8.75rem)] min-h-[24rem] max-w-4xl overflow-hidden rounded-2xl border border-[#E8F5E9] bg-white sm:h-[calc(100vh-8rem)] sm:min-h-[30rem]">
        <aside className={`w-full shrink-0 overflow-y-auto border-r border-[#E8F5E9] sm:w-72 ${activeId ? "hidden sm:block" : ""}`}>
          <h1 className="border-b border-[#E8F5E9] px-4 py-3 text-lg font-bold text-[#1F2937]">Messages</h1>
          {conversations === null ? (
            <p className="p-4 text-sm text-[#6B7280]">Loading…</p>
          ) : conversations.length === 0 ? (
            <p className="p-4 text-sm text-[#6B7280]">
              No conversations yet. Message someone from a listing, or accept a request to start one automatically.
            </p>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`flex w-full items-center gap-3 border-b border-gray-50 px-4 py-3 text-left hover:bg-gray-50 ${activeId === c.id ? "bg-[#F1F8F2]" : ""}`}
              >
                <Avatar name={c.other.name} url={c.other.avatarUrl} size={36} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-[#1F2937]">{c.other.name}</span>
                    <span className="shrink-0 text-xs text-[#6B7280]">{timeAgo(c.lastMessageAt)}</span>
                  </span>
                  <span className="block truncate text-xs text-[#6B7280]">
                    {c.lastMessage ? `${c.lastMessage.mine ? "You: " : ""}${c.lastMessage.body}` : "No messages yet"}
                  </span>
                </span>
                {c.unread > 0 && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#2E7D32]" aria-label={`${c.unread} unread`} />}
              </button>
            ))
          )}
        </aside>

        <section className={`flex min-w-0 flex-1 flex-col ${activeId ? "" : "hidden sm:flex"}`}>
          {!activeId ? (
            <div className="flex flex-1 items-center justify-center text-sm text-[#6B7280]">Pick a conversation to get started.</div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-[#E8F5E9] px-4 py-3">
                <button onClick={() => setActiveId(null)} className="rounded-full p-1 text-lg hover:bg-gray-100 sm:hidden" aria-label="Back">
                  ←
                </button>
                {activeOther && <Avatar name={activeOther.name} url={activeOther.avatarUrl} size={32} />}
                <span className="font-semibold text-[#1F2937]">{activeOther?.name ?? "…"}</span>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {messages === null ? (
                  <p className="text-sm text-[#6B7280]">Loading…</p>
                ) : (
                  messages.map((m) =>
                    m.isSystem ? (
                      <p key={m.id} className="mx-auto max-w-xs rounded-full bg-[#E8F5E9] px-3 py-1.5 text-center text-xs text-[#256428]">
                        {m.body}
                      </p>
                    ) : (
                      <div key={m.id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
                        <div
                          title={formatDateTime(m.createdAt)}
                          className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                            m.mine ? "bg-[#2E7D32] text-white" : "bg-gray-100 text-[#1F2937]"
                          }`}
                        >
                          {m.body}
                        </div>
                      </div>
                    )
                  )
                )}
                <div ref={bottomRef} />
              </div>

              {error && <p role="alert" className="px-4 pb-1 text-xs text-red-600">{error}</p>}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
                className="flex gap-2 border-t border-[#E8F5E9] p-2.5 sm:p-3"
              >
                <label htmlFor="message-input" className="sr-only">Message</label>
                <input
                  id="message-input"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  maxLength={2000}
                  placeholder="Write a message…"
                  className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                />
                <button
                  type="submit"
                  disabled={sending || !draft.trim()}
                  className="shrink-0 rounded-full bg-[#2E7D32] px-4 py-2 text-sm font-semibold text-white hover:bg-[#256428] disabled:opacity-60 sm:px-5"
                >
                  Send
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<main className="flex-1 bg-[#F7FAF7] px-4 py-6 sm:py-10" />}>
      <MessagesPageInner />
    </Suspense>
  );
}
