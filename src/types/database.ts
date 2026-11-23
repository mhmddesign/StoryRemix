export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "user" | "moderator" | "admin";
export type StoryStatus = "draft" | "active" | "completed" | "archived";
export type StoryVisibility = "public" | "unlisted" | "private";
export type RoundStatus = "open" | "evaluating" | "awaiting_creator_resolution" | "resolved" | "cancelled";
export type RoundResolutionType = "threshold_met" | "creator_override" | "round_extended" | "cancelled";
export type ContributionStatus = "active" | "winner" | "eliminated" | "withdrawn";
export type ReportStatus = "pending" | "reviewing" | "resolved" | "dismissed";

export type CreativePathType = "storyteller" | "collaborator" | "explorer" | "curator" | "worldbuilder" | "patron";
export type AchievementRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
export type AchievementCategory = "writing" | "collaboration" | "discovery" | "support";
export type ChallengePeriodType = "daily" | "weekly";
export type RevenuePolicyType = "equal_collaborators" | "contribution_weighted" | "creator_and_collaborators" | "weighted_roles";
export type GiftTransactionStatus = "pending" | "completed" | "refunded" | "failed";
export type LeaderboardPeriodType = "today" | "week" | "month" | "year" | "all_time";
export type LeaderboardCategory = "hot" | "trending" | "best_today" | "best_week" | "best_month" | "best_year" | "all_time" | "top_creators";
export type CompetitionStatus = "draft" | "active" | "judging" | "awarded" | "cancelled";
export type FinancialAccountType = "platform_revenue" | "creator_escrow" | "creator_payout" | "refund_escrow";
export type LedgerEntryType = "debit" | "credit";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string;
          avatar_url: string | null;
          bio: string | null;
          preferred_language: string;
          role: UserRole;
          privacy_settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name: string;
          avatar_url?: string | null;
          bio?: string | null;
          preferred_language?: string;
          role?: UserRole;
          privacy_settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string;
          avatar_url?: string | null;
          bio?: string | null;
          preferred_language?: string;
          role?: UserRole;
          privacy_settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      stories: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          slug: string;
          description: string | null;
          genre: string;
          tags: string[];
          language: string;
          visibility: StoryVisibility;
          cover_image_url: string | null;
          cover_alt_text?: string | null;
          cover_creator_id?: string | null;
          max_paragraphs: number;
          current_paragraph_count: number;
          default_vote_threshold: number;
          default_round_duration: number;
          status: StoryStatus;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          slug: string;
          description?: string | null;
          genre: string;
          tags?: string[];
          language?: string;
          visibility?: StoryVisibility;
          cover_image_url?: string | null;
          cover_alt_text?: string | null;
          cover_creator_id?: string | null;
          max_paragraphs: number;
          current_paragraph_count?: number;
          default_vote_threshold?: number;
          default_round_duration?: number;
          status?: StoryStatus;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          owner_id?: string;
          title?: string;
          slug?: string;
          description?: string | null;
          genre?: string;
          tags?: string[];
          language?: string;
          visibility?: StoryVisibility;
          cover_image_url?: string | null;
          cover_alt_text?: string | null;
          cover_creator_id?: string | null;
          max_paragraphs?: number;
          current_paragraph_count?: number;
          default_vote_threshold?: number;
          default_round_duration?: number;
          status?: StoryStatus;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "stories_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      story_rounds: {
        Row: {
          id: string;
          story_id: string;
          round_number: number;
          paragraph_position: number;
          vote_threshold: number;
          opened_at: string;
          deadline_at: string;
          status: RoundStatus;
          winner_contribution_id: string | null;
          closed_at: string | null;
          resolved_at: string | null;
          resolution_type: RoundResolutionType | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          story_id: string;
          round_number: number;
          paragraph_position: number;
          vote_threshold: number;
          opened_at?: string;
          deadline_at: string;
          status?: RoundStatus;
          winner_contribution_id?: string | null;
          closed_at?: string | null;
          resolved_at?: string | null;
          resolution_type?: RoundResolutionType | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          story_id?: string;
          round_number?: number;
          paragraph_position?: number;
          vote_threshold?: number;
          opened_at?: string;
          deadline_at?: string;
          status?: RoundStatus;
          winner_contribution_id?: string | null;
          closed_at?: string | null;
          resolved_at?: string | null;
          resolution_type?: RoundResolutionType | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "story_rounds_story_id_fkey";
            columns: ["story_id"];
            isOneToOne: false;
            referencedRelation: "stories";
            referencedColumns: ["id"];
          }
        ];
      };
      contributions: {
        Row: {
          id: string;
          story_id: string;
          round_id: string;
          author_id: string;
          body: string;
          sentence_count: number;
          word_count: number;
          status: ContributionStatus;
          vote_count: number;
          submitted_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          story_id: string;
          round_id: string;
          author_id: string;
          body: string;
          sentence_count: number;
          word_count: number;
          status?: ContributionStatus;
          vote_count?: number;
          submitted_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          story_id?: string;
          round_id?: string;
          author_id?: string;
          body?: string;
          sentence_count?: number;
          word_count?: number;
          status?: ContributionStatus;
          vote_count?: number;
          submitted_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contributions_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contributions_story_id_fkey";
            columns: ["story_id"];
            isOneToOne: false;
            referencedRelation: "stories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contributions_round_id_fkey";
            columns: ["round_id"];
            isOneToOne: false;
            referencedRelation: "story_rounds";
            referencedColumns: ["id"];
          }
        ];
      };
      votes: {
        Row: {
          id: string;
          round_id: string;
          contribution_id: string;
          voter_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          round_id: string;
          contribution_id: string;
          voter_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          round_id?: string;
          contribution_id?: string;
          voter_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      story_segments: {
        Row: {
          id: string;
          story_id: string;
          paragraph_index: number;
          author_id: string;
          source_contribution_id: string | null;
          body: string;
          vote_count_at_lock: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          story_id: string;
          paragraph_index: number;
          author_id: string;
          source_contribution_id?: string | null;
          body: string;
          vote_count_at_lock?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          story_id?: string;
          paragraph_index?: number;
          author_id?: string;
          source_contribution_id?: string | null;
          body?: string;
          vote_count_at_lock?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "story_segments_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "story_segments_story_id_fkey";
            columns: ["story_id"];
            isOneToOne: false;
            referencedRelation: "stories";
            referencedColumns: ["id"];
          }
        ];
      };
      story_likes: {
        Row: {
          id: string;
          story_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          story_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          story_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      story_reactions: {
        Row: {
          id: string;
          story_id: string;
          segment_id: string | null;
          user_id: string;
          reaction_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          story_id: string;
          segment_id?: string | null;
          user_id: string;
          reaction_type: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          story_id?: string;
          segment_id?: string | null;
          user_id?: string;
          reaction_type?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      level_definitions: {
        Row: {
          level: number;
          title: string;
          xp_required: number;
          badge_icon: string;
          created_at: string;
        };
        Insert: {
          level: number;
          title: string;
          xp_required: number;
          badge_icon: string;
          created_at?: string;
        };
        Update: {
          level?: number;
          title?: string;
          xp_required?: number;
          badge_icon?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      user_gamification: {
        Row: {
          user_id: string;
          lifetime_xp: number;
          current_level: number;
          creative_path: CreativePathType;
          calculated_archetype: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          lifetime_xp?: number;
          current_level?: number;
          creative_path?: CreativePathType;
          calculated_archetype?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          lifetime_xp?: number;
          current_level?: number;
          creative_path?: CreativePathType;
          calculated_archetype?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      xp_transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          activity_type: string;
          event_id: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          activity_type: string;
          event_id: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          activity_type?: string;
          event_id?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      achievement_definitions: {
        Row: {
          id: string;
          code: string;
          title: string;
          description: string;
          category: AchievementCategory;
          rarity: AchievementRarity;
          xp_reward: number;
          icon: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          title: string;
          description: string;
          category: AchievementCategory;
          rarity?: AchievementRarity;
          xp_reward?: number;
          icon: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          title?: string;
          description?: string;
          category?: AchievementCategory;
          rarity?: AchievementRarity;
          xp_reward?: number;
          icon?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      user_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          unlocked_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          achievement_id: string;
          unlocked_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          achievement_id?: string;
          unlocked_at?: string;
        };
        Relationships: [];
      };
      challenge_definitions: {
        Row: {
          id: string;
          code: string;
          title: string;
          description: string;
          period_type: ChallengePeriodType;
          target_count: number;
          activity_type: string;
          xp_reward: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          title: string;
          description: string;
          period_type: ChallengePeriodType;
          target_count: number;
          activity_type: string;
          xp_reward: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          title?: string;
          description?: string;
          period_type?: ChallengePeriodType;
          target_count?: number;
          activity_type?: string;
          xp_reward?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      user_challenge_progress: {
        Row: {
          id: string;
          user_id: string;
          challenge_id: string;
          period_identifier: string;
          current_count: number;
          is_completed: boolean;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          challenge_id: string;
          period_identifier: string;
          current_count?: number;
          is_completed?: boolean;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          challenge_id?: string;
          period_identifier?: string;
          current_count?: number;
          is_completed?: boolean;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      gift_catalog: {
        Row: {
          id: string;
          code: string;
          name: string;
          symbol: string;
          price_cents: number;
          creator_share_basis_points: number;
          platform_fee_basis_points: number;
          is_active: boolean;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          symbol: string;
          price_cents: number;
          creator_share_basis_points?: number;
          platform_fee_basis_points?: number;
          is_active?: boolean;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          symbol?: string;
          price_cents?: number;
          creator_share_basis_points?: number;
          platform_fee_basis_points?: number;
          is_active?: boolean;
          description?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      author_revenue_policies: {
        Row: {
          id: string;
          story_id: string;
          policy_type: RevenuePolicyType;
          creator_reserved_percentage: number | null;
          opening_paragraph_weight: number | null;
          continuation_paragraph_weight: number | null;
          final_paragraph_weight: number | null;
          version: number;
          is_locked: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          story_id: string;
          policy_type?: RevenuePolicyType;
          creator_reserved_percentage?: number | null;
          opening_paragraph_weight?: number | null;
          continuation_paragraph_weight?: number | null;
          final_paragraph_weight?: number | null;
          version?: number;
          is_locked?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          story_id?: string;
          policy_type?: RevenuePolicyType;
          creator_reserved_percentage?: number | null;
          opening_paragraph_weight?: number | null;
          continuation_paragraph_weight?: number | null;
          final_paragraph_weight?: number | null;
          version?: number;
          is_locked?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      contributor_policy_consents: {
        Row: {
          id: string;
          story_id: string;
          policy_id: string;
          user_id: string;
          consented_at: string;
        };
        Insert: {
          id?: string;
          story_id: string;
          policy_id: string;
          user_id: string;
          consented_at?: string;
        };
        Update: {
          id?: string;
          story_id?: string;
          policy_id?: string;
          user_id?: string;
          consented_at?: string;
        };
        Relationships: [];
      };
      gift_transactions: {
        Row: {
          id: string;
          gift_id: string;
          story_id: string;
          segment_id: string | null;
          sender_id: string;
          amount_cents: number;
          creator_pool_cents: number;
          platform_fee_cents: number;
          status: GiftTransactionStatus;
          payment_reference: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          gift_id: string;
          story_id: string;
          segment_id?: string | null;
          sender_id: string;
          amount_cents: number;
          creator_pool_cents: number;
          platform_fee_cents: number;
          status?: GiftTransactionStatus;
          payment_reference?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          gift_id?: string;
          story_id?: string;
          segment_id?: string | null;
          sender_id?: string;
          amount_cents?: number;
          creator_pool_cents?: number;
          platform_fee_cents?: number;
          status?: GiftTransactionStatus;
          payment_reference?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      gift_allocations: {
        Row: {
          id: string;
          gift_transaction_id: string;
          recipient_id: string;
          allocated_cents: number;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          gift_transaction_id: string;
          recipient_id: string;
          allocated_cents: number;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          gift_transaction_id?: string;
          recipient_id?: string;
          allocated_cents?: number;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      financial_transactions: {
        Row: {
          id: string;
          reference_type: string;
          reference_id: string;
          amount_cents: number;
          currency: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          reference_type: string;
          reference_id: string;
          amount_cents: number;
          currency?: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          reference_type?: string;
          reference_id?: string;
          amount_cents?: number;
          currency?: string;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      financial_ledger_entries: {
        Row: {
          id: string;
          transaction_id: string;
          account_type: FinancialAccountType;
          account_id: string;
          entry_type: LedgerEntryType;
          amount_cents: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          transaction_id: string;
          account_type: FinancialAccountType;
          account_id: string;
          entry_type: LedgerEntryType;
          amount_cents: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          transaction_id?: string;
          account_type?: FinancialAccountType;
          account_id?: string;
          entry_type?: LedgerEntryType;
          amount_cents?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      payout_accounts: {
        Row: {
          user_id: string;
          payout_provider: string;
          provider_account_id: string | null;
          kyc_status: string;
          country_code: string;
          is_payout_enabled: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          payout_provider?: string;
          provider_account_id?: string | null;
          kyc_status?: string;
          country_code?: string;
          is_payout_enabled?: boolean;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          payout_provider?: string;
          provider_account_id?: string | null;
          kyc_status?: string;
          country_code?: string;
          is_payout_enabled?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      leaderboard_snapshots: {
        Row: {
          id: string;
          period_type: LeaderboardPeriodType;
          ranking_category: LeaderboardCategory;
          period_start: string;
          period_end: string;
          snapshot_time: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          period_type: LeaderboardPeriodType;
          ranking_category: LeaderboardCategory;
          period_start: string;
          period_end: string;
          snapshot_time?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          period_type?: LeaderboardPeriodType;
          ranking_category?: LeaderboardCategory;
          period_start?: string;
          period_end?: string;
          snapshot_time?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      leaderboard_entries: {
        Row: {
          id: string;
          snapshot_id: string;
          rank: number;
          target_type: "story" | "creator";
          target_id: string;
          score: number;
          score_breakdown: Json;
          metadata: Json;
        };
        Insert: {
          id?: string;
          snapshot_id: string;
          rank: number;
          target_type: "story" | "creator";
          target_id: string;
          score: number;
          score_breakdown?: Json;
          metadata?: Json;
        };
        Update: {
          id?: string;
          snapshot_id?: string;
          rank?: number;
          target_type?: "story" | "creator";
          target_id?: string;
          score?: number;
          score_breakdown?: Json;
          metadata?: Json;
        };
        Relationships: [];
      };
      prize_competitions: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          period_type: "monthly" | "annual";
          start_date: string;
          end_date: string;
          prize_amount_cents: number;
          currency: string;
          funding_source: string;
          is_funded: boolean;
          status: CompetitionStatus;
          rules_terms: string;
          winner_story_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          period_type: "monthly" | "annual";
          start_date: string;
          end_date: string;
          prize_amount_cents: number;
          currency?: string;
          funding_source: string;
          is_funded?: boolean;
          status?: CompetitionStatus;
          rules_terms: string;
          winner_story_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          period_type?: "monthly" | "annual";
          start_date?: string;
          end_date?: string;
          prize_amount_cents?: number;
          currency?: string;
          funding_source?: string;
          is_funded?: boolean;
          status?: CompetitionStatus;
          rules_terms?: string;
          winner_story_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      prize_awards: {
        Row: {
          id: string;
          competition_id: string;
          story_id: string;
          award_rank: number;
          prize_amount_cents: number;
          award_badge_code: string;
          status: string;
          awarded_at: string;
        };
        Insert: {
          id?: string;
          competition_id: string;
          story_id: string;
          award_rank?: number;
          prize_amount_cents?: number;
          award_badge_code: string;
          status?: string;
          awarded_at?: string;
        };
        Update: {
          id?: string;
          competition_id?: string;
          story_id?: string;
          award_rank?: number;
          prize_amount_cents?: number;
          award_badge_code?: string;
          status?: string;
          awarded_at?: string;
        };
        Relationships: [];
      };
      prize_allocation_records: {
        Row: {
          id: string;
          prize_award_id: string;
          recipient_id: string;
          allocated_cents: number;
          percentage: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          prize_award_id: string;
          recipient_id: string;
          allocated_cents: number;
          percentage: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          prize_award_id?: string;
          recipient_id?: string;
          allocated_cents?: number;
          percentage?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      story_cover_proposals: {
        Row: {
          id: string;
          story_id: string;
          proposer_id: string;
          image_url: string;
          alt_text: string | null;
          status: "pending" | "approved" | "rejected" | "voting";
          votes_count: number;
          rights_confirmed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          story_id: string;
          proposer_id: string;
          image_url: string;
          alt_text?: string | null;
          status?: "pending" | "approved" | "rejected" | "voting";
          votes_count?: number;
          rights_confirmed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          story_id?: string;
          proposer_id?: string;
          image_url?: string;
          alt_text?: string | null;
          status?: "pending" | "approved" | "rejected" | "voting";
          votes_count?: number;
          rights_confirmed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      story_cover_votes: {
        Row: {
          id: string;
          story_id: string;
          proposal_id: string;
          voter_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          story_id: string;
          proposal_id: string;
          voter_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          story_id?: string;
          proposal_id?: string;
          voter_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      story_cover_history: {
        Row: {
          id: string;
          story_id: string;
          image_url: string;
          alt_text: string | null;
          chosen_by: string | null;
          proposal_id: string | null;
          replaced_at: string;
        };
        Insert: {
          id?: string;
          story_id: string;
          image_url: string;
          alt_text?: string | null;
          chosen_by?: string | null;
          proposal_id?: string | null;
          replaced_at?: string;
        };
        Update: {
          id?: string;
          story_id?: string;
          image_url?: string;
          alt_text?: string | null;
          chosen_by?: string | null;
          proposal_id?: string | null;
          replaced_at?: string;
        };
        Relationships: [];
      };
      donations: {
        Row: {
          id: string;
          story_id: string | null;
          donor_id: string | null;
          gross_amount_cents: number;
          processor_fee_cents: number;
          net_amount_cents: number;
          creator_pool_cents: number;
          platform_fee_cents: number;
          currency: string;
          status: "pending" | "completed" | "failed" | "refunded";
          is_sandbox: boolean;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          story_id?: string | null;
          donor_id?: string | null;
          gross_amount_cents: number;
          processor_fee_cents?: number;
          net_amount_cents: number;
          creator_pool_cents: number;
          platform_fee_cents: number;
          currency?: string;
          status?: "pending" | "completed" | "failed" | "refunded";
          is_sandbox?: boolean;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          story_id?: string | null;
          donor_id?: string | null;
          gross_amount_cents?: number;
          processor_fee_cents?: number;
          net_amount_cents?: number;
          creator_pool_cents?: number;
          platform_fee_cents?: number;
          currency?: string;
          status?: "pending" | "completed" | "failed" | "refunded";
          is_sandbox?: boolean;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      donation_allocations: {
        Row: {
          id: string;
          donation_id: string;
          author_id: string;
          allocated_cents: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          donation_id: string;
          author_id: string;
          allocated_cents: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          donation_id?: string;
          author_id?: string;
          allocated_cents?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          story_id: string;
          author_id: string;
          parent_comment_id: string | null;
          body: string;
          status: "active" | "deleted" | "hidden";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          story_id: string;
          author_id: string;
          parent_comment_id?: string | null;
          body: string;
          status?: "active" | "deleted" | "hidden";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          story_id?: string;
          author_id?: string;
          parent_comment_id?: string | null;
          body?: string;
          status?: "active" | "deleted" | "hidden";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      follows: {
        Row: {
          follower_id: string;
          followed_id: string;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          followed_id: string;
          created_at?: string;
        };
        Update: {
          follower_id?: string;
          followed_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      bookmarks: {
        Row: {
          user_id: string;
          story_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          story_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          story_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          recipient_id: string;
          actor_id: string | null;
          type: string;
          target_type: string;
          target_id: string;
          metadata: Json;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipient_id: string;
          actor_id?: string | null;
          type: string;
          target_type: string;
          target_id: string;
          metadata?: Json;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          recipient_id?: string;
          actor_id?: string | null;
          type?: string;
          target_type?: string;
          target_id?: string;
          metadata?: Json;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          target_type: "story" | "contribution" | "comment" | "profile";
          target_id: string;
          reason: string;
          description: string | null;
          status: ReportStatus;
          moderator_id: string | null;
          resolution_notes: string | null;
          created_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          target_type: "story" | "contribution" | "comment" | "profile";
          target_id: string;
          reason: string;
          description?: string | null;
          status?: ReportStatus;
          moderator_id?: string | null;
          resolution_notes?: string | null;
          created_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          target_type?: "story" | "contribution" | "comment" | "profile";
          target_id?: string;
          reason?: string;
          description?: string | null;
          status?: ReportStatus;
          moderator_id?: string | null;
          resolution_notes?: string | null;
          created_at?: string;
          resolved_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      blocks: {
        Row: {
          blocker_id: string;
          blocked_id: string;
          created_at: string;
        };
        Insert: {
          blocker_id: string;
          blocked_id: string;
          created_at?: string;
        };
        Update: {
          blocker_id?: string;
          blocked_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      mutes: {
        Row: {
          muter_id: string;
          muted_id: string;
          created_at: string;
        };
        Insert: {
          muter_id: string;
          muted_id: string;
          created_at?: string;
        };
        Update: {
          muter_id?: string;
          muted_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      story_remixes: {
        Row: {
          id: string;
          parent_story_id: string;
          remix_story_id: string;
          remixed_at_paragraph: number;
          creator_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          parent_story_id: string;
          remix_story_id: string;
          remixed_at_paragraph: number;
          creator_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          parent_story_id?: string;
          remix_story_id?: string;
          remixed_at_paragraph?: number;
          creator_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      share_events: {
        Row: {
          id: string;
          story_id: string;
          referrer_id: string | null;
          channel: string;
          client_hash: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          story_id: string;
          referrer_id?: string | null;
          channel: string;
          client_hash?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          story_id?: string;
          referrer_id?: string | null;
          channel?: string;
          client_hash?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      analytics_events: {
        Row: {
          id: string;
          event_name: string;
          user_id: string | null;
          anonymous_id: string | null;
          properties: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_name: string;
          user_id?: string | null;
          anonymous_id?: string | null;
          properties?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_name?: string;
          user_id?: string | null;
          anonymous_id?: string | null;
          properties?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      moderation_audit_logs: {
        Row: {
          id: string;
          moderator_id: string;
          action: string;
          target_type: string;
          target_id: string;
          details: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          moderator_id: string;
          action: string;
          target_type: string;
          target_id: string;
          details?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          moderator_id?: string;
          action?: string;
          target_type?: string;
          target_id?: string;
          details?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "moderation_audit_logs_moderator_id_fkey";
            columns: ["moderator_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      submit_continuation: {
        Args: {
          p_story_id: string;
          p_round_id: string;
          p_body: string;
          p_sentence_count: number;
          p_word_count: number;
        };
        Returns: Json;
      };
      cast_vote: {
        Args: {
          p_round_id: string;
          p_contribution_id: string;
        };
        Returns: Json;
      };
      finalize_round: {
        Args: {
          p_round_id: string;
        };
        Returns: Json;
      };
      resolve_unqualified_round: {
        Args: {
          p_round_id: string;
          p_action: string;
          p_selected_contribution_id?: string | null;
          p_extension_seconds?: number;
        };
        Returns: Json;
      };
      award_xp: {
        Args: {
          p_user_id: string;
          p_activity_type: string;
          p_amount: number;
          p_event_id: string;
          p_metadata?: Json;
        };
        Returns: Json;
      };
      calculate_story_revenue_shares: {
        Args: {
          p_story_id: string;
          p_pool_cents: number;
        };
        Returns: {
          author_id: string;
          allocated_cents: number;
          share_percentage: number;
        }[];
      };
    };
    Enums: {
      user_role: UserRole;
      story_status: StoryStatus;
      story_visibility: StoryVisibility;
      round_status: RoundStatus;
      round_resolution_type: RoundResolutionType;
      contribution_status: ContributionStatus;
      report_status: ReportStatus;
      creative_path_type: CreativePathType;
      achievement_rarity: AchievementRarity;
      achievement_category: AchievementCategory;
      challenge_period_type: ChallengePeriodType;
      revenue_policy_type: RevenuePolicyType;
      gift_transaction_status: GiftTransactionStatus;
      leaderboard_period_type: LeaderboardPeriodType;
      leaderboard_category: LeaderboardCategory;
      competition_status: CompetitionStatus;
      financial_account_type: FinancialAccountType;
      ledger_entry_type: LedgerEntryType;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
