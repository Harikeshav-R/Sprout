import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export default function Hero() {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.hero-animate',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, stagger: 0.15, ease: 'power3.out', delay: 0.2 }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden flex flex-col items-center justify-end pb-[12vh] z-10"
    >
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/hero-bg.jpg" 
          alt="Beautiful landscape"
          className="w-full h-full object-cover object-center"
        />
        {/* Gradient transition to the section below */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-sprout-cream via-sprout-cream/80 to-transparent pointer-events-none" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl px-6 w-full">
        <h1 className="hero-animate font-display font-medium text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.05] tracking-tight text-[#1a1a1a] mb-6">
          Your farm deserves<br />to be found
        </h1>

        <p className="hero-animate text-lg md:text-[1.25rem] text-gray-500 font-normal mb-8 max-w-2xl leading-relaxed">
          Sprout discovers farms with weak digital presence and gives them everything they need to reach more customers.
        </p>

        <button className="hero-animate bg-[#1a1a1a] hover:bg-black text-white px-8 py-3.5 rounded-full font-medium transition-colors duration-300">
          Claim your farm
        </button>
      </div>
    </section>
  );
}
