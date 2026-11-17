import { useEffect, useMemo, useState, type FormEvent } from "react";
import { MessageCircle, Mic, Paperclip, Plus, Send, Trash2, Volume2, VolumeX } from "lucide-react";
import { translate, type Locale } from "../i18n";
import {
  loadLocalChats,
  newLocalChat,
  saveLocalChats,
  type LocalChat,
  type LocalMessage,
} from "./local-chat";
type Props = { locale: Locale };

type SpeechResult = { results: ArrayLike<ArrayLike<{ transcript: string }>> };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechResult) => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};
export function SakhaPanel({ locale }: Props) {
  const [chats, setChats] = useState<LocalChat[]>(() => loadLocalChats());
  const [activeId, setActiveId] = useState<string | null>(() => loadLocalChats()[0]?.id ?? null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const t = (key: string) => translate(locale, key);
  const active = useMemo(
    () => chats.find((chat) => chat.id === activeId) ?? null,
    [chats, activeId],
  );
  useEffect(() => {
    saveLocalChats(chats);
  }, [chats]);
  function addMessage(chatId: string, message: LocalMessage) {
    setChats((previous) =>
      previous.map((chat) =>
        chat.id === chatId
          ? { ...chat, messages: [...chat.messages, message], updatedAt: message.createdAt }
          : chat,
      ),
    );
  }
  function createChat() {
    const chat = newLocalChat();
    setChats((previous) => [chat, ...previous]);
    setActiveId(chat.id);
    setNotice("");
  }
  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || busy) return;
    const chat = active ?? newLocalChat();
    if (!active) {
      setChats((previous) => [chat, ...previous]);
      setActiveId(chat.id);
    }
    const userMessage: LocalMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    const base = active ? active.messages : [];
    const next = {
      ...chat,
      title: chat.messages.length ? chat.title : content.slice(0, 42),
      messages: [...base, userMessage],
      updatedAt: userMessage.createdAt,
    };
    setChats((previous) => [next, ...previous.filter((item) => item.id !== chat.id)]);
    setDraft("");
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/sakha/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content, language: locale }),
      });
      if (!response.ok) throw new Error("MOCK_API_UNAVAILABLE");
      const data = (await response.json()) as { reply: string; mode: string; stored: boolean };
      addMessage(chat.id, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply,
        createdAt: new Date().toISOString(),
        mode: data.mode === "mock" ? "mock" : "live",
      });
      setNotice(data.mode === "mock" ? t("chat.mock") : t("chat.live"));
    } catch {
      addMessage(chat.id, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: t("chat.sendFailed"),
        createdAt: new Date().toISOString(),
        mode: "local",
      });
      setNotice(t("chat.sendFailed"));
    } finally {
      setBusy(false);
    }
  }
  function startVoice() {
    const win = window as SpeechWindow;
    const Constructor = win.SpeechRecognition ?? win.webkitSpeechRecognition;
    if (!Constructor) {
      setNotice(t("chat.voiceUnavailable"));
      return;
    }
    const recognition = new Constructor();
    recognition.lang = locale === "hi" ? "hi-IN" : "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) setDraft((previous) => (previous ? previous + " " + transcript : transcript));
    };
    recognition.onerror = () => setNotice(t("chat.voiceUnavailable"));
    recognition.start();
  }
  function speak(content: string) {
    if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
      setNotice(t("chat.voiceUnavailable"));
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(content);
    utterance.lang = locale === "hi" ? "hi-IN" : "en-IN";
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }
  function stopSpeak() {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }
  async function attach(file?: File) {
    if (!file) return;
    if (file.type === "text/plain" || file.name.endsWith(".md")) {
      if (file.size > 200_000) {
        setNotice(t("chat.fileTooLarge"));
        return;
      }
      const text = await file.text();
      setDraft((previous) => (previous ? previous + "\n\n" + text : text));
      setNotice(t("chat.textAttached"));
      return;
    }
    setNotice(t("chat.filePending"));
  }
  function deleteChat(id: string) {
    setChats((previous) => previous.filter((chat) => chat.id !== id));
    if (activeId === id) setActiveId(chats.find((chat) => chat.id !== id)?.id ?? null);
  }
  return (
    <section className="sakha-panel">
      <div className="sakha-head">
        <div>
          <p className="eyebrow">MINISTER · 02</p>
          <h1>{t("sakha.title")}</h1>
        </div>
        <button className="icon-button" onClick={createChat} aria-label={t("chat.new")}>
          <Plus />
        </button>
      </div>
      <div className="sakha-tools">
        <button onClick={() => setHistoryOpen((value) => !value)}>
          {t("chat.history")} ({chats.length})
        </button>
        <span>{t("chat.localOnly")}</span>
      </div>
      {historyOpen && (
        <div className="chat-history">
          {chats.map((chat) => (
            <div className="history-row" key={chat.id}>
              <button
                onClick={() => {
                  setActiveId(chat.id);
                  setHistoryOpen(false);
                }}
              >
                {chat.title}
              </button>
              <button
                className="history-delete"
                onClick={() => deleteChat(chat.id)}
                aria-label={t("chat.delete")}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="chat-thread" aria-live="polite">
        {!active?.messages.length && (
          <div className="chat-empty">
            <MessageCircle size={34} />
            <p>{t("sakha.empty")}</p>
            <small>{t("chat.localOnly")}</small>
          </div>
        )}
        {active?.messages.map((message) => (
          <article className={"chat-bubble " + message.role} key={message.id}>
            <small>
              {message.role === "user" ? t("chat.you") : t("chat.assistant")}
              {message.mode === "mock" ? " · MOCK" : message.mode === "live" ? " · LIVE AI" : ""}
            </small>
            <p>{message.content}</p>
            {message.role === "assistant" && (
              <button
                className="speak-button"
                onClick={() => (speaking ? stopSpeak() : speak(message.content))}
                aria-label={speaking ? t("chat.stopSpeaking") : t("chat.speak")}
              >
                {speaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            )}
          </article>
        ))}
      </div>
      {notice && (
        <p className="chat-notice" role="status">
          {notice}
        </p>
      )}
      <form className="composer" onSubmit={send}>
        <button
          type="button"
          className="icon-button"
          aria-label={t("sakha.voice")}
          onClick={startVoice}
        >
          <Mic />
        </button>
        <label className="icon-button attach-button" aria-label={t("sakha.attach")}>
          <Paperclip />
          <input
            type="file"
            accept=".txt,.md,.pdf,image/jpeg,image/png,image/webp"
            onChange={(event) => {
              void attach(event.target.files?.[0]);
              event.currentTarget.value = "";
            }}
          />
        </label>
        <textarea
          aria-label={t("sakha.placeholder")}
          placeholder={t("sakha.placeholder")}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={1}
        />
        <button
          className="send-button"
          disabled={!draft.trim() || busy}
          aria-label={t("sakha.send")}
        >
          {busy ? t("common.loading") : <Send size={18} />}
        </button>
      </form>
      <p className="chat-footnote">{t("chat.mock")}</p>
    </section>
  );
}
