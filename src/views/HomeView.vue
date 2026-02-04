<template>
  <div class="min-h-screen">
    <header
      class="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur"
    >
      <div class="max-w-5xl mx-auto px-6 py-8">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Khóa học của tôi
        </h1>
        <p class="mt-1 text-gray-600 dark:text-gray-400">
          Chọn một khóa học để bắt đầu.
        </p>
      </div>
    </header>

    <main class="max-w-5xl mx-auto px-6 py-10">
      <div v-if="loading" class="flex justify-center py-20">
        <p class="text-gray-500 dark:text-gray-400">Đang tải...</p>
      </div>
      <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <router-link
          v-for="course in courses"
          :key="course.slug"
          :to="`/course/${course.slug}/doc/README`"
          class="group block rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition-all duration-200"
        >
          <div
            class="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50 transition-colors"
          >
            <svg
              class="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h2
            class="mt-4 text-lg font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
          >
            {{ course.title }}
          </h2>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
            {{ course.description }}
          </p>
          <span
            class="mt-4 inline-flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 group-hover:underline"
          >
            Xem khóa học
            <svg
              class="ml-1 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </span>
        </router-link>
      </div>

      <p
        v-if="!loading && courses.length === 0"
        class="text-center text-gray-500 dark:text-gray-400 py-12"
      >
        Chưa có khóa học nào. Thêm khóa trong folder
        <code class="rounded bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5"
          >courses/</code
        >.
      </p>
    </main>
  </div>
</template>

<script setup lang="ts">
import type { CourseItem } from "@/composables/useCourses";
import { getCourses } from "@/composables/useCourses";
import { onMounted, ref } from "vue";

const loading = ref(true);
const courses = ref<CourseItem[]>([]);

onMounted(async () => {
  courses.value = await getCourses();
  loading.value = false;
});
</script>
