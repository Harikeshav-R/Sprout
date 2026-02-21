import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Mail, MapPin, Sprout, Twitter, Linkedin, Instagram } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function CTA() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;
    const form = formRef.current;

    if (!section || !content || !form) return;

    const ctx = gsap.context(() => {
      // Content animation
      gsap.fromTo(content,
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 75%',
            toggleActions: 'play none none reverse'
          }
        }
      );

      // Form animation
      gsap.fromTo(form,
        { y: 40, opacity: 0, scale: 0.98 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          delay: 0.2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 70%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full py-24 bg-sprout-green grain-overlay z-50"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="max-w-6xl mx-auto px-6 relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div ref={contentRef}>
            <span className="font-mono text-xs uppercase tracking-[0.14em] text-sprout-gold mb-4 block">
              Get Started
            </span>
            <h2 className="font-display font-bold text-[clamp(2.5rem,4vw,4rem)] leading-tight text-white uppercase mb-6">
              Ready to Grow Your Farm's Presence?
            </h2>
            <p className="text-lg text-white/80 mb-8 leading-relaxed">
              Claim your farm today and get your free digital health score.
              See how Sprout can help you reach more customers and grow your business.
            </p>

            {/* Contact Info */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-white/70">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <span>hello@sprout.farm</span>
              </div>
              <div className="flex items-center gap-3 text-white/70">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <span>Serving farms nationwide</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 bg-white/10 hover:bg-sprout-gold rounded-lg flex items-center justify-center transition-colors">
                <Twitter className="w-5 h-5 text-white" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 hover:bg-sprout-gold rounded-lg flex items-center justify-center transition-colors">
                <Linkedin className="w-5 h-5 text-white" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 hover:bg-sprout-gold rounded-lg flex items-center justify-center transition-colors">
                <Instagram className="w-5 h-5 text-white" />
              </a>
            </div>
          </div>

          {/* Form Card */}
          <div ref={formRef} className="bg-white rounded-2xl card-shadow p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-sprout-green rounded-xl flex items-center justify-center">
                <Sprout className="w-6 h-6 text-sprout-gold" />
              </div>
              <div>
                <h3 className="font-display font-bold text-xl text-sprout-green">Claim Your Farm</h3>
                <p className="text-sm text-gray-500">Get your free digital health score</p>
              </div>
            </div>

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                navigate('/onboarding');
              }}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Farm Name</label>
                <input
                  type="text"
                  placeholder="Enter your farm name"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sprout-gold focus:ring-2 focus:ring-sprout-gold/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sprout-gold focus:ring-2 focus:ring-sprout-gold/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  placeholder="City, State"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sprout-gold focus:ring-2 focus:ring-sprout-gold/20 outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full group flex items-center justify-center gap-2 bg-sprout-gold hover:bg-sprout-terracotta text-white font-semibold px-6 py-4 rounded-xl transition-all duration-300 hover:shadow-lg"
              >
                See Your Digital Health Score
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>

            <p className="text-xs text-gray-500 text-center mt-4">
              Free analysis. No credit card required.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-20 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sprout-gold rounded-xl flex items-center justify-center">
                <Sprout className="w-6 h-6 text-sprout-green" />
              </div>
              <span className="font-display font-bold text-xl text-white tracking-tight">Sprout</span>
            </div>

            <nav className="flex items-center gap-8">
              <a href="#" className="text-white/70 hover:text-sprout-gold transition-colors text-sm">Product</a>
              <a href="#" className="text-white/70 hover:text-sprout-gold transition-colors text-sm">Features</a>
              <a href="#" className="text-white/70 hover:text-sprout-gold transition-colors text-sm">Pricing</a>
              <a href="#" className="text-white/70 hover:text-sprout-gold transition-colors text-sm">Contact</a>
            </nav>

            <p className="text-white/50 text-sm">
              © 2026 Sprout. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
