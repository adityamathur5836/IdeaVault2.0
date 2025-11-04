"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { LoadingPage } from "@/components/ui/LoadingSpinner";
import { useToast } from "@/components/ui/Toast";
import { 
  Users, 
  Star, 
  MessageCircle, 
  TrendingUp,
  Award,
  ThumbsUp,
  Eye,
  Calendar
} from "lucide-react";

export default function CommunityPage() {
  const { isSignedIn, user } = useUser();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [communityStats, setCommunityStats] = useState({
    totalMembers: 50000,
    activeToday: 1250,
    ideasShared: 25000,
    feedbackGiven: 75000
  });

  const [featuredIdeas, setFeaturedIdeas] = useState([]);
  const [topContributors, setTopContributors] = useState([]);

  useEffect(() => {
    loadCommunityData();
  }, []);

  const loadCommunityData = async () => {
    try {
      // Simulate loading community data
      // In a real app, this would fetch from your API
      setTimeout(() => {
        setFeaturedIdeas([
          {
            id: 1,
            title: "AI-Powered Personal Finance Assistant",
            description: "A mobile app that uses machine learning to analyze spending patterns and provide personalized financial advice.",
            author: "Sarah Chen",
            rating: 4.8,
            votes: 156,
            comments: 23,
            views: 1240,
            category: "Finance",
            createdAt: "2024-01-15"
          },
          {
            id: 2,
            title: "Sustainable Packaging Marketplace",
            description: "B2B platform connecting businesses with eco-friendly packaging suppliers and solutions.",
            author: "Mike Rodriguez",
            rating: 4.6,
            votes: 134,
            comments: 18,
            views: 980,
            category: "Sustainability",
            createdAt: "2024-01-14"
          },
          {
            id: 3,
            title: "Virtual Reality Fitness Studio",
            description: "Immersive VR fitness experiences that make working out engaging and fun from home.",
            author: "Alex Kim",
            rating: 4.7,
            votes: 142,
            comments: 31,
            views: 1560,
            category: "Health & Fitness",
            createdAt: "2024-01-13"
          }
        ]);

        setTopContributors([
          { name: "Sarah Chen", contributions: 45, rating: 4.9 },
          { name: "Mike Rodriguez", contributions: 38, rating: 4.8 },
          { name: "Alex Kim", contributions: 32, rating: 4.7 },
          { name: "Emma Wilson", contributions: 29, rating: 4.6 },
          { name: "David Park", contributions: 25, rating: 4.5 }
        ]);

        setLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error("Error loading community data:", error);
      toast.error("Failed to load community data. Please try again.");
      setLoading(false);
    }
  };

  const rateIdea = async (ideaId, rating) => {
    if (!isSignedIn) {
      toast.error("Please sign in to rate ideas");
      return;
    }

    try {
      // Simulate rating API call
      toast.success("Thank you for your feedback!");
    } catch (error) {
      console.error("Error rating idea:", error);
      toast.error("Failed to submit rating. Please try again.");
    }
  };

  if (loading) {
    return <LoadingPage message="Loading community..." />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Community Validation
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Connect with fellow entrepreneurs, share ideas, and get valuable feedback from our community of innovators.
          </p>
        </div>

        {/* Community Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{communityStats.totalMembers.toLocaleString()}</div>
              <p className="text-xs text-slate-600">
                Entrepreneurs worldwide
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Today</CardTitle>
              <TrendingUp className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{communityStats.activeToday.toLocaleString()}</div>
              <p className="text-xs text-slate-600">
                Members online now
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ideas Shared</CardTitle>
              <MessageCircle className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{communityStats.ideasShared.toLocaleString()}</div>
              <p className="text-xs text-slate-600">
                Community contributions
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Feedback Given</CardTitle>
              <Star className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{communityStats.feedbackGiven.toLocaleString()}</div>
              <p className="text-xs text-slate-600">
                Reviews and ratings
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Featured Ideas */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Featured Ideas</h2>
              <Button variant="outline">View All</Button>
            </div>

            <div className="space-y-6">
              {featuredIdeas.map((idea) => (
                <Card key={idea.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{idea.title}</CardTitle>
                        <CardDescription className="mt-2">
                          {idea.description}
                        </CardDescription>
                      </div>
                      <span className="ml-4 px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-md">
                        {idea.category}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm text-slate-600">
                        <span>by {idea.author}</span>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(idea.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-500 mr-1" />
                            <span className="font-medium">{idea.rating}</span>
                          </div>
                          <div className="flex items-center">
                            <ThumbsUp className="h-4 w-4 text-slate-500 mr-1" />
                            <span>{idea.votes}</span>
                          </div>
                          <div className="flex items-center">
                            <MessageCircle className="h-4 w-4 text-slate-500 mr-1" />
                            <span>{idea.comments}</span>
                          </div>
                          <div className="flex items-center">
                            <Eye className="h-4 w-4 text-slate-500 mr-1" />
                            <span>{idea.views}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rateIdea(idea.id, 5)}
                          >
                            <Star className="h-4 w-4 mr-1" />
                            Rate
                          </Button>
                          <Button size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Top Contributors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Top Contributors
                </CardTitle>
                <CardDescription>
                  Most helpful community members this month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topContributors.map((contributor, index) => (
                    <div key={contributor.name} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{contributor.name}</div>
                          <div className="text-xs text-slate-500">
                            {contributor.contributions} contributions
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 mr-1" />
                        <span className="text-sm font-medium">{contributor.rating}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Community Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle>Community Guidelines</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-slate-600">
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-slate-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Provide constructive and helpful feedback</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-slate-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Be respectful and professional</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-slate-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Share original and well-thought ideas</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-slate-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Help others succeed and grow</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Join Community CTA */}
            {!isSignedIn && (
              <Card>
                <CardHeader>
                  <CardTitle>Join Our Community</CardTitle>
                  <CardDescription>
                    Connect with entrepreneurs and get feedback on your ideas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    Sign Up Now
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
