(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,25570,36715,e=>{"use strict";let t,n,i,a;function l(e){let t=e.toLowerCase();return t.endsWith(".ts")||t.endsWith(".tsx")?"typescript":t.endsWith(".js")||t.endsWith(".jsx")||t.endsWith(".mjs")||t.endsWith(".cjs")?"javascript":t.endsWith(".css")||t.endsWith(".scss")||t.endsWith(".sass")||t.endsWith(".less")?"css":t.endsWith(".json")||t.endsWith(".jsonc")?"json":t.endsWith(".md")||t.endsWith(".mdx")?"markdown":t.endsWith(".html")||t.endsWith(".htm")?"html":t.endsWith(".svg")||t.endsWith(".xml")?"xml":t.endsWith(".py")?"python":t.endsWith(".rs")?"rust":t.endsWith(".go")?"go":t.endsWith(".java")?"java":t.endsWith(".cs")?"csharp":t.endsWith(".cpp")||t.endsWith(".cc")||t.endsWith(".cxx")||t.endsWith(".c")||t.endsWith(".h")||t.endsWith(".hpp")?"cpp":t.endsWith(".yml")||t.endsWith(".yaml")?"yaml":t.endsWith(".toml")?"toml":t.endsWith(".sql")?"sql":t.endsWith(".sh")||t.endsWith(".bash")||t.endsWith(".zsh")||t.endsWith(".ps1")?"shell":t.endsWith(".bat")||t.endsWith(".cmd")?"bat":t.endsWith("dockerfile")||t.endsWith(".dockerfile")?"dockerfile":/\.(png|jpe?g|gif|webp|ico|pdf|zip|gz|mp3|mp4|mov|wasm|woff2?|ttf|eot)$/i.test(t)?"asset":"plaintext"}function r(e){return e.replaceAll("\\","/").replace(/^\/+/,"").replace(/\/+/g,"/")}function o(e){return`imported-file-${d(e)}-${p(e.split("/").pop()??"file")}`}function s(e){return`imported-folder-${d(e)}-${p(e.split("/").pop()??"folder")}`}function d(e){let t=0;for(let n=0;n<e.length;n+=1)t=(t<<5)-t+e.charCodeAt(n)|0;return Math.abs(t).toString(36)}function p(e){return e.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"item"}e.s(["flattenFiles",0,function(e){return Object.values(e).sort((e,t)=>e.path.localeCompare(t.path))},"flattenTree",0,function e(t){return t.flatMap(t=>[t,...t.children?e(t.children):[]])},"fuzzyScore",0,function(e,t){let n=e.trim().toLowerCase(),i=t.toLowerCase();if(!n)return 1;if(i.includes(n))return 100-i.indexOf(n);let a=0,l=0;for(let e of n){let t=i.indexOf(e,l);if(-1===t)return 0;a+=t===l?8:2,l=t+1}return a},"getLanguageLabel",0,function(e){return({asset:"Asset",bat:"Batch",csharp:"C#",cpp:"C++",css:"CSS",dockerfile:"Dockerfile",go:"Go",html:"HTML",java:"Java",json:"JSON",markdown:"Markdown",plaintext:"Plain Text",python:"Python",rust:"Rust",shell:"Shell",sql:"SQL",toml:"TOML",typescript:"TypeScript",javascript:"JavaScript",xml:"XML",yaml:"YAML"})[e]??e},"importedFileId",0,o,"importedFolderId",0,s,"inferLanguageFromPath",0,l,"normalizeImportPath",0,r,"simulateRun",0,function(e){return e?e.path.endsWith("package.json")?["> npm run build","vite v6.0.0 building for production...","transformed 18 modules","dist/index.html  0.62 kB","dist/assets/app.js  27.4 kB","Build completed in 482ms."]:e.path.endsWith(".test.ts")?["> vitest run","RUN  tests/math.test.ts","✓ math helpers > adds two numbers","Test Files  1 passed","Tests       1 passed"]:"typescript"===e.language?[`> tsx ${e.path}`,"TypeScript compiled with 0 errors.","Preview server refreshed at http://localhost:5173/"]:"css"===e.language?["> stylelint src/styles.css","0 problems found.","Styles were hot-reloaded in the preview panel."]:"html"===e.language||/\.html?$/i.test(e.path)?[`Serving ${e.path}`,"Local URL: http://localhost:5173/","Preview opened in the PREVIEW panel."]:[`Opened ${e.path}. Nothing runnable was configured for this language.`]:["No active file. Open a file before running."]}],25570);var c,m=e.i(71645);let h=e=>{let t,n=new Set,i=(e,i)=>{let a="function"==typeof e?e(t):e;if(!Object.is(a,t)){let e=t;t=(null!=i?i:"object"!=typeof a||null===a)?a:Object.assign({},t,a),n.forEach(n=>n(t,e))}},a=()=>t,l={setState:i,getState:a,getInitialState:()=>r,subscribe:e=>(n.add(e),()=>n.delete(e))},r=t=e(i,a,l);return l};function f(e,t){let n;try{n=e()}catch(e){return}return{getItem:e=>{var i;let a=e=>null===e?null:JSON.parse(e,null==t?void 0:t.reviver),l=null!=(i=n.getItem(e))?i:null;return l instanceof Promise?l.then(a):a(l)},setItem:(e,i)=>n.setItem(e,JSON.stringify(i,null==t?void 0:t.replacer)),removeItem:e=>n.removeItem(e)}}let u=e=>t=>{try{let n=e(t);if(n instanceof Promise)return n;return{then:e=>u(e)(n),catch(e){return this}}}catch(e){return{then(e){return this},catch:t=>u(t)(e)}}},g=Object.fromEntries([{id:"file-package",name:"package.json",path:"package.json",language:"json",content:`{
  "name": "aurora-workbench",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "tsc && vite build",
    "test": "vitest run"
  },
  "dependencies": {
    "@vitejs/plugin-react": "latest",
    "typescript": "latest",
    "vite": "latest",
    "vitest": "latest"
  }
}
`},{id:"file-readme",name:"README.md",path:"README.md",language:"markdown",content:`# Aurora Workbench

A small in-browser project used to demonstrate the workspace:

- edit files with Monaco
- open multiple tabs
- run simulated commands
- toggle themes, panels, minimap, split view, and keybindings
- install extensions that add commands, snippets, and panels

Try opening the command palette with Ctrl+P or Cmd+P.
`},{id:"file-main",name:"main.tsx",path:"src/main.tsx",language:"typescript",content:`import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`},{id:"file-app",name:"App.tsx",path:"src/App.tsx",language:"typescript",content:`import { CommandButton } from "../components/CommandButton";
import { add, formatBuildTime } from "./lib/math";

const panels = ["Explorer", "Search", "Source Control", "Terminal"];

export function App() {
  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">Aurora Workbench</p>
        <h1>Fast local tools for focused development.</h1>
        <p>
          The demo project mirrors the way a real workspace keeps files,
          commands, preview output, and editor settings in one place.
        </p>
        <CommandButton label="Run build" />
      </section>

      <section className="panel-grid" aria-label="Workspace panels">
        {panels.map((panel, index) => (
          <article className="panel" key={panel}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{panel}</strong>
          </article>
        ))}
      </section>

      <footer>
        Build score: {add(21, 21)} / Last run: {formatBuildTime(new Date())}
      </footer>
    </main>
  );
}
`},{id:"file-button",name:"CommandButton.tsx",path:"components/CommandButton.tsx",language:"typescript",content:`interface CommandButtonProps {
  label: string;
}

export function CommandButton({ label }: CommandButtonProps) {
  return (
    <button className="command-button" type="button">
      {label}
    </button>
  );
}
`},{id:"file-math",name:"math.ts",path:"src/lib/math.ts",language:"typescript",content:`export function add(left: number, right: number) {
  return left + right;
}

export function formatBuildTime(date: Date) {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(date);
}
`},{id:"file-style",name:"styles.css",path:"src/styles.css",language:"css",content:`:root {
  color: #f5f5f5;
  background: #161616;
  font-family: Inter, system-ui, sans-serif;
}

body {
  margin: 0;
}

.app-shell {
  min-height: 100vh;
  display: grid;
  align-content: center;
  gap: 28px;
  padding: 48px;
}

.eyebrow {
  color: #4aa3ff;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.hero {
  max-width: 760px;
}

.hero h1 {
  margin: 0;
  font-size: clamp(2.5rem, 7vw, 6rem);
  line-height: 0.96;
}

.hero p {
  color: #bdbdbd;
  font-size: 1.08rem;
}

.command-button {
  min-height: 40px;
  border: 1px solid #4aa3ff;
  border-radius: 6px;
  background: #4aa3ff;
  color: #06101f;
  font-weight: 800;
}

.panel-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.panel {
  min-height: 140px;
  border: 1px solid #343434;
  border-radius: 6px;
  padding: 16px;
}
`},{id:"file-test",name:"math.test.ts",path:"tests/math.test.ts",language:"typescript",content:`import { describe, expect, it } from "vitest";
import { add } from "../src/lib/math";

describe("math helpers", () => {
  it("adds two numbers", () => {
    expect(add(2, 3)).toBe(5);
  });
});
`},{id:"file-settings",name:"settings.json",path:".vscode/settings.json",language:"json",content:`{
  "editor.fontSize": 14,
  "editor.minimap.enabled": true,
  "editor.bracketPairColorization.enabled": true,
  "workbench.colorTheme": "Code Workspace Dark",
  "terminal.integrated.defaultProfile": "Simulated Shell"
}
`}].map(e=>[e.id,{...e,originalContent:e.content,modified:!1}])),b=[{id:"folder-root",name:"aurora-workbench",path:"",type:"folder",children:[{id:"file-package",name:"package.json",path:"package.json",type:"file",language:"json"},{id:"file-readme",name:"README.md",path:"README.md",type:"file",language:"markdown"},{id:"folder-src",name:"src",path:"src",type:"folder",children:[{id:"file-main",name:"main.tsx",path:"src/main.tsx",type:"file",language:"typescript"},{id:"file-app",name:"App.tsx",path:"src/App.tsx",type:"file",language:"typescript"},{id:"folder-src-lib",name:"lib",path:"src/lib",type:"folder",children:[{id:"file-math",name:"math.ts",path:"src/lib/math.ts",type:"file",language:"typescript"}]},{id:"file-style",name:"styles.css",path:"src/styles.css",type:"file",language:"css"}]},{id:"folder-components",name:"components",path:"components",type:"folder",children:[{id:"file-button",name:"CommandButton.tsx",path:"components/CommandButton.tsx",type:"file",language:"typescript"}]},{id:"folder-tests",name:"tests",path:"tests",type:"folder",children:[{id:"file-test",name:"math.test.ts",path:"tests/math.test.ts",type:"file",language:"typescript"}]},{id:"folder-vscode",name:".vscode",path:".vscode",type:"folder",children:[{id:"file-settings",name:"settings.json",path:".vscode/settings.json",type:"file",language:"json"}]}]}],v=["folder-root","folder-src","folder-src-lib","folder-components","folder-tests","folder-vscode"];function y(){return Object.fromEntries(Object.entries(g).map(([e,t])=>[e,{...t}]))}function w(){return b.map(x)}function x(e){return{...e,children:e.children?.map(x)}}let T=["workspace-snippets","preview-runner","git-insights","theme-lab"];function S(e,t,n,i=1/0){let a=r(t.path).split("/").filter(Boolean);if(!a.length)return;let l=e,o="";a.forEach((e,r)=>{if(r===a.length-1){let e=l.find(e=>"file"===e.type&&e.path===t.path),n={id:t.id,name:t.name,path:t.path,type:"file",language:t.language};e?Object.assign(e,n):l.push(n);return}let d=s(o=o?`${o}/${e}`:e),p=l.find(e=>"folder"===e.type&&e.path===o);p||(p={id:d,name:e,path:o,type:"folder",children:[]},l.push(p)),p.children??=[],r<i&&n.add(p.id),l=p.children})}function P(e){e.sort((e,t)=>e.type!==t.type?"folder"===e.type?-1:1:e.name.localeCompare(t.name)),e.forEach(e=>{e.children&&P(e.children)})}function F(e,t=new Set){return e.forEach(e=>{"folder"===e.type&&(e.path&&t.add(e.path),e.children&&F(e.children,t))}),t}function j(e,t,n,i=0){let a=[];return[...t].sort((e,t)=>e.localeCompare(t)).forEach(e=>(function(e,t,n,i=1/0){let a=r(t).split("/").filter(Boolean),l=e,o="";a.forEach((e,t)=>{let a=s(o=o?`${o}/${e}`:e),r=l.find(e=>"folder"===e.type&&e.path===o);r||(r={id:a,name:e,path:o,type:"folder",children:[]},l.push(r)),r.children??=[],t<i&&n.add(r.id),l=r.children})})(a,e,n,i)),Object.values(e).forEach(e=>S(a,e,n,i)),P(a),a}function W(e,t){return e===t||e.startsWith(`${t}/`)}function I(e,t,n){return e===t?n:`${n}/${e.slice(t.length+1)}`}function k(e){return e<=80?1/0:2}let E=(i=(c=(t=(e,t)=>({activityView:"explorer",bottomPanelView:"terminal",bottomPanelOpen:!0,commandPaletteOpen:!1,commandPaletteQuery:"",editorScrollTop:0,enabledExtensionIds:T,expandedFolders:[...v],fileTree:w(),files:y(),minimap:!0,openTabs:["file-app","file-style"],activeFileId:"file-app",pendingEditorAction:null,pendingSnippet:null,panelHeight:240,previewPath:null,searchQuery:"",sidebarWidth:286,splitView:!1,syncScroll:!0,terminalLog:["Code Workspace terminal initialized.","Type help to see available commands."],theme:"dark",addImportedFiles:(t,n="local picker")=>e(e=>{let i={...e.files},a=function e(t){return t.map(t=>({...t,children:t.children?e(t.children):void 0}))}(e.fileTree?.length?e.fileTree:w()),s=new Set(e.expandedFolders),d=[],p=k(t.length);if(t.forEach(e=>{let t=r(e.path||e.name);if(!t)return;let n=Object.values(i).find(e=>e.path===t),c=n?.id??o(t),m={id:c,name:e.name||t.split("/").pop()||"untitled",path:t,language:l(t),content:e.content,originalContent:e.content,modified:!1,assetKind:e.assetKind,blobKey:e.blobKey,dataUrl:e.dataUrl,mimeType:e.mimeType,size:e.size};i[c]=m,S(a,m,s,p),d.push(c)}),!d.length)return e;P(a);let c=d[0],m=[...e.openTabs];return d.slice(0,8).forEach(e=>{m.includes(e)||m.push(e)}),{activeFileId:c,expandedFolders:[...s],fileTree:a,files:i,openTabs:m,previewPath:e.previewPath,terminalLog:[...e.terminalLog,`Imported ${d.length} file(s) from ${n}.`,...d.length>=260?["Large import mode: folders stay collapsed and reload persistence is reduced for speed."]:[]].slice(-120)}}),replaceWorkspaceWithImportedFiles:(t,n="local folder")=>e(e=>{let i,a,s,d,p,c=(i={},a=[],s=new Set,d=[],p=k(t.length),t.forEach(e=>{let t=r(e.path||e.name);if(!t)return;let n=o(t),c={id:n,name:e.name||t.split("/").pop()||"untitled",path:t,language:l(t),content:e.content,originalContent:e.content,modified:!1,assetKind:e.assetKind,blobKey:e.blobKey,dataUrl:e.dataUrl,mimeType:e.mimeType,size:e.size};i[n]=c,S(a,c,s,p),d.push(n)}),P(a),{activeFileId:d[0]??null,expandedFolders:[...s],fileTree:a,files:i,importedIds:d,largeMode:t.length>=260});return c.importedIds.length?{activeFileId:c.activeFileId,expandedFolders:c.expandedFolders,fileTree:c.fileTree,files:c.files,openTabs:c.importedIds.slice(0,8),previewPath:null,searchQuery:"",terminalLog:[`Opened folder ${n}.`,`Loaded ${c.importedIds.length} file(s).`,...c.largeMode?["Large folder mode: folders stay collapsed and reload persistence is reduced for speed."]:[]]}:e}),addTerminalLines:t=>e(e=>({terminalLog:[...e.terminalLog,...t].slice(-120)})),clearTerminal:()=>e({terminalLog:[]}),copyPath:(n,i)=>{let a=t(),l=r(n),s=r(i),d=Object.values(a.files),p=d.find(e=>e.path===l),c=d.filter(e=>W(e.path,l));return(!!p||!!c.length)&&(p?t().createFile(s,p.content):e(e=>{let t={...e.files},n=F(e.fileTree);n.add(s);let i=new Set(e.expandedFolders),a=[...e.openTabs];return c.forEach(e=>{let n=I(e.path,l,s),i=o(n);t[i]={...e,id:i,name:n.split("/").pop()||e.name,path:n,originalContent:e.content,modified:!1},!a.includes(i)&&a.length<8&&a.push(i)}),{files:t,fileTree:j(t,n,i),expandedFolders:[...i],openTabs:a}}),!0)},createFile:(t,n="")=>e(e=>{let i=r(t);if(!i)return e;let a=Object.values(e.files).find(e=>e.path===i),s=a?.id??o(i),d={...e.files,[s]:{id:s,name:i.split("/").pop()||"untitled",path:i,language:l(i),content:n,originalContent:n,modified:!1}},p=F(e.fileTree),c=i.split("/").slice(0,-1).join("/");c&&p.add(c);let m=new Set(e.expandedFolders);return{activeFileId:s,files:d,fileTree:j(d,p,m),expandedFolders:[...m],openTabs:e.openTabs.includes(s)?e.openTabs:[...e.openTabs,s]}}),createFolder:t=>e(e=>{let n=r(t);if(!n)return e;let i=F(e.fileTree);i.add(n);let a=new Set(e.expandedFolders);return{fileTree:j(e.files,i,a),expandedFolders:[...a]}}),closeCommandPalette:()=>e({commandPaletteOpen:!1,commandPaletteQuery:""}),closeTab:t=>e(e=>({openTabs:e.openTabs.filter(e=>e!==t),activeFileId:function(e,t,n){if(n!==t)return n;let i=e.indexOf(t),a=e.filter(e=>e!==t);return a[Math.max(0,i-1)]??a[0]??null}(e.openTabs,t,e.activeFileId)})),consumeEditorAction:()=>{let n=t().pendingEditorAction;return e({pendingEditorAction:null}),n},consumeSnippet:()=>{let n=t().pendingSnippet;return e({pendingSnippet:null}),n},cycleTheme:()=>e(e=>{let t=["dark","light","contrast"];return{theme:t[(t.indexOf(e.theme)+1)%t.length]}}),deletePath:n=>{let i=r(n),a=t(),l=Object.values(a.files).filter(e=>W(e.path,i)),o=F(a.fileTree).has(i);return(!!l.length||!!o)&&(e(e=>{let t=Object.fromEntries(Object.entries(e.files).filter(([,e])=>!W(e.path,i))),n=F(e.fileTree);[...n].forEach(e=>{W(e,i)&&n.delete(e)});let a=new Set(e.expandedFolders),r=new Set(l.map(e=>e.id)),o=e.openTabs.filter(e=>!r.has(e));return{activeFileId:e.activeFileId&&r.has(e.activeFileId)?o[0]??null:e.activeFileId,files:t,fileTree:j(t,n,a),expandedFolders:[...a],openTabs:o,previewPath:e.previewPath&&W(e.previewPath,i)?null:e.previewPath}}),!0)},movePath:(n,i)=>{let a=r(n),s=r(i),d=t(),p=Object.values(d.files).filter(e=>W(e.path,a)),c=F(d.fileTree).has(a);return(!!p.length||!!c)&&(e(e=>{let t={...e.files},n=new Map;p.forEach(e=>{delete t[e.id];let i=I(e.path,a,s),r=o(i);n.set(e.id,r),t[r]={...e,id:r,name:i.split("/").pop()||e.name,path:i,language:l(i)}});let i=F(e.fileTree);[...i].forEach(e=>{W(e,a)&&(i.delete(e),i.add(I(e,a,s)))}),c&&i.add(s);let r=new Set(e.expandedFolders),d=e.openTabs.map(e=>n.get(e)??e);return{activeFileId:e.activeFileId?n.get(e.activeFileId)??e.activeFileId:null,files:t,fileTree:j(t,i,r),expandedFolders:[...r],openTabs:d,previewPath:e.previewPath&&W(e.previewPath,a)?I(e.previewPath,a,s):e.previewPath}}),!0)},openCommandPalette:(t="")=>e({commandPaletteOpen:!0,commandPaletteQuery:t}),openFile:t=>e(e=>e.files[t]?{activeFileId:t,openTabs:e.openTabs.includes(t)?e.openTabs:[...e.openTabs,t]}:e),openFileByPath:e=>{let n=Object.values(t().files).find(t=>t.path===e);return!!n&&(t().openFile(n.id),!0)},queueEditorAction:t=>e({pendingEditorAction:t}),queueSnippet:t=>e({pendingSnippet:t}),resetWorkspace:()=>e({files:y(),fileTree:w(),openTabs:["file-app","file-style"],activeFileId:"file-app",expandedFolders:[...v],previewPath:null,terminalLog:["Workspace reset to the bundled demo project."]}),saveActiveFile:()=>e(e=>{if(!e.activeFileId)return e;let t=e.files[e.activeFileId];return t?{files:{...e.files,[t.id]:{...t,originalContent:t.content,modified:!1}},terminalLog:[...e.terminalLog,`Saved ${t.path}.`].slice(-120)}:e}),saveAllFiles:()=>e(e=>({files:Object.fromEntries(Object.entries(e.files).map(([e,t])=>[e,{...t,originalContent:t.content,modified:!1}])),terminalLog:[...e.terminalLog,"Saved all modified files."].slice(-120)})),setActivityView:t=>e({activityView:t}),setActiveFile:e=>t().openFile(e),setBottomPanelView:t=>e({bottomPanelView:t,bottomPanelOpen:!0}),setCommandPaletteQuery:t=>e({commandPaletteQuery:t}),setEditorScrollTop:t=>e({editorScrollTop:t}),setPanelHeight:t=>e({panelHeight:Math.max(148,Math.min(420,t))}),setPreviewPath:t=>e({previewPath:t}),setSearchQuery:t=>e({searchQuery:t}),setSidebarWidth:t=>e({sidebarWidth:Math.max(220,Math.min(420,t))}),setTheme:t=>e({theme:t}),toggleBottomPanel:()=>e(e=>({bottomPanelOpen:!e.bottomPanelOpen})),toggleExtension:t=>e(e=>({enabledExtensionIds:e.enabledExtensionIds.includes(t)?e.enabledExtensionIds.filter(e=>e!==t):[...e.enabledExtensionIds,t]})),toggleFolder:t=>e(e=>({expandedFolders:e.expandedFolders.includes(t)?e.expandedFolders.filter(e=>e!==t):[...e.expandedFolders,t]})),toggleMinimap:()=>e(e=>({minimap:!e.minimap})),toggleSplitView:()=>e(e=>({splitView:!e.splitView})),toggleSyncScroll:()=>e(e=>({syncScroll:!e.syncScroll})),updateFileContent:(t,n)=>e(e=>{let i=e.files[t];return i?{files:{...e.files,[t]:{...i,content:n,modified:n!==i.originalContent}}}:e})}),n={name:"code-workspace-state-v2",storage:f(()=>localStorage),onRehydrateStorage:()=>()=>{try{localStorage.removeItem("code-workspace-state")}catch{}},partialize:e=>({...function(e){let t=Object.entries(e.files),n=0,i=t.length<=180;if(i){for(let[,e]of t)if(n+=e.content.length+e.originalContent.length,e.dataUrl||e.blobKey||n>9e5){i=!1;break}}return i?{activeFileId:e.activeFileId,expandedFolders:e.expandedFolders.slice(0,220),fileTree:e.fileTree,files:Object.fromEntries(t.map(([e,t])=>[e,{...t,dataUrl:void 0}])),openTabs:e.openTabs,previewPath:e.previewPath}:{activeFileId:"file-app",expandedFolders:[...v],fileTree:w(),files:y(),openTabs:["file-app","file-style"],previewPath:null}}(e),bottomPanelOpen:e.bottomPanelOpen,bottomPanelView:e.bottomPanelView,enabledExtensionIds:e.enabledExtensionIds,minimap:e.minimap,panelHeight:e.panelHeight,sidebarWidth:e.sidebarWidth,splitView:e.splitView,syncScroll:e.syncScroll,theme:e.theme})},(e,i,a)=>{let l,r={storage:f(()=>window.localStorage),partialize:e=>e,version:0,merge:(e,t)=>({...t,...e}),...n},o=!1,s=0,d=new Set,p=new Set,c=r.storage;if(!c)return t((...t)=>{console.warn(`[zustand persist middleware] Unable to update item '${r.name}', the given storage is currently unavailable.`),e(...t)},i,a);let m=()=>{let e=r.partialize({...i()});return c.setItem(r.name,{state:e,version:r.version})},h=a.setState;a.setState=(e,t)=>(h(e,t),m());let g=t((...t)=>(e(...t),m()),i,a);a.getInitialState=()=>g;let b=()=>{var t,n;if(!c)return;let a=++s;o=!1,d.forEach(e=>{var t;return e(null!=(t=i())?t:g)});let h=(null==(n=r.onRehydrateStorage)?void 0:n.call(r,null!=(t=i())?t:g))||void 0;return u(c.getItem.bind(c))(r.name).then(e=>{if(e)if("number"!=typeof e.version||e.version===r.version)return[!1,e.state];else{if(r.migrate){let t=r.migrate(e.state,e.version);return t instanceof Promise?t.then(e=>[!0,e]):[!0,t]}console.error("State loaded from storage couldn't be migrated since no migrate function was provided")}return[!1,void 0]}).then(t=>{var n;if(a!==s)return;let[o,d]=t;if(e(l=r.merge(d,null!=(n=i())?n:g),!0),o)return m()}).then(()=>{a===s&&(null==h||h(i(),void 0),l=i(),o=!0,p.forEach(e=>e(l)))}).catch(e=>{a===s&&(null==h||h(void 0,e))})};return a.persist={setOptions:e=>{r={...r,...e},e.storage&&(c=e.storage)},clearStorage:()=>{null==c||c.removeItem(r.name)},getOptions:()=>r,rehydrate:()=>b(),hasHydrated:()=>o,onHydrate:e=>(d.add(e),()=>{d.delete(e)}),onFinishHydration:e=>(p.add(e),()=>{p.delete(e)})},r.skipHydration||b(),l||g}))?h(c):h,Object.assign(a=e=>(function(e,t=e=>e){let n=m.default.useSyncExternalStore(e.subscribe,m.default.useCallback(()=>t(e.getState()),[e,t]),m.default.useCallback(()=>t(e.getInitialState()),[e,t]));return m.default.useDebugValue(n),n})(i,e),i),a);e.s(["useWorkspaceStore",0,E],36715)},91701,e=>{"use strict";let t="blobs";function n(){return new Promise((e,n)=>{if(!("indexedDB"in globalThis))return void n(Error("IndexedDB is unavailable."));let i=indexedDB.open("code-workspace-assets",1);i.onupgradeneeded=()=>{i.result.createObjectStore(t)},i.onsuccess=()=>e(i.result),i.onerror=()=>n(i.error)})}async function i(e,i){let a=await n();await new Promise((n,l)=>{let r=a.transaction(t,"readwrite");r.objectStore(t).put(i,e),r.oncomplete=()=>n(),r.onerror=()=>l(r.error)}),a.close()}async function a(e){let i=await n(),a=await new Promise((n,a)=>{let l=i.transaction(t,"readonly").objectStore(t).get(e);l.onsuccess=()=>n(l.result),l.onerror=()=>a(l.error)});return i.close(),a}e.s(["cacheAssetBlob",0,i,"getCachedAssetBlob",0,a])},31956,e=>{e.v(t=>Promise.all(["static/chunks/0_azuya_n2564.js"].map(t=>e.l(t))).then(()=>t(18427)))},12394,e=>{e.v(t=>Promise.all(["static/chunks/0bb5odocvqrk-.js"].map(t=>e.l(t))).then(()=>t(15082)))}]);