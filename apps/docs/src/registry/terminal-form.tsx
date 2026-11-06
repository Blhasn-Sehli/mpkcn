"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";

export type TerminalFormField = {
  /** Key of the value in the object passed to `onSubmit`. */
  name: string;
  /** Prompt shown before the input, followed by ">". @default the name */
  label?: string;
  /** Input type; "textarea" gives a multi-line field (Shift+Enter for a new line). @default "text" */
  type?: "text" | "email" | "url" | "tel" | "password" | "textarea";
  /** Must not be empty. @default true */
  required?: boolean;
  /** Placeholder in the empty input. */
  placeholder?: string;
  /** Browser autofill hint, e.g. "name" or "email". */
  autoComplete?: string;
  /** Rows of a textarea. @default 3 */
  rows?: number;
  /** Extra check: return an error message, or nothing when the value is fine. */
  validate?: (value: string, values: Record<string, string>) => string | undefined;
};

export type TerminalFormProps = {
  /** The questions, asked one after the other. */
  fields: TerminalFormField[];
  /**
   * Called with every answer once the user confirms. No network call is built in:
   * send the values wherever you like. Return (or resolve) a string to replace the
   * success message; throw (or reject) to show an error and let the user retry.
   */
  onSubmit: (values: Record<string, string>) => void | string | Promise<void | string>;
  /** Command shown on the first line, after the prompt; false hides the line. @default "send --message" */
  command?: string | false;
  /** Prompt in front of the command. @default "$" */
  prompt?: string;
  /** Label of the final confirm button. @default "send" */
  submitLabel?: string;
  /** Shown while `onSubmit` is pending. @default "sending…" */
  pendingMessage?: string;
  /** Shown once `onSubmit` succeeds. @default "done. message sent." */
  successMessage?: string;
  /** Offer a "new" button after success that starts over. @default true */
  allowRestart?: boolean;
  /** Initial answers, by field name. @default {} */
  defaultValues?: Record<string, string>;
  /** Extra classes for the form. */
  className?: string;
};

