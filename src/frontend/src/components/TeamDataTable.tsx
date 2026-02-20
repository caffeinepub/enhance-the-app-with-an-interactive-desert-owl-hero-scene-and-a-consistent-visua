import React from 'react';

const TeamDataTable: React.FC = () => {
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
    <div className="w-full max-w-6xl mx-auto px-4 py-6" dir="rtl">
      {/* Main Team Header */}
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-gray-100">
        فريق العمل
      </h2>

      {/* Main Team Table - Horizontal Layout */}
      <div className="mb-6 overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right font-semibold text-gray-800 dark:text-gray-100 w-1/2">
                المتابعون
              </th>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right font-semibold text-gray-800 dark:text-gray-100 w-1/2">
                الأعضاء
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              {/* Followers Column */}
              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 align-top">
                <ul className="list-none space-y-1">
                  {followers.map((follower, index) => (
                    <li key={index} className="text-gray-700 dark:text-gray-300 text-sm py-0.5">
                      {follower}
                    </li>
                  ))}
                </ul>
              </td>
              {/* Members Column */}
              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 align-top">
                <ul className="list-none space-y-1">
                  {members.map((member, index) => (
                    <li key={index} className="text-gray-700 dark:text-gray-300 text-sm py-0.5">
                      {member}
                    </li>
                  ))}
                </ul>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Manager and Designer Section - Horizontal Layout */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
          <tbody>
            <tr>
              {/* Project Manager - Left side in Arabic RTL (appears on right visually) */}
              <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-right w-1/2">
                <span className="font-semibold text-gray-800 dark:text-gray-100">مدير المشروع:</span>{' '}
                <span className="text-gray-700 dark:text-gray-300">محمد البلوشي</span>
              </td>
              {/* Designer - Right side in Arabic RTL (appears on left visually) */}
              <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-right w-1/2">
                <span className="font-semibold text-gray-800 dark:text-gray-100">فكرة وتصميم:</span>{' '}
                <span className="text-gray-700 dark:text-gray-300">نبيلة الجابري</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Responsive Design for Mobile */}
      <style>{`
        @media (max-width: 640px) {
          table {
            font-size: 0.875rem;
          }
          th, td {
            padding: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default TeamDataTable;
