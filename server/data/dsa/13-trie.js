export default {
  title: "Trie",
  level: "hard",
  subtopics: [
    {
      title: "Trie Implementation",
      difficulty: "medium",
      questions: [
        {
          title: "Implement a trie",
          prompt:
            "Build a prefix tree where each node holds a map of child characters. Explain what the end-of-word marker is for.",
          approach:
            "Each node holds a map from a character to a child node, plus a boolean saying whether a word ends there. The root represents the empty prefix and holds no character of its own.\n\nThe end marker is essential because a word can be a prefix of another: without it, storing 'card' would make 'car' appear to exist. Words sharing a prefix share the same nodes, which is where the memory saving over a plain list of strings comes from.",
        },
        {
          title: "Insert a word",
          prompt: "Add a word, creating only the nodes that do not already exist.",
          approach:
            "Walk the characters from the root, creating a child node when one is missing and stepping into it either way. Mark the final node as the end of a word.\n\nCost is O(length of the word) and it does not depend on how many words the trie already holds, which is the property that makes tries attractive. Inserting a word that is a prefix of an existing one creates no nodes at all, only sets a flag.",
        },
        {
          title: "Search for a whole word",
          prompt:
            "Return true only when the exact word was inserted. Show why the end marker decides the answer.",
          approach:
            "Walk the characters from the root, returning false the moment a child is missing. Reaching the end of the word is not enough: you must also check the end-of-word flag on that final node.\n\nWithout the flag check, searching 'car' in a trie holding only 'card' wrongly returns true. That check is the entire difference between searching a word and checking a prefix.",
        },
        {
          title: "Check whether any word starts with a given prefix",
          prompt: "Return true when the prefix path exists, whether or not it is itself a word.",
          approach:
            "The same walk as a word search, but succeed as soon as you have consumed the prefix, without looking at the end-of-word flag.\n\nOne flag check separates this from the previous question, which is worth noticing since it is the most common trie interview follow-up. O(length of the prefix), independent of the number of stored words.",
        },
        {
          title: "Delete a word without breaking the words that share its path",
          prompt:
            "Remove a word while leaving any word that shares its prefix intact. Deleting 'car' must not damage 'card'.",
          approach:
            "Walk to the last node and clear its end-of-word flag. Then, working back up, remove a node only when it has no children and is not itself the end of another word.\n\nThose two conditions are the whole problem. Deleting the path outright destroys longer words that pass through it, and deleting nothing leaves dead nodes behind. Recursion suits this because the removal decision is made on the way back up.",
        },
      ],
    },

    {
      title: "Trie Interview Problems",
      difficulty: "hard",
      questions: [
        {
          title: "Implement autocomplete for a prefix",
          prompt:
            "Return every stored word that begins with the prefix. With 'ca' stored against 'car', 'card' and 'dog', return the first two.",
          approach:
            "Two phases. Walk down to the node where the prefix ends, returning nothing if the path breaks. Then collect every word in the subtree below it with a DFS, building each word from the prefix plus the characters on the way down.\n\nThe cost is the prefix length plus the number of matches, which is why a trie beats scanning every stored word. Remember a node marked as a word end is itself a result, including the prefix node.",
        },
        {
          title: "Find the longest common prefix of a list of words",
          prompt: "['flow', 'flower', 'florine', 'flurr'] gives 'fl'.",
          approach:
            "With a trie, insert every word and walk down from the root while each node has exactly one child and is not marked as the end of a word. The characters you pass through are the answer.\n\nBoth stopping conditions matter: more than one child means the words diverge, and a word ending means one word is itself the prefix and it cannot grow further. Without a trie, comparing the words character by character in parallel is simpler and equally correct, so say which you would ship.",
        },
        {
          title: "Find the longest stored prefix of a query word",
          prompt:
            "Given a query, return the longest word in the trie that is a prefix of it. This is not the same as the previous question.",
          approach:
            "Walk the query's characters down the trie, and every time you land on a node marked as the end of a word, remember the prefix so far. Stop when the path breaks.\n\nThe last remembered position is the answer. Note the difference from the previous question: there you wanted the prefix shared by all stored words, here you want the longest stored word that starts the query. This is how routers match address prefixes and how dictionaries segment text.",
        },
        {
          title: "Remove the words in a sentence that start with a given character",
          prompt:
            "Drop every word beginning with a chosen letter, using a trie rather than scanning the sentence repeatedly.",
          approach:
            "Insert the words into a trie, then the entire set to remove hangs beneath the root's child for that character, so removing that one child drops them all.\n\nWalk the sentence and keep the words that survive. The trie earns its place when you filter by many different letters or prefixes, since each filter becomes one lookup rather than a fresh pass over every word.",
        },
        {
          title: "Remove the shared prefixes from a trie to compress it",
          prompt:
            "Collapse chains of single-child nodes into one node holding several characters, and say what that saves.",
          approach:
            "Walk the trie and whenever a node has exactly one child and is not the end of a word, merge it with that child so the node stores a string rather than a single character.\n\nThat is a radix tree, and it saves a great deal of memory on long words with few branches, since a chain of ten nodes becomes one. Search must then compare a whole segment at a time and handle a query that stops partway through a segment, which is the added complexity you are paying.",
        },
        {
          title: "Serialize a trie and read it back",
          prompt:
            "Write the trie out as a string or a flat structure, then rebuild it so the reconstruction behaves identically.",
          approach:
            "Serialise with a preorder walk, writing each character, whether it ends a word, and a marker when a subtree finishes so the reader knows to step back up.\n\nThose end-of-subtree markers are what make the structure recoverable, and without them the reader cannot tell siblings from children. Rebuild by replaying the sequence and following the markers. Verify by serialising, rebuilding, serialising again and checking the two strings match.",
        },
      ],
    },
  ],
};
