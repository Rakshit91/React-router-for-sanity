import React, { useEffect, useMemo, useRef, useState } from "react";
import type { SanityDocument } from "@sanity/client";
import { Link } from "react-router";
import {
  createImageUrlBuilder,
  type SanityImageSource,
} from "@sanity/image-url";
import { client } from "~/sanity/client";

type Category = {
  _id?: string;
  title: string;
  slug: { current?: string } | null;
};

type LoaderData = {
  posts: SanityDocument[];
  categories: Category[];
  selectedCategory: string | null;
};

const { projectId, dataset } = client.config();
const urlFor = (source: SanityImageSource) =>
  projectId && dataset
    ? createImageUrlBuilder({ projectId, dataset }).image(source)
    : null;

const CATEGORY_QUERY = `*[_type == "category"] | order(title asc){ _id, title, slug }`;

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const selectedCategory = url.searchParams.get("category") || null;
  const categoryFilter = selectedCategory
    ? " && $category in categories[]->slug.current"
    : "";

  const POSTS_QUERY = `*[_type == "post" && defined(slug.current)${categoryFilter}] | order(publishedAt desc)[0...12]{
    _id,
    title,
    slug,
    publishedAt,
    mainImage,
    description,
    tags,
    categories[]->{title, slug},
    body[0]{children[0]{text}}
  }`;

  const [posts, categories] = await Promise.all([
    client.fetch<SanityDocument[]>(
      POSTS_QUERY,
      selectedCategory ? { category: selectedCategory } : {},
    ),
    client.fetch<Category[]>(CATEGORY_QUERY),
  ]);

  return { posts, categories, selectedCategory };
}

function formatDate(value?: string | null) {
  if (!value) return "Unknown date";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function IndexPage({ loaderData }: { loaderData: LoaderData }) {
  const { posts, categories, selectedCategory } = loaderData;
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement | null>(null);

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories
      .filter((c) => c.title.toLowerCase().includes(q))
      .slice(0, 50);
  }, [categories, query]);

  const selectedCategoryTitle = useMemo(() => {
    if (!selectedCategory) return null;
    return (
      categories.find((c) => c.slug?.current === selectedCategory)?.title ??
      null
    );
  }, [categories, selectedCategory]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!searchRef.current) return;
      if (!searchRef.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-slate-950 text-white">
        <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-6">
            <p className="inline-flex rounded-full bg-slate-800 px-4 py-1 text-sm font-semibold uppercase tracking-[0.3em] text-slate-200">
              News Channel
            </p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Latest headlines from your Sanity-powered newsroom.
            </h1>
            <p className="text-slate-300 sm:text-lg">
              Discover recent posts with a polished layout, card-style previews,
              and crisp typography.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
              Featured posts
            </p>
            <p className="mt-2 text-xl font-semibold text-slate-900">
              Browse the latest stories
            </p>
          </div>
          <p className="text-sm text-slate-500">
            Total posts:{" "}
            <span className="font-semibold text-slate-900">{posts.length}</span>
          </p>
        </div>

        {/* Search + dropdown */}
        <div className="mb-6">
          <div ref={searchRef} className="relative w-full max-w-md">
            <label className="sr-only">Search categories</label>
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder={
                query
                  ? "Search categories..."
                  : (selectedCategoryTitle ?? "Search or pick a category")
              }
              className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
            />

            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <button
                onClick={() => setIsOpen((s) => !s)}
                aria-label="Toggle categories"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700"
              >
                ▾
              </button>
            </div>

            {isOpen && (
              <div className="absolute z-20 mt-2 w-full max-h-72 overflow-auto rounded-lg border bg-white shadow-xl ring-1 ring-slate-100">
                {!query.trim() && (
                  <Link
                    to="/"
                    onClick={() => {
                      setQuery("");
                      setIsOpen(false);
                    }}
                    className={`block w-full px-4 py-2 text-sm font-medium transition-colors duration-150 ${!selectedCategory ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50"}`}
                  >
                    All categories
                  </Link>
                )}

                <div className="divide-y divide-slate-100">
                  {filteredCategories.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-slate-500">
                      No categories found
                    </div>
                  ) : (
                    filteredCategories.map((category) => {
                      const slug = category.slug?.current;
                      if (!slug) return null;
                      const isActive = slug === selectedCategory;
                      return (
                        <Link
                          key={category._id ?? slug}
                          to={`/?category=${slug}`}
                          onClick={() => {
                            setQuery("");
                            setIsOpen(false);
                          }}
                          className={`block w-full px-4 py-2 text-sm transition-colors duration-150 ${isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50"}`}
                        >
                          {category.title}
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {posts.map((post) => {
            const excerpt =
              typeof post.description === "string" &&
              post.description.trim().length > 0
                ? post.description.slice(0, 160)
                : Array.isArray((post as any).body)
                  ? String(
                      (post as any).body[0]?.children?.[0]?.text ||
                        "Click to read the full story.",
                    )
                  : "Click to read the full story.";

            return (
              <article
                key={post._id}
                className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <Link
                  to={`/${post.slug.current}`}
                  className="block h-full overflow-hidden rounded-[1.75rem] bg-white"
                >
                  {post.mainImage ? (
                    <div className="overflow-hidden bg-slate-100">
                      <img
                        src={urlFor(post.mainImage)
                          ?.width(560)
                          .height(320)
                          .auto("format")
                          .fit("crop")
                          .url()}
                        alt={post.mainImage?.alt || post.title}
                        className="h-48 w-full object-cover transition duration-300 hover:scale-105"
                      />
                    </div>
                  ) : null}

                  <div className="p-6">
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span className="font-semibold uppercase tracking-[0.25em]">
                        News
                      </span>
                      <span>{formatDate(post.publishedAt)}</span>
                    </div>

                    <h2 className="mt-6 text-2xl font-semibold text-slate-900 transition-colors duration-200 hover:text-sky-600">
                      {post.title}
                    </h2>

                    {Array.isArray(post.categories) &&
                    post.categories.length > 0 ? (
                      <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-500">
                        {post.categories.map((category: any) => (
                          <span
                            key={category.slug?.current ?? category.title}
                            className="rounded-full bg-slate-100 px-3 py-1"
                          >
                            {category.title}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <p className="mt-4 text-slate-600">{excerpt}</p>
                    <div className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-sky-600">
                      Read story <span aria-hidden="true">→</span>
                    </div>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
