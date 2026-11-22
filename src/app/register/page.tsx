"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Feather, User, Mail, Lock, Globe, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [language, setLanguage] = useState("en");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const usernameClean = username.trim().toLowerCase();
    if (!/^[a-zA-Z0-9_]{3,24}$/.test(usernameClean)) {
      toast.error("Username must be between 3 and 24 alphanumeric characters or underscores.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: usernameClean,
            display_name: displayName.trim() || usernameClean,
            preferred_language: language,
          },
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.session) {
        toast.success("Welcome to StoryRemix! Your account is ready.");
        router.push("/");
        router.refresh();
      } else {
        toast.success("Registration successful! Check your email to confirm your account.");
        router.push("/login");
      }
    } catch {
      toast.error("Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 p-8 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-lg space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-amber-700/10 border border-amber-700/20 text-amber-700 dark:text-amber-400 mx-auto flex items-center justify-center">
          <Feather className="w-6 h-6" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-[var(--foreground)]">Join the Community</h1>
        <p className="text-xs text-[var(--muted-foreground)]">
          Join thousands of writers co-authoring endless stories.
        </p>
      </div>

      <form onSubmit={handleRegister} className="space-y-4 text-sm">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--foreground)] flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-[var(--muted-foreground)]" /> Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            placeholder="literary_mind"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-amber-700/40 text-sm"
          />
          <p className="text-[11px] text-[var(--muted-foreground)]">
            3–24 characters: letters, numbers, or underscores.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--foreground)]">
            Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            placeholder="Maya Angelou"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-amber-700/40 text-sm"
          />
        </div>

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
            placeholder="At least 6 characters"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-amber-700/40 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--foreground)] flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-[var(--muted-foreground)]" /> Primary Language
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-amber-700/40 text-sm cursor-pointer"
          >
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="ar">العربية (Arabic)</option>
          </select>
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
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="pt-4 border-t border-[var(--border)] text-center text-xs text-[var(--muted-foreground)]">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-amber-700 hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
}
