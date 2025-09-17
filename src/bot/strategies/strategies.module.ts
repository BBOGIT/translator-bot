import { Module } from '@nestjs/common';
import { StateStrategyFactory } from './state-strategy.factory';
import { MainMenuStrategy } from './main-menu.strategy';
import { WaitingForWordStrategy } from './waiting-for-word.strategy';
import { WaitingForTranslationStrategy } from './waiting-for-translation.strategy';
import { WaitingForWordInputStrategy } from './waiting-for-word-input.strategy';
import { RepeatWordsMainStrategy } from './repeat-words-main.strategy';
import { RepeatWordsNowStrategy } from './repeat-words-now.strategy';
import { WaitingForRepetitionTimeStrategy } from './waiting-for-repetition-time.strategy';
import { WaitingForCustomTimeStrategy } from './waiting-for-custom-time.strategy';

@Module({
  providers: [
    StateStrategyFactory,
    MainMenuStrategy,
    WaitingForWordStrategy,
    WaitingForTranslationStrategy,
    WaitingForWordInputStrategy,
    RepeatWordsMainStrategy,
    RepeatWordsNowStrategy,
    WaitingForRepetitionTimeStrategy,
    WaitingForCustomTimeStrategy
  ],
  exports: [StateStrategyFactory]
})
export class StrategiesModule {}
