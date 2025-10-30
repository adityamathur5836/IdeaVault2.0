'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ErrorMessage } from '@/components/ui/ErrorBoundary';
import { useToast } from '@/components/ui/Toast';
import { isSupabaseConfigured, getSupabaseConfigError } from '@/lib/supabase';
import {
  getDifficultyVariant,
  getCategoryVariant,
  getSourceVariant,
  getSourceText,
  getSourceIcon
} from '@/lib/badgeUtils';
import {
  Target,
  TrendingUp,
  Users,
  Clock,
  FileText,
  Save,
  Lock,
  Sparkles,
  Database,
  Zap,
  ArrowRight
} from 'lucide-react';

export function IdeaCard({ idea, onSave, saving = false, showSaveButton = true }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [error, setError] = useState(null);

  const handleViewReport = async () => {
    if (!idea) return;

    try {
      setIsGeneratingReport(true);
      setError(null);

      // Simply navigate to report; detail/report pages now handle cache fallbacks
      const ideaId = idea.id;
      // Ensure the idea is available in local cache for the report page
      try {
        const existing = JSON.parse(localStorage.getItem('generated_ideas_cache') || '{}');
        if (!existing[String(ideaId)]) {
          localStorage.setItem('generated_ideas_cache', JSON.stringify({ ...existing, [String(ideaId)]: idea }));
        }
      } catch (_) {}
      router.push(`/ideas/${ideaId}/report`);
    } catch (err) {
      const errorMsg = 'Failed to prepare idea for report generation. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('Report preparation error:', err);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const getSourceBadge = (source) => {
    const variant = getSourceVariant(source);
    const text = getSourceText(source);
    const IconComponent = getSourceIcon(source) === 'Sparkles' ? Sparkles : Database;

    return (
      <Badge variant={variant} size="sm" className="shadow-sm">
        <IconComponent className="h-3 w-3 mr-1.5" />
        {text}
      </Badge>
    );
  };

  if (error) {
    const isConfigError = error.includes('Database Configuration') || error.includes('environment variables');

    return (
      <Card className={`h-full ${isConfigError ? 'border-amber-200 bg-amber-50' : 'border-red-200 bg-red-50'}`}>
        <CardContent className="p-6">
          <ErrorMessage
            title={isConfigError ? "Configuration Required" : "Card Error"}
            message={error}
            onRetry={() => setError(null)}
          />
          {isConfigError && (
            <div className="mt-4 p-3 bg-amber-100 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-800">
                <strong>Setup Required:</strong> Please configure your Supabase environment variables to use this feature.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group h-full hover:shadow-2xl hover:shadow-indigo-200/30 transition-all duration-500 hover:-translate-y-2 border-slate-200/60 bg-white/90 backdrop-blur-sm overflow-hidden relative">
      {/* Gradient overlay for premium feel */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-indigo-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Header with Source Badge */}
      <CardHeader className="pb-4 space-y-4 relative z-10">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-xl font-bold text-slate-900 line-clamp-2 leading-tight group-hover:text-indigo-900 transition-colors duration-300">
            {idea.title}
          </CardTitle>
          {idea.source && getSourceBadge(idea.source)}
        </div>
      </CardHeader>

      <CardContent className="space-y-6 relative z-10">
        {/* Enhanced Description */}
        <div className="relative">
          <p className="text-slate-700 text-sm leading-relaxed line-clamp-3 font-medium group-hover:text-slate-800 transition-colors duration-300">
            {idea.description}
          </p>
          <div className="absolute bottom-0 right-0 w-8 h-6 bg-gradient-to-l from-white/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Enhanced Metadata Grid with Modern Design */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-3 border border-indigo-100/60 hover:border-indigo-200/80 transition-all duration-300 group-hover:shadow-sm">
            <div className="flex items-center text-xs font-semibold text-indigo-700 mb-2">
              <Target className="h-3.5 w-3.5 mr-1.5 text-indigo-500" />
              Category
            </div>
            <Badge variant={getCategoryVariant(idea.category)} size="xs" className="font-medium shadow-sm">
              {idea.category}
            </Badge>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-3 border border-emerald-100/60 hover:border-emerald-200/80 transition-all duration-300 group-hover:shadow-sm">
            <div className="flex items-center text-xs font-semibold text-emerald-700 mb-2">
              <TrendingUp className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
              Difficulty
            </div>
            <Badge variant={getDifficultyVariant(idea.difficulty)} size="xs" className="font-medium shadow-sm">
              {idea.difficulty}
            </Badge>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-3 border border-amber-100/60 hover:border-amber-200/80 transition-all duration-300 group-hover:shadow-sm">
            <div className="flex items-center text-xs font-semibold text-amber-700 mb-2">
              <Users className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
              Audience
            </div>
            <div className="text-sm text-amber-900 truncate font-medium">{idea.target_audience}</div>
          </div>

          <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-3 border border-rose-100/60 hover:border-rose-200/80 transition-all duration-300 group-hover:shadow-sm">
            <div className="flex items-center text-xs font-semibold text-rose-700 mb-2">
              <Clock className="h-3.5 w-3.5 mr-1.5 text-rose-500" />
              {idea.upvotes ? 'Upvotes' : 'Generated'}
            </div>
            <div className="text-sm text-rose-900 font-medium">
              {idea.upvotes ? `${idea.upvotes} votes` : 'Just now'}
            </div>
          </div>
        </div>

        {/* Key Innovation Section */}
        {idea.key_innovation && (
          <div className="space-y-2 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-100">
            <div className="flex items-center text-xs font-semibold text-purple-700 uppercase tracking-wide">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Key Innovation
            </div>
            <p className="text-sm text-purple-900 font-medium leading-relaxed">
              {idea.key_innovation}
            </p>
          </div>
        )}

        {/* Market Potential Section */}
        {idea.market_potential && (
          <div className="space-y-2 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
            <div className="flex items-center text-xs font-semibold text-green-700 uppercase tracking-wide">
              <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
              Market Potential
            </div>
            <p className="text-sm text-green-900 font-medium leading-relaxed">
              {idea.market_potential}
            </p>
          </div>
        )}

        {/* Enhanced Tags Section */}
        {idea.tags && idea.tags.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Tags</div>
            <div className="flex flex-wrap gap-2">
              {idea.tags.slice(0, 4).map((tag, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  size="xs"
                  className="bg-white/80 hover:bg-slate-50 border-slate-300/60 text-slate-700 font-medium"
                  interactive
                >
                  {tag}
                </Badge>
              ))}
              {idea.tags.length > 4 && (
                <Badge
                  variant="default"
                  size="xs"
                  className="bg-slate-200/80 text-slate-600 font-medium"
                >
                  +{idea.tags.length - 4} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Enhanced Action Buttons with Modern Design */}
        <div className="flex gap-3 pt-6 border-t border-gradient-to-r from-slate-200/30 via-indigo-200/30 to-slate-200/30">
          <Button
            onClick={handleViewReport}
            disabled={isGeneratingReport}
            className="flex-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-800 text-white font-semibold shadow-lg hover:shadow-2xl transition-all duration-300 group relative overflow-hidden"
            size="sm"
          >
            {/* Button shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

            <FileText className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200 relative z-10" />
            {isGeneratingReport ? (
              <>
                <Zap className="h-4 w-4 mr-2 animate-pulse relative z-10" />
                <span className="relative z-10">Generating...</span>
              </>
            ) : (
              <>
                <span className="relative z-10">View Report</span>
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-200 relative z-10" />
              </>
            )}
          </Button>

          {showSaveButton && (
            <Button
              onClick={() => onSave?.(idea)}
              disabled={saving}
              variant="outline"
              size="sm"
              className="px-4 border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-300 group relative overflow-hidden bg-white/80 backdrop-blur-sm"
            >
              {/* Save button hover effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Save className={`h-4 w-4 relative z-10 ${saving ? 'animate-pulse text-indigo-600' : 'group-hover:scale-110 text-indigo-600'} transition-all duration-200`} />
            </Button>
          )}
        </div>

        {/* Enhanced Premium/Lock indicator */}
        {idea.isPremium && (
          <div className="flex items-center justify-center p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200/60 shadow-sm">
            <Lock className="h-4 w-4 mr-2 text-amber-600" />
            <span className="text-sm text-amber-800 font-medium">Premium feature - Upgrade to unlock</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default IdeaCard;
