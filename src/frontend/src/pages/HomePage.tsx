import React from 'react';
import MainHeader from '../components/MainHeader';
import TeamDataTable from '../components/TeamDataTable';
import StaticAlBuraimiMap from '../components/StaticAlBuraimiMap';
import DesertOwlScene from '../components/DesertOwlScene';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" dir="rtl">
      <MainHeader />
      
      <main className="container mx-auto px-4 py-8 space-y-12">
        {/* Hero Section - Desert Owl Scene */}
        <section className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border-2 border-amber-200 dark:border-amber-700">
          <DesertOwlScene />
        </section>

        {/* Goal Section */}
        <section className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border-2 border-amber-200 dark:border-amber-700">
          <div className="prose prose-lg dark:prose-invert max-w-none text-right" style={{ lineHeight: '1.7' }}>
            <p className="text-gray-800 dark:text-gray-200 font-semibold leading-relaxed mb-4">
              <strong>هذا التطبيق، المصمم لموظفي المؤسسة، يهدف إلى تعزيز الوعي البيئي والعلمي بطيور البوم من خلال توفير محتوى تعليمي موثوق ومبسط يسلط الضوء على أنواعها وسلوكياتها وموائلها الطبيعية، مما يدعم جهود المؤسسة في الاستدامة والحفاظ على التنوع البيولوجي.</strong>
            </p>
            
            <p className="text-gray-800 dark:text-gray-200 font-semibold leading-relaxed mb-4">
              <strong>كما يسعى التطبيق إلى رفع مستوى الثقافة البيئية داخل المؤسسة من خلال أدوات تفاعلية تسهل الوصول إلى المعلومات وتشجع الموظفين على المشاركة في الأنشطة والمبادرات البيئية.</strong>
            </p>
            
            <p className="text-gray-800 dark:text-gray-200 font-semibold leading-relaxed mb-2">
              <strong>تتماشى هذه المبادرة مع رؤية عمان 2040، حيث تساهم في تحقيق عدة من أهدافها، وأبرزها:</strong>
            </p>
            <p className="text-gray-800 dark:text-gray-200 font-semibold leading-relaxed mb-1">
              <strong>• تعزيز الوعي والمسؤولية البيئية لدى الأفراد.</strong>
            </p>
            <p className="text-gray-800 dark:text-gray-200 font-semibold leading-relaxed mb-1">
              <strong>• دعم البحث العلمي والابتكار في المجالات البيئية والتنوع البيولوجي.</strong>
            </p>
            <p className="text-gray-800 dark:text-gray-200 font-semibold leading-relaxed mb-4">
              <strong>• المحافظة على الموارد الطبيعية وضمان استدامتها للأجيال القادمة.</strong>
            </p>
            
            <p className="text-gray-800 dark:text-gray-200 font-semibold leading-relaxed">
              <strong>وبذلك يعد التطبيق أداة تعليمية وتوعوية تدعم التوجهات الوطنية وتساهم في بناء مجتمع مؤسسي واعٍ بالقضايا البيئية والاستدامة.</strong>
            </p>
          </div>
        </section>

        {/* Al Buraimi Map - Repositioned directly below goal text */}
        <section className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border-2 border-amber-200 dark:border-amber-700">
          <StaticAlBuraimiMap />
        </section>

        {/* Team Section */}
        <section className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border-2 border-amber-200 dark:border-amber-700">
          <TeamDataTable />
        </section>

        {/* Environment Department Supervision Footer Text */}
        <section className="mt-12 mb-8">
          <div className="text-center">
            <p className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-200 tracking-wide">
              تحت إشراف إدارة البيئة بمحافظة البريمي
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
