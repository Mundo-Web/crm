var $=Object.defineProperty;var u=(o,l,n)=>l in o?$(o,l,{enumerable:!0,configurable:!0,writable:!0,value:n}):o[l]=n;var f=(o,l,n)=>u(o,typeof l!="symbol"?l+"":l,n);import{B as m}from"./Adminto-MJzZ0wrP.js";class g extends m{constructor(){super(...arguments);f(this,"path","messages")}}const M=o=>{const l=o.split(`
`);let n="",s=!1,i="";const t=e=>(e=e.replace(/\*(.*?)\*/g,"<strong>$1</strong>"),e=e.replace(/_(.*?)_/g,"<em>$1</em>"),e=e.replace(/~(.*?)~/g,"<s>$1</s>"),e=e.replace(/```(.*?)```/g,"<code>$1</code>"),e);for(let e of l){if(e=e.trim(),!e){s&&(n+=`</${i}>
`,s=!1);continue}const c=e.match(/^-\s+(.+)$/);if(c){(!s||i!=="ul")&&(s&&(n+=`</${i}>
`),n+=`<ul>
`,s=!0,i="ul"),n+=`<li>${t(c[1])}</li>
`;continue}const a=e.match(/^\d+\.\s+(.+)$/);if(a){(!s||i!=="ol")&&(s&&(n+=`</${i}>
`),n+=`<ol>
`,s=!0,i="ol"),n+=`<li>${t(a[1])}</li>
`;continue}const r=e.match(/^>\s+(.+)$/);if(r){s&&(n+=`</${i}>
`,s=!1),n+=`<blockquote>${t(r[1])}</blockquote>
`;continue}s&&(n+=`</${i}>
`,s=!1),n+=`<p>${t(e)}</p>
`}return s&&(n+=`</${i}>
`),n.trim()};export{g as M,M as w};
