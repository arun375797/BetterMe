// Sample data for the MongoDB practical questions.
//
// Everything here is deterministic: the same 50 documents come out on every run,
// so re-seeding never churns the stored snippets. The seed tables are hand
// tuned so the practical questions have interesting answers — unique second
// highest salary, employees with a missing phone, customers with no orders,
// duplicate emails, loss-making products, and so on. verifyCollections()
// asserts those properties.

const OID_BASE = {
  employees: "68b1e0a1c2d3e4f50101",
  students: "68b1e0a1c2d3e4f50202",
  users: "68b1e0a1c2d3e4f50303",
  orders: "68b1e0a1c2d3e4f50404",
  products: "68b1e0a1c2d3e4f50505",
  reviews: "68b1e0a1c2d3e4f50606",
  departments: "68b1e0a1c2d3e4f50707",
  sessions: "68b1e0a1c2d3e4f50808",
  places: "68b1e0a1c2d3e4f50909",
};

class Raw {
  constructor(text) {
    this.text = text;
  }
}

const raw = (text) => new Raw(text);
const oid = (name, index) =>
  raw(`ObjectId("${OID_BASE[name]}${index.toString(16).padStart(4, "0")}")`);
const date = (iso) => raw(`ISODate("${iso}")`);
const day = (isoDay) => date(`${isoDay}T00:00:00Z`);

const IDENT = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

function toShell(value, indent = 0, pretty = false) {
  if (value instanceof Raw) return value.text;
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);

  const pad = " ".repeat(indent + 2);
  const closePad = " ".repeat(indent);

  if (Array.isArray(value)) {
    if (!value.length) return "[]";
    const parts = value.map((item) => toShell(item, indent + 2, pretty));
    if (!pretty) return `[${parts.join(", ")}]`;
    return `[\n${parts.map((part) => pad + part).join(",\n")}\n${closePad}]`;
  }

  const entries = Object.entries(value).filter(([, v]) => v !== undefined);
  if (!entries.length) return "{}";
  const parts = entries.map(([k, v]) => {
    const label = IDENT.test(k) ? k : JSON.stringify(k);
    return `${label}: ${toShell(v, indent + 2, pretty)}`;
  });
  if (!pretty) return `{ ${parts.join(", ")} }`;
  return `{\n${parts.map((part) => pad + part).join(",\n")}\n${closePad}}`;
}

/* ------------------------------------------------------------------ employees */

