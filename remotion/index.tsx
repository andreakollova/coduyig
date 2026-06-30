import { registerRoot, Composition } from 'remotion';
import { Slide1Video, SlideLearn, SlideRealWorld, SlideCTA } from './compositions';

const W = 1087;
const H = 1447;
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
        defaultProps={{ title: 'What is a Program?', moduleTitle: 'Programming Basics', equipment: {} }}
      />
      <Composition
        id="SlideLearn"
        component={SlideLearn}
        durationInFrames={1}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{ content: 'A program is a set of instructions.', slideNumber: 2, totalSlides: 6, equipment: {} }}
      />
      <Composition
        id="SlideRealWorld"
        component={SlideRealWorld}
        durationInFrames={1}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{ content: 'Programs are everywhere.', equipment: {} }}
      />
      <Composition
        id="SlideCTA"
        component={SlideCTA}
        durationInFrames={1}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{ lang: 'en' as const, equipment: {} }}
      />
    </>
  );
};

registerRoot(RemotionRoot);
