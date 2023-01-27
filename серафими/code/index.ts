import {IPoint, parseTranslate, обришиПодЛејерПоИмену} from "./свг-алати";
import {додајСадржитељИмена, додајСлово, нађиСвгСлово, позиционирајИме, учитајСвгФајл, процесирајСлова, saveSVG, додајИме} from "./слова-алати";

import { ISlovo, IСлова, IИме, EШтаДодатиОдСловаУФајл } from "./слова-типови";

const словаXmlпутања = "../2022 - ЦРКВЕНА СЛОВА.svg";
const именаXmlпутања = "../2022 - ЦРКВЕНА СЛОВА-out.svg";

const словаИнфо: IСлова = {
	свг: {},
	слова: {
		помјерај: {},
		словаСвг: [],
		// slova: {},
	},
} as IСлова;

учитајСвгФајл(словаИнфо, словаXmlпутања);
процесирајСлова(словаИнфо);

import {имена} from "./инфо";

const имеПозиција: IPoint = {x: 0, y: 0};

console.log(`\n\nДодавање ${имена.length} имена: ${JSON.stringify(имена)}\n\n`);

for(let i=0; i<имена.length; i++) {
	const име: IИме = имена[i];
	име.свгСадржитељ = додајСадржитељИмена(словаИнфо, имеПозиција, име.текст);
	име.позиција = {
		x: 0,
		y: 0,
	};

	// додајИме(словаИнфо, име, EШтаДодатиОдСловаУФајл.ДОДАЈ_СЛОВО);
	додајИме(словаИнфо, име, EШтаДодатиОдСловаУФајл.ДОДАЈ_ЛИНИЈЕ);
	имеПозиција.y += 130;
}

// бришемо раван `Слова` јер нам више не треба у излазном свг фајлу, а визуелно нам смета
обришиПодЛејерПоИмену((словаИнфо.xmlСаСловима?.[1]?.["svg"] as Array<any>), "Слова");
// сачувај додата имена у новом излазном фајлу
saveSVG(словаИнфо.xmlСаСловима, именаXmlпутања);

/*
// OLD - DEMO

const letterB = нађиСлово(словаИнфо, "Б");
letterB[":@"]["@_x"] = 30;
letterB[":@"]["@_y"] = 0;
letterB[":@"]["@_transform"] = "translate(15, 15)";
console.log(`Б: ${JSON.stringify(letterB)}`);

словаИнфо.slova.slovaXml.forEach((slovo, index) => {
	let transform: string = slovo[":@"]["@_transform"];
	const label: string = slovo[":@"]?.["@_inkscape:label"];
	console.log(`[${index}]. слово: ${label}`);
	let dX: number = 0,
		dY: number = 0;
	if (index % 2 == 0) {
		dY = 15;
	} else {
		dY = -15;
	}
	if (slovo?.[":@"]) {
		console.log(`moving слово ${label}`);
		if (transform) {
			console.log(`ups already has transform :"${transform}"`);
			transform;

			const transformP: IPoint = parseTranslate(transform);
			dX += transformP.x;
			dY += transformP.y;
		}
		transform = `translate(${dX}, ${dY})`;
		console.log(`setting transform to: "${transform}"`);
		slovo[":@"]["@_transform"] = transform;
	}
});
*/