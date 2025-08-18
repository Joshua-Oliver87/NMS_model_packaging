import React from "react";

export const Label = ({type, label, elementName, inputValue, onChange, readOnly}) => {
    return (
        <div className="groupDropdown">            
            <label>
                {label}
              <input
                type={type ?? "text"}
                name={elementName}
                value={inputValue}
                onChange={onChange}  
                readOnly={readOnly ?? false}
                style={{ margin: "5px 0", width: "95%", padding: "5px" }}              
              />
            </label>
        </div>
    );
};
