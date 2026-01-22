import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentEditorProps {
  content: string;
  onChange: (html: string) => void;
  departmentName?: string;
  onInsertStamp?: () => void;
  onExportDocx?: () => void;
  onExportPdf?: () => void;
  readOnly?: boolean;
  className?: string;
}

export function DocumentEditor({
  content,
  onChange,
  departmentName,
  onInsertStamp,
  onExportDocx,
  onExportPdf,
  readOnly = false,
  className,
}: DocumentEditorProps) {
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
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return (
      <div className="border rounded-lg p-8 text-center text-gray-500">
        Боргузорӣ...
      </div>
    );
  }

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

  const insertApprovalStamp = () => {
    const stampHtml = `
      <div style="position: relative; display: inline-block; margin: 10px 0; transform: rotate(-15deg);">
        <div style="
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border: 3px solid #16a34a;
          border-radius: 8px;
          background: rgba(22, 163, 74, 0.1);
        ">
          <div style="
            width: 50px;
            height: 50px;
            border: 2px solid #16a34a;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            color: #16a34a;
          ">Раис</div>
          <div style="
            font-size: 28px;
            font-weight: bold;
            color: #16a34a;
            text-transform: uppercase;
            letter-spacing: 2px;
          ">ИҶОЗАТ</div>
        </div>
      </div>
    `;
    editor.chain().focus().insertContent(stampHtml).run();
  };

  const insertRejectionStamp = () => {
    const stampHtml = `
      <div style="position: relative; display: inline-block; margin: 10px 0; transform: rotate(-15deg);">
        <div style="
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border: 3px solid #dc2626;
          border-radius: 8px;
          background: rgba(220, 38, 38, 0.1);
        ">
          <div style="
            width: 50px;
            height: 50px;
            border: 2px solid #dc2626;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            color: #dc2626;
          ">Раис</div>
          <div style="
            font-size: 28px;
            font-weight: bold;
            color: #dc2626;
            text-transform: uppercase;
            letter-spacing: 2px;
          ">РАДШУДА</div>
        </div>
      </div>
    `;
    editor.chain().focus().insertContent(stampHtml).run();
  };

  return (
    <div className={cn("flex flex-col overflow-hidden bg-gray-200", className)}>
      {!readOnly && (
        <div className="border-b bg-white px-4 py-2 flex flex-wrap items-center gap-1 shadow-sm shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'bg-gray-200' : ''}
            data-testid="button-bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'bg-gray-200' : ''}
            data-testid="button-italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={editor.isActive('underline') ? 'bg-gray-200' : ''}
            data-testid="button-underline"
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'bg-gray-200' : ''}
            data-testid="button-bullet-list"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? 'bg-gray-200' : ''}
            data-testid="button-ordered-list"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : ''}
            data-testid="button-align-left"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : ''}
            data-testid="button-align-center"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : ''}
            data-testid="button-align-right"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={editor.isActive({ textAlign: 'justify' }) ? 'bg-gray-200' : ''}
            data-testid="button-align-justify"
          >
            <AlignJustify className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <Button
            variant="ghost"
            size="icon"
            onClick={insertTable}
            title="Ҷадвал илова кардан"
            data-testid="button-insert-table"
          >
            <TableIcon className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={insertApprovalStamp}
            className="gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
            title="Иҷозат - тасдиқ кардан"
            data-testid="button-approval-stamp"
          >
            <CheckCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Иҷозат</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={insertRejectionStamp}
            className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Радшуда - рад кардан"
            data-testid="button-rejection-stamp"
          >
            <XCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Радшуда</span>
          </Button>

          {departmentName && (
            <>
              <Separator orientation="vertical" className="h-6 mx-1" />
              <Button
                variant="ghost"
                size="sm"
                onClick={insertDepartmentStamp}
                className="gap-1 text-green-600"
                title="Мӯҳри идора"
                data-testid="button-insert-stamp"
              >
                <Stamp className="h-4 w-4" />
                <span className="hidden sm:inline">Мӯҳр</span>
              </Button>
            </>
          )}

          <Separator orientation="vertical" className="h-6 mx-1" />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            data-testid="button-undo"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            data-testid="button-redo"
          >
            <Redo className="h-4 w-4" />
          </Button>

          {(onExportDocx || onExportPdf) && (
            <>
              <div className="flex-1" />
              {onExportDocx && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onExportDocx}
                  className="gap-1"
                  data-testid="button-export-docx"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">.docx</span>
                </Button>
              )}
              {onExportPdf && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onExportPdf}
                  className="gap-1"
                  data-testid="button-export-pdf"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">.pdf</span>
                </Button>
              )}
            </>
          )}
        </div>
      )}

      <div className="flex-1 overflow-auto p-4 sm:p-8">
        <div className="bg-white shadow-lg mx-auto" style={{ maxWidth: '210mm', minHeight: '297mm' }}>
          <EditorContent 
            editor={editor} 
            className="prose prose-sm max-w-none focus:outline-none"
          />
        </div>
      </div>

      <style>{`
        .ProseMirror {
          min-height: 297mm;
          padding: 20mm 15mm;
          outline: none;
          font-family: 'Times New Roman', Times, serif;
          font-size: 14px;
          line-height: 1.5;
        }
        .ProseMirror p {
          margin: 0.5em 0;
        }
        .ProseMirror table {
          border-collapse: collapse;
          margin: 1em 0;
          width: 100%;
        }
        .ProseMirror th,
        .ProseMirror td {
          border: 1px solid #d1d5db;
          padding: 0.5em;
          min-width: 50px;
        }
        .ProseMirror th {
          background: #f3f4f6;
          font-weight: 600;
        }
        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5em;
        }
        .ProseMirror h1 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.5em 0;
        }
        .ProseMirror h2 {
          font-size: 1.25em;
          font-weight: bold;
          margin: 0.5em 0;
        }
        .ProseMirror h3 {
          font-size: 1.1em;
          font-weight: bold;
          margin: 0.5em 0;
        }
        .ProseMirror img {
          max-width: 100%;
          height: auto;
        }
      `}</style>
    </div>
  );
}
