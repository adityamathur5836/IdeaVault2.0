/**
 * Environment Configuration Validator
 * Validates all required environment variables at application startup
 */

// Required environment variables for different features
// Client-side variables (accessible in browser)
const CLIENT_ENV_VARS = {
  // Clerk Authentication (client-side)
  clerk: {
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY": process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  },

  // Supabase Configuration (client-side)
  supabase: {
    "NEXT_PUBLIC_SUPABASE_A_URL": process.env.NEXT_PUBLIC_SUPABASE_A_URL,
    "NEXT_PUBLIC_SUPABASE_A_ANON_KEY": process.env.NEXT_PUBLIC_SUPABASE_A_ANON_KEY,
    "NEXT_PUBLIC_SUPABASE_B_URL": process.env.NEXT_PUBLIC_SUPABASE_B_URL,
    "NEXT_PUBLIC_SUPABASE_B_ANON_KEY": process.env.NEXT_PUBLIC_SUPABASE_B_ANON_KEY,
  },

  // Application Configuration
  app: {
    "NEXT_PUBLIC_APP_URL": process.env.NEXT_PUBLIC_APP_URL,
  }
};

// Server-side variables (only accessible on server)
const SERVER_ENV_VARS = {
  // Clerk Authentication (server-side)
  clerk: {
    "CLERK_SECRET_KEY": process.env.CLERK_SECRET_KEY,
  },

  // Supabase Configuration (server-side)
  supabase: {
    "SUPABASE_B_SERVICE_ROLE_KEY": process.env.SUPABASE_B_SERVICE_ROLE_KEY,
  },

  // AI Configuration
  ai: {
    "GOOGLE_GEMINI_API_KEY": process.env.GOOGLE_GEMINI_API_KEY,
  },
};

// Combined variables for server-side validation
const REQUIRED_ENV_VARS = typeof window === "undefined"
  ? { ...mergeEnvVars(CLIENT_ENV_VARS, SERVER_ENV_VARS) }
  : CLIENT_ENV_VARS;

// Helper function to merge environment variable objects
function mergeEnvVars(clientVars, serverVars) {
  const merged = { ...clientVars };

  Object.entries(serverVars).forEach(([category, variables]) => {
    if (merged[category]) {
      merged[category] = { ...merged[category], ...variables };
    } else {
      merged[category] = variables;
    }
  });

  return merged;
}

// Validation results
let validationResults = null;
let clientValidationResults = null;

/**
 * Validate a specific category of environment variables
 */
function validateCategory(categoryName, variables) {
  const missing = [];
  const invalid = [];
  const valid = [];

  Object.entries(variables).forEach(([key, value]) => {
    if (!value) {
      missing.push(key);
    } else if (value.includes("placeholder") || value === "your-key-here") {
      invalid.push(key);
    } else {
      valid.push(key);
    }
  });

  return {
    category: categoryName,
    missing,
    invalid,
    valid,
    isValid: missing.length === 0 && invalid.length === 0,
    totalRequired: Object.keys(variables).length,
    totalValid: valid.length
  };
}

/**
 * Validate all environment variables
 */
export function validateEnvironment() {
  if (validationResults) {
    return validationResults;
  }

  const results = {};
  let overallValid = true;
  let totalMissing = 0;
  let totalInvalid = 0;

  Object.entries(REQUIRED_ENV_VARS).forEach(([category, variables]) => {
    const result = validateCategory(category, variables);
    results[category] = result;
    
    if (!result.isValid) {
      overallValid = false;
    }
    
    totalMissing += result.missing.length;
    totalInvalid += result.invalid.length;
  });

  validationResults = {
    isValid: overallValid,
    categories: results,
    summary: {
      totalMissing,
      totalInvalid,
      totalCategories: Object.keys(REQUIRED_ENV_VARS).length,
      validCategories: Object.values(results).filter(r => r.isValid).length
    }
  };

  return validationResults;
}

/**
 * Get user-friendly error messages for missing configuration
 */
export function getConfigurationErrors() {
  // Use client-side validation when running in browser
  const validation = typeof window === "undefined"
    ? validateEnvironment()
    : validateClientEnvironment();

  if (validation.isValid) {
    return null;
  }

  const errors = [];

  Object.values(validation.categories).forEach(category => {
    if (!category.isValid) {
      const issues = [];

      if (category.missing.length > 0) {
        issues.push(`Missing: ${category.missing.join(", ")}`);
      }

      if (category.invalid.length > 0) {
        issues.push(`Invalid: ${category.invalid.join(", ")}`);
      }

      errors.push({
        category: category.category,
        issues: issues.join("; "),
        severity: category.missing.length > 0 ? "error" : "warning"
      });
    }
  });

  return errors;
}

/**
 * Check if a specific feature is properly configured
 */
export function isFeatureConfigured(featureName) {
  // Use client-side validation when running in browser
  const validation = typeof window === "undefined"
    ? validateEnvironment()
    : validateClientEnvironment();
  return validation.categories[featureName]?.isValid || false;
}

/**
 * Validate client-side environment variables only
 */
export function validateClientEnvironment() {
  if (clientValidationResults) {
    return clientValidationResults;
  }

  const results = {};
  let overallValid = true;
  let totalMissing = 0;
  let totalInvalid = 0;

  Object.entries(CLIENT_ENV_VARS).forEach(([category, variables]) => {
    const result = validateCategory(category, variables);
    results[category] = result;

    if (!result.isValid) {
      overallValid = false;
    }

    totalMissing += result.missing.length;
    totalInvalid += result.invalid.length;
  });

  clientValidationResults = {
    isValid: overallValid,
    categories: results,
    summary: {
      totalMissing,
      totalInvalid,
      totalCategories: Object.keys(CLIENT_ENV_VARS).length,
      validCategories: Object.values(results).filter(r => r.isValid).length
    }
  };

  return clientValidationResults;
}

/**
 * Get configuration status for display in UI (client-side safe)
 */
export function getConfigurationStatus() {
  // Use client-side validation when running in browser
  const validation = typeof window === "undefined"
    ? validateEnvironment()
    : validateClientEnvironment();

  const errors = getConfigurationErrors();

  return {
    isValid: validation.isValid,
    summary: validation.summary,
    errors: errors || [],
    features: {
      authentication: validation.categories.clerk?.isValid || false,
      database: validation.categories.supabase?.isValid || false,
      ai: typeof window === "undefined" ? (validation.categories.ai?.isValid || false) : true, // Assume AI is configured on client
      app: validation.categories.app?.isValid || false,
    }
  };
}

/**
 * Log configuration status to console (development only)
 */
export function logConfigurationStatus() {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  const status = getConfigurationStatus();
  
  console.log("🔧 Environment Configuration Status:");
  console.log(`Overall Status: ${status.isValid ? "✅ Valid" : "❌ Invalid"}`);
  
  Object.entries(status.features).forEach(([feature, isValid]) => {
    console.log(`${feature}: ${isValid ? "✅" : "❌"}`);
  });

  if (status.errors.length > 0) {
    console.log("\n⚠️  Configuration Issues:");
    status.errors.forEach(error => {
      console.log(`${error.category}: ${error.issues}`);
    });
  }
}

/**
 * Reset validation cache (useful for testing)
 */
export function resetValidationCache() {
  validationResults = null;
}

// Auto-validate on module load in development
if (process.env.NODE_ENV === "development") {
  logConfigurationStatus();
}
