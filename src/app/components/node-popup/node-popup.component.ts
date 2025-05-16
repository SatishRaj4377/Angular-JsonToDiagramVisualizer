import {
  Component,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { DialogModule, DialogComponent } from '@syncfusion/ej2-angular-popups';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface JsonLine {
  key: string;
  value: string;
  hasComma: boolean;
}

@Component({
  selector: 'app-node-popup',
  imports: [ DialogModule ],
  template: `
    <ejs-dialog
      #dialog
      header="Node Details"
      width="400px"
      [visible]="visible"
      [showCloseIcon]="true"
      [isModal]="true"
      [closeOnEscape]="true"
      (overlayClick)="hide()"
    >
      <div class="popup-content">
        <!-- Content Section -->
        <div class="section">
          <label>Content</label>
          <div class="dialog-box">
            <div [innerHTML]="contentHtml"></div>
            <button class="copy-btn" (click)="copyContent()">
              <span class="e-icons e-copy"></span>
            </button>
          </div>
        </div>
        <!-- Path Section -->
        <div class="section">
          <label>JSON Path</label>
          <div class="dialog-box">
            <div [innerHTML]="pathHtml"></div>
            <button class="copy-btn" (click)="copyPath()">
              <span class="e-icons e-copy"></span>
            </button>
          </div>
        </div>
      </div>
    </ejs-dialog>
  `,
  styles: [`

    :root {
      --popup-content-bg: #f0f0f0;
      --popup-key-color: #5C940D;
      --popup-value-color: #1864AB;
    }

    body.dark-theme {
      --popup-content-bg: #01000c57;
      --popup-key-color: #A5D8FF;
      --popup-value-color: #40C057;
    }

    .popup-content {
      font-size: 14px;
    }
    .section {
      margin-bottom: 15px;
    }
    .keyText{
     color: var(--popup-key-color);
    }
    .valueText{
      color: var(--popup-value-color);
    }
    .section label {
      font-weight: 500;
      display: block;
      margin-bottom: 5px;
    }
    .dialog-box {
      font-family: Consolas, monospace;
      position: relative;
      background: var(--popup-content-bg);
      border-radius: 5px;
      padding: 10px;
      overflow-x: auto;
    }
    .dialog-box pre {
      margin: 0;
      line-height: 16px;
    }
    .copy-btn {
      position: absolute;
      top: 5px;
      right: 5px;
      background: transparent;
      border: none;
      cursor: pointer;
      color: #6C757D;
    }

    div::-webkit-scrollbar {
      display: none;
    }
  `],
  encapsulation: ViewEncapsulation.None
})
export class NodePopupComponent {
  @ViewChild('dialog', { static: true }) dialog!: DialogComponent;

  visible = false;
  rawContent = '';
  rawPath = '';

  /** Sanitized HTML for binding */
  contentHtml!: SafeHtml;
  pathHtml!: SafeHtml;

  constructor(private sanitizer: DomSanitizer) {}

  /** Open dialog with new data */
  open({ content, path }: { content: string; path: string }) {
    this.rawContent = content;
    this.rawPath     = path;

    // Generate and sanitize HTML
    this.contentHtml = this.sanitizer.bypassSecurityTrustHtml(
      this.buildContentHtml(this.rawContent)
    );
    this.pathHtml = this.sanitizer.bypassSecurityTrustHtml(
      this.buildPathHtml(this.rawPath)
    );

    this.visible = true;
    this.dialog.show();
  }

  /** Hide dialog */
  hide() {
    this.visible = false;
    this.dialog.hide();
  }

  /** Copy the full, brace‑wrapped JSON block exactly as displayed */
  copyContent(): void {
    const json = this.getFormattedJsonString(this.rawContent);
    navigator.clipboard.writeText(json);
  }

  /** Copy the path, wrapping only the leading 'Root' in { } */
  copyPath(): void {
    const wrapped = this.rawPath.startsWith('Root')
      ? `{Root}${this.rawPath.slice(4)}`
      : this.rawPath;
    navigator.clipboard.writeText(wrapped);
  }

  /** Helper: reconstruct the formatted JSON with braces & commas */
  private getFormattedJsonString(raw: string): string {
    const lines = this.formatJsonLines(raw);
    if (!lines.length) { 
      return `"${raw.trim()}"`; 
    }
    let out = '{\n';
    lines.forEach(({ key, value, hasComma }) => {
      out += `  ${key}: ${value}${hasComma ? ',' : ''}\n`;
    });
    return out + '}';
  }

  /** Build content HTML with key/value coloring and braces */
  private buildContentHtml(raw: string): string {
    const lines = this.formatJsonLines(raw);
    let html = `<div style="padding:5px; overflow-x:auto; font-family:Consolas; font-size:14px;">`;

    if (lines.length === 0) {
      // Single‐line leaf
      html += `<div class="valueText">"${raw.trim()}"</div>`;
    } else {
      html += `<span>{</span>`;
      lines.forEach(({ key, value, hasComma }) => {
        html += `
          <div>
            <span class="keyText"
              style="font-weight:550; margin-left:14px;">
              ${key}
            </span>
            <span style="margin:0 3px;">:</span>
            <span class="valueText">${value}</span>
            ${hasComma ? ',' : ''}
          </div>`;
      });
      html += `<span>}</span>`;
    }

    html += `</div>`;
    return html;
  }

  /** Build path HTML, only wrap the first 'Root' in braces */
  private buildPathHtml(rawPath: string): string {
    const inner = this.addCurlyBracesAroundRoot(rawPath.trim());
    return `<div style="padding:5px; overflow-x:auto; font-family:Consolas; font-size:14px;">
      ${inner}
    </div>`;
  }

  /** Parse raw content into lines of {key,value,hasComma} */
  private formatJsonLines(content: string): JsonLine[] {
    const result: JsonLine[] = [];
    if (!content?.trim()) {
      return result;
    }
    const rawLines = content.split('\n');
    rawLines.forEach((line, idx) => {
      const colon = line.indexOf(':');
      if (colon < 0) {
        return; // skip non key/value lines
      }
      const rawKey = line.slice(0, colon).trim();
      let rawVal   = line.slice(colon + 1).trim();

      // Boolean?
      if (/^(true|false)$/i.test(rawVal)) {
        rawVal = rawVal.toLowerCase();
      }
      // Number?
      else if (!isNaN(parseFloat(rawVal))) {
        /* keep as-is */
      }
      // String
      else {
        const stripped = rawVal.replace(/^"(.*)"$/, '$1');
        rawVal = `"${stripped}"`;
      }

      result.push({
        key: `"${rawKey}"`,
        value: rawVal,
        hasComma: idx < rawLines.length - 1
      });
    });
    return result;
  }

  /** Adds braces only around the 'Root' prefix */
  private addCurlyBracesAroundRoot(path: string): string {
    return path.startsWith('Root')
      ? `{Root}${path.slice(4)}`
      : path;
  }
}
