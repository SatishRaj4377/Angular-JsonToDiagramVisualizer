import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject, PLATFORM_ID, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NuMonacoEditorModule, NuMonacoEditorEvent, NuMonacoEditorComponent } from '@ng-util/monaco-editor';
import { DiagramData, DiagramParserService } from '../../services/diagram-parser.service';
import { Subscription } from 'rxjs';
import { EditorService } from '../../services/editor.service';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, NuMonacoEditorModule],
  template: `
    <nu-monaco-editor
      #monacoEditor
      *ngIf="isBrowser"
      [(ngModel)]="code"
      [options]="editorOptions"
      (ngModelChange)="onCodeChange()"
      style="width:100%; height:100%; display:block;">
    </nu-monaco-editor>
  `,
  styles: [':host { display:block; height:100%; }']
})
export class EditorComponent implements OnInit, OnChanges, OnDestroy {

  @ViewChild('monacoEditor') public monacoEditorComponent !: NuMonacoEditorComponent;

  @Input() editorType: 'json' | 'xml' = 'json';

  /** Emits DiagramData when parsing succeeds */
  @Output() diagramData = new EventEmitter<DiagramData>();

  /** Emits true/false for content validity */
  @Output() validStatus = new EventEmitter<boolean>();

  code = '';
  private parser = inject(DiagramParserService);
  private platformId = inject(PLATFORM_ID);
  isBrowser = isPlatformBrowser(this.platformId);

  editorOptions = {
    language: 'json' as 'json' | 'xml',
    scrollBeyondLastLine: false,
    minimap: {
      enabled: false
    },
    scrollbar: {
      verticalScrollbarSize: 5,
      horizontalScrollbarSize: 5
    }
  };
  private editorSubscription!: Subscription;
  private editorService = inject(EditorService);

  // fetch sample.json from assets and set it as the initial code
  ngOnInit(): void {
    if (!this.isBrowser) return;
    // load sample.json from assets
    fetch('/assets/data/sample.json')
      .then(r => r.json())
      .then(json => this.code = JSON.stringify(json, null, 2))
      .finally(() => this.onCodeChange());

    this.editorSubscription = this.editorService.language$.subscribe(newLanguage => {
      this.editorOptions = { ...this.editorOptions, language: newLanguage };
      const editorInstance = this.monacoEditorComponent?.editor;
      const model = editorInstance?.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, newLanguage);
        this.editorType = newLanguage;
        this.onCodeChange();
      }
    });
  }

  ngOnDestroy(): void {
    this.editorSubscription.unsubscribe();
  }

  // update Monaco language when editorType changes
  ngOnChanges(changes: SimpleChanges) {
    if (!this.isBrowser) return;
    if (changes['editorType'] && !changes['editorType'].firstChange) {
      // update Monaco language
      this.onCodeChange();
    }
  }

  // update diagram data when code changes
  onCodeChange() {
    try {
      let result: DiagramData;
      if (this.editorType === 'json') {
        const obj = JSON.parse(this.code);
        result = this.parser.processJson(obj);
      } else {
        result = this.parser.processXml(this.code);
      }
      this.validStatus.emit(true);
      if (result.connectors.length === 0 && result.nodes.length === 0) {
        this.validStatus.emit(false);
      }
      this.diagramData.emit(result);
    } catch {
      this.validStatus.emit(false);
    }
  }

  // update Monaco editor layout when window resizes
  layoutEditor(): void {
    this.monacoEditorComponent?.editor?.layout();
  }
}
