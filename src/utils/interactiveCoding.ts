export interface SandboxLogEntry {
  level: "log" | "warn" | "error";
  text: string;
}

export interface SandboxExecutionResult {
  ok: boolean;
  logs: SandboxLogEntry[];
  returnValue?: string;
  error?: string;
  durationMs: number;
}

export interface PlaygroundTemplate {
  id: string;
  title: string;
  badge: string;
  description: string;
  code: string;
}

export interface ChallengeTestCase {
  label: string;
  args: unknown[];
  expected: unknown;
}

export interface DailyChallengeItem {
  id: string;
  title: string;
  difficulty: "مبتدی" | "متوسط" | "پیشرفته";
  xp: number;
  category: string;
  description: string;
  functionName: string;
  hint: string;
  starterCode: string;
  solutionCode: string;
  testCases: ChallengeTestCase[];
}

export interface ChallengeTestOutcome {
  label: string;
  passed: boolean;
  expected: string;
  actual: string;
  error?: string;
}

export interface ChallengeEvaluationResult {
  allPassed: boolean;
  passedCount: number;
  totalCount: number;
  outcomes: ChallengeTestOutcome[];
  runtimeError?: string;
  durationMs: number;
}

export interface ChallengeProgressState {
  solvedIds: string[];
  xp: number;
  streak: number;
  lastSolvedDate: string | null;
}

export interface RoadmapMilestone {
  id: string;
  title: string;
  weeks: string;
  summary: string;
  skills: string[];
  capstone: string;
}

export interface RoadmapTrack {
  id: string;
  title: string;
  subtitle: string;
  duration: string;
  level: string;
  categorySlug: string;
  milestones: RoadmapMilestone[];
}

export const CHALLENGE_STORAGE_KEY = "codeacademy_daily_challenges_v1";
export const ROADMAP_STORAGE_KEY = "codeacademy_roadmap_progress_v1";

