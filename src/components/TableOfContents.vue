<template>
  <nav
    class="sticky top-6 max-h-[calc(100vh-3rem)] overflow-auto pr-6 hidden xl:block w-56 shrink-0 pt-4"
  >
    <h3
      class="font-semibold text-gray-900 dark:text-gray-100 mb-4 uppercase text-xs tracking-wider"
    >
      Mục lục
    </h3>
    <ul v-if="headers.length" class="space-y-1.5 text-sm pl-4">
      <li v-for="header in headers" :key="header.id">
        <a
          :href="`#${header.id}`"
          class="block py-1 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200 relative"
          :class="{
            'pl-0': header.level === 2,
            'pl-4': header.level === 3,
            'pl-6': header.level === 4,
            'pl-8': header.level >= 5,
            'toc-active': activeId === header.id,
          }"
          @click.prevent="scrollTo(header.id)"
        >
          {{ header.text }}
        </a>
      </li>
    </ul>
    <p v-else class="text-xs text-gray-500 dark:text-gray-400">
      Không có mục lục
    </p>
  </nav>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute } from "vue-router";

const props = withDefaults(
  defineProps<{
    contentReady?: boolean;
  }>(),
  { contentReady: false }
);

const route = useRoute();
const headers = ref<{ id: string; text: string; level: number }[]>([]);
const activeId = ref<string>("");
let observer: IntersectionObserver | null = null;

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/&/g, "-and-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

function extractHeaders() {
  setTimeout(() => {
    const elements = document.querySelectorAll(
      ".markdown-body h2, .markdown-body h3, .markdown-body h4, .markdown-body h5, .markdown-body h6"
    );

    headers.value = Array.from(elements).map((el) => {
      const text = el.textContent || "";
      if (!el.id) {
        el.id = slugify(text);
      }

      return {
        id: el.id,
        text,
        level: parseInt(el.tagName.substring(1), 10),
      };
    });

    setupObserver();
  }, 100);
}

function setupObserver() {
  if (observer) {
    observer.disconnect();
  }

  const mainContent = document.getElementById("article-content");
  if (!mainContent) return;

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activeId.value = entry.target.id;
        }
      });
    },
    {
      root: mainContent,
      rootMargin: "-80px 0px -80% 0px",
      threshold: 0,
    }
  );

  headers.value.forEach((header) => {
    const el = document.getElementById(header.id);
    if (el) {
      observer?.observe(el);
    }
  });
}

function scrollTo(id: string) {
  const el = document.getElementById(id);
  const mainContent = document.getElementById("article-content");

  if (el && mainContent) {
    const elementTop = el.getBoundingClientRect().top;
    const containerTop = mainContent.getBoundingClientRect().top;
    const scrollTop = mainContent.scrollTop;
    const offsetPosition = scrollTop + (elementTop - containerTop) - 80;

    mainContent.scrollTo({
      top: Math.max(0, offsetPosition),
      behavior: "smooth",
    });

    setTimeout(() => {
      history.pushState(null, "", `#${id}`);
      activeId.value = id;
    }, 100);
  }
}

onMounted(() => {
  extractHeaders();

  if (window.location.hash) {
    const id = window.location.hash.substring(1);
    setTimeout(() => scrollTo(id), 500);
  }
});

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
  }
});

watch(
  () => route.path,
  () => {
    activeId.value = "";
    extractHeaders();
  }
);

watch(
  () => route.params.docSlug,
  () => {
    activeId.value = "";
    extractHeaders();
  }
);

watch(
  () => props.contentReady,
  (ready) => {
    if (ready) {
      activeId.value = "";
      extractHeaders();
    }
  }
);
</script>
