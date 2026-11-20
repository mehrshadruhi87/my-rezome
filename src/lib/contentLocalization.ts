import type { SiteLanguage } from "../utils/userPreferences";
import type {
  CategoryItem,
  CourseDetail,
  CourseSummary,
  NewsArticle,
  ReviewItem,
} from "../types";
import type {
  DailyChallengeItem,
  HtmlCssTemplate,
  PlaygroundTemplate,
  RoadmapTrack,
} from "../utils/interactiveCoding";

const CATEGORY_EN: Record<string, { name: string; description: string }> = {
  frontend: {
    name: "Frontend Development",
    description: "React, Next.js, TypeScript, and modern UI engineering",
  },
  backend: {
    name: "Backend Engineering",
    description: "Node.js, NestJS, Go, Python Django & microservices architecture",
  },
  "ai-data": {
    name: "AI & Data Science",
    description: "Machine Learning, Deep Learning, LLMs, Python & Data Engineering",
  },
  cybersecurity: {
    name: "Cybersecurity & Ethical Hacking",
    description: "Web pentesting, network security, DevSecOps & malware analysis",
  },
  mobile: {
    name: "Mobile App Development",
    description: "Flutter, React Native, Kotlin & cross-platform mobile apps",
  },
  devops: {
    name: "DevOps & Cloud Engineering",
    description: "Docker, Kubernetes, CI/CD, Linux & cloud infrastructure",
  },
  "ui-ux-figma": {
    name: "UI/UX Design & Figma",
    description: "Modern design systems, interactive prototypes & product UX with Figma",
  },
  wordpress: {
    name: "WordPress & Elementor",
    description: "WooCommerce stores, custom themes, Elementor Pro & speed/SEO optimization",
  },
  general: {
    name: "Programming",
    description: "Project-based software engineering curriculum",
  },
};

interface CourseEnContent {
  title: string;
  shortDesc: string;
  description: string;
  instructorName: string;
  instructorTitle: string;
  instructorBio: string;
  duration: string;
  prerequisites: string;
  language: string;
  chapters?: Record<string, string>;
  lessons?: Record<string, string>;
}

