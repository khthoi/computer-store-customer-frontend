"use client";

import Image from "next/image";
import type { TicketMessage } from "@/src/types/account-support.types";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MessageThread({ messages }: { messages: TicketMessage[] }) {
  if (messages.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-secondary-400">
        Chưa có tin nhắn nào.
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-3 px-5 py-4">
      {messages.map((m) => {
        const isCustomer = m.role === "customer";
        const isSystem = m.role === "system";
        if (isSystem) {
          return (
            <li key={m.id} className="text-center text-xs text-secondary-400">
              {m.content} · {formatDateTime(m.sentAt)}
            </li>
          );
        }
        return (
          <li
            key={m.id}
            className={
              isCustomer
                ? "flex flex-col items-end"
                : "flex flex-col items-start"
            }
          >
            <p
              className={[
                "mb-1 px-1 text-[11px] font-semibold",
                isCustomer ? "text-primary-700" : "text-secondary-600",
              ].join(" ")}
            >
              {m.senderName}
              <span className="ml-1 font-normal text-secondary-400">
                · {isCustomer ? "Khách hàng" : "Hỗ trợ viên"}
              </span>
            </p>
            <div
              className={[
                "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                isCustomer
                  ? "bg-primary-600 text-white"
                  : "bg-secondary-100 text-secondary-900",
              ].join(" ")}
            >
              <p className="whitespace-pre-line">{m.content}</p>
              {m.attachments && m.attachments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {m.attachments.map((a) => {
                    const isImage = /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(a.name) || a.url.startsWith("blob:");
                    const href = a.url.startsWith("/")
                      ? `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}${a.url}`
                      : a.url;
                    return isImage ? (
                      <a
                        key={a.id}
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="block h-16 w-16 overflow-hidden rounded border border-secondary-200 bg-white"
                      >
                        <Image
                          src={href}
                          alt={a.name}
                          width={64}
                          height={64}
                          unoptimized
                          className="h-full w-full object-cover"
                        />
                      </a>
                    ) : (
                      <a
                        key={a.id}
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className={[
                          "inline-flex max-w-[200px] items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs",
                          isCustomer
                            ? "bg-primary-700/40 text-white"
                            : "border border-secondary-200 bg-white text-secondary-700",
                        ].join(" ")}
                      >
                        <span className="truncate">📎 {a.name}</span>
                      </a>
                    );
                  })}
                </div>
              )}
              <p
                className={[
                  "mt-1 text-[10px]",
                  isCustomer ? "text-primary-100" : "text-secondary-400",
                ].join(" ")}
              >
                {formatDateTime(m.sentAt)}
              </p>
            </div>
            {isCustomer && m.status && (
              <p
                className={[
                  "mt-1 px-1 text-[11px]",
                  m.status === "failed" ? "text-error-600" : "text-secondary-400",
                ].join(" ")}
              >
                {statusLabel(m.status)}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function statusLabel(status: NonNullable<TicketMessage["status"]>): string {
  switch (status) {
    case "sending":  return "Đang gửi...";
    case "sent":     return "Đã gửi";
    case "awaiting": return "Đang chờ phản hồi";
    case "failed":   return "Gửi thất bại";
  }
}
