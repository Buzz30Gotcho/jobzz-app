/**
 * Télécharge le modèle Ollama configuré (OLLAMA_MODEL) sur l'instance OLLAMA_URL.
 * Usage : `pnpm ai:pull`. L'IA n'est jamais indispensable (CLAUDE.md §1, §5).
 */
import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';

loadEnv({ path: resolve(__dirname, '../../../../.env') });

async function main(): Promise<void> {
  const url = process.env.OLLAMA_URL ?? 'http://localhost:11434';
  const model = process.env.OLLAMA_MODEL ?? 'qwen2.5:7b';
  console.log(`Téléchargement du modèle « ${model} » depuis ${url}…`);

  const res = await fetch(`${url}/api/pull`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model, stream: false }),
  });
  if (!res.ok) {
    throw new Error(`Échec du téléchargement (${res.status}). Ollama est-il démarré ?`);
  }
  console.log(`Modèle « ${model} » prêt.`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
