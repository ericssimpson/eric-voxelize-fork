"use strict";(self.webpackChunkdocs=self.webpackChunkdocs||[]).push([[4307],{7219:(e,n,s)=>{s.r(n),s.d(n,{assets:()=>d,contentTitle:()=>h,default:()=>o,frontMatter:()=>c,metadata:()=>r,toc:()=>l});var t=s(4246),i=s(1670);const c={},h="Custom Dispatcher",r={id:"custom-dispatcher",title:"Custom Dispatcher",description:"The Voxelize server is built on top of the specs ECS framework. This means that the server is made up of a series of systems that are running in parallel. By default, Voxelize has a list of systems that are used to handle things like chunk generation, network packet handling, and more. These systems come together and define what happens every game tick.",source:"@site/docs/wiki/custom-dispatcher.md",sourceDirName:".",slug:"/custom-dispatcher",permalink:"/voxelize/wiki/custom-dispatcher",draft:!1,unlisted:!1,tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"Chunk Meshing",permalink:"/voxelize/wiki/chunk-meshing"},next:{title:"Custom Entities",permalink:"/voxelize/wiki/custom-entities"}},d={},l=[{value:"The Default Dispatcher",id:"the-default-dispatcher",level:2}];function a(e){const n={a:"a",code:"code",h1:"h1",h2:"h2",li:"li",p:"p",ul:"ul",...(0,i.a)(),...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(n.h1,{id:"custom-dispatcher",children:"Custom Dispatcher"}),"\n",(0,t.jsxs)(n.p,{children:["The Voxelize server is built on top of the ",(0,t.jsx)(n.a,{href:"https://specs.amethyst.rs/docs/tutorials/",children:"specs"})," ECS framework. This means that the server is made up of a series of systems that are running in parallel. By default, Voxelize has a list of systems that are used to handle things like chunk generation, network packet handling, and more. These systems come together and define what happens every game tick."]}),"\n",(0,t.jsx)(n.p,{children:"In order to customize this behavior, you can define your own dispatcher. This allows you to define your own systems, and to control the order in which they are executed. This can be useful for creating custom game logic, or for optimizing the server."}),"\n",(0,t.jsx)(n.h2,{id:"the-default-dispatcher",children:"The Default Dispatcher"}),"\n",(0,t.jsx)(n.p,{children:"The default dispatcher consists of the following systems:"}),"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"UpdateStatsSystem"}),' ("update-stats")',"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsx)(n.li,{children:"0 dependencies"}),"\n",(0,t.jsx)(n.li,{children:"Updates the game tick counter, and the time since the last tick"}),"\n",(0,t.jsxs)(n.li,{children:["The details are within the ",(0,t.jsx)(n.code,{children:"Stats"})," resource in the ECS world"]}),"\n"]}),"\n"]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"EntitiesMetaSystem"}),' ("entities-meta")',"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsx)(n.li,{children:"0 dependencies"}),"\n",(0,t.jsx)(n.li,{children:"Updates the metadata of entities"}),"\n"]}),"\n"]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"PeersMetaSystem"}),' ("peers-meta")',"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsx)(n.li,{children:"0 dependencies"}),"\n",(0,t.jsx)(n.li,{children:"Updates the metadata of peers"}),"\n"]}),"\n"]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"CurrentChunkSystem"}),' ("current-chunks")',"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsx)(n.li,{children:"0 dependencies"}),"\n",(0,t.jsx)(n.li,{children:"Based on each entity's position, determines which chunks they are currently in"}),"\n",(0,t.jsxs)(n.li,{children:["This updates the ",(0,t.jsx)(n.code,{children:"CurrentChunkComp"})]}),"\n"]}),"\n"]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"ChunkUpdatingSystem"}),' ("chunk-updating")',"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsx)(n.li,{children:'1 dependency: "current-chunks"'}),"\n",(0,t.jsx)(n.li,{children:"Processes the voxel updates that have been queued by the clients"}),"\n",(0,t.jsx)(n.li,{children:"This is where the voxel updates are actually applied to the chunks"}),"\n"]}),"\n"]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"ChunkRequestsSystem"}),' ("chunk-requests")',"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsx)(n.li,{children:'1 dependency: "current_chunk"'}),"\n",(0,t.jsx)(n.li,{children:"Processes the chunks requested by the clients"}),"\n"]}),"\n"]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"ChunkGenerationSystem"}),' ("chunk-generation")',"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsx)(n.li,{children:'1 dependency: "chunk-requests"'}),"\n",(0,t.jsx)(n.li,{children:"Generates chunks that have not been generated yet"}),"\n",(0,t.jsx)(n.li,{children:"Meshes are generated here for the chunks"}),"\n"]}),"\n"]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"ChunkSendingSystem"}),' ("chunk-sending")',"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsx)(n.li,{children:'1 dependency: "chunk-generation"'}),"\n",(0,t.jsx)(n.li,{children:"Sends the chunks that are generated and meshed to the clients"}),"\n"]}),"\n"]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"ChunkSavingSystem"}),' ("chunk-saving")',"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsx)(n.li,{children:'1 dependency: "chunk-generation"'}),"\n",(0,t.jsx)(n.li,{children:"Saves the chunks that are generated to the disk"}),"\n"]}),"\n"]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"PhysicsSystem"}),' ("physics)',"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsx)(n.li,{children:'2 dependencies: "current-chunk", "update-stats"'}),"\n",(0,t.jsx)(n.li,{children:"Ticks the rigid bodies in the voxel world"}),"\n",(0,t.jsxs)(n.li,{children:["Detects any interactions/collisions between ",(0,t.jsx)(n.code,{children:"InteractorComp"}),"s"]}),"\n"]}),"\n"]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"DataSavingSystem"}),' ("entities-saving")',"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsx)(n.li,{children:'1 dependency: "entities-meta"'}),"\n",(0,t.jsx)(n.li,{children:"Saves the entities' metadata that have been modified to the disk"}),"\n"]}),"\n"]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"EntitiesSendingSystem"}),' ("entities-sending")',"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsx)(n.li,{children:'1 dependency: "entities-meta"'}),"\n",(0,t.jsx)(n.li,{children:"Sends the entities' metadata that have been modified to the clients"}),"\n"]}),"\n"]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"PeersSendingSystem"}),' ("peers-sending")',"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsx)(n.li,{children:'1 dependency: "peers-meta"'}),"\n",(0,t.jsx)(n.li,{children:"Sends the peers' metadata that have been modified to the clients"}),"\n"]}),"\n"]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"BroadcastSystem"}),' ("broadcast")',"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsx)(n.li,{children:'2 dependencies: "peers-sending", "entities-sending"'}),"\n",(0,t.jsx)(n.li,{children:"All the above systems will queue up packets to be sent to the clients. This system will actually send the packets to the clients"}),"\n"]}),"\n"]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"CleanupSystem"}),' ("cleanup")',"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsx)(n.li,{children:'1 dependency: "peers-sending", "entities-sending"'}),"\n",(0,t.jsx)(n.li,{children:"Cleans up the ECS world by clearing the collisions and interactions that have been processed"}),"\n"]}),"\n"]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"EventsSystem"}),' ("events")',"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsx)(n.li,{children:'1 dependency: "broadcast"'}),"\n",(0,t.jsx)(n.li,{children:"Processes the events that have been queued by the clients by broadcasting them to the other clients that are interested"}),"\n"]}),"\n"]}),"\n"]})]})}function o(e={}){const{wrapper:n}={...(0,i.a)(),...e.components};return n?(0,t.jsx)(n,{...e,children:(0,t.jsx)(a,{...e})}):a(e)}},1670:(e,n,s)=>{s.d(n,{Z:()=>r,a:()=>h});var t=s(7378);const i={},c=t.createContext(i);function h(e){const n=t.useContext(c);return t.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function r(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:h(e.components),t.createElement(c.Provider,{value:n},e.children)}}}]);