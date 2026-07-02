import { WhostyleCore } from './src/js/whostyle-core.js';

const html1 = `This is some text \\{ws1:tPXGAKCm9fXwGhouAFXM3d3dzMzMGhou9fXwZqr.MzNEVVVm}`;
const html2 = `This is some text {ws1:tPXGAKCm9fXwGhouAFXM3d3dzMzMGhou9fXwZqr.MzNEVVVm}`;

console.log("HTML1 extraction: ", WhostyleCore.extract(html1));
console.log("HTML2 extraction: ", WhostyleCore.extract(html2));
console.log("HTML1 clean: ", WhostyleCore.clean(html1));
console.log("HTML2 clean: ", WhostyleCore.clean(html2));
