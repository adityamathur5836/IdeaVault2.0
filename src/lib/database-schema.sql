-- Database schema for new IdeaVault features
-- This should be executed in Supabase_b (user data database)

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  interests TEXT, -- comma-separated string
  experience_level TEXT CHECK (experience_level IN ('Beginner', 'Intermediate', 'Expert')),
  time_commitment TEXT CHECK (time_commitment IN ('Part-time', 'Full-time')),
  capital_available DECIMAL(15,2),
  preferred_ai_role TEXT,
  target_audience JSONB, -- array of selected audiences
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User ideas table (enhanced)
CREATE TABLE IF NOT EXISTS user_ideas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  difficulty TEXT,
  target_audience TEXT,
  tags JSONB,
  status TEXT DEFAULT 'saved', -- saved, in_progress, completed, archived
  is_generated BOOLEAN DEFAULT false,
  source_data JSONB, -- original data from generation or Product Hunt
  report_unlocked BOOLEAN DEFAULT false,
  credits_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Milestones table
CREATE TABLE IF NOT EXISTS milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  idea_id UUID REFERENCES user_ideas(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  due_date DATE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User credits table
CREATE TABLE IF NOT EXISTS user_credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  total_credits INTEGER DEFAULT 10, -- starting credits
  used_credits INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Idea reports table
CREATE TABLE IF NOT EXISTS idea_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID REFERENCES user_ideas(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  business_concept JSONB,
  market_intelligence JSONB,
  product_strategy JSONB,
  go_to_market JSONB,
  financial_foundation JSONB,
  evaluation JSONB,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ideas_user_id ON user_ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ideas_status ON user_ideas(status);
CREATE INDEX IF NOT EXISTS idx_milestones_user_id ON milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_idea_id ON milestones(idea_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON milestones(status);
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_idea_reports_idea_id ON idea_reports(idea_id);
CREATE INDEX IF NOT EXISTS idx_idea_reports_user_id ON idea_reports(user_id);

-- RLS (Row Level Security) policies
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_reports ENABLE ROW LEVEL SECURITY;

-- Policies for user_preferences
CREATE POLICY "Users can view own preferences" ON user_preferences FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert own preferences" ON user_preferences FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own preferences" ON user_preferences FOR UPDATE USING (auth.uid()::text = user_id);

-- Policies for user_ideas
CREATE POLICY "Users can view own ideas" ON user_ideas FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert own ideas" ON user_ideas FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own ideas" ON user_ideas FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "Users can delete own ideas" ON user_ideas FOR DELETE USING (auth.uid()::text = user_id);

-- Policies for milestones
CREATE POLICY "Users can view own milestones" ON milestones FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert own milestones" ON milestones FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own milestones" ON milestones FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "Users can delete own milestones" ON milestones FOR DELETE USING (auth.uid()::text = user_id);

-- Policies for user_credits
CREATE POLICY "Users can view own credits" ON user_credits FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert own credits" ON user_credits FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own credits" ON user_credits FOR UPDATE USING (auth.uid()::text = user_id);

-- Policies for idea_reports
CREATE POLICY "Users can view own reports" ON idea_reports FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert own reports" ON idea_reports FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own reports" ON idea_reports FOR UPDATE USING (auth.uid()::text = user_id);

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_ideas_updated_at BEFORE UPDATE ON user_ideas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON milestones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_credits_updated_at BEFORE UPDATE ON user_credits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_idea_reports_updated_at BEFORE UPDATE ON idea_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
