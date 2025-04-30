import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EditorService {
  private languageSubject = new BehaviorSubject<'json' | 'xml'>('json');
  language$ = this.languageSubject.asObservable();

  setLanguage(lang: 'json' | 'xml') {
    this.languageSubject.next(lang);
  }
}
