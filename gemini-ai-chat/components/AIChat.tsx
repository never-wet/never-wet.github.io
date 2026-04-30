"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const FRIENDLY_ERROR = "Sorry, I could not get a response. Please try again.";
const NETWORK_ERROR =
  "The chat backend is not reachable. Run the Next.js server or deploy this to a host that supports /api/chat.";

function createMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    content
  };
}

export default function AIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    createMessage("assistant", "Hi, I am the Never Wet assistant. What can I help with?")
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const trimmedInput = input.trim();

  useEffect(() => {
    window.requestAnimationFrame(() => {
      listRef.current?.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: "smooth"
      });

      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "smooth"
      });
    });
  }, [messages, isLoading]);

  async function sendMessage() {
    if (!trimmedInput || isLoading) return;

    const outgoing = trimmedInput;
    setMessages((current) => [...current, createMessage("user", outgoing)]);
    setInput("");
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: outgoing
        })
      });

      const data = (await response.json().catch(() => null)) as {
        reply?: string;
        error?: string;
      } | null;

      const reply = data?.reply;

      if (!response.ok || !reply) {
        throw new Error(data?.error || FRIENDLY_ERROR);
      }

      setMessages((current) => [...current, createMessage("assistant", reply)]);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : NETWORK_ERROR);
    } finally {
      setIsLoading(false);
      window.requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) return;

    event.preventDefault();
    void sendMessage();
  }

  return (
    <section className="chat-shell" aria-label="AI chat">
      <div className="chat-heading">
        <div>
          <p>AI Assistant</p>
          <h1>Never Wet Chat</h1>
        </div>
        <span aria-label={isLoading ? "Assistant is replying" : "Assistant is ready"} />
      </div>

      <div className="message-list" ref={listRef} aria-live="polite">
        {messages.map((message) => (
          <article className={`message message--${message.role}`} key={message.id}>
            <span>{message.role === "user" ? "You" : "AI"}</span>
            <p>{message.content}</p>
          </article>
        ))}

        {isLoading ? (
          <article className="message message--assistant message--loading">
            <span>AI</span>
            <p>
              <i />
              <i />
              <i />
            </p>
          </article>
        ) : null}
      </div>

      {error ? (
        <p className="chat-error" role="alert">
          {error}
        </p>
      ) : null}

      <form className="chat-form" onSubmit={handleSubmit}>
        <label htmlFor="chat-message">Message</label>
        <textarea
          id="chat-message"
          ref={inputRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask something..."
          rows={3}
          disabled={isLoading}
        />
        <button type="submit" disabled={!trimmedInput || isLoading}>
          {isLoading ? "Sending" : "Send"}
        </button>
      </form>
    </section>
  );
}