const COURSE_EN: Record<string, CourseEnContent> = {
  "nextjs-15-fullstack-bootcamp": {
    title: "Next.js 15, React 19 & Enterprise Full-Stack Architecture Bootcamp",
    shortDesc:
      "Project-based mastery of scalable web applications with Next.js 15 App Router, Server Actions, Prisma & TypeScript.",
    description:
      "In this comprehensive, hands-on bootcamp, start from React 19 fundamentals and Server-Side Rendering (SSR/ISR) all the way to building a complete production e-commerce & SaaS platform with Next.js 15. Includes security, authentication, advanced caching, and Docker production deployment.",
    instructorName: "Dr. Keyvan Naderi",
    instructorTitle: "Principal Full-Stack Architect",
    instructorBio:
      "Over 12 years architecting high-traffic web platforms, fintech systems, and enterprise TypeScript applications.",
    duration: "64 Hours",
    prerequisites: "Basic HTML, CSS & JavaScript",
    language: "Persian / English Sub",
    chapters: {
      "فصل اول: معماری مدرن وب و هسته Next.js 15":
        "Chapter 1: Modern Web Architecture & Next.js 15 Core",
      "فصل دوم: کار با پایگاه داده، Prisma ORM و Server Actions":
        "Chapter 2: Databases, Prisma ORM & Server Actions",
      "فصل سوم: احراز هویت، درگاه پرداخت و دیپلوی پروداکشن":
        "Chapter 3: Authentication, Payments & Production Deployment",
    },
    lessons: {
      "معرفی دوره، مسیر یادگیری و بررسی پروژه نهایی":
        "Course Overview, Roadmap & Final Project Architecture",
      "تفاوت عمیق Server Components و Client Components":
        "Deep Dive: Server Components vs. Client Components",
      "معماری فولدرها، Dynamic Routes و Parallel Routes":
        "App Router Structure, Dynamic Routes & Parallel Routes",
      "طراحی اسکیماهای رابطه‌ای پیچیده با Prisma و PostgreSQL":
        "Relational Schema Design with Prisma & PostgreSQL",
      "پیاده‌سازی Mutations امن با Server Actions و اعتبارسنجی":
        "Secure Mutations with Server Actions & Validation",
      "پیاده‌سازی RBAC و اتصال به درگاه پرداخت":
        "Role-Based Access Control (RBAC) & Payment Gateway",
    },
  },
  "python-ai-llm-engineering": {
    title: "AI Engineering, Python, LLMs & Autonomous Agents Mastery",
    shortDesc:
      "Build production RAG pipelines, fine-tune open-source models, and engineer multi-tool AI agents with Python & PyTorch.",
    description:
      "Go beyond prompt tinkering and become a production AI Engineer. Master numerical Python, Transformer internals, hybrid vector search, LangGraph multi-agent orchestration, evaluation guardrails, and scalable cloud inference.",
    instructorName: "Dr. Amirhossein Farhadi",
    instructorTitle: "Senior AI & LLM Research Engineer",
    instructorBio:
      "PhD in Machine Learning specializing in Large Language Models, retrieval systems, and enterprise AI systems.",
    duration: "58 Hours",
    prerequisites: "Basic Python & programming fundamentals",
    language: "Persian / English Sub",
    chapters: {
      "فصل اول: پایتون پیشرفته برای علوم داده و هوش مصنوعی":
        "Chapter 1: Advanced Python for Data Science & AI",
      "فصل دوم: شبکه‌های عصبی عمیق و معماری Transformer":
        "Chapter 2: Deep Neural Networks & Transformer Architecture",
      "فصل سوم: مهندسی RAG، LangChain و ایجنت‌های سازمانی":
        "Chapter 3: Production RAG, LangChain & Enterprise Agents",
    },
    lessons: {
      "مسیر یادگیری مهندسی AI و آماده‌سازی محیط Jupyter و CUDA":
        "AI Engineering Roadmap & Jupyter / CUDA Setup",
      "پردازش ماتریسی سریع با NumPy و تحلیل داده با Pandas":
        "Vectorized Matrix Ops with NumPy & Pandas Analytics",
      "کالبدشکافی مکانیزم Attention و مدل‌های زبانی بزرگ (LLM)":
        "Anatomy of Self-Attention & Large Language Models",
      "ساخت سیستم پرسش و پاسخ روی اسناد فارسی با Vector DB":
        "Building a Document Q&A Engine with Vector Databases",
    },
  },
  "nestjs-microservices-architecture": {
    title: "Microservices & Scalable Backend Architecture with Node.js, NestJS & RabbitMQ",
    shortDesc:
      "Design resilient distributed backends using Clean Architecture, DDD, gRPC, RabbitMQ, Redis caching & PostgreSQL.",
    description:
      "Learn how senior backend engineers break monoliths into reliable event-driven microservices. Covers Domain-Driven Design, CQRS, message brokers, distributed tracing, and high-concurrency API engineering in NestJS.",
    instructorName: "Eng. Pouya Rostami",
    instructorTitle: "Staff Backend & Distributed Systems Engineer",
    instructorBio:
      "Architect of high-throughput payment gateways and distributed Node.js/NestJS platforms serving millions of users.",
    duration: "48 Hours",
    prerequisites: "JavaScript / TypeScript & REST API basics",
    language: "Persian / English Sub",
    chapters: {
      "فصل اول: معماری تمیز (DDD & Clean Architecture) در NestJS":
        "Chapter 1: DDD & Clean Architecture in NestJS",
    },
    lessons: {
      "چرا مونولیت‌ها شکست می‌خورند؟ ورود به دنیای میکروسرویس":
        "Why Monoliths Fail: Transitioning to Microservices",
      "پیاده‌سازی Dependency Injection و لایه‌بندی Domain":
        "Dependency Injection & Domain Layer Modeling",
    },
  },
  "web-penetration-testing-bug-bounty": {
    title: "Web Penetration Testing & Bug Bounty Hunter Specialist (OSWE)",
    shortDesc:
      "Hands-on OWASP Top 10 exploitation, API pentesting, WAF bypass methodologies & professional bug bounty reporting.",
    description:
      "Master offensive web security in realistic isolated labs. Learn systematic recon automation, SQLi, XSS, SSRF, authentication flaws, business-logic exploitation, and how to write high-impact bug bounty reports.",
    instructorName: "Eng. Sohrab Kazemi",
    instructorTitle: "Lead Offensive Security Researcher",
    instructorBio:
      "Hall-of-Fame bug bounty researcher and red-team lead helping teams secure mission-critical web applications.",
    duration: "52 Hours",
    prerequisites: "HTTP fundamentals & Linux CLI basics",
    language: "Persian / English Sub",
    chapters: {
      "فصل اول: متدولوژی Recon و شناسایی سطح حمله":
        "Chapter 1: Recon Methodology & Attack Surface Mapping",
    },
    lessons: {
      "معرفی لابراتوار دوره و ابزارهای Burp Suite Pro":
        "Lab Environment Setup & Burp Suite Pro Essentials",
      "اتوماسیون فرآیند Subdomain Enumeration و اسکن سرویس‌ها":
        "Automating Subdomain Enumeration & Service Discovery",
    },
  },
  "devops-docker-kubernetes-masterclass": {
    title: "Complete Docker, Kubernetes & Production DevOps Engineering",
    shortDesc:
      "Containerization, Kubernetes clusters, Helm, Terraform, GitHub Actions CI/CD & Prometheus/Grafana observability.",
    description:
      "Bridge development and production infrastructure. Build multi-stage Docker images, orchestrate resilient Kubernetes deployments, automate zero-downtime CI/CD pipelines, and monitor real-world clusters.",
    instructorName: "Eng. Nima Sharifi",
    instructorTitle: "Principal DevOps & Cloud Architect",
    instructorBio:
      "Cloud infrastructure architect specializing in Kubernetes at scale, GitOps workflows, and SRE reliability.",
    duration: "44 Hours",
    prerequisites: "Basic Linux command-line familiarity",
    language: "Persian / English Sub",
    chapters: {
      "فصل اول: تسلط کامل بر Docker و بهینه‌سازی ایمیج‌ها":
        "Chapter 1: Docker Mastery & Production Image Optimization",
    },
    lessons: {
      "معماری هسته لینوکس، Namespaces و Cgroups":
        "Linux Kernel Architecture: Namespaces & Cgroups",
      "نوشتن Multi-stage Dockerfile استاندارد برای پروداکشن":
        "Authoring Production Multi-Stage Dockerfiles",
    },
  },
  "algorithms-data-structures-free": {
    title: "Algorithms, Data Structures & Big-Tech Coding Interview Prep",
    shortDesc:
      "Free complete course on Big-O complexity, arrays, trees, graphs, dynamic programming & technical interview patterns.",
    description:
      "Build rock-solid computer science problem-solving intuition. Solve classic interview patterns step by step including Two Pointers, Sliding Window, Trees, Graphs, and Dynamic Programming.",
    instructorName: "Dr. Keyvan Naderi",
    instructorTitle: "Principal Full-Stack Architect",
    instructorBio:
      "Over 12 years mentoring software engineers for global technical interviews and systems design rounds.",
    duration: "28 Hours",
    prerequisites: "Basic familiarity with any programming language",
    language: "Persian / English Sub",
    chapters: {
      "فصل اول: تحلیل پیچیدگی زمانی و فضایی (Big-O)":
        "Chapter 1: Time & Space Complexity Analysis (Big-O)",
    },
    lessons: {
      "تحلیل کارایی الگوریتم‌ها و مقایسه ساختارهای حافظه":
        "Analyzing Algorithm Efficiency & Memory Structures",
      "آرایه‌ها، لیست‌های پیوندی و تکنیک Two Pointers":
        "Arrays, Linked Lists & The Two Pointers Pattern",
    },
  },
};

