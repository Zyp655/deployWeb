import React from 'react';
import { OptionGroup, SelectedOption } from '@/lib/api/client';

interface Props {
  options: OptionGroup[];
  selectedOptions: SelectedOption[];
  onChange: (options: SelectedOption[]) => void;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

export default function OptionSelector({ options, selectedOptions, onChange }: Props) {
  if (!options || options.length === 0) return null;

  const handleToggle = (group: OptionGroup, choiceName: string, price: number) => {
    let newSelected = [...selectedOptions];

    if (group.isMultiple) {
      // Toggle
      const exists = newSelected.find(
        (opt) => opt.group === group.name && opt.choice === choiceName
      );
      if (exists) {
        newSelected = newSelected.filter(
          (opt) => !(opt.group === group.name && opt.choice === choiceName)
        );
      } else {
        newSelected.push({ group: group.name, choice: choiceName, price });
      }
    } else {
      // Single selection (replace existing from this group)
      newSelected = newSelected.filter((opt) => opt.group !== group.name);
      newSelected.push({ group: group.name, choice: choiceName, price });
    }

    onChange(newSelected);
  };

  return (
    <div className="mt-6 space-y-6">
      {options.map((group, groupIdx) => (
        <div key={groupIdx} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-3">
            <h3 className="font-extrabold text-gray-900 text-sm">
              {group.name} {group.isRequired && <span className="text-red-500">*</span>}
            </h3>
            <span className="text-[11px] text-gray-500 font-bold bg-gray-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
              {group.isRequired ? 'Bắt buộc' : 'Tùy chọn'} {group.isMultiple && ' • Chọn nhiều'}
            </span>
          </div>

          <div className="space-y-2.5">
            {group.choices.map((choice, choiceIdx) => {
              const isSelected = selectedOptions.some(
                (opt) => opt.group === group.name && opt.choice === choice.name
              );

              return (
                <label
                  key={choiceIdx}
                  className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? 'border-primary bg-primary-50 shadow-md shadow-primary/10' 
                      : 'border-gray-100 bg-gray-50 hover:border-primary-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`flex items-center justify-center w-5 h-5 border-2 rounded ${group.isMultiple ? 'rounded-md' : 'rounded-full'} ${isSelected ? 'border-primary bg-primary' : 'border-gray-300 bg-white'}`}>
                       {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                       )}
                    </div>
                    {/* Hide actual input */}
                    <input
                      type={group.isMultiple ? 'checkbox' : 'radio'}
                      name={`group-${group.name}`}
                      checked={isSelected}
                      onChange={() => handleToggle(group, choice.name, Number(choice.price))}
                      className="hidden"
                    />
                    <span className={`text-sm font-bold ${isSelected ? 'text-primary-800' : 'text-gray-700'}`}>
                      {choice.name}
                    </span>
                  </div>
                  {choice.price > 0 && (
                    <span className={`text-sm font-bold ${isSelected ? 'text-primary-600' : 'text-gray-500'}`}>
                      +{formatPrice(Number(choice.price))}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
