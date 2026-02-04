#!/usr/bin/env node
/**
 * Script tạo/cập nhật file meta.json cho khóa học trong courses/
 *
 * - slug: tên folder khóa
 * - title, description: lấy từ README.md (heading đầu tiên + đoạn đầu)
 * - docOrder: README trước, sau đó các file .md khác xếp theo tên
 * - titleMap: mỗi bài = heading đầu tiên trong file .md (có thể sửa tay sau cho gọn)
 *
 * Cách dùng:
 *   node scripts/gen-meta.cjs                     # Gen cho TẤT CẢ khóa (trừ _template)
 *   node scripts/gen-meta.cjs websocket-sse-socketio   # Chỉ gen cho 1 khóa
 *   pnpm run gen-meta
 *   pnpm run gen-meta -- websocket-sse-socketio
 */

const fs = require('fs')
const path = require('path')

const COURSES_DIR = path.join(__dirname, '..', 'courses')

/** Lấy dòng heading đầu tiên (## hoặc #) trong file */
function getFirstHeading(content) {
  const match = content.match(/^#+\s+(.+)$/m)
  return match ? match[1].trim() : null
}

function getFirstParagraphAfterH1(content) {
  const lines = content.split('\n')
  let afterHeading = false
  const paragraph = []
  for (const line of lines) {
    if (/^#+\s+/.test(line)) {
      afterHeading = true
      continue
    }
    if (afterHeading) {
      const t = line.trim()
      if (t.startsWith('>')) {
        paragraph.push(t.replace(/^>\s*/, ''))
      } else if (t && !t.startsWith('#') && !t.startsWith('-') && !t.startsWith('*')) {
        paragraph.push(t)
      }
      if (paragraph.length >= 1 && t === '') break
    }
  }
  return paragraph.join(' ').trim().slice(0, 200) || ''
}

function slugToTitle(slug) {
  return slug
    .replace(/^README$/i, 'Trang chủ')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function getDocSlug(filename) {
  return filename.replace(/\.md$/i, '')
}

function getDocOrder(files) {
  const hasReadme = files.some((f) => f.toLowerCase() === 'readme.md')
  const rest = files
    .filter((f) => f.toLowerCase() !== 'readme.md')
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  return hasReadme ? ['README', ...rest.map(getDocSlug)] : rest.map(getDocSlug)
}

function generateMetaForCourse(courseSlug) {
  const coursePath = path.join(COURSES_DIR, courseSlug)
  const docPath = path.join(coursePath, 'doc')

  if (!fs.existsSync(docPath) || !fs.statSync(docPath).isDirectory()) {
    console.warn(`[${courseSlug}] Bỏ qua: không có thư mục doc/`)
    return null
  }

  const files = fs.readdirSync(docPath).filter((f) => f.endsWith('.md'))
  if (files.length === 0) {
    console.warn(`[${courseSlug}] Bỏ qua: không có file .md trong doc/`)
    return null
  }

  const docOrder = getDocOrder(files)
  const titleMap = {}
  let title = slugToTitle(courseSlug)
  let description = ''

  for (const file of files) {
    const slug = getDocSlug(file)
    const fullPath = path.join(docPath, file)
    const content = fs.readFileSync(fullPath, 'utf-8')
    const heading = getFirstHeading(content)
    titleMap[slug] = heading || slugToTitle(slug)

    if (file.toLowerCase() === 'readme.md') {
      if (heading) title = heading
      description = getFirstParagraphAfterH1(content)
    }
  }

  if (!description) description = `Khóa học: ${title}`

  const meta = {
    slug: courseSlug,
    title,
    description: description || `Khóa học: ${title}`,
    docOrder,
    titleMap,
  }

  return meta
}

function main() {
  const singleSlug = process.argv[2]

  let courseSlugs = []
  if (singleSlug) {
    const coursePath = path.join(COURSES_DIR, singleSlug)
    if (!fs.existsSync(coursePath)) {
      console.error(`Không tìm thấy khóa: ${singleSlug}`)
      process.exit(1)
    }
    courseSlugs = [singleSlug]
  } else {
    const dirs = fs.readdirSync(COURSES_DIR)
    courseSlugs = dirs.filter((d) => {
      const full = path.join(COURSES_DIR, d)
      return fs.statSync(full).isDirectory() && !d.startsWith('_')
    })
  }

  for (const slug of courseSlugs) {
    const meta = generateMetaForCourse(slug)
    if (!meta) continue

    const outPath = path.join(COURSES_DIR, slug, 'meta.json')
    fs.writeFileSync(outPath, JSON.stringify(meta, null, 2), 'utf-8')
    console.log(`Đã ghi: ${outPath}`)
  }
}

main()
