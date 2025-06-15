
import { Label } from "@/components/ui/label";

interface HelmetSelectorProps {
  helmet: boolean;
  setHelmet: (h: boolean) => void;
  vehicleType: 'cycle' | 'two-wheeler' | 'three-wheeler' | 'four-wheeler';
}

const HelmetSelector = ({ helmet, setHelmet, vehicleType }: HelmetSelectorProps) => (
  <div
    role="button"
    tabIndex={0}
    onClick={() =>
      (vehicleType === 'cycle' || vehicleType === 'two-wheeler')
        ? setHelmet(!helmet)
        : null
    }
    className={`
      flex flex-col items-center justify-center p-4 border rounded-lg transition-all duration-200 gap-2
      w-36 h-40
      ${helmet ? 'border-blue-600 bg-blue-50 shadow' : 'hover:bg-gray-50'}
      ${vehicleType === 'cycle' || vehicleType === 'two-wheeler'
        ? 'cursor-pointer opacity-100'
        : 'cursor-not-allowed opacity-40'}
    `}
    style={{ minWidth: '144px', maxWidth: '144px', minHeight: '160px', maxHeight: '160px' }}
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M20 21v-2a4 4 0 0 0-4-4h-4a4 4 0 0 0-4 4v2M12 3a6 6 0 0 1 6 6c0 3.314-5.373 6-6 6s-6-2.686-6-6a6 6 0 0 1 6-6z" />
    </svg>
    <Label className="font-medium">Helmet</Label>
    <p className="text-xs text-gray-500 text-center break-words">
      Add helmet for ₹2/day
    </p>
    <div className="mt-2">
      <input
        type="checkbox"
        checked={helmet}
        disabled={!(vehicleType === 'cycle' || vehicleType === 'two-wheeler')}
        readOnly
        className="accent-blue-600 h-5 w-5 outline-none"
        tabIndex={-1}
      />
    </div>
  </div>
);

export default HelmetSelector;
