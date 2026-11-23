"use client";

import React, { useState } from "react";
import { Edit3, X, Loader2, Save } from "lucide-react";
import { updateProfileAction } from "@/app/actions/auth-actions";
import { useAuth } from "@/components/auth/auth-provider";
import { toast } from "sonner";

interface ProfileEditModalProps {
  currentDisplayName: string;
  currentBio: string | null;
  currentLanguage: string;
  currentAvatarUrl: string | null;
}

export function ProfileEditModal({
  currentDisplayName,
  currentBio,
  currentLanguage,
  currentAvatarUrl,
}: ProfileEditModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const { refreshProfile } = useAuth();

  const [displayName, setDisplayName] = useState(currentDisplayName);
  const [bio, setBio] = useState(currentBio || "");
  const [language, setLanguage] = useState(currentLanguage || "en");
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);

    const formData = new FormData();
    formData.append("displayName", displayName);
    formData.append("bio", bio);
    formData.append("preferredLanguage", language);
    formData.append("avatarUrl", avatarUrl);

    try {
      const res = await updateProfileAction(formData);
      if (res.success) {
        toast.success(res.message || "Profile updated!");
        await refreshProfile();
        setIsOpen(false);
      } else {
        toast.error(res.error || "Failed to update profile.");
      }
    } catch {
      toast.error("An error occurred while saving profile.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--accent)] text-xs font-semibold text-[var(--foreground)] transition-colors cursor-pointer"
      >
        <Edit3 className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
        <span>Edit Profile</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="font-serif text-lg font-bold text-[var(--foreground)]">
                Edit Profile
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--foreground)]">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-amber-700/50"
                  placeholder="How other writers see you"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--foreground)]">
                  Bio / Literary Premise
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={300}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-amber-700/50"
                  placeholder="A few words about your favorite genres and writing style..."
                />
                <p className="text-[10px] text-[var(--muted-foreground)] text-right">
                  {bio.length}/300
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--foreground)]">
                  Preferred Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-amber-700/50"
                >
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                  <option value="ar">العربية (Arabic)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--foreground)]">
                  Avatar Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-amber-700/50"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-[var(--accent)] text-xs font-semibold text-[var(--foreground)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold shadow flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
