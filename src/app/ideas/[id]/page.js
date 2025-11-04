"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { 
  FileText, 
  ArrowLeft,
  Target,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  Lightbulb,
  Wand2,
  ExternalLink,
  Share2,
  Bookmark,
  BookmarkCheck
} from "lucide-react";
import { getDifficultyVariant, getCategoryVariant } from "@/lib/badgeUtils";
import { getUserIdeaById } from "@/lib/userService";

export default function IdeaDetailsPage() {
  const { isSignedIn, user } = useUser();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  
  const [idea, setIdea] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    if (params.id) {
      fetchIdea();
    }
  }, [isSignedIn, params.id]);

  const fetchIdea = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try client-side service first (uses DB, then cache fallback)
      const ideaData = await getUserIdeaById(user.id, params.id);
      if (ideaData) {
        setIdea(ideaData);
        setIsBookmarked(false);
        return;
      }

      // Final fallback: localStorage cache written by generate page
      try {
        const localCache = JSON.parse(localStorage.getItem("generated_ideas_cache") || "{}");
        const cached = localCache[String(params.id)];
        if (cached) {
          setIdea(cached);
          setIsBookmarked(false);
          return;
        }
      } catch (_) {}

      throw new Error("Idea not found");
    } catch (err) {
      console.error("Error fetching idea:", err);
      setError(err.message || "Failed to fetch idea");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = () => {
    router.push(`/ideas/${params.id}/report`);
  };

  const handleBookmark = async () => {
    try {
      // Implement bookmark functionality
      setIsBookmarked(!isBookmarked);
      toast.success(isBookmarked ? "Removed from bookmarks" : "Added to bookmarks");
    } catch (err) {
      toast.error("Failed to update bookmark");
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: idea.title,
          text: idea.description,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard");
      }
    } catch (err) {
      toast.error("Failed to share");
    }
  };

  if (!isSignedIn) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto border-red-200 bg-red-50">
            <CardContent className="p-8 text-center">
              <div className="text-red-600 mb-4">
                <Lightbulb className="h-16 w-16 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Idea Not Found</h2>
                <p className="text-red-700 mb-6">{error}</p>
                <div className="flex gap-4 justify-center">
                  <Button onClick={() => router.back()} variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Go Back
                  </Button>
                  <Button onClick={() => router.push("/generate")}>
                    Generate New Ideas
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <Lightbulb className="h-16 w-16 mx-auto mb-4 text-slate-300" />
              <h2 className="text-xl font-bold text-slate-700 mb-2">No Idea Found</h2>
              <p className="text-slate-600 mb-6">The requested idea could not be found.</p>
              <Button onClick={() => router.push("/generate")}>
                Generate New Ideas
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            onClick={() => router.back()} 
            variant="outline" 
            className="mb-6 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900 mb-4 leading-tight">
                {idea.title}
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed mb-6">
                {idea.description}
              </p>
              
              {/* Badges */}
              <div className="flex flex-wrap gap-3 mb-6">
                <Badge variant={getCategoryVariant(idea.category)} size="md">
                  <Target className="h-3.5 w-3.5 mr-1.5" />
                  {idea.category}
                </Badge>
                <Badge variant={getDifficultyVariant(idea.difficulty)} size="md">
                  <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                  {idea.difficulty}
                </Badge>
                {idea.target_audience && (
                  <Badge variant="outline" size="md">
                    <Users className="h-3.5 w-3.5 mr-1.5" />
                    {idea.target_audience}
                  </Badge>
                )}
                {idea.estimated_cost && (
                  <Badge variant="outline" size="md">
                    <DollarSign className="h-3.5 w-3.5 mr-1.5" />
                    {idea.estimated_cost}
                  </Badge>
                )}
                {idea.timeline && (
                  <Badge variant="outline" size="md">
                    <Clock className="h-3.5 w-3.5 mr-1.5" />
                    {idea.timeline}
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleGenerateReport}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleBookmark}
                  variant="outline"
                  size="sm"
                  className="hover:bg-slate-50"
                >
                  {isBookmarked ? (
                    <BookmarkCheck className="h-4 w-4" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                </Button>
                
                <Button
                  onClick={handleShare}
                  variant="outline"
                  size="sm"
                  className="hover:bg-slate-50"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Problem Statement */}
            {idea.problem_statement && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="h-5 w-5 mr-2 text-indigo-600" />
                    Problem Statement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 leading-relaxed">{idea.problem_statement}</p>
                </CardContent>
              </Card>
            )}

            {/* Solution Overview */}
            {idea.solution_overview && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Lightbulb className="h-5 w-5 mr-2 text-yellow-600" />
                    Solution Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 leading-relaxed">{idea.solution_overview}</p>
                </CardContent>
              </Card>
            )}

            {/* Key Features */}
            {idea.key_features && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Wand2 className="h-5 w-5 mr-2 text-purple-600" />
                    Key Features
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {idea.key_features.split("\n").filter(feature => feature.trim()).map((feature, index) => (
                      <div key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <p className="text-slate-700">{feature.trim()}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={handleGenerateReport}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Business Report
                </Button>
                
                <Button 
                  onClick={() => router.push("/generate")}
                  variant="outline"
                  className="w-full"
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Generate Similar Ideas
                </Button>
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {idea.created_at && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">Created</p>
                    <p className="text-sm text-slate-600">
                      {new Date(idea.created_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
                
                {idea.source && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">Source</p>
                    <Badge variant="outline" size="sm">
                      {idea.source === "gemini_synthesis" ? "AI Generated" : "Database Match"}
                    </Badge>
                  </div>
                )}
                
                {idea.upvotes !== undefined && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">Popularity</p>
                    <p className="text-sm text-slate-600">{idea.upvotes} upvotes</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
