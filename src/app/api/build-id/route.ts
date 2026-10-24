export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({
    commitSha: process.env.GIT_COMMIT_SHA || "HEAD-LOCAL",
  });
}
