export default {
  title: "Stack",
  level: "medium",
  subtopics: [
    {
      title: "Stack Implementation",
      difficulty: "easy",
      questions: [
        {
          title: "Implement a stack using an array with push, pop, peek and display",
          prompt:
            "Build a last-in first-out structure. Include isEmpty and size, and decide what pop returns on an empty stack.",
          approach:
            "Keep an array and treat one end as the top. Push adds at that end, pop removes from it, peek reads it without removing.\n\nUse the end of the array as the top, not the front, because adding and removing at the front shifts every element and turns O(1) operations into O(n). Decide deliberately whether popping an empty stack returns undefined or throws an underflow error, and be consistent.",
        },
        {
          title: "Implement a stack using a singly linked list",
          prompt:
            "Back the stack with nodes instead of an array. Explain what this buys you over the array version.",
          approach:
            "Treat the head of the list as the top. Push prepends a node, pop removes the head, and both are O(1) because neither touches the rest of the list.\n\nWhat it buys you is no resizing: an array-backed stack occasionally has to grow and copy everything, while nodes are allocated one at a time. The cost is a pointer of overhead per element and worse memory locality.",
        },
        {
          title: "Implement a stack using two queues",
          prompt:
            "Build last-in first-out behaviour out of two first-in first-out queues. Say which operation you made expensive.",
          approach:
            "You must make one of the two operations do the reordering work, and you choose which.\n\nMake push costly: enqueue the new value into the empty queue, then move everything from the main queue behind it, and swap the queues. Now the newest item sits at the front and pop is O(1) while push is O(n). Or keep push cheap and make pop move all but the last element across. Stating the trade explicitly is the answer they want.",
        },
        {
          title: "Add a reverse flag to a stack so pop takes from the other end",
          prompt:
            "When the flag is off pop removes the newest item; when it is on pop removes the oldest. Cover what happens when the flag flips mid-use.",
          approach:
            "Keep the underlying array and let pop check the flag to decide which end to remove from.\n\nThe interesting case is flipping mid-use: the structure stops being a pure stack and becomes a double-ended one, so removing from the front is O(n) with an array unless you switch to a doubly linked list or an index-based deque. Say what the flag means for ordering guarantees rather than only making it work.",
        },
        {
          title: "Build a stack that rejects duplicate values",
          prompt:
            "Push should silently ignore, or report, a value already in the stack. Keep push at O(1).",
          approach:
            "Hold a set alongside the stack. Push checks the set first and only proceeds when the value is absent, adding it to both. Pop removes from both.\n\nThe set is what keeps push at O(1); scanning the stack itself on each push would make it O(n). Keeping the two in step on every operation is the part that breaks if you add a method later and forget one of them.",
        },
      ],
    },

    {
      title: "Stack Problems",
      difficulty: "medium",
      questions: [
        {
          title: "Reverse a string using a stack",
          prompt: "Use a stack to turn 'hello' into 'olleh', and explain why a stack fits.",
          approach:
            "Push every character, then pop them all off and concatenate.\n\nIt fits because last-in first-out is reversal by definition: the last character pushed is the first one back out. It costs O(n) extra space where the two-pointer swap needs none, so this is about demonstrating the property rather than being the best reversal.",
        },
        {
          title: "Check whether a string is a palindrome using a stack",
          prompt: "Decide with a stack rather than two pointers.",
          approach:
            "Push the first half of the characters, skip the middle character on an odd length, then pop one per remaining character and compare.\n\nEach pop hands you the mirror-image character, so a mismatch ends it immediately. Pushing the whole string and comparing against the original also works but uses twice the memory for no gain.",
        },
        {
          title: "Validate parentheses",
          prompt:
            "areBracesBalanced('{{}}{}{}') is true and areBracesBalanced('{{{}}{}}{}}') is false. Support round, square and curly brackets.",
          approach:
            "Push every opening bracket. On a closing bracket, pop and check the popped opener is the matching type.\n\nTwo failures end it: popping from an empty stack means a closer with no opener, and a non-empty stack at the end means openers were never closed. Both must be checked, and forgetting the second one is why the second sample string above is often wrongly accepted.",
        },
        {
          title: "Validate parentheses and return the count of invalid pairs",
          prompt:
            "Instead of a yes or no, report how many brackets are unmatched so the caller knows how bad the input is.",
          approach:
            "Run the same scan but count instead of returning early. Each closer that finds no opener increments the count, and whatever remains on the stack at the end is added too.\n\nDecide up front whether a mismatched type, such as an opening round bracket closed by a square one, counts as one error or two, and say so. The change from early exit to full scan is the whole difference from the previous question.",
        },
        {
          title: "Check balanced brackets using a linked list as the stack",
          prompt:
            "Solve the bracket problem with your own linked-list stack instead of an array.",
          approach:
            "Swap the backing structure and leave the algorithm alone: prepend to push, remove the head to pop.\n\nThe point is that the algorithm depends on the stack contract, not on how the stack stores things. If your bracket checker needs editing to accommodate the new stack, your stack abstraction was leaking.",
        },
        {
          title: "Remove the middle element of a stack",
          prompt: "Delete the middle item while keeping the order of everything else.",
          approach:
            "Pop items into a temporary holder until you reach the middle, discard that one, then push the held items back.\n\nRecursion does this elegantly: pop, recurse, and on the way back up push everything except the middle. Compute the middle position from the size before you start, since the size changes as you pop. This is a good demonstration that a stack only lets you reach the middle by dismantling it.",
        },
        {
          title: "Remove the nth element of a stack using recursion",
          prompt: "Delete the nth item from the top without using a second stack.",
          approach:
            "Pop the top, recurse on the smaller stack, and push the popped value back on the way out, skipping the push when the counter reaches n.\n\nThe call stack is acting as your temporary storage, which is why no second stack is needed. Decide whether n counts from the top or the bottom, and say which.",
        },
        {
          title: "Reverse a stack",
          prompt: "Reverse the order of a stack's contents using extra structures.",
          approach:
            "Pop everything into a second stack and the order flips, though popping that back into the first would flip it again, so be careful about where the result ends up.\n\nUsing a queue as the intermediate is cleaner: pop everything into a queue, then push each item back, and the order is reversed exactly once. O(n) time and O(n) space.",
        },
        {
          title: "Reverse a stack using recursion, without another stack",
          prompt: "Reverse it in place using only the call stack.",
          approach:
            "Two recursive functions. The first pops the top, recursively reverses the rest, then inserts the popped value at the bottom. The second is that insert-at-bottom helper, which pops until the stack is empty, pushes the value, then pushes everything back.\n\nThis is the hardest of the stack exercises and it is worth tracing on three elements by hand. O(n²) time because each insertion walks the whole stack.",
        },
        {
          title: "Sort a stack using one temporary stack",
          prompt: "Sort the values so the largest ends up on top, using one auxiliary stack.",
          approach:
            "Pop from the source and insert into the temporary stack in the right place: while the temporary's top is bigger than the value you hold, move those back to the source, then push your value.\n\nIt is insertion sort with stacks, so O(n²). Tracing what happens when the value belongs at the very bottom is the case that clarifies the loop.",
        },
        {
          title: "Remove duplicate values using a second stack",
          prompt: "Strip repeated values, keeping the order of the survivors.",
          approach:
            "Pop everything into a second stack while tracking the values already kept in a set, skipping any repeat.\n\nRemember the transfer reverses the order, so either transfer twice or reverse at the end depending on the order you want out. Say which occurrence you keep, the first or the last, because the transfer direction decides it.",
        },
        {
          title: "Implement a min stack where getMin runs in O(1)",
          difficulty: "hard",
          prompt:
            "Support push, pop and getMin, all in constant time. Scanning for the minimum is not allowed.",
          approach:
            "Keep a second stack of minimums alongside the main one. On every push, also push the smaller of the new value and the current minimum. On every pop, pop both.\n\nThat way the top of the minimum stack is always the minimum of what remains, so getMin is a read. Storing a single minimum variable fails because popping the minimum leaves you with no way to recover the previous one, and understanding that failure is what the question is really testing.",
        },
        {
          title: "Implement a stack where getMax runs in O(1)",
          difficulty: "hard",
          prompt:
            "Support push, pop and a constant-time current maximum. Same rules as the min stack.",
          approach:
            "Identical design with the comparison flipped: the auxiliary stack holds the larger of the new value and the current maximum.\n\nTo save space you can push onto the auxiliary stack only when the new value is greater than or equal to the current maximum, and pop it only when the value being removed equals the top. Using greater-than-or-equal rather than strictly greater is essential, otherwise duplicate maximums get lost.",
        },
        {
          title: "Implement undo and redo for a text editor",
          prompt:
            "Model undo and redo with stacks. Explain what must happen to the redo history after a new action.",
          approach:
            "Two stacks. Each action is pushed onto undo. Undo pops from undo and pushes onto redo; redo pops from redo and pushes back onto undo.\n\nThe rule people miss is that performing a fresh action must clear the redo stack, because the future you could have redone no longer follows from the present. Bounding the undo stack to a maximum depth is the other real-world detail worth mentioning.",
        },
        {
          title: "Find the next warmer day for each day in a list of temperatures",
          difficulty: "hard",
          prompt:
            "For [73, 74, 75, 71, 69, 72, 76, 73] return how many days you wait for a warmer temperature, or 0 when none comes.",
          approach:
            "Checking every later day for each day is O(n²). A stack gets it to O(n).\n\nWalk the days keeping a stack of indexes whose answer is still unknown, held in decreasing temperature order. When today is warmer than the temperature at the index on top, pop it and record the day gap, repeating while the stack top is cooler. Then push today. Each index is pushed and popped once, so the whole thing is linear. Storing indexes rather than temperatures is what lets you compute the gap.",
        },
      ],
    },
  ],
};
