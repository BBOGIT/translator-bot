import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Word } from '../models';

export const WordsActions = createActionGroup({
  source: 'Words',
  events: {
    'Load Words':            props<{ customerId: number }>(),
    'Load Words Success':    props<{ words: Word[] }>(),
    'Load Words Failure':    props<{ error: string }>(),

    'Load Learned Words':         props<{ customerId: number; page: number }>(),
    'Load Learned Words Success': props<{ words: Word[]; total: number }>(),
    'Load Learned Words Failure': props<{ error: string }>(),

    'Load Repetition Words':         props<{ customerId: number }>(),
    'Load Repetition Words Success': props<{ words: Word[] }>(),
    'Load Repetition Words Failure': props<{ error: string }>(),

    'Translate Word':         props<{ text: string }>(),
    'Translate Word Success': props<{ word: Word }>(),
    'Translate Word Failure': props<{ error: string }>(),

    'Translate From Image':         props<{ base64: string }>(),
    'Translate From Image Failure': props<{ error: string }>(),

    'Save Word':         props<{ word: Omit<Word, 'id' | 'createdAt'> }>(),
    'Save Word Success': props<{ word: Word }>(),
    'Save Word Failure': props<{ error: string }>(),

    'Update Repetition':         props<{ wordId: number; success: boolean }>(),
    'Update Repetition Success': props<{ word: Word }>(),
    'Update Repetition Failure': props<{ error: string }>(),

    'Clear Translation': emptyProps(),
  }
});
