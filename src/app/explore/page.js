"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { LoadingSpinner, LoadingPage } from "@/components/ui/LoadingSpinner";
import { useToast } from "@/components/ui/Toast";
import { 
  Search, 
  Filter, 
  Lightbulb, 
  Target, 
  TrendingUp,
  Users,
  Heart,
  Bookmark,
  ExternalLink,
  RefreshCw
} from "lucide-react";

const categories = [
  "All Categories",
  "Technology",
  "Healthcare",
  "Education",
  "Finance",
  "E-commerce",
  "Food & Beverage",
  "Travel & Tourism",
  "Entertainment",
  "Real Estate",
  "Sustainability",
  "Fashion",
  "Sports & Fitness",
  "Other"
];

const difficulties = [
  { value: "", label: "All Difficulties" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" }
];

export default function ExplorePage() {
  const { isSignedIn, user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Load initial ideas
  useEffect(() => {
    loadIdeas();
  }, []);

  const loadIdeas = async (page = 1, search = "", category = "", difficulty = "") => {
    try {
      setSearchLoading(page === 1);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12"
      });
      
      if (search) params.append("search", search);
      if (category && category !== "All Categories") params.append("category", category);
      if (difficulty) params.append("difficulty", difficulty);

      const response = await fetch(`/api/ideas/explore?${params}`);
      
      if (!response.ok) {
        throw new Error("Failed to load ideas");
      }

      const data = await response.json();
      
      if (page === 1) {
        setIdeas(data.ideas);
      } else {
        setIdeas(prev => [...prev, ...data.ideas]);
      }
      
      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);
      
    } catch (error) {
      console.error("Error loading ideas:", error);
      toast.error("Failed to load ideas. Please try again.");
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadIdeas(1, searchQuery, selectedCategory, selectedDifficulty);
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
    loadIdeas(1, searchQuery, selectedCategory, selectedDifficulty);
  };

  const loadMore = () => {
    if (currentPage < totalPages) {
      loadIdeas(currentPage + 1, searchQuery, selectedCategory, selectedDifficulty);
    }
  };

  const saveIdea = async (idea) => {
    if (!isSignedIn) {
      toast.error("Please sign in to save ideas");
      return;
    }

    try {
      const response = await fetch("/api/save-idea", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...idea,
          original_idea_id: idea.id,
          generated: false
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save idea");
      }

      toast.success("Idea saved to your dashboard!");
      
    } catch (error) {
      console.error("Error saving idea:", error);
      toast.error("Failed to save idea. Please try again.");
    }
  };

  if (loading) {
    return <LoadingPage message="Loading ideas..." />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Explore Business Ideas
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Discover from our curated collection of 140,000+ business ideas across various industries and difficulty levels.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search for business ideas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              
              <Button onClick={handleSearch} loading={searchLoading}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className={`mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 ${showFilters ? "block" : "hidden lg:grid"}`}>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Category
              </label>
              <Select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  handleFilterChange();
                }}
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Difficulty
              </label>
              <Select
                value={selectedDifficulty}
                onChange={(e) => {
                  setSelectedDifficulty(e.target.value);
                  handleFilterChange();
                }}
              >
                {difficulties.map(diff => (
                  <option key={diff.value} value={diff.value}>
                    {diff.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {/* Results */}
        {ideas.length === 0 ? (
          <div className="text-center py-12">
            <Lightbulb className="h-12 w-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No ideas found</h3>
            <p className="text-slate-600">Try adjusting your search criteria or browse all ideas.</p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All Categories");
                setSelectedDifficulty("");
                loadIdeas(1);
              }}
              className="mt-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Filters
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {ideas.map((idea, index) => (
                <Card key={`${idea.id}-${index}`} className="hover:shadow-md transition-shadow">
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

                      {idea.tags && idea.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {idea.tags.slice(0, 3).map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {idea.tags.length > 3 && (
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">
                              +{idea.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => saveIdea(idea)}
                          className="flex-1"
                        >
                          <Bookmark className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/ideas/${idea.id}`)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load More */}
            {currentPage < totalPages && (
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  loading={searchLoading}
                  size="lg"
                >
                  Load More Ideas
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
