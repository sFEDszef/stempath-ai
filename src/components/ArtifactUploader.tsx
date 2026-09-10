import { ImagePlus, X, ImageIcon } from "lucide-react";
import type { Artifact } from "@/types";
export function ArtifactUploader({
  artifacts,
  onUpload,
  onRemove,
}: {
  artifacts: Artifact[];
  onUpload: () => void;
  onRemove: (id: string) => void;
}) {
  return (
    <section className="rail-section artifacts" id="artifacts">
      <h2>Your Artifacts</h2>
      <button className="upload-zone" onClick={onUpload}>
        <ImagePlus size={25} />
        <strong>Upload image</strong>
        <span>
          Upload your design sketch,
          <br />
          experiment process or prototype.
        </span>
        <small>PNG, JPG or WebP · Up to 5 MB</small>
      </button>
      {artifacts.length > 0 && (
        <div className="artifact-list">
          {artifacts.map((item) => (
            <div className="artifact-item" key={item.id}>
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                aria-label={`View ${item.name}`}
              >
                <img src={item.url} alt={item.name} />
                <span>
                  <ImageIcon size={12} />
                  {item.name}
                </span>
              </a>
              <button
                onClick={() => onRemove(item.id)}
                aria-label={`Remove ${item.name}`}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      <p className="local-note">Images stay in this browser session.</p>
    </section>
  );
}
