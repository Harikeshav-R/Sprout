import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Database, Search, Rocket, TrendingUp } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    number: '01',
    icon: Database,
    title: 'We Discover Your Farm',
    description: 'Using USDA and Google data, we identify farms with untapped digital potential across the country.',
    color: 'bg-sprout-sage'
  },
  {
    number: '02',
    icon: Search,
    title: 'We Audit Your Presence',
    description: 'Our system analyzes your website, social media, and online visibility to create a digital health score.',
    color: 'bg-sprout-gold'
  },
  {
    number: '03',
    icon: Rocket,
    title: 'We Build Your Toolkit',
    description: 'Automatically generate a modern website, brand identity, and marketing materials tailored to your farm.',
    color: 'bg-sprout-terracotta'
  },
  {
    number: '04',
    icon: TrendingUp,
    title: 'We Connect You to Buyers',
    description: 'Get matched with restaurants and buyers looking for your products, then watch your business grow.',
    color: 'bg-sprout-green'
  }
];

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<(HTMLDivElement | null)[]>([]);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const header = headerRef.current;
    const stepsElements = stepsRef.current.filter(Boolean);
    const line = lineRef.current;

    if (!section || !header || stepsElements.length === 0) return;

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

      // Progress line animation
      if (line) {
        gsap.fromTo(line,
          { scaleY: 0 },
          {
            scaleY: 1,
            duration: 1.5,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 60%',
              toggleActions: 'play none none reverse'
            }
          }
        );
      }

      // Steps animation with stagger
      stepsElements.forEach((step, index) => {
        const isEven = index % 2 === 0;
        
        gsap.fromTo(step,
          { 
            x: isEven ? -60 : 60, 
            opacity: 0 
          },
          {
            x: 0,
            opacity: 1,
            duration: 0.8,
            delay: index * 0.15,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: step,
              start: 'top 80%',
              toggleActions: 'play none none reverse'
            }
          }
        );
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="relative w-full py-24 bg-sprout-cream grain-overlay z-30"
    >
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-20">
          <span className="font-mono text-xs uppercase tracking-[0.14em] text-sprout-gold mb-4 block">
            How It Works
          </span>
          <h2 className="font-display font-bold text-[clamp(2rem,3.5vw,3.5rem)] leading-tight text-sprout-green uppercase mb-4">
            From Discovery to Growth
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A simple four-step journey to transform your farm's digital presence and connect with more buyers.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Progress Line - Desktop */}
          <div 
            ref={lineRef}
            className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-sprout-sage via-sprout-gold to-sprout-green origin-top"
            style={{ transform: 'translateX(-50%)' }}
          />

          {/* Steps Grid */}
          <div className="space-y-16 lg:space-y-24">
            {steps.map((step, index) => {
              const isEven = index % 2 === 0;
              
              return (
                <div
                  key={step.number}
                  ref={el => { stepsRef.current[index] = el; }}
                  className={`relative flex flex-col lg:flex-row items-center gap-8 lg:gap-16 ${
                    isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'
                  }`}
                >
                  {/* Content Card */}
                  <div className={`flex-1 ${isEven ? 'lg:text-right' : 'lg:text-left'}`}>
                    <div className={`bg-white rounded-2xl card-shadow p-8 hover:card-shadow-hover transition-all duration-500 ${
                      isEven ? 'lg:ml-auto' : 'lg:mr-auto'
                    } max-w-lg`}>
                      <div className={`flex items-center gap-4 mb-4 ${isEven ? 'lg:flex-row-reverse' : ''}`}>
                        <div className={`w-14 h-14 ${step.color} rounded-xl flex items-center justify-center`}>
                          <step.icon className="w-7 h-7 text-white" />
                        </div>
                        <span className="font-display font-bold text-4xl text-sprout-gold/30">
                          {step.number}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-2xl text-sprout-green mb-3">
                        {step.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {/* Center Dot */}
                  <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 w-6 h-6 bg-white rounded-full border-4 border-sprout-gold z-10 items-center justify-center">
                    <div className="w-2 h-2 bg-sprout-gold rounded-full" />
                  </div>

                  {/* Spacer for alternating layout */}
                  <div className="flex-1 hidden lg:block" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
