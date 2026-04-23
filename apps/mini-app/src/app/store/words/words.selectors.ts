import { createFeatureSelector, createSelector } from '@ngrx/store';
import { adapter, WordsState } from './words.reducer';

const selectWordsState = createFeatureSelector<WordsState>('words');

const { selectAll, selectEntities } = adapter.getSelectors();

export const selectAllWords        = createSelector(selectWordsState, selectAll);
export const selectWordsEntities   = createSelector(selectWordsState, selectEntities);
export const selectWordsLoading    = createSelector(selectWordsState, s => s.loading);
export const selectTranslating     = createSelector(selectWordsState, s => s.translating);
export const selectTranslation     = createSelector(selectWordsState, s => s.translation);
export const selectWordsError      = createSelector(selectWordsState, s => s.error);
export const selectRepetitionWords = createSelector(selectWordsState, s => s.repetitionWords);
export const selectLearnedTotal    = createSelector(selectWordsState, s => s.learnedTotal);

export const selectLearnedWords = createSelector(selectAllWords, words =>
  words.filter(w => !w.needToLearn));

export const selectToLearnWords = createSelector(selectAllWords, words =>
  words.filter(w => w.needToLearn));
