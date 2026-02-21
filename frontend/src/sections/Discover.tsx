import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MapPin, ArrowRight, Users, Building2 } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { icon: MapPin, value: '12,000+', label: 'Farms Mapped' },
  { icon: Users, value: '3,500+', label: 'Farmers Connected' },
  { icon: Building2, value: '850+', label: 'Restaurant Partners' }
];

export default function Discover() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;
    const map = mapRef.current;
    const statsEl = statsRef.current;

    if (!section || !content || !map || !statsEl) return;

    const ctx = gsap.context(() => {
      // Content animation
      gsap.fromTo(content,
        { x: -80, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.9,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 70%',
            toggleActions: 'play none none reverse'
          }
        }
      );

      // Map animation
      gsap.fromTo(map,
        { x: 80, opacity: 0, scale: 0.95 },
        {
          x: 0,
          opacity: 1,
          scale: 1,
          duration: 0.9,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 70%',
            toggleActions: 'play none none reverse'
          }
        }
      );

      // Stats animation
      gsap.fromTo(statsEl,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          delay: 0.3,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 60%',
            toggleActions: 'play none none reverse'
          }
        }
      );

      // Floating pins animation
      const pins = map.querySelectorAll('.map-pin');
      pins.forEach((pin, index) => {
        gsap.to(pin, {
          y: -8,
          duration: 1.5 + index * 0.2,
          repeat: -1,
          yoyo: true,
          ease: 'power1.inOut'
        });
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="relative w-full py-24 bg-sprout-cream grain-overlay z-40"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div ref={contentRef}>
            <span className="font-mono text-xs uppercase tracking-[0.14em] text-sprout-gold mb-4 block">
              Discover
            </span>
            <h2 className="font-display font-bold text-[clamp(2rem,3.5vw,3.5rem)] leading-tight text-sprout-green uppercase mb-6">
              Explore the Map of Farms We Work With
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              From small family farms to large agricultural operations, we're building the most 
              comprehensive network of farms across the country. See how we're connecting 
              producers with buyers in your region.
            </p>

            {/* Stats */}
            <div ref={statsRef} className="grid grid-cols-3 gap-6 mb-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
                    <stat.icon className="w-5 h-5 text-sprout-gold" />
                  </div>
                  <div className="font-display font-bold text-2xl lg:text-3xl text-sprout-green">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>

            <button className="group flex items-center gap-2 bg-sprout-green hover:bg-sprout-sage text-white font-semibold px-6 py-3 rounded-full transition-all duration-300 hover:shadow-lg">
              View Full Map
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Map Preview */}
          <div ref={mapRef} className="relative">
            <div className="relative rounded-2xl overflow-hidden card-shadow">
              <img 
                src="/map-preview.jpg" 
                alt="Map of farms across the countryside"
                className="w-full h-auto"
              />
              
              {/* Animated Pins Overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="map-pin absolute top-[20%] left-[25%] w-8 h-8 bg-sprout-gold rounded-full flex items-center justify-center shadow-lg">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <div className="map-pin absolute top-[35%] left-[55%] w-8 h-8 bg-sprout-terracotta rounded-full flex items-center justify-center shadow-lg">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <div className="map-pin absolute top-[50%] left-[40%] w-8 h-8 bg-sprout-green rounded-full flex items-center justify-center shadow-lg">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <div className="map-pin absolute top-[65%] left-[70%] w-8 h-8 bg-sprout-sage rounded-full flex items-center justify-center shadow-lg">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <div className="map-pin absolute top-[40%] left-[80%] w-8 h-8 bg-sprout-coral rounded-full flex items-center justify-center shadow-lg">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-sprout-green/10 to-transparent pointer-events-none" />
            </div>

            {/* Floating Badge */}
            <div className="absolute -bottom-4 -left-4 bg-white rounded-xl card-shadow p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-sprout-gold/20 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-sprout-gold" />
              </div>
              <div>
                <div className="font-semibold text-sprout-green text-sm">New Farms Daily</div>
                <div className="text-xs text-gray-500">Join the network</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
