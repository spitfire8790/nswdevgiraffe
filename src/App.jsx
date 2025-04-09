import React, { useState } from 'react';
import DevelopmentModalApp from './components/DevelopmentModal';

const App = () => {
  const [isModalOpen, setIsModalOpen] = useState(true);

  return (
    <div className="min-h-screen">
      <DevelopmentModalApp 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        selectedFeatures={[]} 
        fullscreen={true}
      />
    </div>
  );
};

export default App; 