import { Card, CardContent } from "@/components/ui/card";

interface QuestionDisplayProps {
  text: string;
  type?: string;
  passage?: { title?: string | null; body?: string | null } | null;
}

function normalize(raw: string) {
  return String(raw ?? "")
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .trim();
}

function splitEmbeddedPassage(raw: string) {
  const text = normalize(raw);
  const match = text.match(/^Passage\s*\d+\s*:\s*([\s\S]*?)\n\n([\s\S]+)$/i);
  if (match) return { passage: match[1].trim(), prompt: match[2].trim() };

  const accordingIndex = text.search(/According to the passage|Based on the passage|What is the main idea|Which statement/i);
  if (accordingIndex > 120) {
    return {
      passage: text.slice(0, accordingIndex).replace(/^Passage\s*\d+\s*:\s*/i, "").trim(),
      prompt: text.slice(accordingIndex).trim(),
    };
  }

  return { passage: "", prompt: text };
}

export default function QuestionDisplay({ text, type, passage }: QuestionDisplayProps) {
  const embedded = splitEmbeddedPassage(text);
  const passageBody = normalize(passage?.body || embedded.passage);
  const prompt = embedded.prompt;
  const isReading = type === "reading_comprehension" || !!passageBody;

  if (!isReading) {
    return (
      <p className="text-xl md:text-2xl font-medium text-foreground leading-relaxed mb-8" dir="ltr" style={{ textAlign: "left" }}>
        {normalize(text)}
      </p>
    );
  }

  return (
    <div className="space-y-5 mb-8" dir="ltr">
      {passageBody && (
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="p-5 md:p-6">
            <div className="text-xs uppercase tracking-wide text-slate-500 font-bold mb-3">Reading passage</div>
            <div className="prose prose-slate max-w-none text-left leading-8 text-lg whitespace-pre-line">
              {passageBody}
            </div>
          </CardContent>
        </Card>
      )}
      <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 md:p-5 text-left">
        <div className="text-xs uppercase tracking-wide text-blue-700 font-bold mb-2">Question</div>
        <p className="text-xl font-semibold text-slate-950 leading-relaxed">{prompt}</p>
      </div>
    </div>
  );
}
