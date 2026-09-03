import { useEffect, useState, type ReactNode } from "react";
import { Loader2, LogOut, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Center = ({ children }: { children: ReactNode }) => (
  <section className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-20 text-center">
    {children}
  </section>
);

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast({ title: "Sign-in failed", description: error.message, variant: "destructive" });
  };

  return (
    <section className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="font-display text-3xl">Admin sign in</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Restricted area. Sign in with your administrator account.
      </p>
      <form className="mt-6 space-y-4 text-left" onSubmit={submit}>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pwd">Password</Label>
          <Input id="pwd" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Sign in
        </Button>
      </form>
    </section>
  );
};

const AccessDenied = () => (
  <Center>
    <ShieldAlert className="mx-auto h-10 w-10 text-gold" />
    <h1 className="mt-4 font-display text-2xl">Access denied</h1>
    <p className="mt-2 text-sm text-muted-foreground">
      This account does not have admin privileges.
    </p>
    <div className="mt-6 flex justify-center gap-2">
      <Button variant="outline" onClick={() => supabase.auth.signOut()}>
        <LogOut className="mr-2 h-4 w-4" /> Sign out
      </Button>
      <Button asChild>
        <a href="/">Back to site</a>
      </Button>
    </div>
  </Center>
);

async function checkAdmin(userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return !!data;
}

export const AdminGuard = ({ children }: { children: ReactNode }) => {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    const resolve = async (session: { user?: { id?: string } } | null) => {
      if (cancelled) return;
      setAuthed(!!session);
      if (session?.user?.id) {
        const admin = await checkAdmin(session.user.id);
        if (!cancelled) setIsAdmin(admin);
      } else if (!cancelled) {
        setIsAdmin(null);
      }
      if (!cancelled) setReady(true);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setTimeout(() => resolve(session), 0);
    });
    supabase.auth.getSession().then(({ data }) => resolve(data.session));
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (!ready || (authed && isAdmin === null)) {
    return (
      <Center>
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
      </Center>
    );
  }
  if (!authed) return <SignIn />;
  if (!isAdmin) return <AccessDenied />;
  return <>{children}</>;
};
