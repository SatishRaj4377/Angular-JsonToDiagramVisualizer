import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import {
  DiagramComponent as EJ2Diagram,
  DiagramModule,
  NodeModel,
  ConnectorModel,
  DiagramTools,
  LayoutModel,
  Annotation,
  LineDistributionService,
  ShapeAnnotation,
  Node,
  SnapSettingsModel,
  SnapConstraints,
  SnappingService
} from '@syncfusion/ej2-angular-diagrams';
import {
  DataBindingService,
  HierarchicalTreeService,
  PrintAndExportService,
  NodeConstraints,
  ConnectorConstraints,
  ConnectionPointOrigin
} from '@syncfusion/ej2-angular-diagrams';
import { DiagramNode } from '../../services/diagram-parser.service';
import themeService from '../../services/theme.service';

@Component({
  selector: 'app-diagram',
  standalone: true,
  imports: [DiagramModule],
  providers: [
    DataBindingService,
    HierarchicalTreeService,
    PrintAndExportService,
    LineDistributionService, 
    SnappingService
  ],
  template: `
    <ejs-diagram
      id="diagram"
      #diagramRef
      width="100%"
      height="100%"
      backgroundColor="#F8F9FA"
      [tool]="diagramTools"
      [layout]="layout"
      [getNodeDefaults]="getNodeDefaults.bind(this)"
      [getConnectorDefaults]="getConnectorDefaults.bind(this)"
      [nodes]="nodes"
      [connectors]="connectors" 
      [snapSettings]="snapSettings" 
      [scrollSettings]="{scrollLimit: 'Infinity'}"
      (click)="onDiagramClick($event)">
    </ejs-diagram>
  `,
  styles: `
    :host { display:block; width:100%; height:100%; }
    #diagramcontent {
      overflow: hidden !important;
    }
  `,
  encapsulation: ViewEncapsulation.None,
})
export class DiagramComponent implements OnInit {
  @Input() nodes: NodeModel[] = [];
  @Input() connectors: ConnectorModel[] = [];
  @Output() nodeClicked = new EventEmitter<{ content: string, path: string }>();
  @Output() searchStats = new EventEmitter<{ current: number, total: number }>();

  @ViewChild('diagramRef', { static: false, read: EJ2Diagram }) public diagram!: EJ2Diagram;

  public diagramTools!: DiagramTools;
  public layout!: LayoutModel;
  public snapSettings!: SnapSettingsModel ;
  orientationIndex = 0;
  isGraphCollapsed = false;
  showExpandCollapseIcon = true;
  showChildItemsCount = true;
  currentOrientation: 'LeftToRight' | 'RightToLeft' | 'TopToBottom' | 'BottomToTop' = 'LeftToRight';
  orientations: Array<'LeftToRight'|'TopToBottom'|'RightToLeft'|'BottomToTop'> = ['LeftToRight','TopToBottom','RightToLeft','BottomToTop'];
  currentThemeSettings = themeService.getCurrentThemeSettings();
  private matchIds: string[] = [];
  private matchIndex = 0;

  ngOnInit(): void {
    this.diagramTools = DiagramTools.ZoomPan | DiagramTools.SingleSelect;
    this.snapSettings = { constraints: SnapConstraints.ShowLines, horizontalGridlines: { lineColor: this.currentThemeSettings.gridlinesColor}, verticalGridlines: { lineColor: this.currentThemeSettings.gridlinesColor} }
    this.layout = {
      type: 'HierarchicalTree',
      orientation: this.currentOrientation,
      horizontalSpacing: 30,
      verticalSpacing: 100,
      connectionPointOrigin: ConnectionPointOrigin.DifferentPoint
    };
  }

