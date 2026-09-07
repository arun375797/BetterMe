export default {
  title: "Trees & BST",
  level: "hard",
  subtopics: [
    {
      title: "Binary Tree Implementation",
      difficulty: "medium",
      questions: [
        {
          title: "Implement a binary tree, not a BST",
          prompt:
            "Insert nodes level by level so the tree fills left to right. Explain why insertion here is nothing like BST insertion.",
          approach:
            "A node holds a value plus left and right references. To insert in level order, walk the tree breadth first with a queue and drop the new node into the first missing child slot you find.\n\nThere is no ordering rule to follow, so you cannot decide direction by comparing values the way a BST does. That is the whole distinction: a plain binary tree constrains shape at most, while a BST constrains value placement. It also means searching one is O(n), since no comparison lets you skip a subtree.",
        },
        {
          title: "Implement a general tree where a node can have many children",
          prompt:
            "Each node holds a list of children rather than exactly two. Add a node under a named parent and print the structure.",
          approach:
            "Replace the left and right references with an array of children, and give the node an add-child method.\n\nTraversal changes from two recursive calls to a loop over the children array, which is the only real difference. This models file systems, menus and category trees, so it is worth writing once even though interviews lean on binary trees.",
        },
        {
          title: "Print the tree structure",
          prompt:
            "Render the tree so the shape is visible, with indentation or level by level, rather than as a flat list.",
          approach:
            "Recurse carrying the current depth and print each value indented by that depth, which gives a readable sideways tree.\n\nA level-order print using a queue, processing one full level per iteration, gives the more familiar top-down shape. Being able to see the tree is worth the effort, because almost every tree bug is really a shape bug and a flat list hides it.",
        },
      ],
    },

    {
      title: "Traversals",
      difficulty: "medium",
      questions: [
        {
          title: "Preorder traversal",
          prompt: "Visit the node, then the left subtree, then the right. Say what preorder is good for.",
          approach:
            "Process the current node first, then recurse left, then recurse right.\n\nBecause the parent is always emitted before its children, preorder is what you use to copy or serialise a tree: replaying the output rebuilds the same shape. Remember it by where the visit sits relative to the two recursive calls, which is the only thing separating the three traversals.",
        },
        {
          title: "Inorder traversal",
          prompt:
            "Visit the left subtree, then the node, then the right. Say what inorder gives you on a BST specifically.",
          approach:
            "Recurse left, process the node, recurse right.\n\nOn a BST this emits the values in sorted ascending order, which is the single most useful fact about BSTs. It is what makes kth smallest, validation and closest-value problems straightforward, so it is worth knowing cold.",
        },
        {
          title: "Postorder traversal",
          prompt: "Visit both subtrees before the node. Say what postorder is good for.",
          approach:
            "Recurse left, recurse right, then process the node.\n\nSince children are always finished before the parent, postorder is what you use to delete a tree or to compute a value that depends on both subtrees, such as height. Any bottom-up computation is naturally postorder.",
        },
        {
          title: "Level order traversal",
          prompt:
            "Visit the tree row by row from the top. Return the values grouped per level rather than as one flat list.",
          approach:
            "Use a queue. Push the root, then repeatedly take a node, record it, and push its children.\n\nTo group by level, record the queue's size at the start of each round and process exactly that many nodes, which is one complete level. That size snapshot is the trick, and without it you get a flat list with no level boundaries. This is breadth-first search on a tree.",
        },
        {
          title: "Write one traversal iteratively instead of recursively",
          prompt:
            "Pick preorder or inorder and write it with your own stack. Explain what the stack is replacing.",
          approach:
            "For preorder: push the root, then repeatedly pop a node, record it, and push its right child before its left so the left comes off first.\n\nInorder is harder: walk left pushing nodes as you go, then pop, record, and move to the right child. The stack is doing exactly what the call stack did for you in the recursive version, which is the insight. The payoff is not overflowing on a deep tree.",
        },
        {
          title: "Print all the leaf nodes",
          prompt: "Print only the nodes with no children.",
          approach:
            "Traverse in any order and print a node only when both its left and right are null.\n\nThe condition must be both children absent, not one, since a node with a single child is internal rather than a leaf. Any traversal works because you are filtering rather than relying on order.",
        },
        {
          title: "Print the sum of the left leaf nodes",
          prompt:
            "Total only the leaves that are the left child of their parent. A left child with children of its own does not count.",
          approach:
            "Recurse carrying a flag saying whether the current node arrived as a left child. Add the value only when the node is a leaf and that flag is true.\n\nThe flag is necessary because a node cannot see which side of its parent it hangs from. Alternatively check from the parent: when the left child exists and is a leaf, add it. Both are fine as long as the two conditions, left and leaf, are both enforced.",
        },
      ],
    },

    {
      title: "Binary Tree Problems",
      difficulty: "hard",
      questions: [
        {
          title: "Find the height of a tree",
          prompt:
            "Return the height of the tree and state clearly whether you count nodes or edges.",
          approach:
            "The height of a node is one more than the taller of its two subtrees, and an empty subtree has height 0 counting nodes, or -1 counting edges.\n\nThis is postorder: you cannot know a node's height until both children report theirs. Say which convention you used, because a single-node tree has height 1 by the node count and 0 by the edge count, and that off-by-one is the most common source of disagreement.",
        },
        {
          title: "Find the depth of a given node",
          prompt:
            "Return how far a node with a given value sits from the root. Explain how depth differs from height.",
          approach:
            "Search from the root carrying a running depth, adding one at each step, and return it when you find the value.\n\nDepth is measured downward from the root while height is measured upward from the leaves, so a node has one of each and they are usually different. In a plain binary tree you must search both subtrees since there is no ordering to guide you.",
        },
        {
          title: "Find the degree of a given node",
          prompt: "Return how many children a node has, and note the range of possible answers.",
          approach:
            "Find the node, then count its non-null children.\n\nIn a binary tree the answer is only ever 0, 1 or 2, where 0 means a leaf. In a general tree it is the length of the children array. Do not confuse the degree of a node with the degree of the tree, which is the largest degree found anywhere in it.",
        },
        {
          title: "Check whether a tree is balanced",
          prompt:
            "Balanced means the two subtree heights differ by at most one at every node, not just at the root. Aim for a single pass.",
          approach:
            "The naive version computes the height at every node, which recomputes the same subtrees and costs O(n²).\n\nBetter: have the recursion return the height and a balanced flag together, or return a sentinel such as -1 to signal unbalanced and propagate it straight up. That checks and measures in one postorder pass, O(n). The condition must hold at every node, and testing only the root is the classic wrong answer.",
        },
        {
          title: "Check whether two trees are identical",
          prompt: "Same structure and same values in the same positions.",
          approach:
            "Compare the two roots. Both null means identical, one null means not, differing values mean not. Otherwise recurse on the left pairs and the right pairs and require both to agree.\n\nWalking both trees in lockstep is what matters; comparing their traversal outputs is not sufficient, since different shapes can produce the same inorder sequence.",
        },
        {
          title: "Check whether one tree is a subtree of another",
          prompt: "Decide whether the smaller tree appears as a complete subtree of the larger one.",
          approach:
            "Walk the big tree, and at every node whose value matches the small tree's root, run the identical-trees check.\n\nIt must be an exact match from that node all the way down, not merely a partial overlap, which is what people get wrong. Cost is O(n × m) in the worst case.",
        },
        {
          title: "Find the lowest common ancestor of two nodes",
          prompt:
            "Return the deepest node that has both target nodes below it. Solve it for a plain binary tree first, then say how a BST makes it easier.",
          approach:
            "In a plain binary tree, recurse and ask each subtree whether it contains either target. If the left and right both report a find, the current node is the ancestor. If only one side reports, pass that result up.\n\nIn a BST you can do far better by using the ordering: from the root, go left when both targets are smaller, right when both are larger, and the first node where they split is the answer, in O(height). Giving both answers is the strong response.",
        },
        {
          title: "Mirror a binary tree",
          prompt: "Flip the tree horizontally so every left and right pair is swapped.",
          approach:
            "Recurse to the bottom and swap each node's left and right children.\n\nIt works whether you swap before or after recursing, as long as you recurse into both original subtrees. Note that mirroring a BST destroys the BST property, so if the caller still needs ordered lookups, return a mirrored copy rather than mutating.",
        },
        {
          title: "Remove the duplicate values from a binary tree",
          prompt:
            "Delete nodes holding a value that has already appeared. Say what happens to a removed node's children.",
          approach:
            "Traverse carrying a set of values already seen. When a node's value is already present, it has to go.\n\nThe hard part is not detection but removal: deleting an internal node orphans its children, so decide the policy up front, whether that is promoting a child, dropping the whole subtree, or only removing duplicate leaves. Stating the policy is most of the answer.",
        },
        {
          title: "Check whether a tree is full, and return its depth if it is",
          prompt:
            "Full means every node has either 0 or 2 children, never exactly 1. Return the depth when it is full and false otherwise.",
          approach:
            "Recurse postorder. A leaf is full with depth 1. A node with exactly one child is immediately not full. A node with two children is full only when both subtrees are, and its depth is one more than the deeper of them.\n\nReturning two different kinds of value, a depth or false, means picking a clear sentinel such as -1 and converting at the top. Do not confuse full with complete or perfect, which are different conditions.",
        },
        {
          title: "Find the maximum number of nodes a tree of height h can hold",
          prompt:
            "Write a function returning the largest possible node count for a given height, and verify it by building such a tree.",
          approach:
            "Each level doubles the previous one, so level i holds at most 2 to the power i, and the total for height h is 2 to the power h, minus 1, counting the root as level 0.\n\nRather than only quoting the formula, build a perfect tree of that height and count the nodes to confirm. The same doubling is why a balanced tree's height is logarithmic in its node count, which underpins every O(log n) claim about BSTs.",
        },
      ],
    },

    {
      title: "BST Implementation",
      difficulty: "medium",
      questions: [
        {
          title: "Implement a BST with insert, contains and delete",
          prompt:
            "Build the full structure where every left value is smaller and every right value is larger. State the cost of each operation and what makes it degrade.",
          approach:
            "Every operation walks down from the root comparing values and choosing a side, so all three are O(height).\n\nOn a balanced tree the height is log n, which is the whole appeal. Insert values in sorted order, though, and the tree becomes a straight line of height n, making every operation O(n) and no better than a linked list. That degeneration is the reason self-balancing trees exist, and naming it is expected.",
        },
        {
          title: "Insert a value",
          prompt: "Add a value in its correct position. Decide what happens when the value already exists.",
          approach:
            "Walk from the root going left when the new value is smaller and right when larger, until you reach an empty slot, and put the node there.\n\nDecide your duplicate rule before coding: reject, always send right, or keep a count on the node. Any is defensible but it must be consistent, because searching depends on it. An empty tree makes the new node the root.",
        },
        {
          title: "Search for a value",
          prompt: "Return whether a value is present, and explain why this is faster than in a plain binary tree.",
          approach:
            "Compare at each node and move left or right accordingly, stopping when you match or run into null.\n\nEach comparison throws away an entire subtree, which is what makes it O(height) rather than the O(n) of a plain binary tree, where you must check everywhere because no ordering guides you. That discarding is the whole value of the BST property.",
        },
        {
          title: "Delete a leaf node",
          prompt: "Remove a node with no children, the simplest of the three deletion cases.",
          approach:
            "Find the node and set the parent's pointer to that side to null.\n\nYou need the parent, so either carry it while descending or use a recursive delete that returns the new subtree for the parent to reassign. Removing the root when it is also the only node empties the tree.",
        },
        {
          title: "Delete a node with one child",
          prompt: "Remove a node that has exactly one child and keep the tree valid.",
          approach:
            "Promote the single child into the removed node's place by pointing the parent at it.\n\nThe BST property survives because the whole subtree already sits on the correct side of the parent, so lifting it one level changes nothing about the ordering. Handle the removed node being the root by making the child the new root.",
        },
        {
          title: "Delete a node with two children",
          difficulty: "hard",
          prompt:
            "Remove a node with both children present. This is the case interviewers push on, so work out the successor carefully.",
          approach:
            "You cannot promote either child directly, because each would displace the other. Instead find the inorder successor, which is the smallest value in the right subtree, copy its value into the node being deleted, then delete that successor from the right subtree.\n\nThe successor is guaranteed to have at most one child, so that second deletion falls into an easier case. The inorder predecessor, the largest value on the left, works equally well. It is the successor's value that moves, not the node.",
        },
        {
          title: "Find the minimum value",
          prompt: "Return the smallest value and say how many comparisons it takes.",
          approach:
            "Walk left from the root until there is no left child. That node holds the minimum.\n\nNo comparisons of values are needed at all, only null checks, because the structure already encodes the answer. It costs O(height) steps. Guard the empty tree.",
        },
        {
          title: "Find the minimum value using recursion",
          prompt: "The same result written recursively.",
          approach:
            "If there is no left child, the current node is the minimum. Otherwise return the minimum of the left subtree.\n\nThis is the helper that two-child deletion calls on the right subtree, so it is worth having as its own function rather than inlined. The base case is the absence of a left child, not a null node.",
        },
        {
          title: "Find the maximum value",
          prompt: "Return the largest value in the tree.",
          approach:
            "Walk right from the root until there is no right child.\n\nThe exact mirror of the minimum, and the pair together is a neat demonstration that in a BST the extremes are structural facts rather than something you search for.",
        },
        {
          title: "Validate that a tree is a BST",
          prompt:
            "Confirm the ordering holds everywhere. Checking only that each node beats its immediate children is not enough, so show why.",
          approach:
            "Recurse carrying a permitted range. The root may be anything; moving left tightens the upper bound to the parent's value, moving right raises the lower bound. A node outside its range fails.\n\nThe local check fails because a node deep in the left subtree can be larger than the root while still being larger than its own parent, and only an inherited bound catches it. The alternative is an inorder traversal checking the values come out strictly increasing, which is equally valid and easier to explain.",
        },
        {
          title: "Find the value closest to a target",
          prompt:
            "Return the value in the tree nearest to a given number, which need not be present.",
          approach:
            "Walk down from the root as if searching. At each node compare the absolute difference against the best seen so far and update it, then move left or right by comparing against the target.\n\nYou can stop at null rather than exploring the whole tree, because the ordering guarantees the closest value lies along the search path. That makes it O(height) instead of O(n).",
        },
        {
          title: "Allow duplicate values in a BST and keep it valid",
          prompt:
            "Pick a strategy for duplicates and show that search, insert and delete still behave.",
          approach:
            "Three workable strategies: always send duplicates right, always send them left, or store a count on the node instead of a second node.\n\nThe count is usually best, since it keeps the tree smaller and makes deletion a decrement rather than a restructure. Whichever you choose, search and delete must follow the same rule, and inconsistency between insert and search is where this breaks.",
        },
        {
          title: "Convert a binary tree into a BST",
          prompt:
            "Rearrange the values of an arbitrary binary tree so it becomes a BST while keeping the original shape.",
          approach:
            "Collect the values with an inorder traversal, sort them, then walk the tree inorder a second time writing the sorted values back into the nodes.\n\nIt works because inorder on a BST must produce ascending values, so filling the existing shape in inorder with sorted data forces the property. Only the values move, so the shape is untouched. O(n log n) from the sort.",
        },
        {
          title: "Convert a sorted array into a balanced BST",
          prompt:
            "Build a BST of minimum height from an already sorted array, and say why the middle element becomes the root.",
          approach:
            "Take the middle element as the root, then recursively build the left subtree from the left half and the right subtree from the right half.\n\nThe middle is chosen because it splits the remaining values evenly, giving both subtrees the same size and therefore the smallest possible height. Inserting the array in order instead would produce a straight line. O(n), and it is the direct fix for the degeneration mentioned in the BST implementation question.",
        },
      ],
    },

    {
      title: "BST Interview Problems",
      difficulty: "hard",
      questions: [
        {
          title: "Find the second largest value",
          prompt: "Return the second largest value without collecting the whole tree.",
          approach:
            "The largest is the rightmost node. The second largest is either its parent, when the rightmost has no left child, or the largest value in the rightmost node's left subtree.\n\nThose two cases are the entire problem and missing the second is the usual error. It runs in O(height), far better than an inorder traversal of everything.",
        },
        {
          title: "Find the third largest value",
          prompt: "Return the third largest value.",
          approach:
            "Do a reverse inorder traversal, visiting right, then node, then left, which emits values in descending order, and stop at the third.\n\nGeneralising to reverse inorder is much cleaner than extending the case analysis from the second-largest question, which gets messy fast. Stopping early keeps it cheap.",
        },
        {
          title: "Find the kth largest value",
          prompt: "Return the kth largest for any k, and stop as soon as you have it.",
          approach:
            "Reverse inorder with a counter, returning the moment the counter reaches k.\n\nStopping early matters: without it you traverse the whole tree even for k of 1. If the tree is queried often, storing a subtree size on each node lets you navigate straight to the kth in O(height), which is worth mentioning.",
        },
        {
          title: "Find the kth smallest value using inorder",
          prompt:
            "Return the kth smallest value. Use the ordering property rather than sorting anything.",
          approach:
            "Plain inorder emits ascending values, so count as you go and return the kth.\n\nThat the values already arrive sorted is the entire trick, and it is why this is the canonical BST interview question. Return early rather than building the full list, giving O(k + height) instead of O(n).",
        },
        {
          title: "Find the third smallest value",
          prompt: "Return the third smallest value.",
          approach:
            "The kth smallest with k fixed at 3: inorder with a counter, returning on the third visit.\n\nWorth writing once to confirm your inorder counter is correct before trusting it for a general k. Handle a tree with fewer than three nodes.",
        },
        {
          title: "Count the nodes that have only one child",
          prompt: "Count nodes with exactly one child, neither leaves nor full nodes.",
          approach:
            "Traverse in any order and count nodes where exactly one of the two children is null.\n\nAn exclusive-or between the two null checks expresses that cleanly. These are the nodes that make a tree lopsided, so a high count is a hint the tree is drifting toward a linked list.",
        },
        {
          title: "Count the leaf nodes",
          prompt: "Count the nodes with no children.",
          approach:
            "Recurse: an empty subtree contributes 0, a node with both children null contributes 1, and anything else contributes the sum of its two subtrees.\n\nThe two base cases, null and leaf, are distinct and conflating them is the usual bug. Cost is O(n) since every node must be inspected.",
        },
        {
          title: "Check whether a BST is perfect",
          prompt:
            "Perfect means every internal node has two children and all leaves sit at the same depth. Distinguish it from full and complete.",
          approach:
            "Compute the height, then confirm the node count equals 2 to that power minus 1, since only a perfect tree hits that maximum.\n\nAlternatively recurse checking that every leaf sits at the same depth and every internal node has two children. Be precise about the vocabulary: full allows 0 or 2 children at any depth, complete fills every level except possibly the last which fills left to right, and perfect requires both.",
        },
        {
          title: "Sum the values in a BST that fall inside a range",
          prompt:
            "Given a low and a high bound, total every value between them inclusive, and prune branches you do not need to visit.",
          approach:
            "Recurse, and at each node use the ordering to skip work. If the node's value is below the low bound, only the right subtree can contain matches. If it is above the high bound, only the left can. Otherwise add the value and recurse both ways.\n\nThat pruning is the point of the question; visiting every node and filtering also gives the right answer but throws away the BST property entirely.",
        },
      ],
    },
  ],
};
