# Psychedelic Visual Effects - Implementation Guide

## Overview

This document describes the implementation of psychedelic visual effects using Framer Motion to create an immersive, EDC/festival-inspired user experience for TrouPriv. These components address Issues #31 and #32 by providing trippy graphics, animated titles, and special visual effects.

## Components Created

### 1. PsychedelicText
**File**: `components/PsychedelicText.tsx`

Animated text component with multiple psychedelic effects.

#### Variants:
- **glitch**: RGB split effect with chromatic aberration
- **wave**: Wave animation through characters
- **neon**: Pulsing neon glow effect
- **morphing**: Scaling and rotating text
- **rainbow**: Color-cycling rainbow effect

#### Usage:
```tsx
import { PsychedelicText } from './components/PsychedelicText';

<PsychedelicText variant="glitch" className="text-4xl font-bold">
  Welcome to TrouPriv
</PsychedelicText>

<PsychedelicText variant="wave" className="text-2xl">
  Cosmic Trading Platform
</PsychedelicText>

<PsychedelicText variant="neon">
  Experience the Future
</PsychedelicText>
```

#### Props:
- `children`: string - The text to display
- `className?`: string - Additional CSS classes
- `variant?`: 'glitch' | 'wave' | 'neon' | 'morphing' | 'rainbow'

---

### 2. FloatingElements
**File**: `components/FloatingElements.tsx`

Animated floating visual elements that drift across the screen.

#### Variants:
- **orbs**: Blurred glowing orbs with radial gradients
- **particles**: Rising particle effects
- **shapes**: Floating geometric shapes (circles, squares, triangles)
- **words**: Floating psychedelic words like "VIBES", "COSMIC", "NEON"

#### Usage:
```tsx
import { FloatingElements } from './components/FloatingElements';

// Add to your page/app layout
<FloatingElements variant="orbs" count={20} intensity="medium" />

<FloatingElements variant="particles" count={30} intensity="high" />

<FloatingElements variant="words" count={12} intensity="low" />
```

#### Props:
- `count?`: number - Number of elements (default: 20)
- `variant?`: 'orbs' | 'particles' | 'shapes' | 'words' (default: 'orbs')
- `intensity?`: 'low' | 'medium' | 'high' (default: 'medium')

---

### 3. TrippyOverlay
**File**: `components/TrippyOverlay.tsx`

Full-screen animated background overlays for psychedelic visual effects.

#### Variants:
- **waves**: Animated gradient waves
- **kaleidoscope**: Rotating conic gradient kaleidoscope
- **plasma**: SVG-based plasma/noise effect
- **mesh**: Radial gradient mesh
- **aurora**: Aurora borealis-style flowing gradients

#### Usage:
```tsx
import { TrippyOverlay } from './components/TrippyOverlay';

// Add to your page background
<div className="relative">
  <TrippyOverlay variant="waves" intensity="subtle" />
  <TrippyOverlay variant="aurora" intensity="medium" />
  {/* Your content */}
</div>
```

#### Props:
- `variant?`: 'waves' | 'kaleidoscope' | 'plasma' | 'mesh' | 'aurora' (default: 'waves')
- `intensity?`: 'subtle' | 'medium' | 'intense' (default: 'medium')

---

### 4. AnimatedTitle
**File**: `components/AnimatedTitle.tsx`

Animated title component with entrance and ongoing effects.

#### Variants:
- **split**: Characters slide in from bottom
- **reveal**: Horizontal reveal animation
- **bounce**: Bouncing characters
- **morph**: Morphing/scaling effect
- **pulse**: Pulsing effect

#### Usage:
```tsx
import { AnimatedTitle } from './components/AnimatedTitle';

<AnimatedTitle variant="split" className="text-5xl font-black" delay={0.2}>
  Troupe CryptoSpace
</AnimatedTitle>

<AnimatedTitle variant="bounce" className="text-3xl">
  Your Portfolio Dashboard
</AnimatedTitle>
```

#### Props:
- `children`: string - The title text
- `variant?`: 'split' | 'reveal' | 'bounce' | 'morph' | 'pulse' (default: 'split')
- `className?`: string - Additional CSS classes
- `delay?`: number - Animation delay in seconds (default: 0)

---

## Integration Examples

### Example 1: Enhanced Page Header
```tsx
import { PsychedelicText } from './components/PsychedelicText';
import { AnimatedTitle } from './components/AnimatedTitle';
import { FloatingElements } from './components/FloatingElements';

function PageHeader() {
  return (
    <div className="relative py-12">
      <FloatingElements variant="orbs" count={15} intensity="low" />
      
      <AnimatedTitle variant="split" className="text-6xl font-black text-center">
        Welcome to the Future
      </AnimatedTitle>
      
      <PsychedelicText 
        variant="neon" 
        className="text-2xl text-center mt-4"
      >
        Experience Crypto Like Never Before
      </PsychedelicText>
    </div>
  );
}
```

