/**
 * Creates a reusable and configurable WhatsApp WYSIWYG editor.
 *
 * @param {string} containerId - The id of the container element.
 * @param {Object} options - Configuration options:
 *   options.toolbarFormats {Array} - Array of format objects.
 *     Each format object can be of two types:
 *       - Wrap: { id, label, type: 'wrap', markers: [start, end] }
 *       - Prefix: { id, label, type: 'prefix', prefix: string }
 *   options.previewRules {Array} - Array of preview rule objects { regex, replacement }.
 *   options.placeholder {string} - Placeholder text for the editor.
 *
 * The function creates:
 *  - A full‑width toolbar whose buttons equally share the width.
 *  - A full‑width, contenteditable editor.
 *  - A live preview area that renders formatted content.
 *
 * @returns {Object} - An object with methods to retrieve content:
 *   - getContent(): Returns the plain text (with markers).
 *   - getFormattedContent(): Returns the HTML (formatted preview).
 *   - editorElement and previewElement for further manipulation.
 */
function createWhatsAppWysiwyg(containerId, options = {}) {
  // Default configuration
  const defaultConfig = {
    // Define toolbar formats – 'wrap' types wrap selected text with markers,
    // 'prefix' types insert a prefix at the beginning of the line(s).
    toolbarFormats: [
      {
        id: "bold",
        label: '<i class="fa-solid fa-bold"></i>',
        type: "wrap",
        markers: ["*", "*"],
      },
      {
        id: "italic",
        label: '<i class="fa-solid fa-italic"></i>',
        type: "wrap",
        markers: ["_", "_"],
      },
      {
        id: "strike",
        label: '<i class="fa-solid fa-strikethrough"></i>',
        type: "wrap",
        markers: ["~", "~"],
      },
      {
        id: "inline-code",
        label: '<i class="fa-solid fa-code"></i>',
        type: "wrap",
        markers: ["`", "`"],
      },
      {
        id: "multicode",
        label: '<i class="fa-solid fa-terminal"></i>',
        type: "wrap",
        markers: ["```", "```"],
      },
      {
        id: "ulist",
        label: '<i class="fa-solid fa-list-ul"></i>',
        type: "prefix",
        prefix: "- ",
      },
      {
        id: "olist",
        label: '<i class="fa-solid fa-list-ol"></i>',
        type: "prefix",
        prefix: "1. ",
      },
      {
        id: "blockquote",
        label: '<i class="fa-solid fa-quote-right"></i>',
        type: "prefix",
        prefix: "> ",
      },
    ],
    // Preview rules – note the order matters.
    previewRules: [
      {
        // Multiline code block first (supports newlines)
        regex: /```([\s\S]+?)```/g,
        replacement:
          '<pre class="bg-gray-200 rounded overflow-auto"><code>$1</code></pre>',
      },
      {
        // Inline code: using single backticks but not matching newline.
        regex: /`([^`\n]+?)`/g,
        replacement: "<code>$1</code>",
      },
      { regex: /\*(.*?)\*/g, replacement: "<strong>$1</strong>" },
      { regex: /_(.*?)_/g, replacement: "<em>$1</em>" },
      { regex: /~(.*?)~/g, replacement: "<del>$1</del>" },
      // Finally, convert newline characters to <br>
      { regex: /\n/g, replacement: "<br>" },
    ],
    placeholder: "Type your message...",
  };

  // Merge options with defaults.
  const config = { ...defaultConfig, ...options };

  // Get the container element.
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container with id "${containerId}" not found.`);
    return;
  }
  // Clear any existing content.
  container.innerHTML = "";

  // Create toolbar container.
  const toolbar = document.createElement("div");
  toolbar.id = "toolbar";
  // Make toolbar full width and use flex layout so buttons share equal width.
  toolbar.className = "flex w-full mb-2";
  container.appendChild(toolbar);

  // Create the editor (contenteditable) with full width.
  const editor = document.createElement("div");
  editor.id = "editor";
  editor.className = "w-full border border-gray-300 p-2 rounded min-h-[100px]";
  editor.setAttribute("contenteditable", "true");
  editor.setAttribute("placeholder", config.placeholder);
  container.appendChild(editor);

  // Create the preview area.
  const previewContainer = document.createElement("div");
  previewContainer.className = "mt-4";
  const previewTitle = document.createElement("h3");
  previewTitle.className = "font-bold mb-1";
  previewTitle.textContent = "Preview:";
  previewContainer.appendChild(previewTitle);
  const preview = document.createElement("div");
  preview.id = "preview";
  preview.className = "w-full p-2 border border-gray-300 rounded min-h-[100px]";
  previewContainer.appendChild(preview);
  container.appendChild(previewContainer);

  // Formatting Functions

  // For "wrap" formatting (e.g., bold, italic, code, etc.)
  function applyFormatting(markerStart, markerEnd) {
    editor.focus();
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (range.collapsed) {
      handleCollapsedRange(range, markerStart, markerEnd);
    } else {
      handleSelectionRange(range, markerStart, markerEnd);
    }
    updatePreview();
  }

  function handleCollapsedRange(range, start, end) {
    const textNode = document.createTextNode(start + end);
    range.insertNode(textNode);
    range.setStart(textNode, start.length);
    range.setEnd(textNode, start.length);
    window.getSelection().removeAllRanges().addRange(range);
  }

  function handleSelectionRange(range, start, end) {
    const content = start + range.toString() + end;
    document.execCommand("insertText", false, content);
  }

  // For "prefix" formatting (e.g., lists, block quotes)
  function applyLinePrefix(prefix) {
    editor.focus();
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (range.collapsed) {
      // Simply insert the prefix at the caret.
      document.execCommand("insertText", false, prefix);
    } else {
      // For multi-line selection, add prefix to each line.
      const selectedText = range.toString();
      const lines = selectedText.split("\n");
      const prefixedLines = lines.map((line) => prefix + line);
      const newText = prefixedLines.join("\n");
      document.execCommand("insertText", false, newText);
    }
    updatePreview();
  }

  // Update preview by applying preview rules to the editor's plain text.
  function updatePreview() {
    const content = editor.innerText;
    const formattedContent = config.previewRules.reduce((acc, rule) => {
      return acc.replace(rule.regex, rule.replacement);
    }, content);
    preview.innerHTML = formattedContent;
  }

  // Initialize the toolbar with buttons.
  function initializeToolbar() {
    toolbar.innerHTML = config.toolbarFormats
      .map((format) => {
        if (format.type === "wrap") {
          return `
            <button
              id="btn-${format.id}"
              class="format-btn"
              data-start="${format.markers[0]}"
              data-end="${format.markers[1]}"
            >
              ${format.label}
            </button>
          `;
        } else if (format.type === "prefix") {
          return `
            <button
              id="btn-${format.id}"
              class="format-btn"
              data-prefix="${format.prefix}"
            >
              ${format.label}
            </button>
          `;
        }
        return "";
      })
      .join("");
    config.toolbarFormats.forEach((format) => {
      const btn = document.getElementById(`btn-${format.id}`);
      if (!btn) return;
      if (format.type === "wrap") {
        btn.addEventListener("click", () => {
          applyFormatting(...format.markers);
        });
      } else if (format.type === "prefix") {
        btn.addEventListener("click", () => {
          applyLinePrefix(format.prefix);
        });
      }
    });
  }

  // Set up event listener to update preview on input.
  editor.addEventListener("input", updatePreview);

  // Initialize toolbar and preview.
  initializeToolbar();
  updatePreview();

  // Return an object for external control.
  return {
    getContent: function () {
      return editor.innerText;
    },
    getFormattedContent: function () {
      return preview.innerHTML;
    },
    editorElement: editor,
    previewElement: preview,
  };
}