export const PLAYGROUND_TEMPLATES: PlaygroundTemplate[] = [
  {
    id: "quicksort",
    title: "الگوریتم QuickSort",
    badge: "الگوریتم",
    description: "پیاده‌سازی مرتب‌سازی سریع به روش تقسیم و حل با نمایش مراحل اجرا.",
    code: `// الگوریتم مرتب‌سازی سریع (QuickSort)
function quickSort(arr) {
  if (arr.length <= 1) return arr;
  const pivot = arr[arr.length - 1];
  const left = [];
  const right = [];

  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] < pivot) left.push(arr[i]);
    else right.push(arr[i]);
  }
  return [...quickSort(left), pivot, ...quickSort(right)];
}

const scores = [84, 21, 96, 45, 12, 73, 58];
console.log("آرایه ورودی:", scores);
const sorted = quickSort(scores);
console.log("آرایه مرتب‌شده:", sorted);
return sorted;`,
  },
  {
    id: "password-audit",
    title: "تحلیلگر امنیت رمز عبور",
    badge: "امنیت سایبری",
    description: "ارزیابی آنتروپی و قدرت رمز عبور براساس استانداردهای OWASP.",
    code: `// تحلیلگر هوشمند قدرت رمز عبور
function auditPassword(pass) {
  const checks = {
    length: pass.length >= 10,
    upper: /[A-Z]/.test(pass),
    lower: /[a-z]/.test(pass),
    digit: /[0-9]/.test(pass),
    symbol: /[^A-Za-z0-9]/.test(pass),
  };

  const score = Object.values(checks).filter(Boolean).length * 20;
  const status = score >= 80 ? "ایمن (Strong)" : score >= 60 ? "متوسط (Medium)" : "ضعیف (Weak)";
  return { password: "*".repeat(pass.length), score, status, checks };
}

for (const sample of ["123456", "Cyber2025", "C0de@cademy#2026"]) {
  const report = auditPassword(sample);
  console.log(\`امتیاز \${report.score}/100 -> \${report.status}\`);
}`,
  },
  {
    id: "lru-cache",
    title: "حافظه کش LRU",
    badge: "معماری بک‌اند",
    description: "شبیه‌سازی ساختار داده LRU Cache با پیچیدگی زمانی O(1) با Map.",
    code: `// پیاده‌سازی LRU Cache با پیچیدگی O(1)
class LRUCache {
  constructor(limit = 3) {
    this.limit = limit;
    this.cache = new Map();
  }
  get(key) {
    if (!this.cache.has(key)) return -1;
    const val = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }
  put(key, val) {
    if (this.cache.has(key)) this.cache.delete(key);
    else if (this.cache.size >= this.limit) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, val);
  }
}

const cache = new LRUCache(2);
cache.put("course:1", "Next.js 15");
cache.put("course:2", "AI & LLM");
console.log("خواندن course:1 ->", cache.get("course:1"));
cache.put("course:3", "Cyber Security");
console.log("کلیدهای فعال در کش:", [...cache.cache.keys()]);`,
  },
  {
    id: "sales-analytics",
    title: "تحلیلگر آمار دوره‌ها",
    badge: "داده و جاوااسکریپت",
    description: "محاسبه درآمد، میانگین امتیاز و رتبه‌بندی دوره‌ها با متدهای آرایه.",
    code: `// تحلیل عملکرد بوت‌کمپ‌ها
const bootcamps = [
  { name: "Next.js 15", students: 1420, rating: 4.9 },
  { name: "AI & RAG", students: 980, rating: 4.8 },
  { name: "Cyber Pentest", students: 760, rating: 4.95 },
];

const totalStudents = bootcamps.reduce((sum, b) => sum + b.students, 0);
const avgRating = (
  bootcamps.reduce((sum, b) => sum + b.rating, 0) / bootcamps.length
).toFixed(2);

const topBootcamp = [...bootcamps].sort((a, b) => b.rating - a.rating)[0];
console.log("مجموع دانشجویان:", totalStudents);
console.log("میانگین رضایت:", avgRating, "از ۵");
console.log("بالاترین امتیاز:", topBootcamp.name);`,
  },
];

