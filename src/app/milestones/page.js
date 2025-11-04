'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Plus, Target, CheckCircle, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

export default function MilestonesPage() {
  const { user, isSignedIn } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    completionRate: 0
  });

  // Form state for creating new milestones
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    description: '',
    target_date: '',
    priority: 'medium',
    idea_id: ''
  });

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }

    if (user) {
      fetchMilestones();
    }
  }, [user, isSignedIn, router]);

  const fetchMilestones = async () => {
    try {
      setLoading(true);

      // Professional milestone examples to demonstrate the feature
      const mockMilestones = [
        {
          id: 1,
          title: "Complete Market Research & Validation",
          description: "Conduct comprehensive market analysis, identify target customer segments, and validate product-market fit through surveys and interviews with 100+ potential customers.",
          status: "completed",
          priority: "high",
          target_date: "2024-01-31",
          completion_percentage: 100,
          created_at: "2024-01-01",
          user_ideas: { title: "AI-Powered Personal Finance Assistant", category: "Finance" }
        },
        {
          id: 2,
          title: "Develop Minimum Viable Product (MVP)",
          description: "Build core features including expense tracking, budget recommendations, and basic AI insights. Focus on essential functionality for initial user testing.",
          status: "in_progress",
          priority: "high",
          target_date: "2024-03-15",
          completion_percentage: 65,
          created_at: "2024-02-01",
          user_ideas: { title: "AI-Powered Personal Finance Assistant", category: "Finance" }
        },
        {
          id: 3,
          title: "Secure Initial Funding Round",
          description: "Raise $250K seed funding through angel investors and early-stage VCs to support product development and initial marketing efforts.",
          status: "in_progress",
          priority: "high",
          target_date: "2024-04-30",
          completion_percentage: 30,
          created_at: "2024-02-15",
          user_ideas: { title: "AI-Powered Personal Finance Assistant", category: "Finance" }
        },
        {
          id: 4,
          title: "Launch Beta Testing Program",
          description: "Recruit 500 beta users, implement feedback collection system, and iterate on product based on user insights and usage analytics.",
          status: "not_started",
          priority: "medium",
          target_date: "2024-05-15",
          completion_percentage: 0,
          created_at: "2024-02-20",
          user_ideas: { title: "AI-Powered Personal Finance Assistant", category: "Finance" }
        },
        {
          id: 5,
          title: "Achieve Product-Market Fit",
          description: "Reach key metrics: 40% of users actively using the app weekly, NPS score above 50, and clear evidence of organic growth and user retention.",
          status: "not_started",
          priority: "high",
          target_date: "2024-07-31",
          completion_percentage: 0,
          created_at: "2024-03-01",
          user_ideas: { title: "AI-Powered Personal Finance Assistant", category: "Finance" }
        }
      ];

      setMilestones(mockMilestones);
      calculateStats(mockMilestones);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (milestonesData) => {
    const total = milestonesData.length;
    const completed = milestonesData.filter(m => m.status === 'completed').length;
    const inProgress = milestonesData.filter(m => m.status === 'in_progress').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    setStats({
      total,
      completed,
      inProgress,
      completionRate
    });
  };

  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/milestones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMilestone),
      });

      if (!response.ok) {
        throw new Error('Failed to create milestone');
      }

      const data = await response.json();
      setMilestones(prev => [...prev, data.milestone]);
      calculateStats([...milestones, data.milestone]);
      setNewMilestone({
        title: '',
        description: '',
        target_date: '',
        priority: 'medium',
        idea_id: ''
      });
      setShowCreateForm(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const updateMilestoneStatus = async (milestoneId, newStatus) => {
    try {
      const response = await fetch(`/api/milestones/${milestoneId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update milestone');
      }

      const updatedMilestones = milestones.map(m =>
        m.id === milestoneId ? { ...m, status: newStatus } : m
      );
      setMilestones(updatedMilestones);
      calculateStats(updatedMilestones);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-slate-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Enhanced Header with Purpose Explanation */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Business Milestones</h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Transform your business ideas into actionable goals and track your entrepreneurial journey with precision.
            </p>
          </div>

          {/* Purpose and Instructions Section */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 mb-8 border border-indigo-100">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4 flex items-center">
                  <Target className="h-6 w-6 mr-3 text-indigo-600" />
                  What are Business Milestones?
                </h2>
                <p className="text-slate-700 leading-relaxed mb-4">
                  Business milestones are critical checkpoints that mark significant achievements in your entrepreneurial journey.
                  They help you break down complex business goals into manageable, measurable objectives.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-slate-700">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Track progress on your business ideas
                  </div>
                  <div className="flex items-center text-slate-700">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Set realistic timelines and deadlines
                  </div>
                  <div className="flex items-center text-slate-700">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Maintain accountability and momentum
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
                  How to Use This Feature
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <span className="bg-indigo-600 text-white text-sm font-bold rounded-full h-6 w-6 flex items-center justify-center mr-3 mt-0.5">1</span>
                    <p className="text-slate-700">Create milestones for each business idea you're developing</p>
                  </div>
                  <div className="flex items-start">
                    <span className="bg-indigo-600 text-white text-sm font-bold rounded-full h-6 w-6 flex items-center justify-center mr-3 mt-0.5">2</span>
                    <p className="text-slate-700">Set specific, measurable goals with realistic target dates</p>
                  </div>
                  <div className="flex items-start">
                    <span className="bg-indigo-600 text-white text-sm font-bold rounded-full h-6 w-6 flex items-center justify-center mr-3 mt-0.5">3</span>
                    <p className="text-slate-700">Track your progress and celebrate achievements</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Milestone
              </Button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Milestones</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                </div>
                <Target className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">In Progress</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.inProgress}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Completion Rate</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.completionRate}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create Milestone Form */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Create New Milestone</h2>
              <form onSubmit={handleCreateMilestone}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={newMilestone.title}
                      onChange={(e) => setNewMilestone(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newMilestone.description}
                      onChange={(e) => setNewMilestone(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                      rows="3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Target Date
                    </label>
                    <input
                      type="date"
                      value={newMilestone.target_date}
                      onChange={(e) => setNewMilestone(prev => ({ ...prev, target_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={newMilestone.priority}
                      onChange={(e) => setNewMilestone(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Create Milestone
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Milestones List */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">Your Milestones</h2>
          </div>

          {milestones.length === 0 ? (
            <div className="p-12 text-center">
              <div className="max-w-md mx-auto">
                <Target className="w-16 h-16 text-indigo-400 mx-auto mb-6" />
                <h3 className="text-2xl font-semibold text-slate-900 mb-4">Ready to Start Your Journey?</h3>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  Transform your business ideas into actionable milestones. Start by creating your first milestone to track progress and maintain momentum.
                </p>

                {/* Example Milestones */}
                <div className="bg-slate-50 rounded-lg p-6 mb-6 text-left">
                  <h4 className="font-semibold text-slate-900 mb-3">Example Milestones:</h4>
                  <div className="space-y-2 text-sm text-slate-700">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      Complete market research and competitor analysis
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      Develop minimum viable product (MVP)
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      Acquire first 100 customers
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      Reach $10K monthly recurring revenue
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Milestone
                </Button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {milestones.map((milestone) => (
                <div key={milestone.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-slate-900">{milestone.title}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          milestone.priority === 'high'
                            ? 'bg-red-100 text-red-800'
                            : milestone.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {milestone.priority}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          milestone.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : milestone.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {milestone.status.replace('_', ' ')}
                        </span>
                      </div>

                      {milestone.description && (
                        <p className="text-slate-600 mb-3">{milestone.description}</p>
                      )}

                      {milestone.target_date && (
                        <p className="text-sm text-slate-500">
                          Target: {new Date(milestone.target_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      {milestone.status !== 'completed' && (
                        <button
                          onClick={() => updateMilestoneStatus(milestone.id, 'completed')}
                          className="text-green-600 hover:text-green-700 p-1 transition-colors"
                          title="Mark as completed"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      )}
                      {milestone.status === 'not_started' && (
                        <button
                          onClick={() => updateMilestoneStatus(milestone.id, 'in_progress')}
                          className="text-blue-600 hover:text-blue-700 p-1 transition-colors"
                          title="Start working"
                        >
                          <Clock className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
