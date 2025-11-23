import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Heart, Users, Edit, Trash2, PlusCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Tutorial, Profile, Enrollment } from '@/lib/supabase';
import { toast } from 'sonner';

type TutorialWithProfile = Tutorial & {
  profiles: Profile;
};

type EnrollmentWithTutorial = Enrollment & {
  tutorials: TutorialWithProfile;
};

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [myTutorials, setMyTutorials] = useState<Tutorial[]>([]);
  const [enrolledTutorials, setEnrolledTutorials] = useState<EnrollmentWithTutorial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [tutorialsRes, enrollmentsRes] = await Promise.all([
        supabase
          .from('tutorials')
          .select('*')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('enrollments')
          .select(`
            *,
            tutorials (
              *,
              profiles (*)
            )
          `)
          .eq('user_id', user!.id)
          .order('enrolled_at', { ascending: false })
      ]);

      if (tutorialsRes.error) throw tutorialsRes.error;
      if (enrollmentsRes.error) throw enrollmentsRes.error;

      setMyTutorials(tutorialsRes.data);
      setEnrolledTutorials(enrollmentsRes.data as EnrollmentWithTutorial[]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTutorial = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tutorial?')) return;

    try {
      const { error } = await supabase
        .from('tutorials')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Tutorial deleted successfully');
      setMyTutorials(myTutorials.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting tutorial:', error);
      toast.error('Failed to delete tutorial');
    }
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
          <p className="text-xl text-muted-foreground">Manage your tutorials and learning progress</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Tutorials</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myTutorials.length}</div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Enrolled</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{enrolledTutorials.length}</div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {myTutorials.reduce((sum, t) => sum + t.likes_count, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="my-tutorials" className="space-y-6">
          <TabsList>
            <TabsTrigger value="my-tutorials">My Tutorials</TabsTrigger>
            <TabsTrigger value="enrolled">Enrolled Tutorials</TabsTrigger>
          </TabsList>

          <TabsContent value="my-tutorials" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">My Tutorials</h2>
              <Link to="/create-tutorial">
                <Button className="bg-gradient-primary hover:shadow-hover">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Tutorial
                </Button>
              </Link>
            </div>

            {loading ? (
              <div>Loading...</div>
            ) : myTutorials.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-xl text-muted-foreground mb-4">
                  You haven't created any tutorials yet
                </p>
                <Link to="/create-tutorial">
                  <Button className="bg-gradient-primary">
                    Create Your First Tutorial
                  </Button>
                </Link>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myTutorials.map((tutorial) => (
                  <Card key={tutorial.id} className="shadow-card hover:shadow-hover transition-all">
                    {tutorial.thumbnail_url ? (
                      <div className="aspect-video overflow-hidden">
                        <img 
                          src={tutorial.thumbnail_url} 
                          alt={tutorial.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        <span className="text-4xl">📚</span>
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="capitalize">
                          {tutorial.category}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {tutorial.difficulty}
                        </Badge>
                      </div>
                      <CardTitle className="line-clamp-2">{tutorial.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm mb-4">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Heart className="h-4 w-4" />
                          <span>{tutorial.likes_count}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{tutorial.enrollments_count}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link to={`/tutorial/${tutorial.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            View
                          </Button>
                        </Link>
                        <Link to={`/edit-tutorial/${tutorial.id}`} className="flex-1">
                          <Button variant="default" size="sm" className="w-full">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteTutorial(tutorial.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="enrolled" className="space-y-6">
            <h2 className="text-2xl font-bold">Enrolled Tutorials</h2>

            {loading ? (
              <div>Loading...</div>
            ) : enrolledTutorials.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-xl text-muted-foreground mb-4">
                  You haven't enrolled in any tutorials yet
                </p>
                <Link to="/browse">
                  <Button className="bg-gradient-primary">
                    Browse Tutorials
                  </Button>
                </Link>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrolledTutorials.map((enrollment) => (
                  <Link key={enrollment.id} to={`/tutorial/${enrollment.tutorials.id}`}>
                    <Card className="cursor-pointer shadow-card hover:shadow-hover transition-all h-full">
                      {enrollment.tutorials.thumbnail_url ? (
                        <div className="aspect-video overflow-hidden">
                          <img 
                            src={enrollment.tutorials.thumbnail_url} 
                            alt={enrollment.tutorials.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                          <span className="text-4xl">📚</span>
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="capitalize">
                            {enrollment.tutorials.category}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {enrollment.tutorials.difficulty}
                          </Badge>
                        </div>
                        <CardTitle className="line-clamp-2">{enrollment.tutorials.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          By {enrollment.tutorials.profiles.full_name}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
