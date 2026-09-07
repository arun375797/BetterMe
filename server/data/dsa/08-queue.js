export default {
  title: "Queue",
  level: "medium",
  subtopics: [
    {
      title: "Queue Implementation",
      difficulty: "easy",
      questions: [
        {
          title: "Implement a queue using an array with enqueue, dequeue, peek and display",
          prompt:
            "Build a first-in first-out structure. Point out which of your operations is not actually O(1) and why.",
          approach:
            "Add at the back and remove from the front. Adding at the back is O(1), but removing from the front shifts every remaining element left, so the naive version is O(n) per dequeue.\n\nThe fix without changing structure is to keep a front index that moves forward instead of physically removing, and only compact the array once the wasted space grows large. Spotting that hidden O(n) is the real content of this question.",
        },
        {
          title: "Implement a queue using a linked list",
          prompt:
            "Back the queue with nodes. Explain what the linked list buys you over the array version.",
          approach:
            "Keep a head for the front and a tail for the back. Enqueue appends at the tail, dequeue removes the head, and both are genuinely O(1).\n\nThat is the gain: no shifting and no resizing, which is exactly the weakness of the array-backed queue. You pay a pointer per element and lose the cache friendliness of contiguous memory. Remember to clear the tail when the queue empties, or it dangles at a removed node.",
        },
        {
          title: "Implement a queue using two stacks",
          prompt:
            "Build first-in first-out behaviour from two last-in first-out stacks. Explain why the cost is still amortised O(1).",
          approach:
            "Keep an inbox and an outbox stack. Enqueue pushes onto the inbox. Dequeue pops from the outbox, and when the outbox is empty, tips the entire inbox into it first, which reverses the order.\n\nA single dequeue can cost O(n) when a tip happens, but each element is moved across exactly once in its lifetime, so the average over a run of operations is O(1). That amortised argument is the whole point. Only tip when the outbox is empty, or you scramble the order.",
        },
        {
          title: "Append a value to the front of a list without built-in methods",
          prompt:
            "Insert at index 0 by hand, with no unshift or splice. This is the piece you need before writing a deque.",
          approach:
            "Walk from the end backwards, copying each element one slot right, then write the new value at index 0.\n\nBackwards is essential, since going forwards would overwrite values before copying them. This is O(n) and it is precisely why an array is a poor deque: one end is cheap and the other is not. A doubly linked list or a circular buffer fixes it.",
        },
      ],
    },

    {
      title: "Queue Interview Problems",
      difficulty: "medium",
      questions: [
        {
          title: "Reverse a queue",
          prompt: "Reverse the order of a queue's contents.",
          approach:
            "Dequeue everything onto a stack, then enqueue it back. The stack's last-in first-out behaviour performs the reversal.\n\nRecursion works too and uses the call stack for the same purpose: dequeue the front, recurse, then enqueue the held value on the way back. O(n) either way.",
        },
        {
          title: "Reverse a queue built on a linked list",
          prompt: "Reverse a linked-list-backed queue by re-pointing nodes rather than moving values.",
          approach:
            "Run the standard three-pointer list reversal over the nodes, then swap the head and tail references so the queue's ends stay correct.\n\nForgetting to swap head and tail is what leaves the queue looking empty or dequeuing from the wrong end. This is O(n) time and O(1) space, better than the stack version's O(n) space.",
        },
        {
          title: "Implement a circular queue",
          prompt:
            "Build a queue on a fixed array where the indexes wrap around. Explain what problem the wrapping solves.",
          approach:
            "Keep front and rear indexes and wrap each one with a remainder against the array length when it passes the end.\n\nIt solves the wasted space of a plain array queue, where a moving front index leaves dead cells at the start that can never be reused. Wrapping reclaims them. The awkward part is that front equal to rear is ambiguous between full and empty, so either keep a count or deliberately leave one slot unused.",
        },
        {
          title: "Implement a circular queue with a fixed maximum size",
          prompt:
            "Add a capacity so enqueue refuses when full. Define what full means given your index scheme.",
          approach:
            "Maintain a count of stored items alongside the indexes, and reject enqueue when it reaches capacity and dequeue when it is zero.\n\nThe count is the cleanest way to disambiguate full from empty, since front and rear alone cannot tell them apart. Decide what a full enqueue does: return false, throw an overflow error, or overwrite the oldest item as a ring buffer would. Say which behaviour you picked.",
        },
        {
          title: "Implement a circular queue on a linked list",
          prompt: "Build the same wrap-around behaviour with nodes instead of an array.",
          approach:
            "Point the tail's next back at the head, so the nodes themselves form the ring, and keep a single reference to the tail.\n\nFrom the tail you reach the head in one step, so both enqueue and dequeue are O(1) from that one pointer. Unlike the array version there is no capacity limit unless you impose one, which changes what full means. Every traversal must stop on returning to the start rather than on null.",
        },
        {
          title: "Implement a double ended queue",
          prompt:
            "Support adding and removing at both ends. Choose a backing structure and defend it.",
          approach:
            "A doubly linked list gives all four operations in O(1), because each end knows its neighbour and nothing shifts.\n\nAn array gives O(1) at the back but O(n) at the front, unless you use a circular buffer with front and rear indexes, which restores O(1) at both ends at the cost of a fixed capacity. Naming that trade is the substance of the answer.",
        },
        {
          title: "Insert at both ends of a deque",
          prompt: "Implement addFront and addRear, and confirm both stay O(1).",
          approach:
            "With a doubly linked list, addFront wires the new node before the head and addRear wires it after the tail, updating the corresponding reference.\n\nBoth touch a constant number of pointers. The empty-deque case sets head and tail to the same node and is the branch worth writing first, since both methods share it.",
        },
        {
          title: "Delete from both ends of a deque",
          prompt: "Implement removeFront and removeRear, handling the deque becoming empty.",
          approach:
            "removeFront moves the head to its next and clears the new head's prev; removeRear moves the tail to its prev and clears the new tail's next.\n\nRemoving the last remaining element must set both head and tail to null, and skipping that leaves a dangling reference to a removed node that later operations trip over.",
        },
        {
          title: "Add a flag to a queue so it can dequeue from either end",
          prompt:
            "One flag decides whether dequeue takes from the front or the back. Handle the empty and single-element cases.",
          approach:
            "Let dequeue read the flag and pick the end. On a doubly linked list both ends are already O(1), so the flag costs nothing.\n\nOn an array one end will be O(n) unless you use a circular buffer. The single-element case matters because both ends refer to the same node, so both references must be cleared. Note that with the flag the structure is no longer a queue and its ordering guarantee is gone.",
        },
        {
          title: "Implement a priority queue",
          prompt:
            "Items come out by priority rather than arrival order. Compare a sorted-list implementation against a heap.",
          approach:
            "The simple version keeps the items sorted by priority, making insertion O(n) and removal O(1).\n\nA binary heap makes both O(log n), which wins as soon as insertions are frequent. Also decide the tie rule: a plain heap does not preserve arrival order among equal priorities, so if you need that, store an incrementing sequence number and break ties on it.",
        },
        {
          title: "Queue a list of tasks and serve them by priority number",
          prompt:
            "Given tasks each carrying a priority, serve the most important first. Two tasks of equal priority should come out in the order they arrived.",
          approach:
            "Use a priority queue keyed on the priority number, and store an arrival counter with each task.\n\nCompare on priority first and fall back to the arrival counter on a tie, which turns an unstable heap into a stable one. Fix and state whether a lower number means more urgent, because that ambiguity causes more bugs here than the data structure does.",
        },
        {
          title: "Implement a monotonic queue",
          difficulty: "hard",
          prompt:
            "Build a deque whose contents always stay in decreasing order, then use it to report the maximum of every sliding window of size k.",
          approach:
            "Keep a deque of indexes. Before adding a new index, pop from the back while the value there is smaller than the incoming value, since those can never be the maximum again while the newcomer is present.\n\nAlso pop from the front once its index falls outside the current window. The front then always holds the index of the window's maximum, so each window is answered in O(1) and the whole scan is O(n). Storing indexes rather than values is what lets you expire items by position.",
        },
      ],
    },
  ],
};
