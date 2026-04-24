import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import { Word } from '../models';
import { WordsActions } from './words.actions';

export interface WordsState extends EntityState<Word> {
  loading: boolean;
  translating: boolean;
  translation: Word | null;
  learnedTotal: number;
  repetitionWords: Word[];
  error: string | null;
}

export const adapter: EntityAdapter<Word> = createEntityAdapter<Word>();

const initialState: WordsState = adapter.getInitialState({
  loading: false,
  translating: false,
  translation: null,
  learnedTotal: 0,
  repetitionWords: [],
  error: null,
});

export const wordsReducer = createReducer(
  initialState,

  on(WordsActions.loadWords, s => ({ ...s, loading: true, error: null })),
  on(WordsActions.loadWordsSuccess, (s, { words }) =>
    adapter.setAll(words, { ...s, loading: false })),
  on(WordsActions.loadWordsFailure, (s, { error }) =>
    ({ ...s, loading: false, error })),

  on(WordsActions.loadLearnedWords, s => ({ ...s, loading: true })),
  on(WordsActions.loadLearnedWordsSuccess, (s, { words, total }) =>
    adapter.upsertMany(words, { ...s, loading: false, learnedTotal: total })),
  on(WordsActions.loadLearnedWordsFailure, (s, { error }) =>
    ({ ...s, loading: false, error })),

  on(WordsActions.loadRepetitionWords, s => ({ ...s, loading: true })),
  on(WordsActions.loadRepetitionWordsSuccess, (s, { words }) =>
    ({ ...s, loading: false, repetitionWords: words })),
  on(WordsActions.loadRepetitionWordsFailure, (s, { error }) =>
    ({ ...s, loading: false, error })),

  on(WordsActions.translateWord, s => ({ ...s, translating: true, translation: null, error: null })),
  on(WordsActions.translateFromImage, s => ({ ...s, translating: true, translation: null, error: null })),
  on(WordsActions.translateWordSuccess, (s, { word }) =>
    ({ ...s, translating: false, translation: word })),
  on(WordsActions.translateWordFailure, (s, { error }) =>
    ({ ...s, translating: false, error })),
  on(WordsActions.translateFromImageFailure, (s, { error }) =>
    ({ ...s, translating: false, error })),

  on(WordsActions.saveWord, s => ({ ...s, loading: true })),
  on(WordsActions.saveWordSuccess, (s, { word }) =>
    adapter.addOne(word, { ...s, loading: false, translation: null })),
  on(WordsActions.saveWordFailure, (s, { error }) =>
    ({ ...s, loading: false, error })),

  on(WordsActions.updateRepetitionSuccess, (s, { word }) =>
    adapter.upsertOne(word, s)),

  on(WordsActions.clearTranslation, s => ({ ...s, translation: null, error: null })),
);
