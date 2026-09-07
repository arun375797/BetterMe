import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { DSA_PRACTICAL, DSA_PRACTICAL_SLUG } from "../data/dsaPractical.js";
import { runPracticalSeed } from "../lib/seedPracticalTree.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

runPracticalSeed({
  slug: DSA_PRACTICAL_SLUG,
  plan: DSA_PRACTICAL,
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
