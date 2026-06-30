export interface Workspace {
  id: number;
  name: string;
  created_at: string;
}

export interface ApiKey {
  id: number;
  workspace_id: number;
  key: string;
  created_at: string;
}

export interface User {
  id: number;
  workspace_id: number;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

export interface Post {
  id: number;
  workspace_id: number;
  user_id: number;
  content: string;
  image_url: string | null;
  created_at: string;
}

export interface Comment {
  id: number;
  post_id: number;
  user_id: number;
  content: string;
  created_at: string;
}

export interface Like {
  post_id: number;
  user_id: number;
  created_at: string;
}

export interface Follow {
  follower_id: number;
  following_id: number;
  created_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  actor_id: number;
  type: string;
  post_id: number | null;
  read_at: string | null;
  created_at: string;
}

export interface FeedItem {
  post_id: number;
  workspace_id: number;
  content: string;
  image_url: string | null;
  created_at: string;
  user_id: number;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  like_count: number;
  comment_count: number;
  liked_by_me: boolean | null;
}

export interface UserStats {
  user_id: number;
  username: string;
  post_count: number;
  follower_count: number;
  following_count: number;
  workspace_id: number;
}
