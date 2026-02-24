import { useEditor, EditorContent, NodeViewWrapper, NodeViewProps, ReactNodeViewRenderer, Extension } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import { mergeAttributes, Node, Editor } from '@tiptap/core';
import { DOMParser as ProseMirrorDOMParser } from '@tiptap/pm/model';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import HorizontalRule from '@tiptap/extension-horizontal-rule';

import Paragraph from '@tiptap/extension-paragraph';

const CustomParagraph = Paragraph.extend({
  addAttributes() {
    return {
      textAlign: {
        default: 'left',
        keepOnSplit: true,
        parseHTML: (element: HTMLElement) => {
          return element.style.textAlign || element.getAttribute('align') || element.getAttribute('data-align') || 'left';
        },
        renderHTML: (attributes: any) => {
          const align = attributes.textAlign || 'left';
          return {
            style: `text-align: ${align} !important; display: block !important; width: 100% !important; min-height: 1.2em !important; white-space: pre-wrap !important;`,
            class: `text-${align}`,
            'data-align': align,
          };
        },
      },
      indent: {
        default: 0,
        parseHTML: (element: HTMLElement) => {
          const paddingLeft = element.style.paddingLeft;
          if (paddingLeft && paddingLeft.endsWith('px')) {
            return parseInt(paddingLeft, 10) / 40;
          }
          const marginLeft = element.style.marginLeft;
          if (marginLeft && marginLeft.endsWith('px')) {
            return parseInt(marginLeft, 10) / 40;
          }
          return 0;
        },
        renderHTML: (attributes: any) => {
          if (!attributes.indent) return {};
          return {
            style: `padding-left: ${attributes.indent * 40}px`,
          };
        },
      },
      textIndent: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style.textIndent,
        renderHTML: (attributes: any) => {
          if (!attributes.textIndent) return {};
          return {
            style: `text-indent: ${attributes.textIndent} !important`,
          };
        },
      },
      lineHeight: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style.lineHeight,
        renderHTML: (attributes: any) => {
          if (!attributes.lineHeight) return {};
          return {
            style: `line-height: ${attributes.lineHeight}`,
          };
        },
      },
      marginTop: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style.marginTop,
        renderHTML: (attributes: any) => {
          if (!attributes.marginTop) return {};
          return {
            style: `margin-top: ${attributes.marginTop}`,
          };
        },
      },
      marginBottom: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style.marginBottom,
        renderHTML: (attributes: any) => {
          if (!attributes.marginBottom) return {};
          return {
            style: `margin-bottom: ${attributes.marginBottom}`,
          };
        },
      },
    };
  },

  addCommands() {
    return {
      indent: () => ({ tr, state }: { tr: any; state: any }) => {
        const { selection } = state;
        let modified = false;
        tr.doc.nodesBetween(selection.from, selection.to, (node: any, pos: number) => {
          if (node.type.name === 'paragraph') {
            // Use text-indent (first line indent) instead of padding-left
            const currentIndentStr = node.attrs.textIndent || '0px';
            const currentIndent = parseInt(currentIndentStr);
            const newIndent = currentIndent + 40;
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, textIndent: `${newIndent}px` });
            modified = true;
          }
        });
        return modified;
      },
      outdent: () => ({ tr, state }: { tr: any; state: any }) => {
        const { selection } = state;
        let modified = false;
        tr.doc.nodesBetween(selection.from, selection.to, (node: any, pos: number) => {
          if (node.type.name === 'paragraph') {
            const currentIndentStr = node.attrs.textIndent || '0px';
            const currentIndent = parseInt(currentIndentStr);
            const newIndent = Math.max(0, currentIndent - 40);
            tr.setNodeMarkup(pos, undefined, { 
              ...node.attrs, 
              textIndent: newIndent > 0 ? `${newIndent}px` : null 
            });
            modified = true;
          }
        });
        return modified;
      },
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.commands.indent(),
      'Shift-Tab': () => this.editor.commands.outdent(),
    };
  },
});

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indent: () => ReturnType;
    outdent: () => ReturnType;
    pageBreak: {
      insertPageBreak: () => ReturnType;
    };
  }
}

const PageBreak = Extension.create({
  name: 'pageBreak',
  addCommands() {
    return {
      insertPageBreak: () => ({ editor }: { editor: Editor }) => {
        return editor.chain()
          .focus()
          .insertContent('<div class="page-break" contenteditable="false"><span>-- Саҳифаи нав --</span></div>')
          .run();
      },
    };
  },
});

