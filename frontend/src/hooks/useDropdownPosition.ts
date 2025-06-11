import { useEffect, useRef, useState } from 'react';

interface DropdownPosition {
  openUpward: boolean;
  openLeftward: boolean;
}

export const useDropdownPosition = (isOpen: boolean): [React.RefObject<HTMLDivElement>, DropdownPosition] => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<DropdownPosition>({
    openUpward: false,
    openLeftward: false
  });

  useEffect(() => {
    if (!isOpen || !dropdownRef.current) return;

    const dropdown = dropdownRef.current;
    const rect = dropdown.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Check if dropdown would be cut off at the bottom
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const dropdownHeight = dropdown.offsetHeight;

    // Check if dropdown would be cut off on the right
    const spaceRight = viewportWidth - rect.right;
    const spaceLeft = rect.left;
    const dropdownWidth = dropdown.offsetWidth;

    setPosition({
      openUpward: spaceBelow < dropdownHeight && spaceAbove > spaceBelow,
      openLeftward: spaceRight < dropdownWidth && spaceLeft > spaceRight
    });
  }, [isOpen]);

  return [dropdownRef, position];
};

export default useDropdownPosition;