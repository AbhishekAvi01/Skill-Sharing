-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create enum for tutorial difficulty
CREATE TYPE public.difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced');

-- Create enum for tutorial category
CREATE TYPE public.tutorial_category AS ENUM (
  'programming',
  'design',
  'music',
  'art',
  'cooking',
  'photography',
  'business',
  'fitness',
  'languages',
  'other'
);

-- Create tutorials table
CREATE TABLE public.tutorials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category tutorial_category NOT NULL,
  difficulty difficulty_level NOT NULL,
  thumbnail_url TEXT,
  video_url TEXT,
  resources JSONB DEFAULT '[]'::jsonb,
  likes_count INTEGER DEFAULT 0 NOT NULL,
  comments_count INTEGER DEFAULT 0 NOT NULL,
  enrollments_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on tutorials
ALTER TABLE public.tutorials ENABLE ROW LEVEL SECURITY;

-- Tutorials policies
CREATE POLICY "Tutorials are viewable by everyone"
  ON public.tutorials FOR SELECT
  USING (true);

CREATE POLICY "Users can create tutorials"
  ON public.tutorials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tutorials"
  ON public.tutorials FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tutorials"
  ON public.tutorials FOR DELETE
  USING (auth.uid() = user_id);

-- Create tutorial_likes table
CREATE TABLE public.tutorial_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutorial_id UUID REFERENCES public.tutorials(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(tutorial_id, user_id)
);

-- Enable RLS on tutorial_likes
ALTER TABLE public.tutorial_likes ENABLE ROW LEVEL SECURITY;

-- Tutorial likes policies
CREATE POLICY "Likes are viewable by everyone"
  ON public.tutorial_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like tutorials"
  ON public.tutorial_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike tutorials"
  ON public.tutorial_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Create tutorial_comments table
CREATE TABLE public.tutorial_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutorial_id UUID REFERENCES public.tutorials(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on tutorial_comments
ALTER TABLE public.tutorial_comments ENABLE ROW LEVEL SECURITY;

-- Comments policies
CREATE POLICY "Comments are viewable by everyone"
  ON public.tutorial_comments FOR SELECT
  USING (true);

CREATE POLICY "Users can create comments"
  ON public.tutorial_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.tutorial_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Create enrollments table
CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutorial_id UUID REFERENCES public.tutorials(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(tutorial_id, user_id)
);

-- Enable RLS on enrollments
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Enrollments policies
CREATE POLICY "Users can view their own enrollments"
  ON public.enrollments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can enroll in tutorials"
  ON public.enrollments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unenroll from tutorials"
  ON public.enrollments FOR DELETE
  USING (auth.uid() = user_id);

-- Create storage bucket for tutorial media
INSERT INTO storage.buckets (id, name, public)
VALUES ('tutorial-media', 'tutorial-media', true);

-- Storage policies for tutorial media
CREATE POLICY "Tutorial media is publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'tutorial-media');

CREATE POLICY "Authenticated users can upload tutorial media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'tutorial-media' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own tutorial media"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'tutorial-media' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own tutorial media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'tutorial-media' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, bio, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    NULL,
    NULL
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update tutorial likes count
CREATE OR REPLACE FUNCTION public.update_tutorial_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.tutorials
    SET likes_count = likes_count + 1
    WHERE id = NEW.tutorial_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.tutorials
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.tutorial_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger to update likes count
CREATE TRIGGER on_tutorial_like_change
  AFTER INSERT OR DELETE ON public.tutorial_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_tutorial_likes_count();

-- Function to update tutorial comments count
CREATE OR REPLACE FUNCTION public.update_tutorial_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.tutorials
    SET comments_count = comments_count + 1
    WHERE id = NEW.tutorial_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.tutorials
    SET comments_count = GREATEST(comments_count - 1, 0)
    WHERE id = OLD.tutorial_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger to update comments count
CREATE TRIGGER on_tutorial_comment_change
  AFTER INSERT OR DELETE ON public.tutorial_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_tutorial_comments_count();

-- Function to update tutorial enrollments count
CREATE OR REPLACE FUNCTION public.update_tutorial_enrollments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.tutorials
    SET enrollments_count = enrollments_count + 1
    WHERE id = NEW.tutorial_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.tutorials
    SET enrollments_count = GREATEST(enrollments_count - 1, 0)
    WHERE id = OLD.tutorial_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger to update enrollments count
CREATE TRIGGER on_enrollment_change
  AFTER INSERT OR DELETE ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.update_tutorial_enrollments_count();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tutorials_updated_at
  BEFORE UPDATE ON public.tutorials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();