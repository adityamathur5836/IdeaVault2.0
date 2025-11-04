'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/Toast';
import PreferencesModal from '@/components/preferences/PreferencesModal';
import { 
  BarChart3, 
  Plus, 
  Eye, 
  Lock, 
  Edit3, 
  Trash2, 
  Settings,
  Lightbulb,
  TrendingUp,
  Star,
  Filter,
  Search,
  Grid,
  List,
  Wand2,
  Target
} from 'lucide-react';
import {
  getUserIdeas,
  deleteUserIdea,
  getUserCredits,
  getUserPreferences,
  updateUserIdea
} from '@/lib/userService';
import { useDashboard } from '@/contexts/DashboardContext';

const statusOptions = [
  { value: 'all', label: 'All Ideas' },
  { value: 'saved', label: 'Saved' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' }
];

export default function UserDashboardPage() {
  const { isSignedIn, user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const {
    refreshTrigger,
    dashboardData,
    updateDashboardData,
    removeIdeaFromDashboard
  } = useDashboard();

  const [ideas, setIdeas] = useState([]);
  const [credits, setCredits] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPreferences, setShowPreferences] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    loadDashboardData();
  }, [isSignedIn, router]);

  // Listen for dashboard refresh triggers
  useEffect(() => {
    if (refreshTrigger > 0 && isSignedIn) {
      loadDashboardData();
    }
  }, [refreshTrigger, isSignedIn]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [ideasData, creditsData, preferencesData] = await Promise.all([
        getUserIdeas(user.id),
        getUserCredits(user.id),
        getUserPreferences(user.id)
      ]);
      setIdeas(ideasData);
      setCredits(creditsData);
      setPreferences(preferencesData);

      // Update context with fresh data
      updateDashboardData({
        ideas: ideasData,
        credits: creditsData,
        preferences: preferencesData
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIdea = async (ideaId) => {
    if (!confirm('Are you sure you want to delete this idea?')) return;

    try {
      await deleteUserIdea(user.id, ideaId);
      setIdeas(prev => prev.filter(idea => idea.id !== ideaId));
      removeIdeaFromDashboard(ideaId);
      showToast('Idea deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting idea:', error);
      showToast('Failed to delete idea', 'error');
    }
  };

  const handleUpdateIdeaStatus = async (ideaId, newStatus) => {
    try {
      await updateUserIdea(user.id, ideaId, { status: newStatus });
      setIdeas(prev => prev.map(idea => 
        idea.id === ideaId ? { ...idea, status: newStatus } : idea
      ));
      showToast('Idea status updated', 'success');
    } catch (error) {
      console.error('Error updating idea status:', error);
      showToast('Failed to update idea status', 'error');
    }
  };

  // Filter ideas based on status and search
  const filteredIdeas = ideas.filter(idea => {
    const matchesStatus = statusFilter === 'all' || idea.status === statusFilter;
    const matchesSearch = idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         idea.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Calculate statistics
  const totalIdeas = ideas.length;
  const savedIdeas = ideas.filter(idea => idea.status === 'saved').length;
  const inProgressIdeas = ideas.filter(idea => idea.status === 'in_progress').length;
  const completedIdeas = ideas.filter(idea => idea.status === 'completed').length;
  const totalCredits = Number(credits?.total_credits ?? 0);
  const usedCredits = Number(credits?.used_credits ?? 0);
  const computedAvailable = totalCredits - usedCredits;
  const availableCredits = Number.isFinite(computedAvailable) && computedAvailable >= 0 ? computedAvailable : 0;

  const getStatusBadge = (status) => {
    const statusConfig = {
      saved: { color: 'bg-blue-100 text-blue-800', label: 'Saved' },
      in_progress: { color: 'bg-yellow-100 text-yellow-800', label: 'In Progress' },
      completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
      archived: { color: 'bg-gray-100 text-gray-800', label: 'Archived' }
    };
    const config = statusConfig[status] || statusConfig.saved;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getIdeaBadge = (idea) => {
    if (idea.is_generated) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 flex items-center gap-1">
          <Wand2 className="h-3 w-3" />
          AI Generated
        </span>
      );
    }
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
        High-Growth Emerging
      </span>
    );
  };

  if (!isSignedIn) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                My Ideas Dashboard
              </h1>
              <p className="text-slate-600 mt-2">Manage and track your business ideas</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowPreferences(true)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Preferences
              </Button>
              <Button
                onClick={() => setShowGenerateModal(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Generate New Idea
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Total Ideas</p>
                      <p className="text-2xl font-bold text-slate-900">{totalIdeas}</p>
                    </div>
                    <Lightbulb className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">In Progress</p>
                      <p className="text-2xl font-bold text-slate-900">{inProgressIdeas}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Completed</p>
                      <p className="text-2xl font-bold text-slate-900">{completedIdeas}</p>
                    </div>
                    <Star className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Available Credits</p>
                      <p className="text-2xl font-bold text-slate-900">{availableCredits}</p>
                    </div>
                    <Target className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Success Rate</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {totalIdeas > 0 ? Math.round((completedIdeas / totalIdeas) * 100) : 0}%
                      </p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-emerald-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preferences Display */}
            {preferences && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Your Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {preferences.interests && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        Interests: {preferences.interests}
                      </span>
                    )}
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      {preferences.experience_level} Level
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                      {preferences.time_commitment}
                    </span>
                    {preferences.capital_available && (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                        Budget: ${parseInt(preferences.capital_available).toLocaleString()}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Filters and Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex gap-2">
                {statusOptions.map(option => (
                  <Button
                    key={option.value}
                    variant={statusFilter === option.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2 flex-1">
                <div className="flex-1 max-w-md">
                  <Input
                    placeholder="Search ideas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex gap-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Ideas Display */}
            {filteredIdeas.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Lightbulb className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    {statusFilter === 'all' ? 'No ideas yet' : `No ${statusFilter.replace('_', ' ')} ideas`}
                  </h3>
                  <p className="text-slate-600 mb-4">
                    {statusFilter === 'all' 
                      ? 'Start by generating your first business idea'
                      : `You don't have any ${statusFilter.replace('_', ' ')} ideas`
                    }
                  </p>
                  {statusFilter === 'all' && (
                    <div className="flex gap-3 justify-center">
                      <Button onClick={() => setShowGenerateModal(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Generate New Idea
                      </Button>
                      <Link href="/explore">
                        <Button variant="outline">
                          <Search className="h-4 w-4 mr-2" />
                          Explore Ideas
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
                : 'space-y-4'
              }>
                {filteredIdeas.map(idea => (
                  <IdeaCard
                    key={idea.id}
                    idea={idea}
                    viewMode={viewMode}
                    availableCredits={availableCredits}
                    onDelete={handleDeleteIdea}
                    onUpdateStatus={handleUpdateIdeaStatus}
                    getStatusBadge={getStatusBadge}
                    getIdeaBadge={getIdeaBadge}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Preferences Modal */}
        <PreferencesModal
          isOpen={showPreferences}
          onClose={() => setShowPreferences(false)}
        />

        {/* Generate Ideas Modal */}
        {showGenerateModal && (
          <GenerateIdeasModal
            onClose={() => setShowGenerateModal(false)}
            onSuccess={loadDashboardData}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}

// IdeaCard Component
function IdeaCard({ idea, viewMode, availableCredits, onDelete, onUpdateStatus, getStatusBadge, getIdeaBadge }) {
  const [showActions, setShowActions] = useState(false);

  const handleUnlockReport = () => {
    if (availableCredits < 1) {
      alert('Insufficient credits. Please purchase more credits to unlock reports.');
      return;
    }
    // Navigate to idea report page
    window.location.href = `/ideas/${idea.id}/report`;
  };

  if (viewMode === 'list') {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-slate-900">{idea.title}</h3>
                {getStatusBadge(idea.status)}
                {getIdeaBadge(idea)}
              </div>
              <p className="text-slate-600 mb-2 line-clamp-2">{idea.description}</p>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span>Category: {idea.category}</span>
                <span>Created: {new Date(idea.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex gap-2 ml-4">
              <Link href={`/ideas/${idea.id}`}>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUnlockReport}
                disabled={availableCredits < 1}
              >
                <Lock className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowActions(!showActions)}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(idea.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {showActions && (
            <div className="mt-4 pt-4 border-t flex gap-2">
              <select
                value={idea.status}
                onChange={(e) => onUpdateStatus(idea.id, e.target.value)}
                className="px-3 py-1 border rounded text-sm"
              >
                <option value="saved">Saved</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex gap-2">
            {getStatusBadge(idea.status)}
            {getIdeaBadge(idea)}
          </div>
        </div>

        <h3 className="text-lg font-semibold text-slate-900 mb-2">{idea.title}</h3>
        <p className="text-slate-600 mb-4 line-clamp-3">{idea.description}</p>

        <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
          <span>{idea.category}</span>
          <span>{new Date(idea.created_at).toLocaleDateString()}</span>
        </div>

        <div className="flex gap-2">
          <Link href={`/ideas/${idea.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Eye className="h-4 w-4 mr-1" />
              View Report
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={handleUnlockReport}
            disabled={availableCredits < 1}
            title={availableCredits < 1 ? 'Insufficient credits' : 'Unlock full report (1 credit)'}
          >
            <Lock className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowActions(!showActions)}
          >
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(idea.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {showActions && (
          <div className="mt-4 pt-4 border-t">
            <select
              value={idea.status}
              onChange={(e) => onUpdateStatus(idea.id, e.target.value)}
              className="w-full px-3 py-2 border rounded text-sm"
            >
              <option value="saved">Saved</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// GenerateIdeasModal Component
function GenerateIdeasModal({ onClose, onSuccess }) {
  const [generating, setGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    try {
      setGenerating(true);
      // Navigate to generate page with prompt
      window.location.href = `/generate?prompt=${encodeURIComponent(prompt)}`;
    } catch (error) {
      console.error('Error generating ideas:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleValidateIdea = () => {
    window.location.href = '/generate?mode=validate';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900">Generate New Ideas</h2>
            <Button variant="outline" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>

          <div className="space-y-4">
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Describe your business idea or problem
                </label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., I want to create an app that helps people find local events..."
                  rows={4}
                  className="w-full"
                />
              </div>
              <Button type="submit" disabled={generating || !prompt.trim()} className="w-full">
                {generating ? (
                  <>
                    <LoadingSpinner className="h-4 w-4 mr-2" />
                    Generating Ideas...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate Startup Ideas
                  </>
                )}
              </Button>
            </form>

            <div className="text-center">
              <span className="text-slate-500">or</span>
            </div>

            <Button
              variant="outline"
              onClick={handleValidateIdea}
              className="w-full"
            >
              <Target className="h-4 w-4 mr-2" />
              Validate Your Own Idea
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
