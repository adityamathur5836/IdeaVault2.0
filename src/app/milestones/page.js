'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Plus, Target, CheckCircle, Clock, TrendingUp, Edit, Trash2, Calendar, AlertCircle } from 'lucide-react';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
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

      // For now, use mock data until database is properly set up
      const mockMilestones = [
        {
          id: 1,
          title: "Complete MVP Development",
          description: "Build the core features for the AI productivity assistant",
          status: "in_progress",
          priority: "high",
          target_date: "2024-02-15",
          completion_percentage: 75,
          created_at: "2024-01-01",
          user_ideas: { title: "AI Productivity Assistant", category: "Productivity" }
        },
        {
          id: 2,
          title: "User Testing Phase",
          description: "Conduct user testing with 50 beta users",
          status: "not_started",
          priority: "medium",
          target_date: "2024-03-01",
          completion_percentage: 0,
          created_at: "2024-01-02",
          user_ideas: { title: "AI Productivity Assistant", category: "Productivity" }
        },
        {
          id: 3,
          title: "Launch Marketing Campaign",
          description: "Execute go-to-market strategy",
          status: "completed",
          priority: "high",
          target_date: "2024-01-30",
          completion_percentage: 100,
          created_at: "2024-01-03",
          user_ideas: { title: "E-commerce Analytics Tool", category: "Analytics" }
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
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Milestones</h1>
            <p className="text-slate-600 mt-2">Track your progress and achieve your goals</p>
          </div>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Milestone
          </Button>
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
              <Target className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No milestones yet</h3>
              <p className="text-slate-600 mb-4">Create your first milestone to start tracking your progress</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Create Milestone
              </button>
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
