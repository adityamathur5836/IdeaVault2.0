import { createClient } from '@supabase/supabase-js';
import { createBrowserClient, createServerClient } from '@supabase/ssr';

// Environment variable validation
function validateEnvironmentVariables() {
  const requiredVars = {
    'NEXT_PUBLIC_SUPABASE_A_URL': process.env.NEXT_PUBLIC_SUPABASE_A_URL,
    'NEXT_PUBLIC_SUPABASE_A_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_A_ANON_KEY,
    'NEXT_PUBLIC_SUPABASE_B_URL': process.env.NEXT_PUBLIC_SUPABASE_B_URL,
    'NEXT_PUBLIC_SUPABASE_B_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_B_ANON_KEY,
  };

  const missing = Object.entries(requiredVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    const error = new Error(`Missing required environment variables: ${missing.join(', ')}`);
    error.name = 'EnvironmentConfigurationError';
    error.missingVars = missing;
    throw error;
  }

  return requiredVars;
}

// Validate environment variables at module load
let envVars;
try {
  envVars = validateEnvironmentVariables();
} catch (error) {
  console.error('Supabase configuration error:', error.message);
  // Create fallback configuration that will fail gracefully
  envVars = {
    'NEXT_PUBLIC_SUPABASE_A_URL': 'https://placeholder.supabase.co',
    'NEXT_PUBLIC_SUPABASE_A_ANON_KEY': 'placeholder-key',
    'NEXT_PUBLIC_SUPABASE_B_URL': 'https://placeholder.supabase.co',
    'NEXT_PUBLIC_SUPABASE_B_ANON_KEY': 'placeholder-key',
  };
}

// Supabase A - Read-only ideas database
const supabaseAUrl = envVars['NEXT_PUBLIC_SUPABASE_A_URL'];
const supabaseAKey = envVars['NEXT_PUBLIC_SUPABASE_A_ANON_KEY'];

// Supabase B - User data database
const supabaseBUrl = envVars['NEXT_PUBLIC_SUPABASE_B_URL'];
const supabaseBKey = envVars['NEXT_PUBLIC_SUPABASE_B_ANON_KEY'];
const supabaseBServiceKey = process.env.SUPABASE_B_SERVICE_ROLE_KEY;

// Safe client creation with error handling
function createSafeClient(url, key, options = {}) {
  try {
    if (!url || !key || url.includes('placeholder') || key.includes('placeholder')) {
      throw new Error('Invalid Supabase configuration');
    }
    return createClient(url, key, options);
  } catch (error) {
    console.error('Failed to create Supabase client:', error.message);
    // Return a mock client that will fail gracefully
    return {
      from: () => ({
        select: () => Promise.reject(new Error('Supabase not configured')),
        insert: () => Promise.reject(new Error('Supabase not configured')),
        update: () => Promise.reject(new Error('Supabase not configured')),
        delete: () => Promise.reject(new Error('Supabase not configured')),
      }),
      rpc: () => Promise.reject(new Error('Supabase not configured')),
      auth: {
        getUser: () => Promise.reject(new Error('Supabase not configured')),
      },
    };
  }
}

// Client for ideas database (read-only)
export const supabaseIdeas = createSafeClient(supabaseAUrl, supabaseAKey, {
  auth: {
    persistSession: false,
  },
});

// Client for user data database
export const supabaseUser = createSafeClient(supabaseBUrl, supabaseBKey);

// Server client for user data database (for server-side operations)
export const supabaseUserServer = supabaseBServiceKey
  ? createSafeClient(supabaseBUrl, supabaseBServiceKey)
  : supabaseUser;

// Browser client factory for SSR
export function createSupabaseBrowserClient() {
  try {
    if (!supabaseBUrl || !supabaseBKey || supabaseBUrl.includes('placeholder') || supabaseBKey.includes('placeholder')) {
      throw new Error('Supabase configuration not available');
    }
    return createBrowserClient(supabaseBUrl, supabaseBKey);
  } catch (error) {
    console.error('Failed to create Supabase browser client:', error.message);
    return createSafeClient(supabaseBUrl, supabaseBKey);
  }
}

// Server client factory for SSR
export function createSupabaseServerClient(cookieStore) {
  try {
    if (!supabaseBUrl || !supabaseBKey || supabaseBUrl.includes('placeholder') || supabaseBKey.includes('placeholder')) {
      throw new Error('Supabase configuration not available');
    }
    return createServerClient(supabaseBUrl, supabaseBKey, {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            console.error('Cookie setting error:', error);
          }
        },
        remove(name, options) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            console.error('Cookie removal error:', error);
          }
        },
      },
    });
  } catch (error) {
    console.error('Failed to create Supabase server client:', error.message);
    return createSafeClient(supabaseBUrl, supabaseBKey);
  }
}

// Configuration validation helper
export function isSupabaseConfigured() {
  return !!(
    supabaseAUrl &&
    supabaseAKey &&
    supabaseBUrl &&
    supabaseBKey &&
    !supabaseAUrl.includes('placeholder') &&
    !supabaseAKey.includes('placeholder') &&
    !supabaseBUrl.includes('placeholder') &&
    !supabaseBKey.includes('placeholder')
  );
}

// Error helper for user-friendly messages
export function getSupabaseConfigError() {
  if (!isSupabaseConfigured()) {
    return {
      title: 'Database Configuration Required',
      message: 'Please configure your Supabase environment variables to use this feature.',
      action: 'Contact your administrator or check the setup documentation.',
    };
  }
  return null;
}

// Vector similarity search function
export async function searchSimilarIdeas(embedding, limit = 10, threshold = 0.7) {
  try {
    const { data, error } = await supabaseIdeas.rpc('match_ideas', {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: limit,
    });

    if (error) {
      console.error('Error searching similar ideas:', error);
      throw new Error('Failed to search similar ideas');
    }

    return data || [];
  } catch (error) {
    console.error('Vector search error:', error);
    throw error;
  }
}

// Get idea by ID from ideas database
export async function getIdeaById(id) {
  try {
    const { data, error } = await supabaseIdeas
      .from('ideas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching idea:', error);
      throw new Error('Failed to fetch idea');
    }

    return data;
  } catch (error) {
    console.error('Get idea error:', error);
    throw error;
  }
}

// Get random ideas from ideas database
export async function getRandomIdeas(limit = 10) {
  try {
    const { data, error } = await supabaseIdeas
      .from('ideas')
      .select('*')
      .order('random()')
      .limit(limit);

    if (error) {
      console.error('Error fetching random ideas:', error);
      throw new Error('Failed to fetch random ideas');
    }

    return data || [];
  } catch (error) {
    console.error('Get random ideas error:', error);
    throw error;
  }
}

// Search ideas by category
export async function getIdeasByCategory(category, limit = 20) {
  try {
    const { data, error } = await supabaseIdeas
      .from('ideas')
      .select('*')
      .eq('category', category)
      .limit(limit);

    if (error) {
      console.error('Error fetching ideas by category:', error);
      throw new Error('Failed to fetch ideas by category');
    }

    return data || [];
  } catch (error) {
    console.error('Get ideas by category error:', error);
    throw error;
  }
}

// Get all categories
export async function getCategories() {
  try {
    const { data, error } = await supabaseIdeas
      .from('ideas')
      .select('category')
      .not('category', 'is', null);

    if (error) {
      console.error('Error fetching categories:', error);
      throw new Error('Failed to fetch categories');
    }

    // Get unique categories
    const categories = [...new Set(data.map(item => item.category))];
    return categories.sort();
  } catch (error) {
    console.error('Get categories error:', error);
    throw error;
  }
}
