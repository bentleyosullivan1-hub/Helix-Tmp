import "dotenv/config";
import { createServer } from "node:http";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { server as wisp, logging } from "@mercuryworkshop/wisp-js/server";
import { scramjetPath } from "@mercuryworkshop/scramjet/path";
import { libcurlPath } from "@mercuryworkshop/libcurl-transport";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";
import setPremiumHandler from "./api/admin/set-premium.js";

const sitePath = fileURLToPath(new URL("./", import.meta.url));
const PORT = Number(process.env.PORT || 8080);

logging.set_level(logging.NONE);

Object.assign(wisp.options, {
  allow_udp_streams: false
});

const app = Fastify({
  serverFactory: handler =>
    createServer()
      .on("request", (req, res) => {
        res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
        res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
        handler(req, res);
      })
      .on("upgrade", (req, socket, head) => {
        if (req.url?.endsWith("/wisp/")) {
          wisp.routeRequest(req, socket, head);
        } else {
          socket.end();
        }
      })
});

app.register(fastifyStatic, {
  root: sitePath,
  decorateReply: true
});

app.register(fastifyStatic, {
  root: join(sitePath, "css"),
  prefix: "/css/",
  decorateReply: false
});

app.register(fastifyStatic, {
  root: join(sitePath, "js"),
  prefix: "/js/",
  decorateReply: false
});

app.register(fastifyStatic, {
  root: scramjetPath,
  prefix: "/scram/",
  decorateReply: false
});

app.register(fastifyStatic, {
  root: libcurlPath,
  prefix: "/libcurl/",
  decorateReply: false
});

app.register(fastifyStatic, {
  root: baremuxPath,
  prefix: "/baremux/",
  decorateReply: false
});

// Reuse the exact same handler Vercel runs at /api/admin/set-premium,
// via a minimal shim translating Fastify's (request, reply) into the
// (req, res) shape Vercel serverless functions receive.
app.post("/api/admin/set-premium", async (request, reply) => {
  const res = {
    _status: 200,
    status(code) {
      this._status = code;
      return this;
    },
    json(body) {
      reply.code(this._status).send(body);
    },
    setHeader(name, value) {
      reply.header(name, value);
    }
  };

  await setPremiumHandler(
    { method: "POST", headers: request.headers, body: request.body },
    res
  );
});

app.setNotFoundHandler((req, reply) => {
  reply.code(404).send("Not found");
});

await app.listen({
  host: "127.0.0.1",
  port: PORT
});

console.log(`HELIX // Scramjet running at http://localhost:${PORT}/viewer.html`);
