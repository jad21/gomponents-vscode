import * as vscode from 'vscode';
import { JSDOM } from 'jsdom';

interface Node {
  type: number;
  text: string;
  tag: string;
  attributes: { [key: string]: string };
  children: (Node)[];
}

function activate(context: vscode.ExtensionContext): void {
  console.log('Extension "go-syntax-extension" is now active!');

  let disposable = vscode.commands.registerCommand('extension.convertHtmlToGomponent', function (): void {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      const selection = editor.selection;
      const text = editor.document.getText(selection);

      console.log('Selected text:', text);

      const convertedText = convertHtmlToGomponent(text);

      console.log('Converted text:', convertedText);

      editor.edit(editBuilder => {
        editBuilder.replace(selection, convertedText);
      });
    }
  });

  context.subscriptions.push(disposable);
}

function titleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
}

function convertHtmlToGomponent(htmlString: string): string {
  function titleCase(str: string): string {
    return str.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
  }

  function createNode(tag: string, attributes: { [key: string]: string }, ...children: (Node)[]): Node {
    return {
      type: 1,
      tag,
      attributes,
      children,
      text: "",
    };
  }
  function createNodeText(text: string): Node {
    return { text, type: 2, tag: "", attributes: {}, children: [] };
  }

  function formatNode(node: Node, level: number = 0): string {
    let tabs = "";
    for (let i = 0; i < level; i++) {
      tabs += "\t";
    }
    if (node.type == 2) {
      if (!node.text.trim()){
        return "";
      }
      if (node.text.includes("{")) {
        return `${tabs}g.Raw(\`${node.text}\`)`;
      } else {
        return `${tabs}g.Text(\`${node.text}\`)`;
      }
    }
    const formattedTag = titleCase(node.tag);
    const formattedAttributes = node.attributes
      ? Object.entries(node.attributes)
        .map(([key, value]) => {
          if (key.includes("-")) {
            return `g.Attr("${key}", "${value}")`;
          } else {
            return `${titleCase(key)}("${value}")`;
          }
        })
        .join(", ")
      : "";

    const formattedChildren = node.children.map(child => formatNode(child, level + 1)).join(`,\n${tabs}`);

    return `${tabs}${formattedTag}(${formattedAttributes}${formattedAttributes ? ', ' : ''}\n${tabs}${formattedChildren}\n${tabs})`;
  }

  function parseHtml(htmlString: string): Node {
    try {
      const dom = new JSDOM(htmlString);
      const document = dom.window.document;
      return convertElement(document.body.firstChild ? document.body.firstChild : document.head.firstChild);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  function convertElement(element: any): Node {
    if (element.nodeType === 3) {
      return createNodeText(element.nodeValue?.trim() || "")
    }
    const tagName = element.tagName;
    const attributes: { [key: string]: string } = {};
    try {
      for (const attr of element.attributes) {
        attributes[attr.name] = attr.value;
      }
    } catch (error) { }
    const children = Array.from(element.childNodes)
      .map(child => {
        return convertElement(child);
      })
      .filter(child => child.type == 2 && child.text !== "");

    return createNode(tagName, attributes, ...children);
  }

  const parsedHtml = parseHtml(htmlString);
  return formatNode(parsedHtml, 0);
}

function deactivate(): void { }

export {
  activate,
  deactivate
};