const INSTRUCTOR_NAME_EN: Record<string, string> = {
  "دکتر کیوان نادری": "Dr. Keyvan Naderi",
  "دکتر امیرحسین فرهادی": "Dr. Amirhossein Farhadi",
  "مهندس پویا رستمی": "Eng. Pouya Rostami",
  "مهندس سهراب کاظمی": "Eng. Sohrab Kazemi",
  "مهندس نیما شریفی": "Eng. Nima Sharifi",
  "مهرشاد روحی": "Mehrshad Ruhi",
  "سارا شریعتی": "Sara Shariati",
  "تحریریه کدآکادمی": "CodeAcademy Editorial",
  "مدرس کدآکادمی": "CodeAcademy Instructor",
};

const NEWS_EN: Record<
  string,
  {
    title: string;
    summary: string;
    content: string;
    category: string;
    authorName: string;
  }
> = {
  "typescript-compiler-speed-upgrade": {
    title: "New TypeScript Release Delivers Massive Compiler Speed Gains for Large Monorepos",
    summary:
      "The TypeScript engineering team unveiled memory optimizations and parallel type-checking to slash build times across enterprise codebases.",
    content:
      "In the latest TypeScript ecosystem upgrade, multi-module type analysis is up to 45% faster. React and Next.js teams gain instant editor diagnostics and significantly shorter CI/CD build pipelines with zero config changes.",
    category: "Web Development",
    authorName: "CodeAcademy Editorial",
  },
  "multi-tool-ai-agents-2026": {
    title: "Multi-Tool Autonomous AI Agents: The New Standard for Production LLM Engineering",
    summary:
      "Tech teams are shifting from simple chatbots to autonomous agents capable of executing code, security audits, and direct database reasoning.",
    content:
      "Modern AI engineering goes far beyond prompt writing. Combining hybrid RAG retrieval, structured tool calling, and deterministic guardrails allows autonomous agents to handle complex engineering and support workflows with high reliability.",
    category: "Artificial Intelligence",
    authorName: "Dr. Amirhossein Farhadi",
  },
  "figma-design-system-to-tailwind-v4": {
    title: "Practical Guide: Turning Figma Design Systems Seamlessly into Tailwind CSS v4 Tokens",
    summary:
      "How to map Figma color variables and typography scales directly into clean CSS custom properties and Tailwind v4 utilities.",
    content:
      "Tight alignment between UI/UX designers and frontend engineers accelerates product quality. By pairing Figma Variables with Tailwind CSS v4 design tokens, Dark/Light theming and component maintenance become dramatically faster.",
    category: "UI/UX & Figma",
    authorName: "CodeAcademy Editorial",
  },
};

const REVIEW_EN: Record<string, { userName: string; comment: string }> = {
  rev_seed_1: {
    userName: "Sara Shariati",
    comment:
      "The deepest and most practical Next.js course available! The Server Actions and Prisma architecture sections completely transformed how I build full-stack apps.",
  },
  rev_seed_2: {
    userName: "Mehrshad Ruhi",
    comment:
      "The new Autonomous AI Agents chapter and complete production source code files have been added to this course.",
  },
};

