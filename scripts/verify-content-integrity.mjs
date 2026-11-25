#!/usr/bin/env node
/**
 * فاحص تكامل محتوى الدروس — منصة «الرياضيات الممتعة» (الصف السادس، المنهاج السوري).
 *
 * يتحقق آليًا من سلامة العلاقات والبيانات عبر سجل المنهاج وملفات الدروس والمراحل التسع
 * والاختبارات وتمارين الكتاب والرسومات والأنشطة والروابط الداخلية ومراجع المكونات،
 * وفق معيار الدروس المعتمد (`docs/lesson-standard.md`).
 *
 * التشغيل:
 *   node scripts/verify-content-integrity.mjs
 *   node scripts/verify-content-integrity.mjs --root <path>
 *   node scripts/verify-content-integrity.mjs --json
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";
import katex from "katex";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_ROOT = path.resolve(__dirname, "..");

/** الترتيب المعتمد للمراحل التسع وفق docs/lesson-standard.md و src/content/lesson-stages.ts. */
export const CANONICAL_STAGE_IDS = [
  "taheya",
  "discovery",
  "learn",
  "lab",
  "check",
  "practice",
  "quiz",
  "summary",
  "notebook",
];

/** المراحل الممثّلة كأقسام داخل `content.sections` بالترتيب المعتمد. */
export const CANONICAL_SECTION_STAGE_IDS = CANONICAL_STAGE_IDS.filter(
  (id) => id !== "quiz" && id !== "notebook",
);

/**
 * استثناء موثّق في docs/lesson-standard.md (القسم 5 البند 7 والقسم 13):
 * الدرس `lesson-1-1` نُشر قبل إقرار إلزامية حقل `hint` الصريح في أسئلة الاختبار،
 * ويعتمد على `explanation` ودالة `hintFor` الاحتياطية في `LocalQuiz.tsx`.
 * هذا الاستثناء محصور في `quiz.questions[].hint` لهذا الدرس فقط ولا يسري على أي درس آخر.
 */
export const DOCUMENTED_QUIZ_HINT_EXEMPTIONS = new Set(["lesson-1-1"]);

const MIN_QUIZ_QUESTIONS = 6;
const MIN_QUIZ_CHOICES = 2;
const VALID_SOURCES = new Set(["book", "extra"]);
const VALID_BLOCK_TYPES = new Set([
  "text",
  "formula",
  "example",
  "table",
  "figure",
  "activity",
  "exercise",
  "bookPractice",
  "summary",
]);
const FORBIDDEN_NOTEBOOK_BLOCK_TYPES = new Set(["activity", "exercise", "bookPractice"]);
const RESERVED_LESSON_IDS = new Set(["_"]);
const VALID_SLUG_RE = /^[a-z0-9-]+$/;
const VALID_PAGE_RANGE_RE = /^(\d+)(?:-(\d+))?$/;
const VALID_HEX_COLOR_RE = /^#[0-9a-fA-F]{3,8}$/;
const HINT_LEAK_RE = /الإجابة الصحيحة|الجواب الصحيح|الخيار الصحيح|الاختيار الصحيح/;

const CORE_FILES = [
  "src/content/curriculum.ts",
  "src/content/lesson-stages.ts",
  "src/content/types.ts",
  "src/lib/site.ts",
  "src/components/lesson/interactive/registry.tsx",
  "src/components/lesson/interactive/BookPracticeActivity.tsx",
  "src/components/lesson/interactive/GeometryBookPractice.tsx",
  "src/components/lesson/interactive/ParallelBookPractice.tsx",
  "src/components/lesson/interactive/datasets.ts",
  "src/components/lesson/LessonSteps.tsx",
  "src/components/lesson/LessonContent.tsx",
  "src/components/lesson/LocalQuiz.tsx",
];

/* ─────────────────────────── أدوات مساعدة عامة ─────────────────────────── */

function toPosix(filePath) {
  return filePath.split(path.sep).join("/");
}

function relPath(rootDir, absPath) {
  return toPosix(path.relative(rootDir, absPath));
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeAnswer(value) {
  return String(value)
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[،,\s]/g, "")
    .trim();
}

