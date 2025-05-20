import {
  Component,
  Output,
  EventEmitter,
  ViewEncapsulation,
  ViewChild,
  Input
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ToolbarModule,
  ClickEventArgs,
  ItemModel
} from '@syncfusion/ej2-angular-navigations';
import {
  TextBoxComponent,
  TextBoxModule
} from '@syncfusion/ej2-angular-inputs';

@Component({
  selector: 'app-toolbar',
  imports: [CommonModule, ToolbarModule, TextBoxModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="diagram-toolbar">
      <ejs-toolbar
        [overflowMode]="'Extended'"
        [items]="toolbarItems"
        (clicked)="onToolClicked($event)">
      </ejs-toolbar>

      <span class="hit-counter" *ngIf="total > 0">
        {{ current }} / {{ total }}
      </span>

      <ejs-textbox
        #textbox
        cssClass="toolbar-search"
        placeholder="Search Node"
        (input)="onSearch($event)"
        (keydown.enter)="onNext()"/>
    </div>
  `,
  styles: [`
    .diagram-toolbar { display: flex; align-items: center; }
    .hit-counter {
      margin: 0 8px;
      font-family: Consolas;
      font-size: 12px;
    }
    ejs-toolbar { 
      margin-right: 12px; border:0;
    }

    .toolbar-search {
      width: 180px; 
    }

    .e-toolbar{
     border: 0;
    }
     
    .e-toolbar .e-toolbar-item .e-tbar-btn{
      background: #343A401A !important;
      border-radius: 3px;
    }

    .diagram-toolbar.e-toolbar .e-toolbar-items {
      background: transparent !important;
      margin: 0;
      padding: 0;
    }
  `]
})
export class ToolbarComponent {
  @Output() toolClick   = new EventEmitter<'reset'|'fitToPage'|'zoomIn'|'zoomOut'>();
  @Output() searchNode  = new EventEmitter<string>();
  @Output() nextMatch    = new EventEmitter<void>();

  @Input() total = 0;     // total hits
  @Input() current = 0;   // current focused hit (1-based)

  @ViewChild('textbox', { static: false }) textbox!: TextBoxComponent;

  public toolbarItems: ItemModel[] = [
    { prefixIcon: 'e-icons e-reset',      tooltipText: 'Reset',      id: 'reset',     cssClass: 'e-flat' },
    { prefixIcon: 'e-icons e-zoom-to-fit', tooltipText: 'Fit To Page',id: 'fitToPage', cssClass: 'e-flat' },
    { prefixIcon: 'e-icons e-zoom-in',     tooltipText: 'Zoom In',    id: 'zoomIn',    cssClass: 'e-flat' },
    { prefixIcon: 'e-icons e-zoom-out',    tooltipText: 'Zoom Out',   id: 'zoomOut',   cssClass: 'e-flat' }
  ];

  // emits the event based on the toolbar item clicked
  onToolClicked(ev: ClickEventArgs) {
    this.toolClick.emit(ev.item.id as any);
  }

  // emits the event based on the search box value changed
  onSearch(ev: any) {
    let val = '';
    // Syncfusion ChangeEventArgs from ejs-textbox:
    if ('value' in ev && ev.value != null) {
      val = String(ev.value);
    }
    // Or native input event:
    else if (ev.target && (ev.target as HTMLInputElement).value != null) {
      val = (ev.target as HTMLInputElement).value;
    }
    this.searchNode.emit(val.trim());
  }

  onNext() {
    this.nextMatch.emit();
  }

  clearSearchText() {
    if (this.textbox) {
      this.textbox.value = '';
    }
  }
}
