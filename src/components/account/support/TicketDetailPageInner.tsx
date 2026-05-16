"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/src/components/ui/Badge";
import { MessageThread } from "./MessageThread";
import { MessageInput } from "./MessageInput";
import {
  getMyTicketDetail,
  sendMessage,
} from "@/src/services/account-support.service";
import {
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_BADGE,
  TICKET_PRIORITY_LABELS,
  type SupportTicket,
  type TicketMessage,
} from "@/src/types/account-support.types";

export function TicketDetailPageInner({ ticket: initialTicket }: { ticket: SupportTicket }) {
  const [ticket, setTicket] = useState<SupportTicket>(initialTicket);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Optimistic placeholders (still being sent) — keyed by client-side temp id
  const [pending, setPending] = useState<TicketMessage[]>([]);

  // ── Silent refetch (used by SSE + after send) ──────────────────────────────
  const silentRefresh = useCallback(async () => {
    try {
      const fresh = await getMyTicketDetail(ticket.numericId);
      setTicket(fresh);
    } catch {
      /* keep current state */
    }
  }, [ticket.numericId]);

  // ── Realtime SSE subscription ──────────────────────────────────────────────
  const lastEventRef = useRef<number>(0);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const apiOrigin = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
    const ticketId = ticket.numericId;

    let es: EventSource | null = null;
    let cancelled = false;
    let refreshing = false;

    function readToken(): string | null {
      const raw = document.cookie
        .split("; ")
        .find((c) => c.startsWith("auth_token="))
        ?.split("=")[1];
      return raw ? decodeURIComponent(raw) : null;
    }

    async function refreshToken(): Promise<boolean> {
      if (refreshing) return false;
      refreshing = true;
      try {
        const res = await fetch(`${apiOrigin}/api/auth/refresh`, { method: "POST", credentials: "include" });
        if (!res.ok) return false;
        const body = await res.json();
        const newToken = body?.data?.accessToken;
        if (!newToken) return false;
        document.cookie = `auth_token=${encodeURIComponent(newToken)}; path=/; max-age=${15 * 60}; SameSite=Lax`;
        return true;
      } catch {
        return false;
      } finally {
        refreshing = false;
      }
    }

    function connect() {
      if (cancelled) return;
      const token = readToken();
      if (!token) return;
      es = new EventSource(`${apiOrigin}/api/support/tickets/${ticketId}/stream?access_token=${encodeURIComponent(token)}`);
      es.onmessage = () => {
        const now = Date.now();
        lastEventRef.current = now;
        setTimeout(() => { if (lastEventRef.current === now) silentRefresh(); }, 150);
      };
      es.onerror = async () => {
        if (!es || es.readyState !== EventSource.CLOSED) es?.close();
        const ok = await refreshToken();
        if (ok && !cancelled) connect();
      };
    }

    connect();
    return () => {
      cancelled = true;
      es?.close();
    };
  }, [ticket.numericId, silentRefresh]);

  // ── Send ───────────────────────────────────────────────────────────────────
  const handleSend = async (content: string, files: File[]) => {
    setSending(true);
    setError(null);
    const tempId = `tmp-${Date.now()}`;
    const optimistic: TicketMessage = {
      id: tempId,
      role: "customer",
      senderName: "Bạn",
      content,
      sentAt: new Date().toISOString(),
      status: "sending",
      attachments: files
        .filter((f) => f.type.startsWith("image/"))
        .map((f) => ({ id: `${tempId}-${f.name}`, url: URL.createObjectURL(f), name: f.name })),
    };
    setPending((prev) => [...prev, optimistic]);
    try {
      await sendMessage(ticket.numericId, content, files);
      // Refetch first so the persisted message replaces the optimistic one in the
      // render before we revoke the blob URLs (otherwise broken images flash).
      await silentRefresh();
      setPending((prev) => prev.filter((m) => m.id !== tempId));
      optimistic.attachments?.forEach((a) => { if (a.url.startsWith("blob:")) URL.revokeObjectURL(a.url); });
    } catch (err) {
      setPending((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: "failed" } : m)),
      );
      setError(err instanceof Error ? err.message : "Gửi tin nhắn thất bại.");
    } finally {
      setSending(false);
    }
  };

  // ── Derive composite list + status indicators ─────────────────────────────
  const merged: TicketMessage[] = [...ticket.messages, ...pending];
  const lastCustomerIdx = (() => {
    for (let i = merged.length - 1; i >= 0; i--) {
      if (merged[i].role === "customer") return i;
    }
    return -1;
  })();
  const annotated: TicketMessage[] = merged.map((m, i) => {
    if (m.role !== "customer") return m;
    if (m.status === "sending" || m.status === "failed") return m;
    // Most recent customer message with no later staff reply → awaiting reply
    const hasLaterStaffReply = merged.slice(i + 1).some((x) => x.role === "staff");
    if (i === lastCustomerIdx && !hasLaterStaffReply && ticket.status === "in_progress") {
      return { ...m, status: "awaiting" };
    }
    return { ...m, status: "sent" };
  });

  return (
    <div className="rounded-2xl border border-secondary-200 bg-white">
      <header className="border-b border-secondary-100 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-base font-bold text-secondary-900">
            {ticket.subject}
          </h1>
          <div className="flex items-center gap-2">
            <Badge variant={TICKET_PRIORITY_BADGE[ticket.priority]} dot>
              Ưu tiên: {TICKET_PRIORITY_LABELS[ticket.priority]}
            </Badge>
            <Badge variant={ticket.status === "in_progress" ? "warning" : "success"}>
              {ticket.status === "in_progress" ? "Đang xử lý" : "Đã giải quyết"}
            </Badge>
          </div>
        </div>
        <p className="mt-1 text-xs text-secondary-400">
          {TICKET_CATEGORY_LABELS[ticket.category]} · #{ticket.id}
          {ticket.orderId ? ` · Đơn ${ticket.orderId}` : ""}
        </p>
      </header>

      <MessageThread messages={annotated} />

      {ticket.status === "in_progress" ? (
        <>
          {error && (
            <p className="px-5 pb-2 text-sm text-error-600">{error}</p>
          )}
          <MessageInput onSend={handleSend} sending={sending} />
        </>
      ) : (
        <p className="border-t border-secondary-100 px-5 py-4 text-center text-sm text-secondary-400">
          Yêu cầu này đã được đóng. Không thể gửi thêm tin nhắn.
        </p>
      )}
    </div>
  );
}
