import React from "react";
import { Toaster } from "sonner";
import { Link, RouterProvider, useRouter } from "./router";
import { AuthProvider, useAuth } from "./context/AuthContext";
import {
  UserPreferencesProvider,
  useUserPreferences,
} from "./context/UserPreferencesContext";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { HomePage } from "./pages/HomePage";
import { CoursesPage } from "./pages/CoursesPage";
import { CourseDetailPage } from "./pages/CourseDetailPage";
import { CartPage } from "./pages/CartPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { AdminPage } from "./pages/AdminPage";
import { InteractiveRoadmaps } from "./components/home/InteractiveRoadmaps";
import { LiveCodePlayground } from "./components/home/LiveCodePlayground";
import { DailyChallengesSection } from "./components/home/DailyChallengesSection";
import { NewsSection } from "./components/home/NewsSection";
import { PasswordRecoveryModal } from "./components/auth/PasswordRecoveryModal";
import { LiveNotificationToast } from "./components/layout/LiveNotificationToast";
import { FloatingPreferencesPill } from "./components/layout/FloatingPreferencesPill";
import {
  CODEACADEMY_REALTIME_EVENT,
  subscribeToPlatformRealtime,
  type RealtimeUpdateDetail,
} from "./lib/realtimeSync";

function DedicatedSectionPage({ children }: { children: React.ReactNode }) {
  return <div className="py-10 pb-20">{children}</div>;
}

function AppRoutes() {
  const { pathname } = useRouter();

  const cleanPath = pathname.replace(/\/+$/, "") || "/";

  if (cleanPath === "/") {
    return <HomePage />;
  }
  if (cleanPath === "/courses") {
    return <CoursesPage />;
  }
  if (cleanPath.startsWith("/courses/")) {
    const slug = cleanPath.slice("/courses/".length);
    return <CourseDetailPage slug={slug} />;
  }
  if (cleanPath === "/roadmaps") {
    return (
      <DedicatedSectionPage>
        <InteractiveRoadmaps />
      </DedicatedSectionPage>
    );
  }
  if (cleanPath === "/code-lab") {
    return (
      <DedicatedSectionPage>
        <LiveCodePlayground />
      </DedicatedSectionPage>
    );
  }
  if (cleanPath === "/challenges") {
    return (
      <DedicatedSectionPage>
        <DailyChallengesSection />
      </DedicatedSectionPage>
    );
  }
  if (cleanPath === "/news") {
    return (
      <DedicatedSectionPage>
        <NewsSection />
      </DedicatedSectionPage>
    );
  }
  if (cleanPath === "/cart") {
    return <CartPage />;
  }
  if (cleanPath === "/checkout") {
    return <CheckoutPage />;
  }
  if (cleanPath === "/auth/login") {
    return <AuthPage mode="login" />;
  }
  if (cleanPath === "/auth/register") {
    return <AuthPage mode="register" />;
  }
  if (cleanPath === "/dashboard") {
    return <DashboardPage />;
  }
  if (cleanPath === "/admin" || cleanPath.startsWith("/admin/")) {
    return <AdminPage />;
  }

  return <HomePage />;
}

function AppShell() {
  const { settings, refreshBootstrap } = useAuth();
  const { prefs, isRtl } = useUserPreferences();
  const { pathname } = useRouter();
  const cleanPath = pathname.replace(/\/+$/, "") || "/";
  const isHomeRoute = cleanPath === "/";

  React.useEffect(() => {
    const unsubscribe = subscribeToPlatformRealtime();
    const handleRealtime = (ev: Event) => {
      const detail = (ev as CustomEvent<RealtimeUpdateDetail>).detail;
      if (
        detail &&
        (detail.table === "site_settings" ||
          detail.table === "categories" ||
          detail.table === "courses" ||
          detail.table === "course_reviews")
      ) {
        void refreshBootstrap();
      }
    };
    window.addEventListener(CODEACADEMY_REALTIME_EVENT, handleRealtime);
    return () => {
      unsubscribe();
      window.removeEventListener(CODEACADEMY_REALTIME_EVENT, handleRealtime);
    };
  }, [refreshBootstrap]);

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="relative isolate min-h-screen w-full max-w-full overflow-x-clip flex flex-col bg-transparent text-slate-900 dark:text-slate-100 antialiased selection:bg-[var(--accent-500)] selection:text-white"
    >
      <Header />
      <LiveNotificationToast />
      {settings.showAnnouncementBar && settings.announcementText.trim() && (
        <div className="mt-16 bg-gradient-to-l from-[var(--accent-700)] via-[var(--accent-600)] to-[var(--accent-500)] px-4 py-2 text-center text-xs font-bold text-white">
          {settings.announcementLink ? (
            <Link
              href={settings.announcementLink}
              className="hover:underline underline-offset-4"
            >
              {settings.announcementText}
            </Link>
          ) : (
            <span>{settings.announcementText}</span>
          )}
        </div>
      )}
      <main
        className={`flex-1 w-full max-w-full ${
          isHomeRoute ? "pt-0" : "pt-16 sm:pt-20 lower-emerald-cyber-bg"
        }`}
      >
        <AppRoutes />
      </main>
      <div className="lower-emerald-cyber-bg w-full max-w-full">
        <Footer />
      </div>
      <FloatingPreferencesPill />
      <PasswordRecoveryModal />
      <Toaster
        position="bottom-right"
        dir={isRtl ? "rtl" : "ltr"}
        theme={prefs.mode}
        richColors
        toastOptions={{
          style: {
            fontFamily: "var(--font-sans)",
          },
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <RouterProvider>
      <AuthProvider>
        <UserPreferencesProvider>
          <AppShell />
        </UserPreferencesProvider>
      </AuthProvider>
    </RouterProvider>
  );
}
