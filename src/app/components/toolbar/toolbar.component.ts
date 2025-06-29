import {
  Component,
  Output,
  EventEmitter,
  ViewEncapsulation,
  ViewChild,
  Input,
  AfterViewInit
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
    ejs-toolbar { 
      margin-right: 12px; border:0;
    }

    .toolbar-search {
      width: 11rem !important; 
      padding-left: 4px !important;
    }
    .toolbar-search .e-input{
      padding:0px !important;
    }
    .e-toolbar{
     border: 0;
    }
     
    body:not(.dark-theme) .e-toolbar .e-toolbar-item .e-tbar-btn{
      background: #343A401A !important;
      border-radius: 3px;
    }

    .diagram-toolbar.e-toolbar .e-toolbar-items {
      background: transparent !important;
      margin: 0;
      padding: 0;
    }
    .e-input-group-icon.counter-icon {
      font-size: .75rem !important;
      padding: 0 8px;
      color: #888;
    }
    .counter-icon.hidden {
      display: none;
    }
    .e-toolbar, .e-toolbar .e-toolbar-items{
      background: transparent !important;
    } 
  `]
})
export class ToolbarComponent implements AfterViewInit {
  @Output() toolClick   = new EventEmitter<'reset'|'fitToPage'|'zoomIn'|'zoomOut'>();
  @Output() searchNode  = new EventEmitter<string>();
  @Output() nextMatch    = new EventEmitter<void>();
  
  @ViewChild('textbox', { static: false }) textbox!: TextBoxComponent;

  private shouldShowCounter = false;
  public toolbarItems: ItemModel[] = [
    { prefixIcon: 'e-icons e-reset',      tooltipText: 'Reset Zoom',      id: 'reset',     cssClass: 'e-flat' },
    { prefixIcon: 'e-icons e-zoom-to-fit', tooltipText: 'Fit To Page',id: 'fitToPage', cssClass: 'e-flat' },
    { prefixIcon: 'e-icons e-zoom-in',     tooltipText: 'Zoom In',    id: 'zoomIn',    cssClass: 'e-flat' },
    { prefixIcon: 'e-icons e-zoom-out',    tooltipText: 'Zoom Out',   id: 'zoomOut',   cssClass: 'e-flat' }
  ];

  // Update the current search result index and show the counter if needed
  private _current = 0;
  @Input()
  set current(val: number) {
    this._current = val;
    this.updateCounter();
  }

  // Update the total number of search results and show the counter if needed
  private _total = 0;
  @Input()
  set total(val: number) {
    this._total = val;
    this.updateCounter();
  }


  ngAfterViewInit() {
    // Add search icon to the left
    this.textbox.addIcon('prepend', 'e-icons e-search');

    // Add counter to the right
    this.textbox.addIcon('append', 'counter-icon');

    // Set initial counter value
    this.updateCounter();
  }

  // Method to update the counter
  private updateCounter() {
    const counterEl = document.querySelector('.counter-icon');
    if (counterEl) {
      counterEl.textContent = this.shouldShowCounter ? `${this._current} / ${this._total}` : '';
      counterEl.classList.toggle('hidden', !this.shouldShowCounter);
    }
  }

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
    if (val.trim() != ""){
      this.shouldShowCounter = true;
    }else{
      this.shouldShowCounter = false;
    }
    this.searchNode.emit(val.trim());
  }

  onNext() {
    // emit the event to find the next match on enter key press
    this.nextMatch.emit();
  }

  // clear the search box text and reset the counter
  clearSearchText() {
    if (this.textbox) {
      this.textbox.value = '';
    }
    this.shouldShowCounter = false;
    this.total = 0;
    this.current = 0;
  }
}
