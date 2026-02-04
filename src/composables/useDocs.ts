export interface DocItem {
  slug: string;
  path: string;
  title: string;
}

export interface CourseMeta {
  slug: string;
  title: string;
  description: string;
  docOrder: string[];
  titleMap: Record<string, string>;
}

const docModules = import.meta.glob<string>("../../courses/*/doc/*.md", {
  query: "?raw",
  import: "default",
});

function docPath(courseSlug: string, docSlug: string): string {
  const file = docSlug === "README" || docSlug === "index" ? "README" : docSlug;
  return `../../courses/${courseSlug}/doc/${file}.md`;
}

export async function getDocContent(
  courseSlug: string,
  docSlug: string
): Promise<string> {
  const path = docPath(courseSlug, docSlug);
  const loader = docModules[path];
  if (!loader) {
    throw new Error(`Doc not found: ${courseSlug}/${docSlug}`);
  }
  return loader() as Promise<string>;
}

export function buildDocList(meta: CourseMeta): DocItem[] {
  return meta.docOrder.map((slug) => ({
    slug,
    path: `/course/${meta.slug}/doc/${slug}`,
    title: meta.titleMap[slug] ?? slug,
  }));
}

export function getDocBySlug(
  meta: CourseMeta,
  docSlug: string
): DocItem | undefined {
  return buildDocList(meta).find((d) => d.slug === docSlug);
}