const cleanWordHtml = (html: string): string => {
  let cleaned = html;
  cleaned = cleaned.replace(/<o:p[^>]*>[\s\S]*?<\/o:p>/gi, '');
  cleaned = cleaned.replace(/<\/?o:[^>]*>/gi, '');
  cleaned = cleaned.replace(/<\/?w:[^>]*>/gi, '');
  cleaned = cleaned.replace(/<\/?m:[^>]*>/gi, '');
  cleaned = cleaned.replace(/<\/?v:[^>]*>/gi, '');
  cleaned = cleaned.replace(/<!--\[if[^>]*>[\s\S]*?<!\[endif\]-->/gi, '');
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');
  cleaned = cleaned.replace(/<xml[^>]*>[\s\S]*?<\/xml>/gi, '');
  cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  cleaned = cleaned.replace(/class="Mso[^"]*"/gi, '');
  cleaned = cleaned.replace(/class='Mso[^']*'/gi, '');
  cleaned = cleaned.replace(/\s*mso-[^;":]+:[^;":]+;?/gi, '');
  cleaned = cleaned.replace(/\s*font-family:\s*["']?Symbol["']?[^;]*;?/gi, '');
  cleaned = cleaned.replace(/lang="[^"]*"/gi, '');
  const fontStylePattern = /style="([^"]*)"/gi;
  cleaned = cleaned.replace(fontStylePattern, (match, styleContent) => {
    const preservedStyles: string[] = [];
    const fontFamilyMatch = styleContent.match(/font-family:\s*([^;]+)/i);
    if (fontFamilyMatch) {
      let fontFamily = fontFamilyMatch[1].trim();
      fontFamily = fontFamily.replace(/["']/g, '').split(',')[0].trim();
      if (fontFamily && !fontFamily.toLowerCase().includes('symbol')) {
        preservedStyles.push(`font-family: '${fontFamily}'`);
      }
    }
    const fontSizeMatch = styleContent.match(/font-size:\s*([^;]+)/i);
    if (fontSizeMatch) {
      let fontSize = fontSizeMatch[1].trim();
      const ptMatch = fontSize.match(/(\d+(?:\.\d+)?)\s*pt/i);
      if (ptMatch) {
        preservedStyles.push(`font-size: ${ptMatch[1]}pt`);
      }
    }
    const fontWeightMatch = styleContent.match(/font-weight:\s*([^;]+)/i);
    if (fontWeightMatch) {
      preservedStyles.push(`font-weight: ${fontWeightMatch[1].trim()}`);
    }
    const fontStyleMatch = styleContent.match(/font-style:\s*([^;]+)/i);
    if (fontStyleMatch) {
      preservedStyles.push(`font-style: ${fontStyleMatch[1].trim()}`);
    }
    const textDecorationMatch = styleContent.match(/text-decoration:\s*([^;]+)/i);
    if (textDecorationMatch) {
      preservedStyles.push(`text-decoration: ${textDecorationMatch[1].trim()}`);
    }
    const colorMatch = styleContent.match(/(?:^|[^-])color:\s*([^;]+)/i);
    if (colorMatch) {
      preservedStyles.push(`color: ${colorMatch[1].trim()}`);
    }
    const bgColorMatch = styleContent.match(/background(?:-color)?:\s*([^;]+)/i);
    if (bgColorMatch) {
      preservedStyles.push(`background-color: ${bgColorMatch[1].trim()}`);
    }
    const textAlignMatch = styleContent.match(/text-align:\s*([^;]+)/i);
    if (textAlignMatch) {
      const alignment = textAlignMatch[1].trim().toLowerCase();
      if (['left', 'center', 'right', 'justify'].includes(alignment)) {
        preservedStyles.push(`text-align: ${alignment} !important`);
        preservedStyles.push(`display: block !important`);
        preservedStyles.push(`width: 100% !important`);
        preservedStyles.push(`min-height: 1.2em !important`);
      }
    }
    const marginMatch = styleContent.match(/margin(?:-left|-right|-top|-bottom)?:\s*([^;]+)/gi);
    if (marginMatch) {
      (marginMatch as string[]).forEach((m: string) => {
        const style = m.trim().toLowerCase();
        if (style.startsWith('margin-left')) {
          const val = style.split(':')[1].trim();
          if (val.endsWith('pt')) {
            const px = parseFloat(val) * 1.33;
            preservedStyles.push(`padding-left: ${px}px`);
          } else {
            preservedStyles.push(`padding-left: ${val}`);
          }
        } else {
          preservedStyles.push(style);
        }
      });
    }
    const paddingMatch = styleContent.match(/padding(?:-left|-right|-top|-bottom)?:\s*([^;]+)/gi);
    if (paddingMatch) {
      (paddingMatch as string[]).forEach((p: string) => preservedStyles.push(p.trim()));
    }
    const textIndentMatch = styleContent.match(/text-indent:\s*([^;]+)/i);
    if (textIndentMatch) {
      preservedStyles.push(`text-indent: ${textIndentMatch[1].trim()}`);
    }
    const lineHeightMatch = styleContent.match(/line-height:\s*([^;]+)/i);
    if (lineHeightMatch) {
      preservedStyles.push(`line-height: ${lineHeightMatch[1].trim()}`);
    }
    const marginTopMatch = styleContent.match(/margin-top:\s*([^;]+)/i);
    if (marginTopMatch) {
      preservedStyles.push(`margin-top: ${marginTopMatch[1].trim()}`);
    }
    const marginBottomMatch = styleContent.match(/margin-bottom:\s*([^;]+)/i);
    if (marginBottomMatch) {
      preservedStyles.push(`margin-bottom: ${marginBottomMatch[1].trim()}`);
    }
    const msoMarginTopMatch = styleContent.match(/mso-margin-top-alt:\s*([^;]+)/i);
    if (msoMarginTopMatch) {
      preservedStyles.push(`margin-top: ${msoMarginTopMatch[1].trim()}`);
    }
    const msoMarginBottomMatch = styleContent.match(/mso-margin-bottom-alt:\s*([^;]+)/i);
    if (msoMarginBottomMatch) {
      preservedStyles.push(`margin-bottom: ${msoMarginBottomMatch[1].trim()}`);
    }
    const msoLineHeightMatch = styleContent.match(/mso-line-height-alt:\s*([^;]+)/i);
    if (msoLineHeightMatch) {
      preservedStyles.push(`line-height: ${msoLineHeightMatch[1].trim()}`);
    }
    if (preservedStyles.length > 0) {
      return `style="${preservedStyles.join('; ')}"`;
    }
    return '';
  });
  cleaned = cleaned.replace(/<span[^>]*>\s*<\/span>/gi, '');
  cleaned = cleaned.replace(/<p[^>]*>\s*(&nbsp;|\u00A0)?\s*<\/p>/gi, '<p><br></p>');
  cleaned = cleaned.replace(/>\s+</g, '><');
  return cleaned.trim();
};

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo,
  Redo,
  Stamp,
  Table as TableIcon,
  Download,
  CheckCircle,
  XCircle,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Palette,
  Highlighter,
  Indent as IndentIcon,
  Outdent,
  Minus,
  ImagePlus,
  Search,
  Replace,
  Type,
  TableProperties,
  Plus,
  Trash2,
  RowsIcon,
  Columns,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  Quote,
  ChevronsUpDown,
  Pilcrow as ParagraphMark,
  FileText,
  Pencil,
  SeparatorHorizontal,
  Printer,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useRef, useCallback, useEffect } from 'react';

interface DocumentEditorProps {
  content: string;
  onChange: (html: string) => void;
  departmentName?: string;
  canApprove?: boolean;
  canEdit?: boolean; // New prop to control editing permission
  onInsertStamp?: () => void;
  onExportDocx?: () => void;
  onExportPdf?: () => void;
  readOnly?: boolean;
  className?: string;
  title?: string;
  onTitleChange?: (title: string) => void;
}

const LINE_SPACINGS = [
  { value: '1', label: '1.0' },
  { value: '1.15', label: '1.15' },
  { value: '1.5', label: '1.5' },
  { value: '2', label: '2.0' },
  { value: '2.5', label: '2.5' },
  { value: '3', label: '3.0' },
];

const FONT_FAMILIES = [
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Calibri', label: 'Calibri' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Tahoma', label: 'Tahoma' },
  { value: 'Trebuchet MS', label: 'Trebuchet MS' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Segoe UI', label: 'Segoe UI' },
  { value: 'Noto Sans', label: 'Noto Sans (Тоҷикӣ)' },
  { value: 'Noto Serif', label: 'Noto Serif (Тоҷикӣ)' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans (Тоҷикӣ)' },
  { value: 'Inter', label: 'Inter' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Oswald', label: 'Oswald' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Ubuntu', label: 'Ubuntu' },
  { value: 'Merriweather', label: 'Merriweather' },
  { value: 'Lora', label: 'Lora' },
  { value: 'Arvo', label: 'Arvo' },
  { value: 'Crimson Text', label: 'Crimson Text' },
  { value: 'Spectral', label: 'Spectral' },
  { value: 'Libre Baskerville', label: 'Libre Baskerville' },
  { value: 'PT Sans', label: 'PT Sans' },
  { value: 'PT Serif', label: 'PT Serif' },
  { value: 'Fira Sans', label: 'Fira Sans' },
  { value: 'Work Sans', label: 'Work Sans' },
  { value: 'Quicksand', label: 'Quicksand' },
  { value: 'Josefin Sans', label: 'Josefin Sans' },
  { value: 'Caveat', label: 'Caveat' },
  { value: 'Dancing Script', label: 'Dancing Script' },
  { value: 'Pacifico', label: 'Pacifico' },
];

const FONT_SIZES = [
  '8', '9', '10', '11', '12', '14', '16', '18', '20', '24', '28', '32', '36', '48', '72'
];

const COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
  '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
  '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd',
  '#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0',
  '#a61c00', '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3c78d8', '#3d85c6', '#674ea7', '#a64d79',
  '#85200c', '#990000', '#b45f06', '#bf9000', '#38761d', '#134f5c', '#1155cc', '#0b5394', '#351c75', '#741b47',
  '#5b0f00', '#660000', '#783f04', '#7f6000', '#274e13', '#0c343d', '#1c4587', '#073763', '#20124d', '#4c1130',
];

const FontSizeExtension = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style.fontSize?.replace('pt', ''),
        renderHTML: (attributes: { fontSize?: string }) => {
          if (!attributes.fontSize) return {};
          return { style: `font-size: ${attributes.fontSize}pt` };
        },
      },
    };
  },
});

