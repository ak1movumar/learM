# Choice and match

These input formats are supported by both lesson and level-test screens. The API
accepts arbitrary JSON for `options` and `correct_answer`; use matching answer shapes
when authoring questions. Only the server grades answers.

## Choice

Question: Как переводится слово «apple»?

Options:

```json
{ "A": "Яблоко", "B": "Банан", "C": "Апельсин", "D": "Груша" }
```

Correct answer:

```json
"A"
```

## Match

Question: Соедините слова с переводами.

Options:

```json
{
  "left": { "apple": "apple", "book": "book" },
  "right": { "r1": "книга", "r2": "яблоко" }
}
```

Correct answer:

```json
{ "apple": "r2", "book": "r1" }
```

Keys must be nonempty and labels must be nonempty strings. Choice requires at least
two options; match requires equally sized nonempty left and right dictionaries.
The learner selects one item on the left, then one on the right. Pairs can be removed
before submission. All items must be paired with unique partners. Complete wrong
answers are submitted for server grading. Invalid option structures show an unavailable
state instead of guessing an encoding. Answer explanations for newly authored questions
still require backend feedback; the frontend never infers the correct option.
