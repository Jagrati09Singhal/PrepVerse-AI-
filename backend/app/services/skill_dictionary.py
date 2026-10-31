"""
Canonical Skill Dictionary, Categories, and Alias Normalization Mapping for PrepVerse AI.
Used consistently across Resume Parsing, Job Description Analysis, and Skill Matching.
"""

from typing import Dict, List, Set, Tuple

# Canonical Skill Name -> Aliases & Variations (all lowercase for matching)
SKILL_ALIASES: Dict[str, List[str]] = {
    # Programming Languages
    "Python": ["python", "python3", "py"],
    "JavaScript": ["javascript", "js", "ecmascript", "es6", "es2020"],
    "TypeScript": ["typescript", "ts"],
    "Java": ["java", "core java", "j2ee", "advanced java"],
    "C++": ["c++", "cpp"],
    "C#": ["c#", "csharp", "c sharp"],
    "C": ["c language", "c programming", "c/c++"],
    "Go": ["go", "golang"],
    "Rust": ["rust", "rustlang"],
    "SQL": ["sql", "structured query language", "t-sql", "pl/sql", "plsql"],
    "HTML": ["html", "html5"],
    "CSS": ["css", "css3"],
    "PHP": ["php"],
    "Ruby": ["ruby", "ruby on rails"],
    "Kotlin": ["kotlin"],
    "Swift": ["swift"],
    "Scala": ["scala"],
    "Dart": ["dart"],
    "R": ["r programming", "r language"],
    "Bash": ["bash", "shell scripting", "sh", "zsh", "shell script"],

    # Frontend Frameworks & Libraries
    "React": ["react", "react.js", "reactjs"],
    "Redux": ["redux", "redux toolkit", "rtk"],
    "Next.js": ["next.js", "nextjs", "next"],
    "Vue.js": ["vue", "vue.js", "vuejs", "vue3"],
    "Angular": ["angular", "angular.js", "angularjs", "angular2+"],
    "Tailwind CSS": ["tailwind", "tailwindcss", "tailwind css"],
    "Bootstrap": ["bootstrap", "bootstrap5", "bootstrap 5"],
    "Sass": ["sass", "scss"],
    "jQuery": ["jquery"],

    # Mobile Development
    "Flutter": ["flutter"],
    "React Native": ["react native", "react-native"],
    "Android Development": ["android", "android development", "android studio"],
    "iOS Development": ["ios", "ios development", "xcode"],

    # Backend Frameworks & Web
    "Node.js": ["node.js", "nodejs", "node"],
    "FastAPI": ["fastapi", "fast api"],
    "Django": ["django", "django rest framework", "drf"],
    "Flask": ["flask"],
    "Express.js": ["express", "express.js", "expressjs"],
    "Spring Boot": ["spring boot", "spring framework", "spring"],
    "GraphQL": ["graphql", "graph ql", "apollo graphql"],
    "REST APIs": ["rest", "restful", "rest api", "rest apis", "restful api", "restful apis", "api development"],
    "WebSockets": ["websocket", "websockets", "socket.io"],
    "gRPC": ["grpc"],
    "Prisma": ["prisma", "prisma orm"],
    "Hibernate": ["hibernate"],

    # Databases & Caching
    "PostgreSQL": ["postgresql", "postgres", "psql"],
    "MySQL": ["mysql"],
    "MongoDB": ["mongodb", "mongo", "mongoose"],
    "Redis": ["redis"],
    "SQLite": ["sqlite", "sqlite3"],
    "Elasticsearch": ["elasticsearch", "elastic search", "elastic"],
    "DynamoDB": ["dynamodb", "dynamo db"],
    "Cassandra": ["cassandra", "apache cassandra"],
    "Oracle Database": ["oracle", "oracle db", "oracle sql"],
    "SQL Server": ["sql server", "mssql", "ms sql"],
    "Firebase": ["firebase", "firestore"],
    "Supabase": ["supabase"],

    # Cloud, DevOps & Infrastructure
    "AWS": ["aws", "amazon web services", "ec2", "s3", "lambda", "ecs", "eks", "cloudwatch"],
    "Google Cloud (GCP)": ["gcp", "google cloud", "google cloud platform", "bigquery"],
    "Azure": ["azure", "microsoft azure"],
    "Docker": ["docker", "containerization", "containers", "docker-compose"],
    "Kubernetes": ["kubernetes", "k8s"],
    "Terraform": ["terraform"],
    "CI/CD": ["ci/cd", "cicd", "continuous integration", "continuous deployment"],
    "GitHub Actions": ["github actions", "github action"],
    "Jenkins": ["jenkins"],
    "Linux": ["linux", "unix", "ubuntu", "debian", "rhel", "centos"],
    "Git": ["git", "github", "gitlab", "version control"],
    "Nginx": ["nginx"],
    "Kafka": ["kafka", "apache kafka"],
    "RabbitMQ": ["rabbitmq", "rabbit mq"],
    "Prometheus": ["prometheus"],
    "Grafana": ["grafana"],

    # Data Science, ML & Analytics
    "Machine Learning": ["machine learning", "ml"],
    "Deep Learning": ["deep learning", "neural networks", "cnn", "rnn", "lstm"],
    "PyTorch": ["pytorch", "torch"],
    "TensorFlow": ["tensorflow", "tf", "keras"],
    "Scikit-Learn": ["scikit-learn", "sklearn", "scikit learn"],
    "Pandas": ["pandas"],
    "NumPy": ["numpy"],
    "Power BI": ["power bi", "powerbi"],
    "Tableau": ["tableau"],
    "Excel": ["excel", "ms excel", "microsoft excel", "advanced excel"],
    "Apache Spark": ["spark", "apache spark", "pyspark"],
    "Hadoop": ["hadoop", "apache hadoop"],
    "Snowflake": ["snowflake"],
    "Databricks": ["databricks"],
    "Airflow": ["airflow", "apache airflow"],
    "Natural Language Processing (NLP)": ["nlp", "natural language processing"],
    "Large Language Models (LLMs)": ["llm", "llms", "large language models", "prompt engineering", "langchain"],
    "Computer Vision": ["computer vision", "opencv"],

    # Testing & Quality Assurance
    "Unit Testing": ["unit testing", "test driven development", "tdd"],
    "Selenium": ["selenium", "selenium webdriver"],
    "Cypress": ["cypress"],
    "Playwright": ["playwright"],
    "Postman": ["postman", "api testing"],
    "JUnit": ["junit", "junit5"],
    "Jest": ["jest"],
    "Pytest": ["pytest"],

    # Core Computer Science (Crucial for Freshers & Campus Placement)
    "Data Structures & Algorithms": ["dsa", "data structures", "algorithms", "data structures and algorithms"],
    "Object-Oriented Programming (OOP)": ["oop", "oops", "object oriented programming", "object-oriented programming"],
    "Database Management Systems (DBMS)": ["dbms", "database management", "rdbms"],
    "Operating Systems": ["operating systems", "os concepts"],
    "Computer Networks": ["computer networks", "networking concepts", "tcp/ip"],
    "Problem Solving": ["problem solving", "competitive programming", "analytical skills"],

    # Product, Design & Collaboration
    "System Design": ["system design", "distributed systems", "microservices", "software architecture"],
    "Microservices": ["microservices", "microservice architecture"],
    "Agile / Scrum": ["agile", "scrum", "kanban", "sprint planning"],
    "Figma": ["figma"],
    "UI/UX Design": ["ui/ux", "ui ux", "user experience", "user interface", "wireframing"],
    "Jira": ["jira", "atlassian jira"],
    "Product Management": ["product management", "product strategy", "roadmap planning"],

    # Soft Skills & Professional
    "Communication": ["communication skills", "effective communication", "verbal communication"],
    "Leadership": ["leadership", "team leadership", "mentorship"],
    "Teamwork": ["teamwork", "team player", "collaboration", "cross-functional collaboration"],
}

