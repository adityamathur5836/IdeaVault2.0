'use client';

import { useState } from 'react';
import { useDashboardUpdater } from '@/contexts/DashboardContext';
import { useToast } from '@/components/ui/Toast';

export function useIdeaActions() {
  const [loading, setLoading] = useState(false);
  const { addIdeaToDashboard, refreshDashboard } = useDashboardUpdater();
  const { toast } = useToast();

  const saveIdea = async (ideaData) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/save-idea', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ideaData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save idea');
      }

      const result = await response.json();
      
      if (result.success) {
        // Add the new idea to dashboard immediately
        addIdeaToDashboard(result.idea);
        toast.success('Idea saved successfully!');
        return result.idea;
      } else {
        throw new Error(result.error || 'Failed to save idea');
      }
    } catch (error) {
      console.error('Error saving idea:', error);
      toast.error(error.message || 'Failed to save idea');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const saveMultipleIdeas = async (ideasArray) => {
    try {
      setLoading(true);
      const savedIdeas = [];
      
      for (const ideaData of ideasArray) {
        try {
          const savedIdea = await saveIdea(ideaData);
          savedIdeas.push(savedIdea);
        } catch (error) {
          console.error('Error saving individual idea:', error);
          // Continue with other ideas even if one fails
        }
      }
      
      if (savedIdeas.length > 0) {
        toast.success(`${savedIdeas.length} idea(s) saved successfully!`);
        // Trigger a full dashboard refresh for multiple saves
        refreshDashboard();
      }
      
      return savedIdeas;
    } catch (error) {
      console.error('Error saving multiple ideas:', error);
      toast.error('Failed to save ideas');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const generateAndSaveIdeas = async (generationParams) => {
    try {
      setLoading(true);
      
      // Generate ideas
      const response = await fetch('/api/generate-idea', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(generationParams),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate ideas');
      }

      const result = await response.json();
      
      // Handle both single and multiple idea responses
      const ideas = result.ideas || [result];
      
      if (ideas.length === 0) {
        throw new Error('No ideas were generated');
      }

      // Save all generated ideas
      const savedIdeas = await saveMultipleIdeas(ideas.map(idea => ({
        ...idea,
        generated: true,
        source_data: {
          generation_params: generationParams,
          ai_generated: result.ai_generated || 0,
          database_matched: result.database_matched || 0,
          source: result.source || 'unknown',
          model: result.model || 'gemini-1.5-flash'
        }
      })));

      return savedIdeas;
    } catch (error) {
      console.error('Error generating and saving ideas:', error);
      toast.error(error.message || 'Failed to generate and save ideas');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const generateBusinessReport = async (idea) => {
    try {
      setLoading(true);

      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idea }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate business report');
      }

      const result = await response.json();

      if (result.success) {
        toast.success('Business report generated successfully!');
        return result.report;
      } else {
        throw new Error(result.error || 'Failed to generate business report');
      }
    } catch (error) {
      console.error('Error generating business report:', error);
      toast.error(error.message || 'Failed to generate business report');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    saveIdea,
    saveMultipleIdeas,
    generateAndSaveIdeas,
    generateBusinessReport,
    loading
  };
}
