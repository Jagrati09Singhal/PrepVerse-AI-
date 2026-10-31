"""
PrepVerse AI — Adaptive Skill Assessment & Resume Verification Engine
Tagline: Prepare Smarter. Practice Deeper. Become Interview-Ready.

Calibrates questions by student college year/tier (1st/2nd year, 3rd/4th pre-final/final year, graduate).
Provides interactive MCQs, bite-sized code logic snippets, and concise conceptual questions.
Remembers weak topics and automatically prioritizes extra reinforcement questions to bridge knowledge gaps.
"""

import re
import json
from typing import Dict, List, Any, Optional, Set
from app.models.enums import QuestionType, QuestionDifficulty


def detect_student_year_from_resume(raw_text: str, structured_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Infers the student's academic standing / experience tier from their resume text and education data.
    Detects graduation year or explicit year mentions (e.g. 2026, 2027, 2028, 3rd Year, B.Tech).
    """
    text_lower = (raw_text or "").lower()
    
    # Check graduation years
    years = [int(y) for y in re.findall(r"\b(202[0-9])\b", raw_text or "")]
    max_year = max(years) if years else None

    # Check textual year markers
    is_1st = bool(re.search(r"\b(?:1st|first)\s*(?:year|yr|freshman)\b", text_lower) or (max_year and max_year >= 2028))
    is_2nd = bool(re.search(r"\b(?:2nd|second)\s*(?:year|yr|sophomore)\b", text_lower) or (max_year and max_year == 2027))
    is_3rd = bool(re.search(r"\b(?:3rd|third|pre-final)\s*(?:year|yr|junior)\b", text_lower) or (max_year and max_year == 2026))
    is_4th = bool(re.search(r"\b(?:4th|fourth|final)\s*(?:year|yr|senior)\b", text_lower) or (max_year and max_year == 2025))

    if is_1st:
        return {
            "tier_key": "1st_year",
            "tier_label": "1st Year (Freshman - Programming Foundations)",
            "description": "Focuses on core programming syntax, logic building, data types, and basic loops.",
            "detected_grad_year": max_year,
            "recommended_focus": "Syntax, Control Flow, Basic Functions & Logic",
        }
    elif is_2nd:
        return {
            "tier_key": "2nd_year",
            "tier_label": "2nd Year (Sophomore - Core DSA & OOP)",
            "description": "Focuses on Object-Oriented Programming, basic data structures (Arrays, Linked Lists, Stacks, Queues), and recursion.",
            "detected_grad_year": max_year,
            "recommended_focus": "OOP Concepts, Basic Data Structures, Complexity Analysis",
        }
    elif is_3rd:
        return {
            "tier_key": "3rd_year",
            "tier_label": "3rd Year (Pre-Final Year - Core CS & Placement Prep)",
            "description": "Focuses on core semester subjects (DBMS, OS, CN), advanced data structures, and framework fundamentals.",
            "detected_grad_year": max_year,
            "recommended_focus": "DBMS, Operating Systems, Computer Networks, SQL & Web Frameworks",
        }
    elif is_4th:
        return {
            "tier_key": "4th_year",
            "tier_label": "4th Year (Final Year - Placement Drives & Projects)",
            "description": "Focuses on full-stack architecture, system design fundamentals, database optimization, and interview coding rounds.",
            "detected_grad_year": max_year,
            "recommended_focus": "System Design, Framework Internals, Concurrency & Capstone Architecture",
        }
    else:
        return {
            "tier_key": "graduate",
            "tier_label": "Recent Graduate / Entry-Level Engineer",
            "description": "Focuses on application architecture, API design, database indexing, and clean code practices.",
            "detected_grad_year": max_year,
            "recommended_focus": "System Design Basics, Asynchronous Processing & Testing",
        }


# Rich Question Bank categorized by canonical skill, format, and student tier
ASSESSMENT_QUESTION_BANK: Dict[str, List[Dict[str, Any]]] = {
    "Python": [
        {
            "format": "mcq",
            "question_text": "In Python, which of the following data types is mutable?",
            "options": ["A) Tuple", "B) String", "C) List", "D) Frozenset"],
            "correct_answer": "C",
            "explanation": "Lists in Python are mutable, meaning their elements can be modified in place. Tuples, strings, and frozensets are immutable.",
            "target_skill": "Python",
            "tier": "1st_2nd_year",
            "difficulty": QuestionDifficulty.EASY,
        },
        {
            "format": "mcq",
            "question_text": "What is the output of `bool([])` and `bool([0])` in Python?",
            "options": ["A) False, False", "B) False, True", "C) True, False", "D) True, True"],
            "correct_answer": "B",
            "explanation": "An empty list `[]` evaluates to False (falsy). A non-empty list `[0]` containing any element evaluates to True (truthy).",
            "target_skill": "Python",
            "tier": "1st_2nd_year",
            "difficulty": QuestionDifficulty.EASY,
        },
        {
            "format": "code_logic",
            "question_text": "What will this Python snippet print?\n```python\na = [1, 2, 3]\nb = a\nb.append(4)\nprint(len(a))\n```",
            "options": ["A) 3", "B) 4", "C) Error", "D) None"],
            "correct_answer": "B",
            "explanation": "In Python, assignment assigns a reference to the same list object. Mutating `b` modifies the same underlying list referenced by `a`, so `len(a)` is 4.",
            "target_skill": "Python",
            "tier": "1st_2nd_year",
            "difficulty": QuestionDifficulty.EASY,
        },
        {
            "format": "mcq",
            "question_text": "What is the average time complexity for searching a key in a Python dictionary (hash map)?",
            "options": ["A) O(1)", "B) O(log n)", "C) O(n)", "D) O(n²)"],
            "correct_answer": "A",
            "explanation": "Python dictionaries are implemented using hash tables, offering O(1) average time complexity for lookups, insertions, and deletions.",
            "target_skill": "Python",
            "tier": "3rd_4th_year",
            "difficulty": QuestionDifficulty.MEDIUM,
        },
        {
            "format": "code_logic",
            "question_text": "Consider this Python list comprehension:\n```python\nnums = [x * 2 for x in range(5) if x % 2 == 1]\n```\nWhat is the resulting value of `nums`?",
            "options": ["A) [0, 2, 4]", "B) [2, 6]", "C) [1, 3]", "D) [2, 4, 6]"],
            "correct_answer": "B",
            "explanation": "For `range(5)`, the odd numbers are 1 and 3. Multiplying each by 2 yields `[2, 6]`.",
            "target_skill": "Python",
            "tier": "3rd_4th_year",
            "difficulty": QuestionDifficulty.MEDIUM,
        },
    ],
    "React": [
        {
            "format": "mcq",
            "question_text": "In modern React, what does the `useState` hook return?",
            "options": [
                "A) The current state value only",
                "B) An object with `value` and `update` properties",
                "C) An array containing the current state value and an updater function",
                "D) A callback promise",
            ],
            "correct_answer": "C",
            "explanation": "`useState` returns a 2-element tuple/array: `[stateValue, setStateFunction]`.",
            "target_skill": "React",
            "tier": "1st_2nd_year",
            "difficulty": QuestionDifficulty.EASY,
        },
        {
            "format": "mcq",
            "question_text": "When does the callback inside `useEffect(..., [])` execute when passed an empty dependency array?",
            "options": [
                "A) On every single re-render of the component",
                "B) Only once, immediately after the component mounts",
                "C) Whenever parent state changes",
                "D) Right before the component mounts",
            ],
            "correct_answer": "B",
            "explanation": "An empty dependency array `[]` tells React to run the effect only once after the initial render (mount) and clean it up when unmounting.",
            "target_skill": "React",
            "tier": "3rd_4th_year",
            "difficulty": QuestionDifficulty.MEDIUM,
        },
        {
            "format": "code_logic",
            "question_text": "What is problematic about this React code snippet?\n```jsx\nfunction Counter() {\n  const [count, setCount] = useState(0);\n  function handleClick() {\n    setCount(count + 1);\n    setCount(count + 1);\n  }\n}\n```",
            "options": [
                "A) It throws a runtime syntax error",
                "B) Both updates read the same stale state `count`, incrementing only once instead of twice",
                "C) `useState` does not accept numeric values",
                "D) React will crash due to infinite re-render loop",
            ],
            "correct_answer": "B",
            "explanation": "Because state updates in event handlers are batched and `count` refers to the closure value at render time, both calls compute `0 + 1 = 1`. To increment twice, use functional updater `setCount(prev => prev + 1)`.",
            "target_skill": "React",
            "tier": "3rd_4th_year",
            "difficulty": QuestionDifficulty.MEDIUM,
        },
        {
            "format": "mcq",
            "question_text": "Why must list items in React have a unique `key` prop?",
            "options": [
                "A) To apply automatic CSS styling",
                "B) To help React's virtual DOM reconciliation identify which items changed, added, or removed",
                "C) Keys are required for HTML validation",
                "D) To bind click event handlers",
            ],
            "correct_answer": "B",
            "explanation": "Keys give elements a stable identity across renders, allowing React's diffing algorithm to efficiently reorder or mutate DOM nodes.",
            "target_skill": "React",
            "tier": "1st_2nd_year",
            "difficulty": QuestionDifficulty.EASY,
        },
    ],
    "SQL": [
        {
            "format": "mcq",
            "question_text": "Which SQL clause is used to filter rows BEFORE grouping, and which clause filters AFTER grouping?",
            "options": [
                "A) WHERE filters before grouping, HAVING filters after grouping",
                "B) HAVING filters before grouping, WHERE filters after grouping",
                "C) WHERE and HAVING are completely identical and interchangeable",
                "D) GROUP BY filters both before and after",
            ],
            "correct_answer": "A",
            "explanation": "`WHERE` filters individual rows before aggregation occurs; `HAVING` filters aggregate groups produced by `GROUP BY`.",
            "target_skill": "SQL",
            "tier": "1st_2nd_year",
            "difficulty": QuestionDifficulty.EASY,
        },
        {
            "format": "code_logic",
            "question_text": "What will this SQL query return if a user has zero orders in the `orders` table?\n```sql\nSELECT users.name, orders.id \nFROM users \nLEFT JOIN orders ON users.id = orders.user_id;\n```",
            "options": [
                "A) The user row is completely excluded from the result",
                "B) The user's name is returned with `orders.id` as NULL",
                "C) The query raises a Foreign Key Violation error",
                "D) A new order row with ID 0 is automatically created",
            ],
            "correct_answer": "B",
            "explanation": "A `LEFT JOIN` retains all rows from the left table (`users`). If there is no matching row in `orders`, the columns from `orders` are filled with `NULL`.",
            "target_skill": "SQL",
            "tier": "3rd_4th_year",
            "difficulty": QuestionDifficulty.MEDIUM,
        },
        {
            "format": "mcq",
            "question_text": "What is the primary performance benefit of adding a B-Tree index to a foreign key column in a relational database?",
            "options": [
                "A) Reduces total storage space occupied by the table",
                "B) Accelerates JOIN and WHERE lookup operations from O(n) to O(log n)",
                "C) Encrypts data stored inside the column",
                "D) Speeds up mass INSERT operations",
            ],
            "correct_answer": "B",
            "explanation": "Indexes allow the database query planner to use logarithmic B-Tree searches instead of full table scans (Sequential Scans) during filter and join operations.",
            "target_skill": "SQL",
            "tier": "3rd_4th_year",
            "difficulty": QuestionDifficulty.MEDIUM,
        },
    ],
    "JavaScript": [
        {
            "format": "mcq",
            "question_text": "What is the difference between `==` and `===` in JavaScript?",
            "options": [
                "A) `==` checks value with type coercion; `===` checks both value and type strictly",
                "B) `===` is only used for numbers, `==` is used for strings",
                "C) `==` is faster than `===`",
                "D) They are completely identical in ES6+",
            ],
            "correct_answer": "A",
            "explanation": "`==` performs implicit type conversion before comparison (e.g. `5 == '5'` is true). Strict equality `===` requires matching types without coercion.",
            "target_skill": "JavaScript",
            "tier": "1st_2nd_year",
            "difficulty": QuestionDifficulty.EASY,
        },
        {
            "format": "code_logic",
            "question_text": "What is logged to the console by this JavaScript snippet?\n```javascript\nconsole.log(typeof null);\nconsole.log(typeof undefined);\n```",
            "options": [
                "A) null, undefined",
                "B) object, undefined",
                "C) object, object",
                "D) undefined, null",
            ],
            "correct_answer": "B",
            "explanation": "`typeof null === 'object'` is a legacy historical quirk of JavaScript. `typeof undefined === 'undefined'`.",
            "target_skill": "JavaScript",
            "tier": "1st_2nd_year",
            "difficulty": QuestionDifficulty.EASY,
        },
        {
            "format": "mcq",
            "question_text": "In JavaScript asynchronous programming, what does `Promise.all([p1, p2])` do if `p1` rejects?",
            "options": [
                "A) It waits for `p2` to complete, then returns whatever succeeded",
                "B) It immediately rejects with the error of `p1` (fail-fast behavior)",
                "C) It retries `p1` three times automatically",
                "D) It converts the rejection into an empty array",
            ],
            "correct_answer": "B",
            "explanation": "`Promise.all` adopts fail-fast behavior: if any promise in the iterable rejects, the whole returned promise immediately rejects with that reason.",
            "target_skill": "JavaScript",
            "tier": "3rd_4th_year",
            "difficulty": QuestionDifficulty.MEDIUM,
        },
    ],
    "Data Structures & Algorithms": [
        {
            "format": "mcq",
            "question_text": "Which data structure follows the First-In, First-Out (FIFO) principle?",
            "options": ["A) Stack", "B) Queue", "C) Binary Search Tree", "D) Heap"],
            "correct_answer": "B",
            "explanation": "A Queue operates on FIFO (First In First Out), while a Stack operates on LIFO (Last In First Out).",
            "target_skill": "Data Structures & Algorithms",
            "tier": "1st_2nd_year",
            "difficulty": QuestionDifficulty.EASY,
        },
        {
            "format": "mcq",
            "question_text": "What is the worst-case time complexity of QuickSort when a naive pivot (e.g. always first element on already sorted data) is used?",
            "options": ["A) O(n log n)", "B) O(n)", "C) O(n²)", "D) O(log n)"],
            "correct_answer": "C",
            "explanation": "If QuickSort repeatedly partitions into an empty sublist and n-1 elements (e.g. on sorted input with first element pivot), recursion depth becomes O(n), leading to O(n²) worst-case time.",
            "target_skill": "Data Structures & Algorithms",
            "tier": "3rd_4th_year",
            "difficulty": QuestionDifficulty.MEDIUM,
        },
        {
            "format": "code_logic",
            "question_text": "What is the space complexity of this recursive Fibonacci implementation?\n```python\ndef fib(n):\n    if n <= 1:\n        return n\n    return fib(n-1) + fib(n-2)\n```",
            "options": [
                "A) O(1) constant auxiliary space",
                "B) O(n) due to maximum call stack depth",
                "C) O(2^n) call stack space",
                "D) O(log n)",
            ],
            "correct_answer": "B",
            "explanation": "Although the time complexity is O(2^n), the maximum depth of the recursive call stack at any point in time is O(n), so auxiliary space complexity is O(n).",
            "target_skill": "Data Structures & Algorithms",
            "tier": "3rd_4th_year",
            "difficulty": QuestionDifficulty.MEDIUM,
        },
    ],
    "Docker": [
        {
            "format": "mcq",
            "question_text": "What is the primary difference between a Docker Image and a Docker Container?",
            "options": [
                "A) A container is a read-only template; an image is a running instance",
                "B) An image is a read-only immutable template; a container is a runnable, isolated instance with a writable layer",
                "C) Containers only run on Linux, images only run on Windows",
                "D) Docker images cannot contain software packages",
            ],
            "correct_answer": "B",
            "explanation": "An image is the immutable packaged template containing application code and runtime. A container is an active running instance of that image with its own isolated file system layer.",
            "target_skill": "Docker",
            "tier": "3rd_4th_year",
            "difficulty": QuestionDifficulty.EASY,
        },
        {
            "format": "mcq",
            "question_text": "In a Dockerfile, why is it best practice to copy `package.json` and run `npm install` BEFORE copying the rest of the application source code?",
            "options": [
                "A) Because Node.js requires it for compilation",
                "B) To take advantage of Docker layer caching, avoiding re-installing dependencies on every code change",
                "C) To shrink the file permissions of the container",
                "D) It prevents npm security vulnerabilities",
            ],
            "correct_answer": "B",
            "explanation": "Docker caches image layers. By copying package manifests first, `npm install` layer is only invalidated when dependencies change, making subsequent builds instant.",
            "target_skill": "Docker",
            "tier": "3rd_4th_year",
            "difficulty": QuestionDifficulty.MEDIUM,
        },
    ],
    "Git": [
        {
            "format": "mcq",
            "question_text": "What is the key difference between `git merge` and `git rebase` when integrating feature branch changes?",
            "options": [
                "A) `git merge` preserves historical commits with a merge commit; `git rebase` replays commits on top of the base branch for a linear history",
                "B) `git rebase` deletes remote commits permanently",
                "C) `git merge` only works on main branches",
                "D) They produce identical commit graph topologies",
            ],
            "correct_answer": "A",
            "explanation": "`git merge` creates a distinct merge commit preserving exact chronological branch history. `git rebase` rewrites commit history by transplanting feature commits onto the target base for a clean, linear log.",
            "target_skill": "Git",
            "tier": "1st_2nd_year",
            "difficulty": QuestionDifficulty.EASY,
        },
    ],
    "Operating Systems": [
        {
            "format": "mcq",
            "question_text": "What is the primary difference between a Process and a Thread in modern operating systems?",
            "options": [
                "A) A process has its own isolated address space; threads within the same process share memory and resources",
                "B) Threads have completely isolated virtual memory address spaces",
                "C) Processes can only run one at a time on multi-core processors",
                "D) Threads cannot communicate with each other",
            ],
            "correct_answer": "A",
            "explanation": "A process is an execution context with independent virtual memory and file handles. Multiple threads of the same process share code, data, and heap while maintaining their own private registers and call stack.",
            "target_skill": "Operating Systems",
            "tier": "2nd_year",
            "difficulty": QuestionDifficulty.EASY,
        },
        {
            "format": "mcq",
            "question_text": "Which of the following conditions is NOT one of Coffman's four necessary conditions for a Deadlock to occur?",
            "options": [
                "A) Mutual Exclusion",
                "B) Hold and Wait",
                "C) Preemption allowed by default",
                "D) Circular Wait",
            ],
            "correct_answer": "C",
            "explanation": "The four Coffman conditions are Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. If resources can be preempted, deadlocks cannot occur.",
            "target_skill": "Operating Systems",
            "tier": "3rd_year",
            "difficulty": QuestionDifficulty.MEDIUM,
        },
        {
            "format": "code_logic",
            "question_text": "What phenomenon occurs when the operating system spends significantly more time swapping virtual memory pages in and out of disk than executing user instructions?",
            "options": [
                "A) Thrashing",
                "B) Pipelining",
                "C) Spooling",
                "D) Context switching overhead",
            ],
            "correct_answer": "A",
            "explanation": "Thrashing happens when the total working set of active processes exceeds physical RAM capacity, causing continuous page faults and disk I/O.",
            "target_skill": "Operating Systems",
            "tier": "3rd_year",
            "difficulty": QuestionDifficulty.MEDIUM,
        },
    ],
    "Database Management Systems": [
        {
            "format": "mcq",
            "question_text": "What does the 'I' in the ACID transaction guarantees stand for in relational databases?",
            "options": [
                "A) Indexing",
                "B) Isolation",
                "C) Integrity",
                "D) Idempotency",
            ],
            "correct_answer": "B",
            "explanation": "ACID stands for Atomicity, Consistency, Isolation, and Durability. Isolation ensures concurrent transactions do not interfere with one another.",
            "target_skill": "Database Management Systems",
            "tier": "2nd_year",
            "difficulty": QuestionDifficulty.EASY,
        },
        {
            "format": "mcq",
            "question_text": "A database table is in Third Normal Form (3NF) if it is in 2NF and contains no transitive dependencies. What is a transitive dependency?",
            "options": [
                "A) A non-prime attribute depending on another non-prime attribute (X -> Y -> Z)",
                "B) A column depending on part of a composite primary key",
                "C) Two tables referencing each other via foreign keys",
                "D) A table having zero primary key columns",
            ],
            "correct_answer": "A",
            "explanation": "Transitive dependency means a non-key attribute determines another non-key attribute. 3NF eliminates these so non-key columns depend solely on the candidate key.",
            "target_skill": "Database Management Systems",
            "tier": "3rd_year",
            "difficulty": QuestionDifficulty.MEDIUM,
        },
        {
            "format": "code_logic",
            "question_text": "What is the difference between `DELETE FROM users;` and `TRUNCATE TABLE users;` in SQL?",
            "options": [
                "A) DELETE logs each row deletion and fires triggers; TRUNCATE deallocates data pages as DDL and is faster",
                "B) DELETE cannot be rolled back, TRUNCATE always rolls back",
                "C) TRUNCATE drops the entire table definition from the schema",
                "D) They are 100% identical under the hood",
            ],
            "correct_answer": "A",
            "explanation": "`DELETE` is a DML statement that removes rows one by one, recording individual deletions in the transaction log and firing row triggers. `TRUNCATE` is a DDL operation that deallocates storage pages directly.",
            "target_skill": "Database Management Systems",
            "tier": "3rd_year",
            "difficulty": QuestionDifficulty.MEDIUM,
        },
    ],
    "Computer Networks": [
        {
            "format": "mcq",
            "question_text": "Which OSI reference model layer is responsible for end-to-end data transmission, reliability, flow control, and port numbers (TCP/UDP)?",
            "options": [
                "A) Network Layer (Layer 3)",
                "B) Transport Layer (Layer 4)",
                "C) Data Link Layer (Layer 2)",
                "D) Session Layer (Layer 5)",
            ],
            "correct_answer": "B",
            "explanation": "The Transport Layer (Layer 4) handles host-to-host communication, segmenting data, flow control, and port multiplexing (e.g., TCP and UDP).",
            "target_skill": "Computer Networks",
            "tier": "2nd_year",
            "difficulty": QuestionDifficulty.EASY,
        },
        {
            "format": "mcq",
            "question_text": "What is the exact sequence of packets exchanged during a standard TCP Three-Way Handshake?",
            "options": [
                "A) SYN -> SYN-ACK -> ACK",
                "B) ACK -> SYN -> SYN-ACK",
                "C) SYN -> ACK -> DATA",
                "D) PING -> PONG -> ACK",
            ],
            "correct_answer": "A",
            "explanation": "Client sends SYN, server replies with SYN-ACK, and client completes the connection by sending ACK.",
            "target_skill": "Computer Networks",
            "tier": "3rd_year",
            "difficulty": QuestionDifficulty.EASY,
        },
        {
            "format": "mcq",
            "question_text": "Why does DNS use UDP for standard queries instead of TCP?",
            "options": [
                "A) UDP is faster and requires no connection setup handshake for small (<512 byte) query/response packets",
                "B) UDP provides guaranteed delivery and encryption",
                "C) DNS cannot run over TCP under any circumstances",
                "D) UDP prevents IP spoofing",
            ],
            "correct_answer": "A",
            "explanation": "Standard DNS lookups fit into a single datagram. Avoiding the 3-way TCP handshake minimizes latency for millions of quick domain resolutions. TCP is used only for zone transfers or responses > 512 bytes.",
            "target_skill": "Computer Networks",
            "tier": "3rd_year",
            "difficulty": QuestionDifficulty.MEDIUM,
        },
    ],
    "Object-Oriented Programming": [
        {
            "format": "mcq",
            "question_text": "Which OOP pillar is demonstrated when a subclass provides its own specific implementation of a method that is already defined in its parent class?",
            "options": [
                "A) Polymorphism (Method Overriding)",
                "B) Encapsulation",
                "C) Multiple Inheritance",
                "D) Data Hiding",
            ],
            "correct_answer": "A",
            "explanation": "Method Overriding is a manifestation of runtime polymorphism, where the subclass overrides a virtual method to supply specialized behavior.",
            "target_skill": "Object-Oriented Programming",
            "tier": "1st_year",
            "difficulty": QuestionDifficulty.EASY,
        },
        {
            "format": "mcq",
            "question_text": "What is the key difference between an Abstract Class and an Interface in modern typed languages?",
            "options": [
                "A) An abstract class can hold concrete state and implemented default methods; an interface is purely a contract (or default behaviors)",
                "B) An interface can have constructors and member variables",
                "C) A class can inherit multiple abstract classes, but only one interface",
                "D) Abstract classes cannot have abstract methods",
            ],
            "correct_answer": "A",
            "explanation": "Abstract classes support full instance state and constructors, while interfaces define contracts (APIs) and support multiple inheritance.",
            "target_skill": "Object-Oriented Programming",
            "tier": "2nd_year",
            "difficulty": QuestionDifficulty.MEDIUM,
        },
    ],
    "Machine Learning": [
        {
            "format": "mcq",
            "question_text": "What happens when a machine learning model exhibits very low training loss but extremely high validation loss?",
            "options": [
                "A) The model is Overfitting (high variance)",
                "B) The model is Underfitting (high bias)",
                "C) The model has converged optimally",
                "D) The learning rate is too low",
            ],
            "correct_answer": "A",
            "explanation": "Overfitting occurs when a model memorizes noise in the training set rather than learning generalizable patterns, resulting in poor validation performance.",
            "target_skill": "Machine Learning",
            "tier": "3rd_year",
            "difficulty": QuestionDifficulty.EASY,
        },
    ],
}


SUBJECT_ALIAS_MAP = {
    "os": "Operating Systems",
    "operating system": "Operating Systems",
    "operating systems": "Operating Systems",
    "dbms": "Database Management Systems",
    "database": "Database Management Systems",
    "database management systems": "Database Management Systems",
    "cn": "Computer Networks",
    "computer network": "Computer Networks",
    "computer networks": "Computer Networks",
    "networking": "Computer Networks",
    "oop": "Object-Oriented Programming",
    "oops": "Object-Oriented Programming",
    "object oriented programming": "Object-Oriented Programming",
    "dsa": "Data Structures & Algorithms",
    "data structures": "Data Structures & Algorithms",
    "algorithms": "Data Structures & Algorithms",
    "data structures & algorithms": "Data Structures & Algorithms",
    "ml": "Machine Learning",
    "ai": "Machine Learning",
    "machine learning": "Machine Learning",
    "docker": "Docker",
    "git": "Git",
    "python": "Python",
    "react": "React",
    "javascript": "JavaScript",
    "js": "JavaScript",
    "sql": "SQL",
}


def generate_skill_assessment_questions(
    resume_skills: List[str],
    student_level: Optional[str] = "3rd_year",
    ongoing_subjects: Optional[List[str]] = None,
    core_interests: Optional[List[str]] = None,
    weak_skills: Optional[List[str]] = None,
    question_count: int = 5,
    previously_asked: Optional[Set[str]] = None,
) -> List[Dict[str, Any]]:
    """
    Deterministically crafts an adaptive skill verification test tailored to the student's claimed resume skills,
    current ongoing semester subjects, and exact academic year standing.
    
    Features:
    1. Calibrated to specific student college year (1st, 2nd, 3rd, 4th year, or graduate).
    2. Integrates ongoing semester subjects (OS, DBMS, CN, DSA) for high-impact exam and interview practice.
    3. Remembers student's weak points and prioritizes extra targeted reinforcement questions.
    4. Provides interactive MCQs and bite-sized code output snippets without inducing exam fatigue.
    """
    bounded_count = max(1, min(int(question_count), 25))
    asked_set = set(previously_asked or set())
    weak_set = set(s.lower() for s in (weak_skills or []))

    # Combine resume skills, ongoing semester subjects, and interests into consideration
    raw_inputs = list(resume_skills or [])
    if ongoing_subjects:
        raw_inputs.extend(ongoing_subjects)
    if core_interests:
        raw_inputs.extend(core_interests)

    matched_skills: List[str] = []
    
    for candidate_input in raw_inputs:
        cleaned = candidate_input.strip().lower()
        if not cleaned:
            continue
            
        # Check alias map first
        if cleaned in SUBJECT_ALIAS_MAP:
            canonical = SUBJECT_ALIAS_MAP[cleaned]
            if canonical not in matched_skills:
                matched_skills.append(canonical)
            continue
            
        # Check partial bank match
        for bank_skill in ASSESSMENT_QUESTION_BANK.keys():
            if bank_skill.lower() == cleaned or cleaned in bank_skill.lower() or bank_skill.lower() in cleaned:
                if bank_skill not in matched_skills:
                    matched_skills.append(bank_skill)

    # Fallback to standard core curriculum if no skills were identified
    if not matched_skills:
        matched_skills = ["Data Structures & Algorithms", "Operating Systems", "Database Management Systems", "Python", "SQL"]

    # Prioritize weak skills by placing them first in the question generation queue
    prioritized_skills: List[str] = []
    for s in matched_skills:
        if s.lower() in weak_set:
            prioritized_skills.insert(0, s)  # Put weak skills at the front!
        else:
            prioritized_skills.append(s)

    # Define tier-matching hierarchy
    normalized_level = (student_level or "3rd_year").lower()
    compatible_tiers = {
        "1st_year": ["1st_year", "1st_2nd_year"],
        "1st_2nd_year": ["1st_year", "2nd_year", "1st_2nd_year"],
        "2nd_year": ["2nd_year", "1st_2nd_year", "1st_year"],
        "3rd_year": ["3rd_year", "3rd_4th_year", "2nd_year"],
        "3rd_4th_year": ["3rd_year", "4th_year", "3rd_4th_year"],
        "4th_year": ["4th_year", "3rd_4th_year", "3rd_year"],
        "graduate": ["graduate", "fresh_grad", "4th_year", "3rd_4th_year"],
        "fresh_grad": ["graduate", "fresh_grad", "4th_year", "3rd_4th_year"],
    }.get(normalized_level, ["3rd_year", "3rd_4th_year"])

    selected_questions: List[Dict[str, Any]] = []
    skill_cursor = 0

    while len(selected_questions) < bounded_count and skill_cursor < len(prioritized_skills) * 3:
        target_skill = prioritized_skills[skill_cursor % len(prioritized_skills)]
        skill_cursor += 1

        available_for_skill = ASSESSMENT_QUESTION_BANK.get(target_skill, [])
        if not available_for_skill:
            continue

        # Filter by questions not yet asked
        candidate_pool = [
            q for q in available_for_skill
            if q["question_text"] not in asked_set
            and not any(sq["question_text"] == q["question_text"] for sq in selected_questions)
        ]

        if not candidate_pool:
            # Re-allow if we exhausted unique pool
            candidate_pool = [
                q for q in available_for_skill
                if not any(sq["question_text"] == q["question_text"] for sq in selected_questions)
            ]

        if candidate_pool:
            # Pick question: prefer matching candidate's exact academic tier
            chosen = None
            for tier in compatible_tiers:
                for q in candidate_pool:
                    if q.get("tier") == tier:
                        chosen = q
                        break
                if chosen:
                    break

            if not chosen:
                chosen = candidate_pool[0]

            # Format rubric criteria with rich JSON metadata for the frontend
            rubric_dict = {
                "format": chosen.get("format", "mcq"),
                "options": chosen.get("options", []),
                "correct_answer": chosen.get("correct_answer", "A"),
                "explanation": chosen.get("explanation", ""),
                "target_skill": chosen.get("target_skill", target_skill),
                "is_weak_point_reinforcement": target_skill.lower() in weak_set,
            }

            adaptation_label = "Targeted Weak Point Reinforcement" if target_skill.lower() in weak_set else f"Semester Skill Assessment ({target_skill})"

            selected_questions.append({
                "order_index": len(selected_questions),
                "question_text": chosen["question_text"],
                "type": QuestionType.TECHNICAL,
                "difficulty": chosen.get("difficulty", QuestionDifficulty.EASY),
                "target_skill": target_skill,
                "rubric_criteria": json.dumps(rubric_dict),
                "adaptation_reason": adaptation_label,
            })

    # If still need more questions, pad with foundational concepts
    if len(selected_questions) < bounded_count:
        general_q = ASSESSMENT_QUESTION_BANK["Data Structures & Algorithms"][0]
        rubric_dict = {
            "format": general_q.get("format", "mcq"),
            "options": general_q.get("options", []),
            "correct_answer": general_q.get("correct_answer", "A"),
            "explanation": general_q.get("explanation", ""),
            "target_skill": "Data Structures & Algorithms",
            "is_weak_point_reinforcement": False,
        }
        selected_questions.append({
            "order_index": len(selected_questions),
            "question_text": general_q["question_text"],
            "type": QuestionType.TECHNICAL,
            "difficulty": QuestionDifficulty.EASY,
            "target_skill": "Data Structures & Algorithms",
            "rubric_criteria": json.dumps(rubric_dict),
            "adaptation_reason": "Core Foundations Revision",
        })

    return selected_questions

