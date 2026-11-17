import type { Editor } from "@tiptap/core";
import {
  Bold,
  Code,
  Ellipsis,
  Italic,
  Link2,
  List,
  ListOrdered,
  ListTodo,
  Paperclip,
  Plus,
  Quote,
  Redo2,
  Strikethrough,
  Table2,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import type { MouseEvent, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/menu";
import { cn } from "@/lib/cn";

type DescriptionToolbarProps = {
  editor: Editor;
  onLink: () => void;
  onAttach: () => void;
  onMenuOpenChange: (open: boolean) => void;
};

const toolButtonClass = "text-muted-foreground hover:text-foreground";

function keepEditorFocus(event: MouseEvent) {
  event.preventDefault();
}

export function DescriptionToolbar({
  editor,
  onLink,
  onAttach,
  onMenuOpenChange,
}: DescriptionToolbarProps) {
  const { t } = useTranslation();
  const style = editor.isActive("heading", { level: 2 })
    ? "heading"
    : "paragraph";
  const run = (command: () => boolean) => {
    command();
  };

  return (
    <div
      className="flex flex-wrap items-center gap-0.5 border-border/70 border-b px-1.5 py-1"
      role="toolbar"
      aria-label={t("tasks:detail.editor.ariaLabel")}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className={toolButtonClass}
        aria-label={t("tasks:detail.editor.toolbar.insert")}
        onMouseDown={keepEditorFocus}
        onClick={() => editor.chain().focus().insertContent("/").run()}
      >
        <Plus className="size-3.5" />
      </Button>
      <span className="mx-0.5 h-4 w-px bg-border" />
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className={toolButtonClass}
        aria-label={t("tasks:detail.editor.toolbar.undo")}
        disabled={!editor.can().undo()}
        onMouseDown={keepEditorFocus}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo2 className="size-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className={toolButtonClass}
        aria-label={t("tasks:detail.editor.toolbar.redo")}
        disabled={!editor.can().redo()}
        onMouseDown={keepEditorFocus}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo2 className="size-3.5" />
      </Button>
      <span className="mx-0.5 h-4 w-px bg-border" />
      <DropdownMenu onOpenChange={onMenuOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-muted-foreground text-xs hover:text-foreground"
          >
            {t(`tasks:detail.editor.toolbar.${style}`)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          <DropdownMenuRadioGroup
            value={style}
            onValueChange={(value) => {
              const chain = editor.chain().focus();
              if (value === "heading") chain.setHeading({ level: 2 }).run();
              else chain.setParagraph().run();
            }}
          >
            <DropdownMenuRadioItem value="paragraph">
              {t("tasks:detail.editor.toolbar.paragraph")}
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="heading">
              {t("tasks:detail.editor.toolbar.heading")}
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <span className="mx-0.5 h-4 w-px bg-border" />
      <FormatButton
        label={t("tasks:detail.editor.toolbar.bold")}
        active={editor.isActive("bold")}
        onClick={() => run(() => editor.chain().focus().toggleBold().run())}
      >
        <Bold className="size-3.5" />
      </FormatButton>
      <FormatButton
        label={t("tasks:detail.editor.toolbar.italic")}
        active={editor.isActive("italic")}
        onClick={() => run(() => editor.chain().focus().toggleItalic().run())}
      >
        <Italic className="size-3.5" />
      </FormatButton>
      <FormatButton
        label={t("tasks:detail.editor.toolbar.strike")}
        active={editor.isActive("strike")}
        onClick={() => run(() => editor.chain().focus().toggleStrike().run())}
      >
        <Strikethrough className="size-3.5" />
      </FormatButton>
      <FormatButton
        label={t("tasks:detail.editor.toolbar.underline")}
        active={editor.isActive("underline")}
        onClick={() =>
          run(() => editor.chain().focus().toggleUnderline().run())
        }
      >
        <UnderlineIcon className="size-3.5" />
      </FormatButton>
      <FormatButton
        label={t("tasks:detail.editor.toolbar.link")}
        active={editor.isActive("link")}
        onClick={onLink}
      >
        <Link2 className="size-3.5" />
      </FormatButton>
      <FormatButton
        label={t("tasks:detail.editor.attachFile")}
        active={false}
        onClick={onAttach}
      >
        <Paperclip className="size-3.5" />
      </FormatButton>
      <FormatButton
        label={t("tasks:detail.editor.toolbar.code")}
        active={editor.isActive("code")}
        onClick={() => run(() => editor.chain().focus().toggleCode().run())}
      >
        <Code className="size-3.5" />
      </FormatButton>
      <FormatButton
        label={t("tasks:detail.editor.toolbar.bulletList")}
        active={editor.isActive("bulletList")}
        onClick={() =>
          run(() => editor.chain().focus().toggleBulletList().run())
        }
      >
        <List className="size-3.5" />
      </FormatButton>
      <DropdownMenu onOpenChange={onMenuOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className={toolButtonClass}
            aria-label={t("tasks:detail.editor.toolbar.more")}
          >
            <Ellipsis className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="size-3.5" />
            {t("tasks:detail.editor.toolbar.orderedList")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleTaskList().run()}
          >
            <ListTodo className="size-3.5" />
            {t("tasks:detail.editor.toolbar.taskList")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote className="size-3.5" />
            {t("tasks:detail.editor.toolbar.blockquote")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            <Code className="size-3.5" />
            {t("tasks:detail.editor.toolbar.codeBlock")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run()
            }
          >
            <Table2 className="size-3.5" />
            {t("tasks:detail.editor.toolbar.table")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function FormatButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      aria-label={label}
      aria-pressed={active}
      className={cn(toolButtonClass, active && "bg-accent text-foreground")}
      onMouseDown={keepEditorFocus}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
