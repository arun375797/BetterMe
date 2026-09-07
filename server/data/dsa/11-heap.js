export default {
  title: "Heap & Priority Queue",
  level: "hard",
  subtopics: [
    {
      title: "Heap Implementation",
      difficulty: "medium",
      questions: [
        {
          title: "Implement a min heap with insert and remove",
          prompt:
            "Build a heap where the smallest value always sits at the root. Store it in an array and explain the index arithmetic.",
          approach:
            "A heap is a complete binary tree stored in a flat array. For the node at index i, the children live at 2i+1 and 2i+2 and the parent at the floor of (i-1)/2, so no pointers are needed at all.\n\nInsert appends at the end and bubbles the value up while it is smaller than its parent. Remove takes the root, moves the last element into the root slot, and sinks it down. Both are O(log n) because the tree stays balanced by construction. Note the heap is only partially ordered: the root is the minimum, but the rest is not sorted.",
        },
        {
          title: "Implement a max heap with insert and remove",
          prompt: "The same structure with the largest value at the root. Say exactly what changed.",
          approach:
            "Only the comparisons flip: bubble up while larger than the parent, sink down toward the larger child.\n\nEverything else, including the index arithmetic, is identical. That is why real implementations take a comparator, so one heap serves both. Sinking toward the larger child rather than just any child is the detail that keeps the property intact.",
        },
        {
          title: "Build a heap from an unsorted array",
          prompt:
            "Turn an arbitrary array into a valid heap. Show that doing it from the bottom up beats inserting one at a time.",
          approach:
            "Start at the last node that has a child, which is the middle of the array, and sink each node walking backwards to index 0.\n\nInserting elements one at a time costs O(n log n). Building bottom-up is O(n), because most nodes are near the leaves and barely sink at all. That surprising linear bound is what the question is asking about, so be ready to justify it rather than just assert it.",
        },
        {
          title: "Write heapify up",
          prompt:
            "Implement the bubble-up used after an insert, and say how far a value can travel.",
          approach:
            "Compare the value at the given index with its parent and swap while it violates the heap order, moving up until it reaches the root or fits.\n\nThe path from any node to the root is at most log n steps, so this is O(log n). It only ever needs to look at the parent chain, never at siblings, which is why it is so cheap.",
        },
        {
          title: "Write heapify down",
          prompt:
            "Implement the sink used after a removal, and explain why you must compare both children.",
          approach:
            "Look at both children, pick the one that should be higher, and swap with it if it beats the current node. Repeat from the new position.\n\nComparing both children is essential: swapping with the wrong one puts a value above a smaller sibling and quietly breaks the heap. Stop when neither child beats the node or you reach a leaf. O(log n).",
        },
        {
          title: "Delete a specific element from a heap",
          prompt:
            "Remove an element that is not the root, and explain why you may have to move it in either direction.",
          approach:
            "Find its index, overwrite it with the last element, shrink the array, then restore order at that position.\n\nThe replacement could be either larger or smaller than what it displaced, so you may need to sink it or bubble it up, and you cannot know which in advance. Doing both, one of which will do nothing, is the safe form. Finding the index is O(n) unless you keep a value-to-index map, which is worth mentioning.",
        },
        {
          title: "Find the right child of a node in an array backed heap",
          prompt:
            "Given an index, return its right child, and check the bounds properly.",
          approach:
            "The right child sits at 2i+2 and the left at 2i+1.\n\nThe important part is bounds checking: an index at or past the array length means that child does not exist, and reading it returns undefined which then poisons every comparison. Being fluent with this arithmetic is what makes the rest of the heap operations easy.",
        },
        {
          title: "Convert a min heap into a max heap",
          prompt: "Turn a valid min heap into a valid max heap, as cheaply as you can.",
          approach:
            "Run the bottom-up build again using max-heap comparisons, starting from the middle and sinking each node backwards to the root. That is O(n).\n\nDo not sort, and do not reinsert element by element, since both are O(n log n). A min heap gives you almost no head start toward a max heap, since the two orderings share only the fact that the shape is already complete.",
        },
        {
          title: "Display the heap as a tree",
          prompt:
            "Print the array as a tree, level by level, so you can see the shape while debugging.",
          approach:
            "Level i of the array starts at index 2 to the power i minus 1 and holds up to 2 to the power i elements, so print those slices as rows.\n\nThis is worth writing before the harder heap problems, because heap bugs are ordering bugs and a flat array hides them completely. Seeing the tree makes a broken sink or bubble obvious in seconds.",
        },
      ],
    },

    {
      title: "Heap Sort",
      difficulty: "hard",
      questions: [
        {
          title: "Implement heap sort",
          prompt:
            "Sort an array using a heap. State the time and space cost and how it compares with merge sort.",
          approach:
            "Build a max heap from the array in O(n), then repeatedly swap the root with the last unsorted position and shrink the heap by one, sinking the new root each time.\n\nEach removal is O(log n) and there are n of them, so O(n log n) overall in every case. Unlike merge sort it sorts in place with O(1) extra space, and unlike quick sort it has no bad-input worst case. The catch is that it is not stable and its memory access pattern is cache-unfriendly, which is why quick sort is often faster in practice.",
        },
        {
          title: "Sort an array ascending with heap sort",
          prompt: "Produce smallest first, and say which kind of heap you used and why.",
          approach:
            "Use a max heap. Each removal pulls the largest remaining value and parks it at the end of the array, so the array fills from the back and comes out ascending.\n\nThe counterintuitive part is that ascending order needs a max heap, and reaching for a min heap here is the usual mistake. A min heap gives ascending output only if you write into a separate array rather than sorting in place.",
        },
        {
          title: "Sort an array descending with heap sort",
          prompt: "Produce largest first.",
          approach:
            "Mirror it with a min heap: each removal pulls the smallest remaining value to the back, so the array ends up descending.\n\nAgain only the comparisons change. Being able to state which heap yields which order, and why, is the point of doing both.",
        },
        {
          title: "Sort an array of student objects with heap sort",
          prompt: "Sort records by a field such as age, and say what property you lose.",
          approach:
            "Replace the value comparison with one reading the chosen field, leaving the algorithm untouched.\n\nThe property you lose is stability: heap sort's swaps move equal elements past each other, so two students of the same age may come out in a different order than they went in. If that matters, merge sort is the better tool, and knowing when to switch is more valuable than the implementation itself.",
        },
        {
          title: "Sort a string's characters with heap sort",
          prompt: "Sort the characters of a word alphabetically using a heap.",
          approach:
            "Split the string into characters, heap sort the array with a character comparison, and join back.\n\nCase affects the ordering because uppercase letters have lower character codes, so decide whether to normalise first. This is a quick way to check your heap works on non-numeric data.",
        },
      ],
    },

    {
      title: "Heap Interview Problems",
      difficulty: "hard",
      questions: [
        {
          title: "Find the kth largest element in an array",
          prompt:
            "Return the kth largest value. Compare sorting, a max heap and a min heap of size k.",
          approach:
            "Sorting and indexing is O(n log n). Building a max heap and removing k times is O(n + k log n).\n\nThe best general answer keeps a min heap holding only the k largest values seen: walk the array, push each value, and whenever the heap exceeds size k remove its smallest. The root is then the kth largest. That is O(n log k) time and O(k) space, which matters when n is huge or arrives as a stream.",
        },
        {
          title: "Find the nth smallest element in an array using a max heap",
          prompt:
            "Return the nth smallest value while keeping the heap at size n instead of sorting everything.",
          approach:
            "The mirror of the previous problem. Keep a max heap of size n holding the n smallest values seen so far.\n\nPush each value, and when the heap grows past n remove its largest. At the end the root is the nth smallest. Using a max heap to track the smallest values feels backwards at first, and understanding why, that the root is the worst of the ones you are keeping and therefore the one to evict, is the insight.",
        },
        {
          title: "Find the k largest elements using a min heap",
          prompt: "Return all k largest values rather than only the kth.",
          approach:
            "Same bounded min heap of size k, but at the end return everything in the heap rather than only the root.\n\nThe heap's contents are not sorted, so sort them if the caller expects order, which adds O(k log k). O(n log k) overall and only O(k) memory, which is the whole reason to prefer this to sorting.",
        },
        {
          title: "Find the top k most frequent elements",
          prompt:
            "Given an array, return the k values that appear most often. Combine two structures.",
          approach:
            "First count occurrences with a frequency map, which is O(n). Then find the top k of those counts with a bounded min heap keyed on frequency, which is O(m log k) over the distinct values.\n\nThe combination is the point: the map answers how often and the heap answers which are the biggest, and neither alone is enough. Bucketing values by frequency into an array of lists is an O(n) alternative worth mentioning.",
        },
        {
          title: "Implement a priority queue on top of a heap",
          prompt:
            "Wrap a heap so callers see enqueue and dequeue, and dequeue always returns the highest priority item.",
          approach:
            "Store items paired with a priority and let the heap compare on that priority. Enqueue is an insert and dequeue is a root removal, both O(log n).\n\nThe wrapper matters because callers should not need to know about the array or the index arithmetic. Fix and document whether a lower number means more urgent, since that convention causes more confusion than the code.",
        },
        {
          title: "Sort a list of tasks by their priority number",
          prompt:
            "Serve tasks most important first, and make two tasks of equal priority come out in the order they arrived.",
          approach:
            "Use the priority queue, and give each task an incrementing arrival number when it is added.\n\nCompare on priority first and fall back to the arrival number on a tie, which makes an inherently unstable heap behave stably. Without that tiebreaker, equal-priority tasks come out in an arbitrary order, which is almost never what a real scheduler wants.",
        },
      ],
    },
  ],
};
