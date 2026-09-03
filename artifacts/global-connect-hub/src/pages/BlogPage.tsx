import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSeo } from "@/hooks/useSeo";

type Post = {
  id: string; slug: string; title: string; excerpt: string | null;
  cover_url: string | null; published_at: string | null;
};

const BlogPage = () => {
  useSeo({
    title: "Interior Design Journal | Noble Spaces Rwanda",
    description: "Ideas, guides and project stories on furniture, interiors and home styling in Rwanda from the Noble Spaces team.",
    path: "/blog",
  });

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["blog-posts-public"],
    queryFn: async (): Promise<Post[]> => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id,slug,title,excerpt,cover_url,published_at")
        .eq("published", true)
        .order("published_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Post[];
    },
  });

  return (
    <div className="pt-28">
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <span className="text-xs uppercase tracking-[0.3em] text-gold">— Journal</span>
        <h1 className="mt-4 font-display text-5xl font-semibold lg:text-6xl">Ideas & inspiration</h1>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-3xl" />)
            : posts.map((p) => (
                <article key={p.id} className="group overflow-hidden rounded-3xl border border-gold/15 bg-card">
                  <Link to={`/blog/${p.slug}`} className="block aspect-[16/10] overflow-hidden bg-muted">
                    {p.cover_url ? (
                      <img src={p.cover_url} alt={p.title} loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : null}
                  </Link>
                  <div className="space-y-2 p-6">
                    {p.published_at && (
                      <time className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        {new Date(p.published_at).toLocaleDateString()}
                      </time>
                    )}
                    <Link to={`/blog/${p.slug}`} className="block font-display text-xl leading-tight hover:text-gold">
                      {p.title}
                    </Link>
                    {p.excerpt && <p className="line-clamp-3 text-sm text-muted-foreground">{p.excerpt}</p>}
                  </div>
                </article>
              ))}
        </div>

        {!isLoading && posts.length === 0 && (
          <p className="mt-16 rounded-3xl border border-dashed border-gold/25 p-12 text-center text-sm text-muted-foreground">
            No articles published yet.
          </p>
        )}
      </section>
    </div>
  );
};

export default BlogPage;
