import { Component, Input, ViewChild, ViewEncapsulation, OnChanges, SimpleChanges } from '@angular/core';
import { DiagramComponent as EJ2Diagram, DiagramModule, NodeModel, ConnectorModel, DiagramTools, LayoutModel } from '@syncfusion/ej2-angular-diagrams';
import { DataBindingService, HierarchicalTreeService, PrintAndExportService } from '@syncfusion/ej2-angular-diagrams';

@Component({
  selector: 'app-diagram',
  standalone: true,
  imports: [DiagramModule],
  providers: [
    DataBindingService,
    HierarchicalTreeService,
    PrintAndExportService
  ],
  template: `
    <ejs-diagram
      #diagramRef
      width="100%"
      height="100%"
      [tool]="diagramTools"
      [layout]="layout"
      [getNodeDefaults]="getNodeDefaults"
      [getConnectorDefaults]="getConnectorDefaults"
      [nodes]="nodes"
      [connectors]="connectors" (loaded)="onDiagramLoaded()">
    </ejs-diagram>
  `,
  encapsulation: ViewEncapsulation.None,
  styles: [`
    :host { display:block; width:100%; height:100%; }
  `]
})
export class DiagramComponent implements OnChanges {
  /** Input from parent */
  @Input() nodes: NodeModel[] = [];
  @Input() connectors: ConnectorModel[] = [];

  /** Underlying EJ2 Diagram instance */
  @ViewChild('diagramRef', { static: false, read: EJ2Diagram })
  public diagram!: EJ2Diagram;

  diagramTools: DiagramTools =
    DiagramTools.ZoomPan | DiagramTools.SingleSelect;

  layout : LayoutModel = {
    type: 'HierarchicalTree',
    orientation: 'LeftToRight',
    horizontalSpacing: 30,
    verticalSpacing: 100,
    enableAnimation: false
  };

  // ngAfterViewInit() {
  //   if (this.diagram) {
  //     // this.diagram.fitToPage({
  //     //   mode: 'Page',
  //     //   region: 'Content',
  //     //   canZoomIn: true
  //     // });
  //   }
  // }

  onDiagramLoaded() {
    this.diagram.doLayout();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['nodes'] || changes['connectors']) {

      if (this.diagram) {
        this.diagram.dataBind();
        this.diagram.doLayout();
        
      }
    }
  }

  /** Simple defaults; feel free to replace with your full logic */
  getNodeDefaults(node: NodeModel): NodeModel {
    node.style = { fill: '#e5f3ff', strokeColor: '#1a73e8', strokeWidth: 1 };
    node.annotations = node.annotations || [];
    return node;
  }

  getConnectorDefaults(connector: ConnectorModel): ConnectorModel {
    connector.style = { strokeColor: '#6b7280', strokeWidth: 2 };
    connector.targetDecorator = { shape: 'None' };
    return connector;
  }
}
