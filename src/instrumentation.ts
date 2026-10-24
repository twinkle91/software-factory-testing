export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { readDatabase } = await import("./lib/store");
    await readDatabase();
    const { startFeedbackWorker } = await import("./lib/feedback");
    startFeedbackWorker();
  }
}
