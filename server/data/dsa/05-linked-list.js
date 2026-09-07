export default {
  title: "Linked List",
  level: "medium",
  subtopics: [
    {
      title: "Singly Linked List — Implementation",
      difficulty: "easy",
      questions: [
        {
          title: "Implement a singly linked list using classes",
          prompt:
            "Build a Node holding a value and a next pointer, and a LinkedList holding the head. Keep it encapsulated so callers cannot reach in and grab head directly.",
          approach:
            "Two classes. Node stores a value and a reference to the next node, which is null at the tail. LinkedList stores the head, and usually a size counter and a tail reference too.\n\nKeeping a tail reference turns appending from O(n) into O(1), and keeping a size counter turns length from O(n) into O(1). Both are cheap to maintain and pay off in every later operation, so decide up front and keep them updated in every method that changes the list.",
        },
        {
          title: "Append a node to the end",
          prompt: "Add a value at the tail. Handle the case where the list is currently empty.",
          approach:
            "Create the node. If the head is null the new node becomes the head, otherwise walk to the last node and point its next at the new node.\n\nWithout a tail reference that walk is O(n); with one it is O(1) and you simply update the tail. The empty-list branch is the case people forget, and it is the reason a bare append crashes on a fresh list.",
        },
        {
          title: "Prepend a node to the front",
          prompt: "Add a value at the head and explain why this is cheaper than appending.",
          approach:
            "Point the new node's next at the current head, then make the new node the head.\n\nThe order matters: if you reassign the head first you lose the rest of the list. This is O(1) with no shifting, which is the concrete advantage a linked list holds over an array, where inserting at the front moves every element.",
        },
        {
          title: "Insert a node at a specific index",
          prompt: "Insert a value so it lands at the given position. Validate an out-of-range index.",
          approach:
            "Index 0 is a prepend and the end is an append, so handle those first. Otherwise walk to the node just before the target position, point the new node at that node's next, then point that node at the new node.\n\nStopping at the node before is the crux, because a singly linked list gives you no way back. Reject a negative index or one past the end rather than silently doing nothing.",
        },
        {
          title: "Insert a node after a given node",
          prompt:
            "Given a value already in the list, insert a new node directly after it. Check every condition, including the value not being present.",
          approach:
            "Walk until you find the node holding that value. Point the new node at the found node's next, then point the found node at the new node.\n\nInserting after is easy in a singly linked list because you already hold the node you need to modify. Inserting before is the hard direction and needs the previous node. Handle the value being absent explicitly rather than dereferencing null.",
        },
        {
          title: "Delete the first node",
          prompt: "Remove the head and return the removed value. Handle the empty list.",
          approach:
            "Move the head to head.next. The old head is then unreferenced and gets collected.\n\nThat is O(1), which is why a linked list is the natural backing for a stack or a queue front. If you keep a size counter decrement it, and if the list becomes empty clear the tail reference too or it dangles at a removed node.",
        },
        {
          title: "Delete the last node",
          prompt:
            "Remove the tail. Explain why this costs more than removing the head even if you keep a tail pointer.",
          approach:
            "You must walk to the second-to-last node and set its next to null, then update the tail to point there.\n\nEven with a tail reference this stays O(n), because a singly linked list has no way to step backwards to find the new tail. That single fact is the strongest argument for a doubly linked list, and it is exactly what the question is fishing for.",
        },
        {
          title: "Delete a node by value",
          prompt:
            "Remove the first node holding a given value. Handle the value being at the head and the value not existing.",
          approach:
            "Walk with both a current and a previous pointer. When current holds the value, point previous.next at current.next to unlink it.\n\nThe head case has no previous, so handle it before the loop by moving the head forward. Not carrying a previous pointer is the classic bug, because once you are standing on the node you want gone you cannot reach the one before it.",
        },
        {
          title: "Delete a node by position",
          prompt: "Remove the node at a given index and validate the index first.",
          approach:
            "Same previous-and-current walk, but counting steps instead of comparing values. Position 0 is the head case.\n\nCheck the index against the size before walking so you fail fast rather than running off the end into null. Update the tail reference when you remove the last node.",
        },
        {
          title: "Search for a value and return its index",
          prompt: "Return the position of a value, or -1 when it is absent.",
          approach:
            "Walk from the head counting steps and return the counter when the value matches.\n\nThis is O(n) with no possible shortcut, and that is the key contrast with an array: even if the linked list were sorted you could not binary search it, because there is no way to jump to the middle without walking there.",
        },
        {
          title: "Traverse and print the list",
          prompt: "Print every value from head to tail in a readable form such as 1 -> 2 -> 3.",
          approach:
            "Start at the head, print the value, move to next, and stop at null.\n\nCollect the values and join them at the end rather than printing piecemeal, which gives you the arrow formatting for free. This traversal is the skeleton every other list method is built on, so get comfortable writing it without thinking.",
        },
        {
          title: "Convert an array to a linked list",
          prompt: "Turn [1, 2, 3, 4, 5] into a linked list with one node per element.",
          approach:
            "Walk the array and append each value, keeping hold of the last node so each append is O(1) rather than a fresh walk from the head.\n\nDoing it naively by calling an O(n) append per element makes the whole conversion O(n²), which is worth noticing. Build the head from the first element, then chain the rest onto a moving tail pointer.",
        },
      ],
    },

    {
      title: "SLL Interview Problems",
      difficulty: "medium",
      questions: [
        {
          title: "Reverse a linked list",
          prompt:
            "Turn 1 -> 2 -> 3 into 3 -> 2 -> 1 by re-pointing the nodes, not by copying values into an array.",
          approach:
            "Carry three pointers: previous starting at null, current starting at the head, and a temporary next.\n\nOn each step save current.next, point current.next backwards at previous, then slide previous to current and current to the saved next. When current reaches null, previous is the new head. Saving next before you overwrite the pointer is the whole trick, because without it you lose the rest of the list. O(n) time, O(1) space.",
        },
        {
          title: "Find the middle node",
          prompt:
            "Return the middle value. Say which of the two middles you return when the list has an even length.",
          approach:
            "The obvious way is two passes: count the length, then walk half of it.\n\nThat is perfectly correct and O(n), and it is worth writing before reaching for anything cleverer. State your rule for even lengths, since 1 -> 2 -> 3 -> 4 could reasonably return 2 or 3.",
        },
        {
          title: "Find the middle node in a single traversal",
          prompt:
            "Return the middle node in one pass, without first counting the length. Two pointers moving at different speeds.",
          approach:
            "Move a slow pointer one node at a time and a fast pointer two at a time from the same start.\n\nWhen the fast pointer reaches the end, the slow pointer is standing on the middle, because it has covered exactly half the distance. Whether you stop on fast being null or fast.next being null decides which middle you land on for even lengths. Check both fast and fast.next before stepping, or you will dereference null.",
        },
        {
          title: "Delete the middle node without knowing the length",
          prompt: "Remove the middle node in a single pass.",
          approach:
            "Same slow and fast walk, but also carry the node just before slow.\n\nWhen fast finishes, unlink slow by pointing the node before it at slow.next. You need that extra previous pointer because a singly linked list cannot look backwards. Handle the one-node list, where removing the middle empties the list entirely.",
        },
        {
          title: "Remove the nth node from the end",
          prompt:
            "Remove the nth node counting from the tail, in one pass, using two pointers a fixed gap apart.",
          approach:
            "Advance a lead pointer n steps ahead, then move a trailing pointer and the lead together until the lead reaches the end.\n\nThe trailing pointer is now n from the end, which is the node to remove, so keep one more pointer just behind it to unlink. Removing the head itself is the edge case, and a dummy node placed before the head removes that special case entirely. Validate n against the length.",
        },
        {
          title: "Remove duplicate nodes from an unsorted list",
          prompt: "1 -> 2 -> 1 -> 3 -> 2 becomes 1 -> 2 -> 3, keeping the first of each value.",
          approach:
            "Keep a set of values already seen. Walk with a previous pointer, and whenever the current value is already in the set, unlink it, otherwise add it to the set.\n\nThat is O(n) time and O(n) space. Without extra space you would compare each node against everything before it, which is O(n²), and mentioning that trade is what the question wants.",
        },
        {
          title: "Remove duplicates from a sorted list",
          prompt: "1 -> 1 -> 2 -> 3 -> 3 becomes 1 -> 2 -> 3. Explain why this needs no extra memory.",
          approach:
            "Because the list is sorted, duplicates are always adjacent. Walk once and whenever the next node holds the same value, skip over it.\n\nSo you get O(n) time with O(1) space, no set required. Keep skipping in a loop rather than once, since three or more copies can sit in a row.",
        },
        {
          title: "Remove every node holding a given value",
          prompt: "Remove all nodes matching a value, not just the first one.",
          approach:
            "Walk with a previous pointer and unlink every match, continuing rather than returning after the first.\n\nThe painful part is a run of matches at the head, which means the head may move several times. Using a dummy node before the head lets you treat the head like any other node and removes the special casing.",
        },
        {
          title: "Remove the last node holding a given value",
          prompt: "Remove only the final occurrence of a value in the list.",
          approach:
            "A singly linked list cannot walk backwards, so make one pass remembering the node before the most recent match, then unlink using that remembered pointer after the pass finishes.\n\nRemembering the previous node rather than the matching node is what makes the removal possible. One pass, O(n), no need to reverse the list.",
        },
        {
          title: "Remove the nodes with odd values",
          prompt: "1 -> 2 -> 3 -> 4 -> 5 becomes 2 -> 4.",
          approach:
            "The same filtered removal as removing a value, with the test changed from equality to an oddness check.\n\nA dummy node before the head keeps the leading-odd case from needing its own branch. Notice that once you have written one filtered removal, all of these become the same function with a different predicate.",
        },
        {
          title: "Find the kth largest value in a linked list",
          prompt: "Return the kth largest value. Say what you do about duplicates.",
          approach:
            "Without random access you cannot binary search, so either collect the values and sort them, which is O(n log n), or keep a small collection of the k largest as you walk, which is O(n log k) and needs only O(k) space.\n\nDecide whether duplicates count as separate places, since in 5 -> 5 -> 3 the second largest is either 5 or 3 depending on the rule. State the rule before coding.",
        },
        {
          title: "Detect a cycle in a linked list",
          prompt:
            "Return true when the list loops back on itself. Floyd's tortoise and hare, in O(1) space.",
          approach:
            "Move a slow pointer one step and a fast pointer two steps. If there is a loop the fast pointer eventually laps the slow one and they meet. If the fast pointer reaches null, there is no loop.\n\nThey must meet because inside a loop the gap between them closes by exactly one node each step. Storing visited nodes in a set also works and is easier to explain, but it costs O(n) space where this costs none.",
        },
        {
          title: "Check whether a linked list is a palindrome",
          prompt: "1 -> 2 -> 2 -> 1 returns true. Try to do it without copying the list into an array.",
          approach:
            "Find the middle with slow and fast pointers, reverse the second half in place, then walk the two halves in step comparing values.\n\nThat is O(n) time and O(1) space. Copying the values into an array and using two pointers is far simpler and worth offering first, at the cost of O(n) space. If you reversed in place, restoring the list afterwards is a courtesy worth mentioning.",
        },
        {
          title: "Merge two sorted linked lists",
          prompt: "Combine two sorted lists into one sorted list by re-pointing nodes, not creating new ones.",
          approach:
            "Walk both lists at once, always attaching the smaller head to the growing result and advancing only that list.\n\nWhen one list empties, attach the whole remaining tail of the other in one move rather than node by node. A dummy start node saves you from special-casing the very first attachment. O(n + m) time, O(1) extra space.",
        },
        {
          title: "Sort the nodes of a linked list",
          prompt: "Sort a linked list. Explain which sorting algorithm suits a linked list and why.",
          approach:
            "Merge sort is the right answer. Split the list in half using slow and fast pointers, sort each half recursively, and merge them with the routine from the previous question.\n\nIt suits linked lists because merging only re-points nodes and needs no extra array, unlike merge sort on arrays. Quick sort suffers here because it depends on random access to partition efficiently. O(n log n) time.",
        },
        {
          title: "Swap the first and last nodes",
          prompt:
            "Exchange the head and the tail by moving the nodes themselves, not just their values.",
          approach:
            "Walk to find the last node and the node just before it. Then re-point four links: the new head's next, the second-to-last node's next, and the head references.\n\nSwapping the stored values is a one-liner and interviewers usually forbid it precisely because re-pointing is where the mistakes live. Handle lists of length 1 and 2, where the nodes are adjacent or identical and the general logic breaks.",
        },
        {
          title: "Delete a node when you only have a pointer to that node",
          prompt:
            "Given 1 -> 2 -> 3 -> 4 -> 5 and a pointer to the node holding 3, delete it. You cannot reach the head. Watch the last node case.",
          approach:
            "You cannot unlink the node itself because you cannot reach its predecessor. Instead copy the next node's value into the current node, then unlink the next node.\n\nYou effectively delete the value rather than the node. The case that breaks it is being handed the last node, which has no next to copy from, and there is genuinely no solution for that with the information given. Saying so is part of the right answer.",
        },
        {
          title: "Print the list forwards and then backwards",
          prompt:
            "Print head to tail, then tail to head, without converting the list to an array.",
          approach:
            "Forwards is the plain traversal. Backwards is recursion: recurse to the end first and print on the way back up, letting the call stack hold the order for you.\n\nAlternatively push values onto a stack while walking forwards and pop them, which is the same idea with an explicit structure. Note the recursion depth equals the list length, so a very long list can overflow.",
        },
        {
          title: "Add the numbers held by two linked lists and return the sum as a list",
          difficulty: "hard",
          prompt:
            "Each node holds a single digit. Add the two numbers and return the result as a linked list of digits. Reverse where you need to and carry over.",
          approach:
            "Walk both lists together adding digit by digit and keeping a carry, exactly like addition on paper.\n\nEach step produces the sum of two digits plus the carry, and you write the remainder on division by 10 while carrying the tens. Keep going while either list has nodes left or a carry remains, since a final carry adds a node. Digits stored most-significant first need reversing before you start, so confirm the order first.",
        },
        {
          title: "Represent a polynomial with a linked list and add two of them",
          difficulty: "hard",
          prompt:
            "Each node holds a coefficient and an exponent. Add two polynomials so terms of the same exponent combine.",
          approach:
            "Keep both lists sorted by descending exponent, then walk them like the merge of two sorted lists.\n\nWhen the exponents match, add the coefficients into one node and advance both. When they differ, take the higher exponent and advance only that list. Drop any term whose coefficient sums to zero, which is the detail most people miss.",
        },
      ],
    },

    {
      title: "Doubly Linked List",
      difficulty: "medium",
      questions: [
        {
          title: "Implement a doubly linked list",
          prompt:
            "Each node holds a value, a next pointer and a prev pointer. Keep a head and a tail on the list itself.",
          approach:
            "Node gains a prev reference alongside next, and the list keeps both head and tail.\n\nEvery operation now has to maintain two links instead of one, which is the cost you pay. What you buy is backwards traversal and O(1) removal when you already hold the node, both impossible in a singly linked list. Keeping a size counter is still worth it.",
        },
        {
          title: "Insert at the beginning",
          prompt: "Add a node at the head and wire both directions correctly.",
          approach:
            "Point the new node's next at the current head and the current head's prev back at the new node, then move the head.\n\nWhen the list was empty the new node is both head and tail, so set both. Forgetting the backwards link is the standard doubly linked list bug and it only shows up when you later traverse in reverse.",
        },
        {
          title: "Insert at the end",
          prompt: "Add a node at the tail using the tail reference so it stays O(1).",
          approach:
            "Point the new node's prev at the current tail and the current tail's next at the new node, then move the tail.\n\nWith a tail reference this is O(1), which is the direct answer to why appending was awkward in a singly linked list. Handle the empty list by setting head and tail together.",
        },
        {
          title: "Insert at a given position",
          prompt: "Insert at an index, wiring four pointers correctly.",
          approach:
            "Walk to the node currently at that position, then rewire four links: the new node's prev and next, the previous node's next, and the following node's prev.\n\nDo the writes in an order that does not lose a reference before you have used it. Position 0 and the end reduce to the two previous questions, so delegate to them rather than duplicating the logic. You can also walk from the tail when the index is past the middle, which halves the average walk.",
        },
        {
          title: "Delete a node by value, fixing both links",
          prompt:
            "Remove the first node holding a value. The prev pointer is what makes this different from the singly linked version.",
          approach:
            "Find the node, then point its previous node's next at its next, and its next node's prev back at its previous.\n\nYou no longer need to carry a trailing pointer while walking, because each node already knows its predecessor. That is the concrete gain. Handle removing the head or the tail, where one side is null and must update the list's own references instead.",
        },
        {
          title: "Delete a node by position, fixing both links",
          prompt: "Remove the node at an index and keep both directions consistent.",
          approach:
            "Walk to the index, then unlink using the same two-sided rewire.\n\nValidate the index up front. Both ends are the special cases, since removing the head or the tail means updating the list's head or tail reference rather than a neighbour's pointer.",
        },
        {
          title: "Delete the front and the back node",
          prompt: "Remove from both ends and explain why each is O(1) here.",
          approach:
            "Move the head to head.next and null the new head's prev; move the tail to tail.prev and null the new tail's next.\n\nBoth are O(1) because the tail reference plus the prev pointer means you never walk. Removing the tail from a singly linked list was O(n), and this is the direct fix. Handle emptying the list, where head and tail must both become null.",
        },
        {
          title: "Traverse forward",
          prompt: "Print every value from head to tail.",
          approach:
            "Identical to the singly linked traversal: start at the head, follow next until null.\n\nUseful as a sanity check after any insert or delete, since a broken next chain shows up here immediately.",
        },
        {
          title: "Traverse backward",
          prompt:
            "Print every value from tail to head, and explain why this needs no recursion here.",
          approach:
            "Start at the tail and follow prev until null.\n\nThis is the payoff of the doubly linked list: the singly linked version needed recursion or a stack to print in reverse, and here it is a plain loop. It is also the best test that your prev pointers were maintained correctly by every earlier operation.",
        },
        {
          title: "Reverse a doubly linked list",
          prompt: "Reverse the list by swapping the direction of the links, not by copying values.",
          approach:
            "Walk the list and for each node swap its next and prev pointers, then move on using what is now prev.\n\nWhen you reach the end, swap the list's head and tail references. Forgetting that final swap leaves head pointing at what is now the tail, and the list appears empty when traversed. O(n) time, O(1) space.",
        },
        {
          title: "Find the middle element",
          prompt: "Return the middle node. You can approach it from either end here.",
          approach:
            "Slow and fast pointers work exactly as in the singly linked list.\n\nA doubly linked list also allows walking inward from both ends at once until the pointers meet, which is the same number of steps but reads nicely and shows you understand what the prev pointer enables.",
        },
        {
          title: "Remove the middle element",
          prompt: "Delete the middle node and keep both link directions correct.",
          approach:
            "Find the middle with slow and fast pointers, then unlink it with the two-sided rewire.\n\nYou do not need a trailing pointer here because the node knows its own predecessor, unlike the singly linked version. Handle a one-node list, which empties completely.",
        },
        {
          title: "Convert a singly linked list into a doubly linked list",
          prompt: "Walk a singly linked list and add the backwards links so it becomes doubly linked.",
          approach:
            "Walk once carrying the previous node, and set each node's prev to it as you pass.\n\nSet the tail reference when you reach the end, and the head's prev to null. One pass, O(n), and it makes concrete that the only difference between the two structures is one extra pointer per node.",
        },
      ],
    },

    {
      title: "Circular Linked List",
      difficulty: "medium",
      questions: [
        {
          title: "Implement a circular linked list",
          prompt:
            "Build a list where the last node points back to the head. Explain how traversal has to change.",
          approach:
            "Same node shape, but the tail's next points at the head instead of null.\n\nEvery traversal must therefore stop on returning to the head rather than on hitting null, or it loops forever. Use a do-while style walk so you visit the head once before the stop condition is tested. Keeping a tail reference is especially useful here, since from the tail you reach the head in one step.",
        },
        {
          title: "Convert a singly linked list into a circular one",
          prompt: "Take a normal list and close the loop.",
          approach:
            "Walk to the last node and point its next at the head instead of null.\n\nGuard the empty list, which has nothing to close. If you already keep a tail reference this is a single assignment. After doing it, any traversal written for the null-terminated list will now hang, which is a useful thing to see once.",
        },
        {
          title: "Validate that a list is actually circular",
          prompt: "Return true when following next eventually returns to the start.",
          approach:
            "Use the slow and fast pointer cycle detection. If the pointers meet there is a loop, and if the fast pointer hits null there is not.\n\nTo be strict about circular rather than merely looped, also confirm the meeting point leads back to the head, since a list can loop into its middle without being properly circular. That distinction is what the question is testing.",
        },
        {
          title: "Convert a doubly linked list into a circular doubly linked list",
          prompt: "Close the loop in both directions.",
          approach:
            "Point the tail's next at the head and the head's prev at the tail.\n\nBoth links are needed, otherwise walking backwards from the head still stops at null and the structure is only half circular. Verify by traversing a full lap in each direction and confirming you land back where you started.",
        },
      ],
    },
  ],
};
