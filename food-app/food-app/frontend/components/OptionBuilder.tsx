import React from 'react';
import type { OptionGroup, OptionItem } from '@/lib/api/client';

interface Props {
  options: OptionGroup[];
  onChange: (options: OptionGroup[]) => void;
}

export default function OptionBuilder({ options, onChange }: Props) {
  const addGroup = () => {
    onChange([...options, { name: '', isRequired: false, isMultiple: false, choices: [] }]);
  };

  const updateGroup = (index: number, field: keyof OptionGroup, value: any) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    onChange(newOptions);
  };

  const removeGroup = (index: number) => {
    const newOptions = [...options];
    newOptions.splice(index, 1);
    onChange(newOptions);
  };

  const addChoice = (groupIndex: number) => {
    const newOptions = [...options];
    newOptions[groupIndex].choices.push({ name: '', price: 0 });
    onChange(newOptions);
  };

  const updateChoice = (groupIndex: number, choiceIndex: number, field: keyof OptionItem, value: any) => {
    const newOptions = [...options];
    newOptions[groupIndex].choices[choiceIndex] = { ...newOptions[groupIndex].choices[choiceIndex], [field]: value };
    onChange(newOptions);
  };

  const removeChoice = (groupIndex: number, choiceIndex: number) => {
    const newOptions = [...options];
    newOptions[groupIndex].choices.splice(choiceIndex, 1);
    onChange(newOptions);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-bold text-gray-700">Tùy chọn & Topping</label>
        <button
          type="button"
          onClick={addGroup}
          className="text-sm px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg font-bold hover:bg-blue-100 transition-colors"
        >
          + Thêm Nhóm Tùy Chọn
        </button>
      </div>

      {options.length === 0 && (
        <div className="text-sm text-gray-400 italic bg-gray-50 p-4 rounded-xl text-center border border-dashed border-gray-200">
          Chưa có nhóm tùy chọn nào. Bấm nút trên để tạo Size hoặc Topping.
        </div>
      )}

      {options.map((group, gIndex) => (
        <div key={gIndex} className="bg-white border text-sm border-gray-200 rounded-xl p-4 shadow-sm relative space-y-3">
          <button
            type="button"
            onClick={() => removeGroup(gIndex)}
            className="absolute top-3 right-3 text-red-400 hover:text-red-500"
            title="Xóa nhóm này"
          >
            ✕
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-6">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Tên nhóm (Vd: Kích cỡ, Topping)</label>
              <input
                type="text"
                required
                value={group.name}
                onChange={(e) => updateGroup(gIndex, 'name', e.target.value)}
                placeholder="Nhập tên..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>
            
            <div className="flex items-center gap-4 pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={group.isRequired}
                  onChange={(e) => updateGroup(gIndex, 'isRequired', e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                />
                <span className="font-medium text-gray-700 text-xs">Bắt buộc chọn</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={group.isMultiple}
                  onChange={(e) => updateGroup(gIndex, 'isMultiple', e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                />
                <span className="font-medium text-gray-700 text-xs">Cho chọn nhiều</span>
              </label>
            </div>
          </div>

          <div className="space-y-2 mt-4 bg-gray-50 rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Danh sách lựa chọn</span>
              <button
                type="button"
                onClick={() => addChoice(gIndex)}
                className="text-xs px-2 py-1 bg-white border border-gray-200 text-gray-600 rounded hover:bg-gray-100 transition shadow-sm"
              >
                + Thêm Lựa Chọn
              </button>
            </div>
            
            {group.choices.length === 0 && (
              <div className="text-xs text-gray-400 italic">Vui lòng thêm ít nhất 1 lựa chọn.</div>
            )}

            {group.choices.map((choice, cIndex) => (
              <div key={cIndex} className="flex gap-2 items-center">
                <input
                  type="text"
                  required
                  value={choice.name}
                  onChange={(e) => updateChoice(gIndex, cIndex, 'name', e.target.value)}
                  placeholder="Vd: Size M"
                  className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-primary text-xs"
                />
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    required
                    value={choice.price}
                    onChange={(e) => updateChoice(gIndex, cIndex, 'price', Number(e.target.value))}
                    placeholder="Giá cộng thêm"
                    className="w-24 border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-primary text-xs"
                  />
                  <span className="absolute right-2 top-1.5 text-xs text-gray-400">đ</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeChoice(gIndex, cIndex)}
                  className="p-1.5 text-gray-400 hover:text-red-500 bg-white rounded-md border border-gray-200"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
