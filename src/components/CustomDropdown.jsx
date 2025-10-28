import React from 'react';
import styles from './css/CustomDropdown.module.css';

function CustomDropdown({
  id,
  placeholder,
  options,
  selectedValue,
  onChange,
  multiSelect = false,
  openDropdown,
  setOpenDropdown,
  onReset // opcjonalna funkcja resetująca
}) {
  const isOpen = openDropdown === id;

  const handleToggle = () => {
    setOpenDropdown(isOpen ? null : id);
  };

  const handleSelect = (value) => {
    if (multiSelect) {
      const current = Array.isArray(selectedValue) ? selectedValue : [];
      if (current.includes(value)) {
        onChange(current.filter((v) => v !== value));
      } else {
        onChange([...current, value]);
      }
    } else {
      onChange(value);
      setOpenDropdown(null);
    }
  };

  // Wyświetlany tekst – jeśli cokolwiek zaznaczono, łączymy etykiety; w przeciwnym razie placeholder
  const displayText = () => {
    if (multiSelect) {
      if (Array.isArray(selectedValue) && selectedValue.length > 0) {
        const selectedOptions = options.filter((opt) =>
          selectedValue.includes(opt.value)
        );
        return selectedOptions.map((opt) => opt.label).join(', ');
      }
      return placeholder;
    } else {
      const selectedOption = options.find((opt) => opt.value === selectedValue);
      return selectedOption ? selectedOption.label : placeholder;
    }
  };

  return (
    <div className={styles.dropdownContainer}>
      <button onClick={handleToggle} className={styles.dropdownButton}>
        {displayText()}
        <span className={isOpen ? styles.arrowUp : styles.arrowDown}>▼</span>
      </button>
      {/* Jeśli funkcja onReset została przekazana, wyświetlamy przycisk "X" */}
      {onReset && (
        <button className={styles.resetButton} onClick={onReset}>
          X
        </button>
      )}
      {isOpen && (
        <ul className={styles.dropdownList}>
          {options.map((opt) => (
            <li
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={styles.dropdownItem}
            >
              {multiSelect && (
                <input
                  type="checkbox"
                  readOnly
                  checked={
                    Array.isArray(selectedValue)
                      ? selectedValue.includes(opt.value)
                      : false
                  }
                />
              )}
              <span>{opt.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CustomDropdown;
