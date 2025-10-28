import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Sparkles, 
  Zap, 
  Shield, 
  BarChart3, 
  Camera, 
  Wallet, 
  TrendingUp,
  Github,
  Star,
  Code2,
  Smartphone,
  Brain,
  Eye,
  CheckCircle2,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import LogoLoop from '@/components/ui/LogoLoop';
import { 
  SiReact, 
  SiTypescript, 
  SiTailwindcss, 
  SiSupabase, 
  SiReactquery, 
  SiOpenai,
  SiVite,
  SiPostgresql
} from 'react-icons/si';

const Landing = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Handle scroll for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered OCR',
      description: 'Snap a receipt, let AI extract everything. Powered by Mistral & GPT-4.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Zap,
      title: 'Real-Time Sync',
      description: 'All your devices stay in sync instantly with Supabase real-time.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: BarChart3,
      title: 'Smart Analytics',
      description: 'Beautiful charts and insights to understand your spending patterns.',
      color: 'from-emerald-500 to-teal-500'
    },
    {
      icon: Wallet,
      title: 'Budget Tracking',
      description: 'Set budgets by category with smart alerts when you overspend.',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: Shield,
      title: 'Bank-Level Security',
      description: 'Your data is encrypted and protected with Row Level Security.',
      color: 'from-indigo-500 to-purple-500'
    },
    {
      icon: Smartphone,
      title: 'Web-Based, Always Updated',
      description: 'No app to download. Works on any device with a browser. Always current.',
      color: 'from-pink-500 to-rose-500'
    }
  ];

  const techLogos = [
    { 
      node: <SiReact className="text-[#61DAFB]" />, 
      title: "React 18", 
      href: "https://react.dev" 
    },
    { 
      node: <SiTypescript className="text-[#3178C6]" />, 
      title: "TypeScript", 
      href: "https://www.typescriptlang.org" 
    },
    { 
      node: <SiSupabase className="text-[#3ECF8E]" />, 
      title: "Supabase", 
      href: "https://supabase.com" 
    },
    { 
      node: <SiTailwindcss className="text-[#06B6D4]" />, 
      title: "Tailwind CSS", 
      href: "https://tailwindcss.com" 
    },
    { 
      node: <SiReactquery className="text-[#FF4154]" />, 
      title: "React Query", 
      href: "https://tanstack.com/query" 
    },
    { 
      node: <SiVite className="text-[#646CFF]" />, 
      title: "Vite", 
      href: "https://vitejs.dev" 
    },
    { 
      node: <SiPostgresql className="text-[#336791]" />, 
      title: "PostgreSQL", 
      href: "https://postgresql.org" 
    },
    { 
      node: <SiOpenai className="text-[#412991]" />, 
      title: "OpenAI", 
      href: "https://openai.com" 
    },
    { 
      src: "/logos/Mistral_AI_logo_(2025–).svg.png", 
      alt: "Mistral AI", 
      title: "Mistral AI",
      href: "https://mistral.ai" 
    },
    { 
      src: "/logos/openrouter.svg", 
      alt: "OpenRouter", 
      title: "OpenRouter",
      href: "https://openrouter.ai" 
    }
  ];

  const stats = [
    { value: '<500kb', label: 'Bundle Size' },
    { value: '100%', label: 'Type Safe' },
    { value: '10ms', label: 'Response Time' },
    { value: '99.9%', label: 'Uptime' },
  ];

  const howItWorks = [
    {
      step: '01',
      title: 'Snap a Receipt',
      description: 'Take a photo of any receipt or upload a PDF invoice. Works with any document.',
      icon: Camera
    },
    {
      step: '02',
      title: 'AI Extracts Data',
      description: 'Our AI reads the receipt and extracts vendor, amount, date, and suggests categories.',
      icon: Brain
    },
    {
      step: '03',
      title: 'Track & Analyze',
      description: 'View insights, set budgets, and stay on top of your finances across all devices.',
      icon: TrendingUp
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled 
          ? "bg-background/80 backdrop-blur-xl border-b shadow-sm" 
          : "bg-transparent"
      )}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-primary text-primary-foreground rounded-xl w-10 h-10 flex items-center justify-center font-bold text-lg shadow-lg group-hover:scale-110 transition-transform">
                F
              </div>
              <span className="font-bold text-xl sm:text-2xl bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Finance Zen
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
                How It Works
              </a>
              <a href="#tech" className="text-sm font-medium hover:text-primary transition-colors">
                Tech Stack
              </a>
              <a 
                href="https://github.com/your-username/tracker-zenith" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"
              >
                <Github className="w-4 h-4" />
                GitHub
              </a>
              <ThemeToggle />
              {isAuthenticated ? (
                <Link to="/dashboard">
                  <Button size="sm" className="bg-primary hover:bg-primary/90 shadow-lg">
                    Dashboard
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" size="sm">
                      Log In
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button size="sm" className="bg-primary hover:bg-primary/90 shadow-lg">
                      Get Started
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center gap-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t animate-fade-in">
              <div className="flex flex-col gap-3">
                <a href="#features" className="px-4 py-2 hover:bg-muted rounded-lg transition-colors">
                  Features
                </a>
                <a href="#how-it-works" className="px-4 py-2 hover:bg-muted rounded-lg transition-colors">
                  How It Works
                </a>
                <a href="#tech" className="px-4 py-2 hover:bg-muted rounded-lg transition-colors">
                  Tech Stack
                </a>
                <a 
                  href="https://github.com/your-username/tracker-zenith" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-2 hover:bg-muted rounded-lg transition-colors flex items-center gap-2"
                >
                  <Github className="w-4 h-4" />
                  GitHub
                </a>
                <div className="border-t pt-3 mt-2 flex flex-col gap-2 px-4">
                  {isAuthenticated ? (
                    <Link to="/dashboard">
                      <Button className="w-full bg-primary hover:bg-primary/90">
                        Go to Dashboard
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link to="/login">
                        <Button variant="outline" className="w-full">
                          Log In
                        </Button>
                      </Link>
                      <Link to="/signup">
                        <Button className="w-full bg-primary hover:bg-primary/90">
                          Get Started
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        {/* Animated Background - Placeholder for React Bits components */}
        <div className="absolute inset-0 -z-10">
          {/* Gradient Orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-primary/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
          
          {/* Dot Pattern Overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgb(148_163_184/0.05)_1px,transparent_0)] [background-size:40px_40px]" />
        </div>

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center space-y-8 animate-fade-up pt-20">
            {/* Badge */}
            <Badge variant="secondary" className="px-4 py-2 text-sm font-medium shadow-soft border-primary/20">
              <Sparkles className="w-4 h-4 mr-2 inline" />
              AI-Powered · Web-Based · No Download Required
            </Badge>

            {/* Main Headline */}
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight leading-tight">
                <span className="block bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent animate-gradient">
                  The Future of
                </span>
                <span className="block bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent animate-gradient" style={{ animationDelay: '0.1s' }}>
                  Finance Tracking
                </span>
              </h1>
              
              {/* Animated underline */}
              <div className="flex justify-center">
                <div className="h-1 w-64 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full animate-pulse" />
              </div>
            </div>

            {/* Subheading */}
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Snap receipts. AI extracts everything. Track spending across all your devices.
              <br />
              <span className="font-semibold text-foreground">No app to download. Just open and go.</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              {isAuthenticated ? (
                <Link to="/dashboard">
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto text-lg h-14 px-10 bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all hover:scale-105"
                  >
                    Go to Dashboard
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/signup">
                    <Button 
                      size="lg" 
                      className="w-full sm:w-auto text-lg h-14 px-10 bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all hover:scale-105"
                    >
                      Start Tracking Free
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="w-full sm:w-auto text-lg h-14 px-10 border-2 hover:bg-muted/50 hover:scale-105 transition-all"
                    >
                      Log In
                      <ChevronRight className="w-5 h-5 ml-1" />
                    </Button>
                  </Link>
                </>
              )}
              <a href="#how-it-works">
                <Button 
                  size="lg" 
                  variant="ghost" 
                  className="w-full sm:w-auto text-lg h-14 px-10 hover:bg-muted/50 hover:scale-105 transition-all"
                >
                  <Eye className="w-5 h-5 mr-2" />
                  See How It Works
                </Button>
              </a>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 pt-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Works on any device</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>No credit card needed</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Your data stays private</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 pt-16 max-w-4xl mx-auto">
              {stats.map((stat, i) => (
                <div 
                  key={i} 
                  className="text-center animate-fade-up" 
                  style={{ animationDelay: `${i * 100 + 200}ms` }}
                >
                  <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Scroll Indicator */}
            <div className="pt-12 animate-bounce">
              <ChevronRight className="w-6 h-6 mx-auto text-muted-foreground rotate-90" />
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section - Placeholder */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/5 rounded-3xl blur-3xl" />
            
            <Card className="relative shadow-2xl overflow-hidden border-2 border-primary/20">
              <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center p-8">
                <div className="text-center space-y-6">
                  <div className="w-24 h-24 mx-auto bg-primary rounded-2xl flex items-center justify-center shadow-xl">
                    <Camera className="w-12 h-12 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold mb-2">App Screenshot Coming Soon</p>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Capture your dashboard with the AI scanner open, showing the receipt processing magic ✨
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 sm:py-32 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 space-y-4">
            <Badge variant="secondary" className="px-4 py-2 border-primary/20">
              <CheckCircle2 className="w-4 h-4 mr-2 inline" />
              How It Works
            </Badge>
            <h2 className="text-4xl sm:text-6xl font-bold">
              Snap. Scan. Track.
              <br />
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                It's That Simple.
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12 md:gap-8">
            {howItWorks.map((item, i) => (
              <div key={i} className="relative">
                {/* Connection line - desktop only */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-16 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary to-primary/70 opacity-20 z-0" />
                )}
                
                <div className="relative text-center space-y-6 z-10">
                  {/* Step number background */}
                  <div className="absolute -top-4 -right-4 text-8xl font-bold text-primary/5 select-none">
                    {item.step}
                  </div>
                  
                  {/* Icon */}
                  <div className="inline-flex w-32 h-32 rounded-full bg-primary items-center justify-center shadow-2xl shadow-primary/25 relative">
                    <item.icon className="w-14 h-14 text-primary-foreground relative z-10" />
                    {/* Inner glow */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent opacity-50" />
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-32 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 sm:mb-20 space-y-4">
            <Badge variant="secondary" className="px-4 py-2 border-primary/20">
              <Zap className="w-4 h-4 mr-2 inline" />
              Features
            </Badge>
            <h2 className="text-4xl sm:text-6xl font-bold">
              Everything You Need,
              <br />
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Nothing You Don't
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built by developers, for everyone. No bloat, just features that matter.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card 
                key={i} 
                className="group hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 border-2 hover:border-primary/30 animate-fade-up hover:-translate-y-1"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <CardContent className="p-6 space-y-4">
                  <div className={cn(
                    "w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg",
                    "group-hover:scale-110 transition-transform",
                    feature.color
                  )}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section id="tech" className="py-20 sm:py-32 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 space-y-4">
            <Badge variant="secondary" className="px-4 py-2 border-primary/20">
              <Code2 className="w-4 h-4 mr-2 inline" />
              For Developers
            </Badge>
            <h2 className="text-4xl sm:text-6xl font-bold">
              Built With
              <br />
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Modern Tech Stack
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              TypeScript, React Query, Supabase, and more. 100% open source.
            </p>
          </div>

          {/* LogoLoop Component */}
          <div className="mb-16 -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-12 2xl:-mx-16">
            <div 
              className="relative bg-muted/50 py-8 border-y border-primary/10"
              style={{ 
                height: '120px',
                marginLeft: 'calc(-50vw + 50%)',
                marginRight: 'calc(-50vw + 50%)',
                width: '100vw'
              }}
            >
              <LogoLoop
                logos={techLogos}
                speed={80}
                direction="left"
                logoHeight={48}
                gap={48}
                pauseOnHover={true}
                scaleOnHover={true}
                fadeOut={true}
                fadeOutColor="hsl(var(--background))"
                ariaLabel="Technology stack logos"
                className="h-full w-full"
                width="100vw"
              />
            </div>
          </div>

          {/* GitHub CTA */}
          <div className="text-center">
            <a 
              href="https://github.com/your-username/tracker-zenith"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" variant="outline" className="border-2 hover:bg-muted hover:scale-105 transition-all">
                <Github className="w-5 h-5 mr-2" />
                Star on GitHub
                <Star className="w-5 h-5 ml-2 fill-yellow-400 text-yellow-400" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 sm:py-32 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="relative overflow-hidden border-2 border-primary/30 shadow-2xl shadow-primary/20">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-primary/10" />
            
            <CardContent className="relative p-12 sm:p-16 text-center space-y-8">
              <div className="space-y-4">
                <h2 className="text-4xl sm:text-6xl font-bold">
                  Ready to Take Control?
                </h2>
                <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto">
                  Join thousands tracking their finances smarter. No credit card required.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link to={isAuthenticated ? "/dashboard" : "/signup"}>
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto text-xl h-16 px-12 bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30 hover:scale-105 transition-all"
                  >
                    {isAuthenticated ? "Go to Dashboard" : "Get Started for Free"}
                    <ArrowRight className="w-6 h-6 ml-2" />
                  </Button>
                </Link>
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Free forever</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>No credit card</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>2 min setup</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4 bg-muted/40">
        <div className="container mx-auto max-w-6xl">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="bg-primary text-primary-foreground rounded-xl w-10 h-10 flex items-center justify-center font-bold text-lg shadow-lg">
                  F
                </div>
                <span className="font-bold text-xl">Finance Zen</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your intelligent finance companion, powered by AI.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a></li>
                <li><Link to="/signup" className="hover:text-foreground transition-colors">Get Started</Link></li>
              </ul>
            </div>

            {/* Developers */}
            <div>
              <h4 className="font-semibold mb-4">Developers</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="https://github.com/your-username/tracker-zenith" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors flex items-center gap-1">
                    <Github className="w-4 h-4" />
                    GitHub
                  </a>
                </li>
                <li><a href="#tech" className="hover:text-foreground transition-colors">Tech Stack</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">License (MIT)</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© 2024 Finance Zen. Open source and free forever.</p>
            <div className="flex items-center gap-4">
              <a href="https://github.com/your-username" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

