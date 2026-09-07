import arrays from "./dsa/01-arrays.js";
import strings from "./dsa/02-strings.js";
import recursion from "./dsa/03-recursion.js";
import searching from "./dsa/04-searching.js";
import linkedList from "./dsa/05-linked-list.js";
import sorting from "./dsa/06-sorting.js";
import stack from "./dsa/07-stack.js";
import queue from "./dsa/08-queue.js";
import hashTable from "./dsa/09-hash-table.js";
import treesBst from "./dsa/10-trees-bst.js";
import heap from "./dsa/11-heap.js";
import graph from "./dsa/12-graph.js";
import trie from "./dsa/13-trie.js";
import workouts from "./dsa/14-workouts.js";

export const DSA_PRACTICAL_SLUG = "dsa";

// Topic -> Subtopic -> practical questions, one file per topic under ./dsa.
//
// Filtered from the interview pending list with one rule: it only belongs here
// if you have to write code. Definitions ("what is Big O", "advantages of a
// linked list", "types of graphs", memory allocation, sorting complexities,
// stable vs in-place, load factor theory) stay in Theory. Anything from the
// source about React, Node, Express, Mongo, HTTP or Axios is dropped entirely.
//
// Every question carries a prompt describing exactly what to build, and an
// approach describing how to get there in words with no code. The approach is
// collapsed in the UI, which is what lets topic 14 stay hint-free while still
// having an answer behind it.
//
// Duplicates in the source were collapsed to one well-written version, except
// where the same problem is a genuinely different exercise (brute force in
// Arrays vs the hash version in Hash Table, iterative vs recursive vs stack
// based palindrome). Topic 14 deliberately restates problems with no hint
// about which structure or technique to reach for.

export const DSA_PRACTICAL = [
  arrays,
  strings,
  recursion,
  searching,
  linkedList,
  sorting,
  stack,
  queue,
  hashTable,
  treesBst,
  heap,
  graph,
  trie,
  workouts,
];
