export default {
  title: "Hash Table",
  level: "medium",
  subtopics: [
    {
      title: "Hash Table Implementation",
      difficulty: "medium",
      questions: [
        {
          title: "Write a simple hash function for string keys",
          prompt:
            "Turn a string key into an array index within a fixed table size. Show that the same key always lands in the same bucket.",
          approach:
            "Walk the characters, combine their character codes into a running number, and take the remainder against the table size so the result is a valid index.\n\nMultiplying the running total by a small prime before adding each character spreads keys far better than simply summing them, because a plain sum sends every anagram to the same bucket. The two properties to demonstrate are determinism, the same key always giving the same index, and reasonably even spread.",
        },
        {
          title: "Implement a hash table with set, get, delete and display",
          prompt:
            "Build the full structure on top of your hash function. State the average and worst case for a lookup.",
          approach:
            "Keep an array of buckets. Set hashes the key to an index and stores the key together with the value. Get hashes and reads. Delete hashes and removes.\n\nStore the key alongside the value, not the value alone, because two different keys can share a bucket and you need to tell them apart. Average lookup is O(1), worst case O(n) when everything collides into one bucket, which is exactly what the collision strategies exist to prevent.",
        },
        {
          title: "Store the buckets and show how a key maps to one",
          prompt:
            "Print the internal bucket array so you can see which keys share slots. Insert keys that deliberately collide.",
          approach:
            "Expose the raw bucket array and print each index with whatever it holds.\n\nThen insert keys you know hash to the same index and watch them pile into one bucket. Seeing the collision physically is what makes the next subtopic make sense, so it is worth doing before writing any collision handling.",
        },
      ],
    },

    {
      title: "Collision Handling",
      difficulty: "hard",
      questions: [
        {
          title: "Implement separate chaining with linked lists in the buckets",
          prompt:
            "Let each bucket hold several entries. Show what happens to lookup time when many keys land in the same bucket.",
          approach:
            "Each bucket holds a list of key-value pairs instead of a single entry. Set walks the bucket's list to update an existing key or appends a new pair. Get walks the list comparing keys.\n\nLookup becomes O(1) plus the length of that bucket's chain, so with a good hash and a sensible load factor chains stay near length one. In the worst case every key chains into one bucket and lookup degrades to O(n), which is the concrete answer to why the hash function quality matters.",
        },
        {
          title: "Implement linear probing",
          prompt:
            "Resolve collisions by storing the entry in the next free slot. Handle the tricky part: deletion.",
          approach:
            "On a collision, step forward one index at a time, wrapping around, until you find an empty slot. Lookup repeats the same walk until it finds the key or an empty slot.\n\nDeletion is the trap. Simply emptying a slot breaks the chain, because a later lookup stops at that hole and misses keys that probed past it. Mark deleted slots with a tombstone that lookups pass through but insertions may reuse. Also mention clustering: long runs of filled slots form and make probes progressively longer.",
        },
        {
          title: "Implement quadratic probing",
          prompt:
            "Step by growing squared offsets instead of one at a time, and explain what that fixes.",
          approach:
            "On a collision, probe at offsets of 1, 4, 9, 16 and so on from the home index, wrapping each time.\n\nSpreading the probes out breaks the primary clustering that linear probing suffers from, since colliding keys no longer walk the same path. The cost is that with a poor table size the probe sequence may never visit some slots, so an insert can fail while space remains. Keeping the table size prime and the load factor under about half avoids that.",
        },
        {
          title: "Implement double hashing",
          prompt:
            "Use a second hash function to decide the probe step size. Explain why the second function must never return zero.",
          approach:
            "The first hash picks the starting index and the second picks the step, so each key walks its own probe sequence.\n\nA step of zero would probe the same slot forever, so the second function must always produce a non-zero value, and it should be coprime with the table size so the probe eventually reaches every slot. This gives the best spread of the open-addressing schemes because even keys sharing a home index diverge immediately.",
        },
        {
          title: "Implement rehashing when the table gets too full",
          prompt:
            "Grow the table once occupancy passes a threshold and move the existing entries across. Say why you cannot just copy them.",
          approach:
            "Track how full the table is. When occupancy passes a threshold such as 0.75, allocate a bigger table, usually about double, and reinsert every existing entry.\n\nYou cannot copy entries to the same indexes because the index comes from the remainder against the table size, and that size just changed, so every key must be hashed again. Rehashing is O(n) but happens rarely, so the amortised cost per insertion stays constant. That amortised argument is the point.",
        },
      ],
    },

    {
      title: "Hash Table Problems",
      difficulty: "medium",
      questions: [
        {
          title: "Two Sum in O(n) using a hash table",
          prompt:
            "Return the indexes of the two values adding to the target in one pass. Compare the timing against the brute force version from Arrays.",
          approach:
            "Walk the array keeping a map from value to index. For each element, check whether target minus that value is already in the map, and if so you have your pair.\n\nStore the current value only after checking, otherwise an element pairs with itself when the target is double it. This trades O(n) space for dropping O(n²) down to O(n), and running both on a large array makes the difference obvious.",
        },
        {
          title: "Count the frequency of each character in a string",
          prompt: "Run it on 'Mississippi' and report how many times each letter appears.",
          approach:
            "One pass building a map from character to count, starting at 1 and incrementing on repeats.\n\nDecide whether the count is case sensitive, since 'M' and 'm' are different keys unless you normalise first. This map is the base of most of the problems below, so it is worth being able to write without thinking.",
        },
        {
          title: "Count the frequency of each number in an array",
          prompt: "Return how many times each value appears in an array of numbers.",
          approach:
            "The same counting map with numbers as keys.\n\nOne caution worth naming: a plain object turns numeric keys into strings, so 1 and '1' collide. A Map keeps the original types and is the safer choice when the distinction matters.",
        },
        {
          title: "Find the first non-repeating character using a hash table",
          prompt: "Run it on 'swiss' and return 'w'. Return null when everything repeats.",
          approach:
            "Two passes. Build the frequency map, then walk the original string in order and return the first character whose count is 1.\n\nThe second pass must go over the string rather than the map, because only the string preserves the original order. Doing it in one pass is impossible, since you cannot know a character never reappears until the string ends.",
        },
        {
          title: "Find the least frequent element",
          prompt: "Return the value that appears the fewest times, and say how you break a tie.",
          approach:
            "Build the frequency map, then walk its entries tracking the smallest count seen.\n\nWalking the map gives you no guarantee about order for ties, so if the first-occurring value should win, walk the original input on the second pass instead. State your tie rule rather than letting the map decide it for you.",
        },
        {
          title: "Find the two least frequent numbers",
          prompt: "Return the two values with the lowest occurrence counts.",
          approach:
            "Build the frequency map, then apply the second-smallest tracking pattern over its counts, carrying the two lowest as you go.\n\nSorting the entries by count and taking the first two also works and is easier to read, at O(m log m) in the number of distinct values against O(m) for the tracking version. Either is fine if you name the cost.",
        },
        {
          title: "Find the duplicate elements in an array",
          prompt: "Return every value that appears more than once, each listed only once.",
          approach:
            "Build the frequency map and collect the keys with a count above 1.\n\nA lighter variant needs only a set: walk once, and the first time you meet a value already in the set, record it as a duplicate. That avoids counting when you only need to know which values repeat, and it can stop early if you only need the first duplicate.",
        },
        {
          title: "Remove duplicates from a string using a hash table",
          prompt: "'programming' becomes 'progamin', keeping the first occurrence of each character.",
          approach:
            "Walk the string keeping a set of characters already output, and append a character only the first time you meet it.\n\nA set is enough here since you only need seen or not seen, not counts. Order is preserved because you build the result in the order you walk, which sorting-based deduplication would destroy.",
        },
        {
          title: "Find the elements that two arrays do not share",
          prompt:
            "Given [1, 2, 3, 4] and [3, 4, 5, 6], return the values present in exactly one of them.",
          approach:
            "Build a set from each array. Walk the first keeping values the second lacks, then walk the second keeping values the first lacks, and combine.\n\nBoth directions are needed; checking only one gives you a one-sided difference rather than the symmetric one. O(n + m). Say what you do about duplicates within a single array.",
        },
        {
          title: "Check whether a string contains any duplicate characters",
          prompt: "Return true as soon as a repeat is found. Try to exit early.",
          approach:
            "Walk the string adding characters to a set, and return true the moment a character is already present.\n\nExiting early matters, because on a string that repeats near the start you barely read any of it. There is also a free shortcut: if the string is longer than the alphabet it draws from, a duplicate is guaranteed and you can answer without scanning at all.",
        },
        {
          title: "Check whether two strings are anagrams by comparing frequency maps",
          prompt: "Decide using counts rather than sorting, and explain why that is faster.",
          approach:
            "Reject immediately if the lengths differ. Build the frequency map of the first string, then walk the second decrementing counts, failing if a character is missing or a count goes negative.\n\nCounting is O(n) where sorting both strings is O(n log n). Decrementing and checking as you go is neater than building two maps and comparing them, and it lets you fail early.",
        },
        {
          title: "Deep copy a deeply nested hash table",
          prompt:
            "Copy a map whose values may themselves be maps, so changing the copy never touches the original.",
          approach:
            "Recurse. For each entry, copy primitive values directly and recurse into nested maps, objects and arrays to build fresh containers.\n\nA shallow copy shares every nested map by reference, which is the bug the question exists to expose. Keep a record of objects already copied so a circular reference does not recurse forever, and decide whether keys that are themselves objects need copying too.",
        },
      ],
    },
  ],
};
