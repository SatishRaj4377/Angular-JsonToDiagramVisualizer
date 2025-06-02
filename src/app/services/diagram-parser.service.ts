import { Injectable } from '@angular/core';


export interface Annotation {
  id?: string;
  content: string;
  [key: string]: any;
}

export interface NodeData {
  path: string;
  title: string;
  actualdata: string;
  displayContent?: any;
}

export interface DiagramNode {
  id: string;
  width?: number;
  height?: number;
  annotations: Annotation[];
  additionalInfo: {
    isLeaf: boolean;
    mergedContent?: string;
  };
  data: NodeData;
  [key: string]: any;
}


export interface DiagramConnector {
  id: string;
  sourceID: string;
  targetID: string;
  [key: string]: any;
}

export interface DiagramData {
  nodes: DiagramNode[];
  connectors: DiagramConnector[];
}

@Injectable({ providedIn: 'root' })
export class DiagramParserService {
  private readonly DEFAULT_NODE_WIDTH = 150;
  private readonly DEFAULT_NODE_HEIGHT = 50;

  constructor() {}

  /**
   * Parse a JSON object into diagram nodes/connectors.
   */
  public processJson(data: any): DiagramData {
    const diagramData: DiagramData = { nodes: [], connectors: [] };
    if (!data || typeof data !== 'object' || Array.isArray(data) || Object.keys(data).length === 0) {
      return diagramData;
    }

    // 1. Determine root ID
    let rootNodeId = 'root';
    const keys = Object.keys(data);
    if (keys.length === 1 && data[keys[0]] && typeof data[keys[0]] === 'object') {
      rootNodeId = keys[0];
    }

    // 2. Split primitives vs objects
    const nonLeafKeys: string[] = [];
    const primitiveKeys: string[] = [];
    keys.forEach(k => {
      const v = data[k];
      if (v !== null && typeof v === 'object') nonLeafKeys.push(k);
      else primitiveKeys.push(k);
    });

    let rootCreated = false;

    // 3. If there are primitives at root, merge into a leaf node
    if (primitiveKeys.length > 0) {
      rootCreated = true;
      rootNodeId = this.convertUnderScoreToPascalCase(rootNodeId);

      // build key/value annotations
      const leafAnnotations: Annotation[] = primitiveKeys.flatMap(key => {
        const raw = data[key] == null ? '' : String(data[key]);
        const anns: Annotation[] = [{ id: `Key_${key}`, content: `${key}:` }];
        anns.push({ id: `Value_${key}`, content: raw });
        return anns;
      });

      const mergedContent = primitiveKeys
        .map(key => `${key}: ${data[key]}`)
        .join('\n');

      diagramData.nodes.push({
        id: rootNodeId,
        width: this.DEFAULT_NODE_WIDTH,
        height: this.DEFAULT_NODE_HEIGHT,
        annotations: leafAnnotations,
        additionalInfo: { isLeaf: true },
        data: { path: 'Root', title: mergedContent, actualdata: mergedContent }
      });
    }

    // 4. Create a node for each non-leaf property
    nonLeafKeys.forEach(key => {
      if (this.isEmpty(data[key])) return;
      const nodeId = this.convertUnderScoreToPascalCase(key);
      const childCount = this.getObjectLength(data[key]);
      const annotations: Annotation[] = [{ content: key }];
      if (childCount > 0) {
        annotations.push({ content: `{${childCount}}` });
      }

      diagramData.nodes.push({
        id: nodeId,
        width: this.DEFAULT_NODE_WIDTH,
        height: this.DEFAULT_NODE_HEIGHT,
        annotations,
        additionalInfo: { isLeaf: false, mergedContent: `${key} {${childCount}}` },
        data: {
          path: `Root.${key}`,
          title: key,
          actualdata: key,
          displayContent: { key: [key], displayValue: childCount }
        }
      });

      // connect from root if rootCreated
      if (rootCreated) {
        diagramData.connectors.push({
          id: `connector-${rootNodeId}-${nodeId}`,
          sourceID: rootNodeId,
          targetID: nodeId
        });
      }

      // recurse
      this.processNestedData(
        data[key],
        nodeId,
        diagramData.nodes,
        diagramData.connectors,
        `Root.${key}`,
        key
      );
    });

    // 5. If multiple roots, inject a dummy main-root
    this.checkMultiRoot(diagramData.nodes, diagramData.connectors);
    return diagramData;
  }

