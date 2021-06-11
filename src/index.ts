import { transformerWrapperFix } from './transformer';
import { addDepToMonaco, getContentAndDependenciesContent } from './ts-dependencies';
import type { PlaygroundPlugin, PluginUtils } from "./vendor/playground"

const programTsAutoMockFiles: Map<string, string> = new Map();
let busy = true;
let nextCompile = false;

async function runPlugin(utils, sandbox, container) {
  if (busy) {
    console.log("Tried to run, busy");
    nextCompile = true;
    return;
  }

  nextCompile = true;
  while (nextCompile) {
    console.log("Running plugin");
    nextCompile = false;
    busy = true;

    // We'll use this later, but they are a container + design system for showing 
    // the results of pressing the button. This makes it easier to clear, and re-draw.
    const resultsContainer = document.createElement("div")
    const resultsDS = utils.createDesignSystem(resultsContainer)

    const ds = utils.createDesignSystem(container);
    ds.clear();

    container.appendChild(resultsContainer)

    const { program, system } = await sandbox.setupTSVFS(programTsAutoMockFiles)

    // Use the compiler API to emit the JS, taking into account the new transformer above
    const sourceFile = program.getSourceFile(sandbox.filepath);
    program.emit(sourceFile, undefined, undefined, false, {
      after: [
        transformerWrapperFix(program, { cacheBetweenTests: false })
      ]
    })

    const js = system.readFile("/input.js")

    // Let Monaco handle syntax highlighting of our JS
    const colored = await sandbox.monaco.editor.colorize(js, "javascript", {})
    resultsDS.code(colored)

    busy = false;
  }
}

const makePlugin = (utils: PluginUtils) => {
  const customPlugin: PlaygroundPlugin = {
    id: "ts-auto-mock",
    displayName: "TS AUTO MOCK",
    didMount: async (sandbox, container) => {
      const depsContent: { content: string, path: string }[] = await getContentAndDependenciesContent();

      depsContent
        .forEach(dep => {
          addDepToMonaco(sandbox, dep.content, dep.path);
          programTsAutoMockFiles.set(dep.path, dep.content);
        });
      
      busy = false;
      await runPlugin(utils, sandbox, container);
    },
    modelChangedDebounce: (sandbox, _, container) => runPlugin(utils, sandbox, container),
  }

  return customPlugin
}

export default makePlugin