export const DAILY_CHALLENGES: DailyChallengeItem[] = [
  {
    id: "sum-even-numbers",
    title: "مجموع اعداد زوج",
    difficulty: "مبتدی",
    xp: 120,
    category: "جاوااسکریپت پایه",
    description:
      "تابعی به نام sumEvens بنویسید که یک آرایه از اعداد دریافت کند و مجموع تمام اعداد زوج موجود در آن را برگرداند.",
    functionName: "sumEvens",
    hint: "از متد filter برای انتخاب اعداد بخش‌پذیر بر ۲ (n % 2 === 0) و سپس reduce برای جمع آن‌ها استفاده کنید.",
    starterCode: `function sumEvens(nums) {
  // مجموع اعداد زوج آرایه nums را برگردانید
  let sum = 0;
  for (const n of nums) {
    // شرط زوج بودن را تکمیل کنید
  }
  return sum;
}`,
    solutionCode: `function sumEvens(nums) {
  return nums.filter((n) => n % 2 === 0).reduce((acc, n) => acc + n, 0);
}`,
    testCases: [
      { label: "آرایه ترکیبی [1, 2, 3, 4, 6]", args: [[1, 2, 3, 4, 6]], expected: 12 },
      { label: "بدون عدد زوج [1, 3, 5]", args: [[1, 3, 5]], expected: 0 },
      { label: "اعداد منفی و صفر [-4, 0, 10, 3]", args: [[-4, 0, 10, 3]], expected: 6 },
    ],
  },
  {
    id: "is-balanced-brackets",
    title: "اعتبارسنجی پرانتزهای متوازن",
    difficulty: "متوسط",
    xp: 220,
    category: "ساختمان داده (Stack)",
    description:
      "تابعی به نام isBalanced بنویسید که یک رشته شامل کاراکترهای ()[]{} دریافت کند و بررسی کند آیا تمام پرانتزها به‌درستی باز و بسته شده‌اند یا خیر.",
    functionName: "isBalanced",
    hint: "از یک آرایه به عنوان پشته (Stack) استفاده کنید؛ هنگام دیدن کاراکتر باز آن را push کنید و هنگام بستن با آخرین عنصر پشته تطبیق دهید.",
    starterCode: `function isBalanced(str) {
  const stack = [];
  const pairs = { ")": "(", "]": "[", "}": "{" };
  // منطق بررسی توازن پرانتزها را بنویسید
  return false;
}`,
    solutionCode: `function isBalanced(str) {
  const stack = [];
  const pairs = { ")": "(", "]": "[", "}": "{" };
  for (const ch of str) {
    if ("([{".includes(ch)) stack.push(ch);
    else if (pairs[ch] && stack.pop() !== pairs[ch]) return false;
  }
  return stack.length === 0;
}`,
    testCases: [
      { label: "تودرتو معتبر '({[]})'", args: ["({[]})"], expected: true },
      { label: "نامرتب '([)]'", args: ["([)]"], expected: false },
      { label: "بسته نشده '(([]'", args: ["(([]"], expected: false },
    ],
  },
  {
    id: "chunk-array",
    title: "تقسیم آرایه به دسته‌های مساوی",
    difficulty: "متوسط",
    xp: 180,
    category: "الگوریتم و آرایه",
    description:
      "تابعی به نام chunkArray(items, size) بنویسید که آرایه items را به زیرآرایه‌هایی با حداکثر طول size تقسیم کند.",
    functionName: "chunkArray",
    hint: "یک حلقه for با گام i += size روی آرایه بزنید و در هر گام items.slice(i, i + size) را به نتیجه اضافه کنید.",
    starterCode: `function chunkArray(items, size) {
  if (size <= 0) return [];
  const chunks = [];
  // حلقه تقسیم آرایه را تکمیل کنید
  return chunks;
}`,
    solutionCode: `function chunkArray(items, size) {
  if (size <= 0) return [];
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}`,
    testCases: [
      {
        label: "تقسیم ۵ عنصر با سایز ۲",
        args: [[1, 2, 3, 4, 5], 2],
        expected: [[1, 2], [3, 4], [5]],
      },
      {
        label: "تقسیم دقیق ۴ عنصر با سایز ۲",
        args: [["a", "b", "c", "d"], 2],
        expected: [["a", "b"], ["c", "d"]],
      },
      {
        label: "آرایه خالی",
        args: [[], 3],
        expected: [],
      },
    ],
  },
  {
    id: "two-sum-indices",
    title: "جفت اعداد با مجموع هدف (Two Sum)",
    difficulty: "پیشرفته",
    xp: 300,
    category: "الگوریتم مصاحبه",
    description:
      "تابعی به نام twoSum(nums, target) بنویسید که اندیس دو عدد از آرایه nums را که مجموع آن‌ها برابر target است به صورت [i, j] برگرداند.",
    functionName: "twoSum",
    hint: "از یک Map برای ذخیره عدد مشاهده‌شده و اندیس آن استفاده کنید تا در زمان O(n) مکمل (target - num) را پیدا کنید.",
    starterCode: `function twoSum(nums, target) {
  const seen = new Map();
  // جفت اندیس با مجموع target را پیدا کنید
  return [];
}`,
    solutionCode: `function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return [];
}`,
    testCases: [
      { label: "[2, 7, 11, 15] هدف 9", args: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { label: "[3, 2, 4] هدف 6", args: [[3, 2, 4], 6], expected: [1, 2] },
      { label: "[5, 5] هدف 10", args: [[5, 5], 10], expected: [0, 1] },
    ],
  },
];

export const INTERACTIVE_ROADMAPS: RoadmapTrack[] = [
  {
    id: "fullstack-web",
    title: "معمار فول‌استک وب",
    subtitle: "از مبانی TypeScript تا معماری مقیاس‌پذیر Next.js و PostgreSQL",
    duration: "۶ ماه تا استخدام",
    level: "صفر تا ارشد",
    categorySlug: "frontend",
    milestones: [
      {
        id: "fs-1",
        title: "مبانی مدرن وب و TypeScript پیشرفته",
        weeks: "هفته ۱ تا ۵",
        summary:
          "تسلط بر سیستم تایپ استاتیک، الگوی طراحی کامپوننت‌ها و CSS Grid/Tailwind مدرن.",
        skills: ["TypeScript 5", "Tailwind CSS v4", "DOM & Async", "Git Flow"],
        capstone: "ساخت کتابخانه UI تایپ‌سیف و واکنش‌گرا",
      },
      {
        id: "fs-2",
        title: "React 19 و Next.js App Router",
        weeks: "هفته ۶ تا ۱۲",
        summary:
          "کار با Server Components، Server Actions، بهینه‌سازی کش و سئو فنی.",
        skills: ["React Hooks", "Server Actions", "Zustand", "Core Web Vitals"],
        capstone: "پیاده‌سازی پلتفرم فروشگاهی با پنل مدیریت لحظه‌ای",
      },
      {
        id: "fs-3",
        title: "بک‌اند Node.js، Prisma و PostgreSQL",
        weeks: "هفته ۱۳ تا ۱۹",
        summary:
          "طراحی APIهای امن REST، مدل‌سازی دیتابیس رابطه‌ای، احراز هویت JWT و کش Redis.",
        skills: ["Express / NestJS", "Prisma ORM", "PostgreSQL", "JWT & RBAC"],
        capstone: "ساخت سرویس احراز هویت و درگاه پرداخت مقیاس‌پذیر",
      },
      {
        id: "fs-4",
        title: "Docker، تست خودکار و استقرار CI/CD",
        weeks: "هفته ۲۰ تا ۲۴",
        summary:
          "کانتینرسازی اپلیکیشن، نوشتن تست‌های یکپارچه و استقرار خودکار بدون قطعی.",
        skills: ["Docker", "GitHub Actions", "Playwright", "Monitoring"],
        capstone: "استقرار کامل پروژه نهایی روی سرور ابری با مانیتورینگ",
      },
    ],
  },
  {
    id: "ai-llm-engineer",
    title: "مهندس هوش مصنوعی و LLM",
    subtitle: "طراحی پایپ‌لاین‌های RAG، فاین‌تیون مدل‌ها و ایجنت‌های هوشمند سازمانی",
    duration: "۷ ماه تا استخدام",
    level: "متوسط تا پیشرفته",
    categorySlug: "ai-data",
    milestones: [
      {
        id: "ai-1",
        title: "Python مهندسی و جبر خطی داده",
        weeks: "هفته ۱ تا ۶",
        summary:
          "ساختارهای داده سریع، NumPy، Pandas و تحلیل داده‌های واقعی با استاندارد تولید.",
        skills: ["Python 3.12", "NumPy & Pandas", "FastAPI", "Asyncio"],
        capstone: "پایپ‌لاین پاک‌سازی و تحلیل داده‌های متنی فارسی",
      },
      {
        id: "ai-2",
        title: "یادگیری ماشین و شبکه‌های عصبی با PyTorch",
        weeks: "هفته ۷ تا ۱۴",
        summary:
          "آموزش مدل‌های طبقه‌بندی، رگرسیون، معماری Transformer و ارزیابی دقیق مدل.",
        skills: ["PyTorch", "Scikit-Learn", "Transformers", "Evaluation"],
        capstone: "مدل تشخیص احساسات نظرات کاربران به زبان فارسی",
      },
      {
        id: "ai-3",
        title: "معماری RAG و پایگاه‌داده برداری",
        weeks: "هفته ۱۵ تا ۲۲",
        summary:
          "تبدیل اسناد سازمانی به Embedding، جستجوی معنایی هیبریدی و کاهش خطای توهم مدل.",
        skills: ["Vector DB", "Chunking", "Hybrid Search", "Prompt Design"],
        capstone: "دستیار هوشمند پاسخ‌گو بر اساس مستندات فنی شرکت",
      },
      {
        id: "ai-4",
        title: "ایجنت‌های خودکار و استقرار MLOps",
        weeks: "هفته ۲۳ تا ۲۸",
        summary:
          "طراحی ایجنت‌های چندابزاری، کنترل هزینه توکن، ارزیابی خودکار و مانیتورینگ.",
        skills: ["Tool Calling", "LangGraph", "Guardrails", "Docker GPU"],
        capstone: "ایجنت تحلیل کد و تولید گزارش فنی خودکار",
      },
    ],
  },
  {
    id: "cyber-security",
    title: "متخصص امنیت سایبری و باگ‌بانتی",
    subtitle: "تست نفوذ عملی وب، کشف آسیب‌پذیری‌های بحرانی و ایمن‌سازی زیرساخت",
    duration: "۵ ماه تا کسب درآمد",
    level: "صفر تا حرفه‌ای",
    categorySlug: "cybersecurity",
    milestones: [
      {
        id: "sec-1",
        title: "شبکه، لینوکس و کالبدشکافی HTTP",
        weeks: "هفته ۱ تا ۴",
        summary:
          "شناخت دقیق بسته TCP/IP، اسکریپت‌نویسی Bash، هدرهای امنیتی و پروکسی Burp Suite.",
        skills: ["Linux CLI", "TCP/IP & DNS", "HTTP/TLS", "Burp Suite"],
        capstone: "راه‌اندازی آزمایشگاه تست نفوذ ایزوله و تحلیل ترافیک",
      },
      {
        id: "sec-2",
        title: "آسیب‌پذیری‌های OWASP Top 10",
        weeks: "هفته ۵ تا ۱۰",
        summary:
          "کشف و بهره‌برداری اصولی از SQLi، XSS، IDOR، SSRF و نقص‌های کنترل دسترسی.",
        skills: ["SQL Injection", "XSS & CSRF", "IDOR / BOLA", "SSRF"],
        capstone: "ممیزی کامل یک سامانه وب آسیب‌پذیر و ارائه پچ امنیتی",
      },
      {
        id: "sec-3",
        title: "تست نفوذ API و دور زدن WAF",
        weeks: "هفته ۱۱ تا ۱۶",
        summary:
          "ارزیابی امنیت GraphQL، REST API، خطاهای منطقی پرداخت و تکنیک‌های Bypass.",
        skills: ["API Security", "JWT Attacks", "Business Logic", "Fuzzing"],
        capstone: "کشف آسیب‌پذیری‌های منطقی در محیط شبیه‌سازی‌شده بانکی",
      },
      {
        id: "sec-4",
        title: "گزارش‌نویسی حرفه‌ای و شکار باگ بانتی",
        weeks: "هفته ۱۷ تا ۲۰",
        summary:
          "روش‌شناسی Recon هدفمند، مستندسازی PoC و ثبت گزارش‌های استاندارد در پلتفرم‌ها.",
        skills: ["Recon Automation", "CVSS Scoring", "PoC Writing", "Triaging"],
        capstone: "تدوین گزارش جامع تست نفوذ با استاندارد بین‌المللی",
      },
    ],
  },
];

export function formatSandboxValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (typeof value === "function") return `[Function ${value.name || "anonymous"}]`;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function runSandboxCode(code: string): SandboxExecutionResult {
  const start = performance.now();
  const logs: SandboxLogEntry[] = [];

  const pushLog = (level: SandboxLogEntry["level"], args: unknown[]) => {
    if (logs.length >= 60) return;
    logs.push({
      level,
      text: args.map((item) => formatSandboxValue(item)).join(" "),
    });
  };

  const sandboxConsole = {
    log: (...args: unknown[]) => pushLog("log", args),
    info: (...args: unknown[]) => pushLog("log", args),
    warn: (...args: unknown[]) => pushLog("warn", args),
    error: (...args: unknown[]) => pushLog("error", args),
  };

  try {
    const fn = new Function("console", `"use strict";\n${code}`);
    const returnVal = fn(sandboxConsole);
    const durationMs = Math.max(0.1, Number((performance.now() - start).toFixed(2)));
    return {
      ok: true,
      logs,
      returnValue:
        returnVal !== undefined ? formatSandboxValue(returnVal) : undefined,
      durationMs,
    };
  } catch (err) {
    const durationMs = Math.max(0.1, Number((performance.now() - start).toFixed(2)));
    const message = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      logs,
      error: message,
      durationMs,
    };
  }
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== typeof b || a === null || b === null) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, idx) => deepEqual(val, b[idx]));
  }
  if (typeof a === "object" && typeof b === "object") {
    const aKeys = Object.keys(a as Record<string, unknown>);
    const bKeys = Object.keys(b as Record<string, unknown>);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key) =>
      deepEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key]
      )
    );
  }
  return false;
}

