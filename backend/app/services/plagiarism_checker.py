"""
Plagiarism & Template Similarity Checker Service
Evaluates resume project bullets, summaries, and candidate interview answers
against a curated corpus of common web templates, tutorial clones, and textbook boilerplate.

Threshold Rule: Similarity must be LESS THAN 20.0% to pass originality standards.
"""

import re
from typing import Dict, Any, List, Set, Tuple

# Common cloned tutorial projects & web boilerplate frequently copy-pasted onto resumes
RESUME_TEMPLATE_CORPUS = [
    # E-commerce clones
    "built a full stack e commerce web application using mern stack with user authentication and payment gateway integration using stripe",
    "developed an ecommerce website with react node js express and mongodb featuring shopping cart product catalog and order management",
    "designed and implemented an online shopping portal with user registration login product search and payment processing",

    # Machine Learning / AI tutorial clones
    "implemented a convolutional neural network cnn on mnist dataset achieving high classification accuracy using python and tensorflow",
    "developed a machine learning model to predict house prices using linear regression random forest and scikit learn",
    "built an iris flower classification system using machine learning algorithms in python with pandas and matplotlib",
    "developed a sentiment analysis tool on twitter data using natural language processing nlp and python nltk",
    "created a movie recommendation system using collaborative filtering and content based filtering techniques in python",
    "developed an automated attendance system using opencv face recognition and python",
    "implemented fake news detection using python machine learning algorithms and tf idf vectorizer",

    # Web & Full Stack boilerplate
    "implemented a real time chat application using react node js socket io and mongodb with instant messaging",
    "built a responsive portfolio website using html5 css3 javascript with modern ui and mobile responsiveness",
    "created a todo list task management web application using react hooks local storage and tailwind css",
    "developed a weather forecasting application fetching real time data using openweather api and react",
    "implemented standard crud operations with rest api endpoints in node js express and mongodb database",
    "developed a blog application with user authentication post creation editing comments and likes using django",
    "built an expense tracker application to track daily income and expenses using react and firebase",
    "created a recipe finder web application consuming external spoonacular api with search and filter features",

    # Management Systems clones
    "designed and implemented a library management system using java oop concepts and mysql database",
    "developed a hospital management system with patient appointment booking doctor schedule and billing modules",
    "built a student management system in python using tkinter gui and sqlite database for record keeping",
    "developed an employee payroll management system using php and mysql with attendance tracking",
    "created a blood bank management system for blood donation donor tracking and blood inventory management",
    "implemented an automated ticket booking system using spring boot angular and postgresql",

    # Mobile app clones
    "developed an android application for daily task reminder using kotlin and room database",
    "built a fitness tracking mobile application with flutter and firebase authentication",
]

# Common canned / memorized internet textbook interview answers
INTERVIEW_TEMPLATE_CORPUS = [
    "a process is an instance of a program in execution whereas a thread is the smallest unit of execution within a process",
    "polymorphism allows objects of different classes to be treated as objects of a common superclass through method overriding and overloading",
    "encapsulation is the bundling of data and the methods that operate on that data into a single unit restricting direct access",
    "the four pillars of object oriented programming are encapsulation abstraction inheritance and polymorphism",
    "the main difference between sql and nosql is that sql databases are relational with structured schemas while nosql databases are non relational",
    "rest stands for representational state transfer and is an architectural style for distributed hypermedia systems based on stateless communication",
    "the cap theorem states that in a distributed computer system it is impossible to simultaneously provide consistency availability and partition tolerance",
    "a deadlock is a situation in concurrent programming where two or more threads are unable to proceed because each is waiting for the other",
    "acid stands for atomicity consistency isolation and durability which are four key properties of database transactions",
    "dependency injection is a design pattern in which an object receives other objects that it depends on rather than creating them internally",
    "a mutex provides mutual exclusion by allowing only one thread to access a resource at a time whereas a semaphore allows multiple threads",
    "indexing in a database improves query performance by creating a data structure like b tree that allows faster search at cost of write speed",
    "microservices architecture structures an application as a collection of loosely coupled independently deployable services",
    "a load balancer distributes incoming network traffic across multiple servers to ensure high availability and reliability",
    "dns stands for domain name system and translates human readable domain names into numerical ip addresses required for locating services",
    "a circuit breaker pattern prevents an application from repeatedly trying to execute an operation that is likely to fail",
]


def _clean_and_tokenize(text: str) -> List[str]:
    """Cleans text into normalized lowercase word tokens."""
    if not text:
        return []
    # Replace non-alphanumeric with spaces, collapse spaces
    cleaned = re.sub(r"[^a-zA-Z0-9\s]", " ", text.lower())
    tokens = [t.strip() for t in cleaned.split() if len(t.strip()) > 1]
    return tokens


