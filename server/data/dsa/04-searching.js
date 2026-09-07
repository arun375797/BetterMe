export default {
  title: "Searching",
  level: "low",
  subtopics: [
    {
      title: "Linear Search",
      difficulty: "easy",
      questions: [
        {
          title: "Implement linear search",
          prompt:
            "Walk an array and report whether a target value is present. State the best case and the worst case.",
          approach:
            "Check each element in turn and stop the moment you find the target.\n\nBest case is O(1) when the target sits first, worst case O(n) when it is last or absent. The property worth naming is that linear search is the only option when the data is unsorted, which is exactly why binary search cannot always replace it.",
        },
        {
          title: "Return the index of the target, or -1 when it is missing",
          prompt:
            "Return the position rather than a boolean. Decide what you return when the value appears more than once.",
          approach:
            "Same single pass, but return the loop index on a match and -1 after the loop finishes without one.\n\nReturning -1 rather than null or undefined is the convention interviewers expect, because 0 is a valid index and any falsy sentinel would be ambiguous. With duplicates you return the first hit unless told otherwise.",
        },
      ],
    },

    {
      title: "Binary Search",
      difficulty: "medium",
      questions: [
        {
          title: "Implement binary search iteratively",
          prompt:
            "Find a target in a sorted array with a loop. Return the index or -1. Explain why the array must be sorted.",
          approach:
            "Hold a low and a high bound. Look at the middle element: if it matches you are done, if the target is smaller move high below the middle, otherwise move low above it. Repeat while low does not pass high.\n\nHalving the range each step gives O(log n). It needs sorted input because the comparison at the middle is what lets you discard an entire half, and on unsorted data that deduction is invalid. Compute the middle as low plus half the gap rather than adding the two bounds, which avoids overflow in languages with fixed-width integers.",
        },
        {
          title: "Implement binary search recursively",
          prompt:
            "The same search written recursively. Compare the memory cost against the loop version.",
          approach:
            "Same decision at the middle, but instead of adjusting bounds and looping you call the function again with the narrowed bounds. An empty range is the base case that returns -1.\n\nThe difference worth stating is space: the loop is O(1) while the recursion holds O(log n) stack frames. Both are O(log n) in time.",
        },
        {
          title: "Find the target and replace it with 0",
          prompt:
            "Locate the value with binary search, then set that position to 0. Say what happens to the array afterwards.",
          approach:
            "Run the standard search to get the index, then write 0 at it, doing nothing when the search returns -1.\n\nThe subtlety to raise is that writing 0 may break the sorted order the array depended on, so any further binary search on it is unsafe. Noticing that consequence is what the question is really probing.",
        },
        {
          title: "Find the first occurrence of a value in a sorted array with duplicates",
          prompt:
            "In [1, 2, 2, 2, 3] searching for 2 must return index 1, the leftmost match.",
          approach:
            "Run a normal binary search, but on a match do not stop. Record the index and keep searching the left half by moving the high bound below the middle.\n\nContinuing after a hit is the whole modification. It stays O(log n), unlike walking left from the first match found, which degrades to O(n) when the array is one repeated value.",
        },
        {
          title: "Find the last occurrence of a value in a sorted array with duplicates",
          prompt: "In [1, 2, 2, 2, 3] searching for 2 must return index 3, the rightmost match.",
          approach:
            "The mirror of the previous one: on a match, record the index and keep searching the right half by moving the low bound above the middle.\n\nOne character of difference in which bound you move separates first from last, which is a nice thing to point out.",
        },
        {
          title: "Find the first and last occurrence in one function",
          prompt:
            "Return both boundary indexes for a value in a sorted array with duplicates. From those two you can also state how many times the value occurs.",
          approach:
            "Run the leftmost search and the rightmost search, giving two O(log n) passes overall.\n\nThe count falls out as last minus first plus one, which is far better than counting matches one by one. Return a clear pair like [-1, -1] when the value is absent.",
        },
        {
          title: "Binary search over a sorted array of strings",
          prompt:
            "Search an alphabetically sorted array of words. Explain what changes compared with searching numbers.",
          approach:
            "The algorithm is identical. The only change is the comparison, which becomes a lexicographic comparison instead of a numeric one.\n\nSeparating the comparison from the search is the lesson: swap the comparator and the same code searches numbers, words or objects by any field. Watch that case affects ordering, so mixed case may need normalising first.",
        },
        {
          title: "Find the minimum in a rotated sorted array",
          difficulty: "hard",
          prompt:
            "[4, 5, 6, 7, 0, 1, 2] returns 0. The array was sorted then rotated at an unknown point. Do it in O(log n).",
          approach:
            "Even rotated, one half is always properly sorted, and that is what you exploit.\n\nCompare the middle element against the high element. If the middle is larger, the rotation point lies to the right so move low past the middle. Otherwise the minimum is at the middle or to its left, so bring high down to the middle. When low and high meet you are standing on the minimum. Compare against high rather than low, which handles the not-rotated case cleanly.",
        },
        {
          title: "Search a sorted 2D array",
          prompt:
            "let grid = [[1, 3, 4], [6, 7, 8], [10, 23, 26]], target = 23. Every row is sorted and each row starts above the previous row's end, so treat the grid as one sorted run.",
          approach:
            "Because the rows chain together, the grid behaves like a single sorted array of rows times columns elements.\n\nBinary search over that virtual index range, and convert an index back to a cell by dividing by the column count for the row and taking the remainder for the column. That is O(log(rows × columns)). The alternative staircase walk, starting at the top-right and moving left or down, is O(rows + columns) and is what you use when rows do not chain.",
        },
        {
          title:
            "Given a sorted list of flight times, return the exact match or the next available time",
          difficulty: "hard",
          prompt:
            "Search a sorted list of times. If the requested time exists return it, otherwise return the earliest time after it. Say what you return when nothing later exists.",
          approach:
            "This is binary search with a different ending. Run the usual halving, and when you find an exact match return it.\n\nWhen the loop ends without a match, the low bound has landed on the first element greater than the target, which is exactly the next available time. That is the insight: the failed search still tells you where the value belongs. If low has run past the end of the array there is no later flight, so return null or whatever the caller expects.",
        },
      ],
    },
  ],
};
