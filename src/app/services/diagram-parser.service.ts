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
  displayContent?: any;    // only for non-leaf JSON nodes
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
        if (raw !== '') {
          anns.push({ id: `Value_${key}`, content: raw });
        }
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
              if (val) {
                anns.push({ id: `Value_${baseId}_${k}`, content: val });
              }
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
            .filter(([, v]) => v && typeof v === 'object')
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
        if (raw) anns.push({ id: `Value_${leafId}_${key}`, content: raw });
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

  /**
   * Parse an XML string into the same diagram structure.
   */
  public processXml(xmlString: string): DiagramData {
    const wrapped = `<__root__>${xmlString}</__root__>`;
    const xmlDoc = new DOMParser().parseFromString(wrapped, 'application/xml');
    if (xmlDoc.getElementsByTagName('parsererror').length) {
      console.error('XML parse error');
      return { nodes: [], connectors: [] };
    }

    const allEls = Array.from(xmlDoc.documentElement.children);
    const nodes: DiagramNode[] = [];
    const connectors: DiagramConnector[] = [];

    // Group top-level
    const topGroups = this.xmlGroupByTag(allEls);
    const primitives: Element[] = [];
    const complexes: Element[] = [];
    const arrays: { tag: string; items: Element[] }[] = [];

    Object.entries(topGroups).forEach(([tag, items]) => {
      if (items.length > 1)               arrays.push({ tag, items });
      else if (items[0].children.length === 0) primitives.push(items[0]);
      else                                 complexes.push(items[0]);
    });

    // Merge simple top-level primitives
    let mergedRootId: string | null = null;
    if (primitives.length) {
      mergedRootId = 'RootMerged';
      const ann: Annotation[] = [];
      const content: string[] = [];
      primitives.forEach(el => {
        const k = el.tagName;
        const v = el.textContent!.trim();
        ann.push({ id: `Key_${k}`, content: `${k}:` });
        ann.push({ id: `Value_${k}`, content: this.xmlFmt(v) });
        content.push(`${k}: ${this.xmlFmt(v)}`);
      });
      nodes.push({
        id: mergedRootId,
        width: this.DEFAULT_NODE_WIDTH,
        height: this.DEFAULT_NODE_HEIGHT,
        annotations: ann,
        additionalInfo: { isLeaf: true },
        data: {
          path: 'Root',
          title: content.join('\n'),
          actualdata: content.join('\n')
        }
      });
    }

    // Recurse into single nested
    complexes.forEach((el, i) => {
      const id = this.xmlPascal(el.tagName) + i;
      const { nodes: nn, connectors: cc } = this.xmlProc(
        el, id, mergedRootId, el.tagName, `Root.${el.tagName}`
      );
      nodes.push(...nn);
      connectors.push(...cc);
    });

    // Handle arrays
    arrays.forEach(a => {
      this.xmlEmitArrayBlock(a.tag, a.items, mergedRootId, 'Root', nodes, connectors);
    });

    // Inject dummy main-root if needed
    const allIds      = nodes.map(n => n.id);
    const hasIncoming = new Set(connectors.map(c => c.targetID));
    const roots       = allIds.filter(id => !hasIncoming.has(id));
    if (roots.length > 1) {
      const mr = 'main-root';
      nodes.push({
        id: mr,
        width: 40,
        height: 40,
        annotations: [{ content: '' }],
        additionalInfo: { isLeaf: false },
        data: { path: 'MainRoot', title: '', actualdata: '' }
      });
      roots.forEach(r => connectors.push({
        id: `connector-${mr}-${r}`,
        sourceID: mr,
        targetID: r
      }));
    }

    return { nodes, connectors };
  }

  /** Group elements by tagName */
  private xmlGroupByTag(elems: Element[]): Record<string, Element[]> {
    return elems.reduce((acc, el) => {
      (acc[el.tagName] ||= []).push(el);
      return acc;
    }, {} as Record<string, Element[]>);
  }

  /** Pascal‐case an XML tag */
  private xmlPascal(s: string): string {
    return s.replace(/(^\w|[-_]\w)/g, m => m.replace(/[-_]/, '').toUpperCase());
  }

  /** Format a text node value */
  private xmlFmt(v: string): string {
    if (/^(true|false)$/i.test(v)) return v.toLowerCase();
    if (!isNaN(Number(v))) return v;
    return `"${v}"`;
  }

  /**
   * Recursive XML processor.
   */
  private xmlProc(
    el: Element,
    nodeId: string,
    parentId: string | null,
    keyName: string,
    path: string
  ): { nodes: DiagramNode[]; connectors: DiagramConnector[] } {
    const nodes: DiagramNode[] = [];
    const connectors: DiagramConnector[] = [];
    const kids = Array.from(el.children);

    // a) Pure leaf
    if (!kids.length) {
      const t = el.textContent!.trim();
      nodes.push({
        id: nodeId,
        width: this.DEFAULT_NODE_WIDTH,
        height: this.DEFAULT_NODE_HEIGHT,
        annotations: [{ content: `${keyName}: ${this.xmlFmt(t)}` }],
        additionalInfo: { isLeaf: true },
        data: { path, title: `${keyName}: ${this.xmlFmt(t)}`, actualdata: `${keyName}: ${this.xmlFmt(t)}` }
      });
      if (parentId) {
        connectors.push({ id: `connector-${parentId}-${nodeId}`, sourceID: parentId, targetID: nodeId });
      }
      return { nodes, connectors };
    }

    // b) Group children
    const groups  = this.xmlGroupByTag(kids);
    const leafEls = [] as Element[];
    const complexEls = [] as Element[];
    const arrayEls   = [] as { tag: string; items: Element[] }[];

    Object.entries(groups).forEach(([tag, items]) => {
      if (items.length > 1)                    arrayEls.push({ tag, items });
      else if (items[0].children.length === 0) leafEls.push(items[0]);
      else                                     complexEls.push(items[0]);
    });

    // c) Child count
    const displayCount = complexEls.length + arrayEls.length + (leafEls.length ? 1 : 0);

    // d) Folder node
    const ann = [{ content: keyName }];
    if (displayCount) ann.push({ content: `{${displayCount}}` });
    nodes.push({
      id: nodeId,
      width: this.DEFAULT_NODE_WIDTH,
      height: this.DEFAULT_NODE_HEIGHT,
      annotations: ann,
      additionalInfo: { isLeaf: false },
      data: { path, title: keyName, actualdata: keyName }
    });
    if (parentId) {
      connectors.push({ id: `connector-${parentId}-${nodeId}`, sourceID: parentId, targetID: nodeId });
    }

    // e) Merge primitive children
    if (leafEls.length) {
      const leafId = `${nodeId}-leaf`;
      const la: Annotation[] = [];
      const lc: string[] = [];
      leafEls.forEach(ch => {
        const k = ch.tagName, v = ch.textContent!.trim();
        la.push({ id: `Key_${k}`, content: `${k}:` });
        la.push({ id: `Value_${k}`, content: this.xmlFmt(v) });
        lc.push(`${k}: ${this.xmlFmt(v)}`);
      });
      nodes.push({
        id: leafId,
        width: this.DEFAULT_NODE_WIDTH,
        height: this.DEFAULT_NODE_HEIGHT,
        annotations: la,
        additionalInfo: { isLeaf: true },
        data: { path: `${path}.leaf`, title: lc.join('\n'), actualdata: lc.join('\n') }
      });
      connectors.push({ id: `connector-${nodeId}-${leafId}`, sourceID: nodeId, targetID: leafId });
    }

    // f) Arrays
    arrayEls.forEach(a => this.xmlEmitArrayBlock(a.tag, a.items, nodeId, path, nodes, connectors));

    // g) Complex recurse
    complexEls.forEach((ch, i) => {
      const cid = `${nodeId}-${this.xmlPascal(ch.tagName)}${i}`;
      const { nodes: nn, connectors: cc } = this.xmlProc(
        ch, cid, nodeId, ch.tagName, `${path}.${ch.tagName}`
      );
      nodes.push(...nn);
      connectors.push(...cc);
    });

    return { nodes, connectors };
  }

  /**
   * Emit array block for XML.
   */
  private xmlEmitArrayBlock(
    tag: string,
    items: Element[],
    parentId: string | null,
    parentPath: string,
    nodes: DiagramNode[],
    connectors: DiagramConnector[]
  ): void {
    // 1) Folder for entire array
    const parentNodeId = parentId
      ? `${parentId}-${this.xmlPascal(tag)}`
      : this.xmlPascal(tag);
    nodes.push({
      id: parentNodeId,
      width: this.DEFAULT_NODE_WIDTH,
      height: this.DEFAULT_NODE_HEIGHT,
      annotations: [
        { content: tag },
        { content: `{${items.length}}` }
      ],
      additionalInfo: { isLeaf: false },
      data: {
        path: `${parentPath}.${tag}`,
        title: tag,
        actualdata: tag
      }
    });
    if (parentId) {
      connectors.push({
        id: `connector-${parentId}-${parentNodeId}`,
        sourceID: parentId,
        targetID: parentNodeId
      });
    }
  
    // 2) Primitive‑only array?
    if (items.every(it => it.children.length === 0)) {
      items.forEach((it, idx) => {
        const leafId = `${parentNodeId}-${idx}`;
        const txt    = it.textContent!.trim();
        const f      = this.xmlFmt(txt);
        nodes.push({
          id: leafId,
          width: this.DEFAULT_NODE_WIDTH,
          height: this.DEFAULT_NODE_HEIGHT,
          annotations: [{ content: f }],
          additionalInfo: { isLeaf: true },
          data: {
            path: `${parentPath}.${tag}[${idx}]`,
            title: f,
            actualdata: f
          }
        });
        connectors.push({
          id: `connector-${parentNodeId}-${leafId}`,
          sourceID: parentNodeId,
          targetID: leafId
        });
      });
      return;
    }
  
    // 3) “Object‑array” (all items are flat objects) ?
    const isObjectArray = items.every(it => {
      const ch = Array.from(it.children);
      return Object.values(this.xmlGroupByTag(ch))
        .every(arr => arr.length === 1 && arr[0].children.length === 0);
    });
    if (isObjectArray) {
      items.forEach((it, idx) => {
        const leafId = `${parentNodeId}-${idx}`;
        const ann: Annotation[] = [];
        const lc: string[]      = [];
        // merge each primitive field
        Array.from(it.children).forEach(ch => {
          const k = ch.tagName, v = ch.textContent!.trim();
          ann.push({ id: `Key_${k}`,   content: `${k}:` });
          ann.push({ id: `Value_${k}`, content: this.xmlFmt(v) });
          lc.push(`${k}: ${this.xmlFmt(v)}`);
        });
        nodes.push({
          id: leafId,
          width: this.DEFAULT_NODE_WIDTH,
          height: this.DEFAULT_NODE_HEIGHT,
          annotations: ann,
          additionalInfo: { isLeaf: true },
          data: {
            path: `${parentPath}.${tag}[${idx}]`,
            title: lc.join("\n"),
            actualdata: lc.join("\n")
          }
        });
        connectors.push({
          id: `connector-${parentNodeId}-${leafId}`,
          sourceID: parentNodeId,
          targetID: leafId
        });
      });
      return;
    }
  
    // 4) “Mixed” case: each item has some primitives AND some nested children
    const mixed = items.every(it => {
      const kids = Array.from(it.children);
      const grp  = this.xmlGroupByTag(kids);
      const hasPrim    = Object.entries(grp).some(([,arr]) =>
        arr.length === 1 && arr[0].children.length === 0
      );
      const hasComplex = Object.entries(grp).some(([,arr]) =>
        arr.length > 1 || arr[0].children.length > 0
      );
      return hasPrim && hasComplex;
    });
    if (mixed) {
      items.forEach((it, idx) => {
        const kids = Array.from(it.children);
        const grp  = this.xmlGroupByTag(kids);
  
        // a) merge the primitives into a single leaf under this array item
        const primKeys = Object.entries(grp)
          .filter(([,arr]) => arr.length === 1 && arr[0].children.length === 0)
          .map(([k]) => k);
        const leafId = `${parentNodeId}-${idx}`;
        const la: Annotation[] = [];
        const lc: string[]     = [];
        primKeys.forEach(k => {
          const v = grp[k][0].textContent!.trim();
          la.push({ id: `Key_${k}`,   content: `${k}:` });
          la.push({ id: `Value_${k}`, content: this.xmlFmt(v) });
          lc.push(`${k}: ${this.xmlFmt(v)}`);
        });
        nodes.push({
          id: leafId,
          width: this.DEFAULT_NODE_WIDTH,
          height: this.DEFAULT_NODE_HEIGHT,
          annotations: la,
          additionalInfo: { isLeaf: true },
          data: {
            path: `${parentPath}.${tag}[${idx}]`,
            title: lc.join("\n"),
            actualdata: lc.join("\n")
          }
        });
        connectors.push({
          id: `connector-${parentNodeId}-${leafId}`,
          sourceID: parentNodeId,
          targetID: leafId
        });
  
        // b) then recurse into the complex/nested children under that leaf
        Object.entries(grp)
          .filter(([,arr]) => arr.length > 1 || arr[0].children.length > 0)
          .forEach(([childKey, arr]) => {
            // if an array of primitives, re‑emit as a sub‑array
            if (arr.length > 1 && arr[0].children.length === 0) {
              this.xmlEmitArrayBlock(childKey, arr, leafId,
                `${parentPath}.${tag}[${idx}]`, nodes, connectors
              );
            }
            // array of complex or single complex branch
            else if (arr.length > 1) {
              this.xmlEmitArrayBlock(childKey, arr, leafId,
                `${parentPath}.${tag}[${idx}]`, nodes, connectors
              );
            } else {
              // single nested element → full recursion
              const nestedEl = arr[0];
              const childId  = `${leafId}-${this.xmlPascal(childKey)}`;
              const { nodes: nn, connectors: cc } = this.xmlProc(
                nestedEl, childId, leafId, childKey,
                `${parentPath}.${tag}[${idx}].${childKey}`
              );
              nodes.push(...nn);
              connectors.push(...cc);
            }
          });
      });
      return;
    }
  
    // 5) Fallback full recursion (if none of the above matched)
    items.forEach((it, idx) => {
      const itemId   = `${parentNodeId}-${idx}`;
      const itemPath = `${parentPath}.${tag}[${idx}]`;
      const { nodes: nn, connectors: cc } = this.xmlProc(
        it, itemId, parentNodeId, tag, itemPath
      );
      nodes.push(...nn);
      connectors.push(...cc);
    });
  }
  
}
