import type { SanityDocument } from "@sanity/client";
import { Link } from "react-router";
import { createImageUrlBuilder, type SanityImageSource } from "@sanity/image-url";
import { client } from "~/sanity/client";

type IndexPageProps = {
  loaderData: {
    posts: SanityDocument[];
  };
};

const { projectId, dataset } = client.config();
const urlFor = (source: SanityImageSource) =>
  projectId && dataset ? createImageUrlBuilder({ projectId, dataset }).image(source) : null;

const POSTS_QUERY = `*[
  _type == "post"
  && defined(slug.current)
]|order(publishedAt desc)[0...12]{
  _id,
  title,
  slug,
  publishedAt,
  image,
  description,
  body[0]{children[0]{text}}
}`;

export async function loader() {
  return { posts: await client.fetch<SanityDocument[]>(POSTS_QUERY) };
}

function formatDate(value?: string | null) {
  if (!value) return "Unknown date";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function stripMarkdown(value: string) {
  return value
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/#+\s*(.*)/g, "$1")
    .replace(/>\s*/g, "")
    .replace(/\n{2,}/g, "\n\n")
    .replace(/\n/g, " ")
    .trim();
}

export default function IndexPage({ loaderData }: IndexPageProps) {
  const { posts } = loaderData;

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
              Discover recent posts with a polished layout, card-style previews, and crisp typography.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Featured posts</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">Browse the latest stories</p>
          </div>
          <p className="text-sm text-slate-500">
            Total posts: <span className="font-semibold text-slate-900">{posts.length}</span>
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {posts.map((post) => {
            const excerpt = typeof post.description === "string" && post.description.trim().length > 0
              ? stripMarkdown(post.description).slice(0, 160)
              : Array.isArray((post as any).body)
              ? String((post as any).body[0]?.children?.[0]?.text || "Click to read the full story.")
              : "Click to read the full story.";

            return (
              <article
                key={post._id}
                className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <Link to={`/${post.slug.current}`} className="block h-full overflow-hidden rounded-[1.75rem] bg-white">
                  {post.image ? (
                    <div className="overflow-hidden bg-slate-100">
                      <img
                        src={urlFor(post.image)?.width(560).height(320).auto("format").fit("crop").url()}
                        alt={post.title}
                        className="h-48 w-full object-cover transition duration-300 hover:scale-105"
                      />
                    </div>
                  ) : null}
                  <div className="p-6">
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span className="font-semibold uppercase tracking-[0.25em]">News</span>
                      <span>{formatDate(post.publishedAt)}</span>
                    </div>
                    <h2 className="mt-6 text-2xl font-semibold text-slate-900 transition-colors duration-200 hover:text-sky-600">
                      {post.title}
                    </h2>
                    <p className="mt-4 text-slate-600">{excerpt}</p>
                    <div className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-sky-600">
                      Read story
                      <span aria-hidden="true">→</span>
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
