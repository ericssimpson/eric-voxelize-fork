"use strict";(self.webpackChunkdocs=self.webpackChunkdocs||[]).push([[8382],{6837:(e,r,s)=>{s.r(r),s.d(r,{assets:()=>d,contentTitle:()=>o,default:()=>a,frontMatter:()=>t,metadata:()=>i,toc:()=>c});var l=s(4246),n=s(1670);const t={id:"WorkerPool",title:"Class: WorkerPool",sidebar_label:"WorkerPool",sidebar_position:0,custom_edit_url:null},o=void 0,i={id:"client/classes/WorkerPool",title:"Class: WorkerPool",description:"A pool of web workers that can be used to execute jobs. The pool will create",source:"@site/docs/api/client/classes/WorkerPool.md",sourceDirName:"client/classes",slug:"/client/classes/WorkerPool",permalink:"/voxelize/api/client/classes/WorkerPool",draft:!1,unlisted:!1,editUrl:null,tags:[],version:"current",sidebarPosition:0,frontMatter:{id:"WorkerPool",title:"Class: WorkerPool",sidebar_label:"WorkerPool",sidebar_position:0,custom_edit_url:null},sidebar:"tutorialSidebar",previous:{title:"VoxelInteract",permalink:"/voxelize/api/client/classes/VoxelInteract"},next:{title:"World",permalink:"/voxelize/api/client/classes/World"}},d={},c=[{value:"Constructors",id:"constructors",level:2},{value:"constructor",id:"constructor",level:3},{value:"Parameters",id:"parameters",level:4},{value:"Returns",id:"returns",level:4},{value:"Properties",id:"properties",level:2},{value:"Proto",id:"proto",level:3},{value:"Type declaration",id:"type-declaration",level:4},{value:"Returns",id:"returns-1",level:5},{value:"WORKING_COUNT",id:"working_count",level:3},{value:"options",id:"options",level:3},{value:"queue",id:"queue",level:3},{value:"Accessors",id:"accessors",level:2},{value:"isBusy",id:"isbusy",level:3},{value:"Returns",id:"returns-2",level:4},{value:"workingCount",id:"workingcount",level:3},{value:"Returns",id:"returns-3",level:4},{value:"Methods",id:"methods",level:2},{value:"addJob",id:"addjob",level:3},{value:"Parameters",id:"parameters-1",level:4},{value:"Returns",id:"returns-4",level:4},{value:"postMessage",id:"postmessage",level:3},{value:"Parameters",id:"parameters-2",level:4},{value:"Returns",id:"returns-5",level:4}];function h(e){const r={a:"a",code:"code",h2:"h2",h3:"h3",h4:"h4",h5:"h5",hr:"hr",p:"p",strong:"strong",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",...(0,n.a)(),...e.components};return(0,l.jsxs)(l.Fragment,{children:[(0,l.jsx)(r.p,{children:"A pool of web workers that can be used to execute jobs. The pool will create\nworkers up to the maximum number of workers specified in the options.\nWhen a job is queued, the pool will find the first available worker and\nexecute the job. If no workers are available, the job will be queued until\na worker becomes available."}),"\n",(0,l.jsx)(r.h2,{id:"constructors",children:"Constructors"}),"\n",(0,l.jsx)(r.h3,{id:"constructor",children:"constructor"}),"\n",(0,l.jsxs)(r.p,{children:["\u2022 ",(0,l.jsx)(r.strong,{children:"new WorkerPool"}),"(",(0,l.jsx)(r.code,{children:"Proto"}),", ",(0,l.jsx)(r.code,{children:"options?"}),"): ",(0,l.jsx)(r.a,{href:"/voxelize/api/client/classes/WorkerPool",children:(0,l.jsx)(r.code,{children:"WorkerPool"})})]}),"\n",(0,l.jsx)(r.p,{children:"Create a new worker pool."}),"\n",(0,l.jsx)(r.h4,{id:"parameters",children:"Parameters"}),"\n",(0,l.jsxs)(r.table,{children:[(0,l.jsx)(r.thead,{children:(0,l.jsxs)(r.tr,{children:[(0,l.jsx)(r.th,{style:{textAlign:"left"},children:"Name"}),(0,l.jsx)(r.th,{style:{textAlign:"left"},children:"Type"}),(0,l.jsx)(r.th,{style:{textAlign:"left"},children:"Default value"}),(0,l.jsx)(r.th,{style:{textAlign:"left"},children:"Description"})]})}),(0,l.jsxs)(r.tbody,{children:[(0,l.jsxs)(r.tr,{children:[(0,l.jsx)(r.td,{style:{textAlign:"left"},children:(0,l.jsx)(r.code,{children:"Proto"})}),(0,l.jsxs)(r.td,{style:{textAlign:"left"},children:["() => ",(0,l.jsx)(r.code,{children:"Worker"})]}),(0,l.jsx)(r.td,{style:{textAlign:"left"},children:(0,l.jsx)(r.code,{children:"undefined"})}),(0,l.jsx)(r.td,{style:{textAlign:"left"},children:"The worker class to create."})]}),(0,l.jsxs)(r.tr,{children:[(0,l.jsx)(r.td,{style:{textAlign:"left"},children:(0,l.jsx)(r.code,{children:"options"})}),(0,l.jsx)(r.td,{style:{textAlign:"left"},children:(0,l.jsx)(r.a,{href:"/voxelize/api/client/modules#workerpooloptions",children:(0,l.jsx)(r.code,{children:"WorkerPoolOptions"})})}),(0,l.jsx)(r.td,{style:{textAlign:"left"},children:(0,l.jsx)(r.code,{children:"defaultOptions"})}),(0,l.jsx)(r.td,{style:{textAlign:"left"},children:"The options to create the worker pool."})]})]})]}),"\n",(0,l.jsx)(r.h4,{id:"returns",children:"Returns"}),"\n",(0,l.jsx)(r.p,{children:(0,l.jsx)(r.a,{href:"/voxelize/api/client/classes/WorkerPool",children:(0,l.jsx)(r.code,{children:"WorkerPool"})})}),"\n",(0,l.jsx)(r.h2,{id:"properties",children:"Properties"}),"\n",(0,l.jsx)(r.h3,{id:"proto",children:"Proto"}),"\n",(0,l.jsxs)(r.p,{children:["\u2022 ",(0,l.jsx)(r.strong,{children:"Proto"}),": () => ",(0,l.jsx)(r.code,{children:"Worker"})]}),"\n",(0,l.jsx)(r.h4,{id:"type-declaration",children:"Type declaration"}),"\n",(0,l.jsxs)(r.p,{children:["\u2022 ",(0,l.jsx)(r.strong,{children:"new Proto"}),"(): ",(0,l.jsx)(r.code,{children:"Worker"})]}),"\n",(0,l.jsx)(r.p,{children:"The worker class to create."}),"\n",(0,l.jsx)(r.h5,{id:"returns-1",children:"Returns"}),"\n",(0,l.jsx)(r.p,{children:(0,l.jsx)(r.code,{children:"Worker"})}),"\n",(0,l.jsx)(r.hr,{}),"\n",(0,l.jsx)(r.h3,{id:"working_count",children:"WORKING_COUNT"}),"\n",(0,l.jsxs)(r.p,{children:["\u25aa ",(0,l.jsx)(r.code,{children:"Static"})," ",(0,l.jsx)(r.strong,{children:"WORKING_COUNT"}),": ",(0,l.jsx)(r.code,{children:"number"})," = ",(0,l.jsx)(r.code,{children:"0"})]}),"\n",(0,l.jsx)(r.p,{children:"A static count of working web workers across all worker pools."}),"\n",(0,l.jsx)(r.hr,{}),"\n",(0,l.jsx)(r.h3,{id:"options",children:"options"}),"\n",(0,l.jsxs)(r.p,{children:["\u2022 ",(0,l.jsx)(r.strong,{children:"options"}),": ",(0,l.jsx)(r.a,{href:"/voxelize/api/client/modules#workerpooloptions",children:(0,l.jsx)(r.code,{children:"WorkerPoolOptions"})})," = ",(0,l.jsx)(r.code,{children:"defaultOptions"})]}),"\n",(0,l.jsx)(r.p,{children:"The options to create the worker pool."}),"\n",(0,l.jsx)(r.hr,{}),"\n",(0,l.jsx)(r.h3,{id:"queue",children:"queue"}),"\n",(0,l.jsxs)(r.p,{children:["\u2022 ",(0,l.jsx)(r.strong,{children:"queue"}),": ",(0,l.jsx)(r.a,{href:"/voxelize/api/client/modules#workerpooljob",children:(0,l.jsx)(r.code,{children:"WorkerPoolJob"})}),"[] = ",(0,l.jsx)(r.code,{children:"[]"})]}),"\n",(0,l.jsx)(r.p,{children:"The queue of jobs that are waiting to be executed."}),"\n",(0,l.jsx)(r.h2,{id:"accessors",children:"Accessors"}),"\n",(0,l.jsx)(r.h3,{id:"isbusy",children:"isBusy"}),"\n",(0,l.jsxs)(r.p,{children:["\u2022 ",(0,l.jsx)(r.code,{children:"get"})," ",(0,l.jsx)(r.strong,{children:"isBusy"}),"(): ",(0,l.jsx)(r.code,{children:"boolean"})]}),"\n",(0,l.jsx)(r.p,{children:"Whether or not are there no available workers."}),"\n",(0,l.jsx)(r.h4,{id:"returns-2",children:"Returns"}),"\n",(0,l.jsx)(r.p,{children:(0,l.jsx)(r.code,{children:"boolean"})}),"\n",(0,l.jsx)(r.hr,{}),"\n",(0,l.jsx)(r.h3,{id:"workingcount",children:"workingCount"}),"\n",(0,l.jsxs)(r.p,{children:["\u2022 ",(0,l.jsx)(r.code,{children:"get"})," ",(0,l.jsx)(r.strong,{children:"workingCount"}),"(): ",(0,l.jsx)(r.code,{children:"number"})]}),"\n",(0,l.jsx)(r.p,{children:"The number of workers that are simultaneously working."}),"\n",(0,l.jsx)(r.h4,{id:"returns-3",children:"Returns"}),"\n",(0,l.jsx)(r.p,{children:(0,l.jsx)(r.code,{children:"number"})}),"\n",(0,l.jsx)(r.h2,{id:"methods",children:"Methods"}),"\n",(0,l.jsx)(r.h3,{id:"addjob",children:"addJob"}),"\n",(0,l.jsxs)(r.p,{children:["\u25b8 ",(0,l.jsx)(r.strong,{children:"addJob"}),"(",(0,l.jsx)(r.code,{children:"job"}),"): ",(0,l.jsx)(r.code,{children:"void"})]}),"\n",(0,l.jsx)(r.p,{children:"Append a new job to be executed by a worker."}),"\n",(0,l.jsx)(r.h4,{id:"parameters-1",children:"Parameters"}),"\n",(0,l.jsxs)(r.table,{children:[(0,l.jsx)(r.thead,{children:(0,l.jsxs)(r.tr,{children:[(0,l.jsx)(r.th,{style:{textAlign:"left"},children:"Name"}),(0,l.jsx)(r.th,{style:{textAlign:"left"},children:"Type"}),(0,l.jsx)(r.th,{style:{textAlign:"left"},children:"Description"})]})}),(0,l.jsx)(r.tbody,{children:(0,l.jsxs)(r.tr,{children:[(0,l.jsx)(r.td,{style:{textAlign:"left"},children:(0,l.jsx)(r.code,{children:"job"})}),(0,l.jsx)(r.td,{style:{textAlign:"left"},children:(0,l.jsx)(r.a,{href:"/voxelize/api/client/modules#workerpooljob",children:(0,l.jsx)(r.code,{children:"WorkerPoolJob"})})}),(0,l.jsx)(r.td,{style:{textAlign:"left"},children:"The job to queue."})]})})]}),"\n",(0,l.jsx)(r.h4,{id:"returns-4",children:"Returns"}),"\n",(0,l.jsx)(r.p,{children:(0,l.jsx)(r.code,{children:"void"})}),"\n",(0,l.jsx)(r.hr,{}),"\n",(0,l.jsx)(r.h3,{id:"postmessage",children:"postMessage"}),"\n",(0,l.jsxs)(r.p,{children:["\u25b8 ",(0,l.jsx)(r.strong,{children:"postMessage"}),"(",(0,l.jsx)(r.code,{children:"message"}),", ",(0,l.jsx)(r.code,{children:"buffers?"}),"): ",(0,l.jsx)(r.code,{children:"void"})]}),"\n",(0,l.jsx)(r.h4,{id:"parameters-2",children:"Parameters"}),"\n",(0,l.jsxs)(r.table,{children:[(0,l.jsx)(r.thead,{children:(0,l.jsxs)(r.tr,{children:[(0,l.jsx)(r.th,{style:{textAlign:"left"},children:"Name"}),(0,l.jsx)(r.th,{style:{textAlign:"left"},children:"Type"})]})}),(0,l.jsxs)(r.tbody,{children:[(0,l.jsxs)(r.tr,{children:[(0,l.jsx)(r.td,{style:{textAlign:"left"},children:(0,l.jsx)(r.code,{children:"message"})}),(0,l.jsx)(r.td,{style:{textAlign:"left"},children:(0,l.jsx)(r.code,{children:"any"})})]}),(0,l.jsxs)(r.tr,{children:[(0,l.jsx)(r.td,{style:{textAlign:"left"},children:(0,l.jsx)(r.code,{children:"buffers?"})}),(0,l.jsxs)(r.td,{style:{textAlign:"left"},children:[(0,l.jsx)(r.code,{children:"ArrayBufferLike"}),"[]"]})]})]})]}),"\n",(0,l.jsx)(r.h4,{id:"returns-5",children:"Returns"}),"\n",(0,l.jsx)(r.p,{children:(0,l.jsx)(r.code,{children:"void"})})]})}function a(e={}){const{wrapper:r}={...(0,n.a)(),...e.components};return r?(0,l.jsx)(r,{...e,children:(0,l.jsx)(h,{...e})}):h(e)}},1670:(e,r,s)=>{s.d(r,{Z:()=>i,a:()=>o});var l=s(7378);const n={},t=l.createContext(n);function o(e){const r=l.useContext(t);return l.useMemo((function(){return"function"==typeof e?e(r):{...r,...e}}),[r,e])}function i(e){let r;return r=e.disableParentContext?"function"==typeof e.components?e.components(n):e.components||n:o(e.components),l.createElement(t.Provider,{value:r},e.children)}}}]);