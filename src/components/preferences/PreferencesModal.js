'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/Toast';
import { X, Settings, User, Target, DollarSign, Clock, Users } from 'lucide-react';
import { getUserPreferences, upsertUserPreferences } from '@/lib/userService';

const experienceLevels = [
  { value: 'Beginner', label: 'Beginner - New to entrepreneurship' },
  { value: 'Intermediate', label: 'Intermediate - Some business experience' },
  { value: 'Expert', label: 'Expert - Seasoned entrepreneur' }
];

const timeCommitments = [
  { value: 'Part-time', label: 'Part-time - Side project or hobby' },
  { value: 'Full-time', label: 'Full-time - Primary focus and career' }
];

const aiRoles = [
  { value: 'advisor', label: 'Strategic Advisor - High-level guidance' },
  { value: 'mentor', label: 'Mentor - Step-by-step coaching' },
  { value: 'analyst', label: 'Market Analyst - Data-driven insights' },
  { value: 'creative', label: 'Creative Partner - Innovative brainstorming' },
  { value: 'validator', label: 'Idea Validator - Critical evaluation' }
];

const targetAudiences = [
  { value: 'consumers', label: 'General Consumers' },
  { value: 'small_business', label: 'Small Businesses' },
  { value: 'enterprise', label: 'Enterprise/Large Companies' },
  { value: 'developers', label: 'Developers/Technical Users' },
  { value: 'students', label: 'Students/Educational' },
  { value: 'healthcare', label: 'Healthcare Professionals' },
  { value: 'finance', label: 'Financial Services' },
  { value: 'nonprofits', label: 'Non-profits/NGOs' },
  { value: 'government', label: 'Government/Public Sector' },
  { value: 'seniors', label: 'Senior Citizens' }
];

export default function PreferencesModal({ isOpen, onClose }) {
  const { user } = useUser();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    interests: '',
    experience_level: 'Beginner',
    time_commitment: 'Part-time',
    capital_available: '',
    preferred_ai_role: 'advisor',
    target_audience: []
  });

  useEffect(() => {
    if (isOpen && user) {
      loadPreferences();
    }
  }, [isOpen, user]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const data = await getUserPreferences(user.id);
      if (data) {
        setPreferences({
          interests: data.interests || '',
          experience_level: data.experience_level || 'Beginner',
          time_commitment: data.time_commitment || 'Part-time',
          capital_available: data.capital_available || '',
          preferred_ai_role: data.preferred_ai_role || 'advisor',
          target_audience: data.target_audience || []
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      showToast('Failed to load preferences', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      await upsertUserPreferences(user.id, preferences);
      showToast('Preferences saved successfully', 'success');
      onClose();
    } catch (error) {
      console.error('Error saving preferences:', error);
      showToast('Failed to save preferences', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTargetAudienceChange = (audienceValue, checked) => {
    setPreferences(prev => ({
      ...prev,
      target_audience: checked
        ? [...prev.target_audience, audienceValue]
        : prev.target_audience.filter(a => a !== audienceValue)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Settings className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-900">Personalization Preferences</h2>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
              {/* Interests */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                  <Target className="h-4 w-4" />
                  Interests & Focus Areas
                </label>
                <Textarea
                  value={preferences.interests}
                  onChange={(e) => setPreferences(prev => ({ ...prev, interests: e.target.value }))}
                  placeholder="e.g., AI/ML, sustainability, fintech, healthcare, e-commerce (comma-separated)"
                  rows={3}
                  className="w-full"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Enter your areas of interest separated by commas
                </p>
              </div>

              {/* Experience Level */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                  <User className="h-4 w-4" />
                  Experience Level
                </label>
                <Select
                  value={preferences.experience_level}
                  onChange={(e) => setPreferences(prev => ({ ...prev, experience_level: e.target.value }))}
                  className="w-full text-slate-900"
                >
                  {experienceLevels.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Time Commitment */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                  <Clock className="h-4 w-4" />
                  Time Commitment
                </label>
                <Select
                  value={preferences.time_commitment}
                  onChange={(e) => setPreferences(prev => ({ ...prev, time_commitment: e.target.value }))}
                  className="w-full text-slate-900"
                >
                  {timeCommitments.map(commitment => (
                    <option key={commitment.value} value={commitment.value}>
                      {commitment.label}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Capital Available */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                  <DollarSign className="h-4 w-4" />
                  Available Capital (USD)
                </label>
                <Input
                  type="number"
                  value={preferences.capital_available}
                  onChange={(e) => setPreferences(prev => ({ ...prev, capital_available: e.target.value }))}
                  placeholder="e.g., 10000"
                  min="0"
                  step="1000"
                  className="w-full"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Approximate budget you can invest in your business idea
                </p>
              </div>

              {/* Preferred AI Role */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                  <Settings className="h-4 w-4" />
                  Preferred AI Role
                </label>
                <Select
                  value={preferences.preferred_ai_role}
                  onChange={(e) => setPreferences(prev => ({ ...prev, preferred_ai_role: e.target.value }))}
                  className="w-full text-slate-900"
                >
                  {aiRoles.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Target Audience */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-3">
                  <Users className="h-4 w-4" />
                  Target Audience (Select all that apply)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {targetAudiences.map(audience => (
                    <label key={audience.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.target_audience.includes(audience.value)}
                        onChange={(e) => handleTargetAudienceChange(audience.value, e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">{audience.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <LoadingSpinner className="h-4 w-4 mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Save Preferences'
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
