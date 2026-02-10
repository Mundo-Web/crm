const a=f=>{const r=f.split(`
`);let l="",e=!1,i="";const o=n=>(n=n.replace(/\*(.*?)\*/g,"<strong>$1</strong>"),n=n.replace(/_(.*?)_/g,"<em>$1</em>"),n=n.replace(/~(.*?)~/g,"<s>$1</s>"),n=n.replace(/```(.*?)```/g,"<code>$1</code>"),n);for(let n of r){if(n=n.trim(),!n){e&&(l+=`</${i}>
`,e=!1);continue}const c=n.match(/^-\s+(.+)$/);if(c){(!e||i!=="ul")&&(e&&(l+=`</${i}>
`),l+=`<ul>
`,e=!0,i="ul"),l+=`<li>${o(c[1])}</li>
`;continue}const s=n.match(/^\d+\.\s+(.+)$/);if(s){(!e||i!=="ol")&&(e&&(l+=`</${i}>
`),l+=`<ol>
`,e=!0,i="ol"),l+=`<li>${o(s[1])}</li>
`;continue}const t=n.match(/^>\s+(.+)$/);if(t){e&&(l+=`</${i}>
`,e=!1),l+=`<blockquote>${o(t[1])}</blockquote>
`;continue}e&&(l+=`</${i}>
`,e=!1),l+=`<p>${o(n)}</p>
`}return e&&(l+=`</${i}>
`),l.trim()};export{a as w};
