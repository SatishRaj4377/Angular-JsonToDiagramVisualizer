import {
  Component,
  Output,
  EventEmitter,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DropDownButtonModule,
  DropDownButtonComponent,
  MenuEventArgs,
  ItemModel
} from '@syncfusion/ej2-angular-splitbuttons';

@Component({
  selector: 'app-hamburger',
  standalone: true,
  imports: [CommonModule, DropDownButtonModule],
  template: `
    <button ejs-dropdownbutton
      #hamburgerBtn
      iconCss="e-icons e-menu"
      cssClass="e-caret-hide"
      [items]="menuItems"
      (select)="onSelect($event)">
    </button>
  `,
  styles: `
    button[ejs-dropdownbutton]{
     background: #343A401A;
    }
    button[ejs-dropdownbutton] .e-icons.e-menu {
      font-size: 16px;
    }
    :host-context(.dark-theme) button[ejs-dropdownbutton]{
      background-color: #3A3A3A;
    }
  `
})
export class HamburgerComponent {
  @Output() exportImage   = new EventEmitter<void>();
  @Output() rotateLayout  = new EventEmitter<void>();
  @Output() collapseGraph = new EventEmitter<void>();

  // Grab the Angular wrapper instance
  @ViewChild('hamburgerBtn', { static: true })
  private ddBtn!: DropDownButtonComponent;

  private isCollapsed = false;

  public menuItems: ItemModel[] = [
    { text: 'Export as Image', id: 'exportImage', iconCss: 'e-icons e-export' },
    { text: 'Rotate Layout',   id: 'rotateLayout',  iconCss: 'e-icons e-refresh' },
    { text: 'Collapse Graph',  id: 'collapseGraph', iconCss: 'e-icons e-collapse-2' }
  ];

  onSelect(args: MenuEventArgs) {
    switch (args.item.id) {
      case 'exportImage':
        this.exportImage.emit();
        break;
      case 'rotateLayout':
        this.rotateLayout.emit();
        break;
      case 'collapseGraph':
        this.collapseGraph.emit();
        this.toggleCollapseItem();
        break;
    }
  }

  private toggleCollapseItem() {
    const item = this.menuItems.find(i => i.id === 'collapseGraph')!;
    this.isCollapsed = !this.isCollapsed;
    item.text    = this.isCollapsed ? 'Expand Graph'  : 'Collapse Graph';
    item.iconCss = this.isCollapsed ? 'e-icons e-expand' : 'e-icons e-collapse-2';

    // Apply back to the Angular wrapper and rebind
    this.ddBtn.items = this.menuItems;
    this.ddBtn.dataBind();
  }
}
