export default {
  title: "Arrays",
  level: "low",
  subtopics: [
    {
      title: "Basic Array Problems",
      difficulty: "easy",
      questions: [
        {
          title: "Find the sum of all elements",
          prompt:
            "Given an array of numbers, return the total of every value in it. [4, 8, 15, 16] returns 43. An empty array returns 0.",
          approach:
            "Keep a running total that starts at 0, walk the array once and add each value to it. Return the total at the end.\n\nThe empty array falling out as 0 for free is the reason you start the total at 0 rather than at the first element. One pass, O(n) time and O(1) extra space.",
        },
        {
          title: "Find the minimum element",
          prompt:
            "Return the smallest number in an array without sorting it. [7, 2, 9, 2, 5] returns 2.",
          approach:
            "Assume the first element is the smallest, then walk from the second element onward and replace your answer whenever you meet something smaller.\n\nStart from the first element and not from 0 or Infinity, otherwise an array of all positive numbers or all negative numbers gives you the wrong answer. Decide up front what an empty array should return. O(n) time.",
        },
        {
          title: "Find the maximum element",
          prompt:
            "Return the largest number in an array without sorting it. [7, 2, 9, 2, 5] returns 9.",
          approach:
            "Same shape as the minimum: seed your answer with the first element, walk the rest, and keep the larger of the two each time.\n\nSorting first would also work but costs O(n log n) for something a single pass solves in O(n). Interviewers usually ask this to see whether you reach for sort out of habit.",
        },
        {
          title: "Find the second largest element",
          prompt:
            "Return the second largest value in an array. [12, 35, 1, 10, 34, 1] returns 34. Say what you return when every element is the same.",
          approach:
            "Track two values as you walk: the largest so far and the second largest so far. When a new value beats the largest, the old largest slides down into second place and the new value becomes largest. When it only beats second place, replace second place alone.\n\nThe cases that break naive solutions are duplicates of the maximum, so skip a value that equals the current largest instead of letting it push the real second largest out. One pass, O(n).",
        },
        {
          title: "Find the third largest element without sorting",
          prompt:
            "Return the third largest value in a single pass. Handle negative numbers and duplicates correctly. [2, 3, 1, 5, 4] returns 3.",
          approach:
            "Extend the two-variable idea to three: first, second and third. On each element decide which slot it belongs in and cascade the old values down one place.\n\nSeed the three slots from the first few real elements rather than from 0, or an all-negative array will report 0 as an answer. Skip values equal to one you already hold so duplicates do not fill two slots. If fewer than three distinct values exist, say so rather than returning a wrong number.",
        },
        {
          title: "Find the kth largest element",
          prompt:
            "Given an array and a number k, return the kth largest value. With [3, 2, 1, 5, 6, 4] and k = 2 the answer is 5.",
          approach:
            "The straightforward route is to sort descending and read index k-1, which is O(n log n) and worth stating first.\n\nTo do better, keep a collection of only the k largest values seen so far. Walk the array once, and each time you meet something bigger than the smallest of your k, swap it in. You only ever hold k items, so the extra space is O(k). Say which one you would ship and why.",
        },
        {
          title: "Find the second largest and second smallest together",
          prompt:
            "Return both the second largest and the second smallest value from one traversal of the array.",
          approach:
            "Carry four variables at once: largest, second largest, smallest and second smallest. For each element run both comparisons before moving on.\n\nThe point of the question is doing it in one pass instead of walking the array twice. Seed all four from the first elements, and guard the case where the array has fewer than two distinct values.",
        },
        {
          title: "Find the sum of even numbers",
          prompt:
            "Add up only the even values in an array. [1, 2, 3, 4, 5, 6] returns 12.",
          approach:
            "Walk the array, test each value with the remainder operator, and add it to your total only when the remainder on division by 2 is zero.\n\nWatch negative even numbers: -4 % 2 is still 0 in JavaScript, so they are correctly included. Zero is even too.",
        },
        {
          title: "Find the average of even numbers",
          prompt:
            "Return the mean of the even values in an array. [1, 2, 3, 4, 5, 6] returns 4.",
          approach:
            "Track two things in one pass: the running total of even values and how many you have seen. Divide at the end.\n\nThe case to handle deliberately is an array with no even numbers, because dividing by a count of zero gives NaN. Decide whether you return 0, null, or throw, and say so.",
        },
        {
          title: "Find the prime numbers in an array",
          prompt:
            "Return every prime value in an array. [2, 4, 7, 9, 11, 15] returns [2, 7, 11].",
          approach:
            "Write a helper that decides whether one number is prime, then filter the array with it.\n\nInside the helper, anything below 2 is not prime, and you only need to test divisors up to the square root of the number, because any factor above the square root is paired with one below it. That change alone takes the check from O(n) to O(√n). Remember 2 is prime and it is the only even prime.",
        },
        {
          title: "Find the sum of prime numbers",
          prompt: "Add together only the prime values in an array.",
          approach:
            "Reuse the is-prime helper from the previous question and add each value that passes to a running total.\n\nThe reason this follows the previous question is to show that once the helper exists, the outer problem is a one-line change. If the array is large and values repeat, caching results per value saves repeated work.",
        },
        {
          title: "Find the frequency of each number",
          prompt:
            "Return how many times each value appears. [1, 2, 2, 3, 1, 1] returns something like { 1: 3, 2: 2, 3: 1 }.",
          approach:
            "Walk the array once and build a map from value to count. For each element, either start its count at 1 or add 1 to the count already stored.\n\nThis counting map is the single most reused pattern in interviews: duplicates, anagrams, first non-repeating character and top-k all start here. O(n) time and O(distinct values) space.",
        },
        {
          title: "Remove duplicate elements",
          prompt:
            "Return an array with each value appearing only once, keeping the original order. [1, 5, 2, 2, 7, 5] returns [1, 5, 2, 7].",
          approach:
            "The plain version compares each element against everything already kept, which is O(n²). Write that first and name its cost.\n\nThen improve it: remember what you have already seen in a set, walk once, and keep an element only the first time you meet it. That is O(n) and it preserves order, which sorting first would destroy.",
        },
        {
          title: "Remove duplicate elements in O(n)",
          difficulty: "medium",
          prompt:
            "Deduplicate an array in a single pass. State the time and space cost of your solution.",
          approach:
            "Use a set as your memory of what has already been output. One traversal, a constant-time lookup per element, so O(n) time.\n\nThe honest part of the answer is the trade: you spent O(n) extra space to buy back the time. If the array were already sorted you could instead do it in place with two pointers and no extra space, since duplicates would sit next to each other.",
        },
        {
          title: "Find the common elements between two arrays",
          prompt:
            "Return the values that appear in both arrays. [1, 2, 3, 4] and [3, 4, 5] return [3, 4].",
          approach:
            "Nested loops give O(n × m). Say that, then improve it.\n\nPut the smaller array into a set, walk the larger one, and keep values the set contains. That is O(n + m). Decide what to do about duplicates inside a single array, and consider removing a value from the set once matched if each element should pair only once.",
        },
        {
          title: "Delete a specific element from an array",
          prompt:
            "Remove the first occurrence of a given value and shift the rest left, without using splice or filter.",
          approach:
            "Find the index of the value, then move every element after it one slot to the left and shorten the array by one.\n\nThe reason this is asked without built-in methods is to expose why array deletion is O(n): the removal itself is instant, but the shifting of everything behind it is what costs. That is the concrete difference against a linked list.",
        },
        {
          title: "Insert an element at a given index without built-in methods",
          prompt:
            "Insert a value at a given index so the elements after it move right by one. Do not use splice.",
          approach:
            "Walk from the end of the array backwards to the insert point, copying each element one slot to the right, then drop the new value into the freed slot.\n\nGoing backwards matters: walking forwards would overwrite values before you had a chance to copy them. Handle inserting at index 0 and at the end as the two boundaries.",
        },
        {
          title: "Reverse an array",
          prompt:
            "Reverse an array in place without using the built-in reverse method. [1, 2, 3, 4] becomes [4, 3, 2, 1].",
          approach:
            "Put one pointer at the start and one at the end, swap the two values, then move both pointers inward. Stop when they meet or cross.\n\nThis is the plainest example of the two-pointer technique. You do n/2 swaps, so O(n) time and no extra array, which is what makes it in place.",
        },
        {
          title: "Remove the values at odd indexes",
          prompt:
            "Return only the elements sitting at even indexes. ['a', 'b', 'c', 'd', 'e'] returns ['a', 'c', 'e'].",
          approach:
            "Walk the array and keep an element only when its index divided by 2 leaves no remainder.\n\nThe trap is confusing the index with the value: it is the position that must be even, not the number stored there. Stepping the loop by 2 instead of testing every index is the neater version.",
        },
        {
          title: "Remove the longest string from an array of strings",
          prompt:
            "Given an array of words, remove the longest one. ['hi', 'hello', 'hey'] returns ['hi', 'hey']. Decide what to do on a tie.",
          approach:
            "One pass to find the index of the longest string, a second pass to build the result without that index.\n\nState your tie rule before you code: keeping the first longest is the usual choice. Doing it in a single pass is possible but hurts readability, so this is a fair place to prefer two clear passes.",
        },
      ],
    },

    {
      title: "Array Interview Problems",
      difficulty: "medium",
      questions: [
        {
          title: "Move all zeros to the end keeping the order of the rest",
          prompt:
            "[0, 1, 0, 3, 12] becomes [1, 3, 12, 0, 0]. The non-zero values must stay in their original relative order. Do it in place.",
          approach:
            "Keep a write pointer at position 0. Walk the array with a read pointer, and every time you meet a non-zero value, write it at the write pointer and move the write pointer forward.\n\nWhen the read pointer finishes, everything from the write pointer to the end must become zero. One pass plus one fill, O(n) time and no extra array. Building a new array is easier but no longer in place, so say which one you were asked for.",
        },
        {
          title: "Move all zeros to the beginning",
          prompt:
            "The mirror of the previous problem: [0, 1, 0, 3, 12] becomes [0, 0, 1, 3, 12], with the non-zero order preserved.",
          approach:
            "Run the same two-pointer idea from the other end. Put the write pointer at the last index and walk the array backwards, writing each non-zero value and stepping the write pointer left.\n\nWhen you are done, fill everything from the start up to the write pointer with zeros. Getting this from the previous answer by flipping the direction is the point of the exercise.",
        },
        {
          title: "Two Sum with the brute force approach, then improve it",
          prompt:
            "Given an array and a target, return the indexes of the two values that add up to the target. [2, 7, 11, 15] with target 9 returns [0, 1]. Write the O(n²) version first, state its cost, then work out what to change.",
          approach:
            "Brute force: for every element, look at every element after it and test whether the pair hits the target. That is O(n²) and it is the version you should be able to write instantly.\n\nTo improve it, flip the question. Instead of asking \"what pairs with this?\" and searching, ask \"have I already seen target minus this value?\" Keep a map from value to index as you walk, and check the map before storing the current element. One pass, O(n) time, O(n) space. Storing the current value only after checking is what stops an element pairing with itself.",
        },
        {
          title: "Find all pairs that add up to a target",
          prompt:
            "Return every pair of values that sums to the target. [1, 2, 3, 4, 5, -1, -2, -3, 6, 7] with target 2 has several. Say whether a value may be reused.",
          approach:
            "This is Two Sum but you must not stop at the first hit. Use the same seen-map, and each time the complement is already present, record the pair and keep going.\n\nThe part worth deciding out loud is duplicates: should [1, 1, 1] with target 2 report one pair or three? Use a frequency map rather than a plain set when the same value may take part more than once.",
        },
        {
          title: "Find the first missing number",
          prompt:
            "Given numbers that should run 1 to n with exactly one absent, return the missing value. [1, 2, 4, 5] returns 3.",
          approach:
            "The clean trick is arithmetic. The sum of 1 to n is n × (n + 1) / 2. Add up what you actually have and subtract it from the expected total, and the difference is the missing number.\n\nThat is one pass, O(n) time, no extra space and no sorting. Mention the alternative of XOR-ing every index against every value, which avoids the overflow risk that large sums carry in stricter languages.",
        },
        {
          title: "Product of the array except self",
          prompt:
            "For each position, return the product of every other element. [1, 2, 3, 4] returns [24, 12, 8, 6]. Solve it without using division.",
          approach:
            "The answer for a position is everything to its left multiplied by everything to its right.\n\nSo make one left-to-right pass writing the running product of everything before each index, then one right-to-left pass multiplying in the running product of everything after. Two passes, O(n) time, and the output array is the only space you need. Division is banned because a single zero in the input breaks it.",
        },
        {
          title: "Check whether an array is sorted in O(n)",
          prompt:
            "Return true when an array is already in ascending order. Do it in a single pass.",
          approach:
            "Walk from the second element and compare each value against the one before it. The moment you find a smaller value, return false. Reaching the end means it is sorted.\n\nReturning early is what keeps this cheap on unsorted input. Decide whether equal neighbours count as sorted, which is usually yes.",
        },
        {
          title: "Merge two sorted arrays",
          prompt:
            "Combine two already sorted arrays into one sorted array. [1, 3, 5] and [2, 4, 6] return [1, 2, 3, 4, 5, 6].",
          approach:
            "Put a pointer at the start of each array. Compare the two values they point at, take the smaller one into the result, and move only that pointer forward. Repeat until one array runs out, then append whatever is left of the other.\n\nConcatenating and sorting also works but throws away the fact that both inputs are already sorted, and costs O(n log n) instead of O(n + m). Do not forget the leftover tail.",
        },
        {
          title: "Find the prefix sum of an array, then answer range queries in O(1)",
          prompt:
            "Build a structure so that after preparing it, the sum of any range from index i to j can be answered instantly. Explain the preparation cost and the query cost separately.",
          approach:
            "Build an array where each position holds the total of everything up to that index. That preparation is one pass, O(n).\n\nOnce it exists, the sum of a range is the prefix total at the end of the range minus the prefix total just before the start, which is a single subtraction. The whole point is trading O(n) setup once for O(1) per query, which pays off the moment there is more than one query. Be careful with the off-by-one at the left edge of the range.",
        },
        {
          title: "Reverse an array and reverse each of its inner arrays",
          prompt:
            "Given [[1, 2], [3, 4], [5, 6]], return [[6, 5], [4, 3], [2, 1]]. The outer order flips and so does the content of each inner array.",
          approach:
            "Two separate jobs. Reverse the outer array with the two-pointer swap, then walk the result and reverse each inner array the same way.\n\nDoing both at once in one loop is possible but harder to read. Say whether you are mutating the original arrays or producing new ones, because callers care about that.",
        },
      ],
    },

    {
      title: "2D & Nested Arrays",
      difficulty: "medium",
      questions: [
        {
          title: "Find a target in a 2D array and return its [row, column]",
          prompt:
            "let grid = [[1, 2, 3], [5, 6, 9], [10, 23, 34]], target = 9 returns [1, 2]. Return -1 or null when the target is absent. The grid is not assumed sorted.",
          approach:
            "Use a loop inside a loop: the outer over rows, the inner over the columns of that row. Return the pair of indexes as soon as you match.\n\nWith no sorting to exploit you cannot beat O(rows × columns). Return from inside the nested loop rather than setting a flag, and make sure you return the row first and the column second.",
        },
        {
          title: "Flatten a multidimensional array without recursion",
          prompt:
            "Turn [1, [2, [3, [4]]], 5] into [1, 2, 3, 4, 5] using a loop rather than a recursive call.",
          approach:
            "Keep your own stack of items still to process. Push the whole array onto it, then repeatedly pop an item: if it is an array push its elements back on, if it is a value add it to the output.\n\nPopping reverses the order, so either push the children in reverse or add each result to the front of the output. This is the iterative twin of the recursive version, and it makes clear that recursion was only ever borrowing the call stack for you.",
        },
        {
          title: "Find the sum of each column",
          prompt:
            "For [[1, 2, 3], [4, 5, 6], [7, 8, 9]] return [12, 15, 18], the total of each column.",
          approach:
            "Make a totals array as wide as one row, filled with zeros. Walk every row, and for each row add each value into the total sitting at that same column index.\n\nThe mental flip is that the inner index selects the column while the outer index selects the row, which is the opposite of the usual reading order. Decide what to do with ragged rows of different lengths.",
        },
        {
          title: "Add the column sums as a new last column",
          prompt:
            "Take a grid, compute the sum of each row, and append that sum to the end of the row so the grid grows one column wider.",
          approach:
            "Walk each row, total it, then push the total onto the end of that same row.\n\nRead the wording carefully, because column sums and row totals are easy to swap. Say whether you are modifying the grid in place or returning a new one, and prefer a new grid if the caller may still need the original.",
        },
        {
          title: "Remove the row that contains the largest number",
          prompt:
            "Given a grid, find the single largest value anywhere in it and drop the entire row holding it. Decide what happens on a tie.",
          approach:
            "First pass over every cell to find the maximum and remember which row it sat in. Second pass to rebuild the grid without that row index.\n\nTrying to do it in one pass tempts you into deleting while iterating, which shifts the indexes underneath you. State your tie rule, normally removing the first row that contains the maximum.",
        },
        {
          title: "Find the sum of all numbers in a nested array",
          prompt:
            "Total every number no matter how deeply nested, and ignore values that are not numbers. [1, [2, 'x', [3]], 4] returns 10.",
          approach:
            "For each item, decide between three cases: it is an array so go deeper, it is a number so add it, or it is anything else so skip it.\n\nThe skip case is what the question is really testing, because a mixed-type array will otherwise produce NaN and poison the whole total. Either recursion or your own stack works.",
        },
      ],
    },

    {
      title: "Subarray Problems",
      difficulty: "hard",
      questions: [
        {
          title: "Find the maximum sum subarray",
          prompt:
            "Return the largest total obtainable from any contiguous run of elements. [-2, 1, -3, 4, -1, 2, 1, -5, 4] returns 6, from [4, -1, 2, 1].",
          approach:
            "Checking every start and end pair is O(n²). Kadane's algorithm gets it to one pass.\n\nWalk the array carrying the best sum that ends exactly at the current element. At each step you either extend the previous run or start fresh from the current element, whichever is larger. Keep a separate record of the best value you have ever seen. Seed both from the first element rather than 0, or an all-negative array wrongly answers 0.",
        },
        {
          title: "Find the longest continuously increasing subarray",
          prompt:
            "Return the longest run of elements where each is larger than the one before. [1, 3, 5, 4, 7] returns [1, 3, 5]. Say whether you return the run or its length.",
          approach:
            "Carry a current run length and the best run length seen. Walk from the second element: if it is bigger than the previous element, the current run grows by one, otherwise the run resets to 1.\n\nTo return the actual run and not just its length, also remember where the best run started. One pass, O(n). Decide whether equal neighbours break the run, which they normally do.",
        },
        {
          title: "Find a subarray that adds up to a target sum",
          prompt:
            "Return the contiguous run of elements whose total equals the target, or say none exists. Handle negative numbers.",
          approach:
            "With only positive numbers, a sliding window works: grow the window while the total is too small, shrink from the left while it is too large. That is O(n).\n\nNegative numbers break that, because growing the window no longer reliably grows the total. Then use running totals with a map: store each running total you have seen against its index, and at each step check whether running total minus target has appeared before. If it has, the stretch between those two points is your answer.",
        },
      ],
    },
  ],
};
