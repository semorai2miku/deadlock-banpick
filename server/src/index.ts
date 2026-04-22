import http from "node:http";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { env } from "./config/env.js";
import { healthRouter } from "./routes/health.js";
import { roomRouter } from "./routes/rooms.js";
import { registerRoomHandlers } from "./socket/registerRoomHandlers.js";

const app = express();

app.use(
  cors({
    origin: env.clientOrigin
  })
);
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    message: "Deadlock BanPick server is running."
  });
});

app.use("/health", healthRouter);
app.use("/rooms", roomRouter);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: env.clientOrigin
  }
});

io.on("connection", (socket) => {
  registerRoomHandlers(io, socket);
});

server.listen(env.port, () => {
  console.log(`Server listening on http://localhost:${env.port}`);
});
