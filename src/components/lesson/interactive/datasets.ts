/**
 * بيانات الكتاب المستعملة في الأنشطة التفاعلية — نقلًا عن صفحات الدرس (ص 3-5).
 * لا قيم مخترعة هنا؛ كل جدول/متسلسلة مأخوذة من نص الكتاب.
 */

export interface PlotDataset {
  id: "latakia" | "apples" | "meals";
  title: string;
  tableCaption: string;
  xAxisLabel: string;
  yAxisLabel: string;
  xLabels: string[];
  values: number[];
  /** تدريجات المحور الشاقولي المعروضة. */
  yTicks: number[];
  /** مجال القيم المقبولة عند وضع النقاط (أعداد صحيحة). */
  yFloor: number;
  yCeil: number;
  yMin: number;
  yMax: number;
}

export const PLOT_DATASETS: Record<PlotDataset["id"], PlotDataset> = {
  latakia: {
    id: "latakia",
    title: "درجات الحرارة في مدينة اللاذقية في أسبوع",
    tableCaption: "الجدول (مثال الكتاب): درجات الحرارة في مدينة اللاذقية في أسبوع",
    xAxisLabel: "الأيام",
    yAxisLabel: "درجات الحرارة",
    xLabels: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
    values: [15, 16, 18, 17, 15, 15, 16],
    yTicks: [15, 16, 17, 18],
    yFloor: 14,
    yCeil: 19,
    yMin: 14,
    yMax: 19,
  },
  apples: {
    id: "apples",
    title: "إنتاج التفاح في إحدى المزارع (2010–2016)",
    tableCaption: "«تحقق من فهمك» (الكتاب): إنتاج التفاح في إحدى المزارع في الأعوام 2010–2016",
    xAxisLabel: "السنة",
    yAxisLabel: "الإنتاج بالطن",
    xLabels: ["2010", "2011", "2012", "2013", "2014", "2015", "2016"],
    values: [2, 4, 3, 2, 4, 5, 3],
    yTicks: [1, 2, 3, 4, 5],
    yFloor: 0,
    yCeil: 6,
    yMin: 0,
    yMax: 6,
  },
  meals: {
    id: "meals",
    title: "عدد الوجبات المباعة في أحد المطاعم خلال أسبوع",
    tableCaption: "«تدرّب» (الكتاب): عدد الوجبات المباعة في أحد المطاعم خلال أسبوع",
    xAxisLabel: "اليوم",
    yAxisLabel: "عدد الوجبات",
    xLabels: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
    values: [34, 32, 30, 31, 40, 38, 36],
    yTicks: [30, 32, 34, 36, 38, 40],
    yFloor: 28,
    yCeil: 41,
    yMin: 28,
    yMax: 41,
  },
};

// قيم النقاط من خطوط التدريج في ص 3 وص 5؛ انظر docs/lesson-1-1-graph-verification.md.
export const STUDENTS_DATASET = {
  title: "عدد طلاب الصف السادس في السنوات 2013 إلى 2016",
  xAxisLabel: "السنة",
  yAxisLabel: "عدد الطلاب",
  xLabels: ["2013", "2014", "2015", "2016"],
  values: [60, 70, 65, 60],
  yTicks: [60, 65, 70, 75],
  yMin: 55,
  yMax: 80,
};

export const RAIN_DATASET = {
  title: "معدل تساقط الأمطار بالميليمتر في مدينة دمشق حسب الشهر",
  xAxisLabel: "الشهر",
  yAxisLabel: "المعدل بالميليمتر",
  xLabels: ["تشرين الثاني", "كانون الأول", "كانون الثاني", "شباط", "آذار", "نيسان"],
  values: [36, 38, 40, 37, 38, 35],
  yTicks: [35, 36, 37, 38, 39, 40],
  yMin: 34,
  yMax: 40.5,
};
