import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import FoodItem from "../models/FoodItem.js";
import { BREAKFAST_STYLES } from "../data/breakfastStyles.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

async function run() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing.");
  }
  await mongoose.connect(process.env.MONGODB_URI);

  const keep = new Set(BREAKFAST_STYLES.map((item) => item.name));
  let upserted = 0;
  for (const item of BREAKFAST_STYLES) {
    await FoodItem.findOneAndUpdate(
      { name: item.name },
      { ...item, demo: false },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    upserted += 1;
  }

  const extra = await FoodItem.find({
    name: { $nin: [...keep] },
  }).lean();
  const removed = extra.map((item) => item.name);
  if (removed.length) {
    await FoodItem.deleteMany({ _id: { $in: extra.map((item) => item._id) } });
  }

  console.log(`Kept/upserted ${upserted} Kerala meal styles.`);
  console.log(
    removed.length
      ? `Removed non-Kerala plates: ${removed.join(", ")}`
      : "Nothing extra to remove."
  );
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
