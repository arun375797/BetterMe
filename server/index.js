import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import learningRoutes from "./routes/learning.js";
import sugarRoutes from "./routes/sugar.js";
import vitaminRoutes from "./routes/vitamins.js";
import foodRoutes from "./routes/food.js";
import exerciseRoutes from "./routes/exercise.js";
import notebookRoutes from "./routes/notebooks.js";
import personalityRoutes from "./routes/personality.js";
import { ensureSubjects, renamePracticalSolveTitles, ensureTopicSerialNumbers } from "./seed.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/learning", learningRoutes);
app.use("/api/sugar", sugarRoutes);
app.use("/api/vitamins", vitaminRoutes);
app.use("/api/food", foodRoutes);
app.use("/api/exercise", exerciseRoutes);
app.use("/api/notebooks", notebookRoutes);
app.use("/api/personality", personalityRoutes);

async function start() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
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
    app.listen(PORT, () => {
      console.log(`API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Could not start server. Is MongoDB running?");
    console.error(error.message);
    process.exit(1);
  }
}

start();
