/**
 * Generate Ideas Page
 *
 * Main page for AI-powered business idea generation with two modes:
 * 1. Structured Form: Category-based idea generation with specific parameters
 * 2. Freeform Prompt: Natural language description-based generation
 *
 * Features:
 * - Responsive grid layout (1/2/3/4/5 columns based on screen size)
 * - Real-time form validation with toast notifications
 * - Full-width ideas display section when ideas are generated
 * - Enhanced IdeaCard components with modern styling
 * - Configuration validation and error handling
 * - Authentication checks and redirects
 */
"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { DynamicLoader } from "@/components/ui/DynamicLoader";
import { useToast } from "@/components/ui/Toast";
import { useIdeaActions } from "@/hooks/useIdeaActions";
import IdeaCard from "@/components/IdeaCard";
import ErrorBoundary, { ErrorMessage } from "@/components/ui/ErrorBoundary";
import ConfigurationBanner from "@/components/ui/ConfigurationBanner";
import {
  Lightbulb,
  Wand2,
  Target,
  Sparkles,
  Save,
  ArrowDown
} from "lucide-react";

const categories = [
  "Technology",
  "Healthcare",
  "Education",
  "Finance",
  "E-commerce",
  "Food & Beverage",
  "Travel & Tourism",
  "Entertainment",
  "Real Estate",
  "Sustainability",
  "Fashion",
  "Sports & Fitness",
  "Other"
];

const difficulties = [
  { value: "easy", label: "Easy (Low complexity, quick to start)" },
  { value: "medium", label: "Medium (Moderate complexity, some expertise needed)" },
  { value: "hard", label: "Hard (High complexity, significant expertise required)" }
];

const targetAudiences = [
  "Small Businesses",
  "Enterprises",
  "Consumers",
  "Students",
  "Professionals",
  "Seniors",
  "Parents",
  "Entrepreneurs",
  "Developers",
  "Other"
];

