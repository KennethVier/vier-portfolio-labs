/**
 * Projects constants
 * Flagship projects appear first as deeper case-study cards.
 */
export const PROJECTS = [
  {
    id: 1,
    title: "Hippocampus",
    eyebrow: "FLAGSHIP · ACTIVE DEVELOPMENT",
    number: "01",
    featured: true,
    description:
      "A medical learning platform engineered around reliable source ingestion and a traceable foundation for AI-assisted study workflows.",
    image: null,
    alt: "Hippocampus medical learning platform architecture",
    icon: "school",
    tags: [
      "Java 25",
      "Spring Boot",
      "PostgreSQL",
      "React + TypeScript"
    ],
    highlights: [
      "Structured the backend into explicit API, application, domain, port, and infrastructure boundaries.",
      "Implemented durable PDF ingestion with page-level persistence, progress tracking, retries, failure classification, and recovery safeguards.",
      "Built quality gates across unit, persistence integration, architecture, frontend, and end-to-end testing."
    ],
    role: "System architecture, backend workflows, persistence, recovery, and full-stack implementation",
    links: {
      github: "https://github.com/KennethVier/hippocampus"
    }
  },
  {
    id: 2,
    title: "PesoPilot Financial OS",
    eyebrow: "FLAGSHIP · LIVE PRODUCT",
    number: "02",
    featured: true,
    description:
      "A privacy-first personal finance workspace that keeps core expense data on-device and stays usable without an account.",
    image: "/images/pesopilot.png",
    alt: "PesoPilot financial dashboard showing health score, cashflow, expenses, and AI insights",
    icon: "account_balance_wallet",
    tags: [
      "React",
      "IndexedDB",
      "Dexie.js",
      "Zustand",
      "Zod"
    ],
    highlights: [
      "Designed a local-first data layer with Dexie repositories and versioned IndexedDB schema foundations.",
      "Shipped validated expense creation, editing, deletion, search, and combined filtering with no sign-in dependency.",
      "Defined finance domain boundaries for the remaining income, savings, budget, and explainable AI phases."
    ],
    role: "Product architecture, React UI, state management, validation, and local persistence",
    links: {
      live: "https://peso-pilot-three.vercel.app/",
      github: "https://github.com/KennethVier/vier-portfolio-labs/tree/master/apps/pesopilot-web"
    }
  },
  {
    id: 3,
    title: "Yomira",
    eyebrow: "FLAGSHIP · AI / MICROSERVICES",
    number: "03",
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
    role: "Service boundaries, PDF processing, AI integration, persistence, and deployment",
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
