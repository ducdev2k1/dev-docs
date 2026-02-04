<template>
  <header
    class="fixed top-0 right-0 left-0 z-30 flex items-center justify-between h-14 px-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800 lg:left-64"
  >
    <button
      type="button"
      class="lg:hidden p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
      aria-label="Mở menu"
      @click="emits('toggle-menu')"
    >
      <svg
        class="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    </button>
    <span
      class="text-sm font-medium text-gray-700 dark:text-gray-300 truncate flex-1 lg:pl-4"
    >
      {{ title }}
    </span>
  </header>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
  }>(),
  { title: "Khóa học" }
);

const emits = defineEmits<{
  (e: "toggle-menu"): void;
}>();
</script>
