const vscode = require('vscode');
const { JSDOM } = require('jsdom');


function activate(context) {
  console.log('Extension "go-syntax-extension" is now active!');

  let disposable = vscode.commands.registerCommand('extension.convertHtmlToGomponent', function () {
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

function titleCase(str) {
  return str.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
}

// function convertHtmlToGomponent(html) {
//   const regex = /<(\w+)([^>]*)>(.*?)<\/\1>/gs;
//   if (!regex.test(html)){
//     return html.trim() ? `g.Text("${html.trim() }")`: ""
//   }
//   return html.replace(regex, (match, tag, attrs, content) => {
    
//     console.info("tag", tag)
//     console.info("attrs", attrs)

//     const gomponentTag = titleCase(tag)
//     const gomponentAttrs = attrs.trim() ? `Class("${attrs.trim()}")` : '';
//     const gomponentContent = convertHtmlToGomponent(content.trim())
//     return `${gomponentTag}(${gomponentAttrs}${gomponentAttrs && gomponentContent ? ',\n\t' : ''}${gomponentContent})`;
//   });
// }

function convertHtmlToGomponent(htmlString) {
  function titleCase(str) {
    return str.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
  }


  function createNode(tag, attributes, ...children) {
    return {
      tag,
      attributes,
      children
    };
  }

  function formatNode(node, level = 0) {
    let tabs = ""
    for (let i = 0; i < level; i++) {
      tabs += "\t"
    }
    if (typeof node === "string") {
      if (node.includes("{")){
        return `${tabs}g.Raw(\`${node}\`)`;
      }else{
        return `${tabs}g.Text(\`${node}\`)`;
      }
    }
    const formattedTag = titleCase(node.tag);
    const formattedAttributes = node.attributes
    ? Object.entries(node.attributes)
    .map(([key, value]) => {
      if (key.includes("-")) {
        return `g.Attr("${key}", "${value}")`;
      }else{
        return `${titleCase(key)}("${value}")`
      }

        }).join(", ")
      : "";

    const formattedChildren = node.children.map(child => formatNode(child, level + 1)).join(`,\n${tabs}`);

    return `${tabs}${formattedTag}(${formattedAttributes}${formattedAttributes ? ', ' : ''}\n${tabs}${formattedChildren}\n${tabs})`;
  }

  function parseHtml(htmlString) {
    // const parser = new window.DOMParser();
    // const doc = parser.parseFromString(htmlString, 'text/html');
    try {
      const dom = new JSDOM(htmlString);
      const document = dom.window.document;
      return convertElement(document.body.firstChild ? document.body.firstChild : document.head.firstChild);
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  function convertElement(element) {
    const tagName = element.tagName //.toLowerCase();
    const attributes = {};
    try {
      for (const attr of element.attributes) {
        attributes[attr.name] = attr.value;
      }
    } catch (error) { }
    const children = Array.from(element.childNodes).map(child => {
      return child.nodeType == 3 ? child.nodeValue.trim(): convertElement(child);
    }).filter(child => child != "");

    return createNode(tagName, attributes, ...children);
  }

  const parsedHtml = parseHtml(htmlString);
  return formatNode(parsedHtml, level = 0);
}




function deactivate() { }

module.exports = {
  activate,
  deactivate
};