  // This method initializes and returns a NodeModel with default settings depending on whether it is a main root, leaf, or a regular node.
  // It sets visual properties such as shape, size, and style based on node type and adjusts constraints and expand icons appropriately.
  getNodeDefaults(node: NodeModel): NodeModel {
    const isLeaf = (node as DiagramNode).additionalInfo?.isLeaf === true;
    const isMainRoot = node.id === 'main-root';
    const fontSpec = '12px Consolas';
    const lineHeight = 16;
    const padding = 10;
    const expandIconWidth = 36;
    const cornerRadius = 3;

    node.constraints = NodeConstraints.Default & ~(
      NodeConstraints.Rotate |
      NodeConstraints.Select |
      NodeConstraints.Resize |
      NodeConstraints.Delete |
      NodeConstraints.Drag
    );

    node.shape = {
      type: 'Basic',
      shape: isMainRoot ? 'Ellipse' : 'Rectangle',
      cornerRadius
    };
    node.style = { fill: this.currentThemeSettings.nodeFillColor, strokeColor: this.currentThemeSettings.nodeStrokeColor, strokeWidth: 1.5 };

    if (isMainRoot) {
      node.width = 40; node.height = 40;
    } else {
      const { width, height } = this.calculateNodeSize(
        node, fontSpec, padding, lineHeight, expandIconWidth
      );
      node.width = width; node.height = height;
    }

    if (node.annotations) {
      if (isLeaf) {
        this.layoutLeafAnnotations(node, fontSpec, padding, lineHeight);
      } else if (node.annotations.length === 2) {
        const keyAnn = node.annotations[0];
        const countAnn = node.annotations[1];
        keyAnn.style = { fontSize:12, fontFamily:'Consolas', color: this.currentThemeSettings.textKeyColor };
        keyAnn.offset = { x: this.showChildItemsCount ? 0 : 0.5, y: 0.5 };
        keyAnn.margin = {
          left: this.showChildItemsCount
            ? padding
            : (this.showExpandCollapseIcon ? -padding : 0)
        };
        keyAnn.horizontalAlignment =
          this.showChildItemsCount ? 'Left' : 'Center';

        if (this.showChildItemsCount) {
          countAnn.visibility = true;
          countAnn.style = { fontSize:12, fontFamily:'Consolas', color: this.currentThemeSettings.textValueColor  };
          countAnn.offset = { x:1, y:0.5 };
          countAnn.horizontalAlignment = 'Right';
          countAnn.margin = {
            right: padding + (this.showExpandCollapseIcon ? expandIconWidth : 0)
          };
        } else {
          countAnn.visibility = false;
        }
      }
    }

    if (!isLeaf && !isMainRoot && this.showExpandCollapseIcon) {
      const expandIcon = this.createIcon('Minus', expandIconWidth, node.height!);
      const collapseIcon = this.createIcon('Plus',  expandIconWidth, node.height!);
      this.updateIconOffset(expandIcon);
      this.updateIconOffset(collapseIcon);
      node.expandIcon = expandIcon;
      node.collapseIcon = collapseIcon;
    } else {
      node.expandIcon = { shape: 'None' } as any;
      node.collapseIcon = { shape: 'None' } as any;
    }

    return node;
  }

  // Calculates node size based on annotations
  private calculateNodeSize(
    node: NodeModel, fontSpec: string,
    padding: number, lineHeight: number, iconW: number
  ) {
    const anns = node.annotations || [];
    const isLeaf = (node as DiagramNode).additionalInfo?.isLeaf === true;
    const ctx = document.createElement('canvas').getContext('2d')!;
    ctx.font = fontSpec;
    let maxTextWidth = 0, linesCount = 0;

    if (isLeaf) {
      const keys = anns.filter(a => a.id?.startsWith('Key'));
      const vals = anns.filter(a => a.id?.startsWith('Value'));
      linesCount = keys.length;
      for (let i = 0; i < keys.length; i++) {
        const text = keys[i].content + '  ' + (vals[i]?.content||'');
        maxTextWidth = Math.max(maxTextWidth, ctx.measureText(text).width);
      }
      if (keys.length === 0) {
        maxTextWidth = Math.max(
          maxTextWidth,
          ctx.measureText(anns[0]?.content||'').width
        );
      }
    } else if (anns.length === 2) {
      const text = (anns[0] as Annotation).content +
                   '  ' + anns[1].content;
      maxTextWidth = ctx.measureText(text).width;
      linesCount = 1;
    }

    const width  = Math.max(maxTextWidth + padding*2 + (isLeaf ? 0 : iconW), 50);
    const height = Math.max(linesCount*lineHeight + padding*2, 40);
    return { width, height };
  }

  // Position the annotations on the leaf nodes
  private layoutLeafAnnotations(
    node: NodeModel, fontSpec: string,
    padding: number, lineHeight: number
  ) {
    const anns = node.annotations as ShapeAnnotation[];
    const total = anns.filter(a => a.id?.startsWith('Key')).length;
    const spacingY = total>0 ? 1/(total+1) : 0.5;
    let line = 1;
    const ctx = document.createElement('canvas').getContext('2d')!;
    ctx.font = fontSpec;

    for (let i=0; i<anns.length; i++) {
      const ann = anns[i];
      if (!ann.id) continue;
      const y = spacingY * line;

      if (ann.id.startsWith('Key')) {
        const w = ctx.measureText(ann.content).width;
        ann.style = {
          fontSize:12, fontFamily:'Consolas', color:this.currentThemeSettings.textKeyColor
        };
        ann.offset = { x:(w/2+padding)/node.width!, y };
      } else {
        ann.style = {
          fontSize:12, fontFamily:'Consolas', color:this.currentThemeSettings.textValueColor
        };
        const prev = anns[i-1];
        const keyW = prev ? ctx.measureText(prev.content).width : 0;
        const valW = ctx.measureText(ann.content).width;
        const keyX = (keyW/2)/node.width!;
        const valX = ((keyX*2)+(valW/2)/node.width!)+(padding+8)/node.width!;
        if (prev){
          ann.offset = { x: valX, y };
          ann.content = this.formatDisplayValue(ann.content);
        }
        line++;
      }
      this.applyAnnotationStyle(ann, ann?.content);
    }
  }

