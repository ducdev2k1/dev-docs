import { onMounted, ref, watch } from "vue";

export type Theme = "light" | "dark" | "auto";

export function useTheme() {
  const theme = ref<Theme>("auto");

  const applyTheme = () => {
    const root = window.document.documentElement;
    const isDark =
      theme.value === "dark" ||
      (theme.value === "auto" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  watch(theme, () => {
    localStorage.setItem("theme", theme.value);
    applyTheme();
  });

  onMounted(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    if (savedTheme && ["light", "dark", "auto"].includes(savedTheme)) {
      theme.value = savedTheme;
    }
    applyTheme();

    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", () => {
        if (theme.value === "auto") applyTheme();
      });
  });

  return {
    theme,
    applyTheme,
  };
}
