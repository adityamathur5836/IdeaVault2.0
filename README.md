# IdeaVault 2.0

An AI-powered business ideation platform that helps entrepreneurs discover, validate, and develop business ideas with comprehensive insights and automated MVP generation.

## 🚀 Features

- **AI-Powered Idea Generation**: Generate multiple business ideas using Google Gemini AI
- **Comprehensive Business Reports**: Detailed PRD-style reports with market analysis, financial projections, and go-to-market strategies
- **MVP Prompt Generation**: Ready-to-copy prompts for Lovable/Bolt instant frontend generation
- **Dual Database Architecture**: 140k+ curated business ideas + user data management
- **Modern UI/UX**: Responsive design with gradient styling and interactive components
- **Robust Error Handling**: Comprehensive error boundaries and configuration validation
- **Authentication**: Secure user management with Clerk
- **Vector Search**: Semantic similarity search using pgvector

## ✨ Recent Improvements (v2.1)

### 🎨 Enhanced Grid Layout & Visual Design
- **Responsive Grid System**: 5-tier responsive breakpoints (1/2/3/4/5 columns) for optimal space utilization
- **Full-Width Ideas Display**: Ideas now appear in a dedicated full-width section below the form
- **Modern Card Design**: Enhanced IdeaCard components with gradient overlays, colorful metadata sections, and improved hover effects
- **Professional Typography**: Clear hierarchy with improved readability and visual structure

### 🔧 Improved Error Handling & User Experience
- **Toast Notifications**: Comprehensive error handling with user-friendly notifications throughout the app
- **Configuration Validation**: Automatic environment variable validation with client/server separation
- **Graceful Degradation**: Better handling of missing configurations and API failures
- **Retry Functionality**: User-friendly retry options for failed operations

### 📱 Responsive Design Enhancements
- **Mobile-First Approach**: Optimized layouts for all screen sizes
- **Staggered Animations**: Smooth card appearance with staggered animation delays
- **Hover Effects**: Enhanced interactive elements with professional hover states
- **Visual Feedback**: Clear loading states and progress indicators

### 🛡️ Robust Architecture
- **Environment Separation**: Client-side and server-side environment variable validation
- **Error Boundaries**: Comprehensive error catching and user-friendly error displays
- **Code Documentation**: Extensive inline comments and architectural documentation

## 🛠️ Tech Stack

- **Frontend**: Next.js 15.5.4, React, Tailwind CSS
- **Authentication**: Clerk
- **Database**: Supabase (dual setup with pgvector)
- **AI**: Google Gemini API (embedding-001, gemini-1.5-flash, gemini-1.5-pro)
- **Deployment**: Vercel-ready

## 📋 Prerequisites

Before setting up the project, ensure you have:

- Node.js 18+ installed
- npm, yarn, or pnpm package manager
- Accounts for required services (see Environment Setup)

## ⚙️ Environment Setup

**Important**: This application requires proper environment configuration to function.

1. Copy the environment template:
   ```bash
   cp .env.example .env.local
   ```

2. Follow the comprehensive setup guide: **[ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)**

3. Required services:
   - **Clerk** (Authentication)
   - **Supabase** (Dual database setup)
   - **Google Gemini** (AI services)

## 🚀 Getting Started

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd IdeaVault2.0
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables** (see [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md))