export function evaluateChallengeSubmission(
  challenge: DailyChallengeItem,
  userCode: string
): ChallengeEvaluationResult {
  const start = performance.now();

  try {
    const factory = new Function(
      `"use strict";\n${userCode}\nreturn typeof ${challenge.functionName} === "function" ? ${challenge.functionName} : null;`
    );
    const targetFn = factory() as ((...args: unknown[]) => unknown) | null;

    if (!targetFn) {
      return {
        allPassed: false,
        passedCount: 0,
        totalCount: challenge.testCases.length,
        outcomes: [],
        runtimeError: `تابع ${challenge.functionName} تعریف نشده است.`,
        durationMs: Math.max(0.1, Number((performance.now() - start).toFixed(2))),
      };
    }

    const outcomes: ChallengeTestOutcome[] = challenge.testCases.map((tc) => {
      try {
        const clonedArgs = JSON.parse(JSON.stringify(tc.args)) as unknown[];
        const actual = targetFn(...clonedArgs);
        const passed = deepEqual(actual, tc.expected);
        return {
          label: tc.label,
          passed,
          expected: formatSandboxValue(tc.expected),
          actual: formatSandboxValue(actual),
        };
      } catch (caseErr) {
        return {
          label: tc.label,
          passed: false,
          expected: formatSandboxValue(tc.expected),
          actual: "خطای اجرا",
          error: caseErr instanceof Error ? caseErr.message : String(caseErr),
        };
      }
    });

    const passedCount = outcomes.filter((o) => o.passed).length;
    return {
      allPassed: passedCount === challenge.testCases.length,
      passedCount,
      totalCount: challenge.testCases.length,
      outcomes,
      durationMs: Math.max(0.1, Number((performance.now() - start).toFixed(2))),
    };
  } catch (err) {
    return {
      allPassed: false,
      passedCount: 0,
      totalCount: challenge.testCases.length,
      outcomes: [],
      runtimeError: err instanceof Error ? err.message : String(err),
      durationMs: Math.max(0.1, Number((performance.now() - start).toFixed(2))),
    };
  }
}