// name, department, designation, salary, bonus, age, city, state, joined
const EMPLOYEE_SEED = [
  ["Arun Menon", "IT", "Senior Developer", 98000, 12000, 34, "Kochi", "Kerala", "2019-03-11"],
  ["Anita Sharma", "HR", "HR Manager", 76000, 9000, 41, "Kochi", "Kerala", "2017-07-01"],
  ["Sarath Kumar", "IT", "Developer", 62000, 7000, 28, "Thrissur", "Kerala", "2021-01-18"],
  ["Catherine Rose", "Finance", "Financial Analyst", 71000, 8000, 33, "Kochi", "Kerala", "2020-05-04"],
  ["Nithin Varghese", "IT", "Developer", 58000, 6000, 26, "Kollam", "Kerala", "2022-02-14"],
  ["Maria Joseph", "Sales", "Sales Executive", 43000, 47000, 25, "Alappuzha", "Kerala", "2023-06-19"],
  ["Bharath Krishnan", "IT", "Tech Lead", 94000, 11000, 37, "Kochi", "Kerala", "2018-09-03"],
  ["Divya Rajan", "Marketing", "Marketing Lead", 69000, 7500, 31, "Kozhikode", "Kerala", "2020-11-23"],
  ["Clive George", "Support", "Support Engineer", 38000, 3000, 27, "Kochi", "Kerala", "2022-08-08"],
  ["Aishwarya Pillai", "IT", "Developer", 61000, 6500, 25, "Thrissur", "Kerala", "2022-04-25"],
  ["Rohan Das", "Sales", "Sales Manager", 82000, 10000, 39, "Kannur", "Kerala", "2016-12-05"],
  ["Elizabeth John", "HR", "Recruiter", 47000, 4000, 29, "Kochi", "Kerala", "2021-09-13"],
  ["Karthik Nair", "IT", "Developer", 55000, 5500, 27, "Palakkad", "Kerala", "2021-11-29"],
  ["Shreya Menon", "Finance", "Accountant", 52000, 4500, 30, "Kochi", "Kerala", "2020-02-17"],
  ["Irfan Ali", "Sales", "Sales Executive", 41000, 45000, 23, "Malappuram", "Kerala", "2023-03-06"],
  ["Haritha Suresh", "Marketing", "Content Lead", 57000, 5200, 28, "Kozhikode", "Kerala", "2021-07-21"],
  ["Steven Mathew", "IT", "DevOps Engineer", 88000, 9500, 35, "Kochi", "Kerala", "2019-06-10"],
  ["Neha Verma", "HR", "HR Executive", 39000, 3200, 26, "Bengaluru", "Karnataka", "2022-10-04"],
  ["Omkar Deshpande", "IT", "Architect", 91000, 10500, 42, "Kochi", "Kerala", "2017-04-19"],
  ["Ananya Iyer", "Finance", "Finance Manager", 79000, 8800, 36, "Thrissur", "Kerala", "2018-08-27"],
  ["Varun Pillai", "Sales", "Sales Executive", 45000, 4600, 25, "Kollam", "Kerala", "2023-01-09"],
  ["Sharon Thomas", "Support", "Support Lead", 50000, 4800, 32, "Kochi", "Kerala", "2020-07-15"],
  ["Krishna Prasad", "IT", "Developer", 64000, 6800, 29, "Kochi", "Kerala", "2021-05-31"],
  ["Caroline Jose", "Marketing", "SEO Specialist", 48000, 4300, 27, "Kochi", "Kerala", "2022-06-13"],
  ["Sachin Menon", "IT", "Developer", 59000, 6100, 26, "Thrissur", "Kerala", "2022-03-28"],
  ["Priya Nambiar", "HR", "HR Executive", 37000, 3100, 24, "Kannur", "Kerala", "2023-05-22"],
  ["Ebin Jacob", "Support", "Support Engineer", 29000, 2400, 23, "Kochi", "Kerala", "2023-08-01"],
  ["Lakshmi Warrier", "Finance", "Accountant", 51000, 4400, 31, "Palakkad", "Kerala", "2020-09-09"],
  ["Rahul Bose", "Sales", "Sales Executive", 42000, 4100, 26, "Kochi", "Kerala", "2023-02-20"],
  ["Meera Krishnan", "IT", "QA Engineer", 53000, 5000, 28, "Kochi", "Kerala", "2021-10-11"],
  ["Tomy Sebastian", "Support", "Support Engineer", 27000, 2200, 25, "Idukki", "Kerala", "2023-09-18"],
  ["Gopika Menon", "Marketing", "Designer", 46000, 4000, 26, "Kochi", "Kerala", "2022-12-02"],
  ["Vishnu Prakash", "IT", "Developer", 60000, 6300, 27, "Kochi", "Kerala", "2022-01-16"],
  ["Fathima Beevi", "HR", "HR Executive", 36000, 3000, 25, "Malappuram", "Kerala", "2023-07-07"],
  ["Deepak Menon", "Sales", "Regional Manager", 85000, 9800, 40, "Kochi", "Kerala", "2016-05-30"],
  ["Sneha Pillai", "Finance", "Accountant", 49000, 4200, 29, "Kollam", "Kerala", "2021-03-24"],
  ["Ajay Kurian", "IT", "Developer", 57000, 5800, 28, "Thrissur", "Kerala", "2021-12-15"],
  ["Reshma Nair", "Marketing", "Marketing Executive", 44000, 3900, 27, "Kochi", "Kerala", "2022-09-26"],
  ["Manoj Chandran", "Support", "Support Engineer", 19000, 1500, 22, "Wayanad", "Kerala", "2024-01-08"],
  ["Jyothi Menon", "HR", "HR Executive", 35000, 2900, 27, "Kochi", "Kerala", "2023-04-17"],
  ["Praveen Kumar", "IT", "Developer", 56000, 5600, 26, "Kochi", "Kerala", "2022-05-09"],
  ["Anjali Menon", "Sales", "Sales Executive", 40000, 3800, 24, "Thrissur", "Kerala", "2023-10-23"],
  ["Nikhil Raj", "Finance", "Junior Accountant", 18000, 1200, 23, "Kochi", "Kerala", "2024-02-12"],
  ["Swathi Ramesh", "Marketing", "Marketing Executive", 43500, 3700, 26, "Kozhikode", "Kerala", "2022-11-14"],
  ["Ashwin Menon", "IT", "Intern", 19500, 1000, 21, "Kochi", "Kerala", "2024-03-04"],
  ["Grace Fernandez", "HR", "HR Executive", 38500, 3300, 30, "Kochi", "Kerala", "2021-08-30"],
  ["Sandeep Nair", "Sales", "Sales Executive", 44500, 4400, 28, "Kannur", "Kerala", "2022-07-25"],
  ["Ushas Raveendran", "IT", "Developer", 63000, 6600, 30, "Kochi", "Kerala", "2021-02-08"],
  ["Joe Antony", "Support", "Support Intern", 17000, 21000, 24, "Kochi", "Kerala", "2024-04-15"],
  ["Nayana Suresh", "Finance", "Accountant", 47500, 4100, 28, "Chennai", "Tamil Nadu", "2021-06-28"],
];

const SKILL_SETS = [
  ["MongoDB", "Node", "React"],
  ["Excel", "Communication"],
  ["MongoDB", "JavaScript", "Express", "Git"],
  ["Excel", "Tally", "GST"],
  ["JavaScript", "React"],
  ["CRM", "Negotiation"],
  ["MongoDB", "Node", "Docker", "AWS", "Kubernetes"],
  ["SEO", "Copywriting", "Analytics"],
  ["Zendesk", "Troubleshooting"],
  ["React", "CSS", "Figma"],
];

// Employees with no phone field at all, and employees whose phone is null.
const PHONE_MISSING = new Set([27, 31, 39, 45, 49]);
const PHONE_NULL = new Set([26, 34]);

