export const PERSONALITY_SECTIONS = {
  books: {
    slug: "books",
    label: "Book read",
    addLabel: "Add a book",
    title: "Books to read and books I have read",
    blurb:
      "Keep a list of books you want to read and books you have already finished. Open a book to add notes.",
    itemLabel: "Book",
    subtitleLabel: "Author",
    subtitlePlaceholder: "Optional author",
    detailsPlaceholder: "Why you want to read it, notes, quotes…",
  },
  technology: {
    slug: "technology",
    label: "New technology",
    addLabel: "Add technology",
    title: "Technologies I am interested in",
    blurb:
      "Add a technology as a card. Open it to write what it is and why it matters to you.",
    itemLabel: "Technology",
    subtitleLabel: "Short note",
    subtitlePlaceholder: "Optional one-line interest",
    detailsPlaceholder: "What it is, why you care, links, next steps…",
  },
  language: {
    slug: "language",
    label: "New IT language",
    addLabel: "Add language",
    title: "IT languages I want to learn",
    blurb:
      "Add each language as a card. Open it to keep details, notes, and what you want to practice.",
    itemLabel: "Language",
    subtitleLabel: "Short note",
    subtitlePlaceholder: "Optional one-line note",
    detailsPlaceholder: "Why this language, what you will build, notes…",
  },
  english: {
    slug: "english",
    label: "English",
    addLabel: "Add card",
    title: "English practice cards",
    blurb:
      "Make a card for each topic. Open the card to add or edit the details on its own page.",
    itemLabel: "Card",
    subtitleLabel: "Short note",
    subtitlePlaceholder: "Optional one-line note",
    detailsPlaceholder: "Notes, examples, or practice for this card…",
  },
  presentation: {
    slug: "presentation",
    label: "Presentation",
    addLabel: "Add card",
    title: "Presentation cards",
    blurb:
      "Each card is a talk or slide set. Open it to write the outline and notes.",
    itemLabel: "Card",
    subtitleLabel: "Short note",
    subtitlePlaceholder: "Optional one-line note",
    detailsPlaceholder: "Outline, talking points, rehearsal notes…",
  },
  certifications: {
    slug: "certifications",
    label: "Certifications",
    addLabel: "Add certification",
    title: "Certifications I care about",
    blurb:
      "Add a card for each certification. Open it to track details and progress.",
    itemLabel: "Certification",
    subtitleLabel: "Short note",
    subtitlePlaceholder: "Optional exam or provider",
    detailsPlaceholder: "Status, dates, study notes…",
  },
};

export const PERSONALITY_NAV = [
  { label: "Book read", path: "/personality/books", slug: "books" },
  { label: "New technology", path: "/personality/technology", slug: "technology" },
  { label: "New IT language", path: "/personality/language", slug: "language" },
  { label: "English", path: "/personality/english", slug: "english" },
  { label: "Presentation", path: "/personality/presentation", slug: "presentation" },
  {
    label: "Certifications",
    path: "/personality/certifications",
    slug: "certifications",
  },
];
