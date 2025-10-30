import React from 'react';
import { PsychedelicText } from '../components/PsychedelicText';
import { FloatingElements } from '../components/FloatingElements';
import { TrippyOverlay } from '../components/TrippyOverlay';
import { AnimatedTitle } from '../components/AnimatedTitle';

/**
 * Example page demonstrating psychedelic visual effects
 * This showcases all the components created for Issues #31 and #32
 */
export const PsychedelicDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background Layers */}
      <TrippyOverlay variant="aurora" intensity="medium" />
      <FloatingElements variant="orbs" count={20} intensity="medium" />
      
      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-16">
        {/* Hero Section */}
        <section className="text-center mb-20">
          <AnimatedTitle 
            variant="split" 
            className="text-6xl md:text-8xl font-black mb-6"
          >
            TrouPriv
          </AnimatedTitle>
          
          <PsychedelicText 
            variant="neon" 
            className="text-3xl md:text-4xl font-bold mb-4"
          >
            Experience the Future
          </PsychedelicText>
          
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Immersive crypto trading platform with psychedelic visuals
          </p>
        </section>

        {/* Effect Showcase Grid */}
        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10">
            <h3 className="text-2xl font-bold mb-4">Glitch Text</h3>
            <PsychedelicText variant="glitch" className="text-3xl font-bold">
              COSMIC VIBES
            </PsychedelicText>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10">
            <h3 className="text-2xl font-bold mb-4">Wave Text</h3>
            <PsychedelicText variant="wave" className="text-3xl font-bold">
              FLOWING ENERGY
            </PsychedelicText>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10">
            <h3 className="text-2xl font-bold mb-4">Rainbow Text</h3>
            <PsychedelicText variant="rainbow" className="text-3xl font-bold">
              PRISMATIC DREAMS
            </PsychedelicText>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10">
            <h3 className="text-2xl font-bold mb-4">Morphing Title</h3>
            <AnimatedTitle variant="morph" className="text-3xl font-bold">
              Dynamic Motion
            </AnimatedTitle>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10">
            <h3 className="text-2xl font-bold mb-4">Bounce Title</h3>
            <AnimatedTitle variant="bounce" className="text-3xl font-bold">
              Jump Around
            </AnimatedTitle>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10">
            <h3 className="text-2xl font-bold mb-4">Pulse Title</h3>
            <AnimatedTitle variant="pulse" className="text-3xl font-bold">
              Heartbeat
            </AnimatedTitle>
          </div>
        </section>

        {/* Background Effects Section */}
        <section className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10">
          <h2 className="text-4xl font-bold mb-8 text-center">
            <PsychedelicText variant="neon">
              Available Visual Effects
            </PsychedelicText>
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-2xl font-semibold text-cyan-400">Text Effects</h3>
              <ul className="space-y-2 text-gray-300">
                <li>✨ Glitch - RGB chromatic aberration</li>
                <li>🌊 Wave - Flowing character animation</li>
                <li>💡 Neon - Pulsing glow effects</li>
                <li>🔄 Morphing - Scale and rotation</li>
                <li>🌈 Rainbow - Color cycling</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-2xl font-semibold text-purple-400">Background Effects</h3>
              <ul className="space-y-2 text-gray-300">
                <li>🌊 Waves - Animated gradients</li>
                <li>🔮 Kaleidoscope - Rotating conic patterns</li>
                <li>⚡ Plasma - SVG noise effects</li>
                <li>🕸️ Mesh - Radial gradient mesh</li>
                <li>🌌 Aurora - Flowing northern lights</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-2xl font-semibold text-pink-400">Floating Elements</h3>
              <ul className="space-y-2 text-gray-300">
                <li>⭕ Orbs - Glowing sphere particles</li>
                <li>✨ Particles - Rising dot effects</li>
                <li>◼️ Shapes - Geometric animations</li>
                <li>📝 Words - Floating psychedelic text</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-2xl font-semibold text-green-400">Title Animations</h3>
              <ul className="space-y-2 text-gray-300">
                <li>📤 Split - Character slide-in</li>
                <li>👁️ Reveal - Horizontal reveal</li>
                <li>🎾 Bounce - Bouncing motion</li>
                <li>🔄 Morph - Transform animation</li>
                <li>💓 Pulse - Pulsing effect</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center mt-20">
          <PsychedelicText variant="glitch" className="text-5xl font-black mb-6">
            Ready to Experience?
          </PsychedelicText>
          
          <AnimatedTitle variant="split" className="text-2xl mb-8">
            Join the Psychedelic Crypto Revolution
          </AnimatedTitle>
          
          <button className="px-8 py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-full text-xl font-bold hover:scale-105 transition-transform">
            Enter the Portal
          </button>
        </section>
      </div>

      {/* Additional Floating Elements */}
      <FloatingElements variant="words" count={10} intensity="low" />
    </div>
  );
};

export default PsychedelicDemo;