  /**
   * Recursive helper for JSON parser.
   */
  private processNestedData(
    element: any,
    parentId: string,
    nodes: DiagramNode[],
    connectors: DiagramConnector[],
    parentPath: string,
    keyName: string
  ): void {
    if (!element || typeof element !== 'object') return;

    // --- Handle arrays separately ---
    if (Array.isArray(element)) {
      element.forEach((item, index) => {
        if (item == null) return;
        const baseId = this.convertUnderScoreToPascalCase(`${parentId}-${index}`);

        if (item && typeof item === 'object' && !Array.isArray(item)) {
          // Merge primitives in object
          const primitiveFields = Object.entries(item)
            .filter(([, v]) => v === null || typeof v !== 'object')
            .map(([k, v]) => `${k}: ${v}`);

          if (primitiveFields.length) {
            const leafAnnotations = primitiveFields.flatMap(field => {
              const [k, ...rest] = field.split(':');
              const val = rest.join(':').trim();
              const anns: Annotation[] = [{ id: `Key_${baseId}_${k}`, content: `${k}:` }];
              anns.push({ id: `Value_${baseId}_${k}`, content: val });
              return anns;
            });
            const mergedContent = primitiveFields.join('\n');

            nodes.push({
              id: baseId,
              width: this.DEFAULT_NODE_WIDTH,
              height: this.DEFAULT_NODE_HEIGHT,
              annotations: leafAnnotations,
              additionalInfo: { isLeaf: true },
              data: {
                path: `${parentPath}/${keyName}[${index}]`,
                title: mergedContent,
                actualdata: mergedContent
              }
            });
            connectors.push({
              id: `connector-${parentId}-${baseId}`,
              sourceID: parentId,
              targetID: baseId
            });
          }

          // Recurse into any child objects/arrays
          Object.entries(item)
            .filter(([, v]) => v && typeof v === 'object' && !this.isEmpty(v))
            .forEach(([childKey, childValue]) => {
              const childId = this.convertUnderScoreToPascalCase(
                `${baseId}-${childKey}`
              );
              const childCount = this.getObjectLength(childValue);
              const childAnns: Annotation[] = [{ content: childKey }];
              if (childCount > 0) childAnns.push({ content: `{${childCount}}` });

              nodes.push({
                id: childId,
                width: this.DEFAULT_NODE_WIDTH,
                height: this.DEFAULT_NODE_HEIGHT,
                annotations: childAnns,
                additionalInfo: { isLeaf: false, mergedContent: `${childKey} {${childCount}}` },
                data: {
                  path: `${parentPath}/${keyName}[${index}].${childKey}`,
                  title: childKey,
                  actualdata: childKey
                }
              });
              connectors.push({
                id: `connector-${baseId}-${childId}`,
                sourceID: baseId,
                targetID: childId
              });
              this.processNestedData(
                childValue,
                childId,
                nodes,
                connectors,
                `${parentPath}/${keyName}[${index}].${childKey}`,
                childKey
              );
            });

        } else {
          // primitive in array
          const content = String(item);
          nodes.push({
            id: baseId,
            width: this.DEFAULT_NODE_WIDTH,
            height: this.DEFAULT_NODE_HEIGHT,
            annotations: [{ content }],
            additionalInfo: { isLeaf: true },
            data: {
              path: `${parentPath}/${keyName}[${index}]`,
              title: content,
              actualdata: content
            }
          });
          connectors.push({
            id: `connector-${parentId}-${baseId}`,
            sourceID: parentId,
            targetID: baseId
          });
        }
      });
      return;
    }

    // --- Handle plain objects ---

    const entries = Object.entries(element);
    const primKeys = entries.filter(([, v]) => v === null || typeof v !== 'object').map(([k]) => k);
    const objKeys  = entries.filter(([, v]) => v && typeof v === 'object').map(([k]) => k);

    // Merge any direct primitives into one leaf under this node
    if (primKeys.length) {
      const leafId = this.convertUnderScoreToPascalCase(`${parentId}-leaf`);
      const leafAnnotations = primKeys.flatMap(key => {
        const raw = String((element as any)[key]);
        const anns: Annotation[] = [{ id: `Key_${leafId}_${key}`, content: `${key}:` }];
        anns.push({ id: `Value_${leafId}_${key}`, content: raw });
        return anns;
      });
      const mergedContent = primKeys
        .map(key => `${key}: ${(element as any)[key]}`)
        .join('\n');

      nodes.push({
        id: leafId,
        width: this.DEFAULT_NODE_WIDTH,
        height: this.DEFAULT_NODE_HEIGHT,
        annotations: leafAnnotations,
        additionalInfo: { isLeaf: true },
        data: {
          path: `${parentPath}.leaf`,
          title: mergedContent,
          actualdata: mergedContent
        }
      });
      connectors.push({
        id: `connector-${parentId}-${leafId}`,
        sourceID: parentId,
        targetID: leafId
      });
    }

    // Recurse into nested objects
    objKeys.forEach(prop => {
      const childValue = (element as any)[prop];
      if (this.isEmpty(childValue)) return;
      const childCount = this.getObjectLength(childValue);
      const childId    = this.convertUnderScoreToPascalCase(`${parentId}-${prop}`);
      const childAnns: Annotation[] = [{ content: prop }];
      if (childCount > 0) childAnns.push({ content: `{${childCount}}` });

      nodes.push({
        id: childId,
        width: this.DEFAULT_NODE_WIDTH,
        height: this.DEFAULT_NODE_HEIGHT,
        annotations: childAnns,
        additionalInfo: { isLeaf: false, mergedContent: `${prop} {${childCount}}` },
        data: {
          path: `${parentPath}.${prop}`,
          title: prop,
          actualdata: prop
        }
      });
      connectors.push({
        id: `connector-${parentId}-${childId}`,
        sourceID: parentId,
        targetID: childId
      });
      this.processNestedData(
        childValue,
        childId,
        nodes,
        connectors,
        `${parentPath}.${prop}`,
        prop
      );
    });
  }

