import type { Context } from "@netlify/functions";
import { app } from "../../backend/src/app.js";
import { initializeDatabase } from "../../backend/src/db/index.js";

// Initialize database once on cold start
let dbInitialized = false;

async function ensureDb() {
  if (!dbInitialized) {
    await initializeDatabase();
    dbInitialized = true;
  }
}

export default async (req: Request, context: Context) => {
  await ensureDb();

  return new Promise<Response>((resolve, reject) => {
    // Convert Web API Request to Node IncomingMessage-like object
    const url = new URL(req.url);

    const chunks: Uint8Array[] = [];

    const nodeReq = Object.assign(Object.create(require("http").IncomingMessage.prototype), {
      method: req.method,
      url: url.pathname + url.search,
      headers: Object.fromEntries(req.headers.entries()),
      socket: { remoteAddress: context.ip || "127.0.0.1" },
    });

    // Pipe body
    req.arrayBuffer().then((bodyBuffer) => {
      const body = Buffer.from(bodyBuffer);

      let bodyRead = false;
      nodeReq.read = () => {
        if (!bodyRead) {
          bodyRead = true;
          return body;
        }
        return null;
      };

      nodeReq.on = (event: string, handler: Function) => {
        if (event === "data" && body.length > 0) {
          setTimeout(() => handler(body), 0);
        }
        if (event === "end") {
          setTimeout(() => handler(), 0);
        }
        return nodeReq;
      };

      // Build a minimal ServerResponse-like object
      const headers: Record<string, string> = {};
      let statusCode = 200;
      let responseBody = "";

      const nodeRes = {
        statusCode,
        setHeader(name: string, value: string) {
          headers[name.toLowerCase()] = value;
        },
        getHeader(name: string) {
          return headers[name.toLowerCase()];
        },
        removeHeader(name: string) {
          delete headers[name.toLowerCase()];
        },
        writeHead(code: number, hdrs?: Record<string, string>) {
          statusCode = code;
          nodeRes.statusCode = code;
          if (hdrs) {
            Object.entries(hdrs).forEach(([k, v]) => {
              headers[k.toLowerCase()] = v;
            });
          }
        },
        end(data?: string | Buffer) {
          if (data) {
            responseBody = typeof data === "string" ? data : data.toString();
          }
          resolve(
            new Response(responseBody || null, {
              status: nodeRes.statusCode,
              headers,
            })
          );
        },
        write(data: string | Buffer) {
          responseBody += typeof data === "string" ? data : data.toString();
          return true;
        },
        on() { return nodeRes; },
        once() { return nodeRes; },
        emit() { return false; },
      };

      try {
        (app as any).handle(nodeReq, nodeRes, (err: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(new Response("Not Found", { status: 404 }));
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  });
};
