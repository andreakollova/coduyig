import { registerRoot, Composition } from 'remotion';
import { Slide1Video, SlideLearn, SlideExamples, SlideCTA } from './compositions';

const W = 1080;
const H = 1440;
const FPS = 30;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="Slide1Video" component={Slide1Video} durationInFrames={5 * FPS} fps={FPS} width={W} height={H}
        defaultProps={{ title: 'What is a Program?', moduleTitle: 'Programming', equipment: {} }} />
      <Composition id="SlideLearn" component={SlideLearn} durationInFrames={1} fps={FPS} width={W} height={H}
        defaultProps={{ content: 'Example content', slideNumber: 2, totalSlides: 7, equipment: {} }} />
      <Composition id="SlideExamples" component={SlideExamples} durationInFrames={1} fps={FPS} width={W} height={H}
        defaultProps={{ content: 'Example content', equipment: {} }} />
      <Composition id="SlideCTA" component={SlideCTA} durationInFrames={1} fps={FPS} width={W} height={H}
        defaultProps={{ lang: 'en' as const, equipment: {} }} />
    </>
  );
};

registerRoot(RemotionRoot);
