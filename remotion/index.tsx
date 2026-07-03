import { registerRoot, Composition } from 'remotion';
import { Slide1Video, SlideIntro, SlideLearn, SlideFunFact, SlideWhyCare, SlideCTA } from './compositions';
import { SlideQuestion, SlideAnswer, SlideExplanation } from './quizCompositions';
import { SlideGlossaryTerm, SlideGlossarySimple } from './glossaryCompositions';
import { SlideCodeQuestion, SlideCodeAnswer, SlideCodeExplanation } from './codeCompositions';
import { LessonReel } from './reelComposition';

const W = 1080;
const H = 1440;
const REEL_W = 1080;
const REEL_H = 1920;
const FPS = 30;

const defaultQuizProps = {
  question: 'Example question?',
  options: [
    { label: 'A', text: 'First option', isCorrect: false },
    { label: 'B', text: 'Second option', isCorrect: true },
    { label: 'C', text: 'Third option', isCorrect: false },
    { label: 'D', text: 'Fourth option', isCorrect: false },
  ],
  codeSnippet: '',
  lang: 'en',
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
    <Composition id="SlideQuestion" component={SlideQuestion} durationInFrames={5 * FPS} fps={FPS} width={W} height={H}
      defaultProps={defaultQuizProps} />
    <Composition id="SlideAnswer" component={SlideAnswer} durationInFrames={5 * FPS} fps={FPS} width={W} height={H}
      defaultProps={defaultQuizProps} />
    <Composition id="SlideExplanation" component={SlideExplanation} durationInFrames={1} fps={FPS} width={W} height={H}
      defaultProps={{ ...defaultQuizProps, explanation: 'Because...' }} />
    <Composition id="SlideGlossaryTerm" component={SlideGlossaryTerm} durationInFrames={5 * FPS} fps={FPS} width={W} height={H}
      defaultProps={{ term: 'API', short: 'Application Programming Interface', category: 'skratka', explanation: 'Def', example: 'code', antenna: 'ant-star', lang: 'en' }} />
    <Composition id="SlideGlossarySimple" component={SlideGlossarySimple} durationInFrames={1} fps={FPS} width={W} height={H}
      defaultProps={{ term: 'API', simpleExplanation: 'Simple', lang: 'en' }} />
    <Composition id="SlideCodeQuestion" component={SlideCodeQuestion} durationInFrames={5 * FPS} fps={FPS} width={W} height={H}
      defaultProps={{ prompt: 'Fill in:', codeSnippet: 'x = ?', options: ['a', 'b'], equipment: {}, lang: 'en' }} />
    <Composition id="SlideCodeAnswer" component={SlideCodeAnswer} durationInFrames={5 * FPS} fps={FPS} width={W} height={H}
      defaultProps={{ prompt: 'Fill in:', codeAnswer: 'x = 5', correct: '5', options: ['a', 'b'], equipment: {}, lang: 'en' }} />
    <Composition id="SlideCodeExplanation" component={SlideCodeExplanation} durationInFrames={1} fps={FPS} width={W} height={H}
      defaultProps={{ prompt: 'Fill in:', correct: '5', explanation: 'Because...', lang: 'en' }} />
    <Composition id="LessonReel" component={LessonReel} durationInFrames={15 * FPS} fps={FPS} width={REEL_W} height={REEL_H}
      defaultProps={{
        sections: [
          { label: 'INTRODUCTION', words: [{ word: 'Hello', start: 0, end: 0.5 }] },
          { label: 'LEARNING', words: [{ word: 'World', start: 0.6, end: 1.0 }], code: 'print("Hello")' },
          { label: 'KEY POINTS', words: [{ word: 'Key', start: 1.1, end: 1.5 }] },
          { label: 'WHY CARE?', words: [{ word: 'Care', start: 1.6, end: 2.0 }] },
        ],
        audioUrl: '',
        equipment: {},
        durationInFrames: 15 * FPS,
      }} />
  </>
);

registerRoot(RemotionRoot);
