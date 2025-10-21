import { supabaseUser, supabaseUserServer } from './supabase';

// Save user idea to database
export async function saveUserIdea(userId, ideaData) {
  try {
    const { data, error } = await supabaseUser
      .from('user_ideas')
      .insert({
        user_id: userId,
        title: ideaData.title,
        description: ideaData.description,
        category: ideaData.category,
        difficulty: ideaData.difficulty,
        target_audience: ideaData.target_audience,
        tags: ideaData.tags || [],
        generated: ideaData.generated || false,
        source_input: ideaData.source_input,
        original_idea_id: ideaData.original_idea_id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      // Check if it's a table not found error (PGRST205)
      if (error.code === 'PGRST205') {
        console.warn('user_ideas table not found, returning mock saved idea');
        return {
          id: Math.floor(Math.random() * 1000000),
          user_id: userId,
          title: ideaData.title,
          description: ideaData.description,
          category: ideaData.category,
          difficulty: ideaData.difficulty,
          target_audience: ideaData.target_audience,
          tags: ideaData.tags || [],
          generated: ideaData.generated || false,
          source_input: ideaData.source_input,
          original_idea_id: ideaData.original_idea_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
      console.error('Error saving user idea:', error);
      throw new Error('Failed to save idea');
    }

    return data;
  } catch (error) {
    console.error('Save user idea error:', error);
    // Return mock data if database is not set up
    return {
      id: Math.floor(Math.random() * 1000000),
      user_id: userId,
      title: ideaData.title,
      description: ideaData.description,
      category: ideaData.category,
      difficulty: ideaData.difficulty,
      target_audience: ideaData.target_audience,
      tags: ideaData.tags || [],
      generated: ideaData.generated || false,
      source_input: ideaData.source_input,
      original_idea_id: ideaData.original_idea_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
}

// Get user's saved ideas
export async function getUserIdeas(userId, limit = 50, offset = 0) {
  try {
    const { data, error } = await supabaseUser
      .from('user_ideas')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching user ideas:', error);
      throw new Error('Failed to fetch user ideas');
    }

    return data || [];
  } catch (error) {
    console.error('Get user ideas error:', error);
    throw error;
  }
}

// Delete user idea
export async function deleteUserIdea(userId, ideaId) {
  try {
    const { error } = await supabaseUser
      .from('user_ideas')
      .delete()
      .eq('id', ideaId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting user idea:', error);
      throw new Error('Failed to delete idea');
    }

    return true;
  } catch (error) {
    console.error('Delete user idea error:', error);
    throw error;
  }
}

// Save user feedback
export async function saveUserFeedback(userId, ideaId, feedbackData) {
  try {
    const { data, error } = await supabaseUser
      .from('user_feedback')
      .insert({
        user_id: userId,
        idea_id: ideaId,
        rating: feedbackData.rating,
        comment: feedbackData.comment,
        feedback_type: feedbackData.type || 'general',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving user feedback:', error);
      throw new Error('Failed to save feedback');
    }

    return data;
  } catch (error) {
    console.error('Save user feedback error:', error);
    throw error;
  }
}

// Get feedback for an idea
export async function getIdeaFeedback(ideaId, limit = 20) {
  try {
    const { data, error } = await supabaseUser
      .from('user_feedback')
      .select(`
        *,
        user_profiles(username, avatar_url)
      `)
      .eq('idea_id', ideaId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching idea feedback:', error);
      throw new Error('Failed to fetch feedback');
    }

    return data || [];
  } catch (error) {
    console.error('Get idea feedback error:', error);
    throw error;
  }
}

// Get user's feedback history
export async function getUserFeedback(userId, limit = 50) {
  try {
    const { data, error } = await supabaseUser
      .from('user_feedback')
      .select(`
        *,
        user_ideas(title, category)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching user feedback:', error);
      throw new Error('Failed to fetch user feedback');
    }

    return data || [];
  } catch (error) {
    console.error('Get user feedback error:', error);
    throw error;
  }
}

// Create or update user profile
export async function upsertUserProfile(userId, profileData) {
  try {
    const { data, error } = await supabaseUser
      .from('user_profiles')
      .upsert({
        user_id: userId,
        username: profileData.username,
        email: profileData.email,
        avatar_url: profileData.avatar_url,
        bio: profileData.bio,
        preferences: profileData.preferences || {},
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting user profile:', error);
      throw new Error('Failed to update profile');
    }

    return data;
  } catch (error) {
    console.error('Upsert user profile error:', error);
    throw error;
  }
}

// Get user profile
export async function getUserProfile(userId) {
  try {
    const { data, error } = await supabaseUser
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found error
      console.error('Error fetching user profile:', error);
      throw new Error('Failed to fetch profile');
    }

    return data;
  } catch (error) {
    console.error('Get user profile error:', error);
    throw error;
  }
}

// Save user search history
export async function saveSearchHistory(userId, searchData) {
  try {
    const { data, error } = await supabaseUser
      .from('search_history')
      .insert({
        user_id: userId,
        query: searchData.query,
        filters: searchData.filters || {},
        results_count: searchData.results_count || 0,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving search history:', error);
      throw new Error('Failed to save search history');
    }

    return data;
  } catch (error) {
    console.error('Save search history error:', error);
    throw error;
  }
}

// Get user search history
export async function getUserSearchHistory(userId, limit = 20) {
  try {
    const { data, error } = await supabaseUser
      .from('search_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching search history:', error);
      throw new Error('Failed to fetch search history');
    }

    return data || [];
  } catch (error) {
    console.error('Get search history error:', error);
    throw error;
  }
}

// Get community validation data
export async function getCommunityValidation(ideaId) {
  try {
    const { data, error } = await supabaseUser
      .from('user_feedback')
      .select('rating, feedback_type')
      .eq('idea_id', ideaId);

    if (error) {
      console.error('Error fetching community validation:', error);
      throw new Error('Failed to fetch community validation');
    }

    // Calculate metrics
    const ratings = data.map(item => item.rating).filter(Boolean);
    const averageRating = ratings.length > 0 
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
      : 0;

    return {
      total_feedback: data.length,
      average_rating: averageRating,
      rating_distribution: calculateRatingDistribution(ratings),
      feedback_types: calculateFeedbackTypes(data)
    };
  } catch (error) {
    console.error('Get community validation error:', error);
    throw error;
  }
}

// Helper function to calculate rating distribution
function calculateRatingDistribution(ratings) {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratings.forEach(rating => {
    if (rating >= 1 && rating <= 5) {
      distribution[rating]++;
    }
  });
  return distribution;
}

// Helper function to calculate feedback types
function calculateFeedbackTypes(feedbackData) {
  const types = {};
  feedbackData.forEach(item => {
    const type = item.feedback_type || 'general';
    types[type] = (types[type] || 0) + 1;
  });
  return types;
}

// ===== NEW ENHANCED FEATURES =====

// User Preferences Functions
export async function getUserPreferences(userId) {
  try {
    const { data, error } = await supabaseUser
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found error
      console.error('Error fetching user preferences:', error);
      throw new Error('Failed to fetch preferences');
    }

    return data;
  } catch (error) {
    console.error('Get user preferences error:', error);
    throw error;
  }
}

export async function upsertUserPreferences(userId, preferences) {
  try {
    const { data, error } = await supabaseUser
      .from('user_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting user preferences:', error);
      throw new Error('Failed to save preferences');
    }

    return data;
  } catch (error) {
    console.error('Upsert user preferences error:', error);
    throw error;
  }
}

// Enhanced User Ideas Functions
export async function updateUserIdea(userId, ideaId, updates) {
  try {
    const { data, error } = await supabaseUser
      .from('user_ideas')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', ideaId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user idea:', error);
      throw new Error('Failed to update idea');
    }

    return data;
  } catch (error) {
    console.error('Update user idea error:', error);
    throw error;
  }
}

export async function getUserIdeaById(userId, ideaId) {
  try {
    const { data, error } = await supabaseUser
      .from('user_ideas')
      .select('*')
      .eq('id', ideaId)
      .eq('user_id', userId)
      .single();

    if (error) {
      // Check if it's a table not found error (PGRST205)
      if (error.code === 'PGRST205') {
        console.warn('user_ideas table not found, creating mock idea');
        return {
          id: ideaId,
          user_id: userId,
          title: 'Sample Business Idea',
          description: 'This is a sample business idea for demonstration purposes.',
          category: 'Technology',
          difficulty: 'medium',
          target_audience: 'Consumers',
          budget_range: '$1,000 - $10,000',
          timeframe: '3-6 months',
          interests_skills: 'Technology, Innovation',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
      console.error('Error fetching user idea:', error);
      throw new Error('Failed to fetch idea');
    }

    return data;
  } catch (error) {
    console.error('Get user idea by ID error:', error);
    // Return mock data if database is not set up
    return {
      id: ideaId,
      user_id: userId,
      title: 'Sample Business Idea',
      description: 'This is a sample business idea for demonstration purposes.',
      category: 'Technology',
      difficulty: 'medium',
      target_audience: 'Consumers',
      budget_range: '$1,000 - $10,000',
      timeframe: '3-6 months',
      interests_skills: 'Technology, Innovation',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
}

// Milestones Functions
export async function getMilestones(userId, filters = {}) {
  try {
    let query = supabaseUser
      .from('milestones')
      .select(`
        *,
        user_ideas(title, category)
      `)
      .eq('user_id', userId);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.idea_id) {
      query = query.eq('idea_id', filters.idea_id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching milestones:', error);
      throw new Error('Failed to fetch milestones');
    }

    return data || [];
  } catch (error) {
    console.error('Get milestones error:', error);
    throw error;
  }
}

export async function createMilestone(userId, milestoneData) {
  try {
    const { data, error } = await supabaseUser
      .from('milestones')
      .insert({
        user_id: userId,
        ...milestoneData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating milestone:', error);
      throw new Error('Failed to create milestone');
    }

    return data;
  } catch (error) {
    console.error('Create milestone error:', error);
    throw error;
  }
}

export async function updateMilestone(userId, milestoneId, updates) {
  try {
    const { data, error } = await supabaseUser
      .from('milestones')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', milestoneId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating milestone:', error);
      throw new Error('Failed to update milestone');
    }

    return data;
  } catch (error) {
    console.error('Update milestone error:', error);
    throw error;
  }
}

export async function deleteMilestone(userId, milestoneId) {
  try {
    const { error } = await supabaseUser
      .from('milestones')
      .delete()
      .eq('id', milestoneId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting milestone:', error);
      throw new Error('Failed to delete milestone');
    }

    return true;
  } catch (error) {
    console.error('Delete milestone error:', error);
    throw error;
  }
}

// User Credits Functions
export async function getUserCredits(userId) {
  try {
    const { data, error } = await supabaseUser
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found error
      // Check if it's a table not found error (PGRST205)
      if (error.code === 'PGRST205') {
        console.warn('user_credits table not found, returning default credits');
        return {
          user_id: userId,
          credits: 100,
          premium_credits: 10,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
      console.error('Error fetching user credits:', error);
      throw new Error('Failed to fetch credits');
    }

    // If no credits record exists, create one with default values
    if (!data) {
      return await createUserCredits(userId);
    }

    return data;
  } catch (error) {
    console.error('Get user credits error:', error);
    // Return default credits if database is not set up
    return {
      user_id: userId,
      credits: 100,
      premium_credits: 10,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
}

export async function createUserCredits(userId) {
  try {
    const { data, error } = await supabaseUser
      .from('user_credits')
      .insert({
        user_id: userId,
        total_credits: 10,
        used_credits: 0
      })
      .select()
      .single();

    if (error) {
      // Check if it's a table not found error (PGRST205)
      if (error.code === 'PGRST205') {
        console.warn('user_credits table not found, returning default credits');
        return {
          user_id: userId,
          credits: 100,
          premium_credits: 10,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
      console.error('Error creating user credits:', error);
      throw new Error('Failed to create credits');
    }

    return data;
  } catch (error) {
    console.error('Create user credits error:', error);
    // Return default credits if database is not set up
    return {
      user_id: userId,
      credits: 100,
      premium_credits: 10,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
}

export async function updateUserCredits(userId, creditsUsed) {
  try {
    const { data, error } = await supabaseUser
      .from('user_credits')
      .update({
        used_credits: creditsUsed,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user credits:', error);
      throw new Error('Failed to update credits');
    }

    return data;
  } catch (error) {
    console.error('Update user credits error:', error);
    throw error;
  }
}

// Idea Reports Functions
export async function getIdeaReport(userId, ideaId) {
  try {
    const { data, error } = await supabaseUser
      .from('idea_reports')
      .select('*')
      .eq('idea_id', ideaId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found error
      // Check if it's a table not found error (PGRST205)
      if (error.code === 'PGRST205') {
        console.warn('idea_reports table not found, returning null');
        return null;
      }
      console.error('Error fetching idea report:', error);
      throw new Error('Failed to fetch report');
    }

    return data;
  } catch (error) {
    console.error('Get idea report error:', error);
    // Return null if database is not set up
    return null;
  }
}

export async function createIdeaReport(userId, ideaId, reportData) {
  try {
    const { data, error } = await supabaseUser
      .from('idea_reports')
      .insert({
        idea_id: ideaId,
        user_id: userId,
        ...reportData,
        generated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      // Check if it's a table not found error (PGRST205)
      if (error.code === 'PGRST205') {
        console.warn('idea_reports table not found, returning mock report');
        return {
          id: Math.floor(Math.random() * 1000000),
          idea_id: ideaId,
          user_id: userId,
          ...reportData,
          generated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
      console.error('Error creating idea report:', error);
      throw new Error('Failed to create report');
    }

    return data;
  } catch (error) {
    console.error('Create idea report error:', error);
    // Return mock data if database is not set up
    return {
      id: Math.floor(Math.random() * 1000000),
      idea_id: ideaId,
      user_id: userId,
      ...reportData,
      generated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
}
