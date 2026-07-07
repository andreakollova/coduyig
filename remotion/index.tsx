import { registerRoot, Composition } from 'remotion';
import { Slide1Video, SlideIntro, SlideLearn, SlideFunFact, SlideWhyCare, SlideCTA } from './compositions';
import { SlideQuestion, SlideAnswer, SlideExplanation } from './quizCompositions';
import { SlideGlossaryTerm, SlideGlossarySimple } from './glossaryCompositions';
import { SlideCodeQuestion, SlideCodeAnswer, SlideCodeExplanation } from './codeCompositions';
import { LessonReel } from './reelComposition';
import { ByteFallAnimation } from './byteFall';

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
    <Composition id="LessonReel" component={LessonReel} durationInFrames={90 * FPS} fps={FPS} width={REEL_W} height={REEL_H}
      calculateMetadata={({ props }) => ({ durationInFrames: props.durationInFrames || 90 * FPS })}
      defaultProps={{
        lines: [
          { speaker: 'student' as const, audioUrl: '', words: [{ word: 'Hey', start: 0, end: 0.3, speaker: 'student' as const }], startTime: 0, duration: 1 },
          { speaker: 'teacher' as const, audioUrl: '', words: [{ word: 'Hi', start: 1.3, end: 1.6, speaker: 'teacher' as const }], startTime: 1.3, duration: 1, code: 'print("Hello")' },
        ],
        equipmentStudent: {},
        equipmentTeacher: { hat: 'hat-graduation', glasses: 'glasses-cool' },
        durationInFrames: 30 * FPS,
        lessonTitle: 'Example Lesson',
        lessonNumber: 1,
      }} />
    <Composition id="ByteFall" component={ByteFallAnimation} durationInFrames={15 * FPS} fps={FPS} width={REEL_W} height={REEL_H}
      calculateMetadata={({ props }) => ({ durationInFrames: props.durationInFrames || 15 * FPS })}
      defaultProps={{ equipment: {}, durationInFrames: 15 * FPS, term: 'SSH', termFull: 'Secure Shell', definition: 'Secure communication protocol for remote access', audioUrl: '', words: [] }} />
  </>
);

registerRoot(RemotionRoot);
