import {
  defaultAdvanced,
  defaultOptions,
  references,
  styles,
  counts,
  ratios,
  models,
  samplingSteps,
} from "../../../lib/generationConfig";
import { imagePromptCards, videoPromptCards } from "../../../lib/promptPresets";
import { respond } from "../../../lib/server/http";

export function GET() {
  return respond(() => ({
    defaultAdvanced,
    references,
    styles,
    counts,
    ratios,
    models,
    samplingSteps,
    defaultOptions,
    promptCards: { image: imagePromptCards, video: videoPromptCards },
    pollingInterval: 300,
  }));
}