### Example 2: Full Page Effect
```tsx
import { TrippyOverlay } from './components/TrippyOverlay';
import { FloatingElements } from './components/FloatingElements';

function App() {
  return (
    <div className="min-h-screen relative">
      {/* Background layers */}
      <TrippyOverlay variant="aurora" intensity="subtle" />
      <FloatingElements variant="particles" count={30} intensity="medium" />
      
      {/* Main content */}
      <div className="relative z-10">
        {/* Your app content */}
      </div>
    </div>
  );
}
```

### Example 3: Dashboard Enhancement
```tsx
import { PsychedelicText } from './components/PsychedelicText';
import { FloatingElements } from './components/FloatingElements';
import { TrippyOverlay } from './components/TrippyOverlay';

function Dashboard() {
  return (
    <div className="relative">
      <TrippyOverlay variant="mesh" intensity="subtle" />
      <FloatingElements variant="words" count={8} intensity="low" />
      
      <div className="relative z-10 space-y-6">
        <PsychedelicText variant="glitch" className="text-4xl font-bold">
          Portfolio Dashboard
        </PsychedelicText>
        
        {/* Dashboard widgets */}
      </div>
    </div>
  );
}
```

---

## Performance Considerations

### Optimization Tips:

1. **Limit Number of Elements**
   - Use `intensity="low"` for better performance
   - Reduce `count` on mobile devices
   - Consider conditional rendering based on device capabilities

2. **Layer Overlays Wisely**
   - Don't stack too many `TrippyOverlay` components
   - Use `intensity="subtle"` for background layers
   - Combine effects strategically

3. **Disable on Low-End Devices**
```tsx
const [enableEffects, setEnableEffects] = useState(() => {
  // Detect device capabilities
  return window.matchMedia('(min-width: 768px)').matches && 
         !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
});

{enableEffects && (
  <>
    <FloatingElements variant="orbs" count={20} />
    <TrippyOverlay variant="waves" />
  </>
)}
```

4. **Respect User Preferences**
```tsx
// Check for prefers-reduced-motion
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

{!prefersReducedMotion && <AnimatedTitle variant="split" />}
```

---

## Customization

### Custom Colors
All components use HSL colors that can be customized through CSS variables or inline styles:

```tsx
<PsychedelicText 
  variant="neon"
  className="text-4xl"
  style={{ 
    '--neon-color-1': 'hsl(280, 100%, 60%)',
    '--neon-color-2': 'hsl(180, 100%, 60%)'
  } as React.CSSProperties}
>
  Custom Neon
</PsychedelicText>
```

### Adjust Animation Speed
Modify the `duration` in component source for different speeds:

```tsx
// In PsychedelicText.tsx, modify transition duration
transition={{
  duration: 2, // Slower
  repeat: Infinity,
}}
```

---

## Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support (with webkit prefixes)
- **Mobile**: Supported but consider performance impact

---

## Dependencies

- **framer-motion**: ^11.0.0 (already installed)
- **React**: ^19.2.0 (already in use)
- **TypeScript**: ^5.8.0 (already in use)

---

## Future Enhancements

1. **Sound Reactive Effects**: Sync animations with audio input
2. **Interactive Elements**: Mouse-following effects and click interactions
3. **Theme Variants**: Pre-built theme combinations (EDC, Tomorrowland, Cosmic, etc.)
4. **Performance Mode**: Auto-adjust based on FPS
5. **Canvas-based Rendering**: WebGL effects for complex animations

---

## Troubleshooting

### Issue: Animations are jerky
**Solution**: Reduce `count` or use `intensity="low"`, enable GPU acceleration

### Issue: Effects too subtle
**Solution**: Use `intensity="intense"` or stack multiple overlay types

### Issue: Causing performance issues
**Solution**: 
- Implement conditional rendering for mobile
- Reduce animation complexity
- Use `will-change` CSS property sparingly

### Issue: Colors clash with theme
**Solution**: Customize colors to match your theme or reduce opacity

---

## Credits

Created for TrouPriv to address Issues #31 and #32:
- Issue #31: Enhanced psychedelic styling with LSD + DMT + EDC vibes
- Issue #32: Framer Motion integration for trippy graphics and effects

---

## License

Part of the TrouPriv project. See project LICENSE for details.
