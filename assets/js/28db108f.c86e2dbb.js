"use strict";(self.webpackChunkdocs=self.webpackChunkdocs||[]).push([[673],{527:(e,t,s)=>{s.r(t),s.d(t,{assets:()=>a,contentTitle:()=>o,default:()=>u,frontMatter:()=>r,metadata:()=>l,toc:()=>c});var n=s(4246),i=s(1670);const r={sidebar_position:9},o="Apply Textures",l={id:"basics/texturing-blocks",title:"Apply Textures",description:"The next step that we will be taking is to apply textures to the blocks. Right now, the block textures are all question marks since we haven't applied any textures yet. We will be using the following four textures under public/blocks. The reason why grass_side.png is blurry is because it's actually only 8 pixels in dimension.",source:"@site/docs/tutorials/basics/9-texturing-blocks.md",sourceDirName:"basics",slug:"/basics/texturing-blocks",permalink:"/voxelize/tutorials/basics/texturing-blocks",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:9,frontMatter:{sidebar_position:9},sidebar:"tutorialSidebar",previous:{title:"Initialize the World",permalink:"/voxelize/tutorials/basics/initialize-the-world"},next:{title:"Player Control",permalink:"/voxelize/tutorials/basics/player-control"}},a={},c=[];function p(e){const t={admonition:"admonition",code:"code",h1:"h1",img:"img",p:"p",pre:"pre",strong:"strong",...(0,i.a)(),...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(t.h1,{id:"apply-textures",children:"Apply Textures"}),"\n",(0,n.jsxs)(t.p,{children:["The next step that we will be taking is to apply textures to the blocks. Right now, the block textures are all question marks since we haven't applied any textures yet. We will be using the following four textures under ",(0,n.jsx)(t.code,{children:"public/blocks"}),". The reason why ",(0,n.jsx)(t.code,{children:"grass_side.png"})," is blurry is because it's actually only 8 pixels in dimension."]}),"\n",(0,n.jsx)(t.p,{children:(0,n.jsx)(t.img,{src:s(6931).Z+"",width:"800",height:"600"})}),"\n",(0,n.jsx)(t.admonition,{type:"info",children:(0,n.jsxs)(t.p,{children:[(0,n.jsx)(t.strong,{children:"IMPORTANT"}),": Initialize the world first, and then apply textures. This is because we are drawing onto the chunk's textures, which is initialized in ",(0,n.jsx)(t.code,{children:"world.initialize"}),"."]})}),"\n",(0,n.jsx)(t.pre,{children:(0,n.jsx)(t.code,{className:"language-javascript",metastring:'title="main.js"',children:"async function start() {\n    // ...\n\n    await world.initialize();\n    \n    // Apply block textures here\n    const allFaces = ['px', 'nx', 'py', 'ny', 'pz', 'nz'];\n    await world.applyBlockTexture('Dirt', allFaces, '/blocks/dirt.png');\n    await world.applyBlockTexture('Stone', allFaces, '/blocks/stone.png');\n    await world.applyBlockTexture('Grass Block', ['px', 'pz', 'nx', 'nz'], '/blocks/grass_side.png');\n    await world.applyBlockTexture('Grass Block', 'py', '/blocks/grass_top.png');\n    await world.applyBlockTexture('Grass Block', 'ny', '/blocks/dirt.png');\n}\n"})}),"\n",(0,n.jsx)(t.p,{children:"Just like that, the blocks should now have all the textures we want."}),"\n",(0,n.jsx)(t.p,{children:(0,n.jsx)(t.img,{src:s(45).Z+"",width:"2560",height:"1440"})})]})}function u(e={}){const{wrapper:t}={...(0,i.a)(),...e.components};return t?(0,n.jsx)(t,{...e,children:(0,n.jsx)(p,{...e})}):p(e)}},45:(e,t,s)=>{s.d(t,{Z:()=>n});const n=s.p+"assets/images/textured-ground-74fa348aff912b016f36cc4e1b31e115.png"},6931:(e,t,s)=>{s.d(t,{Z:()=>n});const n=s.p+"assets/images/textures-f726258b6656fca98d3c0c86a718cd8a.png"},1670:(e,t,s)=>{s.d(t,{Z:()=>l,a:()=>o});var n=s(7378);const i={},r=n.createContext(i);function o(e){const t=n.useContext(r);return n.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function l(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:o(e.components),n.createElement(r.Provider,{value:t},e.children)}}}]);