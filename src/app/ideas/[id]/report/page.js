'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, useParams } from 'next/navigation';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { DynamicLoader } from '@/components/ui/DynamicLoader';
import { useToast } from '@/components/ui/Toast';
import {
  FileText,
  Download,
  Share2,
  Lock,
  Unlock,
  TrendingUp,
  Target,
  DollarSign,
  Users,
  Lightbulb,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Wand2,
  Code,
  Copy,
  HeadphonesIcon,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react';
import { 
  getUserIdeaById, 
  getIdeaReport, 
  createIdeaReport,
  getUserCredits,
  updateUserCredits
} from '@/lib/userService';

const reportSections = [
  {
    id: 'business_concept',
    title: 'Business Concept',
    icon: Lightbulb,
    description: 'Elevator pitch, problem, and solution overview',
    premium: false
  },
  {
    id: 'market_intelligence',
    title: 'Market Intelligence',
    icon: BarChart3,
    description: 'Market size, trends, and competitive analysis',
    premium: true
  },
  {
    id: 'product_strategy',
    title: 'Product Strategy',
    icon: Target,
    description: 'Product roadmap, features, and development plan',
    premium: true
  },
  {
    id: 'go_to_market',
    title: 'Go-To-Market Execution',
    icon: TrendingUp,
    description: 'Marketing strategy, sales channels, and launch plan',
    premium: true
  },
  {
    id: 'financial_foundation',
    title: 'Financial Foundation',
    icon: DollarSign,
    description: 'Revenue model, cost structure, and projections',
    premium: true
  },
  {
    id: 'evaluation',
    title: 'Evaluation',
    icon: CheckCircle,
    description: 'Risk assessment, success metrics, and recommendations',
    premium: false
  },
  {
    id: 'mvp_prompt',
    title: 'Frontend MVP Builder',
    icon: Code,
    description: 'Ready-to-copy prompt for Lovable/Bolt MVP generation',
    premium: false
  }
];

export default function IdeaReportPage() {
  const { isSignedIn, user } = useUser();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  
  const [idea, setIdea] = useState(null);
  const [report, setReport] = useState(null);
  const [credits, setCredits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [activeSection, setActiveSection] = useState('business_concept');
  const [mvpPrompt, setMvpPrompt] = useState('');

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    loadReportData();
  }, [isSignedIn, router, params.id]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const [fetchedIdea, reportData, creditsData] = await Promise.all([
        getUserIdeaById(user.id, params.id),
        getIdeaReport(user.id, params.id),
        getUserCredits(user.id)
      ]);

      let ideaData = fetchedIdea;
      if (!ideaData) {
        // Fallback to localStorage cache from generate/IdeaCard
        try {
          const localCache = JSON.parse(localStorage.getItem('generated_ideas_cache') || '{}');
          ideaData = localCache[String(params.id)] || null;
        } catch (_) {}
      }

      setIdea(ideaData);
      setReport(reportData);
      setCredits(creditsData);
    } catch (error) {
      console.error('Error loading report data:', error);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!idea) {
      toast.error('No idea data available');
      return;
    }

    // Prevent duplicate requests
    if (generating) {
      console.log('Report generation already in progress');
      return;
    }

    setGenerating(true);
    const startTime = Date.now();

    try {
      console.log('[Report Generation] Starting for idea:', {
        id: params.id,
        title: idea.title,
        timestamp: new Date().toISOString()
      });

      // Create optimistic UI placeholder
      const optimisticReport = {
        business_concept: { status: 'generating...' },
        market_intelligence: { status: 'generating...' },
        product_strategy: { status: 'generating...' },
        go_to_market: { status: 'generating...' },
        financial_foundation: { status: 'generating...' },
        evaluation: { status: 'generating...' }
      };

      // Show optimistic UI immediately
      setReport({ report_data: optimisticReport, optimistic: true, generating: true });

      // Generate checksum for validation
      const ideaChecksum = `${idea.title}_${idea.description}_${Date.now()}`;
      console.log('[Report Generation] Idea checksum:', ideaChecksum);

      // Generate report using Gemini API with enhanced payload
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idea,
          ideaId: params.id,
          checksum: ideaChecksum,
          timestamp: Date.now()
        }),
      });

      const result = await response.json();
      const generationTime = Date.now() - startTime;

      console.log('[Report Generation] API Response:', {
        success: result.success,
        cached: result.cached,
        generationTime,
        checksum: result.checksum
      });

      if (!response.ok) {
        const errorMessage = result.error || `HTTP ${response.status}: Failed to generate report`;
        console.error('[Report Generation] API Error:', {
          status: response.status,
          error: errorMessage,
          generationTime
        });
        throw new Error(errorMessage);
      }

      // Validate response integrity
      if (result.idea_id && result.idea_id !== params.id) {
        console.warn('[Report Generation] ID Mismatch:', {
          expected: params.id,
          received: result.idea_id
        });
        toast.error('Report ID mismatch detected. Please try again.');
        return;
      }

      if (result.success && result.report) {
        // Save the report to database with validation
        try {
          const newReport = await createIdeaReport(user.id, params.id, result.report);
          setReport(newReport);
          console.log('[Report Generation] Report saved successfully');
        } catch (dbError) {
          console.warn('[Report Generation] Database save failed, using in-memory report:', dbError.message);
          setReport({
            report_data: result.report,
            idea_id: params.id,
            generated_at: result.generated_at
          });
        }

        // Generate MVP prompt with enhanced context
        generateMVPPrompt(idea, result.report);

        const message = result.cached ?
          `Report loaded from cache (${generationTime}ms)` :
          `Report generated successfully (${generationTime}ms)`;

        toast.success(message);
      } else {
        throw new Error('Invalid report response structure');
      }
    } catch (error) {
      const generationTime = Date.now() - startTime;
      console.error('[Report Generation] Error:', {
        message: error.message,
        generationTime,
        ideaId: params.id,
        ideaTitle: idea.title
      });

      // Clear optimistic UI
      setReport(null);

      // Provide specific error feedback
      if (error.message.includes('timeout')) {
        toast.error('Report generation timed out. Please try again.');
      } else if (error.message.includes('quota')) {
        toast.error('Service temporarily unavailable. Please try again later.');
      } else if (error.message.includes('mismatch')) {
        toast.error('Data validation failed. Please refresh and try again.');
      } else {
        toast.error(`Failed to generate report: ${error.message}`);
      }
    } finally {
      setGenerating(false);
    }
  };

  const generateMVPPrompt = (ideaData, reportData) => {
    // Extract key information from report data
    const businessConcept = reportData?.business_concept || {};
    const productStrategy = reportData?.product_strategy || {};
    const marketIntelligence = reportData?.market_intelligence || {};
    const goToMarket = reportData?.go_to_market || {};

    // Generate contextual, detailed MVP prompt
    const prompt = `You are Lovable (or Bolt). Create a modern, responsive frontend MVP for the following SaaS idea:

**Business Concept:** ${ideaData.title}
**Category:** ${ideaData.category || 'Technology'}
**Target Audience:** ${ideaData.target_audience || goToMarket.target_audience || 'General Users'}
**Difficulty Level:** ${ideaData.difficulty || 'Medium'}

**Problem Statement:** ${businessConcept.problem || `Addressing key challenges in the ${ideaData.category || 'technology'} space`}

**Solution Overview:** ${businessConcept.solution || ideaData.description}

**Core Features to Implement:**
${productStrategy.core_features ?
  productStrategy.core_features.map((feature, index) => `${index + 1}. ${feature.name}: ${feature.description}`).join('\n') :
  `1. User Authentication & Dashboard
2. Core ${ideaData.category || 'Business'} Functionality
3. Data Management & Analytics
4. User Profile & Settings`}

**Target Market:** ${marketIntelligence.target_market || `${ideaData.target_audience || 'Professionals'} looking for ${ideaData.category || 'technology'} solutions`}

**Key Value Propositions:**
${businessConcept.value_propositions ?
  businessConcept.value_propositions.map((vp, index) => `• ${vp}`).join('\n') :
  `• Streamlined ${ideaData.category || 'business'} processes
• User-friendly interface
• Scalable and reliable solution`}

**Technical Requirements:**
- Modern React/Next.js frontend
- Responsive design (mobile-first)
- Clean, professional UI/UX
- Fast loading times
- Accessibility compliance (WCAG 2.1)
- SEO optimization

**Pages/Screens to Create:**
1. Landing Page - Hero section, features, pricing, testimonials
2. Authentication - Sign up, sign in, password reset
3. Dashboard - Main user interface with key metrics
4. ${ideaData.category || 'Core'} Management - Primary functionality
5. Profile/Settings - User account management
6. Help/Support - Documentation and contact

**Design Guidelines:**
- Color Scheme: Modern, professional palette (suggest primary and secondary colors)
- Typography: Clean, readable fonts (Inter, Roboto, or similar)
- Layout: Card-based design with clear hierarchy
- Components: Consistent button styles, form inputs, navigation
- Responsive: Mobile (320px+), Tablet (768px+), Desktop (1024px+)

**User Experience Flow:**
1. User lands on homepage and understands value proposition
2. User signs up/signs in seamlessly
3. User completes onboarding process
4. User accesses main functionality through intuitive dashboard
5. User achieves their primary goal efficiently

**Success Metrics to Display:**
${goToMarket.success_metrics ?
  goToMarket.success_metrics.map(metric => `• ${metric}`).join('\n') :
  `• User engagement rate
• Task completion rate
• User satisfaction score`}

**Additional Context:**
- Industry: ${ideaData.category || 'Technology'}
- Estimated Development Time: ${ideaData.difficulty === 'easy' ? '2-4 weeks' : ideaData.difficulty === 'hard' ? '8-12 weeks' : '4-8 weeks'}
- Priority Features: Focus on core functionality first, then expand

Please create a fully functional, production-ready MVP that demonstrates the core value proposition and provides an excellent user experience. Include proper error handling, loading states, and user feedback mechanisms.`;

    setMvpPrompt(prompt);
  };

  const copyMVPPrompt = () => {
    navigator.clipboard.writeText(mvpPrompt);
    toast.success('MVP prompt copied to clipboard!');
  };

  const handleExportPDF = async () => {
    if (!report || !idea) {
      toast.error('No report data available for export');
      return;
    }

    setExporting(true);
    try {
      console.log('[PDF Export] Starting export process');

      const response = await fetch('/api/export-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ideaId: params.id,
          reportData: report.report_data,
          ideaData: idea
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to export PDF');
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${idea.title.replace(/[^a-zA-Z0-9]/g, '_')}_report.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Report exported successfully!');
    } catch (error) {
      console.error('[PDF Export] Error:', error);
      toast.error(`Failed to export PDF: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  const handleShareReport = async () => {
    if (!report || !idea) {
      toast.error('No report data available for sharing');
      return;
    }

    setSharing(true);
    try {
      console.log('[Share Report] Creating share link');

      const response = await fetch('/api/share-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ideaId: params.id,
          reportData: report.report_data,
          ideaData: idea,
          expiryDays: 30
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create share link');
      }

      if (result.success && result.shareUrl) {
        // Copy share URL to clipboard
        await navigator.clipboard.writeText(result.shareUrl);

        const message = result.fallback ?
          'Share link copied (temporary - database unavailable)' :
          'Share link copied to clipboard!';

        toast.success(message);

        console.log('[Share Report] Share link created:', result.shareUrl);
      } else {
        throw new Error('Invalid share response');
      }
    } catch (error) {
      console.error('[Share Report] Error:', error);
      toast.error(`Failed to create share link: ${error.message}`);
    } finally {
      setSharing(false);
    }
  };



  const availableCredits = credits ? credits.total_credits - credits.used_credits : 0;
  const canAccessPremium = report && report.id;

  if (!isSignedIn) {
    return <LoadingSpinner />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner />
        </div>
        <Footer />
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Idea Not Found</h1>
          <p className="text-slate-600 mb-6">The idea you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => router.push('/user-dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" onClick={() => router.push('/user-dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{idea.title}</h1>
              <p className="text-slate-600 mb-4">{idea.description}</p>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {idea.category}
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  {idea.difficulty} Difficulty
                </span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleShareReport}
                disabled={!report || sharing}
              >
                {sharing ? (
                  <>
                    <LoadingSpinner className="h-4 w-4 mr-2" />
                    Creating Link...
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleExportPDF}
                disabled={!report || exporting}
              >
                {exporting ? (
                  <>
                    <LoadingSpinner className="h-4 w-4 mr-2" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </>
                )}
              </Button>
              {!report && (
                <Button 
                  onClick={handleGenerateReport}
                  disabled={generating || availableCredits < 1}
                >
                  {generating ? (
                    <>
                      <LoadingSpinner className="h-4 w-4 mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generate Report (1 Credit)
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Credits Display */}
        <Card className="mb-8">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Available Credits: {availableCredits}</span>
              </div>
              {!canAccessPremium && (
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">Generate report to unlock premium sections</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Report Sections</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {reportSections.map(section => {
                    const Icon = section.icon;
                    const isLocked = section.premium && !canAccessPremium;
                    
                    return (
                      <button
                        key={section.id}
                        onClick={() => !isLocked && setActiveSection(section.id)}
                        className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                          activeSection === section.id
                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                            : isLocked
                            ? 'text-slate-400 cursor-not-allowed'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                        disabled={isLocked}
                      >
                        <Icon className="h-4 w-4" />
                        <div className="flex-1">
                          <div className="font-medium">{section.title}</div>
                          <div className="text-xs text-slate-500">{section.description}</div>
                        </div>
                        {isLocked && <Lock className="h-4 w-4" />}
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              <Button className="w-full" disabled={!canAccessPremium}>
                <FileText className="h-4 w-4 mr-2" />
                Generate PRD
              </Button>
              <Button variant="outline" className="w-full" disabled={!canAccessPremium}>
                <Code className="h-4 w-4 mr-2" />
                Generate MVP
              </Button>
              <Button variant="outline" className="w-full">
                <HeadphonesIcon className="h-4 w-4 mr-2" />
                Get Support
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 relative">
            {generating && !report?.report_data ? (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
                <DynamicLoader
                  type="report"
                  estimatedTime={40}
                  className="max-w-md"
                />
              </div>
            ) : null}

            <ReportSection
              section={reportSections.find(s => s.id === activeSection)}
              report={report}
              canAccessPremium={canAccessPremium}
              onGenerateReport={handleGenerateReport}
              generating={generating}
              availableCredits={availableCredits}
            />
          </div>
        </div>

        {/* MVP Prompt Section */}
        {mvpPrompt && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-indigo-600" />
                  Frontend/MVP Prompt for Lovable/Bolt
                </CardTitle>
                <CardDescription>
                  Copy this prompt and paste it into Lovable or Bolt to auto-generate a frontend MVP for this idea
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-100 rounded-lg p-4 relative">
                  <pre className="text-sm text-slate-800 whitespace-pre-wrap font-mono max-h-96 overflow-y-auto">
                    {mvpPrompt}
                  </pre>
                  <Button
                    onClick={copyMVPPrompt}
                    size="sm"
                    className="absolute top-2 right-2"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Prompt
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

// ReportSection Component
function ReportSection({ section, report, canAccessPremium, onGenerateReport, generating, availableCredits }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!section) return null;

  const isLocked = section.premium && !canAccessPremium;
  const sectionData = section.id === 'mvp_prompt' ? report?.mvp_prompt : report?.[section.id];

  if (isLocked) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Lock className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Premium Section Locked</h3>
          <p className="text-slate-600 mb-6">
            Generate a full report to unlock this premium section and get detailed insights.
          </p>
          <Button
            onClick={onGenerateReport}
            disabled={generating || availableCredits < 1}
          >
            {generating ? (
              <>
                <LoadingSpinner className="h-4 w-4 mr-2" />
                Generating Report...
              </>
            ) : (
              <>
                <Unlock className="h-4 w-4 mr-2" />
                Generate Report (1 Credit)
              </>
            )}
          </Button>
          {availableCredits < 1 && (
            <p className="text-red-600 text-sm mt-2">Insufficient credits</p>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!sectionData) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <section.icon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No Report Generated</h3>
          <p className="text-slate-600 mb-6">
            Generate a report to see detailed analysis for this section.
          </p>
          <Button
            onClick={onGenerateReport}
            disabled={generating || availableCredits < 1}
          >
            {generating ? (
              <>
                <LoadingSpinner className="h-4 w-4 mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Report (1 Credit)
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <section.icon className="h-5 w-5 text-blue-600" />
            {section.title}
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* Retry button for failed sections */}
            {!sectionData && !isLocked && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onGenerateReport?.()}
                disabled={generating}
                className="text-slate-600 hover:text-slate-800"
              >
                <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
              </Button>
            )}
            {/* Collapse/Expand button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-slate-600 hover:text-slate-800"
            >
              {isCollapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <CardDescription>{section.description}</CardDescription>
      </CardHeader>
      {!isCollapsed && (
        <CardContent className="space-y-6">
          {renderSectionContent(section.id, sectionData)}
      </CardContent>
      )}
    </Card>
  );
}

function renderSectionContent(sectionId, data) {
  switch (sectionId) {
    case 'business_concept':
      return (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Elevator Pitch</h4>
            <p className="text-slate-700">{data.elevator_pitch}</p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Problem Statement</h4>
            <p className="text-slate-700">{data.problem_statement}</p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Solution Overview</h4>
            <p className="text-slate-700">{data.solution_overview}</p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Value Proposition</h4>
            <p className="text-slate-700">{data.value_proposition}</p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Target Customers</h4>
            <p className="text-slate-700">{data.target_customers}</p>
          </div>
        </div>
      );

    case 'market_intelligence':
      return (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Market Size</h4>
            <p className="text-slate-700">{data.market_size}</p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Market Trends</h4>
            <ul className="list-disc list-inside space-y-1 text-slate-700">
              {(data.market_trends || []).map((trend, index) => (
                <li key={index}>{trend}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Competitive Landscape</h4>
            <p className="text-slate-700">{data.competitive_landscape}</p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Market Opportunity</h4>
            <p className="text-slate-700">{data.market_opportunity}</p>
          </div>
        </div>
      );

    case 'product_strategy':
      return (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Core Features</h4>
            <ul className="list-disc list-inside space-y-1 text-slate-700">
              {(data.core_features || []).map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Development Roadmap</h4>
            <p className="text-slate-700">{data.development_roadmap}</p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Technology Requirements</h4>
            <p className="text-slate-700">{data.technology_requirements}</p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">MVP Scope</h4>
            <p className="text-slate-700">{data.mvp_scope}</p>
          </div>
        </div>
      );

    case 'go_to_market':
      return (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Target Audience</h4>
            <p className="text-slate-700">{data.target_audience}</p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Marketing Strategy</h4>
            <p className="text-slate-700">{data.marketing_strategy}</p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Pricing Model</h4>
            <p className="text-slate-700">{data.pricing_model}</p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Launch Plan</h4>
            <p className="text-slate-700">{data.launch_plan}</p>
          </div>
        </div>
      );

    case 'financial_foundation':
      return (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Startup Costs</h4>
            <p className="text-slate-700">{data.startup_costs}</p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Revenue Projections</h4>
            <p className="text-slate-700">{data.revenue_projections}</p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Cost Structure</h4>
            <p className="text-slate-700">{data.cost_structure}</p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Funding Strategy</h4>
            <p className="text-slate-700">{data.funding_strategy}</p>
          </div>
        </div>
      );

    case 'evaluation':
      return (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Strengths</h4>
            <ul className="list-disc list-inside space-y-1 text-slate-700">
              {(data.strengths || []).map((strength, index) => (
                <li key={index}>{strength}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Risks</h4>
            <ul className="list-disc list-inside space-y-1 text-slate-700">
              {(data.risks || []).map((risk, index) => (
                <li key={index}>{risk}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Success Metrics</h4>
            <ul className="list-disc list-inside space-y-1 text-slate-700">
              {(data.success_metrics || []).map((metric, index) => (
                <li key={index}>{metric}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Recommendations</h4>
            <ul className="list-disc list-inside space-y-1 text-slate-700">
              {(data.recommendations || []).map((recommendation, index) => (
                <li key={index}>{recommendation}</li>
              ))}
            </ul>
          </div>
        </div>
      );

    case 'mvp_prompt':
      return (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Code className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Lovable/Bolt MVP Prompt</h4>
                <p className="text-sm text-slate-600">Ready-to-copy prompt for instant frontend generation</p>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-4 mb-4">
              <pre className="whitespace-pre-wrap text-sm text-slate-700 font-mono leading-relaxed">
                {data || 'MVP prompt will be generated with the business report...'}
              </pre>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(data || '');
                  // You can add toast notification here
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={!data}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Prompt
              </Button>

              <Button
                onClick={() => window.open('https://lovable.dev', '_blank')}
                variant="outline"
                className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Lovable
              </Button>

              <Button
                onClick={() => window.open('https://bolt.new', '_blank')}
                variant="outline"
                className="border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Bolt
              </Button>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <h5 className="font-medium text-slate-900 mb-2">How to Use This Prompt:</h5>
            <ol className="list-decimal list-inside space-y-1 text-sm text-slate-600">
              <li>Copy the prompt above using the "Copy Prompt" button</li>
              <li>Open Lovable.dev or Bolt.new in a new tab</li>
              <li>Paste the prompt into the AI interface</li>
              <li>Let the AI generate your MVP frontend code</li>
              <li>Customize and deploy your application</li>
            </ol>
          </div>
        </div>
      );

    default:
      return <p className="text-slate-600">Content not available</p>;
  }
}
