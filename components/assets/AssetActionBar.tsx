import Link from "next/link";
import { Button } from "@/components/ui/button";

type AssetActionBarProps = {
  assetId: string;
  isAvailable: boolean;
  isCheckedOut: boolean;
  checkingIn: boolean;
  onShowCheckoutForm: () => void;
  onCheckIn: () => void;
  onPrintQRCode: () => void;
};

export default function AssetActionBar({
  assetId,
  isAvailable,
  isCheckedOut,
  checkingIn,
  onShowCheckoutForm,
  onCheckIn,
  onPrintQRCode,
}: AssetActionBarProps) {
  return (
    <div className="mt-8 flex flex-wrap gap-4">
      <Link href={`/assets/${assetId}/edit`}>
        <Button>Edit Asset</Button>
      </Link>

      <Link href={`/assets/${assetId}/maintenance`}>
        <Button>Maintenance</Button>
      </Link>

      {isAvailable && (
        <Button onClick={onShowCheckoutForm}>
          Check Out Asset
        </Button>
      )}

      {isCheckedOut && (
        <Button
          onClick={onCheckIn}
          disabled={checkingIn}
        >
          {checkingIn ? "Checking In..." : "Check In Asset"}
        </Button>
      )}

      <Button onClick={onPrintQRCode}>
        Print QR Code
      </Button>
    </div>
  );
}