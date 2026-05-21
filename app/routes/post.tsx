import { Link } from "react-router";
import {
  createImageUrlBuilder,
  type SanityImageSource,
} from "@sanity/image-url";
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
  slug,
  publishedAt,
  mainImage,
  tags,
  body,
}`;

export async function loader({ params }: { params: Record<string, string> }) {
  return { post: await client.fetch<SanityDocument>(POST_QUERY, params) };
}

export default function Component({ loaderData }: PostPageProps) {
  const { post } = loaderData;

  const postImageUrl = post.mainImage
    ? urlFor(post.mainImage)?.width(1200).height(650).url()
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
          <header className="bg-linear-to-r from-sky-600 via-cyan-500 to-emerald-500 px-8 py-10 text-white sm:px-12">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-100/90">
              News story
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
              {post.title}
            </h1>
            <p className="mt-4 max-w-2xl text-base text-slate-100/85">
              Published{" "}
              {new Date(post.publishedAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>

            {postImageUrl && (
              <div className="overflow-hidden rounded-2xl bg-slate-900 mt-4">
                <img
                  src={postImageUrl}
                  alt={post.mainImage?.alt || post.title}
                  className="block w-full h-85 sm:h-105 md:h-125 lg:h-150 object-cover object-center transition duration-300 ease-out hover:scale-[1.02]"
                />
              </div>
            )}
          </header>

          <div className="px-8 py-10 sm:px-12">
            {Array.isArray(post.body) ? (
              <div className="space-y-6 text-slate-700">
                <PortableText value={post.body} />
              </div>
            ) : (
              <p className="text-slate-600">No article content available.</p>
            )}
            {/* Tags section below the article content */}
            {Array.isArray(post.tags) && post.tags.length > 0 ? (
              <div className="mt-8 border-t pt-6">
                <h3 className="mb-3 text-sm font-semibold text-slate-700">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-sm font-medium text-slate-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </article>
      </div>
    </main>
  );
}
