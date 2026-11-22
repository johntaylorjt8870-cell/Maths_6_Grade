import { UNIT_ONE_FIGURES } from "./UnitOneFigures";
import { NaturalLab, PlaceLab, RoundingLab, LineLab, ParallelLab } from "./UnitOneLabs";
import type { ComponentType, ReactNode } from "react";
import { LineChart } from "@/components/charts/LineChart";
import { PLOT_DATASETS, RAIN_DATASET, STUDENTS_DATASET } from "./datasets";
import { CoordinateGridPlot } from "./CoordinateGridPlot";
import { FillTableCheck } from "./FillTableCheck";
import { PlotPointsExercise } from "./PlotPointsExercise";
import { GraphStudio } from "./GraphStudio";
import { CheckAppleExercise } from "./CheckAppleExercise";
import { RainReadingExercise } from "./RainReadingExercise";

/**
 * سجلا الأنشطة والتمارين والرسوم:
 * المحتوى الثابت يشير إلى المعرّفات فقط، وهنا تُربط بمكونات تعمل داخل المتصفح.
 * أي معرّف غير مسجّل يُعرض كعنصر نائب واضح بدل أن ينكسر البناء.
 */

function ActPlotLatakia() {
  return <PlotPointsExercise datasetId="latakia" />;
}
function ActPlotApples() {
  return <PlotPointsExercise datasetId="apples" />;
}
function ActPlotMeals() {
  return <PlotPointsExercise datasetId="meals" />;
}

export const ACTIVITY_REGISTRY: Record<string, ComponentType> = {
  "unit1-lab-2": NaturalLab,
  "unit1-lab-3": PlaceLab,
  "unit1-lab-4": RoundingLab,
  "unit1-lab-5": LineLab,
  "unit1-lab-6": ParallelLab,
  /** انطلاقة (1): وضع النقاط A,B,C,D على شبكة الإحداثيات. */
  "act-grid-plot": CoordinateGridPlot,
  /** انطلاقة (2): قراءة تمثيل الطلاب وملء جدول السنوات. */
  "act-fill-table": FillTableCheck,
  /** اكتشاف المفهوم: التمثيل البياني لدرجات حرارة اللاذقية بيد الطالب. */
  "act-plot-latakia": ActPlotLatakia,
  /** تحقق من فهمك (أ): تمثيل إنتاج التفاح. */
  "act-plot-apples": ActPlotApples,
  /** تدرّب (1): تمثيل وجبات المطعم. */
  "act-plot-meals": ActPlotMeals,
  /** المختبر التفاعلي: مختبر بيانات الكتاب الثلاث. */
  "act-graph-studio": GraphStudio,
};

export const EXERCISE_REGISTRY: Record<string, ComponentType> = {
  /** تحقق من فهمك (ب، ج): أكبر/أصغر إنتاج تفاح. */
  "ex-apple-understanding": CheckAppleExercise,
  /** تدرّب (2) أ–د: قراءة رسم هطول الأمطار في دمشق. */
  "ex-rain-reading": RainReadingExercise,
};

const latakia = PLOT_DATASETS.latakia;
const apples = PLOT_DATASETS.apples;
const meals = PLOT_DATASETS.meals;

export const FIGURE_REGISTRY: Record<string, ReactNode> = {
  ...UNIT_ONE_FIGURES,
  /** خطوة «ثانيًا» من مثال الكتاب: النقاط فقط بلا وصل. */
  "fig-latakia-points": (
    <LineChart
      xLabels={latakia.xLabels}
      yTicks={latakia.yTicks}
      yMin={latakia.yMin}
      yMax={latakia.yMax}
      values={latakia.values}
      xAxisLabel="الأيام"
      yAxisLabel="درجات الحرارة"
      connect={false}
      ariaLabel="نقاط درجات الحرارة في مدينة اللاذقية لكل يوم من أيام الأسبوع"
    />
  ),
  /** خطوة «ثالثًا» من مثال الكتاب: وصل النقاط بخطوط مستقيمة. */
  "fig-latakia-line": (
    <LineChart
      xLabels={latakia.xLabels}
      yTicks={latakia.yTicks}
      yMin={latakia.yMin}
      yMax={latakia.yMax}
      values={latakia.values}
      xAxisLabel="الأيام"
      yAxisLabel="درجات الحرارة"
      connect
      ariaLabel="التمثيل البياني بالخطوط لدرجات الحرارة في مدينة اللاذقية خلال أسبوع"
    />
  ),
  /** تمثيل عدد طلاب الصف السادس 2013–2016 (انطلاقة 2). */
  "fig-students-chart": <LineChart {...STUDENTS_DATASET} ariaLabel={STUDENTS_DATASET.title} />,
  /** حل «تحقق من فهمك» (أ): تمثيل إنتاج التفاح. */
  "fig-apple-line": (
    <LineChart
      xLabels={apples.xLabels}
      yTicks={apples.yTicks}
      yMin={apples.yMin}
      yMax={apples.yMax}
      values={apples.values}
      xAxisLabel="السنة"
      yAxisLabel="الإنتاج بالطن"
      connect
      ariaLabel="التمثيل البياني بالخطوط لإنتاج التفاح في الأعوام 2010 إلى 2016"
    />
  ),
  /** حل «تدرّب» (1): تمثيل وجبات المطعم. */
  "fig-meals-line": (
    <LineChart
      xLabels={meals.xLabels}
      yTicks={meals.yTicks}
      yMin={meals.yMin}
      yMax={meals.yMax}
      values={meals.values}
      xAxisLabel="اليوم"
      yAxisLabel="عدد الوجبات"
      connect
      ariaLabel="التمثيل البياني بالخطوط لعدد الوجبات المباعة في أحد المطاعم خلال أسبوع"
    />
  ),
  /** رسم «تدرّب» (2): معدل تساقط الأمطار بالميليمتر في مدينة دمشق. */
  "fig-rain-chart": <LineChart {...RAIN_DATASET} ariaLabel={RAIN_DATASET.title} />,
};
