/**
 * Badge utility functions for consistent badge styling across the application
 */

/**
 * Get the appropriate badge variant for difficulty levels
 * @param {string} difficulty - The difficulty level (easy, medium, hard)
 * @returns {string} Badge variant name
 */
export function getDifficultyVariant(difficulty) {
  switch (difficulty?.toLowerCase()) {
    case "easy": return "easy";
    case "medium": return "medium";
    case "hard": return "hard";
    default: return "default";
  }
}

/**
 * Get the appropriate badge variant for categories
 * @param {string} category - The category name
 * @returns {string} Badge variant name
 */
export function getCategoryVariant(category) {
  const categoryMap = {
    "productivity": "productivity",
    "health": "health",
    "finance": "finance",
    "education": "education",
    "entertainment": "entertainment",
    "social": "social",
    "business": "business",
    "technology": "technology",
    "e-commerce": "business",
    "saas": "technology",
    "mobile app": "technology",
    "web app": "technology",
    "ai/ml": "technology",
    "blockchain": "technology",
    "iot": "technology",
    "gaming": "entertainment",
    "media": "entertainment",
    "travel": "social",
    "food & beverage": "business",
    "real estate": "business",
    "automotive": "business",
    "fashion": "business",
    "sports & fitness": "health"
  };
  return categoryMap[category?.toLowerCase()] || "default";
}

/**
 * Get the appropriate badge variant for status
 * @param {string} status - The status (saved, in_progress, completed, archived)
 * @returns {string} Badge variant name
 */
export function getStatusVariant(status) {
  switch (status?.toLowerCase()) {
    case "saved": return "default";
    case "in_progress": return "warning";
    case "completed": return "success";
    case "archived": return "outline";
    default: return "default";
  }
}

/**
 * Get the appropriate badge variant for source type
 * @param {string} source - The source type (gemini_synthesis, database, etc.)
 * @returns {string} Badge variant name
 */
export function getSourceVariant(source) {
  switch (source?.toLowerCase()) {
    case "gemini_synthesis": return "ai";
    case "database": return "database";
    case "database_match": return "database";
    default: return "outline";
  }
}

/**
 * Get display text for difficulty levels
 * @param {string} difficulty - The difficulty level
 * @returns {string} Display text
 */
export function getDifficultyText(difficulty) {
  switch (difficulty?.toLowerCase()) {
    case "easy": return "Easy";
    case "medium": return "Medium";
    case "hard": return "Hard";
    default: return difficulty || "Unknown";
  }
}

/**
 * Get display text for status
 * @param {string} status - The status
 * @returns {string} Display text
 */
export function getStatusText(status) {
  switch (status?.toLowerCase()) {
    case "saved": return "Saved";
    case "in_progress": return "In Progress";
    case "completed": return "Completed";
    case "archived": return "Archived";
    default: return status || "Unknown";
  }
}

/**
 * Get display text for source type
 * @param {string} source - The source type
 * @returns {string} Display text
 */
export function getSourceText(source) {
  switch (source?.toLowerCase()) {
    case "gemini_synthesis": return "AI Generated";
    case "database": return "Database Match";
    case "database_match": return "Database Match";
    default: return source || "Unknown";
  }
}

/**
 * Validate and normalize category names
 * @param {string} category - The category name
 * @returns {string} Normalized category name
 */
export function normalizeCategory(category) {
  if (!category) return "Other";
  
  const normalized = category.toLowerCase().trim();
  const categoryMappings = {
    "ai": "AI/ML",
    "ml": "AI/ML",
    "artificial intelligence": "AI/ML",
    "machine learning": "AI/ML",
    "saas": "SaaS",
    "software as a service": "SaaS",
    "ecommerce": "E-commerce",
    "e-commerce": "E-commerce",
    "online store": "E-commerce",
    "mobile": "Mobile App",
    "mobile application": "Mobile App",
    "web": "Web App",
    "web application": "Web App",
    "webapp": "Web App",
    "fintech": "Finance",
    "financial technology": "Finance",
    "edtech": "Education",
    "educational technology": "Education",
    "healthtech": "Health",
    "health technology": "Health",
    "medtech": "Health",
    "medical technology": "Health"
  };
  
  return categoryMappings[normalized] || category;
}

/**
 * Get appropriate icon name for category
 * @param {string} category - The category name
 * @returns {string} Lucide icon name
 */
export function getCategoryIcon(category) {
  const iconMap = {
    "productivity": "Zap",
    "health": "Heart",
    "finance": "DollarSign",
    "education": "GraduationCap",
    "entertainment": "Play",
    "social": "Users",
    "business": "Briefcase",
    "technology": "Cpu",
    "e-commerce": "ShoppingCart",
    "saas": "Cloud",
    "mobile app": "Smartphone",
    "web app": "Globe",
    "ai/ml": "Brain",
    "blockchain": "Link",
    "iot": "Wifi",
    "gaming": "Gamepad2",
    "media": "Camera",
    "travel": "MapPin",
    "food & beverage": "Coffee",
    "real estate": "Home",
    "automotive": "Car",
    "fashion": "Shirt",
    "sports & fitness": "Dumbbell"
  };
  
  return iconMap[category?.toLowerCase()] || "Target";
}

/**
 * Get appropriate icon name for difficulty
 * @param {string} difficulty - The difficulty level
 * @returns {string} Lucide icon name
 */
export function getDifficultyIcon(difficulty) {
  switch (difficulty?.toLowerCase()) {
    case "easy": return "TrendingUp";
    case "medium": return "BarChart3";
    case "hard": return "Mountain";
    default: return "TrendingUp";
  }
}

/**
 * Get appropriate icon name for source
 * @param {string} source - The source type
 * @returns {string} Lucide icon name
 */
export function getSourceIcon(source) {
  switch (source?.toLowerCase()) {
    case "gemini_synthesis": return "Sparkles";
    case "database": return "Database";
    case "database_match": return "Database";
    default: return "FileText";
  }
}
