'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/Toast';
import { 
  ArrowLeft,
  Bookmark,
  Share2,
  Target,
  TrendingUp,
  Users,
  Calendar,
  Tag,
  Heart,
  MessageCircle,
  Star
} from 'lucide-react';

export default function IdeaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isSignedIn } = useUser();
  const { toast } = useToast();
  
  const [idea, setIdea] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Mock idea data based on ID
  const mockIdeas = {
    1: {
      id: 1,
      title: "AI-Powered Personal Finance Assistant",
      description: "A comprehensive mobile application that leverages machine learning algorithms to analyze users' spending patterns, income fluctuations, and financial goals. The app provides personalized financial advice, automated budgeting suggestions, and predictive insights to help users make better financial decisions. Features include expense categorization, bill reminders, investment recommendations, and integration with major banks and financial institutions.",
      category: "Finance",
      difficulty: "medium",
      target_audience: "Consumers",
      tags: ["AI", "Finance", "Mobile", "Personal", "Machine Learning", "Banking"],
      created_at: "2024-01-15T00:00:00Z",
      market_size: "Large",
      competition_level: "High",
      estimated_timeline: "12-18 months",
      initial_investment: "$50,000 - $150,000",
      revenue_model: "Freemium with premium features",
      key_features: [
        "Automated expense tracking and categorization",
        "Personalized budgeting recommendations",
        "Investment portfolio analysis",
        "Bill payment reminders and automation",
        "Financial goal tracking and progress monitoring",
        "Integration with 10,000+ financial institutions"
      ],
      challenges: [
        "Regulatory compliance (PCI DSS, financial regulations)",
        "Building trust with users for financial data",
        "Competition from established fintech companies",
        "Ensuring data security and privacy"
      ],
      opportunities: [
        "Growing demand for personal finance management",
        "Increasing smartphone adoption",
        "Rising financial literacy awareness",
        "Potential for B2B partnerships with banks"
      ]
    },
    2: {
      id: 2,
      title: "Sustainable Packaging Marketplace",
      description: "A B2B platform that connects businesses with eco-friendly packaging suppliers and sustainable packaging solutions. The marketplace features a comprehensive database of verified suppliers, packaging materials, and sustainability certifications. Businesses can compare options, request quotes, and track their environmental impact reduction.",
      category: "Sustainability",
      difficulty: "hard",
      target_audience: "Small Businesses",
      tags: ["Sustainability", "B2B", "Marketplace", "Packaging", "Environment"],
      created_at: "2024-01-14T00:00:00Z",
      market_size: "Medium",
      competition_level: "Medium",
      estimated_timeline: "18-24 months",
      initial_investment: "$100,000 - $300,000",
      revenue_model: "Commission-based marketplace fees",
      key_features: [
        "Verified supplier network",
        "Sustainability impact tracking",
        "Quote comparison system",
        "Certification verification",
        "Custom packaging design tools",
        "Carbon footprint calculator"
      ],
      challenges: [
        "Building supplier network",
        "Ensuring quality standards",
        "Educating market about sustainable options",
        "Managing logistics and shipping"
      ],
      opportunities: [
        "Growing environmental consciousness",
        "Government regulations favoring sustainability",
        "Corporate ESG initiatives",
        "Cost savings from optimized packaging"
      ]
    }
  };

  useEffect(() => {
    const loadIdea = async () => {
      setLoading(true);
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const ideaData = mockIdeas[params.id];
        if (ideaData) {
          setIdea(ideaData);
        } else {
          toast.error('Idea not found');
          router.push('/explore');
        }
      } catch (error) {
        console.error('Error loading idea:', error);
        toast.error('Failed to load idea details');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadIdea();
    }
  }, [params.id, router, toast]);

  const saveIdea = async () => {
    if (!isSignedIn) {
      toast.error('Please sign in to save ideas');
      router.push('/sign-in');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/save-idea', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(idea),
      });

      if (!response.ok) {
        throw new Error('Failed to save idea');
      }

      toast.success('Idea saved to your dashboard!');
    } catch (error) {
      console.error('Error saving idea:', error);
      toast.error('Failed to save idea. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const shareIdea = async () => {
    try {
      await navigator.share({
        title: idea.title,
        text: idea.description,
        url: window.location.href,
      });
    } catch (error) {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <LoadingSpinner size="xl" />
            <p className="mt-4 text-slate-600">Loading idea details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <p className="text-slate-600">Idea not found</p>
            <Button onClick={() => router.push('/explore')} className="mt-4">
              Back to Explore
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                {idea.title}
              </h1>
              <p className="text-slate-600 text-lg">
                {idea.description}
              </p>
            </div>
            
            <div className="flex gap-2 ml-6">
              <Button 
                onClick={saveIdea} 
                disabled={saving}
                loading={saving}
              >
                <Bookmark className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" onClick={shareIdea}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Key Features */}
            <Card>
              <CardHeader>
                <CardTitle>Key Features</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {idea.key_features?.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Star className="h-4 w-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Challenges */}
            <Card>
              <CardHeader>
                <CardTitle>Challenges to Consider</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {idea.challenges?.map((challenge, index) => (
                    <li key={index} className="flex items-start">
                      <div className="h-2 w-2 bg-red-400 rounded-full mr-3 mt-2 flex-shrink-0" />
                      <span className="text-slate-700">{challenge}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Opportunities */}
            <Card>
              <CardHeader>
                <CardTitle>Market Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {idea.opportunities?.map((opportunity, index) => (
                    <li key={index} className="flex items-start">
                      <div className="h-2 w-2 bg-green-400 rounded-full mr-3 mt-2 flex-shrink-0" />
                      <span className="text-slate-700">{opportunity}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Category</span>
                  <span className="font-medium">{idea.category}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Difficulty</span>
                  <span className="font-medium capitalize">{idea.difficulty}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Target Audience</span>
                  <span className="font-medium">{idea.target_audience}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Market Size</span>
                  <span className="font-medium">{idea.market_size}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Competition</span>
                  <span className="font-medium">{idea.competition_level}</span>
                </div>
              </CardContent>
            </Card>

            {/* Investment Info */}
            <Card>
              <CardHeader>
                <CardTitle>Investment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-sm text-slate-600 block">Initial Investment</span>
                  <span className="font-medium">{idea.initial_investment}</span>
                </div>
                <div>
                  <span className="text-sm text-slate-600 block">Timeline</span>
                  <span className="font-medium">{idea.estimated_timeline}</span>
                </div>
                <div>
                  <span className="text-sm text-slate-600 block">Revenue Model</span>
                  <span className="font-medium">{idea.revenue_model}</span>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {idea.tags?.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
