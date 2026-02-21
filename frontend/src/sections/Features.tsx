import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Search, Globe, Palette, TrendingUp, Utensils, Mic } from 'lucide-react';
import { Marquee } from '@/components/ui/marquee';

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    icon: Search,
    title: 'Discovery & Audit',
    description: 'We find farms and score their digital health across websites, social media, and online presence.',
    image: '/feature-discovery.jpg',
    color: 'bg-sprout-sage/10',
    iconColor: 'text-sprout-sage'
  },
  {
    icon: Globe,
    title: 'Instant Website',
    description: 'We build you a modern, mobile-friendly website automatically, no coding required.',
    image: '/feature-website.jpg',
    color: 'bg-sprout-gold/10',
    iconColor: 'text-sprout-gold'
  },
  {
    icon: Palette,
    title: 'Brand Persona',
    description: 'We craft a marketing identity based on what makes your farm unique and memorable.',
    image: '/feature-brand.jpg',
    color: 'bg-sprout-terracotta/10',
    iconColor: 'text-sprout-terracotta'
  },
  {
    icon: TrendingUp,
    title: 'Market Intelligence',
    description: 'Real-time crop pricing trends and demand forecasts to help you sell smarter.',
    image: '/feature-market.jpg',
    color: 'bg-sprout-coral/10',
    iconColor: 'text-sprout-coral'
  },
  {
    icon: Utensils,
    title: 'Restaurant Matchmaking',
    description: 'We connect you directly to local restaurants and buyers looking for your products.',
    image: '/feature-matchmaking.jpg',
    color: 'bg-sprout-green/10',
    iconColor: 'text-sprout-green'
  },
  {
    icon: Mic,
    title: 'Voice Field Agent',
    description: 'Log inventory and sales by simply calling in from the field, hands-free convenience.',
    image: '/feature-voice.jpg',
    color: 'bg-sprout-sage/10',
    iconColor: 'text-sprout-sage'
  }
];

function FeatureCard({ feature }: { feature: (typeof features)[0] }) {
  const Icon = feature.icon;
  return (
    <div className="group relative bg-white rounded-2xl card-shadow overflow-hidden hover:card-shadow-hover transition-all duration-500 hover:-translate-y-2 w-[320px] shrink-0">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src={feature.image} 
          alt={feature.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        
        {/* Icon Badge */}
        <div className={`absolute top-4 left-4 w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center backdrop-blur-sm`}>
          <Icon className={`w-6 h-6 ${feature.iconColor}`} />
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="font-display font-bold text-xl text-sprout-green mb-3 group-hover:text-sprout-gold transition-colors">
          {feature.title}
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed">
          {feature.description}
        </p>
      </div>

      {/* Hover Border Effect */}
      <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-sprout-gold/30 transition-colors duration-300 pointer-events-none" />
    </div>
  );
}

export default function Features() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const header = headerRef.current;

    if (!section || !header) return;

    const ctx = gsap.context(() => {
      // Header animation
      gsap.fromTo(header,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: header,
            start: 'top 85%',
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
      className="relative w-full py-24 bg-sprout-cream grain-overlay z-20 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-16">
          <span className="font-mono text-xs uppercase tracking-[0.14em] text-sprout-gold mb-4 block">
            What We Do
          </span>
          <h2 className="font-display font-bold text-[clamp(2rem,3.5vw,3.5rem)] leading-tight text-sprout-green uppercase mb-4">
            Everything Your Farm Needs
          </h2>
          <p className="text-lg text-gray-600 mx-auto whitespace-nowrap">
            From discovery to growth, we provide a complete marketing toolkit designed specifically for farms.
          </p>
        </div>

        {/* Features Marquee - Horizontal scrolling */}
        <div className="relative -mx-6">
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-sprout-cream to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-sprout-cream to-transparent z-10 pointer-events-none" />
          <Marquee pauseOnHover className="[--duration:30s] [--gap:1.5rem]">
            {features.map((feature) => (
              <FeatureCard key={feature.title} feature={feature} />
            ))}
          </Marquee>
        </div>
      </div>
    </section>
  );
}
