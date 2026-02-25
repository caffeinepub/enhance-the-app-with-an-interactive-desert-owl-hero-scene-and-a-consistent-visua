export default function TeamDataTable() {
  const followers = [
    'ناصر اليعقوبي',
    'سالم المسكري',
    'هزاع المعمري',
    'فاطمة الجابري',
  ];

  const members = [
    'يوسف العلوي',
    'هلال الشامسي',
    'مروان الزيدي',
    'أحلام المقبالي',
    'أمينة الكندي',
  ];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Followers and Members side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Followers */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-lg font-bold text-foreground font-arabic mb-4 flex items-center gap-2">
            <span className="text-2xl">👥</span>
            <span>المتابعون</span>
          </h3>
          <div className="space-y-2">
            {followers.map((name, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl"
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                  {idx + 1}
                </div>
                <span className="font-arabic text-foreground">{name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Members */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-lg font-bold text-foreground font-arabic mb-4 flex items-center gap-2">
            <span className="text-2xl">🔬</span>
            <span>الأعضاء</span>
          </h3>
          <div className="space-y-2">
            {members.map((name, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl"
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                  {idx + 1}
                </div>
                <span className="font-arabic text-foreground">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Project Manager and Designer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-primary/30 rounded-2xl p-6 text-center">
          <div className="text-4xl mb-3">👨‍💼</div>
          <h3 className="text-sm font-arabic text-foreground/60 mb-1">مدير المشروع</h3>
          <p className="text-lg font-bold text-foreground font-arabic">محمد البلوشي</p>
        </div>

        <div className="bg-card border border-primary/30 rounded-2xl p-6 text-center">
          <div className="text-4xl mb-3">🎨</div>
          <h3 className="text-sm font-arabic text-foreground/60 mb-1">المصممة</h3>
          <p className="text-lg font-bold text-foreground font-arabic">نبيلة الجابري</p>
        </div>
      </div>
    </div>
  );
}
