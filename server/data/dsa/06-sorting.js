export default {
  title: "Sorting",
  level: "medium",
  subtopics: [
    {
      title: "Basic Sorting Implementations",
      difficulty: "easy",
      questions: [
        {
          title: "Implement bubble sort ascending",
          prompt:
            "Sort [5, 1, 4, 2, 8] by repeatedly swapping neighbours that are out of order. Add the early exit that stops once a pass makes no swaps.",
          approach:
            "Compare each pair of neighbours and swap them when they are out of order. After the first full pass the largest value has bubbled to the end, after the second the next largest is in place, so each pass can stop one position earlier.\n\nKeep a flag recording whether any swap happened in a pass, and stop early when none did, which makes an already sorted array cost O(n) instead of O(n²). Worst case is still O(n²).",
        },
        {
          title: "Implement bubble sort descending",
          prompt: "The same algorithm producing the largest value first. Say exactly what you changed.",
          approach:
            "Flip the comparison from greater-than to less-than. Nothing else moves.\n\nThat one operator is the entire difference, which is why sorting libraries take a comparator function instead of a direction flag: pulling the comparison out means one implementation handles ascending, descending and sorting objects by any field.",
        },
        {
          title: "Remove the swapped flag from bubble sort and explain what changes",
          prompt:
            "Run both versions on an already sorted array and on a reversed one, and compare the work done.",
          approach:
            "Without the flag the algorithm always runs its full set of passes, so a sorted array still costs O(n²). With the flag it detects sorted input after one clean pass and stops, giving a best case of O(n).\n\nOn reversed input the flag never helps, because every pass swaps something, so both versions do identical work. That is the point: the flag changes the best case only and leaves the worst case untouched.",
        },
        {
          title: "Implement selection sort",
          prompt:
            "Repeatedly find the smallest remaining value and place it at the front of the unsorted region.",
          approach:
            "For each position, scan the rest of the array for the smallest value and swap it into place. After i passes the first i positions are final.\n\nIt is always O(n²) comparisons regardless of input, but it makes at most n swaps, which is the fewest of the simple sorts. That matters when writing is expensive relative to reading, and it is the main reason to prefer it over bubble sort.",
        },
        {
          title: "Implement insertion sort",
          prompt:
            "Build the sorted region one element at a time by inserting each new value into its correct place among those already sorted.",
          approach:
            "Take each element and walk it leftwards over the sorted region, shifting larger values right until it lands in place.\n\nShifting rather than swapping is the efficient form. Best case is O(n) on nearly sorted data because each element barely moves, worst case O(n²). That best case is why insertion sort is used to finish off small partitions inside real-world hybrid sorts.",
        },
        {
          title: "Sort an array of strings alphabetically with insertion sort",
          prompt: "Sort ['banana', 'apple', 'cherry'] alphabetically. Say how comparing strings differs.",
          approach:
            "Identical algorithm with a lexicographic comparison in place of the numeric one.\n\nThe trap is that in some languages comparing strings with less-than compares character codes, so uppercase sorts before lowercase and 'Banana' lands before 'apple'. Normalise the case first or use an explicit locale-aware comparison, and say which you chose.",
        },
        {
          title: "Sort a nearly sorted array and justify the algorithm you picked",
          prompt:
            "Given an array where every element is at most a couple of positions from its final place, pick a sorting algorithm and defend the choice.",
          approach:
            "Insertion sort is the answer. Each element only shifts a short distance, so the total work is close to O(n) rather than O(n²).\n\nMerge sort and quick sort ignore existing order and still cost O(n log n), so they are slower here despite the better worst case. If you know the maximum distance k, a small heap of size k+1 gives O(n log k). The real lesson is that the best algorithm depends on the shape of the input, not only on the big-O table.",
        },
      ],
    },

    {
      title: "Merge Sort",
      difficulty: "medium",
      questions: [
        {
          title: "Implement merge sort",
          prompt:
            "Sort an array by splitting it in half, sorting each half, and merging the results. State the time and space cost.",
          approach:
            "Divide and conquer. Split until each piece holds a single element, which is trivially sorted, then merge pairs of sorted pieces back together.\n\nThe merge takes two sorted arrays and walks both with a pointer each, always taking the smaller front value. Splitting gives log n levels and each level merges n elements, so O(n log n) in every case, best, average and worst. It needs O(n) extra space for the merging, which is its main drawback against quick sort.",
        },
        {
          title: "Merge two sorted arrays in linear time using the merge step",
          prompt:
            "Combine [1, 3, 5] and [2, 4, 6] into one sorted array in O(n + m), using only the merge half of merge sort.",
          approach:
            "A pointer at the start of each array. Compare, take the smaller, advance only that pointer. When one runs out, append the rest of the other in one go.\n\nThis is the engine of merge sort standing alone, and it is worth writing separately because getting the leftover tail right is where merge sort bugs usually live. Concatenating and sorting would be O(n log n) and throws away the sortedness you were handed.",
        },
        {
          title: "Sort an array of strings with merge sort",
          prompt: "Sort words alphabetically using merge sort.",
          approach:
            "The structure is unchanged; only the comparison inside the merge becomes lexicographic.\n\nMerge sort is stable, so two equal strings keep their original relative order, which matters when the strings carry associated data. Preserve that by taking from the left array when values are equal, not the right.",
        },
        {
          title: "Sort an array of student objects by age with merge sort",
          prompt:
            "Sort [{ name, age }] by age ascending. Two students of the same age must keep their original order.",
          approach:
            "Same merge sort with the comparison reading the age field.\n\nStability is the reason to choose merge sort here: equal ages stay in their input order, which lets you sort by one field and then another to get a compound ordering. To keep that property, take from the left array when ages are equal.",
        },
        {
          title: "Sort an array of objects by an amount property",
          prompt: "Sort transaction objects by their amount field, and support ascending or descending.",
          approach:
            "Pull the comparison into a small function that reads the field and returns which of two objects comes first, then let the sort call it.\n\nThat separation is the real content of the question: one sort implementation, a comparator per ordering. Guard missing or non-numeric amounts, which otherwise produce an inconsistent comparator and a scrambled result.",
        },
        {
          title: "Sort a linked list with merge sort",
          prompt: "Sort a linked list and explain why merge sort suits it better than quick sort.",
          approach:
            "Split with slow and fast pointers, recursively sort each half, then merge by re-pointing nodes.\n\nMerge sort fits because merging linked lists needs no extra array, only pointer changes, so the usual O(n) space penalty disappears. Quick sort struggles because partitioning wants random access to reach the middle, and a linked list makes that O(n) per lookup.",
        },
        {
          title: "Count the number of comparisons merge sort makes",
          prompt:
            "Instrument merge sort to report how many comparisons it performed, and check the number against what O(n log n) predicts.",
          approach:
            "Pass a counter through the recursion, or keep one in the enclosing scope, and add one every time two elements are compared inside the merge.\n\nRun it on 8, 16 and 32 elements and watch the count grow roughly as n log n rather than n². Seeing the measured number line up with the theory is the point of the exercise, and it makes complexity concrete in a way the notation alone does not.",
        },
      ],
    },

    {
      title: "Quick Sort",
      difficulty: "hard",
      questions: [
        {
          title: "Implement quick sort",
          prompt:
            "Sort an array by choosing a pivot, partitioning around it, and recursing on each side. State the average and worst case.",
          approach:
            "Pick a pivot, rearrange the array so everything smaller sits to its left and everything larger to its right, then recurse on both sides. The pivot is already in its final position after partitioning, so it is excluded from both recursive calls.\n\nAverage case is O(n log n) because good pivots halve the range. Worst case is O(n²) when the pivot is always the smallest or largest value, which is exactly what a sorted array does to a first-element pivot.",
        },
        {
          title: "Implement quick sort without extra arrays, in place",
          prompt:
            "Partition by swapping within the original array rather than building left and right arrays.",
          approach:
            "Use the Lomuto scheme: keep a boundary index for the smaller-than-pivot region, walk the range, and every time you meet a value below the pivot, swap it to the boundary and push the boundary forward. Finally swap the pivot into the boundary position.\n\nThe filter-into-two-new-arrays version is much easier to read but costs O(n) space per level, which throws away quick sort's main advantage over merge sort. In place, the only extra memory is the recursion stack.",
        },
        {
          title: "Sort in descending order with quick sort",
          prompt: "Produce largest first. Say precisely what changed.",
          approach:
            "Invert the comparison used during partitioning so values greater than the pivot move left.\n\nAs with bubble sort, one operator is the whole change, which reinforces that ordering belongs in a comparator rather than being baked into the algorithm.",
        },
        {
          title: "Sort an array of strings alphabetically with quick sort",
          prompt: "Sort words with quick sort and mention one property you lose compared with merge sort.",
          approach:
            "Same partitioning with a lexicographic comparison.\n\nThe property you lose is stability: quick sort's swaps can reorder equal elements, so two identical strings may not keep their input order. That does not matter for bare strings but does when they carry associated records, and knowing when it matters is the point.",
        },
        {
          title: "Handle duplicate values correctly in quick sort",
          prompt:
            "Sort an array where one value repeats heavily, such as [5, 5, 5, 5, 5, 1, 9], without degrading to O(n²).",
          approach:
            "A two-way partition puts every duplicate on the same side, so an array of one repeated value degenerates into the worst case.\n\nThe fix is a three-way partition: split into less-than, equal-to and greater-than the pivot, then recurse only on the outer two. All the equal values are finished in one step, so heavy duplication becomes fast rather than pathological.",
        },
        {
          title: "Build an input that forces quick sort into its worst case",
          prompt:
            "Construct an array that makes quick sort take O(n²), then show what changing the pivot choice does to it.",
          approach:
            "With a first-element or last-element pivot, an already sorted array is the worst case: every partition peels off one element, giving n levels of recursion with O(n) work each.\n\nSwitching to a random pivot, or median-of-three taken from the first, middle and last elements, makes that input ordinary again, because an adversary can no longer predict the pivot. Demonstrating the before and after is more convincing than quoting the complexity.",
        },
      ],
    },
  ],
};
