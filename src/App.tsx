import React from 'react';
import './App.css';
import MainTable from './components/MainTable';

function App() {
  return (
    <div className="px-5 py-5">
      {/* <Table virtual scroll={{ x: 2000, y: 500 }}/> */}
      <MainTable/>
    </div>
  );
}

export default App;







