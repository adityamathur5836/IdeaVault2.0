import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  Lightbulb,
  Search,
  BarChart3,
  Users,
  Zap,
  Shield,
  Target,
  ArrowRight,
  CheckCircle
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold text-slate-900 tracking-tight">
              Discover Your Next
              <span className="block text-slate-600">Business Breakthrough</span>
            </h1>
            <p className="mt-6 text-xl text-slate-600 max-w-3xl mx-auto">
              Leverage AI-powered insights to discover, validate, and develop business ideas
              with data-driven recommendations and community feedback.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sign-up">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Discovering Ideas
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/explore">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Explore Ideas
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900">
              Everything You Need to Succeed
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Professional tools for serious entrepreneurs
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="flex justify-center">
                <div className="p-3 bg-slate-900 rounded-lg">
                  <Lightbulb className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                AI-Powered Generation
              </h3>
              <p className="mt-2 text-slate-600">
                Generate unique business ideas using advanced AI algorithms and market data.
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center">
                <div className="p-3 bg-slate-900 rounded-lg">
                  <Search className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                Smart Discovery
              </h3>
              <p className="mt-2 text-slate-600">
                Search through 140,000+ curated business ideas with intelligent matching.
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center">
                <div className="p-3 bg-slate-900 rounded-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                Community Validation
              </h3>
              <p className="mt-2 text-slate-600">
                Get feedback and validation from a community of entrepreneurs and experts.
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center">
                <div className="p-3 bg-slate-900 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                Execution Planning
              </h3>
              <p className="mt-2 text-slate-600">
                Transform ideas into actionable roadmaps with detailed execution plans.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900">
              How IdeaVault Works
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              From idea discovery to execution in three simple steps
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex justify-center">
                <div className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center text-xl font-bold">
                  1
                </div>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-slate-900">
                Discover & Generate
              </h3>
              <p className="mt-2 text-slate-600">
                Use our AI-powered tools to discover existing ideas or generate new ones based on your interests and market trends.
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center">
                <div className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center text-xl font-bold">
                  2
                </div>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-slate-900">
                Validate & Refine
              </h3>
              <p className="mt-2 text-slate-600">
                Get feedback from our community of entrepreneurs and experts to validate and refine your business concepts.
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center">
                <div className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center text-xl font-bold">
                  3
                </div>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-slate-900">
                Plan & Execute
              </h3>
              <p className="mt-2 text-slate-600">
                Transform validated ideas into detailed execution plans with actionable steps and milestones.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-white">140,000+</div>
              <div className="mt-2 text-slate-300">Curated Business Ideas</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white">50,000+</div>
              <div className="mt-2 text-slate-300">Active Entrepreneurs</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white">95%</div>
              <div className="mt-2 text-slate-300">User Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900">
            Ready to Discover Your Next Big Idea?
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Join thousands of entrepreneurs who trust IdeaVault to discover, validate, and develop their business ideas.
          </p>
          <div className="mt-8">
            <Link href="/sign-up">
              <Button size="lg">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
