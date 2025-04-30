import { Component, EventEmitter, Output } from '@angular/core';
import { DropDownButtonModule, ItemModel } from '@syncfusion/ej2-angular-splitbuttons';
import { DropDownListModule } from '@syncfusion/ej2-angular-dropdowns';

@Component({
  selector: 'app-navbar',
  imports: [DropDownButtonModule, DropDownListModule],
  template: `
    <div class="navbar">
      <div class="navbar-left">
        <span class="nav-title">{{navTitle}}</span>
        <button ejs-dropdownbutton [items]="fileItems" content="File" (select)="onFileAction($event)"></button>
        <button ejs-dropdownbutton [items]="viewItems" content="View" (select)="onToggleView($event)"></button>
        <button ejs-dropdownbutton [items]="themeItems" content="Theme" (select)="onThemeChange($event)"></button>
      </div>
      <div class="navbar-right">
        <ejs-dropdownlist
          [width]="'70px'"
          [dataSource]="editorTypes"
          [value]="selectedEditorType"
          [fields]="{ text: 'text', value: 'value' }"
          (change)="onEditorTypeChange($event)">
        </ejs-dropdownlist>
      </div>
    </div>
  `,
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  navTitle = "{} JSON Diagram Visualizer";

  public fileItems: ItemModel[] = [
    { text: 'Import', iconCss: 'e-icons e-import' },
    { text: 'Export', iconCss: 'e-icons e-export' },
  ];

  public viewItems: ItemModel[] = [
    { text: 'Show Grid', id: 'view-grid', iconCss: 'e-icons e-check' },
    { text: 'Item Count', id: 'view-count', iconCss: 'e-icons e-check' },
    { text: 'Show Expand/Collapse', id: 'expand-collapse', iconCss: 'e-icons e-check' }
  ];

  public themeItems: ItemModel[] = [
    { text: 'Light', id: 'light', iconCss: 'e-icons e-check' },
    { text: 'Dark', id: 'dark', iconCss: '' }
  ];

  selectedTheme = 'Light';

  public editorTypes = [
    { text: 'JSON', value: 'json' },
    { text: 'XML', value: 'xml' }
  ];

  selectedEditorType = 'json';

  @Output() fileAction = new EventEmitter<string>();
  @Output() viewToggle = new EventEmitter<string>();
  @Output() themeChange = new EventEmitter<string>();
  @Output() editorTypeChanged = new EventEmitter<string>();

  onFileAction(event: any) {
    this.fileAction.emit(event.item.id);
  }

  onToggleView(event: any) {
    this.viewItems = this.viewItems.map(item => ({
      ...item,
      iconCss: item.id === event.item.id ? (item.iconCss === 'e-icons e-check' ? '' : 'e-icons e-check') : item.iconCss
    }));
    this.viewToggle.emit(event.item.id);
  }

  onThemeChange(event: any) {
    const theme = event.item.text;
    this.themeItems = this.themeItems.map(item => ({
      ...item,
      iconCss: item.text === theme ? 'e-icons e-check' : ''
    }));
    this.selectedTheme = theme;
    this.themeChange.emit(event.item.id);
  }

  onEditorTypeChange(event: any) {
    this.editorTypeChanged.emit(event.value);
  }
}