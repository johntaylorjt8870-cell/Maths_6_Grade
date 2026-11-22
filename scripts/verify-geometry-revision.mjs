import assert from "node:assert/strict";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import ts from "typescript";
import { chromium } from "@playwright/test";
import bundledChromium from "@sparticuz/chromium";

const source = await readFile("src/components/lesson/interactive/UnitOneGeometry.ts", "utf8");
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022 } }).outputText;
const g = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);
const distance = ([a,b], p) => Math.abs((b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0])) / Math.hypot(b[0]-a[0], b[1]-a[1]);
for (const [lines,points] of [[g.PERP_CASE_LINES,g.PERP_CASE_POINTS],[g.PARALLEL_CASE_LINES,g.PARALLEL_CASE_POINTS]]) {
  assert.ok(distance(lines[0],points[0]) < 1e-10, "② must be incident");
  assert.ok(distance(lines[1],points[1]) > 30, "① must remain external as on p.23");
}
for (const [name, pair] of Object.entries({ M:["AB","RP"], N:["AR","BP"], O:["AP","BR"] })) {
  const p = g.ABRP_INTERSECTIONS[name];
  for (const line of pair) {
    assert.ok(distance(g.ABRP_LINES[line],p) < 1e-10);
    const [a,b]=g.ABRP_EXTENTS[line];
    assert.ok(distance([a,b],p) < 1e-10);
    assert.ok(p[0]>=Math.min(a[0],b[0])-1e-10 && p[0]<=Math.max(a[0],b[0])+1e-10);
    assert.ok(p[1]>=Math.min(a[1],b[1])-1e-10 && p[1]<=Math.max(a[1],b[1])+1e-10);
  }
}
const folder="test-results/geometry-revision";
await mkdir(folder,{recursive:true});
const browser = await chromium.launch({executablePath:await bundledChromium.executablePath(),args:bundledChromium.args.filter(x=>x!=="--single-process")});
const page = await browser.newPage();
const errors=[];
page.on("pageerror",e=>errors.push(e.message));
page.on("console",m=>{if(m.type()==="error") errors.push(m.text());});
const figures=[[5,"u1-abrp"],[6,"u1-perp-cases"],[6,"u1-parallel-cases"]];
try {
  for(const width of [1440,390,360]) {
    await page.setViewportSize({width,height:1000});
    for(const [lesson,id] of figures) {
      await page.goto(`http://127.0.0.1:4000/Maths_6_Grade/lessons/lesson-1-${lesson}/#practice`,{waitUntil:"networkidle"});
      const figure=page.locator(`#practice [data-figure="${id}"]`);
      await figure.scrollIntoViewIfNeeded();
      assert.ok(await figure.isVisible());
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth+1));
      if(id==="u1-abrp") {
        assert.equal(await figure.locator('[data-line]').count(),6);
        assert.equal(await figure.locator('[data-point]').count(),7);
        assert.match(await figure.innerText(),/إثراء — من إعداد المنصة/);
      } else {
        const readings=await figure.locator('svg[role="img"]').evaluate(svg=>({
          lines:[...svg.querySelectorAll('line')].map(l=>[[+l.getAttribute('x1'),+l.getAttribute('y1')],[+l.getAttribute('x2'),+l.getAttribute('y2')]]),
          points:[...svg.querySelectorAll('circle')].map(c=>[+c.getAttribute('cx'),+c.getAttribute('cy')]),
          labels:[...svg.querySelectorAll('text')].map(t=>t.textContent),
        }));
        assert.ok(distance(readings.lines[0],readings.points[0])<1e-10);
        assert.ok(distance(readings.lines[1],readings.points[1])>30);
        assert.ok(readings.labels.includes('①') && readings.labels.includes('②'));
      }
      // Every SVG text label must lie fully inside its own viewBox.
      const clipped=await figure.locator('svg[role="img"]').evaluateAll(svgs=>svgs.flatMap(svg=>[...svg.querySelectorAll('text')].filter(t=>{const r=t.getBBox(), v=svg.viewBox.baseVal;return r.x<v.x||r.y<v.y||r.x+r.width>v.x+v.width||r.y+r.height>v.y+v.height;}).map(t=>t.textContent)));
      assert.deepEqual(clipped,[]);
      await figure.screenshot({path:`${folder}/${id}-${width}.png`});
    }
  }
  for(const lesson of [5,6]) {
    await page.setViewportSize({width:1440,height:1000});
    await page.goto(`http://127.0.0.1:4000/Maths_6_Grade/lessons/lesson-1-${lesson}/#notebook`,{waitUntil:"networkidle"});
    await page.evaluate(()=>document.fonts.ready);
    await page.pdf({path:`test-results/unit-1/lesson-${lesson}-notebook.pdf`,preferCSSPageSize:true,printBackground:true});
  }
  assert.deepEqual(errors,[]);
  const report={caseIncidence:"② incident, ① external",intersections:g.ABRP_INTERSECTIONS,viewports:[1440,390,360],clippedLabels:[],consoleErrors:errors,pdfs:[5,6]};
  await writeFile(`${folder}/results.json`,JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
} finally { await browser.close(); }
