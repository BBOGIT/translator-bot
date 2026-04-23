import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Word } from '../../store/models';

interface PaginatedWords {
  words: Word[];
  total: number;
  pages: number;
}

@Injectable({ providedIn: 'root' })
export class WordsApiService {
  private http = inject(HttpClient);
  private base = '/api/words';

  getWords(customerId: number, needToLearn: boolean): Observable<Word[]> {
    return this.http.get<Word[]>(`${this.base}/customer/${customerId}`, {
      params: { needToLearn }
    });
  }

  getLearnedWords(customerId: number, page = 1, limit = 9): Observable<PaginatedWords> {
    return this.http.get<PaginatedWords>(`${this.base}/customer/${customerId}/learned`, {
      params: { page, limit },
      headers: { 'Cache-Control': 'no-cache' }
    });
  }

  getWordsForRepetition(customerId: number): Observable<Word[]> {
    return this.http.get<Word[]>(`${this.base}/repetition`, {
      params: { customerId }
    });
  }

  getWordCount(customerId: number): Observable<{ total: number; learned: number; inProgress: number; dueToday: number }> {
    return this.http.get<{
      totalWords: number;
      learnedWords: number;
      wordsInProgress: number;
      wordsReadyForRepetition: number;
    }>(`${this.base}/customer/${customerId}/stats`, {
      headers: { 'Cache-Control': 'no-cache' }
    }).pipe(
      map(s => ({
        total: s.totalWords,
        learned: s.learnedWords,
        inProgress: s.wordsInProgress,
        dueToday: s.wordsReadyForRepetition
      }))
    );
  }

  translate(text: string): Observable<Word> {
    return this.http.post<Word>(`${this.base}/translate`, { text });
  }

  createWord(word: Omit<Word, 'id' | 'createdAt'>): Observable<Word> {
    return this.http.post<Word>(this.base, word);
  }

  updateRepetition(wordId: number, success: boolean): Observable<Word> {
    return this.http.patch<Word>(`${this.base}/${wordId}/repetition`, { success });
  }

  deleteWord(wordId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${wordId}`);
  }
}
