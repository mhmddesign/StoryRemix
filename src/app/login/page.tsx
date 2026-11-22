"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Feather, Lock, Mail, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please provide both email and password.");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Welcome back to StoryRemix!");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Failed to sign in. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-lg space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-amber-700/10 border border-amber-700/20 text-amber-700 dark:text-amber-400 mx-auto flex items-center justify-center">
          <Feather className="w-6 h-6" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-[var(--foreground)]">Welcome Back</h1>
        <p className="text-xs text-[var(--muted-foreground)]">
          Continue co-crafting stories with writers around the world.
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4 text-sm">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--foreground)] flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-[var(--muted-foreground)]" /> Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-amber-700/40 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--foreground)] flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[var(--muted-foreground)]" /> Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-amber-700/40 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 disabled:opacity-50 text-white font-semibold text-sm shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="pt-4 border-t border-[var(--border)] text-center text-xs text-[var(--muted-foreground)]">
        New to StoryRemix?{" "}
        <Link href="/register" className="font-semibold text-amber-700 hover:underline">
          Create an account
        </Link>
      </div>
    </div>
  );
}
