import React from "react";
import { Toaster } from "sonner";
import { Link, RouterProvider, useRouter } from "./router";
import { AuthProvider, useAuth } from "./context/AuthContext";
import {
  UserPreferencesProvider,
  useUserPreferences,
} from "./context/UserPreferencesContext";
import { Header } from "./components/layout/Header";
import { CartDrawer } from "./components/layout/CartDrawer";
import { Footer } from "./components/layout/Footer";
import { HomePage } from "./pages/HomePage";
import { CoursesPage } from "./pages/CoursesPage";
import { CourseDetailPage } from "./pages/CourseDetailPage";
import { CartPage } from "./pages/CartPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { AdminPage } from "./pages/AdminPage";

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
  const { settings } = useAuth();
  const { prefs } = useUserPreferences();

  return (
    <div
      dir="rtl"
      className="min-h-screen flex flex-col bg-[var(--site-bg)] text-slate-900 dark:text-slate-100 antialiased selection:bg-[var(--accent-500)] selection:text-white"
    >
      {settings.showAnnouncementBar && settings.announcementText.trim() && (
        <div className="bg-[var(--accent-600)] px-4 py-2 text-center text-xs font-bold text-white">
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
      <Header />
      <CartDrawer />
      <main className="flex-1">
        <AppRoutes />
      </main>
      <Footer />
      <Toaster
        position="bottom-left"
        dir="rtl"
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
