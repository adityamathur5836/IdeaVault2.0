'use client';

import { createContext, useContext, useState, useCallback } from 'react';

const DashboardContext = createContext();

export function DashboardProvider({ children }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [dashboardData, setDashboardData] = useState({
    ideas: [],
    credits: null,
    preferences: null
  });

  // Function to trigger dashboard refresh
  const refreshDashboard = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Function to update dashboard data without full refresh
  const updateDashboardData = useCallback((updates) => {
    setDashboardData(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  // Function to add new idea to dashboard
  const addIdeaToDashboard = useCallback((newIdea) => {
    setDashboardData(prev => ({
      ...prev,
      ideas: [newIdea, ...prev.ideas]
    }));
  }, []);

  // Function to update existing idea in dashboard
  const updateIdeaInDashboard = useCallback((ideaId, updates) => {
    setDashboardData(prev => ({
      ...prev,
      ideas: prev.ideas.map(idea => 
        idea.id === ideaId ? { ...idea, ...updates } : idea
      )
    }));
  }, []);

  // Function to remove idea from dashboard
  const removeIdeaFromDashboard = useCallback((ideaId) => {
    setDashboardData(prev => ({
      ...prev,
      ideas: prev.ideas.filter(idea => idea.id !== ideaId)
    }));
  }, []);

  // Function to update credits
  const updateCredits = useCallback((newCredits) => {
    setDashboardData(prev => ({
      ...prev,
      credits: newCredits
    }));
  }, []);

  const value = {
    refreshTrigger,
    dashboardData,
    refreshDashboard,
    updateDashboardData,
    addIdeaToDashboard,
    updateIdeaInDashboard,
    removeIdeaFromDashboard,
    updateCredits
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}

// Hook for components that need to trigger dashboard updates
export function useDashboardUpdater() {
  const { 
    refreshDashboard, 
    addIdeaToDashboard, 
    updateIdeaInDashboard, 
    removeIdeaFromDashboard,
    updateCredits 
  } = useDashboard();

  return {
    refreshDashboard,
    addIdeaToDashboard,
    updateIdeaInDashboard,
    removeIdeaFromDashboard,
    updateCredits
  };
}
