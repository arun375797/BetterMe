import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { encode } = require("fast-png");

const scriptDir = dirname(fileURLToPath(import.meta.url));
const outputDir = resolve(scriptDir, "../public/icons");
const samples = 4;

const colors = {
  background: [23, 28, 42],
  teal: [60, 230, 212],
  cyan: [110, 200, 255],
  gold: [232, 195, 106],
};

function mix(a, b, amount) {
  return a.map((value, index) => value + (b[index] - value) * amount);
}

function gradient(x, y) {
  const amount = Math.max(0, Math.min(1, (x - y + 24) / 48));
  return amount < 0.55
    ? mix(colors.teal, colors.cyan, amount / 0.55)
    : mix(colors.cyan, colors.gold, (amount - 0.55) / 0.45);
}

function roundedRectDistance(x, y, left, top, right, bottom, radius) {
  const centerX = (left + right) / 2;
  const centerY = (top + bottom) / 2;
  const qx = Math.abs(x - centerX) - (right - left) / 2 + radius;
  const qy = Math.abs(y - centerY) - (bottom - top) / 2 + radius;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius;
}

function segmentDistance(x, y, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const amount = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / lengthSquared));
  return Math.hypot(x - (ax + amount * dx), y - (ay + amount * dy));
}

function blend(target, color, alpha) {
  const inverse = 1 - alpha;
  return target.map((value, index) => value * inverse + color[index] * alpha);
}

function sampleLogo(x, y, maskable) {
  let color = maskable ? [...colors.background] : [13, 17, 32];
  const scale = maskable ? 0.82 : 1;
  const px = (x - 16) / scale + 16;
  const py = (y - 16) / scale + 16;
  const rectDistance = roundedRectDistance(px, py, 1.5, 1.5, 30.5, 30.5, 8);

  if (rectDistance <= 0) {
    color = [...colors.background];
    const fill = mix(colors.teal, colors.gold, Math.max(0, Math.min(1, (px + py - 12) / 40)));
    color = blend(color, fill, 0.16);
  }
  if (Math.abs(rectDistance) <= 0.75) color = gradient(px, py);

  const points = [[9, 21.5], [14, 16], [18, 19.5], [23, 11]];
  let lineDistance = Infinity;
  for (let index = 0; index < points.length - 1; index += 1) {
    lineDistance = Math.min(
      lineDistance,
      segmentDistance(px, py, ...points[index], ...points[index + 1]),
    );
  }
  if (lineDistance <= 1.2) color = gradient(px, py);
  if (Math.hypot(px - 23, py - 11) <= 2.4) color = [...colors.teal];
  if (segmentDistance(px, py, 9, 21.5, 14.5, 21.5) <= 1.1) {
    color = blend(color, colors.gold, 0.9);
  }
  return color;
}

function render(size, maskable = false) {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const accumulated = [0, 0, 0];
      for (let sy = 0; sy < samples; sy += 1) {
        for (let sx = 0; sx < samples; sx += 1) {
          const logoX = ((x + (sx + 0.5) / samples) / size) * 32;
          const logoY = ((y + (sy + 0.5) / samples) / size) * 32;
          const color = sampleLogo(logoX, logoY, maskable);
          for (let channel = 0; channel < 3; channel += 1) accumulated[channel] += color[channel];
        }
      }
      const offset = (y * size + x) * 4;
      for (let channel = 0; channel < 3; channel += 1) {
        data[offset + channel] = Math.round(accumulated[channel] / (samples * samples));
      }
      data[offset + 3] = 255;
    }
  }
  return encode({ width: size, height: size, data, channels: 4, depth: 8 });
}

await mkdir(outputDir, { recursive: true });
await Promise.all([
  writeFile(resolve(outputDir, "betterme-32.png"), render(32)),
  writeFile(resolve(outputDir, "betterme-180.png"), render(180)),
  writeFile(resolve(outputDir, "betterme-192.png"), render(192)),
  writeFile(resolve(outputDir, "betterme-512.png"), render(512)),
  writeFile(resolve(outputDir, "betterme-maskable-512.png"), render(512, true)),
]);

console.log("Generated BetterMe install icons in public/icons.");
