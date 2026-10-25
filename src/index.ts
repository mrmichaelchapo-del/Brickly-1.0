// index.ts
import * as fs from 'fs';
import * as path from 'path';

interface BlockDefinition {
  id: string;
  name: string;
  category: string;
  inputs: { name: string; type: 'string' | 'number' | 'boolean' | 'block' }[];
  output?: 'string' | 'number' | 'boolean' | 'void';
  color: string;
  script?: string; // filename in scripts/
}

interface ScriptFile {
  name: string;
  code: string; // JavaScript code as string
  exports: string[];
}

interface Connection {
  blockId: string;
  inputName: string;
  source: string | number | boolean | Connection | null;
}

class BlockRegistry {
  private blocks: Map<string, BlockDefinition> = new Map();
  private scripts: Map<string, ScriptFile> = new Map();

  loadBlocksFromDirectory(dir: string): void {
    const blockPath = path.join(dir, 'blocks');
    if (!fs.existsSync(blockPath)) {
      console.warn(`[BlockRegistry] No blocks directory at ${blockPath}`);
      return;
    }
    const files = fs.readdirSync(blockPath).filter(f => f.endsWith('.json'));
    for (const file of files) {
      try {
        const raw = fs.readFileSync(path.join(blockPath, file), 'utf-8');
        const def: BlockDefinition = JSON.parse(raw);
        if (!def.id || !def.name) throw new Error(`Invalid block in ${file}`);
        this.blocks.set(def.id, def);
      } catch (e) {
        console.error(`[BlockRegistry] Failed to load block ${file}:`, e);
      }
    }
  }

  loadScriptsFromDirectory(dir: string): void {
    const scriptPath = path.join(dir, 'scripts');
    if (!fs.existsSync(scriptPath)) {
      console.warn(`[BlockRegistry] No scripts directory at ${scriptPath}`);
      return;
    }
    const files = fs.readdirSync(scriptPath).filter(f => f.endsWith('.js') || f.endsWith('.ts'));
    for (const file of files) {
      try {
        const code = fs.readFileSync(path.join(scriptPath, file), 'utf-8');
        const name = path.basename(file, path.extname(file));
        const exportMatches = code.match(/exports\.(\w+)\s*=/g) || [];
        const exports = exportMatches.map(m => m.replace(/exports\./, '').replace(/\s*=/g, ''));
        this.scripts.set(name, { name, code, exports });
      } catch (e) {
        console.error(`[BlockRegistry] Failed to load script ${file}:`, e);
      }
    }
  }

  getBlock(id: string): BlockDefinition | undefined {
    return this.blocks.get(id);
  }

  getScript(name: string): ScriptFile | undefined {
    return this.scripts.get(name);
  }

  getAllBlocks(): BlockDefinition[] {
    return Array.from(this.blocks.values());
  }

  getScriptsForBlock(block: BlockDefinition): ScriptFile | undefined {
    if (!block.script) return undefined;
    return this.scripts.get(block.script);
  }
}

class ExecutionContext {
  private registry: BlockRegistry;
  private cache: Map<string, any> = new Map();
  private output: string[] = [];

  constructor(registry: BlockRegistry) {
    this.registry = registry;
  }

  execute(blockId: string, connections: Connection[]): any {
    const block = this.registry.getBlock(blockId);
    if (!block) {
      throw new Error(`Block "${blockId}" not found.`);
    }

    const script = this.registry.getScriptsForBlock(block);
    if (!script) {
      throw new Error(`Block "${blockId}" has no associated script.`);
    }

    const inputs: Record<string, any> = {};
    for (const inp of block.inputs) {
      const conn = connections.find(c => c.blockId === blockId && c.inputName === inp.name);
      if (conn && conn.source !== null) {
        if (typeof conn.source === 'object' && 'blockId' in conn.source) {
          inputs[inp.name] = this.execute(conn.source.blockId, connections);
        } else {
          inputs[inp.name] = conn.source;
        }
      } else {
        inputs[inp.name] = this.getDefaultValue(inp.type);
      }
    }

    const sandbox = {
      inputs,
      output: (val: any) => {
        this.output.push(String(val));
        return val;
      },
      log: (...args: any[]) => this.output.push(args.join(' ')),
      exports: {} as Record<string, any>,
    };

    const fn = new Function('sandbox', `
      const { inputs, output, log, exports } = sandbox;
      ${script.code}
    `);

    fn(sandbox);
    const result = sandbox.exports.result !== undefined ? sandbox.exports.result : null;
    this.cache.set(blockId, result);
    return result;
  }

  private getDefaultValue(type: string): any {
    switch (type) {
      case 'string': return '';
      case 'number': return 0;
      case 'boolean': return false;
      default: return null;
    }
  }

  getOutput(): string[] {
    return [...this.output];
  }

  clear(): void {
    this.cache.clear();
    this.output = [];
  }
}

class BlockLanguageEngine {
  private registry: BlockRegistry;
  private context: ExecutionContext;

  constructor(baseDir: string) {
    this.registry = new BlockRegistry();
    this.registry.loadBlocksFromDirectory(baseDir);
    this.registry.loadScriptsFromDirectory(baseDir);
    this.context = new ExecutionContext(this.registry);
  }

  run(connections: Connection[]): { result: any; output: string[] } {
    const entryBlocks = this.findEntryBlocks(connections);
    let result: any = null;
    for (const entry of entryBlocks) {
      result = this.context.execute(entry.blockId, connections);
    }
    return { result, output: this.context.getOutput() };
  }

  private findEntryBlocks(connections: Connection[]): Connection[] {
    const allBlockIds = new Set(connections.map(c => c.blockId));
    const usedAsSource = new Set<string>();
    for (const conn of connections) {
      if (conn.source && typeof conn.source === 'object' && 'blockId' in conn.source) {
        usedAsSource.add(conn.source.blockId);
      }
    }
    return connections.filter(c => !usedAsSource.has(c.blockId) && allBlockIds.has(c.blockId));
  }

  listBlocks(): BlockDefinition[] {
    return this.registry.getAllBlocks();
  }

  listScripts(): string[] {
    return Array.from((this.registry as any).scripts.keys());
  }
}

export { BlockLanguageEngine, BlockRegistry, ExecutionContext };
export type { BlockDefinition, Connection, ScriptFile };

// --- Demonstration / Auto-run if executed directly ---
if (require.main === module) {
  const baseDir = path.join(__dirname);
  const engine = new BlockLanguageEngine(baseDir);

  // Example connections (these would normally be built visually):
  const demoConnections: Connection[] = [
    { blockId: 'hello', inputName: 'name', source: 'World' },
    { blockId: 'add', inputName: 'a', source: { blockId: 'hello', inputName: 'result', source: null } },
    { blockId: 'add', inputName: 'b', source: 5 },
    { blockId: 'print', inputName: 'value', source: { blockId: 'add', inputName: 'result', source: null } },
  ];

  console.log('Available blocks:', engine.listBlocks().map(b => b.name));
  console.log('Available scripts:', engine.listScripts());

  try {
    const result = engine.run(demoConnections);
    console.log('Execution result:', result.result);
    console.log('Program output:', result.output);
  } catch (e) {
    console.error('Execution error:', e);
  }
}