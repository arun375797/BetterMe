export default {
  title: "Recursion",
  level: "medium",
  subtopics: [
    {
      title: "Basic Recursion",
      difficulty: "easy",
      questions: [
        {
          title: "Print numbers from 1 to n recursively",
          prompt:
            "Print 1 up to n with no loop. Then change it to print n down to 1 and explain what you moved.",
          approach:
            "The function calls itself with a smaller n and stops when n reaches 0. What decides the printing order is whether you print before or after the recursive call.\n\nPrinting after the call gives ascending output, because the deepest call unwinds first. Printing before it gives descending output. Swapping those two lines is the cheapest way to feel how the call stack unwinds, and it is worth running both.",
        },
        {
          title: "Write a recursive function that stops after exactly 5 calls",
          prompt:
            "Build a function that recurses five times and then stops. Explain what happens if you remove the stopping condition.",
          approach:
            "Pass a counter down, add one on each call, and return as soon as it reaches 5. That returning condition is the base case.\n\nWithout it nothing ever stops the descent, each call keeps a frame on the call stack, and the stack eventually runs out of room and throws a stack overflow. Writing the base case first, before the recursive call, is the habit that prevents this in every later problem.",
        },
        {
          title: "Calculate a factorial recursively",
          prompt: "factorial(5) returns 120. Define what factorial(0) returns and why.",
          approach:
            "n factorial is n multiplied by the factorial of n-1, and the recursion bottoms out at 0 which is defined as 1.\n\nReturning 1 rather than 0 at the base matters, because 0 would drag the whole product to zero on the way back up. Guard negative input, which otherwise recurses past the base case forever. Depth grows with n, so very large n will exhaust the stack.",
        },
        {
          title: "Print the first 10 Fibonacci numbers recursively",
          prompt:
            "Print the first ten terms of the sequence where each number is the sum of the two before it, starting 0 and 1.",
          approach:
            "Write a function that returns the nth term as the sum of terms n-1 and n-2, with 0 and 1 as the two base cases, then call it for each position from 0 to 9.\n\nBe aware that this recomputes the same terms over and over, so the work grows exponentially. At ten terms nobody notices, but you should say out loud that caching the results, or building the sequence iteratively, is what you would do beyond small n.",
        },
        {
          title: "Find the nth Fibonacci number recursively",
          prompt:
            "Return the nth term on its own. Explain why the plain recursive version becomes slow and what fixes it.",
          approach:
            "The plain version is the two base cases plus the sum of the two smaller calls, and it is roughly O(2^n) because the call tree recomputes identical subproblems constantly.\n\nThe fix is memoisation: keep a cache from n to its result, check it before recursing, and store the answer before returning. That collapses the work to O(n) because each term is computed once. Being able to explain that jump is the whole reason this question is asked.",
        },
        {
          title: "Sum the digits of a number recursively",
          prompt: "sumDigits(1234) returns 10.",
          approach:
            "Peel the last digit off with the remainder of division by 10, then recurse on the number with that digit removed by integer-dividing by 10. Stop when the number reaches 0.\n\nUse a flooring division so you do not carry a fraction into the next call. Decide how you treat negative numbers, normally by taking the absolute value first.",
        },
        {
          title: "Sum an array recursively",
          prompt: "Return the total of an array using recursion instead of a loop.",
          approach:
            "The total is the first element plus the total of everything after it, and an empty array totals 0.\n\nPass an index down rather than slicing the array on every call, because slicing copies and turns a linear job into a quadratic one. The empty-array base returning 0 is what makes the arithmetic work at the bottom.",
        },
        {
          title: "Find the largest element of an array recursively",
          prompt: "Return the maximum value using recursion rather than a loop.",
          approach:
            "The largest is the bigger of the first element and the largest of the rest. The base case is a single remaining element, which is its own maximum.\n\nBase on one element rather than zero, since an empty array has no maximum to return. Carry an index instead of slicing, same as the recursive sum.",
        },
      ],
    },

    {
      title: "String Recursion",
      difficulty: "medium",
      questions: [
        {
          title: "Reverse a string recursively",
          prompt: "'hello' returns 'olleh' with no loop and no built-in reverse.",
          approach:
            "The reverse of a string is the reverse of everything after the first character, with the first character stuck on the end. An empty string reverses to itself, which is the base case.\n\nEach call peels one character off the front and defers it to the back, so the deepest call finishes first and the characters come back in flipped order. Watch that repeatedly slicing the string allocates a new one per call.",
        },
        {
          title: "Remove every occurrence of a character recursively",
          prompt:
            "Remove all 'l' from 'hello' to get 'heo'. Work through the string properties as you go, and do not use replace.",
          approach:
            "Look at the first character. If it is the one to remove, return the result of recursing on the rest. If it is not, return that character joined to the result of recursing on the rest. The empty string is the base case.\n\nEvery character is either kept or dropped and the recursion always shrinks the input, which is what guarantees it terminates. Remove every occurrence, not just the first, which the recursion handles naturally.",
        },
        {
          title: "Reverse every word in a sentence recursively",
          prompt:
            "'hello world' becomes 'olleh dlrow'. Word order stays, letters inside each word flip.",
          approach:
            "Two recursions stacked. One walks the list of words, and for each word it calls the recursive string reverse on it.\n\nKeeping the two responsibilities in separate functions is what keeps this readable. Trying to reverse words and characters in a single recursive function is where people tie themselves in knots.",
        },
        {
          title: "Check whether a string is a palindrome recursively",
          prompt: "Return true for 'racecar'. Use recursion instead of two pointers.",
          approach:
            "Compare the first and last characters. If they differ, answer false immediately. If they match, recurse on the substring between them.\n\nA string of length 0 or 1 is a palindrome, which is your base case. This is the two-pointer solution wearing a different coat: the recursion is what moves the pointers inward for you.",
        },
        {
          title: "Print each word of a sentence in reverse order recursively",
          prompt:
            "'one two three' prints 'three two one'. The words are reordered but the letters inside each word are not touched.",
          approach:
            "Recurse to the end of the word list first, then print on the way back up. Because the deepest call returns first, the last word prints first.\n\nThis is exactly the print-before versus print-after distinction from counting to n. Notice you are getting the reversal for free from the call stack rather than reversing anything yourself.",
        },
      ],
    },

    {
      title: "Array & Object Recursion",
      difficulty: "medium",
      questions: [
        {
          title: "Reverse an array recursively",
          prompt: "Reverse an array using recursion instead of a loop or the built-in method.",
          approach:
            "Swap the elements at the two ends, then recurse inward on the pair one step closer to the middle. Stop when the two indexes meet or cross.\n\nPassing the left and right indexes down keeps it in place with no copying. This is the two-pointer swap again, with the recursion advancing the pointers.",
        },
        {
          title: "Remove the even numbers from an array recursively",
          prompt: "[1, 2, 3, 4, 5] returns [1, 3, 5], built recursively.",
          approach:
            "Look at the first element. If it is odd, keep it in front of the result of recursing on the rest. If it is even, return the recursion on the rest without it. The empty array is the base case.\n\nSame keep-or-drop shape as removing a character from a string, which is worth noticing: recursive filtering always looks like this regardless of what is being filtered.",
        },
        {
          title: "Flatten a nested array recursively",
          prompt: "[1, [2, [3, [4]]], 5] becomes [1, 2, 3, 4, 5] with unknown nesting depth.",
          approach:
            "Walk the items. When an item is an array, recurse into it and append everything the recursion returns. When it is a plain value, append it directly.\n\nRecursion is the natural fit precisely because the depth is unknown, so no fixed number of nested loops would do. Compare it against the iterative stack version and note they do the same work, one borrowing the call stack and one managing its own.",
        },
        {
          title: "Sum a deeply nested array recursively",
          prompt: "[1, [2, [3, [4]]]] returns 10, at any depth.",
          approach:
            "Same walk as flattening, except instead of collecting values you add them to a running total, adding the result of the recursive call when an item is an array.\n\nIf non-numbers may appear, skip them explicitly or the total becomes NaN. Recognising that this and flatten are the same traversal with a different action is the useful takeaway.",
        },
        {
          title: "Deep copy a nested object without built-in methods",
          prompt:
            "Produce a copy where changing a nested value in the copy does not affect the original. No structuredClone and no JSON round trip.",
          approach:
            "Recurse over the value. Primitives are returned as they are. Arrays and objects get a new container, and each of their entries is deep copied into it.\n\nA shallow copy fails because nested objects are still shared by reference, and that is the whole point of the question. Handle arrays separately from plain objects so an array does not come back as an object with numeric keys. Mention that a circular reference will loop forever unless you keep a map of already-copied objects.",
        },
        {
          title: "Flatten a nested object into a single level object",
          prompt:
            "{ a: { b: { c: 1 } }, d: 2 } becomes { 'a.b.c': 1, d: 2 }. Nested keys are joined with a dot.",
          approach:
            "Recurse with the key path built so far. When a value is a plain object, recurse with the path extended by that key. When it is a leaf, write the joined path as the key in the output.\n\nThe path accumulator is the part worth getting right, and passing it down as an argument is cleaner than trying to rebuild it on the way back up. Decide how arrays and null are treated, since null is technically an object and will recurse into nothing if you do not guard it.",
        },
        {
          title: "List every file name in a nested file system object",
          prompt:
            "Given a structure where folders contain more folders and files, return every file name. The depth is unknown.",
          approach:
            "For each entry, decide whether it is a folder or a file. Folders get recursed into, files get their name collected.\n\nThis is the same shape as flattening a nested array, which is the point: once you recognise the pattern, unknown-depth traversal stops being scary. Say whether you want bare file names or full paths, because full paths need a path accumulator like the object-flattening question.",
        },
      ],
    },

    {
      title: "Recursion With Data Structures",
      difficulty: "medium",
      questions: [
        {
          title: "Binary search recursively",
          prompt:
            "Search a sorted array using recursion. Return the index of the target or -1 when it is missing.",
          approach:
            "Compute the middle of the current range. If it matches, return that index. If the target is smaller, recurse on the left half, otherwise recurse on the right half. When the range becomes empty, the target is absent.\n\nPass the low and high bounds down rather than slicing, so you can return a real index into the original array. This version uses O(log n) stack frames where the loop version uses none, which is the trade to mention.",
        },
        {
          title: "Traverse a linked list recursively",
          prompt: "Print every value of a linked list from head to tail using recursion.",
          approach:
            "Print the current node's value, then call the function on the next node. A null node is the base case that ends it.\n\nA linked list is a naturally recursive structure, since the tail of a list is just a smaller list. Note that the recursion depth equals the length of the list, so a long list can overflow the stack where a loop would not.",
        },
        {
          title: "Print a linked list in reverse recursively",
          prompt: "Print the values from tail back to head without reversing the list itself.",
          approach:
            "Recurse to the end of the list first, then print on the way back up.\n\nMoving the print statement to after the recursive call is the entire solution, and it is a good demonstration that the call stack already holds the nodes in reverse for you. The list itself is never modified.",
        },
        {
          title: "Sum the values of a linked list recursively",
          prompt: "Return the total of every value in a linked list using recursion.",
          approach:
            "The total is the current node's value plus the total of the rest of the list, and a null node contributes 0.\n\nThat null base case returning 0 is what makes the addition work at the bottom, exactly as it does in the recursive array sum. Same pattern, different container.",
        },
      ],
    },
  ],
};
