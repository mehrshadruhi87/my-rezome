import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface RouterContextValue {
  pathname: string;
  search: string;
  hash: string;
  push: (to: string) => void;
  replace: (to: string) => void;
}

const RouterContext = createContext<RouterContextValue | null>(null);

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [locationState, setLocationState] = useState(() => ({
    pathname: window.location.pathname || "/",
    search: window.location.search || "",
    hash: window.location.hash || "",
  }));

  useEffect(() => {
    const onPopState = () => {
      setLocationState({
        pathname: window.location.pathname || "/",
        search: window.location.search || "",
        hash: window.location.hash || "",
      });
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = useCallback((to: string, replaceMode = false) => {
    const url = new URL(to, window.location.origin);
    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    if (replaceMode) {
      window.history.replaceState({}, "", nextUrl);
    } else {
      window.history.pushState({}, "", nextUrl);
    }
    setLocationState({
      pathname: url.pathname || "/",
      search: url.search || "",
      hash: url.hash || "",
    });
    if (url.hash) {
      const id = url.hash.slice(1);
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const push = useCallback((to: string) => navigate(to, false), [navigate]);
  const replace = useCallback((to: string) => navigate(to, true), [navigate]);

  const value = useMemo(
    () => ({ ...locationState, push, replace }),
    [locationState, push, replace]
  );

  return (
    <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
  );
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) {
    throw new Error("useRouter must be used inside RouterProvider");
  }
  return ctx;
}

export function useSearchParams(): URLSearchParams {
  const { search } = useRouter();
  return useMemo(() => new URLSearchParams(search), [search]);
}

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

export function Link({ href, onClick, children, ...rest }: LinkProps) {
  const { push } = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) onClick(e);
    if (
      e.defaultPrevented ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      rest.target === "_blank"
    ) {
      return;
    }
    if (href.startsWith("http://") || href.startsWith("https://")) {
      return;
    }
    e.preventDefault();
    push(href);
  };

  return (
    <a href={href} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