export function getRankInfo(xp: number): {
  title: string;
  nextRankTitle: string;
  nextThreshold: number;
  progressPercent: number;
} {
  if (xp < 200) {
    return {
      title: "نوآموز کدنویسی",
      nextRankTitle: "کدنویس سایبری",
      nextThreshold: 200,
      progressPercent: Math.min(100, Math.round((xp / 200) * 100)),
    };
  }
  if (xp < 500) {
    return {
      title: "کدنویس سایبری",
      nextRankTitle: "مهندس ارشد",
      nextThreshold: 500,
      progressPercent: Math.min(100, Math.round(((xp - 200) / 300) * 100)),
    };
  }
  if (xp < 800) {
    return {
      title: "مهندس ارشد",
      nextRankTitle: "معمار کهکشانی",
      nextThreshold: 800,
      progressPercent: Math.min(100, Math.round(((xp - 500) / 300) * 100)),
    };
  }
  return {
    title: "معمار کهکشانی",
    nextRankTitle: "بالاترین سطح",
    nextThreshold: xp,
    progressPercent: 100,
  };
}

export const DEFAULT_CHALLENGE_PROGRESS: ChallengeProgressState = {
  solvedIds: [],
  xp: 0,
  streak: 1,
  lastSolvedDate: null,
};

