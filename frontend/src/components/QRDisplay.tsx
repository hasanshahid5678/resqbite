export default function QRDisplay({ dataUrl, caption }: { dataUrl: string; caption?: string }) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <img src={dataUrl} alt="Reservation QR code" className="h-48 w-48 rounded-xl ring-1 ring-gray-100" />
      {caption && <p className="text-xs text-gray-500">{caption}</p>}
    </div>
  );
}