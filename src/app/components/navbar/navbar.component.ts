import { Component, EventEmitter, inject, Output } from '@angular/core';
import { DropDownButtonModule, ItemModel } from '@syncfusion/ej2-angular-splitbuttons';
import { DropDownListModule } from '@syncfusion/ej2-angular-dropdowns';
import { EditorService } from '../../services/editor.service';

@Component({
  selector: 'app-navbar',
  imports: [DropDownButtonModule, DropDownListModule],
  template: `
    <div class="navbar">
      <div class="navbar-left">
        <img src="assets/img/logo.svg" alt="Logo" class="nav-logo"/>
        <span class="nav-title">{{navTitle}}</span>
        <button ejs-dropdownbutton [items]="fileItems" content="File" (select)="onFileAction($event)"></button>
        <button ejs-dropdownbutton [items]="viewItems" content="View" (select)="onToggleView($event)"></button>
        <button ejs-dropdownbutton [items]="themeItems" content="Theme" (select)="onThemeChange($event)"></button>
      </div>
      <div class="navbar-right">
        <ejs-dropdownlist
          id="editorType"
          [width]="'90px'"
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
  navTitle = "JSON To Diagram";
  public fileItems: ItemModel[] = [
    { text: 'Import', id: 'import' , iconCss: 'e-icons e-import' },
    { text: 'Export', id: 'export',  iconCss: 'e-icons e-export' },
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
  public editorTypes = [
    { text: 'JSON', value: 'json' },
    { text: 'XML', value: 'xml' }
  ];
  selectedTheme = 'Light';
  selectedEditorType = 'json';
  editorService = inject(EditorService);

  @Output() fileAction = new EventEmitter<string>();
  @Output() viewToggle = new EventEmitter<string>();
  @Output() themeChange = new EventEmitter<string>();
  @Output() editorTypeChanged = new EventEmitter<'json' | 'xml'>();

  // emits the file menu event based on the option selected
  onFileAction(event: any) {
    this.fileAction.emit(event.item.id);
  }

  // emits the view menu event based on the option selected
  onToggleView(event: any) {
    this.viewItems = this.viewItems.map(item => ({
      ...item,
      iconCss: item.id === event.item.id ? (item.iconCss === 'e-icons e-check' ? '' : 'e-icons e-check') : item.iconCss
    }));
    this.viewToggle.emit(event.item.id);
  }

  // emits the theme change event based on the theme selected
  onThemeChange(event: any) {
    const theme = event.item.text;
    // toggle the check icon for the selected theme item
    this.themeItems = this.themeItems.map(item => ({
      ...item,
      iconCss: item.text === theme ? 'e-icons e-check' : ''
    }));
    this.selectedTheme = theme;
    this.themeChange.emit(event.item.id);
  }

  // emits the editor type change event based on the editor type selected
  onEditorTypeChange(event: any) {
    if (event.value === 'json' || event.value === 'xml') {
      // update the editor language based on the selected editor type
      this.editorService.setLanguage(event.value);
      this.editorTypeChanged.emit(event.value);
      // update the nav title based on the selected editor type
      this.navTitle = `${(event.value as string).toUpperCase()} To Diagram`;
    }
  }
}