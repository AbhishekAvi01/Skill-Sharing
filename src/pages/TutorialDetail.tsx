import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Heart, Users, Clock, ArrowLeft, Send, Edit } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Tutorial, Profile, TutorialComment, TutorialLike, Enrollment } from '@/lib/supabase';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

type TutorialWithProfile = Tutorial & {
  profiles: Profile;
};

type CommentWithProfile = TutorialComment & {
  profiles: Profile;
};

export default function TutorialDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tutorial, setTutorial] = useState<TutorialWithProfile | null>(null);
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTutorial();
      fetchComments();
      if (user) {
        checkLikeStatus();
        checkEnrollmentStatus();
      }
    }
  }, [id, user]);

  const fetchTutorial = async () => {
    try {
      const { data, error } = await supabase
        .from('tutorials')
        .select(`
          *,
          profiles (*)
        `)
        .eq('id', id!)
        .single();

      if (error) throw error;
      setTutorial(data as TutorialWithProfile);
    } catch (error) {
      console.error('Error fetching tutorial:', error);
      toast.error('Failed to load tutorial');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('tutorial_comments')
        .select(`
          *,
          profiles (*)
        `)
        .eq('tutorial_id', id!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data as CommentWithProfile[]);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const checkLikeStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('tutorial_likes')
        .select('id')
        .eq('tutorial_id', id!)
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;
      setIsLiked(!!data);
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  const checkEnrollmentStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('id')
        .eq('tutorial_id', id!)
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;
      setIsEnrolled(!!data);
    } catch (error) {
      console.error('Error checking enrollment:', error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast.error('Please sign in to like tutorials');
      navigate('/auth');
      return;
    }

    try {
      if (isLiked) {
        const { error } = await supabase
          .from('tutorial_likes')
          .delete()
          .eq('tutorial_id', id!)
          .eq('user_id', user.id);

        if (error) throw error;
        setIsLiked(false);
        toast.success('Removed from favorites');
      } else {
        const { error } = await supabase
          .from('tutorial_likes')
          .insert({
            tutorial_id: id!,
            user_id: user.id,
          });

        if (error) throw error;
        setIsLiked(true);
        toast.success('Added to favorites');
      }
      fetchTutorial();
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like status');
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      toast.error('Please sign in to enroll');
      navigate('/auth');
      return;
    }

    try {
      if (isEnrolled) {
        const { error } = await supabase
          .from('enrollments')
          .delete()
          .eq('tutorial_id', id!)
          .eq('user_id', user.id);

        if (error) throw error;
        setIsEnrolled(false);
        toast.success('Unenrolled from tutorial');
      } else {
        const { error } = await supabase
          .from('enrollments')
          .insert({
            tutorial_id: id!,
            user_id: user.id,
          });

        if (error) throw error;
        setIsEnrolled(true);
        toast.success('Enrolled successfully!');
      }
      fetchTutorial();
    } catch (error) {
      console.error('Error toggling enrollment:', error);
      toast.error('Failed to update enrollment');
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to comment');
      navigate('/auth');
      return;
    }

    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const { error } = await supabase
        .from('tutorial_comments')
        .insert({
          tutorial_id: id!,
          user_id: user.id,
          content: commentText.trim(),
        });

      if (error) throw error;

      toast.success('Comment posted!');
      setCommentText('');
      fetchComments();
      fetchTutorial();
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading tutorial...</p>
        </div>
      </div>
    );
  }

  if (!tutorial) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Tutorial Not Found</h2>
          <Link to="/browse">
            <Button>Browse Tutorials</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const isOwner = user?.id === tutorial.user_id;

  return (
    <div className="min-h-screen py-12">
      <div className="container max-w-5xl">
        <Link to="/browse" className="inline-flex items-center text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Browse
        </Link>

        <div className="space-y-8">
          {/* Tutorial Header */}
          <div>
            {tutorial.thumbnail_url && (
              <div className="aspect-video rounded-lg overflow-hidden shadow-card mb-6">
                <img 
                  src={tutorial.thumbnail_url} 
                  alt={tutorial.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary" className="capitalize">
                    {tutorial.category}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {tutorial.difficulty}
                  </Badge>
                </div>
                <h1 className="text-4xl font-bold mb-4">{tutorial.title}</h1>
                <div className="flex items-center gap-6 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Heart className={`h-5 w-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                    <span>{tutorial.likes_count} likes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <span>{tutorial.enrollments_count} enrolled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    <span>{formatDistanceToNow(new Date(tutorial.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {isOwner ? (
                  <Link to={`/edit-tutorial/${tutorial.id}`}>
                    <Button className="w-full bg-gradient-primary">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Tutorial
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Button 
                      onClick={handleEnroll}
                      className={isEnrolled ? '' : 'bg-gradient-primary hover:shadow-hover'}
                      variant={isEnrolled ? 'outline' : 'default'}
                    >
                      {isEnrolled ? 'Unenroll' : 'Enroll Now'}
                    </Button>
                    <Button onClick={handleLike} variant="outline">
                      <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                      {isLiked ? 'Liked' : 'Like'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Tutorial Content */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>About This Tutorial</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg leading-relaxed whitespace-pre-wrap">{tutorial.description}</p>

              {tutorial.video_url && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-3">Video Tutorial</h3>
                  <a 
                    href={tutorial.video_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Watch on Video Platform →
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instructor */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Instructor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-primary">
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xl">
                    {tutorial.profiles.full_name[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{tutorial.profiles.full_name}</h3>
                  {tutorial.profiles.bio && (
                    <p className="text-muted-foreground">{tutorial.profiles.bio}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Comments ({tutorial.comments_count})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {user && (
                <form onSubmit={handleSubmitComment} className="space-y-3">
                  <Textarea
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    disabled={submittingComment}
                    rows={3}
                  />
                  <Button 
                    type="submit" 
                    disabled={!commentText.trim() || submittingComment}
                    className="bg-gradient-primary"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Post Comment
                  </Button>
                </form>
              )}

              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No comments yet. Be the first to comment!
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-4 p-4 rounded-lg bg-muted/30">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-secondary text-white">
                          {comment.profiles.full_name[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="font-semibold">{comment.profiles.full_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
