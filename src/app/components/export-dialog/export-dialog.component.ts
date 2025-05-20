import {
  Component,
  ViewChild,
  EventEmitter,
  Output,
  ViewEncapsulation
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule, DialogComponent } from '@syncfusion/ej2-angular-popups';
import { TextBoxModule } from '@syncfusion/ej2-angular-inputs';
import { ButtonModule, RadioButtonModule } from '@syncfusion/ej2-angular-buttons';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-export-dialog',
  standalone: true,
  imports: [CommonModule, DialogModule, TextBoxModule, RadioButtonModule, FormsModule, ButtonModule],
  template: `
    <div id="export-dialog">
      <ejs-dialog
        #dialog
        header="Export Options"
        [visible]="visible"
        width="300px"
        [showCloseIcon]="true"
        [isModal]="true"
        (overlayClick)="close()"
      >
        <div class="dialog-content">
          <div>
            <label>File Name</label>
            <ejs-textbox
              #textbox id="textbox"
              [(ngModel)]="fileName"
              placeholder="Enter file name" />
          </div>
          <div style="margin-top:8px;">
            <label>Format</label>
            <div class="radio-buttons">
              <ejs-radiobutton
                name="format"
                label="PNG"
                value="PNG"
                [(ngModel)]="format"
                checked="true"
                cssClass="radio-button" />
              <ejs-radiobutton
                name="format"
                label="JPG"
                value="JPG"
                [(ngModel)]="format" 
                cssClass="radio-button" />
              <ejs-radiobutton
                name="format"
                label="SVG"
                value="SVG"
                [(ngModel)]="format" 
                cssClass="radio-button" />
            </div>
          </div>
          <div class="buttons">
            <button ejs-button isPrimary="true" (click)="confirm()">Export</button>
          </div>
        </div>
      </ejs-dialog>
    </div>
  `,
  styles: [`
    .dialog-content { margin-top: -20px; }
    .dialog-content label { display:block; margin-bottom:4px; margin-top: 18px; }
    .dialog-content .buttons {
      text-align: right;
      margin-top: 16px;
    }
    .dialog-content .buttons button + button {
      margin-left: 18px;
    }
    .radio-button { margin-right: 16px; } 
    .radio-buttons {margin-top: -5px;}
    #textbox > span{
      margin-top : 10px
    }
  `], 
  encapsulation : ViewEncapsulation.None
})
export class ExportDialogComponent {
  @ViewChild('dialog', { static: true }) dialog!: DialogComponent;
  @Output() exportConfirmed = new EventEmitter<{ fileName: string; format: string }>();

  visible = false;
  fileName = 'Diagram';
  format: 'PNG' | 'JPG' | 'SVG' = 'PNG';

  open() {
    this.visible = true;
    this.dialog.show();
  }
  close() {
    this.visible = false;
    this.dialog.hide();
  }
  confirm() {
    this.exportConfirmed.emit({ fileName: this.fileName, format: this.format });
    this.close();
  }
}
