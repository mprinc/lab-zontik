// лејери су наопачке

export interface IPoint {
	x: number;
	y: number;
}

export interface IRect extends IPoint {
	width: number;
	height: number;
}

/**
 * Враћа `IPoint` репрезентацију предате СВГ трансформације
 * @param transform стринг који описује СВГ трансформацију СВГ објекта
 * @returns координате `transform` трансформације
 */
export const parseTranslate = (transform: string): IPoint => {
	const transformRegExp: RegExp = new RegExp("^\\s*translate\\s*\\((?<x>[-\\d\\.]+),\\s*(?<y>[-\\d\\.]+)\\)\\s*$");
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/match#using_match
	const transformMatches: RegExpMatchArray | null = transform.match(transformRegExp);
	let transformX: number, transformY: number;
	if (transformMatches) {
		if (transformMatches.groups) {
			transformX = parseFloat(transformMatches.groups.x);
			transformY = parseFloat(transformMatches.groups.y);
		}
		console.log(`transform: x=${transformX}, y=${transformY}`);
		return { x: transformX, y: transformY };
	} else {
		console.error(`failed to match transform`);
	}
};

/**
 * Пролази кроз лист свг објеката и враћа онога који одговоара траженом имену
 * @param свг лист свг објеката, углавном је то садржај `g` равни (групе)
 * @param лабела лабела СВГ објекта који тражимо
 * @returns нађена раван или недефинисано
 */
export const нађиПодРаванПоИмену = (свг: any[], лабела: string): any => {
	if(!свг) {
		console.error(`Грешка. СВГ није прослијеђен!`);
		return;
	}
	const подСвг: any = свг.find((node, index) => {
		const одговара: boolean = node?.[":@"]?.["@_inkscape:label"] == лабела;
		// console.log(`index: ${index}, одговара: ${одговара}, ${node?.[":@"]?.["@_inkscape:label"]}`);
		return одговара;
	});
	return подСвг;
}

export enum EПоклапање {
	ИДЕНТИЧНО = "EXACT",
	ПОЧИЊЕ_СА = "ПОЧИЊЕ_СА",
	ЗАВРШАВА_СА = "ЗАВРШАВА_СА",
};

/**
 * Брише под-раван (која одговара имену `лабела` равни свг
 * @param свг раван кроз коју тражимо
 * @param лабела лабела која одговара лабели под-равни коју бришемо
 * @param типПоклапања говори како се лабеле требају поклопити (идентично, почетак имена, ...)
 */
export const обришиПодЛејерПоИмену = (свг: any[], лабела: string, типПоклапања: EПоклапање = EПоклапање.ИДЕНТИЧНО): void => {
	if(!свг) {
		console.error(`Грешка. свг није прослијеђен!`);
		return;
	}
	let индексиПодРавни: number[] = [];
	свг.forEach((node, index) => {
		const label: string = (node?.[":@"]?.["@_inkscape:label"] as string);
		let одговара: boolean;
		if(типПоклапања === EПоклапање.ИДЕНТИЧНО) {
			одговара = label === лабела;
		}else if(типПоклапања === EПоклапање.ПОЧИЊЕ_СА) {
			одговара =  label.startsWith(лабела);
		}else if(типПоклапања === EПоклапање.ЗАВРШАВА_СА) {
			одговара =  label.endsWith(лабела);
		}
		// console.log(`index: ${index}, одговара: ${одговара}, ${node?.[":@"]?.["@_inkscape:label"]}`);
		if(одговара) {
			индексиПодРавни.push(index);
		}
	});

	if(индексиПодРавни.length > 0){
		// идемо изврнуто како се не би пореметили индекси док бришемо под равни
		for(let i = индексиПодРавни.length-1; i>=0; i--) {
			const индексПодЛејера = индексиПодРавни[i];
			console.log(`Бришем лабелу "${лабела}" на позицији: ${индексПодЛејера}`);
			свг.splice(индексПодЛејера, 1);		
		}
	}else{
		console.error(`Грешка. Не налазим лабелу "${лабела}".`);
		// console.error(`свг: ${JSON.stringify(свг, null, 4)}"`);
	}
}