const ROADMAP_EN: Record<
  string,
  {
    title: string;
    subtitle: string;
    duration: string;
    level: string;
    milestones: Record<
      string,
      {
        title: string;
        weeks: string;
        summary: string;
        prerequisites: string[];
        capstone: string;
        recommendedCourses: Array<{ title: string; slug: string }>;
      }
    >;
  }
> = {
  "fullstack-web": {
    title: "Full-Stack Web Architect",
    subtitle: "From TypeScript fundamentals to scalable Next.js & PostgreSQL systems",
    duration: "6 Months to Job-Ready",
    level: "Zero to Senior",
    milestones: {
      "fs-1": {
        title: "Modern Web Foundations & Advanced TypeScript",
        weeks: "Weeks 1 – 5",
        summary:
          "Master static typing, modular component patterns, and responsive CSS Grid / Tailwind layouts.",
        prerequisites: ["Basic computer & browser literacy", "Problem-solving mindset"],
        capstone: "Build a type-safe, responsive UI component library",
        recommendedCourses: [
          {
            title: "Next.js 15, React 19 & Full-Stack Architecture Bootcamp",
            slug: "nextjs-15-fullstack-bootcamp",
          },
          {
            title: "Algorithms & Data Structures (Free)",
            slug: "algorithms-data-structures-free",
          },
        ],
      },
      "fs-2": {
        title: "React 19 & Next.js App Router",
        weeks: "Weeks 6 – 12",
        summary:
          "Master Server Components, Server Actions, smart caching strategies, and technical SEO.",
        prerequisites: ["JavaScript ES2024 proficiency", "TypeScript & Git"],
        capstone: "Build an e-commerce platform with a live admin console",
        recommendedCourses: [
          {
            title: "Next.js 15, React 19 & Full-Stack Architecture Bootcamp",
            slug: "nextjs-15-fullstack-bootcamp",
          },
        ],
      },
      "fs-3": {
        title: "Node.js Backend, Prisma & PostgreSQL",
        weeks: "Weeks 13 – 19",
        summary:
          "Design secure REST APIs, relational schemas, JWT authentication, and Redis caching.",
        prerequisites: ["HTTP & REST concepts", "Asynchronous JavaScript"],
        capstone: "Build a scalable auth service and payment gateway",
        recommendedCourses: [
          {
            title: "Microservices & Scalable Backend with NestJS",
            slug: "nestjs-microservices-architecture",
          },
        ],
      },
      "fs-4": {
        title: "Docker, Automated Testing & CI/CD Deployment",
        weeks: "Weeks 20 – 24",
        summary:
          "Containerize applications, write integration tests, and deploy zero-downtime cloud pipelines.",
        prerequisites: ["Basic Linux familiarity", "Completed backend project"],
        capstone: "Deploy the final full-stack app to cloud with live monitoring",
        recommendedCourses: [
          {
            title: "Complete Docker, Kubernetes & DevOps Engineering",
            slug: "devops-docker-kubernetes-masterclass",
          },
        ],
      },
    },
  },
  "ai-llm-engineer": {
    title: "AI & LLM Systems Engineer",
    subtitle: "Design production RAG pipelines, fine-tuned models & enterprise AI agents",
    duration: "7 Months to Job-Ready",
    level: "Intermediate to Advanced",
    milestones: {
      "ai-1": {
        title: "Production Python & Linear Algebra for Data",
        weeks: "Weeks 1 – 6",
        summary:
          "High-performance data structures, NumPy, Pandas, and production-grade data pipelines.",
        prerequisites: ["Basic programming logic", "High-school mathematics"],
        capstone: "Text cleaning & analytics pipeline for real-world datasets",
        recommendedCourses: [
          {
            title: "AI Engineering, Python, LLMs & Autonomous Agents",
            slug: "python-ai-llm-engineering",
          },
        ],
      },
      "ai-2": {
        title: "Machine Learning & Deep Neural Networks with PyTorch",
        weeks: "Weeks 7 – 14",
        summary:
          "Train classification & regression models, understand Transformers, and run rigorous evaluation.",
        prerequisites: ["NumPy & Pandas fluency", "Basic probability & statistics"],
        capstone: "Multi-class sentiment analysis model for user reviews",
        recommendedCourses: [
          {
            title: "AI Engineering, Python, LLMs & Autonomous Agents",
            slug: "python-ai-llm-engineering",
          },
        ],
      },
      "ai-3": {
        title: "RAG Architecture & Vector Databases",
        weeks: "Weeks 15 – 22",
        summary:
          "Generate document embeddings, run hybrid semantic search, and eliminate hallucinations.",
        prerequisites: ["Experience with LLM APIs", "Advanced Python"],
        capstone: "Enterprise knowledge assistant grounded in technical docs",
        recommendedCourses: [
          {
            title: "AI Engineering, Python, LLMs & Autonomous Agents",
            slug: "python-ai-llm-engineering",
          },
        ],
      },
      "ai-4": {
        title: "Autonomous Agents & MLOps Deployment",
        weeks: "Weeks 23 – 28",
        summary:
          "Build multi-tool agents, optimize token latency/cost, and deploy guarded production services.",
        prerequisites: ["Docker & cloud basics", "RAG architecture"],
        capstone: "Automated code-review & technical reporting AI agent",
        recommendedCourses: [
          {
            title: "Complete Docker, Kubernetes & DevOps Engineering",
            slug: "devops-docker-kubernetes-masterclass",
          },
        ],
      },
    },
  },
  "cyber-security": {
    title: "Cybersecurity & Bug Bounty Specialist",
    subtitle: "Hands-on web pentesting, critical vulnerability discovery & infrastructure hardening",
    duration: "5 Months to First Bounty",
    level: "Zero to Pro",
    milestones: {
      "sec-1": {
        title: "Networking, Linux & HTTP Deep Inspection",
        weeks: "Weeks 1 – 4",
        summary:
          "Analyze TCP/IP packets, automate with Bash, audit security headers, and master Burp Suite.",
        prerequisites: ["CLI usage & basic web concepts"],
        capstone: "Build an isolated pentest lab and capture live traffic",
        recommendedCourses: [
          {
            title: "Web Penetration Testing & Bug Bounty (OSWE)",
            slug: "web-penetration-testing-bug-bounty",
          },
        ],
      },
      "sec-2": {
        title: "OWASP Top 10 Vulnerabilities",
        weeks: "Weeks 5 – 10",
        summary:
          "Ethically discover and remediate SQLi, XSS, IDOR, SSRF, and broken access control flaws.",
        prerequisites: ["HTTP & Burp Suite proficiency", "Basic SQL"],
        capstone: "Full security audit & patch report on a vulnerable web app",
        recommendedCourses: [
          {
            title: "Web Penetration Testing & Bug Bounty (OSWE)",
            slug: "web-penetration-testing-bug-bounty",
          },
        ],
      },
      "sec-3": {
        title: "API Pentesting & WAF Bypass Techniques",
        weeks: "Weeks 11 – 16",
        summary:
          "Test GraphQL & REST APIs, uncover payment business-logic flaws, and audit JWT tokens.",
        prerequisites: ["OWASP Top 10 mastery", "JWT authentication concepts"],
        capstone: "Identify logic vulnerabilities in a simulated banking API",
        recommendedCourses: [
          {
            title: "Web Penetration Testing & Bug Bounty (OSWE)",
            slug: "web-penetration-testing-bug-bounty",
          },
        ],
      },
      "sec-4": {
        title: "Professional Reporting & Bug Bounty Hunting",
        weeks: "Weeks 17 – 20",
        summary:
          "Automate targeted recon, craft reproducible PoCs, and submit high-severity bounty reports.",
        prerequisites: ["Audited at least 3 lab targets"],
        capstone: "Author an international-standard penetration test report",
        recommendedCourses: [
          {
            title: "Web Penetration Testing & Bug Bounty (OSWE)",
            slug: "web-penetration-testing-bug-bounty",
          },
        ],
      },
    },
  },
};

