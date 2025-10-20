const f=s=>{const c=s.split(`
`);let n="",e=!1,o="";const i=l=>(l=l.replace(/\*(.*?)\*/g,"<strong>$1</strong>"),l=l.replace(/_(.*?)_/g,"<em>$1</em>"),l=l.replace(/~(.*?)~/g,"<s>$1</s>"),l=l.replace(/```(.*?)```/g,"<code>$1</code>"),l);for(let l of c){if(l=l.trim(),!l){e&&(n+=`</${o}>
`,e=!1);continue}const t=l.match(/^-\s+(.+)$/);if(t){(!e||o!=="ul")&&(e&&(n+=`</${o}>
`),n+=`<ul>
`,e=!0,o="ul"),n+=`<li>${i(t[1])}</li>
`;continue}const r=l.match(/^\d+\.\s+(.+)$/);if(r){(!e||o!=="ol")&&(e&&(n+=`</${o}>
`),n+=`<ol>
`,e=!0,o="ol"),n+=`<li>${i(r[1])}</li>
`;continue}const a=l.match(/^>\s+(.+)$/);if(a){e&&(n+=`</${o}>
`,e=!1),n+=`<blockquote>${i(a[1])}</blockquote>
`;continue}e&&(n+=`</${o}>
`,e=!1),n+=`<p>${i(l)}</p>
`}return e&&(n+=`</${o}>
`),n.trim()},u=(s=[],c)=>{const n=[];return s.forEach((e,o)=>{o==0?n.push(e):n.push(c,e)}),n};export{u as A,f as w};
