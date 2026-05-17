import { NotificationsPageInner } from "@/src/components/account/notifications/NotificationsPageInner";
import { getMyNotifications } from "@/src/services/notification.service";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const initialData = await getMyNotifications({ page: 1, limit: 20 });
  return <NotificationsPageInner initialData={initialData} />;
}
