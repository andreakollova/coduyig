import { registerRoot, Composition } from 'remotion';
import { Slide1Video, SlideIntro, SlideLearn, SlideFunFact, SlideWhyCare, SlideCTA } from './compositions';
import { SlideQuestion, SlideAnswer, SlideExplanation } from './quizCompositions';

const W = 1080;
const H = 1440;
const FPS = 30;

const defaultQuizProps = {
  question: 'Example?', options: [{ label: 'A', text: 'Yes', isCorrect: true }], lang: 'en',
};

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Slide1Video" component={Slide1Video} durationInFrames={5 * FPS} fps={FPS} width={W} height={H}
      defaultProps={{ title: 'Example', moduleTitle: 'Module', equipment: {} }} />
    <Composition id="SlideIntro" component={SlideIntro} durationInFrames={1} fps={FPS} width={W} height={H}
      defaultProps={{ content: 'Intro', title: 'Title' }} />
    <Composition id="SlideLearn" component={SlideLearn} durationInFrames={1} fps={FPS} width={W} height={H}
      defaultProps={{ content: 'Content', slideNumber: 3, totalSlides: 8 }} />
    <Composition id="SlideFunFact" component={SlideFunFact} durationInFrames={1} fps={FPS} width={W} height={H}
      defaultProps={{ content: 'Fact', type: 'funfact' as const }} />
    <Composition id="SlideWhyCare" component={SlideWhyCare} durationInFrames={1} fps={FPS} width={W} height={H}
      defaultProps={{ content: 'Why', equipment: {} }} />
    <Composition id="SlideCTA" component={SlideCTA} durationInFrames={1} fps={FPS} width={W} height={H}
      defaultProps={{ lang: 'en' as const, equipment: {} }} />
    <Composition id="SlideQuestion" component={SlideQuestion} durationInFrames={1} fps={FPS} width={W} height={H}
      defaultProps={defaultQuizProps} />
    <Composition id="SlideAnswer" component={SlideAnswer} durationInFrames={1} fps={FPS} width={W} height={H}
      defaultProps={defaultQuizProps} />
    <Composition id="SlideExplanation" component={SlideExplanation} durationInFrames={1} fps={FPS} width={W} height={H}
      defaultProps={{ ...defaultQuizProps, explanation: 'Because...' }} />
  </>
);

registerRoot(RemotionRoot);
