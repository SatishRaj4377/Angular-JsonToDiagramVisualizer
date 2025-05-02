import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditorComponent } from './components/editor/editor.component';
import { DiagramComponent } from './components/diagram/diagram.component';
import { DiagramData } from './services/diagram-parser.service';
import { NavbarComponent } from './components/navbar/navbar.component';
import { FormsModule } from '@angular/forms';
import { NodePopupComponent } from './components/node-popup/node-popup.component';
import { HamburgerComponent } from './components/hamburger/hamburger.component';
import { ExportDialogComponent } from './components/export-dialog/export-dialog.component';
import { FileFormats } from '@syncfusion/ej2-angular-diagrams';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ FormsModule, CommonModule, EditorComponent, DiagramComponent, NavbarComponent, NodePopupComponent, HamburgerComponent, ExportDialogComponent ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  @ViewChild('leftPanel', { static: true }) leftPanel!: ElementRef<HTMLDivElement>;
  @ViewChild(DiagramComponent) diagramComp!: DiagramComponent;
  @ViewChild(EditorComponent, { static: true }) editorComp!: EditorComponent;
  @ViewChild(NodePopupComponent) popup!: NodePopupComponent;
  @ViewChild('exportDialog', { static: true }) exportDialog!: ExportDialogComponent;

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
    this.editorComp.layoutEditor();
  }

  @HostListener('document:mouseup')
  onDragEnd() {
    this.dragging = false;
  }
  //#endregion
  
  onDiagramData(data: DiagramData) {
    this.diagramData = data;
    setTimeout(() => this.diagramComp.refreshLayout());
  }

  onFileAction(action: string) { /* import/export logic here */ }
  onViewToggle(opt: string) { /* toggle grid/count/collapse */ }
  onThemeChange(theme: string) { /* swap CSS link or body class */ }

  onNodeClick(data: { content: string; path: string }) {
    this.popup.open(data);
  }

  onExport(evt: { fileName: string; format: string }) {
    this.diagramComp.diagram.exportDiagram({
      format: evt.format as FileFormats,
      fileName: evt.fileName
    });
  }
}