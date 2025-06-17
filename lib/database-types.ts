// Database schema types based on current Supabase structure
// Generated from database inspection

export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  website: string | null;
  twitter: string | null;
  github: string | null;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featured_image: string | null; // Primary image field used in database
  cover_image: string | null; // Secondary/alternative image field
  author_id: string;
  status: "draft" | "published";
  tags: string[] | null;
  read_time: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface Comment {
  id: string;
  post_id: string;
  parent_id: string | null;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Like {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

export interface PostCategory {
  post_id: string;
  category_id: string;
}

// Supabase query result types
export interface QueryResult<T = any> {
  data: T[] | null;
  error: any | null;
  count?: number | null;
}

// Database operations
export interface DatabaseOperations {
  // Profile operations
  getProfile: (id: string) => Promise<QueryResult<Profile>>;
  getProfileByUsername: (username: string) => Promise<QueryResult<Profile>>;
  updateProfile: (
    id: string,
    updates: Partial<Profile>
  ) => Promise<QueryResult<Profile>>;

  // Post operations
  getPosts: (filters?: PostFilters) => Promise<QueryResult<Post>>;
  getPost: (id: string) => Promise<QueryResult<Post>>;
  getPostBySlug: (slug: string) => Promise<QueryResult<Post>>;
  createPost: (
    post: Omit<Post, "id" | "created_at" | "updated_at">
  ) => Promise<QueryResult<Post>>;
  updatePost: (
    id: string,
    updates: Partial<Post>
  ) => Promise<QueryResult<Post>>;
  deletePost: (id: string) => Promise<QueryResult<any>>;
}

export interface PostFilters {
  status?: "draft" | "published";
  author_id?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
  order_by?: "created_at" | "updated_at" | "published_at";
  ascending?: boolean;
}

// Common query patterns
export const COMMON_QUERIES = {
  profiles: {
    // Get all profiles with basic info
    allProfiles: "select('id, username, full_name, avatar_url')",

    // Get profile by username
    byUsername: (username: string) =>
      `select('*').eq('username', '${username}').single()`,

    // Get profiles with social links
    withSocials:
      "select('id, username, full_name, website, twitter, github').not('website', 'is', null)",

    // Count all profiles
    count: "select('count', { count: 'exact' })",
  },

  posts: {
    // Get published posts
    published:
      "select('*').eq('status', 'published').order('published_at', { ascending: false })",

    // Get posts by author
    byAuthor: (authorId: string) =>
      `select('*').eq('author_id', '${authorId}').order('created_at', { ascending: false })`,

    // Get drafts
    drafts:
      "select('*').eq('status', 'draft').order('updated_at', { ascending: false })",

    // Get posts with tags
    withTags: "select('id, title, tags, status').not('tags', 'is', null)",

    // Get recent posts
    recent:
      "select('id, title, excerpt, author_id, published_at').eq('status', 'published').order('published_at', { ascending: false }).limit(10)",

    // Count posts by status
    countByStatus: (status: string) =>
      `select('count', { count: 'exact' }).eq('status', '${status}')`,

    // Search posts by title
    searchTitle: (term: string) =>
      `select('*').ilike('title', '%${term}%').eq('status', 'published')`,
  },
} as const;

// Helper functions for building queries
export const QueryBuilder = {
  // Build a select query with common patterns
  select: (table: "profiles" | "posts", columns: string = "*") =>
    `select('${columns}')`,

  // Build filters
  eq: (column: string, value: string | number | boolean) =>
    `.eq('${column}', ${typeof value === "string" ? `'${value}'` : value})`,

  // Build ordering
  order: (column: string, ascending = false) =>
    `.order('${column}', { ascending: ${ascending} })`,

  // Build limit
  limit: (count: number) => `.limit(${count})`,

  // Build pagination
  range: (from: number, to: number) => `.range(${from}, ${to})`,

  // Common combinations
  publishedPosts: (limit?: number) =>
    `select('*').eq('status', 'published').order('published_at', { ascending: false })${
      limit ? `.limit(${limit})` : ""
    }`,

  userPosts: (authorId: string, status?: "draft" | "published") =>
    `select('*').eq('author_id', '${authorId}')${
      status ? `.eq('status', '${status}')` : ""
    }.order('created_at', { ascending: false })`,
};

// Extended types with relationships
export interface PostWithAuthor extends Post {
  author: Profile;
}

export interface PostWithCategories extends Post {
  categories: Category[];
}

export interface PostWithAuthorAndCategories extends Post {
  author: Profile;
  categories: Category[];
}

export interface CommentWithAuthor extends Comment {
  author: Profile;
}

export interface CommentWithReplies extends Comment {
  author: Profile;
  replies?: CommentWithAuthor[];
}
