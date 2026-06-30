import { registerRoot, Composition } from 'remotion';
import { Slide1Video, SlideIntro, SlideLearn, SlideFunFact, SlideWhyCare, SlideCTA } from './compositions';

const W = 1080;
const H = 1440;
const FPS = 30;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Slide1Video" component={Slide1Video} durationInFrames={5 * FPS} fps={FPS} width={W} height={H}
      defaultProps={{ title: 'Example', moduleTitle: 'Module', equipment: {} }} />
    <Composition id="SlideIntro" component={SlideIntro} durationInFrames={1} fps={FPS} width={W} height={H}
      defaultProps={{ content: 'Intro text', title: 'Title' }} />
    <Composition id="SlideLearn" component={SlideLearn} durationInFrames={1} fps={FPS} width={W} height={H}
      defaultProps={{ content: 'Content', slideNumber: 3, totalSlides: 8 }} />
    <Composition id="SlideFunFact" component={SlideFunFact} durationInFrames={1} fps={FPS} width={W} height={H}
      defaultProps={{ content: 'Fun fact', type: 'funfact' as const }} />
    <Composition id="SlideWhyCare" component={SlideWhyCare} durationInFrames={1} fps={FPS} width={W} height={H}
      defaultProps={{ content: 'Why care', equipment: {} }} />
    <Composition id="SlideCTA" component={SlideCTA} durationInFrames={1} fps={FPS} width={W} height={H}
      defaultProps={{ lang: 'en' as const, equipment: {} }} />
  </>
);

registerRoot(RemotionRoot);
