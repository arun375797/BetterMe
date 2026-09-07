import {
  MONGO_COLLECTIONS,
  fieldReference,
  insertScript,
  sampleScript,
} from "./mongoCollections.js";

export const MONGO_PRACTICAL_SLUG = "mongo";

// Topic -> Subtopic -> practical questions.
// Questions are strings, or { title, difficulty, prompt, collection } when they
// need detail. Difficulty and collection fall back to the subtopic values, so
// only the exceptions are spelled out.

// One subtopic per sample collection. Each holds the insertMany snippet and a
// field reference, both regenerated from mongoCollections.js on every seed.
const sampleCollectionsTopic = {
  title: "Sample Collections",
  level: "low",
  subtopics: MONGO_COLLECTIONS.map((collection) => ({
    title: collection.name,
    difficulty: "easy",
    collection: collection.name,
    questions: [
      {
        title: `Insert the 50 ${collection.name} documents`,
        prompt: collection.summary,
        managed: true,
        solutions: [
          {
            language: "javascript",
            logic: `Paste this into mongosh once. It drops ${collection.name} first, so it is safe to re-run whenever you want a clean slate.`,
            code: insertScript(collection),
          },
        ],
      },
      {
        title: `${collection.name} field reference`,
        prompt: `Every field in ${collection.name}, and why the sample data is shaped the way it is.`,
        managed: true,
        solutions: [
          {
            language: "javascript",
            logic: fieldReference(collection),
            code: sampleScript(collection),
          },
        ],
      },
    ],
  })),
};

