
import { CreditCard } from "lucide-react";

interface PassDetectionBannerProps {
  detectedPass: any | null;
  passTypeMismatch: boolean;
}

const PassDetectionBanner = ({ detectedPass, passTypeMismatch }: PassDetectionBannerProps) => {
  if (!detectedPass && !passTypeMismatch) return null;

  return (
    <div className={`mb-6 p-4 rounded-lg border ${passTypeMismatch ? "bg-red-50 border-red-200" : "bg-purple-50 border-purple-200"}`}>
      <div className={`flex items-center gap-2 mb-2 ${passTypeMismatch ? "text-red-700" : "text-purple-700"}`}>
        <CreditCard className="h-5 w-5" />
        <span className="font-semibold">
          {passTypeMismatch ? "Pass Type Mismatch!" : "Monthly Pass Detected!"}
        </span>
      </div>
      <div className="space-y-1 text-sm">
        {detectedPass && (
          <>
            <p><strong>Owner:</strong> {detectedPass.ownerName}</p>
            <p><strong>Pass Type:</strong> {detectedPass.passType?.toUpperCase?.()}</p>
            <p><strong>Valid Until:</strong> {detectedPass.endDate ? new Date(detectedPass.endDate).toLocaleDateString() : ""}</p>
          </>
        )}
        {passTypeMismatch ? (
          <p className="text-red-600 font-medium">
            Vehicle type does not match the active pass category. Please select: <b>{detectedPass?.passType?.toUpperCase?.() ?? "the correct type"}</b>
          </p>
        ) : detectedPass ? (
          <p className="text-green-600 font-medium">✓ Free parking for pass holders</p>
        ) : null}
      </div>
    </div>
  );
};

export default PassDetectionBanner;
