export interface CourseMeta {
  slug: string;
  title: string;
  description: string;
  docOrder: string[];
  titleMap: Record<string, string>;
}

export interface CourseItem {
  slug: string;
  title: string;
  description: string;
}

const courseMetaLoaders = import.meta.glob<CourseMeta>(
  "../../courses/*/meta.json",
  { import: "default" }
);

function getSlugFromKey(key: string): string {
  return key.replace("../../courses/", "").replace("/meta.json", "");
}

export async function getCourses(): Promise<CourseItem[]> {
  const list: CourseItem[] = [];
  for (const key of Object.keys(courseMetaLoaders)) {
    if (key.includes("_template")) continue;
    const slug = getSlugFromKey(key);
    const loader = courseMetaLoaders[key];
    if (!loader) continue;
    const meta = await loader();
    list.push({
      slug,
      title: meta.title,
      description: meta.description,
    });
  }
  return list.sort((a, b) => a.title.localeCompare(b.title));
}

export async function getCourseMeta(
  courseSlug: string
): Promise<CourseMeta | null> {
  const path = `../../courses/${courseSlug}/meta.json`;
  const loader = courseMetaLoaders[path];
  if (!loader) return null;
  return loader() as Promise<CourseMeta>;
}
