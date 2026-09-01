import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import zlib from "node:zlib";
import { fileURLToPath } from "url";
import learningRoutes from "./routes/learning.js";
import sugarRoutes from "./routes/sugar.js";
import vitaminRoutes from "./routes/vitamins.js";
import foodRoutes from "./routes/food.js";
import exerciseRoutes from "./routes/exercise.js";
import notebookRoutes from "./routes/notebooks.js";
import personalityRoutes from "./routes/personality.js";
import todoRoutes from "./routes/todos.js";
import sleepRoutes from "./routes/sleep.js";
import reportRoutes from "./routes/report.js";
import sitBreakRoutes from "./routes/sitBreak.js";
import musicRoutes from "./routes/music.js";
import studyRoutes from "./routes/study.js";
import authRoutes from "./routes/auth.js";
import { requireAuth } from "./lib/auth.js";
import { memoClear } from "./memo.js";
import {
  ensureSubjects,
  renamePracticalSolveTitles,
  ensureTopicSerialNumbers,
  ensureSitBreakVideos,
  ensureNamasteDevIndex,
} from "./seed.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 5000;
const clientDist = path.join(__dirname, "../client/dist");

app.disable("x-powered-by");
app.use(cors({ maxAge: 86400 }));
app.use((req, res, next) => {
  if (!req.path.startsWith("/api")) return next();
  const accept = String(req.headers["accept-encoding"] || "");
  if (
    req.method === "HEAD" ||
    req.method === "OPTIONS" ||
    (!accept.includes("br") && !accept.includes("gzip"))
  ) {
    return next();
  }
  const rawEnd = res.end.bind(res);
  const rawWrite = res.write.bind(res);
  let stream = null;

  function start() {
    if (stream) return stream;
    if (accept.includes("br")) {
      stream = zlib.createBrotliCompress({
        params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 4 },
      });
      res.setHeader("Content-Encoding", "br");
    } else {
      stream = zlib.createGzip({ level: 5 });
      res.setHeader("Content-Encoding", "gzip");
    }
    res.removeHeader("Content-Length");
    res.setHeader("Vary", "Accept-Encoding");
    stream.on("data", (chunk) => rawWrite(chunk));
    stream.on("end", () => rawEnd());
    stream.on("error", () => rawEnd());
    return stream;
  }

  res.write = (chunk, encoding, cb) => start().write(chunk, encoding, cb);
  res.end = (chunk, encoding, cb) => {
    if (typeof encoding === "function") {
      cb = encoding;
      encoding = undefined;
    }
    const stream = start();
    if (chunk) stream.end(chunk, encoding, cb);
    else stream.end(cb);
  };
  next();
});
app.use(express.json({ limit: "5mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api", (req, res, next) => {
  if (req.path === "/health" || req.path.startsWith("/auth")) return next();
  return requireAuth(req, res, next);
});

app.use("/api/learning", learningRoutes);
app.use("/api/study", studyRoutes);
app.use("/api/sugar", sugarRoutes);
app.use("/api/vitamins", vitaminRoutes);
app.use("/api/food", foodRoutes);
app.use("/api/exercise", exerciseRoutes);
app.use("/api/notebooks", notebookRoutes);
app.use("/api/personality", personalityRoutes);
app.use("/api/todos", todoRoutes);
app.use("/api/sleep", sleepRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/sit-break", sitBreakRoutes);
app.use("/api/music", musicRoutes);

app.use("/api", (req, res) => {
  res.status(404).json({
    message:
      "API route not found. Restart the backend if you recently added new features.",
  });
});

app.use(
  express.static(clientDist, {
    setHeaders(res, filePath) {
      if (filePath.endsWith("index.html")) {
        res.setHeader("Cache-Control", "no-cache");
        return;
      }
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    },
  })
);
app.use((req, res, next) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return next();
  }
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ message: "Not found" });
  }
  const indexFile = path.join(clientDist, "index.html");
  if (!fs.existsSync(indexFile)) {
    return next();
  }
  res.setHeader("Cache-Control", "no-cache");
  res.sendFile(indexFile);
});

async function runBootJobs() {
  const subjectsCreated = await ensureSubjects();
  if (subjectsCreated) {
    console.log(`Created ${subjectsCreated} empty subject tracks.`);
  }
  const renamed = await renamePracticalSolveTitles();
  if (renamed) {
    console.log(`Renamed ${renamed} practical subtopic titles.`);
  }
  const numbered = await ensureTopicSerialNumbers();
  if (numbered) {
    console.log(`Filled serial numbers on ${numbered} topics/subtopics.`);
  }
  const sitBreak = await ensureSitBreakVideos();
  if (sitBreak) {
    console.log(`Seeded ${sitBreak} sit-break videos.`);
  }
  const namaste = await ensureNamasteDevIndex();
  if (namaste) {
    memoClear("learning");
    console.log(`Loaded Namaste Dev index (${namaste} videos).`);
  }
}

async function start() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 5,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 10000,
    });
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`API running on http://localhost:${PORT}`);
    });
    runBootJobs().catch((error) => {
      console.error("Startup maintenance failed:", error.message);
    });
  } catch (error) {
    console.error("Could not start server. Is MongoDB running?");
    console.error(error.message);
    process.exit(1);
  }
}

start();
