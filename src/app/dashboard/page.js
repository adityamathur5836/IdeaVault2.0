'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { LoadingPage } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/Toast';
import { 
  Lightbulb, 
  Plus, 
  Search, 
  BarChart3, 
  Target, 
  TrendingUp,
  Users,
  Calendar,
  Trash2,
  ExternalLink,
  Heart
} from 'lucide-react';

export default function DashboardPage() {
  const { isSignedIn, user, isLoaded } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalIdeas: 0,
    generatedIdeas: 0,
    savedIdeas: 0,
    recentActivity: 0
  });

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isSignedIn, isLoaded, router]);

  // Load user data
  useEffect(() => {
    if (isSignedIn) {
      loadDashboardData();
    }
  }, [isSignedIn]);

  const loadDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard');
      
      if (!response.ok) {
        throw new Error('Failed to load dashboard data');
      }

      const data = await response.json();
      setIdeas(data.ideas || []);
      setStats(data.stats || stats);
      
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const deleteIdea = async (ideaId) => {
    if (!confirm('Are you sure you want to delete this idea?')) {
      return;
    }

    try {
      const response = await fetch(`/api/ideas/${ideaId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete idea');
      }

      setIdeas(prev => prev.filter(idea => idea.id !== ideaId));
      setStats(prev => ({
        ...prev,
        totalIdeas: prev.totalIdeas - 1
      }));
      
      toast.success('Idea deleted successfully');
      
    } catch (error) {
      console.error('Error deleting idea:', error);
      toast.error('Failed to delete idea. Please try again.');
    }
  };

  if (!isLoaded || loading) {
    return <LoadingPage message="Loading your dashboard..." />;
  }

  if (!isSignedIn) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome back, {user?.firstName || 'there'}!
          </h1>
          <p className="text-slate-600">
            Here's an overview of your business ideas and activity.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Ideas</CardTitle>
              <Lightbulb className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalIdeas}</div>
              <p className="text-xs text-slate-600">
                Ideas in your collection
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Generated</CardTitle>
              <Target className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.generatedIdeas}</div>
              <p className="text-xs text-slate-600">
                AI-generated ideas
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saved</CardTitle>
              <Heart className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.savedIdeas}</div>
              <p className="text-xs text-slate-600">
                Ideas from explore
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <Calendar className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentActivity}</div>
              <p className="text-xs text-slate-600">
                New ideas added
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/generate')}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                Generate New Idea
              </CardTitle>
              <CardDescription>
                Use AI to create personalized business ideas based on your preferences
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/explore')}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Explore Ideas
              </CardTitle>
              <CardDescription>
                Browse our curated collection of 140,000+ business ideas
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Recent Ideas */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Your Ideas</h2>
            <Button variant="outline" onClick={() => router.push('/generate')}>
              <Plus className="h-4 w-4 mr-2" />
              Add New
            </Button>
          </div>

          {ideas.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Lightbulb className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No ideas yet</h3>
                  <p className="text-slate-600 mb-6">
                    Start by generating your first business idea or exploring our collection.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={() => router.push('/generate')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Generate Idea
                    </Button>
                    <Button variant="outline" onClick={() => router.push('/explore')}>
                      <Search className="h-4 w-4 mr-2" />
                      Explore Ideas
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ideas.map((idea) => (
                <Card key={idea.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2">
                          {idea.title}
                        </CardTitle>
                        <CardDescription className="mt-2 line-clamp-3">
                          {idea.description}
                        </CardDescription>
                      </div>
                      {idea.generated && (
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md">
                          Generated
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-slate-600">
                          <Target className="h-4 w-4 mr-1" />
                          {idea.category}
                        </div>
                        <div className="flex items-center text-slate-600">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          <span className="capitalize">{idea.difficulty}</span>
                        </div>
                      </div>
                      
                      {idea.target_audience && (
                        <div className="flex items-center text-sm text-slate-600">
                          <Users className="h-4 w-4 mr-1" />
                          {idea.target_audience}
                        </div>
                      )}

                      <div className="flex items-center text-sm text-slate-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(idea.created_at).toLocaleDateString()}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/ideas/${idea.id}`)}
                          className="flex-1"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteIdea(idea.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