function normalizeComparableText(value) {
  return String(value)
    .replace(/\s+/g, " ")
    .replace(/[.,،؛:!؟?()[\]{}"'«»]/g, "")
    .trim();
}

function parseTsFile(absPath) {
  const sourceText = fs.readFileSync(absPath, "utf8");
  const scriptKind = absPath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  return ts.createSourceFile(absPath, sourceText, ts.ScriptTarget.Latest, true, scriptKind);
}

function lineAt(sourceFile, node) {
  const pos = node.getStart(sourceFile);
  return sourceFile.getLineAndCharacterOfPosition(pos).line + 1;
}

/**
 * يحل مسار استيراد محلي (`./...` أو `../...` أو `@/...`) إلى ملف فعلي على القرص.
 */
function resolveLocalModuleFile(fromAbsPath, specifier, rootDir) {
  let candidateBase = null;
  if (specifier.startsWith("@/")) {
    candidateBase = path.join(rootDir, "src", specifier.slice(2));
  } else if (specifier.startsWith(".")) {
    candidateBase = path.resolve(path.dirname(fromAbsPath), specifier);
  } else {
    return null;
  }

  const candidates = [
    candidateBase,
    `${candidateBase}.ts`,
    `${candidateBase}.tsx`,
    `${candidateBase}.mjs`,
    `${candidateBase}.js`,
    path.join(candidateBase, "index.ts"),
    path.join(candidateBase, "index.tsx"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return null;
}

function getPropertyNameText(propName) {
  if (!propName) return null;
  if (ts.isIdentifier(propName) || ts.isStringLiteral(propName) || ts.isNumericLiteral(propName)) {
    return propName.text;
  }
  return null;
}

function isTypeOnlyImport(importDecl) {
  const clause = importDecl.importClause;
  if (!clause) return false;
  if (clause.isTypeOnly) return true;
  if (
    !clause.name &&
    clause.namedBindings &&
    ts.isNamedImports(clause.namedBindings) &&
    clause.namedBindings.elements.length > 0 &&
    clause.namedBindings.elements.every((el) => el.isTypeOnly)
  ) {
    return true;
  }
  return false;
}

/* ─────────────────────────── استخراج البيانات عبر AST ─────────────────────────── */

/**
 * يستخرج خريطة الاستيرادات في ملف TS/TSX: اسم الرمز المستورد ← المسار المطلق للملف الهدف.
 */
function collectImportMap(sourceFile, absPath, rootDir) {
  const map = new Map();
  for (const stmt of sourceFile.statements) {
    if (!ts.isImportDeclaration(stmt) || !ts.isStringLiteral(stmt.moduleSpecifier)) continue;
    if (isTypeOnlyImport(stmt)) continue;
    const specifier = stmt.moduleSpecifier.text;
    const resolved = resolveLocalModuleFile(absPath, specifier, rootDir);
    const clause = stmt.importClause;
    if (!clause) continue;
    if (clause.name) {
      map.set(clause.name.text, { specifier, resolved, line: lineAt(sourceFile, stmt) });
    }
    if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
      for (const el of clause.namedBindings.elements) {
        if (el.isTypeOnly) continue;
        map.set(el.name.text, {
          specifier,
          resolved,
          importedName: el.propertyName ? el.propertyName.text : el.name.text,
          line: lineAt(sourceFile, stmt),
        });
      }
    }
  }
  return map;
}

/**
 * يستخرج مفاتيح كائن سجل (`FIGURE_REGISTRY` / `ACTIVITY_REGISTRY` / `EXERCISE_REGISTRY`)
 * مع تتبّع تعابير التفريغ `...SPREAD` تلقائيًا إلى ملفاتها المصدرية (مثل `UNIT_ONE_FIGURES`
 * أو أي سجل وحدة مستقبلية)، واكتشاف التكرار أو التصادم في المفاتيح.
 */
function extractRegistryEntries(absPath, exportName, rootDir, addError, visited = new Set()) {
  const visitKey = `${absPath}::${exportName}`;
  const entries = new Map();
  if (visited.has(visitKey)) return entries;
  visited.add(visitKey);

  if (!fs.existsSync(absPath)) {
    addError({
      code: "REGISTRY_FILE_MISSING",
      category: "registries",
      lessonId: null,
      file: relPath(rootDir, absPath),
      location: exportName,
      message: `ملف السجل غير موجود لاستخراج ${exportName}.`,
    });
    return entries;
  }

  const sf = parseTsFile(absPath);
  const imports = collectImportMap(sf, absPath, rootDir);
  const fileRel = relPath(rootDir, absPath);
  let targetInitializer = null;

  function findDeclaration(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === exportName &&
      node.initializer
    ) {
      let expr = node.initializer;
      while (ts.isAsExpression(expr) || ts.isSatisfiesExpression(expr) || ts.isParenthesizedExpression(expr)) {
        expr = expr.expression;
      }
      if (ts.isObjectLiteralExpression(expr)) {
        targetInitializer = expr;
      }
    }
    if (!targetInitializer) ts.forEachChild(node, findDeclaration);
  }
  findDeclaration(sf);

  if (!targetInitializer) {
    addError({
      code: "REGISTRY_EXPORT_MISSING",
      category: "registries",
      lessonId: null,
      file: fileRel,
      location: exportName,
      message: `لم يُعثر على تعريف الكائن المصدّر «${exportName}» في ${fileRel}.`,
    });
    return entries;
  }

  for (const prop of targetInitializer.properties) {
    if (ts.isSpreadAssignment(prop) && ts.isIdentifier(prop.expression)) {
      const spreadName = prop.expression.text;
      const imported = imports.get(spreadName);
      if (imported) {
        if (!imported.resolved) {
          addError({
            code: "REGISTRY_BROKEN_IMPORT",
            category: "registries",
            lessonId: null,
            file: fileRel,
            location: `line ${imported.line} (...${spreadName})`,
            message: `السجل «${exportName}» يستورد «${spreadName}» من مسار غير موجود: ${imported.specifier}.`,
          });
          continue;
        }
        const nested = extractRegistryEntries(
          imported.resolved,
          imported.importedName ?? spreadName,
          rootDir,
          addError,
          visited,
        );
        for (const [key, meta] of nested) {
          if (entries.has(key)) {
            const prev = entries.get(key);
            addError({
              code: "REGISTRY_KEY_DUPLICATE",
              category: "ids",
              lessonId: null,
              file: fileRel,
              location: `${exportName}["${key}"] (line ${lineAt(sf, prop)})`,
              message: `تكرار/تضارب المفتاح «${key}» داخل ${exportName} بين ${prev.file}:${prev.line} و${meta.file}:${meta.line}.`,
            });
          } else {
            entries.set(key, meta);
          }
        }
      } else {
        // كائن معرّف محليًا داخل نفس الملف
        const nested = extractRegistryEntries(absPath, spreadName, rootDir, addError, visited);
        for (const [key, meta] of nested) {
          if (entries.has(key)) {
            const prev = entries.get(key);
            addError({
              code: "REGISTRY_KEY_DUPLICATE",
              category: "ids",
              lessonId: null,
              file: fileRel,
              location: `${exportName}["${key}"] (line ${lineAt(sf, prop)})`,
              message: `تكرار المفتاح «${key}» داخل ${exportName} بين ${prev.file}:${prev.line} و${meta.file}:${meta.line}.`,
            });
          } else {
            entries.set(key, meta);
          }
        }
      }
      continue;
    }

    if (ts.isPropertyAssignment(prop) || ts.isShorthandPropertyAssignment(prop)) {
      const key = getPropertyNameText(prop.name);
      if (!key) continue;
      const line = lineAt(sf, prop);
      if (entries.has(key)) {
        const prev = entries.get(key);
        addError({
          code: "REGISTRY_KEY_DUPLICATE",
          category: "ids",
          lessonId: null,
          file: fileRel,
          location: `${exportName}["${key}"] (line ${line})`,
          message: `تكرار المفتاح «${key}» في السجل ${exportName} (سُجّل سابقًا في ${prev.file}:${prev.line}).`,
        });
      } else {
        entries.set(key, { file: fileRel, line });
      }
    }
  }

  return entries;
}

/**
 * يستخرج القيم النصية المسموحة لخاصية اتحاد (union of string literals) داخل واجهة في `types.ts`.
 */
function extractInterfaceStringUnion(typesAbsPath, interfaceName, propertyName) {
  const sf = parseTsFile(typesAbsPath);
  const values = new Set();

  function collectStrings(typeNode) {
    if (!typeNode) return;
    if (ts.isLiteralTypeNode(typeNode) && ts.isStringLiteral(typeNode.literal)) {
      values.add(typeNode.literal.text);
    } else if (ts.isUnionTypeNode(typeNode)) {
      for (const member of typeNode.types) collectStrings(member);
    } else if (ts.isParenthesizedTypeNode(typeNode)) {
      collectStrings(typeNode.type);
    }
  }

  function visit(node) {
    if (ts.isInterfaceDeclaration(node) && node.name.text === interfaceName) {
      for (const member of node.members) {
        if (ts.isPropertySignature(member) && getPropertyNameText(member.name) === propertyName) {
          collectStrings(member.type);
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
  return values;
}

/**
 * يستخرج كل القيم النصية التي يُقارَن بها معرّف (مثل `id === "rspm"` أو `task.validator === "sixDigitPuzzle"`).
 */
function extractComparedStringLiterals(absPath, targetText) {
  const sf = parseTsFile(absPath);
  const values = new Set();

  function visit(node) {
    if (
      ts.isBinaryExpression(node) &&
      (node.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken ||
        node.operatorToken.kind === ts.SyntaxKind.EqualsEqualsToken)
    ) {
      const leftText = node.left.getText(sf).trim();
      const rightText = node.right.getText(sf).trim();
      if (leftText === targetText && ts.isStringLiteral(node.right)) {
        values.add(node.right.text);
      } else if (rightText === targetText && ts.isStringLiteral(node.left)) {
        values.add(node.left.text);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
  return values;
}

/**
 * يستخرج مراجع مجموعات البيانات (`datasetId` و `PLOT_DATASETS.<key>`) من `registry.tsx`.
 */
function extractRegistryDatasetRefs(registryAbsPath, rootDir) {
  const sf = parseTsFile(registryAbsPath);
  const fileRel = relPath(rootDir, registryAbsPath);
  const refs = [];

  function visit(node) {
    if (
      ts.isJsxAttribute(node) &&
      node.name.getText(sf) === "datasetId" &&
      node.initializer &&
      ts.isStringLiteral(node.initializer)
    ) {
      refs.push({
        kind: "datasetId",
        key: node.initializer.text,
        file: fileRel,
        line: lineAt(sf, node),
      });
    }
    if (
      ts.isPropertyAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "PLOT_DATASETS"
    ) {
      refs.push({
        kind: "PLOT_DATASETS",
        key: node.name.text,
        file: fileRel,
        line: lineAt(sf, node),
      });
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
  return refs;
}

/**
 * يستخرج استيرادات وربط الدروس في `src/content/curriculum.ts` قبل تشغيله،
 * ليكشف ملفات الدروس المفقودة أو المستوردة خطأً برسالة واضحة دون انهيار.
 */
function inspectCurriculumAst(curriculumAbsPath, rootDir, addError) {
  const sf = parseTsFile(curriculumAbsPath);
  const fileRel = relPath(rootDir, curriculumAbsPath);
  const identifierToFile = new Map();
  const importedFiles = new Set();
  let hasBrokenImports = false;

  for (const stmt of sf.statements) {
    if (!ts.isImportDeclaration(stmt) || !ts.isStringLiteral(stmt.moduleSpecifier)) continue;
    if (isTypeOnlyImport(stmt)) continue;

    const specifier = stmt.moduleSpecifier.text;
    if (!specifier.startsWith(".") && !specifier.startsWith("@/")) continue;

    const line = lineAt(sf, stmt);
    const resolved = resolveLocalModuleFile(curriculumAbsPath, specifier, rootDir);
    if (!resolved) {
      hasBrokenImports = true;
      const lessonMatch = specifier.match(/\/lessons\/(lesson-[a-z0-9-]+)(?:\.ts)?$/i);
      const inferredLessonId = lessonMatch ? lessonMatch[1] : null;
      const expectedRel = inferredLessonId
        ? `src/content/lessons/${inferredLessonId}.ts`
        : specifier;
      addError({
        code: inferredLessonId ? "PUBLISHED_LESSON_MISSING_FILE" : "CURRICULUM_BROKEN_IMPORT",
        category: "curriculum-files",
        lessonId: inferredLessonId,
        file: fileRel,
        location: `line ${line} (import "${specifier}")`,
        message: inferredLessonId
          ? `ملف الدرس «${inferredLessonId}» مفقود: ${expectedRel} (مُستورد في ${fileRel} السطر ${line}).`
          : `استيراد مكسور في ${fileRel} السطر ${line}: الملف «${specifier}» غير موجود.`,
      });
      continue;
    }

    const resolvedRel = relPath(rootDir, resolved);
    importedFiles.add(resolvedRel);
    const clause = stmt.importClause;
    if (clause?.name) identifierToFile.set(clause.name.text, resolvedRel);
    if (clause?.namedBindings && ts.isNamedImports(clause.namedBindings)) {
      for (const el of clause.namedBindings.elements) {
        if (!el.isTypeOnly) identifierToFile.set(el.name.text, resolvedRel);
      }
    }
  }

  // خريطة ربط معرّف الدرس ← ملف المحتوى المستورد والسطر داخل curriculum.ts
  const lessonWiring = new Map();

  function inspectLessonObject(objNode) {
    let id = null;
    let status = null;
    let contentIdent = null;
    let hasInlineContent = false;
    for (const prop of objNode.properties) {
      if (!ts.isPropertyAssignment(prop)) continue;
      const name = getPropertyNameText(prop.name);
      if (name === "id" && ts.isStringLiteral(prop.initializer)) id = prop.initializer.text;
      if (name === "status" && ts.isStringLiteral(prop.initializer)) status = prop.initializer.text;
      if (name === "content") {
        if (ts.isIdentifier(prop.initializer)) contentIdent = prop.initializer.text;
        else hasInlineContent = true;
      }
    }
    if (id) {
      const existing = lessonWiring.get(id);
      if (!existing) {
        lessonWiring.set(id, {
          id,
          status,
          contentIdent,
          contentFile: contentIdent ? identifierToFile.get(contentIdent) ?? null : null,
          hasInlineContent,
          line: lineAt(sf, objNode),
        });
      }
    }
  }

  function visit(node) {
    if (ts.isObjectLiteralExpression(node)) {
      const propNames = new Set(
        node.properties
          .filter(ts.isPropertyAssignment)
          .map((p) => getPropertyNameText(p.name))
          .filter(Boolean),
      );
      if (propNames.has("id") && propNames.has("status") && propNames.has("title")) {
        inspectLessonObject(node);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);

  return { hasBrokenImports, importedFiles, identifierToFile, lessonWiring };
}

/**
 * يفحص وجود ملفات الدروس والمستوردات المحلية داخل مجلد `src/content/lessons` قبل التحويل،
 * ثم يحوّل ملفات TypeScript اللازمة إلى `.mjs` داخل مجلد مؤقت معزول ويستوردها.
 */
async function loadRuntimeModules(rootDir, addError) {
  const lessonsDirAbs = path.join(rootDir, "src/content/lessons");
  const lessonDirFiles = fs.existsSync(lessonsDirAbs)
    ? fs
        .readdirSync(lessonsDirAbs)
        .filter((name) => name.endsWith(".ts"))
        .sort()
        .map((name) => `src/content/lessons/${name}`)
    : [];

  const relFilesToCompile = [
    "src/lib/site.ts",
    "src/content/lesson-stages.ts",
    "src/content/curriculum.ts",
    "src/components/lesson/interactive/datasets.ts",
    ...lessonDirFiles,
  ].filter((rel) => fs.existsSync(path.join(rootDir, rel)));

  // تحقق مسبق من الاستيرادات المحلية داخل ملفات الدروس والمساعدات
  let hasLessonBrokenImports = false;
  for (const rel of lessonDirFiles) {
    const abs = path.join(rootDir, rel);
    const sf = parseTsFile(abs);
    for (const stmt of sf.statements) {
      if (!ts.isImportDeclaration(stmt) || !ts.isStringLiteral(stmt.moduleSpecifier)) continue;
      if (isTypeOnlyImport(stmt)) continue;
      const spec = stmt.moduleSpecifier.text;
      if (!spec.startsWith(".") && !spec.startsWith("@/")) continue;
      if (!resolveLocalModuleFile(abs, spec, rootDir)) {
        hasLessonBrokenImports = true;
        const lessonMatch = path.basename(rel).match(/^(lesson-[a-z0-9-]+)\.ts$/i);
        addError({
          code: "LESSON_BROKEN_IMPORT",
          category: "curriculum-files",
          lessonId: lessonMatch ? lessonMatch[1] : null,
          file: rel,
          location: `line ${lineAt(sf, stmt)} (import "${spec}")`,
          message: `استيراد مكسور داخل ${rel}: الملف «${spec}» غير موجود.`,
        });
      }
    }
  }
  if (hasLessonBrokenImports) {
    return { loaded: false, modules: {} };
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "maths6-integrity-"));
  try {
    const compiledRelSet = new Set(relFilesToCompile);

    for (const rel of relFilesToCompile) {
      const abs = path.join(rootDir, rel);
      const src = fs.readFileSync(abs, "utf8");
      const transpiled = ts.transpileModule(src, {
        compilerOptions: {
          module: ts.ModuleKind.ES2022,
          target: ts.ScriptTarget.ES2022,
          verbatimModuleSyntax: false,
        },
        fileName: abs,
        reportDiagnostics: true,
      });

      const syntaxErrors = (transpiled.diagnostics ?? []).filter(
        (d) => d.category === ts.DiagnosticCategory.Error,
      );
      if (syntaxErrors.length > 0) {
        for (const diag of syntaxErrors) {
          const line =
            diag.file && typeof diag.start === "number"
              ? diag.file.getLineAndCharacterOfPosition(diag.start).line + 1
              : 1;
          addError({
            code: "CONTENT_SYNTAX_ERROR",
            category: "schema",
            lessonId: null,
            file: rel,
            location: `line ${line}`,
            message: `خطأ نحوي في ${rel}: ${ts.flattenDiagnosticMessageText(diag.messageText, " ")}`,
          });
        }
        return { loaded: false, modules: {} };
      }

      const jsText = rewriteJsModuleSpecifiers(transpiled.outputText, abs, rootDir, compiledRelSet);
      const outAbs = path.join(tmpDir, rel.replace(/\.tsx?$/, ".mjs"));
      fs.mkdirSync(path.dirname(outAbs), { recursive: true });
      fs.writeFileSync(outAbs, jsText, "utf8");
    }

    const load = async (rel) => {
      const mjsAbs = path.join(tmpDir, rel.replace(/\.tsx?$/, ".mjs"));
      if (!fs.existsSync(mjsAbs)) return null;
      return import(pathToFileURL(mjsAbs).href);
    };

    const [siteMod, stagesMod, curriculumMod, datasetsMod] = await Promise.all([
      load("src/lib/site.ts"),
      load("src/content/lesson-stages.ts"),
      load("src/content/curriculum.ts"),
      load("src/components/lesson/interactive/datasets.ts"),
    ]);

    return {
      loaded: true,
      modules: { siteMod, stagesMod, curriculumMod, datasetsMod },
    };
  } catch (err) {
    addError({
      code: "CONTENT_LOAD_FAILED",
      category: "schema",
      lessonId: null,
      file: "src/content/curriculum.ts",
      location: "runtime-load",
      message: `تعذّر تحميل وحدات المحتوى للفحص: ${err instanceof Error ? err.message : String(err)}`,
    });
    return { loaded: false, modules: {} };
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

/**
 * يعيد كتابة مسارات الاستيراد داخل ملف JS الناتج عبر AST (لا عبر Regex على النص)
 * حتى لا يمسّ أي نصوص عربية داخل المحتوى.
 */
function rewriteJsModuleSpecifiers(jsCode, originalAbsPath, rootDir, compiledRelSet) {
  const sf = ts.createSourceFile(
    `${originalAbsPath}.mjs`,
    jsCode,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  );
  const replacements = [];

  for (const stmt of sf.statements) {
    let specNode = null;
    if (ts.isImportDeclaration(stmt) && ts.isStringLiteral(stmt.moduleSpecifier)) {
      specNode = stmt.moduleSpecifier;
    } else if (ts.isExportDeclaration(stmt) && stmt.moduleSpecifier && ts.isStringLiteral(stmt.moduleSpecifier)) {
      specNode = stmt.moduleSpecifier;
    }
    if (!specNode) continue;

    const spec = specNode.text;
    if (!spec.startsWith(".") && !spec.startsWith("@/")) continue;

    const resolvedAbs = resolveLocalModuleFile(originalAbsPath, spec, rootDir);
    if (!resolvedAbs) continue;
    const resolvedRel = relPath(rootDir, resolvedAbs);
    if (!compiledRelSet.has(resolvedRel)) continue;

    const fromDir = path.dirname(originalAbsPath);
    let nextRel = toPosix(path.relative(fromDir, resolvedAbs)).replace(/\.tsx?$/, ".mjs");
    if (!nextRel.startsWith(".")) nextRel = `./${nextRel}`;

    replacements.push({
      start: specNode.getStart(sf),
      end: specNode.getEnd(),
      text: JSON.stringify(nextRel),
    });
  }

  if (replacements.length === 0) return jsCode;
  replacements.sort((a, b) => b.start - a.start);
  let out = jsCode;
  for (const r of replacements) {
    out = out.slice(0, r.start) + r.text + out.slice(r.end);
  }
  return out;
}

/**
 * يكتشف مسارات Next.js App Router الفعلية من شجرة `src/app/`.
 */
function discoverAppRoutes(rootDir) {
  const appDir = path.join(rootDir, "src/app");
  const staticRoutes = new Set();
  const dynamicRoutes = new Set();

  if (!fs.existsSync(appDir)) return { staticRoutes, dynamicRoutes };

  function walk(dir, segments) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (entry.name.startsWith("(") && entry.name.endsWith(")")) {
          walk(path.join(dir, entry.name), segments);
        } else {
          walk(path.join(dir, entry.name), [...segments, entry.name]);
        }
      } else if (entry.isFile() && /^page\.tsx?$/.test(entry.name)) {
        const route = segments.length === 0 ? "/" : `/${segments.join("/")}`;
        if (segments.some((seg) => seg.startsWith("[") && seg.endsWith("]"))) {
          dynamicRoutes.add(route);
        } else {
          staticRoutes.add(route);
        }
      }
    }
  }
  walk(appDir, []);
  return { staticRoutes, dynamicRoutes };
}

/**
 * يجمع الروابط الداخلية من ملفات `src/app/` و`src/components/` عبر AST.
 */
function extractInternalLinksFromCode(rootDir) {
  const roots = [path.join(rootDir, "src/app"), path.join(rootDir, "src/components")];
  const links = [];

  function walkFiles(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walkFiles(full);
      else if (entry.isFile() && /\.tsx?$/.test(entry.name)) inspectFile(full);
    }
  }

  function recordExpression(expr, sf, fileRel, context) {
    if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) {
      const value = expr.text;
      if (
        value.startsWith("/") ||
        value.startsWith("#") ||
        /^https?:\/\/(localhost|127\.0\.0\.1)\b/i.test(value)
      ) {
        links.push({
          file: fileRel,
          line: lineAt(sf, expr),
          kind: "static",
          value,
          context,
        });
      }
      return;
    }

    if (ts.isTemplateExpression(expr)) {
      const head = expr.head.text;
      const pattern =
        head +
        expr.templateSpans.map((span) => `\${...}${span.literal.text}`).join("");
      if (
        head.startsWith("/") ||
        head.startsWith("#") ||
        /^https?:\/\/(localhost|127\.0\.0\.1)\b/i.test(head)
      ) {
        const lastLiteral = expr.templateSpans[expr.templateSpans.length - 1]?.literal.text ?? "";
        const hashMatch = lastLiteral.match(/#([A-Za-z0-9_-]+)$/);
        links.push({
          file: fileRel,
          line: lineAt(sf, expr),
          kind: "template",
          prefix: head,
          pattern,
          hash: hashMatch ? hashMatch[1] : null,
          context,
        });
      }
    }
  }

  function inspectFile(absPath) {
    const sf = parseTsFile(absPath);
    const fileRel = relPath(rootDir, absPath);

    function visit(node) {
      if (ts.isJsxAttribute(node)) {
        const attrName = node.name.getText(sf);
        if (attrName === "href" || attrName === "finishHref") {
          const parentTag =
            node.parent?.parent &&
            (ts.isJsxOpeningElement(node.parent.parent) ||
              ts.isJsxSelfClosingElement(node.parent.parent))
              ? node.parent.parent.tagName.getText(sf)
              : "JSX";
          const context = `${parentTag}.${attrName}`;
          if (node.initializer) {
            if (ts.isStringLiteral(node.initializer)) {
              recordExpression(node.initializer, sf, fileRel, context);
            } else if (ts.isJsxExpression(node.initializer) && node.initializer.expression) {
              recordExpression(node.initializer.expression, sf, fileRel, context);
            }
          }
        }
      } else if (ts.isPropertyAssignment(node)) {
        const name = getPropertyNameText(node.name);
        if (name === "href" || name === "finishHref") {
          recordExpression(node.initializer, sf, fileRel, `property.${name}`);
        }
      } else if (ts.isBindingElement(node) && node.initializer) {
        const name = getPropertyNameText(node.name);
        if (name === "finishHref" || name === "href") {
          recordExpression(node.initializer, sf, fileRel, `default.${name}`);
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(sf);
  }

  for (const r of roots) walkFiles(r);
  return links;
}

/**
 * يستخرج مفاتيح `QUESTION_HINTS` من ملفات المساعدات (مثل `src/content/lessons/unit-1-helpers.ts`)
 * للتحقق من عدم التكرار وعدم فراغ أي تلميح.
 */
function inspectHelperQuestionHints(rootDir, addError) {
  const lessonsDir = path.join(rootDir, "src/content/lessons");
  const hintKeys = new Map();
  if (!fs.existsSync(lessonsDir)) return hintKeys;

  const helperFiles = fs
    .readdirSync(lessonsDir)
    .filter((f) => f.endsWith("-helpers.ts"))
    .sort();

  for (const fileName of helperFiles) {
    const absPath = path.join(lessonsDir, fileName);
    const fileRel = relPath(rootDir, absPath);
    const sf = parseTsFile(absPath);

    function visit(node) {
      if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === "QUESTION_HINTS" &&
        node.initializer &&
        ts.isObjectLiteralExpression(node.initializer)
      ) {
        for (const prop of node.initializer.properties) {
          if (!ts.isPropertyAssignment(prop)) continue;
          const key = getPropertyNameText(prop.name);
          if (!key) continue;
          const line = lineAt(sf, prop);
          if (hintKeys.has(key)) {
            const prev = hintKeys.get(key);
            addError({
              code: "HINT_TABLE_DUPLICATE_KEY",
              category: "hints",
              lessonId: null,
              file: fileRel,
              location: `QUESTION_HINTS["${key}"] (line ${line})`,
              message: `تكرار معرّف السؤال «${key}» في جدول QUESTION_HINTS (موجود سابقًا في ${prev.file}:${prev.line}).`,
            });
          } else {
            hintKeys.set(key, { file: fileRel, line });
          }

          if (ts.isStringLiteral(prop.initializer) && prop.initializer.text.trim().length === 0) {
            addError({
              code: "HINT_TABLE_EMPTY",
              category: "hints",
              lessonId: null,
              file: fileRel,
              location: `QUESTION_HINTS["${key}"] (line ${line})`,
              message: `التلميح المرجعي للسؤال «${key}» في QUESTION_HINTS فارغ.`,
            });
          }
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(sf);
  }
  return hintKeys;
}

/**
 * يستخرج الروابط الداخلية (إن وُجدت) داخل نصوص المحتوى (Markdown `[label](url)` أو `href="..."`).
 */
function extractLinksFromText(text) {
  if (typeof text !== "string") return [];
  const found = [];
  const mdLinkRe = /\[[^\]]*\]\(([^)\s]+)\)/g;
  for (const match of text.matchAll(mdLinkRe)) {
    found.push(match[1]);
  }
  const htmlHrefRe = /\bhref=["']([^"']+)["']/gi;
  for (const match of text.matchAll(htmlHrefRe)) {
    found.push(match[1]);
  }
  return found.filter(
    (target) =>
      target.startsWith("/") ||
      target.startsWith("#") ||
      /^https?:\/\/(localhost|127\.0\.0\.1)\b/i.test(target),
  );
}

/* ─────────────────────────── الفاحص الرئيسي ─────────────────────────── */

export async function auditContentIntegrity(options = {}) {
  const rootDir = path.resolve(options.rootDir ?? DEFAULT_ROOT);
  const errors = [];
  const warnings = [];
  const exceptionsApplied = [];

  const stats = {
    units: 0,
    totalLessons: 0,
    publishedLessons: 0,
    unpublishedLessons: 0,
    auditedSections: 0,
    auditedBlocks: 0,
    auditedQuizQuestions: 0,
    auditedBookPractices: 0,
    auditedNotebookGroups: 0,
    registeredFigures: 0,
    registeredActivities: 0,
    registeredExercises: 0,
    registeredGeometryIds: 0,
    checkedInternalLinks: 0,
    checkedKatexExpressions: 0,
  };

  const addError = ({ code, category, lessonId = null, file, location, message }) => {
    errors.push({ code, category, lessonId, file, location, message });
  };
  const addWarning = ({ code, category, lessonId = null, file, location, message }) => {
    warnings.push({ code, category, lessonId, file, location, message });
  };

  // 0. التحقق من وجود الملفات الأساسية للبنية
  for (const rel of CORE_FILES) {
    if (!fs.existsSync(path.join(rootDir, rel))) {
      addError({
        code: "CORE_FILE_MISSING",
        category: "curriculum-files",
        lessonId: null,
        file: rel,
        location: "filesystem",
        message: `الملف البنيوي الأساسي غير موجود: ${rel}.`,
      });
    }
  }

  // إن كان أحد ملفات المحتوى أو السجلات الأساسية مفقودًا بالكامل نوقف المتابعة بأخطاء واضحة
  const curriculumAbs = path.join(rootDir, "src/content/curriculum.ts");
  const stagesAbs = path.join(rootDir, "src/content/lesson-stages.ts");
  const typesAbs = path.join(rootDir, "src/content/types.ts");
  const registryAbs = path.join(rootDir, "src/components/lesson/interactive/registry.tsx");
  const bookPracticeAbs = path.join(rootDir, "src/components/lesson/interactive/BookPracticeActivity.tsx");
  const geomPracticeAbs = path.join(rootDir, "src/components/lesson/interactive/GeometryBookPractice.tsx");
  const parallelPracticeAbs = path.join(rootDir, "src/components/lesson/interactive/ParallelBookPractice.tsx");
  const lessonStepsAbs = path.join(rootDir, "src/components/lesson/LessonSteps.tsx");
  const lessonContentAbs = path.join(rootDir, "src/components/lesson/LessonContent.tsx");
  const localQuizAbs = path.join(rootDir, "src/components/lesson/LocalQuiz.tsx");

  // 1. استخراج السجلات والأنواع والمكونات عبر AST
  const figureRegistry = fs.existsSync(registryAbs)
    ? extractRegistryEntries(registryAbs, "FIGURE_REGISTRY", rootDir, addError)
    : new Map();
  const activityRegistry = fs.existsSync(registryAbs)
    ? extractRegistryEntries(registryAbs, "ACTIVITY_REGISTRY", rootDir, addError)
    : new Map();
  const exerciseRegistry = fs.existsSync(registryAbs)
    ? extractRegistryEntries(registryAbs, "EXERCISE_REGISTRY", rootDir, addError)
    : new Map();

  stats.registeredFigures = figureRegistry.size;
  stats.registeredActivities = activityRegistry.size;
  stats.registeredExercises = exerciseRegistry.size;

  const allowedModes = fs.existsSync(typesAbs)
    ? extractInterfaceStringUnion(typesAbs, "BookPracticeBlock", "mode")
    : new Set(["numberLine", "classify", "setEntry", "reflection", "form", "geometry"]);
  const declaredGeometryIds = fs.existsSync(typesAbs)
    ? extractInterfaceStringUnion(typesAbs, "BookPracticeBlock", "geometryId")
    : new Set();
  const declaredValidators = fs.existsSync(typesAbs)
    ? extractInterfaceStringUnion(typesAbs, "BookPracticeBlock", "validator")
    : new Set();

  const implementedGeometryIds = fs.existsSync(geomPracticeAbs)
    ? extractComparedStringLiterals(geomPracticeAbs, "id")
    : new Set();
  const implementedParallelIds = fs.existsSync(parallelPracticeAbs)
    ? extractComparedStringLiterals(parallelPracticeAbs, "id")
    : new Set();
  const implementedValidators = fs.existsSync(bookPracticeAbs)
    ? extractComparedStringLiterals(bookPracticeAbs, "task.validator")
    : new Set();

  const allImplementedGeometryIds = new Set([...implementedGeometryIds, ...implementedParallelIds]);
  stats.registeredGeometryIds = allImplementedGeometryIds.size;

  // اتساق قائمة geometryId و validator بين types.ts ومكونات التفاعل
  for (const geomId of declaredGeometryIds) {
    const expectedSet = geomId.startsWith("parallel-")
      ? implementedParallelIds
      : implementedGeometryIds;
    const expectedComp = geomId.startsWith("parallel-")
      ? "src/components/lesson/interactive/ParallelBookPractice.tsx"
      : "src/components/lesson/interactive/GeometryBookPractice.tsx";
    if (!expectedSet.has(geomId)) {
      addError({
        code: "GEOMETRY_ID_UNIMPLEMENTED",
        category: "registries",
        lessonId: null,
        file: expectedComp,
        location: `geometryId="${geomId}"`,
        message: `المعرّف الهندسي «${geomId}» معرّف في src/content/types.ts لكنه غير منفّذ في ${expectedComp}.`,
      });
    }
  }
  for (const validatorId of declaredValidators) {
    if (!implementedValidators.has(validatorId)) {
      addError({
        code: "VALIDATOR_UNIMPLEMENTED",
        category: "questions",
        lessonId: null,
        file: "src/components/lesson/interactive/BookPracticeActivity.tsx",
        location: `validator="${validatorId}"`,
        message: `المُحقّق «${validatorId}» معرّف في src/content/types.ts لكنه غير منفّذ في BookPracticeActivity.tsx.`,
      });
    }
  }

  // استخراج أيقونات المراحل من LessonSteps.tsx وفحص تناسق LocalQuiz.tsx و LessonContent.tsx
  const stageIconsRegistry = fs.existsSync(lessonStepsAbs)
    ? extractRegistryEntries(lessonStepsAbs, "STAGE_ICONS", rootDir, addError)
    : new Map();

  if (fs.existsSync(localQuizAbs)) {
    const localQuizSrc = fs.readFileSync(localQuizAbs, "utf8");
    if (!/\bhintFor\b/.test(localQuizSrc)) {
      addError({
        code: "QUIZ_FALLBACK_HINT_MISSING",
        category: "hints",
        lessonId: "lesson-1-1",
        file: "src/components/lesson/LocalQuiz.tsx",
        location: "LocalQuiz",
        message: "دالة التلميح الاحتياطية `hintFor` مفقودة من LocalQuiz.tsx وهي لازمة للاستثناء الموثّق للدرس lesson-1-1.",
      });
    }
  }

  // فحص QUESTION_HINTS في ملفات المساعدات
  const helperHintKeys = inspectHelperQuestionHints(rootDir, addError);

  // 2. الفحص المسبق لاستيرادات curriculum.ts عبر AST
  const curriculumAst = fs.existsSync(curriculumAbs)
    ? inspectCurriculumAst(curriculumAbs, rootDir, addError)
    : { hasBrokenImports: true, importedFiles: new Set(), identifierToFile: new Map(), lessonWiring: new Map() };

  // إن وُجدت استيرادات مكسورة في curriculum.ts نرجع التقرير بأخطاء واضحة دون انهيار
  if (curriculumAst.hasBrokenImports || !fs.existsSync(curriculumAbs) || !fs.existsSync(stagesAbs)) {
    return {
      ok: errors.length === 0,
      rootDir,
      errors,
      warnings,
      exceptionsApplied,
      stats,
    };
  }

  // 3. تحميل وحدات البيانات (CURRICULUM, LESSON_STAGES, LESSON_STATUS, datasets)
  const runtime = await loadRuntimeModules(rootDir, addError);
  if (!runtime.loaded) {
    return {
      ok: errors.length === 0,
      rootDir,
      errors,
      warnings,
      exceptionsApplied,
      stats,
    };
  }

  const { siteMod, stagesMod, curriculumMod, datasetsMod } = runtime.modules;
  const CURRICULUM = curriculumMod?.CURRICULUM;
  const LESSON_STAGES = stagesMod?.LESSON_STAGES;
  const LESSON_STATUS = siteMod?.LESSON_STATUS;

  const validStatuses = isPlainObject(LESSON_STATUS)
    ? new Set(Object.keys(LESSON_STATUS))
    : new Set(["indexed", "received", "drafting", "review", "published"]);

  // 4. التحقق من مجموعات البيانات البيانية (`datasets.ts`) ومراجعها في `registry.tsx`
  auditDatasets(datasetsMod, registryAbs, rootDir, addError);

  // 5. التحقق من تعريف المراحل التسع المعتمدة (`lesson-stages.ts`)
  const validStageIds = auditStageDefinitions(
    LESSON_STAGES,
    stageIconsRegistry,
    lessonContentAbs,
    rootDir,
    addError,
  );

  // 6. التحقق من `CURRICULUM` وسجل الدروس وملفات الدروس
  if (!Array.isArray(CURRICULUM) || CURRICULUM.length === 0) {
    addError({
      code: "CURRICULUM_EMPTY_OR_INVALID",
      category: "schema",
      lessonId: null,
      file: "src/content/curriculum.ts",
      location: "CURRICULUM",
      message: "يجب أن يكون CURRICULUM مصفوفة غير فارغة من الوحدات.",
    });
    return { ok: false, rootDir, errors, warnings, exceptionsApplied, stats };
  }

  stats.units = CURRICULUM.length;

  const seenUnitIds = new Set();
  const seenUnitNumbers = new Set();
  const seenLessonIds = new Map();
  const seenQuizIds = new Map();
  const seenQuestionIds = new Map();
  const seenGlobalActivityIds = new Map();
  const seenGlobalExerciseIds = new Map();
  const publishedLessonStageSets = new Map();
  const allPublishedQuestionIds = new Set();

  const validUnitIds = new Set();
  const validLessonIds = new Set();
  const publishedLessonIds = new Set();
  const lessonsDirAbs = path.join(rootDir, "src/content/lessons");
  const diskLessonFiles = fs.existsSync(lessonsDirAbs)
    ? fs
        .readdirSync(lessonsDirAbs)
        .filter((f) => /^lesson-.+\.ts$/i.test(f))
        .sort()
    : [];

  // دالة فحص KaTeX
  const validateKatex = (tex, { lessonId, file, location, display = false }) => {
    if (!isNonEmptyString(tex)) {
      addError({
        code: "TEX_EMPTY",
        category: "schema",
        lessonId,
        file,
        location,
        message: "تعبير LaTeX فارغ أو غير نصي.",
      });
      return;
    }
    stats.checkedKatexExpressions += 1;
    try {
      katex.renderToString(tex, {
        displayMode: display,
        throwOnError: true,
        strict: "ignore",
        trust: false,
      });
    } catch (err) {
      addError({
        code: "KATEX_SYNTAX_ERROR",
        category: "schema",
        lessonId,
        file,
        location,
        message: `خطأ في صيغة KaTeX «${tex}»: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  };

  // دالة فحص النصوص الغنية (تعابير $...$ والروابط الداخلية داخل النصوص)
  const contentInternalLinks = [];
  const validateRichText = (value, ctx) => {
    if (typeof value !== "string") return;
    const inlineMatches = value.match(/\$[^$]+\$/g) ?? [];
    for (const seg of inlineMatches) {
      validateKatex(seg.slice(1, -1), { ...ctx, display: false });
    }
    const stripped = value.replace(/\$[^$]+\$/g, "");
    if (stripped.includes("$")) {
      addError({
        code: "KATEX_UNBALANCED_DELIMITER",
        category: "schema",
        lessonId: ctx.lessonId,
        file: ctx.file,
        location: ctx.location,
        message: `علامة $ غير مغلقة في النص: «${value.slice(0, 80)}».`,
      });
    }
    for (const target of extractLinksFromText(value)) {
      contentInternalLinks.push({ ...ctx, target });
    }
  };

  // المرور على جميع الوحدات والدروس في الفهرس
  for (let ui = 0; ui < CURRICULUM.length; ui += 1) {
    const unit = CURRICULUM[ui];
    const unitLoc = `CURRICULUM[${ui}]`;

    if (!isPlainObject(unit)) {
      addError({
        code: "SCHEMA_UNIT_INVALID",
        category: "schema",
        lessonId: null,
        file: "src/content/curriculum.ts",
        location: unitLoc,
        message: "عنصر الوحدة في CURRICULUM يجب أن يكون كائنًا صالحًا.",
      });
      continue;
    }

    if (!isNonEmptyString(unit.id) || !VALID_SLUG_RE.test(unit.id)) {
      addError({
        code: "UNIT_ID_INVALID",
        category: "ids",
        lessonId: null,
        file: "src/content/curriculum.ts",
        location: `${unitLoc}.id`,
        message: `معرّف الوحدة غير صالح: «${String(unit.id)}» (يجب أن يكون نصًا إنجليزيًا صغيرًا صالحًا للمسار).`,
      });
    } else if (seenUnitIds.has(unit.id)) {
      addError({
        code: "ID_DUPLICATE",
        category: "ids",
        lessonId: null,
        file: "src/content/curriculum.ts",
        location: `${unitLoc}.id`,
        message: `معرّف الوحدة «${unit.id}» مكرّر في سجل المنهاج.`,
      });
    } else {
      seenUnitIds.add(unit.id);
      validUnitIds.add(unit.id);
    }

    if (!Number.isInteger(unit.number) || unit.number < 1) {
      addError({
        code: "SCHEMA_UNIT_NUMBER_INVALID",
        category: "schema",
        lessonId: null,
        file: "src/content/curriculum.ts",
        location: `${unitLoc}.number`,
        message: `رقم الوحدة «${unit.id ?? ui}» يجب أن يكون عددًا صحيحًا موجبًا.`,
      });
    } else if (seenUnitNumbers.has(unit.number)) {
      addError({
        code: "UNIT_NUMBER_DUPLICATE",
        category: "ids",
        lessonId: null,
        file: "src/content/curriculum.ts",
        location: `${unitLoc}.number`,
        message: `رقم الوحدة ${unit.number} مكرّر في سجل المنهاج.`,
      });
    } else {
      seenUnitNumbers.add(unit.number);
    }

    if (!isNonEmptyString(unit.title)) {
      addError({
        code: "SCHEMA_UNIT_TITLE_MISSING",
        category: "schema",
        lessonId: null,
        file: "src/content/curriculum.ts",
        location: `${unitLoc}.title`,
        message: `عنوان الوحدة «${unit.id ?? ui}» مفقود أو فارغ.`,
      });
    }

    if (unit.summary !== undefined && !isNonEmptyString(unit.summary)) {
      addError({
        code: "SCHEMA_UNIT_SUMMARY_EMPTY",
        category: "schema",
        lessonId: null,
        file: "src/content/curriculum.ts",
        location: `${unitLoc}.summary`,
        message: `ملخص الوحدة «${unit.id}» معرّف لكنه فارغ.`,
      });
    }

    for (const colorKey of ["accent", "tint"]) {
      if (
        unit[colorKey] !== undefined &&
        (typeof unit[colorKey] !== "string" || !VALID_HEX_COLOR_RE.test(unit[colorKey]))
      ) {
        addError({
          code: "SCHEMA_COLOR_INVALID",
          category: "schema",
          lessonId: null,
          file: "src/content/curriculum.ts",
          location: `${unitLoc}.${colorKey}`,
          message: `اللون ${colorKey} للوحدة «${unit.id}» ليس قيمة Hex صالحة: «${String(unit[colorKey])}».`,
        });
      }
    }

    if (!Array.isArray(unit.lessons) || unit.lessons.length === 0) {
      addError({
        code: "SCHEMA_UNIT_LESSONS_EMPTY",
        category: "schema",
        lessonId: null,
        file: "src/content/curriculum.ts",
        location: `${unitLoc}.lessons`,
        message: `الوحدة «${unit.id}» يجب أن تحتوي مصفوفة دروس غير فارغة.`,
      });
      continue;
    }

    const seenLessonNumbersInUnit = new Set();

    for (let li = 0; li < unit.lessons.length; li += 1) {
      const lesson = unit.lessons[li];
      const lessonMetaLoc = `${unitLoc} (${unit.id}).lessons[${li}]`;
      stats.totalLessons += 1;

      if (!isPlainObject(lesson)) {
        addError({
          code: "SCHEMA_LESSON_INVALID",
          category: "schema",
          lessonId: null,
          file: "src/content/curriculum.ts",
          location: lessonMetaLoc,
          message: "عنصر الدرس يجب أن يكون كائنًا صالحًا.",
        });
        continue;
      }

      const lessonId = typeof lesson.id === "string" ? lesson.id : null;

      if (
        !isNonEmptyString(lesson.id) ||
        !VALID_SLUG_RE.test(lesson.id) ||
        RESERVED_LESSON_IDS.has(lesson.id)
      ) {
        addError({
          code: "LESSON_ID_INVALID",
          category: "ids",
          lessonId,
          file: "src/content/curriculum.ts",
          location: `${lessonMetaLoc}.id`,
          message: `معرّف الدرس غير صالح أو محجوز: «${String(lesson.id)}».`,
        });
      } else if (seenLessonIds.has(lesson.id)) {
        const firstLoc = seenLessonIds.get(lesson.id);
        addError({
          code: "ID_DUPLICATE",
          category: "ids",
          lessonId: lesson.id,
          file: "src/content/curriculum.ts",
          location: `${lessonMetaLoc}.id`,
          message: `معرّف الدرس «${lesson.id}» مكرّر في سجل المنهاج (ظهر سابقًا في ${firstLoc}).`,
        });
      } else {
        seenLessonIds.set(lesson.id, lessonMetaLoc);
        validLessonIds.add(lesson.id);
      }

      if (!Number.isInteger(lesson.number) || lesson.number < 1) {
        addError({
          code: "SCHEMA_LESSON_NUMBER_INVALID",
          category: "schema",
          lessonId,
          file: "src/content/curriculum.ts",
          location: `${lessonMetaLoc}.number`,
          message: `رقم الدرس «${lessonId ?? li}» يجب أن يكون عددًا صحيحًا موجبًا.`,
        });
      } else if (seenLessonNumbersInUnit.has(lesson.number)) {
        addError({
          code: "LESSON_NUMBER_DUPLICATE",
          category: "ids",
          lessonId,
          file: "src/content/curriculum.ts",
          location: `${lessonMetaLoc}.number`,
          message: `رقم الدرس ${lesson.number} مكرّر داخل الوحدة «${unit.id}».`,
        });
      } else {
        seenLessonNumbersInUnit.add(lesson.number);
      }

      if (!isNonEmptyString(lesson.title)) {
        addError({
          code: "SCHEMA_LESSON_TITLE_MISSING",
          category: "schema",
          lessonId,
          file: "src/content/curriculum.ts",
          location: `${lessonMetaLoc}.title`,
          message: `عنوان الدرس «${lessonId ?? li}» مفقود أو فارغ.`,
        });
      }

      if (typeof lesson.status !== "string" || !validStatuses.has(lesson.status)) {
        addError({
          code: "SCHEMA_LESSON_STATUS_INVALID",
          category: "schema",
          lessonId,
          file: "src/content/curriculum.ts",
          location: `${lessonMetaLoc}.status`,
          message: `حالة الدرس «${lessonId}» غير معتمدة: «${String(lesson.status)}» (المسموح: ${[...validStatuses].join(", ")}).`,
        });
      }

      if (lesson.pageRange !== undefined) {
        if (typeof lesson.pageRange !== "string" || !VALID_PAGE_RANGE_RE.test(lesson.pageRange)) {
          addError({
            code: "SCHEMA_PAGE_RANGE_INVALID",
            category: "schema",
            lessonId,
            file: "src/content/curriculum.ts",
            location: `${lessonMetaLoc}.pageRange`,
            message: `نطاق الصفحات للدرس «${lessonId}» غير صالح: «${String(lesson.pageRange)}» (المتوقع مثل "3-5" أو "168").`,
          });
        } else {
          const [, startStr, endStr] = lesson.pageRange.match(VALID_PAGE_RANGE_RE);
          const start = Number(startStr);
          const end = endStr ? Number(endStr) : start;
          if (start < 1 || end < start) {
            addError({
              code: "SCHEMA_PAGE_RANGE_INVALID",
              category: "schema",
              lessonId,
              file: "src/content/curriculum.ts",
              location: `${lessonMetaLoc}.pageRange`,
              message: `نطاق الصفحات للدرس «${lessonId}» معكوس أو غير موجب: «${lesson.pageRange}».`,
            });
          }
        }
      }

      if (lesson.summary !== undefined && !isNonEmptyString(lesson.summary)) {
        addError({
          code: "SCHEMA_LESSON_SUMMARY_EMPTY",
          category: "schema",
          lessonId,
          file: "src/content/curriculum.ts",
          location: `${lessonMetaLoc}.summary`,
          message: `حقل summary للدرس «${lessonId}» معرّف لكنه فارغ.`,
        });
      }

      // القاعدة 9: الدروس غير المنشورة (indexed / received / drafting / review) لا تُعدّ أخطاءً لغياب محتواها.
      if (lesson.status !== "published") {
        stats.unpublishedLessons += 1;
        continue;
      }

      // ─── فحص الدرس المنشور (status === "published") ───
      stats.publishedLessons += 1;
      if (lessonId) publishedLessonIds.add(lessonId);

      const expectedLessonFileRel = lessonId ? `src/content/lessons/${lessonId}.ts` : "src/content/curriculum.ts";
      const expectedLessonFileAbs = lessonId ? path.join(rootDir, expectedLessonFileRel) : null;
      const wiring = lessonId ? curriculumAst.lessonWiring.get(lessonId) : null;
      const lessonSourceFile =
        wiring?.contentFile ??
        (expectedLessonFileAbs && fs.existsSync(expectedLessonFileAbs)
          ? expectedLessonFileRel
          : "src/content/curriculum.ts");

      // القاعدة 1: تطابق سجل المنهاج مع ملفات الدروس المنشورة
      if (expectedLessonFileAbs && !fs.existsSync(expectedLessonFileAbs)) {
        addError({
          code: "PUBLISHED_LESSON_MISSING_FILE",
          category: "curriculum-files",
          lessonId,
          file: expectedLessonFileRel,
          location: `${lessonMetaLoc} (status="published")`,
          message: `الدرس المنشور «${lessonId}» ليس له ملف محتوى مطابق على القرص: ${expectedLessonFileRel}.`,
        });
      } else if (lessonId && wiring) {
        if (!wiring.contentFile) {
          addError({
            code: "PUBLISHED_LESSON_NOT_WIRED_TO_FILE",
            category: "curriculum-files",
            lessonId,
            file: "src/content/curriculum.ts",
            location: `line ${wiring.line} (${lessonId})`,
            message: `الدرس المنشور «${lessonId}» في curriculum.ts لا يستورد محتواه من ${expectedLessonFileRel}.`,
          });
        } else if (wiring.contentFile !== expectedLessonFileRel) {
          addError({
            code: "PUBLISHED_LESSON_FILE_MISMATCH",
            category: "curriculum-files",
            lessonId,
            file: "src/content/curriculum.ts",
            location: `line ${wiring.line} (${lessonId})`,
            message: `الدرس المنشور «${lessonId}» مرتبط بالملف «${wiring.contentFile}» بدل الملف المتوقع «${expectedLessonFileRel}».`,
          });
        }
      }

      if (!isPlainObject(lesson.content)) {
        addError({
          code: "PUBLISHED_LESSON_MISSING_CONTENT",
          category: "curriculum-files",
          lessonId,
          file: "src/content/curriculum.ts",
          location: `${lessonMetaLoc}.content`,
          message: `الدرس المنشور «${lessonId}» يفتقد كائن المحتوى \`content\`.`,
        });
        continue;
      }

      // فحص محتوى الدرس المنشور كاملًا (المراحل، المعرّفات، الكتل، التمارين، الاختبار، الدفتر)
      const stageIdsPresent = auditPublishedLessonContent({
        lesson,
        lessonFile: lessonSourceFile,
        validStageIds,
        allowedModes,
        declaredGeometryIds,
        implementedGeometryIds,
        implementedParallelIds,
        implementedValidators,
        figureRegistry,
        activityRegistry,
        exerciseRegistry,
        seenQuizIds,
        seenQuestionIds,
        seenGlobalActivityIds,
        seenGlobalExerciseIds,
        allPublishedQuestionIds,
        stats,
        addError,
        exceptionsApplied,
        validateKatex,
        validateRichText,
      });

      if (lessonId) publishedLessonStageSets.set(lessonId, stageIdsPresent);
    }
  }

  // فحص ملفات الدروس اليتيمة في `src/content/lessons/` غير المسجّلة في الفهرس
  for (const fileName of diskLessonFiles) {
    const fileLessonId = fileName.replace(/\.ts$/i, "");
    const fileRel = `src/content/lessons/${fileName}`;
    if (!validLessonIds.has(fileLessonId)) {
      addError({
        code: "ORPHAN_LESSON_FILE",
        category: "curriculum-files",
        lessonId: fileLessonId,
        file: fileRel,
        location: "src/content/lessons/",
        message: `ملف الدرس «${fileRel}» موجود على القرص لكنه غير مسجّل بأي معرّف مطابق في src/content/curriculum.ts.`,
      });
    } else if (publishedLessonIds.has(fileLessonId) && !curriculumAst.importedFiles.has(fileRel)) {
      addError({
        code: "UNIMPORTED_LESSON_FILE",
        category: "curriculum-files",
        lessonId: fileLessonId,
        file: "src/content/curriculum.ts",
        location: fileRel,
        message: `ملف الدرس المنشور «${fileRel}» غير مستورد في src/content/curriculum.ts.`,
      });
    }
  }

  // فحص مفاتيح QUESTION_HINTS غير المستخدمة كتنبيه فقط (لا يوقف دروسًا قيد الإعداد)
  for (const [hintKey, meta] of helperHintKeys) {
    if (!allPublishedQuestionIds.has(hintKey)) {
      addWarning({
        code: "HINT_TABLE_UNMATCHED_KEY",
        category: "hints",
        lessonId: null,
        file: meta.file,
        location: `QUESTION_HINTS["${hintKey}"] (line ${meta.line})`,
        message: `المفتاح «${hintKey}» في QUESTION_HINTS لا يطابق أي سؤال اختبار في الدروس المنشورة حاليًا.`,
      });
    }
  }

  // 7. التحقق من الروابط الداخلية ومراجع المكونات
  auditInternalLinks({
    rootDir,
    validUnitIds,
    validLessonIds,
    publishedLessonIds,
    validStageIds,
    publishedLessonStageSets,
    contentInternalLinks,
    stats,
    addError,
  });

  return {
    ok: errors.length === 0,
    rootDir,
    errors,
    warnings,
    exceptionsApplied,
    stats,
  };
}

/* ─────────────────────────── دوال الفحص التفصيلية ─────────────────────────── */

function auditDatasets(datasetsMod, registryAbs, rootDir, addError) {
  const file = "src/components/lesson/interactive/datasets.ts";
  if (!datasetsMod) return;

  const validateDataset = (ds, name, requireBounds = false) => {
    if (!isPlainObject(ds)) {
      addError({
        code: "DATASET_INVALID",
        category: "registries",
        lessonId: null,
        file,
        location: name,
        message: `مجموعة البيانات «${name}» ليست كائنًا صالحًا.`,
      });
      return;
    }
    for (const key of ["title", "xAxisLabel", "yAxisLabel"]) {
      if (!isNonEmptyString(ds[key])) {
        addError({
          code: "DATASET_FIELD_MISSING",
          category: "registries",
          lessonId: null,
          file,
          location: `${name}.${key}`,
          message: `الحقل المطلوب «${key}» مفقود أو فارغ في مجموعة البيانات «${name}».`,
        });
      }
    }
    if (!Array.isArray(ds.xLabels) || ds.xLabels.length === 0 || !ds.xLabels.every(isNonEmptyString)) {
      addError({
        code: "DATASET_XLABELS_INVALID",
        category: "registries",
        lessonId: null,
        file,
        location: `${name}.xLabels`,
        message: `تسميات المحور الأفقي xLabels في «${name}» يجب أن تكون مصفوفة غير فارغة من النصوص.`,
      });
    }
    if (!Array.isArray(ds.values) || ds.values.length === 0 || !ds.values.every((v) => typeof v === "number" && Number.isFinite(v))) {
      addError({
        code: "DATASET_VALUES_INVALID",
        category: "registries",
        lessonId: null,
        file,
        location: `${name}.values`,
        message: `قيم البيانات values في «${name}» يجب أن تكون مصفوفة غير فارغة من الأعداد المنتهية.`,
      });
    } else if (Array.isArray(ds.xLabels) && ds.values.length !== ds.xLabels.length) {
      addError({
        code: "DATASET_LENGTH_MISMATCH",
        category: "registries",
        lessonId: null,
        file,
        location: name,
        message: `عدم تطابق عدد النقاط في «${name}»: xLabels (${ds.xLabels.length}) ≠ values (${ds.values.length}).`,
      });
    }
    if (
      typeof ds.yMin !== "number" ||
      typeof ds.yMax !== "number" ||
      !Number.isFinite(ds.yMin) ||
      !Number.isFinite(ds.yMax) ||
      ds.yMin >= ds.yMax
    ) {
      addError({
        code: "DATASET_RANGE_INVALID",
        category: "registries",
        lessonId: null,
        file,
        location: `${name} (yMin/yMax)`,
        message: `نطاق المحور الشاقولي غير صالح في «${name}»: yMin=${String(ds.yMin)}, yMax=${String(ds.yMax)}.`,
      });
    } else if (Array.isArray(ds.values)) {
      for (let i = 0; i < ds.values.length; i += 1) {
        const v = ds.values[i];
        if (v < ds.yMin || v > ds.yMax) {
          addError({
            code: "DATASET_VALUE_OUT_OF_RANGE",
            category: "registries",
            lessonId: null,
            file,
            location: `${name}.values[${i}]`,
            message: `القيمة ${v} خارج نطاق المحور الشاقولي [${ds.yMin}, ${ds.yMax}] في «${name}».`,
          });
        }
      }
    }
    if (!Array.isArray(ds.yTicks) || ds.yTicks.length === 0) {
      addError({
        code: "DATASET_YTICKS_INVALID",
        category: "registries",
        lessonId: null,
        file,
        location: `${name}.yTicks`,
        message: `تدريجات المحور الشاقولي yTicks مفقودة أو فارغة في «${name}».`,
      });
    } else {
      for (let i = 0; i < ds.yTicks.length; i += 1) {
        const t = ds.yTicks[i];
        if (typeof t !== "number" || !Number.isFinite(t)) {
          addError({
            code: "DATASET_YTICKS_INVALID",
            category: "registries",
            lessonId: null,
            file,
            location: `${name}.yTicks[${i}]`,
            message: `تدريجة غير رقمية في «${name}.yTicks[${i}]».`,
          });
        } else if (i > 0 && t <= ds.yTicks[i - 1]) {
          addError({
            code: "DATASET_YTICKS_UNSORTED",
            category: "registries",
            lessonId: null,
            file,
            location: `${name}.yTicks[${i}]`,
            message: `تدريجات yTicks غير مرتّبة تصاعديًا في «${name}».`,
          });
        }
      }
    }
    if (requireBounds) {
      if (
        typeof ds.yFloor !== "number" ||
        typeof ds.yCeil !== "number" ||
        ds.yFloor >= ds.yCeil ||
        ds.yFloor < ds.yMin ||
        ds.yCeil > ds.yMax
      ) {
        addError({
          code: "DATASET_BOUNDS_INVALID",
          category: "registries",
          lessonId: null,
          file,
          location: `${name} (yFloor/yCeil)`,
          message: `حدود وضع النقاط (yFloor=${String(ds.yFloor)}, yCeil=${String(ds.yCeil)}) غير متسقة مع [yMin, yMax] في «${name}».`,
        });
      }
    }
  };

  const plotDatasets = datasetsMod.PLOT_DATASETS;
  const plotKeys = new Set();
  if (isPlainObject(plotDatasets)) {
    for (const [key, ds] of Object.entries(plotDatasets)) {
      plotKeys.add(key);
      validateDataset(ds, `PLOT_DATASETS.${key}`, true);
      if (ds?.id !== key) {
        addError({
          code: "DATASET_ID_MISMATCH",
          category: "registries",
          lessonId: null,
          file,
          location: `PLOT_DATASETS.${key}.id`,
          message: `معرّف مجموعة البيانات (${String(ds?.id)}) لا يطابق مفتاحها «${key}».`,
        });
      }
    }
  }
  if (datasetsMod.STUDENTS_DATASET) validateDataset(datasetsMod.STUDENTS_DATASET, "STUDENTS_DATASET", false);
  if (datasetsMod.RAIN_DATASET) validateDataset(datasetsMod.RAIN_DATASET, "RAIN_DATASET", false);

  // التحقق من أن كل إشارة datasetId أو PLOT_DATASETS.<key> داخل registry.tsx تشير إلى مجموعة موجودة
  if (fs.existsSync(registryAbs)) {
    for (const ref of extractRegistryDatasetRefs(registryAbs, rootDir)) {
      if (!plotKeys.has(ref.key)) {
        addError({
          code: "DATASET_UNREGISTERED",
          category: "registries",
          lessonId: null,
          file: ref.file,
          location: `line ${ref.line} (${ref.kind}="${ref.key}")`,
          message: `مرجع مجموعة بيانات غير مسجّل في datasets.ts: «${ref.key}».`,
        });
      }
    }
  }
}

function auditStageDefinitions(LESSON_STAGES, stageIconsRegistry, lessonContentAbs, rootDir, addError) {
  const file = "src/content/lesson-stages.ts";
  const validStageIds = new Set();

  if (!Array.isArray(LESSON_STAGES)) {
    addError({
      code: "STAGES_DEF_INVALID",
      category: "stages",
      lessonId: null,
      file,
      location: "LESSON_STAGES",
      message: "يجب أن يكون LESSON_STAGES مصفوفة معرّفة للمراحل التسع المعتمدة.",
    });
    return validStageIds;
  }

  const actualIds = [];
  for (let i = 0; i < LESSON_STAGES.length; i += 1) {
    const stage = LESSON_STAGES[i];
    const loc = `LESSON_STAGES[${i}]`;
    if (!isPlainObject(stage)) {
      addError({
        code: "STAGES_DEF_INVALID",
        category: "stages",
        lessonId: null,
        file,
        location: loc,
        message: "عنصر المرحلة في LESSON_STAGES يجب أن يكون كائنًا صالحًا.",
      });
      continue;
    }
    if (!isNonEmptyString(stage.id)) {
      addError({
        code: "STAGE_ID_INVALID",
        category: "ids",
        lessonId: null,
        file,
        location: `${loc}.id`,
        message: "معرّف مرحلة فارغ في LESSON_STAGES.",
      });
      continue;
    }
    if (validStageIds.has(stage.id)) {
      addError({
        code: "ID_DUPLICATE",
        category: "ids",
        lessonId: null,
        file,
        location: `${loc}.id`,
        message: `تكرار معرّف المرحلة «${stage.id}» في LESSON_STAGES.`,
      });
    } else {
      validStageIds.add(stage.id);
      actualIds.push(stage.id);
    }

    if (!isNonEmptyString(stage.name)) {
      addError({
        code: "SCHEMA_STAGE_NAME_MISSING",
        category: "schema",
        lessonId: null,
        file,
        location: `${loc}.name`,
        message: `اسم المرحلة «${stage.id}» مفقود في LESSON_STAGES.`,
      });
    }
    if (!isNonEmptyString(stage.hint)) {
      addError({
        code: "SCHEMA_STAGE_HINT_MISSING",
        category: "schema",
        lessonId: null,
        file,
        location: `${loc}.hint`,
        message: `تلميح المرحلة «${stage.id}» مفقود في LESSON_STAGES.`,
      });
    }
    if (!isNonEmptyString(stage.icon) || (stageIconsRegistry.size > 0 && !stageIconsRegistry.has(stage.icon))) {
      addError({
        code: "STAGE_ICON_UNREGISTERED",
        category: "links",
        lessonId: null,
        file,
        location: `${loc}.icon`,
        message: `أيقونة المرحلة «${stage.id}» (${String(stage.icon)}) غير مسجّلة في STAGE_ICONS داخل LessonSteps.tsx.`,
      });
    }
  }

  const sameSequence =
    actualIds.length === CANONICAL_STAGE_IDS.length &&
    actualIds.every((id, idx) => id === CANONICAL_STAGE_IDS[idx]);
  if (!sameSequence) {
    addError({
      code: "STAGES_CANONICAL_MISMATCH",
      category: "stages",
      lessonId: null,
      file,
      location: "LESSON_STAGES",
      message: `المراحل التسع في LESSON_STAGES لا تطابق الترتيب المعتمد.\n  الفعلي:   [${actualIds.join(", ")}]\n  المعتمد: [${CANONICAL_STAGE_IDS.join(", ")}]`,
    });
  }

  // التحقق من اتساق LessonContent.tsx مع معرّفات المراحل الخاصة
  if (fs.existsSync(lessonContentAbs)) {
    const contentSrc = fs.readFileSync(lessonContentAbs, "utf8");
    for (const specialId of ["quiz", "notebook"]) {
      if (!contentSrc.includes(`"${specialId}"`) || !validStageIds.has(specialId)) {
        addError({
          code: "STAGE_COMPONENT_MISMATCH",
          category: "links",
          lessonId: null,
          file: relPath(rootDir, lessonContentAbs),
          location: `stage="${specialId}"`,
          message: `عارض المراحل LessonContent.tsx لا يطابق المرحلة الخاصة «${specialId}» في LESSON_STAGES.`,
        });
      }
    }
  }

  return validStageIds;
}

function auditPublishedLessonContent({
  lesson,
  lessonFile,
  validStageIds,
  allowedModes,
  declaredGeometryIds,
  implementedGeometryIds,
  implementedParallelIds,
  implementedValidators,
  figureRegistry,
  activityRegistry,
  exerciseRegistry,
  seenQuizIds,
  seenQuestionIds,
  seenGlobalActivityIds,
  seenGlobalExerciseIds,
  allPublishedQuestionIds,
  stats,
  addError,
  exceptionsApplied,
  validateKatex,
  validateRichText,
}) {
  const lessonId = lesson.id;
  const content = lesson.content;
  const presentStages = new Set();

  // ── 1) فحص الأقسام والمراحل التسع وترتيبها ──
  if (!Array.isArray(content.sections)) {
    addError({
      code: "SCHEMA_SECTIONS_INVALID",
      category: "schema",
      lessonId,
      file: lessonFile,
      location: "content.sections",
      message: `حقل sections مفقود أو ليس مصفوفة في الدرس «${lessonId}».`,
    });
  } else {
    const seenSectionIds = new Map();
    const knownSectionOrder = [];
    const seenLessonActivityIds = new Set();
    const seenLessonExerciseIds = new Set();

    for (let si = 0; si < content.sections.length; si += 1) {
      const sec = content.sections[si];
      const secLoc = `sections[${si}]`;
      stats.auditedSections += 1;

      if (!isPlainObject(sec)) {
        addError({
          code: "SCHEMA_SECTION_INVALID",
          category: "schema",
          lessonId,
          file: lessonFile,
          location: secLoc,
          message: `القسم رقم ${si} في الدرس «${lessonId}» ليس كائنًا صالحًا.`,
        });
        continue;
      }

      const secId = typeof sec.id === "string" ? sec.id : null;
      const namedSecLoc = secId ? `sections[${si}] (${secId})` : secLoc;

      if (!isNonEmptyString(sec.id)) {
        addError({
          code: "STAGE_ID_INVALID",
          category: "ids",
          lessonId,
          file: lessonFile,
          location: `${secLoc}.id`,
          message: `معرّف القسم رقم ${si} في الدرس «${lessonId}» مفقود أو فارغ.`,
        });
      } else {
        if (seenSectionIds.has(sec.id)) {
          addError({
            code: "ID_DUPLICATE",
            category: "ids",
            lessonId,
            file: lessonFile,
            location: `${namedSecLoc}.id`,
            message: `معرّف المرحلة/القسم «${sec.id}» مكرّر داخل الدرس «${lessonId}» (ظهر سابقًا في sections[${seenSectionIds.get(sec.id)}]).`,
          });
        } else {
          seenSectionIds.set(sec.id, si);
        }

        if (sec.id === "quiz" || sec.id === "notebook") {
          addError({
            code: "STAGE_MISPLACED",
            category: "stages",
            lessonId,
            file: lessonFile,
            location: namedSecLoc,
            message: `المرحلة «${sec.id}» يجب أن تُعرَّف في الحقل المستقل \`content.${sec.id}\` وليس داخل \`content.sections\`.`,
          });
        } else if (!validStageIds.has(sec.id)) {
          addError({
            code: "STAGE_UNKNOWN",
            category: "stages",
            lessonId,
            file: lessonFile,
            location: namedSecLoc,
            message: `معرّف قسم غير معتمد «${sec.id}» في الدرس «${lessonId}» (المعرّفات المعتمدة: ${CANONICAL_SECTION_STAGE_IDS.join(", ")}).`,
          });
        } else {
          presentStages.add(sec.id);
          knownSectionOrder.push(sec.id);
        }
      }

      if (!isNonEmptyString(sec.title)) {
        addError({
          code: "SCHEMA_SECTION_TITLE_MISSING",
          category: "schema",
          lessonId,
          file: lessonFile,
          location: `${namedSecLoc}.title`,
          message: `عنوان القسم «${secId ?? si}» مفقود أو فارغ في الدرس «${lessonId}».`,
        });
      }

      if (sec.source !== undefined && !VALID_SOURCES.has(sec.source)) {
        addError({
          code: "SCHEMA_SOURCE_INVALID",
          category: "schema",
          lessonId,
          file: lessonFile,
          location: `${namedSecLoc}.source`,
          message: `قيمة source للقسم «${secId ?? si}» غير صالحة: «${String(sec.source)}».`,
        });
      }

      if (!Array.isArray(sec.blocks) || sec.blocks.length === 0) {
        addError({
          code: "SECTION_EMPTY",
          category: "stages",
          lessonId,
          file: lessonFile,
          location: `${namedSecLoc}.blocks`,
          message: `القسم «${secId ?? si}» في الدرس «${lessonId}» لا يحتوي أي كتل محتوى.`,
        });
        continue;
      }

      // فحص كل كتلة داخل القسم
      let hasInteractive = false;
      let hasExtraSource = false;
      let hasSummaryBlock = false;

      for (let bi = 0; bi < sec.blocks.length; bi += 1) {
        const block = sec.blocks[bi];
        const blockLoc = `${namedSecLoc} -> blocks[${bi}]${isPlainObject(block) && block.type ? ` (${block.type})` : ""}`;
        stats.auditedBlocks += 1;

        auditBlock({
          block,
          lessonId,
          lessonFile,
          location: blockLoc,
          inNotebook: false,
          allowedModes,
          declaredGeometryIds,
          implementedGeometryIds,
          implementedParallelIds,
          implementedValidators,
          figureRegistry,
          activityRegistry,
          exerciseRegistry,
          seenLessonActivityIds,
          seenLessonExerciseIds,
          seenGlobalActivityIds,
          seenGlobalExerciseIds,
          stats,
          addError,
          validateKatex,
          validateRichText,
        });

        if (isPlainObject(block)) {
          if (block.type === "activity" || block.type === "exercise" || block.type === "bookPractice") {
            hasInteractive = true;
          }
          if (block.source === "extra") hasExtraSource = true;
          if (block.type === "summary") hasSummaryBlock = true;
        }
      }

      // قواعد خاصة بكل مرحلة وفق معيار الدروس
      if (secId === "lab") {
        if (!hasInteractive) {
          addError({
            code: "LAB_STAGE_NO_INTERACTION",
            category: "stages",
            lessonId,
            file: lessonFile,
            location: namedSecLoc,
            message: `مرحلة المختبر (lab) في الدرس «${lessonId}» تفتقد نشاطًا تفاعليًا مسجّلًا.`,
          });
        }
        if (!hasExtraSource) {
          addError({
            code: "LAB_STAGE_MISSING_EXTRA_SOURCE",
            category: "stages",
            lessonId,
            file: lessonFile,
            location: namedSecLoc,
            message: `مرحلة المختبر (lab) في الدرس «${lessonId}» يجب أن تضم محتوى موسومًا \`source: "extra"\` وفق معيار الدروس.`,
          });
        }
      }

      if (secId === "summary" && !hasSummaryBlock) {
        addError({
          code: "SUMMARY_STAGE_MISSING_BLOCK",
          category: "stages",
          lessonId,
          file: lessonFile,
          location: namedSecLoc,
          message: `مرحلة الملخص (summary) في الدرس «${lessonId}» لا تحتوي أي كتلة من النوع \`summary\`.`,
        });
      }
    }

    // التحقق من وجود كل المراحل القسمية السبع
    for (const requiredStageId of CANONICAL_SECTION_STAGE_IDS) {
      if (!presentStages.has(requiredStageId)) {
        addError({
          code: "STAGE_MISSING",
          category: "stages",
          lessonId,
          file: lessonFile,
          location: `content.sections (missing "${requiredStageId}")`,
          message: `المرحلة المعتمدة «${requiredStageId}» مفقودة من الدرس المنشور «${lessonId}».`,
        });
      }
    }

    // التحقق من الترتيب المعتمد للأقسام (إن وُجدت دون تكرار)
    const dedupKnownOrder = [...new Set(knownSectionOrder)];
    const expectedSubsequence = CANONICAL_SECTION_STAGE_IDS.filter((id) =>
      dedupKnownOrder.includes(id),
    );
    const inOrder =
      dedupKnownOrder.length === expectedSubsequence.length &&
      dedupKnownOrder.every((id, idx) => id === expectedSubsequence[idx]);
    if (!inOrder) {
      addError({
        code: "STAGE_OUT_OF_ORDER",
        category: "stages",
        lessonId,
        file: lessonFile,
        location: "content.sections",
        message: `ترتيب المراحل في الدرس «${lessonId}» يخالف الترتيب المعتمد.\n  الفعلي:   [${dedupKnownOrder.join(" -> ")}]\n  المعتمد: [${expectedSubsequence.join(" -> ")}]`,
      });
    }
  }

  // ── 2) فحص مرحلة الاختبار (quiz — المرحلة 7) ──
  if (!isPlainObject(content.quiz)) {
    addError({
      code: "STAGE_MISSING",
      category: "stages",
      lessonId,
      file: lessonFile,
      location: "content.quiz",
      message: `المرحلة 7 (اختبار الدرس \`quiz\`) مفقودة من الدرس المنشور «${lessonId}».`,
    });
  } else {
    presentStages.add("quiz");
    auditQuiz({
      quiz: content.quiz,
      lessonId,
      lessonFile,
      seenQuizIds,
      seenQuestionIds,
      allPublishedQuestionIds,
      stats,
      addError,
      exceptionsApplied,
      validateKatex,
      validateRichText,
    });
  }

  // ── 3) فحص مرحلة دفتر الطالب (notebook — المرحلة 9) ──
  if (!isPlainObject(content.notebook)) {
    addError({
      code: "STAGE_MISSING",
      category: "stages",
      lessonId,
      file: lessonFile,
      location: "content.notebook",
      message: `المرحلة 9 (دفتر الطالب \`notebook\`) مفقودة من الدرس المنشور «${lessonId}».`,
    });
  } else {
    presentStages.add("notebook");
    auditNotebook({
      notebook: content.notebook,
      lessonId,
      lessonFile,
      allowedModes,
      declaredGeometryIds,
      implementedGeometryIds,
      implementedParallelIds,
      implementedValidators,
      figureRegistry,
      activityRegistry,
      exerciseRegistry,
      stats,
      addError,
      validateKatex,
      validateRichText,
    });
  }

  return presentStages;
}

function auditBlock({
  block,
  lessonId,
  lessonFile,
  location,
  inNotebook,
  allowedModes,
  declaredGeometryIds,
  implementedGeometryIds,
  implementedParallelIds,
  implementedValidators,
  figureRegistry,
  activityRegistry,
  exerciseRegistry,
  seenLessonActivityIds,
  seenLessonExerciseIds,
  seenGlobalActivityIds,
  seenGlobalExerciseIds,
  stats,
  addError,
  validateKatex,
  validateRichText,
}) {
  if (!isPlainObject(block)) {
    addError({
      code: "SCHEMA_BLOCK_INVALID",
      category: "schema",
      lessonId,
      file: lessonFile,
      location,
      message: "الكتلة يجب أن تكون كائنًا صالحًا.",
    });
    return;
  }

  if (typeof block.type !== "string" || !VALID_BLOCK_TYPES.has(block.type)) {
    addError({
      code: "SCHEMA_BLOCK_TYPE_INVALID",
      category: "schema",
      lessonId,
      file: lessonFile,
      location,
      message: `نوع الكتلة غير معروف: «${String(block.type)}».`,
    });
    return;
  }

  if (inNotebook && FORBIDDEN_NOTEBOOK_BLOCK_TYPES.has(block.type)) {
    addError({
      code: "NOTEBOOK_INTERACTIVE_BLOCK_FORBIDDEN",
      category: "schema",
      lessonId,
      file: lessonFile,
      location,
      message: `تُمنع الكتل التفاعلية («${block.type}») داخل دفتر الطالب وفق معيار الدروس.`,
    });
    return;
  }

  // فحص شارة المصدر `source` (باستثناء `summary` الذي يحمل المصدر على كل بند)
  if (block.type !== "summary") {
    if (typeof block.source !== "string" || !VALID_SOURCES.has(block.source)) {
      addError({
        code: "BLOCK_SOURCE_MISSING_OR_INVALID",
        category: "schema",
        lessonId,
        file: lessonFile,
        location: `${location}.source`,
        message: `الكتلة «${block.type}» يجب أن تحمل مصدرًا صريحًا (\`"book"\` أو \`"extra"\`)، القيمة الحالية: «${String(block.source)}».`,
      });
    }
  }

  switch (block.type) {
    case "text": {
      if (!isNonEmptyString(block.text)) {
        addError({
          code: "SCHEMA_TEXT_EMPTY",
          category: "schema",
          lessonId,
          file: lessonFile,
          location: `${location}.text`,
          message: "كتلة text تفتقد نصًا غير فارغ.",
        });
      } else {
        validateRichText(block.text, { lessonId, file: lessonFile, location: `${location}.text` });
      }
      break;
    }

    case "formula": {
      if (!isNonEmptyString(block.tex)) {
        addError({
          code: "SCHEMA_FORMULA_EMPTY",
          category: "schema",
          lessonId,
          file: lessonFile,
          location: `${location}.tex`,
          message: "كتلة formula تفتقد تعبيرًا رياضيًا `tex`.",
        });
      } else {
        validateKatex(block.tex, {
          lessonId,
          file: lessonFile,
          location: `${location}.tex`,
          display: true,
        });
      }
      if (block.note !== undefined) {
        if (!isNonEmptyString(block.note)) {
          addError({
            code: "SCHEMA_FORMULA_NOTE_EMPTY",
            category: "schema",
            lessonId,
            file: lessonFile,
            location: `${location}.note`,
            message: "حقل `note` في كتلة formula معرّف لكنه فارغ.",
          });
        } else {
          validateRichText(block.note, { lessonId, file: lessonFile, location: `${location}.note` });
        }
      }
      break;
    }

    case "example": {
      if (!isNonEmptyString(block.title)) {
        addError({
          code: "SCHEMA_EXAMPLE_TITLE_MISSING",
          category: "schema",
          lessonId,
          file: lessonFile,
          location: `${location}.title`,
          message: "عنوان المثال المحلول مفقود أو فارغ.",
        });
      } else {
        validateRichText(block.title, { lessonId, file: lessonFile, location: `${location}.title` });
      }
      if (!Array.isArray(block.steps) || block.steps.length === 0) {
        addError({
          code: "SCHEMA_EXAMPLE_STEPS_EMPTY",
          category: "schema",
          lessonId,
          file: lessonFile,
          location: `${location}.steps`,
          message: "المثال المحلول يجب أن يحتوي خطوة واحدة على الأقل.",
        });
      } else {
        for (let i = 0; i < block.steps.length; i += 1) {
          const step = block.steps[i];
          const stepLoc = `${location}.steps[${i}]`;
          if (!isPlainObject(step)) {
            addError({
              code: "SCHEMA_EXAMPLE_STEP_INVALID",
              category: "schema",
              lessonId,
              file: lessonFile,
              location: stepLoc,
              message: "خطوة المثال يجب أن تكون كائنًا صالحًا.",
            });
            continue;
          }
          const hasText = isNonEmptyString(step.text);
          const hasTex = isNonEmptyString(step.tex);
          if (!hasText && !hasTex) {
            addError({
              code: "SCHEMA_EXAMPLE_STEP_EMPTY",
              category: "schema",
              lessonId,
              file: lessonFile,
              location: stepLoc,
              message: "خطوة المثال يجب أن تحتوي نصًا `text` أو معادلة `tex` غير فارغين.",
            });
          }
          if (hasText) validateRichText(step.text, { lessonId, file: lessonFile, location: `${stepLoc}.text` });
          if (hasTex) validateKatex(step.tex, { lessonId, file: lessonFile, location: `${stepLoc}.tex`, display: false });
        }
      }
      break;
    }

    case "table": {
      if (!Array.isArray(block.headers) || block.headers.length === 0 || !block.headers.every(isNonEmptyString)) {
        addError({
          code: "SCHEMA_TABLE_HEADERS_INVALID",
          category: "schema",
          lessonId,
          file: lessonFile,
          location: `${location}.headers`,
          message: "رأس الجدول `headers` يجب أن يكون مصفوفة غير فارغة من النصوص.",
        });
      } else {
        for (let hi = 0; hi < block.headers.length; hi += 1) {
          validateRichText(block.headers[hi], {
            lessonId,
            file: lessonFile,
            location: `${location}.headers[${hi}]`,
          });
        }
      }
      if (!Array.isArray(block.rows) || block.rows.length === 0) {
        addError({
          code: "SCHEMA_TABLE_ROWS_EMPTY",
          category: "schema",
          lessonId,
          file: lessonFile,
          location: `${location}.rows`,
          message: "الجدول يجب أن يحتوي صفًا واحدًا على الأقل.",
        });
      } else {
        const expectedCols = Array.isArray(block.headers) ? block.headers.length : 0;
        for (let ri = 0; ri < block.rows.length; ri += 1) {
          const row = block.rows[ri];
          if (!Array.isArray(row)) {
            addError({
              code: "SCHEMA_TABLE_ROW_INVALID",
              category: "schema",
              lessonId,
              file: lessonFile,
              location: `${location}.rows[${ri}]`,
              message: "صف الجدول يجب أن يكون مصفوفة خلايا.",
            });
            continue;
          }
          if (expectedCols > 0 && row.length !== expectedCols) {
            addError({
              code: "TABLE_COLUMN_MISMATCH",
              category: "schema",
              lessonId,
              file: lessonFile,
              location: `${location}.rows[${ri}]`,
              message: `عدد خلايا الصف (${row.length}) لا يطابق عدد أعمدة رأس الجدول (${expectedCols}).`,
            });
          }
          for (let ci = 0; ci < row.length; ci += 1) {
            if (typeof row[ci] !== "string") {
              addError({
                code: "SCHEMA_TABLE_CELL_INVALID",
                category: "schema",
                lessonId,
                file: lessonFile,
                location: `${location}.rows[${ri}][${ci}]`,
                message: "خلية الجدول يجب أن تكون نصًا.",
              });
            } else {
              validateRichText(row[ci], {
                lessonId,
                file: lessonFile,
                location: `${location}.rows[${ri}][${ci}]`,
              });
            }
          }
        }
      }
      if (block.caption !== undefined && !isNonEmptyString(block.caption)) {
        addError({
          code: "SCHEMA_TABLE_CAPTION_EMPTY",
          category: "schema",
          lessonId,
          file: lessonFile,
          location: `${location}.caption`,
          message: "عنوان الجدول `caption` معرّف لكنه فارغ.",
        });
      }
      break;
    }

    case "figure": {
      if (!isNonEmptyString(block.figureId)) {
        addError({
          code: "SCHEMA_FIGURE_ID_MISSING",
          category: "registries",
          lessonId,
          file: lessonFile,
          location: `${location}.figureId`,
          message: "كتلة الرسم تفتقد `figureId` صالحًا.",
        });
      } else if (!figureRegistry.has(block.figureId)) {
        addError({
          code: "FIGURE_UNREGISTERED",
          category: "registries",
          lessonId,
          file: lessonFile,
          location: `${location}.figureId="${block.figureId}"`,
          message: `مرجع الرسم «${block.figureId}» غير مسجّل في FIGURE_REGISTRY (src/components/lesson/interactive/registry.tsx).`,
        });
      }
      if (block.caption !== undefined && !isNonEmptyString(block.caption)) {
        addError({
          code: "SCHEMA_FIGURE_CAPTION_EMPTY",
          category: "schema",
          lessonId,
          file: lessonFile,
          location: `${location}.caption`,
          message: "وصف الرسم `caption` معرّف لكنه فارغ.",
        });
      }
      break;
    }

    case "activity": {
      if (!isNonEmptyString(block.activityId)) {
        addError({
          code: "SCHEMA_ACTIVITY_ID_MISSING",
          category: "registries",
          lessonId,
          file: lessonFile,
          location: `${location}.activityId`,
          message: "كتلة النشاط تفتقد `activityId` صالحًا.",
        });
      } else {
        if (!activityRegistry.has(block.activityId)) {
          addError({
            code: "ACTIVITY_UNREGISTERED",
            category: "registries",
            lessonId,
            file: lessonFile,
            location: `${location}.activityId="${block.activityId}"`,
            message: `معرّف النشاط «${block.activityId}» غير مسجّل في ACTIVITY_REGISTRY.`,
          });
        }
        if (seenLessonActivityIds?.has(block.activityId)) {
          addError({
            code: "ID_DUPLICATE",
            category: "ids",
            lessonId,
            file: lessonFile,
            location: `${location}.activityId="${block.activityId}"`,
            message: `معرّف النشاط «${block.activityId}» مكرّر داخل الدرس «${lessonId}».`,
          });
        } else {
          seenLessonActivityIds?.add(block.activityId);
        }
        if (seenGlobalActivityIds?.has(block.activityId)) {
          const prev = seenGlobalActivityIds.get(block.activityId);
          if (prev.lessonId !== lessonId) {
            addError({
              code: "ID_DUPLICATE",
              category: "ids",
              lessonId,
              file: lessonFile,
              location: `${location}.activityId="${block.activityId}"`,
              message: `معرّف النشاط «${block.activityId}» مكرّر عبر درسين (مستخدم سابقًا في ${prev.lessonId} — ${prev.location}).`,
            });
          }
        } else {
          seenGlobalActivityIds?.set(block.activityId, { lessonId, location });
        }
      }
      if (block.prompt !== undefined) {
        if (!isNonEmptyString(block.prompt)) {
          addError({
            code: "SCHEMA_ACTIVITY_PROMPT_EMPTY",
            category: "schema",
            lessonId,
            file: lessonFile,
            location: `${location}.prompt`,
            message: "حقل `prompt` في كتلة النشاط معرّف لكنه فارغ.",
          });
        } else {
          validateRichText(block.prompt, { lessonId, file: lessonFile, location: `${location}.prompt` });
        }
      }
      break;
    }

    case "exercise": {
      if (!isNonEmptyString(block.exerciseId)) {
        addError({
          code: "SCHEMA_EXERCISE_ID_MISSING",
          category: "registries",
          lessonId,
          file: lessonFile,
          location: `${location}.exerciseId`,
          message: "كتلة التمرين تفتقد `exerciseId` صالحًا.",
        });
      } else {
        if (!exerciseRegistry.has(block.exerciseId)) {
          addError({
            code: "EXERCISE_UNREGISTERED",
            category: "registries",
            lessonId,
            file: lessonFile,
            location: `${location}.exerciseId="${block.exerciseId}"`,
            message: `معرّف التمرين «${block.exerciseId}» غير مسجّل في EXERCISE_REGISTRY.`,
          });
        }
        if (seenLessonExerciseIds?.has(block.exerciseId)) {
          addError({
            code: "ID_DUPLICATE",
            category: "ids",
            lessonId,
            file: lessonFile,
            location: `${location}.exerciseId="${block.exerciseId}"`,
            message: `معرّف التمرين «${block.exerciseId}» مكرّر داخل الدرس «${lessonId}».`,
          });
        } else {
          seenLessonExerciseIds?.add(block.exerciseId);
        }
        if (seenGlobalExerciseIds?.has(block.exerciseId)) {
          const prev = seenGlobalExerciseIds.get(block.exerciseId);
          if (prev.lessonId !== lessonId) {
            addError({
              code: "ID_DUPLICATE",
              category: "ids",
              lessonId,
              file: lessonFile,
              location: `${location}.exerciseId="${block.exerciseId}"`,
              message: `معرّف التمرين «${block.exerciseId}» مكرّر عبر درسين (مستخدم سابقًا في ${prev.lessonId} — ${prev.location}).`,
            });
          }
        } else {
          seenGlobalExerciseIds?.set(block.exerciseId, { lessonId, location });
        }
      }
      break;
    }

    case "bookPractice": {
      stats.auditedBookPractices += 1;
      auditBookPractice({
        block,
        lessonId,
        lessonFile,
        location,
        allowedModes,
        declaredGeometryIds,
        implementedGeometryIds,
        implementedParallelIds,
        implementedValidators,
        addError,
        validateRichText,
      });
      break;
    }

    case "summary": {
      if (!Array.isArray(block.points) || block.points.length === 0) {
        addError({
          code: "SCHEMA_SUMMARY_POINTS_EMPTY",
          category: "schema",
          lessonId,
          file: lessonFile,
          location: `${location}.points`,
          message: "كتلة الملخص يجب أن تحتوي بندًا واحدًا على الأقل.",
        });
      } else {
        for (let pi = 0; pi < block.points.length; pi += 1) {
          const pt = block.points[pi];
          const ptLoc = `${location}.points[${pi}]`;
          if (!isPlainObject(pt)) {
            addError({
              code: "SCHEMA_SUMMARY_POINT_INVALID",
              category: "schema",
              lessonId,
              file: lessonFile,
              location: ptLoc,
              message: "بند الملخص يجب أن يكون كائنًا صالحًا.",
            });
            continue;
          }
          if (!isNonEmptyString(pt.text)) {
            addError({
              code: "SCHEMA_SUMMARY_POINT_EMPTY",
              category: "schema",
              lessonId,
              file: lessonFile,
              location: `${ptLoc}.text`,
              message: "نص بند الملخص مفقود أو فارغ.",
            });
          } else {
            validateRichText(pt.text, { lessonId, file: lessonFile, location: `${ptLoc}.text` });
          }
          if (typeof pt.source !== "string" || !VALID_SOURCES.has(pt.source)) {
            addError({
              code: "SUMMARY_POINT_SOURCE_MISSING",
              category: "schema",
              lessonId,
              file: lessonFile,
              location: `${ptLoc}.source`,
              message: `بند الملخص يجب أن يحمل مصدرًا صريحًا (\`"book"\` أو \`"extra"\`)، القيمة الحالية: «${String(pt.source)}».`,
            });
          }
        }
      }
      break;
    }
  }
}

function auditBookPractice({
  block,
  lessonId,
  lessonFile,
  location,
  allowedModes,
  declaredGeometryIds,
  implementedGeometryIds,
  implementedParallelIds,
  implementedValidators,
  addError,
  validateRichText,
}) {
  if (block.source !== "book") {
    addError({
      code: "BOOK_PRACTICE_SOURCE_INVALID",
      category: "questions",
      lessonId,
      file: lessonFile,
      location: `${location}.source`,
      message: `تمارين \`bookPractice\` يجب أن تحمل \`source: "book"\`، القيمة الحالية: «${String(block.source)}».`,
    });
  }

  if (!isNonEmptyString(block.prompt)) {
    addError({
      code: "BOOK_PRACTICE_PROMPT_MISSING",
      category: "questions",
      lessonId,
      file: lessonFile,
      location: `${location}.prompt`,
      message: "نص تمرين الكتاب (`prompt`) مفقود أو فارغ.",
    });
  } else {
    validateRichText(block.prompt, { lessonId, file: lessonFile, location: `${location}.prompt` });
  }

  // التلميح والتفسير إلزاميان لكل تمرين كتابي
  if (!isNonEmptyString(block.hint)) {
    addError({
      code: "BOOK_PRACTICE_HINT_MISSING",
      category: "hints",
      lessonId,
      file: lessonFile,
      location: `${location}.hint`,
      message: "حقل التلميح `hint` مفقود أو فارغ في تمرين `bookPractice`.",
    });
  } else {
    validateRichText(block.hint, { lessonId, file: lessonFile, location: `${location}.hint` });
    if (HINT_LEAK_RE.test(block.hint)) {
      addError({
        code: "HINT_REVEALS_ANSWER",
        category: "hints",
        lessonId,
        file: lessonFile,
        location: `${location}.hint`,
        message: "التلميح يحتوي صياغة صريحة تكشف الإجابة الصحيحة.",
      });
    }
  }

  if (!isNonEmptyString(block.explanation)) {
    addError({
      code: "BOOK_PRACTICE_EXPLANATION_MISSING",
      category: "hints",
      lessonId,
      file: lessonFile,
      location: `${location}.explanation`,
      message: "حقل التفسير `explanation` مفقود أو فارغ في تمرين `bookPractice`.",
    });
  } else {
    validateRichText(block.explanation, {
      lessonId,
      file: lessonFile,
      location: `${location}.explanation`,
    });
  }

  if (
    isNonEmptyString(block.hint) &&
    isNonEmptyString(block.explanation) &&
    normalizeComparableText(block.hint) === normalizeComparableText(block.explanation)
  ) {
    addError({
      code: "HINT_DUPLICATES_EXPLANATION",
      category: "hints",
      lessonId,
      file: lessonFile,
      location: `${location}.hint`,
      message: "التلميح مطابق تمامًا لتفسير الإجابة في تمرين `bookPractice`.",
    });
  }

  if (typeof block.mode !== "string" || !allowedModes.has(block.mode)) {
    addError({
      code: "BOOK_PRACTICE_MODE_INVALID",
      category: "questions",
      lessonId,
      file: lessonFile,
      location: `${location}.mode`,
      message: `نمط التفاعل \`mode\` غير معتمد: «${String(block.mode)}» (المسموح: ${[...allowedModes].join(", ")}).`,
    });
    return;
  }

  switch (block.mode) {
    case "numberLine": {
      if (!Number.isInteger(block.min) || !Number.isInteger(block.max) || block.min >= block.max) {
        addError({
          code: "BOOK_PRACTICE_NUMBERLINE_INVALID",
          category: "questions",
          lessonId,
          file: lessonFile,
          location: `${location} (min/max)`,
          message: `تمرين مستقيم الأعداد يتطلب حدَّين صحيحَين \`min < max\` (الحالي: min=${String(block.min)}, max=${String(block.max)}).`,
        });
      }
      if (!Array.isArray(block.targets) || block.targets.length === 0) {
        addError({
          code: "BOOK_PRACTICE_NUMBERLINE_TARGETS_MISSING",
          category: "questions",
          lessonId,
          file: lessonFile,
          location: `${location}.targets`,
          message: "تمرين مستقيم الأعداد يفتقد مصفوفة القيم المطلوبة `targets`.",
        });
      } else {
        const seenTargets = new Set();
        for (let i = 0; i < block.targets.length; i += 1) {
          const val = block.targets[i];
          if (!Number.isInteger(val)) {
            addError({
              code: "BOOK_PRACTICE_NUMBERLINE_TARGET_INVALID",
              category: "questions",
              lessonId,
              file: lessonFile,
              location: `${location}.targets[${i}]`,
              message: `القيمة المستهدفة «${String(val)}» ليست عددًا صحيحًا.`,
            });
          } else {
            if (Number.isInteger(block.min) && Number.isInteger(block.max) && (val < block.min || val > block.max)) {
              addError({
                code: "BOOK_PRACTICE_NUMBERLINE_TARGET_OUT_OF_RANGE",
                category: "questions",
                lessonId,
                file: lessonFile,
                location: `${location}.targets[${i}]`,
                message: `القيمة المستهدفة ${val} تقع خارج نطاق مستقيم الأعداد [${block.min}, ${block.max}].`,
              });
            }
            if (seenTargets.has(val)) {
              addError({
                code: "BOOK_PRACTICE_NUMBERLINE_TARGET_DUPLICATE",
                category: "questions",
                lessonId,
                file: lessonFile,
                location: `${location}.targets[${i}]`,
                message: `القيمة المستهدفة ${val} مكرّرة في \`targets\`.`,
              });
            }
            seenTargets.add(val);
          }
        }
      }
      break;
    }

    case "classify": {
      if (!Array.isArray(block.items) || block.items.length === 0 || !block.items.every(isNonEmptyString)) {
        addError({
          code: "BOOK_PRACTICE_CLASSIFY_ITEMS_INVALID",
          category: "questions",
          lessonId,
          file: lessonFile,
          location: `${location}.items`,
          message: "تمرين التصنيف يتطلب مصفوفة عناصر غير فارغة `items`.",
        });
      }
      if (!Array.isArray(block.buckets) || block.buckets.length < 2) {
        addError({
          code: "BOOK_PRACTICE_CLASSIFY_BUCKETS_INVALID",
          category: "questions",
          lessonId,
          file: lessonFile,
          location: `${location}.buckets`,
          message: "تمرين التصنيف يتطلب خانتَين على الأقل في `buckets`.",
        });
      }
      if (Array.isArray(block.items) && Array.isArray(block.buckets)) {
        const itemSet = new Set();
        for (let i = 0; i < block.items.length; i += 1) {
          const item = block.items[i];
          if (typeof item === "string") {
            validateRichText(item, { lessonId, file: lessonFile, location: `${location}.items[${i}]` });
            if (itemSet.has(item)) {
              addError({
                code: "BOOK_PRACTICE_CLASSIFY_DUPLICATE_ITEM",
                category: "questions",
                lessonId,
                file: lessonFile,
                location: `${location}.items[${i}]`,
                message: `العنصر «${item}» مكرّر في \`items\`.`,
              });
            }
            itemSet.add(item);
          }
        }

        const seenBucketLabels = new Set();
        const assignedCounts = new Map();

        for (let bi = 0; bi < block.buckets.length; bi += 1) {
          const bucket = block.buckets[bi];
          const bLoc = `${location}.buckets[${bi}]`;
          if (!isPlainObject(bucket) || !isNonEmptyString(bucket.label)) {
            addError({
              code: "BOOK_PRACTICE_CLASSIFY_BUCKET_INVALID",
              category: "questions",
              lessonId,
              file: lessonFile,
              location: bLoc,
              message: "خانة التصنيف تفتقد تسمية `label` غير فارغة.",
            });
            continue;
          }
          if (seenBucketLabels.has(bucket.label)) {
            addError({
              code: "BOOK_PRACTICE_CLASSIFY_BUCKET_DUPLICATE",
              category: "questions",
              lessonId,
              file: lessonFile,
              location: `${bLoc}.label`,
              message: `اسم خانة التصنيف «${bucket.label}» مكرّر.`,
            });
          }
          seenBucketLabels.add(bucket.label);

          if (!Array.isArray(bucket.items)) {
            addError({
              code: "BOOK_PRACTICE_CLASSIFY_BUCKET_ITEMS_INVALID",
              category: "questions",
              lessonId,
              file: lessonFile,
              location: `${bLoc}.items`,
              message: `حقل \`items\` في خانة «${bucket.label}» يجب أن يكون مصفوفة.`,
            });
            continue;
          }
          for (const bItem of bucket.items) {
            if (!itemSet.has(bItem)) {
              addError({
                code: "BOOK_PRACTICE_CLASSIFY_UNKNOWN_BUCKET_ITEM",
                category: "questions",
                lessonId,
                file: lessonFile,
                location: `${bLoc}.items`,
                message: `العنصر «${String(bItem)}» في خانة «${bucket.label}» غير موجود ضمن قائمة \`items\` الرئيسية.`,
              });
            } else {
              assignedCounts.set(bItem, (assignedCounts.get(bItem) ?? 0) + 1);
            }
          }
        }

        for (const item of itemSet) {
          const count = assignedCounts.get(item) ?? 0;
          if (count === 0) {
            addError({
              code: "BOOK_PRACTICE_CLASSIFY_UNASSIGNED_ITEM",
              category: "questions",
              lessonId,
              file: lessonFile,
              location: `${location}.buckets`,
              message: `العنصر «${item}» غير مصنّف ضمن أي خانة في \`buckets\`، فلا يمكن حل التمرين.`,
            });
          } else if (count > 1) {
            addError({
              code: "BOOK_PRACTICE_CLASSIFY_AMBIGUOUS_ITEM",
              category: "questions",
              lessonId,
              file: lessonFile,
              location: `${location}.buckets`,
              message: `العنصر «${item}» يظهر في أكثر من خانة (${count}) داخل \`buckets\`.`,
            });
          }
        }
      }
      break;
    }

    case "setEntry": {
      if (!Array.isArray(block.expectedSet) || block.expectedSet.length === 0) {
        addError({
          code: "BOOK_PRACTICE_SETENTRY_MISSING",
          category: "questions",
          lessonId,
          file: lessonFile,
          location: `${location}.expectedSet`,
          message: "تمرين `setEntry` يتطلب مصفوفة غير فارغة `expectedSet`.",
        });
      } else {
        const seenNormalized = new Set();
        for (let i = 0; i < block.expectedSet.length; i += 1) {
          const raw = block.expectedSet[i];
          if (!isNonEmptyString(raw)) {
            addError({
              code: "BOOK_PRACTICE_SETENTRY_VALUE_EMPTY",
              category: "questions",
              lessonId,
              file: lessonFile,
              location: `${location}.expectedSet[${i}]`,
              message: "قيمة فارغة أو غير نصية داخل `expectedSet`.",
            });
            continue;
          }
          const norm = normalizeAnswer(raw);
          if (seenNormalized.has(norm)) {
            addError({
              code: "BOOK_PRACTICE_SETENTRY_DUPLICATE",
              category: "questions",
              lessonId,
              file: lessonFile,
              location: `${location}.expectedSet[${i}]`,
              message: `القيمة «${raw}» مكرّرة في \`expectedSet\`.`,
            });
          }
          seenNormalized.add(norm);
        }
      }
      break;
    }

    case "form": {
      if (!Array.isArray(block.fields) || block.fields.length === 0) {
        addError({
          code: "BOOK_PRACTICE_FORM_FIELDS_MISSING",
          category: "questions",
          lessonId,
          file: lessonFile,
          location: `${location}.fields`,
          message: "تمرين `form` يتطلب حقل إدخال واحدًا على الأقل في `fields`.",
        });
      } else {
        for (let fi = 0; fi < block.fields.length; fi += 1) {
          const field = block.fields[fi];
          const fLoc = `${location}.fields[${fi}]`;
          if (!isPlainObject(field) || !isNonEmptyString(field.label)) {
            addError({
              code: "BOOK_PRACTICE_FORM_FIELD_INVALID",
              category: "questions",
              lessonId,
              file: lessonFile,
              location: fLoc,
              message: "حقل النموذج يفتقد تسمية `label` غير فارغة.",
            });
            continue;
          }
          if (field.expected !== undefined) {
            if (typeof field.expected === "string") {
              if (!isNonEmptyString(field.expected)) {
                addError({
                  code: "BOOK_PRACTICE_FORM_EXPECTED_EMPTY",
                  category: "questions",
                  lessonId,
                  file: lessonFile,
                  location: `${fLoc}.expected`,
                  message: `قيمة \`expected\` للحقل «${field.label}» نص فارغ.`,
                });
              }
            } else if (Array.isArray(field.expected)) {
              if (field.expected.length === 0 || !field.expected.every(isNonEmptyString)) {
                addError({
                  code: "BOOK_PRACTICE_FORM_EXPECTED_INVALID",
                  category: "questions",
                  lessonId,
                  file: lessonFile,
                  location: `${fLoc}.expected`,
                  message: `مصفوفة \`expected\` للحقل «${field.label}» يجب أن تكون غير فارغة ومن نصوص صالحة.`,
                });
              }
            } else {
              addError({
                code: "BOOK_PRACTICE_FORM_EXPECTED_INVALID",
                category: "questions",
                lessonId,
                file: lessonFile,
                location: `${fLoc}.expected`,
                message: `قيمة \`expected\` للحقل «${field.label}» يجب أن تكون نصًا أو مصفوفة نصوص.`,
              });
            }
          }
          if (field.hint !== undefined && !isNonEmptyString(field.hint)) {
            addError({
              code: "BOOK_PRACTICE_FORM_FIELD_HINT_EMPTY",
              category: "hints",
              lessonId,
              file: lessonFile,
              location: `${fLoc}.hint`,
              message: `حقل \`hint\` الفرعي لـ «${field.label}» معرّف لكنه فارغ.`,
            });
          }
        }
      }
      if (block.fieldsLayout !== undefined && block.fieldsLayout !== "table") {
        addError({
          code: "BOOK_PRACTICE_FIELDS_LAYOUT_INVALID",
          category: "schema",
          lessonId,
          file: lessonFile,
          location: `${location}.fieldsLayout`,
          message: `قيمة \`fieldsLayout\` غير صالحة: «${String(block.fieldsLayout)}» (المسموح: "table").`,
        });
      }
      if (block.validator !== undefined) {
        if (typeof block.validator !== "string" || !implementedValidators.has(block.validator)) {
          addError({
            code: "BOOK_PRACTICE_VALIDATOR_UNREGISTERED",
            category: "questions",
            lessonId,
            file: lessonFile,
            location: `${location}.validator="${String(block.validator)}"`,
            message: `المُحقّق «${String(block.validator)}» غير منفّذ في BookPracticeActivity.tsx.`,
          });
        }
      }
      break;
    }

    case "geometry": {
      if (!isNonEmptyString(block.geometryId)) {
        addError({
          code: "BOOK_PRACTICE_GEOMETRY_ID_MISSING",
          category: "registries",
          lessonId,
          file: lessonFile,
          location: `${location}.geometryId`,
          message: "تمرين `geometry` يفتقد `geometryId`.",
        });
      } else {
        const isParallel = block.geometryId.startsWith("parallel-");
        const targetSet = isParallel ? implementedParallelIds : implementedGeometryIds;
        const targetComp = isParallel ? "ParallelBookPractice.tsx" : "GeometryBookPractice.tsx";
        if (!targetSet.has(block.geometryId)) {
          addError({
            code: "GEOMETRY_ID_UNREGISTERED",
            category: "registries",
            lessonId,
            file: lessonFile,
            location: `${location}.geometryId="${block.geometryId}"`,
            message: `المعرّف الهندسي «${block.geometryId}» غير مسجّل/غير منفّذ في ${targetComp}.`,
          });
        }
        if (declaredGeometryIds.size > 0 && !declaredGeometryIds.has(block.geometryId)) {
          addError({
            code: "GEOMETRY_ID_UNDECLARED",
            category: "schema",
            lessonId,
            file: lessonFile,
            location: `${location}.geometryId="${block.geometryId}"`,
            message: `المعرّف الهندسي «${block.geometryId}» غير مدرج في نوع BookPracticeBlock["geometryId"] داخل src/content/types.ts.`,
          });
        }
      }
      break;
    }

    case "reflection":
      break;
  }
}

function auditQuiz({
  quiz,
  lessonId,
  lessonFile,
  seenQuizIds,
  seenQuestionIds,
  allPublishedQuestionIds,
  stats,
  addError,
  exceptionsApplied,
  validateKatex,
  validateRichText,
}) {
  if (!isNonEmptyString(quiz.id) || !VALID_SLUG_RE.test(quiz.id)) {
    addError({
      code: "QUIZ_ID_INVALID",
      category: "ids",
      lessonId,
      file: lessonFile,
      location: "quiz.id",
      message: `معرّف الاختبار غير صالح في الدرس «${lessonId}»: «${String(quiz.id)}».`,
    });
  } else if (seenQuizIds.has(quiz.id)) {
    addError({
      code: "ID_DUPLICATE",
      category: "ids",
      lessonId,
      file: lessonFile,
      location: "quiz.id",
      message: `معرّف الاختبار «${quiz.id}» مكرّر (مستخدم سابقًا في الدرس «${seenQuizIds.get(quiz.id)}»).`,
    });
  } else {
    seenQuizIds.set(quiz.id, lessonId);
  }

  if (quiz.title !== undefined && !isNonEmptyString(quiz.title)) {
    addError({
      code: "SCHEMA_QUIZ_TITLE_EMPTY",
      category: "schema",
      lessonId,
      file: lessonFile,
      location: "quiz.title",
      message: `عنوان الاختبار في الدرس «${lessonId}» معرّف لكنه فارغ.`,
    });
  }

  if (!Array.isArray(quiz.questions) || quiz.questions.length < MIN_QUIZ_QUESTIONS) {
    addError({
      code: "QUIZ_TOO_FEW_QUESTIONS",
      category: "questions",
      lessonId,
      file: lessonFile,
      location: "quiz.questions",
      message: `اختبار الدرس «${lessonId}» يجب أن يضم ${MIN_QUIZ_QUESTIONS} أسئلة على الأقل وفق معيار الدروس (الحالي: ${Array.isArray(quiz.questions) ? quiz.questions.length : 0}).`,
    });
    if (!Array.isArray(quiz.questions)) return;
  }

  const seenInQuiz = new Set();
  const isHintExempt = DOCUMENTED_QUIZ_HINT_EXEMPTIONS.has(lessonId);
  let exemptedHintsCount = 0;

  for (let qi = 0; qi < quiz.questions.length; qi += 1) {
    const q = quiz.questions[qi];
    const qLoc = `quiz.questions[${qi}]${isPlainObject(q) && q.id ? ` (id="${q.id}")` : ""}`;
    stats.auditedQuizQuestions += 1;

    if (!isPlainObject(q)) {
      addError({
        code: "QUIZ_QUESTION_INVALID",
        category: "questions",
        lessonId,
        file: lessonFile,
        location: qLoc,
        message: "السؤال في الاختبار يجب أن يكون كائنًا صالحًا.",
      });
      continue;
    }

    if (!isNonEmptyString(q.id)) {
      addError({
        code: "QUIZ_QUESTION_ID_MISSING",
        category: "ids",
        lessonId,
        file: lessonFile,
        location: `${qLoc}.id`,
        message: `معرّف السؤال رقم ${qi + 1} في اختبار الدرس «${lessonId}» مفقود أو فارغ.`,
      });
    } else {
      if (seenInQuiz.has(q.id)) {
        addError({
          code: "ID_DUPLICATE",
          category: "ids",
          lessonId,
          file: lessonFile,
          location: `${qLoc}.id`,
          message: `معرّف السؤال «${q.id}» مكرّر داخل اختبار الدرس «${lessonId}».`,
        });
      } else {
        seenInQuiz.add(q.id);
      }

      if (seenQuestionIds.has(q.id)) {
        const prev = seenQuestionIds.get(q.id);
        if (prev.lessonId !== lessonId) {
          addError({
            code: "ID_DUPLICATE",
            category: "ids",
            lessonId,
            file: lessonFile,
            location: `${qLoc}.id`,
            message: `معرّف السؤال «${q.id}» مكرّر عبر أكثر من درس (مستخدم سابقًا في ${prev.lessonId}).`,
          });
        }
      } else {
        seenQuestionIds.set(q.id, { lessonId, location: qLoc });
      }
      allPublishedQuestionIds.add(q.id);
    }

    if (!isNonEmptyString(q.prompt)) {
      addError({
        code: "QUIZ_QUESTION_PROMPT_MISSING",
        category: "questions",
        lessonId,
        file: lessonFile,
        location: `${qLoc}.prompt`,
        message: `نص السؤال في ${qLoc} مفقود أو فارغ.`,
      });
    } else {
      validateRichText(q.prompt, { lessonId, file: lessonFile, location: `${qLoc}.prompt` });
    }

    if (q.tex !== undefined) {
      validateKatex(q.tex, { lessonId, file: lessonFile, location: `${qLoc}.tex`, display: false });
    }

    // الخيارات والإجابة الصحيحة
    const choiceById = new Map();
    if (!Array.isArray(q.choices)) {
      addError({
        code: "QUIZ_TOO_FEW_CHOICES",
        category: "questions",
        lessonId,
        file: lessonFile,
        location: `${qLoc}.choices`,
        message: `السؤال ${qLoc} يفتقد مصفوفة الخيارات \`choices\`.`,
      });
    } else {
      if (q.choices.length < MIN_QUIZ_CHOICES) {
        addError({
          code: "QUIZ_TOO_FEW_CHOICES",
          category: "questions",
          lessonId,
          file: lessonFile,
          location: `${qLoc}.choices`,
          message: `السؤال ${qLoc} يجب أن يحتوي خيارَين على الأقل (الحالي: ${q.choices.length}).`,
        });
      }
      const seenChoiceContent = new Set();
      for (let ci = 0; ci < q.choices.length; ci += 1) {
        const ch = q.choices[ci];
        const chLoc = `${qLoc}.choices[${ci}]`;
        if (!isPlainObject(ch)) {
          addError({
            code: "QUIZ_CHOICE_INVALID",
            category: "questions",
            lessonId,
            file: lessonFile,
            location: chLoc,
            message: "خيار السؤال يجب أن يكون كائنًا صالحًا.",
          });
          continue;
        }
        if (!isNonEmptyString(ch.id)) {
          addError({
            code: "QUIZ_CHOICE_ID_MISSING",
            category: "ids",
            lessonId,
            file: lessonFile,
            location: `${chLoc}.id`,
            message: `معرّف الخيار رقم ${ci + 1} مفقود في ${qLoc}.`,
          });
        } else if (choiceById.has(ch.id)) {
          addError({
            code: "ID_DUPLICATE",
            category: "ids",
            lessonId,
            file: lessonFile,
            location: `${chLoc}.id`,
            message: `معرّف الخيار «${ch.id}» مكرّر داخل السؤال ${qLoc}.`,
          });
        } else {
          choiceById.set(ch.id, ch);
        }

        const hasChoiceText = isNonEmptyString(ch.text);
        const hasChoiceTex = isNonEmptyString(ch.tex);
        if (typeof ch.text !== "string" || (!hasChoiceText && !hasChoiceTex)) {
          addError({
            code: "QUIZ_CHOICE_TEXT_MISSING",
            category: "questions",
            lessonId,
            file: lessonFile,
            location: `${chLoc}.text`,
            message: `الخيار «${ch.id ?? ci}» في ${qLoc} يفتقد نصًا أو معادلة صالحة.`,
          });
        } else {
          if (hasChoiceText) validateRichText(ch.text, { lessonId, file: lessonFile, location: `${chLoc}.text` });
          if (hasChoiceTex) validateKatex(ch.tex, { lessonId, file: lessonFile, location: `${chLoc}.tex`, display: false });
          const contentSig = `${normalizeComparableText(ch.text)}|${(ch.tex ?? "").trim()}`;
          if (seenChoiceContent.has(contentSig)) {
            addError({
              code: "QUIZ_CHOICE_DUPLICATE_TEXT",
              category: "questions",
              lessonId,
              file: lessonFile,
              location: chLoc,
              message: `خيار مكرّر المحتوى («${ch.text}») داخل السؤال ${qLoc}.`,
            });
          }
          seenChoiceContent.add(contentSig);
        }
      }
    }

    if (!isNonEmptyString(q.correctChoiceId)) {
      addError({
        code: "QUIZ_CORRECT_CHOICE_MISSING",
        category: "questions",
        lessonId,
        file: lessonFile,
        location: `${qLoc}.correctChoiceId`,
        message: `معرّف الإجابة الصحيحة \`correctChoiceId\` مفقود في ${qLoc}.`,
      });
    } else if (Array.isArray(q.choices) && !choiceById.has(q.correctChoiceId)) {
      addError({
        code: "QUIZ_CORRECT_CHOICE_INVALID",
        category: "questions",
        lessonId,
        file: lessonFile,
        location: `${qLoc}.correctChoiceId="${q.correctChoiceId}"`,
        message: `معرّف الإجابة الصحيحة «${q.correctChoiceId}» لا يطابق أي خيار في ${qLoc} (الخيارات المتاحة: ${[...choiceById.keys()].join(", ") || "لا يوجد"}).`,
      });
    }

    // التفسير (إلزامي لجميع الدروس بما فيها lesson-1-1)
    const hasExplanation = isNonEmptyString(q.explanation);
    const hasExplanationTex = isNonEmptyString(q.explanationTex);
    if (!hasExplanation && !hasExplanationTex) {
      addError({
        code: "QUIZ_EXPLANATION_MISSING",
        category: "hints",
        lessonId,
        file: lessonFile,
        location: `${qLoc}.explanation`,
        message: `تفسير الإجابة (\`explanation\` أو \`explanationTex\`) مفقود في ${qLoc}.`,
      });
    } else {
      if (hasExplanation) {
        validateRichText(q.explanation, { lessonId, file: lessonFile, location: `${qLoc}.explanation` });
      }
      if (hasExplanationTex) {
        validateKatex(q.explanationTex, {
          lessonId,
          file: lessonFile,
          location: `${qLoc}.explanationTex`,
          display: false,
        });
      }
    }

    // التلميح (إلزامي لكل الدروس عدا الاستثناء الموثّق لـ lesson-1-1)
    if (q.hint === undefined) {
      if (isHintExempt) {
        exemptedHintsCount += 1;
      } else {
        addError({
          code: "QUIZ_HINT_MISSING",
          category: "hints",
          lessonId,
          file: lessonFile,
          location: `${qLoc}.hint`,
          message: `حقل التلميح الصريح \`hint\` مفقود في ${qLoc} (إلزامي لجميع الدروس عدا الاستثناء الموثّق لـ lesson-1-1).`,
        });
      }
    } else if (!isNonEmptyString(q.hint)) {
      addError({
        code: "QUIZ_HINT_INVALID",
        category: "hints",
        lessonId,
        file: lessonFile,
        location: `${qLoc}.hint`,
        message: `حقل التلميح \`hint\` في ${qLoc} معرّف لكنه فارغ أو غير نصي.`,
      });
    } else {
      validateRichText(q.hint, { lessonId, file: lessonFile, location: `${qLoc}.hint` });
      if (HINT_LEAK_RE.test(q.hint)) {
        addError({
          code: "HINT_REVEALS_ANSWER",
          category: "hints",
          lessonId,
          file: lessonFile,
          location: `${qLoc}.hint`,
          message: `تلميح السؤال ${qLoc} يحتوي عبارة تكشف الإجابة الصحيحة مباشرة.`,
        });
      }
      const correctChoice = choiceById.get(q.correctChoiceId);
      if (
        correctChoice &&
        isNonEmptyString(correctChoice.text) &&
        normalizeComparableText(q.hint) === normalizeComparableText(correctChoice.text)
      ) {
        addError({
          code: "HINT_EQUALS_CORRECT_CHOICE",
          category: "hints",
          lessonId,
          file: lessonFile,
          location: `${qLoc}.hint`,
          message: `تلميح السؤال ${qLoc} مطابق حرفيًا لنص الخيار الصحيح.`,
        });
      }
      if (
        hasExplanation &&
        normalizeComparableText(q.hint) === normalizeComparableText(q.explanation)
      ) {
        addError({
          code: "HINT_DUPLICATES_EXPLANATION",
          category: "hints",
          lessonId,
          file: lessonFile,
          location: `${qLoc}.hint`,
          message: `تلميح السؤال ${qLoc} ينسخ تفسير الإجابة كاملًا بدل تقديم تلميح تدريجي.`,
        });
      }
    }
  }

  if (exemptedHintsCount > 0) {
    exceptionsApplied.push({
      lessonId,
      rule: "QUIZ_HINT_EXEMPTION",
      reference: "docs/lesson-standard.md (§5.7 & §13)",
      detail: `احتُرم الاستثناء الموثّق لـ ${lessonId}: ${exemptedHintsCount} سؤال اختبار بلا حقل hint صريح (يعتمد على explanation وhintFor الاحتياطية).`,
    });
  }
}

function auditNotebook({
  notebook,
  lessonId,
  lessonFile,
  allowedModes,
  declaredGeometryIds,
  implementedGeometryIds,
  implementedParallelIds,
  implementedValidators,
  figureRegistry,
  activityRegistry,
  exerciseRegistry,
  stats,
  addError,
  validateKatex,
  validateRichText,
}) {
  if (!isNonEmptyString(notebook.title)) {
    addError({
      code: "SCHEMA_NOTEBOOK_TITLE_MISSING",
      category: "schema",
      lessonId,
      file: lessonFile,
      location: "notebook.title",
      message: `عنوان دفتر الطالب مفقود أو فارغ في الدرس «${lessonId}».`,
    });
  }
  if (notebook.intro !== undefined) {
    if (!isNonEmptyString(notebook.intro)) {
      addError({
        code: "SCHEMA_NOTEBOOK_INTRO_EMPTY",
        category: "schema",
        lessonId,
        file: lessonFile,
        location: "notebook.intro",
        message: `مقدمة دفتر الطالب في الدرس «${lessonId}» معرّفة لكنها فارغة.`,
      });
    } else {
      validateRichText(notebook.intro, { lessonId, file: lessonFile, location: "notebook.intro" });
    }
  }

  if (!Array.isArray(notebook.groups) || notebook.groups.length === 0) {
    addError({
      code: "SCHEMA_NOTEBOOK_GROUPS_EMPTY",
      category: "schema",
      lessonId,
      file: lessonFile,
      location: "notebook.groups",
      message: `دفتر الطالب في الدرس «${lessonId}» لا يحتوي أي فقرات (\`groups\`).`,
    });
    return;
  }

  for (let gi = 0; gi < notebook.groups.length; gi += 1) {
    const group = notebook.groups[gi];
    const gLoc = `notebook.groups[${gi}]`;
    stats.auditedNotebookGroups += 1;

    if (!isPlainObject(group)) {
      addError({
        code: "SCHEMA_NOTEBOOK_GROUP_INVALID",
        category: "schema",
        lessonId,
        file: lessonFile,
        location: gLoc,
        message: "فقرة دفتر الطالب يجب أن تكون كائنًا صالحًا.",
      });
      continue;
    }

    if (!isNonEmptyString(group.heading)) {
      addError({
        code: "SCHEMA_NOTEBOOK_HEADING_MISSING",
        category: "schema",
        lessonId,
        file: lessonFile,
        location: `${gLoc}.heading`,
        message: `عنوان الفقرة رقم ${gi + 1} في دفتر الطالب مفقود.`,
      });
    }

    if (!Array.isArray(group.lines)) {
      addError({
        code: "SCHEMA_NOTEBOOK_LINES_INVALID",
        category: "schema",
        lessonId,
        file: lessonFile,
        location: `${gLoc}.lines`,
        message: `حقل \`lines\` في ${gLoc} يجب أن يكون مصفوفة.`,
      });
    }

    const linesCount = Array.isArray(group.lines) ? group.lines.length : 0;
    const blocksCount = Array.isArray(group.blocks) ? group.blocks.length : 0;
    const figuresCount = Array.isArray(group.figures) ? group.figures.length : 0;

    if (linesCount + blocksCount + figuresCount === 0) {
      addError({
        code: "NOTEBOOK_GROUP_EMPTY",
        category: "schema",
        lessonId,
        file: lessonFile,
        location: gLoc,
        message: `الفقرة «${group.heading ?? gi}» في دفتر الطالب فارغة تمامًا (لا أسطر ولا كتل ولا رسوم).`,
      });
    }

    if (Array.isArray(group.lines)) {
      for (let li = 0; li < group.lines.length; li += 1) {
        const line = group.lines[li];
        const lLoc = `${gLoc}.lines[${li}]`;
        if (!isPlainObject(line)) {
          addError({
            code: "SCHEMA_NOTEBOOK_LINE_INVALID",
            category: "schema",
            lessonId,
            file: lessonFile,
            location: lLoc,
            message: "سطر دفتر الطالب يجب أن يكون كائنًا صالحًا.",
          });
          continue;
        }
        if (typeof line.source !== "string" || !VALID_SOURCES.has(line.source)) {
          addError({
            code: "NOTEBOOK_LINE_SOURCE_MISSING",
            category: "schema",
            lessonId,
            file: lessonFile,
            location: `${lLoc}.source`,
            message: `سطر دفتر الطالب يجب أن يحمل مصدرًا صريحًا (\`"book"\` أو \`"extra"\`).`,
          });
        }
        const hasText = isNonEmptyString(line.text);
        const hasTex = isNonEmptyString(line.tex);
        if (!hasText && !hasTex) {
          addError({
            code: "SCHEMA_NOTEBOOK_LINE_EMPTY",
            category: "schema",
            lessonId,
            file: lessonFile,
            location: lLoc,
            message: "سطر دفتر الطالب يجب أن يحتوي نصًا `text` أو معادلة `tex` غير فارغين.",
          });
        }
        if (hasText) validateRichText(line.text, { lessonId, file: lessonFile, location: `${lLoc}.text` });
        if (hasTex) validateKatex(line.tex, { lessonId, file: lessonFile, location: `${lLoc}.tex`, display: false });
      }
    }

    if (group.blocks !== undefined) {
      if (!Array.isArray(group.blocks)) {
        addError({
          code: "SCHEMA_NOTEBOOK_BLOCKS_INVALID",
          category: "schema",
          lessonId,
          file: lessonFile,
          location: `${gLoc}.blocks`,
          message: `حقل \`blocks\` في ${gLoc} يجب أن يكون مصفوفة.`,
        });
      } else {
        for (let bi = 0; bi < group.blocks.length; bi += 1) {
          const b = group.blocks[bi];
          const bLoc = `${gLoc}.blocks[${bi}]${isPlainObject(b) && b.type ? ` (${b.type})` : ""}`;
          auditBlock({
            block: b,
            lessonId,
            lessonFile,
            location: bLoc,
            inNotebook: true,
            allowedModes,
            declaredGeometryIds,
            implementedGeometryIds,
            implementedParallelIds,
            implementedValidators,
            figureRegistry,
            activityRegistry,
            exerciseRegistry,
            seenLessonActivityIds: null,
            seenLessonExerciseIds: null,
            seenGlobalActivityIds: null,
            seenGlobalExerciseIds: null,
            stats,
            addError,
            validateKatex,
            validateRichText,
          });
        }
      }
    }

    if (group.figures !== undefined) {
      if (!Array.isArray(group.figures)) {
        addError({
          code: "SCHEMA_NOTEBOOK_FIGURES_INVALID",
          category: "schema",
          lessonId,
          file: lessonFile,
          location: `${gLoc}.figures`,
          message: `حقل \`figures\` في ${gLoc} يجب أن يكون مصفوفة.`,
        });
      } else {
        const seenGroupFigures = new Set();
        for (let fi = 0; fi < group.figures.length; fi += 1) {
          const fig = group.figures[fi];
          const fLoc = `${gLoc}.figures[${fi}]`;
          if (!isPlainObject(fig)) {
            addError({
              code: "SCHEMA_NOTEBOOK_FIGURE_INVALID",
              category: "schema",
              lessonId,
              file: lessonFile,
              location: fLoc,
              message: "رسم دفتر الطالب يجب أن يكون كائنًا صالحًا.",
            });
            continue;
          }
          if (!isNonEmptyString(fig.figureId)) {
            addError({
              code: "SCHEMA_FIGURE_ID_MISSING",
              category: "registries",
              lessonId,
              file: lessonFile,
              location: `${fLoc}.figureId`,
              message: "معرّف الرسم في دفتر الطالب مفقود.",
            });
          } else {
            if (!figureRegistry.has(fig.figureId)) {
              addError({
                code: "FIGURE_UNREGISTERED",
                category: "registries",
                lessonId,
                file: lessonFile,
                location: `${fLoc}.figureId="${fig.figureId}"`,
                message: `مرجع الرسم «${fig.figureId}» في دفتر الطالب غير مسجّل في FIGURE_REGISTRY.`,
              });
            }
            if (seenGroupFigures.has(fig.figureId)) {
              addError({
                code: "ID_DUPLICATE",
                category: "ids",
                lessonId,
                file: lessonFile,
                location: `${fLoc}.figureId="${fig.figureId}"`,
                message: `تكرار مرجع الرسم «${fig.figureId}» داخل نفس فقرة دفتر الطالب (يسبب تضارب مفتاح React).`,
              });
            }
            seenGroupFigures.add(fig.figureId);
          }
          if (!isNonEmptyString(fig.caption)) {
            addError({
              code: "SCHEMA_NOTEBOOK_FIGURE_CAPTION_MISSING",
              category: "schema",
              lessonId,
              file: lessonFile,
              location: `${fLoc}.caption`,
              message: `عنوان الرسم «${fig.figureId ?? fi}» في دفتر الطالب مفقود.`,
            });
          }
          if (typeof fig.source !== "string" || !VALID_SOURCES.has(fig.source)) {
            addError({
              code: "NOTEBOOK_FIGURE_SOURCE_MISSING",
              category: "schema",
              lessonId,
              file: lessonFile,
              location: `${fLoc}.source`,
              message: `رسم دفتر الطالب «${fig.figureId ?? fi}» يفتقد مصدرًا صريحًا (\`"book"\` أو \`"extra"\`).`,
            });
          }
        }
      }
    }
  }
}

function auditInternalLinks({
  rootDir,
  validUnitIds,
  validLessonIds,
  publishedLessonIds,
  validStageIds,
  publishedLessonStageSets,
  contentInternalLinks,
  stats,
  addError,
}) {
  const { staticRoutes, dynamicRoutes } = discoverAppRoutes(rootDir);
  const codeLinks = extractInternalLinksFromCode(rootDir);

  const checkTarget = (rawTarget, { file, location, lessonId = null, isCodeLink = false }) => {
    stats.checkedInternalLinks += 1;

    if (/^https?:\/\/(localhost|127\.0\.0\.1)\b/i.test(rawTarget)) {
      addError({
        code: "INTERNAL_LINK_LOCALHOST",
        category: "links",
        lessonId,
        file,
        location,
        message: `رابط يشير إلى localhost/127.0.0.1 غير مسموح به في التصدير الثابت: «${rawTarget}».`,
      });
      return;
    }

    if (isCodeLink && /^\/Maths_6_Grade(\/|$)/.test(rawTarget)) {
      addError({
        code: "INTERNAL_LINK_HARDCODED_BASE_PATH",
        category: "links",
        lessonId,
        file,
        location,
        message: `الرابط «${rawTarget}» يضم BASE_PATH يدويًا داخل مكوّن Next.js (سيُضاعف المسار الفرعي عند النشر).`,
      });
      return;
    }

    const [pathPart, hashPart] = rawTarget.split("#");
    const cleanPath = pathPart && pathPart.length > 1 ? pathPart.replace(/\/+$/, "") : pathPart;

    // رابط بصمة مرحلة فقط (مثل #quiz)
    if (!cleanPath && hashPart) {
      if (!validStageIds.has(hashPart)) {
        addError({
          code: "INTERNAL_LINK_INVALID_STAGE_HASH",
          category: "links",
          lessonId,
          file,
          location,
          message: `بصمة المرحلة «#${hashPart}» غير موجودة في LESSON_STAGES.`,
        });
      }
      return;
    }

    if (staticRoutes.has(cleanPath)) {
      return;
    }

    const unitMatch = cleanPath.match(/^\/curriculum\/([^/]+)$/);
    if (unitMatch && dynamicRoutes.has("/curriculum/[unitId]")) {
      const unitId = unitMatch[1];
      if (!validUnitIds.has(unitId)) {
        addError({
          code: "INTERNAL_LINK_BROKEN_UNIT",
          category: "links",
          lessonId,
          file,
          location,
          message: `رابط داخلي يشير إلى وحدة غير موجودة في الفهرس: «${rawTarget}».`,
        });
      }
      return;
    }

    const lessonMatch = cleanPath.match(/^\/lessons\/([^/]+)$/);
    if (lessonMatch && dynamicRoutes.has("/lessons/[id]")) {
      const targetLessonId = lessonMatch[1];
      if (!validLessonIds.has(targetLessonId)) {
        addError({
          code: "INTERNAL_LINK_BROKEN_LESSON",
          category: "links",
          lessonId,
          file,
          location,
          message: `رابط داخلي يشير إلى درس غير موجود في الفهرس: «${rawTarget}».`,
        });
        return;
      }
      if (hashPart) {
        if (!validStageIds.has(hashPart)) {
          addError({
            code: "INTERNAL_LINK_INVALID_STAGE_HASH",
            category: "links",
            lessonId,
            file,
            location,
            message: `الرابط «${rawTarget}» يشير إلى مرحلة غير معتمدة «#${hashPart}».`,
          });
        } else if (publishedLessonIds.has(targetLessonId)) {
          const stages = publishedLessonStageSets.get(targetLessonId);
          if (stages && !stages.has(hashPart)) {
            addError({
              code: "INTERNAL_LINK_MISSING_TARGET_STAGE",
              category: "links",
              lessonId: targetLessonId,
              file,
              location,
              message: `الرابط «${rawTarget}» يشير إلى مرحلة «#${hashPart}» غير متوفرة في الدرس «${targetLessonId}».`,
            });
          }
        }
      }
      return;
    }

    addError({
      code: "INTERNAL_LINK_BROKEN_ROUTE",
      category: "links",
      lessonId,
      file,
      location,
      message: `رابط داخلي يشير إلى مسار غير موجود في src/app/: «${rawTarget}».`,
    });
  };

  for (const link of codeLinks) {
    const loc = `line ${link.line} (${link.context})`;
    if (link.kind === "static") {
      checkTarget(link.value, { file: link.file, location: loc, isCodeLink: true });
    } else if (link.kind === "template") {
      stats.checkedInternalLinks += 1;
      if (/^https?:\/\/(localhost|127\.0\.0\.1)\b/i.test(link.prefix)) {
        addError({
          code: "INTERNAL_LINK_LOCALHOST",
          category: "links",
          lessonId: null,
          file: link.file,
          location: loc,
          message: `رابط ديناميكي يشير إلى localhost: «${link.pattern}».`,
        });
        continue;
      }
      if (/^\/Maths_6_Grade(\/|$)/.test(link.prefix)) {
        addError({
          code: "INTERNAL_LINK_HARDCODED_BASE_PATH",
          category: "links",
          lessonId: null,
          file: link.file,
          location: loc,
          message: `رابط ديناميكي يضم BASE_PATH يدويًا: «${link.pattern}».`,
        });
        continue;
      }

      const normalizedPattern = link.pattern.split("#")[0].replace(/\/+$/, "");
      const validDynamicPattern =
        (normalizedPattern === "/lessons/${...}" && dynamicRoutes.has("/lessons/[id]")) ||
        (normalizedPattern === "/curriculum/${...}" && dynamicRoutes.has("/curriculum/[unitId]"));

      if (!validDynamicPattern) {
        addError({
          code: "INTERNAL_LINK_BROKEN_DYNAMIC_ROUTE",
          category: "links",
          lessonId: null,
          file: link.file,
          location: loc,
          message: `رابط ديناميكي لا يطابق أي مسار في src/app/: «${link.pattern}».`,
        });
        continue;
      }

      if (link.prefix === "/lessons/" && link.hash) {
        if (!validStageIds.has(link.hash)) {
          addError({
            code: "INTERNAL_LINK_INVALID_STAGE_HASH",
            category: "links",
            lessonId: null,
            file: link.file,
            location: loc,
            message: `الرابط الديناميكي «${link.pattern}» يشير إلى مرحلة غير موجودة «#${link.hash}».`,
          });
        } else {
          // كل درس منشور يظهر في /exams أو /lab يجب أن يحتوي المرحلة المستهدفة
          for (const pubId of publishedLessonIds) {
            const stages = publishedLessonStageSets.get(pubId);
            if (stages && !stages.has(link.hash)) {
              addError({
                code: "INTERNAL_LINK_MISSING_TARGET_STAGE",
                category: "links",
                lessonId: pubId,
                file: link.file,
                location: loc,
                message: `الرابط «${link.pattern}» يفترض وجود المرحلة «#${link.hash}» لكنها غائبة في الدرس المنشور «${pubId}».`,
              });
            }
          }
        }
      }
    }
  }

  for (const link of contentInternalLinks) {
    checkTarget(link.target, {
      file: link.file,
      location: link.location,
      lessonId: link.lessonId,
      isCodeLink: false,
    });
  }
}

/* ─────────────────────────── تنسيق التقرير وواجهة CLI ─────────────────────────── */

export function formatAuditReport(report) {
  const lines = [];
  const { stats, errors, warnings, exceptionsApplied } = report;

  if (report.ok) {
    lines.push("✓ نجح فحص تكامل محتوى الدروس (Content Integrity Audit Passed)");
    lines.push("────────────────────────────────────────────────────────────");
    lines.push(`• الوحدات: ${stats.units} | إجمالي الدروس في الفهرس: ${stats.totalLessons}`);
    lines.push(
      `• الدروس المنشورة المفحوصة: ${stats.publishedLessons} | الدروس المفهرسة غير المنشورة (سليمة بلا محتوى): ${stats.unpublishedLessons}`,
    );
    lines.push(
      `• المراحل المفحوصة: ${stats.auditedSections} قسمًا + ${stats.publishedLessons} اختبارًا + ${stats.publishedLessons} دفتر طالب`,
    );
    lines.push(
      `• المحتوى: ${stats.auditedBlocks} كتلة · ${stats.auditedBookPractices} تمرينًا تفاعليًا · ${stats.auditedQuizQuestions} سؤال اختبار · ${stats.auditedNotebookGroups} فقرة دفتر`,
    );
    lines.push(
      `• السجلات: ${stats.registeredFigures} رسمًا · ${stats.registeredActivities} نشاطًا · ${stats.registeredExercises} تمرينًا مسجّلًا · ${stats.registeredGeometryIds} إنشاءً هندسيًا`,
    );
    lines.push(
      `• التحقق الإضافي: ${stats.checkedInternalLinks} رابطًا داخليًا · ${stats.checkedKatexExpressions} تعبير KaTeX`,
    );
  } else {
    lines.push(`✗ فشل فحص تكامل محتوى الدروس — تم اكتشاف ${errors.length} خطأ:`);
    lines.push("────────────────────────────────────────────────────────────");
    errors.forEach((err, index) => {
      const meta = [
        err.lessonId ? `الدرس: ${err.lessonId}` : null,
        `الملف: ${err.file}`,
        `الموضع: ${err.location}`,
      ]
        .filter(Boolean)
        .join(" | ");
      lines.push(`${index + 1}. [${err.code}] (${err.category}) ${meta}`);
      lines.push(`   ${err.message.replace(/\n/g, "\n   ")}`);
    });
  }

  if (exceptionsApplied.length > 0) {
    lines.push("");
    lines.push("• الاستثناءات الموثّقة المطبّقة:");
    for (const ex of exceptionsApplied) {
      lines.push(`  - [${ex.rule}] ${ex.detail} (${ex.reference})`);
    }
  }

  if (warnings.length > 0) {
    lines.push("");
    lines.push(`• تنبيهات (${warnings.length}):`);
    for (const w of warnings) {
      lines.push(`  - [${w.code}] ${w.file} (${w.location}): ${w.message}`);
    }
  }

  return lines.join("\n");
}

function parseCliArgs(argv) {
  let rootDir = DEFAULT_ROOT;
  let json = false;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--json") {
      json = true;
    } else if (arg === "--root" && argv[i + 1]) {
      rootDir = path.resolve(argv[i + 1]);
      i += 1;
    } else if (arg.startsWith("--root=")) {
      rootDir = path.resolve(arg.slice("--root=".length));
    }
  }
  return { rootDir, json };
}

const isDirectRun =
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isDirectRun) {
  const { rootDir, json } = parseCliArgs(process.argv.slice(2));
  const report = await auditContentIntegrity({ rootDir });
  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(formatAuditReport(report));
  }
  process.exit(report.ok ? 0 : 1);
}
