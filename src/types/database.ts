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
    };
    Enums: {
      user_role: UserRole;
      story_status: StoryStatus;
      story_visibility: StoryVisibility;
      round_status: RoundStatus;
      round_resolution_type: RoundResolutionType;
      contribution_status: ContributionStatus;
      report_status: ReportStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
