import { useState } from 'react';

export default function ProfileSection({ title, isReadOnly, records = [], onAddSubmit, fields = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState(
    fields.reduce((acc, field) => ({ ...acc, [field.name]: '' }), {})
  );

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddSubmit(formData);
    setIsOpen(false);
    // Reset state values
    setFormData(fields.reduce((acc, field) => ({ ...acc, [field.name]: '' }), {}));
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
      <div className="flex justify-between items-center border-b border-gray-100 pb-3">
        <h3 className="text-lg font-bold text-gray-800 capitalize">{title.replace(/_/g, ' ')}</h3>
        
        {/* Hide action button if accessed via privileged search routing */}
        {!isReadOnly && (
          <button 
            onClick={() => setIsOpen(true)}
            className="bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-700 transition"
          >
            + Add Entry
          </button>
        )}
      </div>

      {/* Render current log history lists */}
      {records.length === 0 ? (
        <p className="text-gray-400 text-sm italic">No verified items recorded in this section.</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {records.map((record, index) => (
            <div key={index} className="py-2 first:pt-0 last:pb-0 flex justify-between items-center text-sm">
              <div>
                <p className="font-semibold text-gray-700">{record.title || record.subject_name || 'Activity Entry'}</p>
                {record.description && <p className="text-xs text-gray-400">{record.description}</p>}
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                record.approval_status === 'approved' ? 'bg-green-50 text-green-700' :
                record.approval_status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
              }`}>
                {record.approval_status || 'pending'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Entry Modal Form Wrapper */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h4 className="text-base font-bold text-gray-900">Add New {title.replace(/_/g, ' ')}</h4>
            
            <form onSubmit={handleSubmit} className="space-y-3">
              {fields.map((field) => (
                <div key={field.name}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 capitalize">
                    {field.label || field.name.replace(/_/g, ' ')}
                  </label>
                  <input
                    type={field.type || 'text'}
                    name={field.name}
                    required={field.required}
                    value={formData[field.name]}
                    onChange={handleInputChange}
                    className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}