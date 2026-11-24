"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { OnboardingWizard } from "./onboarding-wizard";

export function OnboardingTrigger() {
  const { user, profile, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user is authenticated and onboarding is not completed
    if (!isLoading && user && profile) {
      const isCompleted = profile.onboarding_completed === true;
      const wasDismissed = sessionStorage.getItem("sr_onboarding_dismissed") === "true";

      if (!isCompleted && !wasDismissed) {
        // Small delay so layout finishes initial mount
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [user, profile, isLoading]);

  useEffect(() => {
    // Allow manual opening via custom event from navbar or profile settings
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("storyremix:open-onboarding", handleOpen);
    return () => window.removeEventListener("storyremix:open-onboarding", handleOpen);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    try {
      sessionStorage.setItem("sr_onboarding_dismissed", "true");
    } catch {}
  };

  if (!isOpen) return null;

  return (
    <OnboardingWizard
      isOpen={isOpen}
      onClose={handleClose}
      initialStep={profile?.onboarding_step || 1}
      initialInterests={profile?.literary_interests || []}
      initialLanguage={profile?.preferred_language || "en"}
    />
  );
}