const learningTopics = [
  {
    title: "Basic & Find Queries",
    level: "low",
    subtopics: [
      {
        title: "Insert",
        difficulty: "easy",
        collection: "students",
        questions: [
          "Insert one student document",
          "Insert multiple students in a single call",
          { title: "Insert an employee with a nested address object", collection: "employees" },
          { title: "Insert an employee with a skills array", collection: "employees" },
          { title: "Insert a document with a custom _id", collection: "employees" },
        ],
      },
      {
        title: "Find",
        difficulty: "easy",
        collection: "employees",
        questions: [
          "Fetch all documents in a collection",
          "Find a single document",
          "Find an employee by _id",
          "Find all employees in the IT department",
          "Find an employee by name",
          "Find documents matching two fields at once",
          "Find documents where a field equals a particular value",
        ],
      },
      {
        title: "Projection",
        difficulty: "easy",
        collection: "employees",
        questions: [
          "Show only employee name and salary",
          "Show employee name without _id",
          "Exclude a single field from the result",
          "Return only selected fields from a nested object",
        ],
      },
      {
        title: "Sort / Limit / Skip",
        difficulty: "medium",
        collection: "employees",
        questions: [
          "Sort employees by salary ascending",
          "Sort employees by salary descending",
          "Return the top 5 highest-paid employees",
          "Skip the first 5 employees",
          {
            title: "Implement pagination",
            prompt:
              "Return page 3 with 10 documents per page. Say what breaks when skip gets large.",
          },
          "Return the second highest salary using sort, skip and limit",
          "Return the second youngest person",
        ],
      },
      {
        title: "Count & Distinct",
        difficulty: "easy",
        collection: "employees",
        questions: [
          "Count all employees",
          "Count employees in the IT department",
          { title: "Count students with marks above 70", collection: "students" },
          "List all unique departments",
          { title: "List all unique course names", collection: "students" },
        ],
      },
    ],
  },

  {
    title: "Query Operators",
    level: "medium",
    subtopics: [
      {
        title: "Comparison Operators",
        difficulty: "easy",
        collection: "employees",
        questions: [
          {
            title: "Find employees with salary greater than 50000",
            prompt: "Operators for this subtopic: $eq $ne $gt $gte $lt $lte $in $nin",
          },
          "Find employees with salary greater than or equal to 50000",
          "Find employees with salary less than 30000",
          "Find employees with salary less than or equal to 30000",
          {
            title: "Find employees whose salary is not equal to 50000",
            prompt: "Exactly one employee earns 50000, so this should return 49 documents.",
          },
          "Find people whose age is between 20 and 30",
          { title: "Find students whose CGPA is between 5 and 8", collection: "students" },
          "Find employees whose department is one of several values",
          "Find employees whose department is not in a given list",
        ],
      },
      {
        title: "Logical Operators",
        difficulty: "medium",
        collection: "employees",
        questions: [
          {
            title: "Find IT employees with salary above 50000",
            prompt: "Operators for this subtopic: $and $or $nor $not",
          },
          "Find employees from IT or HR",
          "Find employees with salary above 50000 and age below 30",
          "Find employees who are neither IT nor HR",
          "Combine $and and $or in one query",
          {
            title: "Find BCA students with CGPA above 7 or marks above 80",
            collection: "students",
          },
        ],
      },
      {
        title: "Regex",
        difficulty: "medium",
        collection: "employees",
        questions: [
          "Find names starting with A",
          "Find names ending with n",
          "Find names containing 'ar'",
          "Search names case-insensitively",
          "Find names starting with a vowel",
          "Find names ending with a vowel",
          {
            title: "Find names starting with C and ending with E",
            prompt: "Catherine Rose, Clive George and Caroline Jose are in the data.",
          },
        ],
      },
      {
        title: "Field Conditions",
        difficulty: "easy",
        collection: "employees",
        questions: [
          {
            title: "Find documents where phone exists",
            prompt:
              "Operators for this subtopic: $exists $type. phone is missing on 5 employees and null on 2.",
          },
          "Find documents where phone does not exist",
          "Find documents where a field is null",
          "Find documents where a field has a particular BSON type",
          "Find documents where a field is missing but not null",
        ],
      },
      {
        title: "$expr",
        difficulty: "hard",
        collection: "employees",
        questions: [
          {
            title: "Find employees whose salary is greater than their bonus",
            prompt: "Three employees earn a bonus above their salary, so this returns 47.",
          },
          {
            title: "Find products where sellingPrice is greater than costPrice",
            collection: "products",
          },
          {
            title: "Find students whose obtainedMark is above passMark",
            collection: "students",
          },
          {
            title: "Compare two fields of the same document",
            prompt: "Explain why a plain find cannot do this without $expr.",
          },
        ],
      },
    ],
  },

  {
    title: "Arrays & Nested Documents",
    level: "medium",
    subtopics: [
      {
        title: "Array Query",
        difficulty: "medium",
        collection: "employees",
        questions: [
          "Find documents whose skills array contains 'MongoDB'",
          "Find documents whose array contains any of the requested values",
          "Find documents whose array contains all of the requested values",
          "Find documents whose array has exactly 3 elements",
          { title: "Find orders having exactly 4 items", collection: "orders" },
          { title: "Find orders having at least 3 items", collection: "orders" },
          "Return the first element of an array",
          "Return the first 3 elements of an array",
          "Query an array by length using $size",
          "Query an array using $all",
        ],
      },
      {
        title: "$elemMatch",
        difficulty: "hard",
        collection: "students",
        questions: [
          "Find a student whose MongoDB mark is above 80",
          { title: "Find orders where a single item has price above 1000", collection: "orders" },
          { title: "Find users having a phone of a particular type", collection: "users" },
          {
            title: "Match multiple conditions against the same array object",
            collection: "users",
            prompt:
              "Show the wrong version without $elemMatch and explain why it matches too much.",
          },
        ],
      },
      {
        title: "Nested Documents",
        difficulty: "medium",
        collection: "users",
        questions: [
          "Find users whose address.city is Kochi",
          "Find users whose address.state is Kerala",
          "Query a nested field using dot notation",
          { title: "Query a nested array of objects", collection: "orders" },
          "Project only a nested field",
        ],
      },
    ],
  },

  {
    title: "Update Queries",
    level: "medium",
    subtopics: [
      {
        title: "Basic Update",
        difficulty: "easy",
        collection: "employees",
        questions: [
          {
            title: "Update one employee",
            prompt: "Operators for this subtopic: $set $unset $rename",
          },
          "Update multiple employees at once",
          "Change an employee's department",
          "Update a nested field",
          "Add a new field to existing documents",
          "Remove a field from a document",
          "Rename a field",
        ],
      },
      {
        title: "Numeric Updates",
        difficulty: "medium",
        collection: "employees",
        questions: [
          {
            title: "Increase salary by 1000",
            prompt: "Operators for this subtopic: $inc $mul $min $max",
          },
          { title: "Decrease marks by 2", collection: "students" },
          "Increase all employee salaries by 10%",
          "Decrease salary by 10%",
          { title: "Multiply product price", collection: "products" },
          "Set a value only when the new value is greater",
          "Set a value only when the new value is smaller",
        ],
      },
      {
        title: "Array Updates",
        difficulty: "medium",
        collection: "employees",
        questions: [
          {
            title: "Push a new skill into an array",
            prompt: "Operators for this subtopic: $push $addToSet $pull $pullAll $pop $each",
          },
          "Push multiple skills in one update",
          "Add a skill only if it is not already there",
          "Remove one value from an array",
          "Remove multiple values from an array",
          "Remove the first element of an array",
          "Remove the last element of an array",
        ],
      },
      {
        title: "Array Element Update",
        difficulty: "hard",
        collection: "students",
        questions: [
          {
            title: "Update the first matching array element",
            prompt: "Operators for this subtopic: $ $[] $[element] with arrayFilters",
          },
          "Update every element of an array",
          "Update only array elements matching a condition",
          "Increase marks for specific subjects only",
          { title: "Change the price of selected items inside an array", collection: "orders" },
        ],
      },
      {
        title: "Upsert",
        difficulty: "medium",
        collection: "employees",
        questions: [
          "Update a document or insert it when not found",
          "Upsert an employee by email",
          "Increment a value using upsert",
        ],
      },
      {
        title: "BulkWrite",
        difficulty: "hard",
        collection: "employees",
        questions: [
          "Insert multiple documents through bulkWrite",
          "Update several different documents in one bulk operation",
          "Combine insert, update and delete in one bulkWrite",
        ],
      },
    ],
  },

  {
    title: "Delete Queries",
    level: "low",
    subtopics: [
      {
        title: "Delete One",
        difficulty: "easy",
        collection: "employees",
        questions: [
          "Delete one document by name",
          "Delete a document by ObjectId",
          "Delete one employee from the IT department",
        ],
      },
      {
        title: "Delete Many",
        difficulty: "medium",
        collection: "employees",
        questions: [
          "Delete all IT employees",
          "Delete employees with salary below 20000",
          { title: "Delete students who failed", collection: "students" },
          "Delete documents using multiple conditions",
          "Delete documents using $in",
          "Delete documents where a field does not exist",
          { title: "Delete documents older than a given date", collection: "sessions" },
        ],
      },
      {
        title: "Find & Delete",
        difficulty: "medium",
        collection: "employees",
        questions: [
          {
            title: "Find and delete a document, returning the deleted document",
            prompt:
              "Compare deleteOne(), deleteMany(), findOneAndDelete(), drop() and dropDatabase().",
          },
        ],
      },
      {
        title: "Drop & Clear",
        difficulty: "easy",
        collection: "employees_copy",
        questions: [
          {
            title: "Delete all documents but keep the collection",
            prompt:
              "Work on a copy so the sample data survives: db.employees.aggregate([{ $out: 'employees_copy' }])",
          },
          "Drop a collection",
          { title: "Drop a database", collection: "database level" },
        ],
      },
    ],
  },

  {
    title: "Aggregation",
    level: "hard",
    subtopics: [
      {
        title: "Match",
        difficulty: "easy",
        collection: "employees",
        questions: [
          "Filter IT employees with $match",
          "Match employees with salary above 50000",
          { title: "Match BCA students", collection: "students" },
          "Match using $in",
          "Match on multiple conditions",
          { title: "Match a date range", collection: "orders" },
        ],
      },
      {
        title: "Project",
        difficulty: "easy",
        collection: "employees",
        questions: [
          "Show only name and salary",
          "Remove _id from the output",
          "Create an annualSalary field",
          { title: "Calculate price multiplied by quantity", collection: "orders" },
          { title: "Concatenate firstName and lastName", collection: "users" },
        ],
      },
      {
        title: "Group & Accumulators",
        difficulty: "medium",
        collection: "employees",
        questions: [
          {
            title: "Count employees in each department",
            prompt:
              "Accumulators for this subtopic: $sum $avg $min $max $first $last $push $addToSet",
          },
          "Total salary of each department",
          "Average salary of each department",
          "Highest salary in each department",
          "Lowest salary in each department",
          { title: "Count students in each class", collection: "students" },
          { title: "Average score of each class", collection: "students" },
          { title: "Total sales by product", collection: "orders" },
          "Group by multiple fields",
        ],
      },
      {
        title: "Sort / Limit",
        difficulty: "medium",
        collection: "employees",
        questions: [
          "Find the highest salary",
          "Find the lowest salary",
          "Find the second highest salary",
          "Find the third highest salary",
          "Find the nth highest salary",
          "Find the second youngest employee",
          "Return the top 5 employees by salary",
        ],
      },
      {
        title: "Unwind",
        difficulty: "medium",
        collection: "students",
        questions: [
          "Unwind student hobbies",
          { title: "Unwind order items", collection: "orders" },
          "Count how many people have each hobby",
          "Find the most common hobby",
          { title: "Calculate quantity sold for each item", collection: "orders" },
        ],
      },
      {
        title: "Lookup",
        difficulty: "hard",
        collection: "users + orders",
        questions: [
          { title: "Join employees with departments", collection: "employees + departments" },
          "Join users with orders",
          { title: "Join products with reviews", collection: "products + reviews" },
          "Return a user with all of their orders",
          "Find customers with no orders",
          "Find customers who have at least one order",
          "Use a pipeline inside $lookup",
          "Apply a condition inside $lookup",
          { title: "Use $lookup followed by $unwind", collection: "orders + products" },
          "Use $lookup followed by $group",
        ],
      },
      {
        title: "Array Aggregation",
        difficulty: "hard",
        collection: "students",
        questions: [
          "Filter an array with $filter",
          "Transform an array with $map",
          "Reduce an array with $reduce",
          { title: "Get array length with $size", collection: "employees" },
          { title: "Combine two arrays with $setUnion", collection: "users" },
          "Calculate total marks from a marks array",
          "Calculate average marks from a marks array",
          { title: "Remove duplicate values using $setUnion", collection: "users" },
        ],
      },
      {
        title: "Conditional",
        difficulty: "medium",
        collection: "employees",
        questions: [
          "Add a salary status field using $cond",
          { title: "Mark a student pass or fail using $cond", collection: "students" },
          "Classify employees as low, medium or high salary",
          "Handle several branches using $switch",
        ],
      },
      {
        title: "Advanced Stages",
        difficulty: "hard",
        collection: "employees",
        questions: [
          "Run two pipelines at once with $facet",
          "Return rows and total count for pagination using $facet",
          "Group salaries into ranges with $bucket",
          { title: "Fill missing values with $fill", collection: "sessions" },
          "Write pipeline results to a new collection with $out",
          "Merge pipeline results into an existing collection with $merge",
        ],
      },
      {
        title: "Mixed Workouts",
        difficulty: "hard",
        collection: "employees",
        questions: [
          "Average salary of each department, sorted highest first",
          "Highest-paid employee in each department, with their name",
          "Lowest-paid employee in each department, with their name",
          "Highest and lowest salary in a single pipeline",
          "Second highest salary",
          "Employees earning above the company average",
          "Employees earning above their own department average",
          "Department with the highest average salary",
          "Total salary and employee count per department",
          { title: "Most common hobby", collection: "students" },
          { title: "Total orders per customer", collection: "orders" },
          { title: "Customers with more than 5 orders", collection: "orders" },
          { title: "Total amount spent by each customer", collection: "orders + users" },
          { title: "Top 3 customers by amount spent", collection: "orders + users" },
          { title: "Top selling product", collection: "orders" },
          { title: "Monthly sales report", collection: "orders" },
          { title: "Count duplicate emails", collection: "users" },
        ],
      },
    ],
  },

  {
    title: "Indexes & Query Performance",
    level: "hard",
    subtopics: [
      {
        title: "Create / Manage Index",
        difficulty: "easy",
        collection: "employees",
        questions: [
          "Create an index on name",
          "Create a descending index on salary",
          "Create a compound index",
          {
            title: "Create a unique index on email",
            collection: "users",
            prompt:
              "Three emails are duplicated on purpose, so this fails first. Find the duplicates, clean them, then build the index.",
          },
          "Create an index with a custom name",
          "List all indexes on a collection",
          "Read index size and index stats",
          "Drop a single index",
          "Drop all indexes on a collection",
        ],
      },
      {
        title: "Index Types Practical",
        difficulty: "medium",
        collection: "employees",
        questions: [
          "Create a multikey index on the skills array",
          {
            title: "Create a TTL index that deletes sessions after 1 hour",
            collection: "sessions",
            prompt: "Build the index only. The 'what is a TTL index' answer belongs in Theory.",
          },
          {
            title: "Create a text index and run a text search",
            collection: "products",
            prompt: "The description field is there for this.",
          },
          { title: "Create a hashed index", collection: "users" },
          {
            title: "Create a geospatial index and run a $near query",
            collection: "places",
            prompt: "Needs a 2dsphere index on location before $near works.",
          },
          {
            title: "Create a sparse index",
            prompt: "phone is missing on 5 employees, which is what makes sparse interesting here.",
          },
          "Create a partial index",
        ],
      },
      {
        title: "Compound Index",
        difficulty: "medium",
        collection: "employees",
        questions: [
          "Create a { department: 1, salary: -1 } index",
          "Query using only the first field of a compound index",
          "Query using both fields of a compound index",
          "Test the compound index prefix rule",
          "Use one compound index for filtering and sorting together",
        ],
      },
      {
        title: "Query Performance",
        difficulty: "hard",
        collection: "employees",
        questions: [
          "Run explain() on a query",
          "Run explain('executionStats') and read the output",
          "Identify a COLLSCAN",
          "Identify an IXSCAN",
          "Compare the same query before and after adding an index",
          "Check totalDocsExamined",
          "Check totalKeysExamined",
          "Force a specific index with hint()",
          "Build a covered query",
        ],
      },
    ],
  },

  {
    title: "Collection & Shell Practical",
    level: "low",
    subtopics: [
      {
        title: "Database",
        difficulty: "easy",
        collection: "database level",
        questions: [
          "Show all databases",
          "Switch to another database",
          "Show the current database name",
          "Read database stats",
        ],
      },
      {
        title: "Collection",
        difficulty: "easy",
        collection: "employees",
        questions: [
          "Show all collections in a database",
          { title: "Create a collection explicitly", collection: "logs" },
          { title: "Create a capped collection", collection: "logs" },
          { title: "Check whether a collection is capped", collection: "logs" },
          "Read collection stats and document count",
        ],
      },
      {
        title: "Rename",
        difficulty: "easy",
        collection: "employees",
        questions: [
          { title: "Rename a collection", collection: "employees_copy" },
          "Rename a field in all documents",
          { title: "Rename a nested field", collection: "users" },
        ],
      },
    ],
  },

  {
    title: "Interview Workouts",
    level: "hard",
    subtopics: [
      {
        title: "Query Workouts",
        difficulty: "medium",
        collection: "employees",
        questions: [
          "Find employees whose salary is between 40,000 and 70,000",
          "Find names starting with A",
          "Find names ending with a vowel",
          { title: "Find students having more than 3 subjects", collection: "students" },
          { title: "Find students having MongoDB marks above 80", collection: "students" },
          "Implement pagination",
        ],
      },
      {
        title: "Aggregation Workouts",
        difficulty: "hard",
        collection: "employees",
        questions: [
          "Find the second highest salary",
          "Find the third highest salary",
          "Find the highest-paid employee from each department",
          "Find the average salary of each department",
          "Find employees earning above the company average",
          "Find employees earning above their department average",
          "Find the department with the most employees",
          "Find the department with the highest average salary",
          { title: "Find the most common hobby", collection: "students" },
          { title: "Find duplicate emails", collection: "users" },
        ],
      },
      {
        title: "Join Workouts",
        difficulty: "hard",
        collection: "users + orders",
        questions: [
          "Find users with no orders",
          "Find customers with more than 5 orders",
          "Find the total amount spent by every customer",
          "Find the top 3 customers",
          { title: "Find products that were never ordered", collection: "products + orders" },
          {
            title: "Join users, orders and products in one pipeline",
            collection: "users + orders + products",
          },
        ],
      },
      {
        title: "Update Workouts",
        difficulty: "medium",
        collection: "employees",
        questions: [
          "Increase the salary of IT employees by 10%",
          { title: "Decrease all student marks by 2", collection: "students" },
          { title: "Add a MongoDB skill only if it is not already there", collection: "users" },
          { title: "Remove inactive users", collection: "users" },
          { title: "Update one specific object inside an array", collection: "orders" },
        ],
      },
      {
        title: "Index Workouts",
        difficulty: "hard",
        collection: "employees",
        questions: [
          { title: "Create an index that prevents duplicate emails", collection: "users" },
          "Determine whether a query is using an index",
          "Create an index for { department, salary } and test it",
        ],
      },
    ],
  },
];

export const MONGO_PRACTICAL = [sampleCollectionsTopic, ...learningTopics];
