// The final test set. Every prompt states the problem, the input and the
// expected output, and nothing else — no mention of which structure or
// technique to reach for, because deciding that is the exercise. The approach
// is written as a full reveal and the UI keeps it collapsed, so treat opening
// it as giving up on that attempt.

export default {
  title: "Interview Workouts",
  level: "hard",
  subtopics: [
    {
      title: "Array Workouts",
      difficulty: "medium",
      questions: [
        {
          title: "Two Sum",
          prompt:
            "Given an array of numbers and a target, return the indexes of the two values that add up to it. [2, 7, 11, 15] with target 9 returns [0, 1]. Exactly one answer exists and you may not reuse an element.",
          approach:
            "Reveal: walk the array once keeping a map from each value to its index, and before storing the current value, check whether the target minus it has already been seen.\n\nIf it has, those two indexes are the answer. Checking before storing is what prevents an element pairing with itself. O(n) time and O(n) space, against the O(n²) of comparing every pair.",
        },
        {
          title: "Product of Array Except Self",
          prompt:
            "For each position return the product of every other element. [1, 2, 3, 4] returns [24, 12, 8, 6]. Division is not allowed.",
          approach:
            "Reveal: the answer at a position is everything to its left multiplied by everything to its right.\n\nMake one left-to-right pass writing the running product of everything before each index into the output, then one right-to-left pass multiplying in the running product of everything after. Two passes, O(n) time, and the output array is the only space used. Division is banned because a single zero makes it collapse.",
        },
        {
          title: "Move Zeroes",
          prompt:
            "[0, 1, 0, 3, 12] becomes [1, 3, 12, 0, 0]. The non-zero values keep their relative order and you must modify the array in place.",
          approach:
            "Reveal: keep a write position starting at 0. Read through the array, and every time you meet a non-zero value, write it at the write position and advance it.\n\nWhen the read finishes, fill everything from the write position to the end with zeros. O(n) time, no extra array, and the order is preserved because you write values in the order you meet them.",
        },
        {
          title: "Maximum Subarray",
          prompt:
            "Return the largest total obtainable from any contiguous run of elements. [-2, 1, -3, 4, -1, 2, 1, -5, 4] returns 6.",
          approach:
            "Reveal: this is Kadane's algorithm. Walk the array carrying the best total that ends exactly at the current element.\n\nAt each step you either extend the previous run or start fresh from the current element, whichever is larger, while separately tracking the best value ever seen. Seed both from the first element rather than from 0, or an all-negative array wrongly reports 0. One pass, O(n).",
        },
        {
          title: "Find the Missing Number",
          prompt:
            "An array should hold every number from 1 to n but one is absent. Return it. [1, 2, 4, 5] returns 3.",
          approach:
            "Reveal: the sum of 1 to n is n × (n + 1) / 2. Total what you actually have and subtract it from that expected value.\n\nThe difference is the missing number. One pass, no extra space, no sorting. XOR-ing every index against every value gives the same answer and sidesteps the overflow risk that large sums carry in fixed-width integer languages.",
        },
        {
          title: "Minimum in a Rotated Sorted Array",
          prompt:
            "[4, 5, 6, 7, 0, 1, 2] returns 0. The array was sorted then rotated at an unknown point. Do better than scanning it.",
          approach:
            "Reveal: even after rotation one half is always properly sorted, and that is what you exploit to halve the range each step.\n\nCompare the middle element against the high element. If the middle is larger, the rotation point is to the right so move the low bound past the middle. Otherwise the minimum is at or left of the middle, so bring the high bound down to it. When the bounds meet you are standing on the answer. O(log n). Compare against high rather than low so the unrotated case behaves.",
        },
        {
          title: "Merge Two Sorted Arrays",
          prompt:
            "Combine [1, 3, 5] and [2, 4, 6] into [1, 2, 3, 4, 5, 6]. Both inputs are already sorted.",
          approach:
            "Reveal: a pointer at the start of each array. Compare the two values, take the smaller into the result, and advance only the pointer you took from.\n\nWhen one array empties, append the whole remaining tail of the other in one move. O(n + m). Concatenating and sorting also works but costs O(n log n) and throws away the sortedness you were given.",
        },
        {
          title: "Best Time to Buy and Sell Stock",
          prompt:
            "Given daily prices, return the maximum profit from one buy and one later sell. [7, 1, 5, 3, 6, 4] returns 5, buying at 1 and selling at 6. Return 0 when no profit is possible.",
          approach:
            "Reveal: walk the prices once carrying the lowest price seen so far and the best profit so far.\n\nAt each day, the best profit if you sold today is today's price minus the cheapest day before it, so update the best profit with that, then update the cheapest price. Doing it in that order enforces that you buy before you sell. O(n) time, O(1) space.",
        },
        {
          title: "Kth Largest Element in an Array",
          prompt:
            "Return the kth largest value. [3, 2, 1, 5, 6, 4] with k = 2 returns 5. This is the kth largest by position, so duplicates count separately.",
          approach:
            "Reveal: sorting and indexing is O(n log n) and is a fine first answer.\n\nBetter is to keep a min heap holding only the k largest values seen: push each value and remove the smallest whenever the heap exceeds size k. The root is then the kth largest, at O(n log k) time and O(k) space. Quickselect, which partitions like quick sort but recurses into only one side, averages O(n) and is the strongest answer.",
        },
        {
          title: "Top K Frequent Elements",
          prompt:
            "Return the k values that appear most often. [1, 1, 1, 2, 2, 3] with k = 2 returns [1, 2].",
          approach:
            "Reveal: two stages. Count occurrences into a map in O(n), then select the k highest counts.\n\nA min heap of size k keyed on frequency does the selection in O(m log k) over the distinct values. There is also an O(n) alternative: make an array indexed by frequency where each slot holds the values with that count, then read it from the high end, since no count can exceed the array length.",
        },
      ],
    },

    {
      title: "String Workouts",
      difficulty: "medium",
      questions: [
        {
          title: "Longest Substring Without Repeating Characters",
          prompt:
            "'abcabcbb' returns 3, for 'abc'. The characters must be contiguous and all distinct.",
          approach:
            "Reveal: slide a window across the string, remembering the last index at which you saw each character.\n\nWhen the incoming character already sits inside the current window, jump the left edge to just past its previous position rather than stepping it along one at a time. Track the widest window as you go. Each character is handled once, so O(n).",
        },
        {
          title: "Longest Palindromic Substring",
          prompt:
            "'babad' returns 'bab' or 'aba'. The palindrome may start anywhere in the string.",
          approach:
            "Reveal: treat every position as a possible centre and expand outward while the characters on both sides match, keeping the longest span found.\n\nThe catch is that palindromes come in two shapes, odd length centred on a character and even length centred between two, so you must expand for both at each position or you miss half of them. O(n²) time with O(1) space.",
        },
        {
          title: "Valid Parentheses",
          prompt:
            "Return true when every bracket is closed by the right type in the right order. '{[()]}' is true, '{[(])}' is false. Support round, square and curly brackets.",
          approach:
            "Reveal: push every opening bracket onto a stack, and on a closing bracket pop and confirm the popped opener matches its type.\n\nTwo distinct failures: popping an empty stack means a closer with no opener, and a non-empty stack at the end means openers were never closed. Both must be checked, and skipping the second is why unbalanced trailing openers slip through.",
        },
        {
          title: "First Non-Repeating Character",
          prompt: "'swiss' returns 'w'. Return null when every character repeats.",
          approach:
            "Reveal: two passes. Build a count of every character, then walk the original string in order and return the first character whose count is 1.\n\nThe second pass must run over the string, not the count map, because only the string preserves the original order. One pass cannot work, since you cannot know a character never returns until the string ends.",
        },
        {
          title: "Longest Common Prefix",
          prompt:
            "['flow', 'flower', 'florine', 'flurr'] returns 'fl'. Return an empty string when the words share nothing.",
          approach:
            "Reveal: compare the words character by character in parallel, stepping through position 0, then 1, and so on, stopping as soon as any word disagrees or runs out.\n\nThe shortest word bounds the answer, so it can never be longer than that. Building a trie and walking down while each node has exactly one child gives the same answer and pays off when you will query many prefixes against the same word set.",
        },
        {
          title: "Return every stored word that starts with a given prefix",
          prompt:
            "Given a set of words and a prefix, return all the words beginning with it. With 'car', 'card' and 'dog' stored, the prefix 'ca' returns the first two.",
          approach:
            "Reveal: build a prefix tree where each node maps a character to a child and flags whether a word ends there.\n\nWalk down to the node where the prefix ends, returning nothing if that path breaks, then collect every word in the subtree beneath it with a depth-first walk, building each word from the prefix plus the characters on the way down. Cost is the prefix length plus the number of matches, rather than a scan of every stored word.",
        },
      ],
    },

    {
      title: "Linked List Workouts",
      difficulty: "medium",
      questions: [
        {
          title: "Merge Two Sorted Linked Lists",
          prompt:
            "Combine two sorted lists into one sorted list. Re-point the existing nodes rather than creating new ones.",
          approach:
            "Reveal: walk both lists at once, always attaching the smaller head to the growing result and advancing only that list.\n\nWhen one empties, attach the whole remaining tail of the other in a single move. A dummy start node removes the special case for the very first attachment. O(n + m) time and O(1) extra space.",
        },
        {
          title: "Middle of a Linked List",
          prompt:
            "Return the middle node in one traversal, without first counting the length. For an even length return the second of the two middles.",
          approach:
            "Reveal: move one pointer a node at a time and another two at a time from the same start.\n\nWhen the fast one reaches the end, the slow one is on the middle, having covered exactly half the distance. Whether you stop on the fast pointer being null or its next being null decides which of the two middles you land on for even lengths. Check both before stepping, or you dereference null.",
        },
        {
          title: "Remove the Nth Node From the End",
          prompt:
            "Delete the nth node counting from the tail and return the head. Do it in a single traversal.",
          approach:
            "Reveal: advance one pointer n steps ahead, then move a second pointer and the first together until the first reaches the end.\n\nThe second pointer is now n from the end, which is the node to remove, so keep one more just behind it to unlink. Removing the head itself is the edge case, and placing a dummy node before the head eliminates it entirely.",
        },
        {
          title: "Linked List Cycle",
          prompt:
            "Return true when the list loops back on itself. Solve it without extra memory.",
          approach:
            "Reveal: move one pointer one step and another two steps. If a loop exists the fast one eventually laps the slow one and they meet; if it reaches null there is no loop.\n\nThey must meet because inside a loop the gap between them closes by exactly one node per step. Storing visited nodes in a set works too and is easier to explain, but costs O(n) space where this costs none.",
        },
        {
          title: "Linked List Palindrome",
          prompt:
            "Return true when the values read the same forwards and backwards. 1 -> 2 -> 2 -> 1 is true. Try to avoid copying the list.",
          approach:
            "Reveal: find the middle with the two-speed pointers, reverse the second half in place, then walk the two halves in step comparing values.\n\nO(n) time and O(1) space. Copying the values into an array and using two pointers is much simpler at O(n) space, and is worth offering first. Restoring the list afterwards if you reversed it is a courtesy worth mentioning.",
        },
      ],
    },

    {
      title: "Tree Workouts",
      difficulty: "hard",
      questions: [
        {
          title: "Validate a Binary Search Tree",
          prompt:
            "Return true when every value on the left of a node is smaller and every value on the right is larger, throughout the whole tree. Checking each node against only its immediate children is not enough.",
          approach:
            "Reveal: recurse carrying a permitted range. The root may hold anything, moving left tightens the upper bound to the parent's value, and moving right raises the lower bound. A node outside its range fails.\n\nThe local check fails because a node deep in the left subtree can exceed the root while still beating its own parent, and only an inherited bound catches that. Traversing left-node-right and confirming the values come out strictly increasing is an equally valid alternative.",
        },
        {
          title: "Kth Smallest Element in a BST",
          prompt: "Return the kth smallest value in the tree. Stop as soon as you have it.",
          approach:
            "Reveal: traversing left, then node, then right emits a BST's values in ascending order, so count as you go and return on the kth.\n\nThat the values arrive already sorted is the whole trick. Return early instead of building the full list, giving O(k + height) rather than O(n). If the tree is queried often, storing a subtree size on each node lets you navigate straight there in O(height).",
        },
        {
          title: "Binary Tree Level Order Traversal",
          prompt:
            "Return the values grouped by depth, so a tree of three levels returns three arrays.",
          approach:
            "Reveal: use a queue. Push the root, then repeatedly take a node, record it, and push its children.\n\nTo get the grouping, record the queue's size at the start of each round and process exactly that many nodes, which is precisely one level. That size snapshot is the trick; without it you get a flat list with no level boundaries.",
        },
        {
          title: "Balanced Binary Tree",
          prompt:
            "Return true when the two subtree heights differ by at most one at every node, not only at the root.",
          approach:
            "Reveal: computing the height separately at every node recomputes the same subtrees and costs O(n²).\n\nInstead have the recursion return the height and the balanced verdict together, or return a sentinel such as -1 meaning unbalanced and propagate it straight up. That measures and checks in one bottom-up pass, O(n). The condition must hold everywhere, and testing only the root is the classic wrong answer.",
        },
        {
          title: "Lowest Common Ancestor",
          prompt:
            "Return the deepest node that has both given nodes somewhere below it. Solve it for a plain binary tree, then say how a search tree makes it cheaper.",
          approach:
            "Reveal: in a plain binary tree, recurse and ask each subtree whether it contains either target. When both sides report a find, the current node is the ancestor; when only one does, pass that result upward.\n\nIn a BST you can use the ordering instead: from the root go left when both targets are smaller and right when both are larger, and the first node where they split is the answer, in O(height) with no full traversal.",
        },
      ],
    },

    {
      title: "Graph Workouts",
      difficulty: "hard",
      questions: [
        {
          title: "Clone Graph",
          prompt:
            "Given a reference to a node in a connected graph, return a deep copy where every node and edge is a new object and the structure matches exactly.",
          approach:
            "Reveal: traverse the graph while keeping a map from each original node to its copy.\n\nCheck that map before creating anything, reusing the existing copy when a node has already been handled. The map is what stops cycles recursing forever and what keeps shared neighbours pointing at one copy rather than duplicates. Create a node's copy and record it in the map before recursing into its neighbours.",
        },
        {
          title: "Number of Islands",
          prompt:
            "Given a grid of land and water cells, count the groups of connected land. Cells connect horizontally and vertically, not diagonally.",
          approach:
            "Reveal: the grid is a graph where each land cell is a node and adjacency is implied by position.\n\nWalk every cell, and each time you meet unvisited land, add one to the count and flood the entire connected region so it is never counted again. The number of floods you started is the answer. Keep the bounds checks tight and mark cells visited as you go, or the flood revisits them forever. O(rows × columns).",
        },
        {
          title: "Shortest Path in an Unweighted Graph",
          prompt:
            "Return the actual path between two vertices using the fewest edges, not just its length.",
          approach:
            "Reveal: explore level by level from the start using a queue, which reaches every vertex by the smallest number of edges.\n\nTo rebuild the path, record for each visited vertex which vertex you arrived from, then walk those links back from the destination and reverse the result. Exploring deeply first would find a path but has no reason to find the shortest. O(vertices + edges).",
        },
        {
          title: "Detect a Cycle in a Graph",
          prompt:
            "Return true when any path leads back to a vertex already on it. Answer for both the undirected and the directed case, because they are not the same problem.",
          approach:
            "Reveal: in an undirected graph, explore depth first carrying the vertex you came from, and a visited neighbour that is not that parent means a genuine cycle. Without the parent check every edge looks like a cycle, since you can always step straight back.\n\nIn a directed graph the parent trick fails, because A to B and B to A really is a cycle. There you track vertices on the current recursion path separately from vertices merely visited, and a cycle is reaching a vertex still on the active path. Restart from every unvisited vertex to cover disconnected pieces.",
        },
      ],
    },
  ],
};