  // Format the display value for annotations
  private formatDisplayValue(raw: string): string {
    const num = parseFloat(raw);
    if (!isNaN(num) || /^(true|false)$/i.test(raw)) {
      return raw.toLowerCase();
    }
    return raw.startsWith('"') && raw.endsWith('"')
      ? raw
      : `"${raw}"`;
  }

  // Apply annotation styles based on the annotation type
  private applyAnnotationStyle(annotation: ShapeAnnotation, rawValue: string) {
    if (annotation.id.startsWith("Key")) {
      annotation.style.color = this.currentThemeSettings.textKeyColor;
    } else if (annotation.id.startsWith("Value")) {
      annotation.style.color = this.determineValueStyle(rawValue);
    } else if (annotation.id.startsWith("Count")) {
      annotation.style.color = this.currentThemeSettings.textValueColor;
    }
  }

  // Determine the style for the annotation text based on its type
  private determineValueStyle(rawValue: string) {
      if (!isNaN(parseFloat(rawValue))) {
          return this.currentThemeSettings.numericColor;
      } else if (rawValue.toLowerCase() === 'true' || rawValue.toLowerCase() === 'false') {
          return (rawValue.toLowerCase() === 'true') ? this.currentThemeSettings.booleanColor : "red";
      }
      return this.currentThemeSettings.textValueColor;
  }

  // Creates expand and collapse icon for node
  private createIcon(
    shape: 'Plus'|'Minus', w: number, h: number
  ) {
    return {
      shape, width: w, height: h, cornerRadius:3,
      margin: { right: w/2 },
      fill:this.currentThemeSettings.expandIconFillColor, borderColor:this.currentThemeSettings.expandIconBorder, iconColor: this.currentThemeSettings.expandIconColor
    };
  }

  // Update the icon offset based on the current orientation of the diagram
  private updateIconOffset(icon: any) {
    if (this.currentOrientation==='TopToBottom') {
      icon.offset = { x:1, y:0.5 };
    } else if (this.currentOrientation==='RightToLeft') {
      icon.offset = { x:0.5, y:0 };
    } else if (this.currentOrientation==='LeftToRight') {
      icon.offset = { x:0.5, y:1 };
    } else {
      icon.offset = { x:1, y:0.5 };
    }
  }

  // sets the default values for the connectors in the diagram
  getConnectorDefaults(connector: ConnectorModel): ConnectorModel {
    connector.constraints =
      ConnectorConstraints.Default & ConnectorConstraints.Select;
    connector.type = 'Orthogonal';
    connector.style = { strokeColor:this.currentThemeSettings.connectorStrokeColor, strokeWidth:2 };
    connector.cornerRadius = 15;
    connector.targetDecorator = { shape:'None' };
    return connector;
  }

  // refreshes the diagram layout and fits it to the page
  refreshLayout() {
    this.diagram.refresh();
    this.diagram.fitToPage({
      region: 'Content', canZoomIn: true
    });
  }

  // Triggers popup that displays popup
  public onDiagramClick(args: any) {
    const e = args.element;
    if (e?.data?.actualdata && e.data?.path && args.actualObject) {
      this.nodeClicked.emit({
        content: e.data.actualdata,
        path:    e.data.path
      });
    }
  }

  // Rotates the layout of the diagram between different orientations
  public rotateLayout(): void {
    this.orientationIndex =
      (this.orientationIndex + 1) % this.orientations.length;
    const ori = this.orientations[this.orientationIndex];
    this.currentOrientation = ori;
    this.layout.orientation = ori;
    this.diagram.layout.orientation = ori;
    this.diagram.nodes.forEach(n => {
      if (n.expandIcon)   this.updateIconOffset(n.expandIcon);
      if (n.collapseIcon) this.updateIconOffset(n.collapseIcon);
    });
    this.diagram.fitToPage();
  }

