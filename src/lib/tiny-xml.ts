const xpath = require("xpath");
import { DOMParser } from "@xmldom/xmldom";
const extendElement = require("./extendElement");

type ExtendedNode = Node & {
  getValue: () => string | undefined;
  getTagName: () => string | undefined;
};

export class TinyXml {
  protected document: Document;

  constructor(xml: string) {
    const document = new DOMParser().parseFromString(xml, "application/xml");
    this.document = document;
  }

  findElement(expression: string, namespace?: string): ExtendedNode {
    const single = true;
    const enhancedExpression = namespace
      ? this.composeExpressionWithNamespace(expression, namespace)
      : expression;

    const node: Node = xpath.select(enhancedExpression, this.document, single);
    extendElement(node);

    return node as ExtendedNode;
  }

  findElements(expression: string, namespace?: string): ExtendedNode[] {
    const single = false;
    const enhancedExpression = namespace
      ? this.composeExpressionWithNamespace(expression, namespace)
      : expression;

    const nodes: Node[] = xpath.select(enhancedExpression, this.document, single);
    nodes.forEach((node) => extendElement(node));

    return nodes as ExtendedNode[];
  }

  protected composeExpressionWithNamespace(expression: string, namespace: string) {
    const REGEX = /(\/+)(.+\[.+])?/g;
    return expression.replace(REGEX, `$1${namespace}:$2`);
  }

  protected extendElement(node: Node) {
    Object.assign(node, {
      getTagName: () => this.getTagName(node).bind(this),
      getValue: () => this.getValue(node).bind(this),
    });
  }

  protected getValue(node?: Node) {
    if (!node) return undefined;
    const length = this.getRecursive(node, ["childNodes", "length"]);

    for (let index = 0; index < length; index += 1) {
      const nodeName = this.getRecursive(node, ["childNodes", index, "nodeName"]);
      const nodeValue = this.getRecursive(node, ["childNodes", index, "nodeValue"]);

      if (nodeName === "#text" && typeof nodeValue === "string") {
        return nodeValue;
      }
    }

    return undefined;
  }

  protected getTagName(node?: Node) {
    return node ? this.getRecursive(node, ["tagName"]) : undefined;
  }

  protected getRecursive(obj: Record<string, any>, path: (string | number)[], defaultValue?: any) {
    const travel = (regexp: RegExp) =>
      String.prototype.split
        .call(path, regexp)
        .filter(Boolean)
        .reduce((res, key) => (res !== null && res !== undefined ? res[key] : res), obj);
    const result = travel(/[,[\]]+?/) || travel(/[,[\].]+?/);
    return result === undefined || result === obj ? defaultValue : result;
  }
}
