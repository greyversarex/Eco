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
      Backspace: () => {
        const { selection } = this.editor.state;
        const { $from, empty } = selection;

        // Only outdent if cursor is at the very beginning of the paragraph and nothing is selected
        if (!empty || $from.parentOffset !== 0) {
          return false;
        }

        const { textIndent } = $from.parent.attrs;
        if (textIndent && parseInt(textIndent) > 0) {
          return this.editor.commands.outdent();
        }

        return false;
      },
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

const convertToPx = (val: string): number | null => {
  if (!val) return null;
  val = val.trim();
  const cmMatch = val.match(/([-\d.]+)\s*cm/i);
  if (cmMatch) return Math.round(parseFloat(cmMatch[1]) * 37.8);
  const mmMatch = val.match(/([-\d.]+)\s*mm/i);
  if (mmMatch) return Math.round(parseFloat(mmMatch[1]) * 3.78);
  const ptMatch = val.match(/([-\d.]+)\s*pt/i);
  if (ptMatch) return Math.round(parseFloat(ptMatch[1]) * 1.33);
  const pxMatch = val.match(/([-\d.]+)\s*px/i);
  if (pxMatch) return Math.round(parseFloat(pxMatch[1]));
  const inMatch = val.match(/([-\d.]+)\s*in/i);
  if (inMatch) return Math.round(parseFloat(inMatch[1]) * 96);
  return null;
};

