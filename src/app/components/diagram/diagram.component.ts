import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { DiagramComponent as EJ2Diagram, DiagramModule, NodeModel, ConnectorModel, DiagramTools, LayoutModel, Annotation, LineDistributionService, ShapeAnnotationModel, ShapeAnnotation } from '@syncfusion/ej2-angular-diagrams';
import { DataBindingService, HierarchicalTreeService, PrintAndExportService, NodeConstraints, ConnectorConstraints, ConnectionPointOrigin } from '@syncfusion/ej2-angular-diagrams';
import { DiagramNode } from '../../services/diagram-parser.service';

@Component({
  selector: 'app-diagram',
  standalone: true,
  imports: [DiagramModule],
  providers: [ DataBindingService, HierarchicalTreeService, PrintAndExportService, LineDistributionService ],
  template: `
    <ejs-diagram
      #diagramRef
      width="100%"
      height="100%"
      [tool]="diagramTools"
      [layout]="layout"
      [getNodeDefaults]="getNodeDefaults.bind(this)"
      [getConnectorDefaults]="getConnectorDefaults.bind(this)"
      [nodes]="nodes"
      [connectors]="connectors"
      >
    </ejs-diagram>
  `,
  styles: [`
    :host { display:block; width:100%; height:100%; }
  `]
})
export class DiagramComponent implements OnInit{
  public layout?: LayoutModel;
  public diagramTools?: DiagramTools;

  @Input() nodes: NodeModel[] = [];
  @Input() connectors: ConnectorModel[] = [];

  @ViewChild('diagramRef', { static: false, read: EJ2Diagram }) public diagram!: EJ2Diagram;

  showExpandCollapseIcon = true;
  showChildItemsCount = true;
  currentOrientation: 'LeftToRight' | 'RightToLeft' | 'TopToBottom' | 'BottomToTop' = 'LeftToRight';
  
  ngOnInit(): void {
    this.diagramTools = DiagramTools.ZoomPan | DiagramTools.SingleSelect;
    this.layout =  {
      type: 'HierarchicalTree',
      orientation: this.currentOrientation,
      horizontalSpacing: 30,
      verticalSpacing: 100,
      connectionPointOrigin: ConnectionPointOrigin.DifferentPoint
    };
  }

  getNodeDefaults(node: NodeModel): NodeModel {
    const isLeaf = (node as DiagramNode).additionalInfo?.isLeaf === true;
    const isMainRoot = node.id === 'main-root';
    const fontSpec = '12px Consolas';
    const lineHeight = 16;
    const padding = 10;
    const expandIconWidth = 36;
    const cornerRadius = 3;

    // Base constraints
    node.constraints = NodeConstraints.Default & ~(
      NodeConstraints.Rotate |
      NodeConstraints.Select |
      NodeConstraints.Resize |
      NodeConstraints.Delete |
      NodeConstraints.Drag
    );

    // Shape and style
    node.shape = { type: 'Basic', shape: isMainRoot ? 'Ellipse' : 'Rectangle', cornerRadius };
    node.style = { fill: "aqua", strokeColor: "black", strokeWidth: 1.5 };

    // Main root fixed size
    if (isMainRoot) {
      node.width = 40;
      node.height = 40;
    } else {
      // Calculate required size
      const { width, height } = this.calculateNodeSize(node, fontSpec, padding, lineHeight, expandIconWidth);
      node.width = width;
      node.height = height;
    }

    // Annotations styling
    if (node.annotations) {
      if (isLeaf) {
        this.layoutLeafAnnotations(node, fontSpec, padding, lineHeight);
      } else if (node.annotations.length === 2) {
        // non-leaf key/count
        const keyAnn = node.annotations[0];
        const countAnn = node.annotations[1];
        keyAnn.style = { fontSize: 12, fontFamily: 'Consolas', color: "black" };
        keyAnn.offset = { x: this.showChildItemsCount ? 0 : 0.5, y: 0.5 };
        keyAnn.margin = { left: this.showChildItemsCount ? padding : (this.showExpandCollapseIcon ? -padding : 0) };
        keyAnn.horizontalAlignment = this.showChildItemsCount ? 'Left' : 'Center';

        if (this.showChildItemsCount) {
          countAnn.visibility = true;
          countAnn.style = { fontSize: 12, fontFamily: 'Consolas', color: "black" };
          countAnn.offset = { x: 1, y: 0.5 };
          countAnn.horizontalAlignment = 'Right';
          countAnn.margin = { right: padding + (this.showExpandCollapseIcon ? expandIconWidth : 0) };
        } else {
          countAnn.visibility = false;
        }
      }
    }

    // Expand/collapse icons
    if (!isLeaf && !isMainRoot && this.showExpandCollapseIcon) {
      const expandIcon = this.createIcon('Minus', expandIconWidth, node.height);
      const collapseIcon = this.createIcon('Plus', expandIconWidth, node.height);
      this.updateIconOffset(expandIcon);
      this.updateIconOffset(collapseIcon);
      node.expandIcon = expandIcon;
      node.collapseIcon = collapseIcon;
    } else {
      node.expandIcon = { shape: 'None' };
      node.collapseIcon = { shape: 'None' };
    }

    return node;
  }

