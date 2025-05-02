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
import { ToolbarComponent } from './components/toolbar/toolbar.component';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ FormsModule, CommonModule, EditorComponent, DiagramComponent, NavbarComponent, NodePopupComponent, HamburgerComponent, ExportDialogComponent, ToolbarComponent],
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

  onFileAction(action: string) {
    if (action === 'import') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,.xml';
      input.onchange = evt => {
        const file = (evt.target as HTMLInputElement).files![0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          const text = reader.result as string;
          // update the Monaco editor…
          this.editorComp.monacoEditorComponent.editor?.setValue(text);
          // re‐parse & re‐layout the diagram
          this.editorComp.onCodeChange();
        };
        reader.readAsText(file);
      };
      input.click();
    } else {
      // export current editor content
      const text      = this.editorComp.monacoEditorComponent.editor?.getValue() || " ";
      const ext       = this.editorComp.editorType;
      const blob      = new Blob([text], { type: 'text/plain' });
      const link      = document.createElement('a');
      link.href       = URL.createObjectURL(blob);
      link.download   = `Diagram.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // handle View → Grid / Count / Expand‑Collapse
  onViewToggle(opt: string) {
    switch (opt) {
      case 'view-grid':
        this.diagramComp.toggleGridLines();
        break;
      case 'view-count':
        this.diagramComp.toggleChildCount();
        break;
      case 'expand-collapse':
        this.diagramComp.toggleExpandIcons();
        break;
    }
    this.diagramComp.refreshLayout();
  }

  // handle Theme → Light / Dark
  onThemeChange(theme: string) {
    document.body.classList.toggle('dark-theme', theme === 'dark');
    // switch Monaco theme
    // this.editorComp.monacoEditorComponent.editor.ksetMonacoTheme(theme === 'dark' ? 'vs-dark' : 'vs');
    // update diagram colors (you can wire through your themeService)
    // this.diagram.setTheme(theme);
    this.diagramComp.refreshLayout();
  }


  onNodeClick(data: { content: string; path: string }) {
    this.popup.open(data);
  }

  onExport(evt: { fileName: string; format: string }) {
    this.diagramComp.diagram.exportDiagram({
      format: evt.format as FileFormats,
      fileName: evt.fileName
    });
  }

  handleToolbar(action: 'reset'|'fitToPage'|'zoomIn'|'zoomOut') {
    switch(action) {
      case 'reset':
        this.diagramComp.diagram.reset(); break;
      case 'fitToPage':
        this.diagramComp.diagram.fitToPage(); break;
      case 'zoomIn':
        this.diagramComp.diagram.zoomTo({ type:'ZoomIn', zoomFactor:0.2 }); break;
      case 'zoomOut':
        this.diagramComp.diagram.zoomTo({ type:'ZoomOut', zoomFactor:0.2 }); break;
    }
  }
  

}