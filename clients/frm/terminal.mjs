// Branding belongs on the human terminal, never in machine-readable responses.
export const BOOM_TAGLINE='your doomscrolling time isn’t valuable. your boomscrolling time is.';
export function boomMasthead({color=false}={}) {
 const paint=(code,text)=>color?`\u001b[${code}m${text}\u001b[0m`:text;
 return `${paint('2;31','DOOM')} ${paint('2','──▶')} ${paint('1;36','BOOM')}\n${BOOM_TAGLINE}`;
}
export function terminalBrand(stream=process.stderr,{json=false,env=process.env}={}) {
 if(json||!stream.isTTY)return;
 stream.write(boomMasthead({color:!Object.hasOwn(env,'NO_COLOR')})+'\n\n');
}
