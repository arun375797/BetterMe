import { Router } from "express";
import Book, { ACCENTS } from "../models/Book.js";
import BookPage from "../models/BookPage.js";

const router = Router();

function htmlToText(html) {
  return String(html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function blocksToHtml(notebook) {
  if (!notebook?.blocks?.length) return "";
  return notebook.blocks
    .map((block) => {
      if (block.type === "code") {
        const code = String(block.code || "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        return `<pre>${code}</pre>`;
      }
      return block.html || "";
    })
    .join("");
}

function pageHtml(page) {
  if (page.html) return page.html;
  return blocksToHtml(page.notebook);
}

function pageHeading(page, index = 0) {
  const heading = String(page.heading || page.title || "").trim();
  return heading || `Page ${index + 1}`;
}

function extractHeadings(page, index) {
  const html = pageHtml(page);
  const main = pageHeading(page, index);
  const headings = [{ text: main, level: 1 }];
  const seen = new Set([main.toLowerCase()]);
  const re = /<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let match;
  while ((match = re.exec(html))) {
    const text = htmlToText(match[2]);
    const key = text.toLowerCase();
    if (!text || seen.has(key)) continue;
    seen.add(key);
    headings.push({ text, level: Number(match[1]) });
  }
  return headings;
}

function publicPage(page, index) {
  return {
    _id: page._id,
    heading: pageHeading(page, index),
    html: pageHtml(page),
    order: page.order,
    updatedAt: page.updatedAt,
    headings: extractHeadings(page, index),
  };
}

function publicPageMeta(page, index) {
  const item = publicPage(page, index);
  return {
    _id: item._id,
    heading: item.heading,
    order: item.order,
    updatedAt: item.updatedAt,
    headings: item.headings,
  };
}

async function nextPageOrder(bookId) {
  const last = await BookPage.findOne({ book: bookId }).sort({ order: -1 }).lean();
  return (last?.order ?? 0) + 1;
}

router.get("/", async (_req, res) => {
  const books = await Book.find().sort({ order: 1, createdAt: 1 }).lean();
  const counts = await BookPage.aggregate([
    { $group: { _id: "$book", pages: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(
    counts.map((row) => [String(row._id), row.pages])
  );
  res.json({
    books: books.map((book) => ({
      ...book,
      pageCount: countMap[String(book._id)] || 0,
    })),
  });
});

router.post("/", async (req, res) => {
  const title = String(req.body?.title || "").trim();
  const description = String(req.body?.description || "").trim();
  const accent = ACCENTS.includes(req.body?.accent) ? req.body.accent : "gold";
  if (!title) {
    return res.status(400).json({ message: "Give the notebook a name." });
  }
  const last = await Book.findOne().sort({ order: -1 }).lean();
  const book = await Book.create({
    title,
    description,
    accent,
    order: (last?.order ?? 0) + 1,
  });
  const page = await BookPage.create({
    book: book._id,
    heading: "Page 1",
    html: "",
    order: 1,
  });
  res.status(201).json({ ...book.toObject(), firstPageId: page._id });
});

router.get("/:bookId", async (req, res) => {
  const book = await Book.findById(req.params.bookId).lean();
  if (!book) {
    return res.status(404).json({ message: "Notebook not found." });
  }
  const pages = await BookPage.find({ book: book._id })
    .sort({ order: 1, createdAt: 1 })
    .lean();
  res.json({
    book,
    pages: pages.map((page, index) => publicPageMeta(page, index)),
  });
});

router.get("/:bookId/index", async (req, res) => {
  const book = await Book.findById(req.params.bookId).lean();
  if (!book) {
    return res.status(404).json({ message: "Notebook not found." });
  }
  const pages = await BookPage.find({ book: book._id })
    .sort({ order: 1, createdAt: 1 })
    .lean();
  res.json({
    book,
    pages: pages.map((page, index) => publicPageMeta(page, index)),
  });
});

router.patch("/:bookId", async (req, res) => {
  const book = await Book.findById(req.params.bookId);
  if (!book) {
    return res.status(404).json({ message: "Notebook not found." });
  }
  if (req.body.title !== undefined) {
    const title = String(req.body.title || "").trim();
    if (!title) {
      return res.status(400).json({ message: "Give the notebook a name." });
    }
    book.title = title;
  }
  if (req.body.description !== undefined) {
    book.description = String(req.body.description || "").trim();
  }
  if (ACCENTS.includes(req.body.accent)) {
    book.accent = req.body.accent;
  }
  await book.save();
  res.json(book);
});

router.delete("/:bookId", async (req, res) => {
  const book = await Book.findByIdAndDelete(req.params.bookId);
  if (!book) {
    return res.status(404).json({ message: "Notebook not found." });
  }
  await BookPage.deleteMany({ book: book._id });
  res.json({ ok: true });
});

router.post("/:bookId/pages", async (req, res) => {
  const book = await Book.findById(req.params.bookId);
  if (!book) {
    return res.status(404).json({ message: "Notebook not found." });
  }
  const order = await nextPageOrder(book._id);
  const heading =
    String(req.body?.heading || req.body?.title || "").trim() || `Page ${order}`;
  const page = await BookPage.create({
    book: book._id,
    heading,
    html: "",
    order,
  });
  res.status(201).json(publicPage(page, order - 1));
});

router.get("/:bookId/pages/:pageId", async (req, res) => {
  const pages = await BookPage.find({ book: req.params.bookId })
    .select("heading title order")
    .sort({ order: 1, createdAt: 1 })
    .lean();
  const index = pages.findIndex(
    (item) => String(item._id) === String(req.params.pageId)
  );
  if (index < 0) {
    return res.status(404).json({ message: "Page not found." });
  }
  const [book, page] = await Promise.all([
    Book.findById(req.params.bookId).lean(),
    BookPage.findById(req.params.pageId).lean(),
  ]);
  if (!page) {
    return res.status(404).json({ message: "Page not found." });
  }
  res.json({
    book,
    page: publicPage(page, index),
    pages: pages.map((item, i) => ({
      _id: item._id,
      heading: pageHeading(item, i),
      order: item.order,
    })),
    pageNumber: index + 1,
    pageCount: pages.length,
    prevPageId: index > 0 ? pages[index - 1]._id : null,
    nextPageId: index < pages.length - 1 ? pages[index + 1]._id : null,
  });
});

router.patch("/:bookId/pages/:pageId", async (req, res) => {
  const page = await BookPage.findOne({
    _id: req.params.pageId,
    book: req.params.bookId,
  });
  if (!page) {
    return res.status(404).json({ message: "Page not found." });
  }
  if (req.body.heading !== undefined || req.body.title !== undefined) {
    const heading = String(req.body.heading || req.body.title || "").trim();
    if (!heading) {
      return res.status(400).json({ message: "Give the page a heading." });
    }
    page.heading = heading;
  }
  if (req.body.html !== undefined) {
    page.html = String(req.body.html || "");
  }
  await page.save();
  res.json(page);
});

router.delete("/:bookId/pages/:pageId", async (req, res) => {
  const count = await BookPage.countDocuments({ book: req.params.bookId });
  if (count <= 1) {
    return res.status(400).json({
      message: "Keep at least one page in this notebook.",
    });
  }
  const deleted = await BookPage.findOneAndDelete({
    _id: req.params.pageId,
    book: req.params.bookId,
  });
  if (!deleted) {
    return res.status(404).json({ message: "Page not found." });
  }
  res.json({ ok: true });
});

export default router;