const cleanWordHtml = (html: string): string => {
  let cleaned = html;
  cleaned = cleaned.replace(/<!--\[if[^>]*>[\s\S]*?<!\[endif\]-->/gi, '');
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');
  cleaned = cleaned.replace(/<xml[^>]*>[\s\S]*?<\/xml>/gi, '');
  cleaned = cleaned.replace(/<\/?o:[^>]*>/gi, '');
  cleaned = cleaned.replace(/<\/?w:[^>]*>/gi, '');
  cleaned = cleaned.replace(/<\/?m:[^>]*>/gi, '');
  cleaned = cleaned.replace(/<\/?v:[^>]*>/gi, '');

  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.left = '-9999px';
  iframe.style.width = '1px';
  iframe.style.height = '1px';
  document.body.appendChild(iframe);
  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    const fallback = document.createElement('div');
    fallback.innerHTML = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    return fallback.innerHTML;
  }
  iframeDoc.open();
  iframeDoc.write('<!DOCTYPE html><html><head></head><body>' + cleaned + '</body></html>');
  iframeDoc.close();

  const tempDiv = iframeDoc.body;

  const iframeWin = iframe.contentWindow!;

  const processElement = (el: HTMLElement) => {
    const cs = iframeWin.getComputedStyle(el);
    const newStyles: string[] = [];

    const tag = el.tagName.toLowerCase();
    const isBlock = tag === 'p' || tag === 'div' || tag === 'li' || tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4';

    if (isBlock) {
      const align = cs.textAlign;
      if (align && align !== 'start' && ['left', 'center', 'right', 'justify'].includes(align)) {
        newStyles.push(`text-align: ${align}`);
      }

      const ti = cs.textIndent;
      if (ti && ti !== '0px') {
        const px = parseInt(ti);
        if (px > 0) newStyles.push(`text-indent: ${px}px`);
      }

      const ml = cs.marginLeft;
      if (ml && ml !== '0px') {
        const px = parseInt(ml);
        if (px > 0) newStyles.push(`padding-left: ${px}px`);
      }

      const mr = cs.marginRight;
      if (mr && mr !== '0px') {
        const px = parseInt(mr);
        if (px > 0) newStyles.push(`padding-right: ${px}px`);
      }

      const lh = cs.lineHeight;
      if (lh && lh !== 'normal') {
        newStyles.push(`line-height: ${lh}`);
      }
    }

    const ff = cs.fontFamily;
    if (ff && !ff.toLowerCase().includes('symbol')) {
      const primary = ff.replace(/["']/g, '').split(',')[0].trim();
      if (primary && primary.toLowerCase() !== 'times new roman' && primary.toLowerCase() !== 'serif') {
        newStyles.push(`font-family: '${primary}'`);
      }
    }

    const fs = cs.fontSize;
    if (fs) {
      const pxVal = parseFloat(fs);
      if (pxVal) {
        const pt = Math.round(pxVal * 0.75 * 10) / 10;
        if (pt !== 14 && pt !== 12) {
          newStyles.push(`font-size: ${pt}pt`);
        }
      }
    }

    const fw = cs.fontWeight;
    if (fw && fw !== 'normal' && fw !== '400') {
      newStyles.push(`font-weight: ${fw}`);
    }

    const fst = cs.fontStyle;
    if (fst && fst !== 'normal') {
      newStyles.push(`font-style: ${fst}`);
    }

    const td = cs.textDecorationLine || cs.getPropertyValue('text-decoration-line');
    if (td && td !== 'none') {
      newStyles.push(`text-decoration: ${td}`);
    }

    const col = cs.color;
    if (col && col !== 'rgb(0, 0, 0)') {
      newStyles.push(`color: ${col}`);
    }

    const bg = cs.backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
      newStyles.push(`background-color: ${bg}`);
    }

    el.removeAttribute('class');
    el.removeAttribute('lang');
    el.removeAttribute('data-ccp-props');
    el.removeAttribute('data-ccp-parastyle');

    if (newStyles.length > 0) {
      el.setAttribute('style', newStyles.join('; '));
    } else {
      el.removeAttribute('style');
    }

    const children = Array.from(el.children) as HTMLElement[];
    children.forEach(child => processElement(child));

    if (tag === 'span' && !el.hasAttributes() && el.childNodes.length > 0) {
      const parent = el.parentNode;
      if (parent) {
        while (el.firstChild) {
          parent.insertBefore(el.firstChild, el);
        }
        parent.removeChild(el);
      }
    }
  };

  const children = Array.from(tempDiv.children) as HTMLElement[];
  children.forEach(child => processElement(child));

  const emptyParagraphs = tempDiv.querySelectorAll('p');
  emptyParagraphs.forEach(p => {
    const text = p.textContent?.trim();
    if (!text && !p.querySelector('img, br, table')) {
      p.innerHTML = '<br>';
    }
  });

  const result = tempDiv.innerHTML;
  document.body.removeChild(iframe);
  return result;
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



function DocumentRuler({ 
  editor, 
  leftIndentMm, 
  rightIndentMm, 
  firstLineIndentMm,
  onLeftIndentChange,
  onRightIndentChange,
  onFirstLineIndentChange,
}: {
  editor: Editor | null;
  leftIndentMm: number;
  rightIndentMm: number;
  firstLineIndentMm: number;
  onLeftIndentChange: (mm: number) => void;
  onRightIndentChange: (mm: number) => void;
  onFirstLineIndentChange: (mm: number) => void;
}) {
  const rulerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<'left' | 'right' | 'firstLine' | null>(null);
  const contentWidthMm = 210 - MARGIN_LEFT_MM - MARGIN_RIGHT_MM;

  const handleMouseDown = (type: 'left' | 'right' | 'firstLine') => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(type);
  };

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const ruler = rulerRef.current;
      if (!ruler) return;
      const rect = ruler.getBoundingClientRect();
      const contentStartPx = rect.width * (MARGIN_LEFT_MM / 210);
      const contentEndPx = rect.width * ((210 - MARGIN_RIGHT_MM) / 210);
      const contentWidthPx = contentEndPx - contentStartPx;
      const relX = e.clientX - rect.left;

      if (dragging === 'left') {
        const mm = Math.max(0, Math.min(contentWidthMm - rightIndentMm - 10, ((relX - contentStartPx) / contentWidthPx) * contentWidthMm));
        onLeftIndentChange(Math.round(mm));
      } else if (dragging === 'right') {
        const fromRight = contentEndPx - relX;
        const mm = Math.max(0, Math.min(contentWidthMm - leftIndentMm - 10, (fromRight / contentWidthPx) * contentWidthMm));
        onRightIndentChange(Math.round(mm));
      } else if (dragging === 'firstLine') {
        const mm = Math.max(-leftIndentMm, Math.min(contentWidthMm - rightIndentMm - leftIndentMm, ((relX - contentStartPx) / contentWidthPx) * contentWidthMm - leftIndentMm));
        onFirstLineIndentChange(Math.round(mm));
      }
    };

    const handleMouseUp = () => setDragging(null);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, contentWidthMm, leftIndentMm, rightIndentMm, onLeftIndentChange, onRightIndentChange, onFirstLineIndentChange]);

  const leftPct = MARGIN_LEFT_MM / 210 * 100;
  const rightPct = MARGIN_RIGHT_MM / 210 * 100;
  const leftIndentPct = (MARGIN_LEFT_MM + leftIndentMm) / 210 * 100;
  const rightIndentPct = (MARGIN_RIGHT_MM + rightIndentMm) / 210 * 100;
  const firstLinePct = (MARGIN_LEFT_MM + leftIndentMm + firstLineIndentMm) / 210 * 100;

  const ticks = [];
  for (let cm = 0; cm <= 16; cm++) {
    const mm = cm * 10;
    const pct = (MARGIN_LEFT_MM + mm) / 210 * 100;
    if (pct > (100 - rightPct + 0.5)) break;
    ticks.push(
      <div key={`cm${cm}`} style={{ position: 'absolute', left: `${pct}%`, top: 0, bottom: 0 }}>
        <div style={{ position: 'absolute', left: '-0.5px', bottom: 0, width: '1px', height: '8px', background: '#666' }} />
        {cm > 0 && (
          <span style={{ position: 'absolute', left: '50%', top: '1px', transform: 'translateX(-50%)', fontSize: '8px', color: '#666', fontFamily: 'Arial', lineHeight: 1 }}>
            {cm}
          </span>
        )}
      </div>
    );
    if (mm + 5 <= contentWidthMm) {
      const halfPct = (MARGIN_LEFT_MM + mm + 5) / 210 * 100;
      ticks.push(
        <div key={`h${cm}`} style={{ position: 'absolute', left: `${halfPct}%`, bottom: 0 }}>
          <div style={{ position: 'absolute', left: '-0.5px', bottom: 0, width: '1px', height: '4px', background: '#999' }} />
        </div>
      );
    }
  }

  return (
    <div
      ref={rulerRef}
      className="shrink-0 select-none"
      style={{
        height: '24px',
        background: '#e0e0e0',
        borderBottom: '1px solid #bbb',
        position: 'relative',
        width: '210mm',
        maxWidth: '100%',
        margin: '0 auto',
        cursor: dragging ? 'col-resize' : 'default',
      }}
    >
      <div style={{ position: 'absolute', left: `${leftPct}%`, right: `${rightPct}%`, top: 0, bottom: 0, background: '#fff' }} />

      {ticks}

      <div
        onMouseDown={handleMouseDown('firstLine')}
        title="Отступи сатри аввал"
        style={{
          position: 'absolute',
          left: `${firstLinePct}%`,
          top: '0px',
          transform: 'translateX(-50%)',
          cursor: 'col-resize',
          zIndex: 5,
          width: '0',
          height: '0',
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '8px solid #4a7ccc',
        }}
      />

      <div
        onMouseDown={handleMouseDown('left')}
        title="Канори чап"
        style={{
          position: 'absolute',
          left: `${leftIndentPct}%`,
          bottom: '0px',
          transform: 'translateX(-50%)',
          cursor: 'col-resize',
          zIndex: 5,
          width: '0',
          height: '0',
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderBottom: '8px solid #4a7ccc',
        }}
      />

      <div
        onMouseDown={handleMouseDown('right')}
        title="Канори рост"
        style={{
          position: 'absolute',
          right: `${rightIndentPct}%`,
          bottom: '0px',
          transform: 'translateX(50%)',
          cursor: 'col-resize',
          zIndex: 5,
          width: '0',
          height: '0',
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderBottom: '8px solid #4a7ccc',
        }}
      />
    </div>
  );
}

