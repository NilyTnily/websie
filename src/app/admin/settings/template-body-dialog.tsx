"use client";

import EmojiPicker, { type EmojiClickData, Theme } from "emoji-picker-react";
import { MessageCircle, Smile } from "lucide-react";
import { useRef, useState } from "react";

import { renderTemplatePreview, TEMPLATE_VARIABLES } from "~/lib/whatsapp-template-vars";
import { Button } from "~/ui/primitives/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/ui/primitives/dialog";

interface TemplateBodyDialogProps {
  defaultValue: string;
  label: string;
  name: string;
  sentWhen: string;
}

export function TemplateBodyDialog({
  defaultValue,
  label,
  name,
  sentWhen,
}: TemplateBodyDialogProps) {
  const [value, setValue] = useState(defaultValue);
  const [draft, setDraft] = useState(defaultValue);
  const [showEmojis, setShowEmojis] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleOpenChange(open: boolean): void {
    if (open) setDraft(value);
    else setShowEmojis(false);
  }

  function insertAtCursor(text: string): void {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? draft.length;
    const end = el?.selectionEnd ?? draft.length;
    const next = draft.slice(0, start) + text + draft.slice(end);
    setDraft(next);
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      const cursor = start + text.length;
      el.setSelectionRange(cursor, cursor);
    });
  }

  function handleEmojiClick(data: EmojiClickData): void {
    insertAtCursor(data.emoji);
  }

  return (
    <>
      <input name={name} readOnly type="hidden" value={value} />
      <Dialog onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button size="sm" type="button" variant="outline">
            <MessageCircle className="size-4" />
            Edit Message
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
            <DialogDescription>Sent when: {sentWhen}</DialogDescription>
          </DialogHeader>

          <div
            className={`
              space-y-2 rounded-lg bg-[#e5ddd5] p-4
              dark:bg-neutral-900
            `}
          >
            <div
              className={`
                ml-auto max-w-[85%] rounded-lg rounded-tr-none bg-[#dcf8c6] px-3
                py-2 text-sm whitespace-pre-wrap text-neutral-900 shadow
                dark:bg-[#025144] dark:text-neutral-100
              `}
            >
              {renderTemplatePreview(draft) || "Type a message…"}
            </div>
          </div>

          <textarea
            className={`
              min-h-28 w-full rounded-lg border border-input bg-transparent px-3
              py-2 font-mono text-sm shadow-xs outline-none
              focus-visible:border-ring focus-visible:ring-[3px]
              focus-visible:ring-ring/50
            `}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Hi {{first_name}}, …"
            ref={textareaRef}
            value={draft}
          />

          <div className="flex flex-wrap items-center gap-2">
            {TEMPLATE_VARIABLES.map((variable) => (
              <Button
                key={variable.token}
                onClick={() => insertAtCursor(`{{${variable.token}}}`)}
                size="sm"
                type="button"
                variant="secondary"
              >
                + {variable.label}
              </Button>
            ))}
            <Button
              aria-pressed={showEmojis}
              onClick={() => setShowEmojis((shown) => !shown)}
              size="sm"
              type="button"
              variant="secondary"
            >
              <Smile className="size-4" />
              Emoji
            </Button>
          </div>

          {showEmojis && (
            <div className="flex justify-center">
              <EmojiPicker
                autoFocusSearch={false}
                onEmojiClick={handleEmojiClick}
                theme={Theme.AUTO}
                width="100%"
              />
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <DialogClose asChild>
              <Button onClick={() => setValue(draft)} type="button">
                Save
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