const PLAYGROUND_EN: Record<
  string,
  { title: string; badge: string; description: string }
> = {
  quicksort: {
    title: "QuickSort Algorithm",
    badge: "Algorithms",
    description: "Divide-and-conquer QuickSort implementation with live trace logs.",
  },
  "password-audit": {
    title: "Password Security Auditor",
    badge: "Cybersecurity",
    description: "Evaluate password entropy and strength based on OWASP guidelines.",
  },
  "lru-cache": {
    title: "LRU Cache Engine",
    badge: "Backend Systems",
    description: "Simulate an O(1) Least Recently Used cache using JavaScript Map.",
  },
  "sales-analytics": {
    title: "Bootcamp Analytics",
    badge: "Data & JS",
    description: "Compute enrollments, average rating, and top bootcamps with array methods.",
  },
};

const HTML_CSS_EN: Record<
  string,
  { title: string; badge: string; description: string }
> = {
  "cyber-card": {
    title: "Neon Glass Product Card",
    badge: "Modern CSS",
    description: "Interactive glassmorphic card layout with subtle neon gradients.",
  },
  "responsive-grid": {
    title: "Responsive Grid Dashboard",
    badge: "CSS Grid",
    description: "Clean CSS Grid layout with metric tiles and live progress bars.",
  },
  "pricing-landing": {
    title: "3D Plan Card & CTA",
    badge: "UI / UX",
    description: "Tactile 3D button styling, typography hierarchy, and clean pricing layout.",
  },
};

const CHALLENGE_EN: Record<
  string,
  {
    title: string;
    category: string;
    description: string;
    hint: string;
    testLabels: string[];
  }
