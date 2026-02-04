<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <template v-if="meta">
      <Sidebar
        :is-open="showMobileMenu"
        :theme="theme"
        :doc-list="docList"
        :course-slug="courseSlug"
        @close="showMobileMenu = false"
        @update:theme="setTheme"
      />
      <MobileHeader
        :title="meta.title"
        @toggle-menu="showMobileMenu = !showMobileMenu"
      />
      <div
        class="lg:pl-64 pt-14 xl:h-[calc(100vh-3.5rem)] xl:overflow-hidden xl:flex xl:flex-col"
      >
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
      <div
        v-if="showMobileMenu"
        class="fixed inset-0 z-30 bg-black/50 lg:hidden"
        aria-hidden="true"
        @click="showMobileMenu = false"
      />
    </template>
    <div v-else class="flex items-center justify-center min-h-[60vh]">
      <p class="text-gray-500 dark:text-gray-400">Đang tải...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CourseMeta } from "@/composables/useCourses";
import { getCourseMeta } from "@/composables/useCourses";
import type { DocItem } from "@/composables/useDocs";
import { buildDocList } from "@/composables/useDocs";
import { useTheme } from "@/composables/useTheme";
import MobileHeader from "@/layouts/MobileHeader.vue";
import Sidebar from "@/layouts/Sidebar.vue";
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const { theme } = useTheme();
const showMobileMenu = ref(false);
const meta = ref<CourseMeta | null>(null);

const courseSlug = computed(() => {
  const s = route.params.courseSlug;
  return typeof s === "string" ? s : Array.isArray(s) ? s[0] : "";
});

const docList = computed((): DocItem[] => {
  return meta.value ? buildDocList(meta.value) : [];
});

function setTheme(v: string) {
  theme.value = v as "light" | "dark" | "auto";
}

async function loadMeta() {
  if (!courseSlug.value) return;
  meta.value = await getCourseMeta(courseSlug.value);
}

watch(courseSlug, loadMeta, { immediate: true });
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
