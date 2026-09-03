import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useSeo } from "@/hooks/useSeo";

type Post = {
  id: string; slug: string; title: string; excerpt: string | null; body: string | null;
  cover_url: string | null; published_at: string | null;
  seo_title: string | null; seo_description: string | null;
};

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading } = useQuery({
    enabled: !!slug,
    queryKey: ["blog-post", slug],
    queryFn: async (): Promise<Post | null> => {
      const { data, error } = await supabase
        .from("blog_posts").select("*").eq("slug", slug!).eq("published", true).maybeSingle();
      if (error) throw error;
      return (data as Post) ?? null;
    },
  });

  useSeo({
    title: post ? `${post.seo_title ?? post.title} | Noble Spaces` : "Article | Noble Spaces",
    description: post?.seo_description ?? post?.excerpt ?? "Interior design insights from Noble Spaces Rwanda.",
    path: `/blog/${slug}`,
    type: "article",
    image: post?.cover_url ?? null,
    jsonLd: post
      ? {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.seo_title ?? post.title,
          description: post.seo_description ?? post.excerpt ?? undefined,
          image: post.cover_url ? [post.cover_url] : undefined,
          datePublished: post.published_at ?? undefined,
          mainEntityOfPage: `https://noblespaces.rw/blog/${post.slug}`,
          author: { "@type": "Organization", name: "Noble Spaces" },
          publisher: { "@type": "Organization", name: "Noble Spaces" },
        }
      : null,
  });


  if (isLoading) {
    return <div className="mx-auto max-w-3xl px-6 pt-40"><Skeleton className="h-96 rounded-3xl" /></div>;
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-40 text-center">
        <h1 className="font-display text-3xl">Article not found</h1>
        <Button asChild variant="outline" className="mt-6"><Link to="/blog">Back to journal</Link></Button>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl px-6 pb-24 pt-32">
      <Link to="/blog" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-gold hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" /> Journal
      </Link>
      <h1 className="mt-6 font-display text-4xl font-semibold leading-tight lg:text-5xl">{post.title}</h1>
      {post.published_at && (
        <time className="mt-3 block text-xs uppercase tracking-[0.25em] text-muted-foreground">
          {new Date(post.published_at).toLocaleDateString()}
        </time>
      )}
      {post.cover_url && (
        <img src={post.cover_url} alt={post.title} className="mt-8 w-full rounded-3xl object-cover" />
      )}
      {post.body && (
        <div className="mt-10 whitespace-pre-line leading-relaxed text-muted-foreground">{post.body}</div>
      )}
    </article>
  );
};

export default BlogPostPage;
