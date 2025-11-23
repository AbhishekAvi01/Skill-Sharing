import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, BookOpen, Users, TrendingUp, Code, Palette, Music, UtensilsCrossed, Camera, Briefcase, Dumbbell, Languages } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Tutorial, Profile } from '@/lib/supabase';

const categories = [
  { name: 'Programming', icon: Code, color: 'from-blue-500 to-cyan-500', value: 'programming' },
  { name: 'Design', icon: Palette, color: 'from-pink-500 to-purple-500', value: 'design' },
  { name: 'Music', icon: Music, color: 'from-violet-500 to-purple-500', value: 'music' },
  { name: 'Art', icon: Palette, color: 'from-orange-500 to-red-500', value: 'art' },
  { name: 'Cooking', icon: UtensilsCrossed, color: 'from-yellow-500 to-orange-500', value: 'cooking' },
  { name: 'Photography', icon: Camera, color: 'from-green-500 to-teal-500', value: 'photography' },
  { name: 'Business', icon: Briefcase, color: 'from-indigo-500 to-blue-500', value: 'business' },
  { name: 'Fitness', icon: Dumbbell, color: 'from-red-500 to-pink-500', value: 'fitness' },
  { name: 'Languages', icon: Languages, color: 'from-teal-500 to-green-500', value: 'languages' },
];

type TutorialWithProfile = Tutorial & {
  profiles: Profile;
};

export default function Home() {
  const [featuredTutorials, setFeaturedTutorials] = useState<TutorialWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedTutorials();
  }, []);

  const fetchFeaturedTutorials = async () => {
    try {
      const { data, error } = await supabase
        .from('tutorials')
        .select(`
          *,
          profiles (*)
        `)
        .order('likes_count', { ascending: false })
        .limit(3);

      if (error) throw error;
      setFeaturedTutorials(data as TutorialWithProfile[]);
    } catch (error) {
      console.error('Error fetching tutorials:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero py-20 md:py-32">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6 animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
              Learn & Teach Skills Online
            </h1>
            <p className="text-xl text-white/90 leading-relaxed">
              Join thousands of learners and educators sharing knowledge. Create tutorials, learn new skills, and grow together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/browse">
                <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90 shadow-hover">
                  Explore Tutorials
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/create-tutorial">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Create Tutorial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center border-none shadow-card">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold">1000+</CardTitle>
                <p className="text-muted-foreground">Tutorials</p>
              </CardHeader>
            </Card>
            <Card className="text-center border-none shadow-card">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-gradient-secondary rounded-full flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold">5000+</CardTitle>
                <p className="text-muted-foreground">Active Learners</p>
              </CardHeader>
            </Card>
            <Card className="text-center border-none shadow-card">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-gradient-to-r from-accent to-primary rounded-full flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold">95%</CardTitle>
                <p className="text-muted-foreground">Success Rate</p>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12 animate-slide-up">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Explore Categories</h2>
            <p className="text-xl text-muted-foreground">Find tutorials in your area of interest</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((category, index) => (
              <Link key={category.value} to={`/browse?category=${category.value}`}>
                <Card 
                  className="group cursor-pointer border-none shadow-card hover:shadow-hover transition-all duration-300 overflow-hidden"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardContent className="p-6 text-center">
                    <div className={`mx-auto w-16 h-16 bg-gradient-to-br ${category.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <category.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-semibold">{category.name}</h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Tutorials */}
      {featuredTutorials.length > 0 && (
        <section className="py-20 bg-muted/30">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Tutorials</h2>
              <p className="text-xl text-muted-foreground">Most popular tutorials from our community</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredTutorials.map((tutorial) => (
                <Link key={tutorial.id} to={`/tutorial/${tutorial.id}`}>
                  <Card className="group cursor-pointer border-none shadow-card hover:shadow-hover transition-all h-full">
                    {tutorial.thumbnail_url && (
                      <div className="aspect-video overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
                        <img 
                          src={tutorial.thumbnail_url} 
                          alt={tutorial.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="capitalize">
                          {tutorial.category.replace(/_/g, ' ')}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {tutorial.difficulty}
                        </Badge>
                      </div>
                      <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                        {tutorial.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {tutorial.description}
                      </p>
                      <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                        <span>{tutorial.likes_count} likes</span>
                        <span>{tutorial.enrollments_count} enrolled</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link to="/browse">
                <Button size="lg" variant="default" className="bg-gradient-primary hover:shadow-hover">
                  View All Tutorials
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <Card className="border-none shadow-card overflow-hidden">
            <div className="bg-gradient-hero p-12 md:p-16 text-center text-white">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Start Your Learning Journey?
              </h2>
              <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
                Join our community today and unlock access to thousands of tutorials created by passionate educators.
              </p>
              <Link to="/auth">
                <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90 shadow-hover">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
