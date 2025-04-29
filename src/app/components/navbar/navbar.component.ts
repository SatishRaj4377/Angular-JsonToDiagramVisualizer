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
        <button ejs-dropdownbutton [items]="viewItems" content="View" (select)="onViewToggle($event)"></button>
        <button ejs-dropdownbutton [items]="themeItems" content="Theme" (select)="onThemeChange($event)"></button>
      </div>
      <div class="navbar-right">
        <ejs-dropdownlist
          [dataSource]="[{ text:'JSON', value:'json' }, { text:'XML', value:'xml' }]"
          [value]="'json'"
          [fields]="{ text: 'text', value: 'value' }"
          (change)="onEditorTypeChange($event)">
        </ejs-dropdownlist>
      </div>
    </div>
  `,
  styles: `
  /* navbar.component.css */

/* Overall container */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 56px;
  padding: 0 16px;
  background-color: #ffffff;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  font-family: "Segoe UI", sans-serif;
  user-select: none;
}

/* Left side (title + menus) */
.navbar-left {
  display: flex;
  align-items: center;
}

/* App title */
.nav-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-right: 24px;
  color: #333333;
}

/* Syncfusion dropdown buttons */
button[ejs-dropdownbutton] {
  margin-right: 12px;
  min-width: 72px;       /* ensure consistent width */
  padding: 6px 12px;
  font-size: 0.875rem;
}

/* Right side (editor type switch) */
.navbar-right {
  display: flex;
  align-items: center;
}

/* The dropdownlist itself */
.navbar-right ::ng-deep .e-dropdownlist {
  width: 100px;
  font-size: 0.875rem;
}

/* Hover & focus states */
button[ejs-dropdownbutton]:hover,
button[ejs-dropdownbutton]:focus {
  background-color: #f5f5f5;
}

/* Dark‐theme override */
:host-context(.dark-theme) .navbar {
  background-color: #2c2c2c;
  border-bottom-color: #444444;
}

:host-context(.dark-theme) .nav-title,
:host-context(.dark-theme) button[ejs-dropdownbutton] {
  color: #f0f0f0;
}

:host-context(.dark-theme) button[ejs-dropdownbutton]:hover {
  background-color: #3a3a3a;
}

  `
})
export class NavbarComponent {
  navTitle = "{} JSON Diagram Visualizer";
  public fileItems: ItemModel[] = [
    { text: 'New' },
    { text: 'Open' },
    { text: 'Save' }
  ];

  public viewItems: ItemModel[] = [
    { text: 'Zoom In' },
    { text: 'Zoom Out' },
    { text: 'Reset' }
  ];

  public themeItems: ItemModel[] = [
    { text: 'Light' },
    { text: 'Dark' }
  ];

  @Output() fileAction = new EventEmitter<string>();
  @Output() viewToggle = new EventEmitter<string>();
  @Output() themeChange = new EventEmitter<string>();
  @Output() editorTypeChanged = new EventEmitter<string>();

  onFileAction(event: any) {
    this.fileAction.emit(event.item.text); // Emit the selected item text
  }

  onViewToggle(event: any) {
    this.viewToggle.emit(event.item.text); // Emit the selected item text
  }

  onThemeChange(event: any) {
    this.themeChange.emit(event.item.text); // Emit the selected item text
  }

  onEditorTypeChange(event: any) {
    this.editorTypeChanged.emit(event.value); // Emit the changed value
  }
}