4. **Run the development server**:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser** and navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── generate/          # Idea generation page
│   ├── ideas/[id]/        # Individual idea pages
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/                # Reusable UI components
│   └── layout/            # Layout components
├── lib/                   # Utility libraries
│   ├── geminiService.js   # Google Gemini integration
│   ├── supabase.js        # Supabase configuration
│   └── envValidator.js    # Environment validation
└── hooks/                 # Custom React hooks
```

## 🎯 Key Features Explained

### Idea Generation
- **Structured Approach**: Form-based idea generation with category, difficulty, and audience selection
- **Multiple Ideas**: Generate 3-12 ideas at once with responsive grid layout
- **AI-Powered**: Uses Google Gemini for intelligent idea synthesis from 140k+ business ideas

### Business Reports
- **Comprehensive Analysis**: 7-section reports including business concept, market intelligence, product strategy
- **MVP Prompt Generation**: Automated prompts for Lovable/Bolt frontend generation
- **Collapsible Sections**: Modern UI with expandable/collapsible report sections
- **Export Ready**: Professional formatting suitable for business presentations

### Error Handling & UX
- **Configuration Validation**: Automatic environment variable validation with user-friendly error messages
- **Error Boundaries**: Comprehensive error catching with recovery options
- **Loading States**: Smooth loading animations and progress indicators
- **Responsive Design**: Mobile-first design that works on all devices

## 🔧 Configuration Features

### Environment Validation
The application includes built-in validation for all required environment variables:
- Automatic validation on startup
- Configuration banner for missing variables
- Graceful error handling with actionable messages
- Development console logging for debugging

### Database Architecture
- **Supabase A**: Read-only database with 140k+ curated business ideas
- **Supabase B**: User data management (ideas, reports, milestones)
- **Vector Search**: pgvector extension for semantic similarity search
- **Row Level Security**: Proper data isolation and security

## 🎨 Responsive Grid Layout

The application features a sophisticated 5-tier responsive grid system for optimal idea display:

### Breakpoint Configuration
```css
/* Mobile (default): 1 column */
grid-cols-1

/* Small screens (640px+): 2 columns */
sm:grid-cols-2

/* Large screens (1024px+): 3 columns */
lg:grid-cols-3

/* Extra Large (1280px+): 4 columns */
xl:grid-cols-4

/* 2XL screens (1536px+): 5 columns */
2xl:grid-cols-5
```

### Layout Structure
- **Header Section**: Constrained to `max-w-4xl` for optimal readability
- **Form Section**: 2-column layout on large screens (`lg:grid-cols-2`)
- **Ideas Grid**: Full-width container (`max-w-7xl`) for maximum space utilization
- **Gap Spacing**: Responsive gaps (`gap-6 lg:gap-8`) that increase on larger screens

### Visual Enhancements
- **Staggered Animations**: Cards appear with 100ms delays for smooth loading
- **Hover Effects**: Elevation and color transitions on card hover
- **Gradient Overlays**: Subtle gradients that appear on hover for premium feel
- **Scroll Indicators**: Visual cues when more content is available

## 🛡️ Error Handling Patterns

### Toast Notification System
```javascript
// Success notifications
toast.success(`${result.ideas.length} ideas generated successfully!`);

// Error notifications with retry
toast.error('Database configuration required. Please check your environment setup.');

// Validation errors
toast.error('Please fill in: category, difficulty, targetAudience');
```

### Environment Validation
- **Client-Side Validation**: Checks `NEXT_PUBLIC_*` variables in browser
- **Server-Side Validation**: Validates server-only variables during SSR
- **Configuration Banner**: User-friendly display of missing configurations
- **Graceful Degradation**: Features disable gracefully when dependencies are missing

### Error Boundaries
- **Component-Level**: Individual components handle their own errors
- **Page-Level**: Comprehensive error catching for entire pages
- **Global-Level**: Application-wide error handling with user-friendly messages

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
- **Netlify**: Configure environment variables in site settings
- **Railway**: Set variables in project dashboard
- **Docker**: Use docker-compose.yml with environment files

### Environment Variables for Production
Ensure all environment variables are properly configured:
- Use production URLs for Supabase and Clerk
- Use production API keys for Google Gemini
- Set NEXT_PUBLIC_APP_URL to your production domain

## 📚 Documentation

- **[Environment Setup Guide](./ENVIRONMENT_SETUP.md)** - Comprehensive setup instructions
- **[API Documentation](./docs/api.md)** - API endpoints and usage
- **[Component Documentation](./docs/components.md)** - UI component library
- **[Deployment Guide](./docs/deployment.md)** - Production deployment instructions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter issues:

1. Check the configuration banner in the application
2. Review the [Environment Setup Guide](./ENVIRONMENT_SETUP.md)
3. Check browser console for detailed error messages
4. Open an issue with specific error details

## 🙏 Acknowledgments

- **Google Gemini** for AI capabilities
- **Supabase** for database infrastructure
- **Clerk** for authentication services
- **Next.js** for the amazing framework
- **Tailwind CSS** for styling utilities
