/**
 * Projects constants
 * Flagship projects appear first as deeper case-study cards.
 */
export const PROJECTS = [
  {
    id: 1,
    title: "Hippocampus",
    eyebrow: "FLAGSHIP · ACTIVE DEVELOPMENT",
    featured: true,
    description:
      "Architecture-first medical learning platform built around source-grounded Study Missions, reliable document ingestion, and bounded AI integrations.",
    image: null,
    alt: "Hippocampus medical learning platform architecture",
    icon: "school",
    tags: [
      "Java 25",
      "Spring Boot",
      "PostgreSQL",
      "pgvector",
      "Spring AI",
      "React + TypeScript"
    ],
    highlights: [
      "Modular backend with explicit transaction, background-worker, and recovery boundaries.",
      "Grounded retrieval combining relational data, vector search, full-text search, and traceable source evidence.",
      "Quality gates across unit, integration, architecture, frontend, and end-to-end testing."
    ],
    links: {
      github: "https://github.com/KennethVier/hippocampus"
    }
  },
  {
    id: 2,
    title: "PesoPilot Financial OS",
    eyebrow: "FLAGSHIP · LIVE PRODUCT",
    featured: true,
    description:
      "Local-first personal finance workspace for tracking income, expenses, savings, salary cutoffs, budgets, cashflow, and explainable AI-assisted insights.",
    image: "/images/pesopilot.png",
    alt: "PesoPilot financial dashboard showing health score, cashflow, expenses, and AI insights",
    icon: "account_balance_wallet",
    tags: [
      "React",
      "Java Spring Boot",
      "IndexedDB",
      "Dexie.js",
      "Zustand",
      "Zod"
    ],
    highlights: [
      "Privacy-first local persistence keeps core finance workflows usable without requiring an account.",
      "Repository-based IndexedDB data layer for expenses, income, savings, budgets, rules, and insights.",
      "Validated forms, transaction search, combined filters, and backend-ready AI integration boundaries."
    ],
    links: {
      live: "https://peso-pilot-three.vercel.app/"
    }
  },
  {
    id: 3,
    title: "Yomira",
    eyebrow: "FLAGSHIP · AI / MICROSERVICES",
    featured: true,
    description:
      "Document-driven learning application that extracts PDF content and generates AI-assisted quizzes through independently deployable Spring Boot services.",
    image: "/images/yomira.png",
    alt: "Yomira AI learning application dashboard",
    icon: "psychology",
    tags: [
      "Java Spring Boot",
      "React",
      "Spring AI",
      "Microservices",
      "PDFBox",
      "PostgreSQL"
    ],
    highlights: [
      "Separate document-processing and quiz-generation services keep extraction and AI concerns isolated.",
      "PDF ingestion and persistence feed structured quiz-generation workflows.",
      "Frontend, document service, and quiz service can be deployed independently."
    ],
    links: {
      github: "https://github.com/KennethVier/vier-portfolio-labs/tree/master/apps/yomira-web",
      live: "https://yomira-livid.vercel.app/"
    }
  },
  {
    id: 4,
    title: "PeopleOps Dashboard Prototype",
    description:
      "Full-stack internal operations dashboard for employees, departments, onboarding, leave requests, activity logs, and workforce analytics.",
    image: "/images/peopleops.png",
    alt: "PeopleOps dashboard showing workforce metrics, departments, and activity",
    icon: "groups",
    tags: [
      "Java Spring Boot",
      "React",
      "PostgreSQL",
      "Dashboard UI",
      "REST API"
    ],
    links: {
      github: "https://github.com/KennethVier/vier-portfolio-labs/tree/master/apps/peopleops-web",
      live: "https://peopleops-dashboard.vercel.app/"
    }
  },
  {
    id: 5,
    title: "Vier Apparel Ecommerce",
    description:
      "Full-stack ecommerce prototype with a backend-driven catalog, cart, favorites, demo checkout, order history, and admin product management.",
    image: "/images/shop.png",
    alt: "Vier Apparel ecommerce storefront and product management preview",
    icon: "shopping_bag",
    tags: [
      "Java Spring Boot",
      "React",
      "PostgreSQL",
      "Ecommerce",
      "Admin Dashboard"
    ],
    links: {
      github: "https://github.com/KennethVier/vier-portfolio-labs/tree/master/apps/shop-web",
      live: "https://vier-shop.vercel.app/"
    }
  },
  {
    id: 6,
    title: "StrideMate AI Running Coach",
    description:
      "AI-powered running coach prototype that creates training plans, logs workouts through manual or OCR-assisted input, and adapts feedback around effort and fatigue.",
    image: "/images/stridemate.png",
    alt: "StrideMate AI running coach dashboard with training plan and workout insights",
    icon: "directions_run",
    tags: [
      "Java Spring Boot",
      "React",
      "PostgreSQL",
      "Ollama AI",
      "OCR Workflow"
    ],
    links: {
      github: "https://github.com/KennethVier/vier-portfolio-labs/tree/master/apps/stridemate-web",
      live: "https://stridemate-wine.vercel.app/"
    }
  },
  {
    id: 7,
    title: "Authly Authentication Demo",
    description:
      "Authentication-focused demo with email registration, sign-in, OAuth-oriented UI, protected routing, and backend-optional deployment messaging.",
    image: "/images/authly.png",
    alt: "Authly authentication interface with branded sign-in and registration screens",
    icon: "verified_user",
    tags: [
      "Java Spring Boot",
      "React",
      "Authentication",
      "OAuth",
      "Protected Routes"
    ],
    links: {
      github: "https://github.com/KennethVier/vier-portfolio-labs/tree/master/apps/auth-web",
      live: "https://authly-nine.vercel.app/"
    }
  },
  {
    id: 8,
    title: "TodoFlow",
    description:
      "Full-stack task management system with REST integration, deadline tracking, email reminders, and relational persistence.",
    image: "/images/todoList.png",
    alt: "TodoFlow task management application interface",
    icon: "task_alt",
    tags: [
      "Java Spring Boot",
      "React",
      "PostgreSQL",
      "Email Integration",
      "REST API"
    ],
    links: {
      github: "https://github.com/KennethVier/vier-portfolio-labs/tree/master/apps/todo-web",
      live: "https://todoflow-two.vercel.app/"
    }
  }
];

export const FEATURED_PROJECTS = PROJECTS.filter((project) => project.featured);
export const ADDITIONAL_PROJECTS = PROJECTS.filter((project) => !project.featured);