  // Toggles the collapse state of the diagram nodes
  public toggleCollapse(): void {
    const nodes = this.diagram.nodes;
    if (this.isGraphCollapsed) {
      nodes.forEach(n => n.isExpanded = true);
      this.isGraphCollapsed = false;
    } else {
      (nodes as Node[]).forEach(n => {
        const root = !n.inEdges || n.inEdges.length===0;
        if (root) {
          if (!n.expandIcon || n.expandIcon.shape==='None') {
            (n.outEdges||[]).forEach(eid => {
              const c = this.diagram.connectors.find(c=>c.id===eid);
              const targ = c && nodes.find(x=>x.id===c.targetID);
              if (targ) { targ.isExpanded = false; }
            });
          } else {
            n.isExpanded = false;
          }
        }
      });
      this.isGraphCollapsed = true;
    }
  }

  // searches for nodes in the diagram based on a query string
  public searchNodes(query: string) {
    // reset
    this.matchIds = [];
    this.matchIndex = 0;

    // collect all matching node IDs
    (this.diagram.nodes as DiagramNode[]).forEach(n => {
      const text = String(n.data?.actualdata || '').toLowerCase();
      if (query && text.includes(query.toLowerCase())) {
        this.matchIds.push(n.id);
      }
      // reset style on every node
      const elem = document.getElementById(n.id + '_content');
      if (elem) {
        elem.setAttribute('stroke', this.currentThemeSettings.nodeStrokeColor);
        elem.setAttribute('fill', this.currentThemeSettings.nodeFillColor);
      }
    });

    // highlight *all* matches
    this.matchIds.forEach(id => {
      const elem = document.getElementById(id + '_content');
      if (elem) {
        elem.setAttribute('stroke', this.currentThemeSettings.highlightStrokeColor);
        elem.setAttribute('stroke-width', '2');
        elem.setAttribute('fill', this.currentThemeSettings.highlightFillColor);
      }
    });

    // focus the very first one (if any)
    this.focusCurrent();

    // tell toolbar how many we found
    this.searchStats.emit({
      current: this.matchIds.length ? 1 : 0,
      total: this.matchIds.length
    });
  }

  /** bring the current match into center and give it “focus” style */
  private focusCurrent() {
    if (!this.matchIds.length) { return; }
    const id = this.matchIds[this.matchIndex];
    const node = this.diagram.getObject(id) as any;
    if (!node) { return; }

    // re‐highlight only the focused one differently
    this.matchIds.forEach((nid, idx) => {
      const elem = document.getElementById(nid + '_content');
      if (elem) {
        elem.setAttribute('stroke-width', '2');
        if (idx === this.matchIndex) {
          elem.setAttribute('fill', this.currentThemeSettings.highlightFocusColor);
          elem.setAttribute('stroke', this.currentThemeSettings.highlightStrokeColor);
        } else {
          elem.setAttribute('fill', this.currentThemeSettings.highlightFillColor);
          elem.setAttribute('stroke', this.currentThemeSettings.highlightStrokeColor);
        }
      }
    });

    // center it in the viewport
    if (node.wrapper && node.wrapper.bounds)
      this.diagram.bringToCenter(node.wrapper.bounds);
  }

  /** called by parent when Enter is pressed */
  public focusNext() {
    if (!this.matchIds.length) { return; }
    this.matchIndex = (this.matchIndex + 1) % this.matchIds.length;
    this.focusCurrent();
    this.searchStats.emit({
      current: this.matchIndex + 1,
      total: this.matchIds.length
    });
  }
  
  // toggles the visibility of grid lines in the diagram
  public toggleGridLines(): void {
    const snap = this.diagram?.snapSettings;
    if (!snap || typeof snap.constraints === 'undefined') return;
    const current = snap.constraints;
    if ((current & SnapConstraints.ShowLines) === SnapConstraints.ShowLines) {
      snap.constraints = current & ~SnapConstraints.ShowLines;
    } else {
      snap.constraints = current | SnapConstraints.ShowLines;
    }
  }
  
  // toggles the visibility of child item count annotation in the diagram nodes
  public toggleChildCount(): void {
    this.showChildItemsCount = !this.showChildItemsCount;
    this.diagram.refresh();
  }
  
  // toggles the visibility of expand/collapse icons in the diagram nodes
  public toggleExpandIcons(): void {
    this.showExpandCollapseIcon = !this.showExpandCollapseIcon;
    this.diagram.refresh();
  }

  // update the diagram based on the selected theme
  setTheme(theme: 'light' | 'dark') {
    themeService.setTheme(theme);
    this.currentThemeSettings = themeService.getCurrentThemeSettings();

    this.diagram.backgroundColor = this.currentThemeSettings.backgroundColor;
    const snapSettings = this.diagram.snapSettings;
    if (snapSettings && snapSettings.verticalGridlines && snapSettings.horizontalGridlines) {
      snapSettings.verticalGridlines.lineColor = this.currentThemeSettings.gridlinesColor;
      snapSettings.horizontalGridlines.lineColor = this.currentThemeSettings.gridlinesColor;
    }
    this.refreshLayout();
  }
}
