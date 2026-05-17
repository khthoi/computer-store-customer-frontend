import { apiFetch } from "@/src/services/api";
import type {
  CustomerNotification,
  GetMyNotificationsParams,
  NotificationsResult,
} from "@/src/types/notification.types";

/** Event dispatched after any notification mutation so the bell can refetch. */
export const NOTIFICATION_CHANGED_EVENT = "notification:changed";

interface RawNotificationsResult {
  items: CustomerNotification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
}

export async function getMyNotifications(
  params: GetMyNotificationsParams = {},
): Promise<NotificationsResult> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.unreadOnly) qs.set("unreadOnly", "true");
  const query = qs.toString();
  const raw = await apiFetch<RawNotificationsResult>(
    `/notifications${query ? `?${query}` : ""}`,
  );
  return raw;
}

export async function markNotificationRead(id: number): Promise<CustomerNotification> {
  const result = await apiFetch<CustomerNotification>(`/notifications/${id}/read`, {
    method: "PUT",
  });
  dispatchChanged();
  return result;
}

export async function markAllNotificationsRead(): Promise<{ updated: number }> {
  const result = await apiFetch<{ updated: number }>(`/notifications/read-all`, {
    method: "PUT",
  });
  dispatchChanged();
  return result;
}

function dispatchChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(NOTIFICATION_CHANGED_EVENT));
}
