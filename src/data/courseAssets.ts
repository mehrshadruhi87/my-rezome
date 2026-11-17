import imgNextjs from "../assets/images/course_nextjs_fullstack_1794952831549.jpg";
import imgAiLlm from "../assets/images/course_ai_llm_1794952832798.jpg";
import imgNestjs from "../assets/images/course_nestjs_backend_1794952832658.jpg";
import imgCybersecurity from "../assets/images/course_cybersecurity_1794952833875.jpg";
import imgDevops from "../assets/images/course_devops_k8s_1794952834411.jpg";
import imgAlgorithms from "../assets/images/course_algorithms_1794952833151.jpg";

export const DEFAULT_COURSE_THUMBNAIL = imgNextjs;

export interface CourseThumbnailPreset {
  id: string;
  label: string;
  legacyPath: string;
  src: string;
}

export const COURSE_THUMBNAIL_PRESETS: CourseThumbnailPreset[] = [
  {
    id: "nextjs",
    label: "فرانت‌اند و Next.js",
    legacyPath: "/src/assets/images/course_nextjs_fullstack_1794952831549.jpg",
    src: imgNextjs,
  },
  {
    id: "ai-llm",
    label: "هوش مصنوعی و LLM",
    legacyPath: "/src/assets/images/course_ai_llm_1794952832798.jpg",
    src: imgAiLlm,
  },
  {
    id: "nestjs",
    label: "بک‌اند و NestJS",
    legacyPath: "/src/assets/images/course_nestjs_backend_1794952832658.jpg",
    src: imgNestjs,
  },
  {
    id: "cybersecurity",
    label: "امنیت شبکه و تست نفوذ",
    legacyPath: "/src/assets/images/course_cybersecurity_1794952833875.jpg",
    src: imgCybersecurity,
  },
  {
    id: "devops",
    label: "دوآپس و کوبرنتیز",
    legacyPath: "/src/assets/images/course_devops_k8s_1794952834411.jpg",
    src: imgDevops,
  },
  {
    id: "algorithms",
    label: "الگوریتم و ساختمان داده",
    legacyPath: "/src/assets/images/course_algorithms_1794952833151.jpg",
    src: imgAlgorithms,
  },
];

const FILENAME_TO_ASSET: Record<string, string> = {
  "course_nextjs_fullstack_1794952831549.jpg": imgNextjs,
  "course_ai_llm_1794952832798.jpg": imgAiLlm,
  "course_nestjs_backend_1794952832658.jpg": imgNestjs,
  "course_cybersecurity_1794952833875.jpg": imgCybersecurity,
  "course_devops_k8s_1794952834411.jpg": imgDevops,
  "course_algorithms_1794952833151.jpg": imgAlgorithms,
};

export function resolveCourseThumbnail(raw?: string | null): string {
  const val = (raw ?? "").trim();
  if (!val) return DEFAULT_COURSE_THUMBNAIL;

  for (const [filename, bundledUrl] of Object.entries(FILENAME_TO_ASSET)) {
    if (val === filename || val.endsWith(`/${filename}`)) {
      return bundledUrl;
    }
  }

  if (
    val.startsWith("http://") ||
    val.startsWith("https://") ||
    val.startsWith("data:image/") ||
    val.startsWith("/")
  ) {
    return val;
  }

  return DEFAULT_COURSE_THUMBNAIL;
}
