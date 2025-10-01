import { env } from "cloudflare:workers";
import { Hono } from "hono";

const app = new Hono();

app.post("/api/circlecut-upload", async (c) => {
  const formData = await c.req.formData();
  const file = formData.get("file") as File;

  // ここでファイルを処理する
  return c.json({ name: "Cloudflare" });
});

export default app;
