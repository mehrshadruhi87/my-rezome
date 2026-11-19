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

export interface HtmlCssTemplate {
  id: string;
  title: string;
  badge: string;
  description: string;
  html: string;
  css: string;
}

export interface RoadmapMilestone {
  id: string;
  title: string;
  weeks: string;
  summary: string;
  prerequisites: string[];
  skills: string[];
  capstone: string;
  recommendedCourses: Array<{ title: string; slug: string }>;
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

export const HTML_CSS_TEMPLATES: HtmlCssTemplate[] = [
  {
    id: "cyber-card",
    title: "کارت شیشه‌ای نئونی",
    badge: "CSS مدرن",
    description: "طراحی کارت محصول تعاملی با افکت شیشه‌ای و گرادیانت نئونی.",
    html: `<main class="stage" dir="rtl">
  <article class="card">
    <span class="tag">بوت‌کمپ ویژه ۱۴۰۵</span>
    <h1>معماری رابط کاربری مدرن</h1>
    <p>با ترکیب HTML معنایی و CSS Grid رابط‌های فوق‌سریع و واکنش‌گرا بسازید.</p>
    <div class="metrics">
      <div><strong>۴۲+</strong><span>پروژه واقعی</span></div>
      <div><strong>۴.۹</strong><span>رضایت دانشجویان</span></div>
    </div>
    <button class="cta">شروع یادگیری عملی</button>
  </article>
</main>`,
    css: `body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at top right, #1e293b, #020617 70%);
  font-family: Vazirmatn, Tahoma, sans-serif;
  color: #f8fafc;
  padding: 24px;
  box-sizing: border-box;
}
.card {
  width: min(100%, 360px);
  padding: 28px;
  border-radius: 22px;
  background: rgba(15, 23, 42, 0.78);
  border: 1px solid rgba(56, 189, 248, 0.35);
  box-shadow: 0 24px 48px -18px rgba(14, 165, 233, 0.4);
}
.tag {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  color: #38bdf8;
  margin-bottom: 10px;
}
h1 {
  margin: 0 0 10px;
  font-size: 22px;
  background: linear-gradient(90deg, #38bdf8, #818cf8, #34d399);
  -webkit-background-clip: text;
  color: transparent;
}
p {
  margin: 0 0 20px;
  font-size: 14px;
  line-height: 1.8;
  color: #cbd5e1;
}
.metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}
.metrics div {
  padding: 12px;
  border-radius: 14px;
  background: rgba(30, 41, 59, 0.75);
  border: 1px solid rgba(148, 163, 184, 0.2);
}
.metrics strong { display: block; font-size: 18px; color: #f8fafc; }
.metrics span { font-size: 12px; color: #94a3b8; }
.cta {
  width: 100%;
  border: 0;
  border-radius: 14px;
  padding: 13px 16px;
  font-family: inherit;
  font-weight: 800;
  font-size: 14px;
  color: #fff;
  cursor: pointer;
  background: linear-gradient(135deg, #2563eb, #06b6d4);
  box-shadow: 0 4px 0 #1d4ed8, 0 12px 24px rgba(37, 99, 235, 0.35);
  transition: transform 150ms ease;
}
.cta:hover { transform: translateY(-2px); }`,
  },
  {
    id: "responsive-grid",
    title: "داشبورد Grid واکنش‌گرا",
    badge: "CSS Grid",
    description: "چیدمان شبکه‌ای مدرن با کارت‌های آمار و نوار پیشرفت زنده.",
    html: `<section class="dash" dir="rtl">
  <header class="dash-head">
    <h2>پنل پیشرفت هفتگی</h2>
    <span>فصل بهار</span>
  </header>
  <div class="grid">
    <div class="tile">
      <small>ساعت مطالعه</small>
      <strong>۱۸.۵ ساعت</strong>
      <div class="bar"><i style="width: 82%"></i></div>
    </div>
    <div class="tile">
      <small>چالش‌های حل‌شده</small>
      <strong>۱۲ از ۱۵</strong>
      <div class="bar green"><i style="width: 80%"></i></div>
    </div>
    <div class="tile wide">
      <small>پروژه فعال</small>
      <strong>ساخت سیستم طراحی با Figma و CSS</strong>
      <p>بخش کامپوننت‌های فرم و گرید واکنش‌گرا تکمیل شده است.</p>
    </div>
  </div>
</section>`,
    css: `body {
  margin: 0;
  background: #f1f5f9;
  color: #0f172a;
  font-family: Vazirmatn, Tahoma, sans-serif;
  padding: 20px;
}
.dash { max-width: 520px; margin: 0 auto; }
.dash-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.dash-head h2 { margin: 0; font-size: 18px; }
.dash-head span { font-size: 12px; color: #475569; font-weight: 700; }
.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}
.tile {
  background: #e2e8f0;
  border: 1px solid #cbd5e1;
  border-radius: 16px;
  padding: 16px;
}
.tile.wide { grid-column: span 2; }
.tile small { display: block; color: #475569; font-size: 12px; margin-bottom: 6px; }
.tile strong { display: block; font-size: 17px; margin-bottom: 10px; }
.tile p { margin: 0; font-size: 13px; color: #334155; line-height: 1.7; }
.bar { height: 8px; background: #cbd5e1; border-radius: 99px; overflow: hidden; }
.bar i { display: block; height: 100%; background: #2563eb; border-radius: 99px; }
.bar.green i { background: #10b981; }`,
  },
  {
    id: "pricing-landing",
    title: "کارت پلن و دکمه سه‌بعدی",
    badge: "UI / UX",
    description: "تمرین تایپوگرافی فارسی، سایه‌پردازی سه‌بعدی و سلسله‌مراتب بصری.",
    html: `<div class="wrap" dir="rtl">
  <div class="plan">
    <div class="top">
      <h3>مسیر حرفه‌ای فرانت‌اند</h3>
      <div class="price">۳,۴۵۰,۰۰۰ <span>تومان</span></div>
    </div>
    <ul>
      <li>۶۴ ساعت ویدیوی پروژه‌محور</li>
      <li>پشتیبانی مستقیم و بررسی کد (Code Review)</li>
      <li>دسترسی دائمی به آپدیت‌های جدید</li>
    </ul>
    <a class="btn3d" href="#join">ثبت‌نام در بوت‌کمپ</a>
  </div>
</div>`,
    css: `body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #0b1120;
  color: #f8fafc;
  font-family: Vazirmatn, Tahoma, sans-serif;
  padding: 20px;
}
.plan {
  width: min(100%, 340px);
  background: #111c33;
  border: 1px solid #334155;
  border-radius: 20px;
  padding: 24px;
}
.top h3 { margin: 0 0 8px; font-size: 18px; }
.price { font-size: 24px; font-weight: 900; color: #34d399; }
.price span { font-size: 12px; color: #94a3b8; font-weight: 500; }
ul {
  list-style: none;
  padding: 0;
  margin: 18px 0 22px;
  display: grid;
  gap: 10px;
  font-size: 13px;
  color: #cbd5e1;
}
ul li::before { content: "✓ "; color: #34d399; font-weight: 900; }
.btn3d {
  display: block;
  text-align: center;
  text-decoration: none;
  padding: 12px;
  border-radius: 12px;
  background: #10b981;
  color: #022c22;
  font-weight: 900;
  box-shadow: 0 4px 0 #047857;
  transition: transform 140ms ease;
}
.btn3d:active { transform: translateY(2px); }`,
  },
];

export function buildHtmlCssPreviewDoc(html: string, css: string): string {
  const safeCss = String(css || "").replace(/<\/style>/gi, "<\\/style>");
  const safeHtml = String(html || "").replace(/<script[\s\S]*?<\/script>/gi, "");
  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; min-height: 100%; overflow-x: auto; overflow-y: auto; }
  ${safeCss}
</style>
</head>
<body>
${safeHtml}
</body>
</html>`;
}

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
  {
    id: "palindrome-clean",
    title: "تشخیص رشته متقارن (Palindrome)",
    difficulty: "مبتدی",
    xp: 140,
    category: "رشته‌ها",
    description:
      "تابعی به نام isPalindrome(text) بنویسید که بدون حساسیت به حروف بزرگ و فاصله، بررسی کند آیا رشته از دو طرف یکسان خوانده می‌شود یا خیر.",
    functionName: "isPalindrome",
    hint: "ابتدا کاراکترهای غیرحرفی را حذف و حروف را کوچک کنید، سپس با معکوس رشته مقایسه کنید.",
    starterCode: `function isPalindrome(text) {
  // رشته را پاکسازی و با معکوس آن مقایسه کنید
  return false;
}`,
    solutionCode: `function isPalindrome(text) {
  const clean = text.toLowerCase().replace(/[^a-z0-9]/g, "");
  return clean === clean.split("").reverse().join("");
}`,
    testCases: [
      { label: "'Race car'", args: ["Race car"], expected: true },
      { label: "'CodeAcademy'", args: ["CodeAcademy"], expected: false },
      { label: "'A man a plan a canal Panama'", args: ["A man a plan a canal Panama"], expected: true },
    ],
  },
  {
    id: "unique-preserving-order",
    title: "حذف تکراری‌ها با حفظ ترتیب",
    difficulty: "مبتدی",
    xp: 150,
    category: "ساختمان داده (Set)",
    description:
      "تابعی به نام uniqueValues(arr) بنویسید که عناصر تکراری آرایه را حذف کند و ترتیب اولین حضور هر عنصر را حفظ کند.",
    functionName: "uniqueValues",
    hint: "استفاده از Array.from(new Set(arr)) ساده‌ترین و سریع‌ترین راه در جاوااسکریپت است.",
    starterCode: `function uniqueValues(arr) {
  // آرایه بدون مقادیر تکراری برگردانید
  return [];
}`,
    solutionCode: `function uniqueValues(arr) {
  return Array.from(new Set(arr));
}`,
    testCases: [
      { label: "[1, 2, 2, 3, 1, 4]", args: [[1, 2, 2, 3, 1, 4]], expected: [1, 2, 3, 4] },
      { label: "['js', 'ts', 'js']", args: [["js", "ts", "js"]], expected: ["js", "ts"] },
      { label: "آرایه خالی", args: [[]], expected: [] },
    ],
  },
  {
    id: "flatten-one-level",
    title: "مسطح‌سازی عمیق آرایه",
    difficulty: "متوسط",
    xp: 210,
    category: "توابع بازگشتی",
    description:
      "تابعی به نام flattenDeep(arr) بنویسید که آرایه‌های تودرتو با هر عمقی را به یک آرایه یک‌بعدی تبدیل کند.",
    functionName: "flattenDeep",
    hint: "از متد arr.flat(Infinity) یا بازگشت (Recursion) روی Array.isArray استفاده کنید.",
    starterCode: `function flattenDeep(arr) {
  // آرایه تودرتو را به صورت کامل مسطح کنید
  return [];
}`,
    solutionCode: `function flattenDeep(arr) {
  return arr.reduce(
    (acc, item) => acc.concat(Array.isArray(item) ? flattenDeep(item) : item),
    []
  );
}`,
    testCases: [
      { label: "[1, [2, [3, 4]], 5]", args: [[1, [2, [3, 4]], 5]], expected: [1, 2, 3, 4, 5] },
      { label: "[[['a']], 'b']", args: [[[["a"]], "b"]], expected: ["a", "b"] },
      { label: "[]", args: [[]], expected: [] },
    ],
  },
  {
    id: "word-frequency",
    title: "شمارش فراوانی کلمات",
    difficulty: "متوسط",
    xp: 200,
    category: "آبجکت و پردازش متن",
    description:
      "تابعی به نام countWords(sentence) بنویسید که تعداد تکرار هر کلمه (با حروف کوچک) را در قالب یک آبجکت برگرداند.",
    functionName: "countWords",
    hint: "متن را trim و به حروف کوچک تبدیل کنید، سپس با split(/\\s+/) بشکنید و در یک آبجکت بشمارید.",
    starterCode: `function countWords(sentence) {
  const counts = {};
  // فراوانی کلمات را محاسبه کنید
  return counts;
}`,
    solutionCode: `function countWords(sentence) {
  const trimmed = sentence.trim().toLowerCase();
  if (!trimmed) return {};
  return trimmed.split(/\\s+/).reduce((acc, w) => {
    acc[w] = (acc[w] || 0) + 1;
    return acc;
  }, {});
}`,
    testCases: [
      { label: "'React Node react'", args: ["React Node react"], expected: { react: 2, node: 1 } },
      { label: "'ai ai llm'", args: ["ai ai llm"], expected: { ai: 2, llm: 1 } },
      { label: "رشته خالی", args: ["   "], expected: {} },
    ],
  },
  {
    id: "max-subarray-sum",
    title: "بیشترین مجموع زیرآرایه متوالی (Kadane)",
    difficulty: "پیشرفته",
    xp: 320,
    category: "برنامه‌نویسی پویا",
    description:
      "تابعی به نام maxSubarraySum(nums) بنویسید که بیشترین مجموع ممکن از یک زیرآرایه متوالی غیرخالی را با الگوریتم کادان محاسبه کند.",
    functionName: "maxSubarraySum",
    hint: "در هر گام current = Math.max(nums[i], current + nums[i]) و best = Math.max(best, current) را به‌روز کنید.",
    starterCode: `function maxSubarraySum(nums) {
  // بیشترین مجموع زیرآرایه متوالی را برگردانید
  return 0;
}`,
    solutionCode: `function maxSubarraySum(nums) {
  let current = nums[0];
  let best = nums[0];
  for (let i = 1; i < nums.length; i++) {
    current = Math.max(nums[i], current + nums[i]);
    best = Math.max(best, current);
  }
  return best;
}`,
    testCases: [
      { label: "[-2, 1, -3, 4, -1, 2, 1, -5, 4]", args: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: 6 },
      { label: "[5, 4, -1, 7, 8]", args: [[5, 4, -1, 7, 8]], expected: 23 },
      { label: "[-3, -1, -2]", args: [[-3, -1, -2]], expected: -1 },
    ],
  },
  {
    id: "group-by-key",
    title: "گروه‌بندی آبجکت‌ها بر اساس کلید",
    difficulty: "پیشرفته",
    xp: 280,
    category: "الگوریتم کاربردی",
    description:
      "تابعی به نام groupBy(items, key) بنویسید که آرایه‌ای از آبجکت‌ها را بر اساس مقدار ویژگی key دسته‌بندی کند.",
    functionName: "groupBy",
    hint: "با reduce برای هر آیتم مقدار item[key] را بخوانید و آیتم را در آرایه مربوط به همان کلید قرار دهید.",
    starterCode: `function groupBy(items, key) {
  const result = {};
  // آیتم‌ها را بر اساس کلید گروه‌بندی کنید
  return result;
}`,
    solutionCode: `function groupBy(items, key) {
  return items.reduce((acc, item) => {
    const groupKey = String(item[key]);
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(item);
    return acc;
  }, {});
}`,
    testCases: [
      {
        label: "گروه‌بندی بر اساس role",
        args: [
          [
            { name: "Ali", role: "dev" },
            { name: "Sara", role: "ui" },
            { name: "Reza", role: "dev" },
          ],
          "role",
        ],
        expected: {
          dev: [
            { name: "Ali", role: "dev" },
            { name: "Reza", role: "dev" },
          ],
          ui: [{ name: "Sara", role: "ui" }],
        },
      },
      { label: "آرایه خالی", args: [[], "type"], expected: {} },
    ],
  },
];

export function getTodayDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getDailyChallengesForDate(
  dateKey: string = getTodayDateKey(),
  count = 4
): DailyChallengeItem[] {
  const pool = DAILY_CHALLENGES;
  if (pool.length <= count) return [...pool];

  // Deterministic daily seed so challenges rotate automatically every day
  let hash = 0;
  for (let i = 0; i < dateKey.length; i += 1) {
    hash = (hash * 31 + dateKey.charCodeAt(i)) >>> 0;
  }
  const offset = hash % pool.length;
  const selected: DailyChallengeItem[] = [];
  for (let i = 0; i < count; i += 1) {
    selected.push(pool[(offset + i) % pool.length]);
  }
  return selected;
}

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
        prerequisites: ["آشنایی اولیه با کامپیوتر و مرورگر", "علاقه به حل مسئله"],
        skills: ["TypeScript 5", "Tailwind CSS v4", "DOM & Async", "Git Flow"],
        capstone: "ساخت کتابخانه UI تایپ‌سیف و واکنش‌گرا",
        recommendedCourses: [
          {
            title: "بوت‌کمپ جامع Next.js 15، React 19 و معماری فول‌استک",
            slug: "nextjs-15-fullstack-bootcamp",
          },
          {
            title: "مبانی الگوریتم و ساختمان داده (رایگان)",
            slug: "algorithms-data-structures-free",
          },
        ],
      },
      {
        id: "fs-2",
        title: "React 19 و Next.js App Router",
        weeks: "هفته ۶ تا ۱۲",
        summary:
          "کار با Server Components، Server Actions، بهینه‌سازی کش و سئو فنی.",
        prerequisites: ["تسلط بر جاوااسکریپت ES2024", "تایپ‌اسکریپت و Git"],
        skills: ["React Hooks", "Server Actions", "Zustand", "Core Web Vitals"],
        capstone: "پیاده‌سازی پلتفرم فروشگاهی با پنل مدیریت لحظه‌ای",
        recommendedCourses: [
          {
            title: "بوت‌کمپ جامع Next.js 15، React 19 و معماری فول‌استک",
            slug: "nextjs-15-fullstack-bootcamp",
          },
        ],
      },
      {
        id: "fs-3",
        title: "بک‌اند Node.js، Prisma و PostgreSQL",
        weeks: "هفته ۱۳ تا ۱۹",
        summary:
          "طراحی APIهای امن REST، مدل‌سازی دیتابیس رابطه‌ای، احراز هویت JWT و کش Redis.",
        prerequisites: ["آشنایی با HTTP و REST", "جاوااسکریپت آسنکرون"],
        skills: ["Express / NestJS", "Prisma ORM", "PostgreSQL", "JWT & RBAC"],
        capstone: "ساخت سرویس احراز هویت و درگاه پرداخت مقیاس‌پذیر",
        recommendedCourses: [
          {
            title: "معماری میکروسرویس و بک‌اند مقیاس‌پذیر با NestJS",
            slug: "nestjs-microservices-architecture",
          },
        ],
      },
      {
        id: "fs-4",
        title: "Docker، تست خودکار و استقرار CI/CD",
        weeks: "هفته ۲۰ تا ۲۴",
        summary:
          "کانتینرسازی اپلیکیشن، نوشتن تست‌های یکپارچه و استقرار خودکار بدون قطعی.",
        prerequisites: ["آشنایی مقدماتی با لینوکس", "پروژه بک‌اند آماده"],
        skills: ["Docker", "GitHub Actions", "Playwright", "Monitoring"],
        capstone: "استقرار کامل پروژه نهایی روی سرور ابری با مانیتورینگ",
        recommendedCourses: [
          {
            title: "آموزش جامع Docker، Kubernetes و مهندسی DevOps",
            slug: "devops-docker-kubernetes-masterclass",
          },
        ],
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
        prerequisites: ["آشنایی پایه با منطق برنامه‌نویسی", "ریاضیات دبیرستان"],
        skills: ["Python 3.12", "NumPy & Pandas", "FastAPI", "Asyncio"],
        capstone: "پایپ‌لاین پاک‌سازی و تحلیل داده‌های متنی فارسی",
        recommendedCourses: [
          {
            title: "متخصص هوش مصنوعی، پایتون، LLM و ایجنت‌های هوشمند",
            slug: "python-ai-llm-engineering",
          },
        ],
      },
      {
        id: "ai-2",
        title: "یادگیری ماشین و شبکه‌های عصبی با PyTorch",
        weeks: "هفته ۷ تا ۱۴",
        summary:
          "آموزش مدل‌های طبقه‌بندی، رگرسیون، معماری Transformer و ارزیابی دقیق مدل.",
        prerequisites: ["تسلط بر NumPy و Pandas", "آمار و احتمال پایه"],
        skills: ["PyTorch", "Scikit-Learn", "Transformers", "Evaluation"],
        capstone: "مدل تشخیص احساسات نظرات کاربران به زبان فارسی",
        recommendedCourses: [
          {
            title: "متخصص هوش مصنوعی، پایتون، LLM و ایجنت‌های هوشمند",
            slug: "python-ai-llm-engineering",
          },
        ],
      },
      {
        id: "ai-3",
        title: "معماری RAG و پایگاه‌داده برداری",
        weeks: "هفته ۱۵ تا ۲۲",
        summary:
          "تبدیل اسناد سازمانی به Embedding، جستجوی معنایی هیبریدی و کاهش خطای توهم مدل.",
        prerequisites: ["تجربه کار با APIهای مدل زبانی", "پایتون پیشرفته"],
        skills: ["Vector DB", "Chunking", "Hybrid Search", "Prompt Design"],
        capstone: "دستیار هوشمند پاسخ‌گو بر اساس مستندات فنی شرکت",
        recommendedCourses: [
          {
            title: "متخصص هوش مصنوعی، پایتون، LLM و ایجنت‌های هوشمند",
            slug: "python-ai-llm-engineering",
          },
        ],
      },
      {
        id: "ai-4",
        title: "ایجنت‌های خودکار و استقرار MLOps",
        weeks: "هفته ۲۳ تا ۲۸",
        summary:
          "طراحی ایجنت‌های چندابزاری، کنترل هزینه توکن، ارزیابی خودکار و مانیتورینگ.",
        prerequisites: ["آشنایی با Docker و سرویس‌های ابری", "معماری RAG"],
        skills: ["Tool Calling", "LangGraph", "Guardrails", "Docker GPU"],
        capstone: "ایجنت تحلیل کد و تولید گزارش فنی خودکار",
        recommendedCourses: [
          {
            title: "آموزش جامع Docker، Kubernetes و مهندسی DevOps",
            slug: "devops-docker-kubernetes-masterclass",
          },
        ],
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
        prerequisites: ["کار با خط فرمان و مفاهیم پایه وب"],
        skills: ["Linux CLI", "TCP/IP & DNS", "HTTP/TLS", "Burp Suite"],
        capstone: "راه‌اندازی آزمایشگاه تست نفوذ ایزوله و تحلیل ترافیک",
        recommendedCourses: [
          {
            title: "متخصص تست نفوذ وب و باگ بانتی (OSWE)",
            slug: "web-penetration-testing-bug-bounty",
          },
        ],
      },
      {
        id: "sec-2",
        title: "آسیب‌پذیری‌های OWASP Top 10",
        weeks: "هفته ۵ تا ۱۰",
        summary:
          "کشف و بهره‌برداری اصولی از SQLi، XSS، IDOR، SSRF و نقص‌های کنترل دسترسی.",
        prerequisites: ["درک درخواست‌های HTTP و Burp Suite", "آشنایی با SQL"],
        skills: ["SQL Injection", "XSS & CSRF", "IDOR / BOLA", "SSRF"],
        capstone: "ممیزی کامل یک سامانه وب آسیب‌پذیر و ارائه پچ امنیتی",
        recommendedCourses: [
          {
            title: "متخصص تست نفوذ وب و باگ بانتی (OSWE)",
            slug: "web-penetration-testing-bug-bounty",
          },
        ],
      },
      {
        id: "sec-3",
        title: "تست نفوذ API و دور زدن WAF",
        weeks: "هفته ۱۱ تا ۱۶",
        summary:
          "ارزیابی امنیت GraphQL، REST API، خطاهای منطقی پرداخت و تکنیک‌های Bypass.",
        prerequisites: ["تسلط بر OWASP Top 10", "مفاهیم احراز هویت JWT"],
        skills: ["API Security", "JWT Attacks", "Business Logic", "Fuzzing"],
        capstone: "کشف آسیب‌پذیری‌های منطقی در محیط شبیه‌سازی‌شده بانکی",
        recommendedCourses: [
          {
            title: "متخصص تست نفوذ وب و باگ بانتی (OSWE)",
            slug: "web-penetration-testing-bug-bounty",
          },
        ],
      },
      {
        id: "sec-4",
        title: "گزارش‌نویسی حرفه‌ای و شکار باگ بانتی",
        weeks: "هفته ۱۷ تا ۲۰",
        summary:
          "روش‌شناسی Recon هدفمند، مستندسازی PoC و ثبت گزارش‌های استاندارد در پلتفرم‌ها.",
        prerequisites: ["سابقه ممیزی حداقل ۳ هدف آزمایشگاهی"],
        skills: ["Recon Automation", "CVSS Scoring", "PoC Writing", "Triaging"],
        capstone: "تدوین گزارش جامع تست نفوذ با استاندارد بین‌المللی",
        recommendedCourses: [
          {
            title: "متخصص تست نفوذ وب و باگ بانتی (OSWE)",
            slug: "web-penetration-testing-bug-bounty",
          },
        ],
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
