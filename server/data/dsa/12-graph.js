export default {
  title: "Graph",
  level: "hard",
  subtopics: [
    {
      title: "Graph Implementation",
      difficulty: "medium",
      questions: [
        {
          title: "Implement a graph with an adjacency list",
          prompt:
            "Store each vertex against the list of vertices it connects to. State the memory cost and when this representation wins.",
          approach:
            "Keep a map from each vertex to a list or set of its neighbours.\n\nMemory is proportional to vertices plus edges, so it is the right choice for sparse graphs, which is most real-world data. Listing a vertex's neighbours is instant, but asking whether two specific vertices are connected means scanning one list. That pair of properties is the trade against the matrix.",
        },
        {
          title: "Implement a graph with an adjacency matrix",
          prompt:
            "Store a grid where each cell says whether an edge exists. Compare it against the adjacency list.",
          approach:
            "A two-dimensional array where the cell at row i and column j records the edge from i to j.\n\nChecking whether two vertices are connected is O(1), which the list cannot match. But memory is proportional to vertices squared regardless of how few edges exist, and listing a vertex's neighbours means scanning a whole row. Use it for dense graphs or when edge lookups dominate.",
        },
        {
          title: "Add a vertex",
          prompt: "Add a new vertex with no edges, and handle a vertex that already exists.",
          approach:
            "In an adjacency list, create an entry with an empty neighbour list. Return early if the key is already there, or you will wipe out its existing edges.\n\nThat accidental reset is the actual bug this question catches. In a matrix it is far worse: you must grow every row and add a new one, which is O(vertices squared).",
        },
        {
          title: "Add an edge",
          prompt:
            "Connect two vertices. Say what changes between a directed and an undirected graph.",
          approach:
            "For an undirected graph add each vertex to the other's neighbour list, since the connection runs both ways. For a directed graph add only the one direction.\n\nAdding just one side in an undirected graph is the most common graph bug, and it shows up later as a traversal that mysteriously cannot reach half the graph. Decide whether missing vertices are created automatically or rejected.",
        },
        {
          title: "Remove a vertex",
          prompt:
            "Delete a vertex and every edge touching it. Explain why this is more work than it first looks.",
          approach:
            "Deleting the vertex's own entry is easy. The work is that every other vertex may hold a reference to it in their neighbour lists, and all of those must go too.\n\nLeaving those behind creates dangling edges pointing at a vertex that no longer exists, which crashes the next traversal. In an undirected graph you can visit only the removed vertex's neighbours, since only they can reference it, which is much cheaper than scanning everything.",
        },
        {
          title: "Remove an edge",
          prompt: "Disconnect two vertices while leaving both in the graph.",
          approach:
            "Remove each vertex from the other's neighbour list for an undirected graph, or just the one direction for a directed one.\n\nMirror whatever addEdge did, or the graph ends up half connected. Handle the edge not existing without throwing.",
        },
        {
          title: "Display the graph",
          prompt: "Print each vertex with its neighbours in a readable form.",
          approach:
            "Walk the map printing each key followed by its neighbour list, such as A -> B, C.\n\nWrite this before any traversal, because almost every graph bug is a malformed structure rather than a broken algorithm, and printing it exposes one-directional edges and dangling references immediately.",
        },
        {
          title: "Build an undirected adjacency list from a list of vertices and edges",
          prompt:
            "Given vertices and a list of pairs, construct the adjacency list. Watch out for using sets, because the output order stops being predictable.",
          approach:
            "Create an empty list for every vertex first, then walk the edge pairs adding each endpoint to the other's list.\n\nSeeding all the vertices up front matters, or an isolated vertex with no edges never appears. The warning about sets is real: a set gives fast duplicate rejection but no defined iteration order, so your traversal output changes between runs and becomes impossible to test. Use arrays when the order must be deterministic.",
        },
      ],
    },

    {
      title: "Traversal",
      difficulty: "hard",
      questions: [
        {
          title: "Breadth first search from a given vertex",
          prompt:
            "graph = { A: ['B','C'], B: ['A','D','E'], C: ['A','F'], D: ['B'], E: ['B','F'], F: ['C','E'] }. Start at A and visit every reachable vertex.",
          approach:
            "Use a queue. Push the start vertex and mark it visited, then repeatedly take the front, record it, and push its unvisited neighbours, marking them as you push.\n\nMark at push time, not at pop time, or a vertex reachable from two places gets queued twice. The visited set is what stops a cycle looping forever, and it is the difference between a graph traversal and a tree traversal. BFS visits in order of distance from the start, which is why it finds shortest paths in unweighted graphs.",
        },
        {
          title: "Depth first search from a given vertex",
          prompt: "Explore as far as possible along each branch before backtracking.",
          approach:
            "Same as BFS but with a stack instead of a queue, which flips it from exploring the nearest first to exploring the deepest first.\n\nThat single substitution is the whole difference, which is worth internalising. The visited set is still mandatory. Note that the order neighbours are pushed determines the order they are explored, so a stack-based DFS often visits in the reverse order of the recursive one.",
        },
        {
          title: "Depth first search written recursively",
          prompt: "Write DFS with recursion, and say what is holding the state for you.",
          approach:
            "Mark the current vertex visited, record it, then recurse into each unvisited neighbour.\n\nThe call stack is doing exactly what the explicit stack did in the iterative version. This is usually the shortest graph code you will write, but it is limited by the recursion depth, so a graph with a long chain of vertices can overflow where the iterative version would not.",
        },
        {
          title: "Depth first search written with an explicit stack",
          prompt:
            "Rewrite the recursive DFS using your own stack, and say when you would prefer it.",
          approach:
            "Push the start, then repeatedly pop a vertex, skip it if already visited, mark and record it, and push its neighbours.\n\nChecking visited on pop rather than on push is easier here, because a vertex can legitimately sit on the stack more than once. You would prefer this version on very deep graphs where recursion would overflow, and when you want to pause, inspect or resume the traversal.",
        },
      ],
    },

    {
      title: "Graph Interview Problems",
      difficulty: "hard",
      questions: [
        {
          title: "Detect a cycle in an undirected graph",
          prompt:
            "Return true when any path leads back to a vertex already on it. Explain why a naive visited check reports a false cycle.",
          approach:
            "Run DFS carrying the vertex you arrived from. A neighbour that is visited and is not the one you came from means a real cycle.\n\nWithout that parent check every single edge looks like a cycle, because in an undirected graph you can always step straight back the way you came. Remember to restart the search from every unvisited vertex so you cover disconnected pieces.",
        },
        {
          title: "Detect a cycle in a directed graph using DFS",
          prompt:
            "Return true when a directed path returns to a vertex already on the current path. Explain why the undirected approach does not transfer.",
          approach:
            "Track two things: vertices visited at any point, and vertices on the current recursion path. A cycle exists when you reach a vertex that is on the current path.\n\nThe parent trick does not work here because direction matters: A to B and B to A form a genuine cycle. It is being on the active path, not merely visited, that identifies one, since a visited vertex on a finished branch is harmless. Remove a vertex from the path set as the recursion unwinds.",
        },
        {
          title: "Count the cycles in a graph",
          prompt:
            "Report how many distinct cycles exist. Say why this is much harder than detecting one.",
          approach:
            "Detection can stop at the first hit; counting has to enumerate, and the number of cycles can grow exponentially with the graph size.\n\nFor a practical answer, count the connected components and their edges: in an undirected graph, edges minus vertices plus components gives the number of independent cycles, which is the cycle rank. Enumerating every cycle needs backtracking from each vertex with careful deduplication, since the same cycle appears from each of its members and in both directions.",
        },
        {
          title: "Find the shortest path in an unweighted graph",
          prompt:
            "Return the actual path between two vertices with the fewest edges, not just its length.",
          approach:
            "Use BFS, because it reaches every vertex by the shortest possible number of edges.\n\nTo rebuild the path, record for each visited vertex which vertex you came from, then walk those links backwards from the destination and reverse the result. DFS is the wrong tool here: it finds a path but has no reason to find the shortest one. O(vertices + edges).",
        },
        {
          title: "Find the shortest distance between two vertices",
          prompt: "Return only the number of edges, and stop as soon as you can.",
          approach:
            "BFS tracking the level, either by storing the distance with each queued vertex or by processing one whole level per round.\n\nReturn the moment you dequeue the destination rather than finishing the whole traversal. If the queue empties without reaching it, the two vertices are in different components and the distance is infinite.",
        },
        {
          title: "Implement Dijkstra's algorithm for a weighted graph",
          prompt:
            "Find the cheapest path when edges carry weights. Explain why BFS is not enough and what breaks with negative weights.",
          approach:
            "Keep a best-known distance for every vertex, starting at infinity except the source at zero. Repeatedly take the unvisited vertex with the smallest known distance, and for each neighbour check whether going through the current vertex is cheaper than the best known, updating if so.\n\nBFS fails because fewest edges is not cheapest when weights differ. A priority queue makes picking the next vertex O(log n) instead of scanning everything. It breaks on negative weights because it assumes a settled vertex can never be improved later, which a negative edge violates.",
        },
        {
          title: "Clone a graph",
          prompt:
            "Produce a deep copy where every vertex and edge is a new object, and the copy's structure matches the original exactly.",
          approach:
            "Traverse with either BFS or DFS while keeping a map from each original vertex to its copy.\n\nCheck that map before creating anything: if a vertex is already there, reuse the existing copy instead of making a second one. That map is what handles cycles, which would otherwise recurse forever, and what keeps shared neighbours pointing at the same copy rather than duplicates. Create the copy and record it in the map before recursing into its neighbours.",
        },
        {
          title: "Count the number of islands in a grid",
          prompt:
            "Given a grid of land and water cells, count the groups of connected land. Explain how a grid is a graph.",
          approach:
            "Each land cell is a vertex and adjacent land cells are edges, so the grid is a graph with the connections implied by position rather than stored.\n\nWalk every cell, and each time you find unvisited land, increment the count and flood the whole connected region with DFS or BFS so it is never counted again. The count of times you started a flood is the answer. Decide whether diagonals connect, and keep the bounds checks tight. O(rows × columns).",
        },
        {
          title: "Check whether a graph is bipartite",
          prompt:
            "Decide whether the vertices split into two groups with no edge inside a group. Frame it as a colouring problem.",
          approach:
            "Traverse with BFS assigning alternating colours: give the start one colour and every neighbour the other.\n\nIf you ever reach a neighbour already coloured the same as the current vertex, it is not bipartite. Restart from every uncoloured vertex to cover disconnected pieces. The useful fact to state is that a graph is bipartite exactly when it contains no odd-length cycle.",
        },
        {
          title: "Find the connected components",
          prompt:
            "Group the vertices into sets that can reach each other, and report how many groups exist.",
          approach:
            "Walk every vertex, and whenever you find one not yet visited, run a full traversal from it collecting everything reachable as one component.\n\nThe number of traversals you had to start is the number of components. Every vertex is visited exactly once overall, so it is O(vertices + edges) despite the outer loop. A union-find structure is the alternative when edges arrive incrementally.",
        },
        {
          title: "Find the degree of a vertex",
          prompt:
            "Return how many edges touch a vertex, and say how directed graphs change the question.",
          approach:
            "In an undirected adjacency list it is the length of the neighbour list.\n\nIn a directed graph there are two answers: out-degree, the length of its own list, and in-degree, how many other lists contain it. In-degree costs a scan of the whole structure unless you maintain a reverse index. Note that a self-loop conventionally adds two to an undirected degree.",
        },
        {
          title: "Find the mutual connections between two vertices",
          prompt:
            "Return the vertices adjacent to both, the way a social network shows mutual friends.",
          approach:
            "Take both neighbour lists and intersect them. Put the smaller list into a set and scan the larger against it, giving O(n + m) rather than the O(n × m) of nested loops.\n\nDecide whether the two vertices themselves should be excluded from the result, since in a directly connected pair each appears in the other's list.",
        },
      ],
    },

    {
      title: "Minimum Spanning Tree",
      difficulty: "hard",
      questions: [
        {
          title: "Implement Prim's algorithm",
          prompt:
            "Build the cheapest set of edges connecting every vertex, growing outward from one starting vertex.",
          approach:
            "Start from any vertex and keep a set of vertices already included. Repeatedly pick the cheapest edge that leads from the included set to a vertex outside it, and add that vertex.\n\nA priority queue of candidate edges makes picking the cheapest O(log n) instead of a scan. Stop when every vertex is in, which takes exactly vertices minus one edges. Only considering edges that cross the boundary is what guarantees you never form a cycle.",
        },
        {
          title: "Implement Kruskal's algorithm",
          prompt:
            "Build the same minimum spanning tree by picking cheap edges globally. Explain how you avoid creating a cycle.",
          approach:
            "Sort every edge by weight and take them cheapest first, skipping any edge whose two endpoints are already connected.\n\nAnswering connected quickly is the crux, and that is what union-find is for: each vertex points at a representative, and two vertices are already joined when they share one. Prim grows one tree outward while Kruskal merges many small forests, and the difference matters because Prim suits dense graphs and Kruskal suits sparse ones.",
        },
      ],
    },
  ],
};
