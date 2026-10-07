// Reads the Markdown content at build time (server components only; the site is a static export).
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { MediaUrl } from "@/content/media.generated";

const dir = (name: string) => path.join(process.cwd(), "content", name);

export interface Project {
  slug: string;
  title: string;
  excerpt: string;
  cover: MediaUrl;
  coverAlt: string;
  tags: string[];
  moreProjects: boolean;
  body: string;
}

export interface Post {
  slug: string;
  title: string;
  /** ISO date (YYYY-MM-DD) */
  date: string;
  category: string;
  cover: MediaUrl;
  coverAlt: string;
  tags: string[];
  /** Slugs of the similar projects listed at the end of the post. */
  projects: string[];
  body: string;
}

function read(folder: string): { slug: string; data: Record<string, unknown>; body: string }[] {
  return fs
    .readdirSync(dir(folder))
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const { data, content } = matter(fs.readFileSync(path.join(dir(folder), f), "utf8"));
      return { slug: f.replace(/\.md$/, ""), data, body: content.trim() };
    });
}

const str = (v: unknown) => (typeof v === "string" ? v : "");
const list = (v: unknown) => (Array.isArray(v) ? v.map(String) : []);
const day = (v: unknown) => (v instanceof Date ? v.toISOString().slice(0, 10) : str(v));

/** All projects, A to Z by title (the order of the project grid on the old site). */
export function getProjects(): Project[] {
  return read("projects")
    .map(({ slug, data, body }) => ({
      slug,
      title: str(data.title),
      excerpt: str(data.excerpt),
      cover: str(data.cover) as MediaUrl,
      coverAlt: str(data.coverAlt),
      tags: list(data.tags),
      moreProjects: data.moreProjects === true,
      body,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

export const getProject = (slug: string) => getProjects().find((p) => p.slug === slug);

/** All posts, newest first. */
export function getPosts(): Post[] {
  return read("posts")
    .map(({ slug, data, body }) => ({
      slug,
      title: str(data.title),
      date: day(data.date),
      category: str(data.category),
      cover: str(data.cover) as MediaUrl,
      coverAlt: str(data.coverAlt),
      tags: list(data.tags),
      projects: list(data.projects),
      body,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** The projects with these slugs, in that order. An unknown slug fails the build instead of dropping a link. */
export function getProjectsBySlug(slugs: string[]): Project[] {
  return slugs.map((slug) => {
    const project = getProject(slug);
    if (!project) throw new Error(`Unknown project "${slug}"`);
    return project;
  });
}

/** The three projects after this one in the A to Z order, wrapping around: the "similar projects" of a project page. */
export function getOtherProjects(slug: string, count = 3): Project[] {
  const all = getProjects();
  const at = all.findIndex((p) => p.slug === slug);
  return Array.from({ length: Math.min(count, all.length - 1) }, (_, i) => all[(at + 1 + i) % all.length]);
}

export const getPost = (slug: string) => getPosts().find((p) => p.slug === slug);

/** "October 10, 2024", as the old site printed it (the date is fixed in UTC so the build machine's zone never matters). */
export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}