def _generate_shingles(tokens: List[str], n: int = 3) -> Set[str]:
    """Generates contiguous n-gram shingles from a list of tokens."""
    if len(tokens) < n:
        return set([" ".join(tokens)]) if tokens else set()
    return {" ".join(tokens[i : i + n]) for i in range(len(tokens) - n + 1)}


def check_plagiarism(
    content_text: str,
    context_type: str = "resume",
    custom_threshold: float = 20.0,
) -> Dict[str, Any]:
    """
    Evaluates text for template similarity and copy-paste plagiarism against
    a comprehensive benchmark of web boilerplates and canned tutorial clones.

    Threshold: Similarity must be strictly LESS THAN 20.0% to pass.
    """
    threshold = float(custom_threshold)
    tokens = _clean_and_tokenize(content_text or "")
    total_tokens = len(tokens)

    if total_tokens < 6:
        # Overly brief text has minimal risk of plagiarism
        return {
            "similarity_percentage": 0.0,
            "threshold_percentage": threshold,
            "is_flagged": False,
            "status": "passed",
            "originality_score": 100.0,
            "verdict": "Original Content (< 20% match)",
            "matched_phrases": [],
            "remediation_tips": [],
            "total_words_analyzed": total_tokens,
            "criteria_rule": f"Similarity must be less than {threshold:.0f}%",
        }

    # Generate 3-gram and 4-gram candidate shingles
    shingles_3 = _generate_shingles(tokens, n=3)
    shingles_4 = _generate_shingles(tokens, n=4)
    total_shingles = len(shingles_3) + len(shingles_4)

    # Select appropriate template corpus
    corpus = list(RESUME_TEMPLATE_CORPUS)
    if context_type == "interview":
        corpus = list(INTERVIEW_TEMPLATE_CORPUS) + RESUME_TEMPLATE_CORPUS[:10]
    elif context_type == "all":
        corpus = RESUME_TEMPLATE_CORPUS + INTERVIEW_TEMPLATE_CORPUS

    matched_3: Set[str] = set()
    matched_4: Set[str] = set()

    for template in corpus:
        tpl_tokens = _clean_and_tokenize(template)
        tpl_shingles_3 = _generate_shingles(tpl_tokens, n=3)
        tpl_shingles_4 = _generate_shingles(tpl_tokens, n=4)

        overlap_3 = shingles_3.intersection(tpl_shingles_3)
        overlap_4 = shingles_4.intersection(tpl_shingles_4)

        matched_3.update(overlap_3)
        matched_4.update(overlap_4)

    matched_shingles_count = len(matched_3) + (len(matched_4) * 1.5)

    if total_shingles > 0:
        raw_similarity = (matched_shingles_count / float(total_shingles)) * 100.0
    else:
        raw_similarity = 0.0

    # Calibrate similarity into bounded percentage
    similarity_percentage = round(min(100.0, max(0.0, raw_similarity)), 1)
    originality_score = round(max(0.0, 100.0 - similarity_percentage), 1)

    # Threshold test: similarity MUST BE LESS THAN 20%
    is_flagged = similarity_percentage >= threshold
    status = "flagged" if is_flagged else "passed"

    # Extract distinct matched phrases for candidate feedback
    matched_phrases = sorted(list(matched_4 if matched_4 else matched_3))[:5]

    # Contextual remediation advice
    remediation_tips = []
    if is_flagged:
        if context_type == "resume":
            remediation_tips.append(
                "Personalize cloned project descriptions with your own custom architecture, specific tech challenges, and measurable scale metrics."
            )
            remediation_tips.append(
                "Instead of generic phrases like 'built full stack e-commerce with MERN', specify the exact database schemas, caching layers, and latency optimizations you implemented."
            )
            remediation_tips.append(
                "Apply the Google X-Y-Z formula: 'Accomplished [X] as measured by [Y] by doing [Z]' to ensure zero copy-paste resemblance."
            )
        else:
            remediation_tips.append(
                "Avoid reciting verbatim textbook definitions found on popular coding websites."
            )
            remediation_tips.append(
                "Frame your interview answers around real-world engineering trade-offs and first-person operational experiences."
            )
            remediation_tips.append(
                "Explain the 'why' and 'failure modes' rather than only the textbook definition."
            )
    else:
        remediation_tips.append(
            "Authentic phrasing verified: Your content reflects original first-person engineering delivery."
        )

    verdict = (
        f"Clean & Original (Similarity: {similarity_percentage}% < {threshold:.0f}%)"
        if not is_flagged
        else f"High Similarity Warning (Similarity: {similarity_percentage}% >= {threshold:.0f}%)"
    )

    return {
        "similarity_percentage": similarity_percentage,
        "threshold_percentage": threshold,
        "is_flagged": is_flagged,
        "status": status,
        "originality_score": originality_score,
        "verdict": verdict,
        "matched_phrases": matched_phrases,
        "remediation_tips": remediation_tips,
        "total_words_analyzed": total_tokens,
        "criteria_rule": f"Similarity should be less than {threshold:.0f}%",
    }

