import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import KineticDotsLoader from '../components/ui/kinetic-dots-loader';
import { VerticalCutReveal } from '../components/ui/vertical-cut-reveal';
import { Sprout } from 'lucide-react';
import { useFarmProfile } from '../context/FarmContext';
import { resolveZipCode } from '../lib/api';

type OnboardingStep = 'selection' | 'farm-info' | 'scraping';

export default function OnboardingPage() {
    const navigate = useNavigate();
    const { updateProfile } = useFarmProfile();
    const [step, setStep] = useState<OnboardingStep>('selection');

    // Controlled form state
    const [farmName, setFarmName] = useState('');
    const [website, setWebsite] = useState('');
    const [location, setLocation] = useState('');

    const handleSelection = (type: 'shopper' | 'farmer') => {
        if (type === 'shopper') {
            navigate('/discovery');
        } else {
            setStep('farm-info');
        }
    };

    const handleFarmSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStep('scraping');

        // Immediately store what we know
        updateProfile({ farmName, website });

        // Try to resolve the location input
        // User may enter a zip code like "43210" or a "City, State" string
        const trimmed = location.trim();
        const isZipCode = /^\d{5}(-\d{4})?$/.test(trimmed);

        if (isZipCode) {
            try {
                const resolved = await resolveZipCode(trimmed);
                updateProfile({
                    zipCode: resolved.zip_code,
                    city: resolved.city,
                    state: resolved.state_abbrev,
                    county: resolved.county,
                });
            } catch {
                // Geocoding failed — use raw input as fallback
                updateProfile({
                    zipCode: trimmed,
                    city: trimmed,
                    state: '',
                    county: '',
                });
            }
        } else {
            // User typed something like "Columbus, OH"
            const parts = trimmed.split(',').map((s) => s.trim());
            updateProfile({
                zipCode: '',
                city: parts[0] || trimmed,
                state: parts[1] || '',
                county: '',
            });
        }

        // Navigate after a short delay (scraping animation)
        setTimeout(() => {
            navigate('/dashboard');
        }, 4500);
    };

    return (
        <div className="min-h-screen bg-sprout-cream flex items-center justify-center p-6 pt-24">
            <div className="max-w-2xl w-full">
                <div className="text-center mb-12">
                    <div className="w-16 h-16 bg-sprout-green rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Sprout className="w-8 h-8 text-sprout-gold" />
                    </div>
                    <h1 className="font-display font-bold text-4xl text-sprout-green mb-4">
                        Welcome to Sprout
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Let's get you to the right place.
                    </p>
                </div>

                {step === 'selection' && (
                    <div className="grid md:grid-cols-2 gap-6 animate-in fade-in duration-[1800ms] fill-mode-forwards">
                        <button
                            onClick={() => handleSelection('shopper')}
                            className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:border-sprout-green transition-all group text-left"
                        >
                            <h3 className="font-display font-bold text-2xl text-sprout-green mb-3 group-hover:text-sprout-gold">
                                <VerticalCutReveal
                                    splitBy="words"
                                    staggerDuration={0.18}
                                    staggerFrom="first"
                                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                                    containerClassName="inline-flex"
                                >
                                    Looking for a farm
                                </VerticalCutReveal>
                            </h3>
                            <p className="text-gray-600">
                                Discover fresh, local produce and connect directly with farmers in your community.
                            </p>
                        </button>

                        <button
                            onClick={() => handleSelection('farmer')}
                            className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:border-sprout-green transition-all group text-left"
                        >
                            <h3 className="font-display font-bold text-2xl text-sprout-green mb-3 group-hover:text-sprout-gold">
                                <VerticalCutReveal
                                    splitBy="words"
                                    staggerDuration={0.18}
                                    staggerFrom="first"
                                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                                    containerClassName="inline-flex"
                                >
                                    Are you a farm?
                                </VerticalCutReveal>
                            </h3>
                            <p className="text-gray-600">
                                Claim your space, get your digital health score, and grow your local business.
                            </p>
                        </button>
                    </div>
                )}

                {step === 'farm-info' && (
                    <motion.div
                        className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1.5, ease: 'easeOut' }}
                    >
                        <h2 className="font-display font-bold text-2xl text-sprout-green mb-6">
                            Tell us about your farm
                        </h2>
                        <form onSubmit={handleFarmSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Farm Name</label>
                                <input
                                    required
                                    type="text"
                                    value={farmName}
                                    onChange={(e) => setFarmName(e.target.value)}
                                    placeholder="E.g. Sunny Brook Farm"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sprout-gold focus:ring-2 focus:ring-sprout-gold/20 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Website (Optional)</label>
                                <input
                                    type="url"
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                    placeholder="https://yourfarm.com"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sprout-gold focus:ring-2 focus:ring-sprout-gold/20 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                                <input
                                    required
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="Zip Code (e.g. 43210) or City, State"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sprout-gold focus:ring-2 focus:ring-sprout-gold/20 outline-none transition-all"
                                />
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setStep('selection')}
                                    className="px-6 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-colors w-full"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-3 rounded-xl font-semibold bg-sprout-gold text-white hover:bg-sprout-terracotta transition-colors w-full"
                                >
                                    Connect Farm
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}

                {step === 'scraping' && (
                    <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center animate-in fade-in duration-[1800ms] fill-mode-forwards">
                        <h2 className="font-display font-bold text-2xl text-sprout-green mb-4">
                            Building your profile...
                        </h2>
                        <p className="text-gray-600 mb-8 max-w-sm mx-auto">
                            We're analyzing public directories and connecting the dots to set up your dashboard.
                        </p>

                        <div className="rounded-xl overflow-hidden mt-8 flex justify-center">
                            <KineticDotsLoader />
                        </div>

                        <div className="mt-8 flex flex-col gap-2">
                            <p className="text-sm font-medium text-sprout-sage animate-pulse">
                                Auditing digital presence...
                            </p>
                            <p className="text-xs text-gray-400">
                                This will just take a few moments
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
