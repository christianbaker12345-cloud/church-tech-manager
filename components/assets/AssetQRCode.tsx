import { QRCodeSVG } from "qrcode.react";

type AssetQRCodeProps = {
  qrUrl: string;
};

export default function AssetQRCode({ qrUrl }: AssetQRCodeProps) {
  return (
    <div className="rounded-2xl bg-white p-8 text-center shadow">
      <h2 className="text-2xl font-bold">Asset QR Code</h2>

      <div className="mt-6 flex justify-center">
        <QRCodeSVG value={qrUrl} size={220} includeMargin />
      </div>

      <p className="mt-6 break-all text-sm text-gray-500">
        {qrUrl}
      </p>

      <p className="mt-4 text-sm text-gray-400">
        Scan this code to open this individual asset.
      </p>
    </div>
  );
}