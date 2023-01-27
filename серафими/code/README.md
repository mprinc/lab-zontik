# Run

```sh
TS_NODE_PROJECT=./tsconfig.json node  --trace-warnings --experimental-specifier-resolution=node --loader $COLABO/ts-esm-loader-with-tsconfig-paths.js index.ts
```

# TODO

додати прстене за вјешање слова, ...

# SVG

## `viewBox`

<svg>
https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/viewBox

```xml
<svg ... viewBox="472.1004591848899 97.4508912167372 853.5000000000001 690.5"
>
```

```xml
<svg ...
	viewBox="472.1004591848899 97.4508912167372 853.5000000000001 690.5">
	<sodipodi:namedview 
     inkscape:cx="370.97514"
     inkscape:cy="477.74564"
     inkscape:window-width="1440"
     inkscape:window-height="847"
     inkscape:window-x="0"
     inkscape:window-y="25"
>
```

```xml
<svg><g
     inkscape:groupmode="layer"
     id="layer8"
     inkscape:label="Слова"
     transform="translate(58.000029,44.985392)">
```

```xml
<svg><g transform="translate(58.000029,44.985392)">
    <g
       inkscape:groupmode="layer"
       id="layer22"
       inkscape:label="У">
      <path ... inkscape:label="У" />
    </g>
    <g
       inkscape:groupmode="layer"
       id="layer13"
       inkscape:label="Т"
       transform="translate(-58.00003,-44.985392)">
      <rect ... />
      <path ... />
      <rect ... />
    </g>
```

svg
+ viewBox
+ x: 472.1004591848899
+ y: 97.4508912167372

svg/sodipodi:namedview
+ inkscape:cx="370.97514"
+ inkscape:cy="477.74564"
+ inkscape:window-width="1440"
+ inkscape:window-height="847"
+ inkscape:window-x="0"
+ inkscape:window-y="25"
>

<svg><g transform="translate(58.000029,44.985392)">
+ X: 58.000029
+ Y: 44.985392

472 + 370 + 58

-472 + 58 + 898

У
+ from inkscape
	+ X: 449.244
	+ Y: 423.143
+ <path@d
	+ x: 898.27736
	+ y: 476.47471

472 + 370 + 58

-472 + 58 - 58 + 833
Т
+ from inkscape
	+ X: 349.317
	+ Y: 423.187
+ translate
	+ x: -58.0000
	+ y: -44.985392
+ <path@d
	+ x: 833.55097
	+ y: 523.60273
+ rect
	+ id="rect1086"
	+ x: 842.78589
	+ y: 512.99323
	+ from inkscape
		+ X: 349.317
		+ Y: 423.187
-472 - + 58 - 58 + 842

 = 472.1004591848899

svg/sodipodi:namedview
+ inkscape:cx="370.97514"
+ inkscape:window-width="1440"
+ inkscape:window-x="0"

svg/g/translate/x = 58.000029

Т/translate = -58

Т/rect/x: 842.78589
Т/rect/x(inkscape): 370.685

842 - 472
842 - (370 + 58 + 58)

g-test-container/translate/x: 30
test-container/test/rect/x: 492.10046
test-container/test/rect/x(inkscape): 50

svg/viewBox/x: 472.1004591848899

X formula for inkscape:
+ <g/translate/x> + <path/x> - <svg/viewBox/x>

test-container/test
+ <test-container/x> + <test/x>
+ 30 + 492.10046 - 472.1004591848899 = 50

+ <position> = <g-Слова/translate/x> + <g-Слово/translate/x> + <path/x> - <svg/viewBox/x>
+ 58.000029 + (-58.00003) + 842.78589 - 472.1004591848899 = 370.685

Поставити име на нулу:
+ <g-име/translate/x> = <position> + <svg/viewBox/x> - <g-Слова/translate/x>
