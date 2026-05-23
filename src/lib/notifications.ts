import { db } from "./db";

export type NotificationType =
  | "PMF_ASSIGNED"
  | "PMF_SELF_SUBMITTED"
  | "PMF_MANAGER_SUBMITTED"
  | "PMF_FINALIZED"
  | "PMF_REOPENED"
  | "KUDOS_RECEIVED"
  | "ONEONONE_SCHEDULED"
  | "PIP_STARTED"
  | "PIP_UPDATED"
  | "INFO";

export async function notify(opts: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}) {
  try {
    await db.notification.create({
      data: {
        userId: opts.userId,
        type: opts.type,
        title: opts.title,
        body: opts.body ?? null,
        link: opts.link ?? null,
      },
    });
  } catch (e) {
    console.error("notify failed", e);
  }
}

export async function notifyMany(userIds: string[], opts: { type: NotificationType; title: string; body?: string; link?: string }) {
  await Promise.all(userIds.map((id) => notify({ userId: id, ...opts })));
}