> = {
  "sum-even-numbers": {
    title: "Sum of Even Numbers",
    category: "Core JavaScript",
    description:
      "Write a function sumEvens(nums) that accepts an array of numbers and returns the sum of all even numbers.",
    hint: "Use filter() to keep numbers divisible by 2 (n % 2 === 0) and reduce() to sum them.",
    testLabels: [
      "Mixed array [1, 2, 3, 4, 6]",
      "No even numbers [1, 3, 5]",
      "Negative & zero [-4, 0, 10, 3]",
    ],
  },
  "is-balanced-brackets": {
    title: "Balanced Brackets Validator",
    category: "Data Structures (Stack)",
    description:
      "Write a function isBalanced(str) that checks whether all brackets ()[]{} are properly opened and closed.",
    hint: "Use an array as a stack: push opening brackets and match closing brackets against the top of the stack.",
    testLabels: [
      "Valid nested '({[]})'",
      "Misordered '([)]'",
      "Unclosed '(([]'",
    ],
  },
  "chunk-array": {
    title: "Chunk Array Into Equal Groups",
    category: "Arrays & Algorithms",
    description:
      "Write a function chunkArray(items, size) that splits items into sub-arrays of at most length size.",
    hint: "Iterate with step i += size and push items.slice(i, i + size) into the result array.",
    testLabels: [
      "Split 5 items by size 2",
      "Exact split of 4 items by 2",
      "Empty array",
    ],
  },
  "two-sum-indices": {
    title: "Two Sum Target Indices",
    category: "Interview Algorithms",
    description:
      "Write a function twoSum(nums, target) that returns indices [i, j] of two numbers adding up to target.",
    hint: "Store visited numbers and their indices in a Map to find the complement (target - num) in O(n) time.",
    testLabels: [
      "[2, 7, 11, 15] target 9",
      "[3, 2, 4] target 6",
      "[5, 5] target 10",
    ],
  },
  "palindrome-clean": {
    title: "Clean Palindrome Detector",
    category: "Strings",
    description:
      "Write a function isPalindrome(text) that checks if a string reads the same forwards and backwards, ignoring case and spaces.",
    hint: "Lowercase the text, strip non-alphanumeric characters, and compare with its reverse.",
    testLabels: [
      "'Race car'",
      "'CodeAcademy'",
      "'A man a plan a canal Panama'",
    ],
  },
  "unique-preserving-order": {
    title: "Remove Duplicates Preserving Order",
    category: "Data Structures (Set)",
    description:
      "Write a function uniqueValues(arr) that removes duplicates while preserving the first appearance order.",
    hint: "Array.from(new Set(arr)) preserves insertion order cleanly in O(n).",
    testLabels: [
      "[1, 2, 2, 3, 1, 4]",
      "['js', 'ts', 'js']",
      "Empty array",
    ],
  },
  "flatten-one-level": {
    title: "Deep Array Flattening",
    category: "Recursion",
    description:
      "Write a function flattenDeep(arr) that flattens arbitrarily nested arrays into a single flat array.",
    hint: "Use arr.flat(Infinity) or recursively reduce elements when Array.isArray(item) is true.",
    testLabels: [
      "[1, [2, [3, 4]], 5]",
      "[[['a']], 'b']",
      "[]",
    ],
  },
  "word-frequency": {
    title: "Word Frequency Counter",
    category: "Objects & Text",
    description:
      "Write a function countWords(sentence) that returns a lowercase frequency map for each word.",
    hint: "Trim and lowercase the string, split on whitespace, and accumulate counts in an object.",
    testLabels: [
      "'React Node react'",
      "'ai ai llm'",
      "Empty string",
    ],
  },
  "max-subarray-sum": {
    title: "Maximum Subarray Sum (Kadane)",
    category: "Dynamic Programming",
    description:
      "Write a function maxSubarraySum(nums) that computes the largest possible sum of any contiguous subarray.",
    hint: "Track current = Math.max(nums[i], current + nums[i]) and best = Math.max(best, current).",
    testLabels: [
      "[-2, 1, -3, 4, -1, 2, 1, -5, 4]",
      "[5, 4, -1, 7, 8]",
      "[-3, -1, -2]",
    ],
  },
  "group-by-key": {
    title: "Group Objects by Property Key",
    category: "Practical Algorithms",
    description:
      "Write a function groupBy(items, key) that groups an array of objects by the value of item[key].",
    hint: "Use reduce() to bucket each item into an array keyed by String(item[key]).",
    testLabels: [
      "Group by role",
      "Empty array",
    ],
  },
};

const PERSIAN_TO_LATIN_DIGITS: Record<string, string> = {
  "۰": "0",
  "۱": "1",
  "۲": "2",
  "۳": "3",
  "۴": "4",
  "۵": "5",
  "۶": "6",
  "۷": "7",
  "۸": "8",
  "۹": "9",
};

export function toLatinDigits(text: string): string {
  return String(text || "").replace(
    /[۰-۹]/g,
    (ch) => PERSIAN_TO_LATIN_DIGITS[ch] ?? ch
  );
}

export function localizeDuration(
  duration: string,
  language: SiteLanguage
): string {
  if (language !== "en") return duration;
  const latin = toLatinDigits(duration);
  return latin
    .replace(/ساعت/g, "Hours")
    .replace(/دقیقه/g, "min")
    .replace(/ماه/g, "Months")
    .replace(/هفته/g, "Weeks")
    .trim();
}

