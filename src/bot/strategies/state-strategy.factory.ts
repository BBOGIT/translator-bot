import { Injectable } from '@nestjs/common';
import { CustomerState } from '../../customer/enum/customer-state.enum';
import { StateStrategy } from './state-strategy.interface';
import { MainMenuStrategy } from './main-menu.strategy';
import { WaitingForWordStrategy } from './waiting-for-word.strategy';
import { WaitingForTranslationStrategy } from './waiting-for-translation.strategy';
import { WaitingForWordInputStrategy } from './waiting-for-word-input.strategy';
import { RepeatWordsMainStrategy } from './repeat-words-main.strategy';
import { RepeatWordsNowStrategy } from './repeat-words-now.strategy';
import { WaitingForRepetitionTimeStrategy } from './waiting-for-repetition-time.strategy';
import { WaitingForCustomTimeStrategy } from './waiting-for-custom-time.strategy';

/**
 * Фабрика для отримання відповідної стратегії обробки стану
 */
@Injectable()
export class StateStrategyFactory {
  private strategies: Map<
    CustomerState,
    StateStrategy
  >;

  constructor(
    private readonly mainMenuStrategy: MainMenuStrategy,
    private readonly waitingForWordStrategy: WaitingForWordStrategy,
    private readonly waitingForTranslationStrategy: WaitingForTranslationStrategy,
    private readonly waitingForWordInputStrategy: WaitingForWordInputStrategy,
    private readonly repeatWordsMainStrategy: RepeatWordsMainStrategy,
    private readonly repeatWordsNowStrategy: RepeatWordsNowStrategy,
    private readonly waitingForRepetitionTimeStrategy: WaitingForRepetitionTimeStrategy,
    private readonly waitingForCustomTimeStrategy: WaitingForCustomTimeStrategy
  ) {
    // Ініціалізуємо мапу стратегій
    this.strategies = new Map<
      CustomerState,
      StateStrategy
    >();
    this.registerStrategies();
  }

  /**
   * Отримує стратегію для заданого стану
   *
   * @param state Стан користувача
   * @returns Стратегія обробки стану або undefined, якщо стратегія не знайдена
   */
  getStrategy(
    state: CustomerState
  ): StateStrategy | undefined {
    return this.strategies.get(state);
  }

  /**
   * Реєструємо всі стратегії в мапі
   */
  private registerStrategies(): void {
    this.strategies.set(
      CustomerState.MainMenu,
      this.mainMenuStrategy
    );
    this.strategies.set(
      CustomerState.WaitingForWord,
      this.waitingForWordStrategy
    );
    this.strategies.set(
      CustomerState.WaitingForTranslation,
      this.waitingForTranslationStrategy
    );
    this.strategies.set(
      CustomerState.WaitingForWordInput,
      this.waitingForWordInputStrategy
    );
    this.strategies.set(
      CustomerState.RepeatWordsMain,
      this.repeatWordsMainStrategy
    );
    this.strategies.set(
      CustomerState.RepeatWordsNow,
      this.repeatWordsNowStrategy
    );
    this.strategies.set(
      CustomerState.WaitingForRepetitionTime,
      this.waitingForRepetitionTimeStrategy
    );
    this.strategies.set(
      CustomerState.WaitingForCustomTime,
      this.waitingForCustomTimeStrategy
    );

    // Інші стратегії можна додати тут
  }
}
