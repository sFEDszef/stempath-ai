import {useI18n} from '@/lib/i18n';
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
 const {t}=useI18n();

  return (
    <section className="rail-section artifacts" id="artifacts">
      <h2>{t("Your Artifacts")}</h2>
      <button className="upload-zone" onClick={onUpload}>
        <ImagePlus size={25} />
        <strong>{t("Upload image")}</strong>
        <span>{t("Upload your sketch, setup,")}<br />{t("observations or results.")}</span>
        <small>{t("PNG, JPG or WebP · Up to 5 MB")}</small>
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
      <p className="local-note">{t("Images stay in this browser session.")}</p>
    </section>
  );
}
