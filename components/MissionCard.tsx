"use client";

import { CheckCircle2, Circle, Target } from "lucide-react";

export default function MissionCard({
  products,
  posts,
  published
}: {
  products: number;
  posts: number;
  published: number;
}) {
  const tasks = [
    { label: "Cadastrar 10 produtos", value: products, target: 10 },
    { label: "Gerar 10 posts", value: posts, target: 10 },
    { label: "Publicar 10 posts", value: published, target: 10 }
  ];

  const percent = Math.round(
    (tasks.reduce((sum, task) => sum + Math.min(task.value, task.target), 0) /
      tasks.reduce((sum, task) => sum + task.target, 0)) * 100
  );

  return (
    <section className="rounded-2xl bg-slate-900 p-6 text-white shadow-card">
      <div className="flex items-center gap-2">
        <Target className="text-ativa-yellow" />
        <h2 className="text-xl font-black">Missão de hoje</h2>
      </div>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-700">
        <div className="h-full bg-ativa-yellow" style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-2 text-sm text-slate-300">{percent}% concluído</div>

      <div className="mt-5 space-y-3">
        {tasks.map((task) => {
          const done = task.value >= task.target;
          return (
            <div key={task.label} className="flex items-center justify-between rounded-xl bg-white/5 p-3">
              <div className="flex items-center gap-2">
                {done ? <CheckCircle2 className="text-green-400" /> : <Circle className="text-slate-500" />}
                <span>{task.label}</span>
              </div>
              <strong>{task.value}/{task.target}</strong>
            </div>
          );
        })}
      </div>
    </section>
  );
}