export function applyChallengeWin(
  current: ChallengeProgressState,
  challenge: DailyChallengeItem,
  todayKey: string
): { next: ChallengeProgressState; newlySolved: boolean } {
  if (current.solvedIds.includes(challenge.id)) {
    return { next: current, newlySolved: false };
  }

  const nextStreak =
    current.lastSolvedDate === todayKey
      ? Math.max(1, current.streak)
      : current.lastSolvedDate
        ? current.streak + 1
        : 1;

  return {
    newlySolved: true,
    next: {
      solvedIds: [...current.solvedIds, challenge.id],
      xp: current.xp + challenge.xp,
      streak: nextStreak,
      lastSolvedDate: todayKey,
    },
  };
}

export function loadChallengeProgress(
  storage?: Pick<Storage, "getItem">
): ChallengeProgressState {
  try {
    const target =
      storage ??
      (typeof window !== "undefined" ? window.localStorage : undefined);
    if (!target) return { ...DEFAULT_CHALLENGE_PROGRESS };
    const raw = target.getItem(CHALLENGE_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CHALLENGE_PROGRESS };
    const parsed = JSON.parse(raw) as Partial<ChallengeProgressState>;
    return {
      solvedIds: Array.isArray(parsed.solvedIds)
        ? parsed.solvedIds.filter((id): id is string => typeof id === "string")
        : [],
      xp: typeof parsed.xp === "number" && Number.isFinite(parsed.xp) ? parsed.xp : 0,
      streak:
        typeof parsed.streak === "number" && Number.isFinite(parsed.streak)
          ? Math.max(1, parsed.streak)
          : 1,
      lastSolvedDate:
        typeof parsed.lastSolvedDate === "string" ? parsed.lastSolvedDate : null,
    };
  } catch {
    return { ...DEFAULT_CHALLENGE_PROGRESS };
  }
}

