interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * IntAct (EBI) molecular-interaction database MCP. Keyless.
 */


const BASE = 'https://www.ebi.ac.uk/intact/ws';
const UA = 'pipeworx/1.0 (+https://pipeworx.io)';

const tools: McpToolExport['tools'] = [
  {
    name: 'find_interactions',
    description:
      'IntAct (EBI) molecular-interaction database — find protein-protein and other molecular interactions for a gene/protein (by name or UniProt id), with detection method, interaction type, organism, PubMed ref, and MI confidence score. Keyless.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Gene name, protein name, or UniProt accession (e.g. "EGFR_HUMAN", "BRCA2", "P04637").',
        },
        limit: { type: 'number', description: 'Max interactions to return (default 20, max 100).' },
        page: { type: 'number', description: 'Page number, 0-indexed (default 0).' },
      },
      required: ['query'],
    },
  },
  {
    name: 'interaction_count',
    description:
      'IntAct (EBI) — fast count of how many molecular interactions a gene/protein (by name or UniProt id) has. Keyless.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Gene name, protein name, or UniProt accession (e.g. "EGFR_HUMAN", "BRCA2", "P04637").',
        },
      },
      required: ['query'],
    },
  },
];

interface IntActRow {
  ac?: string;
  idA?: string;
  idB?: string;
  moleculeA?: string;
  moleculeB?: string;
  type?: string;
  detectionMethod?: string;
  speciesA?: string;
  speciesB?: string;
  publicationPubmedIdentifier?: string;
  intactMiscore?: number;
}

interface IntActResponse {
  totalElements?: number;
  content?: IntActRow[];
}

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  try {
    switch (name) {
      case 'find_interactions': {
        const query = reqStr(args, 'query');
        const limit = clampNum(args.limit, 20, 1, 100);
        const page = Math.max(0, Math.trunc(toNum(args.page, 0)));
        const data = (await intactGet(query, page, limit)) as IntActResponse;
        const rows = Array.isArray(data.content) ? data.content : [];
        const interactions = rows.map((r) => {
          const organism =
            r.speciesA && r.speciesB
              ? r.speciesA === r.speciesB
                ? r.speciesA
                : `${r.speciesA} / ${r.speciesB}`
              : r.speciesA ?? r.speciesB ?? null;
          return {
            molecule_a: r.moleculeA ?? r.idA ?? null,
            molecule_b: r.moleculeB ?? r.idB ?? null,
            id_a: r.idA ?? null,
            id_b: r.idB ?? null,
            type: r.type ?? null,
            detection_method: r.detectionMethod ?? null,
            organism,
            pubmed: r.publicationPubmedIdentifier ?? null,
            score: typeof r.intactMiscore === 'number' ? r.intactMiscore : null,
          };
        });
        return {
          total: data.totalElements ?? interactions.length,
          count: interactions.length,
          interactions,
        };
      }
      case 'interaction_count': {
        const query = reqStr(args, 'query');
        const data = (await intactGet(query, 0, 1)) as IntActResponse;
        return { query, total_interactions: data.totalElements ?? 0 };
      }
      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

async function intactGet(query: string, page: number, pageSize: number): Promise<unknown> {
  const url = `${BASE}/interaction/findInteractions/${encodeURIComponent(query)}?page=${encodeURIComponent(
    String(page),
  )}&pageSize=${encodeURIComponent(String(pageSize))}`;
  const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': UA } });
  if (!res.ok) {
    const body = await res.text().then((t) => t.slice(0, 200)).catch(() => '');
    throw new Error(`IntAct: ${res.status} ${body}`);
  }
  return res.json();
}

function reqStr(args: Record<string, unknown>, key: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) {
    throw new Error(`Required argument "${key}" is missing. Pass a gene/protein name or UniProt accession.`);
  }
  return v.trim();
}

function toNum(v: unknown, fallback: number): number {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

function clampNum(v: unknown, fallback: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.trunc(toNum(v, fallback))));
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
