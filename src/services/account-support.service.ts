import { apiFetch } from "@/src/services/api";
import type {
  SupportTicket,
  TicketCategory,
  TicketMessage,
  TicketPriority,
  TicketStatus,
} from "@/src/types/account-support.types";

const STATUS_MAP: Record<string, TicketStatus> = {
  Moi: "in_progress",
  DangXuLy: "in_progress",
  DaGiaiQuyet: "resolved",
  DaDong: "resolved",
};

interface RawAttachment {
  attachmentId: number;
  fileName: string;
  fileUrl: string;
}

interface RawMessage {
  messageId: number;
  senderType: string;
  senderName?: string;
  senderAvatar?: string;
  noiDungTinNhan: string;
  loaiTinNhan: string;
  createdAt: string;
  attachments?: RawAttachment[];
}

interface RawTicketSummary {
  id: number;
  ticketCode: string;
  title: string;
  issueType: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  orderId: number | null;
}

interface RawTicketDetail {
  ticketId: number;
  maTicket: string;
  tieuDe: string;
  loaiVanDe: string;
  mucDoUuTien: string;
  trangThai: string;
  ngayTao: string;
  ngayCapNhat: string;
  donHangMa: string | null;
  donHangId: number | null;
  messages: RawMessage[];
}

function defaultSenderName(senderType: string): string {
  if (senderType === "KhachHang") return "Bạn";
  if (senderType === "NhanVien") return "Nhân viên hỗ trợ";
  return "Hệ thống";
}

function mapMessage(m: RawMessage): TicketMessage {
  const role: TicketMessage["role"] =
    m.senderType === "KhachHang"
      ? "customer"
      : m.senderType === "NhanVien"
        ? "staff"
        : "system";
  return {
    id: String(m.messageId),
    role,
    senderName:
      role === "customer"
        ? "Bạn"
        : m.senderName?.trim() || defaultSenderName(m.senderType),
    senderAvatar: m.senderAvatar,
    content: m.noiDungTinNhan,
    sentAt: m.createdAt,
    attachments: m.attachments?.map((a) => ({
      id: String(a.attachmentId),
      url: a.fileUrl,
      name: a.fileName,
    })),
  };
}

function mapSummary(t: RawTicketSummary): SupportTicket {
  return {
    id: t.ticketCode,
    numericId: t.id,
    subject: t.title,
    category: t.issueType as TicketCategory,
    priority: (t.priority as TicketPriority) ?? "TrungBinh",
    orderId: t.orderId != null ? String(t.orderId) : undefined,
    status: STATUS_MAP[t.status] ?? "in_progress",
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    messages: [],
  };
}

function mapDetail(t: RawTicketDetail): SupportTicket {
  return {
    id: t.maTicket,
    numericId: t.ticketId,
    subject: t.tieuDe,
    category: t.loaiVanDe as TicketCategory,
    priority: (t.mucDoUuTien as TicketPriority) ?? "TrungBinh",
    orderId: t.donHangMa ?? (t.donHangId != null ? String(t.donHangId) : undefined),
    status: STATUS_MAP[t.trangThai] ?? "in_progress",
    createdAt: t.ngayTao,
    updatedAt: t.ngayCapNhat,
    messages: t.messages.map(mapMessage),
  };
}

export interface PaginatedTickets {
  items: SupportTicket[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getMyTickets(
  params: { page?: number; limit?: number } = {},
): Promise<PaginatedTickets> {
  const qs = new URLSearchParams();
  qs.set("page", String(params.page ?? 1));
  qs.set("limit", String(params.limit ?? 10));
  const raw = await apiFetch<{
    items: RawTicketSummary[];
    total: number;
    page: number;
    limit: number;
    totalPages?: number;
  }>(`/support/tickets?${qs.toString()}`);
  const limit = raw.limit ?? params.limit ?? 10;
  return {
    items: raw.items.map(mapSummary),
    total: raw.total,
    page: raw.page,
    limit,
    totalPages: raw.totalPages ?? Math.max(1, Math.ceil(raw.total / limit)),
  };
}

export async function getMyTicketDetail(
  numericId: number,
): Promise<SupportTicket> {
  const raw = await apiFetch<RawTicketDetail>(`/support/tickets/${numericId}`);
  return mapDetail(raw);
}

export interface CreateTicketInput {
  orderNumericId?: number;
  category: TicketCategory;
  title: string;
  description: string;
}

export async function createTicket(
  input: CreateTicketInput,
): Promise<SupportTicket> {
  const body = {
    orderId: input.orderNumericId,
    issueType: input.category,
    title: input.title,
    description: input.description,
    channel: "Form",
  };
  const raw = await apiFetch<RawTicketSummary>("/support/tickets", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return mapSummary(raw);
}

export async function sendMessage(
  ticketNumericId: number,
  content: string,
  files: File[] = [],
): Promise<TicketMessage> {
  if (files.length === 0) {
    const raw = await apiFetch<RawMessage>(
      `/support/tickets/${ticketNumericId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({ content, messageType: "Reply" }),
      },
    );
    return mapMessage(raw);
  }
  const fd = new FormData();
  fd.append("content", content);
  fd.append("messageType", "Reply");
  for (const f of files) fd.append("files", f);
  const raw = await apiFetch<RawMessage>(
    `/support/tickets/${ticketNumericId}/messages`,
    { method: "POST", body: fd },
  );
  return mapMessage(raw);
}
