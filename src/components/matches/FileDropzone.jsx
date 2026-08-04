import React, { useState } from "react";
import { FileVideo, UploadCloud } from "lucide-react";

export default function FileDropzone({ file, onFile, error }) {
  const [over, setOver] = useState(false);

  const selectFile = (candidate) => {
    if (candidate) onFile(candidate);
  };

  return (
    <div className="space-y-2">
      <label
        onDragOver={(event) => { event.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setOver(false);
          selectFile(event.dataTransfer.files?.[0]);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed p-8 text-center transition-colors ${
          error
            ? "border-red-400/70 bg-red-400/5"
            : over
              ? "border-emerald-400 bg-emerald-400/10"
              : "border-border/60 hover:border-emerald-400/50"
        }`}
      >
        <input
          type="file"
          accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
          className="hidden"
          onChange={(event) => selectFile(event.target.files?.[0])}
        />
        {file ? (
          <>
            <FileVideo className="h-6 w-6 text-emerald-300" />
            <p className="max-w-full truncate text-sm">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {(file.size / 1024 / 1024).toFixed(1)} MB · click to replace
            </p>
          </>
        ) : (
          <>
            <UploadCloud className="h-6 w-6 text-emerald-300" />
            <p className="text-sm">Drop match footage here</p>
            <p className="text-xs text-muted-foreground">MP4 / MOV / WebM · up to 500 MB · full matches: use the YouTube link tab</p>
          </>
        )}
      </label>
      {error && <p className="text-xs leading-relaxed text-red-300">{error}</p>}
    </div>
  );
}