const DraggableImageComponent = ({ node, selected }: NodeViewProps) => {
  return (
    <NodeViewWrapper 
      as="span" 
      className="inline-block"
      draggable="true"
      data-drag-handle
    >
      <img 
        src={node.attrs.src}
        alt={node.attrs.alt || ''}
        title={node.attrs.title || ''}
        className={cn(
          "max-w-full h-auto cursor-grab active:cursor-grabbing transition-all",
          selected && "outline outline-2 outline-green-500 outline-offset-2"
        )}
        draggable={false}
      />
    </NodeViewWrapper>
  );
};

const DraggableImage = Image.extend({
  draggable: true,
  addNodeView() {
    return ReactNodeViewRenderer(DraggableImageComponent);
  },
});

export function DocumentEditor({
  content,
  onChange,
  departmentName,
  canApprove = false,
  canEdit = true, // Default to true for backward compatibility
  onInsertStamp,
  onExportDocx,
  onExportPdf,
  readOnly = false,
  className,
  title,
  onTitleChange,
}: DocumentEditorProps) {
  const [searchText, setSearchText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [showFormattingMarks, setShowFormattingMarks] = useState(false);
  const [lineSpacing, setLineSpacingState] = useState('1.5');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editableTitle, setEditableTitle] = useState(title || 'Ҳуҷҷати нав');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Final read-only status is true if the component is explicitly readOnly 
  // OR if the user doesn't have editing permissions
  const isReadOnly = readOnly || !canEdit;

  useEffect(() => {
    if (title) {
      setEditableTitle(title);
    }
  }, [title]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleTitleSave = () => {
    setIsEditingTitle(false);
    if (onTitleChange && editableTitle.trim()) {
      onTitleChange(editableTitle.trim());
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setEditableTitle(title || 'Ҳуҷҷати нав');
      setIsEditingTitle(false);
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        paragraph: false,
      }),
      CustomParagraph,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
        defaultAlignment: 'left',
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      DraggableImage.configure({
        inline: true,
        allowBase64: true,
      }),
      FontSizeExtension,
      FontFamily.configure({
        types: ['textStyle'],
      }),
      Color.configure({
        types: ['textStyle'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Subscript,
      Superscript,
      HorizontalRule,
      PageBreak,
    ],
    content,
    editable: !isReadOnly,
    parseOptions: {
      preserveWhitespace: 'full',
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        style: "font-family: 'Noto Sans', sans-serif;",
      },
      handlePaste: (view, event, slice) => {
        const html = event.clipboardData?.getData('text/html');
        if (html && (html.includes('mso-') || html.includes('MsoNormal') || html.includes('xmlns:w=') || html.includes('urn:schemas-microsoft-com'))) {
          event.preventDefault();
          const cleanedHtml = cleanWordHtml(html);
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = cleanedHtml;
          const parser = ProseMirrorDOMParser.fromSchema(view.state.schema);
          const parsedDoc = parser.parse(tempDiv);
          const newTr = view.state.tr.replaceSelection(parsedDoc.slice(0));
          view.dispatch(newTr);
          return true;
        }
        return false;
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && editor) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        editor.chain().focus().setImage({ src: dataUrl }).run();
      };
      reader.readAsDataURL(file);
    }
  }, [editor]);

  const findTextPosition = useCallback((searchStr: string, startFrom: number = 1): { from: number; to: number } | null => {
    if (!editor || !searchStr) return null;
    
    let foundPos: { from: number; to: number } | null = null;
    const searchLower = searchStr.toLowerCase();
    
    editor.state.doc.descendants((node, pos) => {
      if (foundPos) return false;
      if (node.isText && node.text) {
        const textLower = node.text.toLowerCase();
        const index = textLower.indexOf(searchLower);
        if (index !== -1) {
          const absoluteFrom = pos + index;
          const absoluteTo = absoluteFrom + searchStr.length;
          if (absoluteFrom >= startFrom) {
            foundPos = { from: absoluteFrom, to: absoluteTo };
            return false;
          }
        }
      }
      return true;
    });
    
    return foundPos;
  }, [editor]);

  const handleSearch = () => {
    if (!editor || !searchText) return;
    const result = findTextPosition(searchText, 1);
    if (result) {
      editor.chain().focus().setTextSelection(result).run();
    }
  };

  const handleReplace = () => {
    if (!editor || !searchText) return;
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);
    if (selectedText.toLowerCase() === searchText.toLowerCase()) {
      editor.chain().focus().insertContent(replaceText).run();
      const nextResult = findTextPosition(searchText, from);
      if (nextResult) {
        editor.chain().focus().setTextSelection(nextResult).run();
      }
    } else {
      handleSearch();
    }
  };

  const handleReplaceAll = () => {
    if (!editor || !searchText) return;
    
    let replaced = true;
    while (replaced) {
      const result = findTextPosition(searchText, 1);
      if (result) {
        editor.chain().focus().setTextSelection(result).insertContent(replaceText).run();
      } else {
        replaced = false;
      }
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const contentHtml = editor.getHTML();
      printWindow.document.write(`
        <html>
          <head>
            <title>${editableTitle}</title>
            <style>
              body { font-family: 'Noto Sans', sans-serif; padding: 20px; }
              @media print {
                .page-break { page-break-after: always; }
              }
              img { max-width: 100%; height: auto; }
              table { border-collapse: collapse; width: 100%; }
              table, th, td { border: 1px solid black; }
              th, td { padding: 8px; text-align: left; }
            </style>
          </head>
          <body>
            ${contentHtml}
            <script>
              window.onload = () => {
                window.print();
                window.close();
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  if (!editor) {
    return (
      <div className="border rounded-lg p-8 text-center text-gray-500">
        Боргузорӣ...
      </div>
    );
  }

  const setFontSize = (size: string) => {
    editor.chain().focus().setMark('textStyle', { fontSize: size }).run();
  };

  const setLineSpacing = (spacing: string) => {
    setLineSpacingState(spacing);
    if (editor) {
      editor.chain().focus().updateAttributes('paragraph', { lineHeight: spacing }).run();
    }
  };

  const setFontFamily = (font: string) => {
    editor.chain().focus().setFontFamily(font).run();
  };

  const insertDepartmentStamp = () => {
    if (!departmentName) return;
    
    const stampHtml = `
      <div style="border: 2px solid #166534; border-radius: 50%; width: 120px; height: 120px; display: flex; align-items: center; justify-content: center; text-align: center; padding: 10px; margin: 10px auto; font-size: 11px; font-weight: bold; color: #166534;">
        ${departmentName}
      </div>
    `;
    
    editor.chain().focus().insertContent(stampHtml).run();
    onInsertStamp?.();
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const svgToDataUrl = (svg: string): string => {
    const encoded = encodeURIComponent(svg.trim());
    return `data:image/svg+xml,${encoded}`;
  };

  const wrapText = (text: string, maxChars: number): string[] => {
    if (text.length <= maxChars) return [text];
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    for (const word of words) {
      if (currentLine.length + word.length + 1 > maxChars && currentLine.length > 0) {
        lines.push(currentLine.trim());
        currentLine = word;
      } else {
        currentLine += (currentLine ? ' ' : '') + word;
      }
    }
    if (currentLine) lines.push(currentLine.trim());
    return lines;
  };

  const insertApprovalStamp = () => {
    const date = new Date().toLocaleDateString('ru-RU');
    const deptLines = departmentName ? wrapText(departmentName, 20) : [''];
    const deptTextY = 80;
    const deptTexts = deptLines.map((line, i) =>
      `<text x="110" y="${deptTextY + i * 16}" text-anchor="middle" font-size="12" font-weight="bold" fill="#0d6939" font-family="Arial, sans-serif">${line}</text>`
    ).join('');
    const lineAfterDeptY = deptTextY + deptLines.length * 16 + 5;
    const dateY = lineAfterDeptY + 18;
    const totalHeight = dateY + 25;
    const stampSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="${totalHeight}" viewBox="0 0 220 ${totalHeight}">
      <defs>
        <filter id="roughEdgeApprove" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" result="noise"/>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
      </defs>
      <g filter="url(#roughEdgeApprove)" transform="rotate(-3, 110, ${totalHeight / 2})">
        <rect x="5" y="5" width="210" height="${totalHeight - 10}" rx="6" ry="6" fill="rgba(13, 105, 57, 0.05)" stroke="#0d6939" stroke-width="4"/>
        <rect x="12" y="12" width="196" height="${totalHeight - 24}" rx="4" ry="4" fill="none" stroke="#0d6939" stroke-width="2"/>
        <text x="110" y="45" text-anchor="middle" font-size="22" font-weight="bold" fill="#0d6939" font-family="Arial, sans-serif">ИҶОЗАТ</text>
        <line x1="25" y1="55" x2="195" y2="55" stroke="#0d6939" stroke-width="1.5"/>
        ${deptTexts}
        <line x1="25" y1="${lineAfterDeptY}" x2="195" y2="${lineAfterDeptY}" stroke="#0d6939" stroke-width="1.5"/>
        <text x="110" y="${dateY}" text-anchor="middle" font-size="14" font-weight="bold" fill="#0d6939" font-family="Arial, sans-serif">${date}</text>
      </g>
    </svg>`;
    const dataUrl = svgToDataUrl(stampSvg);
    editor.chain().focus().setImage({ src: dataUrl }).run();
  };

  const insertRejectionStamp = () => {
    const date = new Date().toLocaleDateString('ru-RU');
    const deptLines = departmentName ? wrapText(departmentName, 20) : [''];
    const deptTextY = 80;
    const deptTexts = deptLines.map((line, i) =>
      `<text x="110" y="${deptTextY + i * 16}" text-anchor="middle" font-size="12" font-weight="bold" fill="#b91c1c" font-family="Arial, sans-serif">${line}</text>`
    ).join('');
    const lineAfterDeptY = deptTextY + deptLines.length * 16 + 5;
    const dateY = lineAfterDeptY + 18;
    const totalHeight = dateY + 25;
    const stampSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="${totalHeight}" viewBox="0 0 220 ${totalHeight}">
      <defs>
        <filter id="roughEdgeReject" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" result="noise"/>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
      </defs>
      <g filter="url(#roughEdgeReject)" transform="rotate(-3, 110, ${totalHeight / 2})">
        <rect x="5" y="5" width="210" height="${totalHeight - 10}" rx="6" ry="6" fill="rgba(185, 28, 28, 0.05)" stroke="#b91c1c" stroke-width="4"/>
        <rect x="12" y="12" width="196" height="${totalHeight - 24}" rx="4" ry="4" fill="none" stroke="#b91c1c" stroke-width="2"/>
        <text x="110" y="45" text-anchor="middle" font-size="22" font-weight="bold" fill="#b91c1c" font-family="Arial, sans-serif">РАДШУДА</text>
        <line x1="25" y1="55" x2="195" y2="55" stroke="#b91c1c" stroke-width="1.5"/>
        ${deptTexts}
        <line x1="25" y1="${lineAfterDeptY}" x2="195" y2="${lineAfterDeptY}" stroke="#b91c1c" stroke-width="1.5"/>
        <text x="110" y="${dateY}" text-anchor="middle" font-size="14" font-weight="bold" fill="#b91c1c" font-family="Arial, sans-serif">${date}</text>
      </g>
    </svg>`;
    const dataUrl = svgToDataUrl(stampSvg);
    editor.chain().focus().setImage({ src: dataUrl }).run();
  };

  const insertDepartmentStampGraphic = () => {
    if (!departmentName) return;
    const date = new Date().toLocaleDateString('ru-RU');
    const deptLines = wrapText(departmentName, 20);
    const deptTextY = 40;
    const deptTexts = deptLines.map((line, i) =>
      `<text x="110" y="${deptTextY + i * 18}" text-anchor="middle" font-size="16" font-weight="bold" fill="#166534" font-family="Arial, sans-serif">${line}</text>`
    ).join('');
    const lineAfterDeptY = deptTextY + deptLines.length * 18 + 5;
    const dateY = lineAfterDeptY + 18;
    const totalHeight = dateY + 25;
    const stampSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="${totalHeight}" viewBox="0 0 220 ${totalHeight}">
      <defs>
        <filter id="roughEdgeDept" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" result="noise"/>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
      </defs>
      <g filter="url(#roughEdgeDept)" transform="rotate(-3, 110, ${totalHeight / 2})">
        <rect x="5" y="5" width="210" height="${totalHeight - 10}" rx="6" ry="6" fill="rgba(22, 101, 52, 0.05)" stroke="#166534" stroke-width="4"/>
        <rect x="12" y="12" width="196" height="${totalHeight - 24}" rx="4" ry="4" fill="none" stroke="#166534" stroke-width="2"/>
        ${deptTexts}
        <line x1="25" y1="${lineAfterDeptY}" x2="195" y2="${lineAfterDeptY}" stroke="#166534" stroke-width="1.5"/>
        <text x="110" y="${dateY}" text-anchor="middle" font-size="14" font-weight="bold" fill="#166534" font-family="Arial, sans-serif">${date}</text>
      </g>
    </svg>`;
    const dataUrl = svgToDataUrl(stampSvg);
    editor.chain().focus().setImage({ src: dataUrl }).run();
    onInsertStamp?.();
  };

  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    disabled = false,
    title,
    children 
  }: { 
    onClick: () => void; 
    isActive?: boolean;
    disabled?: boolean;
    title?: string;
    children: React.ReactNode;
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      disabled={disabled || readOnly}
      title={title}
      className={cn(
        "h-8 w-8",
        isActive && "bg-muted"
      )}
    >
      {children}
    </Button>
  );

  const ToolbarGroup = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center gap-0.5">
      {children}
    </div>
  );

  return (
    <div className={cn("border rounded-lg overflow-hidden bg-background", className)}>
      {/* Document Title Header */}
      {(title !== undefined || onTitleChange) && (
        <div className="border-b bg-gradient-to-r from-green-600 to-green-700 px-4 py-3 flex items-center gap-2">
          <FileText className="h-5 w-5 text-white" />
          {isEditingTitle ? (
            <Input
              ref={titleInputRef}
              value={editableTitle}
              onChange={(e) => setEditableTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyDown}
              className="h-7 bg-white/90 text-gray-900 font-medium max-w-md"
              data-testid="input-document-title"
            />
          ) : (
            <button
              onClick={() => onTitleChange && setIsEditingTitle(true)}
              className={cn(
                "text-white font-semibold text-lg flex items-center gap-2",
                onTitleChange && "hover:underline cursor-pointer"
              )}
              disabled={!onTitleChange}
              data-testid="button-edit-title"
            >
              {editableTitle}
              {onTitleChange && <Pencil className="h-4 w-4 opacity-60" />}
            </button>
          )}
        </div>
      )}

      {!readOnly && (
        <div className="border-b bg-muted/30 p-1 space-y-1">
          {/* Row 1: Font, Size, Basic Formatting */}
          <div className="flex flex-wrap items-center gap-1">
            {/* Font Family */}
            <Select onValueChange={setFontFamily} defaultValue="Arial">
              <SelectTrigger className="w-[140px] h-8" data-testid="select-font-family">
                <SelectValue placeholder="Шрифт" />
              </SelectTrigger>
              <SelectContent>
                {FONT_FAMILIES.map((font) => (
                  <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Font Size */}
            <Select onValueChange={setFontSize} defaultValue="14">
              <SelectTrigger className="w-[70px] h-8" data-testid="select-font-size">
                <SelectValue placeholder="14" />
              </SelectTrigger>
              <SelectContent>
                {FONT_SIZES.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Line Spacing */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Фосилаи сатрҳо" data-testid="button-line-spacing">
                  <ChevronsUpDown className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-32 p-1">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground px-2 py-1">Фосилаи сатрҳо</p>
                  {LINE_SPACINGS.map((spacing) => (
                    <Button
                      key={spacing.value}
                      variant={lineSpacing === spacing.value ? "secondary" : "ghost"}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setLineSpacing(spacing.value)}
                      data-testid={`button-line-spacing-${spacing.value}`}
                    >
                      {spacing.label}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Text Formatting */}
            <ToolbarGroup>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive('bold')}
                title="Ғафс (Ctrl+B)"
              >
                <Bold className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive('italic')}
                title="Хам (Ctrl+I)"
              >
                <Italic className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                isActive={editor.isActive('underline')}
                title="Зерхат (Ctrl+U)"
              >
                <UnderlineIcon className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleStrike().run()}
                isActive={editor.isActive('strike')}
                title="Хаткашида"
              >
                <Strikethrough className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleSubscript().run()}
                isActive={editor.isActive('subscript')}
                title="Поёнхат"
              >
                <SubscriptIcon className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleSuperscript().run()}
                isActive={editor.isActive('superscript')}
                title="Болохат"
              >
                <SuperscriptIcon className="h-4 w-4" />
              </ToolbarButton>
            </ToolbarGroup>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Text Color */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Ранги матн" data-testid="button-text-color">
                  <Palette className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2">
                <div className="grid grid-cols-10 gap-1">
                  {COLORS.map((color) => (
                    <button
                      type="button"
                      key={color}
                      onClick={() => editor.chain().focus().setColor(color).run()}
                      className="w-5 h-5 rounded border border-gray-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Highlight Color */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Ранги пасзамина" data-testid="button-highlight-color">
                  <Highlighter className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2">
                <div className="grid grid-cols-10 gap-1">
                  {COLORS.slice(0, 40).map((color) => (
                    <button
                      type="button"
                      key={color}
                      onClick={() => editor.chain().focus().toggleHighlight({ color }).run()}
                      className="w-5 h-5 rounded border border-gray-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => editor.chain().focus().unsetHighlight().run()}
                >
                  Нест кардани пасзамина
                </Button>
              </PopoverContent>
            </Popover>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Headings */}
            <ToolbarGroup>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                isActive={editor.isActive('heading', { level: 1 })}
                title="Сарлавҳа 1"
              >
                <Heading1 className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                isActive={editor.isActive('heading', { level: 2 })}
                title="Сарлавҳа 2"
              >
                <Heading2 className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                isActive={editor.isActive('heading', { level: 3 })}
                title="Сарлавҳа 3"
              >
                <Heading3 className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().setParagraph().run()}
                isActive={editor.isActive('paragraph')}
                title="Абзац"
              >
                <Pilcrow className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                isActive={editor.isActive('blockquote')}
                title="Иқтибос"
              >
                <Quote className="h-4 w-4" />
              </ToolbarButton>
            </ToolbarGroup>
          </div>

          {/* Row 2: Alignment, Lists, Insert, Stamps */}
          <div className="flex flex-wrap items-center gap-1">
            {/* Alignment */}
            <ToolbarGroup>
              <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                isActive={editor.isActive({ textAlign: 'left' })}
                title="Ба чап"
              >
                <AlignLeft className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                isActive={editor.isActive({ textAlign: 'center' })}
                title="Ба марказ"
              >
                <AlignCenter className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                isActive={editor.isActive({ textAlign: 'right' })}
                title="Ба рост"
              >
                <AlignRight className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                isActive={editor.isActive({ textAlign: 'justify' })}
                title="Баробар"
              >
                <AlignJustify className="h-4 w-4" />
              </ToolbarButton>
            </ToolbarGroup>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Lists */}
            <ToolbarGroup>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                isActive={editor.isActive('bulletList')}
                title="Рӯйхати нуқтадор"
              >
                <List className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                isActive={editor.isActive('orderedList')}
                title="Рӯйхати рақамӣ"
              >
                <ListOrdered className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().sinkListItem('listItem').run()}
                disabled={!editor.can().sinkListItem('listItem')}
                title="Зиёд кардани ҷойгузорӣ"
              >
                <IndentIcon className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().liftListItem('listItem').run()}
                disabled={!editor.can().liftListItem('listItem')}
                title="Кам кардани ҷойгузорӣ"
              >
                <Outdent className="h-4 w-4" />
              </ToolbarButton>
            </ToolbarGroup>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Insert */}
            <ToolbarGroup>
              {/* Table */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Ҷадвал" data-testid="button-insert-table">
                    <TableIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Илова кардани ҷадвал</p>
                    <Button size="sm" onClick={insertTable} data-testid="button-insert-table-3x3">
                      3 x 3 Ҷадвал
                    </Button>
                    {editor.isActive('table') && (
                      <div className="space-y-1 border-t pt-2 mt-2">
                        <p className="text-xs text-muted-foreground">Таҳрири ҷадвал</p>
                        <div className="flex gap-1 flex-wrap">
                          <Button size="sm" variant="outline" onClick={() => editor.chain().focus().addRowAfter().run()}>
                            <Plus className="h-3 w-3 mr-1" /> Сатр
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => editor.chain().focus().addColumnAfter().run()}>
                            <Plus className="h-3 w-3 mr-1" /> Сутун
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => editor.chain().focus().deleteRow().run()}>
                            <Trash2 className="h-3 w-3 mr-1" /> Сатр
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => editor.chain().focus().deleteColumn().run()}>
                            <Trash2 className="h-3 w-3 mr-1" /> Сутун
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => editor.chain().focus().deleteTable().run()}>
                            <Trash2 className="h-3 w-3 mr-1" /> Ҷадвал
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Horizontal Rule */}
              <ToolbarButton
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                title="Хати уфуқӣ"
              >
                <Minus className="h-4 w-4" />
              </ToolbarButton>

              {/* Page Break */}
              <ToolbarButton
                onClick={() => editor.chain().focus().insertPageBreak().run()}
                title="Саҳифаи нав (Page Break)"
              >
                <SeparatorHorizontal className="h-4 w-4" data-testid="button-page-break" />
              </ToolbarButton>

              {/* Image Upload */}
              <ToolbarButton
                onClick={() => fileInputRef.current?.click()}
                title="Илова кардани расм"
              >
                <ImagePlus className="h-4 w-4" />
              </ToolbarButton>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </ToolbarGroup>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Search and Replace */}
            <Dialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Ҷустуҷӯ ва иваз" data-testid="button-search-replace">
                  <Search className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ҷустуҷӯ ва иваз</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Ҷустуҷӯ</Label>
                    <Input
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      placeholder="Матни ҷустуҷӯ..."
                      data-testid="input-search"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Иваз ба</Label>
                    <Input
                      value={replaceText}
                      onChange={(e) => setReplaceText(e.target.value)}
                      placeholder="Матни нав..."
                      data-testid="input-replace"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSearch} variant="outline" data-testid="button-find">
                      Пайдо кардан
                    </Button>
                    <Button onClick={handleReplace} variant="outline" data-testid="button-replace">
                      Иваз кардан
                    </Button>
                    <Button onClick={handleReplaceAll} data-testid="button-replace-all">
                      Ҳамаро иваз
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Undo/Redo */}
            <ToolbarGroup>
              <ToolbarButton
                onClick={handlePrint}
                title="Чоп кардан"
              >
                <Printer className="h-4 w-4" />
              </ToolbarButton>
              <Separator orientation="vertical" className="h-6 mx-1" />
              <ToolbarButton
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                title="Бозгашт (Ctrl+Z)"
              >
                <Undo className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                title="Такрор (Ctrl+Y)"
              >
                <Redo className="h-4 w-4" />
              </ToolbarButton>
            </ToolbarGroup>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Show Formatting Marks */}
            <ToolbarButton
              onClick={() => setShowFormattingMarks(!showFormattingMarks)}
              isActive={showFormattingMarks}
              title="Намоиши ҳамаи аломатҳо"
            >
              <Pilcrow className="h-4 w-4" data-testid="button-show-formatting-marks" />
            </ToolbarButton>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Stamps */}
            {canApprove && (
              <ToolbarGroup>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={insertApprovalStamp}
                  className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                  title="Мӯҳри иҷозат"
                  data-testid="button-approval-stamp"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Иҷозат
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={insertRejectionStamp}
                  className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  title="Мӯҳри радшуда"
                  data-testid="button-rejection-stamp"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Радшуда
                </Button>
              </ToolbarGroup>
            )}

            {departmentName && (
              <ToolbarButton
                onClick={insertDepartmentStampGraphic}
                title="Мӯҳри шӯъба"
              >
                <Stamp className="h-4 w-4" />
              </ToolbarButton>
            )}

            {/* Export buttons */}
            {(onExportDocx || onExportPdf) && (
              <>
                <Separator orientation="vertical" className="h-6 mx-1" />
                <ToolbarGroup>
                  {onExportDocx && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={onExportDocx}
                      className="h-8"
                      title="Экспорт ба Word"
                      data-testid="button-export-docx"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      DOCX
                    </Button>
                  )}
                  {onExportPdf && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={onExportPdf}
                      className="h-8"
                      title="Экспорт ба PDF"
                      data-testid="button-export-pdf"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                  )}
                </ToolbarGroup>
              </>
            )}
          </div>
        </div>
      )}

      <div className="bg-gray-200 p-4 overflow-auto max-h-[70vh] flex justify-center">
        <div 
          className="bg-white shadow-lg"
          style={{
            width: '210mm',
            minHeight: '297mm',
            padding: '20mm 25mm',
          }}
        >
          <EditorContent 
            editor={editor} 
            className={cn(
              "prose prose-sm max-w-none focus:outline-none",
              "[&_.ProseMirror]:min-h-[257mm] [&_.ProseMirror]:outline-none",
              "[&_.ProseMirror]:font-['Noto_Sans',sans-serif] [&_.ProseMirror]:[font-size:14pt]",
              "[&_.ProseMirror]:whitespace-pre-wrap [&_.ProseMirror_p]:whitespace-pre-wrap",
              "[&_.ProseMirror_p]:!block [&_.ProseMirror_p]:!w-full [&_.ProseMirror_p]:!min-h-[1.2em] [&_.ProseMirror_p]:!m-0",
              "[&_.ProseMirror_.text-center]:!text-center [&_.ProseMirror_.text-right]:!text-right [&_.ProseMirror_.text-justify]:!text-justify",
              "[&_.ProseMirror_[data-align=center]]:!text-center [&_.ProseMirror_[data-align=right]]:!text-right [&_.ProseMirror_[data-align=justify]]:!text-justify",
              "[&_.ProseMirror_h1]:text-2xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:my-4",
              "[&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:my-3",
              "[&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:font-bold [&_.ProseMirror_h3]:my-2",
              "[&_.ProseMirror_table]:border-collapse [&_.ProseMirror_table]:w-full",
              "[&_.ProseMirror_th]:border [&_.ProseMirror_th]:border-gray-300 [&_.ProseMirror_th]:p-2 [&_.ProseMirror_th]:bg-gray-100",
              "[&_.ProseMirror_td]:border [&_.ProseMirror_td]:border-gray-300 [&_.ProseMirror_td]:p-2",
              "[&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-gray-300 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic",
              "[&_.ProseMirror_hr]:border-t-2 [&_.ProseMirror_hr]:border-gray-300 [&_.ProseMirror_hr]:my-4",
              "[&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:h-auto",
              "[&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6",
              "[&_.ProseMirror_.page-break]:my-8 [&_.ProseMirror_.page-break]:py-4 [&_.ProseMirror_.page-break]:border-t-2 [&_.ProseMirror_.page-break]:border-b-2 [&_.ProseMirror_.page-break]:border-dashed [&_.ProseMirror_.page-break]:border-gray-400 [&_.ProseMirror_.page-break]:bg-gray-50 [&_.ProseMirror_.page-break]:text-center [&_.ProseMirror_.page-break]:text-gray-500 [&_.ProseMirror_.page-break]:text-sm [&_.ProseMirror_.page-break]:font-medium",
              showFormattingMarks && "[&_.ProseMirror_p]:after:content-['¶'] [&_.ProseMirror_p]:after:text-blue-300 [&_.ProseMirror_p]:after:text-sm",
              showFormattingMarks && "[&_.ProseMirror]:whitespace-pre-wrap"
            )}
            style={{
              lineHeight: lineSpacing,
            }}
            data-testid="document-editor-content"
          />
        </div>
      </div>

      {/* Page info footer */}
      <div className="border-t bg-muted/30 px-4 py-1 text-xs text-muted-foreground flex items-center justify-between">
        <span>Формат: A4 (210 × 297 мм)</span>
        <span>Фосилаи сатрҳо: {lineSpacing}</span>
      </div>
    </div>
  );
}
