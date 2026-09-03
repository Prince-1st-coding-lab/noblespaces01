import { supabase } from "@/integrations/supabase/client";

export type NotifyLine = { label: string; value: string };

/**
 * Fire-and-forget admin email notification.
 * Never throws — a failed notification must not break the customer flow.
 */
export const notifyAdminEmail = async (input: {
  event: "order" | "booking" | "quote" | "message" | "low_stock";
  subject: string;
  title?: string;
  lines: NotifyLine[];
  dedupeKey?: string;
}) => {
  try {
    await supabase.functions.invoke("send-notification-email", {
      body: {
        event: input.event,
        subject: input.subject,
        title: input.title ?? input.subject,
        lines: input.lines.filter((l) => l.value),
        dedupeKey: input.dedupeKey,
      },
    });
  } catch (e) {
    console.warn("notifyAdminEmail failed", e);
  }
};
