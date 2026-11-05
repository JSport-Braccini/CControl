import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QrCodeImageProps {
  value: string;
  size?: number;
  label?: string;
  showDownload?: boolean;
}

export const QrCodeImage: React.FC<QrCodeImageProps> = ({
  value,
  size = 128,
  label,
  showDownload = false,
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(value, {
      width: size * 2,
      margin: 1,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        if (active) setDataUrl(url);
      })
      .catch(() => {
        if (active) setDataUrl('');
      });
    return () => {
      active = false;
    };
  }, [value, size]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `QR-${value}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="inline-flex flex-col items-center gap-1.5">
      <div
        className="bg-white border border-slate-200 rounded-lg p-1.5 flex items-center justify-center shrink-0"
        style={{ width: size, height: size }}
      >
        {dataUrl ? (
          <img
            src={dataUrl}
            alt={label ? `Código QR ${label}` : `Código QR ${value}`}
            className="w-full h-full object-contain"
          />
        ) : (
          <span className="text-[11px] font-mono-tabular text-slate-400">{value}</span>
        )}
      </div>
      <span className="text-[11px] font-mono-tabular text-slate-600 tracking-tight">
        {value}
      </span>
      {showDownload && dataUrl && (
        <button
          type="button"
          onClick={handleDownload}
          className="text-xs font-medium text-emerald-700 hover:text-emerald-800 underline underline-offset-2 whitespace-nowrap shrink-0 cursor-pointer"
        >
          Descargar PNG
        </button>
      )}
    </div>
  );
};
