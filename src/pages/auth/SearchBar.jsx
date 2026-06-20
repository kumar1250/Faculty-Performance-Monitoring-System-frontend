import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SearchBar() {
  const [registerNo, setRegisterNo] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (!registerNo) return;
    // Navigate to the summary page with the register number
    navigate(`/faculty-summary/${registerNo}`);
  };

  return (
    <form onSubmit={handleSearch} className="flex gap-2">
      <input
        type="text"
        placeholder="Enter Register No..."
        className="px-4 py-2 border rounded-xl text-sm"
        value={registerNo}
        onChange={(e) => setRegisterNo(e.target.value)}
      />
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold">
        Search
      </button>
    </form>
  );
}