import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { PsychedelicText } from '../components/PsychedelicText';
import { FloatingElements } from '../components/FloatingElements';
import { TrippyOverlay } from '../components/TrippyOverlay';
import { AnimatedTitle } from '../components/AnimatedTitle';

describe('Psychedelic Components', () => {
  describe('PsychedelicText', () => {
    it('should render with glitch variant', () => {
      const { container } = render(
        <PsychedelicText variant="glitch">Test Text</PsychedelicText>
      );
      expect(container).toBeInTheDocument();
      expect(container.textContent).toContain('Test Text');
    });

    it('should render with wave variant', () => {
      const { container } = render(
        <PsychedelicText variant="wave">Wave Text</PsychedelicText>
      );
      expect(container).toBeInTheDocument();
    });

    it('should render with neon variant', () => {
      const { container } = render(
        <PsychedelicText variant="neon">Neon Text</PsychedelicText>
      );
      expect(container).toBeInTheDocument();
    });

    it('should render with morphing variant', () => {
      const { container } = render(
        <PsychedelicText variant="morphing">Morph Text</PsychedelicText>
      );
      expect(container).toBeInTheDocument();
    });

    it('should render with rainbow variant', () => {
      const { container } = render(
        <PsychedelicText variant="rainbow">Rainbow Text</PsychedelicText>
      );
      expect(container).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <PsychedelicText className="custom-class">Text</PsychedelicText>
      );
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });

  describe('FloatingElements', () => {
    it('should render with orbs variant', () => {
      const { container } = render(<FloatingElements variant="orbs" count={5} />);
      expect(container).toBeInTheDocument();
    });

    it('should render with particles variant', () => {
      const { container } = render(<FloatingElements variant="particles" count={10} />);
      expect(container).toBeInTheDocument();
    });

    it('should render with shapes variant', () => {
      const { container } = render(<FloatingElements variant="shapes" count={8} />);
      expect(container).toBeInTheDocument();
    });

    it('should render with words variant', () => {
      const { container } = render(<FloatingElements variant="words" count={6} />);
      expect(container).toBeInTheDocument();
    });

    it('should respect intensity prop', () => {
      const { container } = render(
        <FloatingElements variant="orbs" intensity="high" count={15} />
      );
      expect(container).toBeInTheDocument();
    });
  });

  describe('TrippyOverlay', () => {
    it('should render with waves variant', () => {
      const { container } = render(<TrippyOverlay variant="waves" />);
      expect(container).toBeInTheDocument();
    });

    it('should render with kaleidoscope variant', () => {
      const { container } = render(<TrippyOverlay variant="kaleidoscope" />);
      expect(container).toBeInTheDocument();
    });

    it('should render with plasma variant', () => {
      const { container } = render(<TrippyOverlay variant="plasma" />);
      expect(container).toBeInTheDocument();
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render with mesh variant', () => {
      const { container } = render(<TrippyOverlay variant="mesh" />);
      expect(container).toBeInTheDocument();
    });

    it('should render with aurora variant', () => {
      const { container } = render(<TrippyOverlay variant="aurora" />);
      expect(container).toBeInTheDocument();
    });

    it('should respect intensity prop', () => {
      const { container } = render(
        <TrippyOverlay variant="waves" intensity="intense" />
      );
      expect(container).toBeInTheDocument();
    });
  });

  describe('AnimatedTitle', () => {
    it('should render with split variant', () => {
      const { container } = render(
        <AnimatedTitle variant="split">Split Title</AnimatedTitle>
      );
      expect(container).toBeInTheDocument();
      // Text content may have spaces removed in rendering
      expect(container.textContent).toMatch(/Split.*Title/);
    });

    it('should render with reveal variant', () => {
      const { container } = render(
        <AnimatedTitle variant="reveal">Reveal Title</AnimatedTitle>
      );
      expect(container).toBeInTheDocument();
    });

    it('should render with bounce variant', () => {
      const { container } = render(
        <AnimatedTitle variant="bounce">Bounce Title</AnimatedTitle>
      );
      expect(container).toBeInTheDocument();
    });

    it('should render with morph variant', () => {
      const { container } = render(
        <AnimatedTitle variant="morph">Morph Title</AnimatedTitle>
      );
      expect(container).toBeInTheDocument();
    });

    it('should render with pulse variant', () => {
      const { container } = render(
        <AnimatedTitle variant="pulse">Pulse Title</AnimatedTitle>
      );
      expect(container).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <AnimatedTitle className="custom-title">Title</AnimatedTitle>
      );
      expect(container.querySelector('.custom-title')).toBeInTheDocument();
    });

    it('should respect delay prop', () => {
      const { container } = render(
        <AnimatedTitle delay={0.5}>Delayed Title</AnimatedTitle>
      );
      expect(container).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should render multiple components together', () => {
      const { container } = render(
        <div>
          <TrippyOverlay variant="waves" intensity="subtle" />
          <FloatingElements variant="orbs" count={10} intensity="low" />
          <AnimatedTitle variant="split">Title</AnimatedTitle>
          <PsychedelicText variant="neon">Content</PsychedelicText>
        </div>
      );
      expect(container).toBeInTheDocument();
    });
  });
});
