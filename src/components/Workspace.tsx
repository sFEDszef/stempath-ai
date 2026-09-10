"use client";
import { useEffect, useRef, useState } from "react";
import {
  Lightbulb,
  ChevronRight,
  X,
  ArrowRight,
  BookOpen,
  Wind,
  FlaskConical,
  Save,
} from "lucide-react";
import { Header } from "./Header";
import { ProgressSidebar } from "./ProgressSidebar";
import { ChallengeCard } from "./ChallengeCard";
import { AIChat } from "./AIChat";
import { STEMJourney } from "./STEMJourney";
import { ArtifactUploader } from "./ArtifactUploader";
import { HelpMeter } from "./HelpMeter";
import { initialMessages, stages } from "@/data/challenge";
import { mockCoach } from "@/lib/coach";
import type { Artifact, Message, StageId, SupportLevel } from "@/types";
export default function Workspace() {
  const [active, setActive] = useState<StageId>("understand");
  const [completed, setCompleted] = useState<StageId[]>([]);
  const [level, setLevel] = useState<SupportLevel>(1);
  const [conversations, setConversations] = useState<
    Partial<Record<StageId, Message[]>>
  >({ understand: initialMessages });
  const [pending, setPending] = useState<StageId[]>([]);
  const pendingRef = useRef(new Set<StageId>());
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const artifactRef = useRef<Artifact[]>([]);
  const uploadRef = useRef<HTMLInputElement>(null);
  const [modal, setModal] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const stage = stages.find((s) => s.id === active)!;
  const messages = conversations[active] ?? [];
  useEffect(() => {
    try {
      setNote(localStorage.getItem("stempath-notebook-v1") ?? "");
    } catch {}
    return () => artifactRef.current.forEach((a) => URL.revokeObjectURL(a.url));
  }, []);
  useEffect(() => {
    if (modal) dialog.current?.showModal();
    else dialog.current?.close();
  }, [modal]);
  function selectStage(id: StageId) {
    setActive(id);
    setConversations((prev) =>
      prev[id]
        ? prev
        : {
            ...prev,
            [id]: [
              {
                id: crypto.randomUUID(),
                role: "assistant",
                text: `Let’s explore the ${stages.find((s) => s.id === id)!.title} stage.\n\n${stages.find((s) => s.id === id)!.prompts[level - 1]}`,
                suggestions: ["我不确定。", "你能给我一些提示吗？"],
              },
            ],
          },
    );
  }
  async function send(text: string) {
    if (!text.trim() || pendingRef.current.has(active)) return;
    const requestStage = active;
    pendingRef.current.add(requestStage);
    setPending((prev) => [...prev, requestStage]);
    const next = [
      ...messages,
      { id: crypto.randomUUID(), role: "student" as const, text: text.trim() },
    ];
    setConversations((prev) => ({ ...prev, [requestStage]: next }));
    try {
      const response = await mockCoach.respond({
        stage: requestStage,
        level,
        messages: next,
      });
      setConversations((prev) => ({
        ...prev,
        [requestStage]: [
          ...(prev[requestStage] ?? []),
          { id: crypto.randomUUID(), role: "assistant", ...response },
        ],
      }));
    } catch {
      setError(
        "The coach could not respond. Please try sending your idea again.",
      );
    } finally {
      pendingRef.current.delete(requestStage);
      setPending((prev) => prev.filter((s) => s !== requestStage));
    }
  }
  function onUpload() {
    uploadRef.current?.click();
  }
  function removeArtifact(id: string) {
    setArtifacts((prev) => {
      const item = prev.find((a) => a.id === id);
      if (item) URL.revokeObjectURL(item.url);
      const next = prev.filter((a) => a.id !== id);
      artifactRef.current = next;
      return next;
    });
  }
  function navigate(name: string) {
    if (name === "AI Coach") {
      document
        .getElementById("ai-coach")
        ?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setModal(name);
  }
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to learning workspace
      </a>
      <Header onNavigate={navigate} />
      <div className="workspace-shell">
        <ProgressSidebar
          active={active}
          completed={completed}
          onStage={selectStage}
          onTool={navigate}
        />
        <main id="main" className="main-workspace">
          <div className="breadcrumb">
            <button onClick={() => navigate("Challenges")}>Challenges</button>
            <ChevronRight size={13} />
            <span>Wind-Powered Car</span>
          </div>
          <ChallengeCard />
          <AIChat
            stage={stage}
            level={level}
            messages={messages}
            busy={pending.includes(active)}
            onSend={send}
            onUpload={onUpload}
            onComplete={() =>
              setCompleted((prev) =>
                prev.includes(active)
                  ? prev.filter((s) => s !== active)
                  : [...prev, active],
              )
            }
            complete={completed.includes(active)}
            onLevel={setLevel}
          />
          <p className="workspace-footer">
            <span>Every question is a step forward.</span>
            <span>STEMPath AI · Research prototype</span>
          </p>
        </main>
        <aside className="right-sidebar">
          <section className="rail-section questions">
            <h2>
              <Lightbulb size={18} />
              Key Questions
            </h2>
            {[
              "How does wind produce motion?",
              "What factors affect speed?",
              "How can you test and improve your design?",
            ].map((question, i) => (
              <div className="question" key={question}>
                <span>0{i + 1}</span>
                <p>{question}</p>
              </div>
            ))}
          </section>
          <STEMJourney
            active={active}
            completed={completed}
            onStage={selectStage}
          />
          <ArtifactUploader
            artifacts={artifacts}
            onUpload={onUpload}
            onRemove={removeArtifact}
          />
          <HelpMeter level={level} onChange={setLevel} />
        </aside>
      </div>
      <input
        hidden
        type="file"
        ref={uploadRef}
        accept="image/png,image/jpeg,image/webp"
        multiple
        onChange={(e) => {
          setError("");
          const files = Array.from(e.target.files ?? []);
          const valid = files.filter(
            (f) =>
              ["image/png", "image/jpeg", "image/webp"].includes(f.type) &&
              f.size <= 5 * 1024 * 1024,
          );
          if (valid.length !== files.length)
            setError(
              "Some files were skipped. Choose PNG, JPG or WebP images up to 5 MB.",
            );
          const next = valid.map((f) => ({
            id: crypto.randomUUID(),
            name: f.name,
            url: URL.createObjectURL(f),
          }));
          setArtifacts((prev) => {
            artifactRef.current = [...prev, ...next];
            return artifactRef.current;
          });
          e.target.value = "";
        }}
      />
      {error && (
        <div className="toast" role="alert">
          {error}
          <button aria-label="Dismiss message" onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}
      <dialog
        ref={dialog}
        onCancel={() => setModal(null)}
        onClick={(e) => {
          if (e.target === dialog.current) setModal(null);
        }}
      >
        <div className="modal-heading">
          <h2>{modal}</h2>
          <button aria-label="Close dialog" onClick={() => setModal(null)}>
            <X size={20} />
          </button>
        </div>
        {modal === "My Notebook" ? (
          <div className="notebook">
            <p>Capture your questions, observations, and ideas.</p>
            <textarea
              aria-label="Notebook notes"
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                setSaved(false);
              }}
              placeholder="I wonder… / 我的发现…"
            />
            <button
              className="primary-button"
              onClick={() => {
                try {
                  localStorage.setItem("stempath-notebook-v1", note);
                  setSaved(true);
                } catch {
                  setError(
                    "Your browser could not save the notebook. Copy your notes before leaving.",
                  );
                }
              }}
            >
              <Save size={16} />
              {saved ? "Saved in this browser" : "Save notes"}
            </button>
            <small>Your notebook stays on this device.</small>
          </div>
        ) : modal === "My Files" ? (
          <ArtifactUploader
            artifacts={artifacts}
            onUpload={onUpload}
            onRemove={removeArtifact}
          />
        ) : modal === "Resources" ? (
          <div className="resource-list">
            <article>
              <Wind />
              <h3>Explore wind and motion</h3>
              <p>
                Observe a piece of paper in moving air. What changes when you
                turn it? Sketch the direction of the wind and movement.
              </p>
            </article>
            <article>
              <FlaskConical />
              <h3>Make a fair test</h3>
              <p>
                Change one thing at a time. Keep your starting point and wind
                source consistent. Repeat your measurements and record every
                result.
              </p>
            </article>
            <article>
              <BookOpen />
              <h3>Think like a designer</h3>
              <p>
                Write down what you predict, what you observe, and what you
                would try next. An unexpected result is useful evidence.
              </p>
            </article>
          </div>
        ) : modal === "Help" ? (
          <div className="help-content">
            <p>
              Choose any STEM stage to explore. Use{" "}
              <strong>Complete stage</strong> when you are ready; select it
              again to undo completion.
            </p>
            <p>
              Share an idea in English or Chinese. Choose support level 1 for
              questions, 2 for a hint, or 3 for a thinking framework.
            </p>
            <p>
              Upload sketches through the image button. Images are previewed
              locally and are not analysed by the mock coach. Chats, images, and
              progress reset when you reload; saved notebook notes remain in
              this browser.
            </p>
            <p>
              This prototype uses predefined responses. It helps you practise
              thinking through a challenge.
            </p>
          </div>
        ) : (
          <div className="project-overview">
            <Wind size={32} />
            <h3>
              {modal === "Home" ? "Welcome to STEMPath AI" : "Wind-Powered Car"}
            </h3>
            <p>
              {modal === "Home"
                ? "Think, explore, build, and grow with your own ideas. Your first challenge is ready."
                : `Design a wind-powered car that travels at least 3 metres. ${completed.length} of 7 stages completed.`}
            </p>
            <button className="primary-button" onClick={() => setModal(null)}>
              Continue challenge
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </dialog>
    </>
  );
}
