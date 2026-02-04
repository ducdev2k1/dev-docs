<template>
  <aside
    class="fixed top-0 left-0 z-40 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-transform duration-300 lg:translate-x-0"
    :class="{ '-translate-x-full': !isOpen }"
  >
    <div
      class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800"
    >
      <div class="flex flex-col min-w-0">
        <router-link
          :to="courseSlug ? `/course/${courseSlug}/doc/README` : '/'"
          class="font-semibold text-gray-900 dark:text-white truncate"
          @click="handleClose"
        >
          {{ courseSlug ? "Khóa học" : "Trang chủ" }}
        </router-link>
        <router-link
          v-if="courseSlug"
          to="/"
          class="text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mt-0.5 truncate"
          @click="handleClose"
        >
          ← Tất cả khóa học
        </router-link>
      </div>
      <button
        type="button"
        class="lg:hidden p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        aria-label="Đóng menu"
        @click="emits('close')"
      >
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>

    <nav class="flex-1 overflow-y-auto py-4">
      <ul class="space-y-0.5 px-2">
        <li v-for="doc in docList" :key="doc.slug">
          <router-link
            :to="doc.path"
            class="block px-4 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            active-class="toc-active bg-gray-100 dark:bg-gray-800"
            @click="handleClose"
          >
            {{ doc.title }}
          </router-link>
        </li>
      </ul>
    </nav>

    <!-- Theme toggle -->
    <div class="p-4 border-t border-gray-200 dark:border-gray-800">
      <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">Giao diện</p>
      <div class="flex gap-2">
        <button
          type="button"
          class="flex-1 px-3 py-2 text-xs rounded-lg transition-colors"
          :class="
            theme === 'light'
              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          "
          @click="emits('update:theme', 'light')"
        >
          Sáng
        </button>
        <button
          type="button"
          class="flex-1 px-3 py-2 text-xs rounded-lg transition-colors"
          :class="
            theme === 'dark'
              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          "
          @click="emits('update:theme', 'dark')"
        >
          Tối
        </button>
        <button
          type="button"
          class="flex-1 px-3 py-2 text-xs rounded-lg transition-colors"
          :class="
            theme === 'auto'
              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          "
          @click="emits('update:theme', 'auto')"
        >
          Auto
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { DocItem } from "@/composables/useDocs";

defineProps<{
  isOpen: boolean;
  theme: string;
  docList: DocItem[];
  courseSlug: string;
}>();

const emits = defineEmits<{
  (e: "close"): void;
  (e: "update:theme", value: string): void;
}>();

function handleClose() {
  const articleContent = document.getElementById("article-content");
  if (articleContent) {
    articleContent.scrollTo({ top: 0, behavior: "smooth" });
  }
  emits("close");
}
</script>
