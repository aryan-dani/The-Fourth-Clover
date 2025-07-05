"use client";

import { useState, useEffect } from "react";
import { notFound } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { logSupabaseError } from "@/lib/debug-supabase";
import {
  formatDate,
  shareToTwitter,
  shareToWhatsApp,
  copyToClipboard,
} from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { toast } from "sonner";
import {
  Heart,
  MessageCircle,
  Share2,
  Clock,
  Calendar,
  Twitter,
  Send,
  Copy,
  ArrowLeft,
  Loader2,
  Reply,
} from "lucide-react";
import Link from "next/link";
import { CommentSection } from "@/components/comments/CommentSection";

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  cover_image: string | null;
  tags: string[];
  read_time: number;
  created_at: string;
  published_at: string;
  profiles: {
    username: string;
    full_name: string;
    avatar_url: string | null;
    bio: string | null;
  };
}

export default function PostPage({ params }: { params: { slug: string } }) {
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPost();
    if (user) {
      checkIfLiked();
    }
  }, [params.slug, user]);

  const fetchPost = async () => {
    try {
      console.log("🔍 Fetching post with slug:", params.slug);

      // First, get the post
      const { data: postData, error: postError } = await supabase
        .from("posts")
        .select("*")
        .eq("slug", params.slug)
        .eq("status", "published")
        .single();

      if (postError) {
        console.error("❌ Error fetching post:", postError);
        if (postError.code === "PGRST116") {
          notFound();
        }
        throw postError;
      }

      if (!postData) {
        console.error("❌ No post found with slug:", params.slug);
        notFound();
        return;
      }

      // Then, get the author profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("username, full_name, avatar_url, bio")
        .eq("id", postData.author_id)
        .single();

      if (profileError) {
        console.warn("⚠️ Could not fetch author profile:", profileError);
        // Continue without profile data
      }

      // Combine the data
      const combinedData = {
        ...postData,
        profiles: profileData || {
          username: "Anonymous",
          full_name: "Anonymous User",
          avatar_url: null,
          bio: null,
        },
      };

      console.log("✅ Post fetched successfully:", combinedData);
      setPost(combinedData);

      // Get likes count
      const { count } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("post_id", postData.id);

      setLikesCount(count || 0);
    } catch (error) {
      console.error("❌ Error fetching post:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfLiked = async () => {
    if (!user || !post) return;

    try {
      console.log("❤️ Checking if user liked post:", {
        post_id: post.id,
        user_id: user.id,
      });

      const { data, error } = await supabase
        .from("likes")
        .select("id")
        .eq("post_id", post.id)
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 means no rows found, which is expected if user hasn't liked
        logSupabaseError("Check If Liked", error, {
          post_id: post.id,
          user_id: user.id,
        });
        console.warn("⚠️ Error checking if liked:", error);
        return;
      }

      if (!error && data) {
        console.log("✅ User has liked this post");
        setIsLiked(true);
      } else {
        console.log("ℹ️ User has not liked this post");
      }
    } catch (error) {
      console.error("❌ Unexpected error checking if liked:", error);
    }
  };

  const toggleLike = async () => {
    if (!user || !post) {
      toast.error("Please sign in to like posts");
      return;
    }

    try {
      console.log(`${isLiked ? "💔" : "❤️"} Toggling like for post:`, {
        post_id: post.id,
        user_id: user.id,
        current_state: isLiked ? "liked" : "not_liked",
      });

      if (isLiked) {
        // Remove like
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", user.id);

        if (error) {
          logSupabaseError("Remove Like", error, {
            post_id: post.id,
            user_id: user.id,
          });
          throw error;
        }

        setIsLiked(false);
        setLikesCount((prev) => prev - 1);
        console.log("✅ Like removed successfully");
        toast.success("Like removed");
      } else {
        // Add like
        const { error } = await supabase.from("likes").insert({
          post_id: post.id,
          user_id: user.id,
        });

        if (error) {
          logSupabaseError("Add Like", error, {
            post_id: post.id,
            user_id: user.id,
          });
          throw error;
        }

        setIsLiked(true);
        setLikesCount((prev) => prev + 1);
        console.log("✅ Like added successfully");
        toast.success("Post liked! ❤️");
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Failed to update like");
    }
  };

  const handleShare = (platform: "twitter" | "whatsapp" | "copy") => {
    if (!post) return;

    const url = window.location.href;

    switch (platform) {
      case "twitter":
        shareToTwitter(post.title, url);
        break;
      case "whatsapp":
        shareToWhatsApp(post.title, url);
        break;
      case "copy":
        copyToClipboard(url);
        toast.success("Link copied to clipboard! 📋");
        break;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="aspect-video bg-muted rounded"></div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Button variant="ghost" asChild className="hover:bg-accent ui-text">
              <Link href="/explore" className="flex items-center ui-text">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Explore
              </Link>
            </Button>
          </motion.div>

          {/* Article Header */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <header className="mb-8">
              <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight brand-text">
                {post.title}
              </h1>

              {/* Author Info */}
              <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                <Link
                  href={`/profile/${post.profiles.username}`}
                  className="flex items-center space-x-4 hover:opacity-80 transition-opacity"
                >
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={post.profiles.avatar_url || ""} />
                    <AvatarFallback>
                      {post.profiles.full_name?.[0] ||
                        post.profiles.username[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold ui-text">
                      {post.profiles.full_name || post.profiles.username}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground ui-text">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(post.published_at)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{post.read_time} min read</span>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Engagement Actions */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant={isLiked ? "default" : "outline"}
                    size="sm"
                    onClick={toggleLike}
                    className={`flex items-center space-x-2 transition-all ${
                      isLiked ? "glow-button animate-pulse-slow" : "glass-hover"
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`}
                    />
                    <span>{likesCount}</span>
                  </Button>

                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare("twitter")}
                      className="glass-hover"
                    >
                      <Twitter className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare("whatsapp")}
                      className="glass-hover"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare("copy")}
                      className="glass-hover"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {post.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="hover:bg-accent transition-colors"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Cover Image */}
              {post.cover_image && (
                <div className="aspect-video rounded-lg overflow-hidden mb-8">
                  <img
                    src={post.cover_image}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </header>

            {/* Article Content */}
            <div className="prose prose-lg max-w-none mb-12">
              {post.content.split("\n").map((paragraph, index) => (
                <p key={index} className="mb-6 leading-relaxed text-lg content">
                  {paragraph}
                </p>
              ))}
            </div>
          </motion.article>

          {/* Comments Section */}
          <CommentSection postId={post.id} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
