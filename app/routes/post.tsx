import { Link } from "react-router";
import { createImageUrlBuilder, type SanityImageSource } from "@sanity/image-url";
import type { SanityDocument } from "@sanity/client";
import { PortableText } from "@portabletext/react";
import { client } from "~/sanity/client";

type PostPageProps = {
  loaderData: {
    post: SanityDocument;
  };
};

const { projectId, dataset } = client.config();
const urlFor = (source: SanityImageSource) =>
  projectId && dataset
    ? createImageUrlBuilder({ projectId, dataset }).image(source)
    : null;

const POST_QUERY = `*[_type == "post" && slug.current == $slug][0]{
  _id,
  title,
  publishedAt,
  image,
  description,
  body
}`;

export async function loader({ params }: { params: Record<string, string> }) {
  return { post: await client.fetch<SanityDocument>(POST_QUERY, params) };
}

function markdownToHtml(markdown: string) {
  const escaped = markdown
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return escaped
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/_(.*?)_/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "<a href='$2' class='text-sky-600 hover:text-sky-700 underline'>$1</a>")
    .replace(/^###\s*(.*)$/gm, "<h3>$1</h3>")
    .replace(/^##\s*(.*)$/gm, "<h2>$1</h2>")
    .replace(/^#\s*(.*)$/gm, "<h1>$1</h1>")
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/\n/g, "<br />");
}

export default function Component({ loaderData }: PostPageProps) {
  const { post } = loaderData;
  const postImageUrl = post.image
    ? urlFor(post.image)?.width(1200).height(650).url()
    : null;

  const descriptionHtml =
    typeof post.description === "string" && post.description.trim().length > 0
      ? markdownToHtml(post.description)
      : null;

  return (
    <main className="min-h-screen bg-slate-50 py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
        >
          ← Back to posts
        </Link>

        <article className="mt-8 overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-xl">
          <header className="bg-gradient-to-r from-sky-600 via-cyan-500 to-emerald-500 px-8 py-10 text-white sm:px-12">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-100/90">
              News story
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
              {post.title}
            </h1>
            <p className="mt-4 max-w-2xl text-base text-slate-100/85">
              Published {new Date(post.publishedAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </header>

          {postImageUrl && (
            <div className="overflow-hidden bg-slate-900">
              <img
                src={postImageUrl}
                alt={post.title}
                className="h-[420px] w-full object-cover transition duration-300 hover:scale-[1.02]"
              />
            </div>
          )}

          {descriptionHtml ? (
            <div className="border-t border-slate-200 bg-slate-50 px-8 py-8 sm:px-12">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-700 shadow-sm">
                <div
                  className="prose prose-slate"
                  dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                />
              </div>
            </div>
          ) : null}

          <div className="px-8 py-10 sm:px-12">
            {Array.isArray(post.body) ? (
              <div className="space-y-6 text-slate-700">
                <PortableText value={post.body} />
              </div>
            ) : (
              <p className="text-slate-600">No article content available.</p>
            )}
          </div>
        </article>
      </div>
    </main>
  );
}
