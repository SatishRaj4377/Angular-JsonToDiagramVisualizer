import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  inject,
  PLATFORM_ID,
  ViewChild,
  OnDestroy
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NuMonacoEditorModule, NuMonacoEditorComponent } from '@ng-util/monaco-editor';
import { DiagramData, DiagramParserService } from '../../services/diagram-parser.service';
import { Subscription } from 'rxjs';
import { EditorService } from '../../services/editor.service';
import * as xml2js from 'xml2js';
import * as js2xmlparser from 'js2xmlparser';

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
  @ViewChild('monacoEditor') public monacoEditorComponent!: NuMonacoEditorComponent;

  @Input() editorType: 'json' | 'xml' = 'json';
  @Output() diagramData = new EventEmitter<DiagramData>();
  @Output() validStatus = new EventEmitter<boolean>();

  code = '';
  private parser = inject(DiagramParserService);
  private platformId = inject(PLATFORM_ID);
  isBrowser = isPlatformBrowser(this.platformId);

  // editor options for monaco editor
  editorOptions = {
    language: 'json' as 'json' | 'xml',
    scrollBeyondLastLine: false,
    minimap: { enabled: false },
    scrollbar: { verticalScrollbarSize: 5, horizontalScrollbarSize: 5 }
  };

  private editorSubscription!: Subscription;
  private editorService = inject(EditorService);

  ngOnInit(): void {
    if (!this.isBrowser) return;

    // fetch sample data and set it as the initial code
    fetch('/assets/data/sample.json')
      .then((r) => r.json())
      .then((json) => (this.code = JSON.stringify(json, null, 2)))
      .finally(() => this.onCodeChange());

    // subscribe to language changes from the editor service
    this.editorSubscription = this.editorService.language$.subscribe(
      (newLanguage) => {
        if (newLanguage !== this.editorType) {
          this.switchEditorType(newLanguage);
        }
      }
    );
  }

  ngOnDestroy(): void {
    this.editorSubscription.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!this.isBrowser) return;
    // switch editor type if the input changes
    if (changes['editorType'] && !changes['editorType'].firstChange) {
      this.switchEditorType(this.editorType);
    }
  }

  // on editor type chnage, convert JSON to XML or vice versa
  private async switchEditorType(targetType: 'json' | 'xml') {
    const current = this.code;
    let displayContent = current;
    let jsonObject: any;

    this.validStatus.emit(false); // show spinner/loading

    try {
      if (targetType === 'xml') {
        // Detect whether current is XML or JSON
        if (current.trim().startsWith('<')) {
          const wrapped = `<root>${current}</root>`;
          const result = await xml2js.parseStringPromise(wrapped, {
            explicitArray: false,
            mergeAttrs: true,
          });
          jsonObject = result.root;
        } else {
          jsonObject = JSON.parse(current);
        }
        const keys = Object.keys(jsonObject);

        displayContent = keys
          .map((key) => {
            const value = jsonObject[key];

            // Case: array of primitives → emit <key>value</key> for each
            if (Array.isArray(value) && typeof value[0] !== 'object') {
              return value
                .map((item) =>
                  js2xmlparser.parse(key, item, {
                    declaration: { include: false },
                  })
                )
                .join('\n');

              // Case: array of objects → emit <key>...</key> for each object
            } else if (Array.isArray(value)) {
              return value
                .map((item) =>
                  js2xmlparser.parse(key, item, {
                    declaration: { include: false },
                  })
                )
                .join('\n');

              // Case: non-array → serialize normally
            } else {
              return js2xmlparser.parse(key, value, {
                declaration: { include: false },
              });
            }
          })
          .join('\n');
      } else {
        // Switching to JSON: assume XML → convert to JSON object
        const wrappedXml = `<root>${current}</root>`;
        const result = await xml2js.parseStringPromise(wrappedXml, {
          explicitArray: false,
          mergeAttrs: true,
        });
        jsonObject = result.root;
        displayContent = JSON.stringify(jsonObject, null, 2);
      }

      this.code = displayContent;
      this.editorType = targetType;
      this.editorOptions = { ...this.editorOptions, language: targetType };

      const editor = this.monacoEditorComponent?.editor;
      const model = editor?.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, targetType);
      }

      this.runParser(jsonObject);
    } catch (e) {
      console.error('Editor type switch error:', e);
      this.validStatus.emit(false);
    }
  }

  // handle code changes in the editor
  onCodeChange() {
    if (!this.code?.trim()) {
      this.validStatus.emit(false);
      return;
    }

    try {
      if (this.editorType === 'json') {
        // Attempt to parse as JSON
        const parsed = JSON.parse(this.code);
        this.runParser(parsed);
      } else if (this.editorType === 'xml') {
        // Validate if the code can actually be XML
        if (!this.code.trim().startsWith('<')) {
          throw new Error('Invalid XML format');
        }
        
        // Attempt to parse as XML
        const wrapped = `<root>${this.code}</root>`;
        xml2js
          .parseStringPromise(wrapped, { explicitArray: false, mergeAttrs: true, })
          .then((json) => this.runParser(json.root))
          .catch(() => this.validStatus.emit(false));
      }
    } catch (error) {
      console.error("Parsing error:", error);
      this.validStatus.emit(false);
    }
  }

  // try to convert the json data to diagram data, to check if data is valid or not
  private runParser(obj: any) {
    try {
      const result = this.parser.processJson(obj);
      const isValid = result.nodes.length > 0 || result.connectors.length > 0;
      this.validStatus.emit(isValid);
      if (isValid) this.diagramData.emit(result);
    } catch {
      this.validStatus.emit(false);
    }
  }

  // update Monaco editor layout when window resizes
  layoutEditor(): void {
    this.monacoEditorComponent?.editor?.layout();
  }
}
