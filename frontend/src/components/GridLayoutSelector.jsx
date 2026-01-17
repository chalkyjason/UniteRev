import { Grid3x3, Grid2x2, LayoutGrid } from 'lucide-react';
import './GridLayoutSelector.css';

const LAYOUT_OPTIONS = [
  { value: '1x1', label: '1×1', icon: '⬜' },
  { value: '1x2', label: '1×2', icon: '▭' },
  { value: '2x1', label: '2×1', icon: '▯' },
  { value: '2x2', label: '2×2', icon: '▦' },
  { value: '2x3', label: '2×3', icon: '⊞' },
  { value: '3x2', label: '3×2', icon: '⊟' },
  { value: '3x3', label: '3×3', icon: '▩' },
  { value: '4x2', label: '4×2', icon: '⊠' },
  { value: '2x4', label: '2×4', icon: '⊡' },
  { value: '4x4', label: '4×4', icon: '⊞' }
];

const GridLayoutSelector = ({ currentLayout, onLayoutChange }) => {
  return (
    <div className="grid-layout-selector">
      <div className="layout-label">
        <LayoutGrid size={18} />
        <span>Grid Layout:</span>
      </div>

      <div className="layout-options">
        {LAYOUT_OPTIONS.map((option) => {
          const [rows, cols] = option.value.split('x').map(Number);
          const totalSlots = rows * cols;

          return (
            <button
              key={option.value}
              className={`layout-option ${currentLayout === option.value ? 'active' : ''}`}
              onClick={() => onLayoutChange(option.value)}
              title={`${option.label} grid (${totalSlots} streams)`}
            >
              <div className="layout-preview">
                <div
                  className="layout-grid-preview"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    gridTemplateRows: `repeat(${rows}, 1fr)`,
                    gap: '1px'
                  }}
                >
                  {Array.from({ length: totalSlots }).map((_, i) => (
                    <div key={i} className="grid-cell-preview"></div>
                  ))}
                </div>
              </div>
              <span className="layout-label-text">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default GridLayoutSelector;
