import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { SplitterModule } from '@syncfusion/ej2-angular-layouts';
import { CommonModule } from '@angular/common';
import { EditorComponent } from './components/editor/editor.component';
import { DiagramComponent } from './components/diagram/diagram.component';
import { DiagramData } from './services/diagram-parser.service';
import { NavbarComponent } from './components/navbar/navbar.component';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ FormsModule, CommonModule, SplitterModule, EditorComponent, DiagramComponent, NavbarComponent ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  @ViewChild('leftPanel', { static: true }) leftPanel!: ElementRef<HTMLDivElement>;
  @ViewChild(DiagramComponent) diagramCmp!: DiagramComponent;
  editorType: 'json' | 'xml' = 'json';
  isValid = true;
  diagramData: DiagramData = { nodes: [], connectors: [] };

  private dragging = false;
  private startX = 0;
  private startWidth = 0;

  //#region  Splitter Dragging

  onDragStart(evt: MouseEvent) {
    this.dragging = true;
    this.startX = evt.clientX;
    this.startWidth = this.leftPanel.nativeElement.getBoundingClientRect().width;
    evt.preventDefault();
  }

  @HostListener('document:mousemove', ['$event'])
  onDragging(evt: MouseEvent) {
    if (!this.dragging) return;
    const dx = evt.clientX - this.startX;
    const newWidth = this.startWidth + dx;
    const min = 150, max = window.innerWidth * 0.5;
    this.leftPanel.nativeElement.style.width =
      Math.min(Math.max(newWidth, min), max) + 'px';
  }

  @HostListener('document:mouseup')
  onDragEnd() {
    this.dragging = false;
  }

  //#endregion
  
  onDiagramData(data: DiagramData) {
    this.diagramData = data;
  }

  onFileAction(action: string) { /* import/export logic here */ }
  onViewToggle(opt: string) { /* toggle grid/count/collapse */ }
  onThemeChange(theme: string) { /* swap CSS link or body class */ }
}