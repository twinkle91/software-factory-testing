import { readDatabase, updateDatabase } from "./store";

const processState = globalThis as typeof globalThis & {
  memoFlowFeedback?: {
    delivering: boolean;
    interval?: ReturnType<typeof setInterval>;
  };
};
processState.memoFlowFeedback ??= { delivering: false };
const worker = processState.memoFlowFeedback;

export async function deliverPendingFeedback(onlyId?: string) {
  if (worker.delivering || !process.env.FACTORY_WEBHOOK_URL) return;
  worker.delivering = true;
  try {
    const database = await readDatabase();
    for (const feedback of database.feedback) {
      if (
        (onlyId !== undefined && feedback.id !== onlyId) ||
        feedback.delivery.status === "delivered" ||
        Date.parse(feedback.delivery.nextAttemptAt) > Date.now()
      ) {
        continue;
      }
      let errorMessage: string | undefined;
      try {
        const response = await fetch(process.env.FACTORY_WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": feedback.id,
            ...(process.env.FACTORY_INTAKE_TOKEN
              ? { Authorization: `Bearer ${process.env.FACTORY_INTAKE_TOKEN}` }
              : {}),
          },
          body: JSON.stringify({
            eventId: feedback.id,
            source: "memoflow",
            type: "feedback",
            title: feedback.message.slice(0, 120),
            description: feedback.message,
            message: feedback.message,
            feedbackId: feedback.id,
            createdAt: feedback.createdAt,
          }),
          signal: AbortSignal.timeout(3000),
        });
        if (!response.ok)
          errorMessage = `Factory returned HTTP ${response.status}`;
        await response.body?.cancel();
      } catch {
        errorMessage = "Factory is temporarily unreachable";
      }
      await updateDatabase((db) => {
        const record = db.feedback.find((entry) => entry.id === feedback.id);
        if (!record) return;
        record.delivery.attempts += 1;
        record.delivery.lastError = errorMessage;
        if (errorMessage) {
          const delay = Math.min(
            300_000,
            1000 * 2 ** Math.min(record.delivery.attempts, 9),
          );
          record.delivery.nextAttemptAt = new Date(
            Date.now() + delay,
          ).toISOString();
        } else {
          record.delivery.status = "delivered";
          record.delivery.deliveredAt = new Date().toISOString();
        }
      });
    }
  } finally {
    worker.delivering = false;
  }
}

export function startFeedbackWorker() {
  if (worker.interval) return;
  void deliverPendingFeedback().catch((error) =>
    console.error("Feedback retry failed", error),
  );
  worker.interval = setInterval(() => {
    void deliverPendingFeedback().catch((error) =>
      console.error("Feedback retry failed", error),
    );
  }, 5000);
  worker.interval.unref();
}
