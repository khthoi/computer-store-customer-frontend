export type TicketStatus = "in_progress" | "resolved";

export type TicketPriority = "KhanCap" | "Cao" | "TrungBinh" | "Thap";

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  KhanCap: "Khẩn cấp",
  Cao: "Cao",
  TrungBinh: "Trung bình",
  Thap: "Thấp",
};

export const TICKET_PRIORITY_BADGE: Record<
  TicketPriority,
  "error" | "warning" | "info" | "success"
> = {
  KhanCap: "error",
  Cao: "warning",
  TrungBinh: "info",
  Thap: "success",
};

export type TicketCategory =
  | "HoiTin"
  | "KhieuNai"
  | "YeuCauDoiTra"
  | "LoiKyThuat"
  | "Khac";

export const TICKET_CATEGORY_LABELS: Record<TicketCategory, string> = {
  HoiTin: "Hỏi tin",
  KhieuNai: "Khiếu nại",
  YeuCauDoiTra: "Yêu cầu đổi/trả",
  LoiKyThuat: "Lỗi kỹ thuật",
  Khac: "Khác",
};

export const TICKET_CATEGORY_OPTIONS: ReadonlyArray<{ value: TicketCategory; label: string }> =
  Object.entries(TICKET_CATEGORY_LABELS).map(([value, label]) => ({
    value: value as TicketCategory,
    label,
  }));

export interface TicketAttachment {
  id: string;
  url: string;
  name: string;
}

export type TicketMessageStatus = "sending" | "sent" | "awaiting" | "failed";

export interface TicketMessage {
  id: string;
  role: "customer" | "staff" | "system";
  senderName: string;
  senderAvatar?: string;
  content: string;
  sentAt: string;
  attachments?: TicketAttachment[];
  // UI-derived state — not persisted by backend
  status?: TicketMessageStatus;
}

export interface SupportTicket {
  id: string;
  numericId: number;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  orderId?: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
}
