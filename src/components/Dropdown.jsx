import React from "react";

export const Dropdown = ({label, options, onChange, defaultOptionValue}) => { 
    console.log(label, options);   
    return (
        <div className="groupDropdown">
            <label>
                {label}
            </label>
            <select className="groupDropdownSelect" value={defaultOptionValue} onChange={onChange}>                
                {options.map((option, index) => (                                       
                    <option key={index} value={option.value}>{option.label}</option>
                ))}
            </select>
        </div>
    );
};
