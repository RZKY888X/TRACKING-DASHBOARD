"use client";

export default function ModalForm({
  open,
  onClose,
  title,
  fields,
  values,
  setValues,
  onSubmit,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#0D1B2A] w-full max-w-md p-6 rounded-xl border border-cyan-500/30">
        
        <h2 className="text-lg font-semibold text-cyan-400 mb-4">{title}</h2>

        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.name}>
              <label className="text-gray-400 text-sm">{field.label}</label>
              <input
                type="text"
                value={values[field.name]}
                onChange={(e) =>
                  setValues({ ...values, [field.name]: e.target.value })
                }
                className="mt-1 w-full px-3 py-2 rounded-md bg-[#0F2538] text-white border border-cyan-500/20 focus:border-cyan-400"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 rounded-lg text-gray-200"
          >
            Cancel
          </button>

          <button
            onClick={onSubmit}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
