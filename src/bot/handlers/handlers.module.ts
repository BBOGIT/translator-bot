import { Module } from '@nestjs/common';
import { CommandDispatcher } from './commands/command-dispatcher';
import { RepetitionCommandHandler } from './repetition/repetition.handler';
import { LearnWordsCommandHandler } from './words/learn-words.handler';
import { ProgressCommandHandler } from './commands/progress.handler';
import { LearningWordsHandler } from './words/learning-words.handler';
import { MainMenuCommandHandler } from './commands/main-menu.handler';
import { CustomerHandler } from './commands/customer.handler';
import { WordRepetitionHandler } from './repetition/word-repetition.handler';
import { WordProcessingHandler } from './words/word.handler';
import { WordTranslationHandler } from './words/word-translation.handler';
import { StateHandler } from './states/state-handler';
import { CustomerModule } from '../../customer/customer.module';
import { MessageModule } from '../../message/message.module';
import { WordModule } from '../../word/word.module';
import { AiModule } from '../../ai/ai.module';
import { StrategiesModule } from '../strategies/strategies.module';
import { JobsModule } from '../../jobs/jobs.module';

@Module({
  imports: [
    CustomerModule,
    MessageModule,
    WordModule,
    AiModule,
    StrategiesModule,
    JobsModule
  ],
  providers: [
    CommandDispatcher,
    RepetitionCommandHandler,
    LearnWordsCommandHandler,
    ProgressCommandHandler,
    LearningWordsHandler,
    MainMenuCommandHandler,
    CustomerHandler,
    WordRepetitionHandler,
    WordProcessingHandler,
    WordTranslationHandler,
    StateHandler
  ],
  exports: [
    CommandDispatcher,
    CustomerHandler,
    StateHandler
  ]
})
export class HandlersModule {}
