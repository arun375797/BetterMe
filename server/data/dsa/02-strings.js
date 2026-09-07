export default {
  title: "Strings",
  level: "low",
  subtopics: [
    {
      title: "Basic String Problems",
      difficulty: "easy",
      questions: [
        {
          title: "Reverse a string without built-in methods",
          prompt:
            "Turn 'hello' into 'olleh' without split, reverse or join. Explain why you cannot simply swap characters in place.",
          approach:
            "Walk the string from the last index down to 0 and build up a new string one character at a time.\n\nThe reason you cannot swap in place is that strings are immutable in JavaScript, so every change produces a new string. That is the real lesson here: the array version swaps two pointers with no extra memory, while the string version has to build a fresh result. Mention that repeated concatenation in a loop is fine for interview sizes but that collecting characters and joining once is friendlier to the engine.",
        },
        {
          title: "Reverse each word in a sentence",
          prompt:
            "'HELLO WORLD' becomes 'OLLEH DLROW'. The words stay in their original positions, only the letters inside each word flip. No built-in reverse.",
          approach:
            "Two levels: cut the sentence into words on spaces, reverse the characters of each word, then put the words back together with spaces.\n\nThe common mistake is reversing the whole sentence, which also reorders the words and gives 'DLROW OLLEH'. If you are told not to use split either, track the start and end of each word manually and reverse between those bounds.",
        },
        {
          title: "Convert a string to Title Case",
          prompt:
            "'hello there world' becomes 'Hello There World'. Every word starts with a capital and the rest is lowercase.",
          approach:
            "Split into words, and for each word uppercase the first character and lowercase everything after it, then join back with spaces.\n\nLowercasing the tail is the part people forget, so 'hELLO' must come out as 'Hello' and not 'HELLO'. Guard against extra spaces producing empty words, because taking character 0 of an empty string gives undefined.",
        },
        {
          title: "Capitalise the first character of a string",
          prompt: "'apple' becomes 'Apple'. Leave the rest of the string untouched.",
          approach:
            "Take character 0, uppercase it, and stick the substring from index 1 onward behind it.\n\nHandle the empty string, since reading index 0 of it is undefined and concatenating that produces the text 'undefined'. This is the small building block that Title Case uses per word.",
        },
        {
          title: "Count the vowels in a string",
          prompt: "'programming' returns 3. Count both cases, so 'A' and 'a' both count.",
          approach:
            "Walk the string, lowercase each character, and add 1 to a counter when the character is one of a, e, i, o or u.\n\nTesting membership against a set or a short string of vowels reads better than five separate comparisons chained with or. Lowercasing once per character is what makes it case insensitive.",
        },
        {
          title: "Count the vowels and the consonants",
          prompt:
            "Return both counts from one traversal. Digits, spaces and punctuation belong to neither.",
          approach:
            "One pass with two counters. For each character, first check that it is actually a letter, then decide vowel or consonant.\n\nThe letter check is the whole difficulty: without it, spaces and punctuation get silently counted as consonants. Compare the lowercased character against the a-to-z range or use a character test.",
        },
        {
          title: "Count the frequency of every character",
          prompt:
            "'hello' returns something like { h: 1, e: 1, l: 2, o: 1 }. Say whether case and spaces are counted.",
          approach:
            "Walk the string once and build a map from character to count, starting each new character at 1 and incrementing thereafter.\n\nThis single map unlocks first non-repeating character, anagram checking and duplicate detection, so it is worth being fast at. O(n) time, and the space is bounded by the size of the alphabet in use.",
        },
        {
          title: "Remove the vowels from a string",
          prompt: "'programming' becomes 'prgrmmng'.",
          approach:
            "Walk the string and keep only the characters that are not vowels, building the result as you go.\n\nCollecting the kept characters and joining once at the end avoids creating a new string on every iteration. Decide whether uppercase vowels should also go, which they normally should.",
        },
        {
          title: "Remove all occurrences of a given character",
          prompt:
            "Remove every 'l' from 'hello world' to get 'heo word'. Do not use replace or a regular expression.",
          approach:
            "One pass, keeping every character that is not the one to remove.\n\nThe reason built-ins are banned is that the recursive version of this exact problem appears again in the Recursion topic, and they want you to see the loop first. Every occurrence must go, not only the first.",
        },
        {
          title: "Remove the extra whitespace between words",
          prompt:
            "'  hello    there  world ' becomes 'hello there world'. Collapse runs of spaces to one and trim the ends.",
          approach:
            "Walk the string and copy a space only when the previous character you kept was not itself a space. Then remove any leading or trailing space at the end.\n\nA cleaner framing is to collect the non-empty words and join them with a single space, which handles the leading, trailing and repeated cases all at once.",
        },
        {
          title: "Extract the digits from a string",
          prompt:
            "'a1b22c3' returns the digits. Say whether you want them as one string, separate characters, or numbers grouped as 1, 22 and 3.",
          approach:
            "Walk the string and keep characters that fall between '0' and '9'.\n\nDecide the output shape before you start, because grouping consecutive digits into 22 rather than 2 and 2 is a different problem: it needs you to buffer digits and flush the buffer when you hit a non-digit, plus a final flush after the loop for a string ending in digits.",
        },
        {
          title: "Convert PascalCase to snake_case",
          prompt: "'MyVariableName' becomes 'my_variable_name'.",
          approach:
            "Walk the string. When a character is uppercase and it is not the very first character, output an underscore before it. Either way output the lowercase form.\n\nSkipping the underscore at index 0 is what stops the result starting with a stray underscore. Think about runs of capitals like 'HTTPServer', and say what your rule produces for them.",
        },
        {
          title: "Make sure a sentence starts with a capital and ends with a full stop",
          prompt:
            "'hello world' becomes 'Hello world.' but 'Hello world.' is returned unchanged.",
          approach:
            "Two independent fixes. Uppercase the first character if it is not already, and append a full stop if the last character is not already one.\n\nBeing idempotent is the point: running it twice must not add a second full stop. Trim trailing whitespace first, or ' hello ' ends up with the stop after the space.",
        },
        {
          title: "Swap the first and last characters of a string",
          prompt: "'hello' becomes 'oellh'.",
          approach:
            "Build the result from three pieces: the last character, the middle slice from index 1 to the second-last, and the first character.\n\nStrings being immutable is again why you construct rather than swap. Guard strings of length 0 and 1, where there is nothing to exchange.",
        },
        {
          title: "Return every word in a sentence that starts with a vowel",
          prompt:
            "'an apple in every orchard' returns ['an', 'apple', 'in', 'every', 'orchard'] and drops words starting with consonants.",
          approach:
            "Split the sentence into words, then keep a word when its first character, lowercased, is a vowel.\n\nGuard empty words caused by double spaces before reading character 0. If punctuation is attached to words, decide whether to strip it first.",
        },
        {
          title: "Find the shortest word in a sentence",
          prompt: "Return the word with the fewest characters. Say how you break a tie.",
          approach:
            "Split into words, seed your answer with the first word, then walk the rest replacing the answer whenever you find something shorter.\n\nUsing strictly shorter rather than shorter-or-equal keeps the first of any tie, which is the usual expectation. Empty words from repeated spaces will win every tie if you do not filter them out first.",
        },
      ],
    },

    {
      title: "String Interview Problems",
      difficulty: "medium",
      questions: [
        {
          title: "Find the first non-repeating character",
          prompt:
            "'swiss' returns 'w'. Return null when every character repeats.",
          approach:
            "Two passes. First build the frequency map of every character, then walk the original string again in order and return the first character whose count is 1.\n\nThe second pass has to go over the string, not the map, because only the string knows the original order. Doing it in one pass by checking counts as you go does not work, since you cannot know a character never returns until you have seen the whole string.",
        },
        {
          title: "Find the last non-repeating character",
          prompt: "Return the final character in the string that appears exactly once.",
          approach:
            "Same frequency map, but walk the string backwards on the second pass and return the first count of 1 you meet.\n\nThat is the only change from the previous question, which is worth noticing: the counting pass is identical and only the direction of the scan differs.",
        },
        {
          title: "Check whether two strings are anagrams",
          prompt:
            "'listen' and 'silent' are anagrams, 'hello' and 'world' are not. Decide how you treat case and spaces.",
          approach:
            "Compare lengths first and reject immediately if they differ, since that is a free early exit.\n\nThen build a frequency map for the first string and walk the second, decrementing counts. If a character is missing or a count drops below zero, they are not anagrams. Sorting both and comparing also works and is easier to say out loud, but it costs O(n log n) against O(n) for the counting version.",
        },
        {
          title: "Check whether a string is a palindrome",
          prompt:
            "'racecar' is a palindrome. Say whether you ignore case, spaces and punctuation.",
          approach:
            "Two pointers, one at each end. Compare the characters, then step both inward. A mismatch means no, and pointers meeting means yes.\n\nReversing the string and comparing also works but uses O(n) extra space where two pointers use none. If you must ignore punctuation, skip non-letters as you move each pointer rather than cleaning the string first.",
        },
        {
          title: "Find the longest palindromic prefix",
          prompt:
            "Return the longest run from the start of the string that reads the same backwards. 'abacabax' has prefix 'abacaba'.",
          approach:
            "The plain approach tries the longest prefix first and shrinks: test the whole string, then the first n-1 characters, and so on, returning the first one that is a palindrome.\n\nEach check is O(n) and there are n of them, so O(n²). That is acceptable here, and it is worth stating that the linear solution exists via string-matching prefix functions rather than pretending you would write one under time pressure.",
        },
        {
          title: "Find the longest palindromic substring",
          difficulty: "hard",
          prompt:
            "'babad' returns 'bab' or 'aba'. Unlike the prefix version, the palindrome can start anywhere.",
          approach:
            "Treat every position as a possible centre and expand outwards while the characters on both sides match, keeping the longest span you find.\n\nThe catch is that palindromes come in two shapes: odd length centred on a character, and even length centred between two characters. You have to expand for both at each position or you miss half the answers. That is O(n²) time with O(1) space, and it is the version to reach for in an interview.",
        },
        {
          title: "Find the longest word in a sentence",
          prompt: "Return the word with the most characters, and say how you break ties.",
          approach:
            "Split into words, carry the best word seen so far, and replace it whenever you find a strictly longer one.\n\nUsing strictly longer keeps the first of a tie. If punctuation is glued to words it inflates their length, so decide whether to strip it.",
        },
        {
          title: "Find the second longest word in a sentence",
          prompt:
            "Return the word with the second highest character count. Do it without using split.",
          approach:
            "Carry two words as you go, longest and second longest, cascading the old longest down when a new champion appears. This is the second-largest pattern from Arrays applied to word lengths.\n\nWithout split you have to find the word boundaries yourself: track the start index of the current word and close it off whenever you hit a space or the end of the string. Remember to close the final word after the loop, which is the bug people ship.",
        },
        {
          title: "Find the third longest word in a sentence",
          prompt: "Return the word with the third highest character count.",
          approach:
            "Extend to three tracked words with the same cascade, exactly as the third-largest array problem does.\n\nDecide whether two words of equal length count as one place or two, and say what you return when the sentence has fewer than three words.",
        },
        {
          title: "Find the longest run of repeated characters",
          prompt:
            "'aabbbccddddd' returns 'd' with a run of 5. Return the character, the length, or both.",
          approach:
            "Walk the string carrying the current character, the current run length, and the best run seen. When the character matches the previous one the run grows, otherwise the run resets to 1.\n\nCompare against the best on every step, not only when the run breaks, otherwise a run that reaches the end of the string is never recorded. That final-run case is the usual bug.",
        },
        {
          title: "Find the longest substring without repeating characters",
          difficulty: "hard",
          prompt:
            "'abcabcbb' returns 'abc' with length 3. The characters must be contiguous and all distinct.",
          approach:
            "Slide a window across the string. Grow it to the right one character at a time, and remember the last position where you saw each character.\n\nWhen the incoming character is already inside the current window, jump the left edge to just past its previous position instead of shuffling it one step at a time. Record the best width as you go. That gives O(n) with each character visited once.",
        },
        {
          title: "Find the largest substring that contains no vowels",
          prompt:
            "'programming' returns 'gr' or another longest vowel-free run. Return the run itself.",
          approach:
            "This is a run-length problem rather than a sliding window. Walk the string, grow the current run while characters are consonants, and reset it to empty on a vowel.\n\nKeep the best run seen alongside the current one, and check at the end of the loop too, so a vowel-free tail is not dropped.",
        },
        {
          title: "Find the characters common to two strings",
          prompt:
            "'hello' and 'world' share 'l' and 'o'. Decide whether repeats appear once or many times.",
          approach:
            "Build a frequency map for the first string, then walk the second and collect characters the map contains.\n\nIf each shared character should appear only once, remove it from the map after matching. If repeats should be reported as many times as both strings can support, decrement the count instead. State which rule you chose.",
        },
        {
          title: "Generate all permutations of a string",
          difficulty: "hard",
          prompt:
            "'abc' returns abc, acb, bac, bca, cab and cba. Say how many results a string of length n produces.",
          approach:
            "Recursive backtracking. At each step pick one unused character, add it to the current arrangement, recurse on the rest, then undo the pick and try the next character.\n\nThe base case is when the arrangement is as long as the input, at which point you record it. There are n factorial results, so the work is inherently huge and there is no clever way around it. For a string with duplicate letters, skip a character when it is the same as one you already tried at this position, or you will emit the same permutation twice.",
        },
        {
          title: "Expand a string so each letter repeats by its position",
          prompt: "'APPLE' becomes 'A-pp-ppp-llll-eeeee'.",
          approach:
            "Walk the string with the index in hand. The character at index i is repeated i + 1 times, so build each chunk and collect them.\n\nJoin the chunks with a hyphen at the end rather than appending a hyphen inside the loop, which is what leaves a trailing separator. Look closely at the expected output to confirm whether the case changes, since the sample lowercases everything after the first chunk.",
        },
      ],
    },
  ],
};