  /**
   * Count children: one merged leaf + one per array + one per object.
   */
  private getObjectLength(element: any): number {
    if (!element || typeof element !== 'object') return 0;
    if (Array.isArray(element)) return element.length;

    const e = Object.entries(element);
    const prims  = e.filter(([,v]) => v === null || typeof v !== 'object');
    const arrays = e.filter(([,v]) => Array.isArray(v));
    const objs   = e.filter(([,v]) => v && typeof v === 'object' && !Array.isArray(v));
    return (prims.length > 0 ? 1 : 0) + arrays.length + objs.length;
  }

  /**
   * PascalCase converter for keys/IDs.
   */
  private convertUnderScoreToPascalCase(input: string): string {
    if (!input) return input;
    return input
      .split('-')
      .map(seg =>
        seg.split('_')
           .map((word, idx) =>
             idx === 0
               ? word.toLowerCase()
               : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
           )
           .join('')
      )
      .join('-');
  }

  /**
   * If more than one root exists, add a dummy "main-root" and connect.
   */
  private checkMultiRoot(nodes: DiagramNode[], connectors: DiagramConnector[]): void {
    const ids = nodes.map(n => n.id);
    const hasParent = new Set(connectors.map(c => c.targetID));
    const roots = ids.filter(id => !hasParent.has(id));
    if (roots.length > 1) {
      const mainRootId = 'main-root';
      nodes.push({
        id: mainRootId,
        width: 40,
        height: 40,
        annotations: [{ content: '' }],
        additionalInfo: { isLeaf: false },
        data: { path: 'MainRoot', title: 'Main Artificial Root', actualdata: '' }
      });
      roots.forEach(r => {
        connectors.push({
          id: `connector-${mainRootId}-${r}`,
          sourceID: mainRootId,
          targetID: r
        });
      });
    }
  }

  private isEmpty(value: any): boolean {
    if (Array.isArray(value)) return value.length === 0;
    if (value && typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }  
}