# Reverse lookup: alias (lowercase) -> canonical name
ALIAS_TO_CANONICAL: Dict[str, str] = {}
for canonical, aliases in SKILL_ALIASES.items():
    for alias in aliases:
        ALIAS_TO_CANONICAL[alias.lower()] = canonical

# Skill Categories
SKILL_CATEGORIES: Dict[str, str] = {
    # Languages
    "Python": "languages",
    "JavaScript": "languages",
    "TypeScript": "languages",
    "Java": "languages",
    "C++": "languages",
    "C#": "languages",
    "C": "languages",
    "Go": "languages",
    "Rust": "languages",
    "SQL": "languages",
    "HTML": "languages",
    "CSS": "languages",
    "PHP": "languages",
    "Ruby": "languages",
    "Kotlin": "languages",
    "Swift": "languages",
    "Scala": "languages",
    "Dart": "languages",
    "R": "languages",
    "Bash": "languages",

    # Frameworks & Mobile
    "React": "frameworks",
    "Redux": "frameworks",
    "Next.js": "frameworks",
    "Vue.js": "frameworks",
    "Angular": "frameworks",
    "Tailwind CSS": "frameworks",
    "Bootstrap": "frameworks",
    "Sass": "frameworks",
    "jQuery": "frameworks",
    "Flutter": "frameworks",
    "React Native": "frameworks",
    "Android Development": "frameworks",
    "iOS Development": "frameworks",
    "Node.js": "frameworks",
    "FastAPI": "frameworks",
    "Django": "frameworks",
    "Flask": "frameworks",
    "Express.js": "frameworks",
    "Spring Boot": "frameworks",
    "GraphQL": "frameworks",
    "REST APIs": "frameworks",
    "WebSockets": "frameworks",
    "gRPC": "frameworks",
    "Prisma": "frameworks",
    "Hibernate": "frameworks",

    # Databases
    "PostgreSQL": "databases",
    "MySQL": "databases",
    "MongoDB": "databases",
    "Redis": "databases",
    "SQLite": "databases",
    "Elasticsearch": "databases",
    "DynamoDB": "databases",
    "Cassandra": "databases",
    "Oracle Database": "databases",
    "SQL Server": "databases",
    "Firebase": "databases",
    "Supabase": "databases",

    # Cloud & DevOps
    "AWS": "cloud_devops",
    "Google Cloud (GCP)": "cloud_devops",
    "Azure": "cloud_devops",
    "Docker": "cloud_devops",
    "Kubernetes": "cloud_devops",
    "Terraform": "cloud_devops",
    "CI/CD": "cloud_devops",
    "GitHub Actions": "cloud_devops",
    "Jenkins": "cloud_devops",
    "Linux": "cloud_devops",
    "Git": "cloud_devops",
    "Nginx": "cloud_devops",
    "Kafka": "cloud_devops",
    "RabbitMQ": "cloud_devops",
    "Prometheus": "cloud_devops",
    "Grafana": "cloud_devops",

    # Data & ML
    "Machine Learning": "data_ml",
    "Deep Learning": "data_ml",
    "PyTorch": "data_ml",
    "TensorFlow": "data_ml",
    "Scikit-Learn": "data_ml",
    "Pandas": "data_ml",
    "NumPy": "data_ml",
    "Power BI": "data_ml",
    "Tableau": "data_ml",
    "Excel": "data_ml",
    "Apache Spark": "data_ml",
    "Hadoop": "data_ml",
    "Snowflake": "data_ml",
    "Databricks": "data_ml",
    "Airflow": "data_ml",
    "Natural Language Processing (NLP)": "data_ml",
    "Large Language Models (LLMs)": "data_ml",
    "Computer Vision": "data_ml",

    # Testing
    "Unit Testing": "practices",
    "Selenium": "practices",
    "Cypress": "practices",
    "Playwright": "practices",
    "Postman": "practices",
    "JUnit": "practices",
    "Jest": "practices",
    "Pytest": "practices",

    # Practices & CS Fundamentals
    "Data Structures & Algorithms": "practices",
    "Object-Oriented Programming (OOP)": "practices",
    "Database Management Systems (DBMS)": "practices",
    "Operating Systems": "practices",
    "Computer Networks": "practices",
    "Problem Solving": "practices",
    "System Design": "practices",
    "Microservices": "practices",
    "Agile / Scrum": "practices",
    "Figma": "practices",
    "UI/UX Design": "practices",
    "Jira": "practices",
    "Product Management": "practices",
    "Communication": "practices",
    "Leadership": "practices",
    "Teamwork": "practices",
}


def normalize_skill_name(skill: str) -> str:
    """Normalizes an arbitrary skill variant to its canonical representation."""
    cleaned = skill.strip().lower()
    return ALIAS_TO_CANONICAL.get(cleaned, skill.strip())


def get_skill_category(skill_name: str) -> str:
    """Returns the high-level category of a canonical skill."""
    canonical = normalize_skill_name(skill_name)
    return SKILL_CATEGORIES.get(canonical, "other")
