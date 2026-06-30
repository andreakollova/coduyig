import React from 'react';
import { registerRoot, Composition } from 'remotion';
import { Slide1Video, SlideLearn, SlideRealWorld, SlideCTA } from './compositions';

const W = 1080;
const H = 1440;
const FPS = 30;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Slide1Video"
        component={Slide1Video}
        durationInFrames={5 * FPS}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{
          title: 'What is a Program?',
          moduleTitle: 'Programming Basics',
          equipment: {} as Record<string, string>,
        }}
      />
      <Composition
        id="SlideLearn"
        component={SlideLearn}
        durationInFrames={1}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{
          content: 'A program is a sequence of instructions that tells a computer exactly what to do.',
          slideNumber: 2,
          totalSlides: 6,
          equipment: {} as Record<string, string>,
          lang: 'en' as string,
        }}
      />
      <Composition
        id="SlideRealWorld"
        component={SlideRealWorld}
        durationInFrames={1}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{
          content: 'Programs are everywhere - in your phone, your car, your fridge.',
          equipment: {} as Record<string, string>,
          lang: 'en' as string,
        }}
      />
      <Composition
        id="SlideCTA"
        component={SlideCTA}
        durationInFrames={1}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{
          lang: 'en' as 'en' | 'sk',
          equipment: {} as Record<string, string>,
        }}
      />
    </>
  );
};

registerRoot(RemotionRoot);
