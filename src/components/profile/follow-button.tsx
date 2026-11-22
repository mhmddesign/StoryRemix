"use client";

import React, { useState, useTransition } from "react";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { toggleFollowAction } from "@/app/actions/social-actions";
import { toast } from "sonner";

interface FollowButtonProps {
  targetUserId: string;
  initialIsFollowing: boolean;
}

export function FollowButton({ targetUserId, initialIsFollowing }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      const res = await toggleFollowAction(targetUserId);
      if (res.success && res.following !== undefined) {
        setIsFollowing(res.following);
        toast.success(res.following ? "Following author!" : "Unfollowed author.");
      } else if (res.error) {
        toast.error(res.error);
      }
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
        isFollowing
          ? "border border-[var(--border)] bg-[var(--background)] hover:bg-rose-500/10 hover:text-rose-600 text-[var(--foreground)]"
          : "bg-amber-800 hover:bg-amber-900 text-white shadow-sm"
      }`}
    >
      {isPending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Following</span>
        </>
      ) : (
        <>
          <UserPlus className="w-3.5 h-3.5" />
          <span>Follow Author</span>
        </>
      )}
    </button>
  );
}
