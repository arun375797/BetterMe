import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { MONGO_PRACTICAL, MONGO_PRACTICAL_SLUG } from "../data/mongoPractical.js";
import { verifyCollections } from "../data/mongoCollections.js";
import { runPracticalSeed } from "../lib/seedPracticalTree.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

runPracticalSeed({
  slug: MONGO_PRACTICAL_SLUG,
  plan: MONGO_PRACTICAL,
  // Refuse to seed if the sample data no longer fits the questions.
  before: () => {
    const problems = verifyCollections();
    if (problems.length) {
      throw new Error(
        `Sample data does not fit the questions:\n  - ${problems.join("\n  - ")}`
      );
    }
  },
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
