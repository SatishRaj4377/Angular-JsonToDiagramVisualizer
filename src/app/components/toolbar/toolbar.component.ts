import {
  Component,
  Output,
  EventEmitter,
  ViewEncapsulation
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ToolbarModule,
  ClickEventArgs,
  ItemModel
} from '@syncfusion/ej2-angular-navigations';
import {
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
      <ejs-textbox
        cssClass="toolbar-search"
        placeholder="Search Node"
        (input)="onSearch($event)" />
    </div>
  `,
  styles: [`
    .diagram-toolbar {
      display: flex;
      align-items: center;
      z-index: 10;
    }
    ejs-toolbar { 
      margin-right: 12px; border:0;
      borer: 0;
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

  public toolbarItems: ItemModel[] = [
    { prefixIcon: 'e-icons e-reset',      tooltipText: 'Reset',      id: 'reset',     cssClass: 'e-flat' },
    { prefixIcon: 'e-icons e-zoom-to-fit', tooltipText: 'Fit To Page',id: 'fitToPage', cssClass: 'e-flat' },
    { prefixIcon: 'e-icons e-zoom-in',     tooltipText: 'Zoom In',    id: 'zoomIn',    cssClass: 'e-flat' },
    { prefixIcon: 'e-icons e-zoom-out',    tooltipText: 'Zoom Out',   id: 'zoomOut',   cssClass: 'e-flat' }
  ];

  onToolClicked(ev: ClickEventArgs) {
    this.toolClick.emit(ev.item.id as any);
  }

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
}
