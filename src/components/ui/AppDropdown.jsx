import React from 'react';
import { MenuItem, Select, Checkbox, ListItemText, FormControl, InputLabel } from '@mui/material';

function AppDropdown({
    id,
    placeholder,
    options,
    selectedValue,
    onChange,
    multiSelect = false,
    onReset
}) {
    const handleChange = (event) => {
        const value = event.target.value;
        onChange(multiSelect ? value : value[value.length - 1]);
    };

    return (
        <FormControl fullWidth>
            <InputLabel>{placeholder}</InputLabel>
            <Select
                id={id}
                multiple={multiSelect}
                value={selectedValue}
                onChange={handleChange}
                renderValue={(selected) =>
                    multiSelect
                        ? options.filter((opt) => selected.includes(opt.value)).map((opt) => opt.label).join(', ')
                        : options.find((opt) => opt.value === selected)?.label || placeholder
                }
            >
                {options.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                        {multiSelect && <Checkbox checked={selectedValue.includes(opt.value)} />}
                        <ListItemText primary={opt.label} />
                    </MenuItem>
                ))}
            </Select>
            {onReset && (
                <button onClick={onReset} style={{ marginTop: '8px' }}>
                    Reset
                </button>
            )}
        </FormControl>
    );
}

export default AppDropdown;
