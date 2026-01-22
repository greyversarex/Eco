import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
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
  Indent,
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useRef, useCallback } from 'react';

interface DocumentEditorProps {
  content: string;
  onChange: (html: string) => void;
  departmentName?: string;
  canApprove?: boolean;
  onInsertStamp?: () => void;
  onExportDocx?: () => void;
  onExportPdf?: () => void;
  readOnly?: boolean;
  className?: string;
}

const FONT_FAMILIES = [
  { value: 'Arial', label: 'Arial' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Calibri', label: 'Calibri' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Tahoma', label: 'Tahoma' },
  { value: 'Trebuchet MS', label: 'Trebuchet MS' },
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

export function DocumentEditor({
  content,
  onChange,
  departmentName,
  canApprove = false,
  onInsertStamp,
  onExportDocx,
  onExportPdf,
  readOnly = false,
  className,
}: DocumentEditorProps) {
  const [searchText, setSearchText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      Image.configure({
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
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

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

  const handleSearch = () => {
    if (!editor || !searchText) return;
    const text = editor.getText();
    const index = text.indexOf(searchText);
    if (index !== -1) {
      editor.chain().focus().setTextSelection({ from: index, to: index + searchText.length }).run();
    }
  };

  const handleReplace = () => {
    if (!editor || !searchText) return;
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);
    if (selectedText === searchText) {
      editor.chain().focus().insertContent(replaceText).run();
    } else {
      handleSearch();
    }
  };

  const handleReplaceAll = () => {
    if (!editor || !searchText) return;
    const html = editor.getHTML();
    const newHtml = html.split(searchText).join(replaceText);
    editor.commands.setContent(newHtml);
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

  const insertApprovalStamp = () => {
    const stampSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="100" viewBox="0 0 280 100">
      <rect x="10" y="10" width="260" height="80" rx="10" ry="10" fill="rgba(22, 163, 74, 0.1)" stroke="#16a34a" stroke-width="4"/>
      <circle cx="60" cy="50" r="32" fill="rgba(22, 163, 74, 0.05)" stroke="#16a34a" stroke-width="3"/>
      <circle cx="60" cy="50" r="24" fill="none" stroke="#16a34a" stroke-width="2"/>
      <text x="60" y="46" text-anchor="middle" font-size="11" font-weight="bold" fill="#16a34a" font-family="Arial, sans-serif">РАИС</text>
      <text x="60" y="60" text-anchor="middle" font-size="10" fill="#16a34a" font-family="Arial, sans-serif">★ ★ ★</text>
      <text x="175" y="60" text-anchor="middle" font-size="32" font-weight="bold" fill="#16a34a" font-family="Arial, sans-serif" letter-spacing="4">ИҶОЗАТ</text>
    </svg>`;
    const dataUrl = svgToDataUrl(stampSvg);
    editor.chain().focus().setImage({ src: dataUrl }).run();
  };

  const insertRejectionStamp = () => {
    const stampSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100" viewBox="0 0 300 100">
      <rect x="10" y="10" width="280" height="80" rx="10" ry="10" fill="rgba(220, 38, 38, 0.1)" stroke="#dc2626" stroke-width="4"/>
      <circle cx="60" cy="50" r="32" fill="rgba(220, 38, 38, 0.05)" stroke="#dc2626" stroke-width="3"/>
      <circle cx="60" cy="50" r="24" fill="none" stroke="#dc2626" stroke-width="2"/>
      <text x="60" y="46" text-anchor="middle" font-size="11" font-weight="bold" fill="#dc2626" font-family="Arial, sans-serif">РАИС</text>
      <text x="60" y="60" text-anchor="middle" font-size="10" fill="#dc2626" font-family="Arial, sans-serif">★ ★ ★</text>
      <text x="190" y="60" text-anchor="middle" font-size="30" font-weight="bold" fill="#dc2626" font-family="Arial, sans-serif" letter-spacing="3">РАДШУДА</text>
    </svg>`;
    const dataUrl = svgToDataUrl(stampSvg);
    editor.chain().focus().setImage({ src: dataUrl }).run();
  };

  const insertDepartmentStampGraphic = () => {
    if (!departmentName) return;
    const stampSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
      <circle cx="90" cy="90" r="80" fill="rgba(22, 101, 52, 0.05)" stroke="#166534" stroke-width="4"/>
      <circle cx="90" cy="90" r="68" fill="none" stroke="#166534" stroke-width="2"/>
      <circle cx="90" cy="90" r="35" fill="none" stroke="#166534" stroke-width="2"/>
      <text x="90" y="86" text-anchor="middle" font-size="14" font-weight="bold" fill="#166534" font-family="Arial, sans-serif">МӮҲР</text>
      <text x="90" y="102" text-anchor="middle" font-size="12" fill="#166534" font-family="Arial, sans-serif">★ ★ ★</text>
      <text x="90" y="42" text-anchor="middle" font-size="11" font-weight="bold" fill="#166534" font-family="Arial, sans-serif">${departmentName.substring(0, 20)}</text>
      <text x="90" y="150" text-anchor="middle" font-size="9" fill="#166534" font-family="Arial, sans-serif">КУМИТАИ ҲИФЗИ МУҲИТИ ЗИСТ</text>
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
            <Select onValueChange={setFontSize} defaultValue="12">
              <SelectTrigger className="w-[70px] h-8" data-testid="select-font-size">
                <SelectValue placeholder="12" />
              </SelectTrigger>
              <SelectContent>
                {FONT_SIZES.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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
                <Indent className="h-4 w-4" />
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

      <EditorContent 
        editor={editor} 
        className={cn(
          "prose prose-sm max-w-none p-4 min-h-[400px] focus:outline-none",
          "[&_.ProseMirror]:min-h-[400px] [&_.ProseMirror]:outline-none",
          "[&_.ProseMirror_table]:border-collapse [&_.ProseMirror_table]:w-full",
          "[&_.ProseMirror_th]:border [&_.ProseMirror_th]:border-gray-300 [&_.ProseMirror_th]:p-2 [&_.ProseMirror_th]:bg-gray-100",
          "[&_.ProseMirror_td]:border [&_.ProseMirror_td]:border-gray-300 [&_.ProseMirror_td]:p-2",
          "[&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-gray-300 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic",
          "[&_.ProseMirror_hr]:border-t-2 [&_.ProseMirror_hr]:border-gray-300 [&_.ProseMirror_hr]:my-4",
          "[&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:h-auto"
        )}
        data-testid="document-editor-content"
      />
    </div>
  );
}