const PAGE_HEIGHT_MM = 297;
const MARGIN_TOP_MM = 20;
const MARGIN_BOTTOM_MM = 20;
const MARGIN_LEFT_MM = 25;
const MARGIN_RIGHT_MM = 25;
const GAP_PX = 16;

function mmToPx(mm: number): number {
  return mm * 3.7795275591;
}

function PagedEditor({ editor, lineSpacing, showFormattingMarks }: { editor: Editor | null; lineSpacing: string; showFormattingMarks: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);
  const [pageHPx, setPageHPx] = useState(() => mmToPx(PAGE_HEIGHT_MM));
  const [totalHeight, setTotalHeight] = useState(() => mmToPx(PAGE_HEIGHT_MM));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRunning = useRef(false);
  const layoutPass = useRef(0);

  const doLayout = useCallback(() => {
    if (isRunning.current) return;
    isRunning.current = true;

    try {
      const container = containerRef.current;
      if (!container) return;
      const pm = container.querySelector('.ProseMirror') as HTMLElement;
      if (!pm) return;

      const pxPerMm = container.offsetWidth / 210;
      if (pxPerMm <= 0) return;
      const pageH = PAGE_HEIGHT_MM * pxPerMm;
      const mTop = MARGIN_TOP_MM * pxPerMm;
      const mBottom = MARGIN_BOTTOM_MM * pxPerMm;
      const mLeft = MARGIN_LEFT_MM * pxPerMm;
      const mRight = MARGIN_RIGHT_MM * pxPerMm;
      const contentH = (PAGE_HEIGHT_MM - MARGIN_TOP_MM - MARGIN_BOTTOM_MM) * pxPerMm;

      pm.style.paddingTop = `${mTop}px`;
      pm.style.paddingBottom = `${mBottom}px`;
      pm.style.paddingLeft = `${mLeft}px`;
      pm.style.paddingRight = `${mRight}px`;

      const blocks = Array.from(pm.querySelectorAll(':scope > *')) as HTMLElement[];
      for (const el of blocks) {
        if (el.dataset.pbm) {
          el.style.marginTop = '';
          delete el.dataset.pbm;
        }
      }

      void pm.offsetHeight;

      let page = 0;
      let added = 0;

      for (const el of blocks) {
        if (el.offsetHeight === 0) continue;

        const blockTopInContent = el.offsetTop - mTop - added;
        const blockBottomInContent = blockTopInContent + el.offsetHeight;
        const pageBoundary = (page + 1) * contentH;

        if (blockBottomInContent > pageBoundary) {
          const push = (pageBoundary - blockTopInContent) + mBottom + GAP_PX + mTop;
          el.style.marginTop = `${push}px`;
          el.dataset.pbm = '1';
          added += push;
          page++;
        }
      }

      const pages = page + 1;
      const pmOffset = pm.offsetTop;
      const pmTotalH = pages * pageH + (pages - 1) * GAP_PX;
      pm.style.minHeight = `${pmTotalH}px`;

      setPageCount(pages);
      setPageHPx(pageH);
      setTotalHeight(pmOffset + pmTotalH);
    } finally {
      isRunning.current = false;
    }

    const pass = ++layoutPass.current;
    requestAnimationFrame(() => {
      if (layoutPass.current === pass) {
        isRunning.current = false;
        doLayout();
      }
    });
  }, []);

  const scheduleLayout = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(doLayout, 50);
  }, [doLayout]);

  useEffect(() => {
    if (!editor) return;
    editor.on('update', scheduleLayout);
    editor.on('create', scheduleLayout);
    scheduleLayout();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      editor.off('update', scheduleLayout);
      editor.off('create', scheduleLayout);
    };
  }, [editor, scheduleLayout]);

  useEffect(() => {
    scheduleLayout();
  }, [lineSpacing, scheduleLayout]);

  const pmOffset = containerRef.current?.querySelector('.ProseMirror')?.offsetTop ?? 0;
  const sheets = [];
  const gaps = [];
  for (let i = 0; i < pageCount; i++) {
    const pageTop = pmOffset + i * (pageHPx + GAP_PX);
    sheets.push({ top: pageTop, height: pageHPx });
    if (i < pageCount - 1) {
      gaps.push({ top: pageTop + pageHPx, height: GAP_PX });
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .doc-paged .ProseMirror {
          outline: none;
          overflow-wrap: anywhere;
          word-break: break-word;
          font-family: 'Noto Sans', sans-serif;
          font-size: 14pt;
          white-space: pre-wrap;
          position: relative;
          z-index: 1;
          overflow-x: hidden;
        }
        .doc-paged .ProseMirror p {
          display: block !important;
          min-height: 1.2em !important;
          margin: 0 !important;
          white-space: pre-wrap;
          padding-left: var(--left-indent, 0);
          padding-right: var(--right-indent, 0);
          text-indent: var(--first-line-indent, 0);
          box-sizing: border-box;
        }
        .doc-paged .ProseMirror .text-center,
        .doc-paged .ProseMirror [data-align=center] { text-align: center !important; }
        .doc-paged .ProseMirror .text-right,
        .doc-paged .ProseMirror [data-align=right] { text-align: right !important; }
        .doc-paged .ProseMirror .text-justify,
        .doc-paged .ProseMirror [data-align=justify] { text-align: justify !important; }
        .doc-paged .ProseMirror h1 { font-size: 1.5rem; font-weight: bold; margin: 1rem 0; }
        .doc-paged .ProseMirror h2 { font-size: 1.25rem; font-weight: bold; margin: 0.75rem 0; }
        .doc-paged .ProseMirror h3 { font-size: 1.125rem; font-weight: bold; margin: 0.5rem 0; }
        .doc-paged .ProseMirror table { border-collapse: collapse; width: 100%; }
        .doc-paged .ProseMirror th { border: 1px solid #d1d5db; padding: 0.5rem; background: #f3f4f6; }
        .doc-paged .ProseMirror td { border: 1px solid #d1d5db; padding: 0.5rem; }
        .doc-paged .ProseMirror blockquote { border-left: 4px solid #d1d5db; padding-left: 1rem; font-style: italic; }
        .doc-paged .ProseMirror hr { border-top: 2px solid #d1d5db; margin: 1rem 0; }
        .doc-paged .ProseMirror img { max-width: 100%; height: auto; }
        .doc-paged .ProseMirror ul { list-style: disc; padding-left: 1.5rem; }
        .doc-paged .ProseMirror ol { list-style: decimal; padding-left: 1.5rem; }
        .doc-paged .ProseMirror .page-break {
          margin: 2rem 0; padding: 1rem 0;
          border-top: 2px dashed #9ca3af; border-bottom: 2px dashed #9ca3af;
          background: #f9fafb; text-align: center; color: #6b7280;
          font-size: 0.875rem; font-weight: 500;
        }
        ${showFormattingMarks ? `.doc-paged .ProseMirror p::after { content: '¶'; color: #93c5fd; font-size: 0.875rem; }` : ''}
      `}} />
      <div className="overflow-auto flex-1" style={{ minHeight: 0, background: '#e8e8e8' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0' }}>
          <div
            ref={containerRef}
            className="doc-paged"
            style={{ width: '210mm', maxWidth: '100%', position: 'relative', height: `${totalHeight}px` }}
          >
            {sheets.map((s, i) => (
              <div key={`s${i}`} style={{
                position: 'absolute', left: 0, right: 0, top: s.top, height: s.height,
                background: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
                pointerEvents: 'none', zIndex: 0,
              }} />
            ))}
            {gaps.map((g, i) => (
              <div key={`g${i}`} style={{
                position: 'absolute', left: -16, right: -16, top: g.top, height: g.height,
                background: '#e8e8e8', zIndex: 2, pointerEvents: 'none',
              }} />
            ))}
            <EditorContent
              editor={editor}
              className="prose prose-sm max-w-none focus:outline-none"
              style={{ lineHeight: lineSpacing }}
              data-testid="document-editor-content"
            />
          </div>
          <div style={{ textAlign: 'center', padding: '8px', fontSize: '11px', color: '#999' }}>
            {pageCount} саҳ.
          </div>
        </div>
      </div>
    </>
  );
}

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
  const [leftIndentMm, setLeftIndentMm] = useState(0);
  const [rightIndentMm, setRightIndentMm] = useState(0);
  const [firstLineIndentMm, setFirstLineIndentMm] = useState(0);
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

  useEffect(() => {
    if (!editor) return;
    const pm = document.querySelector('.doc-paged .ProseMirror') as HTMLElement;
    if (!pm) return;
    pm.style.setProperty('--left-indent', `${leftIndentMm}mm`);
    pm.style.setProperty('--right-indent', `${rightIndentMm}mm`);
    pm.style.setProperty('--first-line-indent', `${firstLineIndentMm}mm`);
  }, [editor, leftIndentMm, rightIndentMm, firstLineIndentMm]);

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
      const contentHtml = editor?.getHTML() || '';
      // Clear title to avoid browser adding it to header
      printWindow.document.write(`
        <html>
          <head>
            <title></title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;700&family=Noto+Serif:wght@400;700&family=Roboto:wght@400;700&family=Open+Sans:wght@400;700&display=swap');
              @page {
                size: A4;
                margin: 20mm;
              }
              html, body {
                height: 100%;
                margin: 0 !important;
                padding: 0 !important;
              }
              body { 
                font-family: 'Noto Sans', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                line-height: 1.5;
                font-size: 14pt;
                color: #000;
                background: #fff;
              }
              @media print {
                @page {
                  margin: 20mm;
                }
                body { 
                  padding: 0; 
                  margin: 0 !important; 
                }
                .page-break { 
                  page-break-after: always;
                  display: none;
                }
                button, .no-print { display: none !important; }
                
                /* Hide header and footer (date, title, URL) */
                header, footer, .header, .footer { display: none !important; }
              }
              img { max-width: 100%; height: auto; display: block; margin: 1em 0; }
              table { border-collapse: collapse; width: 100%; margin-bottom: 1em; table-layout: fixed; }
              table, th, td { border: 1px solid #000; }
              th, td { padding: 8px; text-align: left; vertical-align: top; overflow-wrap: break-word; }
              p { margin: 0; min-height: 1.2em; white-space: pre-wrap; word-break: break-word; }
              .text-center { text-align: center !important; }
              .text-right { text-align: right !important; }
              .text-justify { text-align: justify !important; }
              .text-left { text-align: left !important; }
              
              .ProseMirror { white-space: pre-wrap; }
              [data-align="center"] { text-align: center !important; }
              [data-align="right"] { text-align: right !important; }
              [data-align="justify"] { text-align: justify !important; }
            </style>
          </head>
          <body>
            <div class="ProseMirror">
              ${contentHtml}
            </div>
            <script>
              window.onload = () => {
                // Ensure images are loaded before printing
                const images = document.getElementsByTagName('img');
                const imagePromises = Array.from(images).map(img => {
                  if (img.complete) return Promise.resolve();
                  return new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = resolve;
                  });
                });

                Promise.all(imagePromises).then(() => {
                  setTimeout(() => {
                    window.print();
                    // Optional: window.close();
                  }, 500);
                });
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
    <div className={cn("border rounded-lg overflow-hidden bg-background flex flex-col", className)}>
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

      {!isReadOnly && (
        <div style={{ display: 'flex', justifyContent: 'center', background: '#e8e8e8' }}>
          <DocumentRuler
            editor={editor}
            leftIndentMm={leftIndentMm}
            rightIndentMm={rightIndentMm}
            firstLineIndentMm={firstLineIndentMm}
            onLeftIndentChange={setLeftIndentMm}
            onRightIndentChange={setRightIndentMm}
            onFirstLineIndentChange={setFirstLineIndentMm}
          />
        </div>
      )}
      <PagedEditor editor={editor} lineSpacing={lineSpacing} showFormattingMarks={showFormattingMarks} />

      {/* Page info footer */}
      <div className="border-t bg-muted/30 px-4 py-1 text-xs text-muted-foreground flex items-center justify-between shrink-0">
        <span>A4 (210 × 297 мм)</span>
        <span>Фосилаи сатрҳо: {lineSpacing}</span>
      </div>
    </div>
  );
}
