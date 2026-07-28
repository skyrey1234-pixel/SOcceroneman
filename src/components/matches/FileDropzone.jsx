import React, { useState } from "react";
import { UploadCloud, FileVideo } from "lucide-react";

export default function FileDropzone({ file, onFile }) {
  const [over, setOver] = useState(false);
  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed p-8 text-center transition-colors ${
        over ? "border-emerald-400 bg-emerald-400/10" : "border-border/60 hover:border-emerald-400/50"
      }`}
    >
      <input
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] || null)}
      />
      {file ? (
        <>
          <FileVideo className="h-6 w-6 text-emerald-300" />
          <p className="text-sm">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {(file.size / 1024 / 1024).toFixed(1)} MB · click to replace
          </p>
        </>
      ) : (
        <>
          <UploadCloud className="h-6 w-6 text-emerald-300" />
          <p className="text-sm">Drop match footage here</p>
          <p className="text-xs text-muted-foreground">MP4 / MOV / WebM — or click to browse</p>
        </>
      )}
    </label>
  );
}