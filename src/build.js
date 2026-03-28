import { promises as fs } from "fs";
import { join, dirname, basename, extname } from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import { marked } from "marked";
import { createHighlighter } from "shiki";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");

const SITE_URL = "https://zjiz.cn"; // e.g. 'https://example.com'

function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function generateSitemap(posts, publicDir, siteUrl) {
  if (!siteUrl) return;
  const base = siteUrl.replace(/\/$/, "");
  const urlEntries = [
    `  <url>\n    <loc>${base}/</loc>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>`,
    ...posts.map((post) => {
      const loc = escapeXml(`${base}/posts/${post.slug}.html`);
      const lastmod =
        post.date instanceof Date && !isNaN(post.date.getTime())
          ? post.date.toISOString().slice(0, 10)
          : "";
      const lastmodXml = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : "";
      return `  <url>\n    <loc>${loc}</loc>${lastmodXml}\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>`;
    }),
  ].join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries}\n</urlset>`;
  await fs.writeFile(join(publicDir, "sitemap.xml"), xml, "utf-8");
}

async function generateRobotsTxt(publicDir, siteUrl) {
  const sitemapLine = siteUrl
    ? `\nSitemap: ${siteUrl.replace(/\/$/, "")}/sitemap.xml`
    : "";
  const content = `User-agent: *\nAllow: /${sitemapLine}\n`;
  await fs.writeFile(join(publicDir, "robots.txt"), content, "utf-8");
}

async function generateRss(posts, publicDir, siteUrl) {
  const base = siteUrl.replace(/\/$/, "");
  const feedUrl = base ? `${base}/feed.xml` : "feed.xml";
  const siteLink = base || "./";

  const items = posts
    .map((post) => {
      const link = base
        ? `${base}/posts/${post.slug}.html`
        : `posts/${post.slug}.html`;
      const pubDate =
        post.date instanceof Date && !isNaN(post.date.getTime())
          ? post.date.toUTCString()
          : new Date(0).toUTCString();
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid>${escapeXml(link)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(post.excerpt)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>ZJIZHUANG's Notes</title>
    <link>${escapeXml(siteLink)}</link>
    <description>ZJIZHUANG 的个人博客</description>
    <language>zh-cn</language>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  await fs.writeFile(join(publicDir, "feed.xml"), xml, "utf-8");
}

// Parse CLI arguments
function parseArgs() {
  const args = process.argv.slice(2);
  let postsDir = join(ROOT, "posts");
  let publicDir = join(ROOT, "public");
  for (let i = 0; i < args.length; i++) {
    if ((args[i] === "--posts" || args[i] === "-p") && args[i + 1])
      postsDir = args[++i];
    if ((args[i] === "--output" || args[i] === "-o") && args[i + 1])
      publicDir = args[++i];
  }
  return { postsDir, publicDir };
}

// Format a date string or Date object as YYYY.MM.DD
function formatDate(value) {
  if (!value) return "";
  // Normalize separators to dashes before parsing
  const normalized = String(value).replace(/[./]/g, "-");
  const d = new Date(normalized);
  if (isNaN(d.getTime())) return String(value);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

// Recursively find the href of the first image token in a marked token tree
function findFirstImage(tokens) {
  if (!Array.isArray(tokens)) return null;
  for (const token of tokens) {
    if (token.type === "image") return token.href;
    // Inline tokens inside paragraphs, headings, etc.
    if (token.tokens) {
      const found = findFirstImage(token.tokens);
      if (found) return found;
    }
    // List items
    if (token.type === "list" && token.items) {
      for (const item of token.items) {
        const found = findFirstImage(item.tokens);
        if (found) return found;
      }
    }
  }
  return null;
}

// Parse `Intro:` and `Time:` fields from a blockquote's raw markdown text
function parseBlockquoteMeta(raw) {
  const intro = (raw.match(/^>\s*Intro:\s*(.+)$/im) || [])[1]?.trim() ?? "";
  const time = (raw.match(/^>\s*Time:\s*(.+)$/im) || [])[1]?.trim() ?? "";
  return { intro, time };
}

// Extract title (H1), Intro, Time, and first image from parsed markdown tokens
function parseMarkdownMeta(body) {
  const tokens = marked.lexer(body);

  let title = "";
  let intro = "";
  let time = "";
  let foundH1 = false;
  let metaParsed = false;

  for (const token of tokens) {
    // Skip whitespace-only tokens
    if (token.type === "space") continue;

    // Locate the first H1 and capture its text
    if (!foundH1) {
      if (token.type === "heading" && token.depth === 1) {
        foundH1 = true;
        title = token.text.trim();
      }
      continue;
    }

    // The next block after H1 must be the meta blockquote
    if (!metaParsed) {
      if (token.type === "blockquote") {
        const meta = parseBlockquoteMeta(token.raw);
        intro = meta.intro;
        time = meta.time;
      }
      // Whether or not it was a blockquote, stop looking for meta
      metaParsed = true;
    }
  }

  const firstImage = findFirstImage(tokens);
  return { title, intro, time, firstImage };
}

// Rewrite a post-relative image src so it works from public/index.html
// e.g. "./img/photo.jpg" → "posts/img/photo.jpg"
function adjustImagePathForIndex(src) {
  if (!src || /^(https?:|\/\/)/.test(src)) return src;
  return "posts/" + src.replace(/^\.\//, "");
}

// Recursively copy all non-.md files from src to dest (preserves subdirs)
async function copyNonMdFiles(src, dest) {
  let entries;
  try {
    entries = await fs.readdir(src, { withFileTypes: true });
  } catch {
    return; // source dir might not exist yet
  }
  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      await fs.mkdir(destPath, { recursive: true });
      await copyNonMdFiles(srcPath, destPath);
    } else if (extname(entry.name) !== ".md") {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function build(postsDir, publicDir) {
  const srcDir = join(ROOT, "src");

  // 1. Initialize Shiki highlighter for build-time syntax highlighting
  const highlighter = await createHighlighter({
    themes: ["catppuccin-latte", "catppuccin-frappe"],
    langs: [
      "html",
      "css",
      "javascript",
      "typescript",
      "rust",
      "bash",
      "shell",
      "json",
      "yaml",
      "markdown",
      "diff",
    ],
  });

  // Plug into marked: render fenced code blocks with Shiki
  marked.use({
    renderer: {
      // marked v12 passes (text, lang, escaped) as positional arguments
      code(text, lang) {
        const language = (lang || "").toLowerCase() || "text";
        try {
          return highlighter.codeToHtml(text, {
            lang: language,
            themes: { light: "catppuccin-latte", dark: "catppuccin-frappe" },
          });
        } catch {
          // Unsupported language — fall back to plain preformatted text
          const safe = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
          return `<pre class="shiki"><code>${safe}</code></pre>`;
        }
      },
    },
  });

  // 2. Clean and recreate output directories
  await fs.rm(publicDir, { recursive: true, force: true });
  await fs.mkdir(join(publicDir, "posts"), { recursive: true });
  await fs.mkdir(join(publicDir, "assets"), { recursive: true });

  // 2. Copy static assets
  await fs.copyFile(
    join(srcDir, "styles.css"),
    join(publicDir, "assets", "styles.css"),
  );
  await fs.copyFile(
    join(srcDir, "logo.png"),
    join(publicDir, "assets", "logo.png"),
  );

  // 3. Copy images and other non-.md files from posts/ → public/posts/
  await copyNonMdFiles(postsDir, join(publicDir, "posts"));

  // 4. Load templates (inject toggle button partial and constant values)
  const toggleHtml = await fs.readFile(join(srcDir, "toggle.html"), "utf-8");
  const indexTemplate = (
    await fs.readFile(join(srcDir, "index.html"), "utf-8")
  )
    .replaceAll("{{THEME_TOGGLE}}", toggleHtml)
    .replaceAll("{{SITE_URL}}", SITE_URL);
  const postTemplate = (
    await fs.readFile(join(srcDir, "post.html"), "utf-8")
  )
    .replaceAll("{{THEME_TOGGLE}}", toggleHtml)
    .replaceAll("{{SITE_URL}}", SITE_URL);

  // 5. Discover markdown files
  let files;
  try {
    files = await fs.readdir(postsDir);
  } catch {
    console.warn(`⚠  Posts directory not found: ${postsDir}`);
    files = [];
  }
  const mdFiles = files.filter((f) => extname(f) === ".md");

  // 6. Parse each post
  const posts = await Promise.all(
    mdFiles.map(async (file) => {
      const raw = await fs.readFile(join(postsDir, file), "utf-8");
      const { data, content: body } = matter(raw);
      const slug = basename(file, ".md");

      // Metadata from markdown body takes priority over frontmatter
      const {
        title: h1Title,
        intro,
        time,
        firstImage,
      } = parseMarkdownMeta(body);

      // Resolve date: blockquote Time → frontmatter date → file birthtime
      let dateStr = time ? formatDate(time) : "";
      if (!dateStr && data.date) dateStr = formatDate(data.date);
      if (!dateStr) {
        const stat = await fs.stat(join(postsDir, file));
        dateStr = formatDate(stat.birthtime);
      }

      // Parse into a Date for sorting
      const dateObj = new Date(dateStr.replace(/\./g, "-"));

      // Excerpt: blockquote Intro → frontmatter description → empty
      const excerpt = intro || data.description || "";

      const html = marked(body);

      // Thumbnail src rewritten for use from public/index.html
      const thumbnailSrc = firstImage
        ? adjustImagePathForIndex(firstImage)
        : null;

      return {
        slug,
        title: h1Title || data.title || basename(file, ".md"),
        date: isNaN(dateObj.getTime()) ? new Date(0) : dateObj,
        dateStr,
        excerpt,
        html,
        thumbnailSrc,
        firstImage,
      };
    }),
  );

  // 7. Sort by date descending (newest first)
  posts.sort((a, b) => b.date - a.date);

  // 8. Generate individual post pages
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const prevPost = i > 0 ? posts[i - 1] : null;
    const nextPost = i < posts.length - 1 ? posts[i + 1] : null;

    const prevHtml = prevPost
      ? `<a class="post-nav__item post-nav__item--prev" href="${prevPost.slug}.html">
        <span class="post-nav__label">上一篇</span>
        <span class="post-nav__title">${prevPost.title}</span>
      </a>`
      : `<span class="post-nav__item post-nav__item--prev post-nav__item--empty"></span>`;

    const nextHtml = nextPost
      ? `<a class="post-nav__item post-nav__item--next" href="${nextPost.slug}.html">
        <span class="post-nav__label">下一篇</span>
        <span class="post-nav__title">${nextPost.title}</span>
      </a>`
      : `<span class="post-nav__item post-nav__item--next post-nav__item--empty"></span>`;

    const postNavHtml = `<nav class="post-nav" aria-label="文章导航">
      ${prevHtml}
      ${nextHtml}
    </nav>`;

    const canonicalUrl = SITE_URL
      ? `${SITE_URL}/posts/${post.slug}.html`
      : "";
    const dateIso =
      post.date instanceof Date && !isNaN(post.date.getTime())
        ? post.date.toISOString().slice(0, 10)
        : post.dateStr.replace(/\./g, "-");
    const ogImageUrl =
      SITE_URL && post.firstImage && !/^(https?:|\/\/)/.test(post.firstImage)
        ? `${SITE_URL}/posts/${post.firstImage.replace(/^\.\//, "")}`
        : post.firstImage && /^https?:/.test(post.firstImage)
          ? post.firstImage
          : "";
    const ogImageMeta = ogImageUrl
      ? `<meta property="og:image" content="${ogImageUrl}" />`
      : "";
    const twitterCardType = ogImageUrl ? "summary_large_image" : "summary";
    const twitterImageMeta = ogImageUrl
      ? `<meta name="twitter:image" content="${ogImageUrl}" />`
      : "";

    const html = postTemplate
      .replaceAll("{{TITLE}}", post.title)
      .replaceAll("{{TITLE_JSON}}", JSON.stringify(post.title).slice(1, -1))
      .replaceAll("{{DATE}}", post.dateStr)
      .replaceAll("{{DATE_ISO}}", dateIso)
      .replaceAll("{{CONTENT}}", post.html)
      .replaceAll("{{DESCRIPTION}}", post.excerpt)
      .replaceAll(
        "{{DESCRIPTION_JSON}}",
        JSON.stringify(post.excerpt).slice(1, -1),
      )
      .replaceAll("{{SLUG}}", post.slug)
      .replaceAll("{{CANONICAL_URL}}", canonicalUrl)
      .replaceAll("{{OG_IMAGE_META}}", ogImageMeta)
      .replaceAll("{{TWITTER_CARD_TYPE}}", twitterCardType)
      .replaceAll("{{TWITTER_IMAGE_META}}", twitterImageMeta)
      .replaceAll("{{POST_NAV}}", postNavHtml);
    await fs.writeFile(join(publicDir, "posts", `${post.slug}.html`), html);
  }

  // 9. Build post list HTML (thumbnail only when post has an image)
  const postsListHtml = posts.length
    ? posts
        .map((post) => {
          const thumb = post.thumbnailSrc
            ? `\n      <div class="post-thumbnail"><img src="${post.thumbnailSrc}" alt="" loading="lazy"></div>`
            : "";
          return `    <a class="post-item" href="posts/${post.slug}.html">
      <div class="post-item-content" style="view-transition-name: post-header-${post.slug}">
        <h2 class="post-title">${post.title}</h2>
        <p class="post-meta">${post.dateStr}${post.excerpt ? " | " + post.excerpt : ""}</p>
      </div>${thumb}
    </a>`;
        })
        .join("\n")
    : '<p class="empty-state">No posts yet.</p>';

  // 10. Generate index.html
  const indexHtml = indexTemplate
    .replaceAll("{{POSTS_LIST}}", postsListHtml)
    .replaceAll("{{YEAR}}", new Date().getFullYear());
  await fs.writeFile(join(publicDir, "index.html"), indexHtml);

  await generateRss(posts, publicDir, SITE_URL);
  await generateSitemap(posts, publicDir, SITE_URL);
  await generateRobotsTxt(publicDir, SITE_URL);

  console.log(
    `✓ Built ${posts.length} post${posts.length !== 1 ? "s" : ""} → ${publicDir}`,
  );
}

const { postsDir, publicDir } = parseArgs();
build(postsDir, publicDir).catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
