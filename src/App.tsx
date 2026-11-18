import React from "react";
import { Toaster } from "sonner";
import { Link, RouterProvider, useRouter } from "./router";
import { AuthProvider, useAuth } from "./context/AuthContext";
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

  return (
    <div
      dir="rtl"
      className="min-h-screen flex flex-col bg-[var(--site-bg,#0f172a)] text-slate-100 antialiased selection:bg-indigo-500 selection:text-white"
    >
      {settings.showAnnouncementBar && settings.announcementText.trim() && (
        <div className="bg-indigo-600 px-4 py-2 text-center text-xs font-bold text-white">
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
        theme="dark"
        richColors
        toastOptions={{
          style: {
            fontFamily: "var(--font-sans)",
            background: "var(--site-bg, #0F172A)",
            border: "1px solid var(--color-slate-800, #1E293B)",
            color: "#F8FAFC",
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
        <AppShell />
      </AuthProvider>
    </RouterProvider>
  );
}
