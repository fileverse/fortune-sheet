import React from "react";
import { sanitizeDuneUrl } from "@fileverse-dev/fortune-core";
import "./index.css";
import { Button } from "@fileverse/ui";

interface DunePreviewProps {
  url: string;
  position: {
    left: number;
    top: number;
  };
  onKeepAsLink: () => void;
  onEmbed: () => void;
}

const DunePreview: React.FC<DunePreviewProps> = ({
  url,
  position,
  onKeepAsLink,
  onEmbed,
}) => {
  const embedUrl = sanitizeDuneUrl(url);
  if (!embedUrl) return null;

  return (
    <div
      className="fortune-dune-preview"
      style={{
        left: position.left,
        top: position.top,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="fortune-dune-preview-header">
        <span className="fortune-dune-preview-title">
          Detected Dune chart link
        </span>
      </div>
      <div className="fortune-dune-preview-content">
        <iframe
          src={embedUrl}
          title="Dune Chart Preview"
          style={{
            width: "100%",
            height: "100%",
            border: "none",
          }}
        />
      </div>
      <p>Do you want to insert Dune chart?</p>
      <div className="fortune-dune-preview-footer">
        <Button variant="ghost" onClick={onKeepAsLink} className="!w-fit px-0">
          Keep as Link
        </Button>
        <Button onClick={onEmbed} className="!w-fit px-0">
          Embed
        </Button>
      </div>
    </div>
  );
};

export default DunePreview;
