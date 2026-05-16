import { notFound } from "next/navigation";
import { TicketDetailPageInner } from "@/src/components/account/support/TicketDetailPageInner";
import { getMyTicketDetail } from "@/src/services/account-support.service";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ ticketId: string }>;
}

export default async function SupportTicketDetailPage({ params }: Props) {
  const { ticketId } = await params;
  const numericId = Number(ticketId);
  if (!Number.isInteger(numericId)) notFound();

  try {
    const ticket = await getMyTicketDetail(numericId);
    return <TicketDetailPageInner ticket={ticket} />;
  } catch {
    notFound();
  }
}