export function localizeCategory<
  T extends Pick<CategoryItem, "slug" | "name"> & { description?: string | null },
>(category: T, language: SiteLanguage): T {
  if (language !== "en") return category;
  const mapped = CATEGORY_EN[category.slug];
  if (!mapped) return category;
  return {
    ...category,
    name: mapped.name,
    ...(category.description !== undefined
      ? { description: mapped.description }
      : {}),
  };
}

export function localizeCourseSummary(
  course: CourseSummary,
  language: SiteLanguage
): CourseSummary {
  if (language !== "en") return course;
  const mapped = COURSE_EN[course.slug];
  const localizedCat = localizeCategory(course.category, language);
  const localizedInstructor =
    mapped?.instructorName ??
    INSTRUCTOR_NAME_EN[course.instructorName] ??
    course.instructorName;

  if (!mapped) {
    return {
      ...course,
      instructorName: localizedInstructor,
      duration: localizeDuration(course.duration, language),
      category: localizedCat,
    };
  }

  return {
    ...course,
    title: mapped.title,
    shortDesc: mapped.shortDesc,
    instructorName: localizedInstructor,
    instructorTitle: mapped.instructorTitle,
    duration: mapped.duration,
    category: localizedCat,
  };
}

export function localizeCourseDetail(
  course: CourseDetail,
  language: SiteLanguage
): CourseDetail {
  if (language !== "en") return course;
  const base = localizeCourseSummary(course, language);
  const mapped = COURSE_EN[course.slug];

  const localizedChapters = course.chapters.map((ch) => ({
    ...ch,
    title: mapped?.chapters?.[ch.title] ?? ch.title,
    lessons: ch.lessons.map((les) => ({
      ...les,
      title: mapped?.lessons?.[les.title] ?? les.title,
      duration: localizeDuration(les.duration, language),
    })),
  }));

  const localizedReviews = course.reviews.map((rev) =>
    localizeReview(rev, language)
  );

  return {
    ...course,
    ...base,
    description: mapped?.description ?? course.description,
    instructorBio: mapped?.instructorBio ?? course.instructorBio,
    prerequisites: mapped?.prerequisites ?? course.prerequisites,
    language: mapped?.language ?? "English / Persian",
    chapters: localizedChapters,
    reviews: localizedReviews,
  };
}

export function localizeReview(
  review: ReviewItem,
  language: SiteLanguage
): ReviewItem {
  if (language !== "en") return review;
  const mapped = REVIEW_EN[review.id];
  return {
    ...review,
    userName:
      mapped?.userName ?? INSTRUCTOR_NAME_EN[review.userName] ?? review.userName,
    comment: mapped?.comment ?? review.comment,
  };
}

export function localizeNewsArticle(
  article: NewsArticle,
  language: SiteLanguage
): NewsArticle {
  if (language !== "en") return article;
  const mapped = NEWS_EN[article.slug];
  if (!mapped) {
    return {
      ...article,
      authorName: INSTRUCTOR_NAME_EN[article.authorName] ?? article.authorName,
    };
  }
  return {
    ...article,
    title: mapped.title,
    summary: mapped.summary,
    content: mapped.content,
    category: mapped.category,
    authorName: mapped.authorName,
  };
}

export function localizeRoadmapTrack(
  track: RoadmapTrack,
  language: SiteLanguage
): RoadmapTrack {
  if (language !== "en") return track;
  const mapped = ROADMAP_EN[track.id];
  if (!mapped) return track;

  return {
    ...track,
    title: mapped.title,
    subtitle: mapped.subtitle,
    duration: mapped.duration,
    level: mapped.level,
    milestones: track.milestones.map((m) => {
      const mm = mapped.milestones[m.id];
      if (!mm) return m;
      return {
        ...m,
        title: mm.title,
        weeks: mm.weeks,
        summary: mm.summary,
        prerequisites: mm.prerequisites,
        capstone: mm.capstone,
        recommendedCourses: mm.recommendedCourses,
      };
    }),
  };
}

function localizeCodeSnippetToEn(code: string): string {
  return code
    .replace(/\/\/\s*الگوریتم مرتب‌سازی سریع \(QuickSort\)/g, "// QuickSort divide-and-conquer algorithm")
    .replace(/آرایه ورودی:/g, "Input array:")
    .replace(/آرایه مرتب‌شده:/g, "Sorted array:")
    .replace(/\/\/\s*تحلیل امنیت رمز عبور بر اساس OWASP/g, "// OWASP password strength auditor")
    .replace(/رمز عبور:/g, "Password:")
    .replace(/امتیاز امنیت:/g, "Security score:")
    .replace(/وضعیت:/g, "Status:")
    .replace(/قوی و ایمن/g, "Strong & Secure")
    .replace(/متوسط/g, "Medium")
    .replace(/ضعیف/g, "Weak")
    .replace(/\/\/\s*پیاده‌سازی کش LRU با پیچیدگی O\(1\)/g, "// O(1) LRU Cache implementation")
    .replace(/مقدار کش:/g, "Cached value:")
    .replace(/کلیدهای فعلی کش:/g, "Active cache keys:")
    .replace(/\/\/\s*تحلیل آمار دوره‌های کدآکادمی/g, "// CodeAcademy course analytics")
    .replace(/کل دانشجویان:/g, "Total students:")
    .replace(/میانگین امتیاز:/g, "Average rating:")
    .replace(/دوره برتر:/g, "Top course:")
    .replace(/\/\/\s*[^\n]*[\u0600-\u06FF][^\n]*/g, "// Implement your solution here")
    .replace(/[\u0600-\u06FF]+/g, "output");
}

