<template>
  <div class="min-h-screen">
    <div v-if="loading" class="flex items-center justify-center min-h-[60vh]">
      <p class="text-gray-500 dark:text-gray-400">Đang tải...</p>
    </div>
    <div v-else-if="error" class="p-8">
      <p class="text-red-600 dark:text-red-400">{{ error }}</p>
      <router-link
        :to="courseSlug ? `/course/${courseSlug}/doc/README` : '/'"
        class="text-indigo-600 dark:text-indigo-400 mt-2 inline-block"
      >
        ← {{ courseSlug ? "Về khóa học" : "Về trang chủ" }}
      </router-link>
    </div>
    <div
      v-else
      class="flex gap-8 w-full pr-4 mx-auto xl:min-h-0 xl:flex-1 xl:overflow-hidden"
    >
      <main
        id="article-content"
        class="markdown-body flex-1 min-w-0 px-6 py-8 lg:px-12 xl:overflow-y-auto xl:max-h-[calc(100vh-3.5rem)]"
      >
        <template v-for="(part, i) in parts" :key="i">
          <div
            v-if="part.type === 'html'"
            v-html="part.content"
            class="doc-segment"
          />
          <CodeBlock
            v-else
            :code="part.data.code"
            :lang="part.data.lang"
            :highlighted="part.data.highlighted"
          />
        </template>
      </main>
      <TableOfContents :content-ready="!loading && !error" />
    </div>
  </div>
</template>

<script setup lang="ts">
import CodeBlock from "@/components/CodeBlock.vue";
import TableOfContents from "@/components/TableOfContents.vue";
import { getCourseMeta } from "@/composables/useCourses";
import { getDocBySlug, getDocContent } from "@/composables/useDocs";
import type { CodeBlockData } from "@/utils/markdown";
import { renderMarkdown, splitHtmlByCodeBlocks } from "@/utils/markdown";
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const loading = ref(true);
const error = ref("");
const raw = ref("");
const parts = ref<
  Array<
    { type: "html"; content: string } | { type: "code"; data: CodeBlockData }
  >
>([]);

const courseSlug = computed(() => {
  const s = route.params.courseSlug;
  return typeof s === "string" ? s : Array.isArray(s) ? s[0] : "";
});

const docSlug = computed(() => {
  const s = route.params.docSlug;
  const raw = typeof s === "string" ? s : Array.isArray(s) ? s[0] : "";
  return raw || "README";
});

async function load() {
  loading.value = true;
  error.value = "";
  if (!courseSlug.value) {
    error.value = "Thiếu khóa học.";
    loading.value = false;
    return;
  }
  const meta = await getCourseMeta(courseSlug.value);
  if (!meta) {
    error.value = "Không tìm thấy khóa học.";
    loading.value = false;
    return;
  }
  const doc = getDocBySlug(meta, docSlug.value);
  if (!doc && docSlug.value !== "README" && docSlug.value !== "index") {
    error.value = "Không tìm thấy tài liệu.";
    loading.value = false;
    return;
  }
  const actualDocSlug = docSlug.value === "index" ? "README" : docSlug.value;
  try {
    raw.value = await getDocContent(courseSlug.value, actualDocSlug);
    const { html, codeBlocks } = renderMarkdown(raw.value);
    parts.value = splitHtmlByCodeBlocks(html, codeBlocks);
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Lỗi tải nội dung.";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch([courseSlug, docSlug], load);
</script>
