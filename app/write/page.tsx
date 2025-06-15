"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { generateSlug, calculateReadTime } from "@/lib/utils";
import { toast } from "sonner";
import {
  Save,
  Send,
  ArrowLeft,
  Image,
  Tag,
  Eye,
  Loader2,
  X,
  Edit3,
  Upload,
  ImageIcon,
} from "lucide-react";
import Link from "next/link";

interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  cover_image: string | null;
  tags: string[];
  status: "draft" | "published";
}

export default function WritePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [postData, setPostData] = useState({
    title: "",
    content: "",
    excerpt: "",
    coverImage: "",
    tags: [] as string[],
    status: "draft" as "draft" | "published",
  });
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState("");

  // Load post for editing
  useEffect(() => {
    if (editId && user) {
      loadPostForEditing(editId);
    }
  }, [editId, user]);

  const loadPostForEditing = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", postId)
        .eq("author_id", user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setPostData({
          title: data.title,
          content: data.content,
          excerpt: data.excerpt || "",
          coverImage: data.cover_image || "",
          tags: data.tags || [],
          status: data.status,
        });
        setIsEditing(true);
      }
    } catch (err) {
      console.error("Error loading post:", err);
      toast.error("Failed to load post for editing");
      router.push("/write");
    }
  };

  // Auto-save functionality
  useEffect(() => {
    if (!postData.title.trim() || !postData.content.trim()) return;

    const autoSave = setInterval(() => {
      if (postData.title.trim() && postData.content.trim() && !isSaving) {
        handleSave(true);
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSave);
  }, [postData.title, postData.content, isSaving]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push("/auth/signin");
    }
  }, [user, router]);

  const handleSave = async (isAutoSave = false) => {
    if (!user) return;

    setIsSaving(true);
    setError("");

    try {
      const slug = generateSlug(postData.title) + "-" + Date.now();
      const readTime = calculateReadTime(postData.content);
      const excerpt =
        postData.excerpt || postData.content.substring(0, 150) + "...";

      // Create post payload with only required fields first
      const basePayload = {
        title: postData.title.trim(),
        slug,
        content: postData.content.trim(),
        status: postData.status,
        author_id: user.id,
        ...(postData.status === "published"
          ? { published_at: new Date().toISOString() }
          : {}),
      };

      // Add optional fields that might not exist in database yet - skip for now to avoid DB errors
      const optionalFields: any = {};

      // Temporarily comment out optional fields that don't exist in DB yet
      // if (postData.excerpt || postData.content) {
      //   optionalFields.excerpt = excerpt;
      // }
      // if (postData.coverImage) {
      //   optionalFields.cover_image = postData.coverImage.trim();
      // }
      // if (postData.tags.length > 0) {
      //   optionalFields.tags = postData.tags;
      // }
      // if (readTime) {
      //   optionalFields.read_time = readTime;
      // }

      const postPayload = { ...basePayload, ...optionalFields };

      let result;
      if (isEditing && editId) {
        result = await supabase
          .from("posts")
          .update(postPayload)
          .eq("id", editId)
          .eq("author_id", user.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from("posts")
          .insert(postPayload)
          .select()
          .single();
      }

      if (result.error) {
        console.error("Database error:", result.error);
        throw result.error;
      }

      if (!isAutoSave) {
        toast.success(
          postData.status === "published" ? "Post published!" : "Draft saved!"
        );

        // Redirect after successful save
        if (postData.status === "published") {
          router.push("/dashboard");
        }
      }
    } catch (err: any) {
      console.error("Save error:", err);
      const errorMessage = err.message || "Failed to save post";
      setError(errorMessage);
      if (!isAutoSave) {
        toast.error(errorMessage);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!postData.title.trim() || !postData.content.trim()) {
      setError("Title and content are required");
      return;
    }

    setPostData((prev) => ({ ...prev, status: "published" }));
    await handleSave();
    router.push("/dashboard");
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setIsUploading(true);
    try {
      const fileName = `${user?.id}/${Date.now()}-${file.name}`;

      const { data, error } = await supabase.storage
        .from("post-images")
        .upload(fileName, file);

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("post-images").getPublicUrl(fileName);

      setPostData((prev) => ({ ...prev, coverImage: publicUrl }));
      toast.success("Image uploaded successfully!");
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !postData.tags.includes(tagInput.trim())) {
      setPostData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setPostData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild className="ui-text">
              <Link href="/dashboard" className="flex items-center ui-text">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div className="flex items-center space-x-2">
              {isEditing ? (
                <Edit3 className="w-5 h-5" />
              ) : (
                <Edit3 className="w-5 h-5" />
              )}
              <h1 className="text-2xl font-bold brand-text">
                {isEditing ? "Edit Your Story" : "Write Your Story"}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isSaving && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </div>
            )}
            <Button
              variant="outline"
              onClick={() => handleSave()}
              className="ui-text"
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <Button
              onClick={handlePublish}
              disabled={isLoading || isSaving}
              className="bg-foreground text-background hover:bg-foreground/90 ui-text"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Send className="w-4 h-4 mr-2" />
              {isEditing ? "Update" : "Publish"}
            </Button>
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Editor */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="elegant-card">
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {/* Title */}
                    <div>
                      <Input
                        placeholder="Enter your story title..."
                        value={postData.title}
                        onChange={(e) =>
                          setPostData((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        className="text-2xl font-bold border-none p-0 placeholder:text-muted-foreground focus-visible:ring-0 content"
                        maxLength={100}
                      />
                      <div className="text-xs text-muted-foreground mt-1 ui-text">
                        {postData.title.length}/100 characters
                      </div>
                    </div>

                    {/* Cover Image */}
                    <div>
                      <Label
                        htmlFor="coverImage"
                        className="text-sm font-medium flex items-center space-x-2"
                      >
                        <Image className="w-4 h-4" />
                        <span>Cover Image</span>
                      </Label>

                      <div className="mt-2 space-y-3">
                        {/* File Upload */}
                        <div className="flex items-center space-x-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="imageUpload"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              document.getElementById("imageUpload")?.click()
                            }
                            disabled={isUploading}
                            className="ui-text"
                          >
                            {isUploading ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Upload className="w-4 h-4 mr-2" />
                            )}
                            {isUploading ? "Uploading..." : "Upload Image"}
                          </Button>
                          <span className="text-sm text-muted-foreground">
                            or
                          </span>
                        </div>

                        {/* URL Input */}
                        <Input
                          id="coverImage"
                          placeholder="https://images.pexels.com/your-image.jpg"
                          value={postData.coverImage}
                          onChange={(e) =>
                            setPostData((prev) => ({
                              ...prev,
                              coverImage: e.target.value,
                            }))
                          }
                          className="focus-ring"
                        />
                      </div>

                      {postData.coverImage && (
                        <div className="mt-3 rounded-lg overflow-hidden relative">
                          <img
                            src={postData.coverImage}
                            alt="Cover preview"
                            className="w-full h-48 object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              setPostData((prev) => ({
                                ...prev,
                                coverImage: "",
                              }))
                            }
                            className="absolute top-2 right-2 ui-text"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div>
                      <Textarea
                        placeholder="Tell your story..."
                        value={postData.content}
                        onChange={(e) =>
                          setPostData((prev) => ({
                            ...prev,
                            content: e.target.value,
                          }))
                        }
                        className="min-h-[400px] border-none p-0 resize-none placeholder:text-muted-foreground focus-visible:ring-0 content"
                      />
                      <div className="text-xs text-muted-foreground mt-1 ui-text">
                        {postData.content.length} characters
                      </div>
                    </div>

                    {/* Excerpt */}
                    <div>
                      <Label htmlFor="excerpt" className="text-sm font-medium">
                        Excerpt (optional)
                      </Label>
                      <Textarea
                        id="excerpt"
                        placeholder="Brief description of your post..."
                        value={postData.excerpt}
                        onChange={(e) =>
                          setPostData((prev) => ({
                            ...prev,
                            excerpt: e.target.value,
                          }))
                        }
                        className="mt-2 max-h-24"
                        rows={3}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tags */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="elegant-card">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Tag className="w-4 h-4 mr-2" />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Input
                        placeholder="Add tags..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1"
                      />
                      <Button size="sm" onClick={addTag}>
                        Add
                      </Button>
                    </div>

                    {postData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {postData.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="flex items-center space-x-1"
                          >
                            <span>{tag}</span>
                            <X
                              className="w-3 h-3 cursor-pointer hover:text-destructive"
                              onClick={() => removeTag(tag)}
                            />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Preview Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="elegant-card">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Eye className="w-4 h-4 mr-2" />
                    Post Info
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Words:</span>
                      <span>
                        {
                          postData.content
                            .trim()
                            .split(/\s+/)
                            .filter((word) => word.length > 0).length
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Characters:</span>
                      <span>{postData.content.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Read time:</span>
                      <span>{calculateReadTime(postData.content)}m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge
                        variant={
                          postData.status === "published"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {postData.status}
                      </Badge>
                    </div>
                    {isEditing && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Mode:</span>
                        <Badge variant="outline">Editing</Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