function buildEmployees(departments) {
  const deptId = new Map();
  for (const dept of departments) {
    if (!deptId.has(dept.name)) deptId.set(dept.name, dept._id);
  }

  return EMPLOYEE_SEED.map((row, i) => {
    const index = i + 1;
    const [name, department, designation, salary, bonus, age, city, state, joined] = row;
    const doc = {
      _id: oid("employees", index),
      empNo: `E${String(index).padStart(3, "0")}`,
      name,
      email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@betterme.dev`,
      department,
      departmentId: deptId.get(department),
      designation,
      salary,
      bonus,
      age,
      skills: SKILL_SETS[i % SKILL_SETS.length],
      address: {
        city,
        state,
        pincode: String(670000 + index * 7),
      },
      joinedAt: day(joined),
    };
    if (PHONE_NULL.has(index)) doc.phone = null;
    else if (!PHONE_MISSING.has(index)) doc.phone = `9${String(400000000 + index * 137711).slice(0, 9)}`;
    return doc;
  });
}

/* ------------------------------------------------------------------- students */

// name, course, class, cgpa, obtainedMark, passMark
const STUDENT_SEED = [
  ["Aleena Thomas", "BCA", "S4", 8.6, 88, 35],
  ["Nandhu Krishna", "BCA", "S4", 7.2, 74, 35],
  ["Sneha Menon", "BSc CS", "S2", 6.4, 66, 35],
  ["Vivek Anand", "MCA", "S6", 9.1, 92, 40],
  ["Fathima Rasheed", "BCA", "S4", 5.8, 58, 35],
  ["Akhil Sasi", "BCom", "S2", 4.6, 32, 35],
  ["Diya Pradeep", "BSc CS", "S2", 8.2, 84, 35],
  ["Rithika Nair", "BBA", "S1", 7.5, 78, 40],
  ["Muhammed Ashiq", "BCA", "S3", 6.1, 63, 35],
  ["Anagha Suresh", "MCA", "S5", 8.9, 90, 40],
  ["Jibin Jose", "BCom", "S3", 5.2, 54, 35],
  ["Keerthana Raj", "BSc CS", "S1", 7.8, 80, 35],
  ["Rahul Menon", "BCA", "S4", 6.7, 69, 35],
  ["Sanjana Pillai", "BBA", "S2", 8.4, 86, 40],
  ["Alwin Baby", "BCom", "S4", 4.2, 28, 35],
  ["Meenakshi Iyer", "MCA", "S6", 9.4, 95, 40],
  ["Sidharth Menon", "BCA", "S3", 7.1, 73, 35],
  ["Nithya Balan", "BSc CS", "S3", 6.9, 71, 35],
  ["Farhan Khan", "BBA", "S1", 5.5, 56, 40],
  ["Gayathri Nair", "BCA", "S5", 8.1, 83, 35],
  ["Tom Cyriac", "BCom", "S1", 6.3, 65, 35],
  ["Devika Rajan", "MCA", "S5", 8.7, 89, 40],
  ["Hariharan S", "BSc CS", "S4", 7.4, 76, 35],
  ["Ann Mary", "BCA", "S2", 5.9, 61, 35],
  ["Basil Paul", "BCom", "S5", 4.8, 33, 35],
  ["Ishita Bose", "BBA", "S3", 7.9, 81, 40],
  ["Vaishnav Krishna", "BCA", "S6", 9.2, 93, 35],
  ["Reshma Beevi", "BSc CS", "S5", 6.6, 68, 35],
  ["Aromal Dev", "MCA", "S6", 8.3, 85, 40],
  ["Sruthy Lakshmi", "BCA", "S1", 7.7, 79, 35],
  ["Emil Thomas", "BCom", "S6", 5.1, 52, 35],
  ["Parvathy Menon", "BBA", "S4", 8.5, 87, 40],
  ["Nikhil Prasad", "BSc CS", "S6", 6.2, 64, 35],
  ["Amrutha Nair", "BCA", "S2", 7.3, 75, 35],
  ["Shabeer Ahmed", "BCom", "S2", 4.4, 30, 35],
  ["Chinju Elizabeth", "MCA", "S5", 9.0, 91, 40],
  ["Rohit Varma", "BSc CS", "S1", 6.8, 70, 35],
  ["Neethu Joseph", "BBA", "S5", 7.6, 77, 40],
  ["Adithyan R", "BCA", "S3", 5.7, 59, 35],
  ["Kavya Krishnan", "BCom", "S4", 6.5, 67, 35],
  ["Melvin Antony", "MCA", "S6", 8.8, 88, 40],
  ["Athira Mohan", "BSc CS", "S3", 7.0, 72, 35],
  ["Sabari Nath", "BCA", "S5", 4.9, 34, 35],
  ["Jesna Jacob", "BBA", "S2", 8.0, 82, 40],
  ["Praveen Das", "BCom", "S3", 5.4, 55, 35],
  ["Anjana Pillai", "BCA", "S6", 9.3, 94, 35],
  ["Hisham Rafi", "BSc CS", "S2", 6.0, 62, 35],
  ["Lekha Warrier", "MCA", "S5", 8.2, 84, 40],
  ["Sooraj Menon", "BBA", "S4", 7.9, 80, 40],
  ["Ivin Sunny", "BCom", "S1", 5.6, 57, 35],
];

const HOBBY_SETS = [
  ["Cricket", "Reading"],
  ["Cricket", "Music"],
  ["Reading", "Chess"],
  ["Music", "Painting"],
  ["Cricket", "Football"],
  ["Cycling", "Photography"],
  ["Cricket", "Gaming"],
  ["Cooking", "Music"],
  ["Chess", "Reading"],
  ["Cricket", "Cycling"],
];

const SUBJECT_POOL = ["MongoDB", "JavaScript", "Node", "React", "DSA", "HTML"];

function buildStudents() {
  return STUDENT_SEED.map((row, i) => {
    const index = i + 1;
    const [name, course, className, cgpa, obtainedMark, passMark] = row;
    const subjectCount = 2 + (i % 5);
    const subjects = SUBJECT_POOL.slice(0, subjectCount);
    const marks = subjects.map((subject, s) => ({
      subject,
      score: Math.min(99, 42 + ((index * 7 + s * 13) % 56)),
    }));
    return {
      _id: oid("students", index),
      rollNo: `S${String(index).padStart(3, "0")}`,
      name,
      course,
      class: className,
      cgpa,
      obtainedMark,
      passMark,
      subjects,
      marks,
      hobbies: HOBBY_SETS[i % HOBBY_SETS.length],
      city: ["Kochi", "Thrissur", "Kollam", "Kozhikode", "Kannur"][i % 5],
      admittedAt: day(`202${2 + (i % 3)}-0${1 + (i % 9)}-1${i % 10}`),
    };
  });
}

/* ---------------------------------------------------------------------- users */

// firstName, lastName, city, state, tier, active
const USER_SEED = [
  ["Arun", "Menon", "Kochi", "Kerala", "gold", true],
  ["Divya", "Nair", "Kochi", "Kerala", "silver", true],
  ["Sanjay", "Pillai", "Thrissur", "Kerala", "gold", true],
  ["Meera", "Krishnan", "Kochi", "Kerala", "bronze", true],
  ["Faisal", "Rahman", "Kozhikode", "Kerala", "silver", true],
  ["Anjali", "Thomas", "Kochi", "Kerala", "gold", true],
  ["Rakesh", "Kumar", "Kollam", "Kerala", "bronze", false],
  ["Steffi", "Jose", "Kochi", "Kerala", "silver", true],
  ["Nikhil", "Varma", "Kannur", "Kerala", "bronze", true],
  ["Lakshmi", "Iyer", "Kochi", "Kerala", "gold", true],
  ["Ebin", "Cyriac", "Alappuzha", "Kerala", "bronze", false],
  ["Haritha", "Menon", "Thrissur", "Kerala", "silver", true],
  ["Vinod", "Shenoy", "Bengaluru", "Karnataka", "gold", true],
  ["Reshma", "Beegum", "Malappuram", "Kerala", "bronze", true],
  ["Tony", "Fernandez", "Kochi", "Kerala", "silver", true],
  ["Aparna", "Suresh", "Kochi", "Kerala", "bronze", false],
  ["Jithin", "Raj", "Palakkad", "Kerala", "silver", true],
  ["Neethu", "Paul", "Kochi", "Kerala", "gold", true],
  ["Sameer", "Ali", "Kozhikode", "Kerala", "bronze", true],
  ["Gopika", "Warrier", "Thrissur", "Kerala", "silver", true],
  ["Alex", "Mathew", "Kochi", "Kerala", "bronze", false],
  ["Shilpa", "Rao", "Bengaluru", "Karnataka", "silver", true],
  ["Bineesh", "Kurian", "Idukki", "Kerala", "bronze", true],
  ["Farhana", "Ashraf", "Kochi", "Kerala", "gold", true],
  ["Pranav", "Menon", "Kochi", "Kerala", "silver", true],
  ["Deepa", "Chandran", "Kollam", "Kerala", "bronze", false],
  ["Karthik", "Subramanian", "Chennai", "Tamil Nadu", "gold", true],
  ["Ansu", "Elizabeth", "Kochi", "Kerala", "bronze", true],
  ["Vivek", "Bose", "Kochi", "Kerala", "silver", true],
  ["Nimisha", "Ravi", "Kozhikode", "Kerala", "bronze", true],
  ["Jerin", "Joseph", "Thrissur", "Kerala", "silver", false],
  ["Swathi", "Nambiar", "Kannur", "Kerala", "bronze", true],
  ["Rohit", "Sharma", "Kochi", "Kerala", "gold", true],
  ["Ayesha", "Siddique", "Malappuram", "Kerala", "bronze", true],
  ["Manu", "Sebastian", "Kochi", "Kerala", "silver", true],
  ["Krishnendu", "S", "Kollam", "Kerala", "bronze", false],
  ["Dhanya", "Prakash", "Kochi", "Kerala", "silver", true],
  ["Irfan", "Kabeer", "Kozhikode", "Kerala", "bronze", true],
  ["Sruthi", "Menon", "Thrissur", "Kerala", "gold", true],
  ["Basil", "Antony", "Kochi", "Kerala", "bronze", true],
  ["Vidya", "Balan", "Chennai", "Tamil Nadu", "silver", true],
  ["Akshay", "Pillai", "Kochi", "Kerala", "bronze", false],
  ["Remya", "Dev", "Palakkad", "Kerala", "silver", true],
  ["Sharon", "Mathew", "Kochi", "Kerala", "bronze", true],
  ["Adithya", "Krishna", "Kochi", "Kerala", "gold", true],
  ["Jasmine", "Ali", "Kannur", "Kerala", "bronze", true],
  ["Nithin", "Chacko", "Thrissur", "Kerala", "silver", true],
  ["Preethi", "Ramesh", "Bengaluru", "Karnataka", "bronze", false],
  ["Sajan", "Varghese", "Kochi", "Kerala", "silver", true],
  ["Anu", "Radha", "Kochi", "Kerala", "bronze", true],
];

// Three pairs share an email, so a unique index fails until the data is cleaned.
const EMAIL_TWINS = new Map([
  [12, 2],
  [29, 5],
  [44, 18],
]);

const PHONE_TYPES = ["mobile", "work", "home"];

function buildUsers() {
  return USER_SEED.map((row, i) => {
    const index = i + 1;
    const [firstName, lastName, city, state, tier, active] = row;
    const twin = EMAIL_TWINS.get(index);
    const emailOwner = twin ? USER_SEED[twin - 1] : row;
    const email = `${emailOwner[0].toLowerCase()}.${emailOwner[1]
      .toLowerCase()
      .replace(/[^a-z]/g, "")}@mail.com`;
    const phoneCount = 1 + (i % 3);
    return {
      _id: oid("users", index),
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      email,
      age: 19 + ((index * 5) % 40),
      tier,
      active,
      skills: SKILL_SETS[(i + 3) % SKILL_SETS.length],
      phones: Array.from({ length: phoneCount }, (_, p) => ({
        type: PHONE_TYPES[(i + p) % 3],
        number: `9${String(300000000 + index * 91733 + p * 11).slice(0, 9)}`,
        primary: p === 0,
      })),
      address: {
        city,
        state,
        pincode: String(680000 + index * 11),
      },
      createdAt: day(`202${2 + (i % 3)}-${String(1 + (i % 12)).padStart(2, "0")}-${String(1 + (i % 27)).padStart(2, "0")}`),
      lastLoginAt: day(`2024-${String(1 + (i % 12)).padStart(2, "0")}-${String(2 + (i % 26)).padStart(2, "0")}`),
    };
  });
}

/* ------------------------------------------------------------------- products */

// name, category, costPrice, sellingPrice, stock
const PRODUCT_SEED = [
  ["Mechanical Keyboard", "Peripherals", 2400, 3499, 40],
  ["Wireless Mouse", "Peripherals", 550, 899, 120],
  ["27 inch Monitor", "Displays", 14500, 18999, 18],
  ["USB C Hub", "Accessories", 1200, 1799, 65],
  ["Laptop Stand", "Accessories", 700, 1299, 90],
  ["Noise Cancelling Headphones", "Audio", 6800, 9499, 25],
  ["Bluetooth Speaker", "Audio", 1900, 2799, 55],
  ["1TB NVMe SSD", "Storage", 5200, 6999, 30],
  ["2TB External HDD", "Storage", 4100, 5499, 22],
  ["Webcam 1080p", "Peripherals", 1500, 2299, 48],
  ["Ergonomic Chair", "Furniture", 8900, 12999, 12],
  ["Standing Desk", "Furniture", 15800, 21999, 8],
  ["Desk Lamp", "Furniture", 600, 1099, 75],
  ["Graphics Tablet", "Peripherals", 4200, 5899, 16],
  ["Gaming Headset", "Audio", 2100, 3299, 34],
  ["Mouse Pad XL", "Accessories", 300, 649, 200],
  ["Laptop Sleeve 15", "Accessories", 450, 899, 140],
  ["Wireless Charger", "Accessories", 800, 1399, 88],
  ["Smart Watch", "Wearables", 5400, 7999, 27],
  ["Fitness Band", "Wearables", 1700, 2599, 60],
  ["Router AX3000", "Networking", 3800, 5299, 20],
  ["Network Switch 8 Port", "Networking", 1600, 2399, 26],
  ["Powerline Adapter", "Networking", 2200, 2099, 14],
  ["HDMI Cable 2m", "Cables", 250, 499, 300],
  ["Type C Cable 1m", "Cables", 180, 399, 320],
  ["Thunderbolt Cable", "Cables", 2600, 2499, 10],
  ["Portable Projector", "Displays", 17500, 23999, 6],
  ["Tablet 11 inch", "Displays", 21000, 27999, 9],
  ["Stylus Pen", "Accessories", 900, 1599, 70],
  ["Keyboard Wrist Rest", "Accessories", 320, 699, 150],
  ["Studio Microphone", "Audio", 3600, 4999, 19],
  ["Audio Interface", "Audio", 7200, 9799, 11],
  ["Ring Light", "Video", 1400, 2199, 44],
  ["Tripod Stand", "Video", 1100, 1899, 52],
  ["Capture Card", "Video", 4800, 6499, 13],
  ["Green Screen", "Video", 1900, 1799, 15],
  ["Laptop Cooling Pad", "Accessories", 850, 1499, 58],
  ["Surge Protector", "Power", 700, 1199, 96],
  ["UPS 600VA", "Power", 3200, 4499, 21],
  ["Power Bank 20000mAh", "Power", 1800, 2699, 80],
  ["Docking Station", "Accessories", 6400, 8999, 17],
  ["Monitor Arm", "Furniture", 2300, 3499, 23],
  ["Cable Organiser Kit", "Accessories", 280, 599, 210],
  ["Screen Cleaning Kit", "Accessories", 220, 449, 180],
  ["KVM Switch", "Networking", 2700, 3799, 12],
  ["Label Printer", "Office", 4400, 5999, 14],
  ["Document Scanner", "Office", 9800, 13499, 7],
  ["Shredder", "Office", 5600, 7299, 9],
  ["Whiteboard 4x3", "Office", 4200, 3999, 18],
  ["Conference Speakerphone", "Audio", 8700, 11999, 6],
];

function buildProducts() {
  return PRODUCT_SEED.map((row, i) => {
    const index = i + 1;
    const [name, category, costPrice, sellingPrice, stock] = row;
    return {
      _id: oid("products", index),
      sku: `P${String(index).padStart(3, "0")}`,
      name,
      category,
      costPrice,
      sellingPrice,
      price: sellingPrice,
      stock,
      description: `${name} for the ${category.toLowerCase()} desk setup. Tested and warranty backed.`,
      tags: [category.toLowerCase(), index % 2 ? "popular" : "new", index % 3 ? "instock" : "clearance"],
      addedAt: day(`2023-${String(1 + (i % 12)).padStart(2, "0")}-${String(1 + (i % 28)).padStart(2, "0")}`),
    };
  });
}

/* ---------------------------------------------------------------- departments */

const DEPT_NAMES = ["IT", "Sales", "HR", "Finance", "Marketing", "Support"];
const DEPT_LOCATIONS = [
  ["Kochi", "Infopark"],
  ["Thiruvananthapuram", "Technopark"],
  ["Kozhikode", "Cyberpark"],
  ["Thrissur", "City Centre"],
  ["Bengaluru", "Whitefield"],
  ["Chennai", "Guindy"],
  ["Kollam", "Kottiyam"],
  ["Kannur", "Thottada"],
  ["Palakkad", "Kinfra"],
];

function buildDepartments() {
  const docs = [];
  let index = 0;
  for (const location of DEPT_LOCATIONS) {
    for (const name of DEPT_NAMES) {
      if (docs.length >= 50) break;
      index += 1;
      const [city, campus] = location;
      docs.push({
        _id: oid("departments", index),
        code: `${name.slice(0, 2).toUpperCase()}-${city.slice(0, 3).toUpperCase()}`,
        name,
        city,
        campus,
        head: `Head of ${name}, ${city}`,
        budget: 400000 + index * 37000,
        headCount: 4 + (index % 17),
      });
    }
  }
  return docs;
}

/* -------------------------------------------------------------------- orders */

// Order count per user index: user 1 gets 7 orders, user 2 gets 6, and so on.
// Users past index 18 get nothing, so "customers with no orders" has an answer.
const ORDERS_PER_USER = [7, 6, 5, 4, 3, 3, 3, 3, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1];
const ORDER_STATUS = ["delivered", "shipped", "pending", "cancelled"];

// Orders only ever reference the first 40 products, which leaves 10 products
// that were never ordered.
const ORDERABLE_PRODUCTS = 40;

function buildOrders(products) {
  const docs = [];
  let index = 0;
  for (const [userSlot, count] of ORDERS_PER_USER.entries()) {
    const userIndex = userSlot + 1;
    for (let n = 0; n < count; n += 1) {
      index += 1;
      // Item counts cycle 1..4 so some orders have exactly 4 and some have 3+.
      const itemCount = 1 + ((index + n) % 4);
      const items = Array.from({ length: itemCount }, (_, k) => {
        const product = products[(index * 3 + k * 7) % ORDERABLE_PRODUCTS];
        return {
          productId: product._id,
          name: product.name,
          price: product.price,
          qty: 1 + ((index + k) % 3),
        };
      });
      const amount = items.reduce((sum, item) => sum + item.price * item.qty, 0);
      docs.push({
        _id: oid("orders", index),
        orderNo: `ORD-${2024}${String(index).padStart(4, "0")}`,
        userId: oid("users", userIndex),
        items,
        itemCount,
        amount,
        status: ORDER_STATUS[index % 4],
        orderDate: day(`2024-${String(1 + (index % 12)).padStart(2, "0")}-${String(1 + (index % 27)).padStart(2, "0")}`),
      });
    }
  }
  return docs;
}

/* ------------------------------------------------------------------- reviews */

const COMMENTS = [
  "Exactly what I needed.",
  "Good build, slightly overpriced.",
  "Stopped working in two weeks.",
  "Great value for the money.",
  "Packaging was damaged but the item is fine.",
  "Would buy again.",
  "Average product, does the job.",
  "Better than the one it replaced.",
];

function buildReviews(products, users) {
  return Array.from({ length: 50 }, (_, i) => {
    const index = i + 1;
    const product = products[(index * 5) % products.length];
    const user = users[(index * 11) % users.length];
    return {
      _id: oid("reviews", index),
      productId: product._id,
      productName: product.name,
      userId: user._id,
      rating: 1 + ((index * 3) % 5),
      comment: COMMENTS[i % COMMENTS.length],
      verified: index % 3 !== 0,
      createdAt: day(`2024-${String(1 + (i % 12)).padStart(2, "0")}-${String(2 + (i % 26)).padStart(2, "0")}`),
    };
  });
}

/* ------------------------------------------------------------------ sessions */

const DEVICES = ["chrome-windows", "safari-ios", "chrome-android", "firefox-linux", "edge-windows"];

function buildSessions(users) {
  return Array.from({ length: 50 }, (_, i) => {
    const index = i + 1;
    const user = users[i % users.length];
    const hour = String(i % 24).padStart(2, "0");
    return {
      _id: oid("sessions", index),
      userId: user._id,
      token: `sess_${(index * 7919).toString(36)}${index.toString(36)}`,
      device: DEVICES[i % DEVICES.length],
      ip: `10.0.${index % 8}.${(index * 13) % 255}`,
      createdAt: date(`2024-0${1 + (i % 9)}-${String(1 + (i % 27)).padStart(2, "0")}T${hour}:15:00Z`),
      expiresAt: date(`2024-0${1 + (i % 9)}-${String(1 + (i % 27)).padStart(2, "0")}T${hour}:45:00Z`),
      active: i % 5 !== 0,
    };
  });
}

/* -------------------------------------------------------------------- places */

const PLACE_NAMES = [
  "Marine Drive", "Fort Kochi Beach", "Lulu Mall", "Infopark Phase 1", "Cherai Beach",
  "Hill Palace", "Wonderla", "Broadway Market", "Vytilla Hub", "Kakkanad Civil Station",
  "Athirappilly Falls", "Vadakkunnathan Temple", "Thrissur Round", "Punnathur Kotta", "Chavakkad Beach",
  "Kovalam Beach", "Padmanabhaswamy Temple", "Technopark", "Napier Museum", "Shanghumugham",
  "Kozhikode Beach", "Mananchira Square", "Cyberpark", "Sarovaram Park", "Kappad Beach",
  "Bekal Fort", "Payyambalam Beach", "St Angelo Fort", "Muzhappilangad Beach", "Parassinikkadavu",
  "Munnar Tea Museum", "Mattupetty Dam", "Eravikulam Park", "Top Station", "Echo Point",
  "Alappuzha Beach", "Vembanad Lake", "Kumarakom Bird Sanctuary", "Pathiramanal", "Krishnapuram Palace",
  "Ponmudi", "Varkala Cliff", "Jatayu Park", "Ashtamudi Lake", "Thenmala",
  "Silent Valley", "Malampuzha Dam", "Nelliyampathy", "Palakkad Fort", "Kalpathy Village",
];

function buildPlaces() {
  return PLACE_NAMES.map((name, i) => {
    const index = i + 1;
    const lng = Number((76.2 + (i % 10) * 0.11 + i * 0.004).toFixed(4));
    const lat = Number((9.9 + Math.floor(i / 10) * 0.42 + (i % 10) * 0.017).toFixed(4));
    return {
      _id: oid("places", index),
      name,
      category: ["beach", "park", "office", "temple", "market"][i % 5],
      city: ["Kochi", "Thrissur", "Thiruvananthapuram", "Kozhikode", "Kannur"][Math.floor(i / 10)],
      rating: Number((3 + ((index * 7) % 20) / 10).toFixed(1)),
      location: { type: "Point", coordinates: [lng, lat] },
    };
  });
}

/* ------------------------------------------------------------------- assembly */

const departments = buildDepartments();
const employees = buildEmployees(departments);
const students = buildStudents();
const users = buildUsers();
const products = buildProducts();
const orders = buildOrders(products);
const reviews = buildReviews(products, users);
const sessions = buildSessions(users);
const places = buildPlaces();

export const MONGO_COLLECTIONS = [
  {
    name: "employees",
    label: "employees",
    summary:
      "The main collection for find queries, operators, updates, deletes, aggregation and indexes.",
    fields: [
      "_id: ObjectId",
      "empNo: String — E001 … E050",
      "name: String",
      "email: String — unique",
      "department: String — IT, Sales, HR, Finance, Marketing, Support",
      "departmentId: ObjectId — joins departments._id",
      "designation: String",
      "salary: Number — 17000 … 98000",
      "bonus: Number — higher than salary on 3 documents",
      "age: Number — 21 … 42",
      "skills: [String]",
      "address: { city, state, pincode }",
      "phone: String — missing on 5 documents, null on 2",
      "joinedAt: Date — 2016 … 2024",
    ],
    notes: [
      "Salary is tuned so the highest (98000), second (94000) and third (91000) are unique.",
      "Exactly one employee earns 50000, so $ne: 50000 returns 49.",
      "Age 21 and 22 appear once each, so second youngest has one answer.",
      "IT has the most employees and the highest average salary, both unique.",
      "phone is absent on 5 documents and null on 2, which separates $exists from null checks.",
    ],
    docs: employees,
  },
  {
    name: "students",
    label: "students",
    summary: "Marks arrays, subjects, hobbies and CGPA — used for $elemMatch, arrayFilters and $unwind.",
    fields: [
      "_id: ObjectId",
      "rollNo: String",
      "name: String",
      "course: String — BCA, BSc CS, BCom, MCA, BBA",
      "class: String — S1 … S6",
      "cgpa: Number — 4.2 … 9.4",
      "obtainedMark: Number — 28 … 95",
      "passMark: Number — 35 or 40",
      "subjects: [String] — 2 to 6 entries",
      "marks: [{ subject, score }]",
      "hobbies: [String]",
      "city: String",
      "admittedAt: Date",
    ],
    notes: [
      "Every student has a MongoDB entry in marks, and many score above 80.",
      "subjects length runs 2 to 6, so 'more than 3 subjects' returns a real subset.",
      "Five students have obtainedMark below passMark, so the fail queries return rows.",
      "Cricket is the single most common hobby.",
    ],
    docs: students,
  },
  {
    name: "users",
    label: "users",
    summary: "Nested address, phones array and duplicate emails. Pairs with orders for every join question.",
    fields: [
      "_id: ObjectId",
      "firstName / lastName / name: String",
      "email: String — 3 values are duplicated on purpose",
      "age: Number",
      "tier: String — gold, silver, bronze",
      "active: Boolean — false on 8 documents",
      "skills: [String]",
      "phones: [{ type, number, primary }] — type is mobile, work or home",
      "address: { city, state, pincode }",
      "createdAt / lastLoginAt: Date",
    ],
    notes: [
      "Three emails appear twice, so a unique index fails until you clean them. That is the point.",
      "Only the first 18 users have orders, so 32 users answer 'customers with no orders'.",
      "address.city is Kochi on many documents and address.state is mostly Kerala.",
    ],
    docs: users,
  },
  {
    name: "orders",
    label: "orders",
    summary: "Items array with prices and quantities. The join target for users and products.",
    fields: [
      "_id: ObjectId",
      "orderNo: String",
      "userId: ObjectId — joins users._id",
      "items: [{ productId, name, price, qty }] — 1 to 4 entries",
      "itemCount: Number",
      "amount: Number — sum of price × qty",
      "status: String — delivered, shipped, pending, cancelled",
      "orderDate: Date — spread across all 12 months of 2024",
    ],
    notes: [
      "User 1 has 7 orders and user 2 has 6, so 'more than 5 orders' returns two customers.",
      "Some orders hold exactly 4 items and several hold 3 or more.",
      "Several items cost more than 1000, which the $elemMatch question needs.",
      "orderDate covers every month of 2024 for the monthly sales report.",
    ],
    docs: orders,
  },
  {
    name: "products",
    label: "products",
    summary: "Cost versus selling price for $expr, plus a description field for the text index.",
    fields: [
      "_id: ObjectId",
      "sku: String",
      "name: String",
      "category: String",
      "costPrice / sellingPrice / price: Number",
      "stock: Number",
      "description: String — for the text index",
      "tags: [String]",
      "addedAt: Date",
    ],
    notes: [
      "Four products sell below cost, so sellingPrice > costPrice returns 46 of 50.",
      "Orders only reference the first 40 products, so 10 products were never ordered.",
    ],
    docs: products,
  },
  {
    name: "reviews",
    label: "reviews",
    summary: "Ratings per product, used as the $lookup target for products.",
    fields: [
      "_id: ObjectId",
      "productId: ObjectId — joins products._id",
      "productName: String",
      "userId: ObjectId — joins users._id",
      "rating: Number — 1 to 5",
      "comment: String",
      "verified: Boolean",
      "createdAt: Date",
    ],
    notes: ["Not every product has a review, so the join shows empty arrays too."],
    docs: reviews,
  },
  {
    name: "departments",
    label: "departments",
    summary: "Department per campus. The $lookup target for employees.departmentId.",
    fields: [
      "_id: ObjectId",
      "code: String",
      "name: String — IT, Sales, HR, Finance, Marketing, Support",
      "city / campus: String",
      "head: String",
      "budget: Number",
      "headCount: Number",
    ],
    notes: [
      "Six department names across nine campuses gives 50 rows.",
      "employees.departmentId points at the first row for that department name.",
    ],
    docs: departments,
  },
  {
    name: "sessions",
    label: "sessions",
    summary: "Login sessions with timestamps — the collection for the TTL index and date deletes.",
    fields: [
      "_id: ObjectId",
      "userId: ObjectId — joins users._id",
      "token: String",
      "device / ip: String",
      "createdAt: Date — the TTL field",
      "expiresAt: Date",
      "active: Boolean",
    ],
    notes: [
      "Use createdAt as the TTL field with expireAfterSeconds: 3600.",
      "All timestamps sit in 2024, so a TTL index removes them almost immediately. Insert a fresh document if you want to watch it expire.",
    ],
    docs: sessions,
  },
  {
    name: "places",
    label: "places",
    summary: "GeoJSON points for the geospatial index and $near query.",
    fields: [
      "_id: ObjectId",
      "name: String",
      "category: String — beach, park, office, temple, market",
      "city: String",
      "rating: Number",
      "location: { type: 'Point', coordinates: [lng, lat] }",
    ],
    notes: [
      "Needs a 2dsphere index before $near works: db.places.createIndex({ location: '2dsphere' })",
    ],
    docs: places,
  },
];

export function insertScript(collection) {
  const lines = collection.docs.map((doc) => `  ${toShell(doc)}`);
  return [
    `db.${collection.name}.drop();`,
    "",
    `db.${collection.name}.insertMany([`,
    lines.join(",\n"),
    "]);",
    "",
    `db.${collection.name}.countDocuments(); // 50`,
  ].join("\n");
}

export function sampleScript(collection) {
  return `// one document from ${collection.name}\n${toShell(collection.docs[0], 0, true)}`;
}

export function fieldReference(collection) {
  const parts = [collection.summary, "", "Fields", ...collection.fields.map((f) => `  ${f}`)];
  if (collection.notes?.length) {
    parts.push("", "Why the data looks like this", ...collection.notes.map((n) => `  - ${n}`));
  }
  return parts.join("\n");
}

/* ------------------------------------------------------------------- verifier */

export function verifyCollections() {
  const problems = [];
  const check = (ok, message) => {
    if (!ok) problems.push(message);
  };

  for (const collection of MONGO_COLLECTIONS) {
    check(
      collection.docs.length === 50,
      `${collection.name} has ${collection.docs.length} documents, expected 50`
    );
    const ids = new Set(collection.docs.map((doc) => doc._id.text));
    check(ids.size === 50, `${collection.name} has duplicate _id values`);
  }

  const salaries = [...employees.map((e) => e.salary)].sort((a, b) => b - a);
  check(salaries[0] !== salaries[1], "highest salary is tied");
  check(salaries[1] !== salaries[2], "second highest salary is tied");
  check(salaries[2] !== salaries[3], "third highest salary is tied");
  check(
    employees.filter((e) => e.salary === 50000).length === 1,
    "expected exactly one salary of 50000"
  );
  check(
    employees.some((e) => e.salary < 20000),
    "no employee earns below 20000"
  );

  const ages = [...employees.map((e) => e.age)].sort((a, b) => a - b);
  check(ages[0] !== ages[1], "youngest age is tied");
  check(ages[1] !== ages[2], "second youngest age is tied");

  check(
    employees.filter((e) => !("phone" in e)).length === 5,
    "expected 5 employees with no phone field"
  );
  check(
    employees.filter((e) => e.phone === null).length === 2,
    "expected 2 employees with a null phone"
  );
  check(
    employees.filter((e) => e.bonus > e.salary).length === 3,
    "expected 3 employees whose bonus beats salary"
  );

  const byDept = {};
  for (const e of employees) {
    byDept[e.department] = byDept[e.department] || { n: 0, total: 0 };
    byDept[e.department].n += 1;
    byDept[e.department].total += e.salary;
  }
  const counts = Object.values(byDept)
    .map((d) => d.n)
    .sort((a, b) => b - a);
  check(counts[0] !== counts[1], "department with most employees is tied");
  const averages = Object.values(byDept)
    .map((d) => d.total / d.n)
    .sort((a, b) => b - a);
  check(averages[0] !== averages[1], "department with highest average salary is tied");

  check(
    students.filter((s) => s.subjects.length > 3).length > 0,
    "no student has more than 3 subjects"
  );
  check(
    students.filter((s) => s.marks.some((m) => m.subject === "MongoDB" && m.score > 80)).length > 0,
    "no student scores above 80 in MongoDB"
  );
  check(
    students.filter((s) => s.obtainedMark < s.passMark).length > 0,
    "no student has failed"
  );
  const hobbyCount = {};
  for (const s of students) {
    for (const hobby of s.hobbies) hobbyCount[hobby] = (hobbyCount[hobby] || 0) + 1;
  }
  const hobbyRanked = Object.values(hobbyCount).sort((a, b) => b - a);
  check(hobbyRanked[0] !== hobbyRanked[1], "most common hobby is tied");

  const emails = users.map((u) => u.email);
  check(
    new Set(emails).size === emails.length - 3,
    "expected exactly 3 duplicated user emails"
  );
  check(
    users.filter((u) => !u.active).length > 0,
    "no inactive users to remove"
  );
  check(
    users.some((u) => u.address.city === "Kochi"),
    "no user lives in Kochi"
  );
  check(
    users.some((u) => u.phones.some((p) => p.type === "work")),
    "no user has a work phone"
  );

  const ordersByUser = {};
  for (const order of orders) {
    ordersByUser[order.userId.text] = (ordersByUser[order.userId.text] || 0) + 1;
  }
  check(
    Object.values(ordersByUser).filter((n) => n > 5).length === 2,
    "expected exactly 2 customers with more than 5 orders"
  );
  check(
    users.length - Object.keys(ordersByUser).length === 32,
    "expected 32 users with no orders"
  );
  check(
    orders.some((o) => o.items.length === 4),
    "no order holds exactly 4 items"
  );
  check(
    orders.some((o) => o.items.some((item) => item.price > 1000)),
    "no order item costs more than 1000"
  );
  // orderDate.text looks like ISODate("2024-01-01T00:00:00Z") — pull out "2024-01".
  const months = new Set(orders.map((o) => o.orderDate.text.slice(9, 16)));
  check(months.size === 12, `orders cover ${months.size} months, expected 12`);

  const orderedIds = new Set(
    orders.flatMap((o) => o.items.map((item) => item.productId.text))
  );
  check(
    products.some((p) => !orderedIds.has(p._id.text)),
    "every product has been ordered, so 'never ordered' returns nothing"
  );
  check(
    products.filter((p) => p.sellingPrice <= p.costPrice).length === 4,
    "expected 4 products selling below cost"
  );

  return problems;
}

export const COLLECTION_NAMES = MONGO_COLLECTIONS.map((c) => c.name);