  private calculateNodeSize(
    node: NodeModel,
    fontSpec: string,
    padding: number,
    lineHeight: number,
    iconW: number
  ) {
    let maxTextWidth = 0;
    let linesCount = 0;
    const isLeaf = (node as DiagramNode).additionalInfo?.isLeaf === true;
    const anns = node.annotations || [];
    const ctx = document.createElement('canvas').getContext('2d')!;
    ctx.font = fontSpec;

    if (isLeaf) {
      const keys = anns.filter(a => a.id?.startsWith('Key'));
      const values = anns.filter(a => a.id?.startsWith('Value'));
      linesCount = keys.length;
      for (let i = 0; i < keys.length; i++) {
        const text = keys[i].content + '  ' + (values[i]?.content || '');
        maxTextWidth = Math.max(maxTextWidth, ctx.measureText(text).width);
      }
      if (keys.length === 0) {
        maxTextWidth = Math.max(maxTextWidth, ctx.measureText(anns[0]?.content || '').width);
      }
    } else if (anns.length === 2) {
      const text = (anns[0] as Annotation).content + "  " +  anns[1].content;
      maxTextWidth = ctx.measureText(text).width;
      linesCount = 1;
    }

    const width = Math.max(maxTextWidth + padding * 2 + (isLeaf ? 0 : iconW), 50);
    const height = Math.max(linesCount * lineHeight + padding * 2, 40);
    return { width, height };
  }

  private layoutLeafAnnotations(node: NodeModel, fontSpec: string, padding: number, lineHeight: number) {
    const anns = node.annotations!;
    const total = anns.filter(a => a.id?.startsWith('Key')).length;
    const spacingY = total > 0 ? 1 / (total + 1) : 0.5;
    let currentLine = 1;
    const ctx = document.createElement('canvas').getContext('2d')!;
    ctx.font = fontSpec;

    for (let i = 0; i < anns.length; i++) {
      const ann = anns[i] as ShapeAnnotation;
      if (!ann.id) continue;
      const offsetY = spacingY * currentLine;

      if (ann.id.startsWith('Key')) {
        // key
        ann.style = { fontSize: 12, fontFamily: fontSpec.split(' ')[1], color: "black" };
        const keyWidth = ctx.measureText(ann.content).width;
        const keyOffsetX = (keyWidth / 2 + padding) / node.width!;
        ann.offset = { x: keyOffsetX, y: offsetY };
      } else {
        // value
        ann.style = { fontSize: 12, fontFamily: fontSpec.split(' ')[1], color: "black" };
        const prevAnnotations = anns[i - 1] as ShapeAnnotation;
        const keyWidth = prevAnnotations ? ctx.measureText(prevAnnotations.content).width : 0;
        const valWidth = ctx.measureText(ann.content).width;
        const keyOffsetX = (keyWidth / 2) / node.width!;
        const valueOffsetX = ((keyOffsetX * 2) + (valWidth / 2) / node.width!) + (padding + 8) / node.width!;
        if (prevAnnotations){
          ann.offset = { x: valueOffsetX, y: offsetY };
          ann.content = this.formatDisplayValue(ann.content);
        }
        currentLine++;
      }
    }
  }

  private formatDisplayValue(raw: string): string {
    const num = parseFloat(raw);
    if (!isNaN(num) || /^(true|false)$/i.test(raw)) {
      return raw.toLowerCase();
    }
    return raw.startsWith('"') && raw.endsWith('"') ? raw : `"${raw}"`;
  }

  private createIcon(shape: 'Plus' | 'Minus', iconWidth : number, iconHeight: number) {
    return {
      shape,
      width: iconWidth,
      height: iconHeight,
      cornerRadius: 3,
      fill: "gray",
      borderColor:"black",
      iconColor: "black",
      margin: {right: iconWidth / 2}
    };
  }

  private updateIconOffset(icon: any) {
    if (this.currentOrientation === 'TopToBottom') {
      icon.offset = { x: 1, y: 0.5 };
    } else if (this.currentOrientation === 'RightToLeft') {
      icon.offset = { x: 0, y: 0.5 };
    } else if (this.currentOrientation === 'LeftToRight') {
      icon.offset = { x: 0.5, y: 1 };
    } else {
      icon.offset = { x: 0.5, y: 0 };
    }
  }

  getConnectorDefaults(connector: ConnectorModel): ConnectorModel {
    connector.constraints = ConnectorConstraints.Default | ConnectorConstraints.ReadOnly;
    connector.type = 'Orthogonal';
    connector.style = { strokeColor: "black", strokeWidth: 2 };
    connector.cornerRadius = 15;
    connector.targetDecorator = { shape: 'None' };
    return connector;
  }

  refreshLayout() {
    this.diagram.dataBind();
    this.diagram.doLayout();
    this.diagram.fitToPage({ mode: 'Page', region: 'Content', canZoomIn: true });
  }
}
