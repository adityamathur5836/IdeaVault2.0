'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, useParams } from 'next/navigation';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
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
      const [ideaData, reportData, creditsData] = await Promise.all([
        getUserIdeaById(user.id, params.id),
        getIdeaReport(user.id, params.id),
        getUserCredits(user.id)
      ]);
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
    try {
      setGenerating(true);

      // Generate report using Gemini API
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idea }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.error || `HTTP ${response.status}: Failed to generate report`;
        throw new Error(errorMessage);
      }

      if (result.success && result.report) {
        // Save the report to database
        const newReport = await createIdeaReport(user.id, params.id, result.report);
        setReport(newReport);

        // Generate MVP prompt
        generateMVPPrompt(idea, result.report);

        toast.success('Report generated successfully');
      } else {
        throw new Error('Invalid report response');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const generateMVPPrompt = (ideaData, reportData) => {
    const prompt = `You are Lovable (or Bolt). Create a modern, responsive frontend MVP for the following SaaS idea:

**Business Concept:** ${ideaData.title}
${ideaData.description}

**Target Audience:** ${ideaData.target_audience}
**Category:** ${ideaData.category}

**Key Features to Implement:**
${reportData?.product_strategy?.core_features?.slice(0, 5).map(feature => `- ${feature}`).join('\n') || '- User dashboard\n- Core functionality\n- User authentication\n- Basic settings'}

**Technical Requirements:**
- Modern React/Next.js application
- Responsive design for mobile and desktop
- Clean, professional UI with good UX
- Authentication system
- Dashboard with key metrics
- ${ideaData.category?.toLowerCase()} focused interface

**Design Guidelines:**
- Use a modern color scheme appropriate for ${ideaData.target_audience?.toLowerCase()}
- Include proper loading states and error handling
- Implement accessibility best practices
- Create an intuitive navigation structure

Please create a fully functional MVP that demonstrates the core value proposition of this ${ideaData.category?.toLowerCase()} solution.`;

    setMvpPrompt(prompt);
  };

  const copyMVPPrompt = () => {
    navigator.clipboard.writeText(mvpPrompt);
    toast.success('MVP prompt copied to clipboard!');
  };

  const generateMockReport = (idea) => {
    return {
      business_concept: {
        elevator_pitch: `${idea.title} is an innovative solution that addresses the growing need for ${idea.category.toLowerCase()} solutions in today's market.`,
        problem_statement: `Current solutions in the ${idea.category.toLowerCase()} space are fragmented and don't adequately serve the target market's needs.`,
        solution_overview: idea.description,
        value_proposition: `Our unique approach combines cutting-edge technology with user-centric design to deliver unprecedented value.`,
        target_customers: idea.target_audience || 'Small to medium businesses and individual consumers'
      },
      market_intelligence: {
        market_size: `The ${idea.category.toLowerCase()} market is valued at $2.5B and growing at 15% annually.`,
        market_trends: [
          'Increasing digital adoption',
          'Growing demand for automation',
          'Focus on user experience',
          'Sustainability concerns'
        ],
        competitive_landscape: 'The market has several established players but lacks innovation in key areas.',
        market_opportunity: 'Significant opportunity exists for disruptive solutions that address current pain points.'
      },
      product_strategy: {
        core_features: [
          'Intuitive user interface',
          'Advanced analytics',
          'Mobile-first design',
          'Integration capabilities',
          'Scalable architecture'
        ],
        development_roadmap: {
          'Phase 1 (0-6 months)': 'MVP development and initial testing',
          'Phase 2 (6-12 months)': 'Feature expansion and user acquisition',
          'Phase 3 (12-18 months)': 'Scale and optimization'
        },
        technology_stack: 'Modern web technologies with cloud-native architecture'
      },
      go_to_market: {
        marketing_strategy: 'Multi-channel approach focusing on digital marketing and strategic partnerships',
        sales_channels: ['Direct sales', 'Online marketplace', 'Partner network'],
        pricing_model: 'Freemium with premium tiers for advanced features',
        launch_plan: 'Soft launch with beta users followed by public release'
      },
      financial_foundation: {
        revenue_model: 'Subscription-based with transaction fees',
        cost_structure: {
          'Development': '40%',
          'Marketing': '30%',
          'Operations': '20%',
          'Other': '10%'
        },
        funding_requirements: '$500K for initial 18 months',
        financial_projections: {
          'Year 1': '$100K revenue',
          'Year 2': '$500K revenue',
          'Year 3': '$1.5M revenue'
        }
      },
      evaluation: {
        strengths: [
          'Strong market demand',
          'Innovative approach',
          'Scalable business model',
          'Experienced team potential'
        ],
        risks: [
          'Market competition',
          'Technology challenges',
          'Regulatory changes',
          'Funding requirements'
        ],
        success_metrics: [
          'User acquisition rate',
          'Revenue growth',
          'Customer satisfaction',
          'Market share'
        ],
        recommendations: [
          'Focus on MVP development',
          'Build strategic partnerships',
          'Invest in user research',
          'Secure initial funding'
        ]
      }
    };
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
              <Button variant="outline">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
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
          <div className="lg:col-span-3">
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