export function saveChallengeProgress(
  state: ChallengeProgressState,
  storage?: Pick<Storage, "setItem">
): void {
  try {
    const target =
      storage ??
      (typeof window !== "undefined" ? window.localStorage : undefined);
    if (!target) return;
    target.setItem(CHALLENGE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

export function loadCompletedMilestones(
  storage?: Pick<Storage, "getItem">
): string[] {
  try {
    const target =
      storage ??
      (typeof window !== "undefined" ? window.localStorage : undefined);
    if (!target) return ["fs-1"];
    const raw = target.getItem(ROADMAP_STORAGE_KEY);
    if (!raw) return ["fs-1"];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : ["fs-1"];
  } catch {
    return ["fs-1"];
  }
}

export function saveCompletedMilestones(
  ids: string[],
  storage?: Pick<Storage, "setItem">
): void {
  try {
    const target =
      storage ??
      (typeof window !== "undefined" ? window.localStorage : undefined);
    if (!target) return;
    target.setItem(ROADMAP_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Ignore storage errors
  }
}

export function computeTrackProgress(
  track: RoadmapTrack,
  completedIds: string[]
): { completed: number; total: number; percent: number } {
  const total = track.milestones.length;
  if (total === 0) return { completed: 0, total: 0, percent: 0 };
  const completed = track.milestones.filter((m) =>
    completedIds.includes(m.id)
  ).length;
  return {
    completed,
    total,
    percent: Math.round((completed / total) * 100),
  };
}