export function localizePlaygroundTemplate(
  tpl: PlaygroundTemplate,
  language: SiteLanguage
): PlaygroundTemplate {
  if (language !== "en") return tpl;
  const mapped = PLAYGROUND_EN[tpl.id];
  return {
    ...tpl,
    ...(mapped ?? {}),
    code: localizeCodeSnippetToEn(tpl.code),
  };
}

export function localizeHtmlCssTemplate(
  tpl: HtmlCssTemplate,
  language: SiteLanguage
): HtmlCssTemplate {
  if (language !== "en") return tpl;
  const mapped = HTML_CSS_EN[tpl.id];
  if (!mapped) return tpl;
  return { ...tpl, ...mapped };
}

export function localizeChallenge(
  challenge: DailyChallengeItem,
  language: SiteLanguage
): DailyChallengeItem & { displayDifficulty: string } {
  if (language !== "en") {
    return { ...challenge, displayDifficulty: challenge.difficulty };
  }
  const diffMap: Record<DailyChallengeItem["difficulty"], string> = {
    مبتدی: "Beginner",
    متوسط: "Intermediate",
    پیشرفته: "Advanced",
  };
  const mapped = CHALLENGE_EN[challenge.id];
  return {
    ...challenge,
    title: mapped?.title ?? challenge.title,
    category: mapped?.category ?? challenge.category,
    description: mapped?.description ?? challenge.description,
    hint: mapped?.hint ?? challenge.hint,
    starterCode: localizeCodeSnippetToEn(challenge.starterCode),
    solutionCode: localizeCodeSnippetToEn(challenge.solutionCode),
    displayDifficulty: diffMap[challenge.difficulty] ?? "Intermediate",
    testCases: challenge.testCases.map((tc, idx) => ({
      ...tc,
      label: mapped?.testLabels?.[idx] ?? tc.label,
    })),
  };
}

export function localizeRankInfo(
  rank: {
    title: string;
    nextRankTitle: string;
    nextThreshold: number;
    progressPercent: number;
  },
  language: SiteLanguage
) {
  if (language !== "en") return rank;
  const rankMap: Record<string, string> = {
    "نوآموز کدنویسی": "Code Apprentice",
    "کدنویس سایبری": "Cyber Coder",
    "مهندس الگوریتم": "Algorithm Engineer",
    "استاد معماری نرم‌افزار": "Software Architect Master",
    "قله افتخار (حداکثر سطح)": "Apex Tier (Max Level)",
  };
  return {
    ...rank,
    title: rankMap[rank.title] ?? rank.title,
    nextRankTitle: rankMap[rank.nextRankTitle] ?? rank.nextRankTitle,
  };
}

export function localizeNotificationCopy(
  notification: {
    title: string;
    message: string;
    ctaLabel: string;
  },
  language: SiteLanguage
): { title: string; message: string; ctaLabel: string } {
  if (language !== "en") return notification;
  const isDefaultPersian =
    notification.title.includes("جشنواره") ||
    notification.message.includes("کدآکادمی") ||
    notification.message.includes("تخفیف");
  if (!isDefaultPersian) {
    return {
      ...notification,
      ctaLabel:
        notification.ctaLabel === "مشاهده دوره‌ها"
          ? "Browse Courses"
          : notification.ctaLabel,
    };
  }
  return {
    title: "CodeAcademy Special Festival",
    message:
      "30% off all specialized Programming & AI bootcamps for a limited time — enroll now!",
    ctaLabel: "Browse Courses",
  };
}

export const MARQUEE_ITEMS_BY_LANG: Record<SiteLanguage, readonly string[]> = {
  fa: [
    "برنامه‌نویسی",
    "مدیریت و همکاری",
    "آموزش ۱۰۰٪ پروژه‌محور",
    "آپدیت مادام‌العمر",
    "پشتیبانی اختصاصی منتور",
    "معماری نرم‌افزار در مقیاس واقعی",
    "کدنویسی زنده در مرورگر",
    "مسیرهای استاندارد ورود به بازار کار",
  ],
  en: [
    "Software Engineering",
    "Team Collaboration",
    "100% Project-Based Learning",
    "Free Lifetime Updates",
    "Dedicated Mentor Support",
    "Production-Scale Architecture",
    "Live In-Browser Code Lab",
    "Job-Ready Career Learning Paths",
  ],
};