export default function GeneratePage() {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const { saveIdea, saveMultipleIdeas, loading: savingIdeas } = useIdeaActions();

  const [mode, setMode] = useState("structured"); // "structured" or "freeform"
  const [loading, setLoading] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState([]);
  const [numberOfIdeas, setNumberOfIdeas] = useState(6);
  const [error, setError] = useState(null);
  
  // Structured form state
  const [formData, setFormData] = useState({
    category: "",
    difficulty: "",
    targetAudience: "",
    budget: "",
    timeframe: "",
    interests: ""
  });
  
  // Freeform state
  const [prompt, setPrompt] = useState("");

  // Restore persisted state on mount
  useEffect(() => {
    try {
      const persisted = JSON.parse(localStorage.getItem("generate_form_state") || "{}");
      if (persisted.mode) setMode(persisted.mode);
      if (persisted.formData) setFormData(prev => ({ ...prev, ...persisted.formData }));
      if (persisted.prompt) setPrompt(persisted.prompt);
      if (persisted.numberOfIdeas) setNumberOfIdeas(persisted.numberOfIdeas);
      const cachedIdeas = JSON.parse(localStorage.getItem("generate_latest_ideas") || "[]");
      if (Array.isArray(cachedIdeas) && cachedIdeas.length > 0) setGeneratedIdeas(cachedIdeas);
    } catch (e) {
      console.warn("Failed to restore generate form state:", e);
    }
  }, []);

  // Persist state whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem("generate_form_state", JSON.stringify({
        mode,
        formData,
        prompt,
        numberOfIdeas,
      }));
    } catch (_) {}
  }, [mode, formData, prompt, numberOfIdeas]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Validates the structured form inputs
   * Ensures required fields (category, difficulty, targetAudience) are filled
   * Shows toast error for missing fields
   */
  const validateStructuredForm = () => {
    const required = ["category", "difficulty", "targetAudience"];
    const missing = required.filter(field => !formData[field]);

    if (missing.length > 0) {
      toast.error(`Please fill in: ${missing.join(", ")}`);
      return false;
    }
    return true;
  };

  const validateFreeformPrompt = () => {
    if (!prompt.trim()) {
      toast.error("Please enter a description of what you\"re looking for");
      return false;
    }
    if (prompt.trim().length < 10) {
      toast.error("Please provide a more detailed description (at least 10 characters)");
      return false;
    }
    return true;
  };

  /**
   * Main idea generation function
   * Handles both structured and freeform modes
   * Validates inputs, calls API, and updates UI state
   * Shows appropriate success/error messages via toast
   */
  const generateIdea = async () => {
    if (!isSignedIn) {
      toast.error("Please sign in to generate ideas");
      router.push("/sign-in");
      return;
    }

    // Validate based on mode
    if (mode === "structured" && !validateStructuredForm()) return;
    if (mode === "freeform" && !validateFreeformPrompt()) return;

    setLoading(true);
    setError(null);

    try {
      const requestData = mode === "structured"
        ? { type: "structured", data: formData, multiple: true, count: numberOfIdeas }
        : { type: "freeform", prompt, multiple: true, count: numberOfIdeas };

      const response = await fetch("/api/generate-idea", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const result = await response.json();

      if (result.ideas && result.ideas.length > 0) {
        setGeneratedIdeas(result.ideas);
        try {
          localStorage.setItem("generate_latest_ideas", JSON.stringify(result.ideas));
        } catch (_) {}
        try {
          // Cache generated ideas locally for detail/report pages when DB isn"t available
          const cacheObject = Object.fromEntries(
            result.ideas
              .filter(i => i && (i.id !== undefined && i.id !== null))
              .map(i => [String(i.id), i])
          );
          const existing = JSON.parse(localStorage.getItem("generated_ideas_cache") || "{}");
          localStorage.setItem(
            "generated_ideas_cache",
            JSON.stringify({ ...existing, ...cacheObject })
          );
        } catch (e) {
          console.warn("Failed to cache generated ideas locally:", e);
        }
        toast.success(`${result.ideas.length} ideas generated successfully!`);
      } else {
        throw new Error("No ideas were generated. Please try again with different parameters.");
      }

    } catch (error) {
      console.error("Error generating idea:", error);
      const errorMessage = error.message || "Failed to generate ideas. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveIdea = async (idea) => {
    if (!idea || !isSignedIn) return;

    try {
      await saveIdea(idea);
      // Optionally redirect to dashboard after saving
      // router.push("/user-dashboard");
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleSaveMultipleIdeas = async (ideas) => {
    if (!ideas || ideas.length === 0 || !isSignedIn) return;

    try {
      await saveMultipleIdeas(ideas);
      // Redirect to dashboard after saving multiple ideas
      router.push("/user-dashboard");
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />

      {/* Configuration Banner */}
      <ConfigurationBanner className="mx-4 mt-4" />

      {/* Header Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Generate Your Next Big Idea
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Use AI-powered tools to discover unique business opportunities tailored to your interests and goals.
          </p>
        </div>

        {/* Mode Selection */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-sm border border-slate-200">
            <button
              onClick={() => setMode("structured")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === "structured"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Target className="h-4 w-4 inline mr-2" />
              Structured Form
            </button>
            <button
              onClick={() => setMode("freeform")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === "freeform"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Wand2 className="h-4 w-4 inline mr-2" />
              Freeform Prompt
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Section with Full Width */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {mode === "structured" ? (
                    <>
                      <Target className="h-5 w-5 mr-2" />
                      Structured Approach
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-5 w-5 mr-2" />
                      Freeform Prompt
                    </>
                  )}
                </CardTitle>
                <CardDescription>
                  {mode === "structured" 
                    ? "Fill out the form below to generate targeted business ideas"
                    : "Describe what you\"re looking for in your own words"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {mode === "structured" ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Category *
                      </label>
                      <Select
                        value={formData.category}
                        onChange={(e) => handleInputChange("category", e.target.value)}
                      >
                        <option value="">Select a category</option>
                        {categories.map(category => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Difficulty Level *
                      </label>
                      <Select
                        value={formData.difficulty}
                        onChange={(e) => handleInputChange("difficulty", e.target.value)}
                      >
                        <option value="">Select difficulty</option>
                        {difficulties.map(diff => (
                          <option key={diff.value} value={diff.value}>
                            {diff.label}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Target Audience *
                      </label>
                      <Select
                        value={formData.targetAudience}
                        onChange={(e) => handleInputChange("targetAudience", e.target.value)}
                      >
                        <option value="">Select target audience</option>
                        {targetAudiences.map(audience => (
                          <option key={audience} value={audience}>
                            {audience}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Budget Range
                      </label>
                      <Input
                        placeholder="e.g., $1,000 - $10,000"
                        value={formData.budget}
                        onChange={(e) => handleInputChange("budget", e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Timeframe
                      </label>
                      <Input
                        placeholder="e.g., 3-6 months to launch"
                        value={formData.timeframe}
                        onChange={(e) => handleInputChange("timeframe", e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Your Interests & Skills
                      </label>
                      <Textarea
                        placeholder="Tell us about your background, interests, and skills..."
                        value={formData.interests}
                        onChange={(e) => handleInputChange("interests", e.target.value)}
                        rows={3}
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Describe Your Ideal Business Idea
                    </label>
                    <Textarea
                      placeholder="I"m looking for a business idea that involves technology and helps small businesses. I have a background in software development and want to create something that can be launched within 6 months with a budget of around $5,000..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={8}
                    />
                    <p className="text-sm text-slate-500 mt-2">
                      Be as specific as possible. Include your background, interests, budget, timeline, and any other relevant details.
                    </p>
                  </div>
                )}

                {/* Number of Ideas Options */}
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-medium text-slate-700">
                      Number of ideas to generate
                    </label>
                    <Select
                      value={numberOfIdeas.toString()}
                      onChange={(e) => setNumberOfIdeas(parseInt(e.target.value))}
                      className="w-20 text-slate-900"
                    >
                      <option value="3">3</option>
                      <option value="6">6</option>
                      <option value="9">9</option>
                      <option value="12">12</option>
                    </Select>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">
                    Generate multiple ideas to explore different possibilities and find the perfect match
                  </p>
                </div>

                <Button
                  onClick={generateIdea}
                  disabled={loading}
                  loading={loading}
                  className="w-full"
                  size="lg"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate {numberOfIdeas} Ideas
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div>
            {error && !loading && (
              <div className="mb-6">
                <ErrorMessage
                  title="Generation Error"
                  message={error}
                  onRetry={() => {
                    setError(null);
                    generateIdea();
                  }}
                />
              </div>
            )}

            {loading ? (
              <div className="flex justify-center">
                <DynamicLoader
                  type="idea"
                  estimatedTime={numberOfIdeas * 8} // 8 seconds per idea
                  className="max-w-lg"
                />
              </div>
            ) : !error && (
              <Card variant="gradient">
                <CardContent className="py-16">
                  <div className="text-center text-slate-500">
                    <Lightbulb className="h-16 w-16 mx-auto mb-6 text-slate-300" />
                    <h4 className="text-lg font-semibold text-slate-700 mb-2">Ready to Generate Ideas?</h4>
                    <p className="text-slate-600 mb-2">Your AI-powered business ideas will appear here</p>
                    <p className="text-sm text-slate-500">Fill out the form above and click "Generate Ideas" to get started</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Full-Width Generated Ideas Section */}
      {generatedIdeas.length > 0 && (
        <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header with count and actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl border border-indigo-100 mb-12">
              <div>
                <h3 className="text-3xl font-bold text-slate-900 mb-2">
                  Generated Ideas
                </h3>
                <p className="text-slate-600 text-lg">
                  {generatedIdeas.length} {generatedIdeas.length === 1 ? "idea" : "ideas"} ready for exploration
                </p>
              </div>
              <Button
                onClick={() => handleSaveMultipleIdeas(generatedIdeas)}
                disabled={savingIdeas}
                variant="outline"
                className="shadow-sm hover:shadow-md transition-all duration-200 bg-white/80 backdrop-blur-sm border-indigo-200 hover:border-indigo-300"
              >
                {savingIdeas ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save All Ideas
                  </>
                )}
              </Button>
            </div>

            {/* Enhanced Responsive Grid Layout with Error Boundary */}
            <ErrorBoundary>
              <div className="relative">
                {/*
                  Responsive Grid Layout:
                  - Mobile (default): 1 column
                  - Small (sm): 2 columns
                  - Large (lg): 3 columns
                  - Extra Large (xl): 4 columns
                  - 2XL (2xl): 5 columns

                  Uses full width container (max-w-7xl) for optimal space utilization
                  Gap increases on larger screens for better visual separation
                */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 lg:gap-10">
                  {generatedIdeas.map((idea, index) => (
                    <div
                      key={idea.id || index}
                      className="group relative"
                      style={{
                        animationDelay: `${index * 100}ms`,
                      }}
                    >
                      <IdeaCard
                        idea={idea}
                        onSave={() => handleSaveIdea(idea)}
                        saving={savingIdeas}
                      />
                    </div>
                  ))}
                </div>

                {/* Scroll indicator for overflow */}
                {generatedIdeas.length > 8 && (
                  <div className="mt-8 text-center">
                    <div className="inline-flex items-center px-4 py-2 bg-slate-100 rounded-full text-sm text-slate-600">
                      <ArrowDown className="h-4 w-4 mr-2 animate-bounce" />
                      Scroll to see more ideas
                    </div>
                  </div>
                )}
              </div>
            </ErrorBoundary>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

// IdeaCard Component for Multiple Ideas Display
// function IdeaCard({ idea, index, onSave, saving }) {
//   return (
//     <Card>
//       <CardContent className="p-6">
//         <div className="flex items-start justify-between mb-4">
//           <div className="flex-1">
//             <h4 className="text-lg font-semibold text-slate-900 mb-2">
//               {idea.title}
//             </h4>
//             <p className="text-slate-600 mb-4 line-clamp-3">
//               {idea.description}
//             </p>

//             <div className="flex flex-wrap gap-2 mb-4">
//               <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
//                 {idea.category}
//               </span>
//               <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
//                 {idea.difficulty} Difficulty
//               </span>
//               <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
//                 {idea.target_audience}
//               </span>
//             </div>

//             {idea.tags && idea.tags.length > 0 && (
//               <div className="flex flex-wrap gap-1 mb-4">
//                 {idea.tags.map((tag, tagIndex) => (
//                   <span
//                     key={tagIndex}
//                     className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded"
//                   >
//                     {tag}
//                   </span>
//                 ))}
//               </div>
//             )}
//           </div>

//           <div className="ml-4 flex flex-col gap-2">
//             <Button
//               onClick={onSave}
//               disabled={saving}
//               size="sm"
//             >
//               {saving ? "Saving..." : "Save"}
//             </Button>
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() => window.open(`/ideas/${idea.id || "preview"}`, "_blank")}
//             >
//               View Details
//             </Button>
//           </div>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }
