import React from 'react';

/**
 * OfficialAlBuraimiMap component displays the official Al Buraimi Governorate map
 * from the National Survey Authority of Oman using a responsive iframe.
 * The component displays only the map without any title text or heading.
 */
export default function OfficialAlBuraimiMap() {
  return (
    <div className="w-full h-full min-h-[400px] sm:min-h-[500px] lg:min-h-[600px]">
      <iframe
        src="https://www.nsa.gov.om/ar/maps/alburaimi"
        className="w-full h-full border-0 rounded-lg shadow-sm"
        style={{
          minHeight: '85vh',
          maxHeight: '85vh'
        }}
        title="خريطة محافظة البريمي الرسمية"
        loading="lazy"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}
