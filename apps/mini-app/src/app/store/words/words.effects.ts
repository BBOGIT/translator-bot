import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { WordsActions } from './words.actions';
import { WordsApiService } from '../../core/api/words.api';

@Injectable()
export class WordsEffects {
  private actions$ = inject(Actions);
  private api = inject(WordsApiService);

  loadWords$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WordsActions.loadWords),
      switchMap(({ customerId }) =>
        this.api.getWords(customerId, false).pipe(
          map(words => WordsActions.loadWordsSuccess({ words })),
          catchError(err => of(WordsActions.loadWordsFailure({ error: err.message })))
        )
      )
    )
  );

  loadLearnedWords$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WordsActions.loadLearnedWords),
      switchMap(({ customerId, page }) =>
        this.api.getLearnedWords(customerId, page).pipe(
          map(res => WordsActions.loadLearnedWordsSuccess({ words: res.words, total: res.total })),
          catchError(err => of(WordsActions.loadLearnedWordsFailure({ error: err.message })))
        )
      )
    )
  );

  loadRepetitionWords$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WordsActions.loadRepetitionWords),
      switchMap(({ customerId }) =>
        this.api.getWordsForRepetition(customerId).pipe(
          map(words => WordsActions.loadRepetitionWordsSuccess({ words })),
          catchError(err => of(WordsActions.loadRepetitionWordsFailure({ error: err.message })))
        )
      )
    )
  );

  translateWord$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WordsActions.translateWord),
      switchMap(({ text }) =>
        this.api.translate(text).pipe(
          map(word => WordsActions.translateWordSuccess({ word })),
          catchError(err => of(WordsActions.translateWordFailure({ error: err.message })))
        )
      )
    )
  );

  translateFromImage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WordsActions.translateFromImage),
      switchMap(({ base64 }) =>
        this.api.translateImage(base64).pipe(
          map(word => WordsActions.translateWordSuccess({ word })),
          catchError(err => of(WordsActions.translateFromImageFailure({ error: err.message })))
        )
      )
    )
  );

  saveWord$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WordsActions.saveWord),
      switchMap(({ word }) =>
        this.api.createWord(word).pipe(
          map(saved => WordsActions.saveWordSuccess({ word: saved })),
          catchError(err => of(WordsActions.saveWordFailure({ error: err.message })))
        )
      )
    )
  );

  updateRepetition$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WordsActions.updateRepetition),
      switchMap(({ wordId, success }) =>
        this.api.updateRepetition(wordId, success).pipe(
          map(word => WordsActions.updateRepetitionSuccess({ word })),
          catchError(err => of(WordsActions.updateRepetitionFailure({ error: err.message })))
        )
      )
    )
  );
}
