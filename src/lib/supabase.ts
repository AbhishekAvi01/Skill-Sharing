import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Tutorial = Database['public']['Tables']['tutorials']['Row'];
export type TutorialComment = Database['public']['Tables']['tutorial_comments']['Row'];
export type TutorialLike = Database['public']['Tables']['tutorial_likes']['Row'];
export type Enrollment = Database['public']['Tables']['enrollments']['Row'];

export { supabase };
