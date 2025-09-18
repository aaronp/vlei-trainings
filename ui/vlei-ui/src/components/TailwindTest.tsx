import React from 'react';

export const TailwindTest: React.FC = () => {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-blue-600 mb-4">Tailwind CSS Test</h1>
      <div className="bg-gray-100 p-4 rounded-lg shadow-md">
        <p className="text-gray-700">If you can see styling on this component, Tailwind is working!</p>
        <button className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
          Test Button
        </button>
      </div>
    </div>
  );
};