type Status = { kind: "idle" | "sending" | "sent" | "error"; message?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cx(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

function check(field: TerminalFormField, value: string, values: Record<string, string>): string | undefined {
  const v = value.trim();
  if ((field.required ?? true) && !v) return "required";
  if (v && field.type === "email" && !EMAIL_RE.test(v)) return "not a valid email";
  if (v && field.type === "url") {
    try {
      new URL(v);
    } catch {
      return "not a valid URL (include https://)";
    }
  }
  return field.validate?.(value, values);
}

/**
 * A form that runs like a terminal prompt: one question at a time, Enter to
 * answer, then a confirm step. Answered lines stay on screen and can be edited.
 * It only collects values and hands them to `onSubmit`.
 */
export function TerminalForm({
  fields,
  onSubmit,
  command = "send --message",
  prompt = "$",
  submitLabel = "send",
  pendingMessage = "sending…",
  successMessage = "done. message sent.",
  allowRestart = true,
  defaultValues = {},
  className,
}: TerminalFormProps) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.name, defaultValues[f.name] ?? ""])),
  );
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | undefined>();
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const fieldRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const restartRef = useRef<HTMLButtonElement>(null);
  const touched = useRef(false);
  const baseId = useId();

  const review = step >= fields.length;
  const current = fields[step];
  const busy = status.kind === "sending";

  // Move focus along with the flow, but never on first render (don't steal page focus).
  useEffect(() => {
    if (!touched.current) return;
    if (status.kind === "sent") restartRef.current?.focus();
    else if (review) submitRef.current?.focus();
    else fieldRef.current?.focus();
  }, [step, review, status.kind]);

  // First field that still needs an answer, from `from` on; fields.length when all are fine.
  function nextOpen(from: number, vals: Record<string, string>): number {
    for (let i = from; i < fields.length; i++) if (check(fields[i], vals[fields[i].name], vals)) return i;
    return fields.length;
  }

  function advance() {
    if (!current) return;
    const err = check(current, values[current.name], values);
    if (err) {
      setError(err);
      return;
    }
    setError(undefined);
    touched.current = true;
    setStep(nextOpen(step + 1, values));
  }

  async function send() {
    const first = nextOpen(0, values);
    touched.current = true;
    if (first < fields.length) {
      setStep(first);
      setError(check(fields[first], values[fields[first].name], values));
      return;
    }
    setStatus({ kind: "sending" });
    try {
      const trimmed = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.trim()]));
      const result = await onSubmit(trimmed);
      setStatus({ kind: "sent", message: typeof result === "string" ? result : successMessage });
    } catch (err) {
      setStatus({ kind: "error", message: err instanceof Error ? err.message : "something went wrong" });
    }
  }

  function onFormSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy || status.kind === "sent") return;
    if (review) void send();
    else advance();
  }

  function onFieldKeyDown(e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      advance();
    }
  }

  function edit(i: number) {
    touched.current = true;
    setError(undefined);
    setStatus({ kind: "idle" });
    setStep(i);
  }

  function restart() {
    touched.current = true;
    setValues(Object.fromEntries(fields.map((f) => [f.name, ""])));
    setError(undefined);
    setStatus({ kind: "idle" });
    setStep(0);
  }

  const shown = (f: TerminalFormField) => {
    const v = values[f.name];
    if (!v) return <span className="text-mpk-dim2">(empty)</span>;
    return f.type === "password" ? "•".repeat(Math.min(v.length, 12)) : v;
  };

  const errorId = `${baseId}-error`;
  const hintId = `${baseId}-hint`;
  const locked = busy || status.kind === "sent";

  let statusLine: ReactNode = null;
  if (status.kind === "sending") statusLine = <span className="text-mpk-dim">&gt; {pendingMessage}</span>;
  else if (status.kind === "sent") statusLine = <span className="text-mpk-blue">&gt; {status.message}</span>;
  else if (status.kind === "error")
    statusLine = (
      <span className="text-mpk-amber">
        ! {status.message} <span className="text-mpk-dim">· press enter to retry</span>
      </span>
    );

  return (
    <form
      noValidate
      onSubmit={onFormSubmit}
      aria-busy={busy || undefined}
      className={cx("w-full font-mpk-mono text-[13px] leading-relaxed text-mpk-ink", className)}
    >
      {command !== false && (
        <div className="mb-2">
          <span className="mr-2 text-mpk-amber">{prompt}</span>
          {command}
        </div>
      )}

      {/* Answered questions */}
      {fields.slice(0, review ? fields.length : step).map((f, i) => (
        <div key={f.name} className="group flex items-start gap-2">
          <span className="shrink-0 text-mpk-blue">{f.label ?? f.name}&gt;</span>
          <span className="min-w-0 flex-1 break-words whitespace-pre-wrap">{shown(f)}</span>
          {!locked && (
            <button
              type="button"
              onClick={() => edit(i)}
              aria-label={`Edit ${f.label ?? f.name}`}
              className="shrink-0 border border-mpk-line px-1.5 text-[11px] leading-[18px] text-mpk-dim2 opacity-60 transition hover:border-mpk-blue hover:text-mpk-blue focus-visible:opacity-100 focus-visible:outline focus-visible:outline-1 focus-visible:outline-mpk-amber group-hover:opacity-100"
            >
              edit
            </button>
          )}
        </div>
      ))}

      {/* Current question */}
      {current && !review && (
        <div className="flex items-start gap-2">
          <label htmlFor={`${baseId}-${current.name}`} className="shrink-0 text-mpk-blue">
            {current.label ?? current.name}&gt;
          </label>
          {current.type === "textarea" ? (
            <textarea
              ref={fieldRef}
              id={`${baseId}-${current.name}`}
              name={current.name}
              rows={current.rows ?? 3}
              value={values[current.name]}
              placeholder={current.placeholder}
              autoComplete={current.autoComplete}
              required={current.required ?? true}
              aria-invalid={error ? true : undefined}
              aria-describedby={`${error ? errorId : ""} ${hintId}`.trim()}
              onChange={(e) => {
                setValues((v) => ({ ...v, [current.name]: e.target.value }));
                if (error) setError(undefined);
              }}
              onKeyDown={onFieldKeyDown}
              className="min-w-0 flex-1 resize-none bg-transparent leading-relaxed text-mpk-ink caret-mpk-blue outline-none placeholder:text-mpk-dim2"
            />
          ) : (
            <input
              ref={fieldRef}
              id={`${baseId}-${current.name}`}
              name={current.name}
              type={current.type ?? "text"}
              value={values[current.name]}
              placeholder={current.placeholder}
              autoComplete={current.autoComplete}
              required={current.required ?? true}
              aria-invalid={error ? true : undefined}
              aria-describedby={`${error ? errorId : ""} ${hintId}`.trim()}
              enterKeyHint={step === fields.length - 1 ? "done" : "next"}
              spellCheck={current.type === "email" || current.type === "url" ? false : undefined}
              onKeyDown={onFieldKeyDown}
              onChange={(e) => {
                setValues((v) => ({ ...v, [current.name]: e.target.value }));
                if (error) setError(undefined);
              }}
              className="min-w-0 flex-1 bg-transparent text-mpk-ink caret-mpk-blue outline-none placeholder:text-mpk-dim2"
            />
          )}
        </div>
      )}

      {error && !review && (
        <div id={errorId} role="alert" className="text-mpk-amber">
          ! {current?.label ?? current?.name}: {error}
        </div>
      )}

      {!review && (
        <div id={hintId} className="mt-1 text-[11px] text-mpk-dim2">
          ⏎ {step === fields.length - 1 ? "review" : "next"}
          {current?.type === "textarea" ? " · shift+⏎ new line" : ""} · {step + 1}/{fields.length}
        </div>
      )}

      {/* Confirm step */}
      {review && status.kind !== "sent" && (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className="text-mpk-dim">ready?</span>
          <button
            ref={submitRef}
            type="submit"
            disabled={busy}
            className="border border-mpk-blue px-2 text-mpk-blue transition-colors hover:bg-mpk-blue hover:text-mpk-bg focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-mpk-amber disabled:opacity-50"
          >
            [ enter ] {submitLabel}
          </button>
        </div>
      )}

      <div role="status" aria-live="polite" className="mt-2 empty:hidden">
        {statusLine}
      </div>

      {status.kind === "sent" && allowRestart && (
        <button
          ref={restartRef}
          type="button"
          onClick={restart}
          className="mt-1 border border-mpk-line px-2 text-[11px] text-mpk-dim transition-colors hover:border-mpk-blue hover:text-mpk-blue focus-visible:outline focus-visible:outline-1 focus-visible:outline-mpk-amber"
        >
          new
        </button>
      )}
    </form>
  );
}
