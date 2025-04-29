import { Component, ViewChild } from '@angular/core';
import { DiagramComponent } from './components/diagram/diagram.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { EditorComponent } from './components/editor/editor.component';
import { StatusBarComponent } from './components/status-bar/status-bar.component';

@Component({
  selector: 'app-root',
  imports: [NavbarComponent, DiagramComponent, EditorComponent, StatusBarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  @ViewChild(DiagramComponent) diagramCmp !: DiagramComponent;
  // editorType: 'json'|'xml' = 'json';
  editorType = 'json';
  isValid = true;
  diagramModel = { nodes: [], connectors: [] };

  // updateDiagram(model) { this.diagramModel = model; }
  onFileAction(action: string) { /* import/export logic here */ }
  onViewToggle(opt: string) { /* toggle grid/count/collapse */ }
  onThemeChange(theme: string) { /* swap CSS link or body class */ }
}