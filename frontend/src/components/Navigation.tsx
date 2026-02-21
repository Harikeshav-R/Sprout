import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sprout, Menu, X } from 'lucide-react';

const landingNavLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Discover', href: '#discover' },
  { label: 'Contact', href: '#contact' }
];

const appNavLinks = [
  { label: 'Home', href: '/' },
  { label: 'Discovery', href: '/discovery' },
  { label: 'Dashboard', href: '/dashboard' },
];

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  
  const isAppPage = location.pathname === '/dashboard' || location.pathname === '/discovery';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const showSolidBg = isScrolled || isAppPage;

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
          showSolidBg 
            ? 'bg-white/95 backdrop-blur-md shadow-sm py-3' 
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          {isAppPage ? (
            <Link 
              to="/" 
              className="flex items-center gap-2 group"
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-sprout-green">
                <Sprout className="w-5 h-5 text-sprout-gold" />
              </div>
              <span className="font-display font-bold text-lg tracking-tight text-sprout-green">
                Sprout
              </span>
            </Link>
          ) : (
            <a 
              href="#" 
              className="flex items-center gap-2 group"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                showSolidBg ? 'bg-sprout-green' : 'bg-white/20 backdrop-blur-sm'
              }`}>
                <Sprout className={`w-5 h-5 ${showSolidBg ? 'text-sprout-gold' : 'text-white'}`} />
              </div>
              <span className={`font-display font-bold text-lg tracking-tight transition-colors ${
                showSolidBg ? 'text-sprout-green' : 'text-white'
              }`}>
                Sprout
              </span>
            </a>
          )}

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {isAppPage ? (
              appNavLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  className={`text-sm font-medium transition-colors hover:text-sprout-gold ${
                    showSolidBg ? 'text-gray-700' : 'text-white/90'
                  } ${location.pathname === link.href ? 'text-sprout-gold' : ''}`}
                >
                  {link.label}
                </Link>
              ))
            ) : (
              landingNavLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => scrollToSection(link.href)}
                  className={`text-sm font-medium transition-colors hover:text-sprout-gold ${
                    showSolidBg ? 'text-gray-700' : 'text-white/90'
                  }`}
                >
                  {link.label}
                </button>
              ))
            )}
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            {isAppPage ? (
              <Link 
                to="/dashboard"
                className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 ${
                  showSolidBg 
                    ? 'bg-sprout-gold text-white hover:bg-sprout-terracotta' 
                    : 'bg-white text-sprout-green hover:bg-sprout-gold hover:text-white'
                }`}
              >
                My Farm
              </Link>
            ) : (
              <>
                <Link 
                  to="/discovery"
                  className="px-4 py-2.5 rounded-full font-medium text-sm transition-all duration-300 text-gray-700 hover:text-sprout-gold mr-2"
                >
                  Discovery
                </Link>
                <button 
                  onClick={() => scrollToSection('#contact')}
                  className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 ${
                    showSolidBg 
                      ? 'bg-sprout-gold text-white hover:bg-sprout-terracotta' 
                      : 'bg-white text-sprout-green hover:bg-sprout-gold hover:text-white'
                  }`}
                >
                  Get Started
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className={`w-6 h-6 ${showSolidBg ? 'text-sprout-green' : 'text-white'}`} />
            ) : (
              <Menu className={`w-6 h-6 ${showSolidBg ? 'text-sprout-green' : 'text-white'}`} />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div 
        className={`fixed inset-0 z-[99] bg-sprout-green transition-all duration-500 md:hidden ${
          isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      >
        <div className="flex flex-col items-center justify-center h-full gap-8">
          {isAppPage ? (
            appNavLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-2xl font-display font-bold text-white hover:text-sprout-gold transition-colors"
              >
                {link.label}
              </Link>
            ))
          ) : (
            landingNavLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => scrollToSection(link.href)}
                className="text-2xl font-display font-bold text-white hover:text-sprout-gold transition-colors"
              >
                {link.label}
              </button>
            ))
          )}
          {isAppPage ? (
            <Link 
              to="/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className="mt-4 px-8 py-3 bg-sprout-gold text-white rounded-full font-semibold hover:bg-sprout-terracotta transition-colors"
            >
              My Farm
            </Link>
          ) : (
            <>
              <Link 
                to="/discovery"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-xl font-display font-bold text-white hover:text-sprout-gold transition-colors"
              >
                Discovery
              </Link>
              <button 
                onClick={() => { scrollToSection('#contact'); setIsMobileMenuOpen(false); }}
                className="mt-4 px-8 py-3 bg-sprout-gold text-white rounded-full font-semibold hover:bg-sprout-terracotta transition-colors"
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
