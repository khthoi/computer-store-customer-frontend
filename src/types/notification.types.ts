// Customer notification types — ground truth shape consumed by storefront UI.
// Mirrors backend `GET /notifications` payload (after apiFetch unwraps envelope).

export type NotificationChannel = "Email" | "SMS" | "Push";
export type NotificationStatus = "ChuaGui" | "DaGui" | "ThatBai" | "HuyBo";

export interface CustomerNotification {
  id: number;
  type: string;
  title: string;
  content: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  isRead: boolean;
  relatedEntity: string | null;
  relatedEntityId: number | null;
  createdAt: string;
}

export interface NotificationsResult {
  items: CustomerNotification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
}

export interface GetMyNotificationsParